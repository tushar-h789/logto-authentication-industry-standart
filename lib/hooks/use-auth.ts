"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { LogtoUser } from "@/lib/types/auth";
import { getSession, handleLogout } from "../action/auth-actions";

export function useAuth() {
  const [user, setUser] = useState<LogtoUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const router = useRouter();

  useEffect(() => {
    async function fetchSession() {
      try {
        setIsLoading(true);
        const session = await getSession();
        setUser(session.user || null);
      } catch (err) {
        setError(err instanceof Error ? err : new Error("Auth error"));
      } finally {
        setIsLoading(false);
      }
    }

    fetchSession();
  }, []);

  const logout = async () => {
    try {
      await handleLogout();
      router.push("/login");
    } catch (err) {
      setError(err instanceof Error ? err : new Error("Logout failed"));
    }
  };

  return { user, isLoading, error, logout };
}
