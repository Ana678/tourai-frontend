// src/services/api/evaluationService.mock.ts

import { useState, useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { mockItinerary, mockEvaluationsStore } from './mockData';
import {
  Itinerary,
  EvaluationResponse,
  CreateEvaluationInput,
  UpdateEvaluationInput,
  evaluationKeys,
} from './evaluationService'; // Reutilizamos as interfaces e chaves

const SIMULATED_DELAY_MS = 500;

/**
 * Hook MOCKADO para buscar detalhes de um itinerário.
 */
export const useGetItineraryDetails = (itineraryId: string) => {
  const [isLoading, setIsLoading] = useState(true);
  const [data, setData] = useState<Itinerary | undefined>(undefined);

  useEffect(() => {
    setIsLoading(true);
    const timer = setTimeout(() => {
      // Em um mock real, você poderia buscar pelo itineraryId,
      // mas aqui vamos apenas retornar o mock padrão.
      setData(mockItinerary);
      setIsLoading(false);
    }, SIMULATED_DELAY_MS);

    return () => clearTimeout(timer);
  }, [itineraryId]);

  return { data, isLoading, isError: false, error: null };
};

/**
 * Função MOCKADA para buscar uma avaliação.
 * É usada pelo 'useQueries' na página.
 */
export const getEvaluation = async (itineraryActivityId: number): Promise<EvaluationResponse | null> => {
  return new Promise(resolve => {
    setTimeout(() => {
      const evaluation = mockEvaluationsStore.get(itineraryActivityId) || null;
      console.log(`[Mock GET] Evaluation for ${itineraryActivityId}:`, evaluation);
      resolve(evaluation);
    }, SIMULATED_DELAY_MS / 2); // Mais rápido que o principal
  });
};

/**
 * Hook MOCKADO para criar uma avaliação.
 */
export const useCreateEvaluation = () => {
  const [isPending, setIsPending] = useState(false);
  const queryClient = useQueryClient();

  const mutate = (
    variables: CreateEvaluationInput,
    options: { onSuccess?: () => void; onError?: (e: Error) => void }
  ) => {
    setIsPending(true);
    console.log('[Mock CREATE] Saving...', variables);
    setTimeout(() => {
      try {
        const newId = Math.floor(Math.random() * 10000); // ID aleatório
        const newEval: EvaluationResponse = {
          id: newId,
          ...variables.data,
          itineraryActivityId: variables.itineraryActivityId,
        };

        mockEvaluationsStore.set(variables.itineraryActivityId, newEval);

        setIsPending(false);
        console.log('[Mock CREATE] Success:', newEval);
        if (options.onSuccess) {
          options.onSuccess();
        }
        // Invalida a query para o useQueries na página recarregar
        queryClient.invalidateQueries({ queryKey: evaluationKeys.detail(variables.itineraryActivityId) });
      } catch (e: any) {
        setIsPending(false);
        console.error('[Mock CREATE] Error:', e);
        if (options.onError) {
          options.onError(e);
        }
      }
    }, SIMULATED_DELAY_MS);
  };

  return { mutate, isPending };
};

/**
 * Hook MOCKADO para atualizar uma avaliação.
 */
export const useUpdateEvaluation = () => {
  const [isPending, setIsPending] = useState(false);
  const queryClient = useQueryClient();

  const mutate = (
    variables: UpdateEvaluationInput,
    options: { onSuccess?: () => void; onError?: (e: Error) => void }
  ) => {
    setIsPending(true);
    console.log('[Mock UPDATE] Saving...', variables);
    setTimeout(() => {
      const existingEval = mockEvaluationsStore.get(variables.itineraryActivityId);

      if (existingEval) {
        const updatedEval = { ...existingEval, ...variables.data };
        mockEvaluationsStore.set(variables.itineraryActivityId, updatedEval);

        setIsPending(false);
        console.log('[Mock UPDATE] Success:', updatedEval);
        if (options.onSuccess) {
          options.onSuccess();
        }
        queryClient.invalidateQueries({ queryKey: evaluationKeys.detail(variables.itineraryActivityId) });
      } else {
        setIsPending(false);
        const error = new Error('Evaluation not found to update');
        console.error('[Mock UPDATE] Error:', error);
        if (options.onError) {
          options.onError(error);
        }
      }
    }, SIMULATED_DELAY_MS);
  };

  return { mutate, isPending };
};
export { evaluationKeys } from './evaluationService';
export type { EvaluationResponse } from './evaluationService';
