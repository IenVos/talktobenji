"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import Image from "next/image";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { FileText, Plus, Pencil, Trash2 } from "lucide-react";

function formatDate(ts: number) {
  return new Date(ts).toLocaleDateString("nl-NL", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function AccountNotitiesPage() {
  const { data: session } = useSession();
  const userId = session?.userId;
  const notes = useQuery(
    api.notes.listNotes,
    userId ? { userId } : "skip"
  );
  const createNote = useMutation(api.notes.createNote);
  const updateNote = useMutation(api.notes.updateNote);
  const deleteNote = useMutation(api.notes.deleteNote);

  const [showNew, setShowNew] = useState(false);
  const [editingId, setEditingId] = useState<Id<"notes"> | null>(null);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");

  const handleCreate = async () => {
    if (!userId || !content.trim()) return;
    await createNote({ userId, title: title.trim() || undefined, content: content.trim() });
    setTitle("");
    setContent("");
    setShowNew(false);
  };

  const handleUpdate = async (noteId: Id<"notes">) => {
    if (!userId) return;
    await updateNote({ noteId, userId, title: title.trim() || undefined, content: content.trim() });
    setEditingId(null);
    setTitle("");
    setContent("");
  };

  const handleDelete = async (noteId: Id<"notes">) => {
    if (!userId || !confirm("Weet je zeker dat je deze notitie wilt verwijderen?")) return;
    await deleteNote({ noteId, userId });
  };

  const startEdit = (note: { _id: Id<"notes">; title?: string; content: string }) => {
    setEditingId(note._id);
    setTitle(note.title ?? "");
    setContent(note.content);
  };

  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <Image
          src="/images/benji-logo-2.png"
          alt="Benji"
          width={40}
          height={40}
          className="object-contain"
        />
        <div>
          <h1 className="text-xl font-bold text-primary-900">Notities</h1>
          <p className="text-sm text-gray-600">Aantekeningen en dagboek</p>
        </div>
      </div>

      <div className="space-y-4">
        <button
          type="button"
          onClick={() => setShowNew(true)}
          className="flex items-center gap-2 px-4 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
        >
          <Plus size={20} />
          Nieuwe notitie
        </button>

        {showNew && (
          <div className="bg-white rounded-xl border border-primary-200 p-6">
            <h3 className="font-semibold text-primary-900 mb-3">Nieuwe notitie</h3>
            <input
              type="text"
              placeholder="Titel (optioneel)"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3 py-2 border border-primary-200 rounded-lg mb-3"
            />
            <textarea
              placeholder="Schrijf je notitie…"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              rows={5}
              className="w-full px-3 py-2 border border-primary-200 rounded-lg mb-3"
            />
            <div className="flex gap-2">
              <button
                type="button"
                onClick={handleCreate}
                disabled={!content.trim()}
                className="px-4 py-2 bg-primary-600 text-white rounded-lg disabled:opacity-50"
              >
                Opslaan
              </button>
              <button
                type="button"
                onClick={() => { setShowNew(false); setTitle(""); setContent(""); }}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg"
              >
                Annuleren
              </button>
            </div>
          </div>
        )}

        {notes === undefined ? (
          <div className="flex justify-center py-12">
            <div className="animate-pulse rounded-full h-8 w-8 border-b-2 border-primary-600" />
          </div>
        ) : notes.length === 0 && !showNew ? (
          <div className="bg-white rounded-xl border border-primary-200 p-8 text-center">
            <FileText size={48} className="mx-auto text-primary-300 mb-4" />
            <p className="text-gray-600">Nog geen notities.</p>
            <button
              type="button"
              onClick={() => setShowNew(true)}
              className="mt-4 text-primary-600 hover:underline font-medium"
            >
              Maak je eerste notitie
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {notes
              ?.filter((n) => n._id !== editingId)
              .map((note) => (
                <div
                  key={note._id}
                  className="bg-white rounded-xl border border-primary-200 p-4"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      {note.title && (
                        <h3 className="font-semibold text-primary-900 truncate">
                          {note.title}
                        </h3>
                      )}
                      <p className="text-gray-600 text-sm mt-1 whitespace-pre-wrap line-clamp-2">
                        {note.content}
                      </p>
                      <p className="text-xs text-gray-400 mt-2">
                        {formatDate(note.updatedAt)}
                      </p>
                    </div>
                    <div className="flex gap-1 flex-shrink-0">
                      <button
                        type="button"
                        onClick={() => startEdit(note)}
                        className="p-2 text-gray-500 hover:text-primary-600 rounded-lg"
                        aria-label="Bewerken"
                      >
                        <Pencil size={18} />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(note._id)}
                        className="p-2 text-gray-500 hover:text-red-600 rounded-lg"
                        aria-label="Verwijderen"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </div>
                </div>
              ))}

            {editingId && (
              <div className="bg-white rounded-xl border border-primary-200 p-6">
                <h3 className="font-semibold text-primary-900 mb-3">Notitie bewerken</h3>
                <input
                  type="text"
                  placeholder="Titel (optioneel)"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-3 py-2 border border-primary-200 rounded-lg mb-3"
                />
                <textarea
                  placeholder="Inhoud"
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  rows={5}
                  className="w-full px-3 py-2 border border-primary-200 rounded-lg mb-3"
                />
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => handleUpdate(editingId)}
                    disabled={!content.trim()}
                    className="px-4 py-2 bg-primary-600 text-white rounded-lg disabled:opacity-50"
                  >
                    Opslaan
                  </button>
                  <button
                    type="button"
                    onClick={() => { setEditingId(null); setTitle(""); setContent(""); }}
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
