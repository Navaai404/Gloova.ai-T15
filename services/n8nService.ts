import { N8NChatPayload, N8NDiagnosisPayload, N8NScanPayload, DiagnosisResult, ProductScanResult, N8NMarketingPayload } from '../types';
import { supabase } from '../lib/supabase';

// URL Padrão (Fallback caso o banco falhe)
const DEFAULT_N8N_URL = 'https://n8neditor.comercialai.site/webhook-test/webhook-gateway';

// Busca URL dinâmica do Supabase (Configuração Global) ou Cache Local
const getGatewayUrl = async (): Promise<string> => {
  try {
    // 1. Tenta buscar do cache local
    const cachedUrl = localStorage.getItem('gloova_config_n8n_url');
    if (cachedUrl) return cachedUrl;

    // 2. Se não tiver, busca do Supabase (Tabela Global)
    const { data } = await supabase
        .from('app_settings')
        .select('value')
        .eq('id', 'n8n_url')
        .single();
    
    if (data && data.value) {
        localStorage.setItem('gloova_config_n8n_url', data.value);
        return data.value;
    }
    
    return DEFAULT_N8N_URL;
  } catch {
    return DEFAULT_N8N_URL;
  }
};

// Helper para decidir se usa Proxy ou Direto
const getFetchUrlAndHeaders = (targetUrl: string) => {
  const isProduction = window.location.hostname !== 'localhost' && !window.location.hostname.includes('127.0.0.1');

  if (isProduction) {
    console.log(`🔄 Usando Proxy Vercel para: ${targetUrl}`); // DEBUG LOG
    return {
      url: '/api/proxy',
      headers: {
        'Content-Type': 'application/json',
        'x-n8n-target': targetUrl
      }
    };
  } else {
    console.log(`🔗 Conexão Direta (Localhost) para: ${targetUrl}`); // DEBUG LOG
    return {
      url: targetUrl,
      headers: {
        'Content-Type': 'application/json'
      }
    };
  }
};

export interface CheckoutResponse {
  paymentId: string;
  pixCode?: string;
  checkoutUrl?: string;
  qrCodeBase64?: string; 
}

export const n8nService = {
  async submitDiagnosis(payload: N8NDiagnosisPayload): Promise<DiagnosisResult> {
    const targetUrl = await getGatewayUrl(); 
    const { url, headers } = getFetchUrlAndHeaders(targetUrl);
    
    console.log(`🚀 Enviando Diagnóstico para: ${url}`); // DEBUG LOG

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: headers,
        body: JSON.stringify({ ...payload, action: 'diagnosis' })
      });
      
      if (!response.ok) {
          const errText = await response.text();
          throw new Error(`N8N Error: ${response.status} - ${errText}`);
      }
      return await response.json() as DiagnosisResult;
    } catch (error) {
      console.error("Diagnosis Error:", error);
      return mockDiagnosisResponse();
    }
  },

  async scanProduct(payload: N8NScanPayload): Promise<ProductScanResult> {
    const targetUrl = await getGatewayUrl();
    const { url, headers } = getFetchUrlAndHeaders(targetUrl);

    console.log(`🚀 Enviando Scan para: ${url}`); // DEBUG LOG

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: headers,
        body: JSON.stringify({ ...payload, action: 'scan' })
      });
      
      if (!response.ok) throw new Error(`N8N Error: ${response.status}`);
      return await response.json() as ProductScanResult;
    } catch (error) {
      console.error("Scan Error:", error);
      return mockScanResponse(Math.random() > 0.3);
    }
  },

  async sendChatMessage(payload: N8NChatPayload): Promise<{ resposta: string, conversation_id?: string }> {
    const targetUrl = await getGatewayUrl();
    const { url, headers } = getFetchUrlAndHeaders(targetUrl);

    console.log(`🚀 Enviando Chat para: ${url}`); // DEBUG LOG

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: headers,
        body: JSON.stringify({ ...payload, action: 'chat' })
      });

      if (!response.ok) {
          const errorText = await response.text();
          console.error(`N8N Error (${response.status}):`, errorText);
          throw new Error(`N8N Error: ${response.status}`);
      }

      const textData = await response.text();
      
      try {
          const jsonData = JSON.parse(textData);
          const answer = jsonData.resposta || jsonData.text || jsonData.output || jsonData.message || (typeof jsonData === 'string' ? jsonData : JSON.stringify(jsonData));
          
          return { 
              resposta: answer,
              conversation_id: jsonData.conversation_id || jsonData.thread_id
          };
      } catch (e) {
          if (textData && textData.length > 0) {
              return { resposta: textData };
          }
          throw new Error("Resposta vazia do N8N");
      }

    } catch (error) {
      console.error("Chat Service Error:", error);
      return { resposta: mockChatResponse(payload.mensagem) };
    }
  },

  async createCheckout(userId: string, item: any, method: any): Promise<CheckoutResponse> {
    const targetUrl = await getGatewayUrl();
    const { url, headers } = getFetchUrlAndHeaders(targetUrl);

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: headers,
        body: JSON.stringify({ action: 'checkout', user_id: userId, ...item, method })
      });
      if (!response.ok) throw new Error("Erro no checkout");
      return await response.json();
    } catch (error) {
      return new Promise(resolve => {
        setTimeout(() => {
          resolve({ paymentId: "mock", pixCode: "000201...", checkoutUrl: "https://mp.com" });
        }, 1000);
      });
    }
  },

  async sendMarketingCampaign(payload: N8NMarketingPayload): Promise<boolean> {
    const targetUrl = await getGatewayUrl();
    const { url, headers } = getFetchUrlAndHeaders(targetUrl);

    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: headers,
            body: JSON.stringify({ ...payload, action: 'marketing' })
        });
        return response.ok;
    } catch (error) {
        return true;
    }
  }
};

// ... Mocks mantidos ...
const mockDiagnosisResponse = (): DiagnosisResult => ({
  date: new Date().toISOString(),
  analysis_text: "Modo Demo: O serviço N8N parece indisponível ou com erro de conexão.",
  curvature: "2C",
  porosity: "Média",
  oiliness: "Mista",
  frizz: "Moderado",
  damage_level: "Baixo",
  overall_health: "Boa",
  protocol_30_days: []
});
const mockScanResponse = (c: boolean) => ({ product_name: "Demo", category: "Teste", composition_summary: "...", functions: "...", is_compatible: c, reason: "...", usage_recommendation: "..." });
const mockChatResponse = (msg: string) => `[Demo] N8N Offline. Verifique sua conexão.`;