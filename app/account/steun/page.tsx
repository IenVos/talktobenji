"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useSession } from "next-auth/react";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Heart, Euro, Compass, MessageCircleHeart, Mic, Square, ImagePlus, X, Star, ChevronLeft, ChevronRight } from "lucide-react";
import Link from "next/link";

const FIXED_AMOUNTS = [5, 10, 25];

const FEEDBACK_TYPES = [
  { value: "suggestion" as const, label: "Idee of suggestie" },
  { value: "compliment" as const, label: "Compliment" },
  { value: "bug" as const, label: "Iets werkt niet goed" },
  { value: "feature_request" as const, label: "Nieuwe functie" },
  { value: "complaint" as const, label: "Klacht" },
];

// Mini-carousel constants (smaller than handreikingen)
const CARD_PCT = 60;
const SIDE_PCT = (100 - CARD_PCT) / 2;
const GAP_PX = 12;

function circularOffset(index: number, active: number, total: number) {
  let d = index - active;
  if (d > total / 2) d -= total;
  if (d < -total / 2) d += total;
  return d;
}

export default function AccountSteunPage() {
  const { data: session } = useSession();
  const submitFeedback = useMutation(api.chat.submitGeneralFeedback);
  const generateUploadUrl = useMutation(api.preferences.generateUploadUrl);

  // Load onderweg items for mini-carousel
  const onderwegItems = useQuery(api.onderweg.listActiveWithUrls, {});

  const [customAmount, setCustomAmount] = useState("");
  const [showCustomInput, setShowCustomInput] = useState(false);
  const [feedbackOpen, setFeedbackOpen] = useState(false);

  // Mini-carousel state
  const [activeOnderwegIndex, setActiveOnderwegIndex] = useState(0);
  const onderwegTouchStartX = useRef(0);
  const onderwegTouchDeltaX = useRef(0);
  const [isOnderwegDragging, setIsOnderwegDragging] = useState(false);

  // Feedback state
  const [feedbackType, setFeedbackType] = useState<typeof FEEDBACK_TYPES[number]["value"]>("suggestion");
  const [feedbackText, setFeedbackText] = useState("");
  const [feedbackRating, setFeedbackRating] = useState<number | null>(null);
  const [feedbackImage, setFeedbackImage] = useState<File | null>(null);
  const [feedbackImagePreview, setFeedbackImagePreview] = useState<string | null>(null);
  const [feedbackSending, setFeedbackSending] = useState(false);
  const [feedbackSent, setFeedbackSent] = useState(false);
  const [imageError, setImageError] = useState<string | null>(null);

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
        setFeedbackText(transcript);
      };
      recognition.onend = () => setIsRecording(false);
      recognition.onerror = () => setIsRecording(false);
      recognitionRef.current = recognition;
    }
  }, []);

  // Mini-carousel handlers
  const totalOnderwegItems = onderwegItems?.length ?? 0;

  const goToOnderwegItem = useCallback((index: number) => {
    if (totalOnderwegItems === 0) return;
    setActiveOnderwegIndex(((index % totalOnderwegItems) + totalOnderwegItems) % totalOnderwegItems);
  }, [totalOnderwegItems]);

  const handleOnderwegTouchStart = useCallback((e: React.TouchEvent) => {
    onderwegTouchStartX.current = e.touches[0].clientX;
    onderwegTouchDeltaX.current = 0;
    setIsOnderwegDragging(true);
  }, []);

  const handleOnderwegTouchMove = useCallback((e: React.TouchEvent) => {
    onderwegTouchDeltaX.current = e.touches[0].clientX - onderwegTouchStartX.current;
  }, []);

  const handleOnderwegTouchEnd = useCallback(() => {
    setIsOnderwegDragging(false);
    if (Math.abs(onderwegTouchDeltaX.current) > 50) {
      if (onderwegTouchDeltaX.current < 0) goToOnderwegItem(activeOnderwegIndex + 1);
      else goToOnderwegItem(activeOnderwegIndex - 1);
    }
    onderwegTouchDeltaX.current = 0;
  }, [activeOnderwegIndex, goToOnderwegItem]);

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

  const MAX_IMAGE_SIZE = 5 * 1024 * 1024; // 5 MB

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImageError(null);
    if (file.size > MAX_IMAGE_SIZE) {
      setImageError(`Dit bestand is te groot (${(file.size / 1024 / 1024).toFixed(1)} MB). De maximale grootte is 5 MB. Probeer een kleiner bestand of maak een screenshot.`);
      e.target.value = "";
      return;
    }
    setFeedbackImage(file);
    const reader = new FileReader();
    reader.onload = () => setFeedbackImagePreview(reader.result as string);
    reader.readAsDataURL(file);
    e.target.value = "";
  };

  const handleRemoveImage = () => {
    setFeedbackImage(null);
    setFeedbackImagePreview(null);
    setImageError(null);
  };

  const handleSubmitFeedback = async () => {
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
        userId: session?.userId ?? undefined,
        feedbackType,
        comment: feedbackText.trim(),
        rating: feedbackRating ?? undefined,
        userEmail: session?.user?.email ?? undefined,
        imageStorageId,
      });

      setFeedbackText("");
      setFeedbackRating(null);
      setFeedbackImage(null);
      setFeedbackImagePreview(null);
      setFeedbackType("suggestion");
      setFeedbackSent(true);
    } catch (err) {
      console.error(err);
    } finally {
      setFeedbackSending(false);
    }
  };

  const handleDonate = (amount: number | null) => {
    if (amount !== null) {
      alert(`Bedankt voor je interesse! Donatie van €${amount} komt binnenkort.`);
    }
  };

  const handleCustomDonate = () => {
    const val = parseFloat(customAmount.replace(",", "."));
    if (!isNaN(val) && val >= 1) {
      handleDonate(val);
      setCustomAmount("");
      setShowCustomInput(false);
    } else {
      alert("Vul een bedrag in van minimaal €1.");
    }
  };

  return (
    <div className="space-y-6">
      {/* Feedback sectie – compact blokje */}
      <div className="bg-white rounded-xl border border-primary-200 p-6">
        <div className="flex items-center gap-3 mb-3">
          <img src="/images/benji-logo-2.png" alt="Benji" width={28} height={28} className="flex-shrink-0 object-contain brightness-50" />
          <h2 className="text-lg font-semibold text-primary-900">Samen maken we Benji beter</h2>
        </div>
        <p className="text-sm text-gray-600 mb-2">
          Benji is er 24/7 voor iedereen die behoefte heeft aan een luisterend oor. Jouw ervaring helpt ons om Benji nog warmer, slimmer en behulpzamer te maken. Vertel ons wat je fijn vindt, wat beter kan, of deel een idee.
        </p>
        <p className="text-xs mb-5" style={{ color: "var(--account-accent)" }}>
          Elk bericht wordt gelezen. Dankzij jouw feedback wordt Benji elke dag een stukje beter voor iedereen.
        </p>
        <button
          type="button"
          onClick={() => { setFeedbackSent(false); setFeedbackOpen(true); }}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl font-medium transition-colors text-sm text-white"
          style={{ backgroundColor: "var(--account-accent)" }}
        >
          <MessageCircleHeart size={18} />
          Feedback geven
        </button>
      </div>

      {/* Feedback popup */}
      {feedbackOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={() => setFeedbackOpen(false)}>
          <div className="absolute inset-0 bg-black/30" />
          <div
            className="relative bg-white rounded-2xl shadow-xl w-full max-w-md max-h-[85vh] overflow-hidden z-10"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
              <h2 className="text-base font-semibold text-primary-900">Feedback geven</h2>
              <button
                type="button"
                onClick={() => setFeedbackOpen(false)}
                className="p-1 rounded-lg hover:bg-gray-100 transition-colors"
                aria-label="Sluiten"
              >
                <X size={18} className="text-gray-400" />
              </button>
            </div>

            {/* Content */}
            <div className="overflow-y-auto max-h-[calc(85vh-60px)] p-5 space-y-4">
              {feedbackSent ? (
                <div className="p-5 rounded-xl bg-green-50 border border-green-200 text-center">
                  <p className="text-green-800 font-semibold text-base">Heel erg bedankt!</p>
                  <p className="text-green-700 text-sm mt-1">Je feedback is ontvangen. We lezen alles persoonlijk.</p>
                  <button
                    type="button"
                    onClick={() => setFeedbackOpen(false)}
                    className="mt-4 px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 transition-colors"
                  >
                    Sluiten
                  </button>
                </div>
              ) : (
                <>
                  {/* Type kiezen */}
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

                  {/* Beoordeling met sterren */}
                  <div>
                    <label className="block text-sm font-medium text-primary-800 mb-2">Hoe ervaar je Benji? (optioneel)</label>
                    <div className="flex gap-1">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button
                          key={star}
                          type="button"
                          onClick={() => setFeedbackRating(feedbackRating === star ? null : star)}
                          className="p-1 transition-colors"
                          title={`${star} ster${star > 1 ? "ren" : ""}`}
                        >
                          <Star
                            size={24}
                            className={feedbackRating !== null && star <= feedbackRating ? "text-yellow-400 fill-yellow-400" : "text-gray-300"}
                          />
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Tekstveld met spraak */}
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
                            isRecording
                              ? "bg-red-500 text-white animate-pulse"
                              : "text-gray-400 hover:text-primary-600 hover:bg-primary-50"
                          }`}
                          title={isRecording ? "Stop opname" : "Start spraakopname"}
                        >
                          {isRecording ? <Square size={16} /> : <Mic size={16} />}
                        </button>
                      )}
                    </div>
                    {isRecording && (
                      <p className="text-xs text-red-500 mt-1 animate-pulse">Spraakopname actief, spreek nu...</p>
                    )}
                  </div>

                  {/* Afbeelding toevoegen */}
                  <div>
                    <label className="block text-sm font-medium text-primary-800 mb-2">Afbeelding toevoegen (optioneel)</label>
                    {feedbackImagePreview ? (
                      <div className="relative inline-block">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={feedbackImagePreview}
                          alt="Bijlage"
                          className="w-32 h-32 object-cover rounded-lg border border-primary-200"
                        />
                        <button
                          type="button"
                          onClick={handleRemoveImage}
                          className="absolute -top-2 -right-2 p-1 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors"
                          aria-label="Afbeelding verwijderen"
                        >
                          <X size={14} />
                        </button>
                      </div>
                    ) : (
                      <label className="inline-flex items-center gap-2 px-4 py-2 border border-dashed border-primary-300 text-primary-700 rounded-lg cursor-pointer hover:bg-primary-50 transition-colors text-sm">
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleImageSelect}
                          className="sr-only"
                        />
                        <ImagePlus size={18} />
                        Kies afbeelding
                      </label>
                    )}
                    {imageError && (
                      <p className="text-xs text-red-600 mt-1">{imageError}</p>
                    )}
                    <p className="text-xs text-gray-500 mt-1">
                      Bijvoorbeeld een screenshot. Maximaal 5 MB.
                    </p>
                  </div>

                  {/* Verstuur knop */}
                  <button
                    type="button"
                    onClick={handleSubmitFeedback}
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
      )}

      <div className="bg-white rounded-xl border border-primary-200 p-6">
        <div className="flex items-center gap-3 text-primary-700 mb-6">
          <Heart size={28} className="text-primary-500 flex-shrink-0" />
          <div>
            <h2 className="text-lg font-semibold text-primary-900">Waarom Benji steunen?</h2>
            <p className="text-sm text-gray-600 mt-1">Jouw bijdrage maakt het verschil</p>
          </div>
        </div>

        <div className="prose prose-sm max-w-none text-gray-700 space-y-4">
          <p>
            Talk To Benji is er voor iedereen die te maken heeft met rouw, verlies of verdriet. Of je nu een
            dierbare bent verloren, je huisdier mist, of gewoon even wil praten, Benji is er dag en nacht,
            zonder oordeel. Je kunt Benji altijd <a href="/prijzen" className="text-primary-600 hover:text-primary-700 underline">gratis proberen</a> voordat
            je een abonnement kiest.
          </p>
          <p>
            Wil je Benji extra steunen? Een donatie helpt ons om de techniek te onderhouden, Benji verder te
            verbeteren, en meer mensen te bereiken die een luisterend oor nodig hebben. Jouw bijdrage maakt
            het verschil.
          </p>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-primary-200 p-6">
        <h3 className="text-base font-semibold text-primary-900 mb-4">Hoe kun je Benji steunen?</h3>
        <ul className="space-y-3 text-gray-700">
          <li className="flex items-start gap-3">
            <span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary-100 text-primary-600 flex items-center justify-center text-sm font-medium">1</span>
            <div>
              <strong>Donatie</strong>. Kies een bedrag dat bij je past. Elk bedrag helpt, hoe klein ook.
            </div>
          </li>
          <li className="flex items-start gap-3">
            <span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary-100 text-primary-600 flex items-center justify-center text-sm font-medium">2</span>
            <div>
              <strong>Iets voor onderweg</strong>. Kleine dingen met betekenis die je kunnen steunen (bijv. een kaart of boek). Binnenkort beschikbaar.
            </div>
          </li>
          <li className="flex items-start gap-3">
            <span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary-100 text-primary-600 flex items-center justify-center text-sm font-medium">3</span>
            <div>
              <strong>Delen</strong>. Vertel anderen over Benji. Soms is dat het mooiste wat je kunt doen.
            </div>
          </li>
        </ul>
      </div>

      <div className="bg-white rounded-xl border border-primary-200 p-6">
        <h3 className="text-base font-semibold text-primary-900 mb-4">Kies je donatiebedrag</h3>
        <div className="flex flex-wrap gap-3">
          {FIXED_AMOUNTS.map((amount) => (
            <button
              key={amount}
              type="button"
              onClick={() => handleDonate(amount)}
              className="flex items-center gap-2 px-6 py-3 rounded-xl border-2 border-primary-200 bg-white text-primary-800 font-semibold hover:border-primary-500 hover:bg-primary-50 transition-colors"
            >
              <Euro size={18} />
              €{amount}
            </button>
          ))}
          <button
            type="button"
            onClick={() => setShowCustomInput(!showCustomInput)}
            className={`flex items-center gap-2 px-6 py-3 rounded-xl border-2 font-semibold transition-colors ${
              showCustomInput
                ? "border-primary-500 bg-primary-50 text-primary-800"
                : "border-primary-200 bg-white text-primary-800 hover:border-primary-500 hover:bg-primary-50"
            }`}
          >
            <Euro size={18} />
            Zelf kiezen
          </button>
        </div>
        {showCustomInput && (
          <div className="mt-4 flex gap-2 flex-wrap items-center">
            <span className="text-primary-700 font-medium">€</span>
            <input
              type="text"
              inputMode="decimal"
              placeholder="0,00"
              value={customAmount}
              onChange={(e) => setCustomAmount(e.target.value.replace(/[^0-9,.]/g, ""))}
              className="w-32 px-3 py-2 border border-primary-200 rounded-lg text-primary-900 font-medium"
            />
            <button
              type="button"
              onClick={handleCustomDonate}
              disabled={!customAmount.trim()}
              className="px-4 py-2 bg-primary-600 text-white rounded-lg font-medium hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Doneren
            </button>
          </div>
        )}
      </div>

      {/* Iets voor onderweg mini-carousel */}
      <div className="bg-white rounded-xl border border-primary-200 p-6">
        <h3 className="flex items-center gap-2 text-base font-semibold text-primary-900 mb-4">
          <Compass size={20} className="text-primary-500" />
          Iets voor onderweg
        </h3>
        <p className="text-sm text-gray-700 mb-4">
          Kleine dingen met betekenis die je onderweg kunnen dragen, een kaart, boek of iets anders
          dat troost en herinnering biedt. De opbrengst gaat naar Benji.
        </p>

        {onderwegItems === undefined ? (
          <div className="py-6 flex justify-center">
            <div className="animate-pulse rounded-full h-6 w-6 border-b-2 border-primary-600" />
          </div>
        ) : onderwegItems.length === 0 ? (
          <div className="p-3 rounded-lg bg-primary-50 border border-primary-100">
            <p className="text-sm text-primary-800">
              Binnenkort beschikbaar.
            </p>
          </div>
        ) : (
          <div>
            <div
              className="relative"
              onTouchStart={handleOnderwegTouchStart}
              onTouchMove={handleOnderwegTouchMove}
              onTouchEnd={handleOnderwegTouchEnd}
            >
              {totalOnderwegItems > 1 && (
                <>
                  <button
                    type="button"
                    onClick={() => goToOnderwegItem(activeOnderwegIndex - 1)}
                    className="absolute top-1/2 -translate-y-1/2 z-10 p-1 rounded-full bg-white border border-primary-200 text-primary-600 hover:bg-primary-50 transition-colors shadow-sm"
                    style={{ left: `calc(${SIDE_PCT / 2}% - 12px)` }}
                    aria-label="Vorige"
                  >
                    <ChevronLeft size={16} />
                  </button>
                  <button
                    type="button"
                    onClick={() => goToOnderwegItem(activeOnderwegIndex + 1)}
                    className="absolute top-1/2 -translate-y-1/2 z-10 p-1 rounded-full bg-white border border-primary-200 text-primary-600 hover:bg-primary-50 transition-colors shadow-sm"
                    style={{ right: `calc(${SIDE_PCT / 2}% - 12px)` }}
                    aria-label="Volgende"
                  >
                    <ChevronRight size={16} />
                  </button>
                </>
              )}

              <div className="overflow-hidden">
                <div className="relative" style={{ width: `${CARD_PCT}%`, marginLeft: `${SIDE_PCT}%` }}>
                  {onderwegItems.map((item, index) => {
                    const offset = circularOffset(index, activeOnderwegIndex, totalOnderwegItems);
                    const isActive = offset === 0;
                    const isNeighbor = Math.abs(offset) === 1;
                    const isVisible = Math.abs(offset) <= 1;

                    return (
                      <div
                        key={item._id}
                        style={{
                          position: isActive ? "relative" : "absolute",
                          top: 0,
                          left: 0,
                          width: "100%",
                          transform: `translateX(calc(${offset} * (100% + ${GAP_PX}px))) scale(${isActive ? 1 : 0.92})`,
                          opacity: isActive ? 1 : isNeighbor ? 0.3 : 0,
                          transition: isOnderwegDragging ? "none" : "transform 0.4s ease, opacity 0.4s ease",
                          zIndex: isActive ? 2 : 1,
                          pointerEvents: isActive ? "auto" : "none",
                          cursor: isActive ? "pointer" : "default",
                        }}
                        onClick={() => { if (!isActive && isVisible) goToOnderwegItem(index); }}
                      >
                        <Link href="/account/onderweg" className="block">
                          <article className="rounded-lg bg-white border border-primary-100 overflow-hidden hover:border-primary-200 transition-colors aspect-square flex flex-col">
                            {item.imageUrl && (
                              <div className="flex-1 overflow-hidden flex items-center justify-center bg-white p-3">
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img
                                  src={item.imageUrl}
                                  alt={item.title}
                                  className="w-full h-full object-contain"
                                />
                              </div>
                            )}

                            {(item.title || item.content || item.priceCents) && (
                              <div className="p-3 flex flex-col items-center justify-center gap-1.5">
                                <div className="flex flex-col items-center justify-center gap-1 px-3 py-2 rounded-lg border border-primary-200 bg-white w-full">
                                  {item.title && (
                                    <h4 className="text-xs font-semibold text-primary-900 line-clamp-1 text-center">{item.title}</h4>
                                  )}
                                  {item.priceCents != null && item.priceCents > 0 && (
                                    <span className="text-xs font-semibold text-primary-600">
                                      €{(item.priceCents / 100).toFixed(2)}
                                    </span>
                                  )}
                                </div>
                              </div>
                            )}
                          </article>
                        </Link>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {totalOnderwegItems > 1 && (
              <div className="flex justify-center gap-1.5 mt-3">
                {onderwegItems.map((item, index) => (
                  <button
                    key={item._id}
                    type="button"
                    onClick={() => goToOnderwegItem(index)}
                    className={`rounded-full transition-all ${
                      index === activeOnderwegIndex
                        ? "w-2.5 h-2.5 bg-primary-600"
                        : "w-2 h-2 bg-primary-300 hover:bg-primary-400"
                    }`}
                    aria-label={`Ga naar item ${index + 1}`}
                  />
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      <div className="bg-primary-50 rounded-xl border border-primary-200 p-6">
        <p className="font-medium text-primary-800 mb-2">Dank je voor je interesse!</p>
        <p className="text-sm text-gray-600">
          De online betaling voor donaties komt binnenkort. We werken aan een Stripe-integratie.
          Tot die tijd: deel Benji met iemand die het kan gebruiken — daar zijn we heel dankbaar voor.
        </p>
      </div>
    </div>
  );
}
