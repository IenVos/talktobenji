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
      <div className="w-full text-center px-4 py-2">
        <div className="flex flex-wrap justify-center gap-x-4 gap-y-1 text-[10px] sm:text-xs text-primary-300">
          <Link href="/faq" className="hover:text-primary-100 transition-colors">Veelgestelde vragen</Link>
          <Link href="/privacy" className="hover:text-primary-100 transition-colors">Privacy</Link>
          <Link href="/blog" className="hover:text-primary-100 transition-colors">Blog</Link>
          <ErvaringenTrigger className="hover:text-primary-100 transition-colors cursor-pointer">Ervaringen</ErvaringenTrigger>
          <Link href="/contact" className="hover:text-primary-100 transition-colors">Contact</Link>
        </div>
      </div>
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
