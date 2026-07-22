"use client";

import { useState } from "react";
import { api } from "@/convex/_generated/api";
import { useAdminQuery } from "../AdminAuthContext";

// Leesvolgorde van de opvolgmails (intern nummer → positie 1..6). Zelfde volgorde
// als op de Mails-pagina. Mail 6 ("Wie ben ik"/Benji) valt chronologisch als 2e.
const EH_VOLGORDE = [1, 6, 2, 3, 4, 5];
const positieVanMail = (n: number) => EH_VOLGORDE.indexOf(n) + 1;

export default function EvenHouvastFunnelPage() {
  const overzicht = useAdminQuery(api.evenHouvastOpvolg.funnelOverzicht, {}) as
    | { email: string; naam: string | null; dagenGeleden: number; laatsteMail: number; afgemeld: boolean; gekocht: boolean }[]
    | undefined;
  const afmeldingen = useAdminQuery(api.evenHouvastOpvolg.afmeldOverzicht, { sinceDays: 90 }) as
    | {
        dagen: number;
        totaalAfgemeld: number;
        onbekend: number;
        perMail: { mail: string; label: string; dag: number; verzonden: number; afgemeld: number; ratio: number }[];
        perType: { type: string; aantal: number }[];
        recent: { email: string; createdAt: number; mail?: string; verliestype?: string }[];
      }
    | undefined;
  const ehReis = useAdminQuery(api.siteAnalytics.getEhFunnelStats, { from: 0, to: 9999999999999 }) as
    | {
        tour: { stappen: { i: number; count: number }[]; slot: number; brugClick: number };
        brug: { reached: number; checkoutClick: number };
        ehCheckout: { slug: string; reached: number; purchased: number }[];
      }
    | undefined;
  const benjiProef = useAdminQuery(api.siteAnalytics.getBenjiProefStats, { from: 0, to: 9999999999999 }) as
    | {
        verstuurd: number;
        geactiveerd: number;
        activatieRatio: number;
        ehProeven: number;
        actieveProef: number;
        metGesprek: number;
        totaalGesprekken: number;
        gemGesprekken: number;
        kochtNA: number;
      }
    | undefined;
  const [toonAfmeldingen, setToonAfmeldingen] = useState(false);
  const [toonLijst, setToonLijst] = useState(false);

  const totaal = overzicht?.length ?? 0;
  const gekocht = overzicht?.filter((r) => r.gekocht).length ?? 0;
  const afgemeld = overzicht?.filter((r) => r.afgemeld && !r.gekocht).length ?? 0;
  const lopend = totaal - gekocht - afgemeld;

  return (
    <div className="max-w-3xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Even Houvast funnel</h1>
        <p className="text-sm text-gray-500 mt-1">
          Waar je leads in de reeks zitten, hoeveel de Benji-proef gebruiken, de warme reis, en waar mensen
          afhaken. De mails zelf bewerk je bij{" "}
          <a href="/admin/even-houvast-emails" className="text-primary-700 hover:underline">Mails</a>.
        </p>
      </div>

      {/* Funnel-overzicht: hoeveel leads en waar ze zitten */}
      <div className="bg-white border border-gray-200 rounded-xl p-5 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-semibold text-gray-900">In de funnel</h2>
          <span className="text-xs text-gray-400">vanaf 25 juni 2026</span>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="rounded-lg bg-gray-50 p-3"><p className="text-2xl font-bold text-gray-900">{totaal}</p><p className="text-xs text-gray-500">leads totaal</p></div>
          <div className="rounded-lg bg-primary-50 p-3"><p className="text-2xl font-bold text-primary-700">{lopend}</p><p className="text-xs text-gray-500">lopend in reeks</p></div>
          <div className="rounded-lg bg-green-50 p-3"><p className="text-2xl font-bold text-green-700">{gekocht}</p><p className="text-xs text-gray-500">kocht Niet Alleen</p></div>
          <div className="rounded-lg bg-gray-50 p-3"><p className="text-2xl font-bold text-gray-500">{afgemeld}</p><p className="text-xs text-gray-500">afgemeld</p></div>
        </div>
        <div className="space-y-1.5">
          {EH_VOLGORDE.map((n, idx) => {
            const aantal = overzicht?.filter((r) => !r.gekocht && !r.afgemeld && r.laatsteMail === n).length ?? 0;
            const pct = lopend > 0 ? Math.round((aantal / lopend) * 100) : 0;
            return (
              <div key={n} className="flex items-center gap-3 text-xs">
                <span className="w-28 flex-shrink-0 text-gray-600">Laatst: mail {idx + 1}</span>
                <div className="flex-1 bg-gray-100 rounded-full h-3 overflow-hidden"><div className="h-full bg-primary-400 rounded-full" style={{ width: `${pct}%` }} /></div>
                <span className="w-10 text-right font-semibold text-gray-700">{aantal}</span>
              </div>
            );
          })}
          {(() => {
            const wachtNul = overzicht?.filter((r) => !r.gekocht && !r.afgemeld && r.laatsteMail === 0).length ?? 0;
            return wachtNul > 0 ? (
              <div className="flex items-center gap-3 text-xs">
                <span className="w-28 flex-shrink-0 text-gray-400">Nog geen mail</span>
                <div className="flex-1" />
                <span className="w-10 text-right font-semibold text-gray-400">{wachtNul}</span>
              </div>
            ) : null;
          })()}
        </div>
        {totaal > 0 && (
          <div className="pt-1 border-t border-gray-100">
            <button onClick={() => setToonLijst((v) => !v)} className="text-xs font-medium text-primary-700 hover:text-primary-900">
              {toonLijst ? "Verberg lijst" : `Toon ${totaal} leads (per e-mail)`}
            </button>
            {toonLijst && (
              <div className="mt-2 space-y-0">
                {overzicht?.map((r, i) => (
                  <div key={i} className="flex items-center justify-between text-xs py-1.5 border-b border-gray-50 last:border-0">
                    <div className="truncate">
                      {r.naam && <span className="font-medium text-gray-800 mr-1.5">{r.naam}</span>}
                      <span className="text-gray-500">{r.email}</span>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0 ml-2">
                      <span className="text-gray-400">dag {r.dagenGeleden}</span>
                      {r.gekocht ? (
                        <span className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-green-50 text-green-700">gekocht</span>
                      ) : r.afgemeld ? (
                        <span className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-gray-100 text-gray-500">afgemeld</span>
                      ) : (
                        <span className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-primary-50 text-primary-600">{r.laatsteMail > 0 ? `mail ${positieVanMail(r.laatsteMail)}` : "wacht"}</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Benji-proef: één-klik-activaties, gebruik (aantal gesprekken) en doorverkoop */}
      {benjiProef && (
        <div className="bg-white border border-gray-200 rounded-xl p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-semibold text-gray-900">Benji-proef</h2>
            <span className="text-xs text-gray-400">7 dagen gratis via de mail</span>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="rounded-lg bg-gray-50 p-3"><p className="text-2xl font-bold text-gray-900">{benjiProef.verstuurd}</p><p className="text-xs text-gray-500">links verstuurd</p></div>
            <div className="rounded-lg bg-primary-50 p-3"><p className="text-2xl font-bold text-primary-700">{benjiProef.geactiveerd}</p><p className="text-xs text-gray-500">geactiveerd · {benjiProef.activatieRatio}%</p></div>
            <div className="rounded-lg bg-amber-50 p-3"><p className="text-2xl font-bold text-amber-700">{benjiProef.actieveProef}</p><p className="text-xs text-gray-500">proef nu actief</p></div>
            <div className="rounded-lg bg-green-50 p-3"><p className="text-2xl font-bold text-green-700">{benjiProef.kochtNA}</p><p className="text-xs text-gray-500">kocht Niet Alleen</p></div>
          </div>
          {/* Gebruik: het aantal gesprekken met Benji */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-1 border-t border-gray-100">
            <div className="rounded-lg bg-gray-50 p-3"><p className="text-2xl font-bold text-gray-900">{benjiProef.totaalGesprekken}</p><p className="text-xs text-gray-500">gesprekken totaal</p></div>
            <div className="rounded-lg bg-gray-50 p-3"><p className="text-2xl font-bold text-gray-900">{benjiProef.metGesprek}</p><p className="text-xs text-gray-500">proeven die praten</p></div>
            <div className="rounded-lg bg-gray-50 p-3"><p className="text-2xl font-bold text-gray-900">{benjiProef.gemGesprekken}</p><p className="text-xs text-gray-500">gem. per proef</p></div>
          </div>
        </div>
      )}

      {/* De warme reis: compacte samenvatting carrousel -> brug -> checkout */}
      {ehReis && (
        <div className="bg-white border border-gray-200 rounded-xl p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-semibold text-gray-900">De warme reis</h2>
            <a href="/admin/analytics" className="text-xs font-medium text-primary-700 hover:text-primary-900">Volledige analyse →</a>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="rounded-lg bg-gray-50 p-3"><p className="text-2xl font-bold text-gray-900">{ehReis.tour.stappen[0]?.count ?? 0}</p><p className="text-xs text-gray-500">carrousel gestart</p></div>
            <div className="rounded-lg bg-gray-50 p-3"><p className="text-2xl font-bold text-gray-900">{ehReis.tour.slot}</p><p className="text-xs text-gray-500">uitgelopen</p></div>
            <div className="rounded-lg bg-gray-50 p-3"><p className="text-2xl font-bold text-gray-900">{ehReis.brug.reached}</p><p className="text-xs text-gray-500">brug bereikt</p></div>
            <div className="rounded-lg bg-green-50 p-3"><p className="text-2xl font-bold text-green-700">{ehReis.ehCheckout.reduce((s, c) => s + c.purchased, 0)}</p><p className="text-xs text-gray-500">gekocht via checkout</p></div>
          </div>
          <p className="text-xs text-gray-400">Carrousel → brugpagina → betaalpagina. De volledige analyse (per scherm, per verliestype) staat in Analytics.</p>
        </div>
      )}

      {/* Waar haken mensen af: afmeldingen per mail, met de afmeldratio erbij */}
      {afmeldingen && afmeldingen.totaalAfgemeld > 0 && (
        <div className="bg-white border border-gray-200 rounded-xl p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-semibold text-gray-900">Waar haken ze af?</h2>
            <span className="text-xs text-gray-400">
              {afmeldingen.totaalAfgemeld} afmeldingen · laatste {afmeldingen.dagen} dagen
            </span>
          </div>

          <div className="space-y-1.5">
            {afmeldingen.perMail.map((m) => {
              const hoogste = Math.max(...afmeldingen.perMail.map((x) => x.ratio), 1);
              return (
                <div key={m.mail} className="flex items-center gap-3 text-xs">
                  <span className="w-28 flex-shrink-0 text-gray-600">{m.label}</span>
                  <div className="flex-1 bg-gray-100 rounded-full h-3 overflow-hidden">
                    <div
                      className={`h-full rounded-full ${m.ratio >= 5 ? "bg-red-400" : "bg-primary-400"}`}
                      style={{ width: `${Math.round((m.ratio / hoogste) * 100)}%` }}
                    />
                  </div>
                  <span className="w-32 text-right text-gray-500">
                    <span className="font-semibold text-gray-800">{m.afgemeld}</span> van {m.verzonden}
                    {m.verzonden > 0 && <span className="text-gray-400"> · {m.ratio}%</span>}
                  </span>
                </div>
              );
            })}
          </div>

          {afmeldingen.perType.length > 0 && (
            <div className="flex flex-wrap gap-1.5 pt-1">
              {afmeldingen.perType.map((t) => (
                <span key={t.type} className="px-2 py-0.5 rounded-full text-[11px] bg-gray-100 text-gray-600">
                  {t.type}: <span className="font-semibold text-gray-800">{t.aantal}</span>
                </span>
              ))}
            </div>
          )}

          {afmeldingen.onbekend > 0 && (
            <p className="text-xs text-gray-400">
              {afmeldingen.onbekend} afmeldingen zijn van vóór 14 juli 2026; daarvan weten we niet
              bij welke mail ze klikten (het verliestype halen we wel uit de lead zelf).
            </p>
          )}

          <div className="pt-1 border-t border-gray-100">
            <button
              onClick={() => setToonAfmeldingen((v) => !v)}
              className="text-xs font-medium text-primary-700 hover:text-primary-900"
            >
              {toonAfmeldingen ? "Verberg afmeldingen" : "Toon laatste afmeldingen"}
            </button>
            {toonAfmeldingen && (
              <div className="mt-2">
                {afmeldingen.recent.map((a, i) => (
                  <div key={i} className="flex items-center justify-between text-xs py-1.5 border-b border-gray-50 last:border-0">
                    <span className="text-gray-500 truncate">{a.email}</span>
                    <div className="flex items-center gap-2 flex-shrink-0 ml-2">
                      <span className="text-gray-400">
                        {new Date(a.createdAt).toLocaleString("nl-NL", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
                      </span>
                      <span className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-gray-100 text-gray-600">
                        {a.mail === "brief" ? "de brief" : a.mail ? `mail ${a.mail}` : "onbekend"}
                      </span>
                      {a.verliestype && <span className="text-[10px] text-gray-400">{a.verliestype}</span>}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
