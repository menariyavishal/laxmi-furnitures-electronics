"use client";

import { useSession, signOut } from "next-auth/react";

export function useAuth() {
  const { data: session, status } = useSession();

  return {
    user: session?.user,
    role: session?.user?.role,
    isLoading: status === "loading",
    isAuthenticated: status === "authenticated",
    logout: () => signOut({ callbackUrl: "/login" }),
  };
}
