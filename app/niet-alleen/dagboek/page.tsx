"use client";

import { useSession } from "next-auth/react";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { getDagInhoud } from "@/convex/nietAlleenContent";
import Image from "next/image";
import Link from "next/link";
import { Printer } from "lucide-react";

export default function DagboekPage() {
  const { data: session, status } = useSession();
  const userId = (session?.user as any)?.id ?? session?.user?.email ?? "";

  const profiel = useQuery(api.nietAlleen.getProfile, userId ? { userId } : "skip");
  const fotoUrls = useQuery(api.nietAlleen.getAllDagFotoUrls, userId ? { userId } : "skip");

  if (status === "loading" || profiel === undefined || fotoUrls === undefined) {
    return <div style={{ minHeight: "100vh", background: "#fdf9f4" }} />;
  }

  if (status === "unauthenticated" || !profiel) {
    return (
      <div className="min-h-screen flex items-center justify-center px-6" style={{ background: "#fdf9f4" }}>
        <div className="text-center space-y-4 max-w-sm">
          <p style={{ color: "#6b6460" }}>Log in om je dagboek te bekijken.</p>
          <Link href="/inloggen" className="inline-block text-sm font-medium underline" style={{ color: "#6d84a8" }}>
            Inloggen
          </Link>
        </div>
      </div>
    );
  }

  const fotoMap = new Map(fotoUrls.map((f) => [f.dag, f.url]));
  const voornaam = profiel.naam.split(" ")[0];

  const dagItems = Array.from({ length: 30 }, (_, i) => i + 1).map((dag) => ({
    dag,
    inhoud: getDagInhoud(dag, profiel.verliesType ?? "anders"),
    prompt: profiel.dagPrompts.find((p) => p.dag === dag),
    fotoUrl: fotoMap.get(dag) ?? null,
  })).filter((d) => d.prompt || d.fotoUrl);

  return (
    <>
      {/* Print styles */}
      <style>{`
        @media print {
          .no-print { display: none !important; }
          body { background: white; }
          .dag-blok { break-inside: avoid; page-break-inside: avoid; }
        }
      `}</style>

      <div style={{ background: "#fdf9f4", minHeight: "100vh" }}>

        {/* Header */}
        <div className="no-print flex items-center justify-between px-6 py-4 border-b" style={{ borderColor: "#e8e0d8", background: "#fdf9f4" }}>
          <Link href="/niet-alleen" className="flex items-center gap-2 text-sm" style={{ color: "#8a8078" }}>
            <Image src="/images/benji-logo-2.png" alt="Talk To Benji" width={28} height={28} />
            Terug
          </Link>
          <button
            onClick={() => window.print()}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium text-white"
            style={{ background: "#6d84a8" }}
          >
            <Printer size={15} />
            Downloaden / printen
          </button>
        </div>

        <div className="max-w-2xl mx-auto px-6 py-10 space-y-10">

          {/* Titelblok */}
          <div className="text-center space-y-1 pb-6 border-b" style={{ borderColor: "#e8e0d8" }}>
            <h1 className="text-2xl font-semibold" style={{ color: "#3d3530" }}>
              Jouw 30 dagen, {voornaam}
            </h1>
            <p className="text-xs" style={{ color: "#b0a8a0" }}>
              {dagItems.length} van 30 dagen ingevuld
            </p>
          </div>

          {dagItems.length === 0 && (
            <p className="text-center text-sm py-12" style={{ color: "#b0a8a0" }}>
              Je hebt nog niets ingevuld. Ga elke dag naar je pagina en schrijf wat er in je opkomt.
            </p>
          )}

          {/* Dagblokken */}
          {dagItems.map(({ dag, inhoud, prompt, fotoUrl }) => (
            <div key={dag} className="dag-blok space-y-3 pb-8 border-b last:border-0" style={{ borderColor: "#e8e0d8" }}>
              <div className="space-y-0.5">
                <p className="text-xs uppercase tracking-widest font-medium" style={{ color: "#b0a8a0" }}>
                  Dag {dag} — {inhoud?.thema ?? ""}
                </p>
                <p className="text-sm leading-relaxed" style={{ color: "#8a8078" }}>
                  {inhoud?.inHetAccount ?? ""}
                </p>
              </div>
              {prompt && (
                <p className="text-base leading-relaxed whitespace-pre-wrap break-words" style={{ color: "#3d3530" }}>
                  {prompt.tekst}
                </p>
              )}
              {fotoUrl && (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={fotoUrl}
                  alt={`Foto dag ${dag}`}
                  className="w-full max-h-80 object-cover rounded-xl"
                  style={{ borderRadius: "12px" }}
                />
              )}
            </div>
          ))}

          {/* Footer */}
          {dagItems.length > 0 && (
            <div className="text-center pt-4 pb-12 space-y-3 no-print">
              <p className="text-sm" style={{ color: "#8a8078" }}>
                Wil je dit bewaren en verder gaan met TalkToBenji?
              </p>
              <Link
                href="/niet-alleen/ontdek"
                className="inline-block px-5 py-2.5 rounded-xl text-sm font-medium text-white"
                style={{ background: "#6d84a8" }}
              >
                Ontdek wat er meer is
              </Link>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
