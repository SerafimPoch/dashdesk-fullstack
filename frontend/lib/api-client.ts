import { useAuthStore } from "@/features/auth/model/auth-store";
import axios from "axios";

export const apiClient = axios.create({
  baseURL: "/api/",
  withCredentials: true,
});

apiClient.interceptors.request.use(
  (config) => {
    const accessToken = useAuthStore.getState().accessToken;

    if (accessToken) {
      config.headers.Authorization = `Bearer ${accessToken}`;
    }

    return config;
  },
  (error) => Promise.reject(error),
);
