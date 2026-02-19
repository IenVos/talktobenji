"use client";

import { useState, useEffect } from "react";
import { api } from "@/convex/_generated/api";
import { useAdminQuery, useAdminMutation } from "../AdminAuthContext";
import { Mail, Save, CheckCircle, RotateCcw } from "lucide-react";
import { DEFAULT_TEMPLATES } from "@/convex/emailTemplates";

type TemplateKey = "trial_day5" | "trial_day7";

const TEMPLATE_META: Record<TemplateKey, { title: string; subtitle: string }> = {
  trial_day5: {
    title: "Mail 1 — Nog 2 dagen",
    subtitle: "Verstuurd op dag 5 van de proefperiode (2 dagen voor het einde)",
  },
  trial_day7: {
    title: "Mail 2 — Laatste dag",
    subtitle: "Verstuurd op dag 7 van de proefperiode (laatste dag)",
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

  // Sync when saved values arrive from DB
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

      {/* Subject */}
      <div>
        <label className="block text-xs font-semibold text-gray-600 mb-1">Onderwerp</label>
        <input
          type="text"
          value={subject}
          onChange={(e) => setSubject(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
        />
      </div>

      {/* Body */}
      <div>
        <label className="block text-xs font-semibold text-gray-600 mb-1">
          Inhoud{" "}
          <span className="font-normal text-gray-400">
            (lege regel = nieuwe alinea; de aanhef &quot;Lieve [naam],&quot; en de handtekening worden automatisch toegevoegd)
          </span>
        </label>
        <textarea
          value={bodyText}
          onChange={(e) => setBodyText(e.target.value)}
          rows={8}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 resize-y font-mono"
        />
      </div>

      {/* Preview */}
      <details className="group">
        <summary className="text-xs font-semibold text-primary-600 cursor-pointer hover:text-primary-800 select-none">
          Voorbeeld e-mail
        </summary>
        <div className="mt-3 border border-gray-200 rounded-lg p-4 bg-gray-50 text-sm font-serif text-gray-800 space-y-3">
          <p className="text-base">Lieve [naam],</p>
          {bodyText.split(/\n\n+/).map((para, i) => (
            <p key={i} className="leading-relaxed text-gray-600">
              {para}
            </p>
          ))}
          <div className="my-4 text-center">
            <span className="inline-block bg-[#6d84a8] text-white px-6 py-2 rounded-lg text-sm font-semibold">
              Bekijk de abonnementen
            </span>
          </div>
          <p className="text-gray-600">Met warme groet,</p>
          <p className="font-semibold">Ien</p>
          <p className="text-xs text-gray-400">Founder van TalkToBenji</p>
        </div>
      </details>

      {/* Actions */}
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
          title="Herstel standaardtekst"
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

export default function TrialEmailsPage() {
  const templates = useAdminQuery(api.emailTemplates.listTemplates, {});
  const upsertTemplate = useAdminMutation(api.emailTemplates.upsertTemplate);

  const getTemplate = (key: TemplateKey) =>
    templates?.find((t: any) => t.key === key);

  const handleSave = async (key: TemplateKey, subject: string, bodyText: string) => {
    await upsertTemplate({ key, subject, bodyText });
  };

  return (
    <div className="max-w-3xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Trial e-mails</h1>
        <p className="text-sm text-gray-500 mt-1">
          Pas de inhoud aan van de automatische reminder-mails tijdens de proefperiode
        </p>
      </div>

      {(["trial_day5", "trial_day7"] as TemplateKey[]).map((key) => {
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
