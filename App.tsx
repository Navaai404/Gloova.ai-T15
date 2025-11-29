import React from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
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

interface ProtectedRouteProps {
  children: React.ReactNode;
}

// Simple protection wrapper
const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const isAuthenticated = !!localStorage.getItem('gloova_user');
  if (!isAuthenticated) {
    return <Navigate to="/" replace />;
  }
  return <Layout>{children}</Layout>;
};

const App: React.FC = () => {
  return (
    <HashRouter>
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
    </HashRouter>
  );
};

export default App;