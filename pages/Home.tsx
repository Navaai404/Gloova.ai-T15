import React, { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronRight, Droplet, Medal, ArrowRight, Camera, Edit2, Sparkles } from 'lucide-react';
import { DiagnosisResult, UserProfile } from '../types';
import { supabase } from '../lib/supabase';

export const Home: React.FC = () => {
  const navigate = useNavigate();
  const [lastDiagnosis, setLastDiagnosis] = useState<DiagnosisResult | null>(null);
  const [user, setUser] = useState<UserProfile | null>(null);
  const [avatar, setAvatar] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const loadData = async () => {
    try {
        // 1. Load User
        const storedUser = localStorage.getItem('gloova_user');
        let currentUser: UserProfile | null = storedUser ? JSON.parse(storedUser) : null;
        
        if (currentUser) {
            // Refresh User Data
            const { data: freshUser } = await supabase.from('profiles').select('*').eq('id', currentUser.id).single();
            if (freshUser) {
                currentUser = freshUser;
                setUser(currentUser);
                localStorage.setItem('gloova_user', JSON.stringify(currentUser));
                
                // Load Avatar
                const savedAvatar = localStorage.getItem(`gloova_avatar_${currentUser.id}`);
                if (savedAvatar) setAvatar(savedAvatar);
            }
        
            // 2. Load Diagnosis (Fonte da Verdade: Banco)
            const { data: diagData } = await supabase
                .from('diagnosticos')
                .select('*')
                .eq('user_id', currentUser.id)
                .order('created_at', { ascending: false })
                .limit(1)
                .single();
                
            if (diagData && diagData.resultado_json) {
                const parsedDiag = typeof diagData.resultado_json === 'string' ? JSON.parse(diagData.resultado_json) : diagData.resultado_json;
                setLastDiagnosis(parsedDiag);
                localStorage.setItem('gloova_last_diagnosis', JSON.stringify(parsedDiag));
            } else {
                // Fallback Local
                const storedDiag = localStorage.getItem('gloova_last_diagnosis');
                if (storedDiag) setLastDiagnosis(JSON.parse(storedDiag));
            }
        }
    } catch (e) {
        console.error("Failed to load home data", e);
    }
  };

  useEffect(() => {
    loadData();

    // REALTIME LISTENER
    // Escuta mudanças no diagnóstico (ex: completou dia no protocolo) e no perfil (pontos)
    const userStr = localStorage.getItem('gloova_user');
    let channel: any;

    if (userStr) {
        const parsedUser = JSON.parse(userStr);
        
        channel = supabase.channel('home-updates')
        .on(
            'postgres_changes',
            { event: 'UPDATE', schema: 'public', table: 'diagnosticos', filter: `user_id=eq.${parsedUser.id}` },
            (payload) => {
                console.log("Home: Diagnóstico atualizado!", payload);
                if (payload.new && payload.new.resultado_json) {
                    const newDiag = typeof payload.new.resultado_json === 'string' ? JSON.parse(payload.new.resultado_json) : payload.new.resultado_json;
                    setLastDiagnosis(newDiag);
                    localStorage.setItem('gloova_last_diagnosis', JSON.stringify(newDiag));
                }
            }
        )
        .on(
            'postgres_changes',
            { event: 'UPDATE', schema: 'public', table: 'profiles', filter: `id=eq.${parsedUser.id}` },
            (payload) => {
                console.log("Home: Perfil atualizado!", payload);
                if (payload.new) {
                    setUser(payload.new as UserProfile);
                    localStorage.setItem('gloova_user', JSON.stringify(payload.new));
                }
            }
        )
        .subscribe();
    }

    window.addEventListener('points-updated', loadData);
    return () => {
        window.removeEventListener('points-updated', loadData);
        if (channel) supabase.removeChannel(channel);
    };
  }, []);

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && user) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const result = reader.result as string;
        setAvatar(result);
        localStorage.setItem(`gloova_avatar_${user.id}`, result);
      };
      reader.readAsDataURL(file);
    }
  };

  const getFirstName = (fullName?: string) => fullName?.split(' ')[0] || 'Visitante';
  
  // Lógica de Progresso (Baseada no protocolo real)
  const hasActiveTreatment = !!lastDiagnosis && !!lastDiagnosis.protocol_30_days;
  
  // Calcula progresso real
  let completedDays = 0;
  if (hasActiveTreatment && lastDiagnosis?.protocol_30_days) {
      completedDays = lastDiagnosis.protocol_30_days.filter(d => d.completed).length;
  }
  
  const progressPercent = hasActiveTreatment ? Math.round((completedDays / 30) * 100) : 0;
  const radius = 70;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (progressPercent / 100) * circumference;

  // Determina próxima etapa
  let nextStep = "Diagnóstico IA";
  let nextStepType = "Iniciar Agora";
  
  if (hasActiveTreatment && lastDiagnosis?.protocol_30_days) {
      const nextDay = lastDiagnosis.protocol_30_days.find(d => !d.completed);
      if (nextDay) {
          nextStep = nextDay.type;
          nextStepType = "Marcar como Feita";
      } else {
          nextStep = "Ciclo Concluído!";
          nextStepType = "Ver Resultados";
      }
  }

  return (
    <div className="p-6 space-y-8 max-w-md mx-auto animate-fade-in">
      
      <div className="flex items-center justify-between mt-2">
        <div>
          <h2 className="text-slate-500 text-sm font-medium tracking-wide mb-1">Olá,</h2>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">{getFirstName(user?.name)}</h1>
        </div>
        <div className="relative group cursor-pointer" onClick={() => fileInputRef.current?.click()}>
           <div className="w-16 h-16 rounded-full border-4 border-white shadow-lg overflow-hidden bg-slate-200 relative">
              {avatar ? (<img src={avatar} alt="User" className="w-full h-full object-cover" />) : (<div className="w-full h-full flex items-center justify-center text-slate-400 bg-slate-100"><Camera size={24} /></div>)}
              <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white"><Edit2 size={16} /></div>
           </div>
           <div className="absolute bottom-1 right-0 w-4 h-4 bg-green-500 border-2 border-white rounded-full"></div>
           <input type="file" ref={fileInputRef} onChange={handleAvatarChange} className="hidden" accept="image/*" />
        </div>
      </div>

      {/* Progress Chart */}
      <div 
        className="bg-white rounded-[32px] p-8 shadow-2xl shadow-blue-900/5 border border-slate-100 relative overflow-hidden group cursor-pointer"
        onClick={() => navigate(hasActiveTreatment ? '/protocol' : '/diagnosis')}
      >
        <div className="absolute top-0 right-0 w-40 h-40 bg-blue-50 rounded-full -mr-16 -mt-16 blur-3xl opacity-60 group-hover:opacity-80 transition-opacity"></div>
        <div className="flex items-center justify-between mb-6 relative z-10">
            <div>
                <h3 className="font-bold text-slate-900 text-xl">{hasActiveTreatment ? 'Seu Progresso' : 'Jornada Capilar'}</h3>
                <p className="text-slate-400 text-xs font-bold uppercase tracking-wide mt-1">{hasActiveTreatment ? 'Fase de Tratamento' : 'Aguardando Início'}</p>
            </div>
            <div className="bg-blue-50 p-2.5 rounded-full text-blue-600"><ChevronRight size={20} /></div>
        </div>
        <div className="flex items-center justify-center py-4 relative z-10">
            <div className="relative w-48 h-48">
                <svg className="w-full h-full transform -rotate-90 drop-shadow-xl">
                    <defs>
                        <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stopColor="#3b82f6" /><stop offset="100%" stopColor="#8b5cf6" /></linearGradient>
                        <filter id="glow" x="-20%" y="-20%" width="140%" height="140%"><feGaussianBlur stdDeviation="5" result="blur" /><feComposite in="SourceGraphic" in2="blur" operator="over" /></filter>
                    </defs>
                    <circle cx="50%" cy="50%" r={radius} stroke="#f1f5f9" strokeWidth="12" fill="none" strokeLinecap="round" />
                    <circle cx="50%" cy="50%" r={radius} stroke="url(#gradient)" strokeWidth="12" fill="none" strokeDasharray={circumference} strokeDashoffset={strokeDashoffset} strokeLinecap="round" className="transition-all duration-1000 ease-out" filter="url(#glow)" />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-5xl font-bold text-slate-900 tracking-tighter">{progressPercent}%</span>
                    <span className="text-xs font-bold text-slate-400 uppercase mt-1">{hasActiveTreatment ? 'Concluído' : 'Inicial'}</span>
                </div>
            </div>
        </div>
        <div className="text-center relative z-10">
            <p className="text-sm text-slate-600 font-medium">
                {hasActiveTreatment ? <>Faltam <span className="text-blue-600 font-bold">{30 - completedDays} dias</span> para completar o ciclo.</> : "Vamos descobrir o que seu cabelo precisa?"}
            </p>
        </div>
      </div>

      {/* Next Action Card */}
      <div className="bg-slate-900 text-white rounded-[32px] p-6 shadow-xl shadow-slate-900/20 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-blue-600 rounded-full -mr-10 -mt-10 blur-[50px] opacity-40"></div>
        <div className="relative z-10">
            <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center backdrop-blur-sm">
                    {hasActiveTreatment ? <Droplet size={20} className="text-blue-300" fill="currentColor" /> : <Sparkles size={20} className="text-yellow-300" />}
                </div>
                <div>
                    <p className="text-blue-200 text-xs font-bold uppercase">Próxima Etapa</p>
                    <h3 className="text-lg font-bold">{nextStep}</h3>
                </div>
            </div>
            <button onClick={() => navigate(hasActiveTreatment ? '/protocol' : '/diagnosis')} className="w-full bg-white text-slate-900 font-bold py-3.5 rounded-xl shadow-lg active:scale-[0.98] transition-all flex items-center justify-center gap-2 group">
              {nextStepType} <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
            </button>
        </div>
      </div>

      {/* Mini Ranking */}
      <div className="bg-white rounded-[32px] p-6 shadow-lg border border-slate-100">
        <div className="flex justify-between items-center mb-5">
          <div className="flex items-center gap-2"><Medal size={20} className="text-yellow-500" /><h3 className="font-bold text-slate-800 text-lg">Ranking</h3></div>
          <button onClick={() => navigate('/gamification')} className="text-blue-600 text-xs font-bold hover:underline">Ver tudo</button>
        </div>
        <div className="space-y-4">
          <div className="flex items-center justify-between p-2 bg-slate-50 rounded-xl border border-slate-100">
             <div className="flex items-center gap-3"><span className="w-6 text-center text-sm font-bold text-slate-400">-</span><span className="font-bold text-slate-900">Você</span></div>
             <span className="font-bold text-blue-600 text-sm">{user?.points || 0} pts</span>
          </div>
        </div>
      </div>
    </div>
  );
};