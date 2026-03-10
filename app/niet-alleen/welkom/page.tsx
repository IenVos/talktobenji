"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import Image from "next/image";
import Link from "next/link";
import { Camera, CheckCircle2 } from "lucide-react";

const VERLIES_TYPES: { key: "persoon" | "huisdier" | "relatie"; label: string }[] = [
  { key: "persoon", label: "Een dierbare persoon" },
  { key: "huisdier", label: "Een huisdier" },
  { key: "relatie", label: "Een relatie of scheiding" },
];

const NAAM_PLACEHOLDER: Record<string, string> = {
  persoon: "Bijv. Oma, Floris, Mam...",
  huisdier: "Bijv. Luna, Appie, Boris...",
};

export default function NietAlleenWelkomPage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [fotoPreview, setFotoPreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [geselecteerd, setGeselecteerd] = useState<"persoon" | "huisdier" | "relatie" | "gezondheid" | "anders" | null>(null);
  const [naamInput, setNaamInput] = useState("");
  const [bezig, setBezig] = useState(false);
  const fotoInputRef = useRef<HTMLInputElement>(null);

  const userId = (session?.user as any)?.id ?? session?.user?.email ?? "";

  const profiel = useQuery(
    api.nietAlleen.getProfile,
    userId ? { userId } : "skip"
  );

  const generateUploadUrl = useMutation(api.nietAlleen.generateUploadUrl);
  const saveProfielFoto = useMutation(api.nietAlleen.saveProfielFoto);
  const setVerliesType = useMutation(api.nietAlleen.setVerliesType);
  const setVerliesNaam = useMutation(api.nietAlleen.setVerliesNaam);

  const profielFotoStorageId = profiel?.profielFoto;
  const profielFotoUrl = useQuery(
    api.nietAlleen.getDagFotoUrl,
    profielFotoStorageId ? { storageId: profielFotoStorageId } : { storageId: undefined }
  );

  const huidigeFotoUrl = fotoPreview ?? profielFotoUrl ?? null;

  // Pre-fill from existing profile
  const huidigVerliesType = geselecteerd ?? (profiel?.verliesType as "persoon" | "huisdier" | "relatie" | "gezondheid" | "anders" | undefined) ?? null;
  const toonNaamVeld = huidigVerliesType === "persoon" || huidigVerliesType === "huisdier";

  async function handleFotoKiezen(e: React.ChangeEvent<HTMLInputElement>) {
    const bestand = e.target.files?.[0];
    if (!bestand || !userId) return;
    setUploading(true);
    try {
      setFotoPreview(URL.createObjectURL(bestand));
      const uploadUrl = await generateUploadUrl();
      const res = await fetch(uploadUrl, {
        method: "POST",
        headers: { "Content-Type": bestand.type },
        body: bestand,
      });
      const { storageId } = await res.json();
      await saveProfielFoto({ userId, storageId });
    } catch {
      setFotoPreview(null);
    } finally {
      setUploading(false);
    }
  }

  async function handleBeginnen() {
    if (!userId || bezig) return;
    const type = huidigVerliesType;
    if (!type) return;
    setBezig(true);
    try {
      await setVerliesType({ userId, verliesType: type });
      if ((type === "persoon" || type === "huisdier") && naamInput.trim()) {
        await setVerliesNaam({ userId, verliesNaam: naamInput.trim() });
      }
      router.push("/niet-alleen");
    } finally {
      setBezig(false);
    }
  }

  if (status === "loading" || profiel === undefined) {
    return <div style={{ minHeight: "100vh", background: "#fdf9f4" }} />;
  }

  if (status === "unauthenticated" || !profiel) {
    return (
      <div className="min-h-screen flex items-center justify-center px-6" style={{ background: "#fdf9f4" }}>
        <div className="text-center space-y-4 max-w-sm">
          <p style={{ color: "#6b6460" }}>Log in met het account waarmee je Niet Alleen hebt aangeschaft.</p>
          <Link href="/inloggen" className="inline-block text-sm font-medium underline" style={{ color: "#6d84a8" }}>
            Inloggen
          </Link>
        </div>
      </div>
    );
  }

  const voornaam = profiel.naam.split(" ")[0];

  return (
    <div className="min-h-screen" style={{ background: "#fdf9f4" }}>
      <div className="flex justify-center px-6 pt-8">
        <Image src="/images/benji-logo-2.png" alt="Talk To Benji" width={38} height={38} className="hover:opacity-70 transition-opacity" />
      </div>

      <div className="max-w-sm mx-auto px-6 py-8 space-y-8">

        {/* Welkom */}
        <div className="space-y-3">
          <h1 className="text-2xl font-semibold" style={{ color: "#3d3530" }}>
            Welkom, {voornaam}
          </h1>
          <p className="text-base leading-relaxed" style={{ color: "#6b6460" }}>
            Fijn dat je er bent. Dit is jouw plek voor de komende 30 dagen. We lopen samen met je mee, één dag tegelijk. Er is geen goed of fout hier.
          </p>
        </div>

        {/* Profielfoto */}
        <div className="flex flex-col items-center gap-2">
          <input ref={fotoInputRef} type="file" accept="image/*" className="hidden" onChange={handleFotoKiezen} />
          <button
            onClick={() => fotoInputRef.current?.click()}
            className="relative w-24 h-24 rounded-full border-2 flex items-center justify-center overflow-hidden transition-all hover:opacity-80"
            style={{
              borderColor: huidigeFotoUrl ? "#6d84a8" : "#c4bdb6",
              background: huidigeFotoUrl ? "transparent" : "#f0ebe4",
            }}
          >
            {huidigeFotoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={huidigeFotoUrl} alt="Jouw foto" className="w-full h-full object-cover" />
            ) : (
              <Camera size={28} style={{ color: "#b0a8a0" }} />
            )}
            {uploading && (
              <div className="absolute inset-0 bg-white/70 flex items-center justify-center">
                <div className="w-5 h-5 border-2 border-primary-400 border-t-transparent rounded-full animate-spin" />
              </div>
            )}
          </button>
          <p className="text-sm text-center leading-snug" style={{ color: "#8a8078" }}>
            {huidigeFotoUrl
              ? "Foto opgeslagen ✓"
              : "Voeg een foto toe die jij graag iedere dag ziet"}
          </p>
        </div>

        {/* Verliestype keuze */}
        <div className="space-y-3">
          <p className="text-base font-semibold" style={{ color: "#3d3530" }}>Wie of wat mis je?</p>
          <p className="text-sm leading-relaxed" style={{ color: "#6b6460" }}>
            Dit helpt ons de dagelijkse teksten persoonlijker te maken.
          </p>
          <div className="flex flex-col gap-2">
            {VERLIES_TYPES.map((t) => (
              <button
                key={t.key}
                onClick={() => setGeselecteerd(t.key)}
                className="w-full px-4 py-3 rounded-xl text-sm font-medium text-left transition-all border"
                style={{
                  background: huidigVerliesType === t.key ? "#6d84a8" : "white",
                  color: huidigVerliesType === t.key ? "white" : "#4a5568",
                  borderColor: huidigVerliesType === t.key ? "#6d84a8" : "#e2d9cf",
                }}
              >
                {t.label}
              </button>
            ))}
          </div>

          {/* Naam invoer */}
          {toonNaamVeld && (
            <div className="space-y-1 pt-1">
              <label className="block text-sm" style={{ color: "#6b6460" }}>
                {huidigVerliesType === "huisdier" ? "Hoe heette je huisdier?" : "Hoe heette hij of zij?"}
                <span className="ml-1 font-normal" style={{ color: "#b0a8a0" }}>(optioneel)</span>
              </label>
              <input
                type="text"
                value={naamInput || (profiel.verliesNaam ?? "")}
                onChange={(e) => setNaamInput(e.target.value)}
                placeholder={NAAM_PLACEHOLDER[huidigVerliesType!] ?? ""}
                className="w-full px-3 py-2.5 rounded-xl border text-sm focus:outline-none"
                style={{ borderColor: "#e2d9cf", background: "white", color: "#3d3530" }}
              />
            </div>
          )}
        </div>

        {/* Hoe het werkt */}
        <div className="space-y-4">
          <p className="text-base font-semibold" style={{ color: "#3d3530" }}>Zo werkt het</p>
          <div className="space-y-4">
            {[
              {
                stap: "1",
                tekst: "Elke ochtend ontvang je een mailtje met een kleine vraag om even bij stil te staan.",
              },
              {
                stap: "2",
                tekst: "Je klikt op de link en schrijft wat er in je opkomt. Er is geen goed of fout.",
              },
              {
                stap: "3",
                tekst: "Je kunt een foto toevoegen of je antwoord inspreken als je liever niet typt.",
              },
              {
                stap: "4",
                tekst: "Na 30 dagen heb je een persoonlijk dagboek dat je kunt downloaden of printen als herinnering.",
              },
            ].map(({ stap, tekst }) => (
              <div key={stap} className="flex items-start gap-3">
                <span
                  className="flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-white mt-0.5"
                  style={{ background: "#6d84a8" }}
                >
                  {stap}
                </span>
                <p className="text-sm leading-relaxed" style={{ color: "#6b6460" }}>{tekst}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Checklist */}
        <div className="rounded-xl border px-4 py-4 space-y-3" style={{ background: "white", borderColor: "#e8e0d8" }}>
          <p className="text-sm font-semibold" style={{ color: "#3d3530" }}>Voordat je begint</p>
          <div className="space-y-2.5">
            {[
              "Voeg hierboven een foto toe die jou elke dag een warm gevoel geeft",
              "Kies hierboven wie of wat je mist, zodat de teksten bij jou passen",
              "Zorg dat je e-mailmeldingen aan hebt, zodat je de dagelijkse mail niet mist",
            ].map((item, i) => (
              <div key={i} className="flex items-start gap-2">
                <CheckCircle2 size={15} className="flex-shrink-0 mt-0.5" style={{ color: "#6d84a8" }} />
                <p className="text-sm leading-relaxed" style={{ color: "#6b6460" }}>{item}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Start knop */}
        <button
          onClick={handleBeginnen}
          disabled={!huidigVerliesType || bezig}
          className="block w-full py-3.5 rounded-xl font-medium text-white text-sm text-center transition-all disabled:opacity-50"
          style={{ background: "#6d84a8" }}
        >
          {bezig ? "Even geduld..." : "Begin dag 1"}
        </button>

        <p className="text-xs text-center" style={{ color: "#b0a8a0" }}>
          Vragen? Mail naar{" "}
          <a href="mailto:contactmetien@talktobenji.com" style={{ color: "#6d84a8" }}>
            contactmetien@talktobenji.com
          </a>
        </p>
      </div>
    </div>
  );
}
