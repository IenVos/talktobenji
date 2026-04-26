"use client";

import { useState, useEffect } from "react";
import { api } from "@/convex/_generated/api";
import { useAdminQuery, useAdminMutation } from "../AdminAuthContext";
import { ChevronDown, ChevronRight, Save, CheckCircle, RotateCcw } from "lucide-react";
import { DEFAULT_TEMPLATES } from "@/convex/emailTemplates";

type TemplateKey =
  | "trial_day5" | "trial_day7"
  | "renewal_jaar_1" | "renewal_jaar_2" | "renewal_jaar_3"
  | "renewal_kwartaal_1" | "renewal_kwartaal_2" | "renewal_kwartaal_3"
  | "renewal_maand_1" | "renewal_maand_2" | "renewal_maand_3";

const SECTIONS = [
  {
    id: "trial",
    label: "Trial emails",
    subtitle: "Automatisch verstuurd tijdens de 7-daagse proefperiode",
    emails: [
      { key: "trial_day5" as TemplateKey, title: "Mail 1 — Dag 5", subtitle: "Verstuurd op dag 5 (2 dagen voor het einde)" },
      { key: "trial_day7" as TemplateKey, title: "Mail 2 — Dag 7", subtitle: "Verstuurd op de laatste dag van de proefperiode" },
    ],
  },
  {
    id: "renewal_jaar",
    label: "Verlengingsmails — Jaar",
    subtitle: "Mail 1 op 30 dagen voor afloop · Mail 2 op 15 dagen · Mail 3 op de laatste dag",
    emails: [
      { key: "renewal_jaar_1" as TemplateKey, title: "Mail 1 — 30 dagen voor afloop", subtitle: "Gebruik {einddatum} en {naam}" },
      { key: "renewal_jaar_2" as TemplateKey, title: "Mail 2 — 15 dagen voor afloop", subtitle: "Gebruik {einddatum} en {naam}" },
      { key: "renewal_jaar_3" as TemplateKey, title: "Mail 3 — Laatste dag", subtitle: "Gebruik {naam}" },
    ],
  },
  {
    id: "renewal_kwartaal",
    label: "Verlengingsmails — Kwartaal",
    subtitle: "Mail 1 op 14 dagen voor afloop · Mail 2 op 7 dagen · Mail 3 op de laatste dag",
    emails: [
      { key: "renewal_kwartaal_1" as TemplateKey, title: "Mail 1 — 14 dagen voor afloop", subtitle: "Gebruik {einddatum} en {naam}" },
      { key: "renewal_kwartaal_2" as TemplateKey, title: "Mail 2 — 7 dagen voor afloop", subtitle: "Gebruik {einddatum} en {naam}" },
      { key: "renewal_kwartaal_3" as TemplateKey, title: "Mail 3 — Laatste dag", subtitle: "Gebruik {naam}" },
    ],
  },
  {
    id: "renewal_maand",
    label: "Verlengingsmails — Maand",
    subtitle: "Mail 1 op 7 dagen voor afloop · Mail 2 op 3 dagen · Mail 3 op de laatste dag",
    emails: [
      { key: "renewal_maand_1" as TemplateKey, title: "Mail 1 — 7 dagen voor afloop", subtitle: "Gebruik {einddatum} en {naam}" },
      { key: "renewal_maand_2" as TemplateKey, title: "Mail 2 — 3 dagen voor afloop", subtitle: "Gebruik {einddatum} en {naam}" },
      { key: "renewal_maand_3" as TemplateKey, title: "Mail 3 — Laatste dag", subtitle: "Gebruik {naam}" },
    ],
  },
];

