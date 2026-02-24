"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import Link from "next/link";
import { ArrowLeft, ArrowRight, Download, Mail, Check, Pencil, X } from "lucide-react";
import { Paywall } from "@/components/Paywall";

const STEPS = [
  {
    stepNum: 1,
    title: "Aan wie schrijf je deze brief?",
    subtitle: "Denk aan een naam, of gewoon hoe je hem of haar noemde.",
    placeholder: "Bijv. mijn moeder, mijn beste vriend, opa...",
    multiline: false,
  },
  {
    stepNum: 2,
    title: "Hoe begin je jouw brief?",
    subtitle: "Niet wat je normaal zou schrijven, maar wat het meest voelt als jij.",
    placeholder: "Lieve mama,\nHé jij,\nBeste opa,",
    multiline: true,
  },
  {
    stepNum: 3,
    title: "Wat mis je het meest?",
    subtitle:
      "Dat kan groot zijn — maar vaak zijn het de kleine dingen die het hardst aankomen. De geur, een gewoonte, iets wat alleen jullie wisten.",
    placeholder: "Het hoeft geen mooie zin te zijn...",
    multiline: true,
  },
  {
    stepNum: 4,
    title: "Wat bleef er onafgemaakt?",
    subtitle:
      "Een gesprek dat nooit is gevoerd. Iets dat je wilde zeggen of vragen. Het hoeft niet zwaar te zijn.",
    placeholder: "Soms is het gewoon: 'Ik wilde je nog zo veel laten zien.'",
    multiline: true,
  },
  {
    stepNum: 5,
    title: "Wat draag je mee?",
    subtitle:
      "Iets van hem of haar is in jou blijven leven. Een waarde, een manier van kijken, iets wat je nooit loslaat.",
    placeholder: "",
    multiline: true,
  },
  {
    stepNum: 6,
    title: "Hoe sluit je af?",
    subtitle: "Wat zijn de laatste woorden die je wil schrijven? Neem je tijd.",
    placeholder: "",
    multiline: true,
  },
];

const TOTAL = STEPS.length;

