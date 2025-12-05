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
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoading(false);
    });

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
      {!loading && children}
    </AuthContext.Provider>
  );
};

// --- Hook para usar Auth ---
const useAuth = () => {
  return useContext(AuthContext);
};

// --- Componente de Rota Protegida ---
const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { session, loading } = useAuth();
  const location = useLocation();

  if (loading) {
      return <div className="h-screen flex items-center justify-center bg-white text-slate-400">Carregando...</div>;
  }

  // Fallback: Verifica localStorage se o Supabase ainda estiver inicializando ou em modo mock
  const localUser = localStorage.getItem('gloova_user');

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