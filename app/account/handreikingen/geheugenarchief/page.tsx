"use client";

import { useState, useEffect, useRef } from "react";
import { useSession } from "next-auth/react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import Link from "next/link";
import {
  ArrowLeft,
  ArrowRight,
  Mail,
  Check,
  X,
  Gem,
  Mic,
  Square,
  BookOpen,
  MessageCircle,
  Printer,
} from "lucide-react";
import { Paywall } from "@/components/Paywall";

const TOTAL = 15;
const STORAGE_KEY = "geheugenarchief_v1";

interface StepDef {
  stepNum: number;
  category: string;
  title: string;
  subtitle: string;
  placeholder: string;
  multiline: boolean;
}

function getSteps(name: string, isPet = false): StepDef[] {
  const n = name.trim();
  const ref = n || (isPet ? "dit dier" : "diegene");
  return [
    {
      stepNum: 1,
      category: "De basis",
      title: isPet ? "Hoe heette je huisdier?" : "Hoe noemde jij deze persoon?",
      subtitle: isPet
        ? "Niet de officiële naam, maar hoe jíj je huisdier noemde. Een koosnaampje of gewoon de naam."
        : "Niet de officiële naam, maar hoe jíj deze persoon noemde. Een koosnaampje, een bijnaam, of gewoon de naam.",
      placeholder: isPet ? "Bijv. Lola, Noor, de kat..." : "Bijv. mama, opa, mijn beste vriend...",
      multiline: false,
    },
    {
      stepNum: 2,
      category: "Het eerste beeld",
      title: `Als je nu je ogen sluit en aan ${ref} denkt, wat is het eerste beeld dat opkomt?`,
      subtitle: "Niet wat je zou willen zien, maar wat er gewoon is.",
      placeholder: "",
      multiline: true,
    },
    {
      stepNum: 3,
      category: isPet ? "Het geluid" : "De stem",
      title: isPet
        ? `Welk geluid of gebaar van ${ref} vergeet je nooit?`
        : `Hoe klonk de stem van ${ref}?`,
      subtitle: isPet
        ? `De blaas, het getrappel als je thuiskwam, de manier waarop ${ref} om aandacht vroeg. Wat maakte dat geluid zo herkenbaar?`
        : "Niet alleen hoog of laag, maar wat maakte die stem uniek? Een uitdrukking, een manier van praten, iets wat je altijd herkende.",
      placeholder: "",
      multiline: true,
    },
    {
      stepNum: 4,
      category: "De geur",
      title: `Als je kon beschrijven hoe ${ref} rook, wat zou je zeggen?`,
      subtitle: isPet
        ? `Geur is één van de sterkste herinneringen. De vacht, de adem, de geur van het mandje of de vaste plek van ${ref}. Wat ruik je als je eraan denkt?`
        : "Geur is één van de sterkste herinneringen. Een parfum, zeep, de lucht van hun huis, iets anders.",
      placeholder: "",
      multiline: true,
    },
    {
      stepNum: 5,
      category: isPet ? "De vreugde" : "De lach",
      title: isPet
        ? `Hoe liet ${ref} zien dat die blij was?`
        : `Vertel over de lach van ${ref}.`,
      subtitle: isPet
        ? `Een kwispelende staart, een kopje, een geluidje? Hoe merkte jij dat ${ref} blij was? Kun je je een moment herinneren waarop dat overduidelijk was?`
        : `Was het luid, zacht, aanstekelijk? Lachte ${ref} snel, of moest je er echt voor je best doen? Kun je je een moment herinneren waarop ${ref} écht lachte?`,
      placeholder: "",
      multiline: true,
    },
    {
      stepNum: 6,
      category: "De kleine gewoontes",
      title: `Wat deed ${ref} altijd, bijna zonder het te weten?`,
      subtitle:
        `Iedereen heeft kleine gewoontes die niemand anders opvallen, maar jij wel. Hoe liep ${ref} de kamer in? Wat deed ${ref} als die nadacht?`,
      placeholder: "",
      multiline: true,
    },
    {
      stepNum: 7,
      category: isPet ? "Het vaste ritueel" : "De vaste uitdrukking",
      title: isPet
        ? `Wat deed ${ref} altijd op precies dezelfde manier?`
        : `Was er een uitdrukking of zin die typisch voor ${ref} was?`,
      subtitle: isPet
        ? `Een plekje op de bank, een ritueel voor het slapen, een manier van vragen om eten. Iets kleins dat van ${ref} was.`
        : `Iets wat ${ref} vaak zei, grappig of wijs, of gewoon een tic. Iets wat alleen jullie kenden.`,
      placeholder: "",
      multiline: true,
    },
    {
      stepNum: 8,
      category: "Waar ${ref} van hield",
      title: `Wat bracht ${ref} echt tot leven?`,
      subtitle:
        `Niet wat ${ref} 'leuk vond', maar waar die ogen van gingen stralen. Wat kon ${ref} uren over praten?`,
      placeholder: "",
      multiline: true,
    },
    {
      stepNum: 9,
      category: "Wat dwarszat",
      title: `Wat kon ${ref} echt niet hebben?`,
      subtitle:
        `Iets kleins of iets groots. Waar werd ${ref} onrustig of geïrriteerd van? Dit hoort ook bij wie iemand was.`,
      placeholder: "",
      multiline: true,
    },
    {
      stepNum: 10,
      category: "De aanwezigheid",
      title: `Hoe voelde jij je als je bij ${ref} was?`,
      subtitle:
        `Niet wat je deed samen, maar het gevoel. Veilig, uitgedaagd, thuis, vrolijk? Wat deed de aanwezigheid van ${ref} met jou?`,
      placeholder: "",
      multiline: true,
    },
    {
      stepNum: 11,
      category: "Iets wat mensen niet wisten",
      title: `Is er iets aan ${ref} wat de meeste mensen niet wisten, maar jij wel?`,
      subtitle:
        `Een kant die ${ref} niet snel liet zien. Iets zachts, grappigs, kwetsbaars, verrassends.`,
      placeholder: "",
      multiline: true,
    },
    {
      stepNum: 12,
      category: "Een herinnering die je altijd bij je draagt",
      title: "Als je één herinnering mocht bewaren, welke zou dat zijn?",
      subtitle:
        "Een moment samen, groot of klein. Beschrijf dat moment zo concreet als je kunt. Waar was je, wat gebeurde er, wat voelde je?",
      placeholder: "",
      multiline: true,
    },
    {
      stepNum: 13,
      category: isPet ? "Wat je voelt" : `Wat ${ref} zou zeggen`,
      title: isPet
        ? `Als ${ref} kon aanvoelen wat jij nu voelt, wat zou die doen?`
        : `Als ${ref} je nu kon zien, wat denk je dat ${ref} zou zeggen?`,
      subtitle: isPet
        ? `Misschien naast je komen liggen, een kopje geven, of gewoon er zijn. Wat had die aanwezigheid nu voor jou betekend?`
        : "Over hoe het met je gaat, over je leven, over dit moment.",
      placeholder: "",
      multiline: true,
    },
    {
      stepNum: 14,
      category: "Wat is meegegeven",
      title: `${ref} heeft iets in jou achtergelaten. Wat is dat voor jou?`,
      subtitle:
        `Een waarde, een manier van kijken, een gewoonte die van ${ref} is overgenomen. Iets wat je draagt zonder het altijd te beseffen.`,
      placeholder: "",
      multiline: true,
    },
    {
      stepNum: 15,
      category: "De zin die alles zegt",
      title: `Als je ${ref} moest omschrijven in één zin, wat zou je schrijven?`,
      subtitle: `Niet wat ${ref} heeft gedaan. Maar wie ${ref} was.`,
      placeholder: "",
      multiline: true,
    },
  ];
}

export default function GeheugenarchiefPage() {
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

  const addMemory = useMutation(api.memories.addMemory);

  const [screen, setScreen] = useState(0);
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [petMode, setPetMode] = useState(false);
  const [hasSavedProgress, setHasSavedProgress] = useState(false);
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [sendError, setSendError] = useState("");
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);

  // Microfoon
  const recognitionRef = useRef<any>(null);
  const textBeforeRecordingRef = useRef("");
  const finalTranscriptRef = useRef("");
  const isRecordingRef = useRef(false);
  const screenRef = useRef(screen);
  const [isRecording, setIsRecording] = useState(false);
  const [speechSupported, setSpeechSupported] = useState(false);

  // Controleer localStorage bij laden
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const { answers: saved } = JSON.parse(raw);
        if (saved && Object.keys(saved).length > 0) {
          setHasSavedProgress(true);
        }
      }
    } catch {}
  }, []);

  // Sla antwoorden + petMode op in localStorage
  useEffect(() => {
    if (Object.keys(answers).length > 0) {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify({ answers, petMode }));
      } catch {}
    }
  }, [answers, petMode]);

  // Spraakherkenning
  useEffect(() => {
    const SpeechRecognitionAPI =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognitionAPI) {
      setSpeechSupported(true);
      const recognition = new SpeechRecognitionAPI();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = "nl-NL";
      recognition.onresult = (event: any) => {
        let newFinal = "";
        let interim = "";
        for (let i = event.resultIndex; i < event.results.length; i++) {
          if (event.results[i].isFinal) {
            newFinal += event.results[i][0].transcript;
          } else {
            interim += event.results[i][0].transcript;
          }
        }
        if (newFinal) finalTranscriptRef.current += newFinal;
        const prefix = textBeforeRecordingRef.current;
        const combined = finalTranscriptRef.current + interim;
        const spacer = prefix && combined && !prefix.endsWith(" ") ? " " : "";
        setAnswers((a) => ({
          ...a,
          [screenRef.current]: prefix + spacer + combined,
        }));
      };
      recognition.onend = () => {
        if (isRecordingRef.current) {
          try { recognition.start(); } catch {}
        } else {
          setIsRecording(false);
        }
      };
      recognition.onerror = (event: any) => {
        if (event.error !== "no-speech") {
          isRecordingRef.current = false;
          setIsRecording(false);
        }
      };
      recognitionRef.current = recognition;
    }
  }, []);

  // Stop opname bij stapwissel
  useEffect(() => {
    screenRef.current = screen;
    isRecordingRef.current = false;
    if (recognitionRef.current) {
      try { recognitionRef.current.stop(); } catch {}
    }
    setIsRecording(false);
  }, [screen]);

  // Vergrendel scroll tijdens schrijfstappen
  useEffect(() => {
    if (screen >= 1 && screen <= TOTAL) {
      document.body.style.overflow = "hidden";
      return () => { document.body.style.overflow = ""; };
    }
  }, [screen]);

  const toggleRecording = () => {
    if (!recognitionRef.current) return;
    if (isRecording) {
      isRecordingRef.current = false;
      recognitionRef.current.stop();
      setIsRecording(false);
    } else {
      textBeforeRecordingRef.current = answers[screen] || "";
      finalTranscriptRef.current = "";
      isRecordingRef.current = true;
      try { recognitionRef.current.start(); } catch {}
      setIsRecording(true);
    }
  };

  const continueSaved = () => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const { answers: savedAnswers, petMode: savedPetMode } = JSON.parse(raw);
        if (typeof savedPetMode === "boolean") setPetMode(savedPetMode);
        setAnswers(savedAnswers || {});
        // Ga naar eerste onbeantwoorde stap
        for (let i = 1; i <= TOTAL; i++) {
          if (!savedAnswers[i]?.trim()) {
            setScreen(i);
            return;
          }
        }
        setScreen(TOTAL + 1);
      }
    } catch {
      setScreen(1);
    }
  };

  const handleReset = () => {
    setScreen(0);
    setAnswers({});
    setSent(false);
    setSaved(false);
    setSendError("");
    setPetMode(false);
    setHasSavedProgress(false);
    try { localStorage.removeItem(STORAGE_KEY); } catch {}
  };

  const name = (answers[1] || "").trim();
  const steps = getSteps(name, petMode);
  const currentStep = steps[screen - 1];

  // Stap 1 vereist een antwoord; stappen 2-15 mogen worden overgeslagen
  const canNext =
    screen === 0 ||
    screen > TOTAL ||
    (screen === 1
      ? answers[1] !== undefined && answers[1].trim().length > 0
      : true);

  const handleSendEmail = async () => {
    if (sending || sent) return;
    setSending(true);
    setSendError("");
    try {
      const res = await fetch("/api/oefeningen/send-geheugenarchief", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ answers, name }),
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

  const handleSaveToMemories = async () => {
    if (saving || saved || !session?.userId) return;
    setSaving(true);
    try {
      const text = [
        name ? `Portret van ${name}` : "Portret",
        "",
        ...steps
          .slice(1)
          .filter((s) => answers[s.stepNum]?.trim())
          .map((s) => `${s.category}\n${answers[s.stepNum]}`),
      ].join("\n\n");
      await addMemory({
        userId: session.userId as string,
        text,
        source: "manual",
        memoryDate: new Date().toISOString().slice(0, 10),
      });
      setSaved(true);
    } catch {}
    finally {
      setSaving(false);
    }
  };

  const handlePrint = () => {
    const answeredSteps = steps.slice(1).filter((s) => answers[s.stepNum]?.trim());
    const esc = (t: string) =>
      t
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/\n/g, "<br/>");
    const html = `<!DOCTYPE html>
<html lang="nl">
<head>
<meta charset="utf-8">
<title>${name ? `Portret van ${name}` : "Portret van..."}</title>
<style>
  body { font-family: Georgia, serif; max-width: 600px; margin: 48px auto; color: #2d3748; line-height: 1.8; }
  h1 { font-size: 26px; font-weight: normal; color: #1a202c; margin: 0 0 6px; }
  .meta { font-size: 13px; color: #a0aec0; margin-bottom: 48px; }
  .entry { margin-bottom: 36px; page-break-inside: avoid; }
  .cat { font-size: 11px; text-transform: uppercase; letter-spacing: 0.12em; color: #a0aec0; margin-bottom: 8px; }
  .ans { font-size: 15px; color: #2d3748; border-left: 3px solid #e2e8f0; padding-left: 18px; }
  @media print { body { margin: 24px; } }
</style>
</head>
<body>
<h1>${name ? `Portret van ${name}` : "Portret van..."}</h1>
<div class="meta">Opgemaakt via Talk To Benji</div>
${answeredSteps
  .map(
    (s) => `<div class="entry">
  <div class="cat">${s.category}</div>
  <div class="ans">${esc(answers[s.stepNum] || "")}</div>
</div>`
  )
  .join("")}
</body>
</html>`;
    const win = window.open("", "_blank");
    if (win) {
      win.document.write(html);
      win.document.close();
      win.focus();
      setTimeout(() => win.print(), 300);
    }
  };

  // ─── Introscherm ─────────────────────────────────────────────────────────────
  const introScreen = (
    <div className="bg-white rounded-xl border border-primary-200 shadow-sm p-6 sm:p-8">
      <div className="w-12 h-12 rounded-full bg-primary-50 flex items-center justify-center mb-5">
        <BookOpen size={22} className="text-primary-500" />
      </div>
      <h1 className="text-xl sm:text-2xl font-semibold text-primary-900 mb-4">
        Portret van...
      </h1>
      <p className="text-gray-500 leading-relaxed mb-3 max-w-prose">
        Eén van de zwaarste kanten van verlies is de angst te vergeten. De kleine dingen.
        Hoe iemand lachte. Wat ze zeiden als ze blij waren. De geur van hun jas.
      </p>
      <p className="text-gray-500 leading-relaxed mb-5 max-w-prose">
        In vijftien vragen leg je vast wie deze persoon echt was. Niet de grote feiten,
        maar de mens. Het resultaat bewaar je voor jezelf, voor later, of om te delen
        met mensen die van diegene hielden.
      </p>
      <p className="text-sm text-gray-300 mb-7">
        ~30–45 minuten · je kunt pauzeren en later verdergaan
      </p>

      <div className="flex flex-wrap gap-3">
        <button
          type="button"
          onClick={() => setScreen(1)}
          className="inline-flex items-center gap-2 px-6 py-3 bg-primary-600 text-white rounded-xl text-sm font-medium hover:bg-primary-700 transition-colors"
        >
          Ik begin
          <ArrowRight size={17} />
        </button>
        {hasSavedProgress && (
          <button
            type="button"
            onClick={continueSaved}
            className="inline-flex items-center gap-2 px-5 py-3 border border-primary-200 text-primary-700 rounded-xl text-sm font-medium hover:bg-primary-50 transition-colors"
          >
            Verder gaan waar ik gebleven was
          </button>
        )}
      </div>
    </div>
  );

  // ─── Schrijfstap — focusoverlay ───────────────────────────────────────────────
  const stepScreen = currentStep && (
    <div
      className="fixed inset-0 z-[60] flex flex-col overflow-hidden"
      style={{ backgroundColor: "#fdf9f4" }}
    >
      {/* Topbalk */}
      <div className="flex items-center justify-between px-4 sm:px-6 pt-4 pb-2 flex-shrink-0">
        <button
          type="button"
          onClick={() => setScreen((s) => s - 1)}
          className="inline-flex items-center gap-1.5 text-sm transition-colors flex-shrink-0"
          style={{ color: "#b0a098" }}
        >
          <ArrowLeft size={15} />
          {screen === 1 ? "Terug" : "Vorige"}
        </button>
        {screen > 1 && name && (
          <span
            className="text-sm text-center truncate mx-3 max-w-[160px] sm:max-w-xs"
            style={{ color: "#a09088" }}
          >
            Portret van {name}
          </span>
        )}
        <button
          type="button"
          onClick={() => window.history.back()}
          className="p-1.5 rounded-lg transition-colors flex-shrink-0"
          style={{ color: "#c5b8ae" }}
          aria-label="Sluiten"
        >
          <X size={18} />
        </button>
      </div>

      {/* Scrollbaar schrijfgebied */}
      <div className="flex-1 overflow-y-auto">
        <div className="flex flex-col items-center justify-start min-h-full px-4 sm:px-6 pt-6 pb-10">
          <div className="w-full max-w-xl">
            {/* Categorie + vraag */}
            <div className="mb-6">
              <p
                className="text-xs uppercase tracking-widest mb-2"
                style={{ color: "#c5b8ae" }}
              >
                {currentStep.category}
              </p>
              {screen === 1 ? (
                <div>
                  <p
                    className="text-xl sm:text-2xl leading-snug mb-1"
                    style={{ color: "#3d3530", fontWeight: 400 }}
                  >
                    Hoe noemde jij hem of haar?
                  </p>
                  <p
                    className="text-sm leading-relaxed italic"
                    style={{ color: "#a09088" }}
                  >
                    {currentStep.subtitle}
                  </p>
                </div>
              ) : (
                <>
                  <h2
                    className="text-xl sm:text-2xl leading-snug mb-3 max-w-prose"
                    style={{ color: "#3d3530", fontWeight: 400 }}
                  >
                    {currentStep.title}
                  </h2>
                  <p
                    className="text-sm leading-relaxed italic max-w-prose"
                    style={{ color: "#a09088" }}
                  >
                    {currentStep.subtitle}
                  </p>
                </>
              )}
            </div>

            {/* Schrijfveld */}
            <div className="relative">
              {currentStep.multiline ? (
                <textarea
                  key={screen}
                  value={answers[screen] ?? ""}
                  onChange={(e) =>
                    setAnswers((a) => ({ ...a, [screen]: e.target.value }))
                  }
                  placeholder={currentStep.placeholder || "Schrijf hier..."}
                  rows={6}
                  autoFocus
                  className="w-full rounded-2xl px-4 py-4 text-base leading-relaxed resize-none focus:outline-none transition-colors"
                  style={{
                    backgroundColor: "#fffcf8",
                    border: "1px solid #e8dfd5",
                    color: "#3d3530",
                    caretColor: "#6d84a8",
                    minHeight: "180px",
                  }}
                  onFocus={(e) => (e.currentTarget.style.borderColor = "#6d84a8")}
                  onBlur={(e) => (e.currentTarget.style.borderColor = "#e8dfd5")}
                />
              ) : (
                <input
                  key={screen}
                  type="text"
                  value={answers[screen] ?? ""}
                  onChange={(e) =>
                    setAnswers((a) => ({ ...a, [screen]: e.target.value }))
                  }
                  placeholder={currentStep.placeholder}
                  autoFocus
                  className="w-full rounded-2xl px-4 py-4 text-base leading-relaxed focus:outline-none transition-colors"
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

              {/* Persoon / Huisdier toggle — alleen op stap 1 */}
              {screen === 1 && (
                <div className="mt-4 flex gap-2">
                  <button
                    type="button"
                    onClick={() => setPetMode(false)}
                    className="px-3 py-1.5 rounded-lg text-xs font-medium transition-all"
                    style={
                      !petMode
                        ? { backgroundColor: "#6d84a8", color: "white" }
                        : { backgroundColor: "#fffcf8", border: "1px solid #e8dfd5", color: "#a09088" }
                    }
                  >
                    Persoon
                  </button>
                  <button
                    type="button"
                    onClick={() => setPetMode(true)}
                    className="px-3 py-1.5 rounded-lg text-xs font-medium transition-all"
                    style={
                      petMode
                        ? { backgroundColor: "#6d84a8", color: "white" }
                        : { backgroundColor: "#fffcf8", border: "1px solid #e8dfd5", color: "#a09088" }
                    }
                  >
                    Huisdier
                  </button>
                </div>
              )}

              {/* Microfoon */}
              {speechSupported && currentStep.multiline && (
                <button
                  type="button"
                  onClick={toggleRecording}
                  className="mt-2 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all"
                  style={
                    isRecording
                      ? { backgroundColor: "#ef4444", color: "white" }
                      : {
                          backgroundColor: "#fffcf8",
                          border: "1px solid #e8dfd5",
                          color: "#a09088",
                        }
                  }
                >
                  {isRecording ? (
                    <><Square size={13} />Stoppen</>
                  ) : (
                    <><Mic size={13} />Inspreken</>
                  )}
                </button>
              )}
            </div>

            {/* Navigatie */}
            <div className="mt-5 flex items-center justify-between">
              {/* Sla over — alleen stappen 2-15 */}
              {screen > 1 && !answers[screen]?.trim() ? (
                <button
                  type="button"
                  onClick={() => setScreen((s) => s + 1)}
                  className="text-sm transition-colors"
                  style={{ color: "#c5b8ae" }}
                >
                  Sla over
                </button>
              ) : (
                <span />
              )}
              <button
                type="button"
                onClick={() => setScreen((s) => s + 1)}
                disabled={!canNext}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium transition-all"
                style={{
                  backgroundColor: canNext ? "#6d84a8" : "#d4cfc9",
                  color: "white",
                  cursor: canNext ? "pointer" : "not-allowed",
                }}
              >
                {screen === TOTAL ? "Klaar" : "Ga verder"}
                <ArrowRight size={15} />
              </button>
            </div>

            {/* Voortgangsstippen */}
            <div className="mt-8 flex justify-center gap-1.5 flex-wrap">
              {Array.from({ length: TOTAL }, (_, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => setScreen(i + 1)}
                  className="rounded-full transition-all duration-300"
                  style={{
                    width: i + 1 === screen ? "20px" : "7px",
                    height: "7px",
                    backgroundColor:
                      answers[i + 1]?.trim()
                        ? "#6d84a8"
                        : i + 1 === screen
                        ? "#6d84a8"
                        : "#d4cec8",
                  }}
                  aria-label={`Vraag ${i + 1}`}
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  // ─── Eindscherm ───────────────────────────────────────────────────────────────
  const answeredSteps = steps.slice(1).filter((s) => answers[s.stepNum]?.trim());

  const endScreen = (
    <div className="space-y-5">
      {/* Archief */}
      <div className="bg-white rounded-xl border border-primary-200 shadow-sm p-6">
        <p className="text-xs text-gray-400 mb-1 uppercase tracking-wide">
          Portret
        </p>
        <h2 className="text-xl font-semibold text-primary-900 mb-6">
          {name ? `Portret van ${name}` : "Portret van..."}
        </h2>
        <div className="space-y-6">
          {answeredSteps.map((s) => (
            <div key={s.stepNum}>
              <p className="text-xs uppercase tracking-widest text-gray-300 mb-1">
                {s.category}
              </p>
              <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap border-l-4 border-primary-100 pl-4">
                {answers[s.stepNum]}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Acties */}
      <div className="bg-white rounded-xl border border-primary-200 shadow-sm p-6 space-y-3">
        <p className="text-sm text-gray-400 mb-2">
          Bewaar dit portret of stuur het naar jezelf.
        </p>

        <button
          type="button"
          onClick={handleSaveToMemories}
          disabled={saving || saved}
          className="w-full inline-flex items-center justify-center gap-2 px-4 py-3 bg-primary-600 text-white rounded-xl text-sm font-medium hover:bg-primary-700 transition-colors disabled:opacity-50"
        >
          {saved ? (
            <><Check size={16} />Opgeslagen in Memories</>
          ) : saving ? "Opslaan..." : (
            <><Gem size={16} />Bewaren in Memories</>
          )}
        </button>
        {saved && (
          <p className="text-xs text-gray-400 text-center">
            Terug te vinden via{" "}
            <Link href="/account/herinneringen" className="text-primary-500 hover:underline">
              Memories
            </Link>{" "}
            in het menu
          </p>
        )}

        <button
          type="button"
          onClick={handleSendEmail}
          disabled={sending || sent}
          className="w-full inline-flex items-center justify-center gap-2 px-4 py-3 border border-primary-200 text-primary-700 rounded-xl text-sm font-medium hover:bg-primary-50 transition-colors disabled:opacity-50"
        >
          {sent ? (
            <><Check size={16} />Verstuurd naar {session?.user?.email}</>
          ) : sending ? "Versturen..." : (
            <><Mail size={16} />Stuur naar mijn e-mail</>
          )}
        </button>
        {sendError && (
          <p className="text-red-400 text-xs text-center">{sendError}</p>
        )}

        <button
          type="button"
          onClick={handlePrint}
          className="w-full inline-flex items-center justify-center gap-2 px-4 py-3 border border-primary-200 text-primary-700 rounded-xl text-sm font-medium hover:bg-primary-50 transition-colors"
        >
          <Printer size={16} />
          Download als PDF
        </button>
      </div>

      {/* Gesprek starten */}
      <div className="bg-white rounded-xl border border-primary-200 shadow-sm p-6">
        <p className="text-sm text-gray-500 leading-relaxed mb-4">
          Wil je hier met Benji over napraten?
        </p>
        <Link
          href="/?welcome=1"
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-primary-600 text-white rounded-xl text-sm font-medium hover:bg-primary-700 transition-colors"
        >
          <MessageCircle size={16} />
          Gesprek starten
        </Link>
      </div>

      <div className="flex flex-col items-center gap-3 pb-4">
        <button
          type="button"
          onClick={handleReset}
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

  // ─── Wrapper normale paginalayout ────────────────────────────────────────────
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
        message="Portret van... is beschikbaar in Benji Alles in 1."
      >
        {regularContent}
      </Paywall>
    );
  }

  return (
    <>
      {screen >= 1 && screen <= TOTAL && stepScreen}
      {(screen === 0 || screen === TOTAL + 1) && regularContent}
    </>
  );
}
