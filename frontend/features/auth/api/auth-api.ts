import { apiClient } from "@/lib/api-client";

export interface LoginBody {
  email: string;
  password: string;
}

interface LoginResponse {
  message: string;
  accessToken: string;
  user: {
    email: string;
  };
}

export const login = async (body: LoginBody): Promise<LoginResponse> => {
  const response = await apiClient.post<LoginResponse>("/auth/login", body);

  return response.data;
};
