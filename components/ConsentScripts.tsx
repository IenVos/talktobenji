"use client";

import { useEffect, useState } from "react";
import Script from "next/script";

const COOKIE_CONSENT_KEY = "benji_cookie_consent";

// Leest of de bezoeker akkoord is met statistiek-/trackingcookies. Zelfde opslag/shape
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

// Tracking-scripts die pas mogen laden ná toestemming (AVG-conform):
//  - Microsoft Clarity: sessie-opnames + heatmaps (statistieken)
//  - Meta Pixel: meet advertentie-effectiviteit (marketing)
// Beide hangen aan dezelfde 'statistieken'-toestemming uit de cookiebanner.
export function ConsentScripts() {
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
    <>
      <Script id="meta-pixel" strategy="afterInteractive">
        {`!function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?
n.callMethod.apply(n,arguments):n.queue.push(arguments)};
if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
n.queue=[];t=b.createElement(e);t.async=!0;
t.src=v;s=b.getElementsByTagName(e)[0];
s.parentNode.insertBefore(t,s)}(window,document,'script',
'https://connect.facebook.net/en_US/fbevents.js');
fbq('init','1255091969361681');fbq('track','PageView');`}
      </Script>
      <Script id="ms-clarity" strategy="afterInteractive">
        {`(function(c,l,a,r,i,t,y){
c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};
t=l.createElement(r);t.async=1;t.src="https://www.clarity.ms/tag/"+i;
y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y);
})(window, document, "clarity", "script", "xbwjysj1hl");`}
      </Script>
    </>
  );
}
