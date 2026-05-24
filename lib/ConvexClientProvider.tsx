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

  // Stabiel op token-string, niet op het hele session-object — voorkomt
  // onnodige Convex-herauth (en flikkering) bij elke next-auth refetch
  const convexToken = session?.convexToken ?? null;

  const fetchAccessToken = useCallback(
    async ({ forceRefreshToken }: { forceRefreshToken: boolean }) => {
      if (forceRefreshToken) {
        const freshSession = await getSession();
        return freshSession?.convexToken ?? null;
      }
      return convexToken;
    },
    [convexToken]
  );

  return {
    isLoading: status === "loading",
    isAuthenticated: status === "authenticated" && !!convexToken,
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
