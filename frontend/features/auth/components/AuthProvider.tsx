"use client";

import { useEffect } from "react";
import { useAuthStore } from "../model/auth-store";
import { getMe, refresh } from "../api/auth-api";
import { useShallow } from "zustand/shallow";
import { useAccountStore } from "@/features/account/model/account-store";
import { toApiError } from "@/lib/errors/api-error";

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
      try {
        const user = await getMe();

        setCurrentUser(user);
      } catch (error) {
        const apiError = toApiError(error);

        if (apiError.status === 401) {
          try {
            await refresh();

            const user = await getMe();
            setCurrentUser(user);
          } catch {
            // Unauthenticated startup is a normal case.
          }
        }
      } finally {
        setAuthInitialized(true);
      }
    };

    void initializeAuth();
  }, [setAuthInitialized, setCurrentUser]);

  return <>{children}</>;
}
