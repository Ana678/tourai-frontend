// src/services/api/mockData.ts

import {
  Itinerary,
  EvaluationResponse,
} from './evaluationService'; // Importamos as interfaces do serviço real

/**
 * Simula o banco de dados de avaliações.
 * A chave é o 'itineraryActivityId'
 */
export const mockEvaluationsStore = new Map<number, EvaluationResponse>();

// Pré-popula uma avaliação para teste
mockEvaluationsStore.set(101, {
  id: 901,
  rating: 5,
  comment: 'Museu fantástico, adorei a exposição de arte moderna!',
  itineraryActivityId: 101,
});

/**
 * Nosso itinerário mockado
 */
export const mockItinerary: Itinerary = {
  id: 1,
  roadmap: {
    // A interface Itinerary espera um 'roadmap', então simulamos um
    id: 1,
    titulo: 'Viagem Fictícia por Natal',
    descricao: 'Uma viagem de 2 dias pela cidade do sol.',
    // ...outros campos do Roteiro se necessário
  },
  activities: [
    // Esta é a lista de ItineraryActivity
    {
      id: 101, // ID da ItineraryActivity
      time: '2025-11-10T09:00:00',
      activity: { // Esta é a Atividade
        id: 201,
        nome: 'Visita ao Museu da Rampa',
        descricao: 'Museu histórico da 2ª Guerra.',
        local: 'Santos Reis, Natal - RN',
        midiaURL: null,
        tags: ['História', 'Cultura'],
        tipo: 'SISTEMA',
        statusModeracao: 'APROVADO',
      },
    },
    {
      id: 102, // ID da ItineraryActivity
      time: '2025-11-10T13:00:00',
      activity: { // Esta é a Atividade
        id: 202,
        nome: 'Almoço no Camarões Potiguar',
        descricao: 'Restaurante famoso de frutos do mar.',
        local: 'Ponta Negra, Natal - RN',
        midiaURL: null,
        tags: ['Gastronomia', 'Frutos do Mar'],
        tipo: 'SISTEMA',
        statusModeracao: 'APROVADO',
      },
    },
    {
      id: 103, // ID da ItineraryActivity
      time: '2025-11-10T15:30:00',
      activity: { // Esta é a Atividade
        id: 203,
        nome: 'Passeio de Buggy nas Dunas',
        descricao: 'Passeio com emoção pelas dunas de Genipabu.',
        local: 'Genipabu, Extremoz - RN',
        midiaURL: null,
        tags: ['Aventura', 'Praia'],
        tipo: 'SISTEMA',
        statusModeracao: 'APROVADO',
      },
    },
  ],
};
