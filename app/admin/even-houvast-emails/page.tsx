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
  { n: 6, titel: "Benji voorstellen", subtitel: "Maak kennis met Benji: 7 dagen gratis, één klik. Geen verkoop.", defaultDag: 2 },
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
  n, type, titel, subtitel, dag, saved, onSave, onTest, canTest, onUploadImage,
}: {
  n: number;
  type: string;
  titel: string;
  subtitel: string;
  dag: number; // read-only: komt uit het centrale verzendschema (geldt voor alle types)
  saved: any;
  onSave: (n: number, f: { subject: string; bodyText: string; buttonText: string; buttonUrl: string; imageUrl: string; imageCaption: string }) => Promise<void>;
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [saved?.subject, saved?.bodyText, saved?.buttonText, saved?.buttonUrl, saved?.imageUrl, saved?.imageCaption]);

  const isEdited = !!saved;
  const inputCls = "w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-400";

  const save = async () => {
    setStatus("saving");
    await onSave(n, { subject, bodyText, buttonText, buttonUrl, imageUrl, imageCaption });
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
          <p className="text-xs text-gray-500 bg-gray-50 border border-gray-200 rounded-lg px-3 py-2">
            Verzenddag: <strong>dag {dag}</strong> na de brief. De verzenddagen stel je centraal in
            (bovenaan, geldt voor alle verliestypes), niet per mail.
          </p>
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

// Eén centraal verzendschema voor de hele funnel (alle verliestypes tegelijk).
function VerzendSchemaPaneel({ schema, onSave }: {
  schema: { mail1: number; mail2: number; mail3: number; mail4: number; mail5: number; mail6: number; ondergrens: number } | undefined;
  onSave: (w: { mail1: number; mail2: number; mail3: number; mail4: number; mail5: number; mail6: number }) => Promise<void>;
}) {
  const [waarden, setWaarden] = useState<Record<number, number>>({});
  const [status, setStatus] = useState<"idle" | "saving" | "saved">("idle");
  useEffect(() => {
    if (schema) setWaarden({ 1: schema.mail1, 2: schema.mail2, 3: schema.mail3, 4: schema.mail4, 5: schema.mail5, 6: schema.mail6 });
  }, [schema?.mail1, schema?.mail2, schema?.mail3, schema?.mail4, schema?.mail5, schema?.mail6]);

  const zet = (n: number, val: string) => setWaarden((w) => ({ ...w, [n]: Math.max(0, parseInt(val || "0", 10)) }));
  const opslaan = async () => {
    setStatus("saving");
    await onSave({ mail1: waarden[1], mail2: waarden[2], mail3: waarden[3], mail4: waarden[4], mail5: waarden[5], mail6: waarden[6] });
    setStatus("saved");
    setTimeout(() => setStatus("idle"), 2000);
  };
  const ondergrens = schema?.ondergrens ?? 2;
  const teVroeg = EH_META.some((m) => (waarden[m.n] ?? 99) < ondergrens);
  const gesorteerd = [...EH_META].sort((a, b) => (waarden[a.n] ?? a.defaultDag) - (waarden[b.n] ?? b.defaultDag));

  return (
    <div className="bg-white rounded-xl border border-primary-200 p-4 space-y-3">
      <div>
        <h2 className="text-sm font-bold text-gray-800">Verzendschema — geldt voor alle verliestypes</h2>
        <p className="text-xs text-gray-500 mt-0.5">
          Op welke dag na de brief elke mail vertrekt. Dit is de enige plek waar je de timing instelt; per mail kun je het niet meer verzetten.
        </p>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {EH_META.map((m, idx) => (
          <div key={m.n} className="flex items-center gap-2">
            <span className="text-xs text-gray-600 flex-1 truncate">Mail {idx + 1} · {m.titel}</span>
            <div className="flex items-center gap-1">
              <span className="text-[11px] text-gray-400">dag</span>
              <input
                type="number"
                min={0}
                value={waarden[m.n] ?? ""}
                onChange={(e) => zet(m.n, e.target.value)}
                className="w-14 px-2 py-1.5 border border-gray-300 rounded-lg text-sm"
              />
            </div>
          </div>
        ))}
      </div>
      {teVroeg && (
        <p className="text-xs text-amber-700">
          Een dag onder {ondergrens}: de hele reeks schuift automatisch op, zodat niemand een mail krijgt op de dag van de brief zelf.
        </p>
      )}
      <div className="flex flex-wrap items-center gap-3">
        <button
          onClick={opslaan}
          disabled={status === "saving" || !schema}
          className="flex items-center gap-2 px-3 py-2 text-sm bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-40"
        >
          <Save size={14} /> {status === "saving" ? "Opslaan…" : "Verzendschema opslaan"}
        </button>
        {status === "saved" && <span className="text-sm text-green-600">Opgeslagen ✓</span>}
        <span className="text-xs text-gray-400">
          Volgorde: {gesorteerd.map((m) => `dag ${waarden[m.n] ?? m.defaultDag}`).join(" · ")}
        </span>
      </div>
    </div>
  );
}

// Compacte editor voor de voorwaardelijke brief-klikker "kom terug"-mail. Vaste
// template-sleutel (geen type/nummer), geen afbeelding, geen knop-URL (die wordt
// automatisch de persoonlijke Benji-link).
function BriefKomTerugEditor({ saved, onSave, onTest, canTest }: {
  saved: any;
  onSave: (f: { subject: string; bodyText: string; buttonText: string }) => Promise<void>;
  onTest: () => Promise<void>;
  canTest: boolean;
}) {
  const def = (DEFAULT_TEMPLATES as any)["eh_brief_kom_terug"] ?? {};
  const [open, setOpen] = useState(false);
  const [subject, setSubject] = useState<string>(saved?.subject ?? def.subject ?? "");
  const [bodyText, setBodyText] = useState<string>(saved?.bodyText ?? def.bodyText ?? "");
  const [buttonText, setButtonText] = useState<string>(saved?.buttonText ?? def.buttonText ?? "");
  const [status, setStatus] = useState<"idle" | "saving" | "saved">("idle");
  const [testState, setTestState] = useState<"idle" | "sending" | "done" | "error">("idle");
  const [testError, setTestError] = useState("");
  useEffect(() => {
    setSubject(saved?.subject ?? def.subject ?? "");
    setBodyText(saved?.bodyText ?? def.bodyText ?? "");
    setButtonText(saved?.buttonText ?? def.buttonText ?? "");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [saved?.subject, saved?.bodyText, saved?.buttonText]);
  const inputCls = "w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-400";
  const isEdited = !!saved;
  const save = async () => { setStatus("saving"); await onSave({ subject, bodyText, buttonText }); setStatus("saved"); setTimeout(() => setStatus("idle"), 2000); };
  const test = async () => { setTestState("sending"); setTestError(""); try { await onTest(); setTestState("done"); setTimeout(() => setTestState("idle"), 2500); } catch (e: any) { setTestError(e?.message ?? "Onbekende fout"); setTestState("error"); } };
  return (
    <div className={`border rounded-xl overflow-hidden ${isEdited ? "border-primary-300 bg-primary-50/30" : "border-amber-300 bg-amber-50/40"}`}>
      <button type="button" onClick={() => setOpen((o) => !o)} className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-gray-50 transition-colors">
        {open ? <ChevronDown size={15} className="text-gray-400 flex-shrink-0" /> : <ChevronRight size={15} className="text-gray-400 flex-shrink-0" />}
        <span className="text-sm font-medium text-gray-700 flex-1 truncate">Brief-opvolg: kom terug</span>
        <span className="flex-shrink-0 text-[10px] font-semibold text-amber-700 bg-amber-100 border border-amber-200 rounded-full px-2 py-0.5">na brief-klik</span>
        {isEdited && <span className="flex-shrink-0 text-[10px] font-semibold text-primary-600 bg-primary-100 border border-primary-200 rounded-full px-2 py-0.5">aangepast</span>}
      </button>
      {open && (
        <div className="px-4 pb-4 pt-1 space-y-3 border-t border-gray-100">
          <p className="text-xs text-gray-500 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
            Voorwaardelijke mail: gaat op <strong>dag 3</strong>, in plaats van de &ldquo;Benji voorstellen&rdquo;-mail, voor wie de brief-link al gebruikte (die kennen Benji al). <strong>Staat nog uit</strong> tot de gespreks-privacy live is (de tekst belooft &ldquo;alleen jij en Benji&rdquo;). De knop wordt automatisch een persoonlijke Benji-link.
          </p>
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">Onderwerp</label>
            <input value={subject} onChange={(e) => setSubject(e.target.value)} className={inputCls} />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">Tekst <span className="font-normal text-gray-400">(gebruik {"{voornaam}"}; handtekening, knop en afmeldlink komen automatisch)</span></label>
            <textarea value={bodyText} onChange={(e) => setBodyText(e.target.value)} rows={12} className={`${inputCls} font-mono leading-relaxed resize-y`} />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">Knoptekst</label>
            <input value={buttonText} onChange={(e) => setButtonText(e.target.value)} className={inputCls} />
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button onClick={save} disabled={status === "saving"} className="px-4 py-2 text-sm bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50">{status === "saving" ? "Opslaan…" : status === "saved" ? "Opgeslagen ✓" : "Opslaan"}</button>
            <button onClick={test} disabled={!canTest || testState === "sending"} className="flex items-center gap-2 px-3 py-2 text-sm text-primary-700 border border-primary-200 rounded-lg hover:bg-primary-50 disabled:opacity-40 bg-white"><Send size={13} /> {testState === "sending" ? "Versturen…" : "Stuur testmail"}</button>
            {testState === "done" && <span className="text-sm text-green-600">Verstuurd ✓</span>}
            {testState === "error" && <span className="text-sm text-red-600">Mislukt</span>}
            {testState === "error" && testError && <p className="text-[11px] text-red-500 w-full break-words">{testError}</p>}
          </div>
        </div>
      )}
    </div>
  );
}

export default function EvenHouvastEmailsPage() {
  const templates = useAdminQuery(api.emailTemplates.listTemplates, {});
  const upsertTemplate = useAdminMutation(api.emailTemplates.upsertTemplate);
  const verzendSchema = useAdminQuery(api.evenHouvastOpvolg.getVerzendSchema, {}) as
    | { mail1: number; mail2: number; mail3: number; mail4: number; mail5: number; mail6: number; ondergrens: number }
    | undefined;
  const setVerzendSchema = useAdminMutation(api.evenHouvastOpvolg.setVerzendSchema);
  const stuurTestEnkel = useAdminAction(api.evenHouvastOpvolg.stuurTestOpvolgEnkel);
  const stuurTestBrief = useAdminAction(api.houvast.stuurTestBrief);
  const stuurTestBriefKomTerug = useAdminAction(api.evenHouvastOpvolg.stuurTestBriefKomTerug);
  const generateUploadUrl = useAdminMutation(api.pageContent.generateUploadUrl);
  const getImageUrl = useAdminMutation(api.pageContent.getImageUrl);
  const verliestypen = useAdminQuery(api.verliesTypen.list, {}) as
    | { code: string; naam: string }[]
    | undefined;
  const [testEmail, setTestEmail] = useState("annadelapierre@icloud.com");
  const [testNaam, setTestNaam] = useState("Ien");
  const [bewerkType, setBewerkType] = useState("huisdier");
  const [briefType, setBriefType] = useState("huisdier");
  const [briefState, setBriefState] = useState<"idle" | "sending" | "done" | "error">("idle");
  const [testMailNr, setTestMailNr] = useState<number>(EH_META[0].n);
  const [opvolgState, setOpvolgState] = useState<"idle" | "sending" | "done" | "error">("idle");
  const [opvolgError, setOpvolgError] = useState("");

  const getT = (n: number) => templates?.find((t: any) => t.key === `eh_${bewerkType}_${n}`);
  // Verzenddag per intern mailnummer, uit het centrale schema (val terug op de default).
  const dagVanMail = (n: number): number =>
    (verzendSchema as any)?.[`mail${n}`] ?? EH_META.find((m) => m.n === n)?.defaultDag ?? 0;
  const save = async (
    n: number,
    f: { subject: string; bodyText: string; buttonText: string; buttonUrl: string; imageUrl: string; imageCaption: string }
  ) => {
    await upsertTemplate({
      key: `eh_${bewerkType}_${n}`,
      subject: f.subject,
      bodyText: f.bodyText,
      // Leeg = bewust weg (bewaar als ""). NIET omzetten naar undefined, want dan valt
      // zowel de editor als de mailrender terug op de default (saved?.X ?? def.X) en
      // komt een weggehaalde knop, link of afbeelding weer terug. Geldt voor alle
      // EH-mails en alle verliestypes (ze delen deze opslagfunctie).
      buttonText: f.buttonText,
      buttonUrl: f.buttonUrl,
      imageUrl: f.imageUrl,
      imageCaption: f.imageCaption,
      // dagOffset niet meer meesturen: de timing komt uit het centrale verzendschema.
    });
  };
  const test = async (n: number) => {
    await stuurTestEnkel({ email: testEmail.trim(), naam: testNaam.trim() || undefined, mailNummer: n, type: bewerkType });
  };
  const canTest = testEmail.includes("@");

  // Brief-klikker "kom terug"-mail (voorwaardelijk, geen dag-reeks).
  const briefKomTerugSaved = templates?.find((t: any) => t.key === "eh_brief_kom_terug");
  const saveBriefKomTerug = async (f: { subject: string; bodyText: string; buttonText: string }) => {
    await upsertTemplate({
      key: "eh_brief_kom_terug",
      subject: f.subject,
      bodyText: f.bodyText,
      buttonText: f.buttonText,
      buttonUrl: "", // knop wordt automatisch de persoonlijke Benji-link
    });
  };
  const testBriefKomTerug = async () => {
    await stuurTestBriefKomTerug({ email: testEmail.trim(), naam: testNaam.trim() || undefined, type: bewerkType });
  };

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
          De opvolgreeks naar wie Even Houvast deed, richting Niet Alleen. De <strong>verzenddagen</strong> stel je één keer centraal in
          (hieronder), gelijk voor alle types. De <strong>tekst</strong> is per verliestype (kies verderop); leads zonder gekozen type
          krijgen de <strong>algemene</strong> reeks. Klap een mail open om de tekst en de knop aan te passen, en stuur 'm los als test.
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
              <option key={m.n} value={m.n}>Mail {idx + 1} — {m.titel} (dag {dagVanMail(m.n)})</option>
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

      {/* Centraal verzendschema: één set dagen voor alle verliestypes */}
      <VerzendSchemaPaneel
        schema={verzendSchema}
        onSave={(w) => setVerzendSchema(w)}
      />

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
            dag={dagVanMail(m.n)}
            saved={getT(m.n)}
            onSave={save}
            onTest={test}
            canTest={canTest}
            onUploadImage={uploadImage}
          />
        ))}
      </div>

      {/* Voorwaardelijke mail buiten de dag-reeks: brief-klikkers ~1 dag na hun klik. */}
      <div className="mt-6 pt-5 border-t border-gray-200 space-y-2">
        <h2 className="text-sm font-bold text-gray-700">Losse mail (geen dag-reeks)</h2>
        <BriefKomTerugEditor
          saved={briefKomTerugSaved}
          onSave={saveBriefKomTerug}
          onTest={testBriefKomTerug}
          canTest={canTest}
        />
      </div>
    </div>
  );
}