function TemplateEditor({
  templateKey,
  title,
  subtitle,
  savedSubject,
  savedBodyText,
  savedAanhef,
  savedButtonText,
  savedButtonUrl,
  onSave,
}: {
  templateKey: TemplateKey;
  title: string;
  subtitle: string;
  savedSubject?: string;
  savedBodyText?: string;
  savedAanhef?: string;
  savedButtonText?: string;
  savedButtonUrl?: string;
  savedUpsellText?: string;
  savedUpsellUrl?: string;
  onSave: (key: TemplateKey, data: { subject: string; bodyText: string; aanhef: string; buttonText: string; buttonUrl: string; upsellText: string; upsellUrl: string }) => Promise<void>;
}) {
  const def = DEFAULT_TEMPLATES[templateKey];
  const [open, setOpen] = useState(false);
  const [subject, setSubject] = useState(savedSubject ?? def.subject);
  const [bodyText, setBodyText] = useState(savedBodyText ?? def.bodyText);
  const [aanhef, setAanhef] = useState(savedAanhef ?? def.aanhef ?? "Lieve {naam},");
  const [buttonText, setButtonText] = useState(savedButtonText ?? def.buttonText ?? "Kies wat bij je past");
  const [buttonUrl, setButtonUrl] = useState(savedButtonUrl ?? def.buttonUrl ?? "");
  const [upsellText, setUpsellText] = useState(savedUpsellText ?? (def as any).upsellText ?? "");
  const [upsellUrl, setUpsellUrl] = useState(savedUpsellUrl ?? (def as any).upsellUrl ?? "");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (savedSubject !== undefined) setSubject(savedSubject);
    if (savedBodyText !== undefined) setBodyText(savedBodyText);
    if (savedAanhef !== undefined) setAanhef(savedAanhef);
    if (savedButtonText !== undefined) setButtonText(savedButtonText);
    if (savedButtonUrl !== undefined) setButtonUrl(savedButtonUrl);
    if (savedUpsellText !== undefined) setUpsellText(savedUpsellText);
    if (savedUpsellUrl !== undefined) setUpsellUrl(savedUpsellUrl);
  }, [savedSubject, savedBodyText, savedAanhef, savedButtonText, savedButtonUrl, savedUpsellText, savedUpsellUrl]);

  const handleSave = async () => {
    setSaving(true);
    setSaved(false);
    try {
      await onSave(templateKey, { subject, bodyText, aanhef, buttonText, buttonUrl, upsellText, upsellUrl });
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } finally {
      setSaving(false);
    }
  };

  const handleReset = () => {
    setSubject(def.subject);
    setBodyText(def.bodyText);
    setAanhef(def.aanhef ?? "Lieve {naam},");
    setButtonText(def.buttonText ?? "Kies wat bij je past");
    setButtonUrl(def.buttonUrl ?? "");
    setUpsellText((def as any).upsellText ?? "");
    setUpsellUrl((def as any).upsellUrl ?? "");
  };

  const previewAanhef = aanhef.replace("{naam}", "Sofie");
  const previewBody = bodyText.replace(/\{naam\}/g, "Sofie").replace(/\{einddatum\}/g, "15 mei 2027");

  return (
    <div className="border border-gray-200 rounded-xl overflow-hidden">
      <button
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center gap-3 px-5 py-4 bg-white hover:bg-gray-50 transition-colors text-left"
      >
        {open ? <ChevronDown size={16} className="text-gray-400 flex-shrink-0" /> : <ChevronRight size={16} className="text-gray-400 flex-shrink-0" />}
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-gray-900">{title}</p>
          <p className="text-xs text-gray-500 mt-0.5">{subtitle}</p>
        </div>
        <span className="text-xs text-gray-400 truncate max-w-[200px] hidden sm:block">{subject}</span>
      </button>

      {open && (
        <div className="border-t border-gray-100 bg-white px-5 py-5 space-y-4">
          {/* Onderwerp */}
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">Onderwerp</label>
            <input
              type="text"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>

          {/* Aanhef */}
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">
              Aanhef <span className="font-normal text-gray-400">— gebruik {"{naam}"} voor de voornaam</span>
            </label>
            <input
              type="text"
              value={aanhef}
              onChange={(e) => setAanhef(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>

          {/* Inhoud */}
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">
              Inhoud <span className="font-normal text-gray-400">— lege regel = nieuwe alinea</span>
            </label>
            <textarea
              value={bodyText}
              onChange={(e) => setBodyText(e.target.value)}
              rows={7}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 resize-y"
            />
          </div>

          {/* Button */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">Knoptekst</label>
              <input
                type="text"
                value={buttonText}
                onChange={(e) => setButtonText(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">Knop URL</label>
              <input
                type="url"
                value={buttonUrl}
                onChange={(e) => setButtonUrl(e.target.value)}
                placeholder="https://..."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>
          </div>

          {/* Upsell */}
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">
              Extra link <span className="font-normal text-gray-400">— optioneel, verschijnt als subtiele tekstlink onder de knop ("Of kies voor meer rust: …")</span>
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <input
                type="text"
                value={upsellText}
                onChange={(e) => setUpsellText(e.target.value)}
                placeholder="bijv. Een heel jaar voor €97"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
              <input
                type="url"
                value={upsellUrl}
                onChange={(e) => setUpsellUrl(e.target.value)}
                placeholder="https://..."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>
          </div>

          {/* Preview */}
          <details className="group">
            <summary className="text-xs font-semibold text-primary-600 cursor-pointer hover:text-primary-800 select-none">
              Voorbeeld e-mail
            </summary>
            <div className="mt-3 border border-gray-200 rounded-lg p-5 bg-[#fdf9f4] text-sm text-gray-800 space-y-3" style={{ fontFamily: "system-ui, -apple-system, sans-serif" }}>
              <p className="text-base">{previewAanhef}</p>
              {previewBody.split(/\n\n+/).map((para, i) => (
                <p key={i} className="leading-relaxed text-gray-600">{para}</p>
              ))}
              <div className="pt-1">
                <span className="inline-block bg-[#6d84a8] text-white px-6 py-3 rounded-lg text-sm font-semibold">
                  {buttonText}
                </span>
                {upsellText && upsellUrl && (
                  <p className="mt-3 text-xs text-gray-400">
                    Of kies voor meer rust: <span className="text-[#6d84a8] underline">{upsellText} →</span>
                  </p>
                )}
              </div>
              <p className="text-gray-600 pt-2">Met warme groet,</p>
              <p className="font-semibold text-gray-800">Ien</p>
              <p className="text-xs text-gray-400">Founder van Talk To Benji</p>
            </div>
          </details>

          {/* Actions */}
          <div className="flex items-center gap-3 pt-1">
            <button
              onClick={handleSave}
              disabled={saving}
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
      )}
    </div>
  );
}

function Section({ id, label, subtitle, emails, templates, onSave }: {
  id: string;
  label: string;
  subtitle: string;
  emails: { key: TemplateKey; title: string; subtitle: string }[];
  templates: any[];
  onSave: (key: TemplateKey, data: any) => Promise<void>;
}) {
  const [open, setOpen] = useState(true);

  return (
    <div className="bg-white rounded-xl border border-primary-200 shadow-sm overflow-hidden">
      <button
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center gap-3 px-5 py-4 hover:bg-primary-50 transition-colors text-left"
      >
        {open ? <ChevronDown size={17} className="text-primary-500 flex-shrink-0" /> : <ChevronRight size={17} className="text-primary-500 flex-shrink-0" />}
        <div>
          <p className="text-base font-semibold text-primary-900">{label}</p>
          <p className="text-xs text-primary-600">{subtitle}</p>
        </div>
      </button>

      {open && (
        <div className="border-t border-primary-100 px-4 pb-4 pt-3 space-y-2">
          {emails.map(({ key, title, subtitle }) => {
            const t = templates?.find((x: any) => x.key === key);
            return (
              <TemplateEditor
                key={key}
                templateKey={key}
                title={title}
                subtitle={subtitle}
                savedSubject={t?.subject}
                savedBodyText={t?.bodyText}
                savedAanhef={t?.aanhef}
                savedButtonText={t?.buttonText}
                savedButtonUrl={t?.buttonUrl}
                savedUpsellText={t?.upsellText}
                savedUpsellUrl={t?.upsellUrl}
                onSave={onSave}
              />
            );
          })}
        </div>
      )}
    </div>
  );
}

export default function EmailsPage() {
  const templates = useAdminQuery(api.emailTemplates.listTemplates, {});
  const upsertTemplate = useAdminMutation(api.emailTemplates.upsertTemplate);

  const handleSave = async (key: TemplateKey, data: { subject: string; bodyText: string; aanhef: string; buttonText: string; buttonUrl: string }) => {
    await upsertTemplate({ key, ...data });
  };

  return (
    <div className="max-w-3xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">E-mails</h1>
        <p className="text-sm text-gray-500 mt-1">
          Pas de inhoud aan van automatische e-mails — aanhef, tekst, knoptekst en knoplink zijn allemaal bewerkbaar
        </p>
      </div>

      {SECTIONS.map((section) => (
        <Section
          key={section.id}
          id={section.id}
          label={section.label}
          subtitle={section.subtitle}
          emails={section.emails}
          templates={templates ?? []}
          onSave={handleSave}
        />
      ))}
    </div>
  );
}
