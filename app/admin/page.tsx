"use client";

import { useState, useEffect } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Save, BookOpen, ListChecks, AlertCircle, CheckCircle } from "lucide-react";

export default function AdminSettings() {
  const settings = useQuery(api.settings.get);
  const saveSettings = useMutation(api.settings.save);

  const [knowledge, setKnowledge] = useState("");
  const [rules, setRules] = useState("");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

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
        <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Bot Instellingen</h1>
        <p className="text-sm sm:text-base text-gray-600 mt-1">
          Configureer de kennis en regels voor je chatbot
        </p>
      </div>

      {/* Knowledge Section */}
      <div className="bg-white rounded-xl border border-gray-200 p-4 sm:p-6 shadow-sm">
        <div className="flex items-start sm:items-center gap-3 mb-4">
          <div className="w-9 h-9 sm:w-10 sm:h-10 bg-primary-50 rounded-lg flex items-center justify-center flex-shrink-0 border border-primary-100">
            <BookOpen className="w-4 h-4 sm:w-5 sm:h-5 text-primary-600" />
          </div>
          <div>
            <h2 className="text-base sm:text-lg font-semibold text-gray-900">Knowledge</h2>
            <p className="text-xs sm:text-sm text-gray-600">De kennis die de chatbot gebruikt om vragen te beantwoorden</p>
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
          className="w-full h-48 sm:h-64 px-3 sm:px-4 py-2 sm:py-3 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none resize-none font-mono text-xs sm:text-sm text-gray-900 placeholder-gray-400"
        />
      </div>

      {/* Rules Section */}
      <div className="bg-white rounded-xl border border-gray-200 p-4 sm:p-6 shadow-sm">
        <div className="flex items-start sm:items-center gap-3 mb-4">
          <div className="w-9 h-9 sm:w-10 sm:h-10 bg-primary-50 rounded-lg flex items-center justify-center flex-shrink-0 border border-primary-100">
            <ListChecks className="w-4 h-4 sm:w-5 sm:h-5 text-primary-600" />
          </div>
          <div>
            <h2 className="text-base sm:text-lg font-semibold text-gray-900">Rules</h2>
            <p className="text-xs sm:text-sm text-gray-600">Instructies voor hoe de chatbot moet reageren</p>
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
          className="w-full h-48 sm:h-64 px-3 sm:px-4 py-2 sm:py-3 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none resize-none font-mono text-xs sm:text-sm text-gray-900 placeholder-gray-400"
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
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 sm:p-4 flex gap-3">
        <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
        <div className="text-xs sm:text-sm text-blue-900">
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