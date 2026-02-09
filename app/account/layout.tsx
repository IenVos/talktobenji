"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { hexToLightTint, hexToDarker } from "@/lib/utils";
import { MessageSquare, CreditCard, Calendar, Heart, LogIn, ChevronDown, ChevronRight, KeyRound, UserCircle, PencilLine, Sparkles, HandHelping, MessageCirclePlus } from "lucide-react";

const ORIGINAL_ACCENT = "#6d84a8";

const TOP_ITEMS = [
  { href: "/account/gesprekken", label: "Mijn gesprekken", icon: MessageSquare },
  { href: "/account/reflecties", label: "Mijn reflecties", icon: PencilLine },
  { href: "/account/inspiratie", label: "Inspiratie & troost", icon: Sparkles },
  { href: "/account/handreikingen", label: "Handreikingen", icon: HandHelping },
  { href: "/account/instellingen", label: "Personalisatie", icon: UserCircle },
];

const SUBMENU_ITEMS = [
  { href: "/account/betalingen", label: "Betalingen", icon: CreditCard },
  { href: "/account/abonnement", label: "Abonnement", icon: Calendar },
  { href: "/wachtwoord-vergeten", label: "Wachtwoord wijzigen", icon: KeyRound },
];

const REFLECTIES_SUBMENU = [
  { href: "/account/reflecties", label: "Overzicht" },
  { href: "/account/reflecties/eerdere-reflecties", label: "Eerdere reflecties" },
  { href: "/account/reflecties/eerdere-checkins", label: "Eerdere check-ins" },
];

const PAGE_TITLES: Record<string, { title: string; subtitle: string }> = {
  "/account": { title: "Account", subtitle: "Overzicht" },
  "/account/gesprekken": { title: "Mijn gesprekken", subtitle: "Je eerdere gesprekken met Benji" },
  "/account/steun": { title: "Steun Benji", subtitle: "Help Talk To Benji verder te groeien" },
  "/account/reflecties": { title: "Mijn reflecties", subtitle: "Notities, emoties en dagelijkse check-in" },
  "/account/reflecties/eerdere-reflecties": { title: "Eerdere reflecties", subtitle: "Al je reflecties bekijken" },
  "/account/reflecties/eerdere-checkins": { title: "Eerdere check-ins", subtitle: "Al je dagelijkse check-ins bekijken" },
  "/account/notities": { title: "Mijn reflecties", subtitle: "Notities, emoties en dagelijkse check-in" },
  "/account/inspiratie": { title: "Inspiratie & troost", subtitle: "Gedichten, citaten en teksten die je kunnen steunen" },
  "/account/handreikingen": { title: "Handreikingen", subtitle: "Praktische tips en ideeën voor moeilijke momenten" },
  "/account/betalingen": { title: "Betalingen", subtitle: "Overzicht van je betalingen" },
  "/account/abonnement": { title: "Abonnement", subtitle: "Je abonnement" },
  "/account/instellingen": { title: "Personaliseer", subtitle: "Personalisatie van je account" },
};

export default function AccountLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { data: session, status } = useSession();
  const pathname = usePathname();
  const router = useRouter();
  const preferences = useQuery(
    api.preferences.getPreferences,
    session?.userId ? { userId: session.userId as string } : "skip"
  );
  const accent = preferences?.accentColor || ORIGINAL_ACCENT;
  const bgTint = hexToLightTint(accent, 12);

  const [submenuOpen, setSubmenuOpen] = useState(() =>
    SUBMENU_ITEMS.some((item) => pathname === item.href)
  );
  const [reflectiesSubmenuOpen, setReflectiesSubmenuOpen] = useState(false);
  // HTTP → HTTPS in productie: session cookies werken alleen over HTTPS
  useEffect(() => {
    if (typeof window !== "undefined" && window.location.protocol === "http:" && !window.location.hostname.includes("localhost")) {
      window.location.replace("https://" + window.location.host + window.location.pathname + window.location.search);
    }
  }, []);

  // Submenu sluiten bij verlaten van reflecties
  useEffect(() => {
    if (!pathname?.startsWith("/account/reflecties")) {
      setReflectiesSubmenuOpen(false);
    }
  }, [pathname]);
  

  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: hexToLightTint(ORIGINAL_ACCENT, 12) }}>
        <div className="animate-pulse rounded-full h-8 w-8 border-b-2 border-primary-600" />
      </div>
    );
  }

  if (!session) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4" style={{ backgroundColor: bgTint }}>
        <div className="text-center max-w-sm">
          <Image
            src="/images/benji-logo-2.png"
            alt="Benji"
            width={40}
            height={40}
            className="mx-auto object-contain mb-4"
            style={{ width: "auto", height: "auto" }}
          />
          <h1 className="text-xl font-bold text-primary-900">Account</h1>
          <p className="text-gray-600 mt-2 mb-6">
            Log in om je account te bekijken.
          </p>
          <Link
            href={`/inloggen?callbackUrl=${encodeURIComponent(pathname || "/account")}`}
            className="inline-flex items-center gap-2 py-3 px-6 text-white font-medium rounded-lg transition-colors"
            style={{ backgroundColor: accent }}
          >
            <LogIn size={20} />
            Inloggen
          </Link>
          <p className="mt-4 text-sm text-gray-500">
            Nog geen account?{" "}
            <Link href="/registreren" className="text-primary-600 hover:underline">
              Account aanmaken
            </Link>
          </p>
        </div>
      </div>
    );
  }

  const pageInfo = PAGE_TITLES[pathname || "/account"] ?? PAGE_TITLES["/account"];

  return (
    <div
      className="min-h-screen account-theme"
      style={
        {
          backgroundColor: bgTint,
          "--account-accent": accent,
          "--account-accent-hover": hexToDarker(accent, 12),
        } as React.CSSProperties
      }
    >
      <div className="max-w-6xl mx-auto p-4 sm:p-6">
        {/* Gedeelde header – logo linkt naar chat met welkom, vaste hoogte om layoutverschuiving te voorkomen */}
        <div className="flex items-center gap-3 mb-6 min-h-[4.5rem]">
          <Link
            href="/?welcome=1"
            className="flex-shrink-0"
            aria-label="Ga naar gesprek met Benji"
          >
            <Image
              src="/images/benji-logo-2.png"
              alt="Benji"
              width={32}
              height={32}
              className="object-contain brightness-75 hover:brightness-90 transition-all"
              style={{ width: "auto", height: "auto" }}
            />
          </Link>
          <div className="min-w-0">
            <h1 className="text-xl font-bold text-primary-900">{pageInfo.title}</h1>
            <p className="text-sm text-gray-600">{pageInfo.subtitle}</p>
          </div>
        </div>

        <div className="flex gap-6 items-start">
          {/* Zijbalk – top gelijk met content cards */}
          <aside className="w-56 flex-shrink-0">
            <nav className="sticky top-6 rounded-xl border border-primary-200 bg-white p-3" style={{ borderLeftWidth: 4, borderLeftColor: accent }}>
              <ul className="space-y-0.5">
                <li>
                  <Link
                    href="/?welcome=1"
                    className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors text-gray-700 hover:text-primary-700 hover:bg-primary-50/50"
                  >
                    <MessageCirclePlus size={18} className="flex-shrink-0" />
                    Nieuw gesprek
                  </Link>
                </li>
                {TOP_ITEMS.map((item) => {
                  const Icon = item.icon;
                  const isReflecties = item.href === "/account/reflecties";
                  const isActive = pathname === item.href;
                  const isReflectiesSection = pathname?.startsWith("/account/reflecties");
                  if (isReflecties) {
                    return (
                      <li key={item.href}>
                        <div
                          className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                            isReflectiesSection ? "text-primary-800" : "text-gray-700 hover:text-primary-700"
                          }`}
                          style={isReflectiesSection ? { backgroundColor: hexToLightTint(accent, 25) } : {}}
                        >
                          <Link
                            href="/account/reflecties"
                            className="flex items-center gap-3 flex-1 min-w-0"
                            scroll={false}
                          >
                            <Icon size={18} className="flex-shrink-0" />
                            {item.label}
                          </Link>
                          {/* Altijd ruimte reserveren voor chevron om layoutverschuiving te voorkomen */}
                          <span className="w-6 h-6 flex items-center justify-center flex-shrink-0">
                            {isReflectiesSection && (
                              <button
                                type="button"
                                onClick={() => setReflectiesSubmenuOpen((o) => !o)}
                                className="p-1 rounded hover:bg-primary-100/50 transition-colors -m-1"
                                title={reflectiesSubmenuOpen ? "Submenu sluiten" : "Submenu openen"}
                                aria-expanded={reflectiesSubmenuOpen}
                              >
                                {reflectiesSubmenuOpen ? (
                                  <ChevronDown size={16} />
                                ) : (
                                  <ChevronRight size={16} />
                                )}
                              </button>
                            )}
                          </span>
                        </div>
                        {isReflectiesSection && reflectiesSubmenuOpen && (
                          <ul className="mt-0.5 ml-4 pl-3 border-l border-primary-200 space-y-0.5">
                            {REFLECTIES_SUBMENU.filter((s) => s.href !== "/account/reflecties").map((sub) => {
                              const subActive = pathname === sub.href;
                              return (
                                <li key={sub.href}>
                                  <Link
                                    href={sub.href}
                                    scroll={false}
                                    className={`flex items-center gap-2 px-2 py-2 rounded-lg text-sm font-medium transition-colors block ${
                                      subActive ? "text-primary-800" : "text-gray-700 hover:text-primary-700"
                                    }`}
                                    style={subActive ? { backgroundColor: hexToLightTint(accent, 25) } : {}}
                                  >
                                    {sub.label}
                                  </Link>
                                </li>
                              );
                            })}
                          </ul>
                        )}
                      </li>
                    );
                  }
                  return (
                    <li key={item.href}>
                      <Link
                        href={item.href}
                        scroll={false}
                        className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                          isActive ? "text-primary-800" : "text-gray-700 hover:text-primary-700"
                        }`}
                        style={isActive ? { backgroundColor: hexToLightTint(accent, 25) } : {}}
                      >
                        <Icon size={18} className="flex-shrink-0" />
                        {item.label}
                      </Link>
                    </li>
                  );
                })}
                <li>
                  <button
                    type="button"
                    onClick={() => setSubmenuOpen(!submenuOpen)}
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors w-full ${
                      SUBMENU_ITEMS.some((i) => pathname === i.href)
                        ? "text-primary-800"
                        : "text-gray-700 hover:text-primary-700"
                    }`}
                    style={
                      SUBMENU_ITEMS.some((i) => pathname === i.href)
                        ? { backgroundColor: hexToLightTint(accent, 25) }
                        : {}
                    }
                  >
                    {submenuOpen ? (
                      <ChevronDown size={18} className="flex-shrink-0" />
                    ) : (
                      <ChevronRight size={18} className="flex-shrink-0" />
                    )}
                    <span>Meer</span>
                  </button>
                  {submenuOpen && (
                    <ul className="mt-0.5 ml-4 pl-3 border-l border-primary-200 space-y-0.5">
                      {SUBMENU_ITEMS.map((item) => {
                        const Icon = item.icon;
                        const isActive = pathname === item.href;
                        return (
                          <li key={item.href}>
                            <Link
                              href={item.href}
                              scroll={false}
                              className={`flex items-center gap-2 px-2 py-2 rounded-lg text-sm font-medium transition-colors ${
                                isActive ? "text-primary-800" : "text-gray-700 hover:text-primary-700"
                              }`}
                              style={isActive ? { backgroundColor: hexToLightTint(accent, 25) } : {}}
                            >
                              <Icon size={16} className="flex-shrink-0" />
                              {item.label}
                            </Link>
                          </li>
                        );
                      })}
                    </ul>
                  )}
                </li>
                <li>
                  <Link
                    href="/account/steun"
                    scroll={false}
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors mt-2 border-t border-primary-100 pt-3 ${
                      pathname === "/account/steun"
                        ? "text-primary-800"
                        : "text-gray-700 hover:text-primary-700"
                    }`}
                    style={
                      pathname === "/account/steun"
                        ? { backgroundColor: hexToLightTint(accent, 25) }
                        : {}
                    }
                  >
                    <Heart size={18} className="flex-shrink-0" />
                    Steun Benji
                  </Link>
                </li>
              </ul>
            </nav>
          </aside>

          {/* Hoofdinhoud */}
          <main className="flex-1 min-w-0">{children}</main>
        </div>
      </div>
    </div>
  );
}
