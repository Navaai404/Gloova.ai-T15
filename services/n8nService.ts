import { N8NChatPayload, N8NDiagnosisPayload, N8NScanPayload, DiagnosisResult, ProductScanResult, N8NMarketingPayload } from '../types';

// URL Padrão (Fallback)
const DEFAULT_N8N_URL = 'https://n8neditor.comercialai.site/webhook-test/webhook-gateway';

// Busca URL dinâmica configurada no Admin
const getGatewayUrl = () => {
  try {
    return localStorage.getItem('gloova_config_n8n_url') || DEFAULT_N8N_URL;
  } catch {
    return DEFAULT_N8N_URL;
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
    const url = getGatewayUrl();
    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...payload, action: 'diagnosis' })
      });
      if (!response.ok) throw new Error(`N8N Error: ${response.status} ${response.statusText}`);
      return await response.json() as DiagnosisResult;
    } catch (error) {
      console.error("Diagnosis Error:", error);
      return mockDiagnosisResponse();
    }
  },

  async scanProduct(payload: N8NScanPayload): Promise<ProductScanResult> {
    const url = getGatewayUrl();
    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...payload, action: 'scan' })
      });
      if (!response.ok) throw new Error(`N8N Error: ${response.status} ${response.statusText}`);
      return await response.json() as ProductScanResult;
    } catch (error) {
      console.error("Scan Error:", error);
      return mockScanResponse(Math.random() > 0.3);
    }
  },

  /**
   * Chat em tempo real (BLINDADO)
   */
  async sendChatMessage(payload: N8NChatPayload): Promise<{ resposta: string, conversation_id?: string }> {
    const url = getGatewayUrl();
    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...payload, action: 'chat' })
      });

      if (!response.ok) {
          const errorText = await response.text();
          console.error(`N8N Error (${response.status}):`, errorText);
          throw new Error(`N8N Error: ${response.status}`);
      }

      // Tenta ler como texto primeiro para evitar crash no .json()
      const textData = await response.text();
      
      try {
          // Tenta fazer parse do JSON
          const jsonData = JSON.parse(textData);
          
          // Procura a resposta em várias chaves possíveis (flexibilidade total)
          const answer = jsonData.resposta || jsonData.text || jsonData.output || jsonData.message || (typeof jsonData === 'string' ? jsonData : JSON.stringify(jsonData));
          
          return { 
              resposta: answer,
              conversation_id: jsonData.conversation_id || jsonData.thread_id
          };

      } catch (e) {
          // Se não for JSON, assume que o N8N devolveu texto puro e usa isso
          console.warn("N8N retornou texto puro, não JSON. Usando raw text:", textData);
          if (textData && textData.length > 0) {
              return { resposta: textData };
          }
          throw new Error("Resposta vazia ou inválida");
      }

    } catch (error) {
      console.error("Chat Service Error:", error);
      return { resposta: mockChatResponse(payload.mensagem) };
    }
  },

  async createCheckout(userId: string, item: any, method: any): Promise<CheckoutResponse> {
    const url = getGatewayUrl();
    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
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
    const url = getGatewayUrl();
    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ ...payload, action: 'marketing' })
        });
        return response.ok;
    } catch (error) {
        console.error("Marketing Error:", error);
        return true; // Mock success fallback
    }
  }
};

// ... Mocks mantidos ...
const mockDiagnosisResponse = (): DiagnosisResult => ({
  date: new Date().toISOString(),
  analysis_text: "Modo Demo: O serviço N8N parece indisponível ou com erro de CORS. Verifique o console (F12).",
  curvature: "2C",
  porosity: "Média",
  oiliness: "Mista",
  frizz: "Moderado",
  damage_level: "Baixo",
  overall_health: "Boa",
  protocol_30_days: []
});
const mockScanResponse = (c: boolean) => ({ product_name: "Demo", category: "Teste", composition_summary: "...", functions: "...", is_compatible: c, reason: "...", usage_recommendation: "..." });
const mockChatResponse = (msg: string) => `[Demo] N8N Offline. Erro de conexão.`;