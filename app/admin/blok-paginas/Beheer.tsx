"use client";

import { useState, useCallback, useEffect } from "react";
import { useAdminQuery, useAdminMutation } from "../AdminAuthContext";
import { api } from "@/convex/_generated/api";
import {
  Layers, Plus, Edit, Trash2, Save, X, Copy, Eye, EyeOff, ExternalLink,
  ChevronUp, ChevronDown, ArrowLeft, Upload, Image as ImageIcon, Monitor,
} from "lucide-react";
import BlokPaginaView from "@/components/BlokPaginaView";
import {
  BLOCK_SCHEMAS, BLOCK_LABELS, BLOCK_TYPES, ACHTERGROND_OPTIES,
  HEEFT_ACHTERGROND, leegBlok, type Field,
} from "./schema";

// ── Afbeelding-helpers ─────────────────────────────────────────────────
type ImageResolver = (value: string) => string;

// ── Generieke veld-invoer ───────────────────────────────────────────────
function FieldInput({
  field, value, onChange, resolveImage, uploadImage,
}: {
  field: Field;
  value: any;
  onChange: (v: any) => void;
  resolveImage: ImageResolver;
  uploadImage: (file: File) => Promise<string>;
}) {
  const { kind } = field;

  if (kind === "text") {
    return (
      <input
        type="text"
        value={value ?? ""}
        onChange={(e) => onChange(e.target.value)}
        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-400 focus:border-primary-400"
      />
    );
  }

  if (kind === "textarea" || kind === "rich") {
    return (
      <textarea
        value={value ?? ""}
        onChange={(e) => onChange(e.target.value)}
        rows={field.rows ?? 3}
        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-400 focus:border-primary-400 resize-y"
      />
    );
  }

  if (kind === "number") {
    return (
      <input
        type="number"
        value={value ?? 0}
        onChange={(e) => onChange(e.target.value === "" ? 0 : Number(e.target.value))}
        className="w-32 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-400 focus:border-primary-400"
      />
    );
  }

  if (kind === "select") {
    return (
      <select
        value={value ?? ""}
        onChange={(e) => onChange(e.target.value)}
        className="px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white focus:ring-2 focus:ring-primary-400 focus:border-primary-400"
      >
        {field.options?.map((o) => (
          <option key={o.value} value={o.value}>{o.label}</option>
        ))}
      </select>
    );
  }

  if (kind === "numberList") {
    const arr: number[] = Array.isArray(value) ? value : [];
    return (
      <input
        type="text"
        value={arr.join(", ")}
        onChange={(e) =>
          onChange(
            e.target.value
              .split(",")
              .map((s) => Number(s.trim()))
              .filter((n) => Number.isFinite(n))
          )
        }
        placeholder="bv. 1, 3, 5"
        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-400 focus:border-primary-400"
      />
    );
  }

  if (kind === "image") {
    return <ImageField value={value ?? ""} onChange={onChange} resolveImage={resolveImage} uploadImage={uploadImage} />;
  }

  if (kind === "stringList") {
    const arr: string[] = Array.isArray(value) ? value : [];
    return (
      <div className="space-y-2">
        {arr.map((item, i) => (
          <div key={i} className="flex gap-2 items-start">
            <textarea
              value={item}
              onChange={(e) => {
                const next = [...arr];
                next[i] = e.target.value;
                onChange(next);
              }}
              rows={1}
              className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-400 focus:border-primary-400 resize-y"
            />
            <button
              type="button"
              onClick={() => onChange(arr.filter((_, j) => j !== i))}
              className="p-2 text-gray-400 hover:text-red-500"
              title="Verwijderen"
            >
              <Trash2 size={16} />
            </button>
          </div>
        ))}
        <button
          type="button"
          onClick={() => onChange([...arr, ""])}
          className="text-sm text-primary-600 hover:text-primary-800 flex items-center gap-1"
        >
          <Plus size={14} /> {field.itemLabel ?? "Regel"} toevoegen
        </button>
      </div>
    );
  }

  if (kind === "objectList") {
    const arr: any[] = Array.isArray(value) ? value : [];
    const subFields = field.fields ?? [];
    const move = (i: number, dir: -1 | 1) => {
      const j = i + dir;
      if (j < 0 || j >= arr.length) return;
      const next = [...arr];
      [next[i], next[j]] = [next[j], next[i]];
      onChange(next);
    };
    return (
      <div className="space-y-3">
        {arr.map((obj, i) => (
          <div key={i} className="border border-gray-200 rounded-lg p-3 bg-gray-50">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                {field.itemLabel ?? "Item"} {i + 1}
              </span>
              <div className="flex items-center gap-1">
                <button type="button" onClick={() => move(i, -1)} disabled={i === 0}
                  className="p-1 text-gray-400 hover:text-gray-700 disabled:opacity-30" title="Omhoog">
                  <ChevronUp size={15} />
                </button>
                <button type="button" onClick={() => move(i, 1)} disabled={i === arr.length - 1}
                  className="p-1 text-gray-400 hover:text-gray-700 disabled:opacity-30" title="Omlaag">
                  <ChevronDown size={15} />
                </button>
                <button type="button" onClick={() => onChange(arr.filter((_, j) => j !== i))}
                  className="p-1 text-gray-400 hover:text-red-500" title="Verwijderen">
                  <Trash2 size={15} />
                </button>
              </div>
            </div>
            <div className="space-y-2">
              {subFields.map((sf) => (
                <div key={sf.key}>
                  <label className="block text-xs font-medium text-gray-600 mb-1">{sf.label}</label>
                  <FieldInput
                    field={sf}
                    value={obj?.[sf.key]}
                    onChange={(v) => {
                      const next = [...arr];
                      next[i] = { ...next[i], [sf.key]: v };
                      onChange(next);
                    }}
                    resolveImage={resolveImage}
                    uploadImage={uploadImage}
                  />
                </div>
              ))}
            </div>
          </div>
        ))}
        <button
          type="button"
          onClick={() => {
            const empty: any = {};
            for (const sf of subFields) {
              empty[sf.key] = sf.kind === "select" ? (sf.options?.[0]?.value ?? "") : "";
            }
            onChange([...arr, empty]);
          }}
          className="text-sm text-primary-600 hover:text-primary-800 flex items-center gap-1"
        >
          <Plus size={14} /> {field.itemLabel ?? "Item"} toevoegen
        </button>
      </div>
    );
  }

  return null;
}

