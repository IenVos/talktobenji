"use client";

import { useState } from "react";
import { useAdminQuery } from "../AdminAuthContext";
import { api } from "@/convex/_generated/api";
import { ClipboardList, ExternalLink, Copy, Check, Inbox } from "lucide-react";

// Welke formulier-variant hoort bij een verliestype (spiegelt FORMS in de intake-pagina).
function variantLabel(verliestype: string): string {
  if (verliestype === "kinderloos") return "Vragen over ongewenste kinderloosheid";
  return "Vragen over verlies van iemand";
}

export default function IntakeformulierenPage() {
  const paginas = useAdminQuery(api.blokPaginas.list, {}) as any[] | undefined;
  const [gekopieerd, setGekopieerd] = useState<string | null>(null);

  const origin = typeof window !== "undefined" ? window.location.origin : "";
  const intakeUrl = (slug: string) => `${origin}/lp/${slug}/kennismaken`;

  const kopieer = (url: string) => {
    navigator.clipboard?.writeText(url);
    setGekopieerd(url);
    setTimeout(() => setGekopieerd(null), 1500);
  };

  return (
    <div className="max-w-3xl mx-auto">
      <div className="flex items-center gap-3 mb-2">
        <ClipboardList className="text-primary-600" size={24} />
        <h1 className="text-2xl font-bold text-gray-900">Intakeformulieren</h1>
      </div>
      <p className="text-gray-500 mb-6 text-sm">
        Elk verliestype heeft een eigen kennismakingsformulier met passende vragen. De inzendingen komen binnen bij{" "}
        <span className="font-medium text-gray-700">Aanmeldingen</span>.
      </p>

      {paginas === undefined ? (
        <div className="text-gray-400">Laden...</div>
      ) : paginas.length === 0 ? (
        <div className="text-gray-500 bg-white border border-gray-200 rounded-xl p-8 text-center">
          Nog geen landingspagina's. Maak eerst een blok-pagina aan.
        </div>
      ) : (
        <div className="space-y-3">
          {paginas.map((p: any) => (
            <div key={p._id} className="bg-white border border-gray-300 rounded-xl p-4">
              <div className="flex items-start gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-gray-800 truncate">{p.naam}</span>
                    {p.gepubliceerd ? (
                      <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">live</span>
                    ) : (
                      <span className="text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full">concept</span>
                    )}
                  </div>
                  <p className="text-xs text-gray-500 mt-0.5">{variantLabel(p.verliestype)}</p>
                  <p className="text-xs text-gray-400 mt-1 truncate">/lp/{p.slug}/kennismaken</p>
                </div>
                <div className="flex items-center gap-1 flex-shrink-0">
                  <button onClick={() => kopieer(intakeUrl(p.slug))}
                    className="text-xs font-semibold text-primary-700 border border-primary-300 rounded-md px-2 py-1 flex items-center gap-1">
                    {gekopieerd === intakeUrl(p.slug) ? <><Check size={13} /> Gekopieerd</> : <><Copy size={13} /> Link</>}
                  </button>
                  <a href={`/lp/${p.slug}/kennismaken`} target="_blank" rel="noreferrer"
                    className="flex items-center gap-1.5 bg-primary-600 hover:bg-primary-700 text-white px-3 py-1.5 rounded-lg text-sm">
                    <ExternalLink size={14} /> Bekijk formulier
                  </a>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="mt-6 flex items-center gap-2 text-sm text-gray-500 bg-gray-50 border border-gray-200 rounded-xl p-4">
        <Inbox size={16} className="text-gray-400" />
        Ingevulde formulieren vind je onder <span className="font-medium text-gray-700">Zij aan Zij → Aanmeldingen</span>.
      </div>
    </div>
  );
}
