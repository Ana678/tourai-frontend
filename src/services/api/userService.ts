import { api } from "./api";
import { UserResponse } from "./authService"; 

export const searchUsers = async (query: string): Promise<UserResponse[]> => {
  if (!query || query.length < 2) return [];

  const response = await api.get<UserResponse[]>("/users/search", {
    params: { query },
  });
  return response.data;
};

export const fetchUserStats = async (userId: number) => {
  const response = await api.get(`/users/${userId}/stats`);
  return response.data; // Retorna { roteiros: 0, itinerarios: 0, postagens: 0 }
};

export const fetchUserProfile = async (userId: number) => {
  const response = await api.get(`/users/${userId}`);
  return response.data;
};
