
import { N8NChatPayload, N8NDiagnosisPayload, N8NScanPayload, DiagnosisResult, ProductScanResult, N8NMarketingPayload } from '../types';

// URL DO SEU N8N (Gateway Unificado)
// Todas as ações (Chat, Diagnóstico, Scan) vão para este mesmo link, diferenciadas pelo campo "action"
const N8N_GATEWAY_URL = 'https://n8neditor.comercialai.site/webhook-test/webhook-gateway';

export interface CheckoutResponse {
  paymentId: string;
  pixCode?: string; // Para Pix
  checkoutUrl?: string; // Para Cartão (Link de Pagamento)
  qrCodeBase64?: string; 
}

export const n8nService = {
  /**
   * Envia as 4 fotos para o N8N (Diagnóstico).
   */
  async submitDiagnosis(payload: N8NDiagnosisPayload): Promise<DiagnosisResult> {
    try {
      console.log("Sending Diagnosis to N8N...", payload);
      const response = await fetch(N8N_GATEWAY_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            ...payload,
            action: 'diagnosis' // Roteador do N8N
        })
      });
      if (!response.ok) throw new Error(`N8N Error: ${response.statusText}`);
      return await response.json() as DiagnosisResult;
    } catch (error) {
      console.error("Diagnosis Error", error);
      return mockDiagnosisResponse();
    }
  },

  /**
   * Envia foto do produto para o N8N (Scan).
   */
  async scanProduct(payload: N8NScanPayload): Promise<ProductScanResult> {
    try {
      console.log("Sending Scan to N8N...", payload);
      const response = await fetch(N8N_GATEWAY_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            ...payload,
            action: 'scan' // Roteador do N8N
        })
      });
      if (!response.ok) throw new Error(`N8N Error: ${response.statusText}`);
      return await response.json() as ProductScanResult;
    } catch (error) {
      console.error("Scan Error", error);
      return mockScanResponse(Math.random() > 0.3);
    }
  },

  /**
   * Chat em tempo real.
   */
  async sendChatMessage(payload: N8NChatPayload): Promise<{ resposta: string, conversation_id?: string }> {
    try {
      const response = await fetch(N8N_GATEWAY_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            ...payload,
            action: 'chat' // Roteador do N8N
        })
      });
      if (!response.ok) throw new Error(`N8N Error: ${response.statusText}`);
      return await response.json();
    } catch (error) {
      return { resposta: mockChatResponse(payload.mensagem) };
    }
  },

  /**
   * Cria um pagamento (Pix ou Link de Checkout).
   * @param method 'pix' ou 'credit'
   */
  async createCheckout(
    userId: string, 
    item: { name: string, price: number, type: string },
    method: 'pix' | 'credit'
  ): Promise<CheckoutResponse> {
    try {
      // Tenta chamar o N8N real
      const response = await fetch(N8N_GATEWAY_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'checkout', // Roteador do N8N
          user_id: userId,
          amount: item.price,
          description: item.name,
          type: item.type,
          method: method 
        })
      });

      if (!response.ok) throw new Error("Erro ao criar pagamento");
      return await response.json();

    } catch (error) {
      console.log(`Modo Dev: Gerando pagamento simulado (${method})`);
      
      return new Promise(resolve => {
        setTimeout(() => {
          if (method === 'pix') {
            resolve({
              paymentId: "pix_123",
              pixCode: "00020126580014BR.GOV.BCB.PIX0136123e4567-e89b-12d3-a456-426614174000520400005303986540410.005802BR5913Gloova.AI6008Brasilia62070503***6304ABCD"
            });
          } else {
            // Simula um link de pagamento do Mercado Pago
            resolve({
              paymentId: "card_123",
              checkoutUrl: "https://www.mercadopago.com.br/checkout/v1/redirect?pref_id=SIMULACAO"
            });
          }
        }, 1500);
      });
    }
  },

  /**
   * Dispara campanha de marketing via N8N (Email/Push).
   */
  async sendMarketingCampaign(payload: N8NMarketingPayload): Promise<boolean> {
    try {
        console.log("Sending Campaign to N8N...", payload);
        const response = await fetch(N8N_GATEWAY_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                ...payload,
                action: 'marketing' // Roteador do N8N
            })
        });
        if (!response.ok) throw new Error("Erro no envio da campanha");
        return true;
    } catch (error) {
        console.log("Modo Dev: Campanha simulada com sucesso.");
        return true; // Simula sucesso se não houver backend
    }
  }
};

// --- MOCK DATA (Fallback se N8N falhar) ---
const mockDiagnosisResponse = (): DiagnosisResult => ({
  date: new Date().toISOString(),
  analysis_text: "Modo Demo: O serviço N8N parece indisponível ou retornou erro. Verifique se o Workflow está ativo.",
  curvature: "2C",
  porosity: "Média",
  oiliness: "Mista",
  frizz: "Moderado",
  damage_level: "Baixo",
  overall_health: "Boa",
  protocol_30_days: Array.from({ length: 30 }, (_, i) => ({
    day: i + 1,
    type: i % 4 === 0 ? 'Hidratação' : i % 4 === 1 ? 'Nutrição' : i % 4 === 2 ? 'Pausa' : 'Reconstrução',
    instruction: "Protocolo Exemplo: Aplicar máscara de tratamento.",
    completed: false
  }))
});

const mockScanResponse = (compatible: boolean): ProductScanResult => ({
  product_name: "Produto Demo",
  category: "Máscara",
  composition_summary: "Ingredientes Exemplo",
  functions: "Nutrição",
  is_compatible: compatible,
  reason: "Resultado simulado (N8N offline).",
  usage_recommendation: "Usar conforme rótulo."
});

const mockChatResponse = (msg: string) => {
  return `[Demo] N8N Offline. Você disse: "${msg}".`;
};
