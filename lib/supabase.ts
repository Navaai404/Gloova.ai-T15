import { createClient } from '@supabase/supabase-js';

// URL e Chave fornecidas pelo usuário
const PROJECT_URL = 'https://vqqmimgdziakrpoekspw.supabase.co';
const ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZxcW1pbWdkemlha3Jwb2Vrc3B3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjMyMjc4ODEsImV4cCI6MjA3ODgwMzg4MX0.TRcgrTBjcnNLmv4Br4dLhd83grsM-Xk2q8WPm0Znh5c';

// Função segura para tentar ler variáveis de ambiente sem quebrar o app
const getEnvSafe = (key: string) => {
  try {
    // Verifica Vite
    if (typeof import.meta !== 'undefined' && (import.meta as any).env && (import.meta as any).env[key]) {
      return (import.meta as any).env[key];
    }
    // Verifica Process (Node/CRA) - Apenas se process estiver definido
    if (typeof process !== 'undefined' && process.env && process.env[key]) {
      return process.env[key];
    }
  } catch (e) {
    // Ignora erros de acesso
  }
  return undefined;
};

const envUrl = getEnvSafe('VITE_SUPABASE_URL') || getEnvSafe('REACT_APP_SUPABASE_URL');
const envKey = getEnvSafe('VITE_SUPABASE_ANON_KEY') || getEnvSafe('REACT_APP_SUPABASE_ANON_KEY');

const supabaseUrl = envUrl || PROJECT_URL;
const supabaseKey = envKey || ANON_KEY;

// Função auxiliar para verificar se estamos em modo mock
export const isMockMode = () => {
  // Se a URL for vazia ou placeholder, estamos em mock
  return !supabaseUrl || supabaseUrl.includes('placeholder');
};

if (!supabaseUrl || !supabaseKey) {
  console.warn("⚠️ Supabase Credentials Missing. App running in Mock Mode.");
}

export const supabase = createClient(supabaseUrl, supabaseKey);