"use client";

import { useState, useRef, useEffect, useMemo } from "react";
import { useAdminQuery, useAdminMutation } from "../AdminAuthContext";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import {
  LayoutTemplate, Plus, Edit, Trash2, Save, X, Copy, Eye, EyeOff, ExternalLink, Download,
} from "lucide-react";

type PricingBlockForm = {
  titel: string;
  subtitel: string;
  prijs: string;
  tekst: string;
  aanbevolen: boolean;
  ctaTekst: string;
  ctaUrl: string;
};

const EMPTY_PRICING_BLOCK: PricingBlockForm = {
  titel: "", subtitel: "", prijs: "", tekst: "", aanbevolen: false, ctaTekst: "", ctaUrl: "",
};

type LandingPage = {
  _id: Id<"landingPages">;
  slug: string;
  pageTitle: string;
  isLive: boolean;
  heroLabel?: string;
  heroTitle: string;
  heroSubtitle?: string;
  heroBody?: string;
  heroVideoUrl?: string;
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
  lpType?: string;
  typeCtaUrlPersoon?: string;
  typeCtaUrlHuisdier?: string;
  typeCtaUrlRelatie?: string;
  typeCtaUrlKinderloos?: string;
  typeButtonLabelPersoon?: string;
  typeButtonLabelHuisdier?: string;
  typeButtonLabelRelatie?: string;
  typeButtonLabelKinderloos?: string;
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
  heroVideoUrl: string;
  ctaText: string;
  ctaUrl: string;
  ctaColor: string;
  hideErvaringen: boolean;
  hideVragen: boolean;
  hideWieIsIen: boolean;
  hideMidCta: boolean;
  hideWatJeKrijgt: boolean;
  hideStickyBar: boolean;
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
  vragen: { vraag: string; antwoord: string }[];
  wieIsTitle: string;
  wieIsText: string;
  finalCtaTitle: string;
  finalCtaBody: string;
  footerText: string;
  footerCtaUrl: string;
  trackAds: boolean;
  pricingBlocks: PricingBlockForm[];
  featureSliderLabel: string;
  featureSliderTitel: string;
  featureSlides: { titel: string; onderschrift: string; afbeelding: string; video: string; file: File | null; videoFile: File | null }[];
  pricingTitel: string;
  pricingSubtitel: string;
  ervaringenTitel: string;
  ervaringenSubtitel: string;
  faqTitel: string;
  faqSubtitel: string;
  voorWieSubtitel: string;
  lpType: string;
  typeCtaUrlPersoon: string;
  typeCtaUrlHuisdier: string;
  typeCtaUrlRelatie: string;
  typeCtaUrlKinderloos: string;
  typeButtonLabelPersoon: string;
  typeButtonLabelHuisdier: string;
  typeButtonLabelRelatie: string;
  typeButtonLabelKinderloos: string;
};

