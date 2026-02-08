"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { MessageSquare, CreditCard, Calendar, Heart, LogIn, ChevronDown, ChevronRight, Settings, FileText } from "lucide-react";

const TOP_ITEMS = [
  { href: "/account/gesprekken", label: "Mijn gesprekken", icon: MessageSquare },
  { href: "/account/steun", label: "Steun Benji", icon: Heart },
  { href: "/account/notities", label: "Notities", icon: FileText },
];

const SUBMENU_ITEMS = [
  { href: "/account/betalingen", label: "Betalingen", icon: CreditCard },
  { href: "/account/abonnement", label: "Abonnement", icon: Calendar },
  { href: "/account/instellingen", label: "Instellingen", icon: Settings },
];

export default function AccountLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { data: session, status, update } = useSession();
  const pathname = usePathname();
  const router = useRouter();
  const [submenuOpen, setSubmenuOpen] = useState(() =>
    SUBMENU_ITEMS.some((item) => pathname === item.href)
  );
  
  // Refresh session als status "unauthenticated" is maar we op account pagina zijn
  // Dit kan gebeuren als redirect te snel gaat na login
  useEffect(() => {
    if (status === "unauthenticated" && pathname?.startsWith("/account")) {
      // Probeer session te refreshen - meerdere pogingen met toenemende delay
      const attemptRefresh = async (attempt: number) => {
        await update(); // Refresh session
        // Als we na 1 seconde nog steeds niet ingelogd zijn, refresh de pagina
        if (attempt === 2) {
          router.refresh(); // Refresh page
        }
      };
      
      const timer1 = setTimeout(() => attemptRefresh(1), 300);
      const timer2 = setTimeout(() => attemptRefresh(2), 1000);
      
      return () => {
        clearTimeout(timer1);
        clearTimeout(timer2);
      };
    }
  }, [status, pathname, router, update]);

  if (status === "loading") {
    return (
      <div className="min-h-screen bg-primary-50 flex items-center justify-center">
        <div className="animate-pulse rounded-full h-8 w-8 border-b-2 border-primary-600" />
      </div>
    );
  }

  if (!session) {
    return (
      <div className="min-h-screen bg-primary-50 flex flex-col items-center justify-center p-4">
        <div className="text-center max-w-sm">
          <Image
            src="/images/benji-logo-2.png"
            alt="Benji"
            width={64}
            height={64}
            className="mx-auto object-contain mb-4"
          />
          <h1 className="text-xl font-bold text-primary-900">Account</h1>
          <p className="text-gray-600 mt-2 mb-6">
            Log in om je account te bekijken.
          </p>
          <Link
            href={`/inloggen?callbackUrl=${encodeURIComponent(pathname || "/account")}`}
            className="inline-flex items-center gap-2 py-3 px-6 bg-primary-600 text-white font-medium rounded-lg hover:bg-primary-700"
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

  return (
    <div className="min-h-screen bg-primary-50">
      <div className="max-w-6xl mx-auto p-4 sm:p-6">
        <div className="flex gap-6 items-start">
          {/* Zijbalk – top gelijk met content card (spacer matcht pagina-header) */}
          <aside className="w-56 flex-shrink-0">
            <div className="h-16 sm:h-20 flex-shrink-0" aria-hidden />
            <nav className="sticky top-6 rounded-xl border border-primary-200 border-l-4 border-l-primary-600 bg-white p-3">
              <ul className="space-y-0.5">
                {TOP_ITEMS.map((item) => {
                  const Icon = item.icon;
                  const isActive = pathname === item.href;
                  return (
                    <li key={item.href}>
                      <Link
                        href={item.href}
                        className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                          isActive
                            ? "bg-primary-100 text-primary-800"
                            : "text-gray-700 hover:bg-primary-50 hover:text-primary-700"
                        }`}
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
                        ? "bg-primary-100 text-primary-800"
                        : "text-gray-700 hover:bg-primary-50 hover:text-primary-700"
                    }`}
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
                              className={`flex items-center gap-2 px-2 py-2 rounded-lg text-sm font-medium transition-colors ${
                                isActive
                                  ? "bg-primary-100 text-primary-800"
                                  : "text-gray-700 hover:bg-primary-50 hover:text-primary-700"
                              }`}
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
