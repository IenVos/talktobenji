"use client";

import { useState, useRef, useEffect, useMemo } from "react";
import { useAdminQuery, useAdminMutation } from "../AdminAuthContext";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import {
  LayoutTemplate, Plus, Edit, Trash2, Save, X, Copy, Eye, EyeOff, ExternalLink, Download,
} from "lucide-react";

type LandingPage = {
  _id: Id<"landingPages">;
  slug: string;
  pageTitle: string;
  isLive: boolean;
  heroLabel?: string;
  heroTitle: string;
  heroSubtitle?: string;
  heroBody?: string;
  ctaText?: string;
  ctaUrl?: string;
  section1Title?: string;
  section1Text?: string;
  section2Title?: string;
  section2Text?: string;
  productImageStorageId?: Id<"_storage">;
  productImagePath?: string;
  bgImageStorageId?: Id<"_storage">;
  voorWieBullets?: string;
  voorWieTitle?: string;
  ervaringenJson?: string;
  vragenJson?: string;
  wieIsTitle?: string;
  wieIsText?: string;
  finalCtaTitle?: string;
  finalCtaBody?: string;
  footerText?: string;
  createdAt: number;
  updatedAt: number;
};

type FormState = {
  slug: string;
  pageTitle: string;
  isLive: boolean;
  heroLabel: string;
  heroTitle: string;
  heroSubtitle: string;
  heroBody: string;
  ctaText: string;
  ctaUrl: string;
  section1Title: string;
  section1Text: string;
  section2Title: string;
  section2Text: string;
  productImageFile: File | null;
  productImagePath: string;
  bgImageFile: File | null;
  voorWieBullets: string;
  voorWieTitle: string;
  ervaringenJson: string;
  vragenJson: string;
  wieIsTitle: string;
  wieIsText: string;
  finalCtaTitle: string;
  finalCtaBody: string;
  footerText: string;
};

const EMPTY_FORM: FormState = {
  slug: "",
  pageTitle: "",
  isLive: false,
  heroLabel: "",
  heroTitle: "",
  heroSubtitle: "",
  heroBody: "",
  ctaText: "",
  ctaUrl: "",
  section1Title: "",
  section1Text: "",
  section2Title: "",
  section2Text: "",
  productImageFile: null,
  productImagePath: "",
  bgImageFile: null,
  voorWieBullets: "",
  voorWieTitle: "",
  ervaringenJson: "",
  vragenJson: "",
  wieIsTitle: "",
  wieIsText: "",
  finalCtaTitle: "",
  finalCtaBody: "",
  footerText: "",
};

function opt(val: string): string | undefined {
  return val.trim() || undefined;
}

