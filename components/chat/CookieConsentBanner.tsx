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

  const reopenBanner = () => {
    if (typeof window !== "undefined") {
      localStorage.removeItem(COOKIE_CONSENT_KEY);
      setShow(true);
    }
  };

  if (!show) {
    return (
      <button
        type="button"
        onClick={reopenBanner}
        className="fixed bottom-4 right-4 z-[9997] px-3 py-1.5 text-xs text-primary-500 hover:text-primary-600 bg-white/90 hover:bg-white border border-primary-200 rounded-lg shadow-sm transition-colors"
      >
        Cookie-instellingen
      </button>
    );
  }

  return (
    <div
      className="fixed bottom-0 left-0 right-0 z-[9998] p-4 sm:p-5 bg-primary-800 border-t border-primary-700 shadow-[0_-4px_12px_rgba(0,0,0,0.2)]"
      style={{ paddingBottom: "max(1rem, calc(0.5rem + env(safe-area-inset-bottom)))" }}
    >
      <div className="max-w-2xl mx-auto space-y-4">
        <p className="text-sm text-primary-100">
          We gebruiken cookies om de site goed te laten werken en om anonieme statistieken te verzamelen. Lees meer in ons{" "}
          <Link href="/privacy" className="text-primary-300 hover:text-primary-200 underline">
            privacybeleid
          </Link>
          .
        </p>

        {showSettings ? (
          <div className="space-y-3">
            <div className="flex items-center justify-between py-2 border-t border-primary-700">
              <span className="text-sm text-primary-100">Noodzakelijke cookies</span>
              <span className="text-xs text-primary-300">Altijd actief</span>
            </div>
            <div className="flex items-center justify-between py-2 border-t border-primary-700">
              <div>
                <span className="text-sm text-primary-100">Statistieken</span>
                <p className="text-xs text-primary-400">Anonieme data om de site te verbeteren</p>
              </div>
              <button
                type="button"
                role="switch"
                aria-checked={analytics}
                onClick={() => setAnalytics((a) => !a)}
                className={`relative w-11 h-6 rounded-full transition-colors ${analytics ? "bg-primary-500" : "bg-primary-700"}`}
              >
                <span
                  className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all ${analytics ? "left-6" : "left-1"}`}
                />
              </button>
            </div>
            <div className="flex flex-wrap gap-2 pt-2">
              <button
                type="button"
                onClick={handleSaveSettings}
                className="px-4 py-2 bg-primary-500 text-white text-sm font-medium rounded-lg hover:bg-primary-400 transition-colors"
              >
                Instellingen opslaan
              </button>
              <button
                type="button"
                onClick={() => setShowSettings(false)}
                className="px-4 py-2 text-primary-300 hover:text-primary-100 text-sm font-medium"
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
              className="px-4 py-2 bg-primary-500 text-white text-sm font-medium rounded-lg hover:bg-primary-400 transition-colors"
            >
              Akkoord
            </button>
            <button
              type="button"
              onClick={handleNecessaryOnly}
              className="px-4 py-2 bg-primary-700 text-primary-100 text-sm font-medium rounded-lg hover:bg-primary-600 transition-colors border border-primary-600"
            >
              Alleen noodzakelijke
            </button>
            <button
              type="button"
              onClick={() => setShowSettings(true)}
              className="px-4 py-2 text-primary-300 hover:text-primary-100 text-sm font-medium inline-flex items-center gap-1"
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
