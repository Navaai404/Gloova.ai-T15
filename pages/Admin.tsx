import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, Users, DollarSign, Activity, Search, ShieldCheck, Send, Filter, Megaphone, Mail, Smartphone, Settings, Database, Link, Save, ShoppingCart, RefreshCw, Phone, CheckCircle, XCircle } from 'lucide-react';
import { UserProfile } from '../types';
import { PLANS } from '../services/monetization';
import { Button } from '../components/Button';
import { n8nService } from '../services/n8nService';
import { supabase } from '../lib/supabase';
import { createClient } from '@supabase/supabase-js'; // Import direto para criar cliente de teste

// --- LISTA DE ADMINS ---
const ADMIN_EMAILS = [
  'admin@gloova.ai', 
  'jardel100dias@hotmail.com'
]; 

type AdminTab = 'users' | 'marketing' | 'settings';

export const Admin: React.FC = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<AdminTab>('users');
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [stats, setStats] = useState({ revenue: 0, totalUsers: 0, activeSubs: 0 });
  const [isAdmin, setIsAdmin] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [connectionStatus, setConnectionStatus] = useState<'checking' | 'connected' | 'error'>('checking');

  // Estados dos Formulários
  const [messageTarget, setMessageTarget] = useState('basic');
  const [messageTitle, setMessageTitle] = useState('');
  const [messageBody, setMessageBody] = useState('');
  const [channels, setChannels] = useState({ email: true, push: true });
  const [isSending, setIsSending] = useState(false);

  // Configs
  const [configN8N, setConfigN8N] = useState('');
  const [configSupaUrl, setConfigSupaUrl] = useState('');
  const [configSupaKey, setConfigSupaKey] = useState('');
  const [linkBasic, setLinkBasic] = useState('');
  const [linkAdvanced, setLinkAdvanced] = useState('');
  const [linkPremium, setLinkPremium] = useState('');
  const [linkCredits, setLinkCredits] = useState('');

  useEffect(() => {
    const checkAdmin = async () => {
        const userStr = localStorage.getItem('gloova_user');
        if (!userStr) {
            navigate('/');
            return;
        }
        const user = JSON.parse(userStr);
        
        // Verificação segura (Case Insensitive)
        const userEmail = (user.email || '').toLowerCase().trim();
        const isAuthorized = ADMIN_EMAILS.some(admin => admin.toLowerCase().trim() === userEmail);

        if (!isAuthorized) {
            alert(`Acesso Negado para ${userEmail}. Você não tem permissão.`);
            navigate('/home');
            return;
        }
        
        setIsAdmin(true);
        loadConfigs();
        await loadDataReal(); 
        setIsLoading(false);
    };

    checkAdmin();
  }, [navigate]);

  const loadConfigs = () => {
      setConfigN8N(localStorage.getItem('gloova_config_n8n_url') || '');
      setConfigSupaUrl(localStorage.getItem('gloova_config_supabase_url') || '');
      setConfigSupaKey(localStorage.getItem('gloova_config_supabase_key') || '');
      setLinkBasic(localStorage.getItem('gloova_link_basic') || '');
      setLinkAdvanced(localStorage.getItem('gloova_link_advanced') || '');
      setLinkPremium(localStorage.getItem('gloova_link_premium') || '');
      setLinkCredits(localStorage.getItem('gloova_link_credits') || '');
  };

  const loadDataReal = async () => {
    try {
        const { data: profiles, error } = await supabase
            .from('profiles')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) throw error;

        if (profiles) {
            setUsers(profiles);
            setConnectionStatus('connected');
            
            const revenue = profiles.reduce((acc, u) => acc + (PLANS[u.subscription_tier || 'basic']?.price || 0), 0);
            setStats({
                revenue, 
                totalUsers: profiles.length, 
                activeSubs: profiles.filter(u => u.subscription_tier !== 'free').length
            });
        }
    } catch (e) {
        console.warn("Aviso: Falha ao conectar no banco.", e);
        setConnectionStatus('error');
        setUsers([]); 
    }
  };

  const handleSaveSettings = async () => {
    // 1. Limpa espaços em branco
    const cleanN8N = configN8N.trim();
    const cleanSupaUrl = configSupaUrl.trim();
    const cleanSupaKey = configSupaKey.trim();

    // 2. TESTE DE CONEXÃO REAL (CRÍTICO)
    // Cria um cliente temporário para testar ANTES de salvar
    try {
        if (cleanSupaUrl && cleanSupaKey) {
            const testClient = createClient(cleanSupaUrl, cleanSupaKey);
            // Tenta ler 1 linha da tabela profiles para ver se conecta
            const { error } = await testClient.from('profiles').select('id').limit(1);
            
            if (error) {
                // Se der erro (ex: permissão negada, chave errada), lança exceção
                throw new Error(`Erro do Supabase: ${error.message}`);
            }
        }
    } catch (e: any) {
        // Se falhar, avisa e NÃO salva (ou pergunta se quer salvar mesmo)
        const forceSave = window.confirm(`❌ FALHA NA CONEXÃO!\n\nErro: ${e.message}\n\nAs chaves parecem inválidas. Deseja salvar mesmo assim? (O app pode parar de funcionar)`);
        if (!forceSave) return;
    }

    // 3. Salva no LocalStorage se passou no teste ou forçou
    if (cleanN8N) localStorage.setItem('gloova_config_n8n_url', cleanN8N);
    if (cleanSupaUrl) localStorage.setItem('gloova_config_supabase_url', cleanSupaUrl);
    if (cleanSupaKey) localStorage.setItem('gloova_config_supabase_key', cleanSupaKey);
    
    localStorage.setItem('gloova_link_basic', linkBasic.trim());
    localStorage.setItem('gloova_link_advanced', linkAdvanced.trim());
    localStorage.setItem('gloova_link_premium', linkPremium.trim());
    localStorage.setItem('gloova_link_credits', linkCredits.trim());
    
    // 4. Reload
    alert("✅ Configurações Salvas e Testadas! O aplicativo será recarregado.");
    window.location.reload();
  };

  // ... (Resto das funções mantidas)
  const handleResetSettings = () => {
    if (window.confirm("Tem certeza? Isso apagará todas as configurações.")) {
        localStorage.removeItem('gloova_config_n8n_url');
        localStorage.removeItem('gloova_config_supabase_url');
        localStorage.removeItem('gloova_config_supabase_key');
        localStorage.removeItem('gloova_link_basic');
        localStorage.removeItem('gloova_link_advanced');
        localStorage.removeItem('gloova_link_premium');
        localStorage.removeItem('gloova_link_credits');
        window.location.reload();
    }
  };

  const handleSendMessage = async () => {
    if (!messageTitle || !messageBody) { alert("Preencha o título e a mensagem."); return; }
    setIsSending(true);
    await n8nService.sendMarketingCampaign({ admin_id: 'current', target_segment: messageTarget, title: messageTitle, message: messageBody, channels: channels });
    setIsSending(false);
    alert(`📢 Campanha Disparada!`); 
  };

  const addCredits = async (userId: string, type: 'chat' | 'scan' | 'diagnosis', amount: number) => {
      try {
        const user = users.find(u => u.id === userId);
        if (!user) return;
        const field = `${type}_credits`;
        const newValue = (user as any)[field] + amount;
        const { error } = await supabase.from('profiles').update({ [field]: newValue }).eq('id', userId);
        if (error) throw error;
        const updatedList = users.map(u => u.id === userId ? { ...u, [field]: newValue } : u);
        setUsers(updatedList);
        alert(`+${amount} ${type} adicionados!`);
      } catch (e) {
          alert("Erro ao adicionar créditos no banco.");
      }
  };

  const handleWhatsApp = (phone: string) => {
      if (!phone) return;
      const cleanPhone = phone.replace(/\D/g, '');
      const url = `https://wa.me/55${cleanPhone}`;
      window.open(url, '_blank');
  };

  if (isLoading) return <div className="p-10 text-center text-slate-500">Carregando painel...</div>;

  return (
    <div className="min-h-screen bg-slate-50 pb-20 animate-fade-in">
      <div className="bg-slate-900 text-white p-6 pb-8 rounded-b-[32px] sticky top-0 z-20 shadow-lg">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <button onClick={() => navigate('/profile')} className="p-2 -ml-2 rounded-full hover:bg-white/10 transition-colors"><ChevronLeft /></button>
            <h1 className="text-xl font-bold flex items-center gap-2"><ShieldCheck className="text-blue-400" /> Painel Admin</h1>
          </div>
          <div className="flex items-center gap-2 bg-white/10 px-3 py-1 rounded-full border border-white/10">
              <div className={`w-2 h-2 rounded-full ${connectionStatus === 'connected' ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`}></div>
              <span className="text-[10px] font-bold uppercase text-slate-300">{connectionStatus === 'connected' ? 'Online' : 'Offline'}</span>
          </div>
        </div>
        <div className="flex bg-white/10 p-1 rounded-xl backdrop-blur-md overflow-x-auto">
            <button onClick={() => setActiveTab('users')} className={`flex-1 py-3 px-2 rounded-lg text-sm font-bold flex items-center justify-center gap-2 transition-all whitespace-nowrap ${activeTab === 'users' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-400 hover:text-white'}`}><Users size={18} /> <span>Usuários</span></button>
            <button onClick={() => setActiveTab('marketing')} className={`flex-1 py-3 px-2 rounded-lg text-sm font-bold flex items-center justify-center gap-2 transition-all whitespace-nowrap ${activeTab === 'marketing' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-400 hover:text-white'}`}><Megaphone size={18} /> <span>CRM</span></button>
            <button onClick={() => setActiveTab('settings')} className={`flex-1 py-3 px-2 rounded-lg text-sm font-bold flex items-center justify-center gap-2 transition-all whitespace-nowrap ${activeTab === 'settings' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-400 hover:text-white'}`}><Settings size={18} /> <span>Configs</span></button>
        </div>
      </div>

      <div className="p-6 space-y-6">
        {activeTab === 'users' && (
            <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100 animate-fade-in">
                <h3 className="font-bold text-slate-900 mb-4 flex items-center gap-2"><Users size={18} className="text-blue-500" /> Base de Clientes ({users.length})</h3>
                {users.length === 0 && <p className="text-center text-sm text-slate-400 py-4">Nenhum usuário encontrado ou erro de conexão.</p>}
                <div className="space-y-3">
                    {users.map(u => (
                        <div key={u.id} className="p-4 border border-slate-100 rounded-2xl hover:border-blue-200 transition-colors">
                            <div className="flex justify-between items-start mb-3">
                                <div><p className="font-bold text-slate-900 text-sm">{u.name || 'Sem Nome'}</p><p className="text-xs text-slate-400">{u.email}</p></div>
                                <div className="flex flex-col items-end gap-1">
                                    <span className={`text-[10px] font-bold px-2 py-1 rounded ${u.subscription_tier === 'free' ? 'bg-slate-100 text-slate-500' : 'bg-green-100 text-green-700'}`}>{u.subscription_tier?.toUpperCase()}</span>
                                    {u.whatsapp && (<button onClick={() => handleWhatsApp(u.whatsapp!)} className="flex items-center gap-1 text-[10px] font-bold text-green-600 bg-green-50 px-2 py-1 rounded hover:bg-green-100 transition-colors"><Phone size={10} /> WhatsApp</button>)}
                                </div>
                            </div>
                            <div className="grid grid-cols-3 gap-2 border-t border-slate-50 pt-3">
                                <button onClick={() => addCredits(u.id, 'chat', 50)} className="text-[10px] font-bold bg-blue-50 text-blue-600 py-2 rounded-lg hover:bg-blue-100">+Tokens ({u.chat_credits})</button>
                                <button onClick={() => addCredits(u.id, 'scan', 5)} className="text-[10px] font-bold bg-purple-50 text-purple-600 py-2 rounded-lg hover:bg-purple-100">+Scans ({u.scan_credits})</button>
                                <button onClick={() => addCredits(u.id, 'diagnosis', 1)} className="text-[10px] font-bold bg-green-50 text-green-600 py-2 rounded-lg hover:bg-green-100">+Diag ({u.diagnosis_credits})</button>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        )}

        {activeTab === 'marketing' && (
            <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100 animate-fade-in">
                <h2 className="font-bold text-slate-900 text-lg mb-4">Disparo de Mensagens</h2>
                <div className="space-y-4">
                    <select className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-3 pr-4 py-3 text-sm font-bold text-slate-700 outline-none" value={messageTarget} onChange={e => setMessageTarget(e.target.value)}>
                        <option value="basic">Usuários Plano Básico (Upsell)</option>
                        <option value="all">Toda a Base (Aviso Geral)</option>
                        <option value="active">Apenas Pagantes (Novidades)</option>
                    </select>
                    <input type="text" placeholder="Título..." className="w-full bg-slate-50 border-slate-200 border rounded-xl p-3 text-sm font-bold mb-2" value={messageTitle} onChange={e => setMessageTitle(e.target.value)} />
                    <textarea rows={4} placeholder="Conteúdo..." className="w-full bg-slate-50 border-slate-200 border rounded-xl p-3 text-sm resize-none" value={messageBody} onChange={e => setMessageBody(e.target.value)} />
                    <Button onClick={handleSendMessage} isLoading={isSending}>Enviar Campanha Agora</Button>
                </div>
            </div>
        )}

        {activeTab === 'settings' && (
            <div className="space-y-6 animate-fade-in">
                <div className="bg-green-50 p-6 rounded-3xl border border-green-200 shadow-sm">
                    <h3 className="font-bold text-green-800 mb-4 flex items-center gap-2"><ShoppingCart size={18} /> Checkout Externo</h3>
                    <div className="space-y-3">
                        <input type="text" placeholder="Link Plano Básico..." className="w-full bg-white p-3 rounded-xl text-xs border border-green-200" value={linkBasic} onChange={e => setLinkBasic(e.target.value)} />
                        <input type="text" placeholder="Link Plano Avançado..." className="w-full bg-white p-3 rounded-xl text-xs border border-green-200" value={linkAdvanced} onChange={e => setLinkAdvanced(e.target.value)} />
                        <input type="text" placeholder="Link Plano Premium..." className="w-full bg-white p-3 rounded-xl text-xs border border-green-200" value={linkPremium} onChange={e => setLinkPremium(e.target.value)} />
                        <input type="text" placeholder="Link Pacote Créditos..." className="w-full bg-white p-3 rounded-xl text-xs border border-green-200" value={linkCredits} onChange={e => setLinkCredits(e.target.value)} />
                    </div>
                </div>
                <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
                    <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2"><Link size={18} className="text-blue-600" /> Conexões API</h3>
                    <div className="space-y-4">
                        <input type="text" placeholder="N8N Webhook URL..." className="w-full bg-slate-50 border-slate-200 border rounded-xl px-3 py-2 text-xs font-mono" value={configN8N} onChange={e => setConfigN8N(e.target.value)} />
                        <div className="grid grid-cols-1 gap-3 pt-2 border-t border-slate-100">
                            <input type="text" placeholder="Supabase URL..." className="w-full bg-slate-50 border-slate-200 border rounded-xl px-3 py-2 text-xs font-mono" value={configSupaUrl} onChange={e => setConfigSupaUrl(e.target.value)} />
                            <input type="password" placeholder="Supabase Key..." className="w-full bg-slate-50 border-slate-200 border rounded-xl px-3 py-2 text-xs font-mono" value={configSupaKey} onChange={e => setConfigSupaKey(e.target.value)} />
                        </div>
                    </div>
                    <div className="mt-6 pt-4 border-t border-slate-100">
                        <button onClick={handleResetSettings} className="px-4 py-3 bg-red-50 text-red-500 rounded-xl font-bold text-xs flex items-center gap-2 hover:bg-red-100 transition-colors"><RefreshCw size={14} /> Reset</button>
                        <Button onClick={handleSaveSettings} className="flex-1 h-auto py-3 text-xs shadow-lg shadow-blue-500/20"><Save size={16} /> Salvar & Testar Conexão</Button>
                    </div>
                </div>
            </div>
        )}
      </div>
    </div>
  );
};