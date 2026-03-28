"use client";

import { useState } from "react";
import { useAdminMutation, useAdminQuery, useAdminAuth } from "../AdminAuthContext";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { Plus, Edit, Trash2, Save, X, Eye, Image as ImageIcon } from "lucide-react";

type CtaForm = {
  key: string;
  label: string;
  eyebrow: string;
  title: string;
  body: string;
  buttonText: string;
  footnote: string;
  showImage: boolean;
};

const DEFAULTS: CtaForm = {
  key: "",
  label: "",
  eyebrow: "Talk To Benji",
  title: "",
  body: "",
  buttonText: "Kijk of het bij je past",
  footnote: "7 dagen volledig toegang · geen creditcard nodig",
  showImage: false,
};

const PRESETS: { label: string; data: Partial<CtaForm> }[] = [
  {
    label: "Variant A — stil & persoonlijk",
    data: {
      key: "blog_default",
      label: "Blog — stil & persoonlijk",
      eyebrow: "Talk To Benji",
      title: "Misschien is dit het moment.",
      body: "Benji luistert — zonder oordeel, zonder haast. Er voor je overdag, 's avonds en midden in de nacht.",
      buttonText: "Kijk of het bij je past",
      footnote: "7 dagen volledig toegang · geen creditcard nodig",
      showImage: false,
    },
  },
  {
    label: "Variant B — met screenshot",
    data: {
      key: "pillar_default",
      label: "Pillar — met screenshot",
      eyebrow: "Talk To Benji",
      title: "Soms wil je gewoon ergens heen kunnen.",
      body: "Benji is er voor de momenten dat je het moeilijk hebt. Een gesprek, een dagelijkse check-in, herinneringen bewaren — op jouw tempo, wanneer jij er behoefte aan hebt.",
      buttonText: "Kijk of het bij je past",
      footnote: "7 dagen volledig toegang · geen creditcard nodig",
      showImage: true,
    },
  },
];

function CtaPreview({ form }: { form: CtaForm }) {
  return (
    <div className="rounded-2xl bg-[#f5f0eb] overflow-hidden">
      <div className="px-7 pt-8 pb-6 text-center">
        {form.eyebrow && (
          <p className="text-stone-500 text-xs uppercase tracking-widest mb-4">{form.eyebrow}</p>
        )}
        <p className="text-stone-800 text-xl font-semibold leading-snug mb-3">
          {form.title || <span className="text-stone-300 italic">Titel...</span>}
        </p>
        <p className="text-stone-500 text-[15px] leading-relaxed max-w-sm mx-auto mb-2">
          {form.body || <span className="text-stone-300 italic">Bodytekst...</span>}
        </p>
      </div>

      {form.showImage && (
        <div className="px-6 pb-2">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/images/app-screenshot.png"
            alt="Talk To Benji"
            className="w-full rounded-xl border border-stone-200 shadow-sm"
          />
        </div>
      )}

      <div className="px-7 py-7 text-center">
        <span className="inline-block bg-[#6d84a8] text-white text-sm font-semibold px-6 py-3 rounded-xl">
          {form.buttonText || "Knoptekst..."}
        </span>
        {form.footnote && (
          <p className="text-xs text-stone-400 mt-3">{form.footnote}</p>
        )}
      </div>
    </div>
  );
}

export default function CtaAdminPage() {
  const { adminToken } = useAdminAuth();
  const blocks = useAdminQuery(api.ctaBlocks.list, {});
  const saveCta = useAdminMutation(api.ctaBlocks.save);
  const removeCta = useAdminMutation(api.ctaBlocks.remove);

  const [editingId, setEditingId] = useState<Id<"ctaBlocks"> | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<CtaForm>(DEFAULTS);
  const [saving, setSaving] = useState(false);
  const [previewId, setPreviewId] = useState<string | null>(null);

  const inputClass = "w-full px-3 py-2 border border-primary-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-400";

  const openNew = (preset?: Partial<CtaForm>) => {
    setForm({ ...DEFAULTS, ...preset });
    setEditingId(null);
    setShowForm(true);
  };

  const openEdit = (block: any) => {
    setForm({
      key: block.key,
      label: block.label,
      eyebrow: block.eyebrow ?? "",
      title: block.title,
      body: block.body,
      buttonText: block.buttonText,
      footnote: block.footnote ?? "",
      showImage: block.showImage,
    });
    setEditingId(block._id);
    setShowForm(true);
  };

  const handleSave = async () => {
    if (!form.key.trim() || !form.title.trim()) return;
    setSaving(true);
    try {
      await saveCta({
        id: editingId ?? undefined,
        key: form.key.trim().toLowerCase().replace(/\s+/g, "_"),
        label: form.label.trim(),
        eyebrow: form.eyebrow.trim() || undefined,
        title: form.title.trim(),
        body: form.body.trim(),
        buttonText: form.buttonText.trim(),
        footnote: form.footnote.trim() || undefined,
        showImage: form.showImage,
      });
      setShowForm(false);
      setEditingId(null);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: Id<"ctaBlocks">) => {
    if (!confirm("Deze CTA verwijderen?")) return;
    await removeCta({ id });
  };

  const set = (field: keyof CtaForm) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm((f) => ({ ...f, [field]: e.target.value }));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">CTA blokken</h1>
          <p className="text-sm text-gray-500 mt-1">Beheer de call-to-action blokken voor blog en pillar pagina's</p>
        </div>
        <button
          onClick={() => openNew()}
          className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg text-sm font-medium hover:bg-primary-700"
        >
          <Plus size={16} /> Nieuwe CTA
        </button>
      </div>

      {/* Snelstart met presets */}
      {(!blocks || blocks.length === 0) && !showForm && (
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <p className="text-sm font-medium text-gray-700 mb-3">Snelstart — begin met een van de bestaande varianten:</p>
          <div className="flex flex-wrap gap-3">
            {PRESETS.map((p) => (
              <button
                key={p.label}
                onClick={() => openNew(p.data)}
                className="px-4 py-2 border border-primary-200 rounded-lg text-sm text-primary-700 hover:bg-primary-50"
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Bestaande CTA's */}
      {blocks && blocks.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {blocks.map((block: any) => (
            <div key={block._id} className="bg-white rounded-xl border border-gray-200 overflow-hidden">
              <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
                <div>
                  <p className="text-sm font-semibold text-gray-800">{block.label || block.key}</p>
                  <p className="text-xs text-gray-400 font-mono">key: {block.key}</p>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => setPreviewId(previewId === block._id ? null : block._id)}
                    className="p-1.5 text-gray-400 hover:text-primary-600 hover:bg-primary-50 rounded"
                  >
                    <Eye size={15} />
                  </button>
                  <button
                    onClick={() => openEdit(block)}
                    className="p-1.5 text-gray-400 hover:text-primary-600 hover:bg-primary-50 rounded"
                  >
                    <Edit size={15} />
                  </button>
                  <button
                    onClick={() => handleDelete(block._id)}
                    className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded"
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              </div>

              {/* Compacte info */}
              <div className="px-4 py-3 space-y-1">
                <p className="text-sm font-medium text-gray-800 line-clamp-1">{block.title}</p>
                <p className="text-xs text-gray-500 line-clamp-2">{block.body}</p>
                <div className="flex items-center gap-2 pt-1">
                  <span className="text-xs px-2 py-0.5 bg-primary-50 text-primary-700 rounded-full">{block.buttonText}</span>
                  {block.showImage && <span className="text-xs px-2 py-0.5 bg-amber-50 text-amber-700 rounded-full flex items-center gap-1"><ImageIcon size={10} /> Met screenshot</span>}
                </div>
              </div>

              {/* Live preview */}
              {previewId === block._id && (
                <div className="p-4 border-t border-gray-100 bg-gray-50">
                  <p className="text-xs text-gray-400 mb-3 uppercase tracking-wide">Preview</p>
                  <CtaPreview form={{
                    key: block.key,
                    label: block.label,
                    eyebrow: block.eyebrow ?? "",
                    title: block.title,
                    body: block.body,
                    buttonText: block.buttonText,
                    footnote: block.footnote ?? "",
                    showImage: block.showImage,
                  }} />
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Formulier */}
      {showForm && (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
            <h2 className="text-base font-semibold text-gray-800">
              {editingId ? "CTA bewerken" : "Nieuwe CTA"}
            </h2>
            <button onClick={() => setShowForm(false)} className="p-1 text-gray-400 hover:text-gray-600 rounded">
              <X size={18} />
            </button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-0">
            {/* Formulier links */}
            <div className="p-5 space-y-4 border-r border-gray-100">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Naam (intern)</label>
                  <input type="text" value={form.label} onChange={set("label")} placeholder="Bijv. Blog — stil" className={inputClass} />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Key (uniek)</label>
                  <input type="text" value={form.key} onChange={set("key")} placeholder="blog_default" className={inputClass + " font-mono"} />
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Klein label bovenaan</label>
                <input type="text" value={form.eyebrow} onChange={set("eyebrow")} placeholder="Talk To Benji" className={inputClass} />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Titel *</label>
                <input type="text" value={form.title} onChange={set("title")} placeholder="Misschien is dit het moment." className={inputClass} />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Bodytekst</label>
                <textarea value={form.body} onChange={set("body")} rows={3} placeholder="Benji luistert — zonder oordeel..." className={inputClass} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Knoptekst</label>
                  <input type="text" value={form.buttonText} onChange={set("buttonText")} className={inputClass} />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Kleine tekst onder knop</label>
                  <input type="text" value={form.footnote} onChange={set("footnote")} placeholder="7 dagen gratis..." className={inputClass} />
                </div>
              </div>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.showImage}
                  onChange={(e) => setForm((f) => ({ ...f, showImage: e.target.checked }))}
                  className="rounded"
                />
                <span className="text-sm text-gray-700">App-screenshot tonen</span>
              </label>

              <div className="flex gap-3 pt-2">
                <button
                  onClick={handleSave}
                  disabled={saving || !form.key.trim() || !form.title.trim()}
                  className="flex items-center gap-2 px-5 py-2.5 bg-primary-600 text-white rounded-lg text-sm font-medium hover:bg-primary-700 disabled:opacity-50"
                >
                  <Save size={15} />
                  {saving ? "Opslaan..." : "Opslaan"}
                </button>
                <button onClick={() => setShowForm(false)} className="px-4 py-2.5 bg-gray-100 text-gray-600 rounded-lg text-sm hover:bg-gray-200">
                  Annuleer
                </button>
              </div>
            </div>

            {/* Live preview rechts */}
            <div className="p-5 bg-gray-50">
              <p className="text-xs text-gray-400 uppercase tracking-wide mb-4">Live preview</p>
              <CtaPreview form={form} />
            </div>
          </div>
        </div>
      )}

      {/* Uitleg hoe te gebruiken */}
      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <p className="text-xs font-semibold text-gray-600 uppercase tracking-wide mb-3">Hoe gebruik je een CTA op een pagina?</p>
        <p className="text-xs text-gray-500 mb-2">Geef de key van de gewenste CTA door aan de blog of pillar pagina. De huidige instellingen:</p>
        <div className="space-y-1 font-mono text-xs bg-gray-50 rounded-lg p-3">
          <p><span className="text-gray-400">Blog artikelen →</span> <span className="text-primary-700">CtaBlockB</span> <span className="text-gray-400">(key: blog_default)</span></p>
          <p><span className="text-gray-400">Pillar pagina's →</span> <span className="text-primary-700">CtaBlockA</span> <span className="text-gray-400">(key: pillar_default)</span></p>
        </div>
        <p className="text-xs text-gray-400 mt-2">Vraag aan je developer om de key aan te passen als je wil wisselen.</p>
      </div>
    </div>
  );
}
