"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";

const AFSCHEIDSGROETEN = [
  (naam: string) => `Pas goed op jezelf${naam ? `, ${naam}` : ""}.\nJe bent het waard.`,
  (naam: string) => `Tot de volgende keer${naam ? `, ${naam}` : ""}.\nBenji is er altijd voor je.`,
  (_naam: string) => `Neem de rust die je nodig hebt.\nJe doet het goed.`,
  (naam: string) => `Fijn dat je er was${naam ? `, ${naam}` : ""}.\nTot snel!`,
  (_naam: string) => `Vergeet niet: je bent niet alleen.\nTot de volgende keer.`,
  (naam: string) => `Ga lief voor jezelf zijn${naam ? `, ${naam}` : ""}.\nTot gauw!`,
  (_naam: string) => `Bedankt voor dit gesprek.\nJe mag er zijn.`,
  (_naam: string) => `Tot ziens!\nOnthoud: elke stap telt, hoe klein ook.`,
  (_naam: string) => `Wees zacht voor jezelf vandaag.\nTot de volgende keer.`,
  (naam: string) => `Je bent sterker dan je denkt.\nTot snel, ${naam ? naam : "lief mens"}.`,
];

export default function AfscheidPage() {
  const [groet, setGroet] = useState("");

  useEffect(() => {
    const naam = (() => { try { return localStorage.getItem("benji_user_name") ?? ""; } catch { return ""; } })();
    const fn = AFSCHEIDSGROETEN[Math.floor(Math.random() * AFSCHEIDSGROETEN.length)];
    setGroet(fn(naam));
    // Clear all user data so homepage shows the original welcome screen after logout
    try {
      localStorage.removeItem("benji_session_id");
      localStorage.removeItem("benji_has_chatted");
      localStorage.removeItem("benji_accent_color");
      localStorage.removeItem("benji_user_name");
      localStorage.removeItem("benji_anonymous_id");
    } catch {}
  }, []);

  return (
    <div
      className="relative min-h-screen flex flex-col items-center justify-center p-6"
      style={{
        backgroundImage: "url(/images/afscheid-bg.png)",
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundRepeat: "no-repeat",
      }}
    >
      <div className="text-center max-w-sm">
        <p className="text-lg text-gray-700 leading-relaxed mb-8 italic whitespace-pre-line">
          &ldquo;{groet}&rdquo;
        </p>
        <Link
          href="/"
          className="inline-flex items-center gap-2 py-3 px-6 bg-primary-600 text-white font-medium rounded-lg hover:bg-primary-700 transition-colors"
        >
          Terug naar startpagina
        </Link>
      </div>

      {/* Logo rechtsonder op de donkere steen */}
      <div className="absolute bottom-6 right-6">
        <Image
          src="/images/benji-logo-2.png"
          alt="Benji"
          width={48}
          height={48}
          className="object-contain opacity-80"
          style={{ width: "auto", height: "auto" }}
        />
      </div>
    </div>
  );
}
