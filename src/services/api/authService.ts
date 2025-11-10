import { useMutation } from '@tanstack/react-query';
import { api } from './api';

// Interface atualizada para incluir os campos opcionais do backend
export interface UserRegisterRequest {
  name: string;
  email: string;
  password?: string;
  profilePhotoUrl?: string;
  bio?: string;
  interests?: string[];
}
export interface UserLoginRequest {
  email: string;
  password?: string;
}

// Interface atualizada para receber os campos completos do backend
export interface UserResponse {
  id: number;
  name: string;
  email: string;
  profilePhotoUrl?: string;
  bio?: string;
  interests?: string[];
}

// --- Funções de API ---

const registerUser = async (data: UserRegisterRequest): Promise<UserResponse> => {
  const response = await api.post<UserResponse>('/users', data);
  return response.data;
};

const loginUser = async (data: UserLoginRequest): Promise<UserResponse> => {
  const response = await api.post<UserResponse>('/users/auth/login', data);
  return response.data;
};

// ADICIONADO: Função de atualização
// A UserRegisterRequest serve bem aqui, pois o backend espera um UserRequest.java
const updateUser = async ({ id, data }: { id: number, data: Omit<UserRegisterRequest, 'password'> }): Promise<UserResponse> => {
  const response = await api.put<UserResponse>(`/users/${id}`, data);
  return response.data;
};


// --- Hooks de Mutação ---

export const useRegisterUser = () => {
  return useMutation<UserResponse, Error, UserRegisterRequest>({
    mutationFn: registerUser,
  });
};

export const useLoginUser = () => {
  return useMutation<UserResponse, Error, UserLoginRequest>({
    mutationFn: loginUser,
  });
};

// ADICIONADO: Hook de atualização
export const useUpdateUser = () => {
  return useMutation<UserResponse, Error, { id: number, data: Omit<UserRegisterRequest, 'password'> }>({
    mutationFn: updateUser,
  });
};
