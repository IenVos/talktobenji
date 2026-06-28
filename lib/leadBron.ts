/**
 * Bepaalt waar een Even Houvast-lead vandaan komt, als één compacte, leesbare
 * regel + de volledige URL als detail. Bewust simpel gehouden.
 *
 * Voorbeelden van `bron`:
 *   "Meta (FB/IG) · /lp/je-mist-iemand"
 *   "Google · /lp/ik-voel-me-eenzaam"
 *   "Direct · /even-houvast"
 *   "zomercampagne · /lp/mijn-relatie-is-voorbij"   (bij utm_campaign)
 */
export function bepaalBron(): { bron: string; bronUrl: string } {
  if (typeof window === "undefined") return { bron: "", bronUrl: "" };
  try {
    const params = new URLSearchParams(window.location.search);
    const utmSource = params.get("utm_source")?.trim();
    const utmCampaign = params.get("utm_campaign")?.trim();
    const fbclid = params.get("fbclid");
    const gclid = params.get("gclid");
    const ref = document.referrer || "";

    let kanaal: string;
    if (utmCampaign) kanaal = utmCampaign;
    else if (utmSource) kanaal = utmSource;
    else if (fbclid || /facebook|fb\.|instagram|fb\b/i.test(ref)) kanaal = "Meta (FB/IG)";
    else if (gclid || /google/i.test(ref)) kanaal = "Google";
    else if (ref) {
      try {
        kanaal = new URL(ref).hostname.replace(/^www\./, "");
      } catch {
        kanaal = "Verwijzing";
      }
    } else {
      kanaal = "Direct";
    }

    const pad = window.location.pathname || "/";
    return { bron: `${kanaal} · ${pad}`, bronUrl: window.location.href };
  } catch {
    return { bron: "", bronUrl: "" };
  }
}
