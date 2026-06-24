"use client";

import { useEffect, useState } from "react";
import Script from "next/script";

const COOKIE_CONSENT_KEY = "benji_cookie_consent";

// Leest of de bezoeker akkoord is met statistiek-cookies. Zelfde opslag/shape
// als CookieConsentBanner (benji_cookie_consent → { necessary, analytics }).
function analyticsToegestaan(): boolean {
  if (typeof window === "undefined") return false;
  const stored = localStorage.getItem(COOKIE_CONSENT_KEY);
  if (!stored) return false;
  try {
    const parsed = JSON.parse(stored);
    if (parsed.analytics !== undefined) return parsed.analytics === true;
  } catch {
    if (stored === "true" || stored === "all") return true;
  }
  return false;
}

// Microsoft Clarity (sessie-opnames + heatmaps), bewust pas geladen nadat de
// bezoeker akkoord is met statistiek-cookies — AVG-conform.
export function ClarityConsent() {
  const [toegestaan, setToegestaan] = useState(false);

  useEffect(() => {
    const update = () => setToegestaan(analyticsToegestaan());
    update();
    // De cookiebanner stuurt dit event af zodra de keuze is opgeslagen (zelfde tab),
    // 'storage' vangt wijzigingen in een ander tabblad.
    window.addEventListener("cookie-consent-changed", update);
    window.addEventListener("storage", update);
    return () => {
      window.removeEventListener("cookie-consent-changed", update);
      window.removeEventListener("storage", update);
    };
  }, []);

  if (!toegestaan) return null;

  return (
    <Script id="ms-clarity" strategy="afterInteractive">
      {`(function(c,l,a,r,i,t,y){
c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};
t=l.createElement(r);t.async=1;t.src="https://www.clarity.ms/tag/"+i;
y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y);
})(window, document, "clarity", "script", "xbwjysj1hl");`}
    </Script>
  );
}
