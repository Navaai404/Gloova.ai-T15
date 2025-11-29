import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronRight, Sparkles, ScanLine, Droplet } from 'lucide-react';
import { Button } from '../components/Button';

export const Onboarding: React.FC = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState(0);

  const slides = [
    {
      title: "Diagnóstico Capilar IA",
      desc: "Tire 4 fotos do seu cabelo e nossa Inteligência Artificial analisa a saúde, curvatura e danos em segundos.",
      icon: <Sparkles size={48} className="text-white" />,
      bg: "bg-blue-600"
    },
    {
      title: "Scanner de Produtos",
      desc: "Fotografe o rótulo de qualquer cosmético. Nós dizemos se ele é compatível com o seu tratamento atual.",
      icon: <ScanLine size={48} className="text-white" />,
      bg: "bg-purple-600"
    },
    {
      title: "Cronograma de 30 Dias",
      desc: "Receba um calendário completo de Hidratação, Nutrição e Reconstrução feito sob medida para você.",
      icon: <Droplet size={48} className="text-white" />,
      bg: "bg-teal-500"
    }
  ];

  const handleNext = () => {
    if (step < slides.length - 1) {
      setStep(step + 1);
    } else {
      navigate('/home');
    }
  };

  return (
    <div className="h-screen bg-white flex flex-col relative overflow-hidden animate-fade-in">
      {/* Background Graphic */}
      <div className={`absolute top-0 left-0 right-0 h-[60%] ${slides[step].bg} transition-colors duration-500 rounded-b-[48px] flex items-center justify-center relative overflow-hidden`}>
         <div className="absolute inset-0 bg-black/10"></div>
         <div className="absolute -bottom-20 -right-20 w-64 h-64 bg-white/10 rounded-full blur-3xl"></div>
         <div className="relative z-10 p-10 bg-white/20 backdrop-blur-sm rounded-full border border-white/20 shadow-xl shadow-black/10 transition-transform duration-500 transform scale-100">
            {slides[step].icon}
         </div>
      </div>

      <div className="flex-1 flex flex-col items-center justify-between p-8 pt-12">
        <div className="text-center space-y-4">
           <h1 className="text-3xl font-extrabold text-slate-900 leading-tight transition-all duration-300">
             {slides[step].title}
           </h1>
           <p className="text-slate-500 font-medium leading-relaxed max-w-xs mx-auto transition-all duration-300">
             {slides[step].desc}
           </p>
        </div>

        <div className="w-full space-y-8">
           {/* Indicators */}
           <div className="flex justify-center gap-2">
             {slides.map((_, i) => (
               <div key={i} className={`h-2 rounded-full transition-all duration-300 ${i === step ? 'w-8 bg-slate-900' : 'w-2 bg-slate-200'}`}></div>
             ))}
           </div>

           <Button onClick={handleNext}>
             {step === slides.length - 1 ? 'Começar Jornada' : 'Próximo'}
             <ChevronRight size={20} />
           </Button>
        </div>
      </div>
    </div>
  );
};