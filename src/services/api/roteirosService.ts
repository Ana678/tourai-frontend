import { api } from './api';

export type Roteiro = {
  id: string;
  title: string;
  description: string | null;
  tags?: string[];
  activities: number;
};

export type Atividade = {
  id: string;
  name: string;
  description: string | null;
  location: string;
  media_url: string | null;
  tags?: string[];
};

export type CreateRoteiroDTO = {
  title: string;
  description: string;
  atividades: string[];
  tags?: string[];
  visibility?: string;
  user_id: string | number;
};

export const fetchRoteiros = async (userId: string | number): Promise<Roteiro[]> => {
  if (!userId) return [];
  try {
    const response = await api.get('/roadmaps/mine', {
      params: { userId }
    });

    const roteirosFormatados = response.data.map((roteiro: any) => ({
      id: roteiro.id,
      title: roteiro.title,
      description: roteiro.description,
      tags: roteiro.tags || [],
      activities: roteiro.activities?.length || 0,
    }));
    return roteirosFormatados;

  } catch (error) {
    console.error("Erro ao buscar roteiros:", error);
    throw error;
  }
};

export const fetchAtividades = async (userId: string | number): Promise<Atividade[]> => {
  if (!userId) return [];
  try {
    const response = await api.get('/activities', {
      params: { userId }
    });

    const data = response.data;

    if (Array.isArray(data)) {
      return data;
    }
    if (data && Array.isArray(data.content)) {
      return data.content;
    }
    console.warn("A API /activities não devolveu um array.", data);
    return [];

  } catch (error) {
    console.error("Erro ao buscar atividades:", error);
    throw error;
  }
};

export const createRoteiro = async (dto: CreateRoteiroDTO, userId: string | number) => {
  try {
    const roteiroResponse = await api.post('/roadmaps', {
      title: dto.title,
      description: dto.description,
      owner: { id: userId },
      visibility: dto.visibility || "PUBLIC",
      status: "APPROVED",
      tags: dto.tags || [],
      activities: [],
    }, {
      params: { userId }
    });

    const novoRoteiro = roteiroResponse.data;
    const roadmapId = novoRoteiro.id;

    if (dto.atividades && dto.atividades.length > 0) {
      const promessasDeAssociacao = dto.atividades.map(activityId => {
        return api.post(`/roadmaps/${roadmapId}/activities/${activityId}`, null, {
          params: { userId }
        });
      });
      await Promise.all(promessasDeAssociacao);
    }

    return novoRoteiro;

  } catch (error) {
    console.error("Erro ao criar roteiro ou associar atividades:", error);
    throw error;
  }
};

export const deleteRoteiro = async (id: string, userId: string | number) => {
  if (!userId) throw new Error("User ID is required to delete.");
  try {
    await api.delete(`/roadmaps/${id}`, {
      params: { userId }
    });
  } catch (error) {
    console.error("Erro ao deletar roteiro:", error);
    throw error;
  }
};

export type CreateAtividadeDTO = {
  name: string;
  description: string;
  location: string;
  tags?: string[];
};

export const createAtividade = async (dto: CreateAtividadeDTO, userId: string | number) => {
  if (!userId) throw new Error("User ID is required to create.");
  try {
    const response = await api.post('/activities', {
      ...dto,
      creator: { id: userId }
    }, {
      params: { userId }
    });
    return response.data;
  } catch (error) {
    console.error("Erro ao criar atividade:", error);
    throw error;
  }
};

export const favoriteRoteiro = async (id: string, userId: string | number) => {
  if (!userId) throw new Error("User ID is required to favorite.");
  try {
    await api.post(`/favorites/roadmaps/${id}`, null, {
      params: { userId }
    });
  } catch (error) {
    console.error("Erro ao favoritar roteiro:", error);
    throw error;
  }
};

export const unfavoriteRoteiro = async (id: string, userId: string | number) => {
  if (!userId) throw new Error("User ID is required to unfavorite.");
  try {
    await api.delete(`/favorites/roadmaps/${id}`, {
      params: { userId }
    });
  } catch (error) {
    console.error("Erro ao desfavoritar roteiro:", error);
    throw error;
  }
};