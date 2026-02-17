"use client";

import { useState, useEffect, useRef } from "react";
import { useSession } from "next-auth/react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import Link from "next/link";
import {
  PencilLine,
  Plus,
  Pencil,
  Trash2,
  Smile,
  Target,
  CheckCircle2,
  Circle,
  ChevronDown,
  ChevronRight,
  History,
  CalendarCheck,
  Mic,
  Square,
} from "lucide-react";
import { Paywall } from "@/components/Paywall";

const CHECK_IN_LABELS: Record<string, string> = {
  hoe_voel: "Hoe voel ik me vandaag?",
  wat_hielp: "Wat hielp me vandaag?",
  waar_dankbaar: "Waar ben ik dankbaar voor?",
};

const MOOD_OPTIONS = [
  { value: 1, emoji: "😔", label: "Zwaar" },
  { value: 2, emoji: "😕", label: "Moeilijk" },
  { value: 3, emoji: "😐", label: "Neutraal" },
  { value: 4, emoji: "🙂", label: "Oké" },
  { value: 5, emoji: "😊", label: "Goed" },
];

function formatDate(ts: number) {
  return new Date(ts).toLocaleDateString("nl-NL", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function todayStr() {
  return new Date().toISOString().slice(0, 10);
}

function formatDateStr(dateStr: string) {
  const [y, m, d] = dateStr.split("-").map(Number);
  const date = new Date(y, m - 1, d);
  return date.toLocaleDateString("nl-NL", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

export default function AccountReflectiesPage() {
  const { data: session } = useSession();
  const userId = session?.userId ?? "";
  const dateStr = todayStr();

  // Check feature access
  const hasAccess = useQuery(
    api.subscriptions.hasFeatureAccess,
    session?.userId
      ? {
          userId: session.userId as string,
          email: session.user?.email || undefined,
          feature: "reflections",
        }
      : "skip"
  );

  const notes = useQuery(api.reflecties.listNotes, userId ? { userId } : "skip");
  const emotion = useQuery(
    api.reflecties.getEmotionForDate,
    userId ? { userId, date: dateStr } : "skip"
  );
  const emotionHistory = useQuery(
    api.reflecties.listEmotionHistory,
    userId ? { userId, limit: 30 } : "skip"
  );
  const goals = useQuery(api.reflecties.listGoals, userId ? { userId } : "skip");
  const checkInEntries = useQuery(
    api.reflecties.listCheckInEntries,
    userId ? { userId, limit: 50 } : "skip"
  );
  const createNote = useMutation(api.reflecties.createNote);
  const updateNote = useMutation(api.reflecties.updateNote);
  const deleteNote = useMutation(api.reflecties.deleteNote);
  const setEmotion = useMutation(api.reflecties.setEmotion);
  const createGoal = useMutation(api.reflecties.createGoal);
  const toggleGoal = useMutation(api.reflecties.toggleGoal);
  const deleteGoal = useMutation(api.reflecties.deleteGoal);
  const createCheckInEntry = useMutation(api.reflecties.createCheckInEntry);
  const deleteCheckInEntry = useMutation(api.reflecties.deleteCheckInEntry);
  const [showNewNote, setShowNewNote] = useState(false);
  const [editingNoteId, setEditingNoteId] = useState<Id<"notes"> | null>(null);
  const [noteTitle, setNoteTitle] = useState("");
  const [noteContent, setNoteContent] = useState("");
  const [newGoal, setNewGoal] = useState("");
  const [checkInForm, setCheckInForm] = useState({ hoe_voel: "", wat_hielp: "", waar_dankbaar: "" });
  const [checkInSaving, setCheckInSaving] = useState(false);
  const [expandedCheckInId, setExpandedCheckInId] = useState<Id<"checkInEntries"> | null>(null);

  // Spraakherkenning
  const [speechSupported, setSpeechSupported] = useState(false);
  const [activeRecording, setActiveRecording] = useState<string | null>(null);
  const recognitionRef = useRef<any>(null);
  const activeFieldRef = useRef<string | null>(null);
  const prefixRef = useRef<string>("");
  const latestTextRef = useRef<string>("");

  useEffect(() => {
    if (typeof window === "undefined") return;
    const SpeechRecognitionAPI = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognitionAPI) {
      setSpeechSupported(true);
      const recognition = new SpeechRecognitionAPI();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = "nl-NL";
      recognition.onresult = (event: any) => {
        const parts: string[] = [];
        for (let i = 0; i < event.results.length; i++) {
          parts.push(event.results[i][0].transcript);
        }
        const transcript = parts.join(" ");
        const combined = prefixRef.current ? prefixRef.current + " " + transcript : transcript;
        latestTextRef.current = combined;
        const field = activeFieldRef.current;
        if (field === "noteContent") setNoteContent(combined);
        else if (field === "hoe_voel") setCheckInForm((f) => ({ ...f, hoe_voel: combined }));
        else if (field === "wat_hielp") setCheckInForm((f) => ({ ...f, wat_hielp: combined }));
        else if (field === "waar_dankbaar") setCheckInForm((f) => ({ ...f, waar_dankbaar: combined }));
      };
      // Only stop when user clicks the stop button – auto-restart on unexpected end
      recognition.onend = () => {
        if (activeFieldRef.current) {
          // Update prefix with everything accumulated so far before restarting
          prefixRef.current = latestTextRef.current;
          try { recognition.start(); } catch {}
        } else {
          setActiveRecording(null);
        }
      };
      recognition.onerror = (e: any) => {
        if (e.error === "aborted") return;
        setActiveRecording(null);
        activeFieldRef.current = null;
      };
      recognitionRef.current = recognition;
    }
  }, []);

  const toggleRecording = (field: string) => {
    if (!recognitionRef.current) return;
    if (activeRecording) {
      activeFieldRef.current = null;
      recognitionRef.current.stop();
      setActiveRecording(null);
      return;
    }
    // Save existing text so new speech appends to it
    let existing = "";
    if (field === "noteContent") existing = noteContent;
    else if (field === "hoe_voel") existing = checkInForm.hoe_voel;
    else if (field === "wat_hielp") existing = checkInForm.wat_hielp;
    else if (field === "waar_dankbaar") existing = checkInForm.waar_dankbaar;
    prefixRef.current = existing.trim();
    activeFieldRef.current = field;
    setActiveRecording(field);
    recognitionRef.current.start();
  };

  const handleCreateNote = async () => {
    if (!userId || !noteContent.trim()) return;
    await createNote({ userId, title: noteTitle.trim() || undefined, content: noteContent.trim() });
    setNoteTitle("");
    setNoteContent("");
    setShowNewNote(false);
  };

  const handleUpdateNote = async (noteId: Id<"notes">) => {
    if (!userId) return;
    await updateNote({ noteId, userId, title: noteTitle.trim() || undefined, content: noteContent.trim() });
    setEditingNoteId(null);
    setNoteTitle("");
    setNoteContent("");
  };

  const handleDeleteNote = async (noteId: Id<"notes">) => {
    if (!userId || !confirm("Weet je zeker dat je deze reflectie wilt verwijderen?")) return;
    await deleteNote({ noteId, userId });
  };

  const handleAddGoal = async () => {
    if (!userId || !newGoal.trim()) return;
    await createGoal({ userId, content: newGoal.trim() });
    setNewGoal("");
  };

  const handleAddCheckIn = async () => {
    const { hoe_voel, wat_hielp, waar_dankbaar } = checkInForm;
    if (!userId || (!hoe_voel.trim() && !wat_hielp.trim() && !waar_dankbaar.trim())) return;
    setCheckInSaving(true);
    try {
      await createCheckInEntry({
        userId,
        hoe_voel: hoe_voel.trim() || "-",
        wat_hielp: wat_hielp.trim() || "-",
        waar_dankbaar: waar_dankbaar.trim() || "-",
      });
      setCheckInForm({ hoe_voel: "", wat_hielp: "", waar_dankbaar: "" });
    } finally {
      setCheckInSaving(false);
    }
  };

  const handleDeleteCheckIn = async (id: Id<"checkInEntries">) => {
    if (!userId || !confirm("Check-in verwijderen?")) return;
    await deleteCheckInEntry({ id, userId });
  };

  const displayDate = new Date().toLocaleDateString("nl-NL", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });

  // Show loading state to prevent flash
  if (hasAccess === undefined) {
    return (
      <div className="flex justify-center py-12">
        <div className="animate-pulse rounded-full h-8 w-8 border-b-2 border-primary-600" />
      </div>
    );
  }

  const content = (
    <div className="space-y-6">
      {/* 1. Schrijf reflectie */}
      <div className="bg-white rounded-xl border border-primary-200 p-6">
        <h2 className="flex items-center gap-2 text-lg font-semibold text-primary-900 mb-4">
          <PencilLine size={20} className="text-primary-500" />
          Schrijf reflectie
        </h2>
        <p className="text-sm text-gray-600 mb-4">
          Vandaag is het {displayDate}, neem even de tijd om je gedachten op te schrijven of in te spreken.
        </p>

        {showNewNote && (
          <div className="mb-4 p-4 bg-primary-50/50 rounded-lg">
            <input
              type="text"
              placeholder="Titel (optioneel)"
              value={noteTitle}
              onChange={(e) => setNoteTitle(e.target.value)}
              className="w-full px-3 py-2 border border-primary-200 rounded-lg mb-3"
            />
            <div className="relative mb-3">
              <textarea
                placeholder="Schrijf je reflectie…"
                value={noteContent}
                onChange={(e) => setNoteContent(e.target.value)}
                rows={4}
                className={`w-full px-3 py-2 border rounded-lg pr-12 ${activeRecording === "noteContent" ? "border-red-400 bg-red-50/30" : "border-primary-200"}`}
              />
              {speechSupported && (
                <button
                  type="button"
                  onClick={() => toggleRecording("noteContent")}
                  className={`absolute right-2 top-2 p-1.5 rounded-lg transition-colors ${activeRecording === "noteContent" ? "bg-red-500 text-white animate-pulse" : "text-gray-400 hover:text-primary-600 hover:bg-primary-50"}`}
                  title={activeRecording === "noteContent" ? "Stop opname" : "Start spraakopname"}
                >
                  {activeRecording === "noteContent" ? <Square size={16} /> : <Mic size={16} />}
                </button>
              )}
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={handleCreateNote}
                disabled={!noteContent.trim()}
                className="px-4 py-2 bg-primary-600 text-white rounded-lg disabled:opacity-50"
              >
                Opslaan
              </button>
              <button
                type="button"
                onClick={() => { setShowNewNote(false); setNoteTitle(""); setNoteContent(""); }}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg"
              >
                Annuleren
              </button>
            </div>
          </div>
        )}

        {!showNewNote && (
          <button
            type="button"
            onClick={() => setShowNewNote(true)}
            className="flex items-center gap-2 px-4 py-3 text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
          >
            <Plus size={20} />
            Nieuwe reflectie
          </button>
        )}

        {/* 2. Emotie-tracker – direct onder schrijf reflectie */}
        <div className="mt-6 pt-6 border-t border-primary-100">
          <h3 className="flex items-center gap-2 text-base font-semibold text-primary-900 mb-3">
            <Smile size={18} className="text-primary-500" />
            Emotie-tracker
          </h3>
          <p className="text-sm text-gray-600 mb-3">
            Hoe voel je je vandaag? Kies een emotie om bij te houden hoe je stemming is.
          </p>
          <div className="grid grid-cols-5 gap-2">
            {MOOD_OPTIONS.map((m) => (
              <button
                key={m.value}
                type="button"
                onClick={() => setEmotion({ userId, date: dateStr, mood: m.value })}
                className={`flex flex-col items-center gap-1 py-3 rounded-xl border-2 transition-all ${
                  emotion?.mood === m.value
                    ? "border-primary-600 bg-primary-50"
                    : "border-gray-200 hover:border-primary-300"
                }`}
                title={m.label}
              >
                <span className="text-2xl">{m.emoji}</span>
                <span className="text-[10px] sm:text-xs text-gray-600">{m.label}</span>
              </button>
            ))}
          </div>
          {emotion && (
            <p className="mt-2 text-sm text-primary-600">
              Vandaag gekozen: {MOOD_OPTIONS.find((m) => m.value === emotion.mood)?.emoji}{" "}
              {MOOD_OPTIONS.find((m) => m.value === emotion.mood)?.label}
            </p>
          )}

        </div>

        {/* Laatste reflectie */}
        {notes && notes.length > 0 && (
          <div className="mt-6 pt-6 border-t border-primary-100">
            <h3 className="flex items-center gap-2 text-base font-semibold text-primary-900 mb-3">
              <History size={18} className="text-primary-500" />
              Laatste reflectie
            </h3>
            {(() => {
              const note = notes.filter((n) => n._id !== editingNoteId)[0];
              if (!note) return null;
              return (
                <div className="p-4 rounded-lg border border-primary-100">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      {note.title && (
                        <h3 className="font-semibold text-primary-900 truncate mb-1">{note.title}</h3>
                      )}
                      <p className="text-sm text-gray-600 whitespace-pre-wrap line-clamp-2">
                        {note.content}
                      </p>
                      <p className="text-xs text-gray-400 mt-2">
                        {formatDate(note.updatedAt)}
                      </p>
                    </div>
                    <div className="flex gap-1">
                      <button
                        type="button"
                        onClick={() => {
                          setEditingNoteId(note._id);
                          setNoteTitle(note.title ?? "");
                          setNoteContent(note.content);
                        }}
                        className="p-2 text-gray-500 hover:text-primary-600 rounded-lg"
                      >
                        <Pencil size={16} />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteNote(note._id)}
                        className="p-2 text-gray-500 hover:text-red-600 rounded-lg"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })()}
            {editingNoteId && (
              <div className="mt-3 p-4 bg-primary-50/50 rounded-lg border border-primary-200">
                <input
                  type="text"
                  placeholder="Titel (optioneel)"
                  value={noteTitle}
                  onChange={(e) => setNoteTitle(e.target.value)}
                  className="w-full px-3 py-2 border border-primary-200 rounded-lg mb-3"
                />
                <textarea
                  placeholder="Inhoud"
                  value={noteContent}
                  onChange={(e) => setNoteContent(e.target.value)}
                  rows={4}
                  className="w-full px-3 py-2 border border-primary-200 rounded-lg mb-3"
                />
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => handleUpdateNote(editingNoteId)}
                    disabled={!noteContent.trim()}
                    className="px-4 py-2 bg-primary-600 text-white rounded-lg disabled:opacity-50"
                  >
                    Opslaan
                  </button>
                  <button
                    type="button"
                    onClick={() => { setEditingNoteId(null); setNoteTitle(""); setNoteContent(""); }}
                    className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg"
                  >
                    Annuleren
                  </button>
                </div>
              </div>
            )}
            <Link
              href="/account/reflecties/eerdere-reflecties"
              className="mt-4 inline-flex items-center gap-2 px-4 py-2 text-primary-600 hover:bg-primary-50 rounded-lg text-sm font-medium transition-colors"
            >
              <History size={18} />
              Bekijk alle eerdere reflecties
            </Link>
          </div>
        )}
      </div>

      {/* 3. Persoonlijke doelen of wensen */}
      <div className="bg-white rounded-xl border border-primary-200 p-6">
        <h2 className="flex items-center gap-2 text-lg font-semibold text-primary-900 mb-4">
          <Target size={20} className="text-primary-500" />
          Persoonlijke doelen of wensen
        </h2>
        <p className="text-sm text-gray-600 mb-4">
          Schrijf kleine doelen op, bijvoorbeeld: &quot;Vandaag wil ik even buiten wandelen&quot; of &quot;Ik wil iets liefs doen voor mezelf&quot;.
        </p>
        <div className="flex flex-col sm:flex-row gap-2 mb-4">
          <input
            type="text"
            placeholder="Bijv. Vandaag wil ik even buiten wandelen"
            value={newGoal}
            onChange={(e) => setNewGoal(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleAddGoal()}
            className="flex-1 px-3 py-2 border border-primary-200 rounded-lg"
          />
          <button
            type="button"
            onClick={handleAddGoal}
            disabled={!newGoal.trim()}
            className="px-4 py-2 bg-primary-600 text-white rounded-lg disabled:opacity-50 flex-shrink-0"
          >
            Toevoegen
          </button>
        </div>
        {goals && goals.length > 0 && (
          <>
            <ul className="space-y-2">
              {goals.slice(0, 1).map((g) => (
                <li
                  key={g._id}
                  className="flex items-center gap-2 p-3 rounded-lg bg-primary-50/50"
                >
                  <button
                    type="button"
                    onClick={() => toggleGoal({ goalId: g._id, userId })}
                    className="text-primary-600"
                  >
                    {g.completed ? <CheckCircle2 size={20} /> : <Circle size={20} />}
                  </button>
                  <span className={`flex-1 ${g.completed ? "text-gray-500" : ""}`}>
                    {g.content}
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      if (confirm("Doel verwijderen?")) deleteGoal({ goalId: g._id, userId });
                    }}
                    className="text-gray-400 hover:text-red-600"
                  >
                    <Trash2 size={16} />
                  </button>
                </li>
              ))}
            </ul>
            <Link href="/account/doelen" className="mt-4 inline-flex items-center gap-2 px-4 py-2 text-primary-600 hover:bg-primary-50 rounded-lg text-sm font-medium transition-colors">
              <History size={18} />
              Bekijk alle doelen
            </Link>
          </>
        )}
        {goals?.length === 0 && (
          <p className="text-sm text-gray-500">Nog geen doelen. Voeg er een toe.</p>
        )}
      </div>

      {/* 4. Dagelijkse check-in vragen */}
      <div className="bg-white rounded-xl border border-primary-200 p-6">
        <h2 className="flex items-center gap-2 text-lg font-semibold text-primary-900 mb-4">
          <CalendarCheck size={20} className="text-primary-500" />
          Dagelijkse check-in
        </h2>
        <p className="text-sm text-gray-600 mb-4">
          Korte vragen om je gedachten te ordenen. Je kunt meerdere keren per dag inchecken.
        </p>
        <div className="space-y-4 mb-4">
          <div>
            <label className="block text-sm font-medium text-primary-800 mb-2">Hoe voel ik me vandaag?</label>
            <div className="relative">
              <textarea
                value={checkInForm.hoe_voel}
                onChange={(e) => setCheckInForm((f) => ({ ...f, hoe_voel: e.target.value }))}
                placeholder="Typ hier je antwoord…"
                rows={2}
                className={`w-full px-3 py-2 border rounded-lg text-sm pr-12 ${activeRecording === "hoe_voel" ? "border-red-400 bg-red-50/30" : "border-primary-200"}`}
              />
              {speechSupported && (
                <button
                  type="button"
                  onClick={() => toggleRecording("hoe_voel")}
                  className={`absolute right-2 top-2 p-1.5 rounded-lg transition-colors ${activeRecording === "hoe_voel" ? "bg-red-500 text-white animate-pulse" : "text-gray-400 hover:text-primary-600 hover:bg-primary-50"}`}
                  title={activeRecording === "hoe_voel" ? "Stop opname" : "Start spraakopname"}
                >
                  {activeRecording === "hoe_voel" ? <Square size={16} /> : <Mic size={16} />}
                </button>
              )}
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-primary-800 mb-2">Wat hielp me vandaag?</label>
            <div className="relative">
              <textarea
                value={checkInForm.wat_hielp}
                onChange={(e) => setCheckInForm((f) => ({ ...f, wat_hielp: e.target.value }))}
                placeholder="Typ hier je antwoord…"
                rows={2}
                className={`w-full px-3 py-2 border rounded-lg text-sm pr-12 ${activeRecording === "wat_hielp" ? "border-red-400 bg-red-50/30" : "border-primary-200"}`}
              />
              {speechSupported && (
                <button
                  type="button"
                  onClick={() => toggleRecording("wat_hielp")}
                  className={`absolute right-2 top-2 p-1.5 rounded-lg transition-colors ${activeRecording === "wat_hielp" ? "bg-red-500 text-white animate-pulse" : "text-gray-400 hover:text-primary-600 hover:bg-primary-50"}`}
                  title={activeRecording === "wat_hielp" ? "Stop opname" : "Start spraakopname"}
                >
                  {activeRecording === "wat_hielp" ? <Square size={16} /> : <Mic size={16} />}
                </button>
              )}
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-primary-800 mb-2">Waar ben ik dankbaar voor?</label>
            <div className="relative">
              <textarea
                value={checkInForm.waar_dankbaar}
                onChange={(e) => setCheckInForm((f) => ({ ...f, waar_dankbaar: e.target.value }))}
                placeholder="Typ hier je antwoord…"
                rows={2}
                className={`w-full px-3 py-2 border rounded-lg text-sm pr-12 ${activeRecording === "waar_dankbaar" ? "border-red-400 bg-red-50/30" : "border-primary-200"}`}
              />
              {speechSupported && (
                <button
                  type="button"
                  onClick={() => toggleRecording("waar_dankbaar")}
                  className={`absolute right-2 top-2 p-1.5 rounded-lg transition-colors ${activeRecording === "waar_dankbaar" ? "bg-red-500 text-white animate-pulse" : "text-gray-400 hover:text-primary-600 hover:bg-primary-50"}`}
                  title={activeRecording === "waar_dankbaar" ? "Stop opname" : "Start spraakopname"}
                >
                  {activeRecording === "waar_dankbaar" ? <Square size={16} /> : <Mic size={16} />}
                </button>
              )}
            </div>
          </div>
        </div>
        <button
          type="button"
          onClick={handleAddCheckIn}
          disabled={checkInSaving || (!checkInForm.hoe_voel.trim() && !checkInForm.wat_hielp.trim() && !checkInForm.waar_dankbaar.trim())}
          className="px-4 py-2 bg-primary-600 text-white rounded-lg text-sm font-medium hover:bg-primary-700 disabled:opacity-50"
        >
          {checkInSaving ? "Bezig…" : "Toevoegen"}
        </button>

        {/* Eerdere check-ins – max 3, rest via knop */}
        {checkInEntries && checkInEntries.length > 0 && (
          <div className="mt-6 pt-6 border-t border-primary-100">
            <h3 className="flex items-center gap-2 text-base font-semibold text-primary-900 mb-3">
              <History size={18} className="text-primary-500" />
              Eerdere check-ins
            </h3>
            <div className="space-y-2">
              {checkInEntries.slice(0, 1).map((entry) => {
                const isExpanded = expandedCheckInId === entry._id;
                return (
                  <div key={entry._id} className="rounded-lg border border-primary-200 overflow-hidden">
                    <div className="flex items-center gap-2 px-4 py-3 bg-white">
                      <button
                        type="button"
                        onClick={() => setExpandedCheckInId(isExpanded ? null : entry._id)}
                        className="flex items-center gap-2 text-left hover:bg-primary-50/50 rounded transition-colors flex-1 min-w-0"
                      >
                        {isExpanded ? <ChevronDown size={18} className="text-primary-600 flex-shrink-0" /> : <ChevronRight size={18} className="text-primary-600 flex-shrink-0" />}
                        <span className="font-medium text-primary-900 truncate">{formatDate(entry.createdAt)}</span>
                      </button>
                      <button type="button" onClick={() => handleDeleteCheckIn(entry._id)} className="p-2 text-gray-400 hover:text-red-600 rounded-lg flex-shrink-0" aria-label="Verwijderen">
                        <Trash2 size={18} />
                      </button>
                    </div>
                    {isExpanded && (
                      <div className="px-4 pb-4 pt-0 space-y-2 bg-primary-50/30">
                        {(["hoe_voel", "wat_hielp", "waar_dankbaar"] as const).map((key) =>
                          entry[key] && entry[key] !== "-" && (
                            <div key={key}>
                              <p className="text-xs font-medium text-primary-600 mb-0.5">{CHECK_IN_LABELS[key]}</p>
                              <p className="text-sm text-primary-900">{entry[key]}</p>
                            </div>
                          )
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
            <Link href="/account/reflecties/eerdere-checkins" className="mt-4 inline-flex items-center gap-2 px-4 py-2 text-primary-600 hover:bg-primary-50 rounded-lg text-sm font-medium transition-colors">
              <History size={18} />
              Bekijk alle eerdere check-ins
            </Link>
          </div>
        )}
      </div>

    </div>
  );

  // Show paywall overlay if no access
  if (hasAccess === false) {
    return (
      <Paywall
        title="Upgrade naar Benji Uitgebreid"
        message="Reflecties zijn beschikbaar vanaf Benji Uitgebreid. Schrijf notities, registreer je emoties en doe dagelijkse check-ins."
      >
        {content}
      </Paywall>
    );
  }

  return content;
}
