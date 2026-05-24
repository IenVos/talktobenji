"use client";

import { ConvexProviderWithAuth, ConvexReactClient } from "convex/react";
import { useSession, getSession } from "next-auth/react";
import { ReactNode, useCallback } from "react";

const convexUrl = (
  process.env.NEXT_PUBLIC_CONVEX_URL || "https://placeholder.convex.cloud"
).replace(/\/$/, "");
const convex = new ConvexReactClient(convexUrl);

function useAuth() {
  const { data: session, status } = useSession();

  const fetchAccessToken = useCallback(
    async ({ forceRefreshToken }: { forceRefreshToken: boolean }) => {
      if (forceRefreshToken) {
        const freshSession = await getSession();
        return freshSession?.convexToken ?? null;
      }
      return session?.convexToken ?? null;
    },
    [session]
  );

  return {
    isLoading: status === "loading",
    isAuthenticated: status === "authenticated" && !!session?.convexToken,
    fetchAccessToken,
  };
}

export function ConvexClientProvider({ children }: { children: ReactNode }) {
  return (
    <ConvexProviderWithAuth client={convex} useAuth={useAuth}>
      {children}
    </ConvexProviderWithAuth>
  );
}
