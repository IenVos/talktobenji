"use client";

import { ConvexAuthNextjsProvider } from "@convex-dev/auth/nextjs";
import { ConvexReactClient } from "convex/react";
import { ReactNode } from "react";

// Bij build op Vercel moet NEXT_PUBLIC_CONVEX_URL in Environment Variables staan.
// Geen trailing slash (anders ontstaat wss://...cloud//api/... en WebSocket faalt).
const convexUrl = (
  process.env.NEXT_PUBLIC_CONVEX_URL || "https://placeholder.convex.cloud"
).replace(/\/$/, "");
const convex = new ConvexReactClient(convexUrl);

export function ConvexClientProvider({ children }: { children: ReactNode }) {
  return (
    <ConvexAuthNextjsProvider client={convex}>
      {children}
    </ConvexAuthNextjsProvider>
  );
}
