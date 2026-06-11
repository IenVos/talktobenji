"use client";

import { useEffect, useRef } from "react";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { usePathname } from "next/navigation";

/**
 * Meet hoe ver een bezoeker door een pagina scrollt (25/50/75/100%) en
 * registreert dit als funnel-stappen. Vuurt ook één "load"-event af bij binnenkomst,
 * zodat we het aantal bezoekers als noemer hebben.
 *
 * - category "lp": path = het huidige pad (standaard).
 * - category "checkout": geef de product-slug mee als `path`, zodat de scroll-diepte
 *   samenvalt met de checkout-funnel van dat product.
 */
export function ScrollDepthTracker({
  category,
  path,
}: {
  category: "lp" | "checkout";
  path?: string;
}) {
  const pathname = usePathname();
  const trackFunnelStep = useMutation(api.siteAnalytics.trackFunnelStep);

  const sessionIdRef = useRef<string | null>(null);
  const ipRef = useRef<string | undefined>(undefined);
  const firedRef = useRef<Set<string>>(new Set());

  const effectivePath = path ?? pathname ?? "/";

  useEffect(() => {
    if (typeof window === "undefined") return;
    // Beheerder-vlag: niet tracken
    if (localStorage.getItem("ttb_skip_tracking") === "1") return;

    // Sessie-id (zelfde sleutel als PageViewTracker)
    const stored = localStorage.getItem("ttb_sid");
    if (stored) {
      sessionIdRef.current = stored;
    } else {
      const newId = Math.random().toString(36).slice(2);
      localStorage.setItem("ttb_sid", newId);
      sessionIdRef.current = newId;
    }

    const fire = (step: string) => {
      if (!sessionIdRef.current) return;
      if (firedRef.current.has(step)) return;
      firedRef.current.add(step);
      trackFunnelStep({
        category,
        step,
        path: effectivePath,
        sessionId: sessionIdRef.current,
        ip: ipRef.current,
      }).catch(() => {
        // Analytics mogen de app nooit breken
      });
    };

    // Haal IP op voor uitsluiting, vuur dan pas "load" (zodat IP meegaat)
    let cancelled = false;
    fetch("/api/my-ip")
      .then((r) => r.json())
      .then((d) => {
        if (d.ip && d.ip !== "unknown") ipRef.current = d.ip;
      })
      .catch(() => {})
      .finally(() => {
        if (!cancelled) fire("load");
      });

    const checkScroll = () => {
      const doc = document.documentElement;
      const scrollable = doc.scrollHeight - doc.clientHeight;
      // Korte pagina (niets te scrollen) = direct als volledig gezien beschouwen
      if (scrollable <= 0) {
        fire("scroll_25");
        fire("scroll_50");
        fire("scroll_75");
        fire("scroll_100");
        return;
      }
      const pct = ((window.scrollY || doc.scrollTop) / scrollable) * 100;
      if (pct >= 25) fire("scroll_25");
      if (pct >= 50) fire("scroll_50");
      if (pct >= 75) fire("scroll_75");
      if (pct >= 95) fire("scroll_100");
    };

    window.addEventListener("scroll", checkScroll, { passive: true });
    // Ook één keer meteen meten (voor korte pagina's of als al gescrold is)
    checkScroll();

    return () => {
      cancelled = true;
      window.removeEventListener("scroll", checkScroll);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [category, effectivePath]);

  return null;
}
