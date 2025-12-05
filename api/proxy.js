// api/proxy.js
// Vercel Serverless Function para Proxy do N8N (Versão Transparente)

export default async function handler(req, res) {
  // 1. Configurar CORS (Permitir acesso de qualquer lugar)
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, x-n8n-target'
  );

  // 2. Tratar requisição OPTIONS (Preflight)
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    // 3. Obter URL de destino (Enviada pelo App no Header ou Fallback)
    const targetUrl = req.headers['x-n8n-target'] || 'https://n8neditor.comercialai.site/webhook-test/webhook-gateway';

    console.log(`Proxying to: ${targetUrl}`);

    // 4. Repassar a requisição para o N8N
    const response = await fetch(targetUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        // Repassa outros headers se necessário, mas Content-Type é o principal
      },
      body: JSON.stringify(req.body),
    });

    // 5. Ler a resposta do N8N como TEXTO BRUTO primeiro
    const data = await response.text();
    
    // 6. Tentar devolver como JSON se possível, senão devolve como texto
    // Isso garante que o App receba exatamente o que o N8N mandou
    res.setHeader('Content-Type', 'application/json');
    
    try {
        const json = JSON.parse(data);
        return res.status(response.status).json(json);
    } catch (e) {
        // Se não for JSON válido, encapsula num objeto para não quebrar o App
        console.warn('N8N response was not JSON:', data);
        return res.status(response.status).json({ 
            resposta: data, 
            isRawText: true 
        });
    }

  } catch (error) {
    console.error('Proxy Error:', error);
    return res.status(500).json({ error: 'Erro no Proxy Vercel', details: error.message });
  }
}