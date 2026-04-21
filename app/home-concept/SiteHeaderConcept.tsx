"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Menu, X } from "lucide-react";

const LINKS = [
  { href: "/waarom-benji", label: "Over" },
  { href: "/blog", label: "Blog" },
  { href: "/voor-jou", label: "Voor jou" },
  { href: "/registreren", label: "Aanmelden" },
  { href: "/inloggen", label: "Inloggen" },
];

export function SiteHeaderConcept() {
  const [open, setOpen] = useState(false);

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

        {/* Desktop nav — verborgen op mobiel */}
        <nav className="hidden md:flex items-center gap-7">
          {LINKS.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className="text-sm text-primary-300 hover:text-white transition-colors"
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

        {/* Mobiel: hamburger */}
        <button
          onClick={() => setOpen((v) => !v)}
          className="md:hidden p-2 rounded-lg text-primary-300 hover:text-white transition-colors"
          aria-label={open ? "Menu sluiten" : "Menu openen"}
        >
          {open ? <X size={20} /> : <Menu size={20} />}
        </button>
      </div>

      {/* Mobiel uitklapmenu */}
      {open && (
        <div className="md:hidden bg-primary-900 border-t border-primary-800 px-6 py-5 space-y-1">
          {LINKS.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              onClick={() => setOpen(false)}
              className="block text-sm text-primary-300 hover:text-white py-2.5 transition-colors"
            >
              {l.label}
            </Link>
          ))}
          <div className="pt-3">
            <Link
              href="/benji"
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
