import React, { useEffect, useState, createContext, useContext } from 'react';
import { HashRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { Layout } from './components/Layout';
import { Auth } from './pages/Auth';
import { Home } from './pages/Home';
import { Diagnosis } from './pages/Diagnosis';
import { Protocol } from './pages/Protocol';
import { Scan } from './pages/Scan';
import { Chat } from './pages/Chat';
import { Profile } from './pages/Profile';
import { Gamification } from './pages/Gamification';
import { Admin } from './pages/Admin';
import { Onboarding } from './pages/Onboarding';
import { Legal } from './pages/Legal';
import { supabase } from './lib/supabase';

// --- Contexto de Autenticação ---
interface AuthContextType {
  session: any;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType>({ session: null, loading: true });

const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [session, setSession] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // 1. Verifica sessão atual ao carregar
    const initSession = async () => {
        try {
            const { data: { session } } = await supabase.auth.getSession();
            setSession(session);
        } catch (e) {
            console.error("Erro ao restaurar sessão:", e);
        } finally {
            setLoading(false);
        }
    };

    initSession();

    // 2. Escuta mudanças de sessão (Login/Logout/Refresh)
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  return (
    <AuthContext.Provider value={{ session, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

// --- Hook para usar Auth ---
const useAuth = () => {
  return useContext(AuthContext);
};

// --- Componente de Rota Protegida (Blindado) ---
const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { session, loading } = useAuth();
  const location = useLocation();
  
  // Estado local para evitar flash de redirecionamento enquanto o AuthProvider carrega
  // Isso dá uma chance para o localStorage ou Supabase responderem
  const [isRestoring, setIsRestoring] = useState(true);

  useEffect(() => {
      if (!loading) {
          setIsRestoring(false);
      }
  }, [loading]);

  if (loading || isRestoring) {
      // Splash Screen ou Loading discreto enquanto verifica
      return <div className="h-screen flex items-center justify-center bg-slate-50 text-slate-400 text-sm font-medium">Carregando Gloova...</div>;
  }

  // Fallback: Verifica localStorage se o Supabase falhar momentaneamente
  const localUser = localStorage.getItem('gloova_user');

  // Só redireciona para Login se NÃO tiver sessão E NÃO tiver usuário local
  if (!session && !localUser) {
    return <Navigate to="/" state={{ from: location }} replace />;
  }

  return <Layout>{children}</Layout>;
};

const AppRoutes: React.FC = () => {
    return (
      <Routes>
        <Route path="/" element={<Auth />} />
        
        <Route path="/onboarding" element={
          <ProtectedRoute>
            <Onboarding />
          </ProtectedRoute>
        } />

        <Route path="/home" element={
          <ProtectedRoute>
            <Home />
          </ProtectedRoute>
        } />
        
        <Route path="/diagnosis" element={
          <ProtectedRoute>
            <Diagnosis />
          </ProtectedRoute>
        } />
        
        <Route path="/protocol" element={
          <ProtectedRoute>
            <Protocol />
          </ProtectedRoute>
        } />
        
        <Route path="/scan" element={
          <ProtectedRoute>
            <Scan />
          </ProtectedRoute>
        } />
        
        <Route path="/chat" element={
          <ProtectedRoute>
            <Chat />
          </ProtectedRoute>
        } />

        <Route path="/profile" element={
          <ProtectedRoute>
            <Profile />
          </ProtectedRoute>
        } />

        <Route path="/gamification" element={
          <ProtectedRoute>
            <Gamification />
          </ProtectedRoute>
        } />
        
        <Route path="/admin" element={
          <ProtectedRoute>
            <Admin />
          </ProtectedRoute>
        } />

        <Route path="/legal" element={<Legal />} />

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    );
};

const App: React.FC = () => {
  return (
    <AuthProvider>
      <HashRouter>
         <AppRoutes />
      </HashRouter>
    </AuthProvider>
  );
};

export default App;