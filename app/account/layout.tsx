"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { hexToLightTint, hexToDarker } from "@/lib/utils";
import { MessageSquare, CreditCard, Calendar, Heart, LogIn, LogOut, ChevronDown, ChevronRight, ChevronLeft, KeyRound, UserCircle, PencilLine, Sparkles, HandHelping, MessageCirclePlus, Target, CalendarCheck, MoreVertical, House, X, Gem, Bell, HelpCircle, ShoppingBag } from "lucide-react";
import { signOut } from "next-auth/react";
import { ScrollIndicator } from "@/components/ScrollIndicator";
import { UpgradeBadge } from "@/components/UpgradeBadge";
import { TrialBanner } from "@/components/TrialBanner";

const ORIGINAL_ACCENT = "#6d84a8";
const ACCENT_CACHE_KEY = "benji_accent_color";

function getCachedAccent(): string {
  if (typeof window === "undefined") return ORIGINAL_ACCENT;
  try {
    return localStorage.getItem(ACCENT_CACHE_KEY) || ORIGINAL_ACCENT;
  } catch {
    return ORIGINAL_ACCENT;
  }
}

const TOP_ITEMS = [
  { href: "/account/gesprekken", label: "Jouw gesprekken", icon: MessageSquare },
  { href: "/account/reflecties", label: "Reflecties", icon: PencilLine },
  { href: "/account/doelen", label: "Persoonlijke doelen", icon: Target },
  { href: "/account/checkins", label: "Dagelijkse check-ins", icon: CalendarCheck },
  { href: "/account/herinneringen", label: "Memories", icon: Gem, iconClassName: "text-amber-500" },
  { href: "/account/inspiratie", label: "Inspiratie & troost", icon: Sparkles },
  { href: "/account/handreikingen", label: "Handreikingen", icon: HandHelping },
  { href: "/account/instellingen", label: "Personalisatie", icon: UserCircle },
];

const PERSONALISATIE_SUBMENU = [
  { href: "/account/wachtwoord", label: "Account", icon: KeyRound },
  { href: "/account/support", label: "Support", icon: HelpCircle },
];

const REFLECTIES_SUBMENU = [
  { href: "/account/reflecties", label: "Overzicht" },
  { href: "/account/reflecties/eerdere-reflecties", label: "Eerdere reflecties" },
];

