"use client";

import { useEffect, useState } from "react";

/**
 * Zachte uitnodiging die één keer per sessie vanaf de rechterkant inschuift zodra
 * de bezoeker ~80% van de pagina heeft gezien (LP of checkout). Biedt de gratis
 * Even Houvast-instap aan als kleinere stap dan het volledige programma.
 *
 * Per pagina aan/uit te zetten én de tekst is per pagina aan te passen:
 *  - eerste regel = kop
 *  - regels daaronder = alinea's (lege regels worden genegeerd)
 *  - inline-opmaak: **vet**, *schuin*, _onderstreept_
 *  - een afbeelding: zet een regel "[afbeelding:https://...]"
 */

const SESSIE_KEY = "ttb_eh_popup_gezien";

export const EVEN_HOUVAST_POPUP_DEFAULT_TEKST = [
  "Nog niet klaar? Dat begrijp ik. 💙",
  "Soms is de stap naar een volledig programma nog te groot. En dat hoeft ook niet vandaag.",
  "Maar als je hier bent, draag je iets. En dat verdient een plek.",
  "Even Houvast is gratis, en het kost je maar een paar minuten.",
  "Benji stelt je vijf korte vragen over je huisdier. Over wie hij of zij was, wat je mist, wat je bij wil houden. Je kunt antwoorden typen, inspreken, of een foto toevoegen.",
  "Van jouw antwoorden maakt Benji een persoonlijke brief, om te bewaren, om op terug te lezen, voor jezelf.",
  "Geen programma. Geen verplichting. Gewoon een klein moment voor het verlies dat je draagt.",
].join("\n");

const IMG_RE = /^\[(?:afbeelding|img):(.+)\]$/i;
const KNOP_RE = /^\[(?:knop|cta|button):(.+)\]$/i;
// Opsommingsregel (✓, •, -, – of —) → zelfde vinkje-stijl als de LP/checkout.
const BULLET_RE = /^\s*(?:✓|•|‣|·|-|–|—)\s+(.+)$/;
const STANDAARD_KNOP = "Begin gratis met Even Houvast →";

// Rond badge met vinkje, identiek aan de LP/checkout-bullets.
function Vinkje() {
  return (
    <span
      style={{
        flexShrink: 0,
        width: 20,
        height: 20,
        borderRadius: 9999,
        background: "#eef1f6",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        marginTop: 2,
      }}
    >
      <svg width="11" height="9" viewBox="0 0 10 8" fill="none">
        <path d="M1 4l2.5 2.5L9 1" stroke="#6d84a8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </span>
  );
}

// Inline-opmaak: **vet**, *schuin*, _onderstreept_.
function renderInline(text: string): React.ReactNode[] {
  const parts = text.split(/(\*\*[\s\S]+?\*\*|\*[\s\S]+?\*|_[\s\S]+?_)/g);
  return parts.map((part, k) => {
    if (part.startsWith("**") && part.endsWith("**")) return <strong key={k}>{part.slice(2, -2)}</strong>;
    if (part.startsWith("*") && part.endsWith("*")) return <em key={k}>{part.slice(1, -1)}</em>;
    if (part.startsWith("_") && part.endsWith("_")) return <u key={k}>{part.slice(1, -1)}</u>;
    return <span key={k}>{part}</span>;
  });
}

// Hang een "via=popup"-signaal (+ de bronpagina) aan de knop-link, zodat een
// Even Houvast-lead herkenbaar als "Pop-up" wordt vastgelegd.
function metPopupBron(href: string): string {
  if (typeof window === "undefined") return href;
  try {
    const sep = href.includes("?") ? "&" : "?";
    const pad = encodeURIComponent(window.location.pathname || "");
    return `${href}${sep}via=popup&bronpad=${pad}`;
  } catch {
    return href;
  }
}

