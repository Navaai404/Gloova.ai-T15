import React, { useEffect, useState } from 'react';
import { Trophy, Crown, Share2, Users, Globe, CheckCircle2, Zap, Copy } from 'lucide-react';
import { UserProfile } from '../types';
import { Button } from '../components/Button';

export const Gamification: React.FC = () => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [activeTab, setActiveTab] = useState<'global' | 'friends'>('global');

  useEffect(() => {
    const storedUser = localStorage.getItem('gloova_user');
    if (storedUser) setUser(JSON.parse(storedUser));
  }, []);

  const handleCopyReferral = () => {
      if (user?.referral_code) {
          navigator.clipboard.writeText(user.referral_code);
          alert('Código copiado! Envie para seus amigos.');
      } else {
          alert('Erro: Você ainda não tem um código de convite gerado. Tente sair e entrar novamente.');
      }
  };

  // --- LÓGICA DE RANKING INTELIGENTE ---

  // 1. Bots Fixos (Para dar sensação de comunidade)
  const botUsers = [
    { name: 'Mariana S.', country: '🇧🇷', points: 12400, isBot: true, isMe: false },
    { name: 'João P.', country: '🇵🇹', points: 12200, isBot: true, isMe: false },
    { name: 'Elena R.', country: '🇪🇸', points: 11950, isBot: true, isMe: false },
  ];

  // 2. Usuário Real (Você)
  const currentUserItem = {
      name: 'Você',
      country: '',
      points: user?.points || 0,
      isBot: false,
      isMe: true
  };

  // 3. Constrói a lista Global (Bots + Você) e Ordena por Pontos
  const globalList = [...botUsers, currentUserItem].sort((a, b) => b.points - a.points);

  // 4. Adiciona o Rank (1º, 2º, 3º...)
  const rankedGlobalList = globalList.map((item, index) => ({
      ...item,
      rank: index + 1
  }));

  // 5. Lista de Amigos (Só você por enquanto, a menos que tenha referrals reais implementados no futuro)
  const friendsList = [currentUserItem].map((item, index) => ({ ...item, rank: index + 1 }));

  // Seleciona a lista ativa
  const currentList = activeTab === 'global' ? rankedGlobalList : friendsList;

  // Pega os Top 3 para o Pódio Visual
  const top1 = currentList[0];
  const top2 = currentList[1];
  const top3 = currentList[2]; // Pode ser undefined se não tiver 3 pessoas

  const badges = [
    { name: '1ª Semana', color: 'bg-yellow-100 text-yellow-600', icon: '🥇' },
    { name: '7 Dias', color: 'bg-orange-100 text-orange-600', icon: '🔥' },
    { name: 'Social', color: 'bg-red-100 text-red-600', icon: '❤️' },
    { name: 'Top 100', color: 'bg-blue-100 text-blue-600', icon: '👑' },
  ];

  return (
    <div className="p-6 pb-24 max-w-md mx-auto space-y-6 animate-fade-in pt-4">
      <div className="text-center mb-2">
        <h2 className="text-slate-500 font-bold uppercase tracking-wider text-xs mb-2">Gamificação</h2>
        <h1 className="text-3xl font-extrabold text-slate-900 leading-tight">Ranking &<br/>Conquistas</h1>
      </div>

      {/* Tabs */}
      <div className="bg-slate-100 p-1.5 rounded-2xl flex relative">
        <button 
            onClick={() => setActiveTab('global')}
            className={`flex-1 py-3 rounded-xl text-sm font-bold flex items-center justify-center gap-2 transition-all relative z-10 ${
                activeTab === 'global' ? 'bg-white shadow-sm text-blue-600' : 'text-slate-500 hover:text-slate-700'
            }`}
        >
            <Globe size={16} /> Global
        </button>
        <button 
            onClick={() => setActiveTab('friends')}
            className={`flex-1 py-3 rounded-xl text-sm font-bold flex items-center justify-center gap-2 transition-all relative z-10 ${
                activeTab === 'friends' ? 'bg-white shadow-sm text-blue-600' : 'text-slate-500 hover:text-slate-700'
            }`}
        >
            <Users size={16} /> Amigos
        </button>
      </div>

      {/* Podium Visualization (Só aparece se tiver pelo menos 2 pessoas no ranking) */}
      {currentList.length >= 2 && (
        <div className="flex justify-center items-end gap-4 py-4 min-h-[140px]">
            {/* 2nd Place */}
            {top2 && (
                <div className="flex flex-col items-center">
                    <div className="w-10 h-10 rounded-full border-2 border-slate-200 overflow-hidden mb-2 bg-slate-100 flex items-center justify-center text-xs font-bold text-slate-400">
                        {top2.name[0]}
                    </div>
                    <div className="flex flex-col items-center w-16">
                        <div className="w-full bg-slate-200 rounded-t-2xl h-16 relative flex justify-center pt-2">
                            <span className="font-bold text-slate-500">2</span>
                        </div>
                        {top2.isMe && <span className="text-[10px] font-bold text-blue-600 mt-1">Você</span>}
                    </div>
                </div>
            )}
            
            {/* 1st Place */}
            {top1 && (
                <div className="flex flex-col items-center relative -top-2">
                    <Crown className="text-yellow-400 mb-1 animate-bounce" size={24} fill="currentColor" />
                    <div className="w-12 h-12 rounded-full border-2 border-yellow-400 overflow-hidden mb-2 shadow-lg shadow-yellow-200 bg-yellow-50 flex items-center justify-center text-sm font-bold text-yellow-600">
                        {top1.name[0]}
                    </div>
                    <div className="flex flex-col items-center w-20">
                        <div className="w-full bg-gradient-to-b from-yellow-300 to-yellow-400 rounded-t-2xl h-24 relative flex justify-center pt-2 shadow-lg shadow-yellow-200">
                            <span className="font-bold text-white text-xl">1</span>
                        </div>
                        {top1.isMe && <span className="text-[10px] font-bold text-blue-600 mt-1">Você</span>}
                    </div>
                </div>
            )}

            {/* 3rd Place */}
            {top3 && (
                <div className="flex flex-col items-center">
                    <div className="w-10 h-10 rounded-full border-2 border-amber-200 overflow-hidden mb-2 bg-amber-50 flex items-center justify-center text-xs font-bold text-amber-700">
                        {top3.name[0]}
                    </div>
                    <div className="flex flex-col items-center w-16">
                        <div className="w-full bg-amber-200 rounded-t-2xl h-12 relative flex justify-center pt-2">
                            <span className="font-bold text-amber-800">3</span>
                        </div>
                        {top3.isMe && <span className="text-[10px] font-bold text-blue-600 mt-1">Você</span>}
                    </div>
                </div>
            )}
        </div>
      )}

      {/* List */}
      <div className="bg-white rounded-[32px] p-6 shadow-xl shadow-slate-200/50 border border-slate-100">
        <div className="space-y-4">
          {currentList.map((item) => (
            <div key={item.name} className={`flex items-center justify-between p-3 rounded-2xl ${item.isMe ? 'bg-blue-50 border border-blue-100' : ''}`}>
              <div className="flex items-center gap-4">
                 <span className={`font-bold w-6 text-center ${item.rank <= 3 ? 'text-slate-800' : 'text-slate-400'}`}>
                    {item.rank}
                 </span>
                 <div className="flex flex-col">
                    <span className="font-bold text-slate-800 text-sm">
                        {item.name} {item.country}
                    </span>
                    {item.isMe && <span className="text-[10px] font-bold text-blue-600 uppercase">É você!</span>}
                 </div>
              </div>
              <span className={`font-bold px-3 py-1 rounded-lg text-sm border ${item.isMe ? 'text-blue-700 bg-blue-100 border-blue-200' : 'text-slate-900 bg-slate-50 border-slate-100'}`}>
                {item.points.toLocaleString()} pts
              </span>
            </div>
          ))}
          
          {/* Empty State for Friends */}
          {activeTab === 'friends' && currentList.length === 1 && (
              <div className="text-center p-4 text-slate-400 text-sm">
                  Convide amigos para ver quem pontua mais!
              </div>
          )}
        </div>
      </div>

      {/* REFERRAL CARD */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-[24px] p-6 text-white text-center shadow-lg shadow-blue-500/30 mt-6">
        <h3 className="font-bold text-lg mb-2">Convide amigos = +500pts</h3>
        <p className="text-blue-100 text-sm mb-4">Ganhe pontos quando seu amigo completar o primeiro diagnóstico.</p>
        
        <div className="bg-white/20 backdrop-blur-sm border border-white/30 rounded-xl p-3 flex items-center justify-between mb-4">
             <span className="font-mono font-bold text-lg tracking-widest pl-2">
                {user?.referral_code || '-----'}
             </span>
             <button 
                onClick={handleCopyReferral}
                className="bg-white text-blue-600 px-3 py-1.5 rounded-lg text-xs font-bold hover:bg-blue-50 transition-colors flex items-center gap-1"
             >
                <Copy size={14} /> Copiar
             </button>
        </div>

        <button 
            onClick={handleCopyReferral}
            className="bg-white text-blue-600 px-6 py-3 rounded-xl font-bold text-sm hover:bg-blue-50 transition-colors w-full flex items-center justify-center gap-2"
        >
            <Share2 size={18} /> Compartilhar Link
        </button>
      </div>

      {/* Badges */}
      <div className="bg-white rounded-[32px] p-6 shadow-xl shadow-slate-200/50 border border-slate-100 mt-6">
        <h3 className="font-bold text-slate-800 mb-6 text-lg">Conquistas</h3>
        <div className="grid grid-cols-4 gap-4">
          {badges.map((badge, idx) => (
            <div key={idx} className="flex flex-col items-center text-center group cursor-pointer">
              <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-2xl mb-3 shadow-sm transition-transform group-hover:scale-110 group-hover:rotate-3 ${badge.color}`}>
                {badge.icon}
              </div>
              <p className="text-[10px] font-bold text-slate-600 uppercase tracking-tight leading-tight">{badge.name}</p>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
};