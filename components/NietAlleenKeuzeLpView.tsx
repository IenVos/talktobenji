"use client";

import { useRef, useState, type ReactNode } from "react";
import Image from "next/image";
import Link from "next/link";

function IconHeart() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="w-5 h-5">
      <path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 016.364 0L12 7.636l1.318-1.318a4.5 4.5 0 116.364 6.364L12 20.364l-7.682-7.682a4.5 4.5 0 010-6.364z" />
    </svg>
  );
}

function IconChat() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="w-5 h-5">
      <path strokeLinecap="round" strokeLinejoin="round" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
    </svg>
  );
}

function IconUsers() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="w-5 h-5">
      <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
    </svg>
  );
}

function IconPaw() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="w-5 h-5">
      <path strokeLinecap="round" strokeLinejoin="round" d="M8 4a1.5 1.5 0 100 3 1.5 1.5 0 000-3zM16 4a1.5 1.5 0 100 3 1.5 1.5 0 000-3zM5.5 9a1.5 1.5 0 100 3 1.5 1.5 0 000-3zM18.5 9a1.5 1.5 0 100 3 1.5 1.5 0 000-3z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 11c-2.8 0-5 2-5 4.5 0 2 1.2 3 2.8 3.3.7.1 1.4.2 2.2.2s1.5-.1 2.2-.2C15.8 18.5 17 17.5 17 15.5c0-2.5-2.2-4.5-5-4.5z" />
    </svg>
  );
}

function IconLeaf() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="w-5 h-5">
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 22V12" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 12C12 7 8 3 3 3c0 5 3 9 9 9z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 12c0-5 4-9 9-9-1 5-4 9-9 9z" />
    </svg>
  );
}

type TypeKey = "persoon" | "huisdier" | "relatie" | "eenzaamheid" | "kinderloos";

interface Props {
  // Keuze-knoppen
  typeCtaUrlPersoon?: string;
  typeCtaUrlHuisdier?: string;
  typeCtaUrlRelatie?: string;
  typeCtaUrlEenzaamheid?: string;
  typeCtaUrlKinderloos?: string;
  typeButtonLabelPersoon?: string;
  typeButtonLabelHuisdier?: string;
  typeButtonLabelRelatie?: string;
  typeButtonLabelEenzaamheid?: string;
  typeButtonLabelKinderloos?: string;
  defaultCtaUrl?: string;
  // Hero
  kpHeroKop1?: string;
  kpHeroKop2?: string;
  kpHeroTekst?: string;
  kpHeroSlotzin?: string;
  kpKeuzeLabel1?: string;
  kpKeuzeLabel2?: string;
  // Per type
  kpH2Persoon?: string;
  kpTekstPersoon?: string;
  kpCitaatPersoon?: string;
  kpVoordelenPersoon?: string;
  kpCtaTekstPersoon?: string;
  kpH2Huisdier?: string;
  kpTekstHuisdier?: string;
  kpCitaatHuisdier?: string;
  kpVoordelenHuisdier?: string;
  kpCtaTekstHuisdier?: string;
  kpH2Relatie?: string;
  kpTekstRelatie?: string;
  kpCitaatRelatie?: string;
  kpVoordelenRelatie?: string;
  kpCtaTekstRelatie?: string;
  kpH2Eenzaamheid?: string;
  kpTekstEenzaamheid?: string;
  kpCitaatEenzaamheid?: string;
  kpVoordelenEenzaamheid?: string;
  kpCtaTekstEenzaamheid?: string;
  kpH2Kinderloos?: string;
  kpTekstKinderloos?: string;
  kpCitaatKinderloos?: string;
  kpVoordelenKinderloos?: string;
  kpCtaTekstKinderloos?: string;
}

const DEFAULTS = {
  heroKop1: "Overdag hou je het vol.",
  heroKop2: "Maar 's nachts… voelt het zwaarder.",
  heroTekst: "Je gaat door. Voor de buitenwereld.\nMaar er is zoveel dat je nergens kwijt kunt.\n\nNiet omdat er niemand is.\nMaar omdat je niemand wilt belasten.\nOf simpelweg niet weet waar je moet beginnen.",
  heroSlotzin: "Je hoeft het niet langer alleen te dragen.",
  keuzeLabel1: "Je hoeft het hier niet uit te leggen.",
  keuzeLabel2: "Kies gewoon wat het dichtst bij je ligt:",
  buttonLabels: {
    persoon: "Ik mis iemand",
    huisdier: "Ik heb mijn dier verloren",
    relatie: "Relatie voorbij? Laat los en vind rust.",
    eenzaamheid: "Ik voel me eenzaam",
    kinderloos: "Ongewenst kinderloos vind steun en ruimte",
  },
  h2: {
    persoon: "Je mist iemand.|En niemand kan dat echt opvangen.",
    huisdier: "Ze zeggen: \"het was maar een dier.\"|Maar voor jou was het zoveel meer.",
    relatie: "Je relatie is voorbij.|Maar je hoofd is dat nog niet.",
    eenzaamheid: "Je voelt je alleen.|Maar er is zoveel meer in jou.",
    kinderloos: "Ongewenst kinderloos.|Iets wat mensen niet kunnen zien.",
  },
  tekst: {
    persoon: "Mensen vragen hoe het gaat.\nEn je zegt: \"gaat wel.\"\n\nMaar wat moet je anders zeggen?\nDat je soms nog steeds automatisch aan ze denkt?\nDat je midden op de dag ineens stilvalt?\nDat het 's nachts het hardst binnenkomt?\n\nJe wil het delen.\nMaar niet elke keer het hele verhaal vertellen.\nNiet weer die stilte aan de andere kant.\n\nDus je houdt het maar bij jezelf.",
    huisdier: "Een maatje.\nRoutine.\nStilte die nu anders voelt.\n\nJe mist de kleine dingen.\nDe vanzelfsprekendheid.\nDe aanwezigheid.\n\nEn misschien voelt het alsof je dit niet \"groot genoeg\" mag maken.\nDus je zegt er minder over.\nDan je eigenlijk zou willen.\n\nMaar jouw verdriet is echt.",
    relatie: "Je denkt terug.\nAnalyseert.\nTwijfelt.\n\nWas het de juiste keuze?\nHad je iets anders kunnen doen?\nWaarom voelt het nog zo aanwezig?\n\nOverdag red je je wel.\nMaar 's avonds… begint het weer.\n\nEn je wil er niet steeds over praten met anderen.",
    eenzaamheid: "Je bent omringd door mensen.\nMaar niemand ziet echt wie je bent.\n\nJe lacht mee.\nJe doet mee.\nMaar van binnen is er iets wat niet gezien wordt.\n\nNiet omdat je het niet wil delen.\nMaar omdat je niet weet hoe.\nOf simpelweg niet weet bij wie.\n\nDus je draagt het stil.",
    kinderloos: "En waarvoor niemand de juiste woorden heeft.\n\nWant het is niet zichtbaar.\nNiet tastbaar.\nMaar het is er. Altijd.\n\nIn momenten.\nIn gesprekken.\nIn wat er niet is.\nEn misschien voel je je alleen in hoe groot het is.\n\nAlsof je het niet helemaal mag voelen.",
  },
  citaat: {
    persoon: "30 dagen lang ontvang je elke dag een e-mail.\nMet daarin een bericht van Benji.\n\nGeen oplossingen. Geen \"je moet gewoon…\"\n\nMaar woorden die begrijpen hoe het voelt.\nEn een plek waar jij even alles kwijt kunt.\n\nWanneer jij daar klaar voor bent.",
    huisdier: "Elke dag een moment voor jou.\nWaar je niets hoeft uit te leggen.\n\nWaar je vandaag meer mag zijn dan gisteren.",
    relatie: "Een plek waar je gedachten mogen bestaan.\nZonder dat iemand meteen een mening heeft.\n\nWaar je niet \"sterk\" hoeft te zijn.\nMaar gewoon even eerlijk.",
    eenzaamheid: "30 dagen lang een dagelijks bericht van Benji.\n\nGeen adviezen. Geen \"ga toch eens naar buiten.\"\n\nMaar woorden die begrijpen hoe eenzaamheid voelt.\nEen plek waar jij gezien mag worden.\n\nDoor jezelf, te beginnen.",
    kinderloos: "Een plek waar je niets hoeft uit te leggen.\nWaar alles er mag zijn.\n\nOok de dingen die je normaal inslikt.",
  },
  voordelen: {
    persoon: "Iemand die elke dag even naast je zit\nRuimte om te voelen zonder oordeel\nJe gedachten ordenen zonder druk\nVan alles alleen dragen → naar even delen",
    huisdier: "Erkenning zonder dat je het hoeft te verdedigen\nDagelijks een moment van zachtheid\nRuimte voor herinneringen én gemis\nVan stil verdriet → naar gedeeld gevoel",
    relatie: "Rust in je hoofd\nRuimte om te verwerken in jouw tempo\nIemand die luistert zonder oordeel\nVan blijven malen → naar zacht loslaten",
    eenzaamheid: "Dagelijkse erkenning van wat jij draagt\nRuimte voor eerlijkheid zonder oordeel\nJezelf leren kennen op een nieuwe manier\nVan onzichtbaar voelen → naar jezelf zien",
    kinderloos: "Erkenning zonder uitleg\nRuimte voor rauwe gedachten\nDagelijkse steun zonder druk\nVan alleen dragen → naar even samen",
  },
  ctaTekst: {
    persoon: "Start met Niet Alleen – Verlies Persoon (€37)",
    huisdier: "Start met Niet Alleen – Verlies Huisdier (€37)",
    relatie: "Start met Niet Alleen – Relatie (€37)",
    eenzaamheid: "Start met Niet Alleen – Eenzaamheid (€37)",
    kinderloos: "Start met Niet Alleen – Ongewenst kinderloos (€37)",
  },
};

