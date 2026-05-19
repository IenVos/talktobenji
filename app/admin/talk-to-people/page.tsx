"use client";

import { useRef, useState, type ChangeEvent } from "react";
import { useAdminQuery, useAdminMutation } from "../AdminAuthContext";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { Plus, Trash2, Save, ChevronUp, ChevronDown, Eye, EyeOff, ChevronRight, ImagePlus, X } from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────

type Categorie = {
  _id: Id<"mensenopmjeheen_categorieen">;
  naam: string;
  volgorde: number;
  zichtbaar: boolean;
  imageStorageId?: string;
  imageUrl?: string | null;
  filterTags?: string[];
};

type Initiatief = {
  _id: Id<"mensenopmjeheen_initiatieven">;
  categorie_id: Id<"mensenopmjeheen_categorieen">;
  naam: string;
  beschrijving: string;
  url: string;
  volgorde: number;
  zichtbaar: boolean;
  imageStorageId?: string;
  imageUrl?: string | null;
};

// ─── Hulpcomponent: initiatief rij ───────────────────────────────────────────

function InitiatiefRij({
  init, isFirst, isLast,
  onSave, onDelete, onToggleZichtbaar, onMoveUp, onMoveDown,
  onUploadImage, onRemoveImage,
}: {
  init: Initiatief;
  isFirst: boolean;
  isLast: boolean;
  onSave: (id: Id<"mensenopmjeheen_initiatieven">, data: Partial<Omit<Initiatief, "_id" | "categorie_id">>) => void;
  onDelete: (id: Id<"mensenopmjeheen_initiatieven">) => void;
  onToggleZichtbaar: (id: Id<"mensenopmjeheen_initiatieven">, zichtbaar: boolean) => void;
  onMoveUp: (id: Id<"mensenopmjeheen_initiatieven">) => void;
  onMoveDown: (id: Id<"mensenopmjeheen_initiatieven">) => void;
  onUploadImage: (id: Id<"mensenopmjeheen_initiatieven">, file: File) => void;
  onRemoveImage: (id: Id<"mensenopmjeheen_initiatieven">) => void;
}) {
  const [naam, setNaam] = useState(init.naam);
  const [beschrijving, setBeschrijving] = useState(init.beschrijving);
  const [url, setUrl] = useState(init.url);
  const [dirty, setDirty] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  function handleSave() {
    onSave(init._id, { naam, beschrijving, url });
    setDirty(false);
  }

  async function handleFileChange(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      await onUploadImage(init._id, file);
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-4 space-y-3">
      <div className="flex items-center gap-2">
        <div className="flex flex-col gap-0.5">
          <button onClick={() => onMoveUp(init._id)} disabled={isFirst} className="p-0.5 text-gray-400 hover:text-gray-700 disabled:opacity-30"><ChevronUp size={14} /></button>
          <button onClick={() => onMoveDown(init._id)} disabled={isLast} className="p-0.5 text-gray-400 hover:text-gray-700 disabled:opacity-30"><ChevronDown size={14} /></button>
        </div>
        <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-2">
          <input value={naam} onChange={(e) => { setNaam(e.target.value); setDirty(true); }} placeholder="Naam" className="border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-primary-300" />
          <input value={url} onChange={(e) => { setUrl(e.target.value); setDirty(true); }} placeholder="URL (https://...)" className="border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-primary-300" />
        </div>
        <div className="flex items-center gap-1">
          {/* Afbeelding upload */}
          <input ref={fileRef} type="file" accept="image/*" onChange={handleFileChange} className="hidden" />
          {init.imageUrl ? (
            <div className="flex items-center gap-1">
              <img src={init.imageUrl} alt="" className="w-7 h-7 rounded object-cover border border-gray-200" />
              <button onClick={() => onRemoveImage(init._id)} className="p-1 text-gray-400 hover:text-red-500" title="Afbeelding verwijderen">
                <X size={13} />
              </button>
            </div>
          ) : (
            <button onClick={() => fileRef.current?.click()} disabled={uploading} className="p-1.5 rounded-lg text-gray-400 hover:text-primary-600 disabled:opacity-40" title="Icoon/afbeelding uploaden">
              <ImagePlus size={16} />
            </button>
          )}
          <button onClick={() => onToggleZichtbaar(init._id, !init.zichtbaar)} className="p-1.5 rounded-lg text-gray-400 hover:text-gray-700" title={init.zichtbaar ? "Verberg" : "Zichtbaar maken"}>
            {init.zichtbaar ? <Eye size={16} /> : <EyeOff size={16} />}
          </button>
          <button onClick={() => { if (confirm(`Initiatief "${init.naam}" verwijderen?`)) onDelete(init._id); }} className="p-1.5 rounded-lg text-red-400 hover:text-red-600">
            <Trash2 size={16} />
          </button>
        </div>
      </div>
      <textarea value={beschrijving} onChange={(e) => { setBeschrijving(e.target.value); setDirty(true); }} placeholder="Beschrijving" rows={2} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-900 resize-none focus:outline-none focus:ring-2 focus:ring-primary-300" />
      {dirty && (
        <button onClick={handleSave} className="flex items-center gap-1.5 px-3 py-1.5 bg-primary-600 text-white text-xs font-medium rounded-lg hover:bg-primary-700">
          <Save size={13} />Opslaan
        </button>
      )}
    </div>
  );
}

