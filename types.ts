export interface UserProfile {
  id: string;
  email: string;
  name?: string;
  memory_key?: string;
  conversation_id?: string | null; // Permitir null
  points?: number;
  redeemed_rewards?: string[];
  subscription_tier?: 'free' | 'basic' | 'advanced' | 'premium';
  referrals?: Referral[];
  
  // Wallet / Credits
  chat_credits?: number;
  diagnosis_credits?: number;
  scan_credits?: number;
  
  // Referral System
  referral_code?: string;
  referred_by?: string;
  
  // Contact Info
  whatsapp?: string;
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
  budget_preference: string; 
  allergies: string;
  previous_schedule: string;
  dedication_time: string;
}

// N8N Payload Interfaces - conversation_id pode ser null
export interface N8NDiagnosisPayload {
  user_id: string;
  image_base64: string; 
  additional_images?: Record<string, string>;
  historico_usuario: any;
  memory_key: string;
  quiz_data?: QuizData;
  conversation_id?: string | null;
}

export interface N8NScanPayload {
  user_id: string;
  image_base64: string;
  diagnostico_atual: any;
  protocolo_30_dias: any;
  memory_key: string;
  conversation_id?: string | null;
}

export interface N8NChatPayload {
  user_id: string;
  mensagem: string;
  diagnostico_atual: any;
  protocolo_30_dias: any;
  memory_key: string;
  conversation_id?: string | null;
}

export interface N8NMarketingPayload {
  admin_id: string;
  target_segment: string;
  title: string;
  message: string;
  channels: {
    email: boolean;
    push: boolean;
  };
}