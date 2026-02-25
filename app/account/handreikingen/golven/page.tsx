"use client";

import React, { useState, useEffect, useRef } from "react";
import { useSession } from "next-auth/react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import Link from "next/link";
import { ArrowLeft, ArrowRight, X, Waves, RotateCcw, MessageCircle, Gem, Check } from "lucide-react";
import { Paywall } from "@/components/Paywall";

// screen: 0=intro, 1=erkennen, 2=ademhaling, 3=zintuigen, 4=ankerzin, 5=einde

const GROUNDING = [
  { id: 1, emoji: "👁️", label: "Noem 3 dingen die je nu ziet.", placeholder: "Een muur, een lamp, mijn handen..." },
  { id: 2, emoji: "👂", label: "Noem 1 geluid dat je hoort.", placeholder: "Een auto buiten, de klok..." },
  { id: 3, emoji: "🖐️", label: "Voel iets wat je aanraakt.", placeholder: "De stof van mijn kleding, mijn voeten op de grond..." },
  { id: 4, emoji: "👃", label: "Is er een geur? Zo ja, welke? Zo nee, dat is ook goed.", placeholder: "Koffie, frisse lucht, niets bijzonders..." },
  { id: 5, emoji: "🌡️", label: "Hoe voelt de lucht op je huid?", placeholder: "Warm, koel, neutraal..." },
];

const ANCHOR_OPTIONS = [
  "Ik mis hem/haar, en ik sta er toch.",
  "Deze golf gaat voorbij. Dat weet ik omdat de vorige ook voorbijging.",
  "Ik hoef dit niet alleen te dragen.",
  "Ik mag verdrietig zijn. Dat betekent dat ik heb liefgehad.",
];

// 4 tellen in, 4 tellen vasthouden, 6 tellen uit = 14s per cyclus × 4 cycli = 56s
const CYCLE_MS = 14000;
const TOTAL_CYCLES = 4;
const BREATH_TOTAL_MS = CYCLE_MS * TOTAL_CYCLES;

function breathLabel(elapsed: number): string {
  const pos = elapsed % CYCLE_MS;
  if (pos < 4000) return "Adem in...";
  if (pos < 8000) return "Vasthouden...";
  return "Adem uit...";
}

function breathCount(elapsed: number): string {
  const pos = elapsed % CYCLE_MS;
  if (pos < 4000) return `${Math.ceil((4000 - pos) / 1000)}`;
  if (pos < 8000) return `${Math.ceil((8000 - pos) / 1000)}`;
  return `${Math.ceil((14000 - pos) / 1000)}`;
}

