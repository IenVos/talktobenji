"use client";

import {
  ConvexProviderWithAuth,
  ConvexReactClient,
} from "convex/react";
import { SessionProvider, useSession } from "next-auth/react";
import type { Session } from "next-auth";
import { ReactNode, useMemo } from "react";

// Bij build op Vercel moet NEXT_PUBLIC_CONVEX_URL in Environment Variables staan.
// Geen trailing slash (anders ontstaat wss://...cloud//api/... en WebSocket faalt).
const convexUrl = (
  process.env.NEXT_PUBLIC_CONVEX_URL || "https://placeholder.convex.cloud"
).replace(/\/$/, "");
const convex = new ConvexReactClient(convexUrl);

function convexTokenFromSession(session: Session | null): string | null {
  const s = session as (Session & { convexToken?: string | null }) | null;
  return s?.convexToken ?? null;
}

function useAuth() {
  const { data: session, update } = useSession();
  const convexToken = convexTokenFromSession(session);
  return useMemo(
    () => ({
      isLoading: false,
      isAuthenticated: session !== null,
      fetchAccessToken: async ({ forceRefreshToken }: { forceRefreshToken: boolean }) => {
        if (forceRefreshToken) {
          const newSession = await update();
          return convexTokenFromSession(newSession ?? null);
        }
        return convexToken;
      },
    }),
    [session?.user, convexToken, update]
  );
}

export function ConvexClientProvider({
  children,
  session,
}: {
  children: ReactNode;
  session: Session | null;
}) {
  return (
    <SessionProvider session={session}>
      <ConvexProviderWithAuth client={convex} useAuth={useAuth}>
        {children}
      </ConvexProviderWithAuth>
    </SessionProvider>
  );
}
