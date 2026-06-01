"use client";

import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";

/**
 * Hook die een CTA-klik registreert in de analytics (buttonClicks).
 * Geef het terugkerende functie een label mee, bv. de knoptekst.
 * Gebruik dit op elke CTA die naar checkout/registratie leidt, zodat
 * kliks zichtbaar worden in het analytics-dashboard.
 */
export function useTrackCtaClick() {
  const trackButtonClick = useMutation(api.siteAnalytics.trackButtonClick);

  return (buttonLabel: string) => {
    const sessionId = localStorage.getItem("ttb_sid") ?? "";
    const path = window.location.pathname;
    fetch("/api/my-ip")
      .then((r) => r.json())
      .then((d) => {
        trackButtonClick({
          path,
          buttonLabel,
          sessionId,
          ip: d.ip && d.ip !== "unknown" ? d.ip : undefined,
        }).catch(() => {});
      })
      .catch(() => {
        trackButtonClick({ path, buttonLabel, sessionId }).catch(() => {});
      });
  };
}
