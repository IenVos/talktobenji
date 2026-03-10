"use client";

import { useEffect, useRef, useState, Suspense } from "react";
import { useSession } from "next-auth/react";
import { useSearchParams } from "next/navigation";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { getDagInhoud } from "@/convex/nietAlleenContent";
import Image from "next/image";
import Link from "next/link";
import { ImagePlus, X, Mic, MicOff, ChevronLeft } from "lucide-react";

type Scherm = "laden" | "geen_toegang" | "onboarding" | "dag" | "afgerond" | "gesloten";
type StapOnboarding = "verlies" | "naam";

const VERLIES_TYPES = [
  { key: "persoon" as const, label: "Een dierbare persoon" },
  { key: "huisdier" as const, label: "Een huisdier" },
  { key: "relatie" as const, label: "Een relatie" },
  { key: "gezondheid" as const, label: "Mijn gezondheid" },
  { key: "anders" as const, label: "Iets anders" },
];

const NAAM_PLACEHOLDER: Record<string, string> = {
  persoon: "Bijv. Oma, Floris, Mam…",
  huisdier: "Bijv. Luna, Appie, Boris…",
};

// Dagen waarop het upsell-menu rechts zichtbaar is
const MENU_DAGEN = [10, 18, 24, 28, 29, 30];
// Dagen waarop het upsell-blok onderaan zichtbaar is
const UPSELL_DAGEN = [24, 28, 30];

