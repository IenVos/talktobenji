"use client";

import { useEffect, useRef } from "react";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { usePathname } from "next/navigation";

/**
 * Onzichtbaar markeringspuntje voor een sectie op een landingspagina. Plaats dit
 * bovenin het blok dat je wilt meten (Prijs, Reviews, FAQ, finale CTA). De
 * SectieTracker vuurt een funnel-stap zodra dit punt in beeld komt, ongeacht
 * schermgrootte. Zo betekent "Reviews gezien" op mobiel hetzelfde als op desktop.
 */
export function SectieMarker({ naam }: { naam: string }) {
  return <div data-ttb-sectie={naam} aria-hidden="true" style={{ height: 0 }} />;
}

/**
 * Meet hoe ver een bezoeker door een landingspagina komt, op CONTENT in plaats van
 * op percentages: hij vuurt één "load"-event bij binnenkomst (de noemer) en daarna
 * een `section_<naam>`-event zodra elke gemarkeerde sectie in beeld komt. Dat is
 * device-onafhankelijk, anders dan een percentage van de paginahoogte.
 *
 * Vervangt de scroll-percentage-meting voor landingspagina's. De checkout blijft de
 * losse ScrollDepthTracker gebruiken.
 */
export function SectieTracker() {
  const pathname = usePathname();
  const trackFunnelStep = useMutation(api.siteAnalytics.trackFunnelStep);

  const sessionIdRef = useRef<string | null>(null);
  const ipRef = useRef<string | undefined>(undefined);
  const firedRef = useRef<Set<string>>(new Set());

  const effectivePath = pathname ?? "/";

  useEffect(() => {
    if (typeof window === "undefined") return;
    // Beheerder-vlag: niet tracken
    if (localStorage.getItem("ttb_skip_tracking") === "1") return;

    // Sessie-id (zelfde sleutel als PageViewTracker / ScrollDepthTracker)
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
        category: "lp",
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

    // Observeer alle sectie-markeringen: vuur zodra er één in beeld komt.
    const markers = Array.from(document.querySelectorAll<HTMLElement>("[data-ttb-sectie]"));
    let observer: IntersectionObserver | null = null;
    if (markers.length > 0 && "IntersectionObserver" in window) {
      observer = new IntersectionObserver(
        (entries) => {
          for (const entry of entries) {
            if (!entry.isIntersecting) continue;
            const naam = (entry.target as HTMLElement).dataset.ttbSectie;
            if (naam) fire(`section_${naam}`);
          }
        },
        // Iets in beeld schuiven voordat het meetelt, zodat een sectie echt gezien is.
        { root: null, rootMargin: "0px 0px -15% 0px", threshold: 0 }
      );
      markers.forEach((m) => observer!.observe(m));
    }

    return () => {
      cancelled = true;
      observer?.disconnect();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [effectivePath]);

  return null;
}
