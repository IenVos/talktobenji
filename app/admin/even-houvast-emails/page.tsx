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
  const upsertTemplate = useAdminMutation(api.emailTemplates.upsertTemplate);
  const stuurTestEnkel = useAdminAction(api.evenHouvastOpvolg.stuurTestOpvolgEnkel);
  const [testEmail, setTestEmail] = useState("");
  const [testNaam, setTestNaam] = useState("");

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

  return (
    <div className="max-w-3xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Even Houvast e-mails</h1>
        <p className="text-sm text-gray-500 mt-1">
          De opvolgreeks naar wie Even Houvast (huisdier) deed, richting Niet Alleen. Klap een mail open om de tekst,
          de knop en de verzenddag aan te passen, en stuur 'm los als test. Stopt automatisch als iemand koopt.
          Gaat pas live als de schakelaar <code>EH_OPVOLG_ACTIEF</code> aanstaat.
        </p>
      </div>

      <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 grid grid-cols-1 sm:grid-cols-2 gap-2">
        <input placeholder="Test-e-mail (jouw@email.nl)" value={testEmail} onChange={(e) => setTestEmail(e.target.value)} className="px-3 py-2 border border-amber-200 rounded-lg text-sm" />
        <input placeholder="Voornaam (optioneel)" value={testNaam} onChange={(e) => setTestNaam(e.target.value)} className="px-3 py-2 border border-amber-200 rounded-lg text-sm" />
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
