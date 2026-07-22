"use client";

import { useState, useEffect } from "react";
import { ChevronDown, ChevronRight, Save, Send, Upload } from "lucide-react";
import { api } from "@/convex/_generated/api";
import { DEFAULT_TEMPLATES } from "@/convex/emailTemplatesDefaults";
import { useAdminQuery, useAdminMutation, useAdminAction } from "../AdminAuthContext";

// Volgorde = chronologisch (op dag). Deze lijst staat al in verzendvolgorde.
// Let op: het interne mailnummer (n) is NIET de leesvolgorde. Mail 6 ("Wie ik ben")
// is later toegevoegd, valt chronologisch als 2e mail. Daarom tonen we overal de
// leesvolgorde (positie 1..6), niet het interne nummer. Het interne nummer blijft
// alleen de sleutel achter de schermen (templates + verzendlogboek), niks daaraan
// verandert. Zie ook convex/evenHouvastOpvolg.ts (SCHEMA).
const EH_META: { n: number; titel: string; subtitel: string; defaultDag: number }[] = [
  { n: 1, titel: "Erkenning", subtitel: "Direct na de brief. Geen verkoop, alleen erkenning.", defaultDag: 0 },
  { n: 6, titel: "Wie ik ben", subtitel: "Persoonlijk: Ien stelt zich voor (verhaal Zoro). Geen verkoop.", defaultDag: 2 },
  { n: 2, titel: "Normaliseren", subtitel: "Rouw om een huisdier mag er zijn.", defaultDag: 3 },
  { n: 3, titel: "Niet Alleen introduceren", subtitel: "Zacht introduceren. Knop naar de verkoop-LP.", defaultDag: 5 },
  { n: 4, titel: "Verhaal / ervaring", subtitel: "Een echt verhaal. Knop naar de verkoop-LP.", defaultDag: 8 },
  { n: 5, titel: "Uitnodiging met prijs", subtitel: "De uitnodiging. Knop direct naar de checkout.", defaultDag: 11 },
];

// Leesvolgorde (1..6) op basis van de chronologische EH_META-volgorde. Vertaalt een
// intern mailnummer naar de plek waarop de lezer de mail krijgt.
const positieVanMail = (n: number) => EH_META.findIndex((m) => m.n === n) + 1;

// Verliestypes met een eigen reeks. "algemeen" = leads die geen type kozen.
const EH_TYPE_TABS: { code: string; naam: string }[] = [
  { code: "persoon", naam: "Persoon" },
  { code: "huisdier", naam: "Huisdier" },
  { code: "scheiding", naam: "Scheiding" },
  { code: "eenzaamheid", naam: "Eenzaamheid" },
  { code: "kinderloos", naam: "Kinderloos" },
  { code: "algemeen", naam: "Algemeen (geen type)" },
];