function NietAlleenPageInner() {
  const { data: session, status } = useSession();
  const searchParams = useSearchParams();
  const dagParam = searchParams?.get("dag");
  const [scherm, setScherm] = useState<Scherm>("laden");
  const [stapOnboarding, setStapOnboarding] = useState<StapOnboarding>("verlies");
  const [geselecteerdType, setGeselecteerdType] = useState<string | null>(null);
  const [verliesNaamInput, setVerliesNaamInput] = useState("");
  const [tekst, setTekst] = useState("");
  const [opgeslagen, setOpgeslagen] = useState(false);
  const [bezig, setBezig] = useState(false);
  const [fotoPreview, setFotoPreview] = useState<string | null>(null);
  const [fotoUploaden, setFotoUploaden] = useState(false);
  const [opname, setOpname] = useState(false);
  const [bekijkDag, setBekijkDag] = useState<number | null>(null);
  const [bekijkBewerkModus, setBekijkBewerkModus] = useState(false);
  const [bekijkTekstEdit, setBekijkTekstEdit] = useState("");
  const [bekijkOpgeslagen, setBekijkOpgeslagen] = useState(false);
  const [bekijkFotoUploaden, setBekijkFotoUploaden] = useState(false);
  const fotoInputRef = useRef<HTMLInputElement>(null);
  const bekijkFotoInputRef = useRef<HTMLInputElement>(null);
  const tekstRef = useRef<HTMLTextAreaElement>(null);
  const herkenningRef = useRef<any>(null);

  const userId = (session?.user as any)?.id ?? session?.user?.email ?? "";

  const profiel = useQuery(
    api.nietAlleen.getProfile,
    userId ? { userId } : "skip"
  );

  const setVerliesType = useMutation(api.nietAlleen.setVerliesType);
  const setVerliesNaam = useMutation(api.nietAlleen.setVerliesNaam);
  const saveDagPrompt = useMutation(api.nietAlleen.saveDagPrompt);
  const generateUploadUrl = useMutation(api.nietAlleen.generateUploadUrl);
  const saveDagFoto = useMutation(api.nietAlleen.saveDagFoto);

  const dagNummer = profiel?.startDatum
    ? Math.min(30, Math.floor((Date.now() - profiel.startDatum) / 86400000) + 1)
    : 1;

  // Als er een ?dag=X param in de URL staat (vanuit email-link), gebruik die dag
  const activeDag = dagParam ? Math.min(30, Math.max(1, parseInt(dagParam))) : dagNummer;

  const huidigeStorageId = profiel?.dagFotos?.find((f) => f.dag === activeDag)?.storageId;
  const fotoUrl = useQuery(
    api.nietAlleen.getDagFotoUrl,
    huidigeStorageId ? { storageId: huidigeStorageId } : { storageId: undefined }
  );

  const bekijkStorageId = bekijkDag
    ? profiel?.dagFotos?.find((f) => f.dag === bekijkDag)?.storageId
    : undefined;
  const bekijkFotoUrl = useQuery(
    api.nietAlleen.getDagFotoUrl,
    bekijkStorageId ? { storageId: bekijkStorageId } : { storageId: undefined }
  );

  const profielFotoStorageId = profiel?.profielFoto;
  const profielFotoUrl = useQuery(
    api.nietAlleen.getDagFotoUrl,
    profielFotoStorageId ? { storageId: profielFotoStorageId } : { storageId: undefined }
  );

  // Scherm bepalen
  useEffect(() => {
    if (status === "loading" || profiel === undefined) return;

    if (status === "unauthenticated") { setScherm("geen_toegang"); return; }

    if (!profiel || profiel.accountGesloten) {
      setScherm(profiel?.accountGesloten ? "gesloten" : "geen_toegang");
      return;
    }

    if (!profiel.verliesType) { setScherm("onboarding"); return; }

    const dag = Math.floor((Date.now() - profiel.startDatum) / 86400000) + 1;
    if (dag > 30) { setScherm("afgerond"); return; }

    const vandaag = profiel.dagPrompts.find((p) => p.dag === activeDag);
    if (vandaag) setTekst(vandaag.tekst);

    setScherm("dag");
  }, [status, profiel, activeDag]);

  // Microfoon
  function toggleOpname() {
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SR) return;

    if (opname) {
      herkenningRef.current?.stop();
      setOpname(false);
    } else {
      const h = new SR();
      h.lang = "nl-NL";
      h.continuous = true;
      h.interimResults = false;
      h.onresult = (e: any) => {
        const transcript = Array.from(e.results as any[])
          .map((r: any) => r[0].transcript)
          .join(" ");
        setTekst((prev) => prev + (prev ? " " : "") + transcript);
      };
      h.onend = () => setOpname(false);
      h.start();
      herkenningRef.current = h;
      setOpname(true);
    }
  }

  async function handleVerliesTypeVerder() {
    if (!geselecteerdType || bezig) return;
    if (geselecteerdType === "persoon" || geselecteerdType === "huisdier") {
      setStapOnboarding("naam");
    } else {
      setBezig(true);
      try { await setVerliesType({ userId, verliesType: geselecteerdType as any }); }
      finally { setBezig(false); }
    }
  }

  async function handleBeginnen(naamOverride?: string) {
    if (!geselecteerdType || !userId || bezig) return;
    const naam = naamOverride !== undefined ? naamOverride : verliesNaamInput.trim();
    setBezig(true);
    try {
      await setVerliesType({ userId, verliesType: geselecteerdType as any });
      if (naam) await setVerliesNaam({ userId, verliesNaam: naam });
    } finally { setBezig(false); }
  }

  async function handleOpslaan() {
    if (!userId || !tekst.trim() || bezig) return;
    setBezig(true);
    try {
      await saveDagPrompt({ userId, dag: activeDag, tekst });
      setOpgeslagen(true);
      setTimeout(() => setOpgeslagen(false), 3000);
    } finally { setBezig(false); }
  }

  async function handleFotoKiezen(e: React.ChangeEvent<HTMLInputElement>) {
    const bestand = e.target.files?.[0];
    if (!bestand || !userId) return;
    setFotoUploaden(true);
    try {
      setFotoPreview(URL.createObjectURL(bestand));
      const uploadUrl = await generateUploadUrl();
      const res = await fetch(uploadUrl, {
        method: "POST",
        headers: { "Content-Type": bestand.type },
        body: bestand,
      });
      const { storageId } = await res.json();
      await saveDagFoto({ userId, dag: activeDag, storageId });
    } catch { setFotoPreview(null); }
    finally { setFotoUploaden(false); }
  }

  async function handleBekijkOpslaan() {
    if (!userId || !bekijkTekstEdit.trim() || bekijkDag === null) return;
    try {
      await saveDagPrompt({ userId, dag: bekijkDag, tekst: bekijkTekstEdit });
      setBekijkOpgeslagen(true);
      setBekijkBewerkModus(false);
      setTimeout(() => setBekijkOpgeslagen(false), 3000);
    } catch {}
  }

  async function handleBekijkFotoKiezen(e: React.ChangeEvent<HTMLInputElement>) {
    const bestand = e.target.files?.[0];
    if (!bestand || !userId || bekijkDag === null) return;
    setBekijkFotoUploaden(true);
    try {
      const uploadUrl = await generateUploadUrl();
      const res = await fetch(uploadUrl, { method: "POST", headers: { "Content-Type": bestand.type }, body: bestand });
      const { storageId } = await res.json();
      await saveDagFoto({ userId, dag: bekijkDag, storageId });
    } catch {}
    finally { setBekijkFotoUploaden(false); }
  }

  function startBewerkModus(tekst: string) {
    setBekijkTekstEdit(tekst);
    setBekijkBewerkModus(true);
  }

  function navigeerNaarDag(dag: number) {
    setBekijkDag(dag);
    setBekijkBewerkModus(false);
    setBekijkOpgeslagen(false);
  }

  // ── Laden
  if (scherm === "laden" || status === "loading") {
    return <div style={{ minHeight: "100vh", background: "#fdf9f4" }} />;
  }

  // ── Geen toegang
  if (scherm === "geen_toegang") {
    return (
      <div className="min-h-screen flex items-center justify-center px-6" style={{ background: "#fdf9f4" }}>
        <div className="text-center space-y-4 max-w-sm">
          <p style={{ color: "#6b6460" }}>
            Je hebt geen toegang tot deze pagina. Log in met het account waarmee je Niet Alleen hebt aangeschaft.
          </p>
          <Link href="/inloggen" className="inline-block text-sm font-medium underline" style={{ color: "#6d84a8" }}>
            Inloggen
          </Link>
        </div>
      </div>
    );
  }

  // ── Account gesloten
  if (scherm === "gesloten") {
    return (
      <div className="min-h-screen flex items-center justify-center px-6" style={{ background: "#fdf9f4" }}>
        <div className="text-center space-y-4 max-w-sm">
          <p style={{ color: "#6b6460" }}>
            Je 30 dagen zijn afgelopen en je gratis account is gesloten. Wil je alles bewaren?
          </p>
          <Link href="/prijzen" className="inline-block px-5 py-2.5 rounded-xl text-sm font-medium text-white" style={{ background: "#6d84a8" }}>
            Bekijk abonnementen
          </Link>
        </div>
      </div>
    );
  }

  // ── Onboarding stap 1
  if (scherm === "onboarding" && stapOnboarding === "verlies") {
    return (
      <div className="min-h-screen" style={{ background: "#fdf9f4" }}>
        <div className="px-6 pt-6">
          <Link href="/niet-alleen/ontdek">
            <Image src="/images/benji-logo-2.png" alt="Talk To Benji" width={34} height={34} className="hover:opacity-70 transition-opacity" />
          </Link>
        </div>
        <div className="max-w-md mx-auto px-6 py-14 space-y-8">
          <div className="space-y-3">
            <h1 className="text-2xl font-semibold" style={{ color: "#3d3530" }}>Welkom bij Niet Alleen</h1>
            <p className="text-base leading-relaxed" style={{ color: "#6b6460" }}>
              De komende 30 dagen lopen we samen met je mee — één dag tegelijk. Vertel ons eerst waarvoor je hier bent.
            </p>
          </div>
          <div className="space-y-2.5">
            <p className="text-sm font-medium" style={{ color: "#3d3530" }}>Ik verwerk verlies van:</p>
            {VERLIES_TYPES.map(({ key, label }) => (
              <button key={key} onClick={() => setGeselecteerdType(key)}
                className="w-full text-left px-4 py-3 rounded-xl border-2 transition-all text-sm"
                style={{ borderColor: geselecteerdType === key ? "#6d84a8" : "#e8e0d8", background: geselecteerdType === key ? "#eef1f6" : "white", color: "#3d3530" }}>
                {label}
              </button>
            ))}
          </div>
          <button onClick={handleVerliesTypeVerder} disabled={!geselecteerdType || bezig}
            className="w-full py-3 rounded-xl font-medium text-white transition-all text-sm"
            style={{ background: geselecteerdType && !bezig ? "#6d84a8" : "#c4cdd8", cursor: geselecteerdType && !bezig ? "pointer" : "default" }}>
            {bezig ? "Even geduld..." : "Verder"}
          </button>
        </div>
      </div>
    );
  }

  // ── Onboarding stap 2: naam
  if (scherm === "onboarding" && stapOnboarding === "naam") {
    const typeLabel = geselecteerdType === "huisdier" ? "je huisdier" : "deze persoon";
    return (
      <div className="min-h-screen" style={{ background: "#fdf9f4" }}>
        <div className="px-6 pt-6">
          <button onClick={() => setStapOnboarding("verlies")} className="hover:opacity-60 transition-opacity">
            <Image src="/images/benji-logo-2.png" alt="Talk To Benji" width={34} height={34} />
          </button>
        </div>
        <div className="max-w-md mx-auto px-6 py-14 space-y-8">
          <div className="space-y-3">
            <h1 className="text-2xl font-semibold" style={{ color: "#3d3530" }}>Hoe heette {typeLabel}?</h1>
            <p className="text-base leading-relaxed" style={{ color: "#6b6460" }}>
              Als je een naam invult, gebruiken we die in de dagelijkse berichten. Je kunt dit ook overslaan.
            </p>
          </div>
          <input type="text" value={verliesNaamInput} onChange={(e) => setVerliesNaamInput(e.target.value)}
            placeholder={NAAM_PLACEHOLDER[geselecteerdType ?? ""] ?? "Naam…"}
            className="w-full px-4 py-3 rounded-xl border-2 text-base focus:outline-none transition-all"
            style={{ borderColor: verliesNaamInput ? "#6d84a8" : "#e8e0d8", color: "#3d3530", background: "white" }}
            autoFocus />
          <div className="space-y-2">
            <button onClick={() => { void handleBeginnen(); }} disabled={bezig}
              className="w-full py-3 rounded-xl font-medium text-white transition-all text-sm"
              style={{ background: !bezig ? "#6d84a8" : "#c4cdd8", cursor: !bezig ? "pointer" : "default" }}>
              {bezig ? "Even geduld..." : "Begin mijn 30 dagen"}
            </button>
            <button onClick={() => { void handleBeginnen(""); }} className="w-full py-2 text-sm text-center" style={{ color: "#b0a8a0" }}>
              Overslaan
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ── Afgerond
  if (scherm === "afgerond") {
    return (
      <div className="min-h-screen" style={{ background: "#fdf9f4" }}>
        <div className="px-6 pt-6">
          <Link href="/niet-alleen/ontdek">
            <Image src="/images/benji-logo-2.png" alt="Talk To Benji" width={34} height={34} className="hover:opacity-70 transition-opacity" />
          </Link>
        </div>
        <div className="max-w-md mx-auto px-6 py-14 text-center space-y-6">
          <div className="space-y-3">
            <h1 className="text-2xl font-semibold" style={{ color: "#3d3530" }}>Je 30 dagen zijn klaar</h1>
            <p className="text-base leading-relaxed" style={{ color: "#6b6460" }}>
              Je hebt iets bijzonders gedaan — 30 dagen lang bij jezelf zijn. Wil je alles bewaren en verder gaan?
            </p>
          </div>
          <Link href="/niet-alleen/ontdek" className="inline-block px-6 py-3 rounded-xl font-medium text-white text-sm" style={{ background: "#6d84a8" }}>
            Ontdek wat er meer is
          </Link>
        </div>
      </div>
    );
  }

  // ── Dag weergave ──────────────────────────────────────────
  const dagInhoud = getDagInhoud(activeDag, profiel?.verliesType ?? "anders");
  const isVolledigeGebruiker =
    (profiel as any)?.subscriptionType === "uitgebreid" ||
    (profiel as any)?.subscriptionType === "alles_in_1";
  const toonSideMenu = MENU_DAGEN.includes(activeDag) && !isVolledigeGebruiker;
  const toonUpsellOnder = UPSELL_DAGEN.includes(activeDag) && !isVolledigeGebruiker;
  const huidigeFotoUrl = fotoPreview ?? fotoUrl ?? null;

  // Terugkijken: ingevulde dagen sorteren
  const ingevuldeDagen = [...(profiel?.dagPrompts ?? [])].sort((a, b) => a.dag - b.dag);

  // ── Terugkijken: bekijk een vorige dag ──────────────────
  if (bekijkDag !== null) {
    const oudePrompt = profiel?.dagPrompts.find((p) => p.dag === bekijkDag);
    const oudeInhoud = getDagInhoud(bekijkDag, profiel?.verliesType ?? "anders");

    return (
      <div className="min-h-screen" style={{ background: "#fdf9f4" }}>
        <div className="flex items-center justify-between px-6 pt-6 pb-2">
          <button onClick={() => setBekijkDag(null)} className="flex items-center gap-1.5 text-sm" style={{ color: "#8a8078" }}>
            <ChevronLeft size={16} /> Terug naar vandaag
          </button>
          <span className="text-sm" style={{ color: "#b0a8a0" }}>Dag {bekijkDag} van 30</span>
        </div>
        <div className="max-w-lg mx-auto px-6 py-6 space-y-5">
          <div className="space-y-2">
            <p className="text-xs uppercase tracking-widest font-medium" style={{ color: "#b0a8a0" }}>
              Dag {bekijkDag} — {oudeInhoud?.thema ?? ""}
            </p>
            <p className="text-lg leading-relaxed font-medium" style={{ color: "#3d3530" }}>
              {oudeInhoud?.inHetAccount ?? ""}
            </p>
          </div>

          {bekijkBewerkModus ? (
            <>
              <div className="relative">
                <textarea
                  value={bekijkTekstEdit}
                  onChange={(e) => setBekijkTekstEdit(e.target.value)}
                  rows={9}
                  autoFocus
                  className="w-full rounded-2xl p-4 text-base leading-relaxed resize-none focus:outline-none border"
                  style={{ background: "white", borderColor: "#6d84a8", color: "#3d3530" }}
                />
              </div>
              <div>
                <input ref={bekijkFotoInputRef} type="file" accept="image/*" className="hidden" onChange={handleBekijkFotoKiezen} />
                {bekijkFotoUrl ? (
                  <div className="relative rounded-xl overflow-hidden border" style={{ borderColor: "#e8e0d8" }}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={bekijkFotoUrl} alt={`Foto dag ${bekijkDag}`} className="w-full object-cover max-h-64" />
                    <button onClick={() => bekijkFotoInputRef.current?.click()}
                      className="absolute top-2 right-2 rounded-full p-1.5 text-white"
                      style={{ background: "rgba(0,0,0,0.45)" }}>
                      <X size={14} />
                    </button>
                  </div>
                ) : (
                  <button onClick={() => bekijkFotoInputRef.current?.click()} disabled={bekijkFotoUploaden}
                    className="flex items-center gap-2 text-sm px-4 py-2 rounded-xl border transition-colors"
                    style={{ borderColor: "#e8e0d8", color: "#8a8078", background: "white" }}>
                    <ImagePlus size={16} />
                    {bekijkFotoUploaden ? "Bezig…" : "Voeg een foto toe"}
                  </button>
                )}
              </div>
              <div className="flex items-center gap-3">
                <button onClick={handleBekijkOpslaan} disabled={!bekijkTekstEdit.trim()}
                  className="px-5 py-2.5 rounded-xl text-sm font-medium text-white"
                  style={{ background: "#6d84a8" }}>
                  Opslaan
                </button>
                <button onClick={() => setBekijkBewerkModus(false)} className="text-sm" style={{ color: "#b0a8a0" }}>
                  Annuleren
                </button>
              </div>
            </>
          ) : (
            <>
              <div className="w-full rounded-2xl p-4 text-base leading-relaxed border min-h-[120px] whitespace-pre-wrap break-words overflow-hidden"
                style={{ background: "white", borderColor: "#e8e0d8", color: "#3d3530" }}>
                {oudePrompt?.tekst ?? <span style={{ color: "#c4bdb6" }}>Niets ingevuld op deze dag.</span>}
              </div>
              {bekijkFotoUrl && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={bekijkFotoUrl} alt={`Foto dag ${bekijkDag}`} className="w-full rounded-xl object-cover max-h-64 border" style={{ borderColor: "#e8e0d8" }} />
              )}
              <div className="flex justify-end">
                {bekijkOpgeslagen ? (
                  <span className="text-sm" style={{ color: "#6d84a8" }}>Opgeslagen ✓</span>
                ) : (
                  <button onClick={() => startBewerkModus(oudePrompt?.tekst ?? "")} className="text-sm" style={{ color: "#b0a8a0" }}>
                    Ik wil nog iets wijzigen...
                  </button>
                )}
              </div>
            </>
          )}

          {/* Dag-navigatie */}
          <div className="flex items-center justify-end gap-3 pt-1">
            <button onClick={() => navigeerNaarDag(Math.max(1, bekijkDag - 1))} disabled={bekijkDag <= 1}
              className="w-8 h-8 flex items-center justify-center rounded-full border text-sm transition-all disabled:opacity-30"
              style={{ borderColor: "#d4ccc4", color: "#6b6460" }}>
              ‹
            </button>
            <span className="text-sm font-medium" style={{ color: "#6b6460" }}>{bekijkDag}</span>
            <button onClick={() => navigeerNaarDag(Math.min(activeDag, bekijkDag + 1))} disabled={bekijkDag >= activeDag}
              className="w-8 h-8 flex items-center justify-center rounded-full border text-sm transition-all disabled:opacity-30"
              style={{ borderColor: "#d4ccc4", color: "#6b6460" }}>
              ›
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ── Huidige dag ─────────────────────────────────────────
  return (
    <div className="min-h-screen relative" style={{ background: "#fdf9f4" }}>

      {/* Subtiel zijmenu op specifieke dagen */}
      {toonSideMenu && (
        <Link href="/niet-alleen/ontdek"
          className="fixed right-0 top-1/2 -translate-y-1/2 z-20 flex flex-col items-center justify-center gap-1.5 py-4 px-2 rounded-l-xl text-xs font-medium"
          style={{ background: "#e0d8cf", color: "#6b6460", writingMode: "vertical-rl", letterSpacing: "0.05em" }}>
          Er is meer ›
        </Link>
      )}

      {/* Header */}
      <div className="flex items-center justify-between px-6 pt-6 pb-2">
        <Link href="/niet-alleen/ontdek">
          <Image src="/images/benji-logo-2.png" alt="Talk To Benji" width={38} height={38}
            className="hover:opacity-70 transition-opacity" />
        </Link>

        {/* Profielfoto cirkel */}
        <Link href="/niet-alleen/welkom" title="Jouw profiel">
          <div className="w-10 h-10 rounded-full border-2 overflow-hidden flex items-center justify-center"
            style={{ borderColor: profielFotoUrl ? "#6d84a8" : "#d4ccc4", background: "#f0ebe4" }}>
            {profielFotoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={profielFotoUrl} alt="Jouw foto" className="w-full h-full object-cover" />
            ) : (
              <span className="text-xs" style={{ color: "#b0a8a0" }}>👤</span>
            )}
          </div>
        </Link>

        <span className="text-sm" style={{ color: "#b0a8a0" }}>Dag {activeDag} van 30</span>
      </div>

      <div className="max-w-lg mx-auto px-6 py-8 space-y-6">

        {/* Dagprompt */}
        <div className="space-y-2 pt-2">
          <p className="text-xs uppercase tracking-widest font-medium" style={{ color: "#b0a8a0" }}>
            Dag {activeDag} — {dagInhoud?.thema ?? ""}
          </p>
          <p className="text-lg leading-relaxed font-medium" style={{ color: "#3d3530" }}>
            {dagInhoud?.inHetAccount ?? ""}
          </p>
          {dagInhoud?.alsjewilt && (
            <p className="text-sm leading-relaxed" style={{ color: "#8a8078" }}>
              Als je wilt: {dagInhoud.alsjewilt}
            </p>
          )}
        </div>

        {/* Schrijfveld + microfoon */}
        <div className="relative">
          <textarea
            ref={tekstRef}
            value={tekst}
            onChange={(e) => setTekst(e.target.value)}
            placeholder="Schrijf hier wat er in je opkomt — er is geen goed of fout."
            rows={11}
            className="w-full rounded-2xl p-4 pb-12 text-base leading-relaxed resize-none focus:outline-none border"
            style={{ background: "white", borderColor: opname ? "#6d84a8" : "#e8e0d8", color: "#3d3530" }}
          />
          <button
            onClick={toggleOpname}
            title={opname ? "Stop opname" : "Inspreken"}
            className="absolute bottom-3 right-3 p-2.5 rounded-full transition-all"
            style={{ background: opname ? "#6d84a8" : "#f0ebe4", color: opname ? "white" : "#8a8078" }}>
            {opname ? <MicOff size={18} /> : <Mic size={18} />}
          </button>
        </div>

        {/* Foto */}
        <div>
          <input ref={fotoInputRef} type="file" accept="image/*" className="hidden" onChange={handleFotoKiezen} />
          {huidigeFotoUrl ? (
            <div className="relative rounded-xl overflow-hidden border" style={{ borderColor: "#e8e0d8" }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={huidigeFotoUrl} alt="Jouw foto" className="w-full object-cover max-h-64" />
              <button onClick={() => fotoInputRef.current?.click()}
                className="absolute top-2 right-2 rounded-full p-1.5 text-white"
                style={{ background: "rgba(0,0,0,0.45)" }} title="Foto vervangen">
                <X size={14} />
              </button>
            </div>
          ) : (
            <button onClick={() => fotoInputRef.current?.click()} disabled={fotoUploaden}
              className="flex items-center gap-2 text-sm px-4 py-2 rounded-xl border transition-colors"
              style={{ borderColor: "#e8e0d8", color: "#8a8078", background: "white" }}>
              <ImagePlus size={16} />
              {fotoUploaden ? "Bezig met uploaden…" : "Voeg een foto toe"}
            </button>
          )}
        </div>

        {/* Doedingetje */}
        {dagInhoud?.doedingetje && (
          <div className="rounded-xl px-4 py-3 text-sm leading-relaxed" style={{ background: "#f5f0ea", color: "#6b6460" }}>
            <span className="font-medium" style={{ color: "#3d3530" }}>Klein doedingetje: </span>
            {dagInhoud.doedingetje}
          </div>
        )}

        {/* Opslaan */}
        <div className="space-y-2">
          <button onClick={handleOpslaan} disabled={!tekst.trim() || bezig}
            className="w-full py-3 rounded-xl font-medium text-white text-sm transition-all"
            style={{ background: tekst.trim() && !bezig ? "#6d84a8" : "#c4cdd8", cursor: tekst.trim() && !bezig ? "pointer" : "default" }}>
            {opgeslagen ? "Opgeslagen ✓" : bezig ? "Even geduld..." : "Opslaan"}
          </button>
          <div className="flex justify-end">
            <button
              onClick={() => {
                setTekst((prev) => prev + "\n\n");
                setTimeout(() => {
                  tekstRef.current?.focus();
                  tekstRef.current?.setSelectionRange(9999, 9999);
                }, 0);
              }}
              className="text-sm"
              style={{ color: "#b0a8a0" }}
            >
              Ik wil nog iets toevoegen...
            </button>
          </div>
        </div>

        {/* Vorige dagen terugkijken */}
        {ingevuldeDagen.length > 0 && (
          <div className="space-y-2 pt-2">
            <p className="text-xs uppercase tracking-widest font-medium" style={{ color: "#b0a8a0" }}>
              Vorige dagen
            </p>
            <div className="flex flex-wrap gap-2">
              {ingevuldeDagen.map((p) => (
                <button key={p.dag} onClick={() => setBekijkDag(p.dag)}
                  className="px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors"
                  style={{ background: "white", borderColor: "#e8e0d8", color: "#6b6460" }}>
                  Dag {p.dag}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Upsell blok onderaan — alleen op dag 24, 28, 30 */}
        {toonUpsellOnder && (
          <div className="rounded-xl border px-4 py-4 space-y-2" style={{ background: "#f0f2f5", borderColor: "#dde3ec" }}>
            <p className="text-sm leading-relaxed" style={{ color: "#6b6460" }}>
              Wist je dat er nog meer is? Bij een volledig account heb je gesprekken met Benji, Memories en meer.
            </p>
            <Link href="/niet-alleen/ontdek" className="inline-block text-sm font-medium" style={{ color: "#6d84a8" }}>
              Ontdek wat er meer is →
            </Link>
          </div>
        )}

      </div>
    </div>
  );
}

export default function NietAlleenPage() {
  return (
    <Suspense fallback={<div style={{ minHeight: "100vh", background: "#fdf9f4" }} />}>
      <NietAlleenPageInner />
    </Suspense>
  );
}
