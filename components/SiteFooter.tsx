"use client";

import Link from "next/link";
import { ErvaringenTrigger } from "./ErvaringenPopup";

interface SiteFooterProps {
  variant?: "light" | "dark";
}

export function SiteFooter({ variant = "light" }: SiteFooterProps) {
  const isDark = variant === "dark";

  if (isDark) {
    return (
      <footer className="bg-[#2d3748] px-5 py-8 text-center">
        <div className="flex flex-wrap justify-center gap-x-6 gap-y-2 text-xs text-white/50 mb-4">
          <Link href="/faq" className="hover:text-white/80 transition-colors">Veelgestelde vragen</Link>
          <Link href="/privacy" className="hover:text-white/80 transition-colors">Privacy</Link>
          <Link href="/algemene-voorwaarden" className="hover:text-white/80 transition-colors">Algemene voorwaarden</Link>
          <Link href="/blog" className="hover:text-white/80 transition-colors">Blog</Link>
          <ErvaringenTrigger className="hover:text-white/80 transition-colors cursor-pointer text-white/50">Ervaringen</ErvaringenTrigger>
          <Link href="/contact" className="hover:text-white/80 transition-colors">Contact</Link>
        </div>
        <p className="text-[11px] text-white/25">© Talk To Benji · talktobenji.com</p>
      </footer>
    );
  }

  return (
    <footer className="border-t px-5 py-8 text-center" style={{ borderColor: "rgba(0,0,0,0.07)" }}>
      <div className="max-w-xs mx-auto space-y-3">
        <div className="grid grid-cols-3 gap-x-4 gap-y-2 text-xs" style={{ color: "#8a8078" }}>
          <Link href="/faq" className="hover:underline">Veelgestelde vragen</Link>
          <Link href="/privacy" className="hover:underline">Privacy</Link>
          <Link href="/algemene-voorwaarden" className="hover:underline">Algemene voorwaarden</Link>
          <Link href="/blog" className="hover:underline">Blog</Link>
          <ErvaringenTrigger className="hover:underline cursor-pointer" style={{ color: "#8a8078" }}>Ervaringen</ErvaringenTrigger>
          <Link href="/contact" className="hover:underline">Contact</Link>
        </div>
        <p className="text-xs" style={{ color: "#a09890" }}>© Talk To Benji · talktobenji.com</p>
      </div>
    </footer>
  );
}