function EHMailEditor({
  n, type, titel, subtitel, defaultDag, saved, onSave, onTest, canTest, onUploadImage,
}: {
  n: number;
  type: string;
  titel: string;
  subtitel: string;
  defaultDag: number;
  saved: any;
  onSave: (n: number, f: { subject: string; bodyText: string; buttonText: string; buttonUrl: string; imageUrl: string; imageCaption: string; dagOffset: number }) => Promise<void>;
  onTest: (n: number) => Promise<void>;
  canTest: boolean;
  onUploadImage: (file: File) => Promise<string | null>;
}) {
  const def = (DEFAULT_TEMPLATES as any)[`eh_${type}_${n}`] ?? {};
  const [open, setOpen] = useState(false);
  const [subject, setSubject] = useState<string>(saved?.subject ?? def.subject);
  const [bodyText, setBodyText] = useState<string>(saved?.bodyText ?? def.bodyText);
  const [buttonText, setButtonText] = useState<string>(saved?.buttonText ?? def.buttonText ?? "");
  const [buttonUrl, setButtonUrl] = useState<string>(saved?.buttonUrl ?? def.buttonUrl ?? "");
  const [imageUrl, setImageUrl] = useState<string>(saved?.imageUrl ?? def.imageUrl ?? "");
  const [imageCaption, setImageCaption] = useState<string>(saved?.imageCaption ?? def.imageCaption ?? "");
  const [dag, setDag] = useState<number>(saved?.dagOffset ?? defaultDag);
  const [status, setStatus] = useState<"idle" | "saving" | "saved">("idle");
  const [testState, setTestState] = useState<"idle" | "sending" | "done" | "error">("idle");
  const [testError, setTestError] = useState("");
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    setSubject(saved?.subject ?? def.subject);
    setBodyText(saved?.bodyText ?? def.bodyText);
    setButtonText(saved?.buttonText ?? def.buttonText ?? "");
    setButtonUrl(saved?.buttonUrl ?? def.buttonUrl ?? "");
    setImageUrl(saved?.imageUrl ?? def.imageUrl ?? "");
    setImageCaption(saved?.imageCaption ?? def.imageCaption ?? "");
    setDag(saved?.dagOffset ?? defaultDag);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [saved?.subject, saved?.bodyText, saved?.buttonText, saved?.buttonUrl, saved?.imageUrl, saved?.imageCaption, saved?.dagOffset]);

  const isEdited = !!saved;
  const inputCls = "w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-400";

  const save = async () => {
    setStatus("saving");
    await onSave(n, { subject, bodyText, buttonText, buttonUrl, imageUrl, imageCaption, dagOffset: dag });
    setStatus("saved");
    setTimeout(() => setStatus("idle"), 2000);
  };
  const test = async () => {
    setTestState("sending");
    setTestError("");
    try { await onTest(n); setTestState("done"); setTimeout(() => setTestState("idle"), 2500); }
    catch (e: any) { setTestError(e?.message ?? "Onbekende fout"); setTestState("error"); }
  };

  return (
    <div className={`border rounded-xl overflow-hidden ${isEdited ? "border-primary-300 bg-primary-50/30" : "border-gray-200 bg-white"}`}>
      <button type="button" onClick={() => setOpen((o) => !o)} className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-gray-50 transition-colors">
        {open ? <ChevronDown size={15} className="text-gray-400 flex-shrink-0" /> : <ChevronRight size={15} className="text-gray-400 flex-shrink-0" />}
        <span className="text-xs font-bold text-gray-500 w-12 flex-shrink-0">Mail {positieVanMail(n)}</span>
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
              min={2}
              value={dag}
              onChange={(e) => setDag(Math.max(0, parseInt(e.target.value || "0", 10)))}
              className="w-20 px-2 py-1.5 border border-gray-300 rounded-lg text-sm"
            />
            <span className="text-xs text-gray-400">dagen na de brief</span>
            {dag < 2 && (
              <span className="text-xs text-amber-700">
                Te vroeg: de reeks schuift automatisch op, zodat niemand een opvolgmail
                krijgt op de dag van de brief zelf.
              </span>
            )}
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
            <p className="text-[11px] text-gray-400 mt-1">
              Tip: zet <code className="bg-gray-100 px-1 rounded">[afbeelding]</code> op een eigen regel om de afbeelding hieronder midden in de tekst te tonen. Een afsluitgroet als &ldquo;Lieve groet&rdquo; op de laatste regel komt automatisch onder de knop, vlak boven Ien&rsquo;s naam.
            </p>
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
          <div className="rounded-lg border border-gray-200 bg-gray-50/60 p-3 space-y-3">
            <p className="text-xs font-semibold text-gray-600">Afbeelding</p>
            <p className="text-[11px] text-gray-400 -mt-1">Upload een afbeelding of plak een directe URL. Zonder <code className="bg-gray-100 px-1 rounded">[afbeelding]</code>-marker verschijnt hij als klikbare cover boven de knop (linkt naar de Knop-URL). Zet je de marker in de tekst, dan staat hij groter, midden in de mail op die plek (niet klikbaar). Een embed/iframe werkt niet in e-mail.</p>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">Afbeelding</label>
              <div className="flex flex-wrap items-center gap-2">
                <input value={imageUrl} onChange={(e) => setImageUrl(e.target.value)} placeholder="https://… (of upload hiernaast)" className={`${inputCls} flex-1 min-w-[180px]`} />
                <label className={`flex items-center gap-2 px-3 py-2 text-sm rounded-lg border cursor-pointer ${uploading ? "opacity-50 border-gray-200" : "border-primary-200 text-primary-700 hover:bg-primary-50"}`}>
                  <Upload size={13} /> {uploading ? "Uploaden…" : "Upload"}
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    disabled={uploading}
                    onChange={async (e) => {
                      const file = e.target.files?.[0];
                      if (!file) return;
                      setUploading(true);
                      try {
                        const url = await onUploadImage(file);
                        if (url) setImageUrl(url);
                      } finally {
                        setUploading(false);
                        e.target.value = "";
                      }
                    }}
                  />
                </label>
                {imageUrl && (
                  <button type="button" onClick={() => setImageUrl("")} className="text-xs text-gray-400 hover:text-red-500">Verwijderen</button>
                )}
              </div>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">Bijschrift onder de afbeelding (optioneel)</label>
              <input value={imageCaption} onChange={(e) => setImageCaption(e.target.value)} placeholder="Bijv. Woorden die je omarmen, open het boekje" className={inputCls} />
            </div>
            {imageUrl && (
              <img src={imageUrl} alt="" className="max-w-[180px] rounded-lg border border-gray-200" />
            )}
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
          {testState === "error" && testError && (
            <p className="text-[11px] text-red-500 break-words">{testError}</p>
          )}
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
  const stuurTestBrief = useAdminAction(api.houvast.stuurTestBrief);
  const generateUploadUrl = useAdminMutation(api.pageContent.generateUploadUrl);
  const getImageUrl = useAdminMutation(api.pageContent.getImageUrl);
  const verliestypen = useAdminQuery(api.verliesTypen.list, {}) as
    | { code: string; naam: string }[]
    | undefined;
  const [testEmail, setTestEmail] = useState("");
  const [testNaam, setTestNaam] = useState("");
  const [bewerkType, setBewerkType] = useState("huisdier");
  const [briefType, setBriefType] = useState("huisdier");
  const [briefState, setBriefState] = useState<"idle" | "sending" | "done" | "error">("idle");
  const [testMailNr, setTestMailNr] = useState<number>(EH_META[0].n);
  const [opvolgState, setOpvolgState] = useState<"idle" | "sending" | "done" | "error">("idle");
  const [opvolgError, setOpvolgError] = useState("");

  const getT = (n: number) => templates?.find((t: any) => t.key === `eh_${bewerkType}_${n}`);
  const save = async (
    n: number,
    f: { subject: string; bodyText: string; buttonText: string; buttonUrl: string; imageUrl: string; imageCaption: string; dagOffset: number }
  ) => {
    await upsertTemplate({
      key: `eh_${bewerkType}_${n}`,
      subject: f.subject,
      bodyText: f.bodyText,
      buttonText: f.buttonText || undefined,
      buttonUrl: f.buttonUrl || undefined,
      imageUrl: f.imageUrl || undefined,
      imageCaption: f.imageCaption || undefined,
      dagOffset: f.dagOffset,
    });
  };
  const test = async (n: number) => {
    await stuurTestEnkel({ email: testEmail.trim(), naam: testNaam.trim() || undefined, mailNummer: n, type: bewerkType });
  };
  const canTest = testEmail.includes("@");

  // Testmail van een gekozen opvolgmail (via de dropdown), met zichtbare fout.
  const testOpvolg = async () => {
    setOpvolgState("sending");
    setOpvolgError("");
    try {
      await stuurTestEnkel({ email: testEmail.trim(), naam: testNaam.trim() || undefined, mailNummer: testMailNr, type: bewerkType });
      setOpvolgState("done");
      setTimeout(() => setOpvolgState("idle"), 3000);
    } catch (e: any) {
      setOpvolgError(e?.message ?? "Onbekende fout");
      setOpvolgState("error");
    }
  };

  // Upload een afbeelding naar Convex storage en geef de publieke URL terug.
  const uploadImage = async (file: File): Promise<string | null> => {
    const url = await generateUploadUrl();
    const res = await fetch(url, { method: "POST", body: file, headers: { "Content-Type": file.type } });
    const { storageId } = await res.json();
    return await getImageUrl({ storageId });
  };

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
          De opvolgreeks naar wie Even Houvast deed, richting Niet Alleen. Er is een reeks <strong>per verliestype</strong>
          (kies hieronder); leads zonder gekozen type krijgen de <strong>algemene</strong> reeks. Klap een mail open om de tekst,
          de knop en de verzenddag aan te passen, en stuur 'm los als test. Stopt automatisch als iemand koopt.
        </p>
      </div>

      <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          <input placeholder="Test-e-mail (jouw@email.nl)" value={testEmail} onChange={(e) => setTestEmail(e.target.value)} className="px-3 py-2 border border-amber-200 rounded-lg text-sm" />
          <input placeholder="Voornaam (optioneel)" value={testNaam} onChange={(e) => setTestNaam(e.target.value)} className="px-3 py-2 border border-amber-200 rounded-lg text-sm" />
        </div>
        {/* Testmail van een opvolgmail: kies welke mail en stuur 'm los */}
        <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-amber-200">
          <span className="text-xs font-semibold text-amber-800 w-full sm:w-auto">Stuur een opvolgmail als test:</span>
          <select value={testMailNr} onChange={(e) => setTestMailNr(Number(e.target.value))} className="px-3 py-2 border border-amber-200 rounded-lg text-sm bg-white">
            {EH_META.map((m, idx) => (
              <option key={m.n} value={m.n}>Mail {idx + 1} — {m.titel} (dag {m.defaultDag})</option>
            ))}
          </select>
          <button
            onClick={testOpvolg}
            disabled={!canTest || opvolgState === "sending"}
            className="flex items-center gap-2 px-3 py-2 text-sm text-primary-700 border border-primary-200 rounded-lg hover:bg-primary-50 disabled:opacity-40 bg-white"
          >
            <Send size={13} /> {opvolgState === "sending" ? "Versturen…" : "Stuur testmail"}
          </button>
          {opvolgState === "done" && <span className="text-sm text-green-600">Verstuurd ✓</span>}
          {opvolgState === "error" && <span className="text-sm text-red-600">Mislukt</span>}
          {opvolgState === "error" && opvolgError && (
            <p className="text-[11px] text-red-500 w-full break-words">{opvolgError}</p>
          )}
          <p className="text-[11px] text-amber-700 w-full">Stuurt de opgeslagen versie van de gekozen mail. Vul hierboven een test-e-mail in.</p>
        </div>

        {/* Testbrief: de brief-mail zelf (met foto's, gedicht en P.S.) */}
        <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-amber-200">
          <span className="text-xs font-semibold text-amber-800 w-full sm:w-auto">Stuur de brief-mail als test:</span>
          <select value={briefType} onChange={(e) => setBriefType(e.target.value)} className="px-3 py-2 border border-amber-200 rounded-lg text-sm bg-white">
            {(verliestypen ?? [{ code: "huisdier", naam: "Huisdier" }]).map((t) => (
              <option key={t.code} value={t.code}>{t.naam}</option>
            ))}
            <option value="algemeen">Algemeen (geen type)</option>
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

      {/* Verliestype-keuze: per type een eigen reeks bewerken/testen */}
      <div className="bg-white rounded-xl border border-gray-200 p-3 flex flex-wrap items-center gap-2">
        <span className="text-xs font-medium text-gray-500 w-full sm:w-auto mr-1">Reeks voor:</span>
        {EH_TYPE_TABS.map((t) => (
          <button
            key={t.code}
            type="button"
            onClick={() => setBewerkType(t.code)}
            className={`text-sm px-3.5 py-1.5 rounded-full font-medium transition-colors ${bewerkType === t.code ? "bg-primary-600 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`}
          >
            {t.naam}
          </button>
        ))}
      </div>

      <div className="space-y-2">
        {EH_META.map((m) => (
          <EHMailEditor
            key={`${bewerkType}-${m.n}`}
            n={m.n}
            type={bewerkType}
            titel={m.titel}
            subtitel={m.subtitel}
            defaultDag={m.defaultDag}
            saved={getT(m.n)}
            onSave={save}
            onTest={test}
            canTest={canTest}
            onUploadImage={uploadImage}
          />
        ))}
      </div>
    </div>
  );
}
