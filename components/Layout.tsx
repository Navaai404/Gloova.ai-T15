import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Home, ScanLine, MessageCircle, Droplet, Trophy, ChevronLeft, User } from 'lucide-react';
import { GloovaLogo } from './Logo';

interface LayoutProps {
  children: React.ReactNode;
}

interface ToastProps {
  message: string;
  points: number;
  visible: boolean;
}

export const Layout: React.FC<LayoutProps> = ({ children }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const [toast, setToast] = useState<ToastProps>({ message: '', points: 0, visible: false });

  // Main Tab Paths (No back button here)
  const mainPaths = ['/home', '/protocol', '/scan', '/gamification', '/chat'];
  const isMainPath = mainPaths.includes(location.pathname);
  const hideNav = ['/', '/register'].includes(location.pathname);

  useEffect(() => {
    const handlePointsUpdate = (event: CustomEvent) => {
      const { added } = event.detail;
      setToast({
        message: 'Pontos Recebidos!',
        points: added,
        visible: true
      });

      setTimeout(() => {
        setToast(prev => ({ ...prev, visible: false }));
      }, 3000);
    };

    window.addEventListener('points-updated', handlePointsUpdate as EventListener);
    return () => {
      window.removeEventListener('points-updated', handlePointsUpdate as EventListener);
    };
  }, []);

  // Navigation Items
  const navItems = [
    { path: '/home', icon: Home, label: 'Início' },
    { path: '/protocol', icon: Droplet, label: 'Tratamento' },
    { path: '/scan', icon: ScanLine, label: 'Scan' },
    { path: '/gamification', icon: Trophy, label: 'Ranking' },
    { path: '/chat', icon: MessageCircle, label: 'Expert' },
  ];

  return (
    <div className="flex flex-col h-screen bg-slate-50 text-slate-900 overflow-hidden relative font-sans selection:bg-blue-100">
      
      {/* GLOBAL HEADER */}
      {!hideNav && (
        <header className="fixed top-0 left-0 right-0 h-16 bg-white/90 backdrop-blur-md border-b border-slate-100 z-50 flex items-center justify-between px-5 shadow-sm safe-area-top">
          <div className="flex items-center gap-3">
            {/* 1-Click Back Button Logic */}
            {!isMainPath ? (
              <button 
                onClick={() => navigate(-1)} 
                className="p-2 -ml-2 rounded-full hover:bg-slate-100 text-slate-600 transition-colors"
              >
                <ChevronLeft size={24} />
              </button>
            ) : null}
            
            {/* Brand Logo */}
            <GloovaLogo size="sm" />
          </div>

          {/* Profile Shortcut */}
          <button 
             onClick={() => navigate('/profile')}
             className="w-9 h-9 bg-slate-100 rounded-full flex items-center justify-center text-slate-700 font-bold border border-slate-200 hover:bg-blue-50 hover:text-blue-600 transition-colors"
           >
             <User size={18} />
          </button>
        </header>
      )}

      {/* Points Toast */}
      <div className={`fixed top-20 left-1/2 transform -translate-x-1/2 z-[100] transition-all duration-500 ease-out ${toast.visible ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-8 pointer-events-none'}`}>
        <div className="bg-slate-900/90 backdrop-blur-md text-white px-5 py-3 rounded-2xl shadow-2xl shadow-slate-500/30 flex items-center gap-4 border border-white/10">
          <div className="bg-gradient-to-br from-yellow-300 to-yellow-500 text-slate-900 p-2 rounded-full shadow-lg shadow-yellow-500/20">
            <Trophy size={18} fill="currentColor" strokeWidth={1.5} />
          </div>
          <div className="flex flex-col pr-2">
             <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">{toast.message}</span>
             <span className="text-lg font-bold text-white tracking-tight">+{toast.points} pts</span>
          </div>
        </div>
      </div>

      {/* Content Area */}
      <main className={`flex-1 overflow-y-auto no-scrollbar pb-28 bg-slate-50 ${!hideNav ? 'pt-16' : ''}`}>
        {children}
      </main>

      {/* Bottom Navigation */}
      {!hideNav && (
        <div className="fixed bottom-0 left-0 right-0 bg-white/90 backdrop-blur-xl border-t border-slate-200/60 shadow-[0_-8px_30px_rgba(0,0,0,0.03)] z-50 safe-area-bottom">
          <div className="flex justify-around items-center h-[80px] pb-2 max-w-md mx-auto px-2">
            {navItems.map((item) => {
              const isActive = location.pathname === item.path;
              return (
                <button
                  key={item.path}
                  onClick={() => navigate(item.path)}
                  className={`relative flex flex-col items-center justify-center w-full h-full space-y-1 transition-all duration-300 group`}
                >
                  <div className={`p-2 rounded-2xl transition-all duration-300 ${
                    isActive 
                      ? 'text-blue-600 -translate-y-1' 
                      : 'text-slate-400 group-hover:text-slate-600'
                  }`}>
                    <item.icon 
                      size={24} 
                      strokeWidth={isActive ? 2.5 : 2} 
                      className="transition-transform duration-300"
                    />
                    {/* Glow effect */}
                    {isActive && <div className="absolute inset-0 bg-blue-400/20 blur-xl rounded-full"></div>}
                  </div>
                  <span className={`text-[10px] font-medium tracking-tight transition-all duration-300 ${
                    isActive ? 'text-blue-600 font-bold' : 'text-slate-400'
                  }`}>
                    {item.label}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
