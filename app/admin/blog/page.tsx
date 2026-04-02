"use client";

import { useState, useRef, useEffect } from "react";
import { useAdminQuery, useAdminMutation, useAdminAuth } from "../AdminAuthContext";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import {
  Newspaper, Plus, Edit, Trash2, Save, X, ExternalLink,
  BookOpen, RefreshCw, Image as ImageIcon, Link as LinkIcon, ArrowLeft,
} from "lucide-react";
import { FormatToolbar } from "@/components/admin/FormatToolbar";

type FaqItem = { question: string; answer: string };
type InternalLink = { label: string; slug: string };

type FormState = {
  slug: string;
  title: string;
  seoTitle: string;
  content: string;
  excerpt: string;
  metaDescription: string;
  pillarSlug: string;
  ctaKey: string;
  sources: string;
  focusKeyword: string;
  publishedAt: string; // "YYYY-MM-DD"
  isLive: boolean;
  faqItems: FaqItem[];
  internalLinks: InternalLink[];
  coverImageStorageId?: Id<"_storage">;
  coverImageFile: File | null;
  tags: string[];
  anchorPhrases: string;
};

const EMPTY_FORM: FormState = {
  slug: "",
  title: "",
  seoTitle: "",
  content: "",
  excerpt: "",
  metaDescription: "",
  pillarSlug: "",
  ctaKey: "",
  sources: "",
  focusKeyword: "",
  publishedAt: new Date().toISOString().slice(0, 10),
  isLive: false,
  faqItems: [{ question: "", answer: "" }],
  internalLinks: [{ label: "", slug: "" }, { label: "", slug: "" }],
  coverImageStorageId: undefined,
  coverImageFile: null,
  tags: [],
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

function slugify(text: string) {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .slice(0, 80);
}

export default function AdminBlogPage() {
  const { adminToken } = useAdminAuth();
  const posts = useAdminQuery(api.blogPosts.list, {});
  const pillars = useAdminQuery(api.pillars.list, {});
  const ctaBlocks = useAdminQuery(api.ctaBlocks.list, {});
  const createPost = useAdminMutation(api.blogPosts.create);
  const updatePost = useAdminMutation(api.blogPosts.update);
  const removePost = useAdminMutation(api.blogPosts.remove);
  const syncKb = useAdminMutation(api.blogPosts.syncToKnowledgeBase);
  const seedExample = useAdminMutation(api.blogPosts.seedExample);
  const generateUploadUrl = useAdminMutation(api.blogPosts.generateUploadUrl);
  const getImageUrl = useAdminMutation(api.blogPosts.getImageUrl);

  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<Id<"blogPosts"> | null>(null);
  const [coverPreview, setCoverPreview] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [tagInput, setTagInput] = useState("");
  const [syncingForm, setSyncingForm] = useState(false);
  const [syncFormDone, setSyncFormDone] = useState(false);
  const [syncing, setSyncing] = useState<Id<"blogPosts"> | null>(null);
  const [syncDone, setSyncDone] = useState<Id<"blogPosts"> | null>(null);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [insertingImage, setInsertingImage] = useState(false);
  const [showImport, setShowImport] = useState(false);
  const [importText, setImportText] = useState("");

  const handleImport = () => {
    const raw = importText
      .replace(/[—–]/g, " ")
      .replace(/  +/g, " ")
      .replace(/\n#{1,3} ?(vervolg|gerelateerde?|andere?|meer lezen|lees ook|suggesties|volgende|related)[^\n]*/gi, "\n__STRIP__")
      .replace(/\n__STRIP__[\s\S]*/i, "")
      .trimEnd();
    const lines = raw.split("\n");

    // 1. Titel, SEO-titel en meta description uit de header
    let title = "";
    let seoTitle = "";
    let metaDescription = "";
    let bodyStart = 0;
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      if (line.startsWith("# ")) {
        title = line.slice(2).trim();
        bodyStart = i + 1;
        continue;
      }
      if (bodyStart > 0) {
        const seoMatch = line.match(/^SEO-titel:\s*(.+)/i);
        const metaMatch = line.match(/^Meta\s*description:\s*(.+)/i);
        if (seoMatch) { seoTitle = seoMatch[1].trim(); continue; }
        if (metaMatch) { metaDescription = metaMatch[1].trim(); continue; }
        // Stop zodra we een niet-label, niet-lege regel tegenkomen
        if (line.trim() && !seoMatch && !metaMatch) { bodyStart = i; break; }
      }
    }

    // 2. Splits body in secties op ## koppen
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
      // Andere ## koppen gaan terug naar content
      if (/^##\s+/.test(line)) { mode = "content"; }
      if (mode === "faq") faqLines.push(line);
      else if (mode === "sources") sourcesLines.push(line);
      else contentLines.push(line);
    }

    // 3. Auto-quote: losse regels tussen aanhalingstekens → blockquote
    const processedContentLines = contentLines.map((line) => {
      if (line.startsWith("> ")) return line; // al een blockquote
      const q = line.trim();
      // Hele regel is één geciteerde zin: "..." of '...' of „..."
      if (/^["„''].{20,}["'']\s*$/.test(q)) {
        return `> ${q.replace(/^["„'']|["'']\s*$/g, "").trim()}`;
      }
      return line;
    });

    // 4. FAQ parsen: **Vraag?** of ### Vraag? gevolgd door antwoord
    const faqItems: FaqItem[] = [];
    let currentQ = "";
    let currentA: string[] = [];
    for (const line of faqLines) {
      const boldQ = line.match(/^\*\*(.+\??)\*\*\s*$/);
      const h3Q = line.match(/^###\s+(.+)/);
      if (boldQ || h3Q) {
        if (currentQ && currentA.join("").trim()) {
          faqItems.push({ question: currentQ, answer: currentA.join("\n").trim() });
        }
        currentQ = (boldQ?.[1] || h3Q?.[1] || "").trim();
        currentA = [];
      } else {
        currentA.push(line);
      }
    }
    if (currentQ && currentA.join("").trim()) {
      faqItems.push({ question: currentQ, answer: currentA.join("\n").trim() });
    }

    // 5. Samenvatting: zoek "In het kort:" alinea in content
    let excerpt = "";
    const filteredContentLines: string[] = [];
    const contentBlocks = processedContentLines.join("\n").split(/\n\n+/);
    for (const block of contentBlocks) {
      const trimmed = block.trim();
      if (/^in het kort:/i.test(trimmed)) {
        excerpt = trimmed.replace(/^in het kort:\s*/i, "").trim();
      } else {
        filteredContentLines.push(trimmed);
      }
    }

    // 5. Bronnen: strip - prefix
    const sources = sourcesLines
      .map((l) => l.replace(/^[-*]\s+/, "").trim())
      .filter(Boolean)
      .join("\n");

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
  const coverInputRef = useRef<HTMLInputElement>(null);
  const inlineInputRef = useRef<HTMLInputElement>(null);
  const contentRef = useRef<HTMLTextAreaElement>(null);

  const inputClass = "w-full px-3 py-2 border border-primary-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-400";
  const labelClass = "block text-sm font-medium text-gray-700 mb-1";
  const labelSmClass = "block text-xs text-gray-500 mb-1";

  const set = (field: keyof FormState) => (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => setForm((f) => ({ ...f, [field]: e.target.value }));

  const resetForm = () => {
    setForm(EMPTY_FORM);
    setEditingId(null);
    setCoverPreview(null);
    setShowForm(false);
  };

  const startEdit = (post: any) => {
    const publishDate = post.publishedAt
      ? new Date(post.publishedAt).toISOString().slice(0, 10)
      : new Date().toISOString().slice(0, 10);
    setForm({
      slug: post.slug,
      title: post.title,
      seoTitle: post.seoTitle ?? "",
      content: post.content,
      excerpt: post.excerpt ?? "",
      metaDescription: post.metaDescription ?? "",
      sources: post.sources ?? "",
      focusKeyword: post.focusKeyword ?? "",
      publishedAt: publishDate,
      isLive: post.isLive,
      faqItems: post.faqItems?.length ? post.faqItems : [{ question: "", answer: "" }],
      internalLinks: [
        post.internalLinks?.[0] ?? { label: "", slug: "" },
        post.internalLinks?.[1] ?? { label: "", slug: "" },
      ],
      coverImageStorageId: post.coverImageStorageId,
      coverImageFile: null,
      pillarSlug: post.pillarSlug ?? "",
      ctaKey: post.ctaKey ?? "",
      tags: post.tags ?? [],
      anchorPhrases: (post as any).anchorPhrases?.join("\n") ?? "",
    });
    setCoverPreview(post.coverImageUrl ?? null);
    setEditingId(post._id);
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const uploadFile = async (file: File): Promise<Id<"_storage">> => {
    const url = await generateUploadUrl();
    const res = await fetch(url, { method: "POST", body: file, headers: { "Content-Type": file.type } });
    const { storageId } = await res.json();
    return storageId as Id<"_storage">;
  };

  const insertImageAtCursor = async (file: File) => {
    setInsertingImage(true);
    try {
      const storageId = await uploadFile(file);
      const imageUrl = await getImageUrl({ storageId });
      if (!imageUrl || !contentRef.current) return;
      const ta = contentRef.current;
      const start = ta.selectionStart ?? ta.value.length;
      const before = ta.value.slice(0, start);
      const after = ta.value.slice(start);
      const insertion = `\n\n![](${imageUrl})\n\n`;
      const newVal = before + insertion + after;
      setForm((f) => ({ ...f, content: newVal }));
    } finally {
      setInsertingImage(false);
    }
  };

  const [saveSuccess, setSaveSuccess] = useState(false);

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

  const buildPayload = async () => {
    let coverImageStorageId = form.coverImageStorageId;
    if (form.coverImageFile) {
      coverImageStorageId = await uploadFile(form.coverImageFile);
      setForm((f) => ({ ...f, coverImageFile: null, coverImageStorageId }));
    }
    const publishedAt = form.publishedAt ? new Date(form.publishedAt).getTime() : undefined;
    const faqItems = form.faqItems.filter((f) => f.question.trim() && f.answer.trim());
    const internalLinks = form.internalLinks.filter((l) => l.label.trim() && l.slug.trim());
    return {
      slug: form.slug.trim(),
      title: form.title.trim(),
      seoTitle: form.seoTitle.trim(),
      content: form.content.trim(),
      excerpt: form.excerpt.trim(),
      metaDescription: form.metaDescription.trim(),
      coverImageStorageId,
      publishedAt,
      isLive: form.isLive,
      faqItems: faqItems.length ? faqItems : undefined,
      internalLinks: internalLinks.length ? internalLinks : [],
      pillarSlug: form.pillarSlug.trim(),
      ctaKey: form.ctaKey.trim() || undefined,
      tags: form.tags.length ? form.tags : undefined,
      sources: form.sources.trim(),
      focusKeyword: form.focusKeyword.trim() || undefined,
      anchorPhrases: form.anchorPhrases.trim()
        ? form.anchorPhrases.split("\n").map(s => s.trim()).filter(Boolean).slice(0, 3)
        : undefined,
    };
  };

  const handleSave = async () => {
    if (!form.slug.trim() || !form.title.trim() || !form.content.trim()) return;
    setSaving(true);
    try {
      const payload = await buildPayload();
      if (editingId) {
        await updatePost({ id: editingId, ...payload });
      } else {
        const newId = await createPost(payload) as Id<"blogPosts">;
        setEditingId(newId);
        // Toon auto-gegenereerde ankerzinnen als het veld leeg was
        if (!form.anchorPhrases.trim()) {
          const autoGenerated = suggestAnchorPhrases(form.title, form.focusKeyword).slice(0, 3).join("\n");
          if (autoGenerated) setForm(f => ({ ...f, anchorPhrases: autoGenerated }));
        }
      }
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 2500);
    } finally {
      setSaving(false);
    }
  };

  const handleBack = async () => {
    if (form.slug.trim() && form.title.trim() && form.content.trim()) {
      setSaving(true);
      try {
        const payload = await buildPayload();
        if (editingId) {
          await updatePost({ id: editingId, ...payload });
        } else {
          await createPost(payload);
        }
      } finally {
        setSaving(false);
      }
    }
    resetForm();
  };

  const handleSync = async (id: Id<"blogPosts">) => {
    setSyncing(id);
    try {
      await syncKb({ id });
      setSyncDone(id);
      setTimeout(() => setSyncDone(null), 3000);
    } finally {
      setSyncing(null);
    }
  };

  const handleSeed = async () => {
    const id = await seedExample() as Id<"blogPosts">;
    const all = posts;
    const seeded = all?.find((p: any) => p._id === id);
    if (seeded) startEdit(seeded);
    else window.location.reload();
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="text-xl sm:text-2xl font-bold text-primary-900 flex items-center gap-2">
          <Newspaper size={28} className="text-primary-600" />
          Blog
        </h1>
        <p className="text-sm text-primary-700 mt-1">
          Artikelen voor SEO en AEO — FAQ en samenvatting worden automatisch aan de kennisbank toegevoegd.
        </p>
      </div>

      <div className="bg-white rounded-xl border border-primary-200 p-6">
        <div className="flex justify-between items-center mb-4 flex-wrap gap-2">
          <h2 className="font-semibold text-primary-900">
            {showForm ? (editingId ? "Artikel bewerken" : "Nieuw artikel") : "Artikelen"}
          </h2>
          {!showForm && (
            <div className="flex gap-2">
              <button
                type="button"
                onClick={handleSeed}
                className="inline-flex items-center gap-2 px-3 py-2 border border-primary-300 text-primary-700 rounded-lg text-sm hover:bg-primary-50"
              >
                Voorbeeldartikel laden
              </button>
              <button
                type="button"
                onClick={() => { resetForm(); setShowForm(true); }}
                className="inline-flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg text-sm font-medium hover:bg-primary-700"
              >
                <Plus size={18} />
                Nieuw artikel
              </button>
            </div>
          )}
        </div>

        {showForm && (
          <div className="space-y-5 mb-6">
            <div className="flex items-center justify-between">
              <button
                type="button"
                onClick={handleBack}
                disabled={saving}
                className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-primary-600 disabled:opacity-50"
              >
                <ArrowLeft size={16} />
                {saving ? "Opslaan…" : "Terug naar overzicht"}
              </button>
              {editingId && (
                <a
                  href={`/blog/${form.slug}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 text-sm text-primary-600 hover:underline"
                >
                  <ExternalLink size={15} />
                  Bekijk artikel
                </a>
              )}
            </div>

            {/* Titel + slug */}
            <div>
              <label className={labelClass}>Titel *</label>
              <input
                type="text"
                placeholder="Hoe er zijn voor iemand die rouwt"
                value={form.title}
                onChange={(e) => {
                  const title = e.target.value;
                  setForm((f) => ({
                    ...f,
                    title,
                    slug: f.slug || slugify(title),
                  }));
                }}
                className={inputClass}
              />
            </div>
            <div>
              <label className={labelSmClass}>Slug (URL: /blog/slug)</label>
              <input
                type="text"
                value={form.slug}
                onChange={set("slug")}
                className={inputClass}
              />
            </div>

            {/* Tags */}
            <div>
              <label className={labelSmClass}>
                Tags <span className="text-gray-400">(thema-labels voor later groeperen — typ en druk Enter of komma)</span>
              </label>
              <div className={`${inputClass} flex flex-wrap gap-1.5 min-h-[38px] cursor-text`}
                onClick={() => document.getElementById("tag-input")?.focus()}>
                {form.tags.map((tag) => (
                  <span key={tag} className="inline-flex items-center gap-1 px-2 py-0.5 bg-primary-100 text-primary-800 rounded-full text-xs font-medium">
                    {tag}
                    <button type="button" onClick={() => setForm((f) => ({ ...f, tags: f.tags.filter((t) => t !== tag) }))}
                      className="text-primary-400 hover:text-primary-700 leading-none">×</button>
                  </span>
                ))}
                <input
                  id="tag-input"
                  type="text"
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyDown={(e) => {
                    if ((e.key === "Enter" || e.key === ",") && tagInput.trim()) {
                      e.preventDefault();
                      const tag = tagInput.trim().toLowerCase().replace(/,/g, "");
                      if (tag && !form.tags.includes(tag)) setForm((f) => ({ ...f, tags: [...f.tags, tag] }));
                      setTagInput("");
                    } else if (e.key === "Backspace" && !tagInput && form.tags.length) {
                      setForm((f) => ({ ...f, tags: f.tags.slice(0, -1) }));
                    }
                  }}
                  onBlur={() => {
                    const tag = tagInput.trim().toLowerCase().replace(/,/g, "");
                    if (tag && !form.tags.includes(tag)) setForm((f) => ({ ...f, tags: [...f.tags, tag] }));
                    setTagInput("");
                  }}
                  placeholder={form.tags.length ? "" : "kinderloosheid, zwangerschap…"}
                  className="flex-1 min-w-[120px] outline-none bg-transparent text-sm py-0.5"
                />
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
                }}
              />
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
              <label className={labelClass}>
                Samenvatting{" "}
                <span className="text-xs text-gray-400 font-normal">— wordt direct aan kennisbank toegevoegd</span>
              </label>
              <textarea
                placeholder="Korte samenvatting van het artikel (2-3 zinnen)…"
                value={form.excerpt}
                onChange={set("excerpt")}
                rows={3}
                className={inputClass}
              />
            </div>

            {/* SEO titel + meta description */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className={labelSmClass}>
                  SEO titel <span className="text-gray-400">(browser tab / Google — leeg = artikeltitel)</span>
                </label>
                <input
                  type="text"
                  placeholder="Bijv. Hoe er zijn voor iemand die rouwt — TTB"
                  value={form.seoTitle}
                  onChange={set("seoTitle")}
                  maxLength={70}
                  className={inputClass}
                />
                <p className="text-xs text-gray-400 mt-0.5">{form.seoTitle.length}/70</p>
              </div>
              <div>
                <label className={labelSmClass}>
                  Meta description <span className="text-gray-400">(max 155 tekens)</span>
                </label>
                <input
                  type="text"
                  placeholder="Wat staat er in de Google-snippet?"
                  value={form.metaDescription}
                  onChange={set("metaDescription")}
                  maxLength={155}
                  className={inputClass}
                />
                <p className="text-xs text-gray-400 mt-0.5">{form.metaDescription.length}/155</p>
              </div>
            </div>

            {/* Focuszoekwoord */}
            <div>
              <label className={labelSmClass}>Focuszoekwoord <span className="text-gray-400">(primair zoekwoord — voor overzicht en duplicate-check)</span></label>
              <input
                type="text"
                placeholder="Bijv. niet kunnen slapen van verdriet"
                value={form.focusKeyword}
                onChange={set("focusKeyword")}
                className={inputClass}
              />
              {(() => {
                const kw = form.focusKeyword.trim().toLowerCase();
                if (!kw || kw.length < 3) return null;
                const conflicts = [
                  ...(posts ?? []).filter((p: any) => p._id !== editingId && p.focusKeyword?.trim().toLowerCase() === kw).map((p: any) => ({ type: "artikel", title: p.title })),
                  ...(pillars ?? []).filter((p: any) => p.focusKeyword?.trim().toLowerCase() === kw).map((p: any) => ({ type: "pillar", title: p.title })),
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

            {/* Importeer van Claude */}
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
                  <p className="text-xs text-gray-500">Plak de volledige markdown-output van Claude of Koala. De eerste <code className="bg-gray-100 px-1 rounded"># Titel</code> gaat automatisch naar het titelvel (als dat nog leeg is).</p>
                  <textarea
                    value={importText}
                    onChange={(e) => setImportText(e.target.value)}
                    placeholder={"# Artikeltitel\n\n## Inleiding\n\nPlak hier de Claude-output..."}
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

            {/* Pillar + CTA */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className={labelSmClass}>Pillar pagina</label>
                <select
                  value={form.pillarSlug}
                  onChange={(e) => setForm((f) => ({ ...f, pillarSlug: e.target.value }))}
                  className={inputClass}
                >
                  <option value="">— Geen pillar —</option>
                  {(pillars ?? []).map((p: any) => (
                    <option key={p._id} value={p.slug}>{p.title}</option>
                  ))}
                </select>
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

            {/* Inhoud */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className={labelClass} style={{ marginBottom: 0 }}>Inhoud *</label>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-gray-400">**vet** · [link](url) · ![](url)</span>
                  <input ref={inlineInputRef} type="file" accept="image/*" className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) insertImageAtCursor(file);
                      if (inlineInputRef.current) inlineInputRef.current.value = "";
                    }}
                  />
                  <button type="button" onClick={() => inlineInputRef.current?.click()}
                    disabled={insertingImage}
                    className="inline-flex items-center gap-1 px-2 py-1 border border-primary-200 rounded text-xs text-primary-700 hover:bg-primary-50 disabled:opacity-50">
                    <ImageIcon size={13} />
                    {insertingImage ? "Uploaden…" : "Afbeelding invoegen"}
                  </button>
                </div>
              </div>
              <FormatToolbar
                textareaRef={contentRef}
                value={form.content}
                onChange={(v) => setForm((f) => ({ ...f, content: v }))}
                ctaBlocks={(ctaBlocks ?? []).map((c: any) => ({ key: c.key, label: c.label || c.key }))}
              />
              <textarea
                ref={contentRef}
                placeholder="Schrijf hier het artikel..."
                value={form.content}
                onChange={set("content")}
                style={{ minHeight: "320px", resize: "none", overflow: "hidden" }}
                className={inputClass + " font-mono text-xs leading-relaxed rounded-t-none"}
              />
            </div>

            {/* FAQ */}
            <div className="border-t border-primary-100 pt-4 space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium text-primary-900 flex items-center gap-2">
                  <BookOpen size={16} />
                  FAQ{" "}
                  <span className="text-xs text-gray-400 font-normal">— wordt direct aan kennisbank toegevoegd</span>
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
                        className="text-xs text-red-500 hover:underline">
                        Verwijderen
                      </button>
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

            {/* Ankerzinnen */}
            <div className="border-t border-primary-100 pt-4 space-y-2">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <label className={labelSmClass + " mb-0"}>
                  Ankerzinnen <span className="text-gray-400 font-normal">(max 3 — één per regel)</span>
                </label>
                {form.title.trim().length > 4 && (
                  <button type="button"
                    onClick={() => {
                      const generated = suggestAnchorPhrases(form.title, form.focusKeyword).slice(0, 3).join("\n");
                      setForm(f => ({ ...f, anchorPhrases: generated }));
                    }}
                    className="text-xs text-primary-600 hover:underline flex items-center gap-1">
                    ✦ Auto-aanvullen
                  </button>
                )}
              </div>

              {/* Pillar dekt al */}
              {form.pillarSlug && (() => {
                const pillar = (pillars ?? []).find((p: any) => p.slug === form.pillarSlug);
                const phrases: string[] = (pillar as any)?.anchorPhrases ?? [];
                if (!phrases.length) return null;
                return (
                  <div className="px-3 py-2 bg-stone-50 border border-stone-200 rounded-lg">
                    <p className="text-xs text-stone-500">
                      <span className="font-medium">Pillar linkt al automatisch via:</span>{" "}
                      {phrases.map((p, i) => (
                        <span key={i} className="inline-block bg-stone-100 text-stone-600 rounded px-1.5 py-0.5 text-[11px] mr-1">{p}</span>
                      ))}
                    </p>
                    <p className="text-[11px] text-stone-400 mt-1">Deze woorden hoef je hier niet te herhalen — voeg zinnen toe die specifiek naar dit artikel linken.</p>
                  </div>
                );
              })()}

              <textarea
                value={form.anchorPhrases}
                onChange={e => setForm(f => ({ ...f, anchorPhrases: e.target.value }))}
                rows={3}
                placeholder={"niet kunnen slapen door rouw\nrouw en slaap\nwakker liggen van verdriet"}
                className={inputClass}
              />
              {(() => {
                const suggestions = suggestAnchorPhrases(form.title, form.focusKeyword);
                const active = form.anchorPhrases.split("\n").map(s => s.trim()).filter(Boolean);
                // Filter ook al door de pillar gedekte phrases weg
                const pillarPhrases = new Set(
                  ((pillars ?? []).find((p: any) => p.slug === form.pillarSlug) as any)?.anchorPhrases ?? []
                );
                const unused = suggestions.filter(s => !active.includes(s) && !pillarPhrases.has(s));
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

            {/* Interne links */}
            <div className="border-t border-primary-100 pt-4 space-y-3">
              <p className="text-sm font-medium text-primary-900 flex items-center gap-2">
                <LinkIcon size={16} />
                Interne links <span className="text-xs text-gray-400 font-normal">(max 2)</span>
              </p>
              {/* Checkbox-lijst met artikelen uit dezelfde pillar */}
              {form.pillarSlug && (() => {
                const siblings = (posts ?? []).filter(
                  (p: any) => p.pillarSlug === form.pillarSlug && p._id !== editingId
                );
                if (!siblings.length) return (
                  <p className="text-xs text-gray-400 italic">Nog geen andere artikelen in deze pillar.</p>
                );
                const activeCount = form.internalLinks.filter(l => l.slug.trim()).length;
                return (
                  <div className="p-3 bg-stone-50 rounded-lg border border-stone-200 space-y-2">
                    <p className="text-xs text-gray-500">Kies uit artikelen in dezelfde pillar (max 2):</p>
                    {siblings.map((p: any) => {
                      const isChecked = form.internalLinks.some(l => l.slug === p.slug);
                      return (
                        <label key={p._id} className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={isChecked}
                            disabled={!isChecked && activeCount >= 2}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setForm((f) => {
                                  const links = [...f.internalLinks];
                                  const emptyIdx = links.findIndex(l => !l.slug.trim());
                                  if (emptyIdx >= 0) links[emptyIdx] = { label: p.title, slug: p.slug };
                                  return { ...f, internalLinks: links };
                                });
                              } else {
                                setForm((f) => ({
                                  ...f,
                                  internalLinks: f.internalLinks.map(l =>
                                    l.slug === p.slug ? { label: "", slug: "" } : l
                                  ),
                                }));
                              }
                            }}
                            className="rounded border-primary-300 text-primary-600"
                          />
                          <span className="text-sm text-gray-700 leading-tight">{p.title}</span>
                        </label>
                      );
                    })}
                  </div>
                );
              })()}
              {/* Cross-pillar: link naar een andere pillar-pagina (bewust, 1x) */}
              {(pillars ?? []).filter((p: any) => p.slug !== form.pillarSlug && p.isLive).length > 0 && (
                <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg space-y-2">
                  <p className="text-xs font-medium text-amber-800">Bewust naar een ander thema linken:</p>
                  <div className="flex flex-wrap gap-1.5">
                    {(pillars ?? [])
                      .filter((p: any) => p.slug !== form.pillarSlug && p.isLive)
                      .map((p: any) => {
                        const slug = `thema/${p.slug}`;
                        const isActive = form.internalLinks.some(l => l.slug === slug);
                        return (
                          <button key={p._id} type="button"
                            onClick={() => {
                              if (isActive) {
                                setForm(f => ({ ...f, internalLinks: f.internalLinks.map(l => l.slug === slug ? { label: "", slug: "" } : l) }));
                              } else {
                                const emptyIdx = form.internalLinks.findIndex(l => !l.slug.trim());
                                if (emptyIdx === -1) return;
                                setForm(f => ({ ...f, internalLinks: f.internalLinks.map((l, j) => j === emptyIdx ? { label: p.title, slug } : l) }));
                              }
                            }}
                            className={`px-2.5 py-1 text-xs rounded-full border transition-colors ${isActive ? "bg-amber-200 border-amber-400 text-amber-900 font-medium" : "bg-white border-amber-300 text-amber-700 hover:bg-amber-100"}`}>
                            {isActive ? "✓ " : "+ "}{p.title}
                          </button>
                        );
                      })}
                  </div>
                  <p className="text-[11px] text-amber-600">Auto-linking werkt nooit cross-silo — dit is de enige plek voor bewuste kruislinks.</p>
                </div>
              )}

              {/* Handmatige invoer — voor blog slugs of eigen tekst */}
              {form.internalLinks.map((link, i) => {
                const linkedPost = link.slug.trim() && !link.slug.startsWith("thema/")
                  ? (posts ?? []).find((p: any) => p.slug === link.slug.trim())
                  : null;
                const isCrossPillar = linkedPost && form.pillarSlug &&
                  (linkedPost as any).pillarSlug !== form.pillarSlug;
                return (
                  <div key={i} className="space-y-1">
                    <div className="grid grid-cols-2 gap-2">
                      <input type="text" placeholder={`Linktekst ${i + 1}`} value={link.label}
                        onChange={(e) => setForm((f) => ({ ...f, internalLinks: f.internalLinks.map((l, j) => j === i ? { ...l, label: e.target.value } : l) }))}
                        className={inputClass} />
                      <input type="text" placeholder="slug-van-artikel" value={link.slug}
                        onChange={(e) => setForm((f) => ({ ...f, internalLinks: f.internalLinks.map((l, j) => j === i ? { ...l, slug: e.target.value } : l) }))}
                        className={inputClass} />
                    </div>
                    {isCrossPillar && (
                      <p className="text-xs text-amber-600 flex items-center gap-1">
                        ⚠️ Gaat naar pillar "{(linkedPost as any).pillarSlug || "geen pillar"}" — buiten jouw cluster. Bewust?
                      </p>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Bronnen */}
            <div className="border-t border-primary-100 pt-4">
              <label className={labelSmClass}>
                Bronnen <span className="text-gray-400">(één per regel — worden cursief onderaan het artikel getoond)</span>
              </label>
              <textarea
                placeholder={"NRC, 12 jan 2025 — Rouw na verlies\nhttps://voorbeeld.nl/bron"}
                value={form.sources}
                onChange={set("sources")}
                rows={3}
                className={inputClass}
              />
            </div>

            {/* Publicatiedatum + live */}
            <div className="grid grid-cols-2 gap-4 items-end border-t border-primary-100 pt-4">
              <div>
                <label className={labelClass}>Publicatiedatum</label>
                <input type="date" value={form.publishedAt} onChange={set("publishedAt")} className={inputClass} />
                <p className="text-xs text-gray-400 mt-0.5">Toekomstige datum = ingepland, nog niet zichtbaar</p>
              </div>
              <label className="flex items-center gap-2 cursor-pointer pb-2">
                <input type="checkbox" checked={form.isLive} onChange={(e) => setForm((f) => ({ ...f, isLive: e.target.checked }))}
                  className="rounded border-primary-300 text-primary-600" />
                <span className="text-sm text-gray-700">Live (publiek zichtbaar)</span>
              </label>
            </div>

            <div className="flex flex-wrap gap-2 pt-2">
              <button type="button" onClick={handleSave} disabled={saving || !form.slug.trim() || !form.title.trim() || !form.content.trim()}
                className="inline-flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg text-sm font-medium hover:bg-primary-700 disabled:opacity-50">
                <Save size={18} />
                {saving ? "Bezig…" : saveSuccess ? "✓ Opgeslagen" : "Opslaan"}
              </button>
              {editingId && (() => {
                const isSynced = (posts ?? []).find((p: any) => p._id === editingId)?.kbSynced ?? false;
                return (
                  <button type="button"
                    disabled={syncingForm}
                    onClick={async () => {
                      setSyncingForm(true);
                      try {
                        await syncKb({ id: editingId });
                      } finally {
                        setSyncingForm(false);
                      }
                    }}
                    className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium disabled:opacity-50 ${
                      isSynced
                        ? "bg-green-100 border border-green-300 text-green-700 hover:bg-green-200"
                        : "border border-blue-300 text-blue-700 hover:bg-blue-50"
                    }`}>
                    {syncingForm ? <RefreshCw size={17} className="animate-spin" /> : <BookOpen size={17} />}
                    {syncingForm ? "Bezig…" : isSynced ? "✓ In kennisbank" : "Toevoegen aan kennisbank"}
                  </button>
                );
              })()}
              <button type="button" onClick={resetForm}
                className="inline-flex items-center gap-2 px-4 py-2 border border-primary-200 rounded-lg text-sm font-medium hover:bg-primary-50">
                <X size={18} />
                Annuleren
              </button>
            </div>
          </div>
        )}

        {!showForm && (
          <>
            {posts === undefined ? (
              <div className="py-8 text-center text-primary-600">Laden…</div>
            ) : posts.length === 0 ? (
              <p className="text-sm text-gray-500 py-4">Nog geen artikelen. Klik op "Voorbeeldartikel laden" om te starten.</p>
            ) : (
              <ul className="space-y-3">
                {posts.map((post: any) => (
                  <li key={post._id} className="p-4 rounded-lg border border-primary-200 bg-white hover:bg-primary-50/50">
                    <div className="flex justify-between items-start gap-4">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 flex-wrap mb-1">
                          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${post.isLive ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-600"}`}>
                            {post.isLive ? "Live" : "Concept"}
                          </span>
                          {post.publishedAt && post.publishedAt > Date.now() && (
                            <span className="text-xs px-2 py-0.5 rounded-full bg-amber-100 text-amber-700">
                              Ingepland {new Date(post.publishedAt).toLocaleDateString("nl-NL")}
                            </span>
                          )}
                          {post.kbSynced && (
                            <span className="text-xs px-2 py-0.5 rounded-full bg-blue-100 text-blue-700">KB ✓</span>
                          )}
                        </div>
                        <h3 className="font-medium text-primary-900 line-clamp-1">{post.title}</h3>
                        {post.tags?.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-1">
                            {post.tags.map((tag: string) => (
                              <span key={tag} className="text-[10px] px-1.5 py-0.5 bg-primary-50 text-primary-600 rounded-full">{tag}</span>
                            ))}
                          </div>
                        )}
                        {post.excerpt && <p className="text-xs text-gray-500 mt-0.5 line-clamp-1">{post.excerpt}</p>}
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        {!post.kbSynced && (
                          <button type="button" onClick={() => handleSync(post._id)} disabled={syncing === post._id}
                            className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg" title="Synchroniseer naar kennisbank">
                            {syncing === post._id ? <RefreshCw size={17} className="animate-spin" /> : <BookOpen size={17} />}
                          </button>
                        )}
                        {syncDone === post._id && <span className="text-xs text-green-600">✓ Gesynchroniseerd</span>}
                        {post.isLive ? (
                          <a href={`/blog/${post.slug}`} target="_blank" rel="noopener noreferrer"
                            className="p-2 text-gray-500 hover:bg-gray-100 rounded-lg" title="Bekijk artikel">
                            <ExternalLink size={17} />
                          </a>
                        ) : (
                          <a href={`/blog/${post.slug}/preview?token=${process.env.NEXT_PUBLIC_PREVIEW_SECRET ?? "preview"}`} target="_blank" rel="noopener noreferrer"
                            className="p-2 text-amber-500 hover:bg-amber-50 rounded-lg" title="Bekijk concept">
                            <ExternalLink size={17} />
                          </a>
                        )}
                        <button type="button" onClick={() => startEdit(post)}
                          className="p-2 text-primary-600 hover:bg-primary-100 rounded-lg">
                          <Edit size={17} />
                        </button>
                        <button type="button" onClick={() => { if (confirm("Artikel verwijderen?")) removePost({ id: post._id }); }}
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
