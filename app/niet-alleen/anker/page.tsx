"use client";

import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useSession } from "next-auth/react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { ANKER_CONTENT, ANKER_DAGEN, type AnkerDag } from "@/convex/nietAlleenAnkerContent";
import Image from "next/image";
import Link from "next/link";

function AnkerPageInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const dagParam = searchParams?.get("dag");
  const dag = dagParam ? parseInt(dagParam) : null;

  const { data: session, status } = useSession();
  const userId = (session?.user as any)?.id ?? session?.user?.email ?? "";

  const profiel = useQuery(api.nietAlleen.getProfile, userId ? { userId } : "skip");
  const saveAnker = useMutation(api.nietAlleen.saveAnker);
  const saveTerugblik = useMutation(api.nietAlleen.saveTerugblik);

  const [geselecteerd, setGeselecteerd] = useState<string | null>(null);
  const [eigenTekst, setEigenTekst] = useState("");
  const [terugblikTekst, setTerugblikTekst] = useState("");
  const [opgeslagen, setOpgeslagen] = useState(false);
  const [bezig, setBezig] = useState(false);

  if (status === "loading" || profiel === undefined) {
    return <div style={{ minHeight: "100vh", background: "#fdf9f4" }} />;
  }

  if (!dag || !ANKER_DAGEN.includes(dag as AnkerDag)) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "#fdf9f4" }}>
        <Link href="/niet-alleen" className="text-sm" style={{ color: "#6d84a8" }}>← Terug</Link>
      </div>
    );
  }

  const inhoud = ANKER_CONTENT[dag as AnkerDag];
  const alOpgeslagen = profiel?.nietAlleenAnker?.opgeslagenOpDag === dag;
  const gekozenTekst = eigenTekst.trim() || geselecteerd;

  const TERUGBLIK_DAGEN = [7, 14, 21];
  const TERUGBLIK_VRAGEN: Record<number, string> = {
    7: "Een week geleden begon je hier. Je hebt zeven dagen woorden gegeven aan iets wat moeilijk te verwoorden is. Wat heeft deze week je gebracht? Niet wat je had verwacht of gehoopt. Maar wat er echt was: een inzicht, een gevoel, een moment van herkenning, of juist een dag waarop het zwaarder was dan de andere.",
    14: "Twee weken. Je hebt herinneringen aangeraakt die je misschien al een tijdje niet had durven aanraken. Wat heeft deze week je het meest geraakt? En is er iets wat je anders ziet dan een week geleden, over het verlies, over jezelf, of over wat je nodig hebt?",
    21: "Drie weken. Je bent veranderd in deze tijd, ook als je dat van binnenuit misschien niet zo voelt. Kijk terug op de afgelopen week. Wat was zwaar? Wat was onverwacht licht? En wat neem je mee naar de laatste negen dagen?",
  };
  const toonTerugblik = dag !== null && TERUGBLIK_DAGEN.includes(dag);

  async function handleOpslaan() {
    if (!gekozenTekst || !userId || bezig) return;
    setBezig(true);
    try {
      await saveAnker({ userId, tekst: gekozenTekst, dag: dag! });
      if (terugblikTekst.trim() && dag !== null) {
        await saveTerugblik({ userId, dag, tekst: terugblikTekst.trim() });
      }
      setOpgeslagen(true);
      setTimeout(() => router.push("/niet-alleen"), 1800);
    } finally {
      setBezig(false);
    }
  }

  return (
    <div className="min-h-screen" style={{ background: "#fdf9f4" }}>
      {/* Header */}
      <div className="flex items-center justify-between px-6 pt-6 pb-2">
        <Link href="/niet-alleen">
          <Image src="/images/benji-logo-2.png" alt="Talk To Benji" width={34} height={34}
            className="hover:opacity-70 transition-opacity" />
        </Link>
        <Link href="/niet-alleen" className="text-sm" style={{ color: "#b0a8a0" }}>
          Terug
        </Link>
      </div>

      <div className="max-w-sm mx-auto px-6 py-10 space-y-8">

        {/* Label */}
        <p className="text-xs uppercase tracking-widest font-medium text-center" style={{ color: "#b0a8a0" }}>
          {inhoud.label}
        </p>

        {/* Warmte-tekst */}
        <p className="text-lg leading-relaxed text-center" style={{ color: "#3d3530" }}>
          {inhoud.tekst.split("\n").map((regel, i) => (
            <span key={i}>{regel}{i < inhoud.tekst.split("\n").length - 1 && <br />}</span>
          ))}
        </p>

        {/* Terugblikvraag — alleen op dag 7, 14, 21 */}
        {toonTerugblik && !alOpgeslagen && !opgeslagen && (
          <>
            <div className="space-y-3">
              <p className="text-sm leading-relaxed" style={{ color: "#6b6460" }}>
                {TERUGBLIK_VRAGEN[dag!]}
              </p>
              <textarea
                value={terugblikTekst}
                onChange={(e) => setTerugblikTekst(e.target.value)}
                placeholder="Schrijf hier je terugblik... (optioneel)"
                rows={5}
                className="w-full rounded-2xl p-4 text-base leading-relaxed resize-none focus:outline-none border"
                style={{ background: "white", borderColor: terugblikTekst ? "#6d84a8" : "#e8e0d8", color: "#3d3530" }}
              />
            </div>
            <hr style={{ borderColor: "#e8e0d8", borderTopWidth: 1 }} />
          </>
        )}

        {alOpgeslagen && !opgeslagen ? (
          /* Al opgeslagen — toon bevestiging */
          <div className="space-y-4 text-center">
            <p className="text-sm" style={{ color: "#8a8078" }}>Je anker voor deze week:</p>
            <p className="text-base italic" style={{ color: "#3d3530" }}>
              &ldquo;{profiel?.nietAlleenAnker?.tekst}&rdquo;
            </p>
            <Link href="/niet-alleen" className="inline-block text-sm font-medium" style={{ color: "#6d84a8" }}>
              Terug naar vandaag
            </Link>
          </div>
        ) : opgeslagen ? (
          /* Net opgeslagen */
          <div className="text-center space-y-3 py-4">
            <p className="text-base" style={{ color: "#3d3530" }}>Je anker is bewaard.</p>
            <p className="text-sm italic" style={{ color: "#6b6460" }}>
              &ldquo;{gekozenTekst}&rdquo;
            </p>
            <p className="text-xs" style={{ color: "#b0a8a0" }}>Je wordt teruggestuurd...</p>
          </div>
        ) : (
          /* Keuze-interface */
          <div className="space-y-3">
            {inhoud.zinnen.map((zin) => (
              <button
                key={zin}
                onClick={() => { setGeselecteerd(zin); setEigenTekst(""); }}
                className="w-full text-left px-4 py-3 rounded-xl border-2 text-sm transition-all leading-relaxed"
                style={{
                  borderColor: geselecteerd === zin && !eigenTekst ? "#6d84a8" : "#e8e0d8",
                  background: geselecteerd === zin && !eigenTekst ? "#eef1f6" : "white",
                  color: "#3d3530",
                }}
              >
                {zin}
              </button>
            ))}

            {/* Eigen anker invulveld */}
            <input
              type="text"
              value={eigenTekst}
              onChange={(e) => { setEigenTekst(e.target.value); setGeselecteerd(null); }}
              placeholder="Schrijf je eigen anker..."
              className="w-full px-4 py-3 rounded-xl border-2 text-sm focus:outline-none transition-all"
              style={{
                borderColor: eigenTekst ? "#6d84a8" : "#e8e0d8",
                background: eigenTekst ? "#eef1f6" : "white",
                color: "#3d3530",
              }}
            />

            <button
              onClick={handleOpslaan}
              disabled={!gekozenTekst || bezig}
              className="w-full py-3 rounded-xl font-medium text-white text-sm transition-all mt-2"
              style={{
                background: gekozenTekst && !bezig ? "#6d84a8" : "#c4cdd8",
                cursor: gekozenTekst && !bezig ? "pointer" : "default",
              }}
            >
              {bezig ? "Even geduld..." : "Bewaar mijn anker"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default function AnkerPage() {
  return (
    <Suspense fallback={<div style={{ minHeight: "100vh", background: "#fdf9f4" }} />}>
      <AnkerPageInner />
    </Suspense>
  );
}
