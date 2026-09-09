"use client";

import { useState } from "react";
import { useAdminQuery } from "../AdminAuthContext";
import { api } from "@/convex/_generated/api";
import { Inbox, Mail, ExternalLink } from "lucide-react";

function formatDatum(ms: number) {
  return new Date(ms).toLocaleString("nl-NL", {
    day: "numeric", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit",
  });
}

export default function ZijAanZijIntakesPage() {
  const [slugFilter, setSlugFilter] = useState<string>("");
  const paginas = useAdminQuery(api.blokPaginas.list, {});
  const intakes = useAdminQuery(
    api.blokPaginas.intakes,
    slugFilter ? { slug: slugFilter } : {}
  );

  return (
    <div className="max-w-3xl mx-auto">
      <div className="flex items-center gap-3 mb-2">
        <Inbox className="text-primary-600" size={24} />
        <h1 className="text-2xl font-bold text-gray-900">Aanmeldingen</h1>
      </div>
      <p className="text-gray-500 mb-6 text-sm">
        Kennismakings-aanvragen via de landingspagina's. Nieuwe aanmeldingen komen hier binnen.
      </p>

      {/* Filter per pagina */}
      <div className="mb-5 flex items-center gap-2">
        <label className="text-sm text-gray-600">Pagina:</label>
        <select
          value={slugFilter}
          onChange={(e) => setSlugFilter(e.target.value)}
          className="px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white"
        >
          <option value="">Alle pagina's</option>
          {(paginas ?? []).map((p: any) => (
            <option key={p._id} value={p.slug}>{p.naam}</option>
          ))}
        </select>
      </div>

      {intakes === undefined ? (
        <div className="text-gray-400">Laden...</div>
      ) : intakes.length === 0 ? (
        <div className="text-gray-500 bg-white border border-gray-200 rounded-xl p-8 text-center">
          Nog geen aanmeldingen.
        </div>
      ) : (
        <div className="space-y-3">
          {intakes.map((it: any) => {
            const velden: Record<string, any> = it.velden || {};
            const veldKeys = Object.keys(velden);
            return (
              <div key={it._id} className="bg-white border border-gray-300 rounded-xl p-4">
                <div className="flex items-start justify-between gap-3 mb-2">
                  <div className="min-w-0">
                    <div className="font-medium text-gray-800">{it.naam || "(geen naam)"}</div>
                    <a href={`mailto:${it.email}`} className="text-sm text-primary-600 hover:underline flex items-center gap-1">
                      <Mail size={13} /> {it.email}
                    </a>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <div className="text-xs text-gray-400">{formatDatum(it.createdAt)}</div>
                    <div className="text-xs text-gray-400 mt-0.5 flex items-center justify-end gap-1">
                      <ExternalLink size={11} /> /lp/{it.paginaSlug}
                    </div>
                  </div>
                </div>
                {veldKeys.length > 0 && (
                  <dl className="mt-3 pt-3 border-t border-gray-100 space-y-2">
                    {veldKeys.map((k) => (
                      <div key={k}>
                        <dt className="text-xs font-semibold text-gray-500 uppercase tracking-wide">{k}</dt>
                        <dd className="text-sm text-gray-700 whitespace-pre-wrap">
                          {typeof velden[k] === "string" ? velden[k] : JSON.stringify(velden[k])}
                        </dd>
                      </div>
                    ))}
                  </dl>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
