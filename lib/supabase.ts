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

// Função segura para tentar ler variáveis de ambiente (Vite/Process)
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

// Valores de Fallback (Placeholder) para não quebrar a inicialização, mas não conectam em nada real
const FALLBACK_URL = 'https://placeholder.supabase.co';
const FALLBACK_KEY = 'placeholder';

let client;

try {
    // Validação básica para tentar conexão real
    if (supabaseUrl && supabaseUrl.startsWith('http') && supabaseKey && supabaseKey !== 'placeholder') {
        console.log("🔌 Supabase: Tentando conexão com configurações fornecidas.");
        client = createClient(supabaseUrl, supabaseKey);
    } else {
        console.warn("⚠️ Supabase: Credenciais ausentes. App rodando em Modo Demo (Mock).");
        client = createClient(FALLBACK_URL, FALLBACK_KEY);
    }
} catch (error) {
    console.error("⚠️ Supabase: Erro fatal na inicialização:", error);
    client = createClient(FALLBACK_URL, FALLBACK_KEY);
}

// Exporta função para checar se está em modo Mock
export const isMockMode = () => {
  return !supabaseUrl || supabaseUrl === FALLBACK_URL;
};

export const supabase = client;