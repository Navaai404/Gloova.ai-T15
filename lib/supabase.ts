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

// LOG DE DEPURAÇÃO (Verifique o console F12 se der erro)
console.log("🔌 Supabase Init:", supabaseUrl ? "URL Encontrada" : "URL Ausente", supabaseKey ? "Key Encontrada" : "Key Ausente");
if (supabaseUrl) console.log("🔌 Conectando em:", supabaseUrl);

// Fallback values
const FALLBACK_URL = 'https://placeholder.supabase.co';
const FALLBACK_KEY = 'placeholder';

let client;

try {
    // Validação básica
    if (supabaseUrl && supabaseUrl.startsWith('http') && supabaseKey) {
        client = createClient(supabaseUrl, supabaseKey);
    } else {
        console.warn("⚠️ Credenciais inválidas ou ausentes. Usando Mock.");
        supabaseUrl = FALLBACK_URL;
        client = createClient(FALLBACK_URL, FALLBACK_KEY);
    }
} catch (error) {
    console.error("⚠️ Erro fatal Supabase:", error);
    client = createClient(FALLBACK_URL, FALLBACK_KEY);
}

export const isMockMode = () => {
  return supabaseUrl === FALLBACK_URL;
};

export const supabase = client;