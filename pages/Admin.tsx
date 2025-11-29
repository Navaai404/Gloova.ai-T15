import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, Users, DollarSign, Activity, Search, ShieldCheck, Send, Filter, Megaphone, Mail, Smartphone, Settings, Database, Link, Save, ShoppingCart, RefreshCw, Phone } from 'lucide-react';
import { UserProfile } from '../types';
import { PLANS } from '../services/monetization';
import { Button } from '../components/Button';
import { n8nService } from '../services/n8nService';

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
    const checkAdmin = () => {
        const userStr = localStorage.getItem('gloova_user');
        if (!userStr) {
            navigate('/');
            return;
        }
        const user = JSON.parse(userStr);
        
        // Verificação segura (Case Insensitive e Trim)
        const userEmail = (user.email || '').toLowerCase().trim();
        const isAuthorized = ADMIN_EMAILS.some(admin => admin.toLowerCase().trim() === userEmail);

        if (!isAuthorized) {
            alert(`Acesso Negado para ${userEmail}. Você não tem permissão.`);
            navigate('/home');
            return;
        }
        
        setIsAdmin(true);
        loadData(user);
        loadConfigs();
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

  const loadData = (currentUser: UserProfile) => {
    // Mock Data para Dashboard (Em produção, buscaria do Supabase)
    const mockUsers: UserProfile[] = [
      { id: '1', name: 'Maria Silva', email: 'maria@gmail.com', subscription_tier: 'premium', points: 1200, chat_credits: 450, diagnosis_credits: 2, scan_credits: 10, whatsapp: '11999999999' },
      { id: '2', name: 'Joana Darc', email: 'joana@hotmail.com', subscription_tier: 'basic', points: 300, chat_credits: 10, diagnosis_credits: 0, scan_credits: 1 },
      { id: '3', name: 'Carlos Teste', email: 'carlos@teste.com', subscription_tier: 'advanced', points: 800, chat_credits: 80, diagnosis_credits: 1, scan_credits: 5, whatsapp: '11888888888' },
    ];
    if (!mockUsers.find(u => u.id === currentUser.id)) {
        mockUsers.unshift(currentUser);
    }
    
    setUsers(mockUsers);
    
    const revenue = mockUsers.reduce((acc, u) => acc + (PLANS[u.subscription_tier || 'basic']?.price || 0), 0);
    setStats({
        revenue, 
        totalUsers: mockUsers.length, 
        activeSubs: mockUsers.filter(u => u.subscription_tier !== 'free').length
    });
  };

  const handleSaveSettings = () => {
    if (configN8N) localStorage.setItem('gloova_config_n8n_url', configN8N);
    if (configSupaUrl) localStorage.setItem('gloova_config_supabase_url', configSupaUrl);
    if (configSupaKey) localStorage.setItem('gloova_config_supabase_key', configSupaKey);
    localStorage.setItem('gloova_link_basic', linkBasic);
    localStorage.setItem('gloova_link_advanced', linkAdvanced);
    localStorage.setItem('gloova_link_premium', linkPremium);
    localStorage.setItem('gloova_link_credits', linkCredits);
    
    alert("✅ Configurações Salvas! O app será recarregado para aplicar.");
    window.location.reload();
  };

  const handleResetSettings = () => {
    if (window.confirm("Tem certeza? Isso apagará todas as configurações salvas.")) {
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
    if (!messageTitle || !messageBody) { 
        alert("Preencha o título e a mensagem."); 
        return; 
    }
    
    setIsSending(true);
    const success = await n8nService.sendMarketingCampaign({
        admin_id: 'current_admin',
        target_segment: messageTarget,
        title: messageTitle,
        message: messageBody,
        channels: channels
    });
    setIsSending(false);

    if (success) { 
        alert(`📢 Campanha Disparada!`); 
        setMessageTitle(''); 
        setMessageBody(''); 
    }
  };

  const addCredits = (userId: string, type: 'chat' | 'scan' | 'diagnosis', amount: number) => {
      const updated = users.map(u => {
          if (u.id === userId) {
              const newCreds = (u as any)[`${type}_credits`] || 0;
              return { ...u, [`${type}_credits`]: newCreds + amount };
          }
          return u;
      });
      setUsers(updated);
      alert(`+${amount} ${type} adicionados para o usuário.`);
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
      {/* Header */}
      <div className="bg-slate-900 text-white p-6 pb-8 rounded-b-[32px] sticky top-0 z-20 shadow-lg">
        <div className="flex items-center gap-3 mb-6">
          <button onClick={() => navigate('/profile')} className="p-2 -ml-2 rounded-full hover:bg-white/10 transition-colors">
            <ChevronLeft />
          </button>
          <h1 className="text-xl font-bold flex items-center gap-2">
            <ShieldCheck className="text-blue-400" /> Painel Admin
          </h1>
        </div>

        {/* MENU DE ABAS (PRIORIDADE VISUAL) */}
        <div className="flex bg-white/10 p-1 rounded-xl backdrop-blur-md overflow-x-auto">
            <button 
                onClick={() => setActiveTab('users')} 
                className={`flex-1 py-3 px-2 rounded-lg text-sm font-bold flex items-center justify-center gap-2 transition-all whitespace-nowrap ${activeTab === 'users' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-400 hover:text-white'}`}
            >
                <Users size={18} /> <span>Usuários</span>
            </button>
            <button 
                onClick={() => setActiveTab('marketing')} 
                className={`flex-1 py-3 px-2 rounded-lg text-sm font-bold flex items-center justify-center gap-2 transition-all whitespace-nowrap ${activeTab === 'marketing' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-400 hover:text-white'}`}
            >
                <Megaphone size={18} /> <span>CRM</span>
            </button>
            <button 
                onClick={() => setActiveTab('settings')} 
                className={`flex-1 py-3 px-2 rounded-lg text-sm font-bold flex items-center justify-center gap-2 transition-all whitespace-nowrap ${activeTab === 'settings' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-400 hover:text-white'}`}
            >
                <Settings size={18} /> <span>Configs</span>
            </button>
        </div>
      </div>

      <div className="p-6 space-y-6">
        
        {/* --- ABA USUÁRIOS --- */}
        {activeTab === 'users' && (
            <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100 animate-fade-in">
                <div className="grid grid-cols-2 gap-4 mb-6">
                    <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                        <p className="text-xs text-slate-400 font-bold uppercase mb-1">Receita Mensal</p>
                        <h2 className="text-2xl font-bold text-green-600">R$ {stats.revenue.toFixed(0)}</h2>
                    </div>
                    <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                        <p className="text-xs text-slate-400 font-bold uppercase mb-1">Total Usuários</p>
                        <h2 className="text-2xl font-bold text-blue-600">{stats.totalUsers}</h2>
                    </div>
                </div>

                <h3 className="font-bold text-slate-900 mb-4 flex items-center gap-2">
                    <Users size={18} className="text-blue-500" /> Lista de Clientes
                </h3>
                
                <div className="space-y-3">
                    {users.map(u => (
                        <div key={u.id} className="p-4 border border-slate-100 rounded-2xl hover:border-blue-200 transition-colors">
                            <div className="flex justify-between items-start mb-3">
                                <div>
                                    <p className="font-bold text-slate-900 text-sm">{u.name}</p>
                                    <p className="text-xs text-slate-400">{u.email}</p>
                                </div>
                                <div className="flex flex-col items-end gap-1">
                                    <span className={`text-[10px] font-bold px-2 py-1 rounded ${u.subscription_tier === 'free' ? 'bg-slate-100 text-slate-500' : 'bg-green-100 text-green-700'}`}>
                                        {u.subscription_tier?.toUpperCase()}
                                    </span>
                                    
                                    {/* BOTÃO WHATSAPP (CRM) */}
                                    {u.whatsapp && (
                                        <button 
                                            onClick={() => handleWhatsApp(u.whatsapp!)}
                                            className="flex items-center gap-1 text-[10px] font-bold text-green-600 bg-green-50 px-2 py-1 rounded hover:bg-green-100 transition-colors"
                                        >
                                            <Phone size={10} /> WhatsApp
                                        </button>
                                    )}
                                </div>
                            </div>
                            <div className="grid grid-cols-3 gap-2 border-t border-slate-50 pt-3">
                                <button onClick={() => addCredits(u.id, 'chat', 50)} className="text-[10px] font-bold bg-blue-50 text-blue-600 py-2 rounded-lg hover:bg-blue-100">+Tokens</button>
                                <button onClick={() => addCredits(u.id, 'scan', 5)} className="text-[10px] font-bold bg-purple-50 text-purple-600 py-2 rounded-lg hover:bg-purple-100">+Scans</button>
                                <button onClick={() => addCredits(u.id, 'diagnosis', 1)} className="text-[10px] font-bold bg-green-50 text-green-600 py-2 rounded-lg hover:bg-green-100">+Diag</button>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        )}

        {/* --- ABA MARKETING --- */}
        {activeTab === 'marketing' && (
            <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100 animate-fade-in">
                <div className="flex items-center gap-3 mb-6">
                    <div className="w-10 h-10 bg-blue-100 text-blue-600 rounded-xl flex items-center justify-center">
                        <Send size={20} />
                    </div>
                    <div>
                        <h2 className="font-bold text-slate-900 text-lg">Disparo de Mensagens</h2>
                        <p className="text-xs text-slate-500">Engaje usuários via Push/Email</p>
                    </div>
                </div>

                <div className="space-y-4">
                    <div>
                        <label className="text-xs font-bold text-slate-500 uppercase mb-2 block pl-1">Público Alvo</label>
                        <div className="relative">
                            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                            <select 
                                className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-4 py-3 text-sm font-bold text-slate-700 outline-none focus:ring-2 focus:ring-blue-500 appearance-none"
                                value={messageTarget} 
                                onChange={e => setMessageTarget(e.target.value)}
                            >
                                <option value="basic">Usuários Plano Básico (Upsell)</option>
                                <option value="all">Toda a Base (Aviso Geral)</option>
                                <option value="active">Apenas Pagantes (Novidades)</option>
                            </select>
                        </div>
                    </div>

                    <div>
                        <label className="text-xs font-bold text-slate-500 uppercase mb-2 block pl-1">Mensagem</label>
                        <input type="text" placeholder="Título..." className="w-full bg-slate-50 border-slate-200 border rounded-xl p-3 text-sm font-bold mb-2" value={messageTitle} onChange={e => setMessageTitle(e.target.value)} />
                        <textarea rows={4} placeholder="Conteúdo..." className="w-full bg-slate-50 border-slate-200 border rounded-xl p-3 text-sm resize-none" value={messageBody} onChange={e => setMessageBody(e.target.value)} />
                    </div>

                    <div className="pt-2">
                        <Button onClick={handleSendMessage} isLoading={isSending} className="bg-gradient-to-r from-blue-600 to-indigo-600 shadow-blue-500/20">
                            Enviar Campanha Agora
                        </Button>
                    </div>
                </div>
            </div>
        )}

        {/* --- ABA CONFIGURAÇÕES --- */}
        {activeTab === 'settings' && (
            <div className="space-y-6 animate-fade-in">
                
                {/* Links de Pagamento */}
                <div className="bg-white p-6 rounded-3xl border border-green-200 shadow-sm relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-20 h-20 bg-green-50 rounded-bl-full -mr-4 -mt-4"></div>
                    <div className="relative z-10">
                        <h3 className="font-bold text-green-800 mb-4 flex items-center gap-2"><ShoppingCart size={18} /> Checkout Externo</h3>
                        <p className="text-xs text-slate-500 mb-4 leading-relaxed">
                            Cole aqui os links de pagamento da Hotmart, Kiwify ou Mercado Pago. 
                            O App abrirá esses links quando o usuário clicar em comprar.
                        </p>
                        
                        <div className="space-y-3">
                            <div>
                                <label className="text-[10px] font-bold text-slate-400 uppercase">Link Plano Básico</label>
                                <input type="text" value={linkBasic} onChange={e => setLinkBasic(e.target.value)} placeholder="https://pay.hotmart.com/..." className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-700 outline-none focus:border-green-500" />
                            </div>
                            <div>
                                <label className="text-[10px] font-bold text-slate-400 uppercase">Link Plano Avançado</label>
                                <input type="text" value={linkAdvanced} onChange={e => setLinkAdvanced(e.target.value)} placeholder="https://..." className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-700 outline-none focus:border-green-500" />
                            </div>
                            <div>
                                <label className="text-[10px] font-bold text-slate-400 uppercase">Link Plano Premium</label>
                                <input type="text" value={linkPremium} onChange={e => setLinkPremium(e.target.value)} placeholder="https://..." className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-700 outline-none focus:border-green-500" />
                            </div>
                            <div>
                                <label className="text-[10px] font-bold text-slate-400 uppercase">Link Pacote Créditos</label>
                                <input type="text" value={linkCredits} onChange={e => setLinkCredits(e.target.value)} placeholder="https://..." className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-700 outline-none focus:border-green-500" />
                            </div>
                        </div>
                    </div>
                </div>

                {/* API Configs */}
                <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
                    <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2"><Link size={18} className="text-blue-600" /> Conexões API</h3>
                    <div className="space-y-4">
                        <div>
                            <label className="text-[10px] font-bold text-slate-400 uppercase">N8N Webhook URL</label>
                            <input type="text" className="w-full bg-slate-50 border-slate-200 border rounded-xl px-3 py-2 text-xs font-mono" value={configN8N} onChange={e => setConfigN8N(e.target.value)} placeholder="https://seu-n8n.com/webhook..." />
                        </div>
                        <div className="grid grid-cols-1 gap-3 pt-2 border-t border-slate-100">
                            <div>
                                <label className="text-[10px] font-bold text-slate-400 uppercase">Supabase URL</label>
                                <input type="text" className="w-full bg-slate-50 border-slate-200 border rounded-xl px-3 py-2 text-xs font-mono" value={configSupaUrl} onChange={e => setConfigSupaUrl(e.target.value)} />
                            </div>
                            <div>
                                <label className="text-[10px] font-bold text-slate-400 uppercase">Supabase Key</label>
                                <input type="password" className="w-full bg-slate-50 border-slate-200 border rounded-xl px-3 py-2 text-xs font-mono" value={configSupaKey} onChange={e => setConfigSupaKey(e.target.value)} />
                            </div>
                        </div>
                    </div>
                    
                    <div className="flex gap-3 mt-6 pt-4 border-t border-slate-100">
                        <button onClick={handleResetSettings} className="px-4 py-3 bg-red-50 text-red-500 rounded-xl font-bold text-xs flex items-center gap-2 hover:bg-red-100 transition-colors">
                            <RefreshCw size={14} /> Reset
                        </button>
                        <Button onClick={handleSaveSettings} className="flex-1 h-auto py-3 text-xs shadow-lg shadow-blue-500/20">
                            <Save size={16} /> Salvar Tudo
                        </Button>
                    </div>
                </div>
            </div>
        )}
      </div>
    </div>
  );
};