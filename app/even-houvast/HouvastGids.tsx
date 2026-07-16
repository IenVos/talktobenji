"use client";

import { useState, useEffect, useRef } from "react";
import { useSearchParams } from "next/navigation";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import Link from "next/link";
import Image from "next/image";
import { HeaderBar } from "@/components/chat/HeaderBar";
import { mergeHouvast, resolveHouvast, alineas, naarLpUrl, type HouvastContent } from "@/lib/houvastContent";
import { bepaalBron } from "@/lib/leadBron";

// Warme labels voor de type-keuze; valt terug op de naam uit de verliestypen-tabel.
const WARME_LABELS: Record<string, string> = {
  persoon: "Ik mis iemand",
  huisdier: "Ik mis mijn huisdier",
  scheiding: "Mijn relatie is voorbij",
  eenzaamheid: "Ik voel me eenzaam",
  kinderloos: "Mijn kinderwens kwam niet uit",
};

// ─── Component ────────────────────────────────────────────────────────────────

// Het verliestype komt uit het pad (/even-houvast/[type]) of uit ?type=.
// Nieuwe types uit de admin werken automatisch mee: het type wordt op naam
// (de code) opgezocht in de content, zonder dat hier iets aangepast hoeft.
export function HouvasteGids({ verliesTypeOverride = "" }: { verliesTypeOverride?: string }) {
  const searchParams = useSearchParams();
  const token = searchParams?.get("token") ?? "";
  const verliesType = verliesTypeOverride || (searchParams?.get("type") ?? "");
  const heeftToken = !!token;

  // Toegang via token blijft werken; zonder token loopt de gids in open modus
  // (binnenkomst vanuit een verliestype-LP).
  const profiel = useQuery(api.houvast.getByToken, heeftToken ? { token } : "skip");

  // Content uit de admin (Pagina's → Even Houvast), met de defaults als fallback.
  const savedContent = useQuery(api.pageContent.getPublicPageContent, { pageKey: "houvast" });
  const content: HouvastContent = mergeHouvast(savedContent as Partial<HouvastContent> | null | undefined);

  // Verliestypen (dynamisch) voor de zachte keuze op het welkomstscherm.
  const verliestypen = useQuery(api.verliesTypen.listPublic, {}) as
    | { code: string; naam: string; keuzePaginaLabel?: string }[]
    | undefined;
  const typeKeuzes = (verliestypen ?? []).map((t) => ({
    code: t.code,
    label: t.keuzePaginaLabel || WARME_LABELS[t.code] || t.naam,
  }));

  const storageKey = token || "houvast-open";

  const [stap, setStap] = useState(0);
  const [antwoorden, setAntwoorden] = useState<Record<string, string>>({});
  const [fotos, setFotos] = useState<Record<string, string>>({});
  const [luistert, setLuistert] = useState<string | null>(null);
  const herkenningRef = useRef<any>(null);
  const [heeftSpeechSupport, setHeeftSpeechSupport] = useState(false);

  // Verliestype: uit de URL (?type=) of door de bezoeker zelf gekozen op het welkomstscherm.
  const [gekozenType, setGekozenType] = useState("");
  // Eenmalig het verliestype mogen wijzigen nadat er gekozen is.
  const [typeGewijzigd, setTypeGewijzigd] = useState(false);
  const actiefType = verliesType || gekozenType;

  // Effectieve teksten voor dit verliestype (welkom/momenten/slot vallen terug op de basis).
  const gids = resolveHouvast(content, actiefType);
  const MOMENTEN = gids.momenten;

  // Optioneel naamveld, alleen zinvol bij een huisdier of een overleden dierbare.
  const verliesNaamVeld: { titel: string; hint?: string; placeholder: string } | null =
    actiefType === "huisdier"
      ? { titel: "Hoe heette je huisdier?", hint: "Optioneel. We gebruiken de naam alleen zacht in je brief.", placeholder: "De naam van je huisdier" }
      : actiefType === "persoon"
      ? { titel: "Wie mis je?", hint: "Je mag hier de naam delen. Optioneel, en alleen zacht gebruikt in je brief.", placeholder: "De naam van wie je mist" }
      : null;

  // Brief per mail
  const [email, setEmail] = useState("");
  const [naam, setNaam] = useState("");
  // Optionele naam van wie/wat gemist wordt (alleen bij huisdier en persoon).
  const [verliesNaam, setVerliesNaam] = useState("");
  const [honeypot, setHoneypot] = useState(""); // onzichtbaar veld tegen bots
  const [briefStatus, setBriefStatus] = useState<"idle" | "loading" | "done" | "error">("idle");
  const [briefFout, setBriefFout] = useState("Er ging iets mis. Probeer het opnieuw.");

  useEffect(() => {
    setHeeftSpeechSupport(!!((window as any).SpeechRecognition || (window as any).webkitSpeechRecognition));
  }, []);

  // Prefill e-mail vanuit het token-profiel.
  useEffect(() => {
    if (profiel?.email) setEmail(profiel.email);
  }, [profiel?.email]);

  // Prefill voornaam vanuit het token-profiel (als die al bekend is).
  useEffect(() => {
    if (profiel?.name) setNaam(profiel.name);
  }, [profiel?.name]);

  // Laad opgeslagen antwoorden + foto's uit localStorage.
  useEffect(() => {
    const opgeslagenAntwoorden = localStorage.getItem(`houvast-${storageKey}-antwoorden`);
    const opgeslagenFotos = localStorage.getItem(`houvast-${storageKey}-fotos`);
    if (opgeslagenAntwoorden) {
      try { setAntwoorden(JSON.parse(opgeslagenAntwoorden)); } catch {}
    }
    if (opgeslagenFotos) {
      try { setFotos(JSON.parse(opgeslagenFotos)); } catch {}
    }
    const opgeslagenVerliesNaam = localStorage.getItem(`houvast-${storageKey}-verliesnaam`);
    if (opgeslagenVerliesNaam) setVerliesNaam(opgeslagenVerliesNaam);
  }, [storageKey]);

  // Sla automatisch op bij elke wijziging.
  useEffect(() => {
    localStorage.setItem(`houvast-${storageKey}-antwoorden`, JSON.stringify(antwoorden));
  }, [antwoorden, storageKey]);

  useEffect(() => {
    localStorage.setItem(`houvast-${storageKey}-fotos`, JSON.stringify(fotos));
  }, [fotos, storageKey]);

  useEffect(() => {
    localStorage.setItem(`houvast-${storageKey}-verliesnaam`, verliesNaam);
  }, [verliesNaam, storageKey]);

  const setAntwoord = (id: string, waarde: string) => {
    setAntwoorden((prev) => ({ ...prev, [id]: waarde }));
  };

  const toggleOpname = (momentId: string) => {
    if (luistert === momentId) {
      if (herkenningRef.current) {
        herkenningRef.current.onend = null;
        herkenningRef.current.onerror = null;
        try { herkenningRef.current.stop(); } catch {}
      }
      setLuistert(null);
      return;
    }
    if (herkenningRef.current) {
      herkenningRef.current.onend = null;
      herkenningRef.current.onerror = null;
      try { herkenningRef.current.stop(); } catch {}
      herkenningRef.current = null;
    }
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SR) return;
    const herkenning = new SR();
    herkenning.lang = "nl-NL";
    herkenning.continuous = true;
    herkenning.interimResults = false;
    herkenning.onresult = (e: any) => {
      const tekst = Array.from(e.results as SpeechRecognitionResultList)
        .slice(e.resultIndex)
        .map((r: SpeechRecognitionResult) => r[0].transcript)
        .join(" ");
      setAntwoorden((prev) => ({ ...prev, [momentId]: (prev[momentId] || "") + (prev[momentId] ? " " : "") + tekst }));
    };
    herkenning.onend = () => {
      if (herkenningRef.current === herkenning) setLuistert(null);
    };
    herkenning.onerror = () => {
      if (herkenningRef.current === herkenning) setLuistert(null);
    };
    herkenningRef.current = herkenning;
    try {
      herkenning.start();
      setLuistert(momentId);
    } catch {
      setLuistert(null);
    }
  };

  const verwerkFoto = (momentId: string, e: React.ChangeEvent<HTMLInputElement>) => {
    const bestand = e.target.files?.[0];
    if (!bestand) return;
    const lezer = new FileReader();
    lezer.onload = (ev) => setFotos((prev) => ({ ...prev, [momentId]: ev.target?.result as string }));
    lezer.readAsDataURL(bestand);
  };
  const verwijderFoto = (momentId: string) =>
    setFotos((prev) => {
      const next = { ...prev };
      delete next[momentId];
      return next;
    });

  const stuurBrief = async () => {
    if (!email.trim() || !email.includes("@")) return;
    setBriefStatus("loading");
    try {
      const res = await fetch("/api/houvast/brief", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: email.trim(),
          name: naam.trim() || profiel?.name || undefined,
          verliesNaam: (actiefType === "huisdier" || actiefType === "persoon") && verliesNaam.trim() ? verliesNaam.trim() : undefined,
          verliesType: actiefType || undefined,
          antwoorden: MOMENTEN.map((m) => ({ vraag: m.vraag, antwoord: antwoorden[m.id] || "" })),
          fotos: Object.values(fotos).filter(Boolean),
          honeypot,
          ...bepaalBron(),
        }),
      });
      if (res.status === 409) {
        setBriefFout("Je hebt op dit e-mailadres al een brief ontvangen.");
        setBriefStatus("error");
        return;
      }
      if (!res.ok) throw new Error("Fout");
      setBriefStatus("done");
      // Meta Lead-event: de bezoeker heeft z'n e-mail achtergelaten voor de brief.
      // Hiermee kan Meta de Even Houvast-advertentie op leads optimaliseren.
      // (fbq bestaat alleen als de bezoeker akkoord ging met statistiek-cookies.)
      if (typeof window !== "undefined" && typeof (window as any).fbq === "function") {
        (window as any).fbq("track", "Lead", {
          content_name: "Even Houvast",
          content_category: actiefType || undefined,
        });
      }
    } catch {
      setBriefFout("Er ging iets mis. Probeer het opnieuw.");
      setBriefStatus("error");
    }
  };

  // Keuze-stap vooraf: alleen voor bezoekers die zonder ?type= binnenkomen, zodat
  // de welkomtekst, momenten en brief al op hun verlies kunnen worden afgestemd.
  const heeftKiesStap = !verliesType;

  // Secties: [kies] + welkom + momenten + bewaar + en nu
  const ALLE_STAPPEN = [
    ...(heeftKiesStap ? ["kies"] : []),
    "welkom",
    ...MOMENTEN.map((m) => m.id),
    "bewaar",
    "enu",
  ];
  const momentOffset = heeftKiesStap ? 2 : 1; // index van het eerste moment
  const welkomIndex = heeftKiesStap ? 1 : 0;
  const huidigStap = ALLE_STAPPEN[stap];
  const isEerste = stap === 0;
  const isLaatste = stap === ALLE_STAPPEN.length - 1;
  const huidigMoment = MOMENTEN.find((m) => m.id === huidigStap);

  const stapLabel = (id: string) =>
    id === "kies" ? "Start"
      : id === "welkom" ? "Welkom"
      : id === "bewaar" ? "Bewaar"
      : id === "enu" ? "En nu?"
      : MOMENTEN.find((m) => m.id === id)?.nav ?? "";

  // Op slot: je kunt pas verder als elk moment tot nu toe is ingevuld.
  const eersteOnbeantwoord = MOMENTEN.findIndex((m) => !(antwoorden[m.id] && antwoorden[m.id].trim()));
  const maxStap = eersteOnbeantwoord === -1 ? ALLE_STAPPEN.length - 1 : momentOffset + eersteOnbeantwoord;
  const kanVerder = stap < maxStap;

  // Stappenbalk in rijen: Start/Welkom boven, momenten in het midden, Bewaar/En nu?
  // onderaan — die laatste twee pas zichtbaar zodra het laatste moment bereikt is.
  const laatsteMomentIndex = MOMENTEN.length > 0 ? momentOffset + MOMENTEN.length - 1 : welkomIndex;
  const toonEinde = maxStap >= laatsteMomentIndex;
  const topRowIds = ALLE_STAPPEN.filter((id) => id === "kies" || id === "welkom");
  const momentRowIds = MOMENTEN.map((m) => m.id);

  const nietAlleenUrl = naarLpUrl(
    (actiefType && content.nietAlleenLinks[actiefType]) ||
      content.nietAlleenLinks.persoon ||
      "/lp/je-hoeft-het-niet-alleen-te-doen"
  );

  // ─── Token aanwezig maar nog aan het laden ───────────────────────────────────
  if (heeftToken && profiel === undefined) {
    return (
      <div style={{ minHeight: "100vh", background: "#fdf9f4", display: "flex", flexDirection: "column" }}>
        <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <div className="animate-spin rounded-full h-8 w-8 border-b-2" style={{ borderColor: "#6d84a8" }} />
        </div>
      </div>
    );
  }

  // ─── Token aanwezig maar ongeldig ────────────────────────────────────────────
  if (heeftToken && !profiel) {
    return (
      <div style={{ minHeight: "100vh", background: "#fdf9f4", position: "relative" }}>
        <div style={{ position: "fixed", inset: 0, zIndex: 0 }}>
          <Image src="/images/achtergrond.png" alt="" fill className="object-cover" priority />
          <div style={{ position: "absolute", inset: 0, background: "rgba(253,249,244,0.84)" }} />
        </div>
        <div style={{ position: "relative", zIndex: 1 }}>
          <HeaderBar />
          <div className="flex items-center justify-center px-5 pt-16 pb-20">
            <div className="w-full max-w-sm text-center">
              <p className="text-base font-medium mb-3" style={{ color: "#3d3530" }}>
                Deze link is niet meer geldig.
              </p>
              <p className="text-sm leading-relaxed mb-8" style={{ color: "#6b6460" }}>
                Vul je e-mailadres opnieuw in en we sturen je een nieuwe link.
              </p>
              <Link
                href="/houvast"
                className="inline-block w-full py-3.5 rounded-2xl font-medium text-white text-sm"
                style={{ background: "#6d84a8" }}
              >
                Stuur mij de link opnieuw
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ─── Render ────────────────────────────────────────────────────────────────

  return (
    <div style={{ minHeight: "100vh", background: "#fdf9f4", position: "relative" }}>

      <div style={{ position: "fixed", inset: 0, zIndex: 0 }}>
        <Image src="/images/achtergrond.png" alt="" fill className="object-cover" priority />
        <div style={{ position: "absolute", inset: 0, background: "rgba(253,249,244,0.84)" }} />
      </div>

      <div style={{ position: "relative", zIndex: 1, display: "flex", flexDirection: "column", minHeight: "100vh" }}>
        <HeaderBar />

        {/* Navigatie in rijen: Start/Welkom boven, momenten in het midden, Bewaar/En nu?
            onderaan (pas zichtbaar bij het laatste moment). */}
        <nav className="px-5 pt-4 pb-2">
          {(() => {
            const tab = (id: string) => {
              const i = ALLE_STAPPEN.indexOf(id);
              const vergrendeld = i > maxStap;
              return (
                <button
                  key={id}
                  onClick={() => !vergrendeld && setStap(i)}
                  disabled={vergrendeld}
                  className="whitespace-nowrap text-xs font-medium px-3 py-1.5 rounded-full transition-all"
                  style={{
                    background: id === huidigStap ? "#6d84a8" : "rgba(255,255,255,0.70)",
                    color: id === huidigStap ? "#fff" : "#8a8078",
                    boxShadow: id === huidigStap ? "0 2px 8px rgba(109,132,168,0.25)" : "none",
                    opacity: vergrendeld ? 0.4 : 1,
                    cursor: vergrendeld ? "not-allowed" : "pointer",
                  }}
                >
                  {stapLabel(id)}
                </button>
              );
            };
            return (
              <div className="max-w-md mx-auto flex flex-col items-center gap-1.5">
                <div className="flex items-center justify-center gap-1.5 flex-wrap">{topRowIds.map(tab)}</div>
                <div className="flex items-center justify-center gap-1.5 flex-wrap">{momentRowIds.map(tab)}</div>
                {toonEinde && (
                  <div className="flex items-center justify-center gap-1.5 flex-wrap">{["bewaar", "enu"].map(tab)}</div>
                )}
              </div>
            );
          })()}
        </nav>

        {/* Content */}
        <main className="flex-1 flex items-start justify-center px-5 py-6">
          <div className="w-full max-w-md">

            {/* ── Keuze vooraf: waar gaat je verdriet over? ── */}
            {huidigStap === "kies" && (
              <div
                className="rounded-2xl p-6 sm:p-8 space-y-4"
                style={{ background: "rgba(255,255,255,0.88)", boxShadow: "0 2px 24px rgba(0,0,0,0.08)" }}
              >
                <h2 className="text-2xl font-semibold" style={{ color: "#3d3530" }}>
                  Waar gaat jouw verdriet over?
                </h2>
                <p className="text-sm sm:text-base leading-relaxed" style={{ color: "#6b6460" }}>
                  Zo kunnen we je beter begeleiden in de stappen hierna.
                </p>
                <div className="flex flex-col gap-2 pt-1">
                  {typeKeuzes.map((t) => (
                    <button
                      key={t.code}
                      type="button"
                      onClick={() => { if (gekozenType) setTypeGewijzigd(true); setGekozenType(t.code); setStap(welkomIndex); }}
                      className="text-left text-sm px-4 py-3 rounded-xl transition-colors"
                      style={
                        gekozenType === t.code
                          ? { background: "#6d84a8", color: "#fff" }
                          : { background: "rgba(109,132,168,0.10)", color: "#6d84a8" }
                      }
                    >
                      {t.label}
                    </button>
                  ))}
                </div>
                <button
                  type="button"
                  onClick={() => { setGekozenType(""); setStap(welkomIndex); }}
                  className="text-xs font-medium pt-1"
                  style={{ color: "#a09890", background: "none" }}
                >
                  Ik kies liever niet, ga verder →
                </button>
              </div>
            )}

            {/* ── Welkom ── */}
            {huidigStap === "welkom" && (
              <div
                className="rounded-2xl p-6 sm:p-8 space-y-4"
                style={{ background: "rgba(255,255,255,0.88)", boxShadow: "0 2px 24px rgba(0,0,0,0.08)" }}
              >
                <h2 className="text-2xl font-semibold" style={{ color: "#3d3530" }}>
                  {profiel?.name ? `${gids.welkomTitel}, ${profiel.name}` : gids.welkomTitel}
                </h2>
                {alineas(gids.welkomTekst).map((alinea, i, arr) => {
                  const isOpening = i === 0;
                  const isSlot = i === arr.length - 1 && arr.length > 1;
                  return (
                    <p
                      key={i}
                      className={isOpening ? "text-lg sm:text-xl leading-relaxed" : "text-sm sm:text-base leading-relaxed"}
                      style={{
                        color: isSlot ? "#6d84a8" : isOpening ? "#3d3530" : "#6b6460",
                        fontWeight: isOpening ? 500 : 400,
                        textWrap: isOpening ? "balance" : "pretty",
                      } as React.CSSProperties}
                    >
                      {alinea}
                    </p>
                  );
                })}
                {/* Optionele naam van het huisdier of de dierbare, aan het begin. */}
                {verliesNaamVeld && (
                  <div className="space-y-1.5 pt-2">
                    <label htmlFor="verliesNaam" className="text-sm font-medium block" style={{ color: "#3d3530" }}>
                      {verliesNaamVeld.titel}
                    </label>
                    {verliesNaamVeld.hint && (
                      <p className="text-xs" style={{ color: "#8a8078" }}>{verliesNaamVeld.hint}</p>
                    )}
                    <input
                      id="verliesNaam"
                      type="text"
                      value={verliesNaam}
                      onChange={(e) => setVerliesNaam(e.target.value)}
                      placeholder={verliesNaamVeld.placeholder}
                      className="w-full px-4 py-3 rounded-xl text-sm outline-none"
                      style={{ background: "rgba(255,255,255,0.90)", border: "1px solid rgba(0,0,0,0.09)", color: "#3d3530" }}
                    />
                  </div>
                )}

                {/* Eenmalig het verliestype kunnen wijzigen na de keuze. */}
                {heeftKiesStap && actiefType && !typeGewijzigd && (
                  <button
                    type="button"
                    onClick={() => setStap(0)}
                    className="text-xs font-medium pt-1"
                    style={{ color: "#a09890", background: "none" }}
                  >
                    Toch een ander verlies kiezen
                  </button>
                )}
              </div>
            )}

            {/* ── Moment ── */}
            {huidigMoment && (
              <div
                className="rounded-2xl p-6 sm:p-8 space-y-5"
                style={{ background: "rgba(255,255,255,0.88)", boxShadow: "0 2px 24px rgba(0,0,0,0.08)" }}
              >
                <div className="space-y-1">
                  <p className="text-xs uppercase tracking-widest font-medium" style={{ color: "#8a8078", letterSpacing: "0.13em" }}>
                    Moment {huidigMoment.nav}
                  </p>
                  <p className="text-xs" style={{ color: "#a09890" }}>
                    Jouw brief wordt opgebouwd terwijl je deelt.
                  </p>
                </div>

                <h2
                  className="text-xl sm:text-2xl font-semibold leading-snug"
                  style={{ color: "#3d3530", textWrap: "balance" } as React.CSSProperties}
                >
                  {huidigMoment.titel}
                </h2>

                <div className="space-y-3">
                  {alineas(huidigMoment.intro).map((alinea, i) => (
                    <p key={i} className="text-sm sm:text-base leading-relaxed" style={{ color: "#6b6460" }}>
                      {alinea}
                    </p>
                  ))}
                </div>

                <div
                  className="rounded-xl px-5 py-4 space-y-2"
                  style={{ background: "rgba(109,132,168,0.08)", borderLeft: "3px solid #6d84a8" }}
                >
                  <p className="text-xs font-semibold uppercase tracking-wide" style={{ color: "#6d84a8" }}>
                    {huidigMoment.oefeningTitel}
                  </p>
                  {alineas(huidigMoment.oefeningTekst).map((t, i) => (
                    <p key={i} className="text-sm leading-relaxed" style={{ color: "#4a5568" }}>{t}</p>
                  ))}
                </div>

                {/* Schrijfvak */}
                <div className="space-y-2">
                  <p className="text-sm font-medium" style={{ color: "#3d3530" }}>
                    {huidigMoment.vraag}
                  </p>
                  <textarea
                    rows={4}
                    placeholder="Schrijf hier wat er in je opkomt..."
                    value={antwoorden[huidigMoment.id] || ""}
                    onChange={(e) => setAntwoord(huidigMoment.id, e.target.value)}
                    className="w-full px-4 py-3 rounded-xl text-sm leading-relaxed outline-none resize-none"
                    style={{
                      background: "rgba(255,255,255,0.90)",
                      border: "1px solid rgba(0,0,0,0.09)",
                      color: "#3d3530",
                    }}
                  />
                  {heeftSpeechSupport && (
                    <button
                      type="button"
                      onClick={() => toggleOpname(huidigMoment.id)}
                      className="flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-full transition-colors"
                      style={{
                        background: luistert === huidigMoment.id ? "rgba(220,53,69,0.10)" : "rgba(109,132,168,0.10)",
                        color: luistert === huidigMoment.id ? "#dc3545" : "#6d84a8",
                      }}
                    >
                      <span>{luistert === huidigMoment.id ? "◼" : "🎙"}</span>
                      {luistert === huidigMoment.id ? "Stop met opnemen" : "Inspreken"}
                    </button>
                  )}
                </div>

                {/* Foto upload — per moment */}
                {huidigMoment.metFoto && (
                  <div className="space-y-2">
                    <p className="text-xs" style={{ color: "#8a8078" }}>
                      Voeg een foto toe als je wil — iets wat bij dit moment past.
                    </p>
                    {fotos[huidigMoment.id] ? (
                      <div className="relative">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={fotos[huidigMoment.id]} alt="" className="w-full rounded-xl" />
                        <button
                          onClick={() => verwijderFoto(huidigMoment.id)}
                          className="absolute top-2 right-2 text-xs px-2 py-1 rounded-lg"
                          style={{ background: "rgba(0,0,0,0.45)", color: "#fff" }}
                        >
                          Verwijderen
                        </button>
                      </div>
                    ) : (
                      <>
                        <input
                          key={huidigMoment.id}
                          type="file"
                          accept="image/*"
                          className="hidden"
                          id={`foto-${huidigMoment.id}`}
                          onChange={(e) => verwerkFoto(huidigMoment.id, e)}
                        />
                        <label
                          htmlFor={`foto-${huidigMoment.id}`}
                          className="inline-block cursor-pointer text-xs font-medium px-3 py-2 rounded-xl"
                          style={{ background: "rgba(109,132,168,0.10)", color: "#6d84a8" }}
                        >
                          + Foto toevoegen
                        </label>
                      </>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* ── Bewaar: brief per mail ── */}
            {huidigStap === "bewaar" && (
              <div
                className="rounded-2xl p-6 sm:p-8 space-y-5"
                style={{ background: "rgba(255,255,255,0.88)", boxShadow: "0 2px 24px rgba(0,0,0,0.08)" }}
              >
                {briefStatus === "done" ? (
                  <>
                    <h2 className="text-2xl font-semibold" style={{ color: "#3d3530" }}>Je brief is onderweg</h2>
                    <p className="text-sm leading-relaxed" style={{ color: "#6b6460" }}>
                      We sturen je woorden als persoonlijke brief naar <strong>{email}</strong>.
                    </p>
                    <p className="text-sm leading-relaxed" style={{ color: "#6b6460" }}>
                      Hij kan zo in je inbox staan. Zie je hem niet? Kijk dan ook even bij je ongewenste mail.
                    </p>
                  </>
                ) : (
                  <>
                    <h2 className="text-2xl font-semibold" style={{ color: "#3d3530" }}>Je woorden, terug naar jou</h2>
                    <p className="text-sm leading-relaxed" style={{ color: "#6b6460" }}>
                      Laat je e-mailadres achter, dan maken we van wat je hebt opgeschreven een persoonlijke brief, een brief aan jezelf, en sturen we die naar je toe.
                    </p>

                    {/* Overzicht ingevulde antwoorden */}
                    <div className="space-y-3 pt-1">
                      {MOMENTEN.map((m) => (
                        <div key={m.id} className="rounded-xl px-4 py-3" style={{ background: "rgba(0,0,0,0.03)" }}>
                          <p className="text-xs font-medium mb-1" style={{ color: "#8a8078" }}>Moment {m.nav}</p>
                          <p className="text-xs" style={{ color: "#6b6460" }}>
                            {antwoorden[m.id]
                              ? antwoorden[m.id].slice(0, 80) + (antwoorden[m.id].length > 80 ? "…" : "")
                              : <em>Niet ingevuld</em>}
                          </p>
                        </div>
                      ))}
                    </div>

                    <div className="space-y-2 pt-1">
                      {/* Honeypot: onzichtbaar voor mensen, bots vullen 'm wel in */}
                      <input
                        type="text"
                        tabIndex={-1}
                        autoComplete="off"
                        value={honeypot}
                        onChange={(e) => setHoneypot(e.target.value)}
                        aria-hidden="true"
                        style={{ position: "absolute", left: "-9999px", width: 1, height: 1, opacity: 0 }}
                      />
                      <input
                        type="text"
                        placeholder="Jouw voornaam (optioneel)"
                        value={naam}
                        onChange={(e) => setNaam(e.target.value)}
                        className="w-full px-4 py-3 rounded-xl text-sm outline-none"
                        style={{ background: "rgba(255,255,255,0.90)", border: "1px solid rgba(0,0,0,0.09)", color: "#3d3530" }}
                      />
                      <input
                        type="email"
                        placeholder="jouw@email.nl"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full px-4 py-3 rounded-xl text-sm outline-none"
                        style={{ background: "rgba(255,255,255,0.90)", border: "1px solid rgba(0,0,0,0.09)", color: "#3d3530" }}
                      />
                      {briefStatus === "error" && (
                        <p className="text-xs" style={{ color: "#c0392b" }}>{briefFout}</p>
                      )}
                      <button
                        onClick={stuurBrief}
                        disabled={briefStatus === "loading" || !email.trim() || !email.includes("@")}
                        className="w-full py-3.5 rounded-2xl font-medium text-white text-sm disabled:opacity-50"
                        style={{ background: "#6d84a8" }}
                      >
                        {briefStatus === "loading" ? "Bezig…" : "Stuur mij mijn brief"}
                      </button>
                      <p className="text-xs text-center" style={{ color: "#a09890" }}>
                        Je woorden blijven van jou. We sturen alleen deze brief.
                      </p>
                    </div>
                  </>
                )}
              </div>
            )}

            {/* ── En nu? ── */}
            {huidigStap === "enu" && (
              <div
                className="rounded-2xl p-6 sm:p-8 space-y-5"
                style={{ background: "rgba(255,255,255,0.88)", boxShadow: "0 2px 24px rgba(0,0,0,0.08)" }}
              >
                <h2 className="text-2xl font-semibold" style={{ color: "#3d3530" }}>{gids.slotTitel}</h2>

                {alineas(gids.slotTekst).map((alinea, i) => (
                  <p key={i} className="text-sm leading-relaxed" style={{ color: "#6b6460" }}>{alinea}</p>
                ))}

                {/* Doorstroom naar Niet Alleen (per verliestype) — enige pad vanaf hier */}
                <div className="space-y-1.5">
                  <a
                    href={nietAlleenUrl}
                    className="block w-full text-center py-3.5 rounded-2xl font-medium text-white text-sm"
                    style={{ background: "#6d84a8" }}
                  >
                    Ik wil er niet alleen voor staan
                  </a>
                  {gids.slotPrijsRegel && (
                    <p className="text-center text-xs" style={{ color: "#a09890" }}>
                      {gids.slotPrijsRegel}
                    </p>
                  )}
                </div>
              </div>
            )}

            {/* Vorige / Volgende */}
            <div className="flex justify-between items-center mt-5 px-1">
              <button
                onClick={() => setStap((s) => s - 1)}
                disabled={isEerste}
                className="text-sm font-medium px-4 py-2 rounded-xl transition-colors disabled:opacity-0"
                style={{ color: "#6d84a8", background: "rgba(255,255,255,0.70)" }}
              >
                ← Vorige
              </button>

              <p className="text-xs" style={{ color: "#a09890" }}>
                {stap + 1} / {ALLE_STAPPEN.length}
              </p>

              <button
                onClick={() => kanVerder && setStap((s) => s + 1)}
                disabled={!kanVerder}
                className="text-sm font-medium px-4 py-2 rounded-xl transition-colors"
                style={{
                  color: "#6d84a8",
                  background: "rgba(255,255,255,0.70)",
                  opacity: isLaatste ? 0 : kanVerder ? 1 : 0.4,
                  cursor: !kanVerder ? "not-allowed" : "pointer",
                  pointerEvents: isLaatste ? "none" : "auto",
                }}
              >
                Volgende →
              </button>
            </div>
            {!kanVerder && !isLaatste && huidigMoment && (
              <p className="text-center text-xs mt-2" style={{ color: "#a09890" }}>
                Vul dit moment in om verder te gaan.
              </p>
            )}

          </div>
        </main>

        <footer className="px-5 py-8 text-center" style={{ borderTop: "1px solid rgba(0,0,0,0.07)" }}>
          <div className="max-w-lg mx-auto space-y-2">
            <p className="text-xs" style={{ color: "#6b6460" }}>
              Vragen?{" "}
              <a href="mailto:contactmetien@talktobenji.com" style={{ color: "#6d84a8" }}>
                contactmetien@talktobenji.com
              </a>
            </p>
            <p className="text-xs" style={{ color: "#a09890" }}>
              © Talk To Benji · {new Date().getFullYear()}
            </p>
          </div>
        </footer>

      </div>
    </div>
  );
}
