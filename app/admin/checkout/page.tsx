"use client";

import { useState, useRef } from "react";
import { useAdminQuery, useAdminMutation, useAdminAuth } from "../AdminAuthContext";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { EVEN_HOUVAST_POPUP_DEFAULT_TEKST } from "@/components/EvenHouvastPopup";
import {
  CreditCard, Plus, Edit, Trash2, Save, X, ExternalLink, Send, Copy, ChevronDown,
} from "lucide-react";

type GiftVariantForm = {
  label: string;
  priceInCents: string;
  billingPeriod: "monthly" | "quarterly" | "half_yearly" | "yearly";
  accessDays: string;
};

type ReviewForm = { author: string; role: string; text: string; imageStorageId?: string; imagePreviewUrl?: string; imageFile?: File | null };
type ExtraTextBlockForm = { title: string; content: string; imageStorageId?: string; imagePreviewUrl?: string; imageFile?: File | null };

type CheckoutProduct = {
  _id: Id<"checkoutProducts">;
  slug: string;
  name: string;
  kortNaam?: string;
  verliesType?: string;
  description?: string;
  priceInCents: number;
  stripePriceId?: string;
  subscriptionType: string;
  buttonText?: string;
  trustText?: string;
  quoteText?: string;
  imageStorageId?: Id<"_storage">;
  imageUrl?: string | null;
  accessDays?: number;
  isLive: boolean;
  followUpEmailSubject?: string;
  followUpEmailBody?: string;
  giftEnabled?: boolean;
  b2bEnabled?: boolean;
  evenHouvastPopupEnabled?: boolean;
  evenHouvastPopupTekst?: string;
  giftVariants?: { label: string; priceInCents: number; billingPeriod: "monthly" | "quarterly" | "half_yearly" | "yearly"; accessDays: number }[];
  addOnEnabled?: boolean;
  addOnLabel?: string;
  addOnDescription?: string;
  addOnPriceInCents?: number;
  addOnType?: string;
  addOnAccessDays?: number;
  benefits?: string[];
  reviews?: { author: string; role?: string; text: string; imageStorageId?: string; imageUrl?: string | null }[];
  extraTextBlocks?: { title?: string; content: string; imageStorageId?: string; imageUrl?: string | null }[];
  checkoutLayout?: string;
  rustigeContent?: {
    hero?: { imageStorageId?: string; imageUrl?: string | null; titel?: string; subtitel?: string; intro?: string; bullets?: string[]; prijsLabel?: string; buttonText?: string };
    watJeKrijgt?: { imageStorageId?: string; imageUrl?: string | null; titel?: string; tekst?: string; bullets?: string[]; prompts?: { dag: string; vraag: string }[] };
    herkenning?: { imageStorageId?: string; imageUrl?: string | null; quote?: string; intro?: string; bullets?: string[]; slot?: string };
    reviewsTitel?: string;
    benjiVerhaal?: { imageStorageId?: string; imageUrl?: string | null; titel?: string; tekst?: string };
    veiligheid?: { bullets?: string[]; buttonText?: string };
    faq?: { vraag: string; antwoord: string }[];
  } | null;
  createdAt: number;
  updatedAt: number;
};

type FormState = {
  slug: string;
  name: string;
  kortNaam: string;
  verliesType: string;
  description: string;
  priceInCents: string;
  stripePriceId: string;
  subscriptionType: string;
  buttonText: string;
  trustText: string;
  quoteText: string;
  accessDays: string;
  imageStorageId?: Id<"_storage">;
  imageFile: File | null;
  isLive: boolean;
  followUpEmailSubject: string;
  followUpEmailBody: string;
  giftEnabled: boolean;
  b2bEnabled: boolean;
  evenHouvastPopupEnabled: boolean;
  evenHouvastPopupTekst: string;
  addOnEnabled: boolean;
  addOnLabel: string;
  addOnDescription: string;
  addOnPriceInCents: string;
  addOnType: string;
  addOnAccessDays: string;
  checkoutLayout: string; // "standaard" | "rustig"
};

// Rustige checkout-variant: alle teksten als regel-gebaseerde velden (eenvoudig te bewerken)
type RustigForm = {
  heroTitel: string; heroSubtitel: string; heroIntro: string; heroBullets: string; heroPrijsLabel: string; heroButton: string;
  heroImageFile: File | null; heroImageStorageId?: string; heroImageUrl?: string | null;
  wjkTitel: string; wjkTekst: string; wjkBullets: string; wjkPrompts: string;
  wjkImageFile: File | null; wjkImageStorageId?: string; wjkImageUrl?: string | null;
  herkQuote: string; herkIntro: string; herkBullets: string; herkSlot: string;
  herkImageFile: File | null; herkImageStorageId?: string; herkImageUrl?: string | null;
  reviewsTitel: string;
  benjiTitel: string; benjiTekst: string;
  benjiImageFile: File | null; benjiImageStorageId?: string; benjiImageUrl?: string | null;
  veiligBullets: string; veiligButton: string;
  faq: string;
};

const EMPTY_RUSTIG: RustigForm = {
  heroTitel: "", heroSubtitel: "", heroIntro: "", heroBullets: "", heroPrijsLabel: "", heroButton: "",
  heroImageFile: null, heroImageStorageId: undefined, heroImageUrl: null,
  wjkTitel: "", wjkTekst: "", wjkBullets: "", wjkPrompts: "",
  wjkImageFile: null, wjkImageStorageId: undefined, wjkImageUrl: null,
  herkQuote: "", herkIntro: "", herkBullets: "", herkSlot: "",
  herkImageFile: null, herkImageStorageId: undefined, herkImageUrl: null,
  reviewsTitel: "",
  benjiTitel: "", benjiTekst: "",
  benjiImageFile: null, benjiImageStorageId: undefined, benjiImageUrl: null,
  veiligBullets: "", veiligButton: "",
  faq: "",
};

// Regel-helpers voor de rustige velden
const naarRegels = (arr?: string[]) => (arr ?? []).join("\n");
const regelsNaarArr = (s: string) => s.split("\n").map((r) => r.trim()).filter(Boolean);
const splitPipe = (regel: string): [string, string] => {
  const i = regel.indexOf("|");
  return i === -1 ? [regel.trim(), ""] : [regel.slice(0, i).trim(), regel.slice(i + 1).trim()];
};

function rustigFromProduct(product: CheckoutProduct): RustigForm {
  const rc = product.rustigeContent ?? undefined;
  return {
    heroTitel: rc?.hero?.titel ?? "", heroSubtitel: rc?.hero?.subtitel ?? "", heroIntro: rc?.hero?.intro ?? "",
    heroBullets: naarRegels(rc?.hero?.bullets), heroPrijsLabel: rc?.hero?.prijsLabel ?? "", heroButton: rc?.hero?.buttonText ?? "",
    heroImageFile: null, heroImageStorageId: rc?.hero?.imageStorageId, heroImageUrl: rc?.hero?.imageUrl ?? null,
    wjkTitel: rc?.watJeKrijgt?.titel ?? "", wjkTekst: rc?.watJeKrijgt?.tekst ?? "", wjkBullets: naarRegels(rc?.watJeKrijgt?.bullets),
    wjkPrompts: (rc?.watJeKrijgt?.prompts ?? []).map((p) => `${p.dag} | ${p.vraag}`).join("\n"),
    wjkImageFile: null, wjkImageStorageId: rc?.watJeKrijgt?.imageStorageId, wjkImageUrl: rc?.watJeKrijgt?.imageUrl ?? null,
    herkQuote: rc?.herkenning?.quote ?? "", herkIntro: rc?.herkenning?.intro ?? "", herkBullets: naarRegels(rc?.herkenning?.bullets), herkSlot: rc?.herkenning?.slot ?? "",
    herkImageFile: null, herkImageStorageId: rc?.herkenning?.imageStorageId, herkImageUrl: rc?.herkenning?.imageUrl ?? null,
    reviewsTitel: rc?.reviewsTitel ?? "",
    benjiTitel: rc?.benjiVerhaal?.titel ?? "", benjiTekst: rc?.benjiVerhaal?.tekst ?? "",
    benjiImageFile: null, benjiImageStorageId: rc?.benjiVerhaal?.imageStorageId, benjiImageUrl: rc?.benjiVerhaal?.imageUrl ?? null,
    veiligBullets: naarRegels(rc?.veiligheid?.bullets), veiligButton: rc?.veiligheid?.buttonText ?? "",
    faq: (rc?.faq ?? []).map((f) => `${f.vraag} | ${f.antwoord}`).join("\n"),
  };
}

const EMPTY_FORM: FormState = {
  slug: "",
  name: "",
  kortNaam: "",
  verliesType: "",
  description: "",
  priceInCents: "",
  stripePriceId: "",
  subscriptionType: "alles_in_1",
  buttonText: "",
  trustText: "",
  quoteText: "",
  accessDays: "",
  imageStorageId: undefined,
  imageFile: null,
  isLive: false,
  followUpEmailSubject: "",
  followUpEmailBody: "",
  giftEnabled: false,
  b2bEnabled: true,
  evenHouvastPopupEnabled: false,
  evenHouvastPopupTekst: "",
  addOnEnabled: false,
  addOnLabel: "",
  addOnDescription: "",
  addOnPriceInCents: "",
  addOnType: "",
  addOnAccessDays: "",
  checkoutLayout: "standaard",
};

function opt(val: string): string | undefined {
  return val.trim() || undefined;
}

function formatPrice(cents: number): string {
  return new Intl.NumberFormat("nl-NL", { style: "currency", currency: "EUR" }).format(cents / 100);
}

const EMPTY_VARIANT: GiftVariantForm = { label: "", priceInCents: "", billingPeriod: "monthly", accessDays: "30" };
const BILLING_OPTIONS = [
  { value: "monthly", label: "Maand" },
  { value: "quarterly", label: "Kwartaal" },
  { value: "half_yearly", label: "Half jaar" },
  { value: "yearly", label: "Jaar" },
] as const;

function RustigImage({ label, file, url, onPick, onClear }: {
  label: string;
  file: File | null;
  url?: string | null;
  onPick: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onClear: () => void;
}) {
  const preview = file ? URL.createObjectURL(file) : url ?? null;
  return (
    <div>
      <span className="block text-xs text-gray-500 mb-1">{label}</span>
      <div className="flex items-center gap-3">
        {preview ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={preview} alt="" className="w-16 h-16 rounded-lg object-cover border border-stone-200" />
        ) : (
          <div className="w-16 h-16 rounded-lg border border-dashed border-stone-300 flex items-center justify-center text-[10px] text-gray-400">geen</div>
        )}
        <label className="text-xs text-primary-600 hover:text-primary-800 cursor-pointer border border-dashed border-primary-300 rounded-lg px-2 py-1.5 hover:bg-primary-50">
          {preview ? "Vervangen" : "Uploaden"}
          <input type="file" accept="image/*" onChange={onPick} className="hidden" />
        </label>
        {preview && (
          <button type="button" onClick={onClear} className="text-xs text-red-500 hover:text-red-700">Verwijderen</button>
        )}
      </div>
    </div>
  );
}

