"use client";

import { useState, useEffect } from "react";
import { useAdminQuery, useAdminMutation } from "../AdminAuthContext";
import { api } from "@/convex/_generated/api";
import { Mail, Save, Check } from "lucide-react";

type MailDef = {
  key: string;
  label: string;
  uitleg: string;
  subject: string;
  aanhef: string;
  bodyText: string;
  buttonText: string;
  buttonUrl: string;
};

// De Zij aan Zij mailstroom. Deze staan los van de EH-mails, in dezelfde
// emailTemplates-tabel, met een eigen key-prefix (zaz_).
const ZAZ_MAILS: MailDef[] = [
  {
    key: "zaz_intake_bevestiging",
    label: "Intake ontvangen (bevestiging)",
    uitleg: "Gaat automatisch naar iemand die het intake-formulier heeft ingevuld.",
    subject: "Je bericht is bij me, ik neem contact op",
    aanhef: "Lieve {naam},",
    bodyText:
      "Dank je wel dat je de stap hebt gezet en me je verhaal hebt gestuurd. Dat is niet niks, en ik weet dat.\n\nIk lees alles zelf, rustig, niet even snel tussendoor. Binnen twee werkdagen neem ik contact met je op, zodat we vrijblijvend kunnen kennismaken. In dat gesprek voelen we allebei of Zij aan Zij bij je past. Zo niet, dan denk ik met je mee over wat wel kan. Je zit nergens aan vast.\n\nTot die tijd hoef je niets te doen. En mocht het zwaar worden: Benji is er dag en nacht, op talktobenji.com.\n\nIk spreek je snel.",
    buttonText: "",
    buttonUrl: "",
  },
  {
    key: "zaz_intake_vervolg",
    label: "Vervolg (de volgende stap)",
    uitleg:
      "De vervolgmail nadat je iemand hebt goedgekeurd, met de stap om te beginnen. De knop kun je later naar de betaalpagina laten wijzen.",
    subject: "Zullen we beginnen?",
    aanhef: "Lieve {naam},",
    bodyText:
      "Wat fijn dat we hebben kennisgemaakt. Ik zou het mooi vinden om de komende acht weken naast je te lopen.\n\nOm te beginnen zet je hieronder de stap. Daarna plannen we samen je gesprekken in, verspreid over de acht weken.",
    buttonText: "Ik wil beginnen",
    buttonUrl: "",
  },
];

function MailKaart({ def, saved, onSave }: { def: MailDef; saved: any; onSave: (v: any) => Promise<void> }) {
  const start = {
    subject: saved?.subject ?? def.subject,
    aanhef: saved?.aanhef ?? def.aanhef,
    bodyText: saved?.bodyText ?? def.bodyText,
    buttonText: saved?.buttonText ?? def.buttonText,
    buttonUrl: saved?.buttonUrl ?? def.buttonUrl,
  };
  const [v, setV] = useState(start);
  const [bezig, setBezig] = useState(false);
  const [klaar, setKlaar] = useState(false);
  // herlaad wanneer de opgeslagen data binnenkomt
  useEffect(() => { setV(start); /* eslint-disable-next-line */ }, [saved?._id]);

  async function bewaar() {
    setBezig(true);
    await onSave({ key: def.key, subject: v.subject, bodyText: v.bodyText, aanhef: v.aanhef, buttonText: v.buttonText || undefined, buttonUrl: v.buttonUrl || undefined });
    setBezig(false); setKlaar(true); setTimeout(() => setKlaar(false), 1800);
  }

  return (
    <section className="bg-white border border-gray-200 rounded-2xl p-5 sm:p-6">
      <h2 className="text-base font-bold text-gray-900">{def.label}</h2>
      <p className="text-sm text-gray-500 mb-4">{def.uitleg}</p>

      <div className="space-y-3">
        <label className="block">
          <span className="text-sm font-semibold text-gray-700">Onderwerp</span>
          <input className="mt-1 w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" value={v.subject} onChange={(e) => setV({ ...v, subject: e.target.value })} />
        </label>
        <label className="block">
          <span className="text-sm font-semibold text-gray-700">Aanhef</span>
          <input className="mt-1 w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" value={v.aanhef} onChange={(e) => setV({ ...v, aanhef: e.target.value })} />
          <span className="text-xs text-gray-400">Gebruik {"{naam}"} voor de voornaam.</span>
        </label>
        <label className="block">
          <span className="text-sm font-semibold text-gray-700">Tekst</span>
          <textarea rows={9} className="mt-1 w-full border border-gray-300 rounded-lg px-3 py-2 text-sm leading-relaxed" value={v.bodyText} onChange={(e) => setV({ ...v, bodyText: e.target.value })} />
          <span className="text-xs text-gray-400">Lege regel = nieuwe alinea.</span>
        </label>
        <div className="grid sm:grid-cols-2 gap-3">
          <label className="block">
            <span className="text-sm font-semibold text-gray-700">Knoptekst <span className="text-gray-400 font-normal">(optioneel)</span></span>
            <input className="mt-1 w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" value={v.buttonText} onChange={(e) => setV({ ...v, buttonText: e.target.value })} />
          </label>
          <label className="block">
            <span className="text-sm font-semibold text-gray-700">Knop-link <span className="text-gray-400 font-normal">(optioneel)</span></span>
            <input className="mt-1 w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" placeholder="https://..." value={v.buttonUrl} onChange={(e) => setV({ ...v, buttonUrl: e.target.value })} />
          </label>
        </div>
      </div>

      <button onClick={bewaar} disabled={bezig} className="mt-4 px-4 py-2 bg-emerald-600 text-white text-sm font-semibold rounded-lg hover:bg-emerald-700 disabled:opacity-50 flex items-center gap-1.5">
        {klaar ? <><Check size={15} /> Opgeslagen</> : <><Save size={15} /> {bezig ? "Opslaan..." : "Opslaan"}</>}
      </button>
    </section>
  );
}

export default function ZijAanZijEmails() {
  const templates = useAdminQuery(api.emailTemplates.listTemplates, {}) as any[] | undefined;
  const upsertTemplate = useAdminMutation(api.emailTemplates.upsertTemplate);
  const savedByKey: Record<string, any> = {};
  for (const t of templates ?? []) savedByKey[t.key] = t;

  return (
    <div className="max-w-3xl mx-auto space-y-5 pb-16">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center"><Mail size={20} /></div>
        <div>
          <h1 className="text-xl font-bold text-gray-900">Zij aan Zij e-mails</h1>
          <p className="text-sm text-gray-500">De mails rond het intake-formulier. Wat je hier opslaat, gaat live.</p>
        </div>
      </div>

      {ZAZ_MAILS.map((def) => (
        <MailKaart key={def.key} def={def} saved={savedByKey[def.key]} onSave={(payload) => upsertTemplate(payload)} />
      ))}
    </div>
  );
}
