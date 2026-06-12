"use client";

import { useEffect, useRef } from "react";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { usePathname } from "next/navigation";

/**
 * Onzichtbaar meetpunt voor een blok op een landingspagina. Plaats dit bovenin elk
 * blok dat je wilt meten. De SectieTracker nummert ze automatisch op DOM-volgorde
 * (blok 1, 2, 3, ...) en weet zo hoeveel blokken een pagina heeft. Zo past de meting
 * zich vanzelf aan elke pagina aan, ongeacht het aantal of soort blokken.
 */
export function SectieMarker() {
  return <div data-ttb-blok="" aria-hidden="true" style={{ height: 0 }} />;
}

/**
 * Meet hoe ver een bezoeker door een landingspagina komt, op BLOKKEN in plaats van
 * percentages van de paginahoogte (device-onafhankelijk). De tracker telt de blok-
 * meetpunten op de pagina, vuurt het totaal (`blokken_<N>`), en vuurt `block_<i>`
 * zodra blok i in beeld komt. Blok 1 is de noemer (iedereen die begon).
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

    // Tel de blok-meetpunten (DOM-volgorde) en koppel elk aan een index 1..N.
    const markers = Array.from(document.querySelectorAll<HTMLElement>("[data-ttb-blok]"));
    const indexVan = new Map<HTMLElement, number>();
    markers.forEach((m, i) => indexVan.set(m, i + 1));
    const totaal = markers.length;

    // Haal IP op voor uitsluiting, vuur dan pas "load" + het bloktotaal (zodat IP meegaat).
    let cancelled = false;
    fetch("/api/my-ip")
      .then((r) => r.json())
      .then((d) => {
        if (d.ip && d.ip !== "unknown") ipRef.current = d.ip;
      })
      .catch(() => {})
      .finally(() => {
        if (cancelled) return;
        fire("load");
        if (totaal > 0) fire(`blokken_${totaal}`);
      });

    // Observeer de blokken: vuur block_<i> zodra blok i in beeld komt.
    let observer: IntersectionObserver | null = null;
    if (totaal > 0 && "IntersectionObserver" in window) {
      observer = new IntersectionObserver(
        (entries) => {
          for (const entry of entries) {
            if (!entry.isIntersecting) continue;
            const i = indexVan.get(entry.target as HTMLElement);
            if (i) fire(`block_${i}`);
          }
        },
        // Iets in beeld schuiven voordat het meetelt, zodat een blok echt gezien is.
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
