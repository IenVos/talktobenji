"use client";

import { useState, useEffect, useRef } from "react";
import { useSession } from "next-auth/react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { Gem, Plus, Trash2, Mic, Square, ImagePlus, X, Sparkles } from "lucide-react";

const EMOTIONS = [
  { value: "dankbaar", emoji: "🙏", label: "Dankbaar" },
  { value: "warm", emoji: "🤗", label: "Warm" },
  { value: "gelukkig", emoji: "😊", label: "Gelukkig" },
  { value: "trots", emoji: "💪", label: "Trots" },
  { value: "verbonden", emoji: "💞", label: "Verbonden" },
  { value: "geliefd", emoji: "💛", label: "Geliefd" },
];

function formatDate(ts: number) {
  return new Date(ts).toLocaleDateString("nl-NL", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

export default function HerinneringenPage() {
  const { data: session } = useSession();
  const memories = useQuery(
    api.memories.getMemories,
    session?.userId ? { userId: session.userId as string } : "skip"
  );
  const addMemory = useMutation(api.memories.addMemory);
  const deleteMemory = useMutation(api.memories.deleteMemory);
  const generateUploadUrl = useMutation(api.preferences.generateUploadUrl);

  // Formulier state
  const [showForm, setShowForm] = useState(false);
  const [text, setText] = useState("");
  const [emotion, setEmotion] = useState<string | null>(null);
  const [memoryDate, setMemoryDate] = useState("");
  const [image, setImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageError, setImageError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

  // Spraakherkenning
  const [speechSupported, setSpeechSupported] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const SpeechRecognitionAPI = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognitionAPI) {
      setSpeechSupported(true);
      const recognition = new SpeechRecognitionAPI();
      recognition.continuous = false;
      recognition.interimResults = true;
      recognition.lang = "nl-NL";
      recognition.onresult = (event: any) => {
        const transcript = Array.from(event.results).map((r: any) => r[0].transcript).join("");
        setText(transcript);
      };
      recognition.onend = () => setIsRecording(false);
      recognition.onerror = () => setIsRecording(false);
      recognitionRef.current = recognition;
    }
  }, []);

  const toggleRecording = () => {
    if (!recognitionRef.current) return;
    if (isRecording) {
      recognitionRef.current.stop();
      setIsRecording(false);
    } else {
      recognitionRef.current.start();
      setIsRecording(true);
    }
  };

  const MAX_IMAGE_SIZE = 5 * 1024 * 1024;

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImageError(null);
    if (file.size > MAX_IMAGE_SIZE) {
      setImageError(`Dit bestand is te groot (${(file.size / 1024 / 1024).toFixed(1)} MB). Maximaal 5 MB.`);
      e.target.value = "";
      return;
    }
    setImage(file);
    const reader = new FileReader();
    reader.onload = (ev) => setImagePreview(ev.target?.result as string);
    reader.readAsDataURL(file);
  };

  const resetForm = () => {
    setText("");
    setEmotion(null);
    setMemoryDate("");
    setImage(null);
    setImagePreview(null);
    setImageError(null);
    setShowForm(false);
  };

  const handleSubmit = async () => {
    if (!text.trim() || !session?.userId) return;
    setSaving(true);
    try {
      let imageStorageId: Id<"_storage"> | undefined;
      if (image) {
        const uploadUrl = await generateUploadUrl();
        const res = await fetch(uploadUrl, { method: "POST", headers: { "Content-Type": image.type }, body: image });
        if (res.ok) {
          const { storageId } = await res.json();
          imageStorageId = storageId;
        }
      }
      await addMemory({
        userId: session.userId as string,
        text: text.trim(),
        imageStorageId,
        emotion: emotion || undefined,
        memoryDate: memoryDate || undefined,
        source: "manual",
      });
      resetForm();
    } catch {
      // stil falen
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (memoryId: Id<"memories">) => {
    await deleteMemory({ memoryId });
    setConfirmDelete(null);
  };

  const emotionForValue = (val: string) => EMOTIONS.find((e) => e.value === val);

  return (
    <div className="space-y-6">
      {/* Toevoegen-knop */}
      {!showForm && (
        <div className="flex justify-end">
          <button
            type="button"
            onClick={() => setShowForm(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-white transition-colors shadow-sm"
            style={{ backgroundColor: "var(--account-accent)" }}
          >
            <Plus size={16} />
            <span className="hidden sm:inline">Herinnering toevoegen</span>
            <span className="sm:hidden">Toevoegen</span>
          </button>
        </div>
      )}

      {/* Formulier */}
      {showForm && (
        <div className="bg-white rounded-xl border border-gray-200 p-4 sm:p-6 space-y-4">
          <h3 className="font-semibold text-primary-900">Nieuwe herinnering</h3>

          {/* Tekst + mic */}
          <div className="relative">
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Beschrijf je mooie herinnering..."
              rows={3}
              className={`w-full px-3 py-2 pr-12 border rounded-lg text-sm resize-none focus:ring-2 focus:outline-none transition-colors ${
                isRecording ? "border-red-400 ring-2 ring-red-200" : "border-gray-200 focus:ring-primary-200"
              }`}
            />
            {speechSupported && (
              <button
                type="button"
                onClick={toggleRecording}
                className={`absolute right-2 top-2 p-2 rounded-full transition-colors ${
                  isRecording
                    ? "bg-red-100 text-red-600 animate-pulse"
                    : "bg-gray-100 text-gray-500 hover:bg-gray-200"
                }`}
                title={isRecording ? "Stop opname" : "Inspreken"}
              >
                {isRecording ? <Square size={16} /> : <Mic size={16} />}
              </button>
            )}
          </div>

          {/* Emotie */}
          <div>
            <p className="text-sm font-medium text-gray-700 mb-2">Welk gevoel past hierbij?</p>
            <div className="flex flex-wrap gap-2">
              {EMOTIONS.map((em) => (
                <button
                  key={em.value}
                  type="button"
                  onClick={() => setEmotion(emotion === em.value ? null : em.value)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm border transition-colors ${
                    emotion === em.value
                      ? "border-amber-300 bg-amber-50 text-amber-800"
                      : "border-gray-200 text-gray-600 hover:border-gray-300"
                  }`}
                >
                  <span>{em.emoji}</span>
                  <span>{em.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Datum */}
          <div>
            <label htmlFor="memoryDate" className="text-sm font-medium text-gray-700 block mb-1">
              Wanneer was dit? <span className="text-gray-400 font-normal">(optioneel)</span>
            </label>
            <input
              type="date"
              id="memoryDate"
              value={memoryDate}
              onChange={(e) => setMemoryDate(e.target.value)}
              className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-primary-200 focus:outline-none"
            />
          </div>

          {/* Afbeelding */}
          <div>
            {imagePreview ? (
              <div className="relative inline-block">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={imagePreview} alt="Preview" className="max-w-xs h-auto rounded-lg border border-gray-200" />
                <button
                  type="button"
                  onClick={() => { setImage(null); setImagePreview(null); }}
                  className="absolute -top-2 -right-2 bg-white border border-gray-200 rounded-full p-1 shadow-sm hover:bg-gray-50"
                >
                  <X size={14} className="text-gray-500" />
                </button>
              </div>
            ) : (
              <label className="flex items-center gap-2 px-3 py-2 border border-dashed border-gray-300 rounded-lg text-sm text-gray-500 hover:border-gray-400 hover:text-gray-600 transition-colors cursor-pointer w-fit">
                <ImagePlus size={16} />
                Foto toevoegen
                <input type="file" accept="image/*" className="hidden" onChange={handleImageSelect} />
              </label>
            )}
            {imageError && <p className="text-red-500 text-xs mt-1">{imageError}</p>}
          </div>

          {/* Knoppen */}
          <div className="flex items-center gap-3 pt-2">
            <button
              type="button"
              onClick={handleSubmit}
              disabled={!text.trim() || saving}
              className="px-5 py-2 rounded-lg text-sm font-medium text-white transition-colors disabled:opacity-50 shadow-sm"
              style={{ backgroundColor: "var(--account-accent)" }}
            >
              {saving ? "Opslaan..." : "Bewaren in schatkist"}
            </button>
            <button
              type="button"
              onClick={resetForm}
              className="px-4 py-2 rounded-lg text-sm text-gray-500 hover:bg-gray-100 transition-colors"
            >
              Annuleren
            </button>
          </div>
        </div>
      )}

      {/* Herinneringen lijst */}
      {memories === undefined ? (
        <div className="flex justify-center py-12">
          <div className="animate-pulse rounded-full h-8 w-8 border-b-2 border-primary-600" />
        </div>
      ) : memories.length === 0 && !showForm ? (
        <div className="bg-white rounded-xl border border-gray-200 p-8 text-center">
          <Gem size={40} className="mx-auto text-amber-300 mb-3" />
          <h3 className="font-semibold text-primary-900 mb-1">Je schatkist is nog leeg</h3>
          <p className="text-sm text-gray-500 mb-4">
            Bewaar hier je mooiste herinneringen. Een moment, een gevoel, iets moois om naar terug te kijken.
          </p>
          <button
            type="button"
            onClick={() => setShowForm(true)}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-white transition-colors"
            style={{ backgroundColor: "var(--account-accent)" }}
          >
            <Plus size={16} />
            Eerste herinnering toevoegen
          </button>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {memories.map((memory) => {
            const em = memory.emotion ? emotionForValue(memory.emotion) : null;
            return (
              <div
                key={memory._id}
                className="bg-white rounded-xl border border-gray-200 p-4 transition-shadow hover:shadow-md relative group"
              >
                {/* Verwijder-knop */}
                {confirmDelete === memory._id ? (
                  <div className="absolute top-3 right-3 flex items-center gap-1 bg-red-50 border border-red-200 rounded-lg px-2 py-1 z-10">
                    <span className="text-xs text-red-700 mr-1">Verwijderen?</span>
                    <button
                      type="button"
                      onClick={() => handleDelete(memory._id)}
                      className="p-1 text-red-600 hover:bg-red-100 rounded transition-colors text-xs font-medium"
                    >
                      Ja
                    </button>
                    <button
                      type="button"
                      onClick={() => setConfirmDelete(null)}
                      className="p-1 text-gray-500 hover:bg-gray-100 rounded transition-colors text-xs"
                    >
                      Nee
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => setConfirmDelete(memory._id)}
                    className="absolute top-3 right-3 p-1.5 rounded-lg transition-all opacity-0 group-hover:opacity-100"
                    style={{ color: "var(--account-accent)" }}
                    title="Verwijder herinnering"
                  >
                    <Trash2 size={16} />
                  </button>
                )}

                {/* Afbeelding */}
                {memory.imageUrl && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={memory.imageUrl}
                    alt=""
                    className="w-full h-40 object-cover rounded-lg mb-3"
                  />
                )}

                {/* Tekst */}
                <p className="text-sm text-gray-900 whitespace-pre-wrap pr-8">{memory.text}</p>

                {/* Meta */}
                <div className="flex flex-wrap items-center gap-2 mt-3 text-xs text-gray-500">
                  {em && (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200">
                      {em.emoji} {em.label}
                    </span>
                  )}
                  {memory.memoryDate && (
                    <span>{new Date(memory.memoryDate + "T00:00:00").toLocaleDateString("nl-NL", { day: "numeric", month: "long", year: "numeric" })}</span>
                  )}
                  {memory.source === "chat" && (
                    <span className="inline-flex items-center gap-1 text-primary-600">
                      <Sparkles size={12} />
                      Via Benji
                    </span>
                  )}
                  <span className="ml-auto">{formatDate(memory.createdAt)}</span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
