"use client";

import { useState, useEffect, useRef } from "react";
import { useSession } from "next-auth/react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import Link from "next/link";
import { ArrowLeft, ArrowRight, Mail, Check, Pencil, X, Gem, Mic, Square, Camera } from "lucide-react";
import { Paywall } from "@/components/Paywall";

const TOTAL = 6;

function getSteps(name: string) {
  const n = name.trim();
  const ref = n || "diegene";
  return [
    {
      stepNum: 1,
      title: "Deze brief schrijf ik aan...",
      subtitle: "Schrijf de naam, of gewoon hoe je deze persoon noemde.",
      placeholder: "Bijv. mama, opa, mijn beste vriend...",
      multiline: false,
    },
    {
      stepNum: 2,
      title: "Hoe begin je jouw brief?",
      subtitle: `Niet wat je normaal aan ${ref} zou schrijven, maar wat het meest voelt als jij. Het mag precies zo zijn als jullie dat hadden.`,
      placeholder: n ? `Lieve ${n},\nHé ${n},\nBeste ${n},` : "Lieve...,\nHé jij,",
      multiline: true,
    },
    {
      stepNum: 3,
      title: `Wat mis je het meest aan ${ref}?`,
      subtitle: "Sluit je ogen en denk aan een gewone dag. Wanneer voel je het het sterkst? Is het een geluid, een geur, een gewoonte, iets kleins dat alleen jullie wisten?",
      placeholder: `Ik mis de manier waarop ${ref}...`,
      multiline: true,
    },
    {
      stepNum: 4,
      title: "Wat bleef er onafgemaakt?",
      subtitle: `Er was iets wat je ${ref} wilde zeggen, vragen, of laten zien. Misschien iets wat je dacht dat er altijd nog tijd voor zou zijn. Je hoeft het niet op te lossen, alleen te schrijven.`,
      placeholder: "Ik wilde je nog vertellen dat...",
      multiline: true,
    },
    {
      stepNum: 5,
      title: `Wat draag je mee van ${ref}?`,
      subtitle: "Wat is er in jou blijven leven? Een manier van zijn, een zin, een kracht. Iets wat je nooit loslaat.",
      placeholder: "Wat ik van jou meedraag is...",
      multiline: true,
    },
    {
      stepNum: 6,
      title: "Hoe sluit je af?",
      subtitle: `Je mag afsluiten zoals je wilt. Met een belofte, een dankjewel, een laatste gedag aan ${ref}. Of gewoon met je naam. Er is geen verkeerde afsluiting.`,
      placeholder: "Met liefde,",
      multiline: true,
    },
  ];
}

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

  const addMemory = useMutation(api.memories.addMemory);
  const generateUploadUrl = useMutation(api.preferences.generateUploadUrl);

  const [screen, setScreen] = useState(0);
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
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
        // Auto-restart als gebruiker nog wil inspreken
        if (isRecordingRef.current) {
          try { recognition.start(); } catch {}
        } else {
          setIsRecording(false);
        }
      };
      recognition.onerror = (event: any) => {
        // Bij 'no-speech' gewoon doorgaan; bij andere fouten stoppen
        if (event.error !== "no-speech") {
          isRecordingRef.current = false;
          setIsRecording(false);
        }
      };
      recognitionRef.current = recognition;
    }
  }, []);

  // Stop opname + update ref bij stap-wissel
  useEffect(() => {
    screenRef.current = screen;
    isRecordingRef.current = false;
    if (recognitionRef.current) {
      try { recognitionRef.current.stop(); } catch {}
    }
    setIsRecording(false);
  }, [screen]);

  // Vergrendel body-scroll tijdens schrijfstappen
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
      try {
        recognitionRef.current.start();
      } catch {}
      setIsRecording(true);
    }
  };

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => setPhotoUrl(ev.target?.result as string);
    reader.readAsDataURL(file);
    e.target.value = "";
  };

  const addressee = answers[1] || "";
  const steps = getSteps(addressee);
  const currentStep = steps[screen - 1];
  const canNext =
    screen === 0 ||
    screen > TOTAL ||
    (answers[screen] !== undefined && answers[screen].trim().length > 0);

  const assembleLetter = () =>
    [answers[2], answers[3], answers[4], answers[5], answers[6]]
      .filter(Boolean)
      .join("\n\n");
  const letterBody = assembleLetter();


  const handleSendEmail = async () => {
    if (sending || sent) return;
    setSending(true);
    setSendError("");
    try {
      const res = await fetch("/api/oefeningen/send-brief", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ letter: letterBody, addressee, photoUrl }),
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
      let imageStorageId: any;
      if (photoUrl) {
        try {
          const blob = await fetch(photoUrl).then((r) => r.blob());
          const uploadUrl = await generateUploadUrl();
          const uploadRes = await fetch(uploadUrl, {
            method: "POST",
            headers: { "Content-Type": blob.type },
            body: blob,
          });
          const { storageId } = await uploadRes.json();
          imageStorageId = storageId;
        } catch {
          // foto upload mislukt — doorgaan zonder foto
        }
      }
      const text = `${addressee ? `Aan: ${addressee}\n\n` : ""}${letterBody}`;
      await addMemory({
        userId: session.userId as string,
        text,
        imageStorageId,
        source: "manual",
        memoryDate: new Date().toISOString().slice(0, 10),
      });
      setSaved(true);
    } catch {
      // stil falen
    } finally {
      setSaving(false);
    }
  };

  // ─── Introscherm ────────────────────────────────────────────────────────────
  const introScreen = (
    <div className="bg-white rounded-xl border border-primary-200 shadow-sm p-6 sm:p-8">
      <div className="w-12 h-12 rounded-full bg-primary-50 flex items-center justify-center mb-5">
        <Pencil size={22} className="text-primary-500" />
      </div>
      <h1 className="text-xl sm:text-2xl font-semibold text-primary-900 mb-4">
        De onafgemaakte brief
      </h1>
      <p className="text-gray-500 leading-relaxed mb-3 max-w-prose">
        Er zijn dingen die we nooit hebben kunnen zeggen. Woorden die bleven
        hangen. Dit is je kans om ze alsnog een plek te geven.
      </p>
      <p className="text-gray-500 leading-relaxed mb-5 max-w-prose">
        In zes stappen schrijf je een brief aan degene die je mist.
        Er is geen goed of fout.
      </p>
      <p className="text-sm text-gray-300 mb-7">
        ~20–30 minuten · je kunt altijd stoppen
      </p>
      <button
        type="button"
        onClick={() => setScreen(1)}
        className="inline-flex items-center gap-2 px-6 py-3 bg-primary-600 text-white rounded-xl text-sm font-medium hover:bg-primary-700 transition-colors"
      >
        Ik ben er klaar voor
        <ArrowRight size={17} />
      </button>
    </div>
  );

  // ─── Schrijfstap — focusoverlay ──────────────────────────────────────────────
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
        {/* Naam + foto in topbalk */}
        {screen > 1 && (addressee || photoUrl) && (
          <div className="flex items-center gap-2 mx-3 min-w-0">
            {photoUrl && (
              <img
                src={photoUrl}
                alt=""
                className="w-8 h-8 rounded-full object-cover flex-shrink-0"
                style={{ border: "1.5px solid #e8dfd5" }}
              />
            )}
            {addressee && (
              <span
                className="text-sm truncate max-w-[120px] sm:max-w-xs"
                style={{ color: "#a09088" }}
              >
                Brief aan {addressee}
              </span>
            )}
          </div>
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
            {/* Foto upload — alleen op stap 1 */}
            {screen === 1 && (
              <div className="flex justify-center mb-6">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="relative w-20 h-20 rounded-full overflow-hidden flex items-center justify-center transition-opacity hover:opacity-80 flex-shrink-0"
                  style={{
                    backgroundColor: "#f0ebe4",
                    border: photoUrl ? "none" : "2px dashed #d4cec8",
                  }}
                  title={photoUrl ? "Foto wijzigen" : "Foto toevoegen (optioneel)"}
                >
                  {photoUrl ? (
                    <img src={photoUrl} alt="Foto" className="w-full h-full object-cover" />
                  ) : (
                    <Camera size={22} style={{ color: "#c5b8ae" }} />
                  )}
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handlePhotoChange}
                />
              </div>
            )}

            {/* Vraag */}
            <div className="mb-6">
              {screen === 1 ? (
                /* Stap 1: zin-aanvulstijl */
                <div className="mb-3">
                  <p
                    className="text-xl sm:text-2xl leading-snug mb-1"
                    style={{ color: "#3d3530", fontWeight: 400 }}
                  >
                    Deze brief schrijf ik aan...
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
                  placeholder={currentStep.placeholder}
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

              {/* Microfoon — rechtsonder het veld */}
              {speechSupported && (
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
                    <>
                      <Square size={13} />
                      Stoppen
                    </>
                  ) : (
                    <>
                      <Mic size={13} />
                      Inspreken
                    </>
                  )}
                </button>
              )}
            </div>

            {/* Volgende knop */}
            <div className="mt-5 flex justify-end">
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
            <div className="mt-8 flex justify-center gap-2.5">
              {Array.from({ length: TOTAL }, (_, i) => (
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
    </div>
  );

  // ─── Eindscherm ──────────────────────────────────────────────────────────────
  const endScreen = (
    <div className="space-y-5">
      {/* De brief */}
      <div className="bg-white rounded-xl border border-primary-200 shadow-sm p-6">
        <div className="flex items-center gap-4 mb-5">
          {photoUrl && (
            <img
              src={photoUrl}
              alt={addressee}
              className="w-16 h-16 rounded-full object-cover flex-shrink-0"
              style={{ border: "2px solid #e8dfd5" }}
            />
          )}
          <div>
            <p className="text-xs text-gray-400 mb-1 uppercase tracking-wide">Je brief</p>
            <h2 className="text-xl font-semibold text-primary-900">
              {addressee ? `Aan: ${addressee}` : "Jouw brief"}
            </h2>
          </div>
        </div>
        <div className="border-l-4 border-primary-100 pl-5 space-y-4">
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
        <p className="text-sm text-gray-400 mb-2">
          Je kunt je brief bewaren of naar jezelf sturen.
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
      </div>

      <div className="flex flex-col items-center gap-3 pb-4">
        <button
          type="button"
          onClick={() => {
            setScreen(0);
            setAnswers({});
            setPhotoUrl(null);
            setSent(false);
            setSaved(false);
            setSendError("");
          }}
          className="text-sm text-gray-300 hover:text-gray-500 transition-colors"
        >
          Opnieuw beginnen
        </button>
        <Link href="/account/handreikingen" className="text-sm text-primary-500 hover:underline">
          ← Terug naar handreikingen
        </Link>
      </div>
    </div>
  );

  // ─── Wrapper normale paginalayout ───────────────────────────────────────────
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
        message="De schrijfoefeningen zijn beschikbaar in Benji Alles in 1."
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