export default function BriefOefeningPage() {
  const { data: session } = useSession();

  const hasAccess = useQuery(
    api.subscriptions.hasFeatureAccess,
    session?.userId
      ? {
          userId: session.userId as string,
          email: session.user?.email || undefined,
          feature: "handreikingen",
        }
      : "skip"
  );

  // 0 = intro, 1–6 = stappen, 7 = eindscherm
  const [screen, setScreen] = useState(0);
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [sendError, setSendError] = useState("");

  // Vergrendel body-scroll tijdens focusmodus (stappen 1–6)
  useEffect(() => {
    if (screen >= 1 && screen <= TOTAL) {
      document.body.style.overflow = "hidden";
      return () => { document.body.style.overflow = ""; };
    }
  }, [screen]);

  const currentStep = STEPS[screen - 1];
  const canNext =
    screen === 0 ||
    screen > TOTAL ||
    (answers[screen] !== undefined && answers[screen].trim().length > 0);

  const assembleLetter = () =>
    [answers[2], answers[3], answers[4], answers[5], answers[6]]
      .filter(Boolean)
      .join("\n\n");

  const addressee = answers[1] || "";
  const letterBody = assembleLetter();

  const handleDownload = () => {
    const text = `${addressee ? `Aan: ${addressee}\n\n` : ""}${letterBody}`;
    const blob = new Blob([text], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "mijn-brief.txt";
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleSendEmail = async () => {
    if (sending || sent) return;
    setSending(true);
    setSendError("");
    try {
      const res = await fetch("/api/oefeningen/send-brief", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ letter: letterBody, addressee }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setSendError(data.error || "Er ging iets mis");
      } else {
        setSent(true);
      }
    } catch {
      setSendError("Er ging iets mis. Probeer het opnieuw.");
    } finally {
      setSending(false);
    }
  };

  // ─── Introscherm ────────────────────────────────────────────────────────────
  const introScreen = (
    <div className="bg-white rounded-2xl border border-primary-100 shadow-sm p-8 max-w-lg mx-auto text-center">
      <div className="w-14 h-14 rounded-full bg-primary-50 flex items-center justify-center mx-auto mb-6">
        <Pencil size={24} className="text-primary-500" />
      </div>
      <h1 className="text-2xl font-semibold text-primary-900 mb-3">
        De onafgemaakte brief
      </h1>
      <p className="text-gray-500 leading-relaxed mb-2">
        Er zijn dingen die we nooit hebben kunnen zeggen. Woorden die bleven
        hangen. Dit is je kans om ze alsnog een plek te geven.
      </p>
      <p className="text-gray-500 leading-relaxed mb-6">
        In zes stappen schrijf je een brief aan degene die je mist. Er is geen
        goed of fout.
      </p>
      <p className="text-sm text-gray-300 mb-8">
        ~20–30 minuten · je kunt altijd stoppen
      </p>
      <button
        type="button"
        onClick={() => setScreen(1)}
        className="inline-flex items-center gap-2 px-7 py-3 bg-primary-600 text-white rounded-xl text-base font-medium hover:bg-primary-700 transition-colors"
      >
        Ik ben er klaar voor
        <ArrowRight size={18} />
      </button>
    </div>
  );

  // ─── Schrijfstap (focusmodus) ────────────────────────────────────────────────
  const stepScreen = currentStep && (
    // Vaste overlay — bedekt sidebar en alles eronder
    <div
      className="fixed inset-0 z-[60] overflow-y-auto flex flex-col"
      style={{ backgroundColor: "#fdf9f4" }}
    >
      {/* Topbalk — minimaal */}
      <div className="flex items-center justify-between px-5 pt-5 pb-2 flex-shrink-0">
        <button
          type="button"
          onClick={() => setScreen((s) => s - 1)}
          className="inline-flex items-center gap-1.5 text-sm text-[#b0a098] hover:text-[#6d5f55] transition-colors"
        >
          <ArrowLeft size={15} />
          {screen === 1 ? "Terug" : "Vorige"}
        </button>
        <button
          type="button"
          onClick={() => window.history.back()}
          className="p-1.5 rounded-lg text-[#c5b8ae] hover:text-[#6d5f55] transition-colors"
          aria-label="Sluiten"
        >
          <X size={18} />
        </button>
      </div>

      {/* Schrijfveld — gecentreerd op het scherm */}
      <div className="flex-1 flex flex-col items-center justify-center px-5 py-8">
        <div className="w-full max-w-xl">
          {/* Vraag */}
          <div className="mb-7">
            <h2
              className="text-2xl leading-snug mb-3"
              style={{ color: "#3d3530", fontWeight: 400 }}
            >
              {currentStep.title}
            </h2>
            <p
              className="text-sm leading-relaxed italic"
              style={{ color: "#a09088" }}
            >
              {currentStep.subtitle}
            </p>
          </div>

          {/* Schrijfveld */}
          {currentStep.multiline ? (
            <textarea
              value={answers[screen] ?? ""}
              onChange={(e) =>
                setAnswers((a) => ({ ...a, [screen]: e.target.value }))
              }
              placeholder={currentStep.placeholder}
              rows={8}
              autoFocus
              className="w-full rounded-2xl px-5 py-4 text-base leading-relaxed resize-none focus:outline-none transition-colors"
              style={{
                backgroundColor: "#fffcf8",
                border: "1px solid #e8dfd5",
                color: "#3d3530",
                caretColor: "#6d84a8",
              }}
              onFocus={(e) => (e.currentTarget.style.borderColor = "#6d84a8")}
              onBlur={(e) => (e.currentTarget.style.borderColor = "#e8dfd5")}
            />
          ) : (
            <input
              type="text"
              value={answers[screen] ?? ""}
              onChange={(e) =>
                setAnswers((a) => ({ ...a, [screen]: e.target.value }))
              }
              placeholder={currentStep.placeholder}
              autoFocus
              className="w-full rounded-2xl px-5 py-4 text-base leading-relaxed focus:outline-none transition-colors"
              style={{
                backgroundColor: "#fffcf8",
                border: "1px solid #e8dfd5",
                color: "#3d3530",
                caretColor: "#6d84a8",
              }}
              onFocus={(e) => (e.currentTarget.style.borderColor = "#6d84a8")}
              onBlur={(e) => (e.currentTarget.style.borderColor = "#e8dfd5")}
            />
          )}

          {/* Volgende knop */}
          <div className="mt-6 flex justify-end">
            <button
              type="button"
              onClick={() => setScreen((s) => s + 1)}
              disabled={!canNext}
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-medium transition-all"
              style={{
                backgroundColor: canNext ? "#6d84a8" : "#d4cfc9",
                color: "white",
                cursor: canNext ? "pointer" : "not-allowed",
              }}
            >
              {screen === TOTAL ? "Klaar" : "Volgende"}
              <ArrowRight size={16} />
            </button>
          </div>

          {/* Voortgangsstippen */}
          <div className="mt-10 flex justify-center gap-2.5">
            {STEPS.map((_, i) => (
              <button
                key={i}
                type="button"
                onClick={() => setScreen(i + 1)}
                className="rounded-full transition-all duration-300"
                style={{
                  width: i + 1 === screen ? "24px" : "8px",
                  height: "8px",
                  backgroundColor: i + 1 === screen ? "#6d84a8" : "#d4cec8",
                }}
                aria-label={`Stap ${i + 1}`}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );

  // ─── Eindscherm ──────────────────────────────────────────────────────────────
  const endScreen = (
    <div className="max-w-lg mx-auto space-y-5">
      <div className="bg-white rounded-2xl border border-primary-100 shadow-sm p-6 sm:p-8">
        <p className="text-xs text-gray-300 mb-1 uppercase tracking-wide">
          Je brief
        </p>
        <h2 className="text-xl font-semibold text-primary-900 mb-6">
          {addressee ? `Aan: ${addressee}` : "Jouw brief"}
        </h2>
        <div className="border-l-4 border-primary-100 pl-5 space-y-4">
          {[answers[2], answers[3], answers[4], answers[5], answers[6]]
            .filter(Boolean)
            .map((para, i) => (
              <p
                key={i}
                className="text-gray-700 leading-relaxed whitespace-pre-wrap text-sm"
              >
                {para}
              </p>
            ))}
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-primary-100 shadow-sm p-6 space-y-3">
        <p className="text-sm text-gray-400 mb-4">
          Je kunt je brief bewaren of naar jezelf sturen.
        </p>
        <button
          type="button"
          onClick={handleDownload}
          className="w-full inline-flex items-center justify-center gap-2 px-4 py-3 border border-primary-200 text-primary-700 rounded-xl text-sm font-medium hover:bg-primary-50 transition-colors"
        >
          <Download size={16} />
          Downloaden als tekstbestand
        </button>
        <button
          type="button"
          onClick={handleSendEmail}
          disabled={sending || sent}
          className="w-full inline-flex items-center justify-center gap-2 px-4 py-3 bg-primary-600 text-white rounded-xl text-sm font-medium hover:bg-primary-700 transition-colors disabled:opacity-50"
        >
          {sent ? (
            <>
              <Check size={16} />
              Verstuurd naar {session?.user?.email}
            </>
          ) : sending ? (
            "Versturen..."
          ) : (
            <>
              <Mail size={16} />
              Stuur naar mijn e-mail
            </>
          )}
        </button>
        {sendError && (
          <p className="text-red-400 text-xs text-center">{sendError}</p>
        )}
      </div>

      <div className="flex flex-col items-center gap-3 pb-4">
        <button
          type="button"
          onClick={() => {
            setScreen(0);
            setAnswers({});
            setSent(false);
            setSendError("");
          }}
          className="text-sm text-gray-300 hover:text-gray-500 transition-colors"
        >
          Opnieuw beginnen
        </button>
        <Link
          href="/account/handreikingen"
          className="text-sm text-primary-500 hover:underline"
        >
          ← Terug naar handreikingen
        </Link>
      </div>
    </div>
  );

  // ─── Wrapper voor intro en eindscherm ───────────────────────────────────────
  const regularContent = (
    <div className="space-y-4">
      {screen !== TOTAL + 1 && (
        <Link
          href="/account/handreikingen"
          className="inline-flex items-center gap-1.5 text-sm text-gray-400 hover:text-gray-600 transition-colors"
        >
          <ArrowLeft size={15} />
          Handreikingen
        </Link>
      )}
      {screen === 0 && introScreen}
      {screen === TOTAL + 1 && endScreen}
    </div>
  );

  // Laden
  if (hasAccess === undefined) {
    return (
      <div className="flex justify-center py-16">
        <div className="animate-pulse rounded-full h-8 w-8 border-b-2 border-primary-600" />
      </div>
    );
  }

  // Paywall
  if (hasAccess === false) {
    return (
      <Paywall
        title="Upgrade naar Benji Alles in 1"
        message="De schrijfoefeningen zijn beschikbaar in Benji Alles in 1."
      >
        {regularContent}
      </Paywall>
    );
  }

  return (
    <>
      {/* Stappen — overlay (bedekt sidebar) */}
      {screen >= 1 && screen <= TOTAL && stepScreen}
      {/* Intro en eindscherm — gewone pagina-layout */}
      {(screen === 0 || screen === TOTAL + 1) && regularContent}
    </>
  );
}
