import axios from "axios";
import { toApiError } from "@/lib/errors/api-error";

export const apiClient = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL,
  withCredentials: true,
});

apiClient.interceptors.response.use(
  (response) => response,
  (error: unknown) => Promise.reject(toApiError(error, "Something went wrong")),
);