// ─── Hulpcomponent: categorie sectie ─────────────────────────────────────────

function CategorieSectie({
  cat, initiatieven, isFirst, isLast,
  onUpdateCat, onDeleteCat, onMoveUpCat, onMoveDownCat,
  onUploadImage, onRemoveImage,
  onAddInitiatief, onSaveInitiatief, onDeleteInitiatief, onToggleInitZichtbaar, onMoveUpInit, onMoveDownInit,
  onUploadInitImage, onRemoveInitImage,
}: {
  cat: Categorie;
  initiatieven: Initiatief[];
  isFirst: boolean;
  isLast: boolean;
  onUpdateCat: (id: Id<"mensenopmjeheen_categorieen">, data: Partial<Omit<Categorie, "_id">>) => void;
  onDeleteCat: (id: Id<"mensenopmjeheen_categorieen">) => void;
  onMoveUpCat: (id: Id<"mensenopmjeheen_categorieen">) => void;
  onMoveDownCat: (id: Id<"mensenopmjeheen_categorieen">) => void;
  onUploadImage: (id: Id<"mensenopmjeheen_categorieen">, file: File) => void;
  onRemoveImage: (id: Id<"mensenopmjeheen_categorieen">) => void;
  onAddInitiatief: (categorie_id: Id<"mensenopmjeheen_categorieen">) => void;
  onSaveInitiatief: (id: Id<"mensenopmjeheen_initiatieven">, data: Partial<Omit<Initiatief, "_id" | "categorie_id">>) => void;
  onDeleteInitiatief: (id: Id<"mensenopmjeheen_initiatieven">) => void;
  onToggleInitZichtbaar: (id: Id<"mensenopmjeheen_initiatieven">, zichtbaar: boolean) => void;
  onMoveUpInit: (id: Id<"mensenopmjeheen_initiatieven">) => void;
  onMoveDownInit: (id: Id<"mensenopmjeheen_initiatieven">) => void;
  onUploadInitImage: (id: Id<"mensenopmjeheen_initiatieven">, file: File) => void;
  onRemoveInitImage: (id: Id<"mensenopmjeheen_initiatieven">) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const [editNaam, setEditNaam] = useState(cat.naam);
  const [editMode, setEditMode] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  async function handleFileChange(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      await onUploadImage(cat._id, file);
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  return (
    <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-2 px-4 py-3 bg-gray-50 border-b border-gray-100">
        <div className="flex flex-col gap-0.5">
          <button onClick={() => onMoveUpCat(cat._id)} disabled={isFirst} className="p-0.5 text-gray-400 hover:text-gray-700 disabled:opacity-30"><ChevronUp size={14} /></button>
          <button onClick={() => onMoveDownCat(cat._id)} disabled={isLast} className="p-0.5 text-gray-400 hover:text-gray-700 disabled:opacity-30"><ChevronDown size={14} /></button>
        </div>

        {editMode ? (
          <input value={editNaam} onChange={(e) => setEditNaam(e.target.value)} className="flex-1 border border-primary-300 rounded-lg px-3 py-1.5 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-primary-300" autoFocus />
        ) : (
          <button onClick={() => setExpanded((v) => !v)} className="flex-1 flex items-center gap-2 text-left text-sm font-semibold text-gray-900">
            <ChevronRight size={15} className={`transition-transform flex-shrink-0 ${expanded ? "rotate-90" : ""}`} />
            {cat.naam}
            <span className="text-xs text-gray-400 font-normal">({initiatieven.length})</span>
          </button>
        )}

        <div className="flex items-center gap-1 flex-shrink-0">
          {editMode ? (
            <>
              <button onClick={() => { onUpdateCat(cat._id, { naam: editNaam }); setEditMode(false); }} className="px-3 py-1.5 bg-primary-600 text-white text-xs font-medium rounded-lg hover:bg-primary-700">Opslaan</button>
              <button onClick={() => { setEditNaam(cat.naam); setEditMode(false); }} className="px-3 py-1.5 text-gray-500 text-xs rounded-lg hover:bg-gray-100">Annuleren</button>
            </>
          ) : (
            <button onClick={() => setEditMode(true)} className="px-2 py-1.5 text-gray-500 text-xs rounded-lg hover:bg-gray-100">Naam wijzigen</button>
          )}

          {/* Afbeelding upload / verwijder */}
          <input ref={fileRef} type="file" accept="image/*" onChange={handleFileChange} className="hidden" />
          {cat.imageUrl ? (
            <div className="flex items-center gap-1">
              <img src={cat.imageUrl} alt="" className="w-7 h-7 rounded object-cover border border-gray-200" />
              <button onClick={() => onRemoveImage(cat._id)} className="p-1 text-gray-400 hover:text-red-500" title="Afbeelding verwijderen">
                <X size={13} />
              </button>
            </div>
          ) : (
            <button onClick={() => fileRef.current?.click()} disabled={uploading} className="p-1.5 rounded-lg text-gray-400 hover:text-primary-600 disabled:opacity-40" title="Afbeelding uploaden">
              <ImagePlus size={16} />
            </button>
          )}

          <button onClick={() => onUpdateCat(cat._id, { zichtbaar: !cat.zichtbaar })} className="p-1.5 rounded-lg text-gray-400 hover:text-gray-700" title={cat.zichtbaar ? "Verberg" : "Zichtbaar"}>
            {cat.zichtbaar ? <Eye size={16} /> : <EyeOff size={16} />}
          </button>
          <button onClick={() => { if (confirm(`Categorie "${cat.naam}" en alle bijbehorende initiatieven verwijderen?`)) onDeleteCat(cat._id); }} className="p-1.5 rounded-lg text-red-400 hover:text-red-600">
            <Trash2 size={16} />
          </button>
        </div>
      </div>

      {/* Initiatieven */}
      {expanded && (
        <div className="p-4 space-y-3">
          {/* Filter tags */}
          <div className="flex items-center gap-2 flex-wrap pb-3 border-b border-gray-100">
            <span className="text-xs font-medium text-gray-500">Toon bij filter:</span>
            {(["lezen", "praten", "groep", "ander"] as const).map((tag) => {
              const labels: Record<string, string> = { lezen: "Lezen", praten: "Praten", groep: "Groep", ander: "Ik wil helpen" };
              const actief = (cat.filterTags ?? []).includes(tag);
              return (
                <button
                  key={tag}
                  onClick={() => {
                    const huidige = cat.filterTags ?? [];
                    const nieuw = actief ? huidige.filter((t) => t !== tag) : [...huidige, tag];
                    onUpdateCat(cat._id, { filterTags: nieuw });
                  }}
                  className={`px-3 py-1 text-xs rounded-full border transition-colors ${
                    actief ? "bg-primary-100 border-primary-300 text-primary-700 font-medium" : "bg-white border-gray-200 text-gray-400 hover:border-primary-200 hover:text-primary-600"
                  }`}
                >
                  {labels[tag]}
                </button>
              );
            })}
            <span className="text-xs text-gray-400 ml-1">
              {(cat.filterTags ?? []).length === 0 ? "— geen filter geselecteerd, altijd zichtbaar" : ""}
            </span>
          </div>

          {initiatieven.map((init, idx) => (
            <InitiatiefRij key={init._id} init={init} isFirst={idx === 0} isLast={idx === initiatieven.length - 1}
              onSave={onSaveInitiatief} onDelete={onDeleteInitiatief} onToggleZichtbaar={onToggleInitZichtbaar}
              onMoveUp={onMoveUpInit} onMoveDown={onMoveDownInit}
              onUploadImage={onUploadInitImage} onRemoveImage={onRemoveInitImage}
            />
          ))}
          <button onClick={() => onAddInitiatief(cat._id)} className="flex items-center gap-1.5 px-3 py-2 text-sm text-primary-600 hover:text-primary-800 border border-dashed border-primary-300 rounded-xl w-full justify-center hover:bg-primary-50">
            <Plus size={15} />Initiatief toevoegen
          </button>
        </div>
      )}
    </div>
  );
}

// ─── Hoofdpagina ─────────────────────────────────────────────────────────────

const FILTER_DEFAULTS = {
  lezen:  "Ik wil anoniem lezen wat anderen meemaken",
  praten: "Ik wil met iemand praten maar weet niet hoe ik moet beginnen",
  groep:  "Ik zoek een groep bij mij in de buurt",
  ander:  "Ik wil weten wat ik kan doen voor iemand anders",
};

export default function MensenOmJeHeenAdminPage() {
  const paginaTeksten = useAdminQuery(api.mensenOmJeHeen.getPaginaTeksten, {});
  const categorieen = useAdminQuery(api.mensenOmJeHeen.listCategorieen, {}) as Categorie[] | undefined;
  const alleInitiatieven = useAdminQuery(api.mensenOmJeHeen.listInitiatieven, {}) as Initiatief[] | undefined;

  const upsertPaginaTeksten = useAdminMutation(api.mensenOmJeHeen.upsertPaginaTeksten);
  const upsertCategorie = useAdminMutation(api.mensenOmJeHeen.upsertCategorie);
  const deleteCategorie = useAdminMutation(api.mensenOmJeHeen.deleteCategorie);
  const upsertInitiatief = useAdminMutation(api.mensenOmJeHeen.upsertInitiatief);
  const deleteInitiatief = useAdminMutation(api.mensenOmJeHeen.deleteInitiatief);
  const seedData = useAdminMutation(api.mensenOmJeHeen.seedData);
  const generateUploadUrl = useAdminMutation(api.mensenOmJeHeen.generateUploadUrl);

  // Paginateksten
  const [heroTitel, setHeroTitel] = useState("");
  const [heroSubtitel, setHeroSubtitel] = useState("");
  const [filterLezen, setFilterLezen] = useState("");
  const [filterPraten, setFilterPraten] = useState("");
  const [filterGroep, setFilterGroep] = useState("");
  const [filterAnder, setFilterAnder] = useState("");
  const [filterAnderBlokTitel, setFilterAnderBlokTitel] = useState("");
  const [filterAnderBlokTekst, setFilterAnderBlokTekst] = useState("");
  const [tekstenGeladen, setTekstenGeladen] = useState(false);
  const [tekstSaving, setTekstSaving] = useState(false);
  const [tekstSaved, setTekstSaved] = useState(false);

  const [nieuweCatNaam, setNieuweCatNaam] = useState("");

  if (paginaTeksten && !tekstenGeladen) {
    setHeroTitel(paginaTeksten.hero_titel ?? "");
    setHeroSubtitel(paginaTeksten.hero_subtitel ?? "");
    setFilterLezen(paginaTeksten.filter_lezen ?? "");
    setFilterPraten(paginaTeksten.filter_praten ?? "");
    setFilterGroep(paginaTeksten.filter_groep ?? "");
    setFilterAnder(paginaTeksten.filter_ander ?? "");
    setFilterAnderBlokTitel((paginaTeksten as any).filter_ander_blok_titel ?? "");
    setFilterAnderBlokTekst((paginaTeksten as any).filter_ander_blok_tekst ?? "");
    setTekstenGeladen(true);
  }

  async function handleSaveTeksten() {
    setTekstSaving(true);
    try {
      await upsertPaginaTeksten({
        hero_titel: heroTitel,
        hero_subtitel: heroSubtitel,
        filter_lezen: filterLezen || undefined,
        filter_praten: filterPraten || undefined,
        filter_groep: filterGroep || undefined,
        filter_ander: filterAnder || undefined,
        filter_ander_blok_titel: filterAnderBlokTitel || undefined,
        filter_ander_blok_tekst: filterAnderBlokTekst || undefined,
      });
      setTekstSaved(true);
      setTimeout(() => setTekstSaved(false), 2000);
    } finally {
      setTekstSaving(false);
    }
  }

  async function handleAddCategorie() {
    if (!nieuweCatNaam.trim()) return;
    await upsertCategorie({ naam: nieuweCatNaam.trim(), volgorde: (categorieen?.length ?? 0) + 1, zichtbaar: true });
    setNieuweCatNaam("");
  }

  async function handleUpdateCat(id: Id<"mensenopmjeheen_categorieen">, data: Partial<Omit<Categorie, "_id">>) {
    const existing = categorieen?.find((c) => c._id === id);
    if (!existing) return;
    await upsertCategorie({
      id,
      naam: data.naam ?? existing.naam,
      volgorde: data.volgorde ?? existing.volgorde,
      zichtbaar: data.zichtbaar ?? existing.zichtbaar,
      filterTags: data.filterTags ?? existing.filterTags ?? [],
      ...(data.imageStorageId !== undefined
        ? { imageStorageId: data.imageStorageId as Id<"_storage"> }
        : existing.imageStorageId
          ? { imageStorageId: existing.imageStorageId as Id<"_storage"> }
          : {}),
    });
  }

  async function handleUploadImage(id: Id<"mensenopmjeheen_categorieen">, file: File) {
    const uploadUrl = await generateUploadUrl({}) as string;
    const result = await fetch(uploadUrl, {
      method: "POST",
      headers: { "Content-Type": file.type },
      body: file,
    });
    const { storageId } = await result.json();
    const existing = categorieen?.find((c) => c._id === id);
    if (!existing) return;
    await upsertCategorie({ id, naam: existing.naam, volgorde: existing.volgorde, zichtbaar: existing.zichtbaar, imageStorageId: storageId });
  }

  async function handleRemoveImage(id: Id<"mensenopmjeheen_categorieen">) {
    const existing = categorieen?.find((c) => c._id === id);
    if (!existing) return;
    // patch zonder imageStorageId — Convex verwijdert het veld niet via patch,
    // dus we sturen een expliciete null via een directe db patch in de backend niet mogelijk.
    // Workaround: gebruik upsertCategorie met imageStorageId weggelaten zodat het veld bewaard blijft.
    // Voor nu: dit is een low-priority feature, verwijdering kan via de DB console.
    alert("Afbeelding verwijderen kan via de Convex console. Veld 'imageStorageId' wissen bij de categorie.");
  }

  async function handleDeleteCat(id: Id<"mensenopmjeheen_categorieen">) {
    await deleteCategorie({ id });
  }

  async function handleMoveUpCat(id: Id<"mensenopmjeheen_categorieen">) {
    if (!categorieen) return;
    const sorted = [...categorieen].sort((a, b) => a.volgorde - b.volgorde);
    const idx = sorted.findIndex((c) => c._id === id);
    if (idx <= 0) return;
    const prev = sorted[idx - 1], cur = sorted[idx];
    await upsertCategorie({ id: cur._id, naam: cur.naam, volgorde: prev.volgorde, zichtbaar: cur.zichtbaar, filterTags: cur.filterTags ?? [], ...(cur.imageStorageId ? { imageStorageId: cur.imageStorageId as Id<"_storage"> } : {}) });
    await upsertCategorie({ id: prev._id, naam: prev.naam, volgorde: cur.volgorde, zichtbaar: prev.zichtbaar, filterTags: prev.filterTags ?? [], ...(prev.imageStorageId ? { imageStorageId: prev.imageStorageId as Id<"_storage"> } : {}) });
  }

  async function handleMoveDownCat(id: Id<"mensenopmjeheen_categorieen">) {
    if (!categorieen) return;
    const sorted = [...categorieen].sort((a, b) => a.volgorde - b.volgorde);
    const idx = sorted.findIndex((c) => c._id === id);
    if (idx >= sorted.length - 1) return;
    const next = sorted[idx + 1], cur = sorted[idx];
    await upsertCategorie({ id: cur._id, naam: cur.naam, volgorde: next.volgorde, zichtbaar: cur.zichtbaar, filterTags: cur.filterTags ?? [], ...(cur.imageStorageId ? { imageStorageId: cur.imageStorageId as Id<"_storage"> } : {}) });
    await upsertCategorie({ id: next._id, naam: next.naam, volgorde: cur.volgorde, zichtbaar: next.zichtbaar, filterTags: next.filterTags ?? [], ...(next.imageStorageId ? { imageStorageId: next.imageStorageId as Id<"_storage"> } : {}) });
  }

  async function handleUploadInitiatiefImage(id: Id<"mensenopmjeheen_initiatieven">, file: File) {
    const uploadUrl = await generateUploadUrl({}) as string;
    const result = await fetch(uploadUrl, {
      method: "POST",
      headers: { "Content-Type": file.type },
      body: file,
    });
    const { storageId } = await result.json();
    const existing = alleInitiatieven?.find((i) => i._id === id);
    if (!existing) return;
    await upsertInitiatief({ id, categorie_id: existing.categorie_id, naam: existing.naam, beschrijving: existing.beschrijving, url: existing.url, volgorde: existing.volgorde, zichtbaar: existing.zichtbaar, imageStorageId: storageId });
  }

  async function handleRemoveInitiatiefImage(id: Id<"mensenopmjeheen_initiatieven">) {
    alert("Afbeelding verwijderen kan via de Convex console. Veld 'imageStorageId' wissen bij het initiatief.");
  }

  async function handleAddInitiatief(categorie_id: Id<"mensenopmjeheen_categorieen">) {
    const bestaand = alleInitiatieven?.filter((i) => i.categorie_id === categorie_id) ?? [];
    await upsertInitiatief({ categorie_id, naam: "Nieuw initiatief", beschrijving: "", url: "https://", volgorde: bestaand.length + 1, zichtbaar: true });
  }

  async function handleSaveInitiatief(id: Id<"mensenopmjeheen_initiatieven">, data: Partial<Omit<Initiatief, "_id" | "categorie_id">>) {
    const existing = alleInitiatieven?.find((i) => i._id === id);
    if (!existing) return;
    await upsertInitiatief({
      id, categorie_id: existing.categorie_id,
      naam: data.naam ?? existing.naam,
      beschrijving: data.beschrijving ?? existing.beschrijving,
      url: data.url ?? existing.url,
      volgorde: data.volgorde ?? existing.volgorde,
      zichtbaar: data.zichtbaar ?? existing.zichtbaar,
      ...(existing.imageStorageId && { imageStorageId: existing.imageStorageId as Id<"_storage"> }),
    });
  }

  async function handleDeleteInitiatief(id: Id<"mensenopmjeheen_initiatieven">) { await deleteInitiatief({ id }); }
  async function handleToggleInitZichtbaar(id: Id<"mensenopmjeheen_initiatieven">, zichtbaar: boolean) { await handleSaveInitiatief(id, { zichtbaar }); }

  async function handleMoveUpInit(id: Id<"mensenopmjeheen_initiatieven">) {
    if (!alleInitiatieven) return;
    const init = alleInitiatieven.find((i) => i._id === id);
    if (!init) return;
    const groep = [...alleInitiatieven.filter((i) => i.categorie_id === init.categorie_id)].sort((a, b) => a.volgorde - b.volgorde);
    const idx = groep.findIndex((i) => i._id === id);
    if (idx <= 0) return;
    const prev = groep[idx - 1], cur = groep[idx];
    await upsertInitiatief({ id: cur._id, categorie_id: cur.categorie_id, naam: cur.naam, beschrijving: cur.beschrijving, url: cur.url, volgorde: prev.volgorde, zichtbaar: cur.zichtbaar, ...(cur.imageStorageId && { imageStorageId: cur.imageStorageId as Id<"_storage"> }) });
    await upsertInitiatief({ id: prev._id, categorie_id: prev.categorie_id, naam: prev.naam, beschrijving: prev.beschrijving, url: prev.url, volgorde: cur.volgorde, zichtbaar: prev.zichtbaar, ...(prev.imageStorageId && { imageStorageId: prev.imageStorageId as Id<"_storage"> }) });
  }

  async function handleMoveDownInit(id: Id<"mensenopmjeheen_initiatieven">) {
    if (!alleInitiatieven) return;
    const init = alleInitiatieven.find((i) => i._id === id);
    if (!init) return;
    const groep = [...alleInitiatieven.filter((i) => i.categorie_id === init.categorie_id)].sort((a, b) => a.volgorde - b.volgorde);
    const idx = groep.findIndex((i) => i._id === id);
    if (idx >= groep.length - 1) return;
    const next = groep[idx + 1], cur = groep[idx];
    await upsertInitiatief({ id: cur._id, categorie_id: cur.categorie_id, naam: cur.naam, beschrijving: cur.beschrijving, url: cur.url, volgorde: next.volgorde, zichtbaar: cur.zichtbaar, ...(cur.imageStorageId && { imageStorageId: cur.imageStorageId as Id<"_storage"> }) });
    await upsertInitiatief({ id: next._id, categorie_id: next.categorie_id, naam: next.naam, beschrijving: next.beschrijving, url: next.url, volgorde: cur.volgorde, zichtbaar: next.zichtbaar, ...(next.imageStorageId && { imageStorageId: next.imageStorageId as Id<"_storage"> }) });
  }

  const sortedCats = [...(categorieen ?? [])].sort((a, b) => a.volgorde - b.volgorde);

  return (
    <div className="max-w-3xl mx-auto space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Talk To People</h1>
          <p className="text-sm text-gray-500 mt-1">Beheer paginateksten, filterteksten, categorieën en initiatieven.</p>
        </div>
        {categorieen !== undefined && categorieen.length === 0 && (
          <button onClick={() => seedData({})} className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white text-sm font-medium rounded-xl hover:bg-primary-700">
            Begindata laden
          </button>
        )}
      </div>

      {/* Paginateksten */}
      <section className="bg-white border border-gray-200 rounded-2xl p-6 space-y-4">
        <h2 className="text-base font-semibold text-gray-900">Paginateksten</h2>
        <div className="space-y-3">
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Hero titel</label>
            <input value={heroTitel} onChange={(e) => setHeroTitel(e.target.value)} placeholder="Er zijn mensen die begrijpen wat jij doormaakt." className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-primary-300" />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Hero subtitel</label>
            <textarea value={heroSubtitel} onChange={(e) => setHeroSubtitel(e.target.value)} placeholder="Hier vind je initiatieven, groepen en mensen die er voor je zijn." rows={2} className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm text-gray-900 resize-none focus:outline-none focus:ring-2 focus:ring-primary-300" />
          </div>
        </div>
        <button onClick={handleSaveTeksten} disabled={tekstSaving} className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white text-sm font-medium rounded-xl hover:bg-primary-700 disabled:opacity-60">
          <Save size={15} />{tekstSaving ? "Bezig…" : tekstSaved ? "Opgeslagen!" : "Opslaan"}
        </button>
      </section>

      {/* Filterteksten */}
      <section className="bg-white border border-gray-200 rounded-2xl p-6 space-y-4">
        <div>
          <h2 className="text-base font-semibold text-gray-900">Filterbuttons</h2>
          <p className="text-xs text-gray-500 mt-0.5">De vier keuzebuttons bovenaan de pagina. Laat leeg voor de standaardtekst. Welke categorieën bij welk filter horen stel je per categorie in (zie hieronder).</p>
        </div>
        <div className="space-y-3">
          {[
            { label: "Lezen (boekicoon)", value: filterLezen, set: setFilterLezen, placeholder: FILTER_DEFAULTS.lezen },
            { label: "Praten (chaticoon)", value: filterPraten, set: setFilterPraten, placeholder: FILTER_DEFAULTS.praten },
            { label: "Groep (personicoon)", value: filterGroep, set: setFilterGroep, placeholder: FILTER_DEFAULTS.groep },
            { label: "Ander (harticoon) — knoptekst", value: filterAnder, set: setFilterAnder, placeholder: FILTER_DEFAULTS.ander },
          ].map(({ label, value, set, placeholder }) => (
            <div key={label}>
              <label className="block text-xs font-medium text-gray-500 mb-1">{label}</label>
              <input value={value} onChange={(e) => set(e.target.value)} placeholder={placeholder} className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-primary-300" />
            </div>
          ))}
        </div>

        {/* Ander-blok inhoud */}
        <div className="pt-2 border-t border-gray-100 space-y-3">
          <p className="text-xs font-medium text-gray-500">Inhoud van het blok dat verschijnt als iemand op "Ander" klikt:</p>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Titel</label>
            <input value={filterAnderBlokTitel} onChange={(e) => setFilterAnderBlokTitel(e.target.value)} placeholder="Er zijn voor iemand begint met luisteren." className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-primary-300" />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Tekst</label>
            <textarea value={filterAnderBlokTekst} onChange={(e) => setFilterAnderBlokTekst(e.target.value)} placeholder="Niet met de juiste woorden. Je hoeft geen oplossing te hebben…" rows={3} className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm text-gray-900 resize-none focus:outline-none focus:ring-2 focus:ring-primary-300" />
          </div>
        </div>

        <button onClick={handleSaveTeksten} disabled={tekstSaving} className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white text-sm font-medium rounded-xl hover:bg-primary-700 disabled:opacity-60">
          <Save size={15} />{tekstSaving ? "Bezig…" : tekstSaved ? "Opgeslagen!" : "Opslaan"}
        </button>
      </section>

      {/* Categorieën */}
      <section className="space-y-4">
        <h2 className="text-base font-semibold text-gray-900">Categorieën &amp; initiatieven</h2>
        {sortedCats.map((cat, idx) => (
          <CategorieSectie key={cat._id} cat={cat}
            initiatieven={(alleInitiatieven ?? []).filter((i) => i.categorie_id === cat._id).sort((a, b) => a.volgorde - b.volgorde)}
            isFirst={idx === 0} isLast={idx === sortedCats.length - 1}
            onUpdateCat={handleUpdateCat} onDeleteCat={handleDeleteCat}
            onMoveUpCat={handleMoveUpCat} onMoveDownCat={handleMoveDownCat}
            onUploadImage={handleUploadImage} onRemoveImage={handleRemoveImage}
            onAddInitiatief={handleAddInitiatief} onSaveInitiatief={handleSaveInitiatief}
            onDeleteInitiatief={handleDeleteInitiatief} onToggleInitZichtbaar={handleToggleInitZichtbaar}
            onMoveUpInit={handleMoveUpInit} onMoveDownInit={handleMoveDownInit}
            onUploadInitImage={handleUploadInitiatiefImage} onRemoveInitImage={handleRemoveInitiatiefImage}
          />
        ))}

        <div className="flex gap-2">
          <input value={nieuweCatNaam} onChange={(e) => setNieuweCatNaam(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") handleAddCategorie(); }} placeholder="Nieuwe categorienaam…" className="flex-1 border border-gray-200 rounded-xl px-4 py-2.5 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-primary-300" />
          <button onClick={handleAddCategorie} disabled={!nieuweCatNaam.trim()} className="flex items-center gap-1.5 px-4 py-2.5 bg-primary-600 text-white text-sm font-medium rounded-xl hover:bg-primary-700 disabled:opacity-40">
            <Plus size={15} />Toevoegen
          </button>
        </div>
      </section>
    </div>
  );
}
