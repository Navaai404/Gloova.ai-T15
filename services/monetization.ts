
import { UserProfile } from "../types";

export const PLANS = {
  free: {
    id: 'free',
    name: 'Gratuito',
    price: 0,
    annualPrice: 0,
    limits: {
      tokens: 0,
      diagnosis: 1, // Apenas o inicial
      scans: 0
    },
    features: ['1 Diagnóstico Inicial', 'Visualização Restrita']
  },
  basic: {
    id: 'basic',
    name: 'Básico',
    price: 27.90,
    annualPrice: 234.36, // (27.90 * 12) * 0.70
    limits: {
      tokens: 30,
      diagnosis: 1,
      scans: 4
    },
    features: ['Acesso ao Cronograma', '1 Diagnóstico/mês', '4 Scans de Produtos', '30 Tokens de Chat']
  },
  advanced: {
    id: 'advanced',
    name: 'Avançado',
    price: 47.90,
    annualPrice: 402.36, // (47.90 * 12) * 0.70
    limits: {
      tokens: 120,
      diagnosis: 2,
      scans: 12
    },
    features: ['2 Diagnósticos/mês', '12 Scans de Produtos', '120 Tokens de Chat', 'Retorno Quinzenal']
  },
  premium: {
    id: 'premium',
    name: 'Premium',
    price: 67.90,
    annualPrice: 570.36, // (67.90 * 12) * 0.70
    limits: {
      tokens: 480,
      diagnosis: 4,
      scans: 24
    },
    features: ['4 Diagnósticos/mês', '24 Scans de Produtos', '480 Tokens de Chat', 'Retorno Semanal']
  }
};

export const PACKAGES = {
  diagnosis: [
    { qty: 1, price: 34.90, label: '1 Diagnóstico Completo' },
    { qty: 2, price: 59.90, label: '2 Diagnósticos' },
    { qty: 4, price: 119.90, label: '4 Diagnósticos' },
  ],
  tokens: [
    { qty: 50, price: 14.90, label: '50 Tokens de IA' },
    { qty: 150, price: 29.90, label: '150 Tokens de IA' },
    { qty: 500, price: 59.90, label: '500 Tokens de IA' },
  ],
  scan: [
    { qty: 5, price: 19.90, label: '5 Scans de Produtos' },
    { qty: 15, price: 49.90, label: '15 Scans de Produtos' },
  ]
};

// --- Logic ---

export const hasCredit = (user: UserProfile, type: 'chat' | 'diagnosis' | 'scan'): boolean => {
  if (type === 'chat') return (user.chat_credits || 0) > 0;
  if (type === 'diagnosis') return (user.diagnosis_credits || 0) > 0;
  if (type === 'scan') return (user.scan_credits || 0) > 0;
  return false;
};

export const deductCredit = (type: 'chat' | 'diagnosis' | 'scan', amount: number = 1) => {
  const userStr = localStorage.getItem('gloova_user');
  if (!userStr) return;

  const user: UserProfile = JSON.parse(userStr);
  let updatedUser = { ...user };

  if (type === 'chat') {
    updatedUser.chat_credits = Math.max(0, (user.chat_credits || 0) - amount);
  } else if (type === 'diagnosis') {
    updatedUser.diagnosis_credits = Math.max(0, (user.diagnosis_credits || 0) - amount);
  } else if (type === 'scan') {
    updatedUser.scan_credits = Math.max(0, (user.scan_credits || 0) - amount);
  }

  localStorage.setItem('gloova_user', JSON.stringify(updatedUser));
  
  // Trigger update event
  window.dispatchEvent(new CustomEvent('points-updated', { detail: { updated: true } }));
};

export const calculateChatCost = (responseLength: number) => {
  // Rule: 1 credit per 30 chars, rounded up
  return Math.ceil(responseLength / 30);
};

export const buyPackage = (type: 'chat' | 'diagnosis' | 'scan', qty: number) => {
  const userStr = localStorage.getItem('gloova_user');
  if (!userStr) return;
  const user: UserProfile = JSON.parse(userStr);
  
  let updatedUser = { ...user };
  if (type === 'chat') updatedUser.chat_credits = (user.chat_credits || 0) + qty;
  if (type === 'diagnosis') updatedUser.diagnosis_credits = (user.diagnosis_credits || 0) + qty;
  if (type === 'scan') updatedUser.scan_credits = (user.scan_credits || 0) + qty;

  localStorage.setItem('gloova_user', JSON.stringify(updatedUser));
  window.dispatchEvent(new CustomEvent('points-updated', { detail: { updated: true } }));
  alert('Compra realizada com sucesso!');
};
