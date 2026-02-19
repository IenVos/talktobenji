"use client";

import { useState, useEffect, useRef } from "react";
import { useSession } from "next-auth/react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { Gem, Plus, Trash2, Mic, Square, ImagePlus, X, Sparkles, Pencil, Eye, ImageOff } from "lucide-react";
import { Paywall } from "@/components/Paywall";

const EMOTIONS = [
  { value: "dankbaar", emoji: "\u{1F64F}", label: "Dankbaar" },
  { value: "warm", emoji: "\u{1F917}", label: "Warm" },
  { value: "gelukkig", emoji: "\u{1F60A}", label: "Gelukkig" },
  { value: "trots", emoji: "\u{1F4AA}", label: "Trots" },
  { value: "verbonden", emoji: "\u{1F49E}", label: "Verbonden" },
  { value: "geliefd", emoji: "\u{1F49B}", label: "Geliefd" },
];

function formatDate(ts: number) {
  return new Date(ts).toLocaleDateString("nl-NL", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

type Memory = {
  _id: Id<"memories">;
  userId: string;
  text: string;
  imageStorageId?: Id<"_storage">;
  imageUrl?: string;
  emotion?: string;
  memoryDate?: string;
  source: "manual" | "chat";
  createdAt: number;
};

export default function HerinneringenPage() {
  const { data: session } = useSession();

  // Check feature access
  const hasAccess = useQuery(
    api.subscriptions.hasFeatureAccess,
    session?.userId
      ? {
          userId: session.userId as string,
          email: session.user?.email || undefined,
          feature: "memories",
        }
      : "skip"
  );

  const memories = useQuery(
    api.memories.getMemories,
    session?.userId ? { userId: session.userId as string } : "skip"
  );
  const addMemory = useMutation(api.memories.addMemory);
  const updateMemory = useMutation(api.memories.updateMemory);
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
  const [saveError, setSaveError] = useState<string | null>(null);

  // Detail modal state
  const [selectedMemory, setSelectedMemory] = useState<Memory | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editText, setEditText] = useState("");
  const [editEmotion, setEditEmotion] = useState<string | null>(null);
  const [editDate, setEditDate] = useState("");
  const [editSaving, setEditSaving] = useState(false);
  const [editRemoveImage, setEditRemoveImage] = useState(false);
  const [editNewImage, setEditNewImage] = useState<File | null>(null);
  const [editNewImagePreview, setEditNewImagePreview] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);

  // Fullscreen afbeelding
  const [fullscreenImage, setFullscreenImage] = useState<string | null>(null);

  // Spraakherkenning
  const [speechSupported, setSpeechSupported] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const recognitionRef = useRef<any>(null);
  const textBeforeRecordingRef = useRef("");

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
        const prefix = textBeforeRecordingRef.current;
        setText(prefix + (prefix && !prefix.endsWith(" ") ? " " : "") + transcript);
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
      textBeforeRecordingRef.current = text;
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

  const handleEditImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > MAX_IMAGE_SIZE) return;
    setEditNewImage(file);
    setEditRemoveImage(false);
    const reader = new FileReader();
    reader.onload = (ev) => setEditNewImagePreview(ev.target?.result as string);
    reader.readAsDataURL(file);
  };

  const resetForm = () => {
    setText("");
    setEmotion(null);
    setMemoryDate("");
    setImage(null);
    setImagePreview(null);
    setImageError(null);
    setSaveError(null);
    setShowForm(false);
  };

  const handleSubmit = async () => {
    if (!text.trim() || !session?.userId) return;
    setSaving(true);
    setSaveError(null);
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
    } catch (err: any) {
      setSaveError(err?.message || "Opslaan mislukt. Probeer het opnieuw.");
    } finally {
      setSaving(false);
    }
  };

  // Detail modal openen
  const openDetail = (memory: Memory) => {
    setSelectedMemory(memory);
    setIsEditing(false);
    setConfirmDelete(false);
  };

  const closeDetail = () => {
    setSelectedMemory(null);
    setIsEditing(false);
    setConfirmDelete(false);
    setEditRemoveImage(false);
    setEditNewImage(null);
    setEditNewImagePreview(null);
  };

  // Start bewerken
  const startEdit = (memory: Memory) => {
    setEditText(memory.text);
    setEditEmotion(memory.emotion || null);
    setEditDate(memory.memoryDate || "");
    setEditRemoveImage(false);
    setEditNewImage(null);
    setEditNewImagePreview(null);
    setIsEditing(true);
    setConfirmDelete(false);
  };

  // Opslaan bewerking
  const handleSaveEdit = async () => {
    if (!selectedMemory || !editText.trim()) return;
    setEditSaving(true);
    try {
      let newImageStorageId: Id<"_storage"> | undefined;
      if (editNewImage) {
        const uploadUrl = await generateUploadUrl();
        const res = await fetch(uploadUrl, { method: "POST", headers: { "Content-Type": editNewImage.type }, body: editNewImage });
        if (res.ok) {
          const { storageId } = await res.json();
          newImageStorageId = storageId;
        }
      }
      await updateMemory({
        memoryId: selectedMemory._id,
        userId: session!.userId as string,
        text: editText.trim(),
        emotion: editEmotion || undefined,
        memoryDate: editDate || undefined,
        ...(newImageStorageId ? { imageStorageId: newImageStorageId } : {}),
        ...(editRemoveImage ? { removeImage: true } : {}),
      });
      setIsEditing(false);
      setEditRemoveImage(false);
      setEditNewImage(null);
      setEditNewImagePreview(null);
    } catch {
      // stil falen
    } finally {
      setEditSaving(false);
    }
  };

  // Verwijderen
  const handleDelete = async () => {
    if (!selectedMemory) return;
    await deleteMemory({ memoryId: selectedMemory._id, userId: session!.userId as string });
    closeDetail();
  };

  const emotionForValue = (val: string) => EMOTIONS.find((e) => e.value === val);

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
      {/* Intro + toevoegen — alleen zichtbaar als er al memories zijn */}
      {memories && memories.length > 0 && !showForm && (
        <div className="bg-white rounded-xl border border-primary-200 p-6">
          <p className="text-sm text-gray-600 mb-4">
            Bewaar hier je mooiste herinneringen. Een moment, een gevoel, iets moois om naar terug te kijken.
          </p>
          <button
            type="button"
            onClick={() => setShowForm(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-white transition-colors shadow-sm"
            style={{ backgroundColor: "var(--account-accent)" }}
          >
            <Plus size={16} />
            Herinnering toevoegen
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
              {saving ? "Opslaan..." : "Bewaren in Memories"}
            </button>
            <button
              type="button"
              onClick={resetForm}
              className="px-4 py-2 rounded-lg text-sm text-gray-500 hover:bg-gray-100 transition-colors"
            >
              Annuleren
            </button>
          </div>
          {saveError && (
            <p className="text-sm text-red-500 mt-1">{saveError}</p>
          )}
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
          <h3 className="font-semibold text-primary-900 mb-1">Je Memories is nog leeg</h3>
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
        <div className="columns-1 sm:columns-2 gap-4" style={{ columnFill: "balance" }}>
          {memories.map((memory) => {
            const em = memory.emotion ? emotionForValue(memory.emotion) : null;
            return (
              <button
                key={memory._id}
                type="button"
                onClick={() => openDetail(memory as Memory)}
                className="bg-white rounded-xl border border-gray-200 overflow-hidden transition-shadow hover:shadow-md relative group text-left w-full break-inside-avoid mb-4 block"
              >
                {/* Oog-icoon */}
                <div
                  className="absolute top-3 right-3 z-10 p-1.5 rounded-lg bg-white/80 backdrop-blur-sm border border-gray-200/60 shadow-sm"
                  style={{ color: "var(--account-accent)" }}
                >
                  <Eye size={14} />
                </div>

                {/* Afbeelding – volledig zichtbaar */}
                {memory.imageUrl && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={memory.imageUrl}
                    alt=""
                    className="w-full h-auto max-h-64 object-contain bg-gray-50"
                  />
                )}

                {/* Content */}
                <div className="p-4">
                  <p className="text-sm text-gray-900 whitespace-pre-wrap line-clamp-3">{memory.text}</p>

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
              </button>
            );
          })}
        </div>
      )}

      {/* Detail modal */}
      {selectedMemory && !fullscreenImage && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40" onClick={closeDetail} />

          <div className="relative bg-white rounded-2xl shadow-xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
            <button
              type="button"
              onClick={closeDetail}
              className="absolute top-3 right-3 z-10 p-1.5 rounded-full bg-white/80 backdrop-blur-sm border border-gray-200/60 shadow-sm hover:bg-gray-100 transition-colors"
            >
              <X size={18} className="text-gray-600" />
            </button>

            {/* Afbeelding – klikbaar om te vergroten */}
            {selectedMemory.imageUrl && !isEditing && (
              <button
                type="button"
                onClick={() => setFullscreenImage(selectedMemory.imageUrl!)}
                className="w-full cursor-zoom-in group/img"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={selectedMemory.imageUrl}
                  alt=""
                  className="w-full h-auto max-h-80 object-contain bg-gray-50 rounded-t-2xl"
                />
              </button>
            )}

            <div className="p-5 sm:p-6 space-y-4">
              {isEditing ? (
                <>
                  {/* Foto bewerken */}
                  <div>
                    {editNewImagePreview ? (
                      <div className="relative inline-block mb-2">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={editNewImagePreview} alt="Nieuwe foto" className="w-full h-auto max-h-48 object-contain rounded-lg border border-gray-200 bg-gray-50" />
                        <button
                          type="button"
                          onClick={() => { setEditNewImage(null); setEditNewImagePreview(null); }}
                          className="absolute -top-2 -right-2 bg-white border border-gray-200 rounded-full p-1 shadow-sm hover:bg-gray-50"
                        >
                          <X size={14} className="text-gray-500" />
                        </button>
                      </div>
                    ) : selectedMemory.imageUrl && !editRemoveImage ? (
                      <div className="relative inline-block mb-2">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={selectedMemory.imageUrl} alt="" className="w-full h-auto max-h-48 object-contain rounded-lg border border-gray-200 bg-gray-50" />
                        <button
                          type="button"
                          onClick={() => setEditRemoveImage(true)}
                          className="absolute -top-2 -right-2 bg-white border border-gray-200 rounded-full p-1 shadow-sm hover:bg-gray-50"
                          title="Foto verwijderen"
                        >
                          <X size={14} className="text-gray-500" />
                        </button>
                      </div>
                    ) : editRemoveImage ? (
                      <div className="flex items-center gap-3 mb-2 px-3 py-2 bg-gray-50 rounded-lg border border-gray-200 text-sm text-gray-500">
                        <ImageOff size={16} />
                        <span>Foto wordt verwijderd</span>
                        <button
                          type="button"
                          onClick={() => setEditRemoveImage(false)}
                          className="ml-auto text-xs hover:text-gray-700 underline"
                        >
                          Ongedaan maken
                        </button>
                      </div>
                    ) : null}

                    {/* Nieuwe foto kiezen */}
                    {!editNewImagePreview && (
                      <label className="flex items-center gap-2 px-3 py-2 border border-dashed border-gray-300 rounded-lg text-sm text-gray-500 hover:border-gray-400 hover:text-gray-600 transition-colors cursor-pointer w-fit">
                        <ImagePlus size={16} />
                        {selectedMemory.imageUrl && !editRemoveImage ? "Andere foto" : "Foto toevoegen"}
                        <input type="file" accept="image/*" className="hidden" onChange={handleEditImageSelect} />
                      </label>
                    )}
                  </div>

                  {/* Tekst */}
                  <textarea
                    value={editText}
                    onChange={(e) => setEditText(e.target.value)}
                    rows={4}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm resize-none focus:ring-2 focus:ring-primary-200 focus:outline-none"
                  />

                  {/* Emotie */}
                  <div className="flex flex-wrap gap-2">
                    {EMOTIONS.map((em) => (
                      <button
                        key={em.value}
                        type="button"
                        onClick={() => setEditEmotion(editEmotion === em.value ? null : em.value)}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm border transition-colors ${
                          editEmotion === em.value
                            ? "border-amber-300 bg-amber-50 text-amber-800"
                            : "border-gray-200 text-gray-600 hover:border-gray-300"
                        }`}
                      >
                        <span>{em.emoji}</span>
                        <span>{em.label}</span>
                      </button>
                    ))}
                  </div>

                  {/* Datum */}
                  <input
                    type="date"
                    value={editDate}
                    onChange={(e) => setEditDate(e.target.value)}
                    className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-primary-200 focus:outline-none"
                  />

                  {/* Opslaan / Annuleren */}
                  <div className="flex items-center gap-3 pt-1">
                    <button
                      type="button"
                      onClick={handleSaveEdit}
                      disabled={!editText.trim() || editSaving}
                      className="px-4 py-2 rounded-lg text-sm font-medium text-white transition-colors disabled:opacity-50"
                      style={{ backgroundColor: "var(--account-accent)" }}
                    >
                      {editSaving ? "Opslaan..." : "Opslaan"}
                    </button>
                    <button
                      type="button"
                      onClick={() => { setIsEditing(false); setEditRemoveImage(false); setEditNewImage(null); setEditNewImagePreview(null); }}
                      className="px-4 py-2 rounded-lg text-sm text-gray-500 hover:bg-gray-100 transition-colors"
                    >
                      Annuleren
                    </button>
                  </div>
                </>
              ) : (
                <>
                  <p className="text-sm sm:text-base text-gray-900 whitespace-pre-wrap leading-relaxed">{selectedMemory.text}</p>

                  <div className="flex flex-wrap items-center gap-2 text-xs text-gray-500">
                    {(() => {
                      const em = selectedMemory.emotion ? emotionForValue(selectedMemory.emotion) : null;
                      return em ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200">
                          {em.emoji} {em.label}
                        </span>
                      ) : null;
                    })()}
                    {selectedMemory.memoryDate && (
                      <span>{new Date(selectedMemory.memoryDate + "T00:00:00").toLocaleDateString("nl-NL", { day: "numeric", month: "long", year: "numeric" })}</span>
                    )}
                    {selectedMemory.source === "chat" && (
                      <span className="inline-flex items-center gap-1 text-primary-600">
                        <Sparkles size={12} />
                        Via Benji
                      </span>
                    )}
                    <span className="ml-auto">{formatDate(selectedMemory.createdAt)}</span>
                  </div>

                  {/* Acties */}
                  <div className="flex items-center gap-3 pt-2 border-t border-gray-100">
                    <button
                      type="button"
                      onClick={() => startEdit(selectedMemory)}
                      className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors hover:opacity-80"
                      style={{ color: "var(--account-accent)" }}
                    >
                      <Pencil size={15} />
                      Bewerken
                    </button>

                    {confirmDelete ? (
                      <div className="flex items-center gap-2 ml-auto">
                        <span className="text-xs text-gray-500">Verwijderen?</span>
                        <button
                          type="button"
                          onClick={handleDelete}
                          className="px-3 py-1.5 rounded-lg text-xs font-medium text-red-500 hover:bg-red-50 transition-colors"
                        >
                          Ja
                        </button>
                        <button
                          type="button"
                          onClick={() => setConfirmDelete(false)}
                          className="px-3 py-1.5 rounded-lg text-xs text-gray-400 hover:bg-gray-100 transition-colors"
                        >
                          Nee
                        </button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setConfirmDelete(true)}
                        className="p-2 rounded-lg text-gray-300 hover:text-gray-400 transition-colors ml-auto"
                        title="Verwijderen"
                      >
                        <Trash2 size={16} />
                      </button>
                    )}
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Fullscreen afbeelding */}
      {fullscreenImage && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center bg-black/80 cursor-zoom-out p-4"
          onClick={() => setFullscreenImage(null)}
        >
          <button
            type="button"
            onClick={() => setFullscreenImage(null)}
            className="absolute top-4 right-4 p-2 rounded-full bg-white/20 hover:bg-white/30 transition-colors"
          >
            <X size={24} className="text-white" />
          </button>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={fullscreenImage}
            alt=""
            className="max-w-full max-h-full object-contain rounded-lg"
          />
        </div>
      )}
    </div>
  );

  // Show paywall overlay if no access
  if (hasAccess === false) {
    return (
      <Paywall
        title="Upgrade naar Benji Alles in 1"
        message="Memories zijn beschikbaar in Benji Alles in 1. Leg mooie herinneringen vast om later naar terug te kijken."
      >
        {content}
      </Paywall>
    );
  }

  return content;
}
