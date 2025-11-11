import { useMutation, useQuery, useQueryClient, useQueries } from '@tanstack/react-query';
import { api } from './api';
import { ItineraryDTO } from './itinerariesService';

export interface EvaluationRequest {
  rating: number;
  comment?: string;
}

export interface EvaluationResponse {
  id: number;
  rating: number;
  comment?: string;
  itineraryActivityId: number;
}


export type ItineraryDetails = ItineraryDTO;

export interface CreateEvaluationInput {
  itineraryActivityId: number;
  data: EvaluationRequest;
}

export interface UpdateEvaluationInput {
  itineraryActivityId: number;
  data: EvaluationRequest;
}


export const itineraryKeys = {
  all: ['itineraries'] as const,
  details: () => [...itineraryKeys.all, 'detail'] as const,
  detail: (id: string | number) => [...itineraryKeys.details(), id] as const,
};

export const evaluationKeys = {
  all: ['evaluations'] as const,
  details: () => [...evaluationKeys.all, 'detail'] as const,
  detail: (itineraryActivityId: number) => [...evaluationKeys.details(), itineraryActivityId] as const,
};

export const getItineraryDetails = async (itineraryId: string | number): Promise<ItineraryDetails> => {
    const response = await api.get<ItineraryDetails>(`/itineraries/${itineraryId}`);
    return response.data;
};

export const getEvaluation = async (itineraryActivityId: number): Promise<EvaluationResponse | null> => {
  try {
    const response = await api.get<EvaluationResponse>(`/itineraries/${itineraryActivityId}/evaluation`);
    return response.data;
  } catch (error: any) {
    if (error?.response?.status === 404) {
      return null;
    }
    throw error;
  }
};

export const createEvaluation = async ({ itineraryActivityId, data }: CreateEvaluationInput): Promise<EvaluationResponse> => {
  const response = await api.post<EvaluationResponse>(`/itineraries/${itineraryActivityId}/evaluation`, data);
  return response.data;
};

export const updateEvaluation = async ({ itineraryActivityId, data }: UpdateEvaluationInput): Promise<EvaluationResponse> => {
  const response = await api.put<EvaluationResponse>(`/itineraries/${itineraryActivityId}/evaluation`, data);
  return response.data;
};

export const useGetItineraryDetails = (itineraryId?: string | number) => {
  return useQuery<ItineraryDetails, Error>({
    queryKey: itineraryKeys.detail(itineraryId!),
    queryFn: () => getItineraryDetails(itineraryId!),
    enabled: !!itineraryId,
  });
};

export const useCreateEvaluation = () => {
  const queryClient = useQueryClient();
  return useMutation<EvaluationResponse, Error, CreateEvaluationInput>({
    mutationFn: createEvaluation,
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: evaluationKeys.details() });
    },
  });
};

export const useUpdateEvaluation = () => {
  const queryClient = useQueryClient();
  return useMutation<EvaluationResponse, Error, UpdateEvaluationInput>({
    mutationFn: updateEvaluation,
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: evaluationKeys.details() });
    },
  });
};
