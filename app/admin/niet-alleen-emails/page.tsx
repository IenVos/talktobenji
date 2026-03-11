"use client";

import { useState, useEffect } from "react";
import { useAction } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useAdminQuery, useAdminMutation } from "../AdminAuthContext";
import { Mail, Save, CheckCircle, RotateCcw, Send, FlaskConical, UserPlus } from "lucide-react";
import { useMutation } from "convex/react";
import { DEFAULT_TEMPLATES } from "@/convex/emailTemplatesDefaults";

type TemplateKey = "niet_alleen_welkom" | "niet_alleen_dag" | "niet_alleen_dag28" | "niet_alleen_dag30";

const TEMPLATE_META: Record<TemplateKey, { title: string; subtitle: string; knopUrl: string }> = {
  niet_alleen_welkom: {
    title: "Welkomstmail",
    subtitle: "Verstuurd direct na aankoop van Niet Alleen",
    knopUrl: "https://talktobenji.com/niet-alleen",
  },
  niet_alleen_dag: {
    title: "Dagelijkse herinneringsmail",
    subtitle: "Verstuurd elke ochtend op dag 1 t/m 30 — {dag} wordt vervangen door het dagnummer",
    knopUrl: "https://talktobenji.com/niet-alleen",
  },
  niet_alleen_dag28: {
    title: "Dag 28 — voorbereidingsmail",
    subtitle: "Verstuurd op dag 28 (2 dagen voor het einde)",
    knopUrl: "https://talktobenji.com/niet-alleen/ontdek",
  },
  niet_alleen_dag30: {
    title: "Dag 30 — afsluitmail",
    subtitle: "Verstuurd op dag 30 — {dagen} wordt vervangen door het aantal ingevulde dagen",
    knopUrl: "https://talktobenji.com/niet-alleen/ontdek",
  },
};

