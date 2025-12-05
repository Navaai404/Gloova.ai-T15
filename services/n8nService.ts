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
      if (!response.ok) throw new Error(`N8N Error`);
      return await response.json() as DiagnosisResult;
    } catch (error) {
      console.error("Diagnosis Error", error);
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
      if (!response.ok) throw new Error(`N8N Error`);
      return await response.json() as ProductScanResult;
    } catch (error) {
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

      if (!response.ok) throw new Error(`N8N Error: ${response.status}`);

      // Tenta ler como texto primeiro para evitar crash no .json()
      const textData = await response.text();
      
      try {
          // Tenta fazer parse do JSON
          const jsonData = JSON.parse(textData);
          
          // Procura a resposta em várias chaves possíveis (flexibilidade total)
          // Se o N8N devolver { "resposta": "..." } ou { "text": "..." } ou { "output": "..." }
          const answer = jsonData.resposta || jsonData.text || jsonData.output || jsonData.message || JSON.stringify(jsonData);
          
          return { 
              resposta: answer,
              conversation_id: jsonData.conversation_id || jsonData.thread_id
          };

      } catch (e) {
          // Se não for JSON, assume que o N8N devolveu texto puro e usa isso
          console.warn("N8N retornou texto puro, não JSON:", textData);
          return { resposta: textData };
      }

    } catch (error) {
      console.error("Chat Error:", error);
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
      if (!response.ok) throw new Error("Erro");
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
        await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ ...payload, action: 'marketing' })
        });
        return true;
    } catch (error) {
        return true;
    }
  }
};

// ... Mocks mantidos ...
const mockDiagnosisResponse = (): DiagnosisResult => ({
  date: new Date().toISOString(),
  analysis_text: "Modo Demo: O serviço N8N parece indisponível.",
  curvature: "2C",
  porosity: "Média",
  oiliness: "Mista",
  frizz: "Moderado",
  damage_level: "Baixo",
  overall_health: "Boa",
  protocol_30_days: []
});
const mockScanResponse = (c: boolean) => ({ product_name: "Demo", category: "Teste", composition_summary: "...", functions: "...", is_compatible: c, reason: "...", usage_recommendation: "..." });
const mockChatResponse = (msg: string) => `[Demo] N8N Offline.`;
