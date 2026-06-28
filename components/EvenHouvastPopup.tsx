"use client";

import { useEffect, useState } from "react";

/**
 * Zachte uitnodiging die één keer per sessie verschijnt zodra de bezoeker ~80%
 * van de pagina heeft gezien (LP of checkout). Biedt de gratis Even Houvast-instap
 * aan als kleinere stap dan het volledige programma. Per pagina aan/uit te zetten.
 */

const SESSIE_KEY = "ttb_eh_popup_gezien";

const ALINEAS = [
  "Soms is de stap naar een volledig programma nog te groot. En dat hoeft ook niet vandaag.",
  "Maar als je hier bent, draag je iets. En dat verdient een plek.",
  "Even Houvast is gratis, en het kost je maar een paar minuten.",
  "Benji stelt je vijf korte vragen over je huisdier. Over wie hij of zij was, wat je mist, wat je bij wil houden. Je kunt antwoorden typen, inspreken, of een foto toevoegen.",
  "Van jouw antwoorden maakt Benji een persoonlijke brief, om te bewaren, om op terug te lezen, voor jezelf.",
  "Geen programma. Geen verplichting. Gewoon een klein moment voor het verlies dat je draagt.",
];

export function EvenHouvastPopup({
  enabled,
  evenHouvastUrl = "/even-houvast",
}: {
  enabled: boolean;
  evenHouvastUrl?: string;
}) {
  const [open, setOpen] = useState(false);
  const [gesloten, setGesloten] = useState(false);

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
    // Direct checken voor korte pagina's die al voorbij 80% staan.
    checkScroll();
    return () => window.removeEventListener("scroll", checkScroll);
  }, [enabled]);

  if (!enabled || !open || gesloten) return null;

  const sluit = () => setGesloten(true);

  return (
    <div
      role="dialog"
      aria-modal="true"
      onClick={sluit}
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 9999,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 16,
        background: "rgba(40, 34, 28, 0.45)",
        backdropFilter: "blur(2px)",
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          position: "relative",
          width: "100%",
          maxWidth: 440,
          maxHeight: "90vh",
          overflowY: "auto",
          background: "#fdf9f4",
          borderRadius: 24,
          padding: "32px 26px 26px",
          boxShadow: "0 20px 60px rgba(0,0,0,0.25)",
        }}
      >
        <button
          onClick={sluit}
          aria-label="Sluiten"
          style={{
            position: "absolute",
            top: 14,
            right: 16,
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

        <h3
          style={{
            margin: "0 0 14px",
            fontSize: 20,
            fontWeight: 700,
            color: "#3f372f",
            lineHeight: 1.3,
          }}
        >
          Nog niet klaar? Dat begrijp ik. 💙
        </h3>

        {ALINEAS.map((tekst, i) => (
          <p
            key={i}
            style={{
              margin: "0 0 12px",
              fontSize: 15,
              lineHeight: 1.6,
              color: "#5a5249",
            }}
          >
            {tekst}
          </p>
        ))}

        <a
          href={evenHouvastUrl}
          style={{
            display: "block",
            marginTop: 18,
            textAlign: "center",
            padding: "14px 18px",
            borderRadius: 16,
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
            marginTop: 12,
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
