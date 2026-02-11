"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { hexToLightTint, hexToDarker } from "@/lib/utils";
import { MessageSquare, CreditCard, Calendar, Heart, LogIn, LogOut, ChevronDown, ChevronRight, KeyRound, UserCircle, PencilLine, Sparkles, HandHelping, MessageCirclePlus, LayoutDashboard, Target, CalendarCheck, Menu, X } from "lucide-react";
import { signOut } from "next-auth/react";

const ORIGINAL_ACCENT = "#6d84a8";

const TOP_ITEMS = [
  { href: "/account/gesprekken", label: "Mijn gesprekken", icon: MessageSquare },
  { href: "/account/reflecties", label: "Mijn reflecties", icon: PencilLine },
  { href: "/account/doelen", label: "Persoonlijke doelen", icon: Target },
  { href: "/account/checkins", label: "Dagelijkse check-ins", icon: CalendarCheck },
  { href: "/account/inspiratie", label: "Inspiratie & troost", icon: Sparkles },
  { href: "/account/handreikingen", label: "Handreikingen", icon: HandHelping },
  { href: "/account/instellingen", label: "Personalisatie", icon: UserCircle },
];

const SUBMENU_ITEMS = [
  { href: "/account/abonnement", label: "Abonnement & betalingen", icon: CreditCard },
  { href: "/wachtwoord-vergeten", label: "Wachtwoord wijzigen", icon: KeyRound },
];

const REFLECTIES_SUBMENU = [
  { href: "/account/reflecties", label: "Overzicht" },
  { href: "/account/reflecties/eerdere-reflecties", label: "Eerdere reflecties" },
];

const PAGE_TITLES: Record<string, { title: string; subtitle: string }> = {
  "/account": { title: "Account", subtitle: "Overzicht" },
  "/account/gesprekken": { title: "Mijn gesprekken", subtitle: "Je eerdere gesprekken met Benji" },
  "/account/steun": { title: "Steun Benji", subtitle: "Help Talk To Benji verder te groeien" },
  "/account/reflecties": { title: "Mijn reflecties", subtitle: "Notities, emoties en dagelijkse check-in" },
  "/account/reflecties/eerdere-reflecties": { title: "Eerdere reflecties", subtitle: "Al je reflecties bekijken" },
  "/account/reflecties/eerdere-checkins": { title: "Eerdere check-ins", subtitle: "Al je dagelijkse check-ins bekijken" },
  "/account/doelen": { title: "Persoonlijke doelen", subtitle: "Je doelen en wensen bijhouden" },
  "/account/checkins": { title: "Dagelijkse check-ins", subtitle: "Korte vragen om je gedachten te ordenen" },
  "/account/notities": { title: "Mijn reflecties", subtitle: "Notities, emoties en dagelijkse check-in" },
  "/account/inspiratie": { title: "Inspiratie & troost", subtitle: "Gedichten, citaten en teksten die je kunnen steunen" },
  "/account/handreikingen": { title: "Handreikingen", subtitle: "Praktische tips en ideeën voor moeilijke momenten" },
  "/account/abonnement": { title: "Abonnement & betalingen", subtitle: "Je abonnement en betalingsoverzicht" },
  "/account/instellingen": { title: "Personaliseer", subtitle: "Personalisatie van je account" },
};

