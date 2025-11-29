import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, FileText, Shield } from 'lucide-react';

export const Legal: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-slate-50 pb-10 animate-fade-in">
       <div className="bg-white p-6 pb-4 border-b border-slate-100 sticky top-0 z-10 flex items-center gap-2">
         <button onClick={() => navigate(-1)} className="p-2 -ml-2 rounded-full hover:bg-slate-100"><ChevronLeft className="text-slate-600" /></button>
         <h1 className="text-xl font-bold text-slate-900">Termos & Privacidade</h1>
       </div>

       <div className="p-6 space-y-6 max-w-md mx-auto">
          <div className="bg-white p-6 rounded-[24px] shadow-sm border border-slate-100">
             <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center"><FileText size={20} /></div>
                <h2 className="font-bold text-lg text-slate-900">Termos de Uso</h2>
             </div>
             <p className="text-sm text-slate-600 leading-relaxed mb-4">
               1. O Gloova.ai utiliza inteligência artificial para fornecer recomendações. Estas não substituem conselho médico profissional.<br/><br/>
               2. As assinaturas são renovadas automaticamente, a menos que canceladas com 24h de antecedência.<br/><br/>
               3. Os créditos de IA (tokens) são consumidos conforme o uso no chat e diagnósticos.
             </p>
          </div>

          <div className="bg-white p-6 rounded-[24px] shadow-sm border border-slate-100">
             <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-green-50 text-green-600 rounded-full flex items-center justify-center"><Shield size={20} /></div>
                <h2 className="font-bold text-lg text-slate-900">Política de Privacidade</h2>
             </div>
             <p className="text-sm text-slate-600 leading-relaxed mb-4">
               1. Suas fotos são processadas pela IA e armazenadas de forma segura. Não vendemos seus dados.<br/><br/>
               2. Coletamos dados de uso para melhorar o algoritmo de recomendação de produtos.<br/><br/>
               3. Você pode solicitar a exclusão da sua conta e dados a qualquer momento no painel de perfil.
             </p>
          </div>
       </div>
    </div>
  );
};