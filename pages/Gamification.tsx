import React, { useEffect, useState } from 'react';
import { Trophy, Crown, Share2, Users, Globe, CheckCircle2, Zap, Copy, Lock } from 'lucide-react';
import { UserProfile } from '../types';
import { Button } from '../components/Button';
import { supabase } from '../lib/supabase';

interface RankedUser extends UserProfile {
  rank: number;
  isMe: boolean;
}

export const Gamification: React.FC = () => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [activeTab, setActiveTab] = useState<'global' | 'friends'>('global');
  
  // State for Real Ranking Data
  const [rankingList, setRankingList] = useState<RankedUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
        setIsLoading(true);
        try {
            // 1. Load Local User
            const storedUser = localStorage.getItem('gloova_user');
            let currentUser: UserProfile | null = null;
            
            if (storedUser) {
                currentUser = JSON.parse(storedUser);
                setUser(currentUser);
            }

            // 2. Fetch Real Global Ranking from Supabase
            const { data: topUsers, error } = await supabase
                .from('profiles')
                .select('name, points, id, subscription_tier') // Select only necessary fields
                .order('points', { ascending: false })
                .limit(50);

            if (error) throw error;

            if (topUsers) {
                // Add rank property and flag current user
                const processedList: RankedUser[] = topUsers.map((u: any, index: number) => ({
                    ...u,
                    rank: index + 1,
                    isMe: currentUser ? u.id === currentUser.id : false
                }));
                setRankingList(processedList);
            }
        } catch (error) {
            console.error("Error loading ranking:", error);
            // Fallback empty list if offline
            setRankingList([]); 
        } finally {
            setIsLoading(false);
        }
    };

    loadData();
  }, []);

  const handleCopyReferral = () => {
      if (user?.referral_code) {
          navigator.clipboard.writeText(user.referral_code);
          alert('Código copiado! Envie para seus amigos.');
      } else {
          alert('Erro: Você ainda não tem um código de convite gerado. Tente sair e entrar novamente.');
      }
  };

  // Filter lists
  const globalList = rankingList;
  // For friends list, we would filter by referral connection. For now, show only me or empty state.
  const friendsList = rankingList.filter(u => u.isMe); 

  const currentList = activeTab === 'global' ? globalList : friendsList;

  // Podium logic (Top 3 from Global List)
  const top1 = globalList[0];
  const top2 = globalList[1];
  const top3 = globalList[2];

  // Badges Logic (Based on real user data)
  const myRank = rankingList.find(u => u.isMe)?.rank || 999;
  
  const badges = [
    { 
      name: 'Iniciante', 
      desc: 'Fez o 1º Diagnóstico',
      earned: (user?.diagnosis_credits || 0) < 1 || (user?.points || 0) >= 50, 
      color: 'bg-blue-100 text-blue-600', 
      icon: '🚀' 
    },
    { 
      name: 'Social', 
      desc: '1000 Pontos',
      earned: (user?.points || 0) >= 1000, 
      color: 'bg-red-100 text-red-600', 
      icon: '❤️' 
    },
    { 
      name: 'Top 10', 
      desc: 'Entrou no Top 10',
      earned: myRank <= 10, 
      color: 'bg-yellow-100 text-yellow-600', 
      icon: '👑' 
    },
    { 
      name: 'Lenda', 
      desc: '10.000 Pontos',
      earned: (user?.points || 0) >= 10000, 
      color: 'bg-purple-100 text-purple-600', 
      icon: '💎' 
    },
  ];

  return (
    <div className="p-6 pb-24 max-w-md mx-auto space-y-6 animate-fade-in pt-4">
      <div className="text-center mb-2">
        <h2 className="text-slate-500 font-bold uppercase tracking-wider text-xs mb-2">Gamificação</h2>
        <h1 className="text-3xl font-extrabold text-slate-900 leading-tight">Ranking Real</h1>
      </div>

      {/* Tabs */}
      <div className="bg-slate-100 p-1.5 rounded-2xl flex relative">
        <button onClick={() => setActiveTab('global')} className={`flex-1 py-3 rounded-xl text-sm font-bold flex items-center justify-center gap-2 transition-all relative z-10 ${activeTab === 'global' ? 'bg-white shadow-sm text-blue-600' : 'text-slate-500 hover:text-slate-700'}`}><Globe size={16} /> Global</button>
        <button onClick={() => setActiveTab('friends')} className={`flex-1 py-3 rounded-xl text-sm font-bold flex items-center justify-center gap-2 transition-all relative z-10 ${activeTab === 'friends' ? 'bg-white shadow-sm text-blue-600' : 'text-slate-500 hover:text-slate-700'}`}><Users size={16} /> Amigos</button>
      </div>

      {/* Podium Visualization (Only for Global Tab) */}
      {activeTab === 'global' && !isLoading && globalList.length >= 2 && (
        <div className="flex justify-center items-end gap-4 py-4 min-h-[140px]">
            {/* 2nd Place */}
            {top2 && (
                <div className="flex flex-col items-center">
                    <div className="w-10 h-10 rounded-full border-2 border-slate-200 overflow-hidden mb-2 bg-slate-100 flex items-center justify-center text-xs font-bold text-slate-400 uppercase">
                        {top2.name?.[0] || '?'}
                    </div>
                    <div className="flex flex-col items-center w-16">
                        <div className="w-full bg-slate-200 rounded-t-2xl h-16 relative flex justify-center pt-2"><span className="font-bold text-slate-500">2</span></div>
                        <span className="text-[10px] font-bold text-slate-600 mt-1 truncate w-full text-center">{top2.isMe ? 'Você' : top2.name?.split(' ')[0]}</span>
                    </div>
                </div>
            )}
            
            {/* 1st Place */}
            {top1 && (
                <div className="flex flex-col items-center relative -top-2">
                    <Crown className="text-yellow-400 mb-1 animate-bounce" size={24} fill="currentColor" />
                    <div className="w-12 h-12 rounded-full border-2 border-yellow-400 overflow-hidden mb-2 shadow-lg shadow-yellow-200 bg-yellow-50 flex items-center justify-center text-sm font-bold text-yellow-600 uppercase">
                        {top1.name?.[0] || '?'}
                    </div>
                    <div className="flex flex-col items-center w-20">
                        <div className="w-full bg-gradient-to-b from-yellow-300 to-yellow-400 rounded-t-2xl h-24 relative flex justify-center pt-2 shadow-lg shadow-yellow-200"><span className="font-bold text-white text-xl">1</span></div>
                        <span className="text-[10px] font-bold text-yellow-600 mt-1 truncate w-full text-center">{top1.isMe ? 'Você' : top1.name?.split(' ')[0]}</span>
                    </div>
                </div>
            )}

            {/* 3rd Place */}
            {top3 && (
                <div className="flex flex-col items-center">
                    <div className="w-10 h-10 rounded-full border-2 border-amber-200 overflow-hidden mb-2 bg-amber-50 flex items-center justify-center text-xs font-bold text-amber-700 uppercase">
                        {top3.name?.[0] || '?'}
                    </div>
                    <div className="flex flex-col items-center w-16">
                        <div className="w-full bg-amber-200 rounded-t-2xl h-12 relative flex justify-center pt-2"><span className="font-bold text-amber-800">3</span></div>
                        <span className="text-[10px] font-bold text-slate-600 mt-1 truncate w-full text-center">{top3.isMe ? 'Você' : top3.name?.split(' ')[0]}</span>
                    </div>
                </div>
            )}
        </div>
      )}

      {/* List */}
      <div className="bg-white rounded-[32px] p-6 shadow-xl shadow-slate-200/50 border border-slate-100 min-h-[200px]">
        {isLoading ? (
            <div className="text-center py-8 text-slate-400 animate-pulse">Carregando Ranking...</div>
        ) : (
            <div className="space-y-4">
            {currentList.length === 0 ? (
                <div className="text-center py-8 text-slate-400 text-sm">Ninguém pontuou ainda. Seja o primeiro!</div>
            ) : (
                currentList.map((item) => (
                    <div key={item.id} className={`flex items-center justify-between p-3 rounded-2xl ${item.isMe ? 'bg-blue-50 border border-blue-100 shadow-sm' : ''}`}>
                    <div className="flex items-center gap-4">
                        <span className={`font-bold w-6 text-center ${item.rank <= 3 ? 'text-slate-800' : 'text-slate-400'}`}>{item.rank}</span>
                        <div className="flex flex-col">
                            <span className="font-bold text-slate-800 text-sm">{item.name}</span>
                            {item.isMe && <span className="text-[10px] font-bold text-blue-600 uppercase">É você!</span>}
                        </div>
                    </div>
                    <span className={`font-bold px-3 py-1 rounded-lg text-sm border ${item.isMe ? 'text-blue-700 bg-blue-100 border-blue-200' : 'text-slate-900 bg-slate-50 border-slate-100'}`}>
                        {item.points} pts
                    </span>
                    </div>
                ))
            )}
            </div>
        )}
      </div>

      {/* REFERRAL CARD */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-[24px] p-6 text-white text-center shadow-lg shadow-blue-500/30 mt-6">
        <h3 className="font-bold text-lg mb-2">Indique e Ganhe +500pts</h3>
        <p className="text-blue-100 text-sm mb-4">Receba pontos quando seu amigo assinar um plano no app.</p>
        <div className="bg-white/20 backdrop-blur-sm border border-white/30 rounded-xl p-3 flex items-center justify-between mb-4">
             <span className="font-mono font-bold text-lg tracking-widest pl-2">{user?.referral_code || '...'}</span>
             <button onClick={handleCopyReferral} className="bg-white text-blue-600 px-3 py-1.5 rounded-lg text-xs font-bold hover:bg-blue-50 transition-colors flex items-center gap-1"><Copy size={14} /> Copiar</button>
        </div>
        <button onClick={handleCopyReferral} className="bg-white text-blue-600 px-6 py-3 rounded-xl font-bold text-sm hover:bg-blue-50 transition-colors w-full flex items-center justify-center gap-2"><Share2 size={18} /> Compartilhar Link</button>
      </div>

      {/* Badges Dinâmicos */}
      <div className="bg-white rounded-[32px] p-6 shadow-xl shadow-slate-200/50 border border-slate-100 mt-6">
        <h3 className="font-bold text-slate-800 mb-6 text-lg">Minhas Conquistas</h3>
        <div className="grid grid-cols-4 gap-4">
          {badges.map((badge, idx) => (
            <div key={idx} className={`flex flex-col items-center text-center group ${badge.earned ? 'cursor-pointer' : 'opacity-40 grayscale'}`}>
              <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-2xl mb-3 shadow-sm transition-transform ${badge.earned ? 'group-hover:scale-110 group-hover:rotate-3 ' + badge.color : 'bg-slate-100 text-slate-300'}`}>
                {badge.earned ? badge.icon : <Lock size={20} />}
              </div>
              <p className="text-[10px] font-bold text-slate-600 uppercase tracking-tight leading-tight">{badge.name}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};