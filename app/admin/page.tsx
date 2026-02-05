"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Save, BookOpen, ListChecks, AlertCircle, CheckCircle, Settings2, Key, FileText, Loader2 } from "lucide-react";
import { extractTextFromPdf } from "@/lib/extractPdfText";

export default function AdminSettings() {
  const settings = useQuery(api.settings.get);
  const knowledgeBaseQuestions = useQuery(api.knowledgeBase.getAllQuestions, { isActive: true });
  const saveSettings = useMutation(api.settings.save);

  const [knowledge, setKnowledge] = useState("");
  const [rules, setRules] = useState("");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [pdfLoading, setPdfLoading] = useState(false);
  const [pdfError, setPdfError] = useState("");
  const pdfInputRef = useRef<HTMLInputElement>(null);

  // Load settings when they arrive from database
  useEffect(() => {
    if (settings) {
      setKnowledge(settings.knowledge);
      setRules(settings.rules);
    }
  }, [settings]);

  const handleSave = async () => {
    setSaving(true);
    setSaved(false);
    try {
      await saveSettings({ knowledge, rules });
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (error) {
      console.error("Error saving settings:", error);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 sm:space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-xl sm:text-2xl font-bold text-primary-900">Bot Instellingen</h1>
        <p className="text-sm sm:text-base text-primary-700 mt-1">
          Configureer de kennis en regels voor je chatbot
        </p>
      </div>

      {/* Status / Configuratie */}
      <div className="bg-white rounded-xl border border-primary-200 p-4 sm:p-5 shadow-sm">
        <h2 className="text-sm font-semibold text-primary-900 mb-3 flex items-center gap-2">
          <Settings2 size={18} className="text-primary-600" />
          Status & configuratie
        </h2>
        <ul className="space-y-2 text-sm">
          <li className="flex items-center gap-2">
            {settings && (settings.knowledge?.trim() || settings.rules?.trim()) ? (
              <CheckCircle size={18} className="text-green-600 flex-shrink-0" />
            ) : (
              <AlertCircle size={18} className="text-amber-600 flex-shrink-0" />
            )}
            <span className="text-primary-800">
              Instellingen: {settings && (settings.knowledge?.trim() || settings.rules?.trim()) ? "opgeslagen" : "nog niet opgeslagen"}
            </span>
          </li>
          <li className="flex items-center gap-2">
            {knowledgeBaseQuestions && knowledgeBaseQuestions.length > 0 ? (
              <CheckCircle size={18} className="text-green-600 flex-shrink-0" />
            ) : (
              <AlertCircle size={18} className="text-amber-600 flex-shrink-0" />
            )}
            <span className="text-primary-800">
              Knowledge Base: {knowledgeBaseQuestions?.length ?? 0} Q&A&apos;s actief
            </span>
            <Link href="/admin/knowledge" className="text-primary-600 hover:text-primary-700 hover:underline ml-1">
              Beheren
            </Link>
          </li>
          <li className="flex items-center gap-2 pt-1 border-t border-primary-100 mt-2">
            <Key size={18} className="text-primary-500 flex-shrink-0" />
            <span className="text-primary-700">
              Zet <code className="bg-primary-100 px-1 rounded text-xs">ANTHROPIC_API_KEY</code> in Convex Dashboard (Settings → Environment Variables) voor AI-antwoorden.
            </span>
          </li>
        </ul>
      </div>

      {/* Knowledge Section */}
      <div className="bg-white rounded-xl border border-primary-200 p-4 sm:p-6 shadow-sm">
        <div className="flex items-start sm:items-center gap-3 mb-4">
          <div className="w-9 h-9 sm:w-10 sm:h-10 bg-primary-100 rounded-lg flex items-center justify-center flex-shrink-0 border border-primary-200">
            <BookOpen className="w-4 h-4 sm:w-5 sm:h-5 text-primary-600" />
          </div>
          <div className="min-w-0 flex-1">
            <h2 className="text-base sm:text-lg font-semibold text-primary-900">Knowledge</h2>
            <p className="text-xs sm:text-sm text-primary-700">De kennis die de chatbot gebruikt om vragen te beantwoorden</p>
          </div>
        </div>
        <textarea
          value={knowledge}
          onChange={(e) => setKnowledge(e.target.value)}
          placeholder="Voer hier je kennis in (optioneel)...

Bijvoorbeeld voor TalkToBenji (rouw):
- Benji is een chatbot voor steun bij rouw en verlies
- Doel: luisteren, erkennen van gevoelens, geen advies opdringen
- Taal: warm, rustig, Nederlands"
          className="w-full min-h-[12rem] max-h-[32rem] h-64 px-3 sm:px-4 py-2 sm:py-3 bg-primary-50 border border-primary-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none resize-y font-mono text-xs sm:text-sm text-gray-900 placeholder-gray-500"
        />
        <div className="mt-3 pt-3 border-t border-primary-100">
          <p className="text-xs font-medium text-primary-700 mb-2 flex items-center gap-1">
            <FileText size={14} />
            Of voeg kennis toe via PDF:
          </p>
          <div className="flex items-center gap-2 flex-wrap">
            <input
              ref={pdfInputRef}
              type="file"
              accept=".pdf,application/pdf"
              onChange={async (e) => {
                const file = e.target.files?.[0];
                if (!file) return;
                setPdfLoading(true);
                setPdfError("");
                try {
                  const text = await extractTextFromPdf(file);
                  if (text.length < 20) {
                    throw new Error("Te weinig tekst in deze PDF. Werkt alleen met tekst-PDF's (geen gescande afbeeldingen).");
                  }
                  setKnowledge((prev) =>
                    prev.trim() ? prev + "\n\n---\n\n" + text.slice(0, 150000) : text.slice(0, 150000)
                  );
                  if (pdfInputRef.current) pdfInputRef.current.value = "";
                } catch (err) {
                  setPdfError((err as Error).message);
                } finally {
                  setPdfLoading(false);
                }
              }}
              className="text-sm text-primary-700 file:mr-3 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-primary-100 file:text-primary-700 file:font-medium hover:file:bg-primary-200"
            />
            {pdfLoading && (
              <span className="flex items-center gap-1 text-sm text-primary-600">
                <Loader2 size={16} className="animate-spin" />
                Bezig...
              </span>
            )}
          </div>
          {pdfError && (
            <p className="mt-2 text-sm text-red-600 flex items-center gap-1">
              <AlertCircle size={16} />
              {pdfError}
            </p>
          )}
          <p className="text-xs text-gray-500 mt-1">
            Alleen tekst-PDF&apos;s. Gescande documenten werken niet. De tekst wordt aan je bestaande Knowledge toegevoegd.
          </p>
        </div>
      </div>

      {/* Rules Section */}
      <div className="bg-white rounded-xl border border-primary-200 p-4 sm:p-6 shadow-sm">
        <div className="flex items-start sm:items-center gap-3 mb-4">
          <div className="w-9 h-9 sm:w-10 sm:h-10 bg-primary-100 rounded-lg flex items-center justify-center flex-shrink-0 border border-primary-200">
            <ListChecks className="w-4 h-4 sm:w-5 sm:h-5 text-primary-600" />
          </div>
          <div>
            <h2 className="text-base sm:text-lg font-semibold text-primary-900">Rules</h2>
            <p className="text-xs sm:text-sm text-primary-700">Instructies voor hoe de chatbot moet reageren</p>
          </div>
        </div>
        <textarea
          value={rules}
          onChange={(e) => setRules(e.target.value)}
          placeholder="Rouw-specifieke regels (system prompt)...

Bijvoorbeeld:
- Je bent Benji, een rustige, ondersteunende chatbot bij rouw en verlies
- Antwoord altijd in het Nederlands, warm en niet opdringerig
- Erken gevoelens (verdriet, boosheid, eenzaamheid) zonder ze te bagatelliseren
- Geef geen ongevraagd advies; vraag wat de ander nodig heeft
- Verwijs bij acute crisis naar professionele hulp (113, huisarts)"
          className="w-full h-48 sm:h-64 px-3 sm:px-4 py-2 sm:py-3 bg-primary-50 border border-primary-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none resize-none font-mono text-xs sm:text-sm text-gray-900 placeholder-gray-500"
        />
      </div>

      {/* Save Button */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 sm:gap-4">
        <button
          onClick={handleSave}
          disabled={saving}
          className="flex items-center justify-center gap-2 px-6 py-3 bg-primary-600 text-white font-medium rounded-lg hover:bg-primary-700 transition-colors disabled:opacity-50 shadow-sm"
        >
          <Save size={20} />
          {saving ? "Opslaan..." : "Opslaan"}
        </button>

        {saved && (
          <div className="flex items-center justify-center gap-2 text-green-600">
            <CheckCircle size={20} />
            <span className="text-sm sm:text-base">Instellingen opgeslagen!</span>
          </div>
        )}
      </div>

      {/* Info Box */}
      <div className="bg-primary-100 border border-primary-200 rounded-xl p-3 sm:p-4 flex gap-3">
        <AlertCircle className="w-5 h-5 text-primary-600 flex-shrink-0 mt-0.5" />
        <div className="text-xs sm:text-sm text-primary-900">
          <p className="font-medium mb-1">Tip</p>
          <p>
            De chatbot combineert je knowledge en rules om antwoorden te genereren.
            Hoe specifieker je informatie, hoe beter de antwoorden zullen zijn.
          </p>
        </div>
      </div>
    </div>
  );
}