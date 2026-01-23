
import { GoogleGenAI, Type } from "@google/genai";
import { PlantData } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });

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

export const identifyPlant = async (base64Image: string): Promise<PlantData> => {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: {
        parts: [
          { inlineData: { data: base64Image.split(',')[1], mimeType: "image/jpeg" } },
          { text: "Identifique esta planta e forneça os detalhes solicitados no formato JSON." }
        ]
      },
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
        responseMimeType: "application/json",
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
          required: ["nomeComum", "nomeCientifico", "acuracia", "precisaMaisInfo", "descricao"]
        }
      }
    });

    const text = response.text;
    if (!text) throw new Error("Não foi possível obter resposta do servidor.");
    
    return JSON.parse(text) as PlantData;
  } catch (error) {
    console.error("Erro ao identificar planta:", error);
    throw error;
  }
};
