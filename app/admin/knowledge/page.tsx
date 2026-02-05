"use client";

import { useState, useEffect } from "react";
import { useQuery, useMutation, useAction } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import {
  Plus,
  Search,
  Edit,
  Trash2,
  X,
  Save,
  Tag,
  Filter,
  CheckCircle,
  AlertCircle,
  BookOpen,
  Upload,
  Download,
  Sparkles,
} from "lucide-react";

type KnowledgeBaseItem = {
  _id: Id<"knowledgeBase">;
  question: string;
  answer: string;
  category: string;
  tags: string[];
  alternativeQuestions?: string[];
  alternativeAnswers?: string[];
  priority?: number;
  isActive: boolean;
  usageCount: number;
  averageRating?: number;
  createdAt: number;
  updatedAt: number;
};

export default function KnowledgeBasePage() {
  const allQuestions = useQuery(api.knowledgeBase.getAllQuestions, {});
  const categories = useQuery(api.knowledgeBase.getCategories);
  const addQuestion = useMutation(api.knowledgeBase.addQuestion);
  const updateQuestion = useMutation(api.knowledgeBase.updateQuestion);
  const deleteQuestion = useMutation(api.knowledgeBase.deleteQuestion);
  const activateQuestion = useMutation(api.knowledgeBase.activateQuestion);
  const deactivateQuestion = useMutation(api.knowledgeBase.deactivateQuestion);
  const bulkImportQuestions = useMutation(api.knowledgeBase.bulkImportQuestions);
  const generateAlternativeQuestions = useAction(api.ai.generateAlternativeQuestions);
  const generateAlternativeAnswers = useAction(api.ai.generateAlternativeAnswers);

  const [showForm, setShowForm] = useState(false);
  const [generatingAlt, setGeneratingAlt] = useState(false);
  const [generatingAltAnswers, setGeneratingAltAnswers] = useState(false);
  const [editingId, setEditingId] = useState<Id<"knowledgeBase"> | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [showActiveOnly, setShowActiveOnly] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [showBulkImport, setShowBulkImport] = useState(false);
  const [bulkImportText, setBulkImportText] = useState("");
  const [importing, setImporting] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    question: "",
    answer: "",
    category: "",
    tags: "",
    alternativeQuestions: "",
    alternativeAnswers: "",
    priority: 5,
  });

  // Reset form
  const resetForm = () => {
    setFormData({
      question: "",
      answer: "",
      category: "",
      tags: "",
      alternativeQuestions: "",
      alternativeAnswers: "",
      priority: 5,
    });
    setEditingId(null);
    setShowForm(false);
  };

  // Load question for editing
  const handleEdit = (item: KnowledgeBaseItem) => {
    setFormData({
      question: item.question,
      answer: item.answer,
      category: item.category,
      tags: item.tags.join(", "),
      alternativeQuestions: item.alternativeQuestions?.join("\n") || "",
      alternativeAnswers: item.alternativeAnswers?.join("\n") || "",
      priority: item.priority || 5,
    });
    setEditingId(item._id);
    setShowForm(true);
  };

  // Handle save
  const handleSave = async () => {
    if (!formData.question.trim() || !formData.answer.trim() || !formData.category.trim()) {
      alert("Vul minimaal vraag, antwoord en categorie in");
      return;
    }

    setSaving(true);
    setSaved(false);

    try {
      const tagsArray = formData.tags
        .split(",")
        .map((t) => t.trim())
        .filter((t) => t.length > 0);

      const altQuestionsArray = formData.alternativeQuestions
        .split("\n")
        .map((q) => q.trim())
        .filter((q) => q.length > 0);

      const altAnswersArray = formData.alternativeAnswers
        .split("\n")
        .map((a) => a.trim())
        .filter((a) => a.length > 0);

      if (editingId) {
        await updateQuestion({
          id: editingId,
          question: formData.question.trim(),
          answer: formData.answer.trim(),
          category: formData.category.trim(),
          tags: tagsArray,
          alternativeQuestions: altQuestionsArray.length > 0 ? altQuestionsArray : undefined,
          alternativeAnswers: altAnswersArray.length > 0 ? altAnswersArray : undefined,
          priority: formData.priority,
        });
      } else {
        await addQuestion({
          question: formData.question.trim(),
          answer: formData.answer.trim(),
          category: formData.category.trim(),
          tags: tagsArray,
          alternativeQuestions: altQuestionsArray.length > 0 ? altQuestionsArray : undefined,
          alternativeAnswers: altAnswersArray.length > 0 ? altAnswersArray : undefined,
          priority: formData.priority,
        });
      }

      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
      resetForm();
    } catch (error) {
      console.error("Error saving question:", error);
      alert("Fout bij opslaan: " + (error as Error).message);
    } finally {
      setSaving(false);
    }
  };

  // Verzamel bestaande vragen voor duplicate-check (max 30 om payload klein te houden)
  const getAllExistingQuestions = () => {
    const fromForm = [
      formData.question.trim(),
      ...formData.alternativeQuestions.split("\n").map((q) => q.trim()).filter(Boolean),
    ];
    const fromKb = (allQuestions || [])
      .filter((q) => !editingId || q._id !== editingId)
      .flatMap((q) => [q.question, ...(q.alternativeQuestions || [])]);
    const all = [...new Set([...fromForm, ...fromKb].map((q) => q.trim()).filter(Boolean))];
    return all.slice(0, 30);
  };

  // Genereer alternatieve vragen via AI (met duplicate-check)
  const handleGenerateAlternatives = async () => {
    if (!formData.question.trim() || !formData.answer.trim()) {
      alert("Vul eerst vraag en antwoord in om alternatieven te genereren.");
      return;
    }
    setGeneratingAlt(true);
    try {
      const alternatives = await generateAlternativeQuestions({
        question: formData.question.trim(),
        answer: formData.answer.trim(),
        existingToAvoid: getAllExistingQuestions(),
      });
      const existing = formData.alternativeQuestions
        .split("\n")
        .map((q) => q.trim())
        .filter(Boolean);
      const combined = [...new Set([...existing, ...alternatives])];
      setFormData({ ...formData, alternativeQuestions: combined.join("\n") });
    } catch (err) {
      alert("Fout bij genereren: " + (err as Error).message);
    } finally {
      setGeneratingAlt(false);
    }
  };

  // Genereer alternatieve antwoorden via AI
  const handleGenerateAltAnswers = async () => {
    if (!formData.question.trim() || !formData.answer.trim()) {
      alert("Vul eerst vraag en antwoord in om alternatieven te genereren.");
      return;
    }
    setGeneratingAltAnswers(true);
    try {
      const alternatives = await generateAlternativeAnswers({
        question: formData.question.trim(),
        answer: formData.answer.trim(),
      });
      const existing = formData.alternativeAnswers
        .split("\n")
        .map((a) => a.trim())
        .filter(Boolean);
      const combined = [...new Set([...existing, ...alternatives])];
      setFormData({ ...formData, alternativeAnswers: combined.join("\n") });
    } catch (err) {
      alert("Fout bij genereren: " + (err as Error).message);
    } finally {
      setGeneratingAltAnswers(false);
    }
  };

  // Handle bulk import
  const handleBulkImport = async () => {
    if (!bulkImportText.trim()) {
      alert("Voer JSON data in");
      return;
    }

    setImporting(true);
    try {
      let questions;
      try {
        questions = JSON.parse(bulkImportText);
      } catch (e) {
        alert("Ongeldige JSON. Controleer de syntax.");
        setImporting(false);
        return;
      }

      if (!Array.isArray(questions)) {
        alert("JSON moet een array zijn van Q&A objecten");
        setImporting(false);
        return;
      }

      // Validate each question
      for (const q of questions) {
        if (!q.question || !q.answer || !q.category) {
          alert(`Q&A ontbreekt verplichte velden: vraag, antwoord of categorie`);
          setImporting(false);
          return;
        }
      }

      const result = await bulkImportQuestions({
        questions: questions.map((q) => ({
          question: q.question,
          answer: q.answer,
          category: q.category,
          tags: q.tags || [],
          alternativeQuestions: q.alternativeQuestions || [],
          alternativeAnswers: q.alternativeAnswers || [],
          priority: q.priority || 5,
        })),
      });

      alert(`✅ ${result.count} Q&As succesvol geïmporteerd!`);
      setBulkImportText("");
      setShowBulkImport(false);
    } catch (error) {
      console.error("Error importing:", error);
      alert("Fout bij importeren: " + (error as Error).message);
    } finally {
      setImporting(false);
    }
  };

  // Handle delete
  const handleDelete = async (id: Id<"knowledgeBase">) => {
    if (!confirm("Weet je zeker dat je deze Q&A wilt verwijderen? Dit kan niet ongedaan worden gemaakt.")) {
      return;
    }

    try {
      await deleteQuestion({ id });
    } catch (error) {
      console.error("Error deleting question:", error);
      alert("Fout bij verwijderen");
    }
  };

  // Handle activate/deactivate
  const handleToggleActive = async (id: Id<"knowledgeBase">, isActive: boolean) => {
    try {
      if (isActive) {
        await deactivateQuestion({ id });
      } else {
        await activateQuestion({ id });
      }
    } catch (error) {
      console.error("Error toggling active status:", error);
    }
  };

  // Filter questions
  const filteredQuestions = (allQuestions || []).filter((q) => {
    // Category filter
    if (selectedCategory !== "all" && q.category !== selectedCategory) {
      return false;
    }

    // Active filter
    if (showActiveOnly && !q.isActive) {
      return false;
    }

      // Search filter
      if (searchTerm) {
        const searchLower = searchTerm.toLowerCase();
        const matchesQuestion = q.question.toLowerCase().includes(searchLower);
        const matchesAnswer = q.answer.toLowerCase().includes(searchLower);
        const matchesTags = q.tags.some((tag) => tag.toLowerCase().includes(searchLower));
        const matchesAlt = q.alternativeQuestions?.some((alt) =>
          alt.toLowerCase().includes(searchLower)
        );

        if (!matchesQuestion && !matchesAnswer && !matchesTags && !matchesAlt) {
          return false;
        }
      }

    return true;
  });

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-primary-900">Knowledge Base</h1>
          <p className="text-sm sm:text-base text-gray-600 mt-1">
            Beheer je Q&As voor de chatbot - Alles wordt opgeslagen in Convex database
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowBulkImport(!showBulkImport)}
            className="flex items-center justify-center gap-2 px-4 py-2 bg-primary-100 text-primary-700 font-medium rounded-lg hover:bg-primary-200 transition-colors shadow-sm"
          >
            <Upload size={18} />
            Bulk Import
          </button>
          <button
            onClick={() => {
              resetForm();
              setShowForm(true);
            }}
            className="flex items-center justify-center gap-2 px-4 py-2 bg-primary-600 text-white font-medium rounded-lg hover:bg-primary-700 transition-colors shadow-sm"
          >
            <Plus size={20} />
            Nieuwe Q&A
          </button>
        </div>
      </div>

      {/* Bulk Import */}
      {showBulkImport && (
        <div className="bg-white rounded-xl border border-primary-200 p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-lg font-semibold text-primary-900">Bulk Import Q&As</h2>
              <p className="text-sm text-primary-700 mt-1">
                Importeer meerdere Q&As tegelijk via JSON
              </p>
            </div>
            <button
              onClick={() => {
                setShowBulkImport(false);
                setBulkImportText("");
              }}
              className="p-2 text-primary-500 hover:text-primary-700 rounded-lg hover:bg-primary-50"
            >
              <X size={20} />
            </button>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                JSON Data (array van Q&A objecten)
              </label>
              <textarea
                value={bulkImportText}
                onChange={(e) => setBulkImportText(e.target.value)}
                placeholder={`[\n  {\n    "question": "Hoe maak ik een account aan?",\n    "answer": "Ga naar de registratie pagina...",\n    "category": "Account",\n    "tags": ["account", "registratie"],\n    "alternativeQuestions": ["Hoe registreer ik me?"],\n    "priority": 8\n  },\n  {\n    "question": "Hoe reset ik mijn wachtwoord?",\n    "answer": "Klik op 'Wachtwoord vergeten'...",\n    "category": "Account",\n    "tags": ["account", "wachtwoord"],\n    "priority": 7\n  }\n]`}
                rows={12}
                className="w-full px-3 py-2 border border-primary-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none resize-none font-mono text-xs"
              />
            </div>

            <div className="bg-primary-50 border border-primary-200 rounded-lg p-3">
              <p className="text-xs text-primary-900">
                <strong>Tip:</strong> Je kunt Q&As exporteren vanuit Excel/Google Sheets naar JSON,
                of handmatig deze structuur gebruiken. Elke Q&A moet minimaal{" "}
                <code className="bg-primary-100 px-1 rounded">question</code>,{" "}
                <code className="bg-primary-100 px-1 rounded">answer</code> en{" "}
                <code className="bg-primary-100 px-1 rounded">category</code> hebben.
              </p>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={handleBulkImport}
                disabled={importing}
                className="flex items-center gap-2 px-6 py-2 bg-primary-600 text-white font-medium rounded-lg hover:bg-primary-700 transition-colors disabled:opacity-50"
              >
                <Upload size={18} />
                {importing ? "Importeren..." : "Importeer Q&As"}
              </button>
              <button
                onClick={() => {
                  setBulkImportText(`[
  {
    "question": "Voorbeeld vraag 1",
    "answer": "Voorbeeld antwoord 1",
    "category": "Account",
    "tags": ["tag1", "tag2"],
    "alternativeQuestions": ["Alternatieve vraag 1"],
    "priority": 5
  },
  {
    "question": "Voorbeeld vraag 2",
    "answer": "Voorbeeld antwoord 2",
    "category": "Billing",
    "tags": ["tag3"],
    "priority": 7
  }
]`);
                }}
                className="px-4 py-2 text-primary-700 hover:bg-primary-50 rounded-lg transition-colors text-sm"
              >
                Laad voorbeeld
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="bg-white rounded-xl border border-primary-200 p-4 shadow-sm">
        <div className="flex flex-col sm:flex-row gap-4">
          {/* Search */}
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="Zoek in vragen, antwoorden of tags..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-primary-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none bg-white"
            />
          </div>

          {/* Category filter */}
          <div className="relative">
            <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="pl-10 pr-8 py-2 border border-primary-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none appearance-none bg-white"
            >
              <option value="all">Alle categorieën</option>
              {categories?.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>

          {/* Active filter */}
          <label className="flex items-center gap-2 px-4 py-2 border border-primary-200 rounded-lg cursor-pointer hover:bg-primary-50">
            <input
              type="checkbox"
              checked={showActiveOnly}
              onChange={(e) => setShowActiveOnly(e.target.checked)}
              className="w-4 h-4 text-primary-600 rounded focus:ring-primary-500"
            />
            <span className="text-sm text-primary-700">Alleen actief</span>
          </label>
        </div>
      </div>

      {/* Add/Edit Form */}
      {showForm && (
        <div className="bg-white rounded-xl border border-primary-200 p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-primary-900">
              {editingId ? "Q&A Bewerken" : "Nieuwe Q&A Toevoegen"}
            </h2>
            <button
              onClick={resetForm}
              className="p-2 text-primary-500 hover:text-primary-700 rounded-lg hover:bg-primary-50"
            >
              <X size={20} />
            </button>
          </div>

          <div className="space-y-4">
            {/* Vraag en antwoord */}
            <div className="border-b border-gray-200 pb-4">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Vraag <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.question}
                    onChange={(e) => setFormData({ ...formData, question: e.target.value })}
                    placeholder="Bijvoorbeeld: Hoe maak ik een account aan?"
                    className="w-full px-3 py-2 border border-primary-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Antwoord <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    value={formData.answer}
                    onChange={(e) => setFormData({ ...formData, answer: e.target.value })}
                    placeholder="Het antwoord op de vraag..."
                    rows={4}
                    className="w-full px-3 py-2 border border-primary-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none resize-none"
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <label className="block text-sm font-medium text-gray-700">
                      Alternatieve vragen (één per regel)
                    </label>
                    <button
                      type="button"
                      onClick={handleGenerateAlternatives}
                      disabled={generatingAlt || !formData.question.trim() || !formData.answer.trim()}
                      className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-primary-700 bg-primary-50 hover:bg-primary-100 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <Sparkles size={16} />
                      {generatingAlt ? "Bezig..." : "Genereer alternatieve vragen"}
                    </button>
                  </div>
                  <textarea
                    value={formData.alternativeQuestions}
                    onChange={(e) =>
                      setFormData({ ...formData, alternativeQuestions: e.target.value })
                    }
                    placeholder="Hoe registreer ik me?&#10;Account aanmaken&#10;Nieuwe gebruiker worden"
                    rows={3}
                    className="w-full px-3 py-2 border border-primary-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none resize-none"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Andere manieren om dezelfde vraag te stellen. Dubbele vragen worden vermeden.
                  </p>
                </div>

                <div>
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <label className="block text-sm font-medium text-gray-700">
                      Alternatieve antwoorden (één per regel)
                    </label>
                    <button
                      type="button"
                      onClick={handleGenerateAltAnswers}
                      disabled={generatingAltAnswers || !formData.question.trim() || !formData.answer.trim()}
                      className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-primary-700 bg-primary-50 hover:bg-primary-100 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <Sparkles size={16} />
                      {generatingAltAnswers ? "Bezig..." : "Genereer alternatieve antwoorden"}
                    </button>
                  </div>
                  <textarea
                    value={formData.alternativeAnswers}
                    onChange={(e) =>
                      setFormData({ ...formData, alternativeAnswers: e.target.value })
                    }
                    placeholder="Andere formuleringen van het antwoord..."
                    rows={2}
                    className="w-full px-3 py-2 border border-primary-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none resize-none"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Andere manieren om het antwoord te formuleren. De AI gebruikt deze voor meer variatie.
                  </p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Categorie <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  placeholder="Bijvoorbeeld: Account, Billing, Support"
                  list="categories"
                  className="w-full px-3 py-2 border border-primary-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none"
                />
                <datalist id="categories">
                  {categories?.map((cat) => <option key={cat} value={cat} />)}
                </datalist>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Prioriteit (1-10)
                </label>
                <input
                  type="number"
                  min="1"
                  max="10"
                  value={formData.priority}
                  onChange={(e) =>
                    setFormData({ ...formData, priority: parseInt(e.target.value) || 5 })
                  }
                  className="w-full px-3 py-2 border border-primary-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Tags (gescheiden door komma's)
              </label>
              <input
                type="text"
                value={formData.tags}
                onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
                placeholder="account, registratie, aanmaken"
                className="w-full px-3 py-2 border border-primary-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none"
              />
            </div>


            <div className="flex items-center gap-3 pt-2">
              <button
                onClick={handleSave}
                disabled={saving}
                className="flex items-center gap-2 px-6 py-2 bg-primary-600 text-white font-medium rounded-lg hover:bg-primary-700 transition-colors disabled:opacity-50"
              >
                <Save size={18} />
                {saving ? "Opslaan..." : "Opslaan"}
              </button>
              <button
                onClick={resetForm}
                className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
              >
                Annuleren
              </button>
              {saved && (
                <div className="flex items-center gap-2 text-green-600">
                  <CheckCircle size={18} />
                  <span className="text-sm">Opgeslagen!</span>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Questions List */}
      <div className="bg-white rounded-xl border border-primary-200 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-primary-200">
          <div className="flex items-center gap-2">
            <BookOpen className="text-primary-600" size={20} />
            <h2 className="text-lg font-semibold text-gray-900">
              Q&As ({filteredQuestions.length})
            </h2>
          </div>
        </div>

        {filteredQuestions.length === 0 ? (
          <div className="p-8 text-center">
            <AlertCircle className="mx-auto text-gray-400 mb-2" size={32} />
            <p className="text-primary-700">
              {searchTerm || selectedCategory !== "all" || showActiveOnly
                ? "Geen Q&As gevonden met deze filters"
                : "Nog geen Q&As toegevoegd. Klik op 'Nieuwe Q&A' om te beginnen."}
            </p>
          </div>
        ) : (
          <div className="divide-y divide-primary-200">
            {filteredQuestions.map((item) => (
              <div
                key={item._id}
                className={`p-4 hover:bg-primary-50 transition-colors ${
                  !item.isActive ? "opacity-60" : ""
                }`}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start gap-3 mb-2">
                      <div className="flex-1">
                        <h3 className="font-semibold text-primary-900 mb-1">{item.question}</h3>
                        <p className="text-sm text-primary-700 line-clamp-2">{item.answer}</p>
                      </div>
                      {!item.isActive && (
                        <span className="px-2 py-1 text-xs font-medium text-primary-600 bg-primary-100 rounded">
                          Inactief
                        </span>
                      )}
                    </div>

                    <div className="flex flex-wrap items-center gap-2 mt-3">
                      <span className="px-2 py-1 text-xs font-medium text-primary-700 bg-primary-50 rounded">
                        {item.category}
                      </span>
                      {item.tags.map((tag, idx) => (
                        <span
                          key={idx}
                          className="flex items-center gap-1 px-2 py-1 text-xs text-primary-700 bg-primary-100 rounded"
                        >
                          <Tag size={12} />
                          {tag}
                        </span>
                      ))}
                      {item.priority && item.priority > 5 && (
                        <span className="px-2 py-1 text-xs font-medium text-orange-700 bg-orange-50 rounded">
                          Prioriteit: {item.priority}
                        </span>
                      )}
                      <span className="text-xs text-primary-600">
                        Gebruikt: {item.usageCount}x
                      </span>
                    </div>

                    {(item.alternativeQuestions?.length || item.alternativeAnswers?.length) ? (
                      <div className="mt-2 text-xs text-primary-600 space-y-1">
                        {item.alternativeQuestions && item.alternativeQuestions.length > 0 && (
                          <div>
                            <span className="font-medium">Alt. vragen:</span>{" "}
                            {item.alternativeQuestions.join(", ")}
                          </div>
                        )}
                        {item.alternativeAnswers && item.alternativeAnswers.length > 0 && (
                          <div>
                            <span className="font-medium">Alt. antwoorden:</span>{" "}
                            {item.alternativeAnswers.length} varianten
                          </div>
                        )}
                      </div>
                    ) : null}
                  </div>

                  <div className="flex items-center gap-2 flex-shrink-0">
                    <button
                      onClick={() => handleEdit(item)}
                      className="p-2 text-gray-600 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
                      title="Bewerken"
                    >
                      <Edit size={18} />
                    </button>
                    <button
                      onClick={() => handleToggleActive(item._id, item.isActive)}
                      className={`px-3 py-1 text-xs font-medium rounded-lg transition-colors ${
                        item.isActive
                          ? "text-orange-700 bg-orange-50 hover:bg-orange-100"
                          : "text-green-700 bg-green-50 hover:bg-green-100"
                      }`}
                      title={item.isActive ? "Deactiveren" : "Activeren"}
                    >
                      {item.isActive ? "Deactiveren" : "Activeren"}
                    </button>
                    <button
                      onClick={() => handleDelete(item._id)}
                      className="p-2 text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors"
                      title="Verwijderen"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
