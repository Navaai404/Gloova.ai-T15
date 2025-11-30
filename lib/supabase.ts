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
let supabaseUrl = getDynamicConfig('gloova_config_supabase_url') || getEnvSafe('VITE_SUPABASE_URL');
let supabaseKey = getDynamicConfig('gloova_config_supabase_key') || getEnvSafe('VITE_SUPABASE_ANON_KEY');

// Validação básica de URL
const isValidUrl = (url: string | undefined | null) => {
    try {
        return url && url.startsWith('http') && !url.includes('placeholder');
    } catch {
        return false;
    }
};

// Fallback values
const FALLBACK_URL = 'https://placeholder.supabase.co';
const FALLBACK_KEY = 'placeholder';

let client;

// TENTATIVA BLINDADA DE CRIAÇÃO DO CLIENTE
try {
    if (isValidUrl(supabaseUrl) && supabaseKey) {
        client = createClient(supabaseUrl, supabaseKey);
    } else {
        throw new Error("Invalid credentials");
    }
} catch (error) {
    console.warn("⚠️ Erro crítico ao iniciar Supabase. Revertendo para Modo Demo.", error);
    // Se falhar, usa o fallback para não travar a aba do navegador
    supabaseUrl = FALLBACK_URL;
    supabaseKey = FALLBACK_KEY;
    client = createClient(FALLBACK_URL, FALLBACK_KEY);
}

export const isMockMode = () => {
  return supabaseUrl === FALLBACK_URL;
};

export const supabase = client;