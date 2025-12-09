import { api } from './api';

export interface AIRecommendation {
  title: string;
  description: string;
  tags: string[];
}

export const getAIRecommendations = async (userId: number): Promise<AIRecommendation[]> => {
  try {
    const response = await api.get<any>('/ai/recommendations', {
      params: { userId }
    });

    const data = response.data;

    if (typeof data === 'object') {
      return Array.isArray(data) ? data : [];
    }

    if (typeof data === 'string') {
      const cleanJson = data.replace(/```json/g, '').replace(/```/g, '').trim();
      return JSON.parse(cleanJson);
    }

    return [];

  } catch (e) {
    console.error("Erro ao processar resposta da IA:", e);
    return [];
  }
};
