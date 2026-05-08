import { PlantData } from '../types';

export class UnauthorizedError extends Error {
  constructor(message = 'Token de acesso inválido.') {
    super(message);
    this.name = 'UnauthorizedError';
  }
}

export const identifyPlant = async (base64Image: string, accessToken: string): Promise<PlantData> => {
  const response = await fetch('/api/identify', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Access-Token': accessToken,
    },
    body: JSON.stringify({ image: base64Image }),
  });

  if (response.status === 401) {
    throw new UnauthorizedError();
  }

  if (!response.ok) {
    const { error } = await response.json().catch(() => ({ error: 'Falha na identificação.' }));
    throw new Error(error || `Erro ${response.status}`);
  }

  return (await response.json()) as PlantData;
};