const EMPTY_FORM: FormState = {
  slug: "",
  pageTitle: "",
  isLive: false,
  heroLabel: "",
  heroTitle: "",
  heroSubtitle: "",
  heroBody: "",
  heroVideoUrl: "",
  ctaText: "",
  ctaUrl: "",
  ctaColor: "#6d84a8",
  hideErvaringen: false,
  hideVragen: false,
  hideWieIsIen: false,
  hideMidCta: false,
  hideWatJeKrijgt: false,
  hideStickyBar: false,
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
  vragen: [],
  wieIsTitle: "",
  wieIsText: "",
  finalCtaTitle: "",
  finalCtaBody: "",
  footerText: "",
  footerCtaUrl: "",
  trackAds: false,
  pricingBlocks: [{ ...EMPTY_PRICING_BLOCK }, { ...EMPTY_PRICING_BLOCK }, { ...EMPTY_PRICING_BLOCK }],
  featureSliderLabel: "",
  featureSliderTitel: "",
  pricingTitel: "",
  pricingSubtitel: "",
  ervaringenTitel: "",
  ervaringenSubtitel: "",
  faqTitel: "Misschien vraag je je af...",
  faqSubtitel: "",
  voorWieSubtitel: "",
  lpType: "",
  typeCtaUrlPersoon: "",
  typeCtaUrlHuisdier: "",
  typeCtaUrlRelatie: "",
  typeCtaUrlKinderloos: "",
  typeButtonLabelPersoon: "",
  typeButtonLabelHuisdier: "",
  typeButtonLabelRelatie: "",
  typeButtonLabelKinderloos: "",
  featureSlides: [
    { titel: "", onderschrift: "", afbeelding: "", video: "", file: null, videoFile: null },
    { titel: "", onderschrift: "", afbeelding: "", video: "", file: null, videoFile: null },
    { titel: "", onderschrift: "", afbeelding: "", video: "", file: null, videoFile: null },
    { titel: "", onderschrift: "", afbeelding: "", video: "", file: null, videoFile: null },
    { titel: "", onderschrift: "", afbeelding: "", video: "", file: null, videoFile: null },
    { titel: "", onderschrift: "", afbeelding: "", video: "", file: null, videoFile: null },
  ],
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
  const seedJaarToegang = useAdminMutation(api.landingPages.seedJaarToegang);
  const seedNietAlleenKeuzeLp = useAdminMutation(api.landingPages.seedNietAlleenKeuzeLp);
  const [jaarSeedStatus, setJaarSeedStatus] = useState<"idle" | "loading" | "done" | "error">("idle");
  const [naKeuzeSeedStatus, setNaKeuzeSeedStatus] = useState<"idle" | "loading" | "done" | "error">("idle");
  const generateUploadUrl = useAdminMutation(api.landingPages.generateUploadUrl);
  const getImageUrl = useAdminMutation(api.landingPages.getImageUrl);

  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<Id<"landingPages"> | null>(null);
  const [saving, setSaving] = useState(false);
  const [savedFeedback, setSavedFeedback] = useState(false);
  const [seedStatus, setSeedStatus] = useState<"idle" | "loading" | "done" | "error">("idle");
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [editingProductImageUrl, setEditingProductImageUrl] = useState<string | null>(null);
  const [editingBgImageUrl, setEditingBgImageUrl] = useState<string | null>(null);
  const productImageRef = useRef<HTMLInputElement>(null);
  const bgImageRef = useRef<HTMLInputElement>(null);
  const section1TextRef = useRef<HTMLTextAreaElement>(null);
  const section2TextRef = useRef<HTMLTextAreaElement>(null);
  const videoRef1 = useRef<HTMLInputElement>(null);
  const videoRef2 = useRef<HTMLInputElement>(null);
  const heroVideoRef = useRef<HTMLInputElement>(null);
  const [insertingVideo1, setInsertingVideo1] = useState(false);
  const [insertingVideo2, setInsertingVideo2] = useState(false);
  const [insertingHeroVideo, setInsertingHeroVideo] = useState(false);
  const [video1Centered, setVideo1Centered] = useState(false);
  const [video2Centered, setVideo2Centered] = useState(false);

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
      heroVideoUrl: (page as any).heroVideoUrl ?? "",
      ctaText: page.ctaText ?? "",
      ctaUrl: page.ctaUrl ?? "",
      ctaColor: (page as any).ctaColor ?? "#6d84a8",
      hideErvaringen: (page as any).hideErvaringen ?? false,
      hideVragen: (page as any).hideVragen ?? false,
      hideWieIsIen: (page as any).hideWieIsIen ?? false,
      hideMidCta: (page as any).hideMidCta ?? false,
      hideWatJeKrijgt: (page as any).hideWatJeKrijgt ?? false,
      hideStickyBar: (page as any).hideStickyBar ?? false,
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
      vragen: (() => { try { const p = JSON.parse(page.vragenJson ?? "[]"); return Array.isArray(p) ? p : []; } catch { return []; } })(),
      wieIsTitle: page.wieIsTitle ?? "",
      wieIsText: page.wieIsText ?? "",
      finalCtaTitle: page.finalCtaTitle ?? "",
      finalCtaBody: page.finalCtaBody ?? "",
      footerText: page.footerText ?? "",
      footerCtaUrl: (page as any).footerCtaUrl ?? "",
      trackAds: (page as any).trackAds ?? false,
      featureSliderLabel: (page as any).featureSliderLabel ?? "",
      featureSliderTitel: (page as any).featureSliderTitel ?? "",
      pricingTitel: (page as any).pricingTitel ?? "",
      pricingSubtitel: (page as any).pricingSubtitel ?? "",
      ervaringenTitel: (page as any).ervaringenTitel ?? "",
      ervaringenSubtitel: (page as any).ervaringenSubtitel ?? "",
      faqTitel: (page as any).faqTitel ?? "",
      faqSubtitel: (page as any).faqSubtitel ?? "",
      voorWieSubtitel: (page as any).voorWieSubtitel ?? "",
      lpType: (page as any).lpType ?? "",
      typeCtaUrlPersoon: (page as any).typeCtaUrlPersoon ?? "",
      typeCtaUrlHuisdier: (page as any).typeCtaUrlHuisdier ?? "",
      typeCtaUrlRelatie: (page as any).typeCtaUrlRelatie ?? "",
      typeCtaUrlKinderloos: (page as any).typeCtaUrlKinderloos ?? "",
      typeButtonLabelPersoon: (page as any).typeButtonLabelPersoon ?? "",
      typeButtonLabelHuisdier: (page as any).typeButtonLabelHuisdier ?? "",
      typeButtonLabelRelatie: (page as any).typeButtonLabelRelatie ?? "",
      typeButtonLabelKinderloos: (page as any).typeButtonLabelKinderloos ?? "",
      featureSlides: (() => {
        try {
          const parsed = JSON.parse((page as any).featureSlidesJson || "[]");
          if (Array.isArray(parsed) && parsed.length > 0) {
            const slides = parsed.map((s: any) => ({
              titel: s.titel ?? "", onderschrift: s.onderschrift ?? "",
              afbeelding: s.afbeelding ?? "", video: s.video ?? "", file: null, videoFile: null,
            }));
            while (slides.length < 6) slides.push({ titel: "", onderschrift: "", afbeelding: "", video: "", file: null, videoFile: null });
            return slides.slice(0, 6);
          }
        } catch {}
        return [
          { titel: "", onderschrift: "", afbeelding: "", video: "", file: null, videoFile: null },
          { titel: "", onderschrift: "", afbeelding: "", video: "", file: null, videoFile: null },
          { titel: "", onderschrift: "", afbeelding: "", video: "", file: null, videoFile: null },
          { titel: "", onderschrift: "", afbeelding: "", video: "", file: null, videoFile: null },
          { titel: "", onderschrift: "", afbeelding: "", video: "", file: null, videoFile: null },
          { titel: "", onderschrift: "", afbeelding: "", video: "", file: null, videoFile: null },
        ];
      })(),
      pricingBlocks: (() => {
        try {
          const parsed = JSON.parse((page as any).pricingBlocksJson || "[]");
          if (Array.isArray(parsed) && parsed.length > 0) {
            const blocks = parsed.map((b: Partial<PricingBlockForm>) => ({
              titel: b.titel ?? "", subtitel: b.subtitel ?? "", prijs: b.prijs ?? "",
              tekst: b.tekst ?? "", aanbevolen: b.aanbevolen ?? false,
              ctaTekst: b.ctaTekst ?? "", ctaUrl: b.ctaUrl ?? "",
            }));
            while (blocks.length < 3) blocks.push({ ...EMPTY_PRICING_BLOCK });
            return blocks.slice(0, 3);
          }
        } catch {}
        return [{ ...EMPTY_PRICING_BLOCK }, { ...EMPTY_PRICING_BLOCK }, { ...EMPTY_PRICING_BLOCK }];
      })(),
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

  const uploadHeroVideo = async (file: File) => {
    setInsertingHeroVideo(true);
    try {
      const storageId = await uploadFile(file);
      const videoUrl = await getImageUrl({ storageId });
      if (videoUrl) setForm((f) => ({ ...f, heroVideoUrl: videoUrl }));
    } finally {
      setInsertingHeroVideo(false);
    }
  };

  const insertVideoInSection = async (
    sectionRef: React.RefObject<HTMLTextAreaElement>,
    field: "section1Text" | "section2Text",
    file: File,
    centered: boolean,
    setInserting: (v: boolean) => void,
  ) => {
    setInserting(true);
    try {
      const storageId = await uploadFile(file);
      const videoUrl = await getImageUrl({ storageId });
      if (!videoUrl) return;
      const ta = sectionRef.current;
      const tag = centered ? `[video:${videoUrl}:center]` : `[video:${videoUrl}]`;
      if (ta) {
        const start = ta.selectionStart ?? ta.value.length;
        const newVal = ta.value.slice(0, start) + `\n\n${tag}\n\n` + ta.value.slice(start);
        setForm((f) => ({ ...f, [field]: newVal }));
      } else {
        setForm((f) => ({ ...f, [field]: f[field] + `\n\n${tag}\n\n` }));
      }
    } finally {
      setInserting(false);
    }
  };

  const buildFeatureSlidesJson = async (slides: FormState["featureSlides"]) => {
    const result = [];
    for (const slide of slides) {
      if (!slide.titel && !slide.afbeelding && !slide.video && !slide.file && !slide.videoFile) continue;
      let afbeelding = slide.afbeelding;
      let video = slide.video;
      if (slide.file) {
        const storageId = await uploadFile(slide.file);
        const url = await getImageUrl({ storageId });
        if (url) afbeelding = url;
      }
      if (slide.videoFile) {
        const storageId = await uploadFile(slide.videoFile);
        const url = await getImageUrl({ storageId });
        if (url) video = url;
      }
      result.push({ titel: slide.titel, onderschrift: slide.onderschrift, afbeelding, video });
    }
    return result.length ? JSON.stringify(result) : "";
  };

  const handleSave = async () => {
    if (!form.slug.trim() || !form.heroTitle.trim() || !form.pageTitle.trim()) return;
    setSaving(true);
    try {
      let productImageStorageId: Id<"_storage"> | undefined;
      let bgImageStorageId: Id<"_storage"> | undefined;
      if (form.productImageFile) productImageStorageId = await uploadFile(form.productImageFile);
      if (form.bgImageFile) bgImageStorageId = await uploadFile(form.bgImageFile);

      if (editingId) {
        // Bij bewerken: stuur lege strings door zodat Convex velden kan wissen
        await updatePage({
          id: editingId,
          slug: form.slug.trim(),
          pageTitle: form.pageTitle.trim(),
          isLive: form.isLive,
          heroTitle: form.heroTitle.trim(),
          heroLabel: form.heroLabel.trim(),
          heroSubtitle: form.heroSubtitle.trim(),
          heroBody: form.heroBody.trim(),
          heroVideoUrl: form.heroVideoUrl.trim(),
          ctaText: form.ctaText.trim(),
          ctaUrl: form.ctaUrl.trim(),
          ctaColor: form.ctaColor.trim(),
          hideErvaringen: form.hideErvaringen,
          hideVragen: form.hideVragen,
          hideWieIsIen: form.hideWieIsIen,
          hideMidCta: form.hideMidCta,
          hideWatJeKrijgt: form.hideWatJeKrijgt,
          hideStickyBar: form.hideStickyBar,
          section1Title: form.section1Title.trim(),
          section1Text: form.section1Text.trim(),
          section2Title: form.section2Title.trim(),
          section2Text: form.section2Text.trim(),
          productImageStorageId,
          productImagePath: form.productImagePath.trim(),
          bgImageStorageId,
          voorWieBullets: form.voorWieBullets.trim(),
          voorWieTitle: form.voorWieTitle.trim(),
          ervaringenJson: form.ervaringenJson.trim(),
          vragenJson: form.vragen.filter(v => v.vraag.trim()).length > 0 ? JSON.stringify(form.vragen.filter(v => v.vraag.trim())) : "",
          wieIsTitle: form.wieIsTitle.trim(),
          wieIsText: form.wieIsText.trim(),
          finalCtaTitle: form.finalCtaTitle.trim(),
          finalCtaBody: form.finalCtaBody.trim(),
          footerText: form.footerText.trim(),
          footerCtaUrl: form.footerCtaUrl.trim(),
          trackAds: form.trackAds,
          pricingBlocksJson: form.pricingBlocks.some(b => b.titel || b.prijs)
            ? JSON.stringify(form.pricingBlocks)
            : "",
          featureSliderLabel: form.featureSliderLabel.trim(),
          featureSliderTitel: form.featureSliderTitel.trim(),
          featureSlidesJson: await buildFeatureSlidesJson(form.featureSlides),
          pricingTitel: form.pricingTitel.trim(),
          pricingSubtitel: form.pricingSubtitel.trim(),
          ervaringenTitel: form.ervaringenTitel.trim(),
          ervaringenSubtitel: form.ervaringenSubtitel.trim(),
          faqTitel: form.faqTitel.trim(),
          faqSubtitel: form.faqSubtitel.trim(),
          voorWieSubtitel: form.voorWieSubtitel.trim(),
          lpType: form.lpType.trim(),
          typeCtaUrlPersoon: form.typeCtaUrlPersoon.trim(),
          typeCtaUrlHuisdier: form.typeCtaUrlHuisdier.trim(),
          typeCtaUrlRelatie: form.typeCtaUrlRelatie.trim(),
          typeCtaUrlKinderloos: form.typeCtaUrlKinderloos.trim(),
          typeButtonLabelPersoon: form.typeButtonLabelPersoon.trim(),
          typeButtonLabelHuisdier: form.typeButtonLabelHuisdier.trim(),
          typeButtonLabelRelatie: form.typeButtonLabelRelatie.trim(),
          typeButtonLabelKinderloos: form.typeButtonLabelKinderloos.trim(),
        });
        setSavedFeedback(true);
        setTimeout(() => setSavedFeedback(false), 2500);
      } else {
        await createPage({
          slug: form.slug.trim(),
          pageTitle: form.pageTitle.trim(),
          isLive: form.isLive,
          heroTitle: form.heroTitle.trim(),
          heroLabel: opt(form.heroLabel),
          heroSubtitle: opt(form.heroSubtitle),
          heroBody: opt(form.heroBody),
          heroVideoUrl: opt(form.heroVideoUrl),
          ctaText: opt(form.ctaText),
          ctaUrl: opt(form.ctaUrl),
          ctaColor: opt(form.ctaColor),
          hideErvaringen: form.hideErvaringen,
          hideVragen: form.hideVragen,
          hideWieIsIen: form.hideWieIsIen,
          hideMidCta: form.hideMidCta,
          hideWatJeKrijgt: form.hideWatJeKrijgt,
          hideStickyBar: form.hideStickyBar,
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
          vragenJson: opt(form.vragen.filter(v => v.vraag.trim()).length > 0 ? JSON.stringify(form.vragen.filter(v => v.vraag.trim())) : ""),
          wieIsTitle: opt(form.wieIsTitle),
          wieIsText: opt(form.wieIsText),
          finalCtaTitle: opt(form.finalCtaTitle),
          finalCtaBody: opt(form.finalCtaBody),
          footerText: opt(form.footerText),
          footerCtaUrl: opt(form.footerCtaUrl),
          trackAds: form.trackAds,
          pricingBlocksJson: form.pricingBlocks.some(b => b.titel || b.prijs)
            ? JSON.stringify(form.pricingBlocks)
            : undefined,
          featureSliderLabel: opt(form.featureSliderLabel),
          featureSliderTitel: opt(form.featureSliderTitel),
          featureSlidesJson: opt(await buildFeatureSlidesJson(form.featureSlides)),
          pricingTitel: opt(form.pricingTitel),
          pricingSubtitel: opt(form.pricingSubtitel),
          ervaringenTitel: opt(form.ervaringenTitel),
          ervaringenSubtitel: opt(form.ervaringenSubtitel),
          faqTitel: opt(form.faqTitel),
          faqSubtitel: opt(form.faqSubtitel),
          voorWieSubtitel: opt(form.voorWieSubtitel),
          lpType: opt(form.lpType),
          typeCtaUrlPersoon: opt(form.typeCtaUrlPersoon),
          typeCtaUrlHuisdier: opt(form.typeCtaUrlHuisdier),
          typeCtaUrlRelatie: opt(form.typeCtaUrlRelatie),
          typeCtaUrlKinderloos: opt(form.typeCtaUrlKinderloos),
          typeButtonLabelPersoon: opt(form.typeButtonLabelPersoon),
          typeButtonLabelHuisdier: opt(form.typeButtonLabelHuisdier),
          typeButtonLabelRelatie: opt(form.typeButtonLabelRelatie),
          typeButtonLabelKinderloos: opt(form.typeButtonLabelKinderloos),
        });
        resetForm();
      }
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
        <p className="text-xs text-primary-500 mb-4">Jaar-toegang is bewerkbaar via de lijst hierboven zodra je hem importeert.</p>
        <ul className="space-y-2">
          {/* jaar-toegang: importeerbaar */}
          {!pages?.find((p: LandingPage) => p.slug === "jaar-toegang") && (
            <li className="flex items-center justify-between p-3 rounded-lg border border-amber-200 bg-amber-50/40">
              <div>
                <p className="text-sm font-medium text-primary-900">1 jaar toegang — € 97 eenmalig</p>
                <div className="flex items-center gap-3 mt-0.5">
                  <code className="text-xs text-gray-500 bg-gray-100 px-1.5 py-0.5 rounded">/lp/jaar-toegang</code>
                  <span className="text-xs text-amber-600">Nog niet bewerkbaar — importeer eerst</span>
                </div>
              </div>
              <button
                type="button"
                onClick={async () => {
                  setJaarSeedStatus("loading");
                  try {
                    await seedJaarToegang({});
                    setJaarSeedStatus("done");
                    setTimeout(() => setJaarSeedStatus("idle"), 3000);
                  } catch {
                    setJaarSeedStatus("error");
                    setTimeout(() => setJaarSeedStatus("idle"), 3000);
                  }
                }}
                disabled={jaarSeedStatus === "loading"}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-primary-600 text-white rounded-lg text-xs font-medium hover:bg-primary-700 disabled:opacity-50"
              >
                <Download size={14} />
                {jaarSeedStatus === "loading" ? "Bezig…" : jaarSeedStatus === "done" ? "Geïmporteerd!" : "Importeer"}
              </button>
            </li>
          )}
          {!pages?.find((p: LandingPage) => p.slug === "je-hoeft-het-niet-alleen-te-doen") && (
            <li className="flex items-center justify-between p-3 rounded-lg border border-blue-200 bg-blue-50/40">
              <div>
                <p className="text-sm font-medium text-primary-900">Niet Alleen — Keuzepagina (insta/ads)</p>
                <div className="flex items-center gap-3 mt-0.5">
                  <code className="text-xs text-gray-500 bg-gray-100 px-1.5 py-0.5 rounded">/lp/je-hoeft-het-niet-alleen-te-doen</code>
                  <span className="text-xs text-blue-600">Nog niet aangemaakt — importeer eerst</span>
                </div>
              </div>
              <button
                type="button"
                onClick={async () => {
                  setNaKeuzeSeedStatus("loading");
                  try {
                    await seedNietAlleenKeuzeLp({});
                    setNaKeuzeSeedStatus("done");
                    setTimeout(() => setNaKeuzeSeedStatus("idle"), 3000);
                  } catch {
                    setNaKeuzeSeedStatus("error");
                    setTimeout(() => setNaKeuzeSeedStatus("idle"), 3000);
                  }
                }}
                disabled={naKeuzeSeedStatus === "loading"}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-primary-600 text-white rounded-lg text-xs font-medium hover:bg-primary-700 disabled:opacity-50"
              >
                <Download size={14} />
                {naKeuzeSeedStatus === "loading" ? "Bezig…" : naKeuzeSeedStatus === "done" ? "Aangemaakt!" : "Importeer"}
              </button>
            </li>
          )}
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

            <div className="flex flex-wrap gap-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={form.isLive} onChange={setCheck("isLive")} className="rounded border-primary-300 text-primary-600" />
                <span className="text-sm text-gray-700">Pagina is live (publiek zichtbaar)</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.trackAds}
                  onChange={(e) => setForm((f) => ({ ...f, trackAds: e.target.checked }))}
                  className="rounded border-primary-300 text-primary-600"
                />
                <span className="text-sm text-gray-700">Ad LP — zichtbaar in analytics</span>
              </label>
            </div>

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
                <div>
                  <label className={labelSmClass}>Hero video (optioneel — getoond onder bodytekst, boven de knop)</label>
                  <input ref={heroVideoRef} type="file" accept="video/mp4,video/webm,video/*" className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) uploadHeroVideo(file);
                      if (heroVideoRef.current) heroVideoRef.current.value = "";
                    }}
                  />
                  <div className="flex items-center gap-2">
                    <button type="button" onClick={() => heroVideoRef.current?.click()} disabled={insertingHeroVideo}
                      className="inline-flex items-center gap-1 px-3 py-1.5 border border-purple-200 rounded text-xs text-purple-700 hover:bg-purple-50 disabled:opacity-50">
                      🎬 {insertingHeroVideo ? "Uploaden…" : "Video uploaden"}
                    </button>
                    {form.heroVideoUrl && (
                      <>
                        <span className="text-xs text-green-600">✓ Video geladen</span>
                        <button type="button" onClick={() => setForm((f) => ({ ...f, heroVideoUrl: "" }))}
                          className="text-xs text-red-400 hover:text-red-600">Verwijderen</button>
                      </>
                    )}
                  </div>
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
                <div>
                  <label className={labelSmClass}>Knopkleur</label>
                  <div className="flex items-center gap-3 mt-1">
                    <input
                      type="color"
                      value={form.ctaColor || "#6d84a8"}
                      onChange={(e) => setForm((f) => ({ ...f, ctaColor: e.target.value }))}
                      className="h-9 w-14 rounded border border-primary-200 cursor-pointer p-0.5"
                    />
                    <div className="flex gap-2">
                      {["#6d84a8","#4a7c59","#c07a5a","#7c6d9e","#374151","#be185d"].map((c) => (
                        <button
                          key={c}
                          type="button"
                          onClick={() => setForm((f) => ({ ...f, ctaColor: c }))}
                          className="w-7 h-7 rounded-full border-2 transition-all"
                          style={{ background: c, borderColor: form.ctaColor === c ? "#1e293b" : "transparent" }}
                        />
                      ))}
                    </div>
                    <span className="text-xs text-gray-400">{form.ctaColor}</span>
                  </div>
                </div>
                <div>
                  <label className={labelSmClass}>Secties zichtbaar</label>
                  <div className="flex flex-wrap gap-4 mt-2">
                    {([
                      ["hideMidCta", "Tussenknop"],
                      ["hideErvaringen", "Ervaringen"],
                      ["hideVragen", "FAQ"],
                      ["hideWieIsIen", "Wie is Ien"],
                      ["hideWatJeKrijgt", "Wat je krijgt"],
                      ["hideStickyBar", "Onderste balk"],
                    ] as const).map(([field, label]) => (
                      <label key={field} className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={!form[field]}
                          onChange={(e) => setForm((f) => ({ ...f, [field]: !e.target.checked }))}
                          className="rounded"
                        />
                        <span className="text-sm text-primary-700">{label}</span>
                      </label>
                    ))}
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
                  <div className="flex items-center justify-between mb-1">
                    <label className={labelSmClass} style={{ marginBottom: 0 }}>Tekst sectie 1 (dubbele enter = nieuwe alinea)</label>
                    <div className="inline-flex items-center border border-purple-200 rounded overflow-hidden">
                      <input ref={videoRef1} type="file" accept="video/mp4,video/webm,video/*" className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) insertVideoInSection(section1TextRef, "section1Text", file, video1Centered, setInsertingVideo1);
                          if (videoRef1.current) videoRef1.current.value = "";
                        }}
                      />
                      <button type="button" onClick={() => videoRef1.current?.click()} disabled={insertingVideo1}
                        className="inline-flex items-center gap-1 px-2 py-1 text-xs text-purple-700 hover:bg-purple-50 disabled:opacity-50">
                        🎬 {insertingVideo1 ? "Uploaden…" : "Video invoegen"}
                      </button>
                      <button type="button" title={video1Centered ? "Gecentreerd" : "Volledige breedte"}
                        onClick={() => setVideo1Centered(v => !v)}
                        className={`px-1.5 py-1 text-xs border-l border-purple-200 transition-colors ${video1Centered ? "bg-purple-100 text-purple-800" : "text-purple-400 hover:bg-purple-50"}`}>
                        {video1Centered ? "▣" : "▬"}
                      </button>
                    </div>
                  </div>
                  <textarea ref={section1TextRef} placeholder="Het hoeft geen overlijden te zijn…" value={form.section1Text} onChange={set("section1Text")} rows={6} className={inputClass} />
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
                  <div className="flex items-center justify-between mb-1">
                    <label className={labelSmClass} style={{ marginBottom: 0 }}>Tekst sectie 2 (dubbele enter = nieuwe alinea)</label>
                    <div className="inline-flex items-center border border-purple-200 rounded overflow-hidden">
                      <input ref={videoRef2} type="file" accept="video/mp4,video/webm,video/*" className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) insertVideoInSection(section2TextRef, "section2Text", file, video2Centered, setInsertingVideo2);
                          if (videoRef2.current) videoRef2.current.value = "";
                        }}
                      />
                      <button type="button" onClick={() => videoRef2.current?.click()} disabled={insertingVideo2}
                        className="inline-flex items-center gap-1 px-2 py-1 text-xs text-purple-700 hover:bg-purple-50 disabled:opacity-50">
                        🎬 {insertingVideo2 ? "Uploaden…" : "Video invoegen"}
                      </button>
                      <button type="button" title={video2Centered ? "Gecentreerd" : "Volledige breedte"}
                        onClick={() => setVideo2Centered(v => !v)}
                        className={`px-1.5 py-1 text-xs border-l border-purple-200 transition-colors ${video2Centered ? "bg-purple-100 text-purple-800" : "text-purple-400 hover:bg-purple-50"}`}>
                        {video2Centered ? "▣" : "▬"}
                      </button>
                    </div>
                  </div>
                  <textarea ref={section2TextRef} placeholder="Elke ochtend ontvang je een bericht…" value={form.section2Text} onChange={set("section2Text")} rows={6} className={inputClass} />
                </div>
              </div>
            </div>

            {/* Prijsblokken */}
            <div className="pt-2 border-t border-primary-100">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Prijsblokken</p>
              <p className="text-xs text-gray-400 mb-3">Laat leeg om de sectie niet te tonen. Vul titel of prijs in om te activeren.</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
                <div>
                  <label className={labelSmClass}>Sectietitel boven de blokken</label>
                  <input type="text" placeholder="Kies jouw abonnement" value={form.pricingTitel} onChange={set("pricingTitel")} className={inputClass} />
                </div>
                <div>
                  <label className={labelSmClass}>Subtitel</label>
                  <input type="text" placeholder="Stap voor stap verder, op jouw tempo." value={form.pricingSubtitel} onChange={set("pricingSubtitel")} className={inputClass} />
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {form.pricingBlocks.map((block, i) => (
                  <div
                    key={i}
                    className={`rounded-xl border p-4 space-y-2.5 ${
                      block.aanbevolen
                        ? "border-primary-400 bg-primary-50/60"
                        : "border-primary-100 bg-white"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-gray-500">Blok {i + 1}</span>
                      <label className="flex items-center gap-1.5 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={block.aanbevolen}
                          onChange={(e) => setForm((f) => {
                            const blocks = [...f.pricingBlocks];
                            blocks[i] = { ...blocks[i], aanbevolen: e.target.checked };
                            return { ...f, pricingBlocks: blocks };
                          })}
                          className="rounded border-primary-300 text-primary-600"
                        />
                        <span className="text-xs text-primary-700">Aanbevolen</span>
                      </label>
                    </div>
                    <input
                      type="text"
                      placeholder="Titel (bijv. Maand)"
                      value={block.titel}
                      onChange={(e) => setForm((f) => {
                        const blocks = [...f.pricingBlocks];
                        blocks[i] = { ...blocks[i], titel: e.target.value };
                        return { ...f, pricingBlocks: blocks };
                      })}
                      className={inputClass}
                    />
                    <input
                      type="text"
                      placeholder="Subtitel (bijv. Probeer vrijblijvend)"
                      value={block.subtitel}
                      onChange={(e) => setForm((f) => {
                        const blocks = [...f.pricingBlocks];
                        blocks[i] = { ...blocks[i], subtitel: e.target.value };
                        return { ...f, pricingBlocks: blocks };
                      })}
                      className={inputClass}
                    />
                    <input
                      type="text"
                      placeholder="Prijs (bijv. € 9,97 / maand)"
                      value={block.prijs}
                      onChange={(e) => setForm((f) => {
                        const blocks = [...f.pricingBlocks];
                        blocks[i] = { ...blocks[i], prijs: e.target.value };
                        return { ...f, pricingBlocks: blocks };
                      })}
                      className={inputClass}
                    />
                    <textarea
                      placeholder={"Wat je krijgt (één punt per regel):\nOnbeperkt gesprekken\nCheck-ins & doelen\nHerinneringen bewaren"}
                      value={block.tekst}
                      onChange={(e) => setForm((f) => {
                        const blocks = [...f.pricingBlocks];
                        blocks[i] = { ...blocks[i], tekst: e.target.value };
                        return { ...f, pricingBlocks: blocks };
                      })}
                      rows={4}
                      className={`${inputClass} text-xs`}
                    />
                    <input
                      type="text"
                      placeholder="Knoptekst (bijv. Start nu)"
                      value={block.ctaTekst}
                      onChange={(e) => setForm((f) => {
                        const blocks = [...f.pricingBlocks];
                        blocks[i] = { ...blocks[i], ctaTekst: e.target.value };
                        return { ...f, pricingBlocks: blocks };
                      })}
                      className={inputClass}
                    />
                    <input
                      type="url"
                      placeholder="Knop URL"
                      value={block.ctaUrl}
                      onChange={(e) => setForm((f) => {
                        const blocks = [...f.pricingBlocks];
                        blocks[i] = { ...blocks[i], ctaUrl: e.target.value };
                        return { ...f, pricingBlocks: blocks };
                      })}
                      className={inputClass}
                    />
                  </div>
                ))}
              </div>
            </div>

            {/* Feature slider */}
            <div className="pt-2 border-t border-primary-100">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Feature slider</p>
              <p className="text-xs text-gray-400 mb-3">Afbeeldingen of video's met titels naast elkaar (slider op mobiel). Laat leeg om niet te tonen.</p>
              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className={labelSmClass}>Klein label boven de titel (bijv. WAT JE KRIJGT)</label>
                    <input type="text" placeholder="WAT JE KRIJGT" value={form.featureSliderLabel} onChange={set("featureSliderLabel")} className={inputClass} />
                  </div>
                  <div>
                    <label className={labelSmClass}>Titel boven de slider</label>
                    <input type="text" placeholder="Meer dan een gesprek" value={form.featureSliderTitel} onChange={set("featureSliderTitel")} className={inputClass} />
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {form.featureSlides.map((slide, i) => (
                    <div key={i} className="border border-primary-100 rounded-xl p-3 space-y-2 bg-white">
                      <p className="text-xs font-medium text-gray-500">Slide {i + 1}</p>
                      <input
                        type="text"
                        placeholder="Titel (bijv. Gesprek met Benji)"
                        value={slide.titel}
                        onChange={(e) => setForm((f) => {
                          const slides = [...f.featureSlides];
                          slides[i] = { ...slides[i], titel: e.target.value };
                          return { ...f, featureSlides: slides };
                        })}
                        className={inputClass}
                      />
                      <input
                        type="text"
                        placeholder="Onderschrift (optioneel)"
                        value={slide.onderschrift}
                        onChange={(e) => setForm((f) => {
                          const slides = [...f.featureSlides];
                          slides[i] = { ...slides[i], onderschrift: e.target.value };
                          return { ...f, featureSlides: slides };
                        })}
                        className={inputClass}
                      />
                      {/* Afbeelding */}
                      <div>
                        <label className={labelSmClass}>Afbeelding</label>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) => {
                            const file = e.target.files?.[0] ?? null;
                            setForm((f) => {
                              const slides = [...f.featureSlides];
                              slides[i] = { ...slides[i], file, afbeelding: file ? "" : slides[i].afbeelding };
                              return { ...f, featureSlides: slides };
                            });
                          }}
                          className="block w-full text-xs text-gray-500 file:mr-2 file:py-1 file:px-2 file:rounded file:border-0 file:bg-primary-100 file:text-primary-800"
                        />
                        {(slide.file || slide.afbeelding) && !slide.video && (
                          <div className="mt-1 flex items-center gap-2">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img src={slide.file ? URL.createObjectURL(slide.file) : slide.afbeelding} alt="" className="h-12 rounded object-cover border border-primary-100" />
                            <button type="button" onClick={() => setForm((f) => { const slides = [...f.featureSlides]; slides[i] = { ...slides[i], file: null, afbeelding: "" }; return { ...f, featureSlides: slides }; })} className="text-xs text-red-400 hover:text-red-600">Verwijderen</button>
                          </div>
                        )}
                      </div>
                      {/* Video */}
                      <div>
                        <label className={labelSmClass}>Of video</label>
                        <input
                          type="file"
                          accept="video/mp4,video/webm,video/*"
                          onChange={(e) => {
                            const videoFile = e.target.files?.[0] ?? null;
                            setForm((f) => {
                              const slides = [...f.featureSlides];
                              slides[i] = { ...slides[i], videoFile, video: videoFile ? "" : slides[i].video };
                              return { ...f, featureSlides: slides };
                            });
                          }}
                          className="block w-full text-xs text-gray-500 file:mr-2 file:py-1 file:px-2 file:rounded file:border-0 file:bg-purple-100 file:text-purple-800"
                        />
                        {(slide.videoFile || slide.video) && (
                          <div className="mt-1 flex items-center gap-2">
                            <span className="text-xs text-green-600">✓ {slide.videoFile ? "Nieuwe video" : "Video geladen"}</span>
                            <button type="button" onClick={() => setForm((f) => { const slides = [...f.featureSlides]; slides[i] = { ...slides[i], videoFile: null, video: "" }; return { ...f, featureSlides: slides }; })} className="text-xs text-red-400 hover:text-red-600">Verwijderen</button>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
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
              <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className={labelSmClass}>Titel boven de bullets (standaard: "Dit is voor jou als...")</label>
                  <input
                    type="text"
                    placeholder="Dit is voor jou als..."
                    value={form.voorWieTitle}
                    onChange={set("voorWieTitle")}
                    className={inputClass}
                  />
                </div>
                <div>
                  <label className={labelSmClass}>Subtitel onder de titel (optioneel)</label>
                  <input
                    type="text"
                    placeholder="Dan is Benji er voor jou."
                    value={form.voorWieSubtitel}
                    onChange={set("voorWieSubtitel")}
                    className={inputClass}
                  />
                </div>
              </div>
            </div>

            {/* Ervaringen */}
            <div className="pt-2 border-t border-primary-100">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Ervaringen</p>
              <div className="space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className={labelSmClass}>Sectietitel boven ervaringen</label>
                    <input type="text" placeholder="Wat anderen zeggen" value={form.ervaringenTitel} onChange={set("ervaringenTitel")} className={inputClass} />
                  </div>
                  <div>
                    <label className={labelSmClass}>Subtitel</label>
                    <input type="text" placeholder="Echte verhalen van mensen zoals jij." value={form.ervaringenSubtitel} onChange={set("ervaringenSubtitel")} className={inputClass} />
                  </div>
                </div>
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
                  {form.ervaringenJson.trim() && (() => { try { JSON.parse(form.ervaringenJson); return null; } catch { return <p className="text-xs text-red-500 mt-1">Ongeldige JSON — controleer komma's en aanhalingstekens</p>; } })()}
                </div>
              </div>
            </div>

            {/* FAQ */}
            <div className="pt-2 border-t border-primary-100">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">FAQ</p>
              <div className="space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className={labelSmClass}>Sectietitel boven FAQ</label>
                    <input type="text" placeholder="Misschien vraag je je af..." value={form.faqTitel} onChange={set("faqTitel")} className={inputClass} />
                  </div>
                  <div>
                    <label className={labelSmClass}>Subtitel</label>
                    <input type="text" placeholder="" value={form.faqSubtitel} onChange={set("faqSubtitel")} className={inputClass} />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className={labelSmClass}>Vragen & antwoorden</label>
                  {form.vragen.map((v, i) => (
                    <div key={i} className="border border-stone-200 rounded-xl p-3 space-y-2 bg-stone-50">
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-stone-400 font-medium w-4">{i + 1}</span>
                        <input
                          type="text"
                          placeholder="Vraag"
                          value={v.vraag}
                          onChange={e => {
                            const updated = form.vragen.map((x, j) => j === i ? { ...x, vraag: e.target.value } : x);
                            setForm(f => ({ ...f, vragen: updated }));
                          }}
                          className={`${inputClass} flex-1`}
                        />
                        <button
                          type="button"
                          onClick={() => setForm(f => ({ ...f, vragen: f.vragen.filter((_, j) => j !== i) }))}
                          className="text-stone-400 hover:text-red-500 transition-colors flex-shrink-0"
                        >
                          <X size={16} />
                        </button>
                      </div>
                      <textarea
                        placeholder="Antwoord"
                        value={v.antwoord}
                        onChange={e => {
                          const updated = form.vragen.map((x, j) => j === i ? { ...x, antwoord: e.target.value } : x);
                          setForm(f => ({ ...f, vragen: updated }));
                        }}
                        rows={2}
                        className={`${inputClass} ml-6 resize-none`}
                      />
                    </div>
                  ))}
                  <button
                    type="button"
                    onClick={() => setForm(f => ({ ...f, vragen: [...f.vragen, { vraag: "", antwoord: "" }] }))}
                    className="flex items-center gap-1.5 text-xs text-primary-600 hover:text-primary-800 font-medium"
                  >
                    <Plus size={14} /> Vraag toevoegen
                  </button>
                </div>
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
              <div className="space-y-3">
                <div>
                  <label className={labelSmClass}>Footertekst</label>
                  <textarea placeholder='"Niet Alleen" is onderdeel van Talk To Benji…' value={form.footerText} onChange={set("footerText")} rows={3} className={inputClass} />
                </div>
                <div>
                  <label className={labelSmClass}>Link in footertekst (URL) — als ingevuld wordt de footertekst klikbaar</label>
                  <input type="url" placeholder="https://www.talktobenji.com/lp/prijzen" value={form.footerCtaUrl} onChange={set("footerCtaUrl")} className={inputClass} />
                </div>
              </div>
            </div>

            {/* Niet Alleen Keuze LP */}
            <div className="pt-2 border-t border-primary-100">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Niet Alleen — Keuzepagina</p>
              <p className="text-xs text-gray-400 mb-3">Stel <code>lpType</code> in op <code>niet_alleen_keuze</code> om de keuzepagina te renderen (in plaats van de standaard LP). Vul de CTA-URL's in per verliestype — laat leeg om de knop uit te grijzen.</p>
              <div className="space-y-3">
                <div>
                  <label className={labelSmClass}>LP type (leeg = standaard, <code>niet_alleen_keuze</code> = keuzepagina)</label>
                  <input type="text" placeholder="niet_alleen_keuze" value={form.lpType} onChange={set("lpType")} className={inputClass} />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className={labelSmClass}>💔 Persoon — knoptekst (standaard: Ik mis iemand)</label>
                    <input type="text" placeholder="Ik mis iemand" value={form.typeButtonLabelPersoon} onChange={set("typeButtonLabelPersoon")} className={inputClass} />
                  </div>
                  <div>
                    <label className={labelSmClass}>💔 Persoon — CTA URL</label>
                    <input type="url" placeholder="https://…" value={form.typeCtaUrlPersoon} onChange={set("typeCtaUrlPersoon")} className={inputClass} />
                  </div>
                  <div>
                    <label className={labelSmClass}>🐾 Huisdier — knoptekst (standaard: Ik heb mijn dier verloren)</label>
                    <input type="text" placeholder="Ik heb mijn dier verloren" value={form.typeButtonLabelHuisdier} onChange={set("typeButtonLabelHuisdier")} className={inputClass} />
                  </div>
                  <div>
                    <label className={labelSmClass}>🐾 Huisdier — CTA URL</label>
                    <input type="url" placeholder="https://…" value={form.typeCtaUrlHuisdier} onChange={set("typeCtaUrlHuisdier")} className={inputClass} />
                  </div>
                  <div>
                    <label className={labelSmClass}>💭 Relatie — knoptekst (standaard: Mijn relatie is voorbij)</label>
                    <input type="text" placeholder="Mijn relatie is voorbij" value={form.typeButtonLabelRelatie} onChange={set("typeButtonLabelRelatie")} className={inputClass} />
                  </div>
                  <div>
                    <label className={labelSmClass}>💭 Relatie — CTA URL</label>
                    <input type="url" placeholder="https://…" value={form.typeCtaUrlRelatie} onChange={set("typeCtaUrlRelatie")} className={inputClass} />
                  </div>
                  <div>
                    <label className={labelSmClass}>🌱 Kinderloos — knoptekst (standaard: Ongewenst kinderloos)</label>
                    <input type="text" placeholder="Ongewenst kinderloos" value={form.typeButtonLabelKinderloos} onChange={set("typeButtonLabelKinderloos")} className={inputClass} />
                  </div>
                  <div>
                    <label className={labelSmClass}>🌱 Kinderloos — CTA URL</label>
                    <input type="url" placeholder="https://…" value={form.typeCtaUrlKinderloos} onChange={set("typeCtaUrlKinderloos")} className={inputClass} />
                  </div>
                </div>
              </div>
            </div>

            {/* Knoppen */}
            <div className="flex items-center gap-3 pt-2">
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
                {editingId ? "Sluiten" : "Annuleren"}
              </button>
              {savedFeedback && (
                <span className="text-sm text-green-600 font-medium">✓ Opgeslagen</span>
              )}
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
                          {page.slug.startsWith("niet-alleen-") && (
                            <span title="niet-alleen.nl" className="inline-block w-2.5 h-2.5 rounded-full bg-orange-400 shrink-0" />
                          )}
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
