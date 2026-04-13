import { create } from "zustand";

type User = {
  id: string;
  email: string;
};

interface AccountState {
  currentUser: User | null;
  setCurrentUser: (data: User | null) => void;
  clearCurrentUser: () => void;
}

export const useAccountStore = create<AccountState>((set) => ({
  currentUser: null,

  setCurrentUser: (data) => {
    set({ currentUser: data });
  },

  clearCurrentUser: () => {
    set({ currentUser: null });
  },
}));
