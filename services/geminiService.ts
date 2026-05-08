import { PlantData } from '../types';

export const identifyPlant = async (base64Image: string): Promise<PlantData> => {
  const response = await fetch('/api/identify', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ image: base64Image }),
  });

  if (!response.ok) {
    const { error } = await response.json().catch(() => ({ error: 'Falha na identificação.' }));
    throw new Error(error || `Erro ${response.status}`);
  }

  return (await response.json()) as PlantData;
};