export function EvenHouvastPopup({
  enabled,
  tekst,
  knopTekst,
  knopUrl,
  knopKleur,
  evenHouvastUrl = "/even-houvast",
}: {
  enabled: boolean;
  tekst?: string;
  knopTekst?: string;
  knopUrl?: string;
  knopKleur?: string;
  evenHouvastUrl?: string;
}) {
  const [open, setOpen] = useState(false); // 80% bereikt
  const [gesloten, setGesloten] = useState(false); // definitief weg
  const [ingeschoven, setIngeschoven] = useState(false); // animatie-stand

  useEffect(() => {
    if (!enabled) return;
    try {
      if (sessionStorage.getItem(SESSIE_KEY)) return;
    } catch {
      /* sessionStorage niet beschikbaar */
    }

    let getoond = false;
    const checkScroll = () => {
      if (getoond) return;
      const onder = window.scrollY + window.innerHeight;
      const hoogte = document.documentElement.scrollHeight;
      if (hoogte <= 0) return;
      if (onder / hoogte >= 0.8) {
        getoond = true;
        setOpen(true);
        try {
          sessionStorage.setItem(SESSIE_KEY, "1");
        } catch {
          /* negeer */
        }
        window.removeEventListener("scroll", checkScroll);
      }
    };

    window.addEventListener("scroll", checkScroll, { passive: true });
    checkScroll(); // direct checken voor korte pagina's
    return () => window.removeEventListener("scroll", checkScroll);
  }, [enabled]);

  // Zachtjes inschuiven zodra de pop-up mag verschijnen.
  useEffect(() => {
    if (open && !gesloten) {
      const id = requestAnimationFrame(() => setIngeschoven(true));
      return () => cancelAnimationFrame(id);
    }
  }, [open, gesloten]);

  if (!enabled || !open || gesloten) return null;

  const sluit = () => {
    setIngeschoven(false); // uitschuiven
    setTimeout(() => setGesloten(true), 420); // daarna pas unmounten
  };

  const regels = (tekst && tekst.trim() ? tekst : EVEN_HOUVAST_POPUP_DEFAULT_TEKST)
    .split("\n")
    .map((r) => r.trim())
    .filter(Boolean);
  const titel = regels[0] ?? "";

  // Knop-regel ([knop:Tekst] of [knop:Tekst|https://link]) eruit halen; de rest
  // zijn alinea's/afbeeldingen.
  let knopLabel = STANDAARD_KNOP;
  let knopHref = evenHouvastUrl;
  const inhoud: string[] = [];
  for (const regel of regels.slice(1)) {
    const knop = regel.match(KNOP_RE);
    if (knop) {
      const [label, url] = knop[1].split("|").map((s) => s.trim());
      if (label) knopLabel = label;
      if (url) knopHref = url;
      continue;
    }
    inhoud.push(regel);
  }

  // Aparte admin-velden hebben voorrang op de [knop:...]-regel.
  if (knopTekst && knopTekst.trim()) knopLabel = knopTekst.trim();
  if (knopUrl && knopUrl.trim()) knopHref = knopUrl.trim();
  const knopKleurFinal = (knopKleur && knopKleur.trim()) || "#6d84a8";

  return (
    <div
      style={{
        position: "fixed",
        right: 0,
        bottom: 0,
        zIndex: 9999,
        padding: 16,
        maxWidth: "100vw",
        pointerEvents: "none",
      }}
    >
      <div
        role="dialog"
        aria-modal="false"
        style={{
          pointerEvents: "auto",
          width: "min(380px, calc(100vw - 32px))",
          maxHeight: "calc(100vh - 32px)",
          overflowY: "auto",
          background: "#fdf9f4",
          borderRadius: 20,
          padding: "26px 22px 22px",
          boxShadow: "0 16px 48px rgba(40,34,28,0.22)",
          border: "1px solid rgba(160,148,136,0.18)",
          transform: ingeschoven ? "translateX(0)" : "translateX(calc(100% + 28px))",
          opacity: ingeschoven ? 1 : 0,
          transition: "transform 0.42s cubic-bezier(0.22,1,0.36,1), opacity 0.42s ease",
        }}
      >
        <button
          onClick={sluit}
          aria-label="Sluiten"
          style={{
            position: "absolute",
            top: 12,
            right: 14,
            border: "none",
            background: "transparent",
            fontSize: 22,
            lineHeight: 1,
            cursor: "pointer",
            color: "#9b8e80",
          }}
        >
          ×
        </button>

        {titel && (
          <h3 style={{ margin: "0 0 12px", fontSize: 19, fontWeight: 700, color: "#3f372f", lineHeight: 1.3, paddingRight: 18 }}>
            {renderInline(titel)}
          </h3>
        )}

        {(() => {
          const blokken: React.ReactNode[] = [];
          let i = 0;
          while (i < inhoud.length) {
            const regel = inhoud[i];
            const img = regel.match(IMG_RE);
            if (img) {
              blokken.push(
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  key={i}
                  src={img[1].trim()}
                  alt=""
                  style={{ width: "100%", borderRadius: 14, margin: "6px 0 12px", display: "block" }}
                />
              );
              i++;
              continue;
            }
            if (BULLET_RE.test(regel)) {
              const items: string[] = [];
              while (i < inhoud.length && BULLET_RE.test(inhoud[i])) {
                items.push(inhoud[i].match(BULLET_RE)![1]);
                i++;
              }
              blokken.push(
                <ul key={`b${i}`} style={{ listStyle: "none", margin: "4px 0 12px", padding: 0, display: "flex", flexDirection: "column", gap: 8 }}>
                  {items.map((it, j) => (
                    <li key={j} style={{ display: "flex", alignItems: "flex-start", gap: 8 }}>
                      <Vinkje />
                      <span style={{ fontSize: 14.5, lineHeight: 1.5, color: "#5a5249" }}>{renderInline(it)}</span>
                    </li>
                  ))}
                </ul>
              );
              continue;
            }
            blokken.push(
              <p key={i} style={{ margin: "0 0 11px", fontSize: 14.5, lineHeight: 1.6, color: "#5a5249" }}>
                {renderInline(regel)}
              </p>
            );
            i++;
          }
          return blokken;
        })()}

        <a
          href={metPopupBron(knopHref)}
          style={{
            display: "block",
            marginTop: 16,
            textAlign: "center",
            padding: "13px 18px",
            borderRadius: 14,
            background: knopKleurFinal,
            color: "#fff",
            fontWeight: 600,
            fontSize: 15,
            textDecoration: "none",
          }}
        >
          {knopLabel}
        </a>
      </div>
    </div>
  );
}
