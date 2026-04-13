"use client";

import { useAccountStore } from "@/features/account/model/account-store";
import { useAuthStore } from "@/features/auth/model/auth-store";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function DashboardPage() {
  const router = useRouter();

  const user = useAccountStore((state) => state.currentUser);
  const isAuthInitialized = useAuthStore((state) => state.isAuthInitialized);

  useEffect(() => {
    if (!user && isAuthInitialized) {
      router.replace("/");
    }
  }, [user, isAuthInitialized, router]);

  return <p>Dashboard page</p>;
}
