"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import Link from "next/link";
import { ArrowLeft, ArrowRight, Download, Mail, Check, Pencil } from "lucide-react";
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

  const currentStep = STEPS[screen - 1];
  const totalSteps = STEPS.length;

  const progressPct = screen === 0 ? 0 : screen >= totalSteps + 1 ? 100 : Math.round((screen / totalSteps) * 100);

  const canNext =
    screen === 0 ||
    screen > totalSteps ||
    (answers[screen] !== undefined && answers[screen].trim().length > 0);

  const assembleLetter = () => {
    const parts = [
      answers[2], // aanhef
      answers[3], // wat je mist
      answers[4], // onafgemaakt
      answers[5], // wat je meedraagt
      answers[6], // afsluiting
    ].filter(Boolean);
    return parts.join("\n\n");
  };

  const addressee = answers[1] || "";
  const letterBody = assembleLetter();
  const fullLetterText = `${addressee ? `Aan: ${addressee}\n\n` : ""}${letterBody}`;

  const handleDownload = () => {
    const blob = new Blob([fullLetterText], { type: "text/plain;charset=utf-8" });
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

  // --- Schermen ---

  // Introscherm
  const introScreen = (
    <div className="bg-white rounded-xl border border-primary-200 shadow-sm p-8 max-w-lg mx-auto text-center">
      <div className="w-14 h-14 rounded-full bg-primary-100 flex items-center justify-center mx-auto mb-6">
        <Pencil size={26} className="text-primary-600" />
      </div>
      <h1 className="text-2xl font-bold text-primary-900 mb-3">De onafgemaakte brief</h1>
      <p className="text-gray-600 leading-relaxed mb-2">
        Er zijn dingen die we nooit hebben kunnen zeggen. Woorden die bleven hangen.
        Dit is je kans om ze alsnog een plek te geven.
      </p>
      <p className="text-gray-600 leading-relaxed mb-6">
        In zes stappen schrijf je een brief aan degene die je mist. Er is geen goed of fout.
      </p>
      <p className="text-sm text-gray-400 mb-8">
        ~20–30 minuten · je kunt altijd stoppen en later verdergaan
      </p>
      <button
        type="button"
        onClick={() => setScreen(1)}
        className="inline-flex items-center gap-2 px-6 py-3 bg-primary-600 text-white rounded-xl text-base font-medium hover:bg-primary-700 transition-colors"
      >
        Ik ben er klaar voor
        <ArrowRight size={18} />
      </button>
    </div>
  );

  // Stap-scherm (1–6)
  const stepScreen = currentStep && (
    <div className="bg-white rounded-xl border border-primary-200 shadow-sm p-6 sm:p-8 max-w-lg mx-auto">
      {/* Voortgangsbalk */}
      <div className="mb-8">
        <div className="flex justify-between items-center mb-2">
          <span className="text-xs text-gray-400">Stap {screen} van {totalSteps}</span>
          <span className="text-xs text-gray-400">{progressPct}%</span>
        </div>
        <div className="h-1.5 bg-primary-100 rounded-full overflow-hidden">
          <div
            className="h-full bg-primary-500 rounded-full transition-all duration-500"
            style={{ width: `${progressPct}%` }}
          />
        </div>
      </div>

      <h2 className="text-lg font-semibold text-primary-900 mb-2">{currentStep.title}</h2>
      <p className="text-sm text-gray-500 leading-relaxed mb-5">{currentStep.subtitle}</p>

      {currentStep.multiline ? (
        <textarea
          value={answers[screen] ?? ""}
          onChange={(e) => setAnswers((a) => ({ ...a, [screen]: e.target.value }))}
          placeholder={currentStep.placeholder}
          rows={7}
          className="w-full px-4 py-3 border border-primary-200 rounded-xl text-gray-800 text-base leading-relaxed resize-none focus:outline-none focus:ring-2 focus:ring-primary-300 focus:border-transparent placeholder:text-gray-300"
          autoFocus
        />
      ) : (
        <input
          type="text"
          value={answers[screen] ?? ""}
          onChange={(e) => setAnswers((a) => ({ ...a, [screen]: e.target.value }))}
          placeholder={currentStep.placeholder}
          className="w-full px-4 py-3 border border-primary-200 rounded-xl text-gray-800 text-base focus:outline-none focus:ring-2 focus:ring-primary-300 focus:border-transparent placeholder:text-gray-300"
          autoFocus
        />
      )}

      <div className="flex justify-between items-center mt-6">
        <button
          type="button"
          onClick={() => setScreen((s) => s - 1)}
          className="inline-flex items-center gap-1.5 px-4 py-2 text-gray-500 hover:text-gray-700 text-sm transition-colors"
        >
          <ArrowLeft size={16} />
          {screen === 1 ? "Terug" : "Vorige"}
        </button>
        <button
          type="button"
          onClick={() => setScreen((s) => s + 1)}
          disabled={!canNext}
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-primary-600 text-white rounded-xl text-sm font-medium hover:bg-primary-700 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {screen === totalSteps ? "Klaar" : "Volgende stap"}
          <ArrowRight size={16} />
        </button>
      </div>
    </div>
  );

  // Eindscherm
  const endScreen = (
    <div className="max-w-lg mx-auto space-y-6">
      <div className="bg-white rounded-xl border border-primary-200 shadow-sm p-6 sm:p-8">
        <p className="text-sm text-gray-400 mb-1">Je brief is klaar</p>
        <h2 className="text-xl font-bold text-primary-900 mb-6">
          {addressee ? `Aan: ${addressee}` : "Jouw brief"}
        </h2>

        {/* De brief */}
        <div className="border-l-4 border-primary-200 pl-5 space-y-4">
          {[answers[2], answers[3], answers[4], answers[5], answers[6]]
            .filter(Boolean)
            .map((para, i) => (
              <p key={i} className="text-gray-700 leading-relaxed whitespace-pre-wrap text-sm">
                {para}
              </p>
            ))}
        </div>
      </div>

      {/* Acties */}
      <div className="bg-white rounded-xl border border-primary-200 shadow-sm p-6 space-y-3">
        <p className="text-sm text-gray-500 mb-4">
          Je kunt je brief bewaren of naar jezelf sturen.
        </p>

        <button
          type="button"
          onClick={handleDownload}
          className="w-full inline-flex items-center justify-center gap-2 px-4 py-3 border border-primary-300 text-primary-700 rounded-xl text-sm font-medium hover:bg-primary-50 transition-colors"
        >
          <Download size={17} />
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
              <Check size={17} />
              Verstuurd naar {session?.user?.email}
            </>
          ) : sending ? (
            "Versturen..."
          ) : (
            <>
              <Mail size={17} />
              Stuur naar mijn e-mail
            </>
          )}
        </button>

        {sendError && (
          <p className="text-red-500 text-xs text-center">{sendError}</p>
        )}
      </div>

      {/* Opnieuw / terug */}
      <div className="flex flex-col items-center gap-3">
        <button
          type="button"
          onClick={() => {
            setScreen(0);
            setAnswers({});
            setSent(false);
            setSendError("");
          }}
          className="text-sm text-gray-400 hover:text-gray-600 transition-colors"
        >
          Opnieuw beginnen
        </button>
        <Link
          href="/account/handreikingen"
          className="text-sm text-primary-600 hover:underline"
        >
          ← Terug naar handreikingen
        </Link>
      </div>
    </div>
  );

  const mainContent = (
    <div className="space-y-4">
      {/* Terugknop (niet op eindscherm) */}
      {screen <= totalSteps && (
        <div className="flex items-center gap-3">
          <Link
            href="/account/handreikingen"
            className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 transition-colors"
          >
            <ArrowLeft size={15} />
            Handreikingen
          </Link>
        </div>
      )}

      {screen === 0 && introScreen}
      {screen >= 1 && screen <= totalSteps && stepScreen}
      {screen > totalSteps && endScreen}
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
        {mainContent}
      </Paywall>
    );
  }

  return mainContent;
}
