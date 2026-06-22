"use client";

import { useEffect, useRef, useState } from "react";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { usePathname } from "next/navigation";

/** Leid het besturingssysteem af uit de user-agent (iOS / Android / Windows / macOS / Linux). */
function detectOS(): string {
  if (typeof navigator === "undefined") return "Overig";
  const ua = navigator.userAgent || "";
  if (/android/i.test(ua)) return "Android";
  if (/iphone|ipad|ipod/i.test(ua)) return "iOS";
  // iPad op iOS 13+ meldt zich als "Macintosh"; herken via touch-ondersteuning.
  if (/macintosh/i.test(ua) && navigator.maxTouchPoints > 1) return "iOS";
  if (/windows/i.test(ua)) return "Windows";
  if (/macintosh|mac os x/i.test(ua)) return "macOS";
  if (/linux/i.test(ua)) return "Linux";
  return "Overig";
}

export function PageViewTracker() {
  const pathname = usePathname();
  const trackPageView = useMutation(api.siteAnalytics.trackPageView);
  const updateDuration = useMutation(api.siteAnalytics.updateDuration);

  const sessionIdRef = useRef<string | null>(null);
  const deviceRef = useRef<string>("desktop");
  const osRef = useRef<string>("Overig");
  const ipRef = useRef<string | undefined>(undefined);
  const pageLoadTimeRef = useRef<number>(Date.now());
  const lastPathRef = useRef<string | null>(null);
  // ipReady wordt true zodra de IP-fetch klaar is (succes of fout)
  const [ipReady, setIpReady] = useState(false);

  // Initialiseer sessionId, device en IP eenmalig
  useEffect(() => {
    // Sla tracking over als beheerder-vlag gezet is
    if (localStorage.getItem("ttb_skip_tracking") === "1") {
      setIpReady(false);
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
    deviceRef.current = window.innerWidth < 768 ? "mobile" : window.innerWidth < 1024 ? "tablet" : "desktop";
    osRef.current = detectOS();
    // Haal IP op voor uitsluiting – track pas nadat dit klaar is
    fetch("/api/my-ip")
      .then((r) => r.json())
      .then((d) => { if (d.ip && d.ip !== "unknown") ipRef.current = d.ip; })
      .catch(() => {})
      .finally(() => setIpReady(true));
  }, []);

  // Track paginabezoek bij pathname-wijziging, maar wacht op IP
  useEffect(() => {
    if (!ipReady || !sessionIdRef.current) return;

    // Reset paginalaadtijd bij elke routewijziging
    pageLoadTimeRef.current = Date.now();
    lastPathRef.current = pathname;

    trackPageView({
      path: pathname ?? "/",
      sessionId: sessionIdRef.current ?? "",
      device: deviceRef.current,
      os: osRef.current,
      ip: ipRef.current,
      referrer: document.referrer || undefined,
    }).catch(() => {
      // Negeer fouten – analytics mogen de app nooit breken
    });
  }, [pathname, trackPageView, ipReady]);

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
