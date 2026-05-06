"use client";

import { useState } from "react";
import { useAdminAuth } from "../AdminAuthContext";
import { Download, FileSpreadsheet } from "lucide-react";

const MAANDEN = [
  "Januari", "Februari", "Maart", "April", "Mei", "Juni",
  "Juli", "Augustus", "September", "Oktober", "November", "December",
];

export default function BtwExportPage() {
  const { adminToken } = useAdminAuth();
  const huidigJaar = new Date().getFullYear();
  const huidigeMaand = new Date().getMonth() + 1;

  const [jaar, setJaar] = useState(String(huidigJaar));
  const [maand, setMaand] = useState(String(huidigeMaand));
  const [allesVanJaar, setAllesVanJaar] = useState(false);
  const [loading, setLoading] = useState(false);
  const [fout, setFout] = useState<string | null>(null);

  const jaren = Array.from({ length: 4 }, (_, i) => String(huidigJaar - i));

  const handleDownload = async () => {
    if (!adminToken) return;
    setLoading(true);
    setFout(null);

    const params = new URLSearchParams({ year: jaar });
    if (!allesVanJaar) params.set("month", maand);

    try {
      const res = await fetch(`/api/admin/vat-export?${params}`, {
        headers: { Authorization: adminToken },
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setFout(data.error ?? "Er ging iets mis.");
        return;
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = allesVanJaar
        ? `btw-export-${jaar}.csv`
        : `btw-export-${jaar}-${String(maand).padStart(2, "0")}.csv`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      setFout("Verbindingsfout. Probeer het opnieuw.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-lg">
      <div className="flex items-center gap-3 mb-6">
        <FileSpreadsheet className="w-6 h-6 text-primary-600" />
        <h1 className="text-xl font-bold text-stone-800">BTW-export</h1>
      </div>

      <div className="bg-white rounded-2xl border border-stone-200 p-6 shadow-sm space-y-5">
        <p className="text-sm text-stone-500 leading-relaxed">
          Download een CSV-overzicht van alle betalingen met BTW-informatie. Geschikt als input voor je OSS BTW-aangifte.
        </p>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-stone-700 mb-1.5">Jaar</label>
            <select
              value={jaar}
              onChange={(e) => setJaar(e.target.value)}
              className="w-full px-4 py-3 border border-stone-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-400 bg-white"
            >
              {jaren.map((j) => (
                <option key={j} value={j}>{j}</option>
              ))}
            </select>
          </div>

          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={allesVanJaar}
              onChange={(e) => setAllesVanJaar(e.target.checked)}
              className="w-4 h-4 rounded border-stone-300 text-primary-600 focus:ring-primary-400"
            />
            <span className="text-sm text-stone-600">Heel {jaar} exporteren</span>
          </label>

          {!allesVanJaar && (
            <div>
              <label className="block text-sm font-medium text-stone-700 mb-1.5">Maand</label>
              <select
                value={maand}
                onChange={(e) => setMaand(e.target.value)}
                className="w-full px-4 py-3 border border-stone-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-400 bg-white"
              >
                {MAANDEN.map((naam, i) => (
                  <option key={i + 1} value={String(i + 1)}>{naam}</option>
                ))}
              </select>
            </div>
          )}
        </div>

        {fout && (
          <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-4 py-3">
            {fout}
          </p>
        )}

        <button
          onClick={handleDownload}
          disabled={loading || !adminToken}
          className="w-full flex items-center justify-center gap-2 py-3 bg-primary-600 text-white font-semibold rounded-xl hover:bg-primary-700 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
        >
          <Download className="w-4 h-4" />
          {loading ? "Bezig met ophalen…" : "Download CSV"}
        </button>

        <p className="text-xs text-stone-400 leading-relaxed">
          Kolommen: Factuurnummer · Datum · Land · BTW-tarief · BTW-bedrag · Nettobedrag · Totaal · Zakelijk · BTW-nummer klant. Betalingen zonder factuurnummer (van vóór de BTW-implementatie) worden overgeslagen.
        </p>
      </div>
    </div>
  );
}
