"use client";

import { useEffect, useRef } from "react";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { usePathname } from "next/navigation";

export function PageViewTracker() {
  const pathname = usePathname();
  const trackPageView = useMutation(api.siteAnalytics.trackPageView);
  const updateDuration = useMutation(api.siteAnalytics.updateDuration);

  const sessionIdRef = useRef<string | null>(null);
  const deviceRef = useRef<string>("desktop");
  const pageLoadTimeRef = useRef<number>(Date.now());
  const lastPathRef = useRef<string | null>(null);

  // Initialiseer sessionId en device eenmalig
  useEffect(() => {
    const stored = localStorage.getItem("ttb_sid");
    if (stored) {
      sessionIdRef.current = stored;
    } else {
      const newId = Math.random().toString(36).slice(2);
      localStorage.setItem("ttb_sid", newId);
      sessionIdRef.current = newId;
    }
    deviceRef.current = window.innerWidth < 768 ? "mobile" : "desktop";
  }, []);

  // Track paginabezoek bij pathname-wijziging
  useEffect(() => {
    if (!sessionIdRef.current) return;

    // Reset paginalaadtijd bij elke routewijziging
    pageLoadTimeRef.current = Date.now();
    lastPathRef.current = pathname;

    trackPageView({
      path: pathname ?? "/",
      sessionId: sessionIdRef.current ?? "",
      device: deviceRef.current,
    }).catch(() => {
      // Negeer fouten – analytics mogen de app nooit breken
    });
  }, [pathname, trackPageView]);

  // Sla verblijfsduur op bij het verlaten van de pagina
  useEffect(() => {
    const handleBeforeUnload = () => {
      if (!sessionIdRef.current || !lastPathRef.current) return;
      const duration = Math.round((Date.now() - pageLoadTimeRef.current) / 1000);
      if (duration <= 0) return;
      updateDuration({
        sessionId: sessionIdRef.current,
        path: lastPathRef.current,
        duration,
      }).catch(() => {
        // Negeer fouten
      });
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, [updateDuration]);

  return null;
}
