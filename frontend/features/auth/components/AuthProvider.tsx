"use client";

import { useEffect } from "react";
import { useAuthStore } from "../auth.store";
import { getMe } from "../auth.api";
import { useShallow } from "zustand/shallow";
import { useAccountStore } from "@/features/account/account.store";

export function AuthProvider({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const { setCurrentUser } = useAccountStore(
    useShallow((state) => ({
      setCurrentUser: state.setCurrentUser,
    })),
  );

  const { setAuthInitialized } = useAuthStore(
    useShallow((state) => ({
      setAuthInitialized: state.setAuthInitialized,
    })),
  );

  useEffect(() => {
    const initializeAuth = async () => {
      const user = await getMe().catch(() => null);

      if (user) {
        setCurrentUser(user);
      }

      setAuthInitialized(true);
    };

    void initializeAuth();
  }, [setAuthInitialized, setCurrentUser]);

  return <>{children}</>;
}
