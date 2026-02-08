"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { PencilLine, Pencil, Trash2 } from "lucide-react";

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

export default function EerdereReflectiesPage() {
  const { data: session } = useSession();
  const userId = session?.userId ?? "";

  const notes = useQuery(api.reflecties.listNotes, userId ? { userId } : "skip");
  const emotionHistory = useQuery(
    api.reflecties.listEmotionHistory,
    userId ? { userId, limit: 365 } : "skip"
  );
  const updateNote = useMutation(api.reflecties.updateNote);
  const deleteNote = useMutation(api.reflecties.deleteNote);

  const [editingNoteId, setEditingNoteId] = useState<Id<"notes"> | null>(null);
  const [noteTitle, setNoteTitle] = useState("");
  const [noteContent, setNoteContent] = useState("");

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

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl border border-primary-200 p-6">
        <h2 className="flex items-center gap-2 text-lg font-semibold text-primary-900 mb-4">
          <PencilLine size={20} className="text-primary-500" />
          Eerdere reflecties
        </h2>
        <p className="text-sm text-gray-600 mb-6">
          Alle reflecties die je hebt geschreven. Bekijk, bewerk of verwijder ze.
        </p>

        {notes === undefined ? (
          <div className="flex justify-center py-12">
            <div className="animate-pulse rounded-full h-8 w-8 border-b-2 border-primary-600" />
          </div>
        ) : notes.length === 0 ? (
          <p className="text-gray-500 text-sm py-8">Nog geen reflecties geschreven.</p>
        ) : (
          <div className="space-y-3">
            {notes
              .filter((n) => n._id !== editingNoteId)
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
                        <p className="text-sm text-gray-700 whitespace-pre-wrap">
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
              })}

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
