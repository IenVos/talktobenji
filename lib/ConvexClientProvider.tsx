"use client";

import { ConvexProvider, ConvexReactClient } from "convex/react";
import { ReactNode } from "react";

// Bij build op Vercel moet NEXT_PUBLIC_CONVEX_URL in Environment Variables staan.
// Anders gebruiken we een placeholder zodat de build niet crasht; runtime vereist echte URL.
const convexUrl =
  process.env.NEXT_PUBLIC_CONVEX_URL || "https://placeholder.convex.cloud";
const convex = new ConvexReactClient(convexUrl);

export function ConvexClientProvider({ children }: { children: ReactNode }) {
  return <ConvexProvider client={convex}>{children}</ConvexProvider>;
}
