"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { ChevronDown } from "lucide-react";

const COOKIE_CONSENT_KEY = "benji_cookie_consent";

type CookiePrefs = {
  necessary: boolean;
  analytics: boolean;
};

function loadPrefs(): CookiePrefs | null {
  if (typeof window === "undefined") return null;
  const stored = localStorage.getItem(COOKIE_CONSENT_KEY);
  if (!stored) return null;
  try {
    const parsed = JSON.parse(stored);
    if (parsed.necessary !== undefined && parsed.analytics !== undefined) return parsed;
    if (stored === "true" || stored === "all") return { necessary: true, analytics: true };
  } catch {
    if (stored === "true") return { necessary: true, analytics: true };
  }
  return null;
}

export function CookieConsentBanner() {
  const [show, setShow] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [analytics, setAnalytics] = useState(true);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const prefs = loadPrefs();
    setShow(prefs === null);
    if (prefs) setAnalytics(prefs.analytics);
  }, []);

  const saveAndClose = (prefs: CookiePrefs) => {
    if (typeof window !== "undefined") {
      localStorage.setItem(COOKIE_CONSENT_KEY, JSON.stringify(prefs));
      setShow(false);
    }
  };

  const handleAcceptAll = () => saveAndClose({ necessary: true, analytics: true });
  const handleNecessaryOnly = () => saveAndClose({ necessary: true, analytics: false });

  const handleSaveSettings = () => saveAndClose({ necessary: true, analytics });

  if (!show) return null;

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.45)" }}>
      <div className="w-full max-w-sm bg-white rounded-2xl shadow-xl p-6 space-y-4">
        <p className="text-sm text-stone-600 leading-relaxed">
          We gebruiken cookies om de site goed te laten werken en om anonieme statistieken te verzamelen. Lees meer in ons{" "}
          <Link href="/privacy" className="text-primary-600 hover:underline">
            privacybeleid
          </Link>
          .
        </p>

        {showSettings ? (
          <div className="space-y-3">
            <div className="flex items-center justify-between py-2 border-t border-stone-100">
              <span className="text-sm text-stone-700">Noodzakelijke cookies</span>
              <span className="text-xs text-stone-400">Altijd actief</span>
            </div>
            <div className="flex items-center justify-between py-2 border-t border-stone-100">
              <div>
                <span className="text-sm text-stone-700">Statistieken</span>
                <p className="text-xs text-stone-400">Anonieme data om de site te verbeteren</p>
              </div>
              <button
                type="button"
                role="switch"
                aria-checked={analytics}
                onClick={() => setAnalytics((a) => !a)}
                className={`relative w-11 h-6 rounded-full transition-colors ${analytics ? "bg-primary-500" : "bg-stone-200"}`}
              >
                <span
                  className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all shadow-sm ${analytics ? "left-6" : "left-1"}`}
                />
              </button>
            </div>
            <div className="flex flex-wrap gap-2 pt-1">
              <button
                type="button"
                onClick={handleSaveSettings}
                className="px-4 py-2 bg-primary-600 text-white text-sm font-medium rounded-lg hover:bg-primary-700 transition-colors"
              >
                Opslaan
              </button>
              <button
                type="button"
                onClick={() => setShowSettings(false)}
                className="px-4 py-2 text-stone-500 hover:text-stone-700 text-sm font-medium"
              >
                Terug
              </button>
            </div>
          </div>
        ) : (
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={handleAcceptAll}
              className="px-4 py-2 bg-primary-600 text-white text-sm font-medium rounded-lg hover:bg-primary-700 transition-colors"
            >
              Akkoord
            </button>
            <button
              type="button"
              onClick={handleNecessaryOnly}
              className="px-4 py-2 bg-stone-100 text-stone-700 text-sm font-medium rounded-lg hover:bg-stone-200 transition-colors"
            >
              Alleen noodzakelijke
            </button>
            <button
              type="button"
              onClick={() => setShowSettings(true)}
              className="px-4 py-2 text-stone-500 hover:text-stone-700 text-sm font-medium inline-flex items-center gap-1"
            >
              Instellingen
              <ChevronDown size={16} />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