export default function AdminCheckoutPage() {
  const { adminToken } = useAdminAuth();
  const products = useAdminQuery(api.checkoutProducts.list, {});
  const verliesTypen = useAdminQuery(api.verliesTypen.list, {});
  const createProduct = useAdminMutation(api.checkoutProducts.create);
  const updateProduct = useAdminMutation(api.checkoutProducts.update);
  const removeProduct = useAdminMutation(api.checkoutProducts.remove);
  const generateUploadUrl = useAdminMutation(api.checkoutProducts.generateUploadUrl);
  const getImageUrl = useAdminMutation(api.landingPages.getImageUrl);

  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<Id<"checkoutProducts"> | null>(null);
  const [editingImageUrl, setEditingImageUrl] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [giftVariants, setGiftVariants] = useState<GiftVariantForm[]>([]);
  const [benefits, setBenefits] = useState<string[]>([]);
  const [reviews, setReviews] = useState<ReviewForm[]>([]);
  const [extraTextBlocks, setExtraTextBlocks] = useState<ExtraTextBlockForm[]>([]);
  const [rustig, setRustig] = useState<RustigForm>(EMPTY_RUSTIG);
  const [savedOk, setSavedOk] = useState(false);
  const [testEmail, setTestEmail] = useState("");
  const [sendingTest, setSendingTest] = useState(false);
  const [testStatus, setTestStatus] = useState<"idle" | "sent" | "error">("idle");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const set = (field: keyof FormState) => (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => setForm((f) => ({ ...f, [field]: e.target.value }));

  const setCheck = (field: keyof FormState) => (
    e: React.ChangeEvent<HTMLInputElement>
  ) => setForm((f) => ({ ...f, [field]: e.target.checked }));

  const setR = (field: keyof RustigForm) => (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => setRustig((r) => ({ ...r, [field]: e.target.value }));
  const setRImg = (field: "heroImageFile" | "wjkImageFile" | "herkImageFile" | "benjiImageFile") => (
    e: React.ChangeEvent<HTMLInputElement>
  ) => { const file = e.target.files?.[0] ?? null; if (file) setRustig((r) => ({ ...r, [field]: file })); };

  const resetForm = () => {
    setForm(EMPTY_FORM);
    setGiftVariants([]);
    setBenefits([]);
    setReviews([]);
    setExtraTextBlocks([]);
    setRustig(EMPTY_RUSTIG);
    setEditingId(null);
    setEditingImageUrl(null);
    setShowForm(false);
  };

  const variantsToForm = (v?: CheckoutProduct["giftVariants"]): GiftVariantForm[] =>
    (v ?? []).map((x) => ({
      label: x.label,
      priceInCents: String(x.priceInCents),
      billingPeriod: x.billingPeriod,
      accessDays: String(x.accessDays),
    }));

  const startDuplicate = (product: CheckoutProduct) => {
    setForm({
      slug: `${product.slug}-kopie`,
      name: `${product.name} (kopie)`,
      kortNaam: product.kortNaam ?? "",
      verliesType: product.verliesType ?? "",
      description: product.description ?? "",
      priceInCents: String(product.priceInCents),
      stripePriceId: "",
      subscriptionType: product.subscriptionType,
      buttonText: product.buttonText ?? "",
      trustText: product.trustText ?? "",
      quoteText: product.quoteText ?? "",
      accessDays: product.accessDays != null ? String(product.accessDays) : "",
      imageStorageId: product.imageStorageId,
      imageFile: null,
      isLive: false,
      followUpEmailSubject: product.followUpEmailSubject ?? "",
      followUpEmailBody: product.followUpEmailBody ?? "",
      giftEnabled: product.giftEnabled ?? false,
      b2bEnabled: product.b2bEnabled ?? true,
      evenHouvastPopupEnabled: product.evenHouvastPopupEnabled ?? false,
      evenHouvastPopupTekst: product.evenHouvastPopupTekst ?? "",
      addOnEnabled: product.addOnEnabled ?? !!(product.addOnLabel && product.addOnPriceInCents),
      addOnLabel: product.addOnLabel ?? "",
      addOnDescription: product.addOnDescription ?? "",
      addOnPriceInCents: product.addOnPriceInCents != null ? String(product.addOnPriceInCents) : "",
      addOnType: product.addOnType ?? "",
      addOnAccessDays: product.addOnAccessDays != null ? String(product.addOnAccessDays) : "",
      checkoutLayout: product.checkoutLayout ?? "standaard",
    });
    setRustig(rustigFromProduct(product));
    setGiftVariants(variantsToForm(product.giftVariants));
    setBenefits(product.benefits ?? []);
    setReviews((product.reviews ?? []).map((r) => ({ author: r.author, role: r.role ?? "", text: r.text, imageStorageId: r.imageStorageId, imagePreviewUrl: r.imageUrl ?? undefined, imageFile: null })));
    setExtraTextBlocks((product.extraTextBlocks ?? []).map((b) => ({ title: b.title ?? "", content: b.content, imageStorageId: b.imageStorageId, imagePreviewUrl: b.imageUrl ?? undefined, imageFile: null })));
    setEditingImageUrl(product.imageUrl ?? null);
    setEditingId(null);
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const startEdit = (product: CheckoutProduct) => {
    setForm({
      slug: product.slug,
      name: product.name,
      kortNaam: product.kortNaam ?? "",
      verliesType: product.verliesType ?? "",
      description: product.description ?? "",
      priceInCents: String(product.priceInCents),
      stripePriceId: product.stripePriceId ?? "",
      subscriptionType: product.subscriptionType,
      buttonText: product.buttonText ?? "",
      trustText: product.trustText ?? "",
      quoteText: product.quoteText ?? "",
      accessDays: product.accessDays != null ? String(product.accessDays) : "",
      imageStorageId: product.imageStorageId,
      imageFile: null,
      isLive: product.isLive,
      followUpEmailSubject: product.followUpEmailSubject ?? "",
      followUpEmailBody: product.followUpEmailBody ?? "",
      giftEnabled: product.giftEnabled ?? false,
      b2bEnabled: product.b2bEnabled ?? true,
      evenHouvastPopupEnabled: product.evenHouvastPopupEnabled ?? false,
      evenHouvastPopupTekst: product.evenHouvastPopupTekst ?? "",
      addOnEnabled: product.addOnEnabled ?? !!(product.addOnLabel && product.addOnPriceInCents),
      addOnLabel: product.addOnLabel ?? "",
      addOnDescription: product.addOnDescription ?? "",
      addOnPriceInCents: product.addOnPriceInCents != null ? String(product.addOnPriceInCents) : "",
      addOnType: product.addOnType ?? "",
      addOnAccessDays: product.addOnAccessDays != null ? String(product.addOnAccessDays) : "",
      checkoutLayout: product.checkoutLayout ?? "standaard",
    });
    setRustig(rustigFromProduct(product));
    setGiftVariants(variantsToForm(product.giftVariants));
    setBenefits(product.benefits ?? []);
    setReviews((product.reviews ?? []).map((r) => ({ author: r.author, role: r.role ?? "", text: r.text, imageStorageId: r.imageStorageId, imagePreviewUrl: r.imageUrl ?? undefined, imageFile: null })));
    setExtraTextBlocks((product.extraTextBlocks ?? []).map((b) => ({ title: b.title ?? "", content: b.content, imageStorageId: b.imageStorageId, imagePreviewUrl: b.imageUrl ?? undefined, imageFile: null })));
    setEditingImageUrl(product.imageUrl ?? null);
    setEditingId(product._id);
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
    if (!form.slug.trim() || !form.name.trim() || !form.priceInCents.trim()) return;
    const price = parseInt(form.priceInCents, 10);
    if (isNaN(price) || price <= 0) return;
    setSaving(true);
    try {
      let imageStorageId = form.imageStorageId;
      if (form.imageFile) {
        imageStorageId = await uploadFile(form.imageFile);
      }
      const accessDaysVal = form.accessDays.trim() ? parseInt(form.accessDays, 10) : undefined;
      const parsedVariants = giftVariants
        .filter((v) => v.label.trim() && v.priceInCents.trim() && v.accessDays.trim())
        .map((v) => ({
          label: v.label.trim(),
          priceInCents: parseInt(v.priceInCents, 10),
          billingPeriod: v.billingPeriod,
          accessDays: parseInt(v.accessDays, 10),
        }))
        .filter((v) => !isNaN(v.priceInCents) && !isNaN(v.accessDays) && v.priceInCents > 0);

      // Rustige layout: bouw de gestructureerde content op (incl. sectie-afbeeldingen)
      let rustigeContent: any = undefined;
      if (form.checkoutLayout === "rustig") {
        const secImg = async (file: File | null, existing?: string) =>
          file ? await uploadFile(file) : (existing as Id<"_storage"> | undefined);
        const heroImg = await secImg(rustig.heroImageFile, rustig.heroImageStorageId);
        const wjkImg = await secImg(rustig.wjkImageFile, rustig.wjkImageStorageId);
        const herkImg = await secImg(rustig.herkImageFile, rustig.herkImageStorageId);
        const benjiImg = await secImg(rustig.benjiImageFile, rustig.benjiImageStorageId);
        rustigeContent = {
          hero: {
            imageStorageId: heroImg,
            titel: opt(rustig.heroTitel), subtitel: opt(rustig.heroSubtitel), intro: opt(rustig.heroIntro),
            bullets: regelsNaarArr(rustig.heroBullets), prijsLabel: opt(rustig.heroPrijsLabel), buttonText: opt(rustig.heroButton),
          },
          watJeKrijgt: {
            imageStorageId: wjkImg,
            titel: opt(rustig.wjkTitel), tekst: opt(rustig.wjkTekst), bullets: regelsNaarArr(rustig.wjkBullets),
            prompts: regelsNaarArr(rustig.wjkPrompts).map((r) => { const [dag, vraag] = splitPipe(r); return { dag, vraag }; }).filter((p) => p.dag || p.vraag),
          },
          herkenning: {
            imageStorageId: herkImg,
            quote: opt(rustig.herkQuote), intro: opt(rustig.herkIntro), bullets: regelsNaarArr(rustig.herkBullets), slot: opt(rustig.herkSlot),
          },
          reviewsTitel: opt(rustig.reviewsTitel),
          benjiVerhaal: { imageStorageId: benjiImg, titel: opt(rustig.benjiTitel), tekst: opt(rustig.benjiTekst) },
          veiligheid: { bullets: regelsNaarArr(rustig.veiligBullets), buttonText: opt(rustig.veiligButton) },
          faq: regelsNaarArr(rustig.faq).map((r) => { const [vraag, antwoord] = splitPipe(r); return { vraag, antwoord }; }).filter((f) => f.vraag),
        };
      }

      const payload = {
        slug: form.slug.trim(),
        name: form.name.trim(),
        kortNaam: opt(form.kortNaam),
        verliesType: opt(form.verliesType),
        description: opt(form.description),
        priceInCents: price,
        stripePriceId: opt(form.stripePriceId),
        subscriptionType: form.subscriptionType,
        buttonText: opt(form.buttonText),
        trustText: opt(form.trustText),
        quoteText: opt(form.quoteText),
        accessDays: accessDaysVal,
        imageStorageId,
        isLive: form.isLive,
        followUpEmailSubject: opt(form.followUpEmailSubject),
        followUpEmailBody: opt(form.followUpEmailBody),
        giftEnabled: form.giftEnabled,
        b2bEnabled: form.b2bEnabled,
        evenHouvastPopupEnabled: form.evenHouvastPopupEnabled,
        evenHouvastPopupTekst: form.evenHouvastPopupTekst.trim() || undefined,
        giftVariants: parsedVariants.length > 0 ? parsedVariants : undefined,
        addOnEnabled: form.addOnEnabled,
        addOnLabel: form.addOnEnabled ? opt(form.addOnLabel) : undefined,
        addOnDescription: form.addOnEnabled ? opt(form.addOnDescription) : undefined,
        addOnPriceInCents: form.addOnEnabled && form.addOnPriceInCents.trim() ? parseInt(form.addOnPriceInCents, 10) : undefined,
        addOnType: form.addOnEnabled ? opt(form.addOnType) : undefined,
        addOnAccessDays: form.addOnEnabled && form.addOnAccessDays.trim() ? parseInt(form.addOnAccessDays, 10) : undefined,
        benefits: benefits.map((b) => b.trim()).filter(Boolean).length > 0
          ? benefits.map((b) => b.trim()).filter(Boolean)
          : undefined,
        reviews: await Promise.all(
          reviews.filter((r) => r.author.trim() && r.text.trim()).map(async (r) => {
            let imgId: Id<"_storage"> | undefined = r.imageStorageId as Id<"_storage"> | undefined;
            if (r.imageFile) imgId = await uploadFile(r.imageFile);
            return {
              author: r.author.trim(),
              role: r.role.trim() || undefined,
              text: r.text.trim(),
              imageStorageId: imgId,
            };
          })
        ),
        extraTextBlocks: await Promise.all(
          // Behoud blokken met tekst óf een afbeelding (een foto-only blok mag niet wegvallen)
          extraTextBlocks.filter((b) => b.content.trim() || b.imageFile || b.imageStorageId).map(async (b) => {
            let imgId: Id<"_storage"> | undefined = b.imageStorageId as Id<"_storage"> | undefined;
            if (b.imageFile) imgId = await uploadFile(b.imageFile);
            return {
              title: b.title.trim() || undefined,
              content: b.content.trim(),
              imageStorageId: imgId,
            };
          })
        ),
        checkoutLayout: form.checkoutLayout,
        rustigeContent,
      };
      if (editingId) {
        // Geen afbeelding meer? Stuur clearImage mee zodat de mutatie het veld echt wist
        // (een undefined imageStorageId wordt anders overgeslagen en blijft de oude staan).
        await updateProduct({ id: editingId, ...payload, clearImage: !imageStorageId });
      } else {
        const newId = await createProduct(payload);
        setEditingId(newId);
      }
      setSavedOk(true);
      setTimeout(() => setSavedOk(false), 2500);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: Id<"checkoutProducts">) => {
    if (!confirm("Weet je zeker dat je dit product wilt verwijderen?")) return;
    await removeProduct({ id });
  };

  const canSave =
    form.slug.trim() &&
    form.name.trim() &&
    form.priceInCents.trim() &&
    !isNaN(parseInt(form.priceInCents, 10));

  const inputClass =
    "w-full px-3 py-2 border border-primary-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-400";
  const labelClass = "block text-sm font-medium text-gray-700 mb-1";
  const labelSmClass = "block text-xs text-gray-500 mb-1";

  // Preview URL: newly selected file takes priority over existing stored URL
  const previewUrl = form.imageFile
    ? URL.createObjectURL(form.imageFile)
    : editingImageUrl ?? null;

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-xl sm:text-2xl font-bold text-primary-900 flex items-center gap-2">
          <CreditCard size={28} className="text-primary-600" />
          Checkout producten
        </h1>
        <p className="text-sm text-primary-700 mt-1">
          Beheer betaalpagina's bereikbaar via /betalen/[slug].
        </p>
      </div>

      {/* Formulier */}
      <div className="bg-white rounded-xl border border-primary-200 p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="font-semibold text-primary-900">
            {showForm ? (editingId ? "Product bewerken" : "Nieuw product") : "Producten"}
          </h2>
          {!showForm && (
            <button
              type="button"
              onClick={() => { resetForm(); setShowForm(true); }}
              className="inline-flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg text-sm font-medium hover:bg-primary-700"
            >
              <Plus size={18} />
              Nieuw product
            </button>
          )}
        </div>

        {showForm && (
          <div className="space-y-4 mb-6">
            {/* Link naar pagina bij bewerken */}
            {editingId && (
              <a
                href={`/betalen/${form.slug}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-sm text-primary-600 hover:underline"
              >
                <ExternalLink size={15} />
                Bekijk pagina: /betalen/{form.slug}
              </a>
            )}

            {/* Basis */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className={labelClass}>
                  Slug <span className="text-gray-400 font-normal text-xs">(URL: /betalen/slug)</span>
                </label>
                <input
                  type="text"
                  placeholder="niet-alleen"
                  value={form.slug}
                  onChange={set("slug")}
                  className={inputClass}
                />
              </div>
              <div>
                <label className={labelClass}>Productnaam *</label>
                <input
                  type="text"
                  placeholder="Niet Alleen — 30 dagen begeleiding"
                  value={form.name}
                  onChange={set("name")}
                  className={inputClass}
                />
              </div>
            </div>

            <div>
              <label className={labelSmClass}>
                Korte naam <span className="text-gray-400">(optioneel — voor omzetpagina; laat leeg om volledige naam te gebruiken)</span>
              </label>
              <input
                type="text"
                placeholder="N.A."
                value={form.kortNaam}
                onChange={set("kortNaam")}
                className={inputClass}
              />
            </div>

            <div>
              <label className={labelSmClass}>
                Dagelijkse mailreeks <span className="text-gray-400">(optioneel — alleen invullen als dit product het Niet Alleen programma activeert)</span>
              </label>
              <select
                value={form.verliesType}
                onChange={set("verliesType")}
                className={inputClass}
              >
                <option value="">Geen — alleen bevestigingsmail</option>
                {(verliesTypen ?? []).map((t: { code: string; naam: string }) => (
                  <option key={t.code} value={t.code}>{t.naam}</option>
                ))}
              </select>
            </div>

            <div>
              <label className={labelSmClass}>Omschrijving (optioneel)</label>
              <textarea
                placeholder="Beschrijving van het product…"
                value={form.description}
                onChange={set("description")}
                rows={4}
                className={inputClass}
              />
            </div>

            {/* Afbeelding upload */}
            <div>
              <label className={labelSmClass}>Afbeelding (optioneel)</label>
              {previewUrl && (
                <div className="mb-2">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={previewUrl}
                    alt="Preview"
                    className="rounded-xl object-cover max-h-48 w-full"
                  />
                </div>
              )}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0] ?? null;
                  if (file) setForm((f) => ({ ...f, imageFile: file }));
                  // Reset zodat dezelfde afbeelding opnieuw kiezen ook werkt
                  e.target.value = "";
                }}
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="px-3 py-2 border border-primary-200 rounded-lg text-sm text-primary-700 hover:bg-primary-50"
              >
                {previewUrl ? "Andere afbeelding kiezen" : "Afbeelding uploaden"}
              </button>
              {previewUrl && (
                <button
                  type="button"
                  onClick={() => {
                    setForm((f) => ({ ...f, imageFile: null, imageStorageId: undefined }));
                    setEditingImageUrl(null);
                    if (fileInputRef.current) fileInputRef.current.value = "";
                  }}
                  className="ml-2 px-3 py-2 border border-red-200 rounded-lg text-sm text-red-600 hover:bg-red-50"
                >
                  Verwijderen
                </button>
              )}
            </div>

            {/* Prijs & stripe */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className={labelClass}>
                  Prijs in centen * <span className="text-gray-400 font-normal text-xs">(bijv. 3700 = €37,00)</span>
                </label>
                <input
                  type="number"
                  placeholder="3700"
                  min="1"
                  value={form.priceInCents}
                  onChange={set("priceInCents")}
                  className={inputClass}
                />
              </div>
              <div>
                <label className={labelClass}>
                  Toegangsduur in dagen *{" "}
                  <span className="text-gray-400 font-normal text-xs">(30 = maand · 90 = kwartaal · 365 = jaar)</span>
                </label>
                <input
                  type="number"
                  placeholder="365"
                  min="1"
                  value={form.accessDays}
                  onChange={set("accessDays")}
                  className={inputClass}
                />
              </div>
            </div>
            <div>
              <label className={labelSmClass}>Stripe Price ID (optioneel)</label>
              <input
                type="text"
                placeholder="price_1Abc..."
                value={form.stripePriceId}
                onChange={set("stripePriceId")}
                className={inputClass}
              />
            </div>

            {/* Abonnement type & knoptekst */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className={labelClass}>
                  Producttype * <span className="text-gray-400 font-normal text-xs">(unieke code per product)</span>
                </label>
                <input
                  type="text"
                  placeholder="troostende_woorden"
                  value={form.subscriptionType}
                  onChange={set("subscriptionType")}
                  className={inputClass}
                />
                <p className="text-xs text-gray-400 mt-1">Gebruik alleen kleine letters en underscores. Voorbeelden: <span className="font-mono">niet_alleen</span>, <span className="font-mono">er_zijn</span>, <span className="font-mono">troostende_woorden</span></p>
              </div>
              <div>
                <label className={labelSmClass}>Knoptekst (standaard: "Betalen")</label>
                <input
                  type="text"
                  placeholder="Start mijn reis"
                  value={form.buttonText}
                  onChange={set("buttonText")}
                  className={inputClass}
                />
              </div>
              <div>
                <label className={labelSmClass}>Zin onder de knop <span className="font-normal text-gray-400">(standaard: "Niet tevreden, voelt het niet goed? Laat het weten.")</span></label>
                <input
                  type="text"
                  placeholder="Niet tevreden, voelt het niet goed? Laat het weten."
                  value={form.trustText}
                  onChange={set("trustText")}
                  className={inputClass}
                />
              </div>
              <div className="sm:col-span-2">
                <label className={labelSmClass}>Quote boven knop <span className="font-normal text-gray-400">(geruststellende zin; standaard: "Dit is geen grote beslissing…")</span></label>
                <textarea
                  rows={2}
                  placeholder="Dit is geen grote beslissing. Het is gewoon dertig dagen een moment voor jezelf."
                  value={form.quoteText}
                  onChange={set("quoteText")}
                  className={`${inputClass} resize-none`}
                />
                <p className="text-xs text-gray-400 mt-1">Aanhalingstekens worden automatisch toegevoegd. Leeg = standaardzin.</p>
              </div>
            </div>

            {/* Bevestigingsmail na aankoop */}
            <div className="border-t border-primary-100 pt-4 space-y-3">
              <p className="text-sm font-medium text-primary-900">
                Bevestigingsmail na aankoop{" "}
                <span className="text-xs text-gray-400 font-normal">
                  (optioneel — laat leeg om geen mail te sturen)
                </span>
              </p>
              <div>
                <label className={labelSmClass}>
                  Onderwerp <span className="text-gray-400">— gebruik &#123;naam&#125; voor voornaam koper</span>
                </label>
                <input
                  type="text"
                  placeholder="Je gids staat klaar, {naam}!"
                  value={form.followUpEmailSubject}
                  onChange={set("followUpEmailSubject")}
                  className={inputClass}
                />
              </div>
              <div>
                <label className={labelSmClass}>
                  Tekst <span className="text-gray-400">— &#123;naam&#125; = voornaam · lege regel = nieuwe alinea · [linktekst](https://...) = klikbare link</span>
                </label>
                <textarea
                  placeholder={`Hi {naam},\n\nJe kunt de gids hier vinden: [Er Zijn](https://talktobenji.com/er-zijn)\n\nVeel leesplezier!`}
                  value={form.followUpEmailBody}
                  onChange={set("followUpEmailBody")}
                  rows={6}
                  className={inputClass}
                />
              </div>
              {/* Testmail versturen */}
              {form.followUpEmailSubject && form.followUpEmailBody && (
                <div className="flex items-center gap-2 flex-wrap">
                  <input
                    type="email"
                    placeholder="jouw@email.com"
                    value={testEmail}
                    onChange={(e) => { setTestEmail(e.target.value); setTestStatus("idle"); }}
                    className="flex-1 min-w-0 px-3 py-2 border border-primary-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-400"
                  />
                  <button
                    type="button"
                    disabled={sendingTest || !testEmail}
                    onClick={async () => {
                      setSendingTest(true);
                      setTestStatus("idle");
                      try {
                        const res = await fetch("/api/admin/send-test-email", {
                          method: "POST",
                          headers: { "Content-Type": "application/json" },
                          body: JSON.stringify({
                            adminToken,
                            toEmail: testEmail,
                            subject: form.followUpEmailSubject,
                            body: form.followUpEmailBody,
                            productName: form.name,
                          }),
                        });
                        setTestStatus(res.ok ? "sent" : "error");
                      } catch {
                        setTestStatus("error");
                      } finally {
                        setSendingTest(false);
                      }
                    }}
                    className="inline-flex items-center gap-2 px-3 py-2 border border-primary-300 rounded-lg text-sm text-primary-700 hover:bg-primary-50 disabled:opacity-50 shrink-0"
                  >
                    <Send size={15} />
                    {sendingTest ? "Versturen…" : "Testmail sturen"}
                  </button>
                  {testStatus === "sent" && <span className="text-sm text-green-600">✓ Verzonden</span>}
                  {testStatus === "error" && <span className="text-sm text-red-600">Mislukt</span>}
                </div>
              )}
            </div>

            <div className="border-t border-primary-100 pt-4 space-y-3">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.giftEnabled}
                  onChange={setCheck("giftEnabled")}
                  className="rounded border-primary-300 text-primary-600"
                />
                <span className="text-sm text-gray-700">
                  Cadeau-optie tonen op checkout{" "}
                  <span className="text-xs text-gray-400 font-normal">
                    — koper kan aanvinken dat het een cadeau is en een code ontvangen
                  </span>
                </span>
              </label>

              {/* Cadeau-varianten (looptijdkeuze) */}
              {form.giftEnabled && (
                <div className="pl-6 space-y-2">
                  <p className="text-xs text-gray-500">
                    Looptijdvarianten <span className="text-gray-400">(optioneel — bij meerdere varianten kan de koper kiezen)</span>
                  </p>
                  {giftVariants.map((v, i) => (
                    <div key={i} className="flex items-center gap-2 flex-wrap">
                      <input
                        type="text"
                        placeholder="Label (bijv. Maand)"
                        value={v.label}
                        onChange={(e) => setGiftVariants((prev) => prev.map((x, j) => j === i ? { ...x, label: e.target.value } : x))}
                        className="flex-1 min-w-[90px] px-2.5 py-1.5 border border-primary-200 rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-primary-400"
                      />
                      <input
                        type="number"
                        placeholder="Prijs centen"
                        value={v.priceInCents}
                        min="1"
                        onChange={(e) => setGiftVariants((prev) => prev.map((x, j) => j === i ? { ...x, priceInCents: e.target.value } : x))}
                        className="w-28 px-2.5 py-1.5 border border-primary-200 rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-primary-400"
                      />
                      <select
                        value={v.billingPeriod}
                        onChange={(e) => setGiftVariants((prev) => prev.map((x, j) => j === i ? { ...x, billingPeriod: e.target.value as GiftVariantForm["billingPeriod"] } : x))}
                        className="px-2 py-1.5 border border-primary-200 rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-primary-400"
                      >
                        {BILLING_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                      </select>
                      <input
                        type="number"
                        placeholder="Dagen"
                        value={v.accessDays}
                        min="1"
                        onChange={(e) => setGiftVariants((prev) => prev.map((x, j) => j === i ? { ...x, accessDays: e.target.value } : x))}
                        className="w-20 px-2.5 py-1.5 border border-primary-200 rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-primary-400"
                      />
                      <button
                        type="button"
                        onClick={() => setGiftVariants((prev) => prev.filter((_, j) => j !== i))}
                        className="p-1.5 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      >
                        <X size={14} />
                      </button>
                    </div>
                  ))}
                  <button
                    type="button"
                    onClick={() => setGiftVariants((prev) => [...prev, { ...EMPTY_VARIANT }])}
                    className="flex items-center gap-1.5 text-xs text-primary-600 hover:text-primary-800 px-2 py-1.5 border border-dashed border-primary-300 rounded-lg hover:bg-primary-50 transition-colors"
                  >
                    <Plus size={13} />
                    Variant toevoegen
                  </button>
                  {giftVariants.length > 0 && (
                    <p className="text-xs text-gray-400">Prijs in centen · Looptijd · Dagen toegang</p>
                  )}
                </div>
              )}

              {/* Zakelijke aankoop tonen */}
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.b2bEnabled}
                  onChange={setCheck("b2bEnabled")}
                  className="rounded border-primary-300 text-primary-600"
                />
                <span className="text-sm text-gray-700">
                  &quot;Zakelijke aankoop?&quot; tonen op checkout{" "}
                  <span className="text-xs text-gray-400 font-normal">
                    — koper kan een btw-nummer invullen (reverse charge, geen btw)
                  </span>
                </span>
              </label>

              {/* Even Houvast-pop-up */}
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.evenHouvastPopupEnabled}
                  onChange={setCheck("evenHouvastPopupEnabled")}
                  className="rounded border-primary-300 text-primary-600"
                />
                <span className="text-sm text-gray-700">
                  Even Houvast-pop-up bij ~80% scroll{" "}
                  <span className="text-xs text-gray-400 font-normal">
                    — zachte gratis instap voor wie nog twijfelt
                  </span>
                </span>
              </label>
              {form.evenHouvastPopupEnabled && (
                <div className="ml-6 space-y-2">
                  <textarea
                    value={form.evenHouvastPopupTekst}
                    onChange={(e) => setForm((f) => ({ ...f, evenHouvastPopupTekst: e.target.value }))}
                    rows={9}
                    placeholder={EVEN_HOUVAST_POPUP_DEFAULT_TEKST}
                    className="w-full rounded-lg border border-primary-200 p-2 text-sm"
                  />
                  <p className="text-xs text-gray-400">
                    Eerste regel = kop. Elke regel = alinea. Opmaak: **vet**, *schuin*, _onderstreept_. Leeg laten = standaardtekst.
                  </p>
                  <label className="inline-flex items-center gap-1.5 text-xs text-primary-600 cursor-pointer">
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={async (e) => {
                        const file = e.target.files?.[0];
                        if (!file) return;
                        const sid = await uploadFile(file);
                        const url = await getImageUrl({ storageId: sid });
                        if (!url) return;
                        setForm((f) => ({
                          ...f,
                          evenHouvastPopupTekst:
                            (f.evenHouvastPopupTekst.trim() ? f.evenHouvastPopupTekst.trimEnd() + "\n" : "") + `[afbeelding:${url}]`,
                        }));
                        e.target.value = "";
                      }}
                    />
                    <span className="underline">+ Afbeelding toevoegen</span>
                  </label>
                </div>
              )}

              {/* Kassakoopje */}
              <div className="border border-primary-100 rounded-lg p-4 space-y-3 bg-primary-50">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={form.addOnEnabled}
                    onChange={setCheck("addOnEnabled")}
                    className="rounded border-primary-300 text-primary-600"
                  />
                  <span className="text-sm font-semibold text-primary-800">
                    Kassakoopje tonen{" "}
                    <span className="text-xs text-primary-600 font-normal">— extra product dat de koper kan aanvinken; prijs telt op bij het totaal</span>
                  </span>
                </label>
                {form.addOnEnabled && (
                  <>
                    <div>
                      <label className={labelClass}>Label <span className="text-gray-400 font-normal">(bijv. &quot;30 dagen Benji&quot;)</span></label>
                      <input className={inputClass} value={form.addOnLabel} onChange={set("addOnLabel")} placeholder="30 dagen Benji" />
                    </div>
                    <div>
                      <label className={labelClass}>Omschrijving</label>
                      <input className={inputClass} value={form.addOnDescription} onChange={set("addOnDescription")} placeholder="Praat 30 dagen één-op-één met Benji" />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className={labelClass}>Prijs in centen <span className="text-gray-400 font-normal">(bijv. 1000 = €10)</span></label>
                        <input className={inputClass} type="number" value={form.addOnPriceInCents} onChange={set("addOnPriceInCents")} placeholder="1000" />
                      </div>
                      <div>
                        <label className={labelClass}>Type toegang</label>
                        <select className={inputClass} value={form.addOnType} onChange={set("addOnType")}>
                          <option value="">— geen speciale toegang —</option>
                          <option value="benji_access">TTB chat-toegang</option>
                        </select>
                      </div>
                    </div>
                    {form.addOnType === "benji_access" && (
                      <div>
                        <label className={labelClass}>Dagen toegang</label>
                        <input className={inputClass} type="number" value={form.addOnAccessDays} onChange={set("addOnAccessDays")} placeholder="30" />
                      </div>
                    )}
                  </>
                )}
              </div>

              {/* Voordelen (vinkjes) */}
              <div className="border border-primary-100 rounded-lg p-4 space-y-3 bg-primary-50">
                <p className="text-sm font-semibold text-primary-800">Voordelen / vinkjes (optioneel)</p>
                <p className="text-xs text-primary-600">Korte voordeel-regels met een vinkje, bovenaan de checkout (bijv. &quot;30 dagen elke ochtend een bericht&quot;). Houd ze kort en concreet.</p>
                {benefits.map((b, i) => (
                  <div key={i} className="flex gap-2 items-center">
                    <span className="text-primary-500 flex-shrink-0">✓</span>
                    <input
                      className={inputClass}
                      value={b}
                      onChange={(e) => setBenefits((prev) => prev.map((x, j) => j === i ? e.target.value : x))}
                      placeholder="Elke ochtend een persoonlijk bericht in je inbox"
                    />
                    <button
                      type="button"
                      onClick={() => setBenefits((prev) => prev.filter((_, j) => j !== i))}
                      className="p-1.5 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors flex-shrink-0"
                    >
                      <X size={14} />
                    </button>
                  </div>
                ))}
                <button
                  type="button"
                  onClick={() => setBenefits((prev) => [...prev, ""])}
                  className="flex items-center gap-1.5 text-xs text-primary-600 hover:text-primary-800 px-2 py-1.5 border border-dashed border-primary-300 rounded-lg hover:bg-primary-50 transition-colors"
                >
                  <Plus size={13} />
                  Vinkje toevoegen
                </button>
              </div>

              {/* Reviews / testimonials */}
              <div className="border border-primary-100 rounded-lg p-4 space-y-3 bg-primary-50">
                <p className="text-sm font-semibold text-primary-800">Reviews / testimonials (optioneel)</p>
                <p className="text-xs text-primary-600">Worden getoond op de checkout pagina onder de betaling. Een foto wekt meer vertrouwen dan een initiaal.</p>
                {reviews.map((r, i) => (
                  <div key={i} className="bg-white border border-primary-100 rounded-lg p-3 space-y-2">
                    <div className="flex gap-2">
                      <div className="flex-1">
                        <label className={labelSmClass}>Naam</label>
                        <input
                          className={inputClass}
                          value={r.author}
                          onChange={(e) => setReviews((prev) => prev.map((x, j) => j === i ? { ...x, author: e.target.value } : x))}
                          placeholder="Anna"
                        />
                      </div>
                      <div className="flex-1">
                        <label className={labelSmClass}>Omschrijving <span className="text-gray-400">(optioneel)</span></label>
                        <input
                          className={inputClass}
                          value={r.role}
                          onChange={(e) => setReviews((prev) => prev.map((x, j) => j === i ? { ...x, role: e.target.value } : x))}
                          placeholder="Moeder van drie"
                        />
                      </div>
                      <button
                        type="button"
                        onClick={() => setReviews((prev) => prev.filter((_, j) => j !== i))}
                        className="self-end p-1.5 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      >
                        <X size={14} />
                      </button>
                    </div>
                    <div>
                      <label className={labelSmClass}>Tekst</label>
                      <textarea
                        className={`${inputClass} resize-none`}
                        value={r.text}
                        onChange={(e) => setReviews((prev) => prev.map((x, j) => j === i ? { ...x, text: e.target.value } : x))}
                        rows={2}
                        placeholder="&quot;Dit heeft me echt geholpen in een moeilijke periode.&quot;"
                      />
                    </div>
                    <div>
                      <label className={labelSmClass}>Foto <span className="text-gray-400">(optioneel — anders een initiaal)</span></label>
                      <div className="flex items-center gap-3">
                        {r.imagePreviewUrl && (
                          <div className="relative flex-shrink-0">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img src={r.imagePreviewUrl} alt="" className="w-12 h-12 rounded-full object-cover" />
                            <button
                              type="button"
                              onClick={() => setReviews((prev) => prev.map((x, j) => j === i ? { ...x, imageFile: null, imageStorageId: undefined, imagePreviewUrl: undefined } : x))}
                              className="absolute -top-1 -right-1 p-0.5 bg-white rounded-full text-red-500 hover:text-red-700 shadow"
                            >
                              <X size={11} />
                            </button>
                          </div>
                        )}
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          id={`review-img-${i}`}
                          onChange={(e) => {
                            const file = e.target.files?.[0] ?? null;
                            if (file) {
                              const previewUrl = URL.createObjectURL(file);
                              setReviews((prev) => prev.map((x, j) => j === i ? { ...x, imageFile: file, imagePreviewUrl: previewUrl, imageStorageId: undefined } : x));
                            }
                            e.target.value = "";
                          }}
                        />
                        <label
                          htmlFor={`review-img-${i}`}
                          className="cursor-pointer inline-flex items-center gap-1.5 px-3 py-1.5 border border-primary-200 rounded-lg text-xs text-primary-700 hover:bg-primary-50 transition-colors"
                        >
                          {r.imagePreviewUrl ? "Andere foto" : "Foto uploaden"}
                        </label>
                      </div>
                    </div>
                  </div>
                ))}
                <button
                  type="button"
                  onClick={() => setReviews((prev) => [...prev, { author: "", role: "", text: "" }])}
                  className="flex items-center gap-1.5 text-xs text-primary-600 hover:text-primary-800 px-2 py-1.5 border border-dashed border-primary-300 rounded-lg hover:bg-primary-50 transition-colors"
                >
                  <Plus size={13} />
                  Review toevoegen
                </button>
              </div>

              {/* Extra tekstblokken */}
              <div className="border border-primary-100 rounded-lg p-4 space-y-3 bg-primary-50">
                <p className="text-sm font-semibold text-primary-800">Extra tekstblokken (optioneel)</p>
                <p className="text-xs text-primary-600">Vrije blokken met optionele titel + tekst + afbeelding, getoond direct onder de prijs (bijv. &quot;wat het programma inhoudt&quot;).</p>
                {extraTextBlocks.map((b, i) => (
                  <div key={i} className="bg-white border border-primary-100 rounded-lg p-3 space-y-2">
                    <div className="flex items-start gap-2">
                      <div className="flex-1 space-y-2">
                        <div>
                          <label className={labelSmClass}>Titel <span className="text-gray-400">(optioneel)</span></label>
                          <input
                            className={inputClass}
                            value={b.title}
                            onChange={(e) => setExtraTextBlocks((prev) => prev.map((x, j) => j === i ? { ...x, title: e.target.value } : x))}
                            placeholder="Wat je krijgt"
                          />
                        </div>
                        <div>
                          <label className={labelSmClass}>Tekst <span className="text-gray-400">(lege regel = nieuwe alinea)</span></label>
                          <textarea
                            className={`${inputClass} resize-none`}
                            value={b.content}
                            onChange={(e) => setExtraTextBlocks((prev) => prev.map((x, j) => j === i ? { ...x, content: e.target.value } : x))}
                            rows={4}
                            placeholder="Eerste alinea&#10;&#10;Tweede alinea"
                          />
                        </div>
                        <div>
                          <label className={labelSmClass}>Afbeelding <span className="text-gray-400">(optioneel)</span></label>
                          {b.imagePreviewUrl && (
                            <div className="mb-1.5 relative">
                              {/* eslint-disable-next-line @next/next/no-img-element */}
                              <img src={b.imagePreviewUrl} alt="" className="rounded-lg max-h-32 w-full object-cover" />
                              <button
                                type="button"
                                onClick={() => setExtraTextBlocks((prev) => prev.map((x, j) => j === i ? { ...x, imageFile: null, imageStorageId: undefined, imagePreviewUrl: undefined } : x))}
                                className="absolute top-1 right-1 p-1 bg-white/90 rounded-full text-red-500 hover:text-red-700 shadow"
                              >
                                <X size={12} />
                              </button>
                            </div>
                          )}
                          <input
                            type="file"
                            accept="image/*"
                            className="hidden"
                            id={`block-img-${i}`}
                            onChange={(e) => {
                              const file = e.target.files?.[0] ?? null;
                              if (file) {
                                const previewUrl = URL.createObjectURL(file);
                                setExtraTextBlocks((prev) => prev.map((x, j) => j === i ? { ...x, imageFile: file, imagePreviewUrl: previewUrl, imageStorageId: undefined } : x));
                              }
                              // Reset zodat dezelfde afbeelding opnieuw kiezen ook werkt
                              e.target.value = "";
                            }}
                          />
                          <label
                            htmlFor={`block-img-${i}`}
                            className="cursor-pointer inline-flex items-center gap-1.5 px-3 py-1.5 border border-primary-200 rounded-lg text-xs text-primary-700 hover:bg-primary-50 transition-colors"
                          >
                            {b.imagePreviewUrl ? "Andere afbeelding" : "Afbeelding uploaden"}
                          </label>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => setExtraTextBlocks((prev) => prev.filter((_, j) => j !== i))}
                        className="p-1.5 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors mt-5"
                      >
                        <X size={14} />
                      </button>
                    </div>
                  </div>
                ))}
                <button
                  type="button"
                  onClick={() => setExtraTextBlocks((prev) => [...prev, { title: "", content: "" }])}
                  className="flex items-center gap-1.5 text-xs text-primary-600 hover:text-primary-800 px-2 py-1.5 border border-dashed border-primary-300 rounded-lg hover:bg-primary-50 transition-colors"
                >
                  <Plus size={13} />
                  Tekstblok toevoegen
                </button>
              </div>

              {/* ── Layout-keuze ── */}
              <div className="border-t border-primary-100 pt-4">
                <label className={labelClass}>Layout van de checkout</label>
                <select value={form.checkoutLayout} onChange={set("checkoutLayout")} className={inputClass}>
                  <option value="standaard">Standaard checkout</option>
                  <option value="rustig">Rustige checkout (verdriet/rouw)</option>
                </select>
                <p className="text-xs text-gray-400 mt-1">
                  &ldquo;Rustig&rdquo; toont de zachte opbouw in 7 secties hieronder. De velden vallen terug op nette standaardteksten als je ze leeg laat.
                </p>
              </div>

              {/* ── Rustige checkout: secties ── */}
              {form.checkoutLayout === "rustig" && (
                <div className="space-y-5 bg-stone-50 border border-stone-200 rounded-xl p-4">
                  <p className="text-sm text-gray-500">
                    Tip: bij vinkjes-lijsten zet je één regel per vinkje. Bij prompts en FAQ gebruik je het formaat <code className="bg-white px-1 rounded">links | rechts</code> (één per regel).
                  </p>

                  {/* Sectie 1 — Hero */}
                  <div className="space-y-2">
                    <p className="text-sm font-semibold text-primary-800">1. Hero</p>
                    <RustigImage label="Hero-afbeelding" file={rustig.heroImageFile} url={rustig.heroImageUrl} onPick={setRImg("heroImageFile")} onClear={() => setRustig((r) => ({ ...r, heroImageFile: null, heroImageStorageId: undefined, heroImageUrl: null }))} />
                    <input className={inputClass} placeholder="Titel (bijv. Niet Alleen)" value={rustig.heroTitel} onChange={setR("heroTitel")} />
                    <textarea className={inputClass} rows={2} placeholder="Subtitel" value={rustig.heroSubtitel} onChange={setR("heroSubtitel")} />
                    <input className={inputClass} placeholder="Intro-regel (bijv. 💙 Een klein dagelijks ankerpunt…)" value={rustig.heroIntro} onChange={setR("heroIntro")} />
                    <textarea className={inputClass} rows={4} placeholder="Vinkjes (één per regel)" value={rustig.heroBullets} onChange={setR("heroBullets")} />
                    <div className="grid grid-cols-2 gap-2">
                      <input className={inputClass} placeholder="Prijsregel (bijv. €37 eenmalig)" value={rustig.heroPrijsLabel} onChange={setR("heroPrijsLabel")} />
                      <input className={inputClass} placeholder="Knoptekst (scroll-knop)" value={rustig.heroButton} onChange={setR("heroButton")} />
                    </div>
                    <p className="text-xs text-gray-400">Let op: deze knop is een <strong>scroll-CTA</strong>, hij springt naar het betaalblok (net als de knop bij Veiligheid). De échte betaalknop pas je aan bij &ldquo;Knoptekst (standaard: Betalen)&rdquo; bovenaan.</p>
                  </div>

                  {/* Sectie 2 — Wat je krijgt */}
                  <div className="space-y-2">
                    <p className="text-sm font-semibold text-primary-800">2. Wat je krijgt</p>
                    <RustigImage label="Afbeelding (bijv. telefoon-mockup)" file={rustig.wjkImageFile} url={rustig.wjkImageUrl} onPick={setRImg("wjkImageFile")} onClear={() => setRustig((r) => ({ ...r, wjkImageFile: null, wjkImageStorageId: undefined, wjkImageUrl: null }))} />
                    <textarea className={inputClass} rows={3} placeholder="Voorbeeld-prompts (Dag 3 | Wat heb je vandaag nodig?)" value={rustig.wjkPrompts} onChange={setR("wjkPrompts")} />
                    <input className={inputClass} placeholder="Titel (bijv. Geen grote opdrachten)" value={rustig.wjkTitel} onChange={setR("wjkTitel")} />
                    <textarea className={inputClass} rows={2} placeholder="Tekst" value={rustig.wjkTekst} onChange={setR("wjkTekst")} />
                    <textarea className={inputClass} rows={4} placeholder="Vinkjes (één per regel)" value={rustig.wjkBullets} onChange={setR("wjkBullets")} />
                  </div>

                  {/* Sectie 3 — Herkenning */}
                  <div className="space-y-2">
                    <p className="text-sm font-semibold text-primary-800">3. Herkenning</p>
                    <RustigImage label="Quote-afbeelding (optioneel)" file={rustig.herkImageFile} url={rustig.herkImageUrl} onPick={setRImg("herkImageFile")} onClear={() => setRustig((r) => ({ ...r, herkImageFile: null, herkImageStorageId: undefined, herkImageUrl: null }))} />
                    <textarea className={inputClass} rows={2} placeholder="Quote (gebruikt als er geen afbeelding is)" value={rustig.herkQuote} onChange={setR("herkQuote")} />
                    <input className={inputClass} placeholder="Intro (bijv. Misschien herken je dit:)" value={rustig.herkIntro} onChange={setR("herkIntro")} />
                    <textarea className={inputClass} rows={4} placeholder="Vinkjes (één per regel)" value={rustig.herkBullets} onChange={setR("herkBullets")} />
                    <input className={inputClass} placeholder="Slotzin (bijv. Dan is Niet Alleen voor jou gemaakt.)" value={rustig.herkSlot} onChange={setR("herkSlot")} />
                  </div>

                  {/* Sectie 4 — Reviews */}
                  <div className="space-y-2">
                    <p className="text-sm font-semibold text-primary-800">4. Reviews</p>
                    <input className={inputClass} placeholder="Titel boven de reviews" value={rustig.reviewsTitel} onChange={setR("reviewsTitel")} />
                    <p className="text-xs text-gray-400">De reviews zelf beheer je hierboven bij &ldquo;Reviews / testimonials&rdquo;.</p>
                  </div>

                  {/* Sectie 5 — Persoonlijk verhaal Benji */}
                  <div className="space-y-2">
                    <p className="text-sm font-semibold text-primary-800">5. Persoonlijk verhaal</p>
                    <RustigImage label="Foto van Benji" file={rustig.benjiImageFile} url={rustig.benjiImageUrl} onPick={setRImg("benjiImageFile")} onClear={() => setRustig((r) => ({ ...r, benjiImageFile: null, benjiImageStorageId: undefined, benjiImageUrl: null }))} />
                    <input className={inputClass} placeholder="Titel" value={rustig.benjiTitel} onChange={setR("benjiTitel")} />
                    <textarea className={inputClass} rows={4} placeholder="Verhaal (4 tot 6 regels)" value={rustig.benjiTekst} onChange={setR("benjiTekst")} />
                  </div>

                  {/* Sectie 6 — Veiligheid */}
                  <div className="space-y-2">
                    <p className="text-sm font-semibold text-primary-800">6. Veiligheid + laatste knop</p>
                    <textarea className={inputClass} rows={4} placeholder="Vinkjes (één per regel)" value={rustig.veiligBullets} onChange={setR("veiligBullets")} />
                    <input className={inputClass} placeholder="Knoptekst (bijv. Ja, ik gun mezelf dit moment)" value={rustig.veiligButton} onChange={setR("veiligButton")} />
                  </div>

                  {/* Sectie 7 — FAQ */}
                  <div className="space-y-2">
                    <p className="text-sm font-semibold text-primary-800">7. FAQ</p>
                    <textarea className={inputClass} rows={6} placeholder={"Eén vraag per regel: Vraag | Antwoord"} value={rustig.faq} onChange={setR("faq")} />
                  </div>
                </div>
              )}

              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.isLive}
                  onChange={setCheck("isLive")}
                  className="rounded border-primary-300 text-primary-600"
                />
                <span className="text-sm text-gray-700">Pagina is live (publiek zichtbaar)</span>
              </label>
            </div>

            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={handleSave}
                disabled={saving || !canSave}
                className="inline-flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg text-sm font-medium hover:bg-primary-700 disabled:opacity-50"
              >
                <Save size={18} />
                {saving ? "Bezig…" : savedOk ? "Opgeslagen ✓" : "Opslaan"}
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

        {/* Lijst */}
        {!showForm && (
          <>
            {products === undefined ? (
              <div className="py-8 text-center text-primary-600">Laden…</div>
            ) : products.length === 0 ? (
              <p className="text-sm text-gray-500 py-4">Nog geen checkout producten.</p>
            ) : (
              <ul className="space-y-3">
                {products.map((product: CheckoutProduct) => (
                  <li
                    key={product._id}
                    className="p-4 rounded-lg border border-primary-200 bg-white hover:bg-primary-50/50"
                  >
                    <div className="flex justify-between items-start gap-4">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 flex-wrap mb-1">
                          <span
                            className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                              product.isLive
                                ? "bg-green-100 text-green-800"
                                : "bg-gray-100 text-gray-600"
                            }`}
                          >
                            {product.isLive ? "Live" : "Verborgen"}
                          </span>
                          <code className="text-xs text-gray-500 bg-gray-100 px-1.5 py-0.5 rounded">
                            /betalen/{product.slug}
                          </code>
                          <span
                            className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                              product.checkoutLayout === "rustig"
                                ? "bg-violet-100 text-violet-800"
                                : "bg-stone-100 text-stone-600"
                            }`}
                          >
                            {product.checkoutLayout === "rustig" ? "Rustige layout" : "Standaard layout"}
                          </span>
                          <span className="text-xs font-semibold text-primary-700">
                            {formatPrice(product.priceInCents)}
                          </span>
                        </div>
                        <h3 className="font-medium text-primary-900 truncate">{product.name}</h3>
                        {product.description && (
                          <p className="text-xs text-gray-500 mt-0.5 line-clamp-1">{product.description}</p>
                        )}
                        <p className="text-xs text-gray-400 mt-0.5">
                          Type: {product.subscriptionType}
                          {product.accessDays != null && ` · ${product.accessDays} dagen`}
                          {product.giftEnabled && " · 🎁 cadeau-optie aan"}
                          {" · "}Bijgewerkt{" "}
                          {new Date(product.updatedAt).toLocaleDateString("nl-NL", {
                            day: "numeric",
                            month: "short",
                            year: "numeric",
                          })}
                        </p>
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        {product.isLive && (
                          <a
                            href={`/betalen/${product.slug}`}
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
                          onClick={() => startDuplicate(product)}
                          className="p-2 text-gray-500 hover:bg-gray-100 rounded-lg"
                          title="Dupliceren"
                        >
                          <Copy size={17} />
                        </button>
                        <button
                          type="button"
                          onClick={() => startEdit(product)}
                          className="p-2 text-primary-600 hover:bg-primary-100 rounded-lg"
                          title="Bewerken"
                        >
                          <Edit size={17} />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDelete(product._id)}
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