// ── Afbeelding-veld (upload + pad) ──────────────────────────────────────
function ImageField({
  value, onChange, resolveImage, uploadImage,
}: {
  value: string;
  onChange: (v: string) => void;
  resolveImage: ImageResolver;
  uploadImage: (file: File) => Promise<string>;
}) {
  const [busy, setBusy] = useState(false);
  const preview = value ? resolveImage(value) : "";

  const handleFile = async (file: File | undefined) => {
    if (!file) return;
    setBusy(true);
    try {
      const ref = await uploadImage(file);
      onChange(ref);
    } catch (e: any) {
      alert("Uploaden mislukt: " + (e?.message || e));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="flex items-start gap-3">
      <div className="w-20 h-20 flex-shrink-0 border border-gray-200 rounded-lg bg-gray-50 flex items-center justify-center overflow-hidden">
        {preview ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={preview} alt="" className="max-w-full max-h-full object-contain" />
        ) : (
          <ImageIcon size={22} className="text-gray-300" />
        )}
      </div>
      <div className="flex-1 space-y-2">
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="/images/... of upload hiernaast"
          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-400 focus:border-primary-400"
        />
        <label className="inline-flex items-center gap-1.5 text-sm text-primary-600 hover:text-primary-800 cursor-pointer">
          <Upload size={14} /> {busy ? "Bezig..." : "Afbeelding uploaden"}
          <input type="file" accept="image/*" className="hidden" disabled={busy}
            onChange={(e) => handleFile(e.target.files?.[0])} />
        </label>
        {value && (
          <button type="button" onClick={() => onChange("")}
            className="ml-3 text-sm text-gray-400 hover:text-red-500">
            Wissen
          </button>
        )}
      </div>
    </div>
  );
}

