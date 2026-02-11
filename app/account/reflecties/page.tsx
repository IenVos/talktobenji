"use client";

import { useState } from "react";
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
} from "lucide-react";

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

  return (
    <div className="space-y-6">
      {/* 1. Schrijf reflectie */}
      <div className="bg-white rounded-xl border border-primary-200 p-6">
        <h2 className="flex items-center gap-2 text-lg font-semibold text-primary-900 mb-4">
          <PencilLine size={20} className="text-primary-500" />
          Schrijf reflectie
        </h2>
        <p className="text-sm text-gray-600 mb-4">
          {displayDate} – Neem even de tijd om je gedachten op te schrijven.
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
            <textarea
              placeholder="Schrijf je reflectie…"
              value={noteContent}
              onChange={(e) => setNoteContent(e.target.value)}
              rows={4}
              className="w-full px-3 py-2 border border-primary-200 rounded-lg mb-3"
            />
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
          <div className="flex flex-wrap gap-2">
            {MOOD_OPTIONS.map((m) => (
              <button
                key={m.value}
                type="button"
                onClick={() => setEmotion({ userId, date: dateStr, mood: m.value })}
                className={`flex flex-col items-center gap-1 px-4 py-3 rounded-xl border-2 transition-all ${
                  emotion?.mood === m.value
                    ? "border-primary-600 bg-primary-50"
                    : "border-gray-200 hover:border-primary-300"
                }`}
                title={m.label}
              >
                <span className="text-2xl">{m.emoji}</span>
                <span className="text-xs text-gray-600">{m.label}</span>
              </button>
            ))}
          </div>
          {emotion && (
            <p className="mt-2 text-sm text-primary-600">
              Vandaag gekozen: {MOOD_OPTIONS.find((m) => m.value === emotion.mood)?.emoji}{" "}
              {MOOD_OPTIONS.find((m) => m.value === emotion.mood)?.label}
            </p>
          )}

          {/* Eerdere emoties terugkijken */}
          {emotionHistory && emotionHistory.filter((e) => e.date !== dateStr).length > 0 && (
            <div className="mt-6 pt-6 border-t border-primary-100">
              <h4 className="flex items-center gap-2 text-sm font-semibold text-primary-900 mb-3">
                <History size={16} className="text-primary-500" />
                Eerdere emoties terugkijken
              </h4>
              <p className="text-xs text-gray-600 mb-3">
                Bekijk je stemming over tijd.
              </p>
              <div className="flex flex-wrap gap-2">
                {emotionHistory
                  .filter((e) => e.date !== dateStr)
                  .slice(0, 14)
                  .map((e) => {
                    const opt = MOOD_OPTIONS.find((m) => m.value === e.mood);
                    return (
                      <div
                        key={e.date}
                        className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-primary-50/50 border border-primary-100 text-sm"
                      >
                        <span className="text-lg">{opt?.emoji ?? "?"}</span>
                        <span className="text-primary-800 font-medium">
                          {formatDateStr(e.date).split(" ").slice(1).join(" ")}
                        </span>
                        <span className="text-primary-600">–</span>
                        <span className="text-primary-700">{opt?.label ?? ""}</span>
                      </div>
                    );
                  })}
              </div>
            </div>
          )}
        </div>
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
        <div className="flex gap-2 mb-4">
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
            className="px-4 py-2 bg-primary-600 text-white rounded-lg disabled:opacity-50"
          >
            Toevoegen
          </button>
        </div>
        {goals && goals.length > 0 && (
          <>
            <ul className="space-y-2">
              {goals.slice(0, 3).map((g) => (
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
                  <span className={`flex-1 ${g.completed ? "line-through text-gray-500" : ""}`}>
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
            <textarea
              value={checkInForm.hoe_voel}
              onChange={(e) => setCheckInForm((f) => ({ ...f, hoe_voel: e.target.value }))}
              placeholder="Typ hier je antwoord…"
              rows={2}
              className="w-full px-3 py-2 border border-primary-200 rounded-lg text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-primary-800 mb-2">Wat hielp me vandaag?</label>
            <textarea
              value={checkInForm.wat_hielp}
              onChange={(e) => setCheckInForm((f) => ({ ...f, wat_hielp: e.target.value }))}
              placeholder="Typ hier je antwoord…"
              rows={2}
              className="w-full px-3 py-2 border border-primary-200 rounded-lg text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-primary-800 mb-2">Waar ben ik dankbaar voor?</label>
            <textarea
              value={checkInForm.waar_dankbaar}
              onChange={(e) => setCheckInForm((f) => ({ ...f, waar_dankbaar: e.target.value }))}
              placeholder="Typ hier je antwoord…"
              rows={2}
              className="w-full px-3 py-2 border border-primary-200 rounded-lg text-sm"
            />
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
              {checkInEntries.slice(0, 3).map((entry) => {
                const isExpanded = expandedCheckInId === entry._id;
                const emotionEntry = emotionHistory?.find((e) => e.date === entry.dateStr);
                const moodOpt = emotionEntry?.mood ? MOOD_OPTIONS.find((m) => m.value === emotionEntry.mood) : null;
                return (
                  <div key={entry._id} className="rounded-lg border border-primary-200 overflow-hidden">
                    <div className="flex items-center gap-2 px-4 py-3 bg-white">
                      <button
                        type="button"
                        onClick={() => setExpandedCheckInId(isExpanded ? null : entry._id)}
                        className="flex items-center gap-2 text-left hover:bg-primary-50/50 rounded transition-colors flex-1 min-w-0"
                      >
                        {isExpanded ? <ChevronDown size={18} className="text-primary-600 flex-shrink-0" /> : <ChevronRight size={18} className="text-primary-600 flex-shrink-0" />}
                        {moodOpt && <span className="text-xl flex-shrink-0" title={moodOpt.label}>{moodOpt.emoji}</span>}
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

      {/* 5. Eerdere reflecties – max 3, rest via knop */}
      <div className="bg-white rounded-xl border border-primary-200 p-6">
        <h2 className="flex items-center gap-2 text-lg font-semibold text-primary-900 mb-4">
          <PencilLine size={20} className="text-primary-500" />
          Eerdere reflecties
        </h2>
        {notes === undefined ? (
          <div className="flex justify-center py-8">
            <div className="animate-pulse rounded-full h-8 w-8 border-b-2 border-primary-600" />
          </div>
        ) : notes.length === 0 ? (
          <p className="text-gray-500 text-sm">Nog geen reflecties geschreven.</p>
        ) : (
          <div className="space-y-3">
            {notes
              ?.filter((n) => n._id !== editingNoteId)
              .slice(0, 3)
              .map((note) => {
                const noteDate = new Date(note.updatedAt).toISOString().slice(0, 10);
                const emotionEntry = emotionHistory?.find((e) => e.date === noteDate);
                const moodOpt = emotionEntry?.mood ? MOOD_OPTIONS.find((m) => m.value === emotionEntry.mood) : null;
                return (
                <div
                  key={note._id}
                  className="p-4 rounded-lg border border-primary-100"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      {(moodOpt || note.title) && (
                        <div className="flex items-center gap-2 mb-1">
                          {moodOpt && (
                            <span className="text-xl flex-shrink-0" title={moodOpt.label}>{moodOpt.emoji}</span>
                          )}
                          {note.title && (
                            <h3 className="font-semibold text-primary-900 truncate">{note.title}</h3>
                          )}
                        </div>
                      )}
                      <p className="text-sm text-gray-600 mt-1 whitespace-pre-wrap line-clamp-2">
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
              );})}

            <Link
              href="/account/reflecties/eerdere-reflecties"
              className="mt-4 inline-flex items-center gap-2 px-4 py-2 text-primary-600 hover:bg-primary-50 rounded-lg text-sm font-medium transition-colors"
            >
              <History size={18} />
              Bekijk alle eerdere reflecties
            </Link>

            {editingNoteId && (
              <div className="p-4 bg-primary-50/50 rounded-lg border border-primary-200">
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
          </div>
        )}
      </div>
    </div>
  );
}
