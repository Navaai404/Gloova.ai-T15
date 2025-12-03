import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Camera, ChevronLeft, Info, CheckCircle, Package, Heart, AlertCircle, Plus, RefreshCw, Share2, ArrowRight, DollarSign, ZoomIn, User, Search } from 'lucide-react';
import { Button } from '../components/Button';
import { n8nService } from '../services/n8nService';
import { DiagnosisResult, UserProfile, QuizData } from '../types';
import { addPoints, POINTS } from '../services/gamification';
import { hasCredit, deductCredit } from '../services/monetization';
import { supabase } from '../lib/supabase'; 

type PhotoAngle = 'Frente' | 'Costas' | 'Pontas (Zoom)' | 'Couro Cabeludo';
type DiagnosisStep = 'photos' | 'quiz' | 'analyzing' | 'result';

// --- QUIZ CONFIGURATION ---
const QUESTIONS = [
  { id: 'main_concern', question: 'Qual é a maior preocupação com seu cabelo hoje?', options: ['Queda', 'Ressecamento', 'Frizz', 'Pontas duplas', 'Caspa/descamação', 'Oleosidade', 'Falta de brilho', 'Lentidão no crescimento', 'Outro'] },
  { id: 'concern_duration', question: 'Esse problema começou há quanto tempo?', options: ['Menos de 1 mês', '1 a 3 meses', '3 a 6 meses', 'Mais de 6 meses', 'Não sei dizer'] },
  { id: 'wash_frequency', question: 'Quantas vezes por semana você lava o cabelo?', options: ['1x', '2x', '3x', '4x ou mais'] },
  { id: 'heat_tools', question: 'Você usa secador, chapinha ou modelador?', options: ['Diariamente', 'Algumas vezes por semana', 'Raramente', 'Nunca'] },
  { id: 'chemical_history', question: 'Você faz algum tipo de química no cabelo?', options: ['Progressiva', 'Tintura', 'Descoloração', 'Relaxamento', 'Nenhuma', 'Não sei dizer'] },
  { id: 'scalp_type', question: 'Como é seu couro cabeludo?', options: ['Seco', 'Normal', 'Oleoso', 'Sensível/irritado', 'Não sei identificar'] },
  { id: 'treatment_goal', question: 'Qual é o seu principal objetivo com o tratamento?', options: ['Crescimento', 'Reduzir queda', 'Controlar oleosidade', 'Reduzir frizz', 'Reconstruir a fibra', 'Aumentar brilho', 'Fortalecer couro cabeludo'] },
  { id: 'budget_preference', question: 'Qual faixa de valor de produtos você prefere?', description: 'Isso ajuda a IA a indicar produtos que cabem no seu bolso.', options: ['Produtos Premium (Investimento alto)', 'Valor Médio (Custo-benefício)', 'Baixo Custo (Acessíveis)'], icon: <DollarSign size={24} className="text-green-500 mb-2" /> },
  { id: 'allergies', question: 'Você possui alergia ou sensibilidade a algum ingrediente?', options: ['Não', 'Sim', 'Não sei'] },
  { id: 'previous_schedule', question: 'Você já tentou seguir cronograma capilar?', options: ['Sim', 'Não', 'Já tentei, mas parei'] },
  { id: 'dedication_time', question: 'Quanto tempo por semana você pode dedicar?', options: ['10 a 15 min', '20 a 30 min', '1 hora', 'O que for necessário'] }
];