export default function GolvenPage() {
  const { data: session } = useSession();
  const firstName = session?.user?.name?.split(" ")[0] || "";

  const hasAccess = useQuery(
    api.subscriptions.hasFeatureAccess,
    session?.userId
      ? { userId: session.userId as string, email: session.user?.email || undefined, feature: "handreikingen" }
      : "skip"
  );

  const addMemory = useMutation(api.memories.addMemory);

  const [screen, setScreen] = useState(0);

  // Fase 1
  const [phase1Ready, setPhase1Ready] = useState(false);

  // Fase 2
  const [breathElapsed, setBreathElapsed] = useState(0);
  const [breathDone, setBreathDone] = useState(false);
  const breathStartRef = useRef<number | null>(null);

  // Fase 3
  const [groundingAnswers, setGroundingAnswers] = useState<Record<number, string>>({});

  // Fase 4
  const [selectedAnchor, setSelectedAnchor] = useState<number | null>(null);
  const [customAnchor, setCustomAnchor] = useState("");
  const [isCustom, setIsCustom] = useState(false);

  // Eindscherm
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);

  // Fase 1: knop na 20s
  useEffect(() => {
    if (screen !== 1) { setPhase1Ready(false); return; }
    const t = setTimeout(() => setPhase1Ready(true), 20000);
    return () => clearTimeout(t);
  }, [screen]);

  // Fase 2: ademhalingstimer
  useEffect(() => {
    if (screen !== 2) {
      breathStartRef.current = null;
      setBreathElapsed(0);
      setBreathDone(false);
      return;
    }
    breathStartRef.current = Date.now();
    const interval = setInterval(() => {
      const elapsed = Date.now() - (breathStartRef.current ?? Date.now());
      setBreathElapsed(elapsed);
      if (elapsed >= BREATH_TOTAL_MS) {
        setBreathDone(true);
        clearInterval(interval);
      }
    }, 100);
    return () => clearInterval(interval);
  }, [screen]);

  // Scroll vergrendelen
  useEffect(() => {
    if (screen >= 1 && screen <= 4) {
      document.body.style.overflow = "hidden";
      return () => { document.body.style.overflow = ""; };
    }
  }, [screen]);

  const anchorText = isCustom ? customAnchor.trim() : (selectedAnchor !== null ? ANCHOR_OPTIONS[selectedAnchor] : "");

  const handleSaveAnchor = async () => {
    if (saving || saved || !session?.userId || !anchorText) return;
    setSaving(true);
    try {
      await addMemory({
        userId: session.userId as string,
        text: `Ankerzin\n\n${anchorText}`,
        source: "manual",
        memoryDate: new Date().toISOString().slice(0, 10),
      });
      setSaved(true);
    } catch {}
    finally { setSaving(false); }
  };

  const handleRestart = () => {
    setScreen(1);
    setPhase1Ready(false);
    setBreathElapsed(0);
    setBreathDone(false);
    setGroundingAnswers({});
    setSelectedAnchor(null);
    setCustomAnchor("");
    setIsCustom(false);
    setSaved(false);
  };

  // ─── Intro ───────────────────────────────────────────────────────────────────
  const introContent = (
    <div className="bg-white rounded-xl border border-primary-200 shadow-sm p-6 sm:p-8">
      <div className="w-12 h-12 rounded-full bg-primary-50 flex items-center justify-center mb-5">
        <Waves size={22} className="text-primary-500" />
      </div>
      <h1 className="text-xl sm:text-2xl font-semibold text-primary-900 mb-4">Golven opvangen</h1>
      {firstName && (
        <p className="text-gray-500 leading-relaxed mb-3 max-w-prose">
          Fijn dat je hier bent, {firstName}.
        </p>
      )}
      <p className="text-gray-500 leading-relaxed mb-3 max-w-prose">
        Rouw komt niet altijd op een moment dat het uitkomt. Soms ben je gewoon boodschappen
        aan het doen, op het werk, of je ligt 's nachts wakker, en dan is het er ineens. Vol.
        Overweldigend.
      </p>
      <p className="text-gray-500 leading-relaxed mb-5 max-w-prose">
        Deze oefening is niet om het gevoel weg te maken. Dat werkt toch niet. Het is om je
        erdoorheen te loodsen, zodat je weer kunt ademen, weer kunt staan, weer verder kunt.
      </p>
      <p className="text-sm text-gray-300 mb-7">5–8 minuten · gebruik dit op elk moment dat je het nodig hebt</p>
      <button
        type="button"
        onClick={() => setScreen(1)}
        className="inline-flex items-center gap-2 px-6 py-3 bg-primary-600 text-white rounded-xl text-sm font-medium hover:bg-primary-700 transition-colors"
      >
        Ik heb het nu nodig
        <ArrowRight size={17} />
      </button>
    </div>
  );

  // ─── Fase-overlay (schermen 1–4) ─────────────────────────────────────────────
  const currentCycle = Math.min(Math.floor(breathElapsed / CYCLE_MS) + 1, TOTAL_CYCLES);

  const phaseScreen = (
    <div
      className="fixed inset-0 z-[60] flex flex-col overflow-hidden"
      style={{ backgroundColor: "#fdf9f4" }}
    >
      {/* Topbalk */}
      <div className="flex items-center justify-between px-4 sm:px-6 pt-4 pb-2 flex-shrink-0">
        <button
          type="button"
          onClick={() => setScreen((s) => Math.max(s - 1, 0))}
          className="inline-flex items-center gap-1.5 text-sm transition-colors"
          style={{ color: "#b0a098" }}
        >
          <ArrowLeft size={15} />
          {screen === 1 ? "Terug" : "Vorige"}
        </button>
        <Waves size={18} style={{ color: "#c5b8ae" }} />
        <button
          type="button"
          onClick={() => window.history.back()}
          className="p-1.5 rounded-lg transition-colors"
          style={{ color: "#c5b8ae" }}
          aria-label="Sluiten"
        >
          <X size={18} />
        </button>
      </div>

      {/* Scrollbaar inhoudsgebied */}
      <div className="flex-1 overflow-y-auto">
        <div className="flex flex-col items-center justify-start min-h-full px-4 sm:px-6 pt-8 pb-10">
          <div className="w-full max-w-sm">

            {/* ── FASE 1: Erkennen ── */}
            {screen === 1 && (
              <div className="text-center space-y-6">
                <p className="text-xs uppercase tracking-widest" style={{ color: "#c5b8ae" }}>
                  Fase 1 · Erkennen
                </p>
                <div className="space-y-3 text-base leading-relaxed" style={{ color: "#6b5e58", textWrap: "balance" } as React.CSSProperties}>
                  <p>Stop even{firstName ? `, ${firstName}` : ""}. Je hoeft nu niets te doen.</p>
                  <p>Er is een golf. Je voelt hem. Dat klopt, het is er.</p>
                  <p>Je hoeft hem niet weg te duwen. Je hoeft ook niet te begrijpen waarom hij er nu is.</p>
                  <p style={{ color: "#3d3530", fontWeight: 500 }}>Hij mag er zijn.</p>
                </div>

                <style>{`
                  @keyframes breathe-idle {
                    0%, 100% { transform: scale(1); opacity: 0.4; }
                    50% { transform: scale(1.5); opacity: 0.65; }
                  }
                `}</style>
                <div className="flex justify-center py-2">
                  <div
                    style={{
                      width: "72px",
                      height: "72px",
                      borderRadius: "50%",
                      background: "radial-gradient(circle, #c7d4f0 0%, #e2dbd4 100%)",
                      animation: "breathe-idle 6s ease-in-out infinite",
                    }}
                  />
                </div>

                {!phase1Ready && (
                  <p className="text-sm" style={{ color: "#c5b8ae" }}>
                    Neem even dit moment om zo verder te gaan.
                  </p>
                )}
                {phase1Ready && (
                  <button
                    type="button"
                    onClick={() => setScreen(2)}
                    className="inline-flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-medium transition-all"
                    style={{ backgroundColor: "#f2f5f9", color: "#6d84a8", border: "1px solid #ccd6e2" }}
                  >
                    Ik ben er klaar voor
                    <ArrowRight size={15} />
                  </button>
                )}
              </div>
            )}

            {/* ── FASE 2: Ademhaling ── */}
            {screen === 2 && (
              <div className="text-center space-y-6">
                <div className="space-y-1">
                  <p className="text-xs uppercase tracking-widest" style={{ color: "#c5b8ae" }}>
                    Fase 2 · Ademhaling
                  </p>
                  {!breathDone && (
                    <p className="text-sm" style={{ color: "#c5b8ae" }}>
                      Cyclus {currentCycle} van {TOTAL_CYCLES}
                    </p>
                  )}
                </div>

                {!breathDone ? (
                  <>
                    <style>{`
                      @keyframes breath-guide {
                        0%     { transform: scale(1); }
                        28.57% { transform: scale(2); }
                        57.14% { transform: scale(2); }
                        100%   { transform: scale(1); }
                      }
                    `}</style>

                    {/* Vaste container zodat de cirkel nooit over tekst loopt */}
                    <div
                      style={{
                        width: "160px",
                        height: "160px",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        margin: "0 auto",
                      }}
                    >
                      <div
                        style={{
                          width: "80px",
                          height: "80px",
                          borderRadius: "50%",
                          background: "radial-gradient(circle, #c7d4f0 0%, #e2dbd4 100%)",
                          opacity: 0.75,
                          animation: `breath-guide ${CYCLE_MS}ms ease-in-out ${TOTAL_CYCLES} forwards`,
                        }}
                      />
                    </div>

                    <div className="space-y-1 pt-2">
                      <p className="text-lg" style={{ color: "#6b5e58", fontWeight: 400 }}>
                        {breathLabel(breathElapsed)}
                      </p>
                      <p className="text-3xl font-light" style={{ color: "#a09088" }}>
                        {breathCount(breathElapsed)}
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={() => setScreen(3)}
                      className="text-sm"
                      style={{ color: "#d4cec8" }}
                    >
                      Sla over
                    </button>
                  </>
                ) : (
                  <div className="space-y-6 pt-4">
                    <div
                      style={{
                        width: "80px",
                        height: "80px",
                        borderRadius: "50%",
                        background: "radial-gradient(circle, #c7d4f0 0%, #e2dbd4 100%)",
                        opacity: 0.5,
                        margin: "0 auto",
                      }}
                    />
                    <p className="text-base" style={{ color: "#6b5e58", textWrap: "balance" } as React.CSSProperties}>
                      Goed{firstName ? `, ${firstName}` : ""}. Je ademhaling is iets gekalmeerd. We gaan verder.
                    </p>
                    <button
                      type="button"
                      onClick={() => setScreen(3)}
                      className="inline-flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-medium"
                      style={{ backgroundColor: "#f2f5f9", color: "#6d84a8", border: "1px solid #ccd6e2" }}
                    >
                      Ga verder
                      <ArrowRight size={15} />
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* ── FASE 3: Zintuigen ── */}
            {screen === 3 && (
              <div className="space-y-6">
                <div className="text-center space-y-2">
                  <p className="text-xs uppercase tracking-widest" style={{ color: "#c5b8ae" }}>
                    Fase 3 · Gronding
                  </p>
                  <p className="text-sm leading-relaxed" style={{ color: "#a09088", textWrap: "balance" } as React.CSSProperties}>
                    Rouw trekt je naar het verleden of de toekomst. We halen je even terug naar dit moment, niet omdat dit moment makkelijker is, maar omdat het het enige is waar je nu bent.
                  </p>
                </div>

                <div className="space-y-4">
                  {GROUNDING.map((q) => (
                    <div key={q.id}>
                      <label
                        className="flex items-start gap-2 text-sm mb-1.5"
                        style={{ color: "#6b5e58" }}
                      >
                        <span className="flex-shrink-0">{q.emoji}</span>
                        <span>{q.label}</span>
                      </label>
                      <input
                        type="text"
                        value={groundingAnswers[q.id] ?? ""}
                        onChange={(e) =>
                          setGroundingAnswers((a) => ({ ...a, [q.id]: e.target.value }))
                        }
                        placeholder={q.placeholder}
                        className="w-full rounded-xl px-4 py-3 text-sm focus:outline-none transition-colors"
                        style={{
                          backgroundColor: "#fffcf8",
                          border: "1px solid #e8dfd5",
                          color: "#3d3530",
                        }}
                        onFocus={(e) => (e.currentTarget.style.borderColor = "#6d84a8")}
                        onBlur={(e) => (e.currentTarget.style.borderColor = "#e8dfd5")}
                      />
                    </div>
                  ))}
                </div>

                <div className="text-center space-y-4">
                  <p className="text-sm italic" style={{ color: "#a09088", textWrap: "balance" } as React.CSSProperties}>
                    Je bent hier{firstName ? `, ${firstName}` : ""}. In deze ruimte. In dit moment. Dat is genoeg.
                  </p>
                  <button
                    type="button"
                    onClick={() => setScreen(4)}
                    className="inline-flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-medium"
                    style={{ backgroundColor: "#f2f5f9", color: "#6d84a8", border: "1px solid #ccd6e2" }}
                  >
                    Ga verder
                    <ArrowRight size={15} />
                  </button>
                </div>
              </div>
            )}

            {/* ── FASE 4: Ankerzin ── */}
            {screen === 4 && (
              <div className="space-y-6">
                <div className="text-center space-y-2">
                  <p className="text-xs uppercase tracking-widest" style={{ color: "#c5b8ae" }}>
                    Fase 4 · Ankerzin
                  </p>
                  <p className="text-sm leading-relaxed" style={{ color: "#a09088", textWrap: "balance" } as React.CSSProperties}>
                    Een ankerzin is een zin die je vasthoudt als alles beweegt. Niet om jezelf te overtuigen van iets wat niet waar is, maar om jezelf te herinneren wat wél waar is.
                  </p>
                </div>

                <div className="space-y-2">
                  {ANCHOR_OPTIONS.map((opt, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => { setSelectedAnchor(i); setIsCustom(false); }}
                      className="w-full text-left px-4 py-3 rounded-xl text-sm leading-relaxed transition-all"
                      style={
                        !isCustom && selectedAnchor === i
                          ? { backgroundColor: "#6d84a8", color: "white" }
                          : { backgroundColor: "#fffcf8", border: "1px solid #e8dfd5", color: "#3d3530" }
                      }
                    >
                      "{opt}"
                    </button>
                  ))}

                  <button
                    type="button"
                    onClick={() => { setIsCustom(true); setSelectedAnchor(null); }}
                    className="w-full text-left px-4 py-3 rounded-xl text-sm transition-all"
                    style={
                      isCustom
                        ? { backgroundColor: "#f0ebe4", border: "1px solid #d4cec8", color: "#6b5e58" }
                        : { backgroundColor: "#fffcf8", border: "1px dashed #d4cec8", color: "#a09088" }
                    }
                  >
                    Schrijf je eigen ankerzin...
                  </button>

                  {isCustom && (
                    <input
                      key="custom-anchor"
                      type="text"
                      value={customAnchor}
                      onChange={(e) => setCustomAnchor(e.target.value)}
                      placeholder="Jouw ankerzin..."
                      autoFocus
                      className="w-full rounded-xl px-4 py-3 text-sm focus:outline-none transition-colors"
                      style={{
                        backgroundColor: "#fffcf8",
                        border: "1px solid #6d84a8",
                        color: "#3d3530",
                      }}
                    />
                  )}
                </div>

                {anchorText && (
                  <p className="text-sm text-center italic" style={{ color: "#a09088" }}>
                    Zeg hem één keer hardop als je kunt. Of fluister hem. Of zeg hem alleen in je hoofd.
                  </p>
                )}

                <div className="flex justify-end">
                  <button
                    type="button"
                    onClick={() => setScreen(5)}
                    disabled={!anchorText}
                    className="inline-flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-medium transition-all"
                    style={{
                      backgroundColor: anchorText ? "#f2f5f9" : "#f5f5f5",
                      color: anchorText ? "#6d84a8" : "#b8bec5",
                      border: anchorText ? "1px solid #ccd6e2" : "1px solid #e5e5e5",
                      cursor: anchorText ? "pointer" : "not-allowed",
                    }}
                  >
                    Klaar
                    <ArrowRight size={15} />
                  </button>
                </div>
              </div>
            )}

          </div>
        </div>
      </div>
    </div>
  );

  // ─── Eindscherm ───────────────────────────────────────────────────────────────
  const endScreen = (
    <div className="space-y-5">
      <div className="bg-white rounded-xl border border-primary-200 shadow-sm p-6 text-center">
        <div className="w-12 h-12 rounded-full bg-primary-50 flex items-center justify-center mb-4 mx-auto">
          <Waves size={22} className="text-primary-500" />
        </div>
        <h2 className="text-xl font-semibold text-primary-900 mb-3">
          {firstName ? `${firstName}, je hebt de golf opgevangen.` : "Je hebt de golf opgevangen."}
        </h2>
        <p className="text-gray-500 leading-relaxed max-w-prose mx-auto mb-2">
          Niet weggemaakt, dat was ook niet het doel. Maar je staat er nog. Je ademt. Je bent hier.
        </p>
        <p className="text-sm text-gray-300">Dat is genoeg voor nu.</p>
      </div>

      {/* Ankerzin */}
      {anchorText && (
        <div className="bg-white rounded-xl border border-primary-200 shadow-sm p-5">
          <p className="text-xs uppercase tracking-widest text-gray-300 mb-2">
            Jouw ankerzin van vandaag
          </p>
          <p className="text-sm text-gray-700 italic leading-relaxed border-l-4 border-primary-100 pl-4 mb-4">
            "{anchorText}"
          </p>
          <button
            type="button"
            onClick={handleSaveAnchor}
            disabled={saving || saved}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
            style={saved ? { color: "#6d84a8" } : { backgroundColor: "#6d84a8", color: "white" }}
          >
            {saved ? (
              <><Check size={14} />Bewaard in Memories</>
            ) : saving ? "Bewaren..." : (
              <><Gem size={14} />Bewaren in Memories</>
            )}
          </button>
          {saved && (
            <p className="text-xs text-gray-400 mt-2">
              Terug te vinden via{" "}
              <Link href="/account/herinneringen" className="text-primary-500 hover:underline">
                Memories
              </Link>
            </p>
          )}
        </div>
      )}

      <div className="bg-white rounded-xl border border-primary-200 shadow-sm p-5 space-y-3">
        <button
          type="button"
          onClick={handleRestart}
          className="w-full inline-flex items-center justify-center gap-2 px-4 py-3 border border-primary-200 text-primary-700 rounded-xl text-sm font-medium hover:bg-primary-50 transition-colors"
        >
          <RotateCcw size={15} />
          Nog een keer, ik heb meer nodig
        </button>
        <Link
          href="/?welcome=1"
          className="w-full inline-flex items-center justify-center gap-2 px-4 py-3 bg-primary-600 text-white rounded-xl text-sm font-medium hover:bg-primary-700 transition-colors"
        >
          <MessageCircle size={15} />
          Ik wil hierover praten met Benji
        </Link>
      </div>

      <div className="flex justify-center pb-4">
        <Link href="/account/handreikingen" className="text-sm text-primary-500 hover:underline">
          Terug naar handreikingen
        </Link>
      </div>
    </div>
  );

  // ─── Wrapper ─────────────────────────────────────────────────────────────────
  const regularContent = (
    <div className="space-y-4">
      {screen !== 5 && (
        <Link
          href="/account/handreikingen"
          className="inline-flex items-center gap-1.5 text-sm text-gray-400 hover:text-gray-600 transition-colors"
        >
          <ArrowLeft size={15} />
          Handreikingen
        </Link>
      )}
      {screen === 0 && introContent}
      {screen === 5 && endScreen}
    </div>
  );

  if (hasAccess === undefined) {
    return (
      <div className="flex justify-center py-16">
        <div className="animate-pulse rounded-full h-8 w-8 border-b-2 border-primary-600" />
      </div>
    );
  }

  if (hasAccess === false) {
    return (
      <Paywall
        title="Upgrade naar Benji Alles in 1"
        message="Golven opvangen is beschikbaar in Benji Alles in 1."
      >
        {regularContent}
      </Paywall>
    );
  }

  return (
    <>
      {screen >= 1 && screen <= 4 && phaseScreen}
      {(screen === 0 || screen === 5) && regularContent}
    </>
  );
}