export default function AdminLandingspaginasPage() {
  const pages = useAdminQuery(api.landingPages.list, {});
  const createPage = useAdminMutation(api.landingPages.create);
  const updatePage = useAdminMutation(api.landingPages.update);
  const removePage = useAdminMutation(api.landingPages.remove);
  const duplicatePage = useAdminMutation(api.landingPages.duplicate);
  const toggleLive = useAdminMutation(api.landingPages.toggleLive);
  const seedPages = useAdminMutation(api.landingPages.seed);
  const generateUploadUrl = useAdminMutation(api.landingPages.generateUploadUrl);

  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<Id<"landingPages"> | null>(null);
  const [saving, setSaving] = useState(false);
  const [seedStatus, setSeedStatus] = useState<"idle" | "loading" | "done" | "error">("idle");
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [editingProductImageUrl, setEditingProductImageUrl] = useState<string | null>(null);
  const [editingBgImageUrl, setEditingBgImageUrl] = useState<string | null>(null);
  const productImageRef = useRef<HTMLInputElement>(null);
  const bgImageRef = useRef<HTMLInputElement>(null);

  const productPreviewUrl = useMemo(() => form.productImageFile ? URL.createObjectURL(form.productImageFile) : null, [form.productImageFile]);
  const bgPreviewUrl = useMemo(() => form.bgImageFile ? URL.createObjectURL(form.bgImageFile) : null, [form.bgImageFile]);
  useEffect(() => { return () => { if (productPreviewUrl) URL.revokeObjectURL(productPreviewUrl); }; }, [productPreviewUrl]);
  useEffect(() => { return () => { if (bgPreviewUrl) URL.revokeObjectURL(bgPreviewUrl); }; }, [bgPreviewUrl]);

  const set = (field: keyof FormState) => (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => setForm((f) => ({ ...f, [field]: e.target.value }));

  const setCheck = (field: keyof FormState) => (
    e: React.ChangeEvent<HTMLInputElement>
  ) => setForm((f) => ({ ...f, [field]: e.target.checked }));

  const resetForm = () => {
    setForm(EMPTY_FORM);
    setEditingId(null);
    setEditingProductImageUrl(null);
    setEditingBgImageUrl(null);
    setShowForm(false);
    if (productImageRef.current) productImageRef.current.value = "";
    if (bgImageRef.current) bgImageRef.current.value = "";
  };

  const startEdit = (page: LandingPage) => {
    setForm({
      slug: page.slug,
      pageTitle: page.pageTitle,
      isLive: page.isLive,
      heroLabel: page.heroLabel ?? "",
      heroTitle: page.heroTitle,
      heroSubtitle: page.heroSubtitle ?? "",
      heroBody: page.heroBody ?? "",
      ctaText: page.ctaText ?? "",
      ctaUrl: page.ctaUrl ?? "",
      section1Title: page.section1Title ?? "",
      section1Text: page.section1Text ?? "",
      section2Title: page.section2Title ?? "",
      section2Text: page.section2Text ?? "",
      productImageFile: null,
      productImagePath: page.productImagePath ?? "",
      bgImageFile: null,
      voorWieBullets: page.voorWieBullets ?? "",
      voorWieTitle: page.voorWieTitle ?? "",
      ervaringenJson: page.ervaringenJson ?? "",
      vragenJson: page.vragenJson ?? "",
      wieIsTitle: page.wieIsTitle ?? "",
      wieIsText: page.wieIsText ?? "",
      finalCtaTitle: page.finalCtaTitle ?? "",
      finalCtaBody: page.finalCtaBody ?? "",
      footerText: page.footerText ?? "",
    });
    setEditingProductImageUrl(null); // wordt geladen via aparte query als nodig
    setEditingBgImageUrl(null);
    setEditingId(page._id);
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const uploadFile = async (file: File): Promise<Id<"_storage">> => {
    const url = await generateUploadUrl();
    const res = await fetch(url, { method: "POST", body: file, headers: { "Content-Type": file.type } });
    const { storageId } = await res.json();
    return storageId as Id<"_storage">;
  };

  const handleSave = async () => {
    if (!form.slug.trim() || !form.heroTitle.trim() || !form.pageTitle.trim()) return;
    setSaving(true);
    try {
      let productImageStorageId: Id<"_storage"> | undefined;
      let bgImageStorageId: Id<"_storage"> | undefined;
      if (form.productImageFile) productImageStorageId = await uploadFile(form.productImageFile);
      if (form.bgImageFile) bgImageStorageId = await uploadFile(form.bgImageFile);

      const payload = {
        slug: form.slug.trim(),
        pageTitle: form.pageTitle.trim(),
        isLive: form.isLive,
        heroTitle: form.heroTitle.trim(),
        heroLabel: opt(form.heroLabel),
        heroSubtitle: opt(form.heroSubtitle),
        heroBody: opt(form.heroBody),
        ctaText: opt(form.ctaText),
        ctaUrl: opt(form.ctaUrl),
        section1Title: opt(form.section1Title),
        section1Text: opt(form.section1Text),
        section2Title: opt(form.section2Title),
        section2Text: opt(form.section2Text),
        productImageStorageId,
        productImagePath: opt(form.productImagePath),
        bgImageStorageId,
        voorWieBullets: opt(form.voorWieBullets),
        voorWieTitle: opt(form.voorWieTitle),
        ervaringenJson: opt(form.ervaringenJson),
        vragenJson: opt(form.vragenJson),
        wieIsTitle: opt(form.wieIsTitle),
        wieIsText: opt(form.wieIsText),
        finalCtaTitle: opt(form.finalCtaTitle),
        finalCtaBody: opt(form.finalCtaBody),
        footerText: opt(form.footerText),
      };
      if (editingId) {
        await updatePage({ id: editingId, ...payload });
      } else {
        await createPage(payload);
      }
      resetForm();
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: Id<"landingPages">) => {
    if (!confirm("Weet je zeker dat je deze landingspagina wilt verwijderen?")) return;
    await removePage({ id });
  };

  const handleDuplicate = async (id: Id<"landingPages">) => {
    await duplicatePage({ id });
  };

  const handleToggleLive = async (id: Id<"landingPages">) => {
    await toggleLive({ id });
  };

  const handleSeed = async () => {
    setSeedStatus("loading");
    try {
      await seedPages({});
      setSeedStatus("done");
      setTimeout(() => setSeedStatus("idle"), 3000);
    } catch {
      setSeedStatus("error");
      setTimeout(() => setSeedStatus("idle"), 3000);
    }
  };

  const canSave = form.slug.trim() && form.heroTitle.trim() && form.pageTitle.trim();

  const inputClass = "w-full px-3 py-2 border border-primary-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-400";
  const labelClass = "block text-sm font-medium text-gray-700 mb-1";
  const labelSmClass = "block text-xs text-gray-500 mb-1";

  const editingPage = editingId ? pages?.find((p: LandingPage) => p._id === editingId) : null;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-primary-900 flex items-center gap-2">
            <LayoutTemplate size={28} className="text-primary-600" />
            Landingspagina's
          </h1>
          <p className="text-sm text-primary-700 mt-1">
            Beheer publieke landingspagina's bereikbaar via /lp/[slug].
          </p>
        </div>
        <button
          type="button"
          onClick={handleSeed}
          disabled={seedStatus === "loading"}
          className="inline-flex items-center gap-2 px-3 py-2 border border-primary-200 bg-white text-primary-700 rounded-lg text-xs font-medium hover:bg-primary-50 disabled:opacity-50 shrink-0"
        >
          <Download size={15} />
          {seedStatus === "loading" ? "Bezig…" : seedStatus === "done" ? "Geïmporteerd!" : seedStatus === "error" ? "Fout" : "Importeer niet-alleen-a/b"}
        </button>
      </div>

      {/* Vaste (hardcoded) landingspagina's */}
      <div className="bg-white rounded-xl border border-primary-200 p-6">
        <h2 className="font-semibold text-primary-900 mb-3">Vaste pagina's</h2>
        <p className="text-xs text-primary-500 mb-4">Deze pagina's staan in de code en zijn altijd live.</p>
        <ul className="space-y-2">
          {[
            { slug: "jaar-toegang", title: "1 jaar toegang — € 97 eenmalig", note: "Betaalpagina KennisShop" },
            { slug: "troostende-woorden", title: "Troostende woorden", note: "Content landingspagina" },
          ].map(({ slug, title, note }) => (
            <li key={slug} className="flex items-center justify-between p-3 rounded-lg border border-primary-100 bg-primary-50/40">
              <div>
                <p className="text-sm font-medium text-primary-900">{title}</p>
                <div className="flex items-center gap-3 mt-0.5">
                  <code className="text-xs text-gray-500 bg-gray-100 px-1.5 py-0.5 rounded">/lp/{slug}</code>
                  <span className="text-xs text-gray-400">{note}</span>
                </div>
              </div>
              <a
                href={`/lp/${slug}`}
                target="_blank"
                rel="noopener noreferrer"
                className="p-2 text-primary-500 hover:bg-primary-100 rounded-lg"
                title="Bekijk pagina"
              >
                <ExternalLink size={16} />
              </a>
            </li>
          ))}
        </ul>
      </div>

      {/* FORMULIER */}
      <div className="bg-white rounded-xl border border-primary-200 p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="font-semibold text-primary-900">
            {showForm ? (editingId ? "Pagina bewerken" : "Nieuwe pagina") : "Pagina's"}
          </h2>
          {!showForm && (
            <button
              type="button"
              onClick={() => { resetForm(); setShowForm(true); }}
              className="inline-flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg text-sm font-medium hover:bg-primary-700"
            >
              <Plus size={18} />
              Nieuwe pagina
            </button>
          )}
        </div>

        {showForm && (
          <div className="space-y-5 mb-6">
            {/* Bekijk pagina link */}
            {editingId && editingPage?.isLive && (
              <a
                href={`/lp/${editingPage.slug}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-sm text-primary-600 hover:underline"
              >
                <ExternalLink size={15} />
                Bekijk pagina: /lp/{editingPage.slug}
              </a>
            )}

            {/* Basis */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className={labelClass}>
                  Slug <span className="text-gray-400 font-normal text-xs">(wordt URL: /lp/slug)</span>
                </label>
                <input type="text" placeholder="niet-alleen-a" value={form.slug} onChange={set("slug")} className={inputClass} />
              </div>
              <div>
                <label className={labelClass}>Paginatitel (browsertabblad)</label>
                <input type="text" placeholder="Niet Alleen — 30 dagen begeleiding" value={form.pageTitle} onChange={set("pageTitle")} className={inputClass} />
              </div>
            </div>

            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={form.isLive} onChange={setCheck("isLive")} className="rounded border-primary-300 text-primary-600" />
              <span className="text-sm text-gray-700">Pagina is live (publiek zichtbaar)</span>
            </label>

            {/* Hero */}
            <div className="pt-2 border-t border-primary-100">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Hero</p>
              <div className="space-y-3">
                <div>
                  <label className={labelSmClass}>Kleine tekst boven de titel (heroLabel)</label>
                  <input type="text" placeholder="30 dagen begeleiding bij verlies en gemis" value={form.heroLabel} onChange={set("heroLabel")} className={inputClass} />
                </div>
                <div>
                  <label className={labelClass}>Hoofdtitel (heroTitle) *</label>
                  <input type="text" placeholder="Je hoeft dit niet alleen te dragen." value={form.heroTitle} onChange={set("heroTitle")} className={inputClass} />
                </div>
                <div>
                  <label className={labelSmClass}>Subtitel (heroSubtitle)</label>
                  <textarea placeholder="Elke dag een kleine vraag…" value={form.heroSubtitle} onChange={set("heroSubtitle")} rows={2} className={inputClass} />
                </div>
                <div>
                  <label className={labelSmClass}>Bodytekst hero (heroBody)</label>
                  <textarea placeholder="Voor €37 ontvang je…" value={form.heroBody} onChange={set("heroBody")} rows={3} className={inputClass} />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className={labelSmClass}>CTA knoptekst</label>
                    <input type="text" placeholder="Start mijn reis" value={form.ctaText} onChange={set("ctaText")} className={inputClass} />
                  </div>
                  <div>
                    <label className={labelSmClass}>CTA URL</label>
                    <input type="url" placeholder="https://talktobenji.kennis.shop/pay/niet-alleen" value={form.ctaUrl} onChange={set("ctaUrl")} className={inputClass} />
                  </div>
                </div>
              </div>
            </div>

            {/* Afbeeldingen */}
            <div className="pt-2 border-t border-primary-100">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Afbeeldingen</p>
              <div className="space-y-4">
                {/* Productafbeelding */}
                <div>
                  <label className={labelClass}>Productafbeelding</label>
                  <input
                    ref={productImageRef}
                    type="file"
                    accept="image/*"
                    onChange={(e) => setForm((f) => ({ ...f, productImageFile: e.target.files?.[0] ?? null }))}
                    className="block w-full text-sm text-gray-600 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-primary-100 file:text-primary-800"
                  />
                  {(productPreviewUrl || form.productImagePath) && (
                    <div className="mt-2 flex items-start gap-3">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={productPreviewUrl || form.productImagePath} alt="Preview" className="w-24 h-24 object-cover rounded-lg border border-primary-200" />
                      <p className="text-xs text-gray-400 mt-1">{productPreviewUrl ? "Nieuwe upload" : "Huidig pad"}</p>
                    </div>
                  )}
                  {!form.productImageFile && (
                    <div className="mt-2">
                      <label className="block text-xs text-gray-400 mb-1">Of gebruik een pad (bijv. /images/niet-alleen-product.png)</label>
                      <input type="text" placeholder="/images/..." value={form.productImagePath} onChange={set("productImagePath")} className={inputClass} />
                    </div>
                  )}
                  {editingId && !form.productImageFile && <p className="text-xs text-gray-400 mt-1">Laat leeg om bestaande afbeelding te behouden.</p>}
                </div>
                {/* Achtergrondafbeelding */}
                <div>
                  <label className={labelClass}>Achtergrondafbeelding <span className="font-normal text-gray-400 text-xs">(optioneel — standaard: achtergrond.png)</span></label>
                  <input
                    ref={bgImageRef}
                    type="file"
                    accept="image/*"
                    onChange={(e) => setForm((f) => ({ ...f, bgImageFile: e.target.files?.[0] ?? null }))}
                    className="block w-full text-sm text-gray-600 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-primary-100 file:text-primary-800"
                  />
                  {bgPreviewUrl && (
                    <div className="mt-2">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={bgPreviewUrl} alt="Achtergrond preview" className="w-full max-h-32 object-cover rounded-lg border border-primary-200" />
                    </div>
                  )}
                  {editingId && !form.bgImageFile && <p className="text-xs text-gray-400 mt-1">Laat leeg om bestaande achtergrond te behouden.</p>}
                </div>
              </div>
            </div>

            {/* Sectie 1 */}
            <div className="pt-2 border-t border-primary-100">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Sectie 1</p>
              <div className="space-y-3">
                <div>
                  <label className={labelSmClass}>Titel sectie 1</label>
                  <input type="text" placeholder="Verdriet heeft niet altijd een naam." value={form.section1Title} onChange={set("section1Title")} className={inputClass} />
                </div>
                <div>
                  <label className={labelSmClass}>Tekst sectie 1 (dubbele enter = nieuwe alinea)</label>
                  <textarea placeholder="Het hoeft geen overlijden te zijn…" value={form.section1Text} onChange={set("section1Text")} rows={6} className={inputClass} />
                </div>
              </div>
            </div>

            {/* Sectie 2 */}
            <div className="pt-2 border-t border-primary-100">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Sectie 2</p>
              <div className="space-y-3">
                <div>
                  <label className={labelSmClass}>Titel sectie 2</label>
                  <input type="text" placeholder="Hoe het werkt." value={form.section2Title} onChange={set("section2Title")} className={inputClass} />
                </div>
                <div>
                  <label className={labelSmClass}>Tekst sectie 2 (dubbele enter = nieuwe alinea)</label>
                  <textarea placeholder="Elke ochtend ontvang je een bericht…" value={form.section2Text} onChange={set("section2Text")} rows={6} className={inputClass} />
                </div>
              </div>
            </div>

            {/* Voor wie */}
            <div className="pt-2 border-t border-primary-100">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Voor wie</p>
              <div>
                <label className={labelSmClass}>Voor wie — één bullet per regel</label>
                <textarea
                  placeholder={"je iemand hebt verloren en niet weet hoe je verder moet\nje rouwt om een relatie…"}
                  value={form.voorWieBullets}
                  onChange={set("voorWieBullets")}
                  rows={6}
                  className={inputClass}
                />
              </div>
              <div className="mt-3">
                <label className={labelSmClass}>Titel boven de bullets (standaard: "Dit is voor jou als...")</label>
                <input
                  type="text"
                  placeholder="Dit is voor jou als..."
                  value={form.voorWieTitle}
                  onChange={set("voorWieTitle")}
                  className={inputClass}
                />
              </div>
            </div>

            {/* Ervaringen */}
            <div className="pt-2 border-t border-primary-100">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Ervaringen</p>
              <div>
                <label className={labelSmClass}>
                  Ervaringen (JSON) — formaat: {`[{"tekst":"...","naam":"...","context":"..."}]`}
                </label>
                <textarea
                  placeholder={`[{"tekst":"Ik dacht dat ik het wel alleen kon…","naam":"Sandra","context":"verloor haar moeder"}]`}
                  value={form.ervaringenJson}
                  onChange={set("ervaringenJson")}
                  rows={5}
                  className={`${inputClass} font-mono text-xs`}
                />
              </div>
            </div>

            {/* FAQ */}
            <div className="pt-2 border-t border-primary-100">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">FAQ</p>
              <div>
                <label className={labelSmClass}>
                  FAQ (JSON) — formaat: {`[{"vraag":"...","antwoord":"..."}]`}
                </label>
                <textarea
                  placeholder={`[{"vraag":"Moet ik elke dag meedoen?","antwoord":"Nee. Je schrijft alleen als…"}]`}
                  value={form.vragenJson}
                  onChange={set("vragenJson")}
                  rows={5}
                  className={`${inputClass} font-mono text-xs`}
                />
              </div>
            </div>

            {/* Wie is Ien */}
            <div className="pt-2 border-t border-primary-100">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Wie is Ien</p>
              <div className="space-y-3">
                <div>
                  <label className={labelSmClass}>Titel "Wie is Ien"</label>
                  <input type="text" placeholder="Wie is Ien?" value={form.wieIsTitle} onChange={set("wieIsTitle")} className={inputClass} />
                </div>
                <div>
                  <label className={labelSmClass}>Tekst "Wie is Ien"</label>
                  <textarea placeholder="Ien is de oprichter van TalkToBenji…" value={form.wieIsText} onChange={set("wieIsText")} rows={3} className={inputClass} />
                </div>
              </div>
            </div>

            {/* Finale CTA */}
            <div className="pt-2 border-t border-primary-100">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Finale CTA</p>
              <div className="space-y-3">
                <div>
                  <label className={labelSmClass}>Titel finale CTA</label>
                  <input type="text" placeholder="Je hoeft het niet alleen te dragen." value={form.finalCtaTitle} onChange={set("finalCtaTitle")} className={inputClass} />
                </div>
                <div>
                  <label className={labelSmClass}>Bodytekst finale CTA</label>
                  <textarea placeholder="30 dagen. Elke dag één kleine stap…" value={form.finalCtaBody} onChange={set("finalCtaBody")} rows={3} className={inputClass} />
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="pt-2 border-t border-primary-100">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Footer</p>
              <div>
                <label className={labelSmClass}>Footertekst</label>
                <textarea placeholder='"Niet Alleen" is onderdeel van Talk To Benji…' value={form.footerText} onChange={set("footerText")} rows={3} className={inputClass} />
              </div>
            </div>

            {/* Knoppen */}
            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={handleSave}
                disabled={saving || !canSave}
                className="inline-flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg text-sm font-medium hover:bg-primary-700 disabled:opacity-50"
              >
                <Save size={18} />
                {saving ? "Bezig…" : "Opslaan"}
              </button>
              <button
                type="button"
                onClick={resetForm}
                className="inline-flex items-center gap-2 px-4 py-2 border border-primary-200 rounded-lg text-sm font-medium hover:bg-primary-50"
              >
                <X size={18} />
                Annuleren
              </button>
            </div>
          </div>
        )}

        {/* LIJST */}
        {!showForm && (
          <>
            {pages === undefined ? (
              <div className="py-8 text-center text-primary-600">Laden…</div>
            ) : pages.length === 0 ? (
              <p className="text-sm text-gray-500 py-4">
                Nog geen landingspagina's. Voeg er een toe of importeer de bestaande.
              </p>
            ) : (
              <ul className="space-y-3">
                {pages.map((page: LandingPage) => (
                  <li
                    key={page._id}
                    className="p-4 rounded-lg border border-primary-200 bg-white hover:bg-primary-50/50"
                  >
                    <div className="flex justify-between items-start gap-4">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 flex-wrap mb-1">
                          <span
                            className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                              page.isLive
                                ? "bg-green-100 text-green-800"
                                : "bg-gray-100 text-gray-600"
                            }`}
                          >
                            {page.isLive ? "Live" : "Verborgen"}
                          </span>
                          <code className="text-xs text-gray-500 bg-gray-100 px-1.5 py-0.5 rounded">
                            /lp/{page.slug}
                          </code>
                        </div>
                        <h3 className="font-medium text-primary-900 truncate">{page.pageTitle}</h3>
                        <p className="text-xs text-gray-400 mt-0.5">
                          Bijgewerkt{" "}
                          {new Date(page.updatedAt).toLocaleDateString("nl-NL", {
                            day: "numeric",
                            month: "short",
                            year: "numeric",
                          })}
                        </p>
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        {page.isLive && (
                          <a
                            href={`/lp/${page.slug}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-2 text-gray-500 hover:bg-gray-100 rounded-lg"
                            title="Bekijk pagina"
                          >
                            <ExternalLink size={17} />
                          </a>
                        )}
                        <button
                          type="button"
                          onClick={() => handleToggleLive(page._id)}
                          className={`p-2 rounded-lg ${page.isLive ? "text-green-600 hover:bg-green-50" : "text-gray-400 hover:bg-gray-100"}`}
                          title={page.isLive ? "Zet offline" : "Zet online"}
                        >
                          {page.isLive ? <Eye size={17} /> : <EyeOff size={17} />}
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDuplicate(page._id)}
                          className="p-2 text-gray-500 hover:bg-gray-100 rounded-lg"
                          title="Dupliceer"
                        >
                          <Copy size={17} />
                        </button>
                        <button
                          type="button"
                          onClick={() => startEdit(page)}
                          className="p-2 text-primary-600 hover:bg-primary-100 rounded-lg"
                          title="Bewerken"
                        >
                          <Edit size={17} />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDelete(page._id)}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                          title="Verwijderen"
                        >
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
