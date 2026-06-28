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

export function EvenHouvastPopup({
  enabled,
  tekst,
  evenHouvastUrl = "/even-houvast",
}: {
  enabled: boolean;
  tekst?: string;
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
  const rest = regels.slice(1);

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

        {rest.map((regel, i) => {
          const img = regel.match(IMG_RE);
          if (img) {
            return (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                key={i}
                src={img[1].trim()}
                alt=""
                style={{ width: "100%", borderRadius: 14, margin: "6px 0 12px", display: "block" }}
              />
            );
          }
          return (
            <p key={i} style={{ margin: "0 0 11px", fontSize: 14.5, lineHeight: 1.6, color: "#5a5249" }}>
              {renderInline(regel)}
            </p>
          );
        })}

        <a
          href={evenHouvastUrl}
          style={{
            display: "block",
            marginTop: 16,
            textAlign: "center",
            padding: "13px 18px",
            borderRadius: 14,
            background: "#6d84a8",
            color: "#fff",
            fontWeight: 600,
            fontSize: 15,
            textDecoration: "none",
          }}
        >
          Begin gratis met Even Houvast →
        </a>

        <button
          onClick={sluit}
          style={{
            display: "block",
            width: "100%",
            marginTop: 10,
            border: "none",
            background: "transparent",
            color: "#9b8e80",
            fontSize: 13,
            cursor: "pointer",
          }}
        >
          Nee, nu even niet
        </button>
      </div>
    </div>
  );
}
