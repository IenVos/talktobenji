"use client";

import Link from "next/link";
import { useState } from "react";
import { Lock, AlertTriangle } from "lucide-react";

export type CtaData = {
  eyebrow?: string;
  title: string;
  body: string;
  buttonText: string;
  buttonUrl?: string;
  footnote?: string;
  showImage: boolean;
  imageUrl?: string | null;
  bgColor?: string;
  borderColor?: string;
  buttonColor?: string;
};

const DEFAULT_A: CtaData = {
  eyebrow: "Talk To Benji",
  title: "Misschien is dit het moment.",
  body: "Benji luistert zonder oordeel, zonder haast, en is er altijd voor je.",
  buttonText: "Kijk of het bij je past",
  showImage: false,
};

const DEFAULT_B: CtaData = {
  eyebrow: "Talk To Benji",
  title: "Soms wil je gewoon ergens heen kunnen.",
  body: "Benji is er voor de momenten dat je het moeilijk hebt. Een gesprek, een dagelijkse check-in, herinneringen bewaren — op jouw tempo, wanneer jij er behoefte aan hebt.",
  buttonText: "Kijk of het bij je past",
  showImage: true,
};

function DisclaimerIcons({ bg }: { bg: string }) {
  const [popup, setPopup] = useState<"lock" | "warning" | null>(null);
  const color = "color-mix(in srgb, #000 35%, " + bg + ")";

  return (
    <div className="flex items-center justify-center gap-3">
      <div className="relative">
        <button
          type="button"
          onClick={() => setPopup(popup === "lock" ? null : "lock")}
          className="p-1 transition-opacity hover:opacity-70"
          aria-label="Privacy"
          style={{ color }}
        >
          <Lock size={12} />
        </button>
        {popup === "lock" && (
          <>
            <div className="fixed inset-0 z-40" onClick={() => setPopup(null)} />
            <div className="absolute bottom-8 left-1/2 -translate-x-1/2 bg-white text-gray-700 text-xs px-3 py-2 rounded-lg shadow-lg z-50 whitespace-nowrap">
              Gesprekken zijn privé en beveiligd.
              <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-white" />
            </div>
          </>
        )}
      </div>
      <div className="relative">
        <button
          type="button"
          onClick={() => setPopup(popup === "warning" ? null : "warning")}
          className="p-1 transition-opacity hover:opacity-70"
          aria-label="Disclaimer"
          style={{ color }}
        >
          <AlertTriangle size={12} />
        </button>
        {popup === "warning" && (
          <>
            <div className="fixed inset-0 z-40" onClick={() => setPopup(null)} />
            <div className="absolute bottom-8 left-1/2 -translate-x-1/2 bg-white text-gray-700 text-xs px-3 py-2 rounded-lg shadow-lg z-50 whitespace-nowrap">
              Geen vervanging van professionele hulp.
              <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-white" />
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function CtaBlockInner({ data }: { data: CtaData }) {
  const bg = data.bgColor || "#f5f0eb";
  const btnColor = data.buttonColor || "#6d84a8";
  const borderStyle = data.borderColor
    ? { border: `2px solid ${data.borderColor}` }
    : {};

  return (
    <div
      className="mt-12 rounded-2xl overflow-hidden"
      style={{ background: bg, ...borderStyle }}
    >
      <div className="px-7 pt-7 pb-4 text-center">
        {data.eyebrow && (
          <p className="text-xs uppercase tracking-widest mb-3" style={{ color: "color-mix(in srgb, #000 40%, " + bg + ")" }}>
            {data.eyebrow}
          </p>
        )}
        <p className="text-xl font-semibold leading-snug mb-2" style={{ color: "color-mix(in srgb, #000 75%, " + bg + ")" }}>
          {data.title}
        </p>
        <p className="text-[15px] leading-relaxed max-w-[260px] mx-auto mb-0" style={{ color: "color-mix(in srgb, #000 50%, " + bg + ")" }}>
          {data.body}
        </p>
      </div>

      {(data.imageUrl || data.showImage) && (
        <div className="px-6 pb-2">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={data.imageUrl || "/images/app-screenshot.png"}
            alt="Talk To Benji"
            className="w-full rounded-xl border border-stone-200 shadow-sm"
          />
        </div>
      )}

      <div className="px-7 pb-5 pt-4 text-center">
        <Link
          href={data.buttonUrl?.trim() || "/"}
          className="inline-block text-white text-sm font-semibold px-6 py-3 rounded-xl transition-opacity hover:opacity-90"
          style={{ background: btnColor }}
        >
          {data.buttonText}
        </Link>
        <div className="mt-3">
          <DisclaimerIcons bg={bg} />
        </div>
      </div>
    </div>
  );
}

export function CtaBlockA({ data }: { data?: CtaData | null }) {
  return <CtaBlockInner data={data ?? DEFAULT_A} />;
}

export function CtaBlockB({ data }: { data?: CtaData | null }) {
  return <CtaBlockInner data={data ?? DEFAULT_B} />;
}
