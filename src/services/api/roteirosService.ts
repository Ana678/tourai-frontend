// src/services/api/roteirosService.ts
import { api } from './api';

// --- Tipos ---

export type Roteiro = {
  id: string;
  title: string;
  description: string | null;
  tags?: string[]; // Tags do ROTEIRO
  activities: number;
};

export type Atividade = {
  id: string;
  name: string;
  description: string | null;
  location: string;
  media_url: string | null;
  tags?: string[]; // Tags da ATIVIDADE
};

export type CreateRoteiroDTO = {
  title: string;
  description: string;
  atividades: string[];
  tags?: string[]; // Tags do ROTEIRO
  visibility?: string;
  user_id: string | number;
};

/**
 * Busca os roteiros de UM usuário.
 */
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
      tags: roteiro.tags || [], // Tags do ROTEIRO
      activities: roteiro.activities?.length || 0,
    }));
    return roteirosFormatados;

  } catch (error) {
    console.error("Erro ao buscar roteiros:", error);
    throw error;
  }
};

/**
 * Busca todas as atividades públicas E as do usuário.
 */
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

/**
 * Cria um novo roteiro E ASSOCIA AS ATIVIDADES UMA A UMA.
 */
export const createRoteiro = async (dto: CreateRoteiroDTO, userId: string | number) => {
  try {
    // --- ETAPA 1: Criar o Roteiro (Roadmap) ---
    const roteiroResponse = await api.post('/roadmaps', {
      title: dto.title,
      description: dto.description,
      owner: { id: userId },
      visibility: dto.visibility || "PUBLIC",
      status: "APPROVED",
      tags: dto.tags || [], // Tags do ROTEIRO
      activities: [],
    }, {
      params: { userId }
    });

    const novoRoteiro = roteiroResponse.data;
    const roadmapId = novoRoteiro.id;

    // --- ETAPA 2: Associar as Atividades ---
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

/**
 * Deleta um roteiro.
 */
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

// --- FUNÇÕES DE ATIVIDADE ---

export type CreateAtividadeDTO = {
  name: string;
  description: string;
  location: string;
  tags?: string[]; // Tags da ATIVIDADE
};

/**
 * Cria uma nova atividade.
 */
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