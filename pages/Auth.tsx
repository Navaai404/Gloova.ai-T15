import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../components/Button';
import { GloovaLogo } from '../components/Logo';
import { supabase, isMockMode } from '../lib/supabase';
import { PLANS } from '../services/monetization';
import { Mail, AlertTriangle, User, Tag, Phone } from 'lucide-react';

export const Auth: React.FC = () => {
  const navigate = useNavigate();
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [whatsapp, setWhatsapp] = useState(''); // Novo estado para WhatsApp
  const [inviteCode, setInviteCode] = useState('');
  
  const [isLoading, setIsLoading] = useState(false);
  const [showConfirmationMessage, setShowConfirmationMessage] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleMockLogin = () => {
    console.log("⚠️ Usando Login Simulado");
    const mockUser = {
        id: 'demo_user_123',
        email: email || 'demo@gloova.ai',
        name: name || 'Usuário Demo',
        subscription_tier: 'basic',
        chat_credits: PLANS.basic.limits.tokens,
        diagnosis_credits: PLANS.basic.limits.diagnosis,
        scan_credits: PLANS.basic.limits.scans,
        points: 0,
        referral_code: 'DEMO123',
        isAdmin: email === 'admin@gloova.ai' || email === 'jardel100dias@hotmail.com'
    };
    localStorage.setItem('gloova_user', JSON.stringify(mockUser));
    navigate(isLogin ? '/home' : '/onboarding');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setShowConfirmationMessage(false);
    setErrorMessage(null);

    if (isMockMode()) {
        setTimeout(() => { handleMockLogin(); setIsLoading(false); }, 1000);
        return;
    }

    try {
      if (isLogin) {
        // --- LOGIN ---
        const { data, error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;

        if (data.user) {
            const { data: profile } = await supabase.from('profiles').select('*').eq('id', data.user.id).single();
            
            if (profile) {
                localStorage.setItem('gloova_user', JSON.stringify(profile));
            } else {
                // Auto-healing: Cria perfil se o usuário existir na Auth mas não na tabela profiles
                const newProfile = {
                    id: data.user.id,
                    email: data.user.email,
                    name: data.user.user_metadata.name || name || 'Usuário',
                    subscription_tier: 'free',
                    chat_credits: 0,
                    diagnosis_credits: 1,
                    scan_credits: 0,
                    referral_code: Math.random().toString(36).substring(2, 8).toUpperCase()
                };
                await supabase.from('profiles').insert(newProfile);
                localStorage.setItem('gloova_user', JSON.stringify(newProfile));
            }
            navigate('/home');
        }

      } else {
        // --- CADASTRO ---
        const { data, error } = await supabase.auth.signUp({ email, password, options: { data: { name } } });
        if (error) throw error;

        if (data.user) {
            // Atualiza perfil com dados extras (WhatsApp e Referral)
            // Pequeno delay para garantir que o trigger do banco rodou primeiro
            setTimeout(async () => {
                await supabase
                    .from('profiles')
                    .update({ 
                        whatsapp: whatsapp, 
                        referred_by: inviteCode ? inviteCode.toUpperCase() : null 
                    })
                    .eq('id', data.user!.id);
            }, 2000);

            if (!data.session) {
                 setShowConfirmationMessage(true);
                 setIsLogin(true); 
            } else {
                const tempUser = {
                    id: data.user.id,
                    email: data.user.email,
                    name: name,
                    subscription_tier: 'free',
                    chat_credits: 0,
                    diagnosis_credits: 1,
                    scan_credits: 0,
                    whatsapp: whatsapp,
                    referred_by: inviteCode.toUpperCase(),
                    referral_code: Math.random().toString(36).substring(2, 8).toUpperCase()
                };
                localStorage.setItem('gloova_user', JSON.stringify(tempUser));
                navigate('/onboarding');
            }
        }
      }
    } catch (error: any) {
      console.error("Auth Error:", error);
      if (error.message.includes("Invalid login credentials")) {
          setErrorMessage("E-mail ou senha incorretos. Se você acabou de configurar o banco, cadastre-se novamente.");
      }
      else if (error.message.includes("Email not confirmed")) setErrorMessage("E-mail não confirmado. Verifique sua caixa de entrada.");
      else if (error.message.includes("User already registered")) { setErrorMessage("Este e-mail já possui conta. Tente entrar."); setIsLogin(true); }
      else if (error.message.includes("Failed to fetch")) { const c = window.confirm("Falha na conexão. Entrar no Modo Demo?"); if (c) handleMockLogin(); }
      else setErrorMessage(`Erro: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white flex flex-col items-center justify-center p-6 animate-fade-in">
      <div className="w-full max-w-sm space-y-6 flex flex-col items-center">
        <div className="mb-4 scale-110"><GloovaLogo size="lg" /></div>
        <p className="text-slate-500 font-medium text-center mb-4">Sua inteligência capilar personalizada</p>

        {errorMessage && (
            <div className="bg-red-50 border border-red-200 text-red-600 p-4 rounded-xl w-full flex items-start gap-3 text-sm font-medium animate-pulse">
                <AlertTriangle size={18} className="shrink-0 mt-0.5" /><span>{errorMessage}</span>
            </div>
        )}

        {showConfirmationMessage ? (
            <div className="bg-green-50 border border-green-200 rounded-2xl p-6 w-full text-center animate-fade-in">
                <div className="w-12 h-12 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-3"><Mail size={24} /></div>
                <h3 className="font-bold text-green-800 text-lg mb-1">Verifique seu E-mail</h3>
                <p className="text-green-700 text-sm">Enviamos um link para <strong>{email}</strong>. Confirme para acessar.</p>
                <button onClick={() => setShowConfirmationMessage(false)} className="mt-4 text-sm font-bold text-green-700 underline">Voltar ao Login</button>
            </div>
        ) : (
            <>
            <div className="bg-slate-50 p-1.5 rounded-2xl flex w-full border border-slate-100">
                <button className={`flex-1 py-3 text-sm font-bold rounded-xl transition-all ${isLogin ? 'bg-white shadow text-blue-600' : 'text-slate-400'}`} onClick={() => { setIsLogin(true); setErrorMessage(null); }}>Entrar</button>
                <button className={`flex-1 py-3 text-sm font-bold rounded-xl transition-all ${!isLogin ? 'bg-white shadow text-blue-600' : 'text-slate-400'}`} onClick={() => { setIsLogin(false); setErrorMessage(null); }}>Cadastrar</button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-3 w-full">
                {!isLogin && (
                    <div>
                        <label className="text-xs font-bold text-slate-500 uppercase ml-1">Nome</label>
                        <input type="text" required value={name} onChange={e => setName(e.target.value)} className="w-full bg-slate-100 border-0 rounded-xl px-4 py-3 text-slate-800 font-medium outline-none focus:ring-2 focus:ring-blue-500" placeholder="Nome completo" />
                    </div>
                )}
                
                <div>
                    <label className="text-xs font-bold text-slate-500 uppercase ml-1">Email</label>
                    <input type="email" required value={email} onChange={e => setEmail(e.target.value)} className="w-full bg-slate-100 border-0 rounded-xl px-4 py-3 text-slate-800 font-medium outline-none focus:ring-2 focus:ring-blue-500" placeholder="seu@email.com" />
                </div>

                {/* CAMPO WHATSAPP */}
                {!isLogin && (
                    <div>
                        <label className="text-xs font-bold text-slate-500 uppercase ml-1 flex items-center gap-1"><Phone size={12} /> WhatsApp</label>
                        <input type="tel" required value={whatsapp} onChange={e => setWhatsapp(e.target.value)} className="w-full bg-slate-100 border-0 rounded-xl px-4 py-3 text-slate-800 font-medium outline-none focus:ring-2 focus:ring-blue-500" placeholder="(11) 99999-9999" />
                    </div>
                )}

                <div>
                    <label className="text-xs font-bold text-slate-500 uppercase ml-1">Senha</label>
                    <input type="password" required value={password} onChange={e => setPassword(e.target.value)} className="w-full bg-slate-100 border-0 rounded-xl px-4 py-3 text-slate-800 font-medium outline-none focus:ring-2 focus:ring-blue-500" placeholder="••••••••" />
                </div>

                {!isLogin && (
                    <div>
                        <label className="text-xs font-bold text-slate-500 uppercase ml-1 flex items-center gap-1"><Tag size={12} /> Código Convite (Opcional)</label>
                        <input type="text" value={inviteCode} onChange={e => setInviteCode(e.target.value)} className="w-full bg-slate-100 border-0 rounded-xl px-4 py-3 text-slate-800 font-medium outline-none focus:ring-2 focus:ring-blue-500 uppercase" placeholder="EX: MARI123" maxLength={10} />
                    </div>
                )}

                <div className="pt-4"><Button type="submit" isLoading={isLoading} className="shadow-xl shadow-blue-500/20">{isLogin ? 'Acessar App' : 'Criar Conta Grátis'}</Button></div>
            </form>
            
            <div className="w-full text-center mt-2"><button onClick={handleMockLogin} className="text-[10px] text-slate-300 hover:text-slate-500 underline decoration-dotted">Entrar como Convidado</button></div>
            <p className="text-center text-xs text-slate-400 mt-4">Ao continuar, você concorda com nossos Termos de Uso.</p>
            </>
        )}
      </div>
    </div>
  );
};