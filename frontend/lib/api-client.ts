import axios, { type InternalAxiosRequestConfig } from "axios";
import { toApiError } from "@/lib/api-error";

export const apiClient = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL,
  withCredentials: true,
});

const refreshClient = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL,
  withCredentials: true,
});

type RetryableRequestConfig = InternalAxiosRequestConfig & {
  _retry?: boolean;
};

const SKIP_REFRESH_PATHS = [
  "/auth/login",
  "/auth/logout",
  "/auth/register",
  "/auth/refresh",
];

let refreshPromise: Promise<void> | null = null;

function shouldRefresh(url?: string): boolean {
  if (!url) {
    return false;
  }

  return !SKIP_REFRESH_PATHS.some((path) => url.includes(path));
}

function refreshAccessToken(): Promise<void> {
  if (!refreshPromise) {
    refreshPromise = refreshClient
      .post("/auth/refresh")
      .then(() => undefined)
      .finally(() => {
        refreshPromise = null;
      });
  }

  return refreshPromise;
}

apiClient.interceptors.response.use(
  (response) => response,
  async (error: unknown) => {
    if (!axios.isAxiosError(error)) {
      return Promise.reject(toApiError(error, "Something went wrong"));
    }

    const config = error.config as RetryableRequestConfig | undefined;

    if (
      error.response?.status === 401 &&
      config &&
      !config._retry &&
      shouldRefresh(config.url)
    ) {
      config._retry = true;

      try {
        await refreshAccessToken();

        return apiClient(config);
      } catch (refreshError) {
        return Promise.reject(
          toApiError(refreshError, "Something went wrong"),
        );
      }
    }

    return Promise.reject(toApiError(error, "Something went wrong"));
  },
);
