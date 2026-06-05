"use client";

import { useState, useEffect, useRef } from "react";
import { useSearchParams } from "next/navigation";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import Link from "next/link";
import Image from "next/image";
import { HeaderBar } from "@/components/chat/HeaderBar";
import { mergeHouvast, alineas, type HouvastContent } from "@/lib/houvastContent";

// Zachte type-keuze op het welkomstscherm (alleen getoond als er geen ?type= in de URL zit).
const TYPE_KEUZES: { code: string; label: string }[] = [
  { code: "persoon", label: "Ik mis iemand" },
  { code: "huisdier", label: "Ik mis mijn huisdier" },
  { code: "scheiding", label: "Mijn relatie is voorbij" },
  { code: "eenzaamheid", label: "Ik voel me eenzaam" },
];

// ─── Component ────────────────────────────────────────────────────────────────

export default function HouvasteGidsPage() {
  const searchParams = useSearchParams();
  const token = searchParams?.get("token") ?? "";
  const verliesType = searchParams?.get("type") ?? "";
  const heeftToken = !!token;

  // Toegang via token blijft werken; zonder token loopt de gids in open modus
  // (binnenkomst vanuit een verliestype-LP).
  const profiel = useQuery(api.houvast.getByToken, heeftToken ? { token } : "skip");

  // Content uit de admin (Pagina's → Even Houvast), met de defaults als fallback.
  const savedContent = useQuery(api.pageContent.getPublicPageContent, { pageKey: "houvast" });
  const content: HouvastContent = mergeHouvast(savedContent as Partial<HouvastContent> | null | undefined);
  const MOMENTEN = content.momenten;

  const storageKey = token || "houvast-open";

  const [stap, setStap] = useState(0);
  const [antwoorden, setAntwoorden] = useState<Record<string, string>>({});
  const [fotos, setFotos] = useState<Record<string, string>>({});
  const [luistert, setLuistert] = useState<string | null>(null);
  const herkenningRef = useRef<any>(null);
  const [heeftSpeechSupport, setHeeftSpeechSupport] = useState(false);

  // Verliestype: uit de URL (?type=) of door de bezoeker zelf gekozen op het welkomstscherm.
  const [gekozenType, setGekozenType] = useState("");
  const actiefType = verliesType || gekozenType;

  // Brief per mail
  const [email, setEmail] = useState("");
  const [briefStatus, setBriefStatus] = useState<"idle" | "loading" | "done" | "error">("idle");

  // Account aanmaken (alleen relevant met token / bekend e-mailadres)
  const [wachtwoord, setWachtwoord] = useState("");
  const [aanmeldStatus, setAanmeldStatus] = useState<"idle" | "loading" | "success" | "bestaand" | "error">("idle");

  useEffect(() => {
    setHeeftSpeechSupport(!!((window as any).SpeechRecognition || (window as any).webkitSpeechRecognition));
  }, []);

  // Prefill e-mail vanuit het token-profiel.
  useEffect(() => {
    if (profiel?.email) setEmail(profiel.email);
  }, [profiel?.email]);

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
  }, [storageKey]);

  // Sla automatisch op bij elke wijziging.
  useEffect(() => {
    localStorage.setItem(`houvast-${storageKey}-antwoorden`, JSON.stringify(antwoorden));
  }, [antwoorden, storageKey]);

  useEffect(() => {
    localStorage.setItem(`houvast-${storageKey}-fotos`, JSON.stringify(fotos));
  }, [fotos, storageKey]);

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
          name: profiel?.name ?? undefined,
          verliesType: actiefType || undefined,
          antwoorden: MOMENTEN.map((m) => ({ vraag: m.vraag, antwoord: antwoorden[m.id] || "" })),
        }),
      });
      if (!res.ok) throw new Error("Fout");
      setBriefStatus("done");
    } catch {
      setBriefStatus("error");
    }
  };

  const registreer = async () => {
    const aanmeldEmail = email || profiel?.email;
    if (!aanmeldEmail || wachtwoord.length < 8) return;
    setAanmeldStatus("loading");
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: aanmeldEmail,
          password: wachtwoord,
          name: profiel?.name ?? "",
          source: "houvast",
        }),
      });
      const data = await res.json();
      if (res.status === 409 || data?.error?.toLowerCase().includes("bestaat")) {
        setAanmeldStatus("bestaand");
      } else if (!res.ok) {
        setAanmeldStatus("error");
      } else {
        setAanmeldStatus("success");
      }
    } catch {
      setAanmeldStatus("error");
    }
  };

  // Secties: welkom + momenten + bewaar + en nu
  const ALLE_STAPPEN = ["welkom", ...MOMENTEN.map((m) => m.id), "bewaar", "enu"];
  const huidigStap = ALLE_STAPPEN[stap];
  const isEerste = stap === 0;
  const isLaatste = stap === ALLE_STAPPEN.length - 1;
  const huidigMoment = MOMENTEN.find((m) => m.id === huidigStap);

  const nietAlleenUrl =
    (actiefType && content.nietAlleenLinks[actiefType]) ||
    content.nietAlleenLinks.persoon ||
    "/lp/je-hoeft-het-niet-alleen-te-doen";

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

        {/* Navigatie */}
        <nav className="px-5 pt-4 pb-2">
          <div className="max-w-md mx-auto flex items-center justify-center gap-1.5 flex-wrap">
            {[
              { id: "welkom", label: "Welkom" },
              ...MOMENTEN.map((m) => ({ id: m.id, label: m.nav })),
              { id: "bewaar", label: "Bewaar" },
              { id: "enu", label: "En nu?" },
            ].map((s, i) => (
              <button
                key={s.id}
                onClick={() => setStap(i)}
                className="text-xs font-medium px-3 py-1.5 rounded-full transition-all"
                style={{
                  background: s.id === huidigStap ? "#6d84a8" : "rgba(255,255,255,0.70)",
                  color: s.id === huidigStap ? "#fff" : "#8a8078",
                  boxShadow: s.id === huidigStap ? "0 2px 8px rgba(109,132,168,0.25)" : "none",
                }}
              >
                {s.label}
              </button>
            ))}
          </div>
        </nav>

        {/* Content */}
        <main className="flex-1 flex items-start justify-center px-5 py-6">
          <div className="w-full max-w-md">

            {/* ── Welkom ── */}
            {huidigStap === "welkom" && (
              <div
                className="rounded-2xl p-6 sm:p-8 space-y-4"
                style={{ background: "rgba(255,255,255,0.88)", boxShadow: "0 2px 24px rgba(0,0,0,0.08)" }}
              >
                <h2 className="text-2xl font-semibold" style={{ color: "#3d3530" }}>
                  {profiel?.name ? `${content.welkomTitel}, ${profiel.name}` : content.welkomTitel}
                </h2>
                {alineas(content.welkomTekst).map((alinea, i, arr) => (
                  <p
                    key={i}
                    className="text-sm sm:text-base leading-relaxed"
                    style={{ color: i === arr.length - 1 ? "#3d3530" : "#6b6460", fontWeight: i === arr.length - 1 ? 500 : 400 }}
                  >
                    {alinea}
                  </p>
                ))}
                <p className="text-xs pt-1" style={{ color: "#8a8078" }}>
                  Je kunt zoveel of zo weinig invullen als je wil. Aan het eind kun je je woorden als persoonlijke brief naar jezelf laten sturen.
                </p>

                {/* Zachte type-keuze — alleen als de bezoeker zonder ?type= binnenkomt */}
                {!verliesType && (
                  <div className="pt-3 space-y-2 border-t" style={{ borderColor: "rgba(0,0,0,0.07)" }}>
                    <p className="text-sm font-medium pt-1" style={{ color: "#3d3530" }}>
                      Waar gaat jouw verdriet over?
                    </p>
                    <p className="text-xs" style={{ color: "#8a8078" }}>
                      Zo kunnen we het straks beter op jou afstemmen. Je hoeft niet te kiezen als je dat niet wil.
                    </p>
                    <div className="flex flex-wrap gap-2 pt-1">
                      {TYPE_KEUZES.map((t) => (
                        <button
                          key={t.code}
                          type="button"
                          onClick={() => setGekozenType((prev) => (prev === t.code ? "" : t.code))}
                          className="text-sm px-3.5 py-2 rounded-full transition-colors"
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
                  </div>
                )}
              </div>
            )}

            {/* ── Moment ── */}
            {huidigMoment && (
              <div
                className="rounded-2xl p-6 sm:p-8 space-y-5"
                style={{ background: "rgba(255,255,255,0.88)", boxShadow: "0 2px 24px rgba(0,0,0,0.08)" }}
              >
                <p className="text-xs uppercase tracking-widest font-medium" style={{ color: "#8a8078", letterSpacing: "0.13em" }}>
                  Moment {huidigMoment.nav}
                </p>

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
                      Laat je e-mailadres achter, dan maken we van wat je hebt opgeschreven een persoonlijke brief — een brief aan jezelf — en sturen we die naar je toe.
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
                      <input
                        type="email"
                        placeholder="jouw@email.nl"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full px-4 py-3 rounded-xl text-sm outline-none"
                        style={{ background: "rgba(255,255,255,0.90)", border: "1px solid rgba(0,0,0,0.09)", color: "#3d3530" }}
                      />
                      {briefStatus === "error" && (
                        <p className="text-xs" style={{ color: "#c0392b" }}>Er ging iets mis. Probeer het opnieuw.</p>
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
                <h2 className="text-2xl font-semibold" style={{ color: "#3d3530" }}>{content.slotTitel}</h2>

                {alineas(content.slotTekst).map((alinea, i) => (
                  <p key={i} className="text-sm leading-relaxed" style={{ color: "#6b6460" }}>{alinea}</p>
                ))}

                {/* Doorstroom naar Niet Alleen (per verliestype) */}
                <a
                  href={nietAlleenUrl}
                  className="block w-full text-center py-3.5 rounded-2xl font-medium text-white text-sm"
                  style={{ background: "#6d84a8" }}
                >
                  Ontdek Niet Alleen
                </a>

                {/* Account aanmaken — alleen als we een e-mailadres hebben */}
                {(profiel?.email || email) && aanmeldStatus !== "success" && aanmeldStatus !== "bestaand" && (
                  <div className="space-y-3 pt-2 border-t" style={{ borderColor: "rgba(0,0,0,0.07)" }}>
                    <p className="text-sm font-medium" style={{ color: "#3d3530" }}>
                      Of: start 7 dagen gratis met Benji
                    </p>
                    <input
                      type="password"
                      placeholder="Kies een wachtwoord (min. 8 tekens)"
                      value={wachtwoord}
                      onChange={(e) => setWachtwoord(e.target.value)}
                      className="w-full px-4 py-3 rounded-xl text-sm outline-none"
                      style={{ background: "rgba(255,255,255,0.90)", border: "1px solid rgba(0,0,0,0.08)", color: "#3d3530" }}
                    />
                    {aanmeldStatus === "error" && (
                      <p className="text-xs" style={{ color: "#c0392b" }}>Er ging iets mis. Probeer het opnieuw.</p>
                    )}
                    <button
                      onClick={registreer}
                      disabled={aanmeldStatus === "loading" || wachtwoord.length < 8}
                      className="w-full py-3 rounded-2xl font-medium text-sm disabled:opacity-50"
                      style={{ background: "rgba(109,132,168,0.10)", color: "#6d84a8" }}
                    >
                      {aanmeldStatus === "loading" ? "Bezig…" : "Maak mijn account aan"}
                    </button>
                  </div>
                )}
                {aanmeldStatus === "success" && (
                  <div className="rounded-xl px-5 py-5 text-center space-y-2" style={{ background: "rgba(109,132,168,0.08)" }}>
                    <p className="text-sm font-medium" style={{ color: "#3d3530" }}>Account aangemaakt.</p>
                    <p className="text-sm leading-relaxed" style={{ color: "#6b6460" }}>
                      Je hebt 7 dagen gratis toegang tot alles. Log in om te beginnen.
                    </p>
                    <Link
                      href={`/inloggen?email=${encodeURIComponent(email || profiel?.email || "")}&registered=1`}
                      className="inline-block mt-2 w-full py-3 rounded-2xl font-medium text-white text-sm"
                      style={{ background: "#6d84a8" }}
                    >
                      Inloggen bij Benji
                    </Link>
                  </div>
                )}
                {aanmeldStatus === "bestaand" && (
                  <div className="rounded-xl px-5 py-5 space-y-3" style={{ background: "rgba(109,132,168,0.08)" }}>
                    <p className="text-sm leading-relaxed" style={{ color: "#6b6460" }}>
                      Je hebt al een account met dit e-mailadres. Log direct in.
                    </p>
                    <Link
                      href={`/inloggen?email=${encodeURIComponent(email || profiel?.email || "")}`}
                      className="block w-full text-center py-3 rounded-2xl font-medium text-white text-sm"
                      style={{ background: "#6d84a8" }}
                    >
                      Inloggen bij Benji
                    </Link>
                  </div>
                )}
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
                onClick={() => setStap((s) => s + 1)}
                disabled={isLaatste}
                className="text-sm font-medium px-4 py-2 rounded-xl transition-colors disabled:opacity-0"
                style={{ color: "#6d84a8", background: "rgba(255,255,255,0.70)" }}
              >
                Volgende →
              </button>
            </div>

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
              © Talk To Benji — talktobenji.com
            </p>
          </div>
        </footer>

      </div>
    </div>
  );
}
