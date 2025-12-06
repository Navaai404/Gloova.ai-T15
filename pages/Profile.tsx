import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { LogOut, Trophy, ChevronRight, ChevronLeft, Check, Gift, ShoppingBag, Wallet, ScanLine, MessageSquare, PlusCircle, Zap, Crown, Sparkles, Lock } from 'lucide-react';
import { Button } from '../components/Button';
import { getLevel, REWARDS_LIST, redeemReward, RewardItem, POINTS } from '../services/gamification';
import { PLANS, PACKAGES, buyPackage } from '../services/monetization';
import { UserProfile } from '../types';
import { PaymentModal } from '../components/PaymentModal';
import { supabase } from '../lib/supabase';

// --- CONFIGURAÇÃO DE ADMINISTRADORES ---
const ADMIN_EMAILS = [
  'admin@gloova.ai', 
  'jardel100dias@hotmail.com'
]; 

type ProfileView = 'main' | 'rewards' | 'referrals' | 'subscription' | 'store';

export const Profile: React.FC = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<UserProfile | null>(null);
  const [currentView, setCurrentView] = useState<ProfileView>('main');
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'annual'>('monthly');
  
  // Payment State
  const [isPaymentOpen, setIsPaymentOpen] = useState(false);
  const [pendingItem, setPendingItem] = useState<{name: string, price: number, type: 'pkg' | 'sub', subTier?: any, pkgType?: any, pkgQty?: number} | null>(null);

  const loadUser = async () => {
    const userStr = localStorage.getItem('gloova_user');
    if (userStr) {
        let userData = JSON.parse(userStr);
        
        // Refresh from DB to ensure sync
        try {
            const { data } = await supabase.from('profiles').select('*').eq('id', userData.id).single();
            if (data) {
                userData = data;
                localStorage.setItem('gloova_user', JSON.stringify(userData));
            }
        } catch (e) {
            console.error("Sync error", e);
        }
        setUser(userData);
    }
  };

  useEffect(() => {
    loadUser();
    
    // REALTIME LISTENER: Escuta mudanças no saldo/plano
    let channel: any;
    const userStr = localStorage.getItem('gloova_user');
    
    if (userStr) {
        const parsedUser = JSON.parse(userStr);
        channel = supabase
          .channel('profile-updates')
          .on(
            'postgres_changes',
            { event: 'UPDATE', schema: 'public', table: 'profiles', filter: `id=eq.${parsedUser.id}` },
            (payload) => {
                console.log("Perfil atualizado via Realtime!", payload);
                if (payload.new) {
                    const updatedUser = payload.new as UserProfile;
                    setUser(updatedUser);
                    localStorage.setItem('gloova_user', JSON.stringify(updatedUser));
                }
            }
          )
          .subscribe();
    }

    window.addEventListener('points-updated', loadUser);
    return () => {
        window.removeEventListener('points-updated', loadUser);
        if (channel) supabase.removeChannel(channel);
    };
  }, []);

  if (!user) return null;

  const isAdmin = ADMIN_EMAILS.some(admin => admin.toLowerCase().trim() === (user.email || '').toLowerCase().trim());

  const handleLogout = () => {
    localStorage.removeItem('gloova_user');
    navigate('/');
  };

  // -- Payment Handlers with External Links Support --

  const initiateUpgrade = (tier: 'advanced' | 'premium', plan: any) => {
    let linkToUse = '';
    if (tier === 'advanced') linkToUse = localStorage.getItem('gloova_link_advanced') || '';
    if (tier === 'premium') linkToUse = localStorage.getItem('gloova_link_premium') || '';
    if (plan.id === 'basic') linkToUse = localStorage.getItem('gloova_link_basic') || '';

    if (linkToUse && linkToUse.startsWith('http')) {
        window.open(linkToUse, '_blank');
        return;
    }

    const price = billingCycle === 'monthly' ? plan.price : plan.annualPrice;
    setPendingItem({
        name: `Plano ${plan.name} (${billingCycle === 'monthly' ? 'Mensal' : 'Anual'})`,
        price: price,
        type: 'sub',
        subTier: tier
    });
    setIsPaymentOpen(true);
  };

  const initiatePackageBuy = (type: 'chat' | 'diagnosis' | 'scan', qty: number, price: number, label: string) => {
    const externalLink = localStorage.getItem('gloova_link_credits');
    if (externalLink && externalLink.startsWith('http')) {
        window.open(externalLink, '_blank');
        return;
    }

    setPendingItem({
        name: label,
        price: price,
        type: 'pkg',
        pkgType: type,
        pkgQty: qty
    });
    setIsPaymentOpen(true);
  };

  const handlePaymentSuccess = async () => {
    if (!pendingItem) return;

    if (pendingItem.type === 'sub') {
        const tier = pendingItem.subTier;
        const planLimits = PLANS[tier].limits;
        
        const updated = { 
            ...user, 
            subscription_tier: tier,
            chat_credits: planLimits.tokens,
            diagnosis_credits: planLimits.diagnosis,
            scan_credits: planLimits.scans
        };
        setUser(updated);
        localStorage.setItem('gloova_user', JSON.stringify(updated));

        // Referral Logic
        const isFirstSub = user.subscription_tier === 'free' || user.subscription_tier === 'basic'; 
        
        if (isFirstSub && user.referred_by) {
             const alreadyRewarded = localStorage.getItem('referral_reward_given');
             
             if (!alreadyRewarded) {
                 const { data: referrer } = await supabase
                    .from('profiles')
                    .select('*')
                    .eq('referral_code', user.referred_by)
                    .single();
                 
                 if (referrer) {
                     const newPoints = (referrer.points || 0) + POINTS.REFERRAL_BONUS;
                     await supabase
                        .from('profiles')
                        .update({ points: newPoints })
                        .eq('id', referrer.id);
                     
                     localStorage.setItem('referral_reward_given', 'true');
                     alert(`Parabéns pela assinatura! Seu amigo (código ${user.referred_by}) ganhou bônus! 🎉`);
                 }
             }
        }

    } else if (pendingItem.type === 'pkg') {
        buyPackage(pendingItem.pkgType, pendingItem.pkgQty!);
    }
  };

  const handleRedeem = (reward: RewardItem) => {
    if (!user.points || user.points < reward.cost) return;
    const success = redeemReward(reward.id, reward.cost);
    if (success) alert(`Parabéns! Você resgatou: ${reward.title}`);
  };

  const points = user.points || 0;
  const level = getLevel(points);
  const userPlanId = user.subscription_tier && PLANS[user.subscription_tier] ? user.subscription_tier : 'basic';
  const planDetails = PLANS[userPlanId];
  const isPremium = user.subscription_tier === 'premium';

  // --- SUB-VIEWS RENDERERS (Mesma UI) ---
  const renderRewards = () => (
    <div className="animate-fade-in">
      <div className="flex items-center mb-6"><button onClick={() => setCurrentView('main')} className="p-2 -ml-2 rounded-full hover:bg-slate-100 transition-colors"><ChevronLeft className="text-slate-600" /></button><h1 className="text-xl font-bold ml-2 text-slate-800">Recompensas</h1></div>
      <div className="bg-slate-900 rounded-2xl p-6 text-white shadow-lg mb-6 sticky top-0 z-10"><div className="flex justify-between items-center"><div><p className="text-slate-400 text-xs font-bold uppercase mb-1">Seu Saldo</p><div className="flex items-center gap-2"><Trophy className="text-yellow-400" size={24} /><span className="text-3xl font-bold text-white">{points}</span></div></div><div className="text-right"><p className="text-slate-400 text-xs font-bold uppercase mb-1">Nível Atual</p><span className="bg-white/10 px-3 py-1 rounded-full text-sm font-semibold border border-white/20 text-yellow-300">{level.name}</span></div></div></div>
      <div className="space-y-3">{REWARDS_LIST.map((reward) => { const canAfford = points >= reward.cost; return (<div key={reward.id} className={`bg-white p-4 rounded-xl border border-slate-100 shadow-sm flex flex-col gap-3`}><div className="flex justify-between items-start"><div className="flex gap-3"><div className={`p-3 rounded-xl bg-slate-50`}><Gift size={20} className="text-blue-500" /></div><div><h4 className="font-bold text-slate-800">{reward.title}</h4><p className="text-xs text-slate-500 mt-1">{reward.description}</p></div></div></div><div className="flex items-center justify-between pt-2 border-t border-slate-50 mt-1"><span className={`text-sm font-bold ${canAfford ? 'text-green-600' : 'text-slate-400'}`}>{reward.cost} pts</span><button onClick={() => handleRedeem(reward)} disabled={!canAfford} className={`px-4 py-1.5 rounded-lg text-sm font-bold transition-colors flex items-center gap-2 ${canAfford ? 'bg-blue-600 text-white hover:bg-blue-700 shadow-blue-200 shadow-md' : 'bg-slate-100 text-slate-400 cursor-not-allowed'}`}>{canAfford ? 'Resgatar' : <Lock size={14} />}</button></div></div>); })}</div>
    </div>
  );

  const renderStore = () => (
    <div className="animate-fade-in pb-12">
        <div className="flex items-center mb-6"><button onClick={() => setCurrentView('main')} className="p-2 -ml-2 rounded-full hover:bg-slate-100 transition-colors"><ChevronLeft className="text-slate-600" /></button><h1 className="text-xl font-bold ml-2 text-slate-800">Carteira & Loja</h1></div>
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-[24px] p-6 text-white shadow-xl shadow-blue-500/20 mb-8"><div className="flex items-center gap-2 mb-4 opacity-90"><Wallet size={20} /><span className="font-bold uppercase text-xs tracking-wider">Seus Créditos</span></div><div className="grid grid-cols-3 gap-4 text-center"><div className="bg-white/10 rounded-xl p-3 border border-white/10"><span className="block text-2xl font-bold">{user.chat_credits || 0}</span><span className="text-[10px] uppercase font-bold text-blue-100">Tokens</span></div><div className="bg-white/10 rounded-xl p-3 border border-white/10"><span className="block text-2xl font-bold">{user.diagnosis_credits || 0}</span><span className="text-[10px] uppercase font-bold text-blue-100">Diags</span></div><div className="bg-white/10 rounded-xl p-3 border border-white/10"><span className="block text-2xl font-bold">{user.scan_credits || 0}</span><span className="text-[10px] uppercase font-bold text-blue-100">Scans</span></div></div></div>
        <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2"><ShoppingBag size={18} className="text-blue-500" /> Pacotes Avulsos</h3>
        <div className="space-y-6">
            <div><h4 className="text-xs font-bold text-slate-400 uppercase mb-3 ml-1 flex items-center gap-1"><Sparkles size={14} /> Diagnósticos</h4><div className="grid grid-cols-1 gap-3">{PACKAGES.diagnosis.map((pkg, i) => (<div key={i} className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm flex items-center justify-between"><div><span className="font-bold text-slate-800 block">{pkg.label}</span><span className="text-xs text-slate-500">Fotos + Relatório Completo</span></div><Button className="w-auto py-2 px-4 h-auto text-sm" onClick={() => initiatePackageBuy('diagnosis', pkg.qty, pkg.price, pkg.label)}>R$ {pkg.price.toFixed(2).replace('.', ',')}</Button></div>))}</div></div>
            <div><h4 className="text-xs font-bold text-slate-400 uppercase mb-3 ml-1 flex items-center gap-1"><ScanLine size={14} /> Scan de Produtos</h4><div className="grid grid-cols-1 gap-3">{PACKAGES.scan.map((pkg, i) => (<div key={i} className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm flex items-center justify-between"><div><span className="font-bold text-slate-800 block">{pkg.label}</span><span className="text-xs text-slate-500">Análise de Rótulo IA</span></div><Button className="w-auto py-2 px-4 h-auto text-sm" onClick={() => initiatePackageBuy('scan', pkg.qty, pkg.price, pkg.label)}>R$ {pkg.price.toFixed(2).replace('.', ',')}</Button></div>))}</div></div>
            <div><h4 className="text-xs font-bold text-slate-400 uppercase mb-3 ml-1 flex items-center gap-1"><MessageSquare size={14} /> Tokens de Conversa</h4><div className="grid grid-cols-1 gap-3">{PACKAGES.tokens.map((pkg, i) => (<div key={i} className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm flex items-center justify-between"><div><span className="font-bold text-slate-800 block">{pkg.label}</span><span className="text-xs text-slate-500">Para Chat Especialista</span></div><Button className="w-auto py-2 px-4 h-auto text-sm" onClick={() => initiatePackageBuy('chat', pkg.qty, pkg.price, pkg.label)}>R$ {pkg.price.toFixed(2).replace('.', ',')}</Button></div>))}</div></div>
        </div>
    </div>
  );

  const renderSubscription = () => (
    <div className="animate-fade-in pb-10">
       <div className="flex items-center mb-6"><button onClick={() => setCurrentView('main')} className="p-2 -ml-2 rounded-full hover:bg-slate-100 transition-colors"><ChevronLeft className="text-slate-600" /></button><h1 className="text-xl font-bold ml-2 text-slate-800">Assinatura</h1></div>
      <div className={`rounded-[32px] p-8 text-center mb-8 relative overflow-hidden ${user.subscription_tier === 'premium' ? 'bg-gradient-to-br from-slate-900 to-slate-800 text-white' : user.subscription_tier === 'advanced' ? 'bg-gradient-to-br from-blue-600 to-blue-500 text-white' : 'bg-white border border-slate-200 shadow-sm'}`}><div className="relative z-10"><h2 className={`text-2xl font-bold mb-1 ${user.subscription_tier === 'basic' ? 'text-slate-900' : 'text-white'}`}>{planDetails.name}</h2><div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold mb-4 ${user.subscription_tier === 'basic' ? 'bg-slate-100 text-slate-600' : 'bg-white/20 text-white border border-white/30'}`}><Zap size={12} />{planDetails.limits.tokens} Tokens Mensais</div><div className="inline-flex items-center gap-2 bg-green-500/20 text-green-500 px-4 py-2 rounded-xl font-bold text-sm border border-green-500/30"><Check size={16} /> Assinatura Ativa</div></div></div>
      <div className="bg-slate-100 p-1.5 rounded-xl flex mb-6"><button onClick={() => setBillingCycle('monthly')} className={`flex-1 py-3 text-sm font-bold rounded-lg transition-all ${billingCycle === 'monthly' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500'}`}>Mensal</button><button onClick={() => setBillingCycle('annual')} className={`flex-1 py-3 text-sm font-bold rounded-lg transition-all flex items-center justify-center gap-2 ${billingCycle === 'annual' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500'}`}>Anual <span className="bg-green-100 text-green-600 text-[10px] px-1.5 py-0.5 rounded uppercase">-30%</span></button></div>
      <h3 className="font-bold text-slate-700 mb-4 px-1">Planos Disponíveis</h3>
      <div className="space-y-4">{Object.values(PLANS).map((plan) => { const isActive = userPlanId === plan.id; const monthlyEquivalent = plan.annualPrice / 12; return (<div key={plan.id} className={`bg-white rounded-2xl p-5 border shadow-sm relative overflow-hidden transition-all ${isActive ? 'border-blue-500 ring-1 ring-blue-500 bg-blue-50/10' : 'border-slate-100'}`}><div className="flex justify-between items-start mb-3"><div><h4 className="font-bold text-slate-900 text-lg">{plan.name}</h4><div className="mt-1">{billingCycle === 'annual' ? (<><p className="text-sm font-bold text-blue-600">R$ {monthlyEquivalent.toFixed(2).replace('.', ',')} <span className="text-slate-400 font-normal">/mês</span></p><p className="text-[10px] text-slate-500 mt-0.5">Cobrado R$ {plan.annualPrice.toFixed(2).replace('.', ',')} anualmente</p><p className="text-[10px] text-green-600 font-bold mt-0.5 bg-green-50 inline-block px-1.5 rounded">Economia de R$ {((plan.price * 12) - plan.annualPrice).toFixed(2).replace('.', ',')}</p></>) : (<p className="text-sm font-bold text-blue-600">R$ {plan.price.toFixed(2).replace('.', ',')} <span className="text-slate-400 font-normal">/mês</span></p>)}</div></div>{isActive && <div className="bg-blue-100 text-blue-600 p-1 rounded-full"><Check size={16} /></div>}</div><div className="space-y-2 mb-4">{plan.features.map((feat, idx) => (<div key={idx} className="flex items-center gap-2 text-sm text-slate-600"><Check size={14} className="text-green-500" /><span>{feat}</span></div>))}</div>{!isActive && (<Button variant={plan.id === 'premium' ? 'primary' : 'outline'} onClick={() => initiateUpgrade(plan.id as any, plan)} className="h-10 text-sm">Mudar para {plan.name}</Button>)}</div>)})}</div>
    </div>
  );

  return (
    <div className="p-6 max-w-md mx-auto pb-24 relative min-h-full animate-fade-in">
      {currentView === 'rewards' && renderRewards()}
      {currentView === 'subscription' && renderSubscription()}
      {currentView === 'store' && renderStore()}
      {currentView === 'main' && (
        <div className="animate-fade-in">
          <h1 className="text-2xl font-bold text-slate-900 mb-6">Meu Perfil</h1>
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex items-center gap-4 mb-6 relative overflow-hidden">
            <div className="h-16 w-16 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 text-2xl font-bold shrink-0">{user.name ? user.name[0].toUpperCase() : 'U'}</div>
            <div className="overflow-hidden relative z-10"><h2 className="font-bold text-lg truncate flex items-center gap-2">{user.name}{isPremium && <Crown size={16} className="text-yellow-500 fill-yellow-500" />}</h2><p className="text-slate-500 text-sm truncate mb-1">{user.email}</p>
            <div className="flex gap-2 mt-1">
                <span className="text-xs bg-slate-100 px-2 py-0.5 rounded text-slate-500 font-bold uppercase">{planDetails.name}</span>
                <span className="text-xs bg-yellow-50 text-yellow-600 px-2 py-0.5 rounded font-bold uppercase border border-yellow-200">{level.name}</span>
            </div>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4 mb-8">
             <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm cursor-pointer hover:border-blue-200 transition-colors" onClick={() => setCurrentView('store')}><div className="flex items-center gap-2 mb-2 text-slate-500"><Wallet size={18} /><span className="text-xs font-bold uppercase">Créditos</span></div><p className="text-2xl font-bold text-slate-900">{user.chat_credits || 0}</p><div className="flex items-center gap-1 mt-1"><PlusCircle size={12} className="text-blue-600" /><p className="text-xs text-blue-600 font-bold">Recarregar</p></div></div>
             <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm cursor-pointer hover:border-yellow-200 transition-colors" onClick={() => setCurrentView('rewards')}><div className="flex items-center gap-2 mb-2 text-slate-500"><Trophy size={18} /><span className="text-xs font-bold uppercase">Pontos</span></div><p className="text-2xl font-bold text-slate-900">{points}</p><p className="text-xs text-yellow-600 font-bold mt-1">{level.name}</p></div>
          </div>
          <div className="space-y-4">
            <button onClick={() => setCurrentView('store')} className="w-full bg-white p-4 rounded-xl shadow-sm border border-slate-100 flex items-center justify-between hover:bg-slate-50 transition-colors group"><div className="flex items-center gap-4"><div className="bg-purple-50 text-purple-600 p-2 rounded-lg group-hover:bg-purple-100 transition-colors"><ShoppingBag size={20} /></div><div className="text-left"><span className="font-medium text-slate-700 block">Loja & Carteira</span><span className="text-xs text-slate-400">Comprar tokens, diagnósticos e scans</span></div></div><ChevronRight size={18} className="text-slate-300 group-hover:text-slate-500" /></button>
            <button onClick={() => setCurrentView('subscription')} className="w-full bg-white p-4 rounded-xl shadow-sm border border-slate-100 flex items-center justify-between hover:bg-slate-50 transition-colors group"><div className="flex items-center gap-4"><div className={`p-2 rounded-lg transition-colors ${isPremium ? 'bg-yellow-50 text-yellow-600' : 'bg-slate-50 text-slate-600'}`}><Crown size={20} fill={isPremium ? "currentColor" : "none"} /></div><div className="text-left"><span className="font-medium text-slate-700 block">Assinatura</span><span className="text-xs text-slate-400">Plano {planDetails.name}</span></div></div><ChevronRight size={18} className="text-slate-300 group-hover:text-slate-500" /></button>
            {isAdmin && (<div className="pt-8 text-center"><button onClick={() => navigate('/admin')} className="text-[10px] text-slate-300 font-bold uppercase hover:text-slate-500 transition-colors border border-slate-200 rounded-full px-4 py-2">Acessar Painel Admin (Restrito)</button></div>)}
          </div>
          <div className="mt-8"><Button variant="ghost" onClick={handleLogout} className="text-red-500 hover:bg-red-50 hover:text-red-600"><LogOut size={20} />Sair da conta</Button></div>
        </div>
      )}
      {isPaymentOpen && pendingItem && (<PaymentModal isOpen={isPaymentOpen} onClose={() => setIsPaymentOpen(false)} onSuccess={handlePaymentSuccess} itemName={pendingItem.name} price={pendingItem.price} />)}
    </div>
  );
};
