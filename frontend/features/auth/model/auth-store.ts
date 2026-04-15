import { create } from "zustand";

interface AuthState {
  isAuthInitialized: boolean;
  setAuthInitialized: (value: boolean) => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  isAuthInitialized: false,

  setAuthInitialized: (value) => {
    set({ isAuthInitialized: value });
  },
}));
