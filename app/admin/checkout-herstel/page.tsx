"use client";

import { useEffect, useState } from "react";
import { CreditCard, Send, CheckCircle2, AlertTriangle } from "lucide-react";
import { api } from "@/convex/_generated/api";
import { useAdminQuery, useAdminMutation, useAdminAction } from "../AdminAuthContext";

type Poging = {
  id: string;
  email: string;
  naam?: string;
  slug: string;
  productNaam?: string;
  bedragCenten?: number;
  createdAt: number;
  herinneringen: number;
  herinneringAt?: number;
  afgemeld: boolean;
};

type Overzicht = {
  dagen: number;
  totaal: number;
  betaald: number;
  afgehaakt: number;
  pogingen: Poging[];
  config: {
    actief: boolean;
    urenWachten: number;
    urenTweede: number;
    maxHerinneringen: number;
    vensterVan: number;
    vensterTot: number;
  };
};

const PERIODES = [
  { label: "7 dagen", dagen: 7 },
  { label: "30 dagen", dagen: 30 },
  { label: "90 dagen", dagen: 90 },
];

function euro(centen?: number): string {
  if (!centen) return "–";
  return `€ ${(centen / 100).toFixed(2).replace(".", ",")}`;
}

function datum(ms: number): string {
  return new Date(ms).toLocaleString("nl-NL", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function CheckoutHerstelPage() {
  const [dagen, setDagen] = useState(30);
  const data = useAdminQuery(api.checkoutHerstel.overzicht, { sinceDays: dagen }) as
    | Overzicht
    | undefined;
  const setConfig = useAdminMutation(api.checkoutHerstel.setConfig);
  const stuurTest = useAdminAction(api.checkoutHerstel.stuurTestHerinnering);

  const [actief, setActief] = useState(false);
  const [uren, setUren] = useState(3);
  const [urenTweede, setUrenTweede] = useState(48);
  const [maxHerinneringen, setMaxHerinneringen] = useState(1);
  const [vensterVan, setVensterVan] = useState(8);
  const [vensterTot, setVensterTot] = useState(21);
  const [bewaard, setBewaard] = useState(false);
  const [testEmail, setTestEmail] = useState("");
  const [testStatus, setTestStatus] = useState("");

  // Instellingen uit de database overnemen zodra ze binnen zijn.
  useEffect(() => {
    if (!data) return;
    setActief(data.config.actief);
    setUren(data.config.urenWachten);
    setUrenTweede(data.config.urenTweede);
    setMaxHerinneringen(data.config.maxHerinneringen);
    setVensterVan(data.config.vensterVan);
    setVensterTot(data.config.vensterTot);
  }, [data?.config]);

  const opslaan = async () => {
    await setConfig({
      actief,
      urenWachten: uren,
      urenTweede,
      maxHerinneringen,
      vensterVan,
      vensterTot,
    });
    setBewaard(true);
    setTimeout(() => setBewaard(false), 2000);
  };

  const testen = async () => {
    if (!testEmail.trim()) return;
    setTestStatus("Versturen...");
    try {
      await stuurTest({ email: testEmail.trim() });
      setTestStatus("Testmail verstuurd");
    } catch (err) {
      setTestStatus(`Mislukt: ${(err as Error).message}`);
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-primary-50 flex items-center justify-center">
          <CreditCard size={20} className="text-primary-600" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-gray-900">Afgehaakte checkouts</h1>
          <p className="text-sm text-gray-400">
            Mensen die hun gegevens invulden maar niet betaalden
          </p>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        {PERIODES.map((p) => (
          <button
            key={p.dagen}
            onClick={() => setDagen(p.dagen)}
            className={`px-3.5 py-1.5 rounded-lg text-sm font-medium transition-colors border ${
              dagen === p.dagen
                ? "bg-primary-600 text-white border-primary-600"
                : "bg-white text-gray-600 border-gray-200 hover:bg-gray-50"
            }`}
          >
            {p.label}
          </button>
        ))}
      </div>

      {data === undefined ? (
        <div className="flex justify-center py-16">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600" />
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4">
              <div className="flex items-center gap-2 mb-2 text-gray-500">
                <AlertTriangle size={16} className="text-amber-500" />
                <span className="text-xs font-medium uppercase tracking-wide">Afgehaakt</span>
              </div>
              <p className="text-2xl font-bold text-gray-900">{data.afgehaakt}</p>
              <p className="text-xs text-gray-400 mt-1">gegevens ingevuld, niet betaald</p>
            </div>
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4">
              <div className="flex items-center gap-2 mb-2 text-gray-500">
                <CheckCircle2 size={16} className="text-green-600" />
                <span className="text-xs font-medium uppercase tracking-wide">Wel betaald</span>
              </div>
              <p className="text-2xl font-bold text-gray-900">{data.betaald}</p>
              <p className="text-xs text-gray-400 mt-1">
                {data.totaal > 0
                  ? `${Math.round((data.betaald / data.totaal) * 100)}% van de pogingen`
                  : "nog geen pogingen"}
              </p>
            </div>
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4">
              <div className="flex items-center gap-2 mb-2 text-gray-500">
                <Send size={16} className="text-primary-600" />
                <span className="text-xs font-medium uppercase tracking-wide">Herinneringen</span>
              </div>
              <p className="text-2xl font-bold text-gray-900">
                {data.config.actief ? "Aan" : "Uit"}
              </p>
              <p className="text-xs text-gray-400 mt-1">
                {data.config.actief
                  ? `mail 1 na ${data.config.urenWachten} uur${
                      data.config.maxHerinneringen === 2
                        ? `, mail 2 na nog ${data.config.urenTweede} uur`
                        : ""
                    } · ${data.config.vensterVan}:00–${data.config.vensterTot}:00`
                  : "er gaat nu niets uit"}
              </p>
            </div>
          </div>

          {/* Instellingen */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5 space-y-4">
            <div>
              <h2 className="font-semibold text-gray-900">Herinneringsmail</h2>
              <p className="text-xs text-gray-400">
                Staat standaard uit. Zet je hem aan, dan mailt Ien mensen die niet afrekenden.
              </p>
            </div>

            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={actief}
                onChange={(e) => setActief(e.target.checked)}
                className="w-4 h-4 rounded border-gray-300"
              />
              <span className="text-sm text-gray-700">Herinneringsmails versturen</span>
            </label>

            <div className="flex flex-wrap gap-4">
              <label className="text-sm text-gray-600">
                <span className="block mb-1 text-xs text-gray-400">Mail 1: uren ná afhaken</span>
                <input
                  type="number"
                  min={1}
                  max={72}
                  value={uren}
                  onChange={(e) => setUren(Number(e.target.value))}
                  className="w-32 px-3 py-1.5 border border-gray-200 rounded-lg text-sm"
                />
              </label>
              <label className="text-sm text-gray-600">
                <span className="block mb-1 text-xs text-gray-400">Aantal mails</span>
                <select
                  value={maxHerinneringen}
                  onChange={(e) => setMaxHerinneringen(Number(e.target.value))}
                  className="w-28 px-3 py-1.5 border border-gray-200 rounded-lg text-sm"
                >
                  <option value={1}>1 mail</option>
                  <option value={2}>2 mails</option>
                </select>
              </label>
              {maxHerinneringen === 2 && (
                <label className="text-sm text-gray-600">
                  <span className="block mb-1 text-xs text-gray-400">Mail 2: uren ná mail 1</span>
                  <input
                    type="number"
                    min={1}
                    max={336}
                    value={urenTweede}
                    onChange={(e) => setUrenTweede(Number(e.target.value))}
                    className="w-32 px-3 py-1.5 border border-gray-200 rounded-lg text-sm"
                  />
                </label>
              )}
              <label className="text-sm text-gray-600">
                <span className="block mb-1 text-xs text-gray-400">Alleen mailen tussen</span>
                <div className="flex items-center gap-1.5">
                  <input
                    type="number"
                    min={0}
                    max={23}
                    value={vensterVan}
                    onChange={(e) => setVensterVan(Number(e.target.value))}
                    className="w-16 px-3 py-1.5 border border-gray-200 rounded-lg text-sm"
                  />
                  <span className="text-xs text-gray-400">en</span>
                  <input
                    type="number"
                    min={0}
                    max={23}
                    value={vensterTot}
                    onChange={(e) => setVensterTot(Number(e.target.value))}
                    className="w-16 px-3 py-1.5 border border-gray-200 rounded-lg text-sm"
                  />
                  <span className="text-xs text-gray-400">uur</span>
                </div>
              </label>
            </div>

            <p className="text-xs text-gray-400 leading-relaxed">
              Voorbeeld: staat mail 1 op {uren} uur
              {maxHerinneringen === 2 ? ` en mail 2 op ${urenTweede} uur` : ""}, dan krijgt iemand die
              om 10:00 afhaakt zijn eerste mail rond {(10 + uren) % 24}:00
              {maxHerinneringen === 2
                ? `, en de tweede ${Math.round(urenTweede / 24) >= 1 ? `${Math.round(urenTweede / 24)} dag(en)` : `${urenTweede} uur`} daarna`
                : ""}
              . Wordt een mail buiten {vensterVan}:00 tot {vensterTot}:00 rijp, dan wacht hij tot het
              venster weer open is.
            </p>

            <div className="flex flex-wrap items-center gap-3">
              <button
                onClick={opslaan}
                className="px-4 py-2 rounded-lg bg-primary-600 text-white text-sm font-medium hover:bg-primary-700"
              >
                Opslaan
              </button>
              {bewaard && <span className="text-sm text-green-600">Opgeslagen</span>}

              <div className="flex items-center gap-2 ml-auto">
                <input
                  type="email"
                  placeholder="jouw@email.nl"
                  value={testEmail}
                  onChange={(e) => setTestEmail(e.target.value)}
                  className="px-3 py-1.5 border border-gray-200 rounded-lg text-sm"
                />
                <button
                  onClick={testen}
                  className="px-3 py-1.5 rounded-lg border border-gray-200 text-sm text-gray-600 hover:bg-gray-50"
                >
                  Testmail
                </button>
                {testStatus && <span className="text-xs text-gray-500">{testStatus}</span>}
              </div>
            </div>
          </div>

          {/* Lijst */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="px-5 py-3.5 border-b border-gray-100">
              <h2 className="font-semibold text-gray-900">Niet afgerond</h2>
              <p className="text-xs text-gray-400">Nieuwste eerst</p>
            </div>
            {data.pogingen.length === 0 ? (
              <p className="px-5 py-8 text-sm text-gray-400 text-center">
                Niemand is afgehaakt in deze periode.
              </p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-xs text-gray-400 uppercase tracking-wide border-b border-gray-100">
                      <th className="px-5 py-2.5 font-medium">E-mail</th>
                      <th className="px-3 py-2.5 font-medium">Product</th>
                      <th className="px-3 py-2.5 font-medium text-right">Bedrag</th>
                      <th className="px-3 py-2.5 font-medium">Wanneer</th>
                      <th className="px-5 py-2.5 font-medium">Herinnering</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.pogingen.map((p) => (
                      <tr key={p.id} className="border-b border-gray-50 last:border-0 hover:bg-gray-50">
                        <td className="px-5 py-2.5 text-gray-700">
                          <span className="block">{p.email}</span>
                          {p.naam && <span className="text-xs text-gray-400">{p.naam}</span>}
                        </td>
                        <td className="px-3 py-2.5 text-gray-500">{p.productNaam || p.slug}</td>
                        <td className="px-3 py-2.5 text-right text-gray-500">
                          {euro(p.bedragCenten)}
                        </td>
                        <td className="px-3 py-2.5 text-gray-500">{datum(p.createdAt)}</td>
                        <td className="px-5 py-2.5 text-gray-500">
                          {p.afgemeld ? (
                            <span className="text-xs text-gray-400">afgemeld</span>
                          ) : p.herinneringen === 0 ? (
                            <span className="text-xs text-gray-400">nog niet</span>
                          ) : (
                            <span className="text-xs">
                              {p.herinneringen}× {p.herinneringAt ? `(${datum(p.herinneringAt)})` : ""}
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          <p className="text-xs text-gray-400 leading-relaxed">
            Een poging komt in deze lijst zodra iemand op de checkout naam en e-mail invult en
            doorgaat naar de betaalstap. Rondt hij de betaling af, dan verdwijnt hij hier en
            verschijnt hij bij Omzet & verkopen. In Stripe zie je dezelfde mensen terug als
            betalingen met de status "onvolledig".
          </p>
        </>
      )}
    </div>
  );
}
