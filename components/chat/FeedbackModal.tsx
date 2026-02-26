"use client";

import { useState, useEffect, useRef } from "react";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Mic, Square, ImagePlus, X, Star } from "lucide-react";

const FEEDBACK_TYPES = [
  { value: "suggestion" as const, label: "Idee of suggestie" },
  { value: "compliment" as const, label: "Compliment" },
  { value: "bug" as const, label: "Iets werkt niet goed" },
  { value: "feature_request" as const, label: "Nieuwe functie" },
  { value: "complaint" as const, label: "Klacht" },
];

interface FeedbackModalProps {
  isOpen: boolean;
  onClose: () => void;
  userId?: string;
  userEmail?: string;
}

export function FeedbackModal({ isOpen, onClose, userId, userEmail }: FeedbackModalProps) {
  const submitFeedback = useMutation(api.chat.submitGeneralFeedback);
  const generateUploadUrl = useMutation(api.preferences.generateUploadUrl);

  const [feedbackType, setFeedbackType] = useState<typeof FEEDBACK_TYPES[number]["value"]>("suggestion");
  const [feedbackText, setFeedbackText] = useState("");
  const [feedbackRating, setFeedbackRating] = useState<number | null>(null);
  const [feedbackImage, setFeedbackImage] = useState<File | null>(null);
  const [feedbackImagePreview, setFeedbackImagePreview] = useState<string | null>(null);
  const [feedbackSending, setFeedbackSending] = useState(false);
  const [feedbackSent, setFeedbackSent] = useState(false);
  const [imageError, setImageError] = useState<string | null>(null);

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
        setFeedbackText(transcript);
      };
      recognition.onend = () => setIsRecording(false);
      recognition.onerror = () => setIsRecording(false);
      recognitionRef.current = recognition;
    }
  }, []);

  // Reset bij openen
  useEffect(() => {
    if (isOpen) {
      setFeedbackSent(false);
      setFeedbackText("");
      setFeedbackRating(null);
      setFeedbackImage(null);
      setFeedbackImagePreview(null);
      setFeedbackType("suggestion");
      setImageError(null);
    }
  }, [isOpen]);

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

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImageError(null);
    if (file.size > 5 * 1024 * 1024) {
      setImageError(`Dit bestand is te groot (${(file.size / 1024 / 1024).toFixed(1)} MB). Maximaal 5 MB.`);
      e.target.value = "";
      return;
    }
    setFeedbackImage(file);
    const reader = new FileReader();
    reader.onload = () => setFeedbackImagePreview(reader.result as string);
    reader.readAsDataURL(file);
    e.target.value = "";
  };

  const handleSubmit = async () => {
    if (!feedbackText.trim()) return;
    setFeedbackSending(true);
    try {
      let imageStorageId: any = undefined;
      if (feedbackImage) {
        const uploadUrl = await generateUploadUrl();
        const res = await fetch(uploadUrl, { method: "POST", body: feedbackImage });
        const { storageId } = await res.json();
        if (storageId) imageStorageId = storageId;
      }
      await submitFeedback({
        userId: userId ?? undefined,
        feedbackType,
        comment: feedbackText.trim(),
        rating: feedbackRating ?? undefined,
        userEmail: userEmail ?? undefined,
        imageStorageId,
      });
      setFeedbackSent(true);
    } catch (err) {
      console.error(err);
    } finally {
      setFeedbackSending(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/30" />
      <div
        className="relative bg-white rounded-t-2xl sm:rounded-2xl shadow-xl w-full sm:max-w-md max-h-[90vh] overflow-hidden z-10"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <h2 className="text-base font-semibold text-primary-900">Feedback geven</h2>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-lg hover:bg-gray-100 transition-colors"
            aria-label="Sluiten"
          >
            <X size={18} className="text-gray-400" />
          </button>
        </div>

        {/* Content */}
        <div className="overflow-y-auto max-h-[calc(90vh-60px)] p-5 space-y-4">
          {feedbackSent ? (
            <div className="p-5 rounded-xl bg-green-50 border border-green-200 text-center">
              <p className="text-green-800 font-semibold text-base">Heel erg bedankt.</p>
              <p className="text-green-700 text-sm mt-1">Je feedback is ontvangen. We lezen alles persoonlijk.</p>
              <button
                type="button"
                onClick={onClose}
                className="mt-4 px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 transition-colors"
              >
                Sluiten
              </button>
            </div>
          ) : (
            <>
              {/* Type */}
              <div>
                <label className="block text-sm font-medium text-primary-800 mb-2">Wat wil je delen?</label>
                <div className="flex flex-wrap gap-2">
                  {FEEDBACK_TYPES.map((t) => (
                    <button
                      key={t.value}
                      type="button"
                      onClick={() => setFeedbackType(t.value)}
                      className={`px-3 py-1.5 rounded-lg text-sm font-medium border transition-colors ${
                        feedbackType === t.value
                          ? "border-primary-500 bg-primary-50 text-primary-800"
                          : "border-gray-200 text-gray-600 hover:border-primary-300"
                      }`}
                    >
                      {t.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Sterren */}
              <div>
                <label className="block text-sm font-medium text-primary-800 mb-2">Hoe ervaar je Benji? (optioneel)</label>
                <div className="flex gap-1">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setFeedbackRating(feedbackRating === star ? null : star)}
                      className="p-1 transition-colors"
                    >
                      <Star
                        size={24}
                        className={feedbackRating !== null && star <= feedbackRating ? "text-yellow-400 fill-yellow-400" : "text-gray-300"}
                      />
                    </button>
                  ))}
                </div>
              </div>

              {/* Tekst + spraak */}
              <div>
                <label className="block text-sm font-medium text-primary-800 mb-2">Je bericht</label>
                <div className="relative">
                  <textarea
                    value={feedbackText}
                    onChange={(e) => setFeedbackText(e.target.value)}
                    placeholder="Schrijf of spreek je feedback in..."
                    rows={4}
                    className={`w-full px-3 py-2 border rounded-lg text-sm pr-12 ${
                      isRecording ? "border-red-400 bg-red-50/30" : "border-primary-200"
                    }`}
                  />
                  {speechSupported && (
                    <button
                      type="button"
                      onClick={toggleRecording}
                      className={`absolute right-2 top-2 p-1.5 rounded-lg transition-colors ${
                        isRecording ? "bg-red-500 text-white animate-pulse" : "text-gray-400 hover:text-primary-600 hover:bg-primary-50"
                      }`}
                      title={isRecording ? "Stop opname" : "Start spraakopname"}
                    >
                      {isRecording ? <Square size={16} /> : <Mic size={16} />}
                    </button>
                  )}
                </div>
                {isRecording && <p className="text-xs text-red-500 mt-1 animate-pulse">Spraakopname actief, spreek nu...</p>}
              </div>

              {/* Afbeelding */}
              <div>
                <label className="block text-sm font-medium text-primary-800 mb-2">Afbeelding toevoegen (optioneel)</label>
                {feedbackImagePreview ? (
                  <div className="relative inline-block">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={feedbackImagePreview} alt="Bijlage" className="w-32 h-32 object-cover rounded-lg border border-primary-200" />
                    <button
                      type="button"
                      onClick={() => { setFeedbackImage(null); setFeedbackImagePreview(null); setImageError(null); }}
                      className="absolute -top-2 -right-2 p-1 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors"
                    >
                      <X size={14} />
                    </button>
                  </div>
                ) : (
                  <label className="inline-flex items-center gap-2 px-4 py-2 border border-dashed border-primary-300 text-primary-700 rounded-lg cursor-pointer hover:bg-primary-50 transition-colors text-sm">
                    <input type="file" accept="image/*" onChange={handleImageSelect} className="sr-only" />
                    <ImagePlus size={18} />
                    Kies afbeelding
                  </label>
                )}
                {imageError && <p className="text-xs text-red-600 mt-1">{imageError}</p>}
                <p className="text-xs text-gray-500 mt-1">Maximaal 5 MB.</p>
              </div>

              <button
                type="button"
                onClick={handleSubmit}
                disabled={!feedbackText.trim() || feedbackSending}
                className="w-full px-5 py-2.5 bg-primary-600 text-white rounded-lg font-medium hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {feedbackSending ? "Bezig met versturen..." : "Feedback versturen"}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