function TemplateEditor({
  templateKey,
  savedSubject,
  savedBodyText,
  onSave,
}: {
  templateKey: TemplateKey;
  savedSubject: string | undefined;
  savedBodyText: string | undefined;
  onSave: (key: TemplateKey, subject: string, bodyText: string) => Promise<void>;
}) {
  const meta = TEMPLATE_META[templateKey];
  const defaults = DEFAULT_TEMPLATES[templateKey];

  const [subject, setSubject] = useState(savedSubject ?? defaults.subject);
  const [bodyText, setBodyText] = useState(savedBodyText ?? defaults.bodyText);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (savedSubject !== undefined) setSubject(savedSubject);
    if (savedBodyText !== undefined) setBodyText(savedBodyText);
  }, [savedSubject, savedBodyText]);

  const handleSave = async () => {
    setSaving(true);
    setSaved(false);
    try {
      await onSave(templateKey, subject, bodyText);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } finally {
      setSaving(false);
    }
  };

  const handleReset = () => {
    setSubject(defaults.subject);
    setBodyText(defaults.bodyText);
  };

  const isDirty =
    subject !== (savedSubject ?? defaults.subject) ||
    bodyText !== (savedBodyText ?? defaults.bodyText);

  return (
    <div className="bg-white rounded-xl border border-primary-200 p-5 sm:p-6 shadow-sm space-y-4">
      <div className="flex items-start gap-3">
        <div className="w-9 h-9 bg-primary-100 rounded-lg flex items-center justify-center flex-shrink-0 border border-primary-200">
          <Mail className="w-4 h-4 text-primary-600" />
        </div>
        <div>
          <h2 className="text-base font-semibold text-primary-900">{meta.title}</h2>
          <p className="text-xs text-primary-600">{meta.subtitle}</p>
        </div>
      </div>

      <div>
        <label className="block text-xs font-semibold text-gray-600 mb-1">Onderwerp</label>
        <input
          type="text"
          value={subject}
          onChange={(e) => setSubject(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
        />
      </div>

      <div>
        <label className="block text-xs font-semibold text-gray-600 mb-1">
          Inhoud{" "}
          <span className="font-normal text-gray-400">
            (lege regel = nieuwe alinea — de aanhef &quot;Hi [naam],&quot; en de handtekening worden automatisch toegevoegd)
          </span>
        </label>
        <textarea
          value={bodyText}
          onChange={(e) => setBodyText(e.target.value)}
          rows={8}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 resize-y font-mono"
        />
      </div>

      {/* Voorbeeld */}
      <details className="group">
        <summary className="text-xs font-semibold text-primary-600 cursor-pointer hover:text-primary-800 select-none">
          Voorbeeld e-mail
        </summary>
        <div className="mt-3 border border-gray-200 rounded-lg p-4 bg-gray-50 text-sm text-gray-800 space-y-3">
          <p className="text-base">Hi [naam],</p>
          {bodyText.split(/\n\n+/).map((para, i) => (
            <p key={i} className="leading-relaxed text-gray-600">{para}</p>
          ))}
          <div className="my-4">
            <span className="inline-block bg-[#6d84a8] text-white px-6 py-2 rounded-lg text-sm font-semibold">
              {templateKey === "niet_alleen_welkom" ? "Begin dag 1" :
               templateKey === "niet_alleen_dag" ? "Schrijf vandaag" : "Bekijk wat er meer is"}
            </span>
          </div>
          {templateKey === "niet_alleen_dag" ? (
            <p className="font-medium text-gray-500">Benji</p>
          ) : (
            <>
              <p className="text-gray-600">Met warme groet,</p>
              <p className="font-semibold">Ien</p>
              <p className="text-xs text-gray-400">Founder van TalkToBenji</p>
            </>
          )}
        </div>
      </details>

      <div className="flex items-center gap-3 pt-1">
        <button
          onClick={handleSave}
          disabled={saving || !isDirty}
          className="flex items-center gap-2 px-5 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg text-sm font-semibold transition-colors disabled:opacity-50"
        >
          <Save size={15} />
          {saving ? "Opslaan..." : "Opslaan"}
        </button>
        <button
          onClick={handleReset}
          className="flex items-center gap-2 px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <RotateCcw size={14} />
          Standaard
        </button>
        {saved && (
          <span className="flex items-center gap-1 text-sm text-green-600 font-medium">
            <CheckCircle size={15} />
            Opgeslagen
          </span>
        )}
      </div>
    </div>
  );
}

const VERLIES_TYPES_TEST = [
  { key: "persoon", label: "Persoon" },
  { key: "huisdier", label: "Huisdier" },
  { key: "relatie", label: "Scheiding / relatie" },
];

function TestProfielBlok() {
  const maakTestProfiel = useMutation(api.nietAlleen.maakTestProfiel);
  const [email, setEmail] = useState("");
  const [naam, setNaam] = useState("");
  const [verliesType, setVerliesType] = useState("persoon");
  const [dagOffset, setDagOffset] = useState(9);
  const [bezig, setBezig] = useState(false);
  const [resultaat, setResultaat] = useState("");
  const [fout, setFout] = useState("");

  const handleMaak = async () => {
    if (!email || !naam || bezig) return;
    const userId = email; // userId = email zodat getProfile het vindt via email fallback
    setBezig(true);
    setResultaat("");
    setFout("");
    try {
      const res = await maakTestProfiel({ userId, email, naam, verliesType, dagOffset });
      setResultaat(`Profiel ${res}! Ga naar talktobenji.com/niet-alleen om te testen.`);
    } catch (e: any) {
      setFout(e?.message ?? "Onbekende fout");
    } finally {
      setBezig(false);
    }
  };

  return (
    <div className="bg-blue-50 border border-blue-200 rounded-xl p-5 space-y-4">
      <div className="flex items-center gap-2">
        <UserPlus className="w-4 h-4 text-blue-600" />
        <h2 className="text-sm font-semibold text-blue-800">Testprofiel aanmaken</h2>
      </div>
      <p className="text-xs text-blue-700">
        Vul je e-mailadres in. Als er al een profiel bestaat wordt het volledig gereset — dagboek, anker, alles begint opnieuw.
      </p>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-semibold text-gray-600 mb-1">E-mailadres</label>
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)}
            placeholder="jouw@email.nl" className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none" />
        </div>
        <div>
          <label className="block text-xs font-semibold text-gray-600 mb-1">Naam</label>
          <input type="text" value={naam} onChange={(e) => setNaam(e.target.value)}
            placeholder="Voornaam" className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none" />
        </div>
        <div>
          <label className="block text-xs font-semibold text-gray-600 mb-1">Startdag simuleren</label>
          <select value={dagOffset} onChange={(e) => setDagOffset(Number(e.target.value))}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none">
            {[0,1,2,3,4,5,6,7,10,13,14,15,17,18,20,21,25,27,28,29].map(d => (
              <option key={d} value={d}>Dag {d + 1} (gestart {d} dagen geleden)</option>
            ))}
          </select>
        </div>
      </div>
      <div>
        <label className="block text-xs font-semibold text-gray-600 mb-1">Verliestype</label>
        <div className="flex gap-2">
          {VERLIES_TYPES_TEST.map((t) => (
            <button key={t.key} onClick={() => setVerliesType(t.key)}
              className="px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors"
              style={{ background: verliesType === t.key ? "#3b82f6" : "white", color: verliesType === t.key ? "white" : "#6b7280", borderColor: verliesType === t.key ? "#3b82f6" : "#d1d5db" }}>
              {t.label}
            </button>
          ))}
        </div>
      </div>
      <div className="flex items-center gap-3">
        <button onClick={handleMaak} disabled={!email || !naam || bezig}
          className="flex items-center gap-2 px-5 py-2 rounded-lg text-sm font-semibold text-white disabled:opacity-50"
          style={{ background: "#3b82f6" }}>
          <UserPlus size={14} />
          {bezig ? "Bezig…" : "Maak testprofiel"}
        </button>
        {resultaat && <span className="text-sm text-green-600">{resultaat}</span>}
        {fout && <span className="text-sm text-red-600">{fout}</span>}
      </div>
    </div>
  );
}

