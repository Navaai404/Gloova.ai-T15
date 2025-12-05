// api/proxy.js
// Vercel Serverless Function para Proxy do N8N

export default async function handler(req, res) {
  // 1. Configurar CORS (Permitir acesso de qualquer lugar ou do seu domínio)
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  // 2. Tratar requisição OPTIONS (Preflight)
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  // 3. Verificar se é POST (N8N espera POST)
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    // 4. Definir a URL do N8N (Produção)
    // Você pode colocar fixo aqui ou pegar do Body se quiser dinâmico, 
    // mas por segurança é melhor usar a URL do seu webhook real ou ler do body se for dinâmico.
    
    // Lógica: O App vai mandar a URL de destino no corpo ou usaremos uma padrão?
    // O app atual envia para '/api/proxy'. Vamos fazer o proxy ler do serviço ou usar uma fixa?
    // Para flexibilidade total com o Painel Admin, vamos fazer o App enviar a URL alvo num header customizado
    // OU vamos assumir que o N8N é sempre o mesmo.
    
    // Melhor abordagem: O App envia o payload normal. O Proxy manda para a URL fixa do N8N.
    // Mas como seu N8N muda no Admin, vamos fazer o App enviar a URL alvo no body (meta-campo) ou header.
    
    // Vamos simplificar: O App vai mandar para o N8N direto via Proxy se o service estiver configurado para usar proxy.
    // Para facilitar, vou fazer o proxy encaminhar para a URL que você me passou antes, 
    // mas o ideal é o App passar a URL.
    
    // ATUALIZAÇÃO: O App vai enviar o payload completo.
    // Vamos pegar a URL do N8N que está configurada no Admin (o App tem que mandar).
    // Como o App roda no cliente, ele tem que mandar a URL de destino.
    
    const targetUrl = 'https://n8neditor.comercialai.site/webhook-test/webhook-gateway'; // Fallback
    // Se o app mandar um header 'x-n8n-target', usamos ele.
    
    const n8nUrl = req.headers['x-n8n-target'] || targetUrl;

    console.log(`Proxying to: ${n8nUrl}`);

    const response = await fetch(n8nUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(req.body),
    });

    // 5. Ler a resposta do N8N
    const data = await response.text();
    
    // Tentar parsear JSON para devolver bonitinho, ou devolver texto
    try {
        const json = JSON.parse(data);
        return res.status(response.status).json(json);
    } catch (e) {
        // Se não for JSON, devolve objeto com texto
        return res.status(response.status).json({ resposta: data });
    }

  } catch (error) {
    console.error('Proxy Error:', error);
    return res.status(500).json({ error: 'Erro ao conectar com N8N via Proxy', details: error.message });
  }
}