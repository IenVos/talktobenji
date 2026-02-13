"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";

const AFSCHEIDSGROETEN = [
  "Pas goed op jezelf.\nJe bent het waard.",
  "Tot de volgende keer.\nBenji is er altijd voor je.",
  "Neem de rust die je nodig hebt.\nJe doet het goed.",
  "Fijn dat je er was.\nTot snel!",
  "Vergeet niet: je bent niet alleen.\nTot de volgende keer.",
  "Ga lief voor jezelf zijn.\nTot gauw!",
  "Bedankt voor dit gesprek.\nJe mag er zijn.",
  "Tot ziens!\nOnthoud: elke stap telt, hoe klein ook.",
  "Wees zacht voor jezelf vandaag.\nTot de volgende keer.",
  "Je bent sterker dan je denkt.\nTot snel, lief mens.",
];

export default function AfscheidPage() {
  const [groet, setGroet] = useState("");

  useEffect(() => {
    setGroet(AFSCHEIDSGROETEN[Math.floor(Math.random() * AFSCHEIDSGROETEN.length)]);
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
    <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-gradient-to-b from-white to-primary-50">
      <div className="text-center max-w-sm">
        <Image
          src="/images/benji-logo-2.png"
          alt="Benji"
          width={64}
          height={64}
          className="mx-auto object-contain mb-6"
          style={{ width: "auto", height: "auto" }}
        />
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
    </div>
  );
}
