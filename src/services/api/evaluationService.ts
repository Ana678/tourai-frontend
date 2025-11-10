// src/services/api/evaluationService.ts

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from './api';

// --- Interfaces Baseadas no Backend Java ---

// main/java/br/imd/ufrn/tourai/model/Atividade.java
export interface Atividade {
  id: number;
  nome: string;
  descricao?: string;
  local?: string;
  midiaURL?: string;
  tags: string[];
  tipo: string;
  statusModeracao?: string;
}

// main/java/br/imd/ufrn/tourai/model/ItineraryActivity.java
export interface ItineraryActivity {
  id: number; // ID da ItineraryActivity (importante!)
  activity: Atividade;
  time: string; // LocalDateTime
}

// main/java/br/imd/ufrn/tourai/model/Itinerary.java
export interface Itinerary {
  id: number;
  roadmap: any; // Pode detalhar a interface do Roteiro se necessário
  activities: ItineraryActivity[];
}

// main/java/br/imd/ufrn/tourai/dto/EvaluationRequest.java
export interface EvaluationRequest {
  rating: number;
  comment?: string;
}

// main/java/br/imd/ufrn/tourai/dto/EvaluationResponse.java
export interface EvaluationResponse {
  id: number;
  rating: number;
  comment?: string;
  itineraryActivityId: number;
}

export interface CreateEvaluationInput {
  itineraryActivityId: number;
  data: EvaluationRequest;
}

export interface UpdateEvaluationInput {
  itineraryActivityId: number;
  data: EvaluationRequest;
}

// --- Chaves do React Query ---

export const itineraryKeys = {
  all: ['itineraries'] as const,
  lists: () => [...itineraryKeys.all, 'list'] as const,
  details: () => [...itineraryKeys.all, 'detail'] as const,
  detail: (id: string) => [...itineraryKeys.details(), id] as const,
};

export const evaluationKeys = {
  all: ['evaluations'] as const,
  details: () => [...evaluationKeys.all, 'detail'] as const,
  detail: (itineraryActivityId: number) => [...evaluationKeys.details(), itineraryActivityId] as const,
};

// --- Funções da API ---

/**
 * Busca os detalhes de um itinerário, incluindo suas atividades.
 */
export const getItineraryDetails = async (itineraryId: string): Promise<Itinerary> => {
  const response = await api.get<Itinerary>(`/itineraries/${itineraryId}`);
  return response.data;
};

/**
 * Busca uma avaliação específica para uma ItineraryActivity.
 * Retorna null se não houver avaliação (404), em vez de estourar erro.
 */
export const getEvaluation = async (itineraryActivityId: number): Promise<EvaluationResponse | null> => {
  try {
    const response = await api.get<EvaluationResponse>(`/itineraries/${itineraryActivityId}/evaluation`);
    return response.data;
  } catch (error: any) {
    if (error?.response?.status === 404) {
      return null; // Nenhuma avaliação encontrada, o que é esperado
    }
    throw error; // Outros erros
  }
};

/**
 * Cria uma nova avaliação para uma ItineraryActivity.
 */
export const createEvaluation = async ({ itineraryActivityId, data }: CreateEvaluationInput): Promise<EvaluationResponse> => {
  const response = await api.post<EvaluationResponse>(`/itineraries/${itineraryActivityId}/evaluation`, data);
  return response.data;
};

/**
 * Atualiza uma avaliação existente para uma ItineraryActivity.
 */
export const updateEvaluation = async ({ itineraryActivityId, data }: UpdateEvaluationInput): Promise<EvaluationResponse> => {
  const response = await api.put<EvaluationResponse>(`/itineraries/${itineraryActivityId}/evaluation`, data);
  return response.data;
};

// --- Hooks do React Query ---

/**
 * Hook para buscar detalhes de um itinerário.
 */
export const useGetItineraryDetails = (itineraryId: string) => {
  return useQuery<Itinerary, Error>({
    queryKey: itineraryKeys.detail(itineraryId),
    queryFn: () => getItineraryDetails(itineraryId),
    enabled: !!itineraryId,
  });
};

/**
 * Hook para criar uma avaliação.
 */
export const useCreateEvaluation = () => {
  const queryClient = useQueryClient();
  return useMutation<EvaluationResponse, Error, CreateEvaluationInput>({
    mutationFn: createEvaluation,
    onSuccess: (data, variables) => {
      // Atualiza o cache da avaliação específica
      queryClient.setQueryData(
        evaluationKeys.detail(variables.itineraryActivityId),
        data
      );
      // Invalida a query de avaliações para garantir consistência (opcional, mas bom)
      queryClient.invalidateQueries({ queryKey: evaluationKeys.detail(variables.itineraryActivityId) });
    },
  });
};

/**
 * Hook para atualizar uma avaliação.
 */
export const useUpdateEvaluation = () => {
  const queryClient = useQueryClient();
  return useMutation<EvaluationResponse, Error, UpdateEvaluationInput>({
    mutationFn: updateEvaluation,
    onSuccess: (data, variables) => {
      // Atualiza o cache da avaliação específica
      queryClient.setQueryData(
        evaluationKeys.detail(variables.itineraryActivityId),
        data
      );
      queryClient.invalidateQueries({ queryKey: evaluationKeys.detail(variables.itineraryActivityId) });
    },
  });
};
