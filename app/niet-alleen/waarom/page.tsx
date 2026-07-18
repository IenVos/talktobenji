"use client";

/**
 * Brugpagina: warme, korte pagina op maat van het verliestype, tussen de taster
 * en de checkout. Geen lang verhaal (dat is de koude LP voor advertenties), maar
 * "dit is wat deze dertig dagen jóu brengen". Bereikbaar via de taster:
 * /niet-alleen/waarom?type=huisdier&n=Anna → knop naar de bestaande checkout.
 */

import { Suspense, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { normVerlies, checkoutPad, type Verliestype } from "@/lib/nietAlleenTypes";
import { useFunnelTracker } from "@/components/analytics/useFunnelTracker";

// Per type: het label in de eyebrow, de titel die de pijn benoemt, en de eerste
// (type-specifieke) waarde-regel. De rest is gedeeld. Later admin-bewerkbaar.
const BRUG: Record<Verliestype, { label: string; titel: string; eersteWaarde: string; arc: string }> = {
  persoon: {
    label: "voor het gemis van iemand die je liefhad",
    titel: "het gemis van iemand die je liefhad gaat niet zomaar weg.",
    eersteWaarde: "Elke dag een klein, zacht moment voor het gemis van iemand die er altijd was.",
    arc: "eerst gewoon aanwezig zijn, dan ruimte voor het verhaal, dan wat hij of zij jou gaf, en langzaam weer een beetje vooruit.",
  },
  huisdier: {
    label: "voor het verlies van je huisdier",
    titel: "het is stil geworden in huis.",
    eersteWaarde: "Elke dag een klein, zacht moment voor het gemis van een maatje dat elke dag om je heen was.",
    arc: "eerst gewoon aanwezig zijn, dan ruimte voor het verhaal, dan wat hij of zij jou gaf, en langzaam weer een beetje vooruit.",
  },
  scheiding: {
    label: "voor het einde van je relatie",
    titel: "een relatie die eindigt laat een stille leegte achter.",
    eersteWaarde: "Elke dag een klein, zacht moment voor een verlies dat geen kaart en geen afscheid kent.",
    arc: "eerst gewoon aanwezig zijn, dan ruimte voor wat je doormaakt, dan wat je meeneemt, en langzaam weer een beetje vooruit.",
  },
  eenzaamheid: {
    label: "voor de dagen dat je je alleen voelt",
    titel: "je hoeft je niet elke dag alleen te voelen.",
    eersteWaarde: "Elke dag een klein, zacht moment voor de stille uren waarop niemand vraagt hoe het gaat.",
    arc: "eerst gewoon aanwezig zijn, dan ruimte voor wat je voelt, dan kleine stappen naar verbinding, en langzaam weer een beetje lucht.",
  },
  kinderloos: {
    label: "voor het verdriet om een kind dat er nooit kwam",
    titel: "het verdriet om een kind dat er nooit kwam telt volledig.",
    eersteWaarde: "Elke dag een klein, zacht moment voor een gemis dat bijna niemand ziet.",
    arc: "eerst gewoon aanwezig zijn, dan ruimte voor het verdriet, dan wat je toch draagt, en langzaam weer een beetje vooruit.",
  },
  algemeen: {
    label: "voor het verdriet dat je draagt",
    titel: "wat je draagt is echt, wat het ook is.",
    eersteWaarde: "Elke dag een klein, zacht moment voor het gemis dat anderen niet altijd zien.",
    arc: "eerst gewoon aanwezig zijn, dan ruimte voor het verhaal, dan wat je toch meeneemt, en langzaam weer een beetje vooruit.",
  },
};

function hoofdletter(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

function WaaromInner() {
  const params = useSearchParams();
  const type = normVerlies(params?.get("type"));
  const naam = (params?.get("n") || "").trim();
  const email = (params?.get("e") || "").trim();
  const voornaam = naam.split(" ")[0];
  const c = BRUG[type];

  // Meet de brugpagina: "reached" (met herkomst) en de klik door naar de checkout.
  const fireFunnel = useFunnelTracker("brug", "/niet-alleen/waarom");
  useEffect(() => {
    fireFunnel("reached");
  }, [fireFunnel]);

  const titel = voornaam ? `${voornaam}, ${c.titel}` : hoofdletter(c.titel);

  const waarde = [
    c.eersteWaarde,
    "Oefeningen om even te landen op de zware dagen, zoals de ademcirkel die je net zag.",
    "Je eigen woorden, dag na dag bewaard. Om terug te lezen wanneer je wilt.",
    "Benji, die doorvraagt en er is. Ook om drie uur 's nachts.",
    "Geen huiswerk, geen druk. Jij bepaalt het tempo, elke dag opnieuw.",
  ];

  return (
    <div className="min-h-screen" style={{ background: "#fdf9f4" }}>
      <div className="max-w-lg mx-auto px-6 py-10">
        <p className="text-xs uppercase tracking-widest font-medium mb-4" style={{ color: "#9a8168", letterSpacing: "0.1em" }}>
          Niet Alleen · {c.label}
        </p>
        <h1 className="text-2xl font-semibold leading-snug mb-3" style={{ color: "#3d3530", textWrap: "balance" } as React.CSSProperties}>
          {titel}
        </h1>
        <p className="text-base leading-relaxed mb-6" style={{ color: "#5a5148", textWrap: "pretty" } as React.CSSProperties}>
          Dat gemis gaat niet in dertig dagen weg. Maar je hoeft er niet elke dag in je eentje mee te zitten. Je las de brief en je proefde dag 1 en 12. Dit is wat daarna komt.
        </p>

        <div className="space-y-3.5 mb-6">
          {waarde.map((w, i) => (
            <div key={i} className="flex gap-3 items-start">
              <span aria-hidden style={{ fontSize: 15, lineHeight: "1.6", flexShrink: 0 }}>🍃</span>
              <p className="text-sm leading-relaxed" style={{ color: "#5a5148", margin: 0, textWrap: "pretty" } as React.CSSProperties}>{w}</p>
            </div>
          ))}
        </div>

        <p className="text-sm leading-relaxed italic mb-7 rounded-xl px-4 py-4" style={{ color: "#6b6460", background: "#f6efe6" }}>
          Je hoeft het verdriet niet in één keer te dragen. Niet Alleen knipt het op in dertig kleine stappen die je wél aankunt: {c.arc}
        </p>

        {/* Prijs, rustig, geen haast */}
        <div style={{ borderTop: "1px solid #e8e0d8", paddingTop: 24, textAlign: "center" }}>
          <p className="text-base font-semibold mb-2" style={{ color: "#9a8168" }}>
            Eén keer €37, dat is €1,23 per dag.
          </p>
          <p className="text-sm leading-relaxed mb-5" style={{ color: "#8a8078", maxWidth: 400, margin: "0 auto 1.25rem", textWrap: "pretty" } as React.CSSProperties}>
            Geen abonnement, geen automatische verlenging. Je koopt het één keer. En je begint wanneer jij er klaar voor bent, vandaag of over een maand.
          </p>
          <Link
            href={(() => {
              const qs = new URLSearchParams();
              if (naam) qs.set("n", naam);
              if (email) qs.set("e", email);
              const s = qs.toString();
              return `${checkoutPad(type)}${s ? `?${s}` : ""}`;
            })()}
            onClick={() => fireFunnel("checkout_click")}
            className="inline-block font-semibold text-white px-8 py-3.5 rounded-xl"
            style={{ background: "#6d84a8", fontSize: 15 }}
          >
            Ja, dit gun ik mezelf
          </Link>
          <p className="text-xs leading-relaxed mt-4" style={{ color: "#b0a8a0" }}>
            Je proefde dag 1 en dag 12 al gratis.<br />Bevalt het niet, dan krijg je je geld terug.
          </p>
        </div>
      </div>
    </div>
  );
}

export default function WaaromPage() {
  return (
    <Suspense fallback={<div style={{ minHeight: "100vh", background: "#fdf9f4" }} />}>
      <WaaromInner />
    </Suspense>
  );
}
