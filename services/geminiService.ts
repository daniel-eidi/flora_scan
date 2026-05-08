import { PlantData } from '../types';

export class UnauthorizedError extends Error {
  constructor(message = 'Token de acesso inválido.') {
    super(message);
    this.name = 'UnauthorizedError';
  }
}

const FETCH_TIMEOUT_MS = 75_000;

export const identifyPlant = async (base64Image: string, accessToken: string): Promise<PlantData> => {
  const sizeKb = Math.round((base64Image.length * 3) / 4 / 1024);
  console.info(`[identifyPlant] enviando imagem ~${sizeKb} KB`);

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

  try {
    const response = await fetch('/api/identify', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Access-Token': accessToken,
      },
      body: JSON.stringify({ image: base64Image }),
      signal: controller.signal,
    });

    if (response.status === 401) {
      throw new UnauthorizedError();
    }

    if (!response.ok) {
      const { error } = await response.json().catch(() => ({ error: 'Falha na identificação.' }));
      throw new Error(error || `Erro ${response.status}`);
    }

    return (await response.json()) as PlantData;
  } catch (err) {
    if (err instanceof DOMException && err.name === 'AbortError') {
      throw new Error(`Tempo esgotado após ${FETCH_TIMEOUT_MS / 1000}s. Verifique sua conexão.`);
    }
    throw err;
  } finally {
    clearTimeout(timeoutId);
  }
};
