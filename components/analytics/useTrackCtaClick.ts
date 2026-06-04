"use client";

/**
 * Hook die een CTA-klik registreert in de analytics (buttonClicks).
 * Geef de teruggegeven functie een label mee, bv. de knoptekst.
 *
 * De klik wordt via navigator.sendBeacon() verstuurd, zodat de registratie
 * ook doorgaat als de bezoeker meteen wegnavigeert naar de checkout
 * (een gewone fetch wordt dan afgebroken en ging daardoor verloren).
 *
 * Beheerder-kliks worden overgeslagen via dezelfde "ttb_skip_tracking"-vlag
 * als de PageViewTracker — dit werkt ongeacht je IP/VPN.
 */
export function useTrackCtaClick() {
  return (buttonLabel: string) => {
    try {
      if (localStorage.getItem("ttb_skip_tracking") === "1") return;

      const sessionId = localStorage.getItem("ttb_sid") ?? "";
      const path = window.location.pathname;
      const payload = JSON.stringify({ path, buttonLabel, sessionId });

      const blob = new Blob([payload], { type: "application/json" });
      if (navigator.sendBeacon && navigator.sendBeacon("/api/track-cta", blob)) {
        return;
      }
      // Fallback als sendBeacon niet beschikbaar is of mislukt.
      fetch("/api/track-cta", {
        method: "POST",
        body: payload,
        headers: { "Content-Type": "application/json" },
        keepalive: true,
      }).catch(() => {});
    } catch {
      // Tracking mag de bezoeker nooit blokkeren.
    }
  };
}
