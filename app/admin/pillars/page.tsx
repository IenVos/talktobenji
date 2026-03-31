"use client";

import { useState, useRef, useEffect } from "react";
import { useAdminQuery, useAdminMutation, useAdminAuth } from "../AdminAuthContext";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { Layers, Plus, Edit, Trash2, Save, X, ExternalLink, ArrowLeft, Image as ImageIcon, BookOpen, Link as LinkIcon, RefreshCw } from "lucide-react";
import { FormatToolbar } from "@/components/admin/FormatToolbar";

type FaqItem = { question: string; answer: string };
type InternalLink = { label: string; slug: string };

type FormState = {
  slug: string;
  title: string;
  seoTitle: string;
  metaDescription: string;
  excerpt: string;
  content: string;
  sources: string;
  focusKeyword: string;
  ctaKey: string;
  isLive: boolean;
  faqItems: FaqItem[];
  internalLinks: InternalLink[];
  coverImageStorageId?: Id<"_storage">;
  coverImageFile: File | null;
  anchorPhrases: string;
};

const EMPTY: FormState = {
  slug: "",
  title: "",
  seoTitle: "",
  metaDescription: "",
  excerpt: "",
  content: "",
  sources: "",
  focusKeyword: "",
  ctaKey: "",
  isLive: false,
  faqItems: [{ question: "", answer: "" }],
  internalLinks: [{ label: "", slug: "" }, { label: "", slug: "" }],
  coverImageStorageId: undefined,
  coverImageFile: null,
  anchorPhrases: "",
};

const STOP_WORDS = new Set(["de","het","een","en","of","in","van","aan","op","is","die","dat","te","ook","zijn","wat","hoe","er","naar","met","voor","door","bij","maar","als","om","tot","dan","zo","wel","niet","nog","je","ik","we","ze","hij","zij","haar","hun","hem","jij","u","dit","die","deze"]);

function suggestAnchorPhrases(title: string, focusKeyword: string): string[] {
  const suggestions: string[] = [];
  if (focusKeyword.trim()) suggestions.push(focusKeyword.trim().toLowerCase());
  const clean = title.toLowerCase().replace(/[–—&]/g, " ").replace(/[^a-z0-9\s]/g, "").trim();
  const words = clean.split(/\s+/).filter(w => w.length > 2 && !STOP_WORDS.has(w));
  words.filter(w => w.length >= 4).forEach(w => { if (!suggestions.includes(w)) suggestions.push(w); });
  for (let i = 0; i < words.length - 1; i++) {
    const p = `${words[i]} ${words[i + 1]}`;
    if (!suggestions.includes(p)) suggestions.push(p);
  }
  for (let i = 0; i < words.length - 2; i++) {
    const p = `${words[i]} ${words[i + 1]} ${words[i + 2]}`;
    if (!suggestions.includes(p)) suggestions.push(p);
  }
  return suggestions.slice(0, 10);
}

function slugify(t: string) {
  return t.toLowerCase().replace(/[^a-z0-9\s-]/g, "").trim().replace(/\s+/g, "-").slice(0, 80);
}

export default function AdminPillarsPage() {
  const { adminToken } = useAdminAuth();
  const pillars = useAdminQuery(api.pillars.list, {});
  const posts = useAdminQuery(api.blogPosts.list, {});
  const ctaBlocks = useAdminQuery(api.ctaBlocks.list, {});
  const createPillar = useAdminMutation(api.pillars.create);
  const updatePillar = useAdminMutation(api.pillars.update);
  const removePillar = useAdminMutation(api.pillars.remove);
  const seedPillars = useAdminMutation(api.pillars.seedPillars);
  const syncKb = useAdminMutation(api.pillars.syncToKnowledgeBase);
  const generateUploadUrl = useAdminMutation(api.pillars.generateUploadUrl);
  const getImageUrl = useAdminMutation(api.pillars.getImageUrl);

  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<Id<"pillars"> | null>(null);
  const [coverPreview, setCoverPreview] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [syncingKb, setSyncingKb] = useState(false);
  const [syncKbDone, setSyncKbDone] = useState(false);
  const [showImport, setShowImport] = useState(false);
  const [importText, setImportText] = useState("");
  const [form, setForm] = useState<FormState>(EMPTY);
  const coverInputRef = useRef<HTMLInputElement>(null);
  const contentRef = useRef<HTMLTextAreaElement>(null);

  // Auto-resize content textarea zonder te verspringen
  useEffect(() => {
    const ta = contentRef.current;
    if (!ta) return;
    const winScroll = window.scrollY;
    const taScroll = ta.scrollTop;
    ta.style.height = "auto";
    ta.style.height = Math.max(320, ta.scrollHeight) + "px";
    ta.scrollTop = taScroll;
    window.scrollTo({ top: winScroll, behavior: "instant" as ScrollBehavior });
  }, [form.content]);

  const inputClass = "w-full px-3 py-2 border border-primary-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-400";
  const labelClass = "block text-sm font-medium text-gray-700 mb-1";
  const labelSmClass = "block text-xs text-gray-500 mb-1";

  const set = (f: keyof FormState) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm((s) => ({ ...s, [f]: e.target.value }));

  const reset = () => { setForm(EMPTY); setEditingId(null); setCoverPreview(null); setShowForm(false); };

  const startEdit = (p: any) => {
    setForm({
      slug: p.slug,
      title: p.title,
      seoTitle: p.seoTitle ?? "",
      metaDescription: p.metaDescription ?? "",
      excerpt: p.excerpt ?? "",
      content: p.content ?? "",
      sources: p.sources ?? "",
      focusKeyword: p.focusKeyword ?? "",
      ctaKey: p.ctaKey ?? "",
      isLive: p.isLive,
      faqItems: p.faqItems?.length ? p.faqItems : [{ question: "", answer: "" }],
      internalLinks: [
        p.internalLinks?.[0] ?? { label: "", slug: "" },
        p.internalLinks?.[1] ?? { label: "", slug: "" },
      ],
      coverImageStorageId: p.coverImageStorageId,
      coverImageFile: null,
      anchorPhrases: (p as any).anchorPhrases?.join("\n") ?? "",
    });
    setCoverPreview(p.coverImageUrl ?? null);
    setEditingId(p._id);
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const uploadFile = async (file: File): Promise<Id<"_storage">> => {
    const url = await generateUploadUrl();
    const res = await fetch(url, { method: "POST", body: file, headers: { "Content-Type": file.type } });
    const { storageId } = await res.json();
    return storageId as Id<"_storage">;
  };

  const buildPayload = async () => {
    let coverImageStorageId = form.coverImageStorageId;
    if (form.coverImageFile) {
      coverImageStorageId = await uploadFile(form.coverImageFile);
      setForm((f) => ({ ...f, coverImageFile: null, coverImageStorageId }));
    }
    const faqItems = form.faqItems.filter((f) => f.question.trim() && f.answer.trim());
    const internalLinks = form.internalLinks.filter((l) => l.label.trim() && l.slug.trim());
    return {
      slug: form.slug.trim(),
      title: form.title.trim(),
      seoTitle: form.seoTitle.trim(),
      metaDescription: form.metaDescription.trim(),
      excerpt: form.excerpt.trim(),
      content: form.content.trim(),
      coverImageStorageId,
      faqItems: faqItems.length ? faqItems : undefined,
      internalLinks: internalLinks.length ? internalLinks : [],
      isLive: form.isLive,
      focusKeyword: form.focusKeyword.trim() || undefined,
      ctaKey: form.ctaKey.trim() || undefined,
      sources: form.sources.trim(),
      anchorPhrases: form.anchorPhrases.trim()
        ? form.anchorPhrases.split("\n").map(s => s.trim()).filter(Boolean).slice(0, 5)
        : undefined,
    };
  };

  const handleSave = async () => {
    if (!form.slug.trim() || !form.title.trim()) return;
    setSaving(true);
    try {
      const payload = await buildPayload();
      if (editingId) {
        await updatePillar({ id: editingId, ...payload });
      } else {
        const newId = await createPillar(payload) as Id<"pillars">;
        setEditingId(newId);
      }
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 2500);
    } finally {
      setSaving(false);
    }
  };

  const handleBack = async () => {
    if (form.slug.trim() && form.title.trim()) {
      setSaving(true);
      try {
        const payload = await buildPayload();
        if (editingId) await updatePillar({ id: editingId, ...payload });
        else await createPillar(payload);
      } finally {
        setSaving(false);
      }
    }
    reset();
  };

  const handleSyncKb = async () => {
    if (!editingId) return;
    setSyncingKb(true);
    setSyncKbDone(false);
    try {
      await syncKb({ id: editingId });
      setSyncKbDone(true);
    } finally {
      setSyncingKb(false);
    }
  };

  const handleImport = () => {
    const lines = importText.split("\n");
    let title = "";
    let seoTitle = "";
    let metaDescription = "";
    let bodyStart = 0;
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      if (line.startsWith("# ")) { title = line.slice(2).trim(); bodyStart = i + 1; continue; }
      if (bodyStart > 0) {
        const seoMatch = line.match(/^SEO-titel:\s*(.+)/i);
        const metaMatch = line.match(/^Meta\s*description:\s*(.+)/i);
        if (seoMatch) { seoTitle = seoMatch[1].trim(); continue; }
        if (metaMatch) { metaDescription = metaMatch[1].trim(); continue; }
        if (line.trim() && !seoMatch && !metaMatch) { bodyStart = i; break; }
      }
    }
    const FAQ_HEADERS = /^##\s+(veelgestelde vragen|faq|vragen)/i;
    const SOURCES_HEADERS = /^##\s+(bronnen|bronvermelding|referenties|literatuur)/i;
    const body = lines.slice(bodyStart);
    const contentLines: string[] = [];
    const faqLines: string[] = [];
    const sourcesLines: string[] = [];
    let mode: "content" | "faq" | "sources" = "content";
    for (const line of body) {
      if (FAQ_HEADERS.test(line)) { mode = "faq"; continue; }
      if (SOURCES_HEADERS.test(line)) { mode = "sources"; continue; }
      if (/^##\s+/.test(line)) { mode = "content"; }
      if (mode === "faq") faqLines.push(line);
      else if (mode === "sources") sourcesLines.push(line);
      else contentLines.push(line);
    }
    const faqItems: FaqItem[] = [];
    let currentQ = "";
    let currentA: string[] = [];
    for (const line of faqLines) {
      const boldQ = line.match(/^\*\*(.+\??)\*\*\s*$/);
      const h3Q = line.match(/^###\s+(.+)/);
      if (boldQ || h3Q) {
        if (currentQ && currentA.join("").trim()) faqItems.push({ question: currentQ, answer: currentA.join("\n").trim() });
        currentQ = (boldQ?.[1] || h3Q?.[1] || "").trim();
        currentA = [];
      } else { currentA.push(line); }
    }
    if (currentQ && currentA.join("").trim()) faqItems.push({ question: currentQ, answer: currentA.join("\n").trim() });
    let excerpt = "";
    const filteredContentLines: string[] = [];
    const contentBlocks = contentLines.join("\n").split(/\n\n+/);
    for (const block of contentBlocks) {
      const trimmed = block.trim();
      if (/^in het kort:/i.test(trimmed)) excerpt = trimmed.replace(/^in het kort:\s*/i, "").trim();
      else filteredContentLines.push(trimmed);
    }
    const sources = sourcesLines.map((l) => l.replace(/^[-*]\s+/, "").trim()).filter(Boolean).join("\n");
    setForm((f) => ({
      ...f,
      title: title && !f.title ? title : f.title,
      slug: title && !f.slug ? slugify(title) : f.slug,
      seoTitle: seoTitle || f.seoTitle,
      metaDescription: metaDescription || f.metaDescription,
      content: filteredContentLines.join("\n\n").replace(/^\n+/, "").trimEnd(),
      excerpt: excerpt || f.excerpt,
      faqItems: faqItems.length ? faqItems : f.faqItems,
      sources: sources || f.sources,
    }));
    setImportText("");
    setShowImport(false);
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="text-xl sm:text-2xl font-bold text-primary-900 flex items-center gap-2">
          <Layers size={28} className="text-primary-600" />
          Pillar pagina's
        </h1>
        <p className="text-sm text-primary-700 mt-1">
          Thematische pagina's (laag 2) — artikelen koppel je vanuit de blog editor.
        </p>
      </div>

      <div className="bg-white rounded-xl border border-primary-200 p-6">
        <div className="flex justify-between items-center mb-4 flex-wrap gap-2">
          <h2 className="font-semibold text-primary-900">
            {showForm ? (editingId ? "Pillar bewerken" : "Nieuwe pillar") : "Pillars"}
          </h2>
          {!showForm && (
            <div className="flex gap-2">
              <button type="button" onClick={() => seedPillars()}
                className="px-3 py-2 border border-primary-300 text-primary-700 rounded-lg text-sm hover:bg-primary-50">
                Standaard pillars aanmaken
              </button>
              <button type="button" onClick={() => { reset(); setShowForm(true); }}
                className="inline-flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg text-sm font-medium hover:bg-primary-700">
                <Plus size={18} /> Nieuwe pillar
              </button>
            </div>
          )}
        </div>

        {showForm && (
          <div className="space-y-5 mb-6">
            {/* Terug */}
            <div className="flex items-center justify-between">
              <button type="button" onClick={handleBack} disabled={saving}
                className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-primary-600 disabled:opacity-50">
                <ArrowLeft size={16} />
                {saving ? "Opslaan…" : "Terug naar overzicht"}
              </button>
              {editingId && (
                <a href={`/thema/${form.slug}`} target="_blank" rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-sm text-primary-600 hover:underline">
                  <ExternalLink size={14} /> Bekijk pagina
                </a>
              )}
            </div>

            {/* Titel + slug */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className={labelClass}>Titel *</label>
                <input type="text" placeholder="Rouw & Verdriet" value={form.title}
                  onChange={(e) => setForm((s) => ({ ...s, title: e.target.value, slug: s.slug || slugify(e.target.value) }))}
                  className={inputClass} />
              </div>
              <div>
                <label className={labelSmClass}>Slug (URL: /thema/slug)</label>
                <input type="text" value={form.slug} onChange={set("slug")} className={inputClass} />
              </div>
            </div>

            {/* SEO titel + meta description */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className={labelSmClass}>SEO titel <span className="text-gray-400">(browser tab / Google — leeg = paginatitel)</span></label>
                <input type="text" placeholder="Rouw & Verdriet — Talk To Benji"
                  value={form.seoTitle} onChange={set("seoTitle")} maxLength={70} className={inputClass} />
                <p className="text-xs text-gray-400 mt-0.5">{form.seoTitle.length}/70</p>
              </div>
              <div>
                <label className={labelSmClass}>Meta description <span className="text-gray-400">(max 155 tekens)</span></label>
                <input type="text" placeholder="Alles over rouw en verdriet…"
                  value={form.metaDescription} onChange={set("metaDescription")} maxLength={155} className={inputClass} />
                <p className="text-xs text-gray-400 mt-0.5">{form.metaDescription.length}/155</p>
              </div>
            </div>

            {/* Cover afbeelding */}
            <div>
              <label className={labelSmClass}>Omslagafbeelding</label>
              {coverPreview && (
                <div className="mb-2">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={coverPreview} alt="Cover" className="w-full rounded-xl max-h-48 object-cover" />
                </div>
              )}
              <input ref={coverInputRef} type="file" accept="image/*" className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0] ?? null;
                  setForm((f) => ({ ...f, coverImageFile: file }));
                  if (file) setCoverPreview(URL.createObjectURL(file));
                }} />
              <div className="flex gap-2">
                <button type="button" onClick={() => coverInputRef.current?.click()}
                  className="px-3 py-2 border border-primary-200 rounded-lg text-sm text-primary-700 hover:bg-primary-50 inline-flex items-center gap-2">
                  <ImageIcon size={15} />
                  {coverPreview ? "Andere afbeelding" : "Omslagafbeelding uploaden"}
                </button>
                {coverPreview && (
                  <button type="button" onClick={() => { setForm((f) => ({ ...f, coverImageFile: null, coverImageStorageId: undefined })); setCoverPreview(null); }}
                    className="px-3 py-2 border border-red-200 rounded-lg text-sm text-red-600 hover:bg-red-50">
                    Verwijderen
                  </button>
                )}
              </div>
            </div>

            {/* Samenvatting */}
            <div>
              <label className={labelClass}>Samenvatting</label>
              <textarea placeholder="Korte intro van de pagina (2-3 zinnen)…"
                value={form.excerpt} onChange={set("excerpt")} rows={3} className={inputClass} />
            </div>

            {/* Focuszoekwoord + CTA */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className={labelSmClass}>Focuszoekwoord</label>
                <input type="text" placeholder="bijv. rouw na verlies"
                  value={form.focusKeyword} onChange={set("focusKeyword")} className={inputClass} />
                {(() => {
                  const kw = form.focusKeyword.trim().toLowerCase();
                  if (!kw || kw.length < 3) return null;
                  const conflicts = [
                    ...(pillars ?? []).filter((p: any) => p._id !== editingId && p.focusKeyword?.trim().toLowerCase() === kw).map((p: any) => ({ title: p.title })),
                    ...(posts ?? []).filter((p: any) => p.focusKeyword?.trim().toLowerCase() === kw).map((p: any) => ({ title: p.title })),
                  ];
                  if (conflicts.length === 0) return null;
                  return (
                    <div className="mt-1.5 flex items-start gap-1.5 px-3 py-2 bg-red-50 border border-red-200 rounded-lg">
                      <span className="text-red-500 text-xs mt-0.5">⚠</span>
                      <p className="text-xs text-red-700">
                        Al gebruikt in {conflicts.length === 1 ? "1 pagina" : `${conflicts.length} pagina's`}:{" "}
                        {conflicts.map((c, i) => (
                          <span key={i}><strong>{c.title}</strong>{i < conflicts.length - 1 ? ", " : ""}</span>
                        ))}
                      </p>
                    </div>
                  );
                })()}
              </div>
              <div>
                <label className={labelSmClass}>CTA blok</label>
                <select
                  value={form.ctaKey}
                  onChange={(e) => setForm((f) => ({ ...f, ctaKey: e.target.value }))}
                  className={inputClass}
                >
                  <option value="">— Standaard —</option>
                  {(ctaBlocks ?? []).map((c: any) => (
                    <option key={c._id} value={c.key}>{c.label || c.key}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Importeer van Claude of Koala */}
            <div className="border border-primary-200 rounded-xl overflow-hidden">
              <button
                type="button"
                onClick={() => setShowImport((v) => !v)}
                className="w-full flex items-center justify-between px-4 py-3 bg-primary-50 text-sm font-medium text-primary-800 hover:bg-primary-100 transition-colors"
              >
                <span>Importeer van Claude of Koala</span>
                <span className="text-primary-400 text-xs">{showImport ? "▲ sluiten" : "▼ openen"}</span>
              </button>
              {showImport && (
                <div className="p-4 space-y-3 bg-white">
                  <p className="text-xs text-gray-500">Plak de volledige markdown-output van Claude of Koala. De eerste <code className="bg-gray-100 px-1 rounded"># Titel</code> gaat automatisch naar het titelveld (als dat nog leeg is).</p>
                  <textarea
                    value={importText}
                    onChange={(e) => setImportText(e.target.value)}
                    placeholder={"# Pillar titel\n\n## Inleiding\n\nPlak hier de Claude-output..."}
                    rows={10}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-xs font-mono focus:outline-none focus:ring-2 focus:ring-primary-400 resize-y"
                  />
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={handleImport}
                      disabled={!importText.trim()}
                      className="px-4 py-2 bg-primary-600 text-white rounded-lg text-sm font-medium hover:bg-primary-700 disabled:opacity-50 transition-colors"
                    >
                      Importeer naar content
                    </button>
                    <button
                      type="button"
                      onClick={() => { setImportText(""); setShowImport(false); }}
                      className="px-4 py-2 bg-gray-100 text-gray-600 rounded-lg text-sm hover:bg-gray-200 transition-colors"
                    >
                      Annuleer
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Inhoud met toolbar */}
            <div>
              <label className={labelClass}>
                Inhoud <span className="text-xs text-gray-400 font-normal">— nog niet verplicht, later toe te voegen</span>
              </label>
              <FormatToolbar
                textareaRef={contentRef}
                value={form.content}
                onChange={(v) => setForm((f) => ({ ...f, content: v }))}
                ctaBlocks={(ctaBlocks ?? []).map((c: any) => ({ key: c.key, label: c.label || c.key }))}
              />
              <textarea
                ref={contentRef}
                placeholder="Schrijf hier de pillar content…"
                value={form.content}
                onChange={set("content")}
                rows={20}
                className={inputClass + " font-mono text-xs leading-relaxed rounded-t-none"}
              />
            </div>

            {/* FAQ */}
            <div className="border-t border-primary-100 pt-4 space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium text-primary-900 flex items-center gap-2">
                  <BookOpen size={16} /> FAQ
                </p>
                <button type="button"
                  onClick={() => setForm((f) => ({ ...f, faqItems: [...f.faqItems, { question: "", answer: "" }] }))}
                  className="text-xs text-primary-600 hover:underline">
                  + Vraag toevoegen
                </button>
              </div>
              {form.faqItems.map((faq, i) => (
                <div key={i} className="space-y-2 p-3 bg-primary-50 rounded-lg">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-gray-600">Vraag {i + 1}</span>
                    {form.faqItems.length > 1 && (
                      <button type="button"
                        onClick={() => setForm((f) => ({ ...f, faqItems: f.faqItems.filter((_, j) => j !== i) }))}
                        className="text-xs text-red-500 hover:underline">Verwijderen</button>
                    )}
                  </div>
                  <input type="text" placeholder="Vraag…" value={faq.question}
                    onChange={(e) => setForm((f) => ({ ...f, faqItems: f.faqItems.map((q, j) => j === i ? { ...q, question: e.target.value } : q) }))}
                    className={inputClass} />
                  <textarea placeholder="Antwoord…" value={faq.answer} rows={2}
                    onChange={(e) => setForm((f) => ({ ...f, faqItems: f.faqItems.map((q, j) => j === i ? { ...q, answer: e.target.value } : q) }))}
                    className={inputClass} />
                </div>
              ))}
            </div>

            {/* Interne links */}
            <div className="border-t border-primary-100 pt-4 space-y-3">
              <p className="text-sm font-medium text-primary-900 flex items-center gap-2">
                <LinkIcon size={16} /> Interne links <span className="text-xs text-gray-400 font-normal">(max 2)</span>
              </p>
              {form.internalLinks.map((link, i) => (
                <div key={i} className="grid grid-cols-2 gap-2">
                  <input type="text" placeholder={`Linktekst ${i + 1}`} value={link.label}
                    onChange={(e) => setForm((f) => ({ ...f, internalLinks: f.internalLinks.map((l, j) => j === i ? { ...l, label: e.target.value } : l) }))}
                    className={inputClass} />
                  <input type="text" placeholder="slug-van-artikel" value={link.slug}
                    onChange={(e) => setForm((f) => ({ ...f, internalLinks: f.internalLinks.map((l, j) => j === i ? { ...l, slug: e.target.value } : l) }))}
                    className={inputClass} />
                </div>
              ))}
            </div>

            {/* Bronnen */}
            <div className="border-t border-primary-100 pt-4">
              <label className={labelSmClass}>
                Bronnen <span className="text-gray-400">(één per regel — worden cursief onderaan de pagina getoond)</span>
              </label>
              <textarea
                placeholder={"NRC, 12 jan 2025 — Rouw na verlies\nhttps://voorbeeld.nl/bron"}
                value={form.sources}
                onChange={set("sources")}
                rows={3}
                className={inputClass}
              />
            </div>

            {/* Ankerzinnen */}
            <div className="border-t border-primary-100 pt-4 space-y-2">
              <label className={labelSmClass}>
                Ankerzinnen <span className="text-gray-400 font-normal">(max 5 — één per regel, worden in blog/pillar artikelen automatisch een link naar deze pagina)</span>
              </label>
              <textarea
                value={form.anchorPhrases}
                onChange={e => setForm(f => ({ ...f, anchorPhrases: e.target.value }))}
                rows={3}
                placeholder={"rouw en verdriet\nrouw na verlies\nomgaan met verdriet"}
                className={inputClass}
              />
              {(() => {
                const suggestions = suggestAnchorPhrases(form.title, form.focusKeyword);
                const active = form.anchorPhrases.split("\n").map(s => s.trim()).filter(Boolean);
                const unused = suggestions.filter(s => !active.includes(s));
                if (!unused.length) return null;
                return (
                  <div className="space-y-1.5">
                    <p className="text-xs text-gray-400">Suggesties (klik om toe te voegen):</p>
                    <div className="flex flex-wrap gap-1.5">
                      {unused.map(s => (
                        <button key={s} type="button"
                          onClick={() => setForm(f => ({ ...f, anchorPhrases: f.anchorPhrases ? f.anchorPhrases.trim() + "\n" + s : s }))}
                          className="px-2.5 py-1 text-xs bg-primary-50 border border-primary-200 text-primary-700 rounded-full hover:bg-primary-100 transition-colors">
                          + {s}
                        </button>
                      ))}
                    </div>
                  </div>
                );
              })()}
            </div>

            {/* Live toggle */}
            <div className="border-t border-primary-100 pt-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={form.isLive}
                  onChange={(e) => setForm((s) => ({ ...s, isLive: e.target.checked }))}
                  className="rounded border-primary-300 text-primary-600" />
                <span className="text-sm text-gray-700">Live (publiek zichtbaar)</span>
              </label>
            </div>

            <div className="flex flex-wrap gap-2 pt-2">
              <button type="button" onClick={handleSave} disabled={saving || !form.slug.trim() || !form.title.trim()}
                className="inline-flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg text-sm font-medium hover:bg-primary-700 disabled:opacity-50">
                <Save size={18} />
                {saving ? "Bezig…" : saveSuccess ? "✓ Opgeslagen" : "Opslaan"}
              </button>
              {editingId && (() => {
                const isSynced = (pillars ?? []).find((p: any) => p._id === editingId)?.kbSynced ?? syncKbDone;
                return (
                  <button type="button" onClick={handleSyncKb} disabled={syncingKb}
                    className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium disabled:opacity-50 ${isSynced ? "bg-green-50 border border-green-300 text-green-700 hover:bg-green-100" : "border border-blue-300 text-blue-700 hover:bg-blue-50"}`}>
                    {syncingKb ? <RefreshCw size={17} className="animate-spin" /> : <BookOpen size={17} />}
                    {syncingKb ? "Bezig…" : isSynced ? "✓ Toegevoegd aan kennisbank" : "Toevoegen aan kennisbank"}
                  </button>
                );
              })()}
              <button type="button" onClick={reset}
                className="inline-flex items-center gap-2 px-4 py-2 border border-primary-200 rounded-lg text-sm font-medium hover:bg-primary-50">
                <X size={18} /> Annuleren
              </button>
            </div>
          </div>
        )}

        {!showForm && (
          <>
            {pillars === undefined ? (
              <div className="py-8 text-center text-primary-600">Laden…</div>
            ) : pillars.length === 0 ? (
              <p className="text-sm text-gray-500 py-4">Nog geen pillars. Klik op "Standaard pillars aanmaken".</p>
            ) : (
              <ul className="space-y-3">
                {pillars.map((p: any) => (
                  <li key={p._id} className="p-4 rounded-lg border border-primary-200 bg-white hover:bg-primary-50/50">
                    <div className="flex justify-between items-center gap-4">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${p.isLive ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-600"}`}>
                            {p.isLive ? "Live" : "Concept"}
                          </span>
                          <code className="text-xs text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded">/thema/{p.slug}</code>
                          {!p.content && <span className="text-xs text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full">Content nog toe te voegen</span>}
                        </div>
                        <h3 className="font-medium text-primary-900">{p.title}</h3>
                        {p.metaDescription && <p className="text-xs text-gray-500 mt-0.5 line-clamp-1">{p.metaDescription}</p>}
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        {p.isLive && (
                          <a href={`/thema/${p.slug}`} target="_blank" rel="noopener noreferrer"
                            className="p-2 text-gray-500 hover:bg-gray-100 rounded-lg">
                            <ExternalLink size={17} />
                          </a>
                        )}
                        <button type="button" onClick={() => startEdit(p)}
                          className="p-2 text-primary-600 hover:bg-primary-100 rounded-lg">
                          <Edit size={17} />
                        </button>
                        <button type="button" onClick={() => { if (confirm("Pillar verwijderen?")) removePillar({ id: p._id }); }}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg">
                          <Trash2 size={17} />
                        </button>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </>
        )}
      </div>
    </div>
  );
}