function parseH2(raw: string): [string, string] {
  const idx = raw.indexOf("|");
  if (idx === -1) return [raw, ""];
  return [raw.slice(0, idx), raw.slice(idx + 1)];
}

function renderTekst(raw: string) {
  return raw.split("\n\n").map((para, i) => (
    <p key={i} style={{ color: "#6b6460" }} className="leading-relaxed">
      {para.split("\n").map((line, j, arr) => (
        <span key={j}>{line}{j < arr.length - 1 && <br />}</span>
      ))}
    </p>
  ));
}

function CtaButton({ url, fallback, label }: { url?: string; fallback?: string; label: string }) {
  const href = url || fallback;
  const base = "inline-block w-full sm:w-auto px-7 py-3.5 rounded-xl font-semibold text-sm text-white text-center transition-opacity";
  if (!href) return <span className={`${base} opacity-40 cursor-default`} style={{ background: "#6d84a8" }}>{label}</span>;
  return <Link href={href} className={`${base} hover:opacity-90`} style={{ background: "#6d84a8" }}>{label}</Link>;
}

function Voordelen({ raw }: { raw: string }) {
  const items = raw.split("\n").filter(Boolean);
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

function TypeSectie({
  id, sectionRef, emoji, label, h2Raw, tekstRaw, citaatRaw, voordelenRaw, ctaTekst, ctaUrl, defaultCtaUrl, slotzin,
}: {
  id: string; sectionRef: React.RefObject<HTMLDivElement>; emoji: string; label: string;
  h2Raw: string; tekstRaw: string; citaatRaw: string; voordelenRaw: string;
  ctaTekst: string; ctaUrl?: string; defaultCtaUrl?: string; slotzin?: string;
}) {
  const [h2Bold, h2Light] = parseH2(h2Raw);
  return (
    <section ref={sectionRef} id={id} className="max-w-lg mx-auto px-6 py-16 space-y-5 scroll-mt-8">
      <p className="text-xs uppercase tracking-widest font-medium" style={{ color: "#b0a8a0" }}>{emoji}</p>
      <h2 className="text-2xl sm:text-3xl font-semibold leading-snug" style={{ color: "#3d3530" }}>
        {h2Bold}{h2Light && <><br /><span style={{ fontWeight: 400, color: "#6b6460" }}>{h2Light}</span></>}
      </h2>
      {renderTekst(tekstRaw)}
      <div className="border-l-2 pl-5 py-1 space-y-3" style={{ borderColor: "#6d84a8" }}>
        <p className="text-sm font-semibold" style={{ color: "#6d84a8" }}>Dit is waar Niet Alleen begint</p>
        {citaatRaw.split("\n\n").map((para, i) => (
          <p key={i} style={{ color: "#6b6460" }} className="text-sm leading-relaxed">
            {para.split("\n").map((line, j, arr) => (
              <span key={j}>{line}{j < arr.length - 1 && <br />}</span>
            ))}
          </p>
        ))}
      </div>
      <div>
        <p className="text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: "#b0a8a0" }}>Wat het je geeft</p>
        <Voordelen raw={voordelenRaw} />
      </div>
      {slotzin && <p className="text-sm italic" style={{ color: "#8a8078" }}>{slotzin}</p>}
      <CtaButton url={ctaUrl} fallback={defaultCtaUrl} label={ctaTekst} />
    </section>
  );
}

export function NietAlleenKeuzeLpView({
  typeCtaUrlPersoon, typeCtaUrlHuisdier, typeCtaUrlRelatie, typeCtaUrlEenzaamheid, typeCtaUrlKinderloos,
  typeButtonLabelPersoon, typeButtonLabelHuisdier, typeButtonLabelRelatie, typeButtonLabelEenzaamheid, typeButtonLabelKinderloos,
  defaultCtaUrl,
  kpHeroKop1, kpHeroKop2, kpHeroTekst, kpHeroSlotzin, kpKeuzeLabel1, kpKeuzeLabel2,
  kpH2Persoon, kpTekstPersoon, kpCitaatPersoon, kpVoordelenPersoon, kpCtaTekstPersoon,
  kpH2Huisdier, kpTekstHuisdier, kpCitaatHuisdier, kpVoordelenHuisdier, kpCtaTekstHuisdier,
  kpH2Relatie, kpTekstRelatie, kpCitaatRelatie, kpVoordelenRelatie, kpCtaTekstRelatie,
  kpH2Eenzaamheid, kpTekstEenzaamheid, kpCitaatEenzaamheid, kpVoordelenEenzaamheid, kpCtaTekstEenzaamheid,
  kpH2Kinderloos, kpTekstKinderloos, kpCitaatKinderloos, kpVoordelenKinderloos, kpCtaTekstKinderloos,
}: Props) {
  const [actief, setActief] = useState<TypeKey | null>(null);
  const persoonRef      = useRef<HTMLDivElement>(null);
  const huisdierRef     = useRef<HTMLDivElement>(null);
  const relatieRef      = useRef<HTMLDivElement>(null);
  const eenzaamheidRef  = useRef<HTMLDivElement>(null);
  const kinderloosRef   = useRef<HTMLDivElement>(null);

  const refs: Record<TypeKey, React.RefObject<HTMLDivElement>> = {
    persoon: persoonRef, huisdier: huisdierRef, relatie: relatieRef, eenzaamheid: eenzaamheidRef, kinderloos: kinderloosRef,
  };
  const ctaUrls: Record<TypeKey, string | undefined> = {
    persoon: typeCtaUrlPersoon, huisdier: typeCtaUrlHuisdier, relatie: typeCtaUrlRelatie, eenzaamheid: typeCtaUrlEenzaamheid, kinderloos: typeCtaUrlKinderloos,
  };
  const buttonLabels: Record<TypeKey, string> = {
    persoon:      typeButtonLabelPersoon      || DEFAULTS.buttonLabels.persoon,
    huisdier:     typeButtonLabelHuisdier     || DEFAULTS.buttonLabels.huisdier,
    relatie:      typeButtonLabelRelatie      || DEFAULTS.buttonLabels.relatie,
    eenzaamheid:  typeButtonLabelEenzaamheid  || DEFAULTS.buttonLabels.eenzaamheid,
    kinderloos:   typeButtonLabelKinderloos   || DEFAULTS.buttonLabels.kinderloos,
  };

  const TYPES: { key: TypeKey; icon: ReactNode; kleur: string }[] = [
    { key: "persoon",     icon: <IconHeart />, kleur: "#7ec8e3" },
    { key: "huisdier",   icon: <IconPaw />,   kleur: "#7ec8e3" },
    { key: "relatie",    icon: <IconUsers />, kleur: "#7ec8e3" },
    { key: "eenzaamheid",icon: <IconChat />,  kleur: "#7ec8e3" },
    { key: "kinderloos", icon: <IconLeaf />,  kleur: "#7ec8e3" },
  ];

  function kiesType(key: TypeKey) {
    const url = ctaUrls[key];
    if (url) { window.location.href = url; return; }
    setActief(key);
    refs[key].current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  const TypeKnoppen = ({ klein }: { klein?: boolean }) => (
    <div className="space-y-3">
      {TYPES.map(({ key, icon, kleur }) => (
        <button key={key} onClick={() => kiesType(key)}
          className={`w-full flex items-center gap-${klein ? "3" : "4"} px-5 py-${klein ? "3.5" : "4"} rounded-2xl border${klein ? "" : "-2"} text-left transition-all`}
          style={{ borderColor: actief === key ? "#6d84a8" : "#e8e0d8", background: actief === key ? "#eef1f6" : "white", color: "#3d3530" }}
        >
          <div
            className={`${klein ? "w-9 h-9" : "w-10 h-10"} rounded-xl flex items-center justify-center flex-shrink-0 text-white`}
            style={{ background: kleur }}
          >
            {icon}
          </div>
          <span className="text-sm font-medium">{buttonLabels[key]}</span>
          {!klein && actief === key && <span className="ml-auto text-xs font-semibold flex-shrink-0" style={{ color: "#6d84a8" }}>↓</span>}
        </button>
      ))}
    </div>
  );

  const heroTekst = kpHeroTekst || DEFAULTS.heroTekst;

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

        {/* HERO */}
        <section className="max-w-lg mx-auto px-6 pt-10 pb-12 text-center space-y-4">
          <h1 className="text-3xl sm:text-4xl font-semibold leading-snug" style={{ color: "#3d3530" }}>
            {kpHeroKop1 || DEFAULTS.heroKop1}<br />
            <span style={{ color: "#6b6460", fontWeight: 400 }}>{kpHeroKop2 || DEFAULTS.heroKop2}</span>
          </h1>
          <div className="space-y-3 text-base leading-relaxed max-w-md mx-auto" style={{ color: "#6b6460" }}>
            {heroTekst.split("\n\n").map((para, i) => (
              <p key={i}>{para.split("\n").map((line, j, arr) => <span key={j}>{line}{j < arr.length - 1 && <br />}</span>)}</p>
            ))}
          </div>
          <p className="text-base font-medium pt-2" style={{ color: "#3d3530" }}>{kpHeroSlotzin || DEFAULTS.heroSlotzin}</p>
        </section>

        {/* KEUZEMOMENT */}
        <section className="max-w-md mx-auto px-6 pb-14 space-y-5">
          <div className="text-center space-y-1">
            <p className="text-sm font-medium" style={{ color: "#8a8078" }}>{kpKeuzeLabel1 || DEFAULTS.keuzeLabel1}</p>
            <p className="text-base font-semibold" style={{ color: "#3d3530" }}>{kpKeuzeLabel2 || DEFAULTS.keuzeLabel2}</p>
          </div>
          <TypeKnoppen />
        </section>

        <div style={{ borderTop: "1px solid #e8e0d8" }} className="max-w-2xl mx-auto" />

        <TypeSectie
          id="persoon" sectionRef={persoonRef} emoji="💔 Verlies van een persoon"
          label={buttonLabels.persoon}
          h2Raw={kpH2Persoon || DEFAULTS.h2.persoon}
          tekstRaw={kpTekstPersoon || DEFAULTS.tekst.persoon}
          citaatRaw={kpCitaatPersoon || DEFAULTS.citaat.persoon}
          voordelenRaw={kpVoordelenPersoon || DEFAULTS.voordelen.persoon}
          ctaTekst={kpCtaTekstPersoon || DEFAULTS.ctaTekst.persoon}
          ctaUrl={typeCtaUrlPersoon} defaultCtaUrl={defaultCtaUrl}
          slotzin="Niet opgelost. Maar wél iets lichter."
        />

        <div style={{ borderTop: "1px solid #e8e0d8" }} className="max-w-2xl mx-auto" />

        <TypeSectie
          id="huisdier" sectionRef={huisdierRef} emoji="🐾 Verlies van een dier"
          label={buttonLabels.huisdier}
          h2Raw={kpH2Huisdier || DEFAULTS.h2.huisdier}
          tekstRaw={kpTekstHuisdier || DEFAULTS.tekst.huisdier}
          citaatRaw={kpCitaatHuisdier || DEFAULTS.citaat.huisdier}
          voordelenRaw={kpVoordelenHuisdier || DEFAULTS.voordelen.huisdier}
          ctaTekst={kpCtaTekstHuisdier || DEFAULTS.ctaTekst.huisdier}
          ctaUrl={typeCtaUrlHuisdier} defaultCtaUrl={defaultCtaUrl}
        />

        <div style={{ borderTop: "1px solid #e8e0d8" }} className="max-w-2xl mx-auto" />

        <TypeSectie
          id="relatie" sectionRef={relatieRef} emoji="💭 Einde van een relatie"
          label={buttonLabels.relatie}
          h2Raw={kpH2Relatie || DEFAULTS.h2.relatie}
          tekstRaw={kpTekstRelatie || DEFAULTS.tekst.relatie}
          citaatRaw={kpCitaatRelatie || DEFAULTS.citaat.relatie}
          voordelenRaw={kpVoordelenRelatie || DEFAULTS.voordelen.relatie}
          ctaTekst={kpCtaTekstRelatie || DEFAULTS.ctaTekst.relatie}
          ctaUrl={typeCtaUrlRelatie} defaultCtaUrl={defaultCtaUrl}
        />

        <div style={{ borderTop: "1px solid #e8e0d8" }} className="max-w-2xl mx-auto" />

        <TypeSectie
          id="eenzaamheid" sectionRef={eenzaamheidRef} emoji="😔 Ik voel me eenzaam"
          label={buttonLabels.eenzaamheid}
          h2Raw={kpH2Eenzaamheid || DEFAULTS.h2.eenzaamheid}
          tekstRaw={kpTekstEenzaamheid || DEFAULTS.tekst.eenzaamheid}
          citaatRaw={kpCitaatEenzaamheid || DEFAULTS.citaat.eenzaamheid}
          voordelenRaw={kpVoordelenEenzaamheid || DEFAULTS.voordelen.eenzaamheid}
          ctaTekst={kpCtaTekstEenzaamheid || DEFAULTS.ctaTekst.eenzaamheid}
          ctaUrl={typeCtaUrlEenzaamheid} defaultCtaUrl={defaultCtaUrl}
        />

        <div style={{ borderTop: "1px solid #e8e0d8" }} className="max-w-2xl mx-auto" />

        <TypeSectie
          id="kinderloos" sectionRef={kinderloosRef} emoji="🌱 Ongewenst kinderloos"
          label={buttonLabels.kinderloos}
          h2Raw={kpH2Kinderloos || DEFAULTS.h2.kinderloos}
          tekstRaw={kpTekstKinderloos || DEFAULTS.tekst.kinderloos}
          citaatRaw={kpCitaatKinderloos || DEFAULTS.citaat.kinderloos}
          voordelenRaw={kpVoordelenKinderloos || DEFAULTS.voordelen.kinderloos}
          ctaTekst={kpCtaTekstKinderloos || DEFAULTS.ctaTekst.kinderloos}
          ctaUrl={typeCtaUrlKinderloos} defaultCtaUrl={defaultCtaUrl}
        />

        <div style={{ borderTop: "2px solid #e8e0d8" }} className="max-w-2xl mx-auto" />

        {/* ALGEMEEN */}
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
            <p className="text-sm" style={{ color: "#8a8078" }}>Geen vaste tijden. Geen verwachtingen. Geen druk.<br />Alleen een plek waar jij even kunt zijn.</p>
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
            <TypeKnoppen klein />
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
