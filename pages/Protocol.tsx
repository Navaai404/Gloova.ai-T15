import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, CalendarPlus, Clock, Check, Sparkles, Bell, X, RefreshCw, Lock } from 'lucide-react';
import { DiagnosisResult, ProtocolDay, UserProfile } from '../types';
import { downloadCalendarIcs, downloadSingleReminderIcs } from '../services/calendar';
import { Button } from '../components/Button';
import { supabase } from '../lib/supabase';

interface CustomReminder {
  day: number;
  time: string;
  note: string;
}

export const Protocol: React.FC = () => {
  const navigate = useNavigate();
  const [protocol, setProtocol] = useState<ProtocolDay[]>([]);
  const [currentDay, setCurrentDay] = useState(1);
  const [diagnosisDate, setDiagnosisDate] = useState<string>(new Date().toISOString());
  const [user, setUser] = useState<UserProfile | null>(null);
  const [hasValidDiagnosis, setHasValidDiagnosis] = useState(false);
  const [diagnosisId, setDiagnosisId] = useState<string | null>(null);
  
  // Reminder State
  const [reminders, setReminders] = useState<CustomReminder[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newReminder, setNewReminder] = useState<CustomReminder>({
    day: 1,
    time: '09:00',
    note: ''
  });

  const weekDays = ['DOM', 'SEG', 'TER', 'QUA', 'QUI', 'SEX', 'SÁB'];
  
  useEffect(() => {
    let protocolChannel: any;
    let profileChannel: any;

    const loadData = async () => {
        const userStr = localStorage.getItem('gloova_user');
        if (userStr) {
            let currentUser = JSON.parse(userStr);
            
            // Refresh User Data from DB to check Subscription Status
            try {
                const { data: freshUser } = await supabase
                    .from('profiles')
                    .select('*')
                    .eq('id', currentUser.id)
                    .single();
                
                if (freshUser) {
                    currentUser = freshUser;
                    localStorage.setItem('gloova_user', JSON.stringify(freshUser));
                }
            } catch (e) { console.error("Sync error", e); }
            
            setUser(currentUser);

            // 1. Load Diagnosis
            try {
                const { data, error } = await supabase
                    .from('diagnosticos')
                    .select('*')
                    .eq('user_id', currentUser.id)
                    .order('created_at', { ascending: false })
                    .limit(1)
                    .single();

                if (data && data.resultado_json) {
                    const diagData: DiagnosisResult = typeof data.resultado_json === 'string' ? JSON.parse(data.resultado_json) : data.resultado_json;
                    
                    if (diagData.protocol_30_days && Array.isArray(diagData.protocol_30_days) && diagData.protocol_30_days.length > 0) {
                        setProtocol(diagData.protocol_30_days);
                        setDiagnosisDate(diagData.date || new Date().toISOString());
                        setHasValidDiagnosis(true);
                        setDiagnosisId(data.id);
                        localStorage.setItem('gloova_last_diagnosis', JSON.stringify(diagData));
                    } else {
                        setHasValidDiagnosis(false);
                    }
                } else {
                    // Fallback local
                    const storedDiag = localStorage.getItem('gloova_last_diagnosis');
                    if (storedDiag) {
                        const localData = JSON.parse(storedDiag);
                        if (localData.protocol_30_days) {
                             setProtocol(localData.protocol_30_days);
                             setHasValidDiagnosis(true);
                        }
                    } else {
                        setHasValidDiagnosis(false);
                    }
                }
            } catch (e) {
                setHasValidDiagnosis(false);
            }

            // 2. REALTIME LISTENERS
            
            // A. Escuta mudanças no protocolo (marcar como feito)
            protocolChannel = supabase
              .channel('protocol-updates')
              .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'diagnosticos', filter: `user_id=eq.${currentUser.id}` }, (payload) => {
                   if (payload.new && payload.new.resultado_json) {
                       const newDiag = typeof payload.new.resultado_json === 'string' ? JSON.parse(payload.new.resultado_json) : payload.new.resultado_json;
                       setProtocol(newDiag.protocol_30_days);
                   }
              })
              .subscribe();

            // B. Escuta mudanças no PERFIL (Assinatura/Paywall)
            profileChannel = supabase
              .channel('subscription-updates')
              .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'profiles', filter: `id=eq.${currentUser.id}` }, (payload) => {
                   console.log("Perfil atualizado (Assinatura)!", payload);
                   if (payload.new) {
                       const updatedUser = payload.new as UserProfile;
                       setUser(updatedUser);
                       localStorage.setItem('gloova_user', JSON.stringify(updatedUser));
                   }
              })
              .subscribe();
        }
    };

    loadData();

    const storedReminders = localStorage.getItem('gloova_reminders');
    if (storedReminders) {
      setReminders(JSON.parse(storedReminders));
    }

    return () => {
        if (protocolChannel) supabase.removeChannel(protocolChannel);
        if (profileChannel) supabase.removeChannel(profileChannel);
    };
  }, []);

  const handleMarkAsDone = async () => {
      if (!diagnosisId || !protocol.length) return;
      const updatedProtocol = protocol.map(d => {
          if (d.day === currentDay) return { ...d, completed: true };
          return d;
      });
      setProtocol(updatedProtocol);

      try {
          const storedDiag = localStorage.getItem('gloova_last_diagnosis');
          const fullDiag = storedDiag ? JSON.parse(storedDiag) : { protocol_30_days: [] };
          fullDiag.protocol_30_days = updatedProtocol;
          localStorage.setItem('gloova_last_diagnosis', JSON.stringify(fullDiag));

          await supabase.from('diagnosticos').update({ resultado_json: fullDiag }).eq('id', diagnosisId);
      } catch (e) {
          console.error("Erro ao salvar progresso", e);
      }
  };

  const handleSyncCalendar = () => {
    if (protocol.length > 0) {
      downloadCalendarIcs(protocol, diagnosisDate);
    }
  };

  const openReminderModal = () => {
    setNewReminder({ day: currentDay, time: '09:00', note: '' });
    setIsModalOpen(true);
  };

  const handleSaveReminder = () => {
    const updatedReminders = [...reminders.filter(r => r.day !== newReminder.day), newReminder];
    setReminders(updatedReminders);
    localStorage.setItem('gloova_reminders', JSON.stringify(updatedReminders));
    const dayInfo = protocol.find(d => d.day === newReminder.day);
    const type = dayInfo ? dayInfo.type : 'Tratamento';
    downloadSingleReminderIcs(newReminder.day, type, diagnosisDate, newReminder.time, newReminder.note);
    setIsModalOpen(false);
  };

  // 1. PRIORIDADE MÁXIMA: USUÁRIO NOVO (SEM DIAGNÓSTICO)
  if (!hasValidDiagnosis) {
    return (
      <div className="p-6 flex flex-col items-center justify-center h-full text-center animate-fade-in min-h-[70vh]">
        <div className="w-20 h-20 bg-blue-50 text-blue-500 rounded-full flex items-center justify-center mb-6 animate-bounce">
          <Sparkles size={40} />
        </div>
        <h2 className="text-2xl font-bold text-slate-900 mb-2">Sem tratamento ativo</h2>
        <p className="text-slate-500 mb-8 max-w-xs mx-auto">Realize seu diagnóstico capilar para gerar um cronograma personalizado.</p>
        <Button onClick={() => navigate('/diagnosis')}>Iniciar Diagnóstico Grátis</Button>
      </div>
    );
  }

  // 2. PRIORIDADE MÉDIA: USUÁRIO COM DIAGNÓSTICO, MAS FREE (PAYWALL)
  if (user && user.subscription_tier === 'free') {
    return (
        <div className="p-6 max-w-md mx-auto pb-24 min-h-[80vh] flex flex-col items-center justify-center text-center animate-fade-in">
            <div className="w-24 h-24 bg-slate-100 rounded-full flex items-center justify-center mb-6 relative">
                <Lock size={40} className="text-slate-400" />
                <div className="absolute top-0 right-0 bg-blue-600 p-2 rounded-full border-4 border-white">
                    <Sparkles size={16} className="text-white" />
                </div>
            </div>
            <h2 className="text-2xl font-extrabold text-slate-900 mb-3">Cronograma Bloqueado</h2>
            <p className="text-slate-500 text-sm mb-8 leading-relaxed max-w-xs">
                Seu diagnóstico está pronto! Para acessar o <strong>Protocolo de 30 Dias</strong> e transformar seu cabelo, ative o Plano Básico.
            </p>
            
            <div className="w-full space-y-3">
                <Button onClick={() => navigate('/profile')} className="shadow-blue-600/30">
                    Desbloquear Agora (R$ 27,90)
                </Button>
                <button onClick={() => navigate('/diagnosis')} className="text-sm font-bold text-slate-400 hover:text-slate-600">
                    Ver meu Diagnóstico
                </button>
            </div>
        </div>
    );
  }

  // 3. PRIORIDADE PADRÃO: USUÁRIO PAGO
  const getDayLabel = (dayIndex: number) => {
    const date = new Date();
    date.setDate(date.getDate() + (dayIndex - 1));
    return weekDays[date.getDay()];
  };

  const todayProtocol = protocol.find(p => p.day === currentDay);
  const currentReminder = reminders.find(r => r.day === currentDay);

  return (
    <div className="p-6 max-w-md mx-auto pb-24 space-y-8 relative animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between pt-2">
        <button onClick={() => navigate('/home')} className="flex items-center gap-1 text-slate-600 hover:text-slate-900 transition-colors pl-0 pr-3 py-2 rounded-xl active:bg-slate-100">
          <ChevronLeft size={24} />
          <span className="font-bold text-sm">Voltar</span>
        </button>
        <div className="flex gap-2">
          <button onClick={() => navigate('/diagnosis')} className="text-blue-600 bg-blue-50 p-2 hover:bg-blue-100 rounded-full transition-colors flex items-center gap-2 px-3" title="Realizar Retorno">
            <RefreshCw size={18} />
            <span className="text-xs font-bold uppercase hidden sm:inline">Retorno</span>
          </button>
          <button onClick={openReminderModal} className="text-slate-400 p-2 hover:bg-slate-100 rounded-full transition-colors relative">
            <Bell size={24} /><span className="absolute top-1 right-2 w-2 h-2 bg-red-500 rounded-full"></span>
          </button>
          <button onClick={handleSyncCalendar} className="text-slate-400 p-2 hover:bg-slate-100 rounded-full transition-colors">
            <CalendarPlus size={24} />
          </button>
        </div>
      </div>

      <div><h2 className="text-3xl font-extrabold text-slate-900 leading-none mb-1">Cronograma</h2><p className="text-slate-500 text-sm">Acompanhe sua jornada de 30 dias.</p></div>

      {/* Horizontal Calendar Strip */}
      <div className="flex gap-3 overflow-x-auto no-scrollbar pb-4 -mx-6 px-6 snap-x">
        {protocol.slice(0, 10).map((day) => {
          const hasReminder = reminders.some(r => r.day === day.day);
          const isCompleted = day.completed;
          return (
            <button key={day.day} onClick={() => setCurrentDay(day.day)} className={`relative flex flex-col items-center justify-center min-w-[64px] h-[84px] rounded-[20px] transition-all snap-center group ${currentDay === day.day ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30 scale-105' : 'bg-white text-slate-400 border border-slate-100 hover:border-blue-200'} ${isCompleted ? 'border-green-200 bg-green-50' : ''}`}>
              {hasReminder && (<div className={`absolute top-1.5 right-1.5 w-2 h-2 rounded-full ${currentDay === day.day ? 'bg-white' : 'bg-blue-400'}`}></div>)}
              <span className={`text-[10px] font-bold tracking-wider mb-1 ${currentDay === day.day ? 'text-blue-100' : ''}`}>{getDayLabel(day.day)}</span>
              <span className="text-xl font-bold">{day.day}</span>
              {isCompleted && (<div className="mt-1"><div className={`w-5 h-5 rounded-full flex items-center justify-center ${currentDay === day.day ? 'bg-white text-green-600' : 'bg-green-500 text-white'}`}><Check size={12} strokeWidth={4} /></div></div>)}
              {!isCompleted && day.day >= currentDay && currentDay !== day.day && (<div className="w-1.5 h-1.5 bg-slate-200 rounded-full mt-2 group-hover:bg-blue-200"></div>)}
            </button>
          );
        })}
      </div>

      {/* Today's Card */}
      <div className={`rounded-[32px] p-6 shadow-xl shadow-slate-200/50 border relative overflow-hidden transition-all duration-500 ${todayProtocol?.completed ? 'bg-green-50 border-green-100' : 'bg-gradient-to-br from-white to-blue-50/50 border-slate-100/50'}`}>
        <div className="absolute top-0 right-0 w-32 h-32 bg-blue-100/50 rounded-full -mr-12 -mt-12 blur-2xl"></div>
        <div className="flex justify-between items-start mb-6 relative z-10">
           <div>
             <div className="flex items-center gap-2 mb-2">
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wide ${todayProtocol?.completed ? 'bg-green-200 text-green-800' : 'bg-blue-600 text-white'}`}>Dia {todayProtocol?.day}</span>
                {currentReminder && (<span className="bg-yellow-100 text-yellow-700 text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1"><Bell size={10} fill="currentColor" /> {currentReminder.time}</span>)}
             </div>
             <h3 className="text-3xl font-bold text-slate-900 leading-tight">{todayProtocol?.type}</h3>
           </div>
           <div className="bg-white p-3 rounded-2xl text-blue-600 shadow-sm border border-blue-50">{todayProtocol?.completed ? <Check size={24} className="text-green-600" /> : <Clock size={24} />}</div>
        </div>
        <div className="bg-white/60 backdrop-blur-sm p-4 rounded-2xl border border-white/50 mb-6"><p className="text-slate-600 text-sm leading-relaxed font-medium">{todayProtocol?.instruction}</p></div>
        <Button onClick={handleMarkAsDone} className={`shadow-blue-500/20 ${todayProtocol?.completed ? 'bg-green-500 hover:bg-green-600' : ''}`} disabled={todayProtocol?.completed}>{todayProtocol?.completed ? 'Concluído com Sucesso!' : 'Marcar como Feita'}</Button>
      </div>

      {/* Next Steps */}
      <div>
        <h3 className="font-bold text-slate-800 mb-4 px-1 text-lg">Próximas Etapas</h3>
        <div className="space-y-4">{protocol.slice(currentDay, currentDay + 2).map(day => { const reminder = reminders.find(r => r.day === day.day); return (<div key={day.day} className="bg-white p-5 rounded-[24px] border border-slate-100 flex gap-5 items-center shadow-sm hover:shadow-md transition-shadow relative"><div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center font-bold text-slate-500 shrink-0">{day.day}</div><div><div className="flex items-center gap-2"><h4 className="font-bold text-slate-900 text-base mb-0.5">{getDayLabel(day.day)} <span className="text-slate-300 mx-1">|</span> {day.type}</h4>{reminder && <Bell size={12} className="text-blue-500 fill-blue-500" />}</div><p className="text-xs text-slate-500 line-clamp-1">{day.instruction}</p></div></div>)})}</div>
      </div>

      {/* Products Carousel */}
      <div>
        <h3 className="font-bold text-slate-800 mb-4 px-1 text-lg">Produtos Recomendados</h3>
        <div className="flex gap-4 overflow-x-auto no-scrollbar pb-4 -mx-6 px-6">{[1, 2, 3].map(i => (<div key={i} className="min-w-[150px] bg-white p-4 rounded-[24px] border border-slate-100 flex flex-col items-center text-center shadow-sm group hover:border-blue-200 transition-colors"><div className="w-20 h-28 bg-slate-50 rounded-xl mb-3 mx-auto flex items-center justify-center relative overflow-hidden"><img src={`https://cdn-icons-png.flaticon.com/512/2652/${2652218 + i}.png`} className="w-16 h-16 opacity-80 mix-blend-multiply group-hover:scale-110 transition-transform" alt="product"/></div><p className="font-bold text-xs text-slate-900 mb-1">Máscara Hidratante</p><p className="text-[10px] text-slate-400 uppercase font-bold tracking-wide">Linha Premium</p></div>))}</div>
      </div>

      {/* Add Reminder Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-6 animate-fade-in">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity" onClick={() => setIsModalOpen(false)}></div>
          <div className="bg-white rounded-[32px] shadow-2xl w-full max-w-sm relative z-10 p-6 scale-100 transition-transform">
            <div className="flex justify-between items-center mb-6"><h3 className="text-lg font-bold text-slate-900 flex items-center gap-2"><div className="bg-blue-100 p-2 rounded-full text-blue-600"><Bell size={20} /></div>Novo Lembrete</h3><button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-slate-100 rounded-full transition-colors"><X size={20} className="text-slate-400" /></button></div>
            <div className="space-y-4">
              <div><label className="block text-xs font-bold text-slate-500 uppercase mb-2 pl-1">Dia do Protocolo</label><div className="relative"><select className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-slate-700 outline-none focus:ring-2 focus:ring-blue-500 appearance-none font-medium" value={newReminder.day} onChange={(e) => setNewReminder({...newReminder, day: Number(e.target.value)})}>{protocol.map(d => (<option key={d.day} value={d.day}>Dia {d.day} - {d.type} ({getDayLabel(d.day)})</option>))}</select><div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400"><ChevronLeft className="-rotate-90" size={16} /></div></div></div>
              <div><label className="block text-xs font-bold text-slate-500 uppercase mb-2 pl-1">Horário</label><div className="relative"><Clock size={18} className="absolute left-4 top-1/2 transform -translate-y-1/2 text-slate-400" /><input type="time" className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-11 pr-4 py-3 text-slate-700 outline-none focus:ring-2 focus:ring-blue-500 font-medium" value={newReminder.time} onChange={(e) => setNewReminder({...newReminder, time: e.target.value})} /></div></div>
              <div><label className="block text-xs font-bold text-slate-500 uppercase mb-2 pl-1">Nota (Opcional)</label><input type="text" placeholder="Ex: Comprar máscara..." className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-slate-700 outline-none focus:ring-2 focus:ring-blue-500 font-medium placeholder:font-normal" value={newReminder.note} onChange={(e) => setNewReminder({...newReminder, note: e.target.value})} /></div>
              <div className="pt-4"><Button onClick={handleSaveReminder} className="shadow-blue-600/20"><div className="flex items-center justify-center gap-2"><span>Salvar</span><CalendarPlus size={18} /></div></Button></div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};