import { api } from "./api";
import { UserResponse } from "./authService"; 

export const searchUsers = async (query: string): Promise<UserResponse[]> => {
  if (!query || query.length < 2) return [];

  const response = await api.get<UserResponse[]>("/users/search", {
    params: { query },
  });
  return response.data;
};
