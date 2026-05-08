import type { VercelRequest, VercelResponse } from '@vercel/node';
import { GoogleGenAI, Type } from '@google/genai';

const SYSTEM_INSTRUCTION = `
Você é um botânico especialista e assistente de campo.
Sua tarefa é identificar plantas e árvores através de imagens fornecidas pelo usuário.
Ao receber uma imagem, analise-a cuidadosamente.

Responda SEMPRE em formato JSON com a seguinte estrutura:
{
  "nomeComum": "Nome popular da planta em Português",
  "nomeCientifico": "Nome científico em Latim",
  "acuracia": 95, (um número de 0 a 100 representando sua confiança)
  "precisaMaisInfo": true/false, (se a imagem atual é insuficiente para uma identificação 100% precisa)
  "sugestao": "Explique o que mais você precisa ver para melhorar a precisão: ex: 'preciso de uma foto macro da folha', 'mostre o tronco ou casca', 'mostre a flor de perto'",
  "descricao": "Uma breve descrição botânica da espécie encontrada."
}

Se você não conseguir identificar nada que pareça uma planta, informe isso de forma amigável no campo descricao e coloque acuracia 0.
Mantenha o tom profissional, mas acessível.
`;

export const config = {
  maxDuration: 60,
  api: {
    bodyParser: {
      sizeLimit: '10mb',
    },
  },
};

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const expectedToken = process.env.APP_ACCESS_TOKEN;
  if (!expectedToken) {
    return res.status(500).json({ error: 'APP_ACCESS_TOKEN não configurado no servidor.' });
  }
  const providedToken = req.headers['x-access-token'];
  if (providedToken !== expectedToken) {
    return res.status(401).json({ error: 'Token de acesso inválido.' });
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: 'GEMINI_API_KEY não configurada no servidor.' });
  }

  const { image } = (req.body ?? {}) as { image?: string };
  if (!image || typeof image !== 'string') {
    return res.status(400).json({ error: 'Campo "image" (base64) é obrigatório.' });
  }

  const base64Data = image.includes(',') ? image.split(',')[1] : image;

  try {
    const ai = new GoogleGenAI({ apiKey });

    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: {
        parts: [
          { inlineData: { data: base64Data, mimeType: 'image/jpeg' } },
          { text: 'Identifique esta planta e forneça os detalhes solicitados no formato JSON.' },
        ],
      },
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            nomeComum: { type: Type.STRING },
            nomeCientifico: { type: Type.STRING },
            acuracia: { type: Type.NUMBER },
            precisaMaisInfo: { type: Type.BOOLEAN },
            sugestao: { type: Type.STRING },
            descricao: { type: Type.STRING },
          },
          required: ['nomeComum', 'nomeCientifico', 'acuracia', 'precisaMaisInfo', 'descricao'],
        },
      },
    });

    const text = response.text;
    if (!text) {
      return res.status(502).json({ error: 'Resposta vazia do Gemini.' });
    }

    return res.status(200).json(JSON.parse(text));
  } catch (error) {
    console.error('Erro ao identificar planta:', error);
    const message = error instanceof Error ? error.message : 'Erro desconhecido';
    return res.status(500).json({ error: message });
  }
}
