import { apiClient } from "@/lib/api-client";

export interface LoginBody {
  email: string;
  password: string;
}

interface LoginResponse {
  message: string;
  user: {
    email: string;
  };
}

interface MeResponse {
  id: string;
  email: string;
}

export const login = async (body: LoginBody): Promise<LoginResponse> => {
  const response = await apiClient.post<LoginResponse>("/auth/login", body);

  return response.data;
};

export const getMe = async (): Promise<MeResponse> => {
  const response = await apiClient.get<MeResponse>("/auth/me");

  return response.data;
};

export const refresh = async (): Promise<void> => {
  await apiClient.post("/auth/refresh");
};