export default function AccountLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { data: session, status, update } = useSession();
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
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const maxRetries = 5;

  // HTTP → HTTPS in productie: session cookies werken alleen over HTTPS
  useEffect(() => {
    if (typeof window !== "undefined" && window.location.protocol === "http:" && !window.location.hostname.includes("localhost")) {
      window.location.replace("https://" + window.location.host + window.location.pathname + window.location.search);
    }
  }, []);

  // Sessie opnieuw ophalen als status "unauthenticated" is na login-redirect
  useEffect(() => {
    if (status !== "unauthenticated" || retryCount >= maxRetries) return;
    const delay = retryCount === 0 ? 200 : retryCount < 3 ? 600 : 1500;
    const timer = setTimeout(async () => {
      try {
        const res = await fetch("/api/auth/session");
        const data = await res.json();
        if (data?.userId || data?.user) {
          await update();
          if (retryCount >= 2) {
            window.location.reload();
            return;
          }
        }
      } catch {}
      setRetryCount((c) => c + 1);
    }, delay);
    return () => clearTimeout(timer);
  }, [status, retryCount, update]);

  // Submenu sluiten bij verlaten van reflecties
  useEffect(() => {
    if (!pathname?.startsWith("/account/reflecties")) {
      setReflectiesSubmenuOpen(false);
    }
  }, [pathname]);

  // Sluit mobiel menu bij navigatie
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [pathname]);

  // Voorkom body scroll als mobiel menu open is
  useEffect(() => {
    if (mobileMenuOpen) {
      document.body.style.overflow = "hidden";
      return () => { document.body.style.overflow = ""; };
    }
  }, [mobileMenuOpen]);

  // Toon spinner zolang sessie aan het laden is OF we nog retries doen
  if (status === "loading" || (status === "unauthenticated" && retryCount < maxRetries)) {
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

  // Gedeelde navigatie-inhoud (gebruikt door zowel sidebar als mobiel menu)
  const navContent = (
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
  );

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
        {/* Header */}
        <div className="flex items-center gap-2 sm:gap-3 mb-6 min-h-[3.5rem] sm:min-h-[4.5rem]">
          {/* Hamburger menu – alleen op mobiel */}
          <button
            type="button"
            onClick={() => setMobileMenuOpen(true)}
            className="lg:hidden p-2 -ml-1 text-primary-600 hover:bg-primary-100 rounded-lg transition-colors flex-shrink-0"
            aria-label="Menu openen"
          >
            <Menu size={22} />
          </button>
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
          <div className="min-w-0 flex-1">
            <h1 className="text-lg sm:text-xl font-bold text-primary-900 truncate">{pageInfo.title}</h1>
            <p className="text-xs sm:text-sm text-gray-600 truncate">{pageInfo.subtitle}</p>
          </div>
          {session.user?.name && (
            <p className="text-xl font-bold hidden lg:block flex-shrink-0" style={{ color: hexToDarker(accent, 12) }}>Fijn dat je er bent, {session.user.name}</p>
          )}
          <Link
            href="/account"
            className="p-2 text-gray-300 hover:text-primary-600 rounded-lg transition-colors flex-shrink-0"
            title="Overzicht"
          >
            <LayoutDashboard size={18} />
          </Link>
          <button
            type="button"
            onClick={() => signOut({ callbackUrl: "/" })}
            className="p-2 text-gray-300 hover:text-orange-500 rounded-lg transition-colors flex-shrink-0"
            title="Uitloggen"
          >
            <LogOut size={18} />
          </button>
        </div>

        {/* Mobiel menu overlay */}
        {mobileMenuOpen && (
          <div className="fixed inset-0 z-50 lg:hidden">
            {/* Backdrop */}
            <div
              className="absolute inset-0 bg-black/30"
              onClick={() => setMobileMenuOpen(false)}
            />
            {/* Slide-in panel */}
            <div className="absolute inset-y-0 left-0 w-72 max-w-[85vw] bg-white shadow-xl flex flex-col">
              <div className="flex items-center justify-between p-4 border-b border-primary-100">
                <span className="font-semibold text-primary-900">Menu</span>
                <button
                  type="button"
                  onClick={() => setMobileMenuOpen(false)}
                  className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors"
                  aria-label="Menu sluiten"
                >
                  <X size={20} className="text-gray-500" />
                </button>
              </div>
              <nav className="flex-1 overflow-y-auto p-3">
                {navContent}
              </nav>
              {session.user?.name && (
                <div className="p-4 border-t border-primary-100">
                  <p className="text-sm font-medium text-primary-700 truncate">{session.user.name}</p>
                </div>
              )}
            </div>
          </div>
        )}

        <div className="flex gap-6 items-start">
          {/* Desktop zijbalk – verborgen op mobiel */}
          <aside className="w-56 flex-shrink-0 hidden lg:block">
            <nav className="sticky top-6 rounded-xl border border-primary-200 bg-white p-3" style={{ borderLeftWidth: 4, borderLeftColor: accent }}>
              {navContent}
            </nav>
          </aside>

          {/* Hoofdinhoud */}
          <main className="flex-1 min-w-0">{children}</main>
        </div>
      </div>
    </div>
  );
}
