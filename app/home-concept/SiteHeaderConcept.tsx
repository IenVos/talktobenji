"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import Link from "next/link";
import Image from "next/image";
import { Menu, X } from "lucide-react";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";

function ChevronDown({ size = 14 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <polyline points="6 9 12 15 18 9" />
    </svg>
  );
}

const OVER_ITEMS = [
  { href: "/waarom-benji", label: "Waarom Benji" },
  { href: "/blog", label: "Blog" },
];

// "Voor jou" opent direct de verliestype-LP (geen tussenpagina/extra klik meer).
// Standaardlijst; in de admin (Pagina's > Homepage > Menu "Voor jou") aanpasbaar.
const VOOR_JOU_ITEMS = [
  { href: "/lp/zij-aan-zij", label: "Ik mis iemand" },
  { href: "/lp/mijn-relatie-is-voorbij", label: "Mijn relatie is voorbij" },
  { href: "/lp/zij-aan-zij-kinderloos", label: "Ongewenst kinderloos" },
  { href: "/lp/je-hoeft-het-niet-alleen-te-doen#huisdier", label: "Verlies van een huisdier" },
  { href: "/lp/je-hoeft-het-niet-alleen-te-doen#eenzaamheid", label: "Ik voel me eenzaam" },
];

const NAV_LINKS = [
  { href: "/talk-to-people", label: "T2P", title: "Talk To People", external: false },
  { href: "/inloggen", label: "Inloggen", external: false },
];

