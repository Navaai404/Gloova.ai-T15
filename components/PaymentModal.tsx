import React, { useState } from 'react';
import { X, CreditCard, QrCode, CheckCircle, Lock, Copy, ExternalLink } from 'lucide-react';
import { Button } from './Button';
import { n8nService, CheckoutResponse } from '../services/n8nService';
import { UserProfile } from '../types';

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  itemName: string;
  price: number;
}

export const PaymentModal: React.FC<PaymentModalProps> = ({ isOpen, onClose, onSuccess, itemName, price }) => {
  const [method, setMethod] = useState<'credit' | 'pix'>('pix');
  const [loading, setLoading] = useState(false);
  const [paymentData, setPaymentData] = useState<CheckoutResponse | null>(null);
  const [success, setSuccess] = useState(false);

  if (!isOpen) return null;

  const handleCreatePayment = async (selectedMethod: 'pix' | 'credit') => {
    setLoading(true);
    setPaymentData(null);
    try {
        const userStr = localStorage.getItem('gloova_user');
        const user: UserProfile = userStr ? JSON.parse(userStr) : { id: 'guest' };
        
        const data = await n8nService.createCheckout(
            user.id, 
            { name: itemName, price: price, type: 'credits' },
            selectedMethod
        );
        
        setPaymentData(data);
    } catch (e) {
        alert("Erro ao gerar pagamento");
    } finally {
        setLoading(false);
    }
  };

  const handleCopyPix = () => {
    if (paymentData?.pixCode) {
        navigator.clipboard.writeText(paymentData.pixCode);
        alert("Código Pix copiado!");
        
        // Simulação: Confirma o pagamento automaticamente após copiar
        setTimeout(() => {
            setSuccess(true);
            setTimeout(() => {
                onSuccess();
                setSuccess(false);
                onClose();
            }, 2000);
        }, 4000);
    }
  };

  const handleOpenLink = () => {
      if (paymentData?.checkoutUrl) {
          // Em produção, isso abriria o Mercado Pago
          // Aqui simulamos que o usuário foi, pagou e voltou
          alert("Em um app real, isso abriria a página segura do Mercado Pago.");
          setSuccess(true);
          setTimeout(() => {
            onSuccess();
            setSuccess(false);
            onClose();
          }, 2000);
      }
  };

  if (success) {
    return (
      <div className="fixed inset-0 z-[60] flex items-center justify-center p-6 animate-fade-in">
        <div className="absolute inset-0 bg-slate-900/80 backdrop-blur-sm"></div>
        <div className="bg-white rounded-[32px] shadow-2xl w-full max-w-sm relative z-10 p-8 text-center transform scale-105 transition-all">
          <div className="w-20 h-20 bg-green-100 text-green-500 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle size={40} strokeWidth={3} />
          </div>
          <h2 className="text-2xl font-bold text-slate-900 mb-2">Pagamento Confirmado!</h2>
          <p className="text-slate-500">Seus créditos/plano já estão ativos.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-6 animate-fade-in">
      <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={onClose}></div>
      <div className="bg-white rounded-[32px] shadow-2xl w-full max-w-sm relative z-10 overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="bg-slate-50 p-6 border-b border-slate-100 flex justify-between items-center">
          <div>
             <h3 className="font-bold text-slate-900 text-lg">Checkout Seguro</h3>
             <div className="flex items-center gap-1 text-xs text-green-600 font-bold mt-1">
                <Lock size={10} /> Encriptação SSL 256-bit
             </div>
          </div>
          <button onClick={onClose} className="p-2 bg-white rounded-full text-slate-400 hover:text-slate-600 shadow-sm">
            <X size={20} />
          </button>
        </div>

        <div className="p-6 overflow-y-auto">
           {/* Item Summary */}
           <div className="flex justify-between items-center mb-6 pb-6 border-b border-slate-100">
              <div>
                 <p className="text-xs text-slate-400 font-bold uppercase">Item</p>
                 <p className="font-bold text-slate-800">{itemName}</p>
              </div>
              <div className="text-right">
                 <p className="text-xs text-slate-400 font-bold uppercase">Total</p>
                 <p className="font-bold text-blue-600 text-xl">R$ {price.toFixed(2).replace('.', ',')}</p>
              </div>
           </div>

           {/* Payment Method Toggle */}
           <div className="flex gap-3 mb-6">
              <button 
                onClick={() => { setMethod('pix'); setPaymentData(null); }}
                className={`flex-1 p-4 rounded-xl border-2 flex flex-col items-center gap-2 transition-all ${method === 'pix' ? 'border-blue-600 bg-blue-50 text-blue-700' : 'border-slate-100 text-slate-400'}`}
              >
                <QrCode size={24} />
                <span className="text-xs font-bold">Pix</span>
              </button>
              <button 
                onClick={() => { setMethod('credit'); setPaymentData(null); }}
                className={`flex-1 p-4 rounded-xl border-2 flex flex-col items-center gap-2 transition-all ${method === 'credit' ? 'border-blue-600 bg-blue-50 text-blue-700' : 'border-slate-100 text-slate-400'}`}
              >
                <CreditCard size={24} />
                <span className="text-xs font-bold">Cartão</span>
              </button>
           </div>

           {/* Content Area */}
           <div className="min-h-[160px] flex flex-col justify-center">
             {loading ? (
                <div className="text-center py-8">
                   <div className="animate-spin w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full mx-auto mb-4"></div>
                   <p className="text-sm font-bold text-slate-500">Gerando cobrança...</p>
                </div>
             ) : (
                <>
                  {method === 'pix' ? (
                     <div className="text-center bg-slate-50 rounded-xl border-2 border-slate-200 border-dashed p-4">
                        {paymentData?.pixCode ? (
                            <div className="animate-fade-in">
                                <div className="bg-white p-2 w-32 h-32 mx-auto mb-4 border border-slate-200 rounded-lg">
                                   <QrCode size={110} className="text-slate-900" />
                                </div>
                                <p className="text-xs text-slate-500 font-medium mb-3">Copie o código e pague no seu banco.</p>
                                <div className="bg-white border border-slate-200 rounded-lg p-3 flex items-center justify-between gap-2">
                                     <span className="text-[10px] text-slate-400 truncate font-mono flex-1 text-left">{paymentData.pixCode.substring(0, 20)}...</span>
                                     <button onClick={handleCopyPix} className="text-blue-600 text-xs font-bold uppercase flex items-center gap-1 hover:text-blue-700 shrink-0">
                                        <Copy size={12} /> Copiar
                                     </button>
                                </div>
                            </div>
                        ) : (
                            <div className="py-4">
                                <QrCode size={48} className="mx-auto text-slate-300 mb-3" />
                                <p className="text-xs text-slate-400 font-medium">Pagamento instantâneo via QR Code</p>
                            </div>
                        )}
                     </div>
                  ) : (
                     <div className="text-center bg-blue-50/50 rounded-xl border border-blue-100 p-6">
                        {paymentData?.checkoutUrl ? (
                            <div className="animate-fade-in">
                                <div className="w-16 h-16 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-3">
                                   <ExternalLink size={32} />
                                </div>
                                <p className="text-sm font-bold text-slate-700 mb-1">Link Gerado!</p>
                                <p className="text-xs text-slate-500 mb-4">Clique abaixo para pagar com segurança no Mercado Pago.</p>
                            </div>
                        ) : (
                             <div className="py-2">
                                <CreditCard size={48} className="mx-auto text-slate-300 mb-3" />
                                <p className="text-xs text-slate-400 font-medium max-w-[200px] mx-auto">Aceitamos Crédito e Débito via checkout seguro.</p>
                             </div>
                        )}
                     </div>
                  )}
                </>
             )}
           </div>
        </div>

        {/* Footer Actions */}
        <div className="p-6 pt-0 mt-auto">
           {!paymentData && !loading && (
             <Button onClick={() => handleCreatePayment(method)}>
               {method === 'pix' ? 'Gerar Código Pix' : 'Gerar Link de Pagamento'}
             </Button>
           )}
           
           {paymentData && method === 'credit' && (
             <Button onClick={handleOpenLink} className="bg-blue-600 hover:bg-blue-700">
               Ir para Pagamento Seguro <ExternalLink size={18} />
             </Button>
           )}

           {paymentData && method === 'pix' && (
             <Button onClick={handleCopyPix} variant="outline" className="border-green-500 text-green-600 hover:bg-green-50">
               Já paguei (Confirmar)
             </Button>
           )}
        </div>
      </div>
    </div>
  );
};