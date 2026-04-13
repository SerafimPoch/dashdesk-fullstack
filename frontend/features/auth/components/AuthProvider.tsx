"use client";

import { useEffect } from "react";
import { useAuthStore } from "../model/auth-store";
import { getMe, refresh } from "../api/auth-api";
import { useShallow } from "zustand/shallow";
import { useAccountStore } from "@/features/account/model/account-store";

export function AuthProvider({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const { setCurrentUser, clearCurrentUser } = useAccountStore(
    useShallow((state) => ({
      setCurrentUser: state.setCurrentUser,
      clearCurrentUser: state.clearCurrentUser,
    })),
  );

  const { accessToken, setAccessToken, clearAccessToken, setAuthInitialized } =
    useAuthStore(
      useShallow((state) => ({
        accessToken: state.accessToken,
        setAccessToken: state.setAccessToken,
        clearAccessToken: state.clearAccessToken,
        setAuthInitialized: state.setAuthInitialized,
      })),
    );

  useEffect(() => {
    const refreshToken = async () => {
      try {
        const data = await refresh();
        setAccessToken(data.accessToken);

        const user = await getMe();

        setCurrentUser(user);
      } catch {
        clearAccessToken();
        clearCurrentUser();
      } finally {
        setAuthInitialized(true);
      }
    };

    if (!accessToken) {
      refreshToken();
    }
  }, [
    accessToken,
    setAccessToken,
    clearAccessToken,
    setAuthInitialized,
    clearCurrentUser,
    setCurrentUser,
  ]);

  return <>{children}</>;
}
