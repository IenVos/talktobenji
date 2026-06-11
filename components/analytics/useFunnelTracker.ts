"use client";

import { useEffect, useRef, useCallback } from "react";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";

/**
 * Hook om losse funnel-stappen af te vuren (bv. checkout: reached/details/pay_click,
 * bedankt: purchased). Deelt de sessie-sleutel met PageViewTracker en respecteert
 * dezelfde IP-uitsluiting. Stappen die afgevuurd worden vóór het IP bekend is,
 * worden in een wachtrij gezet en daarna alsnog verstuurd (mét IP), zodat eigen
 * bezoeken correct uitgesloten kunnen worden.
 */
export function useFunnelTracker(category: "lp" | "checkout", path: string) {
  const trackFunnelStep = useMutation(api.siteAnalytics.trackFunnelStep);

  const sessionIdRef = useRef<string | null>(null);
  const ipRef = useRef<string | undefined>(undefined);
  const ipReadyRef = useRef(false);
  const skipRef = useRef(false);
  const queueRef = useRef<string[]>([]);

  const send = useCallback(
    (step: string) => {
      if (!sessionIdRef.current) return;
      trackFunnelStep({
        category,
        step,
        path,
        sessionId: sessionIdRef.current,
        ip: ipRef.current,
      }).catch(() => {
        // Analytics mogen de app nooit breken
      });
    },
    [trackFunnelStep, category, path]
  );

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (localStorage.getItem("ttb_skip_tracking") === "1") {
      skipRef.current = true;
      return;
    }
    const stored = localStorage.getItem("ttb_sid");
    if (stored) {
      sessionIdRef.current = stored;
    } else {
      const newId = Math.random().toString(36).slice(2);
      localStorage.setItem("ttb_sid", newId);
      sessionIdRef.current = newId;
    }
    fetch("/api/my-ip")
      .then((r) => r.json())
      .then((d) => {
        if (d.ip && d.ip !== "unknown") ipRef.current = d.ip;
      })
      .catch(() => {})
      .finally(() => {
        ipReadyRef.current = true;
        // Verstuur alles wat in de wachtrij stond
        const queued = queueRef.current;
        queueRef.current = [];
        for (const step of queued) send(step);
      });
  }, [send]);

  /** Vuur een funnel-stap af (ontdubbeling gebeurt server-side). */
  return useCallback((step: string) => {
    if (skipRef.current) return;
    if (!ipReadyRef.current) {
      queueRef.current.push(step);
      return;
    }
    send(step);
  }, [send]);
}
