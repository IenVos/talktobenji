"use client";

import { useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";

interface VerliesType {
  code: string;
  naam: string;
  keuzePaginaLabel?: string;
  keuzePaginaEmoji?: string;
  keuzePaginaLpSlug?: string;
}

const DEFAULT_EMOJIS: Record<string, string> = {
  persoon:    "💔",
  huisdier:   "🐾",
  relatie:    "💭",
  kinderloos: "🌱",
};

function CtaButton({ url, label }: { url?: string; label: string }) {
  const base = "inline-block w-full sm:w-auto px-7 py-3.5 rounded-xl font-semibold text-sm text-white text-center transition-opacity";
  if (!url) return <span className={`${base} opacity-50 cursor-default`} style={{ background: "#6d84a8" }}>{label}</span>;
  return <Link href={url} className={`${base} hover:opacity-90`} style={{ background: "#6d84a8" }}>{label}</Link>;
}

function Voordelen({ items }: { items: string[] }) {
  return (
    <ul className="space-y-2 my-5">
      {items.map((item, i) => (
        <li key={i} className="flex items-start gap-2 text-sm" style={{ color: "#6b6460" }}>
          <span className="mt-0.5 flex-shrink-0" style={{ color: "#6d84a8" }}>✦</span>
          <span>{item}</span>
        </li>
      ))}
    </ul>
  );
}

const SECTIE_CONTENT: Record<string, { kop: string; label: string; tekst: string[]; voordelen: string[]; ctaLabel: string }> = {
  persoon: {
    kop: "💔 Verlies van een persoon",
    label: "Je mist iemand.\nEn niemand kan dat echt opvangen.",
    tekst: [
      "Mensen vragen hoe het gaat.\nEn je zegt: “gaat wel.”",
      "Maar wat moet je anders zeggen?\n\nDat je soms nog steeds automatisch aan ze denkt?\nDat je midden op de dag ineens stilvalt?\nDat het 's nachts het hardst binnenkomt?",
      "Je wil het delen.\nMaar niet elke keer het hele verhaal vertellen.\nNiet weer die stilte aan de andere kant.",
    ],
    voordelen: ["Iemand die elke dag even naast je zit", "Ruimte om te voelen zonder oordeel", "Je gedachten ordenen zonder druk", "Van alles alleen dragen → naar even delen"],
    ctaLabel: "Start met Niet Alleen – Verlies Persoon (€37)",
  },
  huisdier: {
    kop: "🐾 Verlies van een dier",
    label: "Ze zeggen: “het was maar een dier.”\nMaar voor jou was het zoveel meer.",
    tekst: [
      "Een maatje.\nRoutine.\nStilte die nu anders voelt.",
      "Je mist de kleine dingen.\nDe vanzelfsprekendheid.\nDe aanwezigheid.",
      "En misschien voelt het alsof je dit niet \"groot genoeg\" mag maken.\n\nDus je zegt er minder over.\nDan je eigenlijk zou willen.",
    ],
    voordelen: ["Erkenning zonder dat je het hoeft te verdedigen", "Dagelijks een moment van zachtheid", "Ruimte voor herinneringen én gemis", "Van stil verdriet → naar gedeeld gevoel"],
    ctaLabel: "Start met Niet Alleen – Verlies Huisdier (€37)",
  },
  relatie: {
    kop: "💭 Einde van een relatie",
    label: "Je relatie is voorbij.\nMaar je hoofd is dat nog niet.",
    tekst: [
      "Je denkt terug.\nAnalyseert.\nTwijfelt.",
      "Was het de juiste keuze?\nHad je iets anders kunnen doen?\nWaarom voelt het nog zo aanwezig?",
      "Overdag red je je wel.\nMaar 's avonds… begint het weer.",
    ],
    voordelen: ["Rust in je hoofd", "Ruimte om te verwerken in jouw tempo", "Iemand die luistert zonder oordeel", "Van blijven malen → naar zacht loslaten"],
    ctaLabel: "Start met Niet Alleen – Relatie (€37)",
  },
  kinderloos: {
    kop: "🌱 Ongewenst kinderloos",
    label: "Ongewenst kinderloos.\nIets wat mensen niet kunnen zien.",
    tekst: [
      "En waarvoor niemand de juiste woorden heeft.",
      "Want het is niet zichtbaar.\nNiet tastbaar.\nMaar het is er. Altijd.",
      "In momenten.\nIn gesprekken.\nIn wat er niet is.\n\nEn misschien voel je je alleen in hoe groot het is.",
    ],
    voordelen: ["Erkenning zonder uitleg", "Ruimte voor rauwe gedachten", "Dagelijkse steun zonder druk", "Van alleen dragen → naar even samen"],
    ctaLabel: "Start met Niet Alleen – Ongewenst kinderloos (€37)",
  },
};

function TypeSectie({ type, sectionRef }: { type: VerliesType; sectionRef: React.RefObject<HTMLDivElement> }) {
  const sectie = SECTIE_CONTENT[type.code];
  const ctaUrl = type.keuzePaginaLpSlug ? `/lp/${type.keuzePaginaLpSlug}` : undefined;

  if (!sectie) {
    return (
      <section ref={sectionRef} id={type.code} className="max-w-lg mx-auto px-6 py-16 space-y-5 scroll-mt-8">
        <p className="text-xs uppercase tracking-widest font-medium" style={{ color: "#b0a8a0" }}>
          {DEFAULT_EMOJIS[type.code] ?? "💙"} {type.naam.split(" — ")[0]}
        </p>
        <h2 className="text-2xl font-semibold" style={{ color: "#3d3530" }}>{type.naam.split(" — ")[0]}</h2>
        <p className="text-base" style={{ color: "#6b6460" }}>Dit programma komt binnenkort beschikbaar.</p>
        <CtaButton url={ctaUrl} label={`Start met Niet Alleen – ${type.naam.split(" — ")[0]} (€37)`} />
      </section>
    );
  }

  return (
    <section ref={sectionRef} id={type.code} className="max-w-lg mx-auto px-6 py-16 space-y-5 scroll-mt-8">
      <p className="text-xs uppercase tracking-widest font-medium" style={{ color: "#b0a8a0" }}>{sectie.kop}</p>
      <h2 className="text-2xl sm:text-3xl font-semibold leading-snug" style={{ color: "#3d3530" }}>
        {sectie.label.split("\n").map((line, i, arr) => (
          <span key={i}>{i === 1 ? <span style={{ fontWeight: 400, color: "#6b6460" }}>{line}</span> : line}{i < arr.length - 1 && <br />}</span>
        ))}
      </h2>
      {sectie.tekst.map((para, i) => (
        <p key={i} className="leading-relaxed" style={{ color: "#6b6460" }}>
          {para.split("\n").map((line, j, arr) => <span key={j}>{line}{j < arr.length - 1 && <br />}</span>)}
        </p>
      ))}
      <div className="border-l-2 pl-5 py-1" style={{ borderColor: "#6d84a8" }}>
        <p className="text-sm font-semibold mb-2" style={{ color: "#6d84a8" }}>Dit is waar Niet Alleen begint</p>
        <p className="text-sm leading-relaxed" style={{ color: "#6b6460" }}>
          Elke dag een moment voor jou.<br />Waar je niets hoeft uit te leggen.
        </p>
      </div>
      <div>
        <p className="text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: "#b0a8a0" }}>Wat het je geeft</p>
        <Voordelen items={sectie.voordelen} />
      </div>
      <CtaButton url={ctaUrl} label={sectie.ctaLabel} />
    </section>
  );
}

export function NietAlleenKeuzeLpView() {
  const types = useQuery(api.verliesTypen.listPublic) ?? [];
  const sectionRefs = useRef<Record<string, React.RefObject<HTMLDivElement>>>({});

  types.forEach(t => {
    if (!sectionRefs.current[t.code]) {
      sectionRefs.current[t.code] = { current: null } as React.RefObject<HTMLDivElement>;
    }
  });

  function kiesType(type: VerliesType) {
    if (type.keuzePaginaLpSlug) {
      window.location.href = `/lp/${type.keuzePaginaLpSlug}`;
      return;
    }
    sectionRefs.current[type.code]?.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  return (
    <div style={{ minHeight: "100vh", background: "#fdf9f4", position: "relative" }}>
      <div style={{ position: "fixed", inset: 0, zIndex: 0 }}>
        <Image src="/images/achtergrond.png" alt="" fill className="object-cover" priority />
        <div style={{ position: "absolute", inset: 0, background: "rgba(253,249,244,0.88)" }} />
      </div>

      <div style={{ position: "relative", zIndex: 1 }}>
        <header className="flex justify-center pt-8 pb-2 px-5">
          <Link href="/">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/images/niet-alleen-logo.png" alt="Niet Alleen" width={88} height={88} />
          </Link>
        </header>

        <section className="max-w-lg mx-auto px-6 pt-10 pb-12 text-center space-y-4">
          <h1 className="text-3xl sm:text-4xl font-semibold leading-snug" style={{ color: "#3d3530" }}>
            Overdag hou je het vol.<br />
            <span style={{ color: "#6b6460", fontWeight: 400 }}>Maar &apos;s nachts… voelt het zwaarder.</span>
          </h1>
          <div className="space-y-3 text-base leading-relaxed max-w-md mx-auto" style={{ color: "#6b6460" }}>
            <p>Je gaat door. Voor de buitenwereld.<br />Maar er is zoveel dat je nergens kwijt kunt.</p>
            <p>Niet omdat er niemand is.<br />Maar omdat je niemand wilt belasten.<br />Of simpelweg niet weet waar je moet beginnen.</p>
          </div>
          <p className="text-base font-medium pt-2" style={{ color: "#3d3530" }}>Je hoeft het niet langer alleen te dragen.</p>
        </section>

        <section className="max-w-md mx-auto px-6 pb-14 space-y-5">
          <div className="text-center space-y-1">
            <p className="text-sm font-medium" style={{ color: "#8a8078" }}>Je hoeft het hier niet uit te leggen.</p>
            <p className="text-base font-semibold" style={{ color: "#3d3530" }}>Kies gewoon wat het dichtst bij je ligt:</p>
          </div>
          <div className="space-y-3">
            {types.map((type) => (
              <button
                key={type.code}
                onClick={() => kiesType(type)}
                className="w-full flex items-center gap-4 px-5 py-4 rounded-2xl border-2 text-left transition-all"
                style={{ borderColor: "#e8e0d8", background: "white", color: "#3d3530" }}
              >
                <span className="text-2xl flex-shrink-0">{type.keuzePaginaEmoji ?? DEFAULT_EMOJIS[type.code] ?? "💙"}</span>
                <span className="text-sm font-medium">{type.keuzePaginaLabel ?? type.naam.split(" — ")[0]}</span>
              </button>
            ))}
          </div>
        </section>

        <div style={{ borderTop: "1px solid #e8e0d8" }} className="max-w-2xl mx-auto" />

        {types.filter(t => !t.keuzePaginaLpSlug).map((type, i) => (
          <div key={type.code}>
            <TypeSectie
              type={type}
              sectionRef={sectionRefs.current[type.code]}
            />
            {i < types.filter(t => !t.keuzePaginaLpSlug).length - 1 && (
              <div style={{ borderTop: "1px solid #e8e0d8" }} className="max-w-2xl mx-auto" />
            )}
          </div>
        ))}

        <div style={{ borderTop: "2px solid #e8e0d8" }} className="max-w-2xl mx-auto" />

        <section className="max-w-lg mx-auto px-6 py-16 space-y-8">
          <div className="space-y-4">
            <h3 className="text-xl font-semibold" style={{ color: "#3d3530" }}>Wat is Niet Alleen precies?</h3>
            <ul className="space-y-2">
              {["30 dagen lang dagelijkse e-mails", "Geschreven als een gesprek (via Benji)", "Met ruimte om te reageren wanneer jij wilt"].map((item, i) => (
                <li key={i} className="flex items-start gap-2 text-sm" style={{ color: "#6b6460" }}>
                  <span style={{ color: "#6d84a8" }}>✦</span>{item}
                </li>
              ))}
            </ul>
            <p className="text-sm" style={{ color: "#8a8078" }}>
              Geen vaste tijden. Geen verwachtingen. Geen druk.<br />Alleen een plek waar jij even kunt zijn.
            </p>
          </div>

          <div className="space-y-3">
            <h3 className="text-xl font-semibold" style={{ color: "#3d3530" }}>Voor wie is dit?</h3>
            <p className="text-sm" style={{ color: "#8a8078" }}>Voor vrouwen die:</p>
            <ul className="space-y-2">
              {["Veel dragen, maar weinig delen", "Niemand willen belasten", "Hun gedachten eerst zelf willen ordenen", "Verlangen naar zachtheid, niet naar oplossingen"].map((item, i) => (
                <li key={i} className="flex items-start gap-2 text-sm" style={{ color: "#6b6460" }}>
                  <span style={{ color: "#6d84a8" }}>✦</span>{item}
                </li>
              ))}
            </ul>
          </div>

          <div className="text-center space-y-4 pt-4">
            <p className="text-base leading-relaxed" style={{ color: "#6b6460" }}>
              Samen maken we het lichter.<br />Je hoeft het niet meer Alleen te dragen.
            </p>
            <p className="text-sm font-semibold" style={{ color: "#3d3530" }}>Kies wat bij je past en begin vandaag</p>
            <div className="space-y-3">
              {types.map((type) => (
                <button
                  key={type.code}
                  onClick={() => kiesType(type)}
                  className="w-full flex items-center gap-3 px-5 py-3.5 rounded-2xl border text-left transition-all hover:border-primary-300"
                  style={{ borderColor: "#e8e0d8", background: "white", color: "#3d3530" }}
                >
                  <span className="text-xl">{type.keuzePaginaEmoji ?? DEFAULT_EMOJIS[type.code] ?? "💙"}</span>
                  <span className="text-sm font-medium">{type.keuzePaginaLabel ?? type.naam.split(" — ")[0]}</span>
                </button>
              ))}
            </div>
          </div>
        </section>

        <footer className="text-center py-8 px-6">
          <p className="text-xs" style={{ color: "#c4bdb6" }}>
            &copy; {new Date().getFullYear()} Talk To Benji ·{" "}
            <Link href="/privacy" className="hover:underline">Privacy</Link>
          </p>
        </footer>
      </div>
    </div>
  );
}