// ── Eén blok ────────────────────────────────────────────────────────────
function BlockCard({
  blok, index, total, onChange, onMove, onRemove, resolveImage, uploadImage,
}: {
  blok: any;
  index: number;
  total: number;
  onChange: (patch: any) => void;
  onMove: (dir: -1 | 1) => void;
  onRemove: () => void;
  resolveImage: ImageResolver;
  uploadImage: (file: File) => Promise<string>;
}) {
  const [open, setOpen] = useState(false);
  const schema = BLOCK_SCHEMAS[blok.type] || [];
  const verborgen = !!blok.verborgen;

  return (
    <div className={`border rounded-xl bg-white ${verborgen ? "border-gray-200 opacity-70" : "border-gray-300"}`}>
      <div className="flex items-center gap-2 px-4 py-3">
        <button type="button" onClick={() => setOpen((o) => !o)} className="flex-1 flex items-center gap-2 text-left">
          {open ? <ChevronUp size={16} className="text-gray-400" /> : <ChevronDown size={16} className="text-gray-400" />}
          <span className="font-medium text-gray-800">{BLOCK_LABELS[blok.type] || blok.type}</span>
          {verborgen && <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">verborgen</span>}
        </button>
        <div className="flex items-center gap-1">
          <button type="button" onClick={() => onMove(-1)} disabled={index === 0}
            className="p-1.5 text-gray-400 hover:text-gray-700 disabled:opacity-30" title="Omhoog">
            <ChevronUp size={16} />
          </button>
          <button type="button" onClick={() => onMove(1)} disabled={index === total - 1}
            className="p-1.5 text-gray-400 hover:text-gray-700 disabled:opacity-30" title="Omlaag">
            <ChevronDown size={16} />
          </button>
          <button type="button" onClick={() => onChange({ verborgen: !verborgen })}
            className="p-1.5 text-gray-400 hover:text-gray-700" title={verborgen ? "Tonen" : "Verbergen"}>
            {verborgen ? <EyeOff size={16} /> : <Eye size={16} />}
          </button>
          <button type="button" onClick={() => { if (confirm("Dit blok verwijderen?")) onRemove(); }}
            className="p-1.5 text-gray-400 hover:text-red-500" title="Verwijderen">
            <Trash2 size={16} />
          </button>
        </div>
      </div>

      {open && (
        <div className="px-4 pb-4 pt-1 border-t border-gray-100 space-y-4">
          {HEEFT_ACHTERGROND.has(blok.type) && (
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Achtergrond</label>
              <select
                value={blok.achtergrond ?? ""}
                onChange={(e) => onChange({ achtergrond: e.target.value })}
                className="px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white"
              >
                {ACHTERGROND_OPTIES.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
            </div>
          )}
          {schema.map((f) => (
            <div key={f.key}>
              <label className="block text-sm font-medium text-gray-700 mb-1">{f.label}</label>
              {f.hint && <p className="text-xs text-gray-400 mb-1">{f.hint}</p>}
              <FieldInput
                field={f}
                value={blok[f.key]}
                onChange={(v) => onChange({ [f.key]: v })}
                resolveImage={resolveImage}
                uploadImage={uploadImage}
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Pagina-editor ───────────────────────────────────────────────────────
function PaginaEditor({ slug, onClose }: { slug: string; onClose: () => void }) {
  const data = useAdminQuery(api.blokPaginas.getForAdmin, { slug });
  const save = useAdminMutation(api.blokPaginas.save);
  const generateUploadUrl = useAdminMutation(api.blokPaginas.generateUploadUrl);
  const getImageUrl = useAdminMutation(api.blokPaginas.getImageUrl);

  const [form, setForm] = useState<any>(null);
  const [blocks, setBlocks] = useState<any[]>([]);
  const [localPreviews, setLocalPreviews] = useState<Record<string, string>>({});
  const [nieuwType, setNieuwType] = useState<string>(BLOCK_TYPES[0]);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<string>("");
  const [preview, setPreview] = useState(false);

  // Data in state laden zodra beschikbaar (één keer).
  const ready = data !== undefined;
  useEffect(() => {
    if (data && form === null) {
      setForm({
        _id: data._id,
        slug: data.slug,
        naam: data.naam,
        pageTitle: data.pageTitle,
        verliestype: data.verliestype ?? "",
        categorie: data.categorie ?? "zij-aan-zij",
        accentKleur: data.accentKleur ?? "",
        metaDescription: data.metaDescription ?? "",
        gepubliceerd: data.gepubliceerd,
      });
      setBlocks(data.blocks || []);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data]);

  const resolveImage = useCallback<ImageResolver>(
    (value) => {
      if (!value) return "";
      if (value.startsWith("storage:")) {
        return localPreviews[value] || (data?.imageUrls?.[value] ?? "");
      }
      return value;
    },
    [localPreviews, data]
  );

  // Diep de "storage:<id>"-strings in de blokken vervangen door URLs, voor de voorbeeldweergave.
  const resolveBlocks = useCallback(
    (value: any): any => {
      if (typeof value === "string") return value.startsWith("storage:") ? resolveImage(value) : value;
      if (Array.isArray(value)) return value.map(resolveBlocks);
      if (value && typeof value === "object") {
        const o: any = {};
        for (const k of Object.keys(value)) o[k] = resolveBlocks(value[k]);
        return o;
      }
      return value;
    },
    [resolveImage]
  );

  const uploadImage = useCallback(
    async (file: File): Promise<string> => {
      const url = await generateUploadUrl({});
      const res = await fetch(url, { method: "POST", headers: { "Content-Type": file.type }, body: file });
      if (!res.ok) throw new Error("upload response " + res.status);
      const { storageId } = await res.json();
      const ref = `storage:${storageId}`;
      const preview = await getImageUrl({ storageId });
      if (preview) setLocalPreviews((p) => ({ ...p, [ref]: preview }));
      return ref;
    },
    [generateUploadUrl, getImageUrl]
  );

  const patchBlock = (i: number, patch: any) =>
    setBlocks((bs) => bs.map((b, j) => (j === i ? { ...b, ...patch } : b)));
  const moveBlock = (i: number, dir: -1 | 1) =>
    setBlocks((bs) => {
      const j = i + dir;
      if (j < 0 || j >= bs.length) return bs;
      const next = [...bs];
      [next[i], next[j]] = [next[j], next[i]];
      return next;
    });
  const removeBlock = (i: number) => setBlocks((bs) => bs.filter((_, j) => j !== i));
  const addBlock = () => setBlocks((bs) => [...bs, leegBlok(nieuwType)]);

  const handleSave = async () => {
    if (!form) return;
    setSaving(true);
    setMsg("");
    try {
      await save({
        id: form._id,
        slug: form.slug.trim(),
        naam: form.naam.trim(),
        pageTitle: form.pageTitle.trim(),
        verliestype: form.verliestype.trim() || undefined,
        categorie: form.categorie || undefined,
        accentKleur: form.accentKleur.trim() || undefined,
        gepubliceerd: form.gepubliceerd,
        metaDescription: form.metaDescription.trim() || undefined,
        blocksJson: JSON.stringify(blocks),
      });
      setMsg("Opgeslagen ✓");
      setTimeout(() => setMsg(""), 2500);
    } catch (e: any) {
      setMsg("Fout: " + (e?.message || e));
    } finally {
      setSaving(false);
    }
  };

  if (!ready) return <div className="p-8 text-gray-400">Laden...</div>;
  if (data === null) return (
    <div className="p-8">
      <p className="text-gray-500">Pagina niet gevonden.</p>
      <button onClick={onClose} className="mt-3 text-primary-600 hover:underline">Terug</button>
    </div>
  );
  if (!form) return <div className="p-8 text-gray-400">Laden...</div>;

  const setF = (k: string, v: any) => setForm((f: any) => ({ ...f, [k]: v }));

  if (preview) {
    const zichtbaar = blocks.filter((b) => b && !b.verborgen);
    return (
      <div className="fixed inset-0 z-50 bg-white overflow-y-auto">
        <div className="sticky top-0 z-10 flex items-center justify-between bg-gray-900 text-white px-4 py-2 text-sm">
          <span className="font-medium">Voorbeeld · {form.naam} {form.gepubliceerd ? "" : "(concept)"}</span>
          <button onClick={() => setPreview(false)} className="flex items-center gap-1.5 hover:text-gray-300">
            <X size={16} /> Sluiten
          </button>
        </div>
        <BlokPaginaView blocks={resolveBlocks(zichtbaar)} slug={form.slug} accentKleur={form.accentKleur} />
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto pb-24">
      {/* Kop */}
      <div className="flex items-center justify-between mb-6 sticky top-0 bg-gray-50 py-3 z-10 -mx-4 px-4 border-b border-gray-200">
        <button onClick={onClose} className="flex items-center gap-1.5 text-gray-600 hover:text-gray-900 text-sm">
          <ArrowLeft size={16} /> Overzicht
        </button>
        <div className="flex items-center gap-3">
          {msg && <span className={`text-sm ${msg.startsWith("Fout") ? "text-red-600" : "text-green-600"}`}>{msg}</span>}
          <button onClick={() => setPreview(true)}
            className="flex items-center gap-1.5 text-gray-600 hover:text-gray-900 text-sm">
            <Monitor size={15} /> Voorbeeld
          </button>
          <a href={`/lp/${form.slug}`} target="_blank" rel="noreferrer"
            className="flex items-center gap-1.5 text-gray-600 hover:text-gray-900 text-sm">
            <ExternalLink size={15} /> Bekijken
          </a>
          <button onClick={handleSave} disabled={saving}
            className="flex items-center gap-1.5 bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 rounded-lg text-sm font-medium disabled:opacity-60">
            <Save size={15} /> {saving ? "Opslaan..." : "Opslaan"}
          </button>
        </div>
      </div>

      {/* Pagina-instellingen */}
      <div className="bg-white border border-gray-300 rounded-xl p-5 mb-6 space-y-4">
        <h2 className="font-semibold text-gray-800">Pagina-instellingen</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Naam (intern)</label>
            <input type="text" value={form.naam} onChange={(e) => setF("naam", e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Slug (URL: /lp/…)</label>
            <input type="text" value={form.slug} onChange={(e) => setF("slug", e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Paginatitel (browsertab / SEO)</label>
            <input type="text" value={form.pageTitle} onChange={(e) => setF("pageTitle", e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Verliestype</label>
            <input type="text" value={form.verliestype} onChange={(e) => setF("verliestype", e.target.value)}
              placeholder="bv. verlies, kinderloos" className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Menu-categorie</label>
            <select value={form.categorie} onChange={(e) => setF("categorie", e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white">
              <option value="zij-aan-zij">Zij aan Zij</option>
              <option value="product">Producten &middot; Landingspagina</option>
            </select>
            <p className="text-xs text-gray-400 mt-1">Bepaalt onder welk admin-menu de pagina staat.</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Accentkleur</label>
            <div className="flex items-center gap-2">
              <input type="color" value={form.accentKleur || "#4a7c59"}
                onChange={(e) => setF("accentKleur", e.target.value)}
                className="h-9 w-12 p-0.5 border border-gray-300 rounded-lg cursor-pointer bg-white" />
              <input type="text" value={form.accentKleur} onChange={(e) => setF("accentKleur", e.target.value)}
                placeholder="#4a7c59 (standaard groen)"
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm" />
              {form.accentKleur && (
                <button type="button" onClick={() => setF("accentKleur", "")}
                  className="text-sm text-gray-400 hover:text-red-500 whitespace-nowrap">Standaard</button>
              )}
            </div>
            <p className="text-xs text-gray-400 mt-1">Leeg = standaard groen. Sterk/wash worden automatisch afgeleid.</p>
          </div>
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">Meta-omschrijving (SEO)</label>
            <textarea value={form.metaDescription} onChange={(e) => setF("metaDescription", e.target.value)} rows={2}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm resize-y" />
          </div>
        </div>
        <label className="flex items-center gap-2 text-sm text-gray-700">
          <input type="checkbox" checked={form.gepubliceerd} onChange={(e) => setF("gepubliceerd", e.target.checked)}
            className="rounded border-gray-300 text-primary-600 focus:ring-primary-400" />
          Gepubliceerd (zichtbaar op de site)
        </label>
      </div>

      {/* Blokken */}
      <div className="flex items-center justify-between mb-3">
        <h2 className="font-semibold text-gray-800">Blokken ({blocks.length})</h2>
      </div>
      <div className="space-y-3">
        {blocks.map((b, i) => (
          <BlockCard
            key={b.key || i}
            blok={b}
            index={i}
            total={blocks.length}
            onChange={(patch) => patchBlock(i, patch)}
            onMove={(dir) => moveBlock(i, dir)}
            onRemove={() => removeBlock(i)}
            resolveImage={resolveImage}
            uploadImage={uploadImage}
          />
        ))}
      </div>

      {/* Blok toevoegen */}
      <div className="mt-4 flex items-center gap-2">
        <select value={nieuwType} onChange={(e) => setNieuwType(e.target.value)}
          className="px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white">
          {BLOCK_TYPES.map((t) => <option key={t} value={t}>{BLOCK_LABELS[t] || t}</option>)}
        </select>
        <button onClick={addBlock}
          className="flex items-center gap-1.5 bg-gray-800 hover:bg-gray-900 text-white px-4 py-2 rounded-lg text-sm">
          <Plus size={15} /> Blok toevoegen
        </button>
      </div>
    </div>
  );
}

// ── Overzicht ───────────────────────────────────────────────────────────
export function BlokPaginasBeheer({
  categorie, titel, intro,
}: { categorie: string; titel: string; intro: string }) {
  const pages = useAdminQuery(api.blokPaginas.list, {});
  const dupliceer = useAdminMutation(api.blokPaginas.dupliceer);
  const remove = useAdminMutation(api.blokPaginas.remove);
  const [editingSlug, setEditingSlug] = useState<string | null>(null);

  if (editingSlug) {
    return <PaginaEditor slug={editingSlug} onClose={() => setEditingSlug(null)} />;
  }

  const handleDupliceer = async (bronId: string, naam: string) => {
    const nieuweNaam = prompt("Naam voor de nieuwe pagina?", `${naam} (kopie)`);
    if (!nieuweNaam) return;
    const nieuweSlug = prompt("Slug voor de nieuwe pagina? (bv. zij-aan-zij-kinderloos)");
    if (!nieuweSlug) return;
    try {
      await dupliceer({ bronId: bronId as any, nieuweSlug: nieuweSlug.trim(), nieuweNaam: nieuweNaam.trim() });
    } catch (e: any) {
      alert("Dupliceren mislukt: " + (e?.message || e));
    }
  };

  const handleRemove = async (id: string, naam: string) => {
    if (!confirm(`Pagina "${naam}" definitief verwijderen?`)) return;
    try {
      await remove({ id: id as any });
    } catch (e: any) {
      alert("Verwijderen mislukt: " + (e?.message || e));
    }
  };

  const zichtbaar = (pages ?? []).filter(
    (p: any) => (p.categorie ?? "zij-aan-zij") === categorie
  );

  return (
    <div className="max-w-3xl mx-auto">
      <div className="flex items-center gap-3 mb-2">
        <Layers className="text-primary-600" size={24} />
        <h1 className="text-2xl font-bold text-gray-900">{titel}</h1>
      </div>
      <p className="text-gray-500 mb-6 text-sm">{intro}</p>

      {pages === undefined ? (
        <div className="text-gray-400">Laden...</div>
      ) : zichtbaar.length === 0 ? (
        <div className="text-gray-500 bg-white border border-gray-200 rounded-xl p-8 text-center">
          Nog geen blok-pagina's.
        </div>
      ) : (
        <div className="space-y-3">
          {zichtbaar.map((p: any) => (
            <div key={p._id} className="bg-white border border-gray-300 rounded-xl p-4 flex items-center gap-3">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-gray-800 truncate">{p.naam}</span>
                  {p.gepubliceerd ? (
                    <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">live</span>
                  ) : (
                    <span className="text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full">concept</span>
                  )}
                </div>
                <div className="text-xs text-gray-400 mt-0.5">
                  /lp/{p.slug}{p.verliestype ? ` · ${p.verliestype}` : ""}
                </div>
              </div>
              <div className="flex items-center gap-1">
                <a href={`/lp/${p.slug}`} target="_blank" rel="noreferrer"
                  className="p-2 text-gray-400 hover:text-gray-700" title="Bekijken">
                  <ExternalLink size={17} />
                </a>
                <button onClick={() => handleDupliceer(p._id, p.naam)}
                  className="p-2 text-gray-400 hover:text-gray-700" title="Dupliceren">
                  <Copy size={17} />
                </button>
                <button onClick={() => handleRemove(p._id, p.naam)}
                  className="p-2 text-gray-400 hover:text-red-500" title="Verwijderen">
                  <Trash2 size={17} />
                </button>
                <button onClick={() => setEditingSlug(p.slug)}
                  className="flex items-center gap-1.5 bg-primary-600 hover:bg-primary-700 text-white px-3 py-1.5 rounded-lg text-sm ml-1">
                  <Edit size={14} /> Bewerken
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
