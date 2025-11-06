import { useMutation } from '@tanstack/react-query';
import { api } from './api';

export interface UserRegisterRequest {
  name: string;
  email: string;
  password?: string;
}
export interface UserLoginRequest {
  email: string;
  password?: string;
}
export interface UserResponse {
  id: number;
  name: string;
  email: string;
}

const registerUser = async (data: UserRegisterRequest): Promise<UserResponse> => {
  const response = await api.post<UserResponse>('/users', data);
  return response.data;
};

const loginUser = async (data: UserLoginRequest): Promise<UserResponse> => {

  const response = await api.post<UserResponse>('/users/auth/login', data);
  return response.data;
};

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
