import { create } from "zustand";

interface AuthState {
  accessToken: string | null;
  isAuthInitialized: boolean | null;
  setAccessToken: (token: string) => void;
  setAuthInitialized: (value: boolean) => void;
  clearAccessToken: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  accessToken: null,
  isAuthInitialized: null,

  setAccessToken: (token) => {
    set({ accessToken: token });
  },

  setAuthInitialized: (value) => {
    set({ isAuthInitialized: value });
  },

  clearAccessToken: () => {
    set({ accessToken: null });
  },
}));