export function SiteHeaderConcept() {
  const [open, setOpen] = useState(false);
  const [overOpen, setOverOpen] = useState(false);
  const [voorOpen, setVoorOpen] = useState(false);
  const [mobileOverOpen, setMobileOverOpen] = useState(false);
  const [mobileVoorOpen, setMobileVoorOpen] = useState(false);
  const overRef = useRef<HTMLDivElement>(null);
  const voorRef = useRef<HTMLDivElement>(null);

  // "Voor jou"-items uit de admin (Homepage-content); val terug op de standaardlijst.
  const homepageContent = useQuery(api.pageContent.getPublicPageContent, { pageKey: "homepage" });
  const voorJouItems = useMemo(() => {
    const raw = homepageContent?.voorJouMenu;
    if (raw) {
      try {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) {
          const items = parsed
            .map((x: any) => ({ href: (x?.url ?? x?.href ?? "").trim(), label: (x?.label ?? "").trim() }))
            .filter((x: any) => x.label && x.href);
          if (items.length) return items;
        }
      } catch {}
    }
    return VOOR_JOU_ITEMS;
  }, [homepageContent]);

  // Sluit de dropdowns bij klik buiten
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (overRef.current && !overRef.current.contains(e.target as Node)) {
        setOverOpen(false);
      }
      if (voorRef.current && !voorRef.current.contains(e.target as Node)) {
        setVoorOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  return (
    <header className="sticky top-0 z-50 bg-primary-900 border-b border-primary-800">
      <div className="max-w-5xl mx-auto px-6 h-16 flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2.5 flex-shrink-0">
          <Image
            src="/images/benji-logo-2.png"
            alt="Benji"
            width={32}
            height={32}
            className="rounded-lg"
          />
          <span className="font-semibold text-white text-sm tracking-tight">Talk To Benji</span>
        </Link>

        {/* Desktop nav */}
        <nav className="hidden md:flex items-center gap-7">
          {/* Over — dropdown */}
          <div className="relative" ref={overRef}>
            <button
              onClick={() => setOverOpen((v) => !v)}
              aria-haspopup="true"
              aria-expanded={overOpen}
              className="flex items-center gap-1 text-sm text-primary-300 hover:text-white transition-colors"
            >
              Over
              <span className={`transition-transform ${overOpen ? "rotate-180" : ""}`}>
                <ChevronDown />
              </span>
            </button>
            {overOpen && (
              <div className="absolute top-full left-0 mt-2 w-44 bg-primary-800 rounded-xl shadow-xl border border-primary-700 overflow-hidden">
                {OVER_ITEMS.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setOverOpen(false)}
                    className="block px-4 py-3 text-sm text-primary-200 hover:text-white hover:bg-primary-700 transition-colors"
                  >
                    {item.label}
                  </Link>
                ))}
              </div>
            )}
          </div>

          {/* Voor jou — dropdown met verliestypes, direct naar de LP */}
          <div className="relative" ref={voorRef}>
            <button
              onClick={() => setVoorOpen((v) => !v)}
              aria-haspopup="true"
              aria-expanded={voorOpen}
              className="flex items-center gap-1 text-sm text-primary-300 hover:text-white transition-colors"
            >
              Voor jou
              <span className={`transition-transform ${voorOpen ? "rotate-180" : ""}`}>
                <ChevronDown />
              </span>
            </button>
            {voorOpen && (
              <div className="absolute top-full left-0 mt-2 w-64 bg-primary-800 rounded-xl shadow-xl border border-primary-700 overflow-hidden">
                {voorJouItems.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setVoorOpen(false)}
                    className="block px-4 py-3 text-sm text-primary-200 hover:text-white hover:bg-primary-700 transition-colors"
                  >
                    {item.label}
                  </Link>
                ))}
              </div>
            )}
          </div>

          {/* Overige nav-items */}
          {NAV_LINKS.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              title={"title" in l ? l.title : undefined}
              className="text-sm text-primary-300 hover:text-white transition-colors"
              {...(l.external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
            >
              {l.label}
            </Link>
          ))}
        </nav>

        {/* Desktop CTA */}
        <Link
          href="/benji"
          className="hidden md:inline-flex items-center px-4 py-2 rounded-xl bg-white text-primary-900 text-sm font-semibold hover:bg-primary-50 transition-colors"
        >
          Start gesprek met Benji
        </Link>

        {/* Hamburger — mobiel menu-knop in de header */}
        <button
          onClick={() => setOpen((v) => !v)}
          className="md:hidden p-2 rounded-lg text-primary-200 hover:text-white transition-colors"
          aria-label={open ? "Menu sluiten" : "Menu openen"}
        >
          {open ? <X size={22} /> : <Menu size={22} />}
        </button>
      </div>

      {/* Mobiel uitklapmenu */}
      {open && (
        <div className="md:hidden bg-primary-900 border-t border-primary-800 px-6 py-5 space-y-1">
          {/* Over — uitklapbaar submenu */}
          <div>
            <button
              onClick={() => setMobileOverOpen((v) => !v)}
              aria-haspopup="true"
              aria-expanded={mobileOverOpen}
              className="flex items-center gap-1 w-full text-sm text-primary-300 hover:text-white py-2.5 transition-colors"
            >
              Over
              <span className={`transition-transform ml-1 ${mobileOverOpen ? "rotate-180" : ""}`}>
                <ChevronDown />
              </span>
            </button>
            {mobileOverOpen && (
              <div className="ml-4 mt-0.5 space-y-0.5 border-l border-primary-700 pl-3">
                {OVER_ITEMS.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => { setOpen(false); setMobileOverOpen(false); }}
                    className="block text-sm text-primary-300 hover:text-white py-2 transition-colors"
                  >
                    {item.label}
                  </Link>
                ))}
              </div>
            )}
          </div>

          {/* Voor jou — uitklapbaar submenu */}
          <div>
            <button
              onClick={() => setMobileVoorOpen((v) => !v)}
              aria-haspopup="true"
              aria-expanded={mobileVoorOpen}
              className="flex items-center gap-1 w-full text-sm text-primary-300 hover:text-white py-2.5 transition-colors"
            >
              Voor jou
              <span className={`transition-transform ml-1 ${mobileVoorOpen ? "rotate-180" : ""}`}>
                <ChevronDown />
              </span>
            </button>
            {mobileVoorOpen && (
              <div className="ml-4 mt-0.5 space-y-0.5 border-l border-primary-700 pl-3">
                {voorJouItems.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => { setOpen(false); setMobileVoorOpen(false); }}
                    className="block text-sm text-primary-300 hover:text-white py-2 transition-colors"
                  >
                    {item.label}
                  </Link>
                ))}
              </div>
            )}
          </div>

          {NAV_LINKS.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              onClick={() => setOpen(false)}
              title={"title" in l ? l.title : undefined}
              className="block text-sm text-primary-300 hover:text-white py-2.5 transition-colors"
              {...(l.external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
            >
              {l.label}
            </Link>
          ))}
          <div className="pt-3">
            <Link
              href="/benji"
              onClick={() => setOpen(false)}
              className="block px-4 py-3 rounded-xl bg-white text-primary-900 text-sm font-semibold text-center hover:bg-primary-50 transition-colors"
            >
              Start gesprek met Benji
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}
