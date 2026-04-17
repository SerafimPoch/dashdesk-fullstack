import { apiClient } from "@/lib/api-client";

export interface LoginBody {
  email: string;
  password: string;
}

export interface SignUpBody {
  name: string;
  email: string;
  password: string;
}

interface LoginResponse {
  message: string;
  user: {
    email: string;
  };
}

interface SignUpResponse {
  message: string;
}

interface MeResponse {
  id: string;
  email: string;
}

export async function login(body: LoginBody): Promise<LoginResponse> {
  const response = await apiClient.post<LoginResponse>("/auth/login", body);

  return response.data;
}

export async function getMe(): Promise<MeResponse> {
  const response = await apiClient.get<MeResponse>("/auth/me");

  return response.data;
}

export async function refresh(): Promise<void> {
  await apiClient.post("/auth/refresh");
}

export async function signUp(body: SignUpBody): Promise<SignUpResponse> {
  const response = await apiClient.post<SignUpResponse>("/auth/register", body);

  return response.data;
}
