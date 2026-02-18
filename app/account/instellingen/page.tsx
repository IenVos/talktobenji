"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Palette, ImageIcon, Trash2, Save, RotateCcw, Smartphone, X, Bell, FileText } from "lucide-react";
import { isPushSupported, subscribeToPush, unsubscribeFromPush, getPermissionStatus } from "@/lib/pushNotifications";
import { Paywall } from "@/components/Paywall";

// Originele Benji-kleur (primary-600 uit tailwind)
const ORIGINAL_COLOR = "#6d84a8";

// Zachtere, rustige kleuren – passend bij TTB (eerste = origineel)
const ACCENT_COLORS = [
  { name: "Origineel", value: ORIGINAL_COLOR },
  { name: "Zacht blauw", value: "#93c5fd" },
  { name: "Zacht groen", value: "#86efac" },
  { name: "Zacht lavendel", value: "#c4b5fd" },
  { name: "Zacht roze", value: "#f9a8d4" },
  { name: "Zacht perzik", value: "#fdba74" },
  { name: "Zacht mint", value: "#99f6e4" },
  { name: "Zacht lila", value: "#ddd6fe" },
  { name: "Zacht zand", value: "#fcd34d" },
  { name: "Zacht hemelsblauw", value: "#7dd3fc" },
  { name: "Zacht salie", value: "#a7f3d0" },
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
  const removeBackgroundImage = useMutation(api.preferences.removeBackgroundImage);
  const generateUploadUrl = useMutation(api.preferences.generateUploadUrl);

  const hasAccess = useQuery(
    api.subscriptions.hasFeatureAccess,
    userId ? { userId, email: session?.user?.email || undefined, feature: "personalization" } : "skip"
  );

  const savedColor = preferences?.accentColor ?? "";
  const savedContextValue = preferences?.userContext ?? "";
  const [accentColor, setAccentColor] = useState(savedColor);
  const [userContext, setUserContext] = useState(savedContextValue);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [savingContext, setSavingContext] = useState(false);
  const [contextSaved, setContextSaved] = useState(false);
  const [showInstallPopup, setShowInstallPopup] = useState(false);

  // Push notificaties
  const pushSupported = typeof window !== "undefined" && isPushSupported();
  const isSubscribed = useQuery(
    api.pushSubscriptions.isSubscribed,
    userId ? { userId } : "skip"
  );
  const subscribeMutation = useMutation(api.pushSubscriptions.subscribe);
  const unsubscribeMutation = useMutation(api.pushSubscriptions.unsubscribe);
  const [pushLoading, setPushLoading] = useState(false);
  const [pushError, setPushError] = useState<string | null>(null);

  const handleTogglePush = async () => {
    if (!userId) return;
    setPushLoading(true);
    setPushError(null);
    try {
      if (isSubscribed) {
        // Uitschakelen
        await unsubscribeFromPush();
        await unsubscribeMutation({ userId });
      } else {
        // Inschakelen
        const subscription = await subscribeToPush();
        if (!subscription) {
          const perm = getPermissionStatus();
          if (perm === "denied") {
            setPushError("Je hebt notificaties geblokkeerd in je browser. Ga naar je browserinstellingen om dit te wijzigen.");
          } else {
            setPushError("Notificaties konden niet worden ingeschakeld. Probeer het opnieuw.");
          }
          return;
        }
        const json = subscription.toJSON();
        await subscribeMutation({
          userId,
          endpoint: json.endpoint!,
          p256dh: json.keys!.p256dh,
          auth: json.keys!.auth,
        });
      }
    } catch (err) {
      console.error(err);
      setPushError("Er ging iets mis. Probeer het opnieuw.");
    } finally {
      setPushLoading(false);
    }
  };

  useEffect(() => {
    setAccentColor(preferences?.accentColor ?? "");
    setUserContext(preferences?.userContext ?? "");
  }, [preferences?.accentColor, preferences?.userContext]);

  const effectiveSaved = savedColor || ORIGINAL_COLOR;
  const hasColorChanged = (accentColor || ORIGINAL_COLOR) !== effectiveSaved;

  const handleSaveContext = async () => {
    if (!userId) return;
    setSavingContext(true);
    setContextSaved(false);
    try {
      await setPreferences({ userId, userContext });
      setContextSaved(true);
      setTimeout(() => setContextSaved(false), 2000);
    } finally {
      setSavingContext(false);
    }
  };

  const hasContextChanged = userContext !== savedContextValue;

  const handleSaveColor = async () => {
    if (!userId) return;
    setSaving(true);
    setSaved(false);
    try {
      const colorToSave = accentColor || ORIGINAL_COLOR;
      await setPreferences({ userId, accentColor: colorToSave });
      try { localStorage.setItem("benji_accent_color", colorToSave); } catch {}
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } finally {
      setSaving(false);
    }
  };

  const handleResetToOriginal = () => {
    setAccentColor(ORIGINAL_COLOR);
  };

  const effectiveSelection = accentColor || effectiveSaved;

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

  const handleRemoveBackground = async () => {
    if (!userId || !confirm("Achtergrondafbeelding verwijderen?")) return;
    await removeBackgroundImage({ userId });
  };

  const pageContent = (
    <div className="space-y-6">
      <div className="bg-white rounded-xl border border-primary-200 p-6">
        <div className="flex items-center gap-3 mb-4">
          <FileText size={24} className="text-primary-500" />
          <h2 className="text-lg font-semibold text-primary-900">Jouw verhaal</h2>
        </div>
        <div className="h-40 bg-gray-100 rounded-lg" />
      </div>
      <div className="bg-white rounded-xl border border-primary-200 p-6">
        <div className="flex items-center gap-3 mb-4">
          <Bell size={24} className="text-primary-500" />
          <h2 className="text-lg font-semibold text-primary-900">Hartverwarmers</h2>
        </div>
        <div className="h-8 bg-gray-100 rounded-lg" />
      </div>
      <div className="bg-white rounded-xl border border-primary-200 p-6">
        <div className="flex items-center gap-3 mb-4">
          <Palette size={24} className="text-primary-500" />
          <h2 className="text-lg font-semibold text-primary-900">Uiterlijk</h2>
        </div>
        <div className="flex gap-3 mb-4">
          {[1,2,3,4,5,6].map(i => (
            <div key={i} className="w-10 h-10 rounded-full bg-gray-200" />
          ))}
        </div>
        <div className="h-32 bg-gray-100 rounded-lg mt-4" />
      </div>
    </div>
  );

  if (hasAccess === false) {
    return (
      <Paywall
        title="Upgrade naar Benji Alles in 1"
        message="Personalisatie is beschikbaar vanaf Benji Alles in 1. Pas je eigen kleur, achtergrond en persoonlijke context in."
      >
        {pageContent}
      </Paywall>
    );
  }

  return (
    <div className="space-y-6">
        {/* Context voor Benji */}
        <div className="bg-white rounded-xl border border-primary-200 p-6">
          <div className="flex items-center gap-3 mb-4">
            <FileText size={24} className="text-primary-500" />
            <h2 className="text-lg font-semibold text-primary-900">Jouw verhaal</h2>
          </div>
          <p className="text-sm text-gray-600 mb-4">
            Vertel Benji wat over jouw situatie. Dit helpt Benji om beter aan te sluiten bij wat je nodig hebt. Deze informatie is alleen zichtbaar voor jou.
          </p>
          <textarea
            value={userContext}
            onChange={(e) => setUserContext(e.target.value)}
            placeholder="Waar wil je over praten? Denk aan:&#10;• Wat voor verlies je hebt meegemaakt&#10;• Hoe lang het geleden is&#10;• Waar je nu het meest mee worstelt&#10;• Wat je zoekt in gesprekken met Benji"
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none text-sm resize-none"
            rows={8}
            maxLength={1000}
          />
          <div className="flex items-center justify-between mt-3">
            <span className="text-xs text-gray-500">
              {userContext.length}/1000 karakters
            </span>
            <button
              type="button"
              onClick={handleSaveContext}
              disabled={!hasContextChanged || savingContext}
              className="inline-flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg font-medium hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <Save size={18} />
              {savingContext ? "Bezig…" : contextSaved ? "Opgeslagen!" : "Opslaan"}
            </button>
          </div>
        </div>

        {/* Hartverwarmers */}
        <div className="bg-white rounded-xl border border-primary-200 p-6">
          <div className="flex items-center gap-3 mb-4">
            <Bell size={24} className="text-primary-500" />
            <h2 className="text-lg font-semibold text-primary-900">Hartverwarmers</h2>
          </div>
          <p className="text-sm text-gray-600 mb-4">
            Hartverwarmers zijn kleine berichtjes die je helpen je dag goed te beginnen of je herinneren aan doelen die je hebt gesteld. Ze zorgen ervoor dat je belangrijke dingen niet vergeet en houden je gefocust. Hartverwarmers worden spaarzaam verstuurd om je liefde en kracht te geven.
          </p>
          {!pushSupported ? (
            <p className="text-sm text-gray-500 italic">
              Hartverwarmers worden niet ondersteund in deze browser. Installeer de app op je telefoon om hartverwarmers te ontvangen.
            </p>
          ) : (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-700">
                  {isSubscribed ? "Hartverwarmers staan aan" : "Hartverwarmers staan uit"}
                </span>
                <button
                  type="button"
                  onClick={handleTogglePush}
                  disabled={pushLoading || isSubscribed === undefined}
                  className={`relative inline-flex h-7 w-12 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none disabled:opacity-50 ${
                    isSubscribed ? "bg-primary-600" : "bg-gray-300"
                  }`}
                  role="switch"
                  aria-checked={!!isSubscribed}
                >
                  <span
                    className={`pointer-events-none inline-block h-6 w-6 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                      isSubscribed ? "translate-x-5" : "translate-x-0"
                    }`}
                  />
                </button>
              </div>
              {pushError && (
                <p className="text-sm text-red-600">{pushError}</p>
              )}
            </div>
          )}
        </div>

        {/* Uiterlijk - Kleur + Achtergrond samengevoegd */}
        <div className="bg-white rounded-xl border border-primary-200 p-6">
          <div className="flex items-center gap-3 mb-6">
            <Palette size={24} className="text-primary-500" />
            <h2 className="text-lg font-semibold text-primary-900">Uiterlijk</h2>
          </div>

          {/* Hoofdkleur sectie */}
          <div className="mb-8 pb-8 border-b border-gray-100">
            <h3 className="text-base font-medium text-gray-900 mb-2">Hoofdkleur</h3>
            <p className="text-sm text-gray-600 mb-4">
              Kies een kleur voor knoppen en accenten in je account. De eerste kleur is de originele Benji-kleur.
            </p>
            <div className="flex flex-wrap gap-3 mb-4">
              {ACCENT_COLORS.map((c) => (
                <button
                  key={c.value}
                  type="button"
                  onClick={() => setAccentColor(c.value)}
                  className={`w-10 h-10 rounded-full border-2 transition-transform hover:scale-110 ${
                    effectiveSelection === c.value
                      ? "border-primary-900 ring-2 ring-primary-500 ring-offset-2"
                      : "border-gray-300"
                  }`}
                  style={{ backgroundColor: c.value }}
                  title={c.name}
                  aria-label={c.name}
                />
              ))}
            </div>
            <div className="flex flex-wrap gap-2 items-center">
              <button
                type="button"
                onClick={handleSaveColor}
                disabled={!hasColorChanged || saving}
                className="inline-flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg font-medium hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <Save size={18} />
                {saving ? "Bezig…" : saved ? "Opgeslagen!" : "Opslaan"}
              </button>
              {effectiveSaved !== ORIGINAL_COLOR && (
                <button
                  type="button"
                  onClick={handleResetToOriginal}
                  className="inline-flex items-center gap-2 px-4 py-2 text-primary-700 hover:bg-primary-50 rounded-lg font-medium transition-colors"
                >
                  <RotateCcw size={18} />
                  Terug naar origineel
                </button>
              )}
            </div>
          </div>

          {/* Achtergrond afbeelding sectie */}
          <div>
            <h3 className="text-base font-medium text-gray-900 mb-2">Achtergrondafbeelding</h3>
            <p className="text-sm text-gray-600 mb-4">
              Upload een eigen achtergrond die je ziet wanneer je Benji gebruikt.
            </p>
            {preferencesData?.backgroundImageUrl && (
              <div className="mb-4 relative inline-block">
                <div className="rounded-lg overflow-hidden border border-primary-200">
                  <img
                    src={preferencesData.backgroundImageUrl}
                    alt="Je achtergrond"
                    className="w-full h-32 object-cover"
                  />
                </div>
                <button
                  type="button"
                  onClick={handleRemoveBackground}
                  className="absolute top-2 right-2 p-2 bg-red-500/90 text-white rounded-lg hover:bg-red-600 transition-colors"
                  aria-label="Achtergrond verwijderen"
                >
                  <Trash2 size={18} />
                </button>
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

        {/* Installeer als app */}
        <div className="bg-white rounded-xl border border-primary-200 p-6">
          <div className="flex items-center gap-3 mb-4">
            <Smartphone size={24} className="text-primary-500" />
            <h2 className="text-lg font-semibold text-primary-900">
              TalkToBenji op je telefoon
            </h2>
          </div>
          <div className="flex flex-col items-center gap-5">
            <div className="flex flex-col sm:flex-row gap-5 items-center">
              <p className="text-sm text-gray-600">
                Wist je dat je TalkToBenji als app op je telefoon kunt zetten? Het werkt net als een
                gewone app, zonder dat je iets hoeft te downloaden uit de App Store of Play Store.
                Zo heb je Benji altijd binnen handbereik — één tik en je bent er.
              </p>
            </div>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/images/benji-app-homescreen.png"
              alt="Benji app op je beginscherm"
              className="w-full max-w-sm rounded-xl"
            />
            <button
              type="button"
              onClick={() => setShowInstallPopup(true)}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-primary-600 text-white rounded-lg font-medium hover:bg-primary-700 transition-colors"
            >
              <Smartphone size={18} />
              Hoe installeer ik de app?
            </button>
          </div>
        </div>

        {/* Installatie popup */}
        {showInstallPopup && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40" onClick={() => setShowInstallPopup(false)}>
            <div
              className="bg-white rounded-2xl shadow-xl max-w-md w-full max-h-[85vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between p-5 border-b border-gray-100">
                <h3 className="text-lg font-semibold text-primary-900">Installeer TalkToBenji</h3>
                <button
                  type="button"
                  onClick={() => setShowInstallPopup(false)}
                  className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors"
                  aria-label="Sluiten"
                >
                  <X size={20} className="text-gray-500" />
                </button>
              </div>

              <div className="p-5 space-y-6">
                {/* iPhone instructies */}
                <div>
                  <h4 className="font-semibold text-primary-900 mb-3 flex items-center gap-2">
                    <span className="w-7 h-7 rounded-full bg-primary-100 text-primary-700 flex items-center justify-center text-sm font-bold">🍎</span>
                    iPhone (Safari)
                  </h4>
                  <ol className="space-y-2 text-sm text-gray-700">
                    <li className="flex gap-2">
                      <span className="w-5 h-5 rounded-full bg-primary-100 text-primary-700 flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5">1</span>
                      <span>Open <strong>talktobenji.nl</strong> in <strong>Safari</strong></span>
                    </li>
                    <li className="flex gap-2">
                      <span className="w-5 h-5 rounded-full bg-primary-100 text-primary-700 flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5">2</span>
                      <span>Tik op het <strong>deel-icoon</strong> (vierkantje met pijl omhoog) onderaan het scherm</span>
                    </li>
                    <li className="flex gap-2">
                      <span className="w-5 h-5 rounded-full bg-primary-100 text-primary-700 flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5">3</span>
                      <span>Scroll naar beneden en tik op <strong>&quot;Zet op beginscherm&quot;</strong></span>
                    </li>
                    <li className="flex gap-2">
                      <span className="w-5 h-5 rounded-full bg-primary-100 text-primary-700 flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5">4</span>
                      <span>Tik op <strong>&quot;Voeg toe&quot;</strong> — klaar!</span>
                    </li>
                  </ol>
                </div>

                <hr className="border-gray-100" />

                {/* Android instructies */}
                <div>
                  <h4 className="font-semibold text-primary-900 mb-3 flex items-center gap-2">
                    <span className="w-7 h-7 rounded-full bg-primary-100 text-primary-700 flex items-center justify-center text-sm font-bold">🤖</span>
                    Android (Chrome)
                  </h4>
                  <ol className="space-y-2 text-sm text-gray-700">
                    <li className="flex gap-2">
                      <span className="w-5 h-5 rounded-full bg-primary-100 text-primary-700 flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5">1</span>
                      <span>Open <strong>talktobenji.nl</strong> in <strong>Chrome</strong></span>
                    </li>
                    <li className="flex gap-2">
                      <span className="w-5 h-5 rounded-full bg-primary-100 text-primary-700 flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5">2</span>
                      <span>Tik op de <strong>drie puntjes</strong> (⋮) rechtsboven</span>
                    </li>
                    <li className="flex gap-2">
                      <span className="w-5 h-5 rounded-full bg-primary-100 text-primary-700 flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5">3</span>
                      <span>Tik op <strong>&quot;Toevoegen aan startscherm&quot;</strong></span>
                    </li>
                    <li className="flex gap-2">
                      <span className="w-5 h-5 rounded-full bg-primary-100 text-primary-700 flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5">4</span>
                      <span>Bevestig door op <strong>&quot;Toevoegen&quot;</strong> te tikken — klaar!</span>
                    </li>
                  </ol>
                </div>
              </div>

              <div className="p-5 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setShowInstallPopup(false)}
                  className="w-full px-4 py-2.5 bg-primary-600 text-white rounded-lg font-medium hover:bg-primary-700 transition-colors"
                >
                  Begrepen!
                </button>
              </div>
            </div>
          </div>
        )}
    </div>
  );
}
