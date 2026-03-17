"use client";

import { useState } from "react";
import { HeaderBar } from "@/components/chat/HeaderBar";
import { CheckCircle, Send } from "lucide-react";

export default function ContactPage() {
  const [naam, setNaam] = useState("");
  const [email, setEmail] = useState("");
  const [bericht, setBericht] = useState("");
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!naam.trim() || !email.trim() || !bericht.trim()) return;
    setSending(true);
    setError("");
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ naam, email, bericht }),
      });
      if (!res.ok) throw new Error("Versturen mislukt");
      setSent(true);
    } catch {
      setError("Er ging iets mis. Probeer het opnieuw of mail direct naar contactmetien@talktobenji.com.");
    } finally {
      setSending(false);
    }
  };

  return (
    <div
      className="min-h-screen flex flex-col"
      style={{
        backgroundImage: "linear-gradient(rgba(255,255,255,0.85), rgba(255,255,255,0.85)), url(/images/achtergrond.png)",
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundRepeat: "no-repeat",
      }}
    >
      <HeaderBar />

      <main className="flex-1 flex items-center justify-center px-4 py-12">
        <div className="max-w-md w-full space-y-6">

          <div className="text-center space-y-2">
            <h1 className="text-2xl font-semibold text-gray-900">Contact</h1>
            <p className="text-sm text-gray-600">
              Heb je een vraag of wil je iets kwijt? Ik lees alles.
            </p>
          </div>

          {sent ? (
            <div className="bg-white/80 backdrop-blur-sm rounded-xl border border-primary-200 p-8 text-center space-y-3">
              <CheckCircle size={40} className="text-primary-600 mx-auto" />
              <p className="font-medium text-gray-900">Bericht ontvangen</p>
              <p className="text-sm text-gray-600">
                Bedankt voor je bericht. Ik reageer zo snel mogelijk.
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="bg-white/80 backdrop-blur-sm rounded-xl border border-primary-200 p-6 space-y-4">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1.5">Naam</label>
                <input
                  type="text"
                  value={naam}
                  onChange={(e) => setNaam(e.target.value)}
                  placeholder="Je naam"
                  required
                  className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-400 bg-white"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1.5">E-mailadres</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="jouw@email.nl"
                  required
                  className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-400 bg-white"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1.5">Bericht</label>
                <textarea
                  value={bericht}
                  onChange={(e) => setBericht(e.target.value)}
                  placeholder="Schrijf hier je bericht..."
                  required
                  rows={5}
                  className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-400 bg-white resize-none"
                />
              </div>

              {error && (
                <p className="text-xs text-red-600">{error}</p>
              )}

              <button
                type="submit"
                disabled={sending || !naam.trim() || !email.trim() || !bericht.trim()}
                className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-primary-600 text-white rounded-xl font-medium text-sm hover:bg-primary-700 transition-colors disabled:opacity-50"
              >
                <Send size={16} />
                {sending ? "Versturen..." : "Verstuur bericht"}
              </button>

              <p className="text-xs text-center text-gray-400">
                Of mail direct naar{" "}
                <a href="mailto:contactmetien@talktobenji.com" className="text-primary-600 hover:underline">
                  contactmetien@talktobenji.com
                </a>
              </p>
            </form>
          )}
        </div>
      </main>
    </div>
  );
}
