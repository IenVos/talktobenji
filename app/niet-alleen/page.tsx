"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { getNietAlleenPrompt } from "@/lib/nietAlleenPrompts";
import Image from "next/image";
import Link from "next/link";

type Scherm = "laden" | "geen_toegang" | "onboarding" | "dag" | "afgerond" | "gesloten";

const VERLIES_TYPES = [
  { key: "persoon" as const, label: "Een dierbare persoon" },
  { key: "huisdier" as const, label: "Een huisdier" },
  { key: "relatie" as const, label: "Een relatie" },
  { key: "gezondheid" as const, label: "Mijn gezondheid" },
  { key: "anders" as const, label: "Iets anders" },
];

export default function NietAlleenPage() {
  const { data: session, status } = useSession();
  const [scherm, setScherm] = useState<Scherm>("laden");
  const [geselecteerdType, setGeselecteerdType] = useState<string | null>(null);
  const [tekst, setTekst] = useState("");
  const [opgeslagen, setOpgeslagen] = useState(false);
  const [bezig, setBezig] = useState(false);

  const userId = (session?.user as any)?.id ?? session?.user?.email ?? "";

  const profiel = useQuery(
    api.nietAlleen.getProfile,
    userId ? { userId } : "skip"
  );

  const setVerliesType = useMutation(api.nietAlleen.setVerliesType);
  const saveDagPrompt = useMutation(api.nietAlleen.saveDagPrompt);

  const dagNummer = profiel?.startDatum
    ? Math.min(30, Math.floor((Date.now() - profiel.startDatum) / 86400000) + 1)
    : 1;

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

  async function handleVerliesTypeKiezen() {
    if (!geselecteerdType || !userId || bezig) return;
    setBezig(true);
    try {
      await setVerliesType({ userId, verliesType: geselecteerdType as any });
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

  // ── Onboarding — verliestype kiezen ────────────────────────
  if (scherm === "onboarding") {
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
            onClick={handleVerliesTypeKiezen}
            disabled={!geselecteerdType || bezig}
            className="w-full py-3 rounded-xl font-medium text-white transition-all text-sm"
            style={{
              background: geselecteerdType && !bezig ? "#6d84a8" : "#c4cdd8",
              cursor: geselecteerdType && !bezig ? "pointer" : "default",
            }}
          >
            {bezig ? "Even geduld..." : "Begin mijn 30 dagen"}
          </button>
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
  const prompt = getNietAlleenPrompt(profiel?.verliesType ?? "anders", dagNummer);
  const isVolledigeGebruiker =
    profiel === null ||
    (profiel as any).subscriptionType === "uitgebreid" ||
    (profiel as any).subscriptionType === "alles_in_1";

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
            De vraag van vandaag
          </p>
          <p className="text-lg leading-relaxed font-medium" style={{ color: "#3d3530" }}>
            {prompt}
          </p>
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
