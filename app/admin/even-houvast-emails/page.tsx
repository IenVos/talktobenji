"use client";

import { useState, useEffect } from "react";
import { ChevronDown, ChevronRight, Save, Send } from "lucide-react";
import { api } from "@/convex/_generated/api";
import { DEFAULT_TEMPLATES } from "@/convex/emailTemplatesDefaults";
import { useAdminQuery, useAdminMutation, useAdminAction } from "../AdminAuthContext";

const EH_META: { n: number; titel: string; subtitel: string; defaultDag: number }[] = [
  { n: 1, titel: "Erkenning", subtitel: "Direct na de brief. Geen verkoop, alleen erkenning.", defaultDag: 0 },
  { n: 2, titel: "Normaliseren", subtitel: "Rouw om een huisdier mag er zijn.", defaultDag: 3 },
  { n: 3, titel: "Niet Alleen introduceren", subtitel: "Zacht introduceren. Knop naar de verkoop-LP.", defaultDag: 5 },
  { n: 4, titel: "Verhaal / ervaring", subtitel: "Een echt verhaal. Knop naar de verkoop-LP.", defaultDag: 8 },
  { n: 5, titel: "Uitnodiging met prijs", subtitel: "De uitnodiging. Knop direct naar de checkout.", defaultDag: 11 },
];

function EHMailEditor({
  n, titel, subtitel, defaultDag, saved, onSave, onTest, canTest,
}: {
  n: number;
  titel: string;
  subtitel: string;
  defaultDag: number;
  saved: any;
  onSave: (n: number, f: { subject: string; bodyText: string; buttonText: string; buttonUrl: string; dagOffset: number }) => Promise<void>;
  onTest: (n: number) => Promise<void>;
  canTest: boolean;
}) {
  const def = (DEFAULT_TEMPLATES as any)[`eh_huisdier_${n}`];
  const [open, setOpen] = useState(false);
  const [subject, setSubject] = useState<string>(saved?.subject ?? def.subject);
  const [bodyText, setBodyText] = useState<string>(saved?.bodyText ?? def.bodyText);
  const [buttonText, setButtonText] = useState<string>(saved?.buttonText ?? def.buttonText ?? "");
  const [buttonUrl, setButtonUrl] = useState<string>(saved?.buttonUrl ?? def.buttonUrl ?? "");
  const [dag, setDag] = useState<number>(saved?.dagOffset ?? defaultDag);
  const [status, setStatus] = useState<"idle" | "saving" | "saved">("idle");
  const [testState, setTestState] = useState<"idle" | "sending" | "done" | "error">("idle");

  useEffect(() => {
    setSubject(saved?.subject ?? def.subject);
    setBodyText(saved?.bodyText ?? def.bodyText);
    setButtonText(saved?.buttonText ?? def.buttonText ?? "");
    setButtonUrl(saved?.buttonUrl ?? def.buttonUrl ?? "");
    setDag(saved?.dagOffset ?? defaultDag);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [saved?.subject, saved?.bodyText, saved?.buttonText, saved?.buttonUrl, saved?.dagOffset]);

  const isEdited = !!saved;
  const inputCls = "w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-400";

  const save = async () => {
    setStatus("saving");
    await onSave(n, { subject, bodyText, buttonText, buttonUrl, dagOffset: dag });
    setStatus("saved");
    setTimeout(() => setStatus("idle"), 2000);
  };
  const test = async () => {
    setTestState("sending");
    try { await onTest(n); setTestState("done"); setTimeout(() => setTestState("idle"), 2500); }
    catch { setTestState("error"); }
  };

  return (
    <div className={`border rounded-xl overflow-hidden ${isEdited ? "border-primary-300 bg-primary-50/30" : "border-gray-200 bg-white"}`}>
      <button type="button" onClick={() => setOpen((o) => !o)} className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-gray-50 transition-colors">
        {open ? <ChevronDown size={15} className="text-gray-400 flex-shrink-0" /> : <ChevronRight size={15} className="text-gray-400 flex-shrink-0" />}
        <span className="text-xs font-bold text-gray-500 w-12 flex-shrink-0">Mail {n}</span>
        <span className="text-sm font-medium text-gray-700 flex-1 truncate">{titel}</span>
        <span className="text-[11px] font-medium text-gray-400 flex-shrink-0">dag {dag}</span>
        <span className="text-xs text-gray-400 truncate hidden md:block max-w-[180px]">{subject}</span>
        {isEdited && (
          <span className="flex-shrink-0 text-[10px] font-semibold text-primary-600 bg-primary-100 border border-primary-200 rounded-full px-2 py-0.5">aangepast</span>
        )}
      </button>
      {open && (
        <div className="px-4 pb-4 pt-1 space-y-3 border-t border-gray-100">
          <p className="text-xs text-gray-400 pt-2">{subtitel}</p>
          <div className="flex items-center gap-2">
            <label className="text-xs font-semibold text-gray-600">Verstuur op dag</label>
            <input
              type="number"
              min={0}
              value={dag}
              onChange={(e) => setDag(Math.max(0, parseInt(e.target.value || "0", 10)))}
              className="w-20 px-2 py-1.5 border border-gray-300 rounded-lg text-sm"
            />
            <span className="text-xs text-gray-400">dagen na de brief</span>
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">Onderwerp</label>
            <input value={subject} onChange={(e) => setSubject(e.target.value)} className={inputCls} />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">
              Tekst <span className="font-normal text-gray-400">(gebruik {"{voornaam}"}; handtekening en afmeldlink worden automatisch toegevoegd)</span>
            </label>
            <textarea value={bodyText} onChange={(e) => setBodyText(e.target.value)} rows={10} className={`${inputCls} font-mono leading-relaxed resize-y`} />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">Knoptekst</label>
              <input value={buttonText} onChange={(e) => setButtonText(e.target.value)} className={inputCls} />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">Knop-URL</label>
              <input value={buttonUrl} onChange={(e) => setButtonUrl(e.target.value)} className={inputCls} />
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-3 pt-1">
            <button onClick={save} disabled={status === "saving"} className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg text-sm font-semibold hover:bg-primary-700 disabled:opacity-50">
              <Save size={14} /> {status === "saving" ? "Opslaan…" : status === "saved" ? "Opgeslagen" : "Opslaan"}
            </button>
            <button onClick={test} disabled={!canTest || testState === "sending"} className="flex items-center gap-2 px-3 py-2 text-sm text-primary-700 border border-primary-200 rounded-lg hover:bg-primary-50 disabled:opacity-40">
              <Send size={13} /> {testState === "sending" ? "Versturen…" : "Stuur deze testmail"}
            </button>
            {testState === "done" && <span className="text-sm text-green-600">Verstuurd ✓</span>}
            {testState === "error" && <span className="text-sm text-red-600">Mislukt</span>}
          </div>
          <p className="text-[11px] text-gray-400">Sla eerst op om je wijzigingen mee te testen. De testmail gebruikt de opgeslagen versie.</p>
        </div>
      )}
    </div>
  );
}

export default function EvenHouvastEmailsPage() {
  const templates = useAdminQuery(api.emailTemplates.listTemplates, {});
  const overzicht = useAdminQuery(api.evenHouvastOpvolg.funnelOverzicht, {}) as
    | { email: string; naam: string | null; dagenGeleden: number; laatsteMail: number; afgemeld: boolean; gekocht: boolean }[]
    | undefined;
  const upsertTemplate = useAdminMutation(api.emailTemplates.upsertTemplate);
  const stuurTestEnkel = useAdminAction(api.evenHouvastOpvolg.stuurTestOpvolgEnkel);
  const stuurTestBrief = useAdminAction(api.houvast.stuurTestBrief);
  const verliestypen = useAdminQuery(api.verliesTypen.list, {}) as
    | { code: string; naam: string }[]
    | undefined;
  const [testEmail, setTestEmail] = useState("");
  const [testNaam, setTestNaam] = useState("");
  const [briefType, setBriefType] = useState("huisdier");
  const [briefState, setBriefState] = useState<"idle" | "sending" | "done" | "error">("idle");
  const [toonLijst, setToonLijst] = useState(false);

  const totaal = overzicht?.length ?? 0;
  const gekocht = overzicht?.filter((r) => r.gekocht).length ?? 0;
  const afgemeld = overzicht?.filter((r) => r.afgemeld && !r.gekocht).length ?? 0;
  const lopend = totaal - gekocht - afgemeld;

  const getT = (n: number) => templates?.find((t: any) => t.key === `eh_huisdier_${n}`);
  const save = async (
    n: number,
    f: { subject: string; bodyText: string; buttonText: string; buttonUrl: string; dagOffset: number }
  ) => {
    await upsertTemplate({
      key: `eh_huisdier_${n}`,
      subject: f.subject,
      bodyText: f.bodyText,
      buttonText: f.buttonText || undefined,
      buttonUrl: f.buttonUrl || undefined,
      dagOffset: f.dagOffset,
    });
  };
  const test = async (n: number) => {
    await stuurTestEnkel({ email: testEmail.trim(), naam: testNaam.trim() || undefined, mailNummer: n });
  };
  const canTest = testEmail.includes("@");

  const testBrief = async () => {
    setBriefState("sending");
    try {
      await stuurTestBrief({ email: testEmail.trim(), naam: testNaam.trim() || undefined, verliesType: briefType });
      setBriefState("done");
      setTimeout(() => setBriefState("idle"), 3000);
    } catch {
      setBriefState("error");
    }
  };

  return (
    <div className="max-w-3xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Even Houvast e-mails</h1>
        <p className="text-sm text-gray-500 mt-1">
          De opvolgreeks naar wie Even Houvast (huisdier) deed, richting Niet Alleen. Klap een mail open om de tekst,
          de knop en de verzenddag aan te passen, en stuur 'm los als test. Stopt automatisch als iemand koopt.
          De reeks is <strong>actief</strong>: nieuwe huisdier-leads krijgen de mails automatisch.
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
        {/* Verdeling per mail (alleen lopende leads) */}
        <div className="space-y-1.5">
          {[1, 2, 3, 4, 5].map((n) => {
            const aantal = overzicht?.filter((r) => !r.gekocht && !r.afgemeld && r.laatsteMail === n).length ?? 0;
            const pct = lopend > 0 ? Math.round((aantal / lopend) * 100) : 0;
            return (
              <div key={n} className="flex items-center gap-3 text-xs">
                <span className="w-28 flex-shrink-0 text-gray-600">Laatst: mail {n}</span>
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
                        <span className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-primary-50 text-primary-600">{r.laatsteMail > 0 ? `mail ${r.laatsteMail}` : "wacht"}</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          <input placeholder="Test-e-mail (jouw@email.nl)" value={testEmail} onChange={(e) => setTestEmail(e.target.value)} className="px-3 py-2 border border-amber-200 rounded-lg text-sm" />
          <input placeholder="Voornaam (optioneel)" value={testNaam} onChange={(e) => setTestNaam(e.target.value)} className="px-3 py-2 border border-amber-200 rounded-lg text-sm" />
        </div>
        {/* Testbrief: de brief-mail zelf (met foto's, gedicht en P.S.) */}
        <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-amber-200">
          <span className="text-xs font-semibold text-amber-800 w-full sm:w-auto">Stuur de brief-mail als test:</span>
          <select value={briefType} onChange={(e) => setBriefType(e.target.value)} className="px-3 py-2 border border-amber-200 rounded-lg text-sm bg-white">
            {(verliestypen ?? [{ code: "huisdier", naam: "Huisdier" }]).map((t) => (
              <option key={t.code} value={t.code}>{t.naam}</option>
            ))}
          </select>
          <button
            onClick={testBrief}
            disabled={!canTest || briefState === "sending"}
            className="flex items-center gap-2 px-3 py-2 text-sm text-primary-700 border border-primary-200 rounded-lg hover:bg-primary-50 disabled:opacity-40 bg-white"
          >
            <Send size={13} /> {briefState === "sending" ? "Versturen…" : "Stuur testbrief"}
          </button>
          {briefState === "done" && <span className="text-sm text-green-600">Verstuurd ✓</span>}
          {briefState === "error" && <span className="text-sm text-red-600">Mislukt</span>}
          <p className="text-[11px] text-amber-700 w-full">Voorbeeldbrief met twee voorbeeldfoto's, het gedicht en het P.S., zodat je de hele opmaak ziet. Het gedicht pas je aan bij Pagina's → Even Houvast.</p>
        </div>
      </div>

      <div className="space-y-2">
        {EH_META.map((m) => (
          <EHMailEditor
            key={m.n}
            n={m.n}
            titel={m.titel}
            subtitel={m.subtitel}
            defaultDag={m.defaultDag}
            saved={getT(m.n)}
            onSave={save}
            onTest={test}
            canTest={canTest}
          />
        ))}
      </div>
    </div>
  );
}