function TestEmailBlok() {
  const stuurTestEmails = useAction(api.nietAlleen.stuurTestEmails);
  const [email, setEmail] = useState("");
  const [naam, setNaam] = useState("");
  const [verliesType, setVerliesType] = useState("persoon");
  const [bezig, setBezig] = useState(false);
  const [klaar, setKlaar] = useState(false);
  const [fout, setFout] = useState("");

  const handleTest = async () => {
    if (!email || !naam || bezig) return;
    setBezig(true);
    setKlaar(false);
    setFout("");
    try {
      await stuurTestEmails({ email, naam, verliesType });
      setKlaar(true);
      setTimeout(() => setKlaar(false), 5000);
    } catch (e: any) {
      setFout(e?.message ?? "Onbekende fout");
    } finally {
      setBezig(false);
    }
  };

  return (
    <div className="bg-amber-50 border border-amber-200 rounded-xl p-5 space-y-4">
      <div className="flex items-center gap-2">
        <FlaskConical className="w-4 h-4 text-amber-600" />
        <h2 className="text-sm font-semibold text-amber-800">Test — stuur alle 32 emails naar je inbox</h2>
      </div>
      <p className="text-xs text-amber-700">
        Verstuurt de welkomstmail + alle 30 dagelijkse emails + dag 28 voorbereiding + dag 30 afsluiting.
      </p>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-semibold text-gray-600 mb-1">E-mailadres</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="jouw@email.nl"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
          />
        </div>
        <div>
          <label className="block text-xs font-semibold text-gray-600 mb-1">Naam</label>
          <input
            type="text"
            value={naam}
            onChange={(e) => setNaam(e.target.value)}
            placeholder="Voornaam"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
          />
        </div>
      </div>
      <div>
        <label className="block text-xs font-semibold text-gray-600 mb-1">Verliestype</label>
        <div className="flex gap-2">
          {VERLIES_TYPES_TEST.map((t) => (
            <button
              key={t.key}
              onClick={() => setVerliesType(t.key)}
              className="px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors"
              style={{
                background: verliesType === t.key ? "#f59e0b" : "white",
                color: verliesType === t.key ? "white" : "#6b7280",
                borderColor: verliesType === t.key ? "#f59e0b" : "#d1d5db",
              }}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>
      <div className="flex items-center gap-3">
        <button
          onClick={handleTest}
          disabled={!email || !naam || bezig}
          className="flex items-center gap-2 px-5 py-2 rounded-lg text-sm font-semibold text-white transition-colors disabled:opacity-50"
          style={{ background: "#f59e0b" }}
        >
          <Send size={14} />
          {bezig ? "Bezig met versturen (even geduld)…" : "Stuur alle 32 emails"}
        </button>
        {klaar && (
          <span className="flex items-center gap-1 text-sm text-green-600 font-medium">
            <CheckCircle size={15} /> Verstuurd!
          </span>
        )}
        {fout && <span className="text-sm text-red-600">{fout}</span>}
      </div>
    </div>
  );
}

export default function NietAlleenEmailsPage() {
  const templates = useAdminQuery(api.emailTemplates.listTemplates, {});
  const upsertTemplate = useAdminMutation(api.emailTemplates.upsertTemplate);

  const getTemplate = (key: TemplateKey) => templates?.find((t: any) => t.key === key);

  const handleSave = async (key: TemplateKey, subject: string, bodyText: string) => {
    await upsertTemplate({ key, subject, bodyText });
  };

  const keys: TemplateKey[] = ["niet_alleen_welkom", "niet_alleen_dag", "niet_alleen_dag28", "niet_alleen_dag30"];

  return (
    <div className="max-w-3xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Niet Alleen e-mails</h1>
        <p className="text-sm text-gray-500 mt-1">
          Pas de inhoud aan van de automatische e-mails tijdens de 30 dagen begeleiding
        </p>
      </div>

      <TestProfielBlok />
      <TestEmailBlok />

      {keys.map((key) => {
        const t = getTemplate(key);
        return (
          <TemplateEditor
            key={key}
            templateKey={key}
            savedSubject={t?.subject}
            savedBodyText={t?.bodyText}
            onSave={handleSave}
          />
        );
      })}
    </div>
  );
}
