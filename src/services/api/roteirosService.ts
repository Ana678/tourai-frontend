import { api } from './api';

// --- Tipos de Paginação ---

export interface Page<T> {
  content: T[];
  totalPages: number;
  totalElements: number;
  last: boolean;
  size: number;
  number: number;
  first: boolean;
  numberOfElements: number;
  empty: boolean;
}

// --- Tipos de Entidades ---

export type Roteiro = {
  id: string;
  title: string;
  description: string | null;
  tags?: string[];
  activities: number; // Contagem de atividades
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

export type CreateAtividadeDTO = {
  name: string;
  description: string;
  location: string;
  tags?: string[];
};

// --- Funções de Serviço ---

export const fetchRoteiros = async (
  userId: string | number, 
  page: number = 0, 
  size: number = 10
): Promise<Page<Roteiro>> => {
  if (!userId) {
    return {
      content: [],
      totalPages: 0,
      totalElements: 0,
      last: true,
      size,
      number: page,
      first: true,
      numberOfElements: 0,
      empty: true
    };
  }
  
  try {
    // Faz a chamada tipando o retorno como Page<any> pois o backend retorna objetos crus
    const response = await api.get<Page<any>>('/roadmaps/mine', {
      params: { 
        userId,
        page, 
        size  
      }
    });

    // Formata os itens individuais da lista (content)
    const roteirosFormatados = response.data.content.map((roteiro: any) => ({
      id: roteiro.id,
      title: roteiro.title,
      description: roteiro.description,
      tags: roteiro.tags || [],
      activities: roteiro.activities?.length || 0,
    }));

    // Retorna a estrutura da página mantendo os metadados, mas com o conteúdo formatado
    return {
      ...response.data,
      content: roteirosFormatados
    };

  } catch (error) {
    console.error("Erro ao buscar roteiros:", error);
    throw error;
  }
};

export const fetchAtividades = async (
  userId: string | number,
  page: number = 0,
  size: number = 10
): Promise<Page<Atividade>> => {
  if (!userId) {
     return {
      content: [],
      totalPages: 0,
      totalElements: 0,
      last: true,
      size,
      number: page,
      first: true,
      numberOfElements: 0,
      empty: true
    };
  }

  try {
    const response = await api.get<any>('/activities', {
      params: { 
        userId,
        page,
        size
      }
    });

    const data = response.data;

    // Caso 1: A API retornou a estrutura de página correta
    if (data && Array.isArray(data.content)) {
      return data as Page<Atividade>;
    }

    // Caso 2: Fallback se a API retornar um array direto (compatibilidade)
    if (Array.isArray(data)) {
        return {
            content: data as Atividade[],
            totalPages: 1,
            totalElements: data.length,
            size: data.length,
            number: 0,
            first: true,
            last: true,
            numberOfElements: data.length,
            empty: data.length === 0
        };
    }

    console.warn("A API /activities não retornou uma estrutura esperada.", data);
    return {
      content: [],
      totalPages: 0,
      totalElements: 0,
      last: true,
      size,
      number: page,
      first: true,
      numberOfElements: 0,
      empty: true
    };

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
      activities: []
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