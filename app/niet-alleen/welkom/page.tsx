"use client";

import { useRef, useState } from "react";
import { useSession } from "next-auth/react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import Image from "next/image";
import Link from "next/link";
import { Camera, CheckCircle2 } from "lucide-react";

export default function NietAlleenWelkomPage() {
  const { data: session, status } = useSession();
  const [fotoPreview, setFotoPreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const fotoInputRef = useRef<HTMLInputElement>(null);

  const userId = (session?.user as any)?.id ?? session?.user?.email ?? "";

  const profiel = useQuery(
    api.nietAlleen.getProfile,
    userId ? { userId } : "skip"
  );

  const generateUploadUrl = useMutation(api.nietAlleen.generateUploadUrl);
  const saveProfielFoto = useMutation(api.nietAlleen.saveProfielFoto);

  const profielFotoStorageId = profiel?.profielFoto;
  const profielFotoUrl = useQuery(
    api.nietAlleen.getDagFotoUrl,
    profielFotoStorageId ? { storageId: profielFotoStorageId } : { storageId: undefined }
  );

  const huidigeFotoUrl = fotoPreview ?? profielFotoUrl ?? null;

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
      {/* Header */}
      <div className="flex justify-center px-6 pt-8">
        <Image src="/images/benji-logo-2.png" alt="Talk To Benji" width={38} height={38} className="hover:opacity-70 transition-opacity" />
      </div>

      <div className="max-w-md mx-auto px-6 py-8 space-y-8">

        {/* Welkom */}
        <div className="text-center space-y-2">
          <h1 className="text-2xl font-semibold" style={{ color: "#3d3530" }}>
            Welkom, {voornaam}
          </h1>
          <p className="text-base leading-relaxed" style={{ color: "#6b6460" }}>
            Fijn dat je er bent. Dit is jouw plek voor de komende 30 dagen.
          </p>
        </div>

        {/* Profielfoto */}
        <div className="flex flex-col items-center gap-3">
          <input ref={fotoInputRef} type="file" accept="image/*" className="hidden" onChange={handleFotoKiezen} />
          <button
            onClick={() => fotoInputRef.current?.click()}
            className="relative w-24 h-24 rounded-full border-2 flex items-center justify-center overflow-hidden transition-all hover:opacity-80"
            style={{ borderColor: huidigeFotoUrl ? "#6d84a8" : "#c4bdb6", background: huidigeFotoUrl ? "transparent" : "#f0ebe4" }}
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
          <p className="text-xs" style={{ color: "#b0a8a0" }}>
            {huidigeFotoUrl ? "Foto toegevoegd ✓" : "Voeg een foto van jezelf toe (optioneel)"}
          </p>
        </div>

        {/* Hoe het werkt */}
        <div className="space-y-3">
          <p className="text-sm font-semibold" style={{ color: "#3d3530" }}>Hoe het werkt</p>
          <div className="space-y-3">
            {[
              { stap: "1", tekst: "Elke ochtend ontvang je een e-mail met een kleine vraag." },
              { stap: "2", tekst: "Je klikt op de link en schrijft wat er in je opkomt. Geen goed of fout." },
              { stap: "3", tekst: "Je kunt een foto toevoegen of je antwoord inspreken als je niet wilt typen." },
              { stap: "4", tekst: "Na 30 dagen heb je een persoonlijk dagboek van jouw verwerkingsproces." },
            ].map(({ stap, tekst }) => (
              <div key={stap} className="flex items-start gap-3">
                <span className="flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-white"
                  style={{ background: "#6d84a8" }}>
                  {stap}
                </span>
                <p className="text-sm leading-relaxed pt-0.5" style={{ color: "#6b6460" }}>{tekst}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Wat je alvast kunt doen */}
        <div className="rounded-xl border px-4 py-4 space-y-3" style={{ background: "white", borderColor: "#e8e0d8" }}>
          <p className="text-sm font-semibold" style={{ color: "#3d3530" }}>Wat je alvast kunt doen</p>
          <div className="space-y-2">
            {[
              "Voeg een foto van jezelf toe hierboven",
              "Kies straks wie of wat je mist — dat helpt ons de teksten persoonlijker te maken",
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
        <Link
          href="/niet-alleen"
          className="block w-full py-3.5 rounded-xl font-medium text-white text-sm text-center transition-all"
          style={{ background: "#6d84a8" }}
        >
          Begin dag 1 →
        </Link>

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
