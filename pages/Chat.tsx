import React, { useState, useEffect, useRef } from 'react';
import { Send, Sparkles, Lock, PlusCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { n8nService } from '../services/n8nService';
import { ChatMessage, DiagnosisResult, UserProfile } from '../types';
import { addPoints, POINTS } from '../services/gamification';
import { hasCredit, deductCredit, calculateChatCost } from '../services/monetization';
import { supabase } from '../lib/supabase';

export const Chat: React.FC = () => {
  const navigate = useNavigate();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [canChat, setCanChat] = useState(true);
  const scrollRef = useRef<HTMLDivElement>(null);

  const checkCredit = () => {
    const userStr = localStorage.getItem('gloova_user');
    if (userStr) {
        const user: UserProfile = JSON.parse(userStr);
        setCanChat(hasCredit(user, 'chat'));
    }
  };

  useEffect(() => {
    checkCredit();
    window.addEventListener('points-updated', checkCredit);
    
    setMessages([{
      id: 'init',
      sender: 'ai',
      text: 'Olá! Sou sua Assistente Capilar. Como posso ajudar com seu tratamento hoje?',
      timestamp: new Date()
    }]);

    return () => window.removeEventListener('points-updated', checkCredit);
  }, []);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isTyping]);

  const handleSend = async () => {
    if (!input.trim()) return;
    
    if (!canChat) {
        navigate('/profile');
        return;
    }

    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      sender: 'user',
      text: input,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsTyping(true);

    try {
      const storedDiag = localStorage.getItem('gloova_last_diagnosis');
      const diag: DiagnosisResult | null = storedDiag ? JSON.parse(storedDiag) : null;
      const userStr = localStorage.getItem('gloova_user');
      const user = userStr ? JSON.parse(userStr) : { id: 'guest', memory_key: 'temp' };

      const response = await n8nService.sendChatMessage({
        user_id: user.id,
        mensagem: userMsg.text,
        diagnostico_atual: diag,
        protocolo_30_dias: diag?.protocol_30_days,
        memory_key: user.memory_key,
        // CORREÇÃO: Envia explicitamente null se for undefined/vazio
        conversation_id: user.conversation_id ? user.conversation_id : null
      });
      
      const aiResponseText = response.resposta;
      
      // Se o N8N retornou um novo ID de conversa, salva no perfil
      if (response.conversation_id && response.conversation_id !== user.conversation_id) {
          const updatedUser = { ...user, conversation_id: response.conversation_id };
          localStorage.setItem('gloova_user', JSON.stringify(updatedUser));
          
          // Atualiza no Supabase silenciosamente
          if (user.id !== 'guest') {
              supabase.from('profiles')
                .update({ conversation_id: response.conversation_id })
                .eq('id', user.id)
                .then(() => console.log('Memory updated'));
          }
      }
      
      const cost = calculateChatCost(aiResponseText.length);
      deductCredit('chat', cost);
      
      const aiMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        sender: 'ai',
        text: aiResponseText,
        timestamp: new Date()
      };

      setMessages(prev => [...prev, aiMsg]);
      addPoints(POINTS.CHAT);
      
    } catch (error) {
      const errorMsg: ChatMessage = {
         id: 'error',
         sender: 'ai',
         text: 'Desculpe, tive um problema de conexão. Pode tentar novamente?',
         timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMsg]);
    } finally {
      setIsTyping(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-slate-50 animate-fade-in relative">
      {/* Header */}
      <div className="bg-white p-4 shadow-sm border-b border-slate-100 sticky top-0 z-10 flex justify-between items-center">
        <div className="flex items-center gap-2">
          <div className="bg-slate-900 p-2 rounded-lg text-yellow-400">
            <Sparkles size={18} />
          </div>
          <div>
            <h1 className="font-bold text-slate-800 text-sm">Assistente Capilar</h1>
            <p className="text-xs text-green-600 flex items-center gap-1">
              <span className="block w-2 h-2 rounded-full bg-green-500"></span> Online
            </p>
          </div>
        </div>
        
        {!canChat ? (
            <button onClick={() => navigate('/profile')} className="text-xs bg-red-100 text-red-600 px-3 py-1.5 rounded-lg font-bold flex items-center gap-1 hover:bg-red-200 transition-colors animate-pulse">
                <Lock size={12} /> Sem Tokens
            </button>
        ) : (
            <div className="text-[10px] font-bold text-slate-400 bg-slate-100 px-2 py-1 rounded border border-slate-200">
               IA Expert Ativa
            </div>
        )}
      </div>

      {/* Chat Area */}
      <div 
        ref={scrollRef}
        className="flex-1 overflow-y-auto p-4 space-y-4 no-scrollbar pb-40" 
      >
        {messages.map((msg) => (
          <div key={msg.id} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[85%] p-3.5 rounded-2xl text-sm leading-relaxed shadow-sm ${
              msg.sender === 'user' 
                ? 'bg-blue-600 text-white rounded-tr-none' 
                : 'bg-white text-slate-700 border border-slate-200 rounded-tl-none'
            }`}>
              {msg.text}
            </div>
          </div>
        ))}
        
        {isTyping && (
          <div className="flex justify-start">
            <div className="bg-white border border-slate-200 p-3 rounded-2xl rounded-tl-none flex gap-1 items-center h-10 shadow-sm">
              <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce"></span>
              <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce delay-75"></span>
              <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce delay-150"></span>
            </div>
          </div>
        )}

        {!canChat && (
            <div className="flex justify-center mt-4">
                <div className="bg-slate-900 text-white text-xs py-2 px-4 rounded-full shadow-lg flex items-center gap-2">
                    <Lock size={12} /> Seus tokens acabaram. Recarregue para continuar.
                </div>
            </div>
        )}
      </div>

      {/* Input Area */}
      <div className="fixed bottom-[88px] left-0 right-0 px-4 z-30 safe-area-bottom">
        <div className="bg-white/80 backdrop-blur-md border border-slate-200 p-2 rounded-2xl shadow-lg flex gap-2 max-w-md mx-auto">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            placeholder={canChat ? "Digite sua dúvida..." : "Tokens insuficientes..."}
            disabled={!canChat}
            className={`flex-1 border-0 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-blue-500 transition-all outline-none ${!canChat ? 'bg-slate-100 text-slate-400 cursor-not-allowed' : 'bg-white text-slate-800'}`}
          />
          
          {canChat ? (
            <button 
                onClick={handleSend}
                disabled={!input.trim() || isTyping}
                className="bg-blue-600 text-white p-3 rounded-xl hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-md shadow-blue-200 shrink-0"
            >
                <Send size={20} />
            </button>
          ) : (
            <button 
                onClick={() => navigate('/profile')}
                className="bg-green-500 text-white p-3 rounded-xl hover:bg-green-600 transition-colors shadow-md shadow-green-200 flex items-center justify-center gap-1 font-bold text-xs w-28 shrink-0"
            >
                <PlusCircle size={16} /> Recarregar
            </button>
          )}
        </div>
      </div>
    </div>
  );
};