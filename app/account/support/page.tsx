"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Send, CheckCircle, Upload, X } from "lucide-react";

export default function SupportPage() {
  const { data: session } = useSession();
  const submitFeedback = useMutation(api.feedback.submitFeedback);
  const generateUploadUrl = useMutation(api.feedback.generateUploadUrl);

  const [onderwerp, setOnderwerp] = useState("");
  const [bericht, setBericht] = useState("");
  const [email, setEmail] = useState(session?.user?.email || "");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Max 5MB
    if (file.size > 5 * 1024 * 1024) {
      setError("Afbeelding mag maximaal 5MB zijn");
      return;
    }

    setImageFile(file);
    const reader = new FileReader();
    reader.onloadend = () => {
      setImagePreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const removeImage = () => {
    setImageFile(null);
    setImagePreview(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!onderwerp.trim() || !bericht.trim()) {
      setError("Vul alle velden in");
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      let imageStorageId: string | undefined;

      // Upload afbeelding eerst als die er is
      if (imageFile) {
        setUploading(true);
        const uploadUrl = await generateUploadUrl();
        const res = await fetch(uploadUrl, {
          method: "POST",
          body: imageFile,
        });
        const { storageId } = await res.json();
        imageStorageId = storageId;
        setUploading(false);
      }

      await submitFeedback({
        userId: session?.userId,
        userEmail: email || undefined,
        feedbackType: "support",
        comment: `Onderwerp: ${onderwerp}\n\n${bericht}`,
        imageStorageId,
      });

      setSubmitted(true);
      setOnderwerp("");
      setBericht("");
      setImageFile(null);
      setImagePreview(null);

      setTimeout(() => {
        setSubmitted(false);
      }, 5000);
    } catch (err) {
      console.error(err);
      setError("Er ging iets mis. Probeer het opnieuw.");
    } finally {
      setSubmitting(false);
      setUploading(false);
    }
  };

  return (
    <div className="max-w-2xl">
      <div className="bg-white rounded-xl border border-primary-200 p-6">
        {submitted ? (
          <div className="text-center py-12">
            <CheckCircle size={48} className="text-green-500 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              Bericht verstuurd!
            </h3>
            <p className="text-gray-600 mb-6">
              Bedankt voor je bericht. We nemen zo snel mogelijk contact met je op.
            </p>
            <button
              type="button"
              onClick={() => setSubmitted(false)}
              className="px-6 py-2.5 bg-primary-600 text-white rounded-lg font-medium hover:bg-primary-700 transition-colors"
            >
              Nog een bericht versturen
            </button>
          </div>
        ) : (
          <>
            <div className="mb-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-2">
                Hoe kunnen we je helpen?
              </h2>
              <p className="text-sm text-gray-600">
                Heb je een vraag, probleem of suggestie? Stuur ons een bericht en we helpen je graag verder.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Email veld */}
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                  Je e-mailadres
                </label>
                <input
                  type="email"
                  id="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="je@email.nl"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none text-sm"
                  required
                />
                <p className="text-xs text-gray-500 mt-1">
                  We gebruiken dit om contact met je op te nemen
                </p>
              </div>

              {/* Onderwerp */}
              <div>
                <label htmlFor="onderwerp" className="block text-sm font-medium text-gray-700 mb-2">
                  Onderwerp
                </label>
                <input
                  type="text"
                  id="onderwerp"
                  value={onderwerp}
                  onChange={(e) => setOnderwerp(e.target.value)}
                  placeholder="Waar gaat je vraag over?"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none text-sm"
                  required
                  maxLength={100}
                />
              </div>

              {/* Bericht */}
              <div>
                <label htmlFor="bericht" className="block text-sm font-medium text-gray-700 mb-2">
                  Je bericht
                </label>
                <textarea
                  id="bericht"
                  value={bericht}
                  onChange={(e) => setBericht(e.target.value)}
                  placeholder="Beschrijf je vraag of probleem zo duidelijk mogelijk..."
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none text-sm resize-none"
                  rows={8}
                  required
                  maxLength={2000}
                />
                <div className="flex items-center justify-between mt-2">
                  <span className="text-xs text-gray-500">
                    {bericht.length}/2000 karakters
                  </span>
                </div>
              </div>

              {/* Afbeelding upload */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Screenshot of afbeelding (optioneel)
                </label>
                {imagePreview ? (
                  <div className="relative inline-block">
                    <img
                      src={imagePreview}
                      alt="Preview"
                      className="max-w-xs rounded-lg border border-gray-300"
                    />
                    <button
                      type="button"
                      onClick={removeImage}
                      className="absolute top-2 right-2 p-1.5 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors"
                      aria-label="Verwijder afbeelding"
                    >
                      <X size={16} />
                    </button>
                  </div>
                ) : (
                  <label className="inline-flex items-center gap-2 px-4 py-2.5 bg-primary-50 text-primary-700 border border-primary-200 rounded-lg cursor-pointer hover:bg-primary-100 transition-colors">
                    <Upload size={18} />
                    <span className="text-sm font-medium">Afbeelding uploaden</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageChange}
                      className="sr-only"
                    />
                  </label>
                )}
                <p className="text-xs text-gray-500 mt-1">
                  Maximaal 5MB - helpt ons om je probleem beter te begrijpen
                </p>
              </div>

              {error && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-sm text-red-600">{error}</p>
                </div>
              )}

              {/* Verstuur knop */}
              <button
                type="submit"
                disabled={submitting || uploading || !onderwerp.trim() || !bericht.trim()}
                className="w-full inline-flex items-center justify-center gap-2 px-6 py-3 bg-primary-600 text-white rounded-lg font-medium hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <Send size={18} />
                {uploading ? "Afbeelding uploaden..." : submitting ? "Versturen..." : "Verstuur bericht"}
              </button>
            </form>

            {/* Extra info */}
            <div className="mt-8 pt-6 border-t border-gray-100">
              <h3 className="text-sm font-semibold text-gray-900 mb-3">
                Veelvoorkomende vragen
              </h3>
              <ul className="space-y-2 text-sm text-gray-600">
                <li>• Reactietijd: we reageren binnen 24-48 uur</li>
                <li>• Technische problemen: vermeld je browser en apparaat</li>
              </ul>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
