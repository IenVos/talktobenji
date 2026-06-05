"use client";

import { useState } from "react";
import Link from "next/link";

export function HouvasteKnop({ type }: { type?: string }) {
  const [zichtbaar, setZichtbaar] = useState(true);

  if (!zichtbaar) return null;

  const href = type ? `/houvast/gids?type=${encodeURIComponent(type)}` : "/houvast/gids";

  return (
    <div className="fixed bottom-20 right-4 z-40 flex items-center">
      <Link
        href={href}
        className="flex items-center gap-2 text-white text-sm font-medium px-4 py-2.5 rounded-full shadow-lg transition-colors"
        style={{ backgroundColor: "#7ec8e3" }}
        onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#5bb8d4")}
        onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "#7ec8e3")}
        aria-label="Even Houvast — gratis mini-gids"
      >
        <span className="text-base leading-none">👋</span>
        Even Houvast
      </Link>
      <button
        onClick={() => setZichtbaar(false)}
        className="ml-1.5 flex items-center justify-center w-5 h-5 rounded-full bg-white/80 text-gray-500 hover:bg-white hover:text-gray-800 transition-colors text-xs font-bold shadow"
        aria-label="Sluit"
      >
        ✕
      </button>
    </div>
  );
}
