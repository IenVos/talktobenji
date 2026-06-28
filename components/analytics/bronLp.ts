// Onthoudt onzichtbaar (zonder de URL te vervuilen) vanaf welke landingspagina de
// bezoeker naar de checkout ging, zodat de server "checkout bereikt" betrouwbaar
// per LP kan tellen. sessionStorage blijft binnen hetzelfde tabblad bewaard bij de
// navigatie naar /betalen en wordt, anders dan de referrer, niet door mobiele
// browsers afgekapt.
const KEY = "ttb_bron_lp";

export function onthoudBronLp(href: string) {
  try {
    if (href.includes("/betalen")) {
      sessionStorage.setItem(KEY, window.location.pathname);
    }
  } catch {
    /* sessionStorage niet beschikbaar → stil negeren */
  }
}

export function leesBronLp(): string {
  try {
    return sessionStorage.getItem(KEY) || "";
  } catch {
    return "";
  }
}