export const Diagnosis: React.FC = () => {
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [step, setStep] = useState<DiagnosisStep>('photos');
  const [quizIndex, setQuizIndex] = useState(0);
  const [quizData, setQuizData] = useState<Partial<QuizData>>({});
  const [photos, setPhotos] = useState<Record<string, string>>({});
  const [activeAngle, setActiveAngle] = useState<PhotoAngle | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<DiagnosisResult | null>(null);

  const angles: { id: PhotoAngle; label: string; icon: any; desc: string }[] = [
      { id: 'Frente', label: 'Frente', icon: User, desc: 'Rosto visível, cabelo solto' },
      { id: 'Costas', label: 'Costas', icon: User, desc: 'Comprimento total nas costas' },
      { id: 'Pontas (Zoom)', label: 'Pontas', icon: ZoomIn, desc: 'Zoom nos últimos 5cm dos fios' },
      { id: 'Couro Cabeludo', label: 'Couro Cabeludo', icon: Search, desc: 'Divida ao meio e foque na raiz' }
  ];

  useEffect(() => {
      try {
          const stored = localStorage.getItem('gloova_last_diagnosis');
          if (stored) { /* Optional load */ }
      } catch (e) {
          console.error("Erro ao carregar diag", e);
          localStorage.removeItem('gloova_last_diagnosis');
      }
  }, []);

  const handlePhotoClick = (angle: any) => {
    setActiveAngle(angle);
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && activeAngle) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPhotos(prev => ({ ...prev, [activeAngle]: reader.result as string }));
      };
      reader.readAsDataURL(file);
    }
  };

  const isPhotosComplete = angles.every(item => photos[item.id]);

  const handleStartQuiz = () => {
    try {
        const userStr = localStorage.getItem('gloova_user');
        if (userStr) {
            const user: UserProfile = JSON.parse(userStr);
            if (!hasCredit(user, 'diagnosis')) {
                const confirm = window.confirm("Você não tem créditos de Diagnóstico suficientes. Deseja adquirir mais?");
                if (confirm) navigate('/profile');
                return;
            }
        }
    } catch (e) { console.error("User parse error", e); }
    setStep('quiz');
  };

  const handleQuizAnswer = (answer: string) => {
    const currentQ = QUESTIONS[quizIndex];
    setQuizData(prev => ({ ...prev, [currentQ.id]: answer }));
    if (quizIndex < QUESTIONS.length - 1) {
      setQuizIndex(prev => prev + 1);
    } else {
      handleFinalizeAnalysis({ ...quizData, [currentQ.id]: answer } as QuizData);
    }
  };

  const handleBackQuiz = () => {
    if (quizIndex > 0) {
      setQuizIndex(prev => prev - 1);
    } else {
      setStep('photos');
    }
  };

  const handleFinalizeAnalysis = async (finalQuizData: QuizData) => {
    setStep('analyzing');
    setIsLoading(true);

    try {
      const userStr = localStorage.getItem('gloova_user');
      const user: UserProfile = userStr ? JSON.parse(userStr) : { id: 'guest', memory_key: 'temp', email: '' };

      const payload = {
        user_id: user.id,
        image_base64: photos['Frente'], 
        additional_images: photos,      
        historico_usuario: null, 
        memory_key: user.memory_key || user.id, 
        quiz_data: finalQuizData,
        // CORREÇÃO: Envia null se não existir, para o JSON stringify não remover a chave
        conversation_id: user.conversation_id ? user.conversation_id : null
      };

      const diagnosis = await n8nService.submitDiagnosis(payload);
      setResult(diagnosis);
      setStep('result');
      
      localStorage.setItem('gloova_last_diagnosis', JSON.stringify(diagnosis));
      deductCredit('diagnosis');
      addPoints(POINTS.DIAGNOSIS);

      if (user.referred_by) {
        const isFirstTime = !localStorage.getItem('has_completed_first_diag');
        if (isFirstTime) {
            console.log(`Referral engagement tracked: ${user.referred_by}`);
            localStorage.setItem('has_completed_first_diag', 'true');
        }
      }
      
    } catch (error) {
      console.error(error);
      alert("Erro ao analisar. Tente novamente.");
      setStep('photos');
    } finally {
      setIsLoading(false);
    }
  };

  const handleShare = () => {
    if (!result) return;
    const text = `Meu Relatório Capilar Gloova.ai 💙\nSaúde Geral: ${result.overall_health}\nCurvatura: ${result.curvature}\nDescubra o protocolo ideal em Gloova.ai`;
    if (navigator.share) {
      navigator.share({ title: 'Meu Diagnóstico Gloova.ai', text: text }).catch(console.error);
    } else {
      navigator.clipboard.writeText(text);
      alert('Copiado!');
    }
  };

  // --- RENDERERS ---
  if (step === 'analyzing') {
    return (
      <div className="flex flex-col items-center justify-center min-h-[80vh] p-6 text-center animate-fade-in">
         <div className="w-24 h-24 bg-blue-50 rounded-full flex items-center justify-center mb-6 relative">
            <div className="absolute inset-0 border-4 border-blue-100 rounded-full animate-ping opacity-20"></div>
            <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
         </div>
         <h2 className="text-2xl font-bold text-slate-900 mb-2">Analisando seu cabelo...</h2>
         <p className="text-slate-500 max-w-xs">A IA está cruzando suas fotos com as respostas do quiz para criar o protocolo perfeito.</p>
      </div>
    );
  }

  if (step === 'result' && result) {
    const healthScore = 64; 
    return (
      <div className="p-6 max-w-md mx-auto pb-24 space-y-6 animate-fade-in">
         <div className="flex items-center gap-2 mb-2">
           <button onClick={() => { setResult(null); setStep('photos'); }} className="p-2 -ml-2 rounded-full hover:bg-slate-100 transition-colors"><ChevronLeft className="text-slate-600" /></button>
           <h1 className="text-xl font-bold text-slate-900">Relatório Capilar</h1>
         </div>
         <div className="bg-slate-900 rounded-[32px] p-6 text-white shadow-xl shadow-slate-900/20 flex items-center justify-between relative overflow-hidden">
            <button className="absolute top-4 right-4 bg-white/10 hover:bg-white/20 p-2 rounded-full text-white backdrop-blur-sm transition-colors z-20" onClick={handleShare}><Share2 size={18} /></button>
            <div className="relative z-10">
                <p className="text-slate-400 text-xs font-bold uppercase tracking-wider mb-1">Saúde Geral</p>
                <h2 className="text-3xl font-bold">{result.overall_health || '-'}</h2>
                <div className="flex items-center gap-2 mt-2"><span className="bg-white/10 px-2 py-1 rounded text-xs text-slate-300 border border-white/10">Curvatura {result.curvature}</span></div>
            </div>
            <div className="relative w-24 h-24 mr-2">
                <div className="w-full h-full rounded-full border-4 border-blue-500 flex items-center justify-center bg-white/5"><span className="text-2xl font-bold">{healthScore}</span></div>
            </div>
         </div>
         <div className="bg-white rounded-[24px] p-6 border border-slate-100 shadow-sm">
            <h3 className="font-bold text-slate-900 mb-4 flex items-center gap-2"><AlertCircle size={18} className="text-blue-600" /> Análise Técnica</h3>
            <div className="space-y-4">
                <MetricBar label="Oleosidade" value={result.oiliness} />
                <MetricBar label="Porosidade" value={result.porosity} />
                <MetricBar label="Danos" value={result.damage_level} />
                <div className="bg-slate-50 p-4 rounded-xl text-sm text-slate-600 leading-relaxed mt-4 italic">"{result.analysis_text}"</div>
            </div>
         </div>
         <div className="bg-white rounded-[24px] p-6 border border-slate-100 shadow-sm">
            <h3 className="font-bold text-slate-900 mb-4 flex items-center gap-2"><Package size={18} className="text-purple-500" /> Produtos Indicados</h3>
            <div className="grid grid-cols-2 gap-3">
                <ProductCard type="Shampoo" name="Hidratação Suave" />
                <ProductCard type="Máscara" name="Nutrição Profunda" />
            </div>
         </div>
         <Button onClick={() => navigate('/protocol')}>Ver Cronograma Completo</Button>
      </div>
    );
  }

  // RENDER PHOTOS STEP
  if (step === 'photos') {
    return (
      <div className="p-6 max-w-md mx-auto min-h-full flex flex-col animate-fade-in pt-4">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-slate-900">Novo Diagnóstico</h1>
          <p className="text-slate-500 text-sm mt-1">Envie 4 fotos específicas para análise técnica detalhada.</p>
        </div>

        <div className="grid grid-cols-2 gap-4 mb-6">
          {angles.map((item) => (
              <button
                  key={item.id}
                  onClick={() => handlePhotoClick(item.id)}
                  className={`aspect-[4/5] rounded-[24px] border-2 border-dashed flex flex-col items-center justify-center relative overflow-hidden transition-all group p-2 text-center ${
                      photos[item.id] 
                      ? 'border-blue-500 bg-white' 
                      : 'border-slate-200 bg-slate-50 hover:bg-slate-100'
                  }`}
              >
                  {photos[item.id] ? (
                      <>
                        <img src={photos[item.id]} alt={item.label} className="absolute inset-0 w-full h-full object-cover" />
                        <div className="absolute bottom-2 right-2 bg-green-500 text-white p-1 rounded-full shadow-md">
                            <CheckCircle size={14} />
                        </div>
                        <div className="absolute bottom-0 left-0 right-0 bg-black/50 text-white text-[10px] py-1 font-bold backdrop-blur-sm">
                            {item.label}
                        </div>
                      </>
                  ) : (
                      <>
                          <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center text-blue-500 shadow-sm mb-2 group-hover:scale-110 transition-transform">
                              <Plus size={20} />
                          </div>
                          <span className="text-xs font-bold text-slate-700 uppercase tracking-wide mb-1">{item.label}</span>
                          <span className="text-[9px] text-slate-400 leading-tight">{item.desc}</span>
                      </>
                  )}
              </button>
          ))}
        </div>
        
        <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleFileChange} />

        <div className="mt-auto mb-6 bg-blue-50 p-4 rounded-2xl border border-blue-100 flex gap-3">
          <Info className="text-blue-600 shrink-0" size={20} />
          <div className="text-xs text-blue-800 leading-relaxed">
             <p className="font-bold mb-1">Dica do Especialista:</p>
             Use boa iluminação. Para a foto do couro cabeludo, peça ajuda ou use o timer. Isso define se você tem caspa ou oleosidade.
          </div>
        </div>

        <Button onClick={handleStartQuiz} disabled={!isPhotosComplete}>
            Continuar para Perguntas <ArrowRight size={20} />
        </Button>
      </div>
    );
  }

  return null;
};

const MetricBar = ({ label, value }: { label: string, value: string }) => {
    const safeValue = value || '';
    return (<div className="flex items-center justify-between text-sm"><span className="text-slate-600 font-medium">{label}</span><div className="flex items-center gap-2"><div className="w-24 h-2 bg-slate-100 rounded-full overflow-hidden"><div className={`h-full rounded-full ${safeValue.includes('Alt') ? 'bg-red-400 w-[90%]' : safeValue.includes('Méd') ? 'bg-yellow-400 w-[60%]' : 'bg-green-400 w-[30%]'}`}></div></div><span className="text-slate-900 font-bold min-w-[3ch] text-right">{safeValue || '-'}</span></div></div>);
};

const ProductCard = ({ type, name }: { type: string, name: string }) => (
    <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 text-center"><div className="w-10 h-10 bg-white rounded-full mx-auto mb-2 shadow-sm flex items-center justify-center"><Package size={18} className="text-slate-400" /></div><p className="text-[10px] uppercase font-bold text-slate-400">{type}</p><p className="text-xs font-bold text-slate-800">{name}</p></div>
);