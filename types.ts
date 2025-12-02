export interface UserProfile {
  id: string;
  email: string;
  name?: string;
  memory_key?: string;
  conversation_id?: string;
  points?: number;
  redeemed_rewards?: string[];
  subscription_tier?: 'free' | 'basic' | 'advanced' | 'premium';
  referrals?: Referral[];
  
  // Wallet / Credits
  chat_credits?: number;      // 30 chars = 1 credit
  diagnosis_credits?: number; // Full diagnosis
  scan_credits?: number;      // Product analysis
  
  // Referral System
  referral_code?: string;     // O código deste usuário (ex: JOAO123)
  referred_by?: string;       // O código de quem indicou este usuário
  
  // Contact Info
  whatsapp?: string;          // Número de WhatsApp do usuário (Obrigatório para CRM)
}

export interface Referral {
  id: string;
  name: string;
  date: string;
  status: 'active' | 'pending';
  earned_points: number;
}

export interface DiagnosisResult {
  id?: string;
  date: string;
  analysis_text: string;
  curvature: string;
  porosity: string;
  oiliness: string;
  frizz: string;
  damage_level: string;
  overall_health: string;
  protocol_30_days: ProtocolDay[];
}

export interface ProtocolDay {
  day: number;
  type: 'Hidratação' | 'Nutrição' | 'Reconstrução' | 'Pausa';
  instruction: string;
  completed?: boolean;
}

export interface ProductScanResult {
  id?: string;
  product_name: string;
  category: string;
  composition_summary: string;
  functions: string;
  is_compatible: boolean;
  reason: string;
  usage_recommendation: string;
  recommended_day?: number;
  image_url?: string;
}

export interface ChatMessage {
  id: string;
  sender: 'user' | 'ai';
  text: string;
  timestamp: Date;
}

// Quiz Data Structure
export interface QuizData {
  main_concern: string;
  concern_duration: string;
  wash_frequency: string;
  heat_tools: string;
  chemical_history: string;
  scalp_type: string;
  treatment_goal: string;
  budget_preference: string; // Critical for recommendations
  allergies: string;
  previous_schedule: string;
  dedication_time: string;
}

// N8N Payload Interfaces
export interface N8NDiagnosisPayload {
  user_id: string;
  image_base64: string; // Primary image (Front)
  additional_images?: Record<string, string>; // Other angles
  historico_usuario: any;
  memory_key: string;
  quiz_data?: QuizData; // Included in analysis
  conversation_id?: string;
}

export interface N8NScanPayload {
  user_id: string;
  image_base64: string;
  diagnostico_atual: any;
  protocolo_30_dias: any;
  memory_key: string;
  conversation_id?: string;
}

export interface N8NChatPayload {
  user_id: string;
  mensagem: string;
  diagnostico_atual: any;
  protocolo_30_dias: any;
  memory_key: string;
  conversation_id?: string;
}

export interface N8NMarketingPayload {
  admin_id: string;
  target_segment: string; // 'basic', 'active', 'all', etc.
  title: string;
  message: string;
  channels: {
    email: boolean;
    push: boolean;
  };
}