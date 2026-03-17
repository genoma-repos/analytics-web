import axios from 'axios';
import type { LoginPayload, LoginResponse } from './types';

export const loginRequest = async (
  apiBaseUrl: string,
  payload: LoginPayload,
): Promise<LoginResponse> => {
  const response = await axios.post<LoginResponse>(`${apiBaseUrl.replace(/\/+$/, '')}/login`, payload);
  return response.data;
};

export const getApiErrorMessage = (error: unknown): string => {
  if (axios.isAxiosError(error)) {
    return (error.response?.data as { message?: string } | undefined)?.message || error.message;
  }

  if (error instanceof Error) {
    return error.message;
  }

  return 'Nao foi possivel autenticar';
};
