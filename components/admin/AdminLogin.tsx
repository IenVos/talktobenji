"use client";

import { useState } from "react";
import Image from "next/image";

interface AdminLoginProps {
  onLogin: () => void;
}

export function AdminLogin({ onLogin }: AdminLoginProps) {
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });

      const data = await res.json().catch(() => ({}));

      if (res.ok) {
        onLogin();
      } else if (res.status === 500 && data.error?.includes("not configured")) {
        setError("Admin-wachtwoord niet geconfigureerd. Zet ADMIN_PASSWORD in .env.local (lokaal) of in Vercel Environment Variables.");
      } else {
        setError(data.error || "Onjuist wachtwoord");
      }
    } catch {
      setError("Er ging iets mis. Controleer je internetverbinding.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen min-h-[100dvh] bg-primary-900 flex items-center justify-center p-4">
      <div className="bg-primary-800/50 backdrop-blur-sm rounded-xl border border-primary-700 p-6 sm:p-8 w-full max-w-md">
        <div className="text-center mb-6 sm:mb-8">
          <div className="w-14 h-14 sm:w-16 sm:h-16 mx-auto mb-4 flex items-center justify-center overflow-hidden">
            <Image src="/images/benji-logo-2.png" alt="Talk To Benji" width={64} height={64} className="object-contain h-full w-auto" style={{ width: "auto", height: "auto" }} />
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-white">Talk To Benji</h1>
          <p className="text-sm sm:text-base text-primary-300 mt-2">Admin Panel – voer je wachtwoord in</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-primary-200 mb-1">
              Wachtwoord
            </label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 bg-primary-900 border border-primary-700 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none text-base text-white placeholder-primary-500"
              placeholder="Voer wachtwoord in..."
              required
              autoFocus
            />
          </div>

          {error && (
            <p className="text-red-400 text-sm">{error}</p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-primary-700 text-white font-medium rounded-lg hover:bg-primary-600 transition-all disabled:opacity-50 border border-primary-600"
          >
            {loading ? "Laden..." : "Inloggen"}
          </button>
        </form>
      </div>
    </div>
  );
}