const PAGE_TITLES: Record<string, { title: string; subtitle: string }> = {
  "/account": { title: "Wat wil je oppakken?", subtitle: "" },
  "/account/gesprekken": { title: "Jouw gesprekken", subtitle: "Je eerdere gesprekken met Benji" },
  "/account/steun": { title: "Steun Benji", subtitle: "Help Talk To Benji verder te groeien" },
  "/account/support": { title: "Support", subtitle: "Heb je hulp nodig? Stuur ons een bericht" },
  "/account/reflecties": { title: "Reflecties", subtitle: "Notities, emoties en dagelijkse check-in" },
  "/account/reflecties/eerdere-reflecties": { title: "Eerdere reflecties", subtitle: "Al je reflecties bekijken" },
  "/account/reflecties/eerdere-checkins": { title: "Eerdere check-ins", subtitle: "Al je dagelijkse check-ins bekijken" },
  "/account/doelen": { title: "Persoonlijke doelen", subtitle: "Je doelen en wensen bijhouden" },
  "/account/checkins": { title: "Dagelijkse check-ins", subtitle: "Korte vragen om je gedachten te ordenen" },
  "/account/notities": { title: "Reflecties", subtitle: "Notities, emoties en dagelijkse check-in" },
  "/account/inspiratie": { title: "Inspiratie & troost", subtitle: "Gedichten, citaten en teksten die je kunnen steunen" },
  "/account/handreikingen": { title: "Handreikingen", subtitle: "Praktische tips en ideeën voor moeilijke momenten" },
  "/account/onderweg": { title: "Iets voor onderweg", subtitle: "Producten en items die je kunnen helpen" },
  "/account/herinneringen": { title: "Memories", subtitle: "Mooie herinneringen om naar terug te kijken" },
  "/account/abonnement": { title: "Abonnement & betalingen", subtitle: "Je abonnement en betalingsoverzicht" },
  "/account/instellingen": { title: "Personaliseer", subtitle: "Personalisatie van je account" },
  "/account/wachtwoord": { title: "Account", subtitle: "Wijzig je naam, e-mailadres of wachtwoord" },
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
  const [cachedAccent, setCachedAccent] = useState(getCachedAccent);
  const accent = preferences?.accentColor || cachedAccent;
  const bgTint = hexToLightTint(accent, 12);

  // Update localStorage cache wanneer preferences laden
  useEffect(() => {
    if (preferences?.accentColor) {
      try {
        localStorage.setItem(ACCENT_CACHE_KEY, preferences.accentColor);
        setCachedAccent(preferences.accentColor);
      } catch {}
    }
  }, [preferences?.accentColor]);

  const [submenuOpen, setSubmenuOpen] = useState(() =>
    pathname === "/account/instellingen" ||
    PERSONALISATIE_SUBMENU.some((item) => pathname === item.href)
  );
  const [reflectiesSubmenuOpen, setReflectiesSubmenuOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const maxRetries = 5;

  // Notificatie bell
  const [notifOpen, setNotifOpen] = useState(false);
  const notifData = useQuery(
    api.pushSubscriptions.getNotificationsForUser,
    session?.userId ? { userId: session.userId as string } : "skip"
  );
  const markRead = useMutation(api.pushSubscriptions.markNotificationsRead);

  // Sluiten van notificatie popup gaat via de overlay onClick (geen extra listener nodig)

  // HTTP → HTTPS in productie: session cookies werken alleen over HTTPS
  useEffect(() => {
    if (typeof window !== "undefined" && window.location.protocol === "http:" && !window.location.hostname.includes("localhost")) {
      window.location.replace("https://" + window.location.host + window.location.pathname + window.location.search);
    }
  }, []);

  // Automatisch uitloggen als wachtwoord is gewijzigd op een ander apparaat
  useEffect(() => {
    if ((session as any)?.forceLogout) {
      signOut({ callbackUrl: "/inloggen?sessieVerlopen=1" });
    }
  }, [session]);

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
        <div className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
            pathname === "/account" ? "text-primary-800" : "text-gray-700"
          }`}
          style={pathname === "/account" ? { backgroundColor: hexToLightTint(accent, 25) } : {}}
        >
          <Link
            href="/account"
            scroll={false}
            className="flex items-center gap-3 flex-1 hover:text-primary-700 transition-colors"
          >
            <House size={18} className="flex-shrink-0" />
            Mijn plek
          </Link>
          {session?.userId && (
            <UpgradeBadge
              userId={session.userId as string}
              email={session.user?.email || undefined}
            />
          )}
        </div>
      </li>
      <li>
        <Link
          href="/?welcome=1"
          className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors text-gray-700 hover:text-primary-700 nav-hover"
        >
          <MessageCirclePlus size={18} className="flex-shrink-0" />
          Nieuw gesprek
        </Link>
      </li>
      {TOP_ITEMS.map((item) => {
        const Icon = item.icon;
        const isReflecties = item.href === "/account/reflecties";
        const isPersonalisatie = item.href === "/account/instellingen";
        const isActive = pathname === item.href;
        const isReflectiesSection = pathname?.startsWith("/account/reflecties");
        const isPersonalisatieSection =
          pathname === "/account/instellingen" ||
          PERSONALISATIE_SUBMENU.some((s) => pathname === s.href);

        if (isPersonalisatie) {
          return (
            <li key={item.href}>
              <div
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  isPersonalisatieSection ? "text-primary-800" : "text-gray-700 hover:text-primary-700 nav-hover"
                }`}
                style={isPersonalisatieSection ? { backgroundColor: hexToLightTint(accent, 25) } : {}}
              >
                <Link
                  href="/account/instellingen"
                  className="flex items-center gap-3 flex-1 min-w-0"
                  scroll={false}
                >
                  <Icon size={18} className="flex-shrink-0" />
                  {item.label}
                </Link>
                <button
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setSubmenuOpen((o) => !o);
                  }}
                  className="p-1 rounded hover:bg-primary-100/50 transition-colors -m-1 flex-shrink-0"
                  aria-expanded={submenuOpen}
                >
                  {submenuOpen ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                </button>
              </div>
              {submenuOpen && (
                <ul className="mt-0.5 ml-4 pl-3 border-l border-primary-200 space-y-0.5">
                  {PERSONALISATIE_SUBMENU.map((sub) => {
                    const SubIcon = sub.icon;
                    const subActive = pathname === sub.href;
                    return (
                      <li key={sub.href}>
                        <Link
                          href={sub.href}
                          className={`flex items-center gap-2 px-2 py-2 rounded-lg text-sm font-medium transition-colors ${
                            subActive ? "text-primary-800" : "text-gray-700 hover:text-primary-700 nav-hover"
                          }`}
                          style={subActive ? { backgroundColor: hexToLightTint(accent, 25) } : {}}
                        >
                          <SubIcon size={16} className="flex-shrink-0" />
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

        if (isReflecties) {
          return (
            <li key={item.href}>
              <div
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  isReflectiesSection ? "text-primary-800" : "text-gray-700 hover:text-primary-700 nav-hover"
                }`}
                style={isReflectiesSection ? { backgroundColor: hexToLightTint(accent, 25) } : {}}
              >
                <Link
                  href="/account/reflecties"
                  className="flex items-center gap-3 flex-1 min-w-0"
                  scroll={false}
                >
                  <Icon size={18} className={`flex-shrink-0 ${item.iconClassName || ""}`} />
                  {item.label}
                </Link>
                <span className="w-6 h-6 flex items-center justify-center flex-shrink-0">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setReflectiesSubmenuOpen((o) => !o);
                    }}
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
                </span>
              </div>
              {reflectiesSubmenuOpen && (
                <ul className="mt-0.5 ml-4 pl-3 border-l border-primary-200 space-y-0.5">
                  {REFLECTIES_SUBMENU.filter((s) => s.href !== "/account/reflecties").map((sub) => {
                    const subActive = pathname === sub.href;
                    return (
                      <li key={sub.href}>
                        <Link
                          href={sub.href}
                          scroll={false}
                          className={`flex items-center gap-2 px-2 py-2 rounded-lg text-sm font-medium transition-colors block ${
                            subActive ? "text-primary-800" : "text-gray-700 hover:text-primary-700 nav-hover"
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
                isActive ? "text-primary-800" : "text-gray-700 hover:text-primary-700 nav-hover"
              }`}
              style={isActive ? { backgroundColor: hexToLightTint(accent, 25) } : {}}
            >
              <Icon size={18} className={`flex-shrink-0 ${item.iconClassName || ""}`} />
              {item.label}
            </Link>
          </li>
        );
      })}
      <li>
        <Link
          href="/account/steun"
          scroll={false}
          className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors mt-2 border-t border-primary-100 pt-3 ${
            pathname === "/account/steun"
              ? "text-primary-800"
              : "text-gray-700 hover:text-primary-700 nav-hover"
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
          "--account-accent-light": hexToLightTint(accent, 25),
        } as React.CSSProperties
      }
    >
      <div className="max-w-6xl mx-auto p-4 sm:p-6">
        {/* Header */}
        <div className="mb-4 sm:mb-6">
          <div className="flex items-center gap-2 sm:gap-3">
            {pathname !== "/account" && (
              <button
                type="button"
                onClick={() => router.back()}
                className="p-1 rounded-lg text-gray-400 hover:text-primary-600 hover:bg-white/60 transition-colors flex-shrink-0"
                aria-label="Terug"
              >
                <ChevronLeft size={20} strokeWidth={2.5} />
              </button>
            )}
            <div className="flex-1" />
            {/* Hartverwarmer bell */}
            <div>
              <button
                type="button"
                onClick={() => {
                  setNotifOpen((o) => !o);
                  if (!notifOpen && notifData && notifData.unreadCount > 0 && session?.userId) {
                    markRead({ userId: session.userId as string });
                  }
                }}
                className={`relative p-2 rounded-lg transition-colors flex-shrink-0 ${
                  notifData && notifData.unreadCount > 0
                    ? ""
                    : "text-gray-400 hover:text-primary-600"
                }`}
                style={notifData && notifData.unreadCount > 0 ? { color: accent } : {}}
                title="Hartverwarmers"
                aria-label="Hartverwarmers"
              >
                {notifData && notifData.unreadCount > 0 ? (
                  <>
                    <Bell size={18} fill="currentColor" />
                    <span
                      className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] flex items-center justify-center rounded-full text-[10px] font-bold text-white leading-none px-1"
                      style={{ backgroundColor: accent }}
                    >
                      {notifData.unreadCount}
                    </span>
                  </>
                ) : (
                  <Bell size={18} />
                )}
              </button>
            </div>
            {/* Hartverwarmer popup – gecentreerd */}
            {notifOpen && (
              <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={() => setNotifOpen(false)}>
                <div className="absolute inset-0 bg-black/30 mobile-menu-backdrop" />
                <div
                  className="relative bg-white rounded-2xl shadow-xl w-full max-w-sm max-h-[70vh] overflow-hidden z-10"
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="flex items-center justify-between px-5 py-4 rounded-t-2xl" style={{ backgroundColor: accent }}>
                    <p className="text-base font-semibold text-white">Hartverwarmers</p>
                    <button
                      type="button"
                      onClick={() => setNotifOpen(false)}
                      className="p-1 rounded-lg hover:bg-white/20 transition-colors"
                      aria-label="Sluiten"
                    >
                      <X size={18} className="text-white/80" />
                    </button>
                  </div>
                  <div className="overflow-y-auto max-h-[55vh]">
                    {!notifData || notifData.notifications.length === 0 ? (
                      <p className="p-6 text-sm text-gray-500 text-center">Nog geen hartverwarmers ontvangen</p>
                    ) : (
                      notifData.notifications.map((n: any) =>
                        n.url ? (
                          <a
                            key={n._id}
                            href={n.url}
                            className="block px-5 py-4 border-b border-gray-50 last:border-0 hover:bg-gray-50 transition-colors cursor-pointer"
                          >
                            <p className="text-sm font-medium text-gray-900">{n.title}</p>
                            <p className="text-sm text-gray-600 mt-1">{n.body}</p>
                            <div className="flex items-center justify-between mt-2">
                              <p className="text-xs text-gray-400">
                                {new Date(n.sentAt).toLocaleDateString("nl-NL", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
                              </p>
                              <span
                                className="inline-flex items-center gap-1 px-3 py-1 text-xs font-medium rounded-lg"
                                style={{ color: accent, backgroundColor: hexToLightTint(accent, 25) }}
                              >
                                Bekijken
                                <ChevronRight size={14} />
                              </span>
                            </div>
                          </a>
                        ) : (
                          <div
                            key={n._id}
                            className="px-5 py-4 border-b border-gray-50 last:border-0"
                          >
                            <p className="text-sm font-medium text-gray-900">{n.title}</p>
                            <p className="text-sm text-gray-600 mt-1">{n.body}</p>
                            <p className="text-xs text-gray-400 mt-2">
                              {new Date(n.sentAt).toLocaleDateString("nl-NL", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
                            </p>
                          </div>
                        )
                      )
                    )}
                  </div>
                </div>
              </div>
            )}
            {/* Support link */}
            <Link
              href="/account/support"
              className="p-2 text-gray-400 hover:text-primary-600 rounded-lg transition-colors flex-shrink-0"
              title="Support"
            >
              <HelpCircle size={18} />
            </Link>
            <button
              type="button"
              onClick={() => signOut({ callbackUrl: "/afscheid" })}
              className="p-2 text-gray-300 hover:text-orange-500 rounded-lg transition-colors flex-shrink-0 hidden lg:block"
              title="Uitloggen"
            >
              <LogOut size={18} />
            </button>
            {/* Menu-knop – drie puntjes */}
            <button
              type="button"
              onClick={() => setMobileMenuOpen(true)}
              className="lg:hidden p-2.5 rounded-full text-white transition-colors shadow-md flex-shrink-0"
              style={{ backgroundColor: hexToDarker(accent, 20) }}
              aria-label="Menu openen"
            >
              <MoreVertical size={22} strokeWidth={2} />
            </button>
          </div>
          {/* Titel + subtitel – altijd onder de header-rij */}
          <div className="mt-2">
            <h1 className="text-base sm:text-xl font-bold text-primary-900">
              {pathname === "/account" && session.user?.name
                ? <span>Fijn dat je er bent, {session.user.name.split(" ")[0]}. {pageInfo.title}</span>
                : pageInfo.title
              }
            </h1>
            {pageInfo.subtitle && <p className="text-xs sm:text-sm text-gray-600">{pageInfo.subtitle}</p>}
          </div>
        </div>

        {/* Trial banner */}
        {session?.userId && (
          <TrialBanner
            userId={session.userId as string}
            email={session.user?.email || undefined}
          />
        )}

        {/* Mobiel menu overlay */}
        {mobileMenuOpen && (
          <div className="fixed inset-0 z-50 lg:hidden">
            {/* Backdrop */}
            <div
              className="absolute inset-0 bg-black/30 mobile-menu-backdrop"
              onClick={() => setMobileMenuOpen(false)}
            />
            {/* Slide-in panel – rechts */}
            <div className="absolute inset-y-0 right-0 w-72 max-w-[85vw] bg-white shadow-xl flex flex-col mobile-menu-panel">
              <div className="flex items-center justify-between px-3 py-2 border-b border-primary-100">
                <Image
                  src="/images/benji-logo-2.png"
                  alt="Benji"
                  width={24}
                  height={24}
                  className="object-contain opacity-40"
                  style={{ width: "auto", height: "auto" }}
                />
                <button
                  type="button"
                  onClick={() => setMobileMenuOpen(false)}
                  className="p-1 rounded-lg hover:bg-gray-100 transition-colors"
                  aria-label="Menu sluiten"
                >
                  <X size={18} className="text-gray-500" />
                </button>
              </div>
              <nav className="flex-1 overflow-y-auto p-2 mobile-nav-compact">
                {navContent}
              </nav>
              <div className="px-3 py-2 border-t border-primary-100">
                <button
                  type="button"
                  onClick={() => signOut({ callbackUrl: "/afscheid" })}
                  className="flex items-center gap-2 px-2 py-1.5 rounded-lg text-sm font-medium text-gray-400 hover:text-gray-600 hover:bg-gray-50 transition-colors w-full"
                >
                  <LogOut size={16} className="flex-shrink-0" />
                  Uitloggen
                </button>
              </div>
            </div>
          </div>
        )}

        <div className="flex gap-6 items-start">
          {/* Desktop zijbalk – verborgen op mobiel */}
          <aside className="w-56 flex-shrink-0 hidden lg:block">
            <nav className="sticky top-6 rounded-xl border border-primary-200 bg-white p-3 shadow-sm">
              {navContent}
            </nav>
          </aside>

          {/* Hoofdinhoud */}
          <main className="flex-1 min-w-0">{children}</main>
        </div>
      </div>

      {/* Scroll indicator */}
      <ScrollIndicator />
    </div>
  );
}
