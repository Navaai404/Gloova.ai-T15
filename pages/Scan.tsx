import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Camera, ChevronRight, Check, X, Sparkles, ScanLine, Info, ArrowUpCircle, Lock, PlusCircle } from 'lucide-react';
import { Button } from '../components/Button';
import { n8nService } from '../services/n8nService';
import { ProductScanResult, DiagnosisResult, UserProfile } from '../types';
import { addPoints, POINTS } from '../services/gamification';
import { hasCredit, deductCredit } from '../services/monetization';
import { supabase } from '../lib/supabase';

export const Scan: React.FC = () => {
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<ProductScanResult | null>(null);
  const [showIntro, setShowIntro] = useState(true);
  
  // Estado reativo para o usuário
  const [user, setUser] = useState<UserProfile | null>(null);
  const [canScan, setCanScan] = useState(false);

  useEffect(() => {
    let channel: any;
    const loadUser = () => {
        const userStr = localStorage.getItem('gloova_user');
        if (userStr) {
            const parsedUser = JSON.parse(userStr);
            setUser(parsedUser);
            setCanScan(hasCredit(parsedUser, 'scan'));
            return parsedUser;
        }
        return null;
    };

    const currentUser = loadUser();

    if (currentUser) {
        // REALTIME LISTENER: Atualiza saldo de scan na hora
        channel = supabase
          .channel('scan-credits-update')
          .on(
            'postgres_changes',
            { event: 'UPDATE', schema: 'public', table: 'profiles', filter: `id=eq.${currentUser.id}` },
            (payload) => {
                console.log("Scan: Créditos atualizados!", payload);
                if (payload.new) {
                    const updatedUser = payload.new as UserProfile;
                    setUser(updatedUser);
                    localStorage.setItem('gloova_user', JSON.stringify(updatedUser));
                    setCanScan(hasCredit(updatedUser, 'scan'));
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

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
        setResult(null);
        setShowIntro(false);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleScan = async () => {
    if (!imagePreview) return;
    
    setIsLoading(true);
    try {
      const storedDiag = localStorage.getItem('gloova_last_diagnosis');
      const diag: DiagnosisResult | null = storedDiag ? JSON.parse(storedDiag) : null;
      
      const payload = {
        user_id: user?.id || 'guest',
        image_base64: imagePreview,
        diagnostico_atual: diag,
        protocolo_30_dias: diag?.protocol_30_days,
        memory_key: user?.memory_key || 'temp',
        conversation_id: user?.conversation_id || null
      };

      const scanResult = await n8nService.scanProduct(payload);
      setResult(scanResult);
      
      deductCredit('scan');
      addPoints(POINTS.SCAN);
      
    } catch (error) {
      alert("Erro ao analisar imagem.");
    } finally {
      setIsLoading(false);
    }
  };

  const resetScan = () => {
    setResult(null);
    setImagePreview(null);
    setShowIntro(true);
  };

  const onCameraClick = () => {
    if (canScan) {
        fileInputRef.current?.click();
    } else {
        navigate('/profile'); 
    }
  };

  // PAYWALL VIEW (NO CREDITS)
  if (user && !canScan) {
      return (
        <div className="p-6 max-w-md mx-auto h-full flex flex-col items-center justify-center text-center animate-fade-in pb-24">
            <div className="w-24 h-24 bg-slate-100 rounded-full flex items-center justify-center mb-6 relative">
                <ScanLine size={40} className="text-slate-400" />
                <div className="absolute top-0 right-0 bg-purple-600 p-2 rounded-full border-4 border-white">
                    <Lock size={16} className="text-white" />
                </div>
            </div>
            <h2 className="text-2xl font-extrabold text-slate-900 mb-3">Scanner Bloqueado</h2>
            <p className="text-slate-500 text-sm mb-8 leading-relaxed max-w-xs">
                Você utilizou todos os seus créditos de análise de produtos. Recarregue para continuar descobrindo o que é melhor para seu cabelo.
            </p>
            
            <div className="flex flex-col gap-3 w-full">
                <div className="bg-purple-50 p-4 rounded-xl border border-purple-100">
                    <p className="text-xs font-bold text-purple-800 uppercase mb-1">Saldo Atual</p>
                    <p className="text-2xl font-bold text-purple-600">{user.scan_credits || 0}</p>
                </div>
                <Button onClick={() => navigate('/profile')} className="shadow-purple-600/30 bg-purple-600 hover:bg-purple-700">
                    <div className="flex items-center gap-2">
                        <span>Adicionar Scans</span>
                        <PlusCircle size={20} />
                    </div>
                </Button>
            </div>
        </div>
      );
  }

  // 1. RESULT VIEW
  if (result) {
    return (
      <div className="p-6 max-w-md mx-auto pb-24 animate-fade-in">
        <h1 className="text-2xl font-bold text-slate-900 mb-4">Resultado da Análise</h1>
        
        <div className="bg-white rounded-[32px] overflow-hidden shadow-xl shadow-slate-200/50 border border-slate-100">
          <div className="h-56 bg-slate-50 flex items-center justify-center p-6 relative">
             <div className="absolute top-4 right-4 bg-white/90 backdrop-blur px-3 py-1 rounded-full border border-slate-100 flex items-center gap-1 text-xs font-bold text-blue-600 shadow-sm">
                <Sparkles size={12} /> IA Analyzed
             </div>
             <img src={imagePreview!} alt="Product" className="h-full object-contain drop-shadow-2xl mix-blend-multiply" />
          </div>
          
          <div className="p-6">
            <div className="mb-6">
               <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">{result.category}</p>
               <h2 className="text-2xl font-extrabold text-slate-900 leading-tight mb-3">{result.product_name}</h2>
               
               <div className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold border w-full justify-center ${result.is_compatible ? 'bg-green-50 text-green-700 border-green-100' : 'bg-red-50 text-red-700 border-red-100'}`}>
                 {result.is_compatible ? <Check size={18} strokeWidth={3} /> : <X size={18} strokeWidth={3} />}
                 {result.is_compatible ? 'Compatível com seu cabelo' : 'Não recomendado agora'}
               </div>
            </div>

            <div className="space-y-6">
              <div className="bg-slate-50 p-5 rounded-2xl border border-slate-100">
                <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 flex items-center gap-2">
                    <Info size={14} /> Por que esse resultado?
                </h3>
                <p className="text-slate-700 text-sm leading-relaxed font-medium">
                    {result.reason}
                </p>
              </div>

              <div>
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Funções Principais</h3>
                <p className="text-slate-600 text-sm bg-white border border-slate-100 p-3 rounded-xl">
                  {result.functions}
                </p>
              </div>

              <div>
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Recomendação de Uso</h3>
                <p className="text-slate-600 text-sm bg-blue-50/50 border border-blue-100 p-3 rounded-xl text-blue-800">
                  {result.usage_recommendation}
                </p>
              </div>
            </div>
            
            <div className="mt-8">
               <Button onClick={resetScan} variant="outline">Escanear outro produto</Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // 2. INTRO VIEW
  if (showIntro) {
      return (
        <div className="p-6 max-w-md mx-auto h-full flex flex-col pt-4 animate-fade-in">
            <div className="mb-6">
                <h1 className="text-3xl font-extrabold text-slate-900 leading-tight">Scanner de<br/>Produtos</h1>
                <p className="text-slate-500 text-sm mt-2">A inteligência artificial analisa a composição e te diz se o produto serve para você.</p>
            </div>

            <div className="bg-white p-6 rounded-[32px] shadow-xl shadow-slate-200/50 border border-slate-100 mb-8 space-y-6">
                <div className="flex gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                        <ScanLine size={24} />
                    </div>
                    <div>
                        <h3 className="font-bold text-slate-900">Identificação</h3>
                        <p className="text-xs text-slate-500 leading-relaxed mt-1">Reconhecemos o produto pelo rótulo ou embalagem automaticamente.</p>
                    </div>
                </div>
                <div className="flex gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-green-50 text-green-600 flex items-center justify-center shrink-0">
                        <Check size={24} />
                    </div>
                    <div>
                        <h3 className="font-bold text-slate-900">Compatibilidade</h3>
                        <p className="text-xs text-slate-500 leading-relaxed mt-1">Dizemos se ele combina com a fase atual do seu cronograma.</p>
                    </div>
                </div>
            </div>

            <div className="mt-auto mb-8">
                <Button onClick={onCameraClick}>
                    <div className="flex items-center gap-2">
                        <Camera size={20} />
                        Tirar Foto do Produto
                    </div>
                </Button>
                <input 
                    type="file" 
                    ref={fileInputRef} 
                    className="hidden" 
                    accept="image/*" 
                    capture="environment"
                    onChange={handleFileChange}
                />
                <p className="text-center text-[10px] text-slate-400 mt-3 font-bold uppercase tracking-wide">
                    Você tem {user?.scan_credits || 0} scans disponíveis
                </p>
            </div>
        </div>
      );
  }

  // 3. PREVIEW & SEND
  return (
    <div className="p-6 max-w-md mx-auto h-full flex flex-col pt-4 animate-fade-in">
       <div className="flex justify-between items-center mb-6">
          <h1 className="text-xl font-bold text-slate-900">Confirmar Envio</h1>
          <button onClick={resetScan} className="text-slate-400 hover:text-slate-600"><X size={24}/></button>
       </div>

       <div className="bg-white p-4 rounded-[32px] shadow-lg border border-slate-100 flex-1 flex flex-col">
          <div className="flex-1 relative rounded-2xl overflow-hidden bg-slate-900">
             <img src={imagePreview!} alt="Preview" className="w-full h-full object-contain" />
          </div>
          <div className="pt-6 pb-2">
             <div className="space-y-3">
                <Button onClick={handleScan} isLoading={isLoading}>
                    <div className="flex items-center gap-2">
                        <span>Enviar para Análise</span>
                        <ArrowUpCircle size={20} />
                    </div>
                </Button>
                <button 
                    onClick={() => fileInputRef.current?.click()} 
                    className="w-full py-3 text-sm font-bold text-slate-500 hover:text-slate-700"
                >
                    Tirar outra foto
                </button>
             </div>
          </div>
       </div>
    </div>
  );
};