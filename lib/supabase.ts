import { createClient } from '@supabase/supabase-js';

// Função para buscar configurações dinâmicas (definidas no Painel Admin)
const getDynamicConfig = (key: string) => {
  try {
    const item = localStorage.getItem(key);
    return item ? item.trim() : null;
  } catch {
    return null;
  }
};

// Função segura para tentar ler variáveis de ambiente
const getEnvSafe = (key: string) => {
  try {
    if (typeof import.meta !== 'undefined' && (import.meta as any).env && (import.meta as any).env[key]) {
      return (import.meta as any).env[key];
    }
    if (typeof process !== 'undefined' && process.env && process.env[key]) {
      return process.env[key];
    }
  } catch (e) { }
  return undefined;
};

// Prioridade: Config do Admin (LocalStorage) > Variáveis de Ambiente (.env)
const supabaseUrl = getDynamicConfig('gloova_config_supabase_url') || getEnvSafe('VITE_SUPABASE_URL');
const supabaseKey = getDynamicConfig('gloova_config_supabase_key') || getEnvSafe('VITE_SUPABASE_ANON_KEY');

export const isMockMode = () => {
  return !supabaseUrl || !supabaseKey;
};

if (!supabaseUrl || !supabaseKey) {
  console.warn("⚠️ Supabase Credentials Missing. App running in Mock Mode.");
}

// Cria o cliente. Se as chaves faltarem, cria com valores dummy para não quebrar o app (cai no Mock Mode)
// Em produção, as chaves virão das Environment Variables da Vercel.
export const supabase = createClient(
    supabaseUrl || 'https://placeholder.supabase.co', 
    supabaseKey || 'placeholder'
);
