"use client";

import { useState, useRef } from "react";
import { useQuery } from "convex/react";
import { useAdminMutation, useAdminAction } from "../AdminAuthContext";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import {
  Link,
  FileText,
  Trash2,
  X,
  Loader2,
  CheckCircle,
  AlertCircle,
} from "lucide-react";
import { extractTextFromPdf } from "@/lib/extractPdfText";

export default function BronnenPage() {
  const sources = useQuery(api.sources.getAllSources);
  const addUrlSource = useAdminMutation(api.sources.addUrlSource);
  const addPdfSource = useAdminMutation(api.sources.addPdfSource);
  const generateUploadUrl = useAdminMutation(api.sources.generateUploadUrl);
  const deleteSource = useAdminMutation(api.sources.deleteSource);
  const setSourceActive = useAdminMutation(api.sources.setSourceActive);
  const fetchAndExtractUrl = useAdminAction(api.sources.fetchAndExtractUrl);

  const [showAddUrl, setShowAddUrl] = useState(false);
  const [urlInput, setUrlInput] = useState("");
  const [urlLoading, setUrlLoading] = useState(false);
  const [urlError, setUrlError] = useState("");

  const [showAddPdf, setShowAddPdf] = useState(false);
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [pdfTitle, setPdfTitle] = useState("");
  const [pdfLoading, setPdfLoading] = useState(false);
  const [pdfError, setPdfError] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleAddUrl = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!urlInput.trim()) return;
    setUrlLoading(true);
    setUrlError("");
    try {
      const { text, title } = await fetchAndExtractUrl({ url: urlInput.trim() });
      await addUrlSource({
        title,
        url: urlInput.trim(),
        extractedText: text,
      });
      setUrlInput("");
      setShowAddUrl(false);
    } catch (err) {
      setUrlError((err as Error).message);
    } finally {
      setUrlLoading(false);
    }
  };

  const handleAddPdf = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pdfFile || !pdfTitle.trim()) return;
    setPdfLoading(true);
    setPdfError("");
    try {
      const text = await extractTextFromPdf(pdfFile);
      if (text.length < 20) {
        throw new Error("Te weinig tekst gevonden in deze PDF. Werkt alleen met tekst-PDF's (geen gescande afbeeldingen).");
      }
      const uploadUrl = await generateUploadUrl();
      const res = await fetch(uploadUrl, {
        method: "POST",
        headers: { "Content-Type": pdfFile.type },
        body: pdfFile,
      });
      const { storageId } = await res.json();
      await addPdfSource({
        title: pdfTitle.trim(),
        storageId,
        extractedText: text.slice(0, 100000),
      });
      setPdfFile(null);
      setPdfTitle("");
      setShowAddPdf(false);
      fileInputRef.current && (fileInputRef.current.value = "");
    } catch (err) {
      setPdfError((err as Error).message);
    } finally {
      setPdfLoading(false);
    }
  };

  const handleDelete = async (id: Id<"sources">) => {
    if (!confirm("Weet je zeker dat je deze bron wilt verwijderen?")) return;
    try {
      await deleteSource({ id });
    } catch (err) {
      alert("Fout bij verwijderen: " + (err as Error).message);
    }
  };

  const handleToggleActive = async (id: Id<"sources">, isActive: boolean) => {
    try {
      await setSourceActive({ id, isActive: !isActive });
    } catch (err) {
      alert("Fout: " + (err as Error).message);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-xl sm:text-2xl font-bold text-primary-900">Bronnen</h1>
        <p className="text-sm text-gray-600 mt-1">
          Website-URL&apos;s en PDF&apos;s. Benji gebruikt deze als extra context wanneer het antwoord niet in de vaste Q&A staat.
        </p>
      </div>

      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => { setShowAddUrl(true); setUrlError(""); setShowAddPdf(false); }}
          className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
        >
          <Link size={18} />
          URL toevoegen
        </button>
        <button
          onClick={() => { setShowAddPdf(true); setPdfError(""); setShowAddUrl(false); }}
          className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
        >
          <FileText size={18} />
          PDF uploaden
        </button>
      </div>

      {/* URL form */}
      {showAddUrl && (
        <div className="bg-white rounded-xl border border-primary-200 p-6 shadow-sm">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold text-primary-900">Website-URL toevoegen</h2>
            <button onClick={() => setShowAddUrl(false)} className="p-2 text-gray-500 hover:bg-gray-100 rounded-lg">
              <X size={20} />
            </button>
          </div>
          <form onSubmit={handleAddUrl} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">URL</label>
              <input
                type="url"
                value={urlInput}
                onChange={(e) => setUrlInput(e.target.value)}
                placeholder="https://voorbeeld.nl/pagina"
                className="w-full px-3 py-2 border border-primary-200 rounded-lg focus:ring-2 focus:ring-primary-500"
                required
              />
            </div>
            {urlError && (
              <div className="flex items-center gap-2 text-red-600 text-sm">
                <AlertCircle size={18} />
                {urlError}
              </div>
            )}
            <div className="flex gap-2">
              <button
                type="submit"
                disabled={urlLoading}
                className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50"
              >
                {urlLoading ? <Loader2 size={18} className="animate-spin" /> : <CheckCircle size={18} />}
                {urlLoading ? "Bezig..." : "Toevoegen"}
              </button>
              <button type="button" onClick={() => setShowAddUrl(false)} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg">
                Annuleren
              </button>
            </div>
          </form>
        </div>
      )}

      {/* PDF form */}
      {showAddPdf && (
        <div className="bg-white rounded-xl border border-primary-200 p-6 shadow-sm">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold text-primary-900">PDF uploaden</h2>
            <button onClick={() => setShowAddPdf(false)} className="p-2 text-gray-500 hover:bg-gray-100 rounded-lg">
              <X size={20} />
            </button>
          </div>
          <form onSubmit={handleAddPdf} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Titel</label>
              <input
                type="text"
                value={pdfTitle}
                onChange={(e) => setPdfTitle(e.target.value)}
                placeholder="Bijv. Handleiding product X"
                className="w-full px-3 py-2 border border-primary-200 rounded-lg focus:ring-2 focus:ring-primary-500"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">PDF-bestand</label>
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,application/pdf"
                onChange={(e) => setPdfFile(e.target.files?.[0] ?? null)}
                className="w-full px-3 py-2 border border-primary-200 rounded-lg focus:ring-2 focus:ring-primary-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-primary-50 file:text-primary-700"
                required
              />
              <p className="text-xs text-gray-500 mt-1">
                Alleen tekst-PDF&apos;s. Gescande documenten (afbeeldingen) werken niet.
              </p>
            </div>
            {pdfError && (
              <div className="flex items-center gap-2 text-red-600 text-sm">
                <AlertCircle size={18} />
                {pdfError}
              </div>
            )}
            <div className="flex gap-2">
              <button
                type="submit"
                disabled={pdfLoading || !pdfFile || !pdfTitle.trim()}
                className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50"
              >
                {pdfLoading ? <Loader2 size={18} className="animate-spin" /> : <CheckCircle size={18} />}
                {pdfLoading ? "Bezig..." : "Toevoegen"}
              </button>
              <button type="button" onClick={() => setShowAddPdf(false)} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg">
                Annuleren
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Bronnenlijst */}
      <div className="bg-white rounded-xl border border-primary-200 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-primary-200">
          <h2 className="text-lg font-semibold text-primary-900">Toegevoegde bronnen ({sources?.length ?? 0})</h2>
        </div>
        {!sources || sources.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            <FileText className="mx-auto mb-2 text-gray-400" size={40} />
            <p>Nog geen bronnen. Voeg een URL of PDF toe.</p>
          </div>
        ) : (
          <div className="divide-y divide-primary-200">
            {sources.map((s) => (
              <div
                key={s._id}
                className={`p-4 flex items-start justify-between gap-4 ${!s.isActive ? "opacity-60" : ""}`}
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    {s.type === "url" ? (
                      <Link size={18} className="text-primary-600 flex-shrink-0" />
                    ) : (
                      <FileText size={18} className="text-primary-600 flex-shrink-0" />
                    )}
                    <h3 className="font-medium text-primary-900 truncate">{s.title}</h3>
                    {!s.isActive && (
                      <span className="px-2 py-0.5 text-xs font-medium bg-gray-100 text-gray-600 rounded">Inactief</span>
                    )}
                  </div>
                  {s.url && (
                    <a
                      href={s.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-primary-600 hover:underline truncate block mt-1"
                    >
                      {s.url}
                    </a>
                  )}
                  <p className="text-xs text-gray-500 mt-1">
                    {s.extractedText.length} tekens · {s.type === "pdf" ? "PDF" : "URL"}
                  </p>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <button
                    onClick={() => handleToggleActive(s._id, s.isActive)}
                    className={`px-3 py-1 text-xs font-medium rounded-lg ${
                      s.isActive ? "text-orange-700 bg-orange-50" : "text-green-700 bg-green-50"
                    }`}
                  >
                    {s.isActive ? "Deactiveren" : "Activeren"}
                  </button>
                  <button
                    onClick={() => handleDelete(s._id)}
                    className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                    title="Verwijderen"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
