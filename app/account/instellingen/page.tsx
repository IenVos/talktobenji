"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import Image from "next/image";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Palette, ImageIcon } from "lucide-react";

const ACCENT_COLORS = [
  { name: "Blauw", value: "#2563eb" },
  { name: "Groen", value: "#059669" },
  { name: "Paars", value: "#7c3aed" },
  { name: "Roze", value: "#db2777" },
  { name: "Oranje", value: "#ea580c" },
  { name: "Teal", value: "#0d9488" },
];

export default function AccountInstellingenPage() {
  const { data: session } = useSession();
  const userId = session?.userId;
  const preferencesData = useQuery(
    api.preferences.getPreferencesWithUrl,
    userId ? { userId } : "skip"
  );
  const preferences = useQuery(
    api.preferences.getPreferences,
    userId ? { userId } : "skip"
  );
  const setPreferences = useMutation(api.preferences.setPreferences);
  const generateUploadUrl = useMutation(api.preferences.generateUploadUrl);

  const [accentColor, setAccentColor] = useState(preferences?.accentColor ?? "");
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    if (preferences?.accentColor) setAccentColor(preferences.accentColor);
  }, [preferences?.accentColor]);

  const handleAccentColorChange = async (color: string) => {
    if (!userId) return;
    setAccentColor(color);
    await setPreferences({ userId, accentColor: color });
  };

  const handleBackgroundUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !userId) return;
    setUploading(true);
    try {
      const uploadUrl = await generateUploadUrl();
      const res = await fetch(uploadUrl, { method: "POST", body: file });
      const { storageId } = await res.json();
      if (storageId) {
        await setPreferences({ userId, backgroundImageStorageId: storageId });
      }
    } catch (err) {
      console.error(err);
    } finally {
      setUploading(false);
      e.target.value = "";
    }
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
          <h1 className="text-xl font-bold text-primary-900">Instellingen</h1>
          <p className="text-sm text-gray-600">Personalisatie van je account</p>
        </div>
      </div>

      <div className="space-y-6">
        {/* Hoofdkleur */}
        <div className="bg-white rounded-xl border border-primary-200 p-6">
          <div className="flex items-center gap-3 mb-4">
            <Palette size={24} className="text-primary-500" />
            <h2 className="text-lg font-semibold text-primary-900">Hoofdkleur</h2>
          </div>
          <p className="text-sm text-gray-600 mb-4">
            Kies een kleur voor knoppen en accenten in je account.
          </p>
          <div className="flex flex-wrap gap-3">
            {ACCENT_COLORS.map((c) => (
              <button
                key={c.value}
                type="button"
                onClick={() => handleAccentColorChange(c.value)}
                className={`w-10 h-10 rounded-full border-2 transition-transform hover:scale-110 ${
                  (accentColor || preferences?.accentColor) === c.value
                    ? "border-primary-900 ring-2 ring-primary-500 ring-offset-2"
                    : "border-gray-300"
                }`}
                style={{ backgroundColor: c.value }}
                title={c.name}
                aria-label={c.name}
              />
            ))}
          </div>
        </div>

        {/* Achtergrond afbeelding */}
        <div className="bg-white rounded-xl border border-primary-200 p-6">
          <div className="flex items-center gap-3 mb-4">
            <ImageIcon size={24} className="text-primary-500" />
            <h2 className="text-lg font-semibold text-primary-900">
              Achtergrondafbeelding
            </h2>
          </div>
          <p className="text-sm text-gray-600 mb-4">
            Upload een eigen achtergrond die je ziet wanneer je Benji gebruikt.
          </p>
          {preferencesData?.backgroundImageUrl && (
            <div className="mb-4 rounded-lg overflow-hidden border border-primary-200">
              <img
                src={preferencesData.backgroundImageUrl}
                alt="Je achtergrond"
                className="w-full h-32 object-cover"
              />
            </div>
          )}
          <label className="inline-flex items-center gap-2 px-4 py-2 bg-primary-100 text-primary-800 rounded-lg cursor-pointer hover:bg-primary-200 transition-colors disabled:opacity-50">
            <input
              type="file"
              accept="image/*"
              onChange={handleBackgroundUpload}
              disabled={uploading}
              className="sr-only"
            />
            {uploading ? "Bezig met uploaden…" : "Afbeelding uploaden"}
          </label>
        </div>
      </div>
    </div>
  );
}
