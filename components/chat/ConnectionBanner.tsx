"use client";

import { useConvexConnectionState } from "convex/react";

/**
 * Toont een melding wanneer er geen verbinding is met Convex (offline/geen internet).
 */
export function ConnectionBanner() {
  const connectionState = useConvexConnectionState();
  const isDisconnected = connectionState.hasEverConnected && !connectionState.isWebSocketConnected;

  if (!isDisconnected) return null;

  return (
    <div
      className="fixed bottom-0 left-0 right-0 z-[9998] px-4 py-3 bg-amber-500 text-amber-950 text-sm text-center shadow-[0_-2px_8px_rgba(0,0,0,0.15)]"
      style={{ paddingBottom: "max(0.75rem, calc(0.5rem + env(safe-area-inset-bottom)))" }}
      role="alert"
    >
      <span className="font-medium">Geen verbinding.</span>{" "}
      Controleer je internet en vernieuw de pagina.
    </div>
  );
}
