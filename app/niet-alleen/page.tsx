"use client";

import { useEffect, useRef, useState } from "react";
import { useSession } from "next-auth/react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { getDagInhoud } from "@/convex/nietAlleenContent";
import Image from "next/image";
import Link from "next/link";
import { ImagePlus, X } from "lucide-react";

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

export default function NietAlleenPage() {
  const { data: session, status } = useSession();
  const [scherm, setScherm] = useState<Scherm>("laden");
  const [stapOnboarding, setStapOnboarding] = useState<StapOnboarding>("verlies");
  const [geselecteerdType, setGeselecteerdType] = useState<string | null>(null);
  const [verliesNaamInput, setVerliesNaamInput] = useState("");
  const [tekst, setTekst] = useState("");
  const [opgeslagen, setOpgeslagen] = useState(false);
  const [bezig, setBezig] = useState(false);
  const [fotoPreview, setFotoPreview] = useState<string | null>(null);
  const [fotoUploaden, setFotoUploaden] = useState(false);
  const fotoInputRef = useRef<HTMLInputElement>(null);

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

  const huidigeStorageId = profiel?.dagFotos?.find((f) => f.dag === dagNummer)?.storageId;
  const fotoUrl = useQuery(
    api.nietAlleen.getDagFotoUrl,
    huidigeStorageId ? { storageId: huidigeStorageId } : { storageId: undefined }
  );

  // Scherm bepalen
  useEffect(() => {
    if (status === "loading" || profiel === undefined) return;

    if (status === "unauthenticated") {
      setScherm("geen_toegang");
      return;
    }

    if (!profiel || profiel.accountGesloten) {
      setScherm(profiel?.accountGesloten ? "gesloten" : "geen_toegang");
      return;
    }

    if (!profiel.verliesType) {
      setScherm("onboarding");
      return;
    }

    const dag = Math.floor((Date.now() - profiel.startDatum) / 86400000) + 1;
    if (dag > 30) {
      setScherm("afgerond");
      return;
    }

    // Laad eerder opgeslagen tekst voor vandaag
    const vandaag = profiel.dagPrompts.find((p) => p.dag === dagNummer);
    if (vandaag) setTekst(vandaag.tekst);

    setScherm("dag");
  }, [status, profiel, dagNummer]);

  async function handleVerliesTypeVerder() {
    if (!geselecteerdType || bezig) return;
    if (geselecteerdType === "persoon" || geselecteerdType === "huisdier") {
      setStapOnboarding("naam");
    } else {
      setBezig(true);
      try {
        await setVerliesType({ userId, verliesType: geselecteerdType as any });
      } finally {
        setBezig(false);
      }
    }
  }

  async function handleBeginnen(naamOverride?: string) {
    if (!geselecteerdType || !userId || bezig) return;
    const naam = naamOverride !== undefined ? naamOverride : verliesNaamInput.trim();
    setBezig(true);
    try {
      await setVerliesType({ userId, verliesType: geselecteerdType as any });
      if (naam) {
        await setVerliesNaam({ userId, verliesNaam: naam });
      }
    } finally {
      setBezig(false);
    }
  }

  async function handleOpslaan() {
    if (!userId || !tekst.trim() || bezig) return;
    setBezig(true);
    try {
      await saveDagPrompt({ userId, dag: dagNummer, tekst });
      setOpgeslagen(true);
      setTimeout(() => setOpgeslagen(false), 3000);
    } finally {
      setBezig(false);
    }
  }

  async function handleFotoKiezen(e: React.ChangeEvent<HTMLInputElement>) {
    const bestand = e.target.files?.[0];
    if (!bestand || !userId) return;

    setFotoUploaden(true);
    try {
      const preview = URL.createObjectURL(bestand);
      setFotoPreview(preview);

      const uploadUrl = await generateUploadUrl();
      const res = await fetch(uploadUrl, {
        method: "POST",
        headers: { "Content-Type": bestand.type },
        body: bestand,
      });
      const { storageId } = await res.json();
      await saveDagFoto({ userId, dag: dagNummer, storageId });
    } catch {
      setFotoPreview(null);
    } finally {
      setFotoUploaden(false);
    }
  }

  // ── Laden ──────────────────────────────────────────────────
  if (scherm === "laden" || status === "loading") {
    return <div style={{ minHeight: "100vh", background: "#fdf9f4" }} />;
  }

  // ── Geen toegang ───────────────────────────────────────────
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

  // ── Account gesloten ───────────────────────────────────────
  if (scherm === "gesloten") {
    return (
      <div className="min-h-screen flex items-center justify-center px-6" style={{ background: "#fdf9f4" }}>
        <div className="text-center space-y-4 max-w-sm">
          <p style={{ color: "#6b6460" }}>
            Je 30 dagen zijn afgelopen en je gratis account is gesloten. Wil je alles bewaren?
          </p>
          <Link
            href="/prijzen"
            className="inline-block px-5 py-2.5 rounded-xl text-sm font-medium text-white"
            style={{ background: "#6d84a8" }}
          >
            Bekijk abonnementen
          </Link>
        </div>
      </div>
    );
  }

  // ── Onboarding — stap 1: verliestype kiezen ────────────────
  if (scherm === "onboarding" && stapOnboarding === "verlies") {
    return (
      <div className="min-h-screen" style={{ background: "#fdf9f4" }}>
        <div className="px-6 pt-6">
          <Link href="/niet-alleen/ontdek">
            <Image
              src="/images/benji-logo-2.png"
              alt="Talk To Benji"
              width={34}
              height={34}
              className="opacity-50 hover:opacity-70 transition-opacity"
            />
          </Link>
        </div>

        <div className="max-w-md mx-auto px-6 py-14 space-y-8">
          <div className="space-y-3">
            <h1 className="text-2xl font-semibold" style={{ color: "#3d3530" }}>
              Welkom bij Niet Alleen
            </h1>
            <p className="text-base leading-relaxed" style={{ color: "#6b6460" }}>
              De komende 30 dagen lopen we samen met je mee — één dag tegelijk.
              Vertel ons eerst waarvoor je hier bent.
            </p>
          </div>

          <div className="space-y-2.5">
            <p className="text-sm font-medium" style={{ color: "#3d3530" }}>
              Ik verwerk verlies van:
            </p>
            {VERLIES_TYPES.map(({ key, label }) => (
              <button
                key={key}
                onClick={() => setGeselecteerdType(key)}
                className="w-full text-left px-4 py-3 rounded-xl border-2 transition-all text-sm"
                style={{
                  borderColor: geselecteerdType === key ? "#6d84a8" : "#e8e0d8",
                  background: geselecteerdType === key ? "#eef1f6" : "white",
                  color: "#3d3530",
                }}
              >
                {label}
              </button>
            ))}
          </div>

          <button
            onClick={handleVerliesTypeVerder}
            disabled={!geselecteerdType || bezig}
            className="w-full py-3 rounded-xl font-medium text-white transition-all text-sm"
            style={{
              background: geselecteerdType && !bezig ? "#6d84a8" : "#c4cdd8",
              cursor: geselecteerdType && !bezig ? "pointer" : "default",
            }}
          >
            {bezig ? "Even geduld..." : "Verder"}
          </button>
        </div>
      </div>
    );
  }

  // ── Onboarding — stap 2: naam invullen ─────────────────────
  if (scherm === "onboarding" && stapOnboarding === "naam") {
    const typeLabel = geselecteerdType === "huisdier" ? "je huisdier" : "deze persoon";
    return (
      <div className="min-h-screen" style={{ background: "#fdf9f4" }}>
        <div className="px-6 pt-6">
          <button onClick={() => setStapOnboarding("verlies")} className="opacity-40 hover:opacity-60 transition-opacity">
            <Image src="/images/benji-logo-2.png" alt="Talk To Benji" width={34} height={34} />
          </button>
        </div>

        <div className="max-w-md mx-auto px-6 py-14 space-y-8">
          <div className="space-y-3">
            <h1 className="text-2xl font-semibold" style={{ color: "#3d3530" }}>
              Hoe heette {typeLabel}?
            </h1>
            <p className="text-base leading-relaxed" style={{ color: "#6b6460" }}>
              Als je een naam invult, gebruiken we die in de dagelijkse berichten.
              Je kunt dit ook overslaan.
            </p>
          </div>

          <input
            type="text"
            value={verliesNaamInput}
            onChange={(e) => setVerliesNaamInput(e.target.value)}
            placeholder={NAAM_PLACEHOLDER[geselecteerdType ?? ""] ?? "Naam…"}
            className="w-full px-4 py-3 rounded-xl border-2 text-base focus:outline-none transition-all"
            style={{
              borderColor: verliesNaamInput ? "#6d84a8" : "#e8e0d8",
              color: "#3d3530",
              background: "white",
            }}
            autoFocus
          />

          <div className="space-y-2">
            <button
              onClick={handleBeginnen}
              disabled={bezig}
              className="w-full py-3 rounded-xl font-medium text-white transition-all text-sm"
              style={{
                background: !bezig ? "#6d84a8" : "#c4cdd8",
                cursor: !bezig ? "pointer" : "default",
              }}
            >
              {bezig ? "Even geduld..." : "Begin mijn 30 dagen"}
            </button>
            <button
              onClick={() => handleBeginnen("")}
              className="w-full py-2 text-sm text-center"
              style={{ color: "#b0a8a0" }}
            >
              Overslaan
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ── 30 dagen afgerond ──────────────────────────────────────
  if (scherm === "afgerond") {
    return (
      <div className="min-h-screen" style={{ background: "#fdf9f4" }}>
        <div className="px-6 pt-6">
          <Link href="/niet-alleen/ontdek">
            <Image
              src="/images/benji-logo-2.png"
              alt="Talk To Benji"
              width={34}
              height={34}
              className="opacity-50 hover:opacity-70 transition-opacity"
            />
          </Link>
        </div>

        <div className="max-w-md mx-auto px-6 py-14 text-center space-y-6">
          <div className="space-y-3">
            <h1 className="text-2xl font-semibold" style={{ color: "#3d3530" }}>
              Je 30 dagen zijn klaar
            </h1>
            <p className="text-base leading-relaxed" style={{ color: "#6b6460" }}>
              Je hebt iets bijzonders gedaan — 30 dagen lang bij jezelf zijn.
              Wil je alles bewaren en verder gaan?
            </p>
          </div>
          <Link
            href="/niet-alleen/ontdek"
            className="inline-block px-6 py-3 rounded-xl font-medium text-white text-sm"
            style={{ background: "#6d84a8" }}
          >
            Ontdek wat er meer is
          </Link>
        </div>
      </div>
    );
  }

  // ── Dag X — dagelijkse prompt ──────────────────────────────
  const dagInhoud = getDagInhoud(dagNummer, profiel?.verliesType ?? "anders");
  const isVolledigeGebruiker =
    (profiel as any)?.subscriptionType === "uitgebreid" ||
    (profiel as any)?.subscriptionType === "alles_in_1";

  const huidigeFotoUrl = fotoPreview ?? fotoUrl ?? null;

  return (
    <div className="min-h-screen" style={{ background: "#fdf9f4" }}>
      {/* Header */}
      <div className="flex items-center justify-between px-6 pt-6 pb-2">
        <Link href="/niet-alleen/ontdek">
          <Image
            src="/images/benji-logo-2.png"
            alt="Talk To Benji"
            width={34}
            height={34}
            className="opacity-50 hover:opacity-70 transition-opacity"
          />
        </Link>
        <span className="text-sm" style={{ color: "#b0a8a0" }}>
          Dag {dagNummer} van 30
        </span>
      </div>

      <div className="max-w-lg mx-auto px-6 py-8 space-y-6">
        {/* TTB uitnodigingsblok — alleen voor niet_alleen gebruikers */}
        {!isVolledigeGebruiker && (
          <div
            className="rounded-xl border px-4 py-3 flex items-center gap-4"
            style={{ background: "#f0f2f5", borderColor: "#dde3ec" }}
          >
            <p className="text-sm leading-relaxed flex-1" style={{ color: "#6b6460" }}>
              Wist je dat er nog meer is? Bij een volledig account heb je gesprekken met Benji, Memories en meer.
            </p>
            <Link
              href="/niet-alleen/ontdek"
              className="text-sm font-medium whitespace-nowrap flex-shrink-0"
              style={{ color: "#6d84a8" }}
            >
              Ontdek →
            </Link>
          </div>
        )}

        {/* Dagprompt */}
        <div className="space-y-2 pt-2">
          <p className="text-xs uppercase tracking-widest font-medium" style={{ color: "#b0a8a0" }}>
            Dag {dagNummer} — {dagInhoud?.thema ?? ""}
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

        {/* Schrijfveld */}
        <textarea
          value={tekst}
          onChange={(e) => setTekst(e.target.value)}
          placeholder="Schrijf hier wat er in je opkomt — er is geen goed of fout."
          rows={11}
          className="w-full rounded-2xl p-4 text-base leading-relaxed resize-none focus:outline-none border"
          style={{
            background: "white",
            borderColor: "#e8e0d8",
            color: "#3d3530",
          }}
        />

        {/* Foto toevoegen */}
        <div>
          <input
            ref={fotoInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleFotoKiezen}
          />
          {huidigeFotoUrl ? (
            <div className="relative rounded-xl overflow-hidden border" style={{ borderColor: "#e8e0d8" }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={huidigeFotoUrl} alt="Jouw foto" className="w-full object-cover max-h-64" />
              <button
                onClick={() => fotoInputRef.current?.click()}
                className="absolute top-2 right-2 rounded-full p-1.5 text-white"
                style={{ background: "rgba(0,0,0,0.45)" }}
                title="Foto vervangen"
              >
                <X size={14} />
              </button>
            </div>
          ) : (
            <button
              onClick={() => fotoInputRef.current?.click()}
              disabled={fotoUploaden}
              className="flex items-center gap-2 text-sm px-4 py-2 rounded-xl border transition-colors"
              style={{
                borderColor: "#e8e0d8",
                color: "#8a8078",
                background: "white",
              }}
            >
              <ImagePlus size={16} />
              {fotoUploaden ? "Bezig met uploaden…" : "Voeg een foto toe"}
            </button>
          )}
        </div>

        {/* Doedingetje */}
        {dagInhoud?.doedingetje && (
          <div
            className="rounded-xl px-4 py-3 text-sm leading-relaxed"
            style={{ background: "#f5f0ea", color: "#6b6460" }}
          >
            <span className="font-medium" style={{ color: "#3d3530" }}>Klein doedingetje: </span>
            {dagInhoud.doedingetje}
          </div>
        )}

        {/* Opslaan */}
        <button
          onClick={handleOpslaan}
          disabled={!tekst.trim() || bezig}
          className="w-full py-3 rounded-xl font-medium text-white text-sm transition-all"
          style={{
            background: tekst.trim() && !bezig ? "#6d84a8" : "#c4cdd8",
            cursor: tekst.trim() && !bezig ? "pointer" : "default",
          }}
        >
          {opgeslagen ? "Opgeslagen ✓" : bezig ? "Even geduld..." : "Opslaan"}
        </button>
      </div>
    </div>
  );
}
