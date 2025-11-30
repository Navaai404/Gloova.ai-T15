import { UserProfile } from "../types";
import { buyPackage } from "./monetization";

export const POINTS = {
  DIAGNOSIS: 50,
  SCAN: 10,
  CHAT: 2,
  CALENDAR_SYNC: 20,
  WELCOME: 100,
  REFERRAL_BONUS: 500 // Pontos dados ao padrinho quando o indicado paga
};

export interface RewardItem {
  id: string;
  title: string;
  cost: number;
  description: string;
  iconType: 'feature' | 'credits';
  actionType?: 'diagnosis' | 'scan' | 'chat'; // Tipo de crédito a adicionar
  actionQty?: number; // Quantidade a adicionar
}

export const REWARDS_LIST: RewardItem[] = [
  { 
    id: 'reward_scan_pack', 
    title: 'Pacote: 4 Scans', 
    cost: 5000, 
    description: 'Ganhe 4 análises de produto grátis.', 
    iconType: 'credits',
    actionType: 'scan',
    actionQty: 4
  },
  { 
    id: 'reward_tokens_pack', 
    title: 'Pacote: 50 Tokens', 
    cost: 5000, 
    description: 'Ganhe 50 créditos para falar com a IA.', 
    iconType: 'credits',
    actionType: 'chat',
    actionQty: 50
  },
  { 
    id: 'reward_diag_free', 
    title: '1 Diagnóstico Completo', 
    cost: 5000, 
    description: 'Desbloqueie uma nova análise capilar.', 
    iconType: 'feature',
    actionType: 'diagnosis',
    actionQty: 1
  },
  { 
    id: 'badge_expert', 
    title: 'Badge: Expert', 
    cost: 10000, 
    description: 'Selo de autoridade na comunidade.', 
    iconType: 'feature' 
  },
];

export const getLevel = (points: number) => {
  if (points < 1000) return { name: 'Iniciante', next: 1000 };
  if (points < 5000) return { name: 'Exploradora', next: 5000 };
  if (points < 10000) return { name: 'Entusiasta', next: 10000 };
  if (points < 50000) return { name: 'Especialista', next: 50000 };
  return { name: 'Embaixadora', next: 100000 };
};

export const addPoints = (amount: number) => {
  const userStr = localStorage.getItem('gloova_user');
  if (!userStr) return;
  
  const user = JSON.parse(userStr);
  const currentPoints = user.points || 0;
  const newPoints = currentPoints + amount;
  
  const updatedUser = { ...user, points: newPoints };
  localStorage.setItem('gloova_user', JSON.stringify(updatedUser));
  
  // Dispatch custom event for UI updates
  window.dispatchEvent(new CustomEvent('points-updated', { 
    detail: { points: newPoints, added: amount } 
  }));
};

export const redeemReward = (rewardId: string, cost: number): boolean => {
  const userStr = localStorage.getItem('gloova_user');
  if (!userStr) return false;

  const user: UserProfile = JSON.parse(userStr);
  const currentPoints = user.points || 0;

  if (currentPoints < cost) return false;

  // Deduct points
  const newPoints = currentPoints - cost;
  
  // Add to redeemed list (history) - Allows repeat redemption for credits
  // const currentRedeemed = user.redeemed_rewards || []; 
  // Not blocking repeated redemption for consumable rewards
  
  // Find reward definition to apply effect
  const reward = REWARDS_LIST.find(r => r.id === rewardId);
  
  if (reward && reward.actionType && reward.actionQty) {
      // Grant real credits
      buyPackage(reward.actionType, reward.actionQty);
  }

  const updatedUser: UserProfile = { 
    ...user, 
    points: newPoints,
    // redeemed_rewards: [...currentRedeemed, rewardId] // Optional history tracking
  };

  localStorage.setItem('gloova_user', JSON.stringify(updatedUser));

  // Dispatch event so UI updates immediately
  window.dispatchEvent(new CustomEvent('points-updated', { 
    detail: { points: newPoints, added: -cost } 
  }));

  return true;
};