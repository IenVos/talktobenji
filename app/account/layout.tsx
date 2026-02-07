"use client";

import { useSession } from "next-auth/react";
import { useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { MessageSquare, CreditCard, Calendar, Heart, LogIn } from "lucide-react";

const SIDEBAR_ITEMS = [
  { href: "/account/gesprekken", label: "Mijn gesprekken", icon: MessageSquare },
  { href: "/account/abonnement", label: "Abonnement", icon: Calendar },
  { href: "/account/betalingen", label: "Betalingen", icon: CreditCard },
  { href: "/account/steun", label: "Steun Benji", icon: Heart },
];

export default function AccountLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { data: session, status, update } = useSession();
  const pathname = usePathname();
  const router = useRouter();
  
  // Refresh session als status "unauthenticated" is maar we op account pagina zijn
  // Dit kan gebeuren als redirect te snel gaat na login
  useEffect(() => {
    if (status === "unauthenticated" && pathname?.startsWith("/account")) {
      // Probeer session te refreshen
      const timer = setTimeout(async () => {
        await update(); // Refresh session
        router.refresh(); // Refresh page
      }, 300);
      return () => clearTimeout(timer);
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
        <div className="flex gap-6">
          {/* Zijbalk met blauwe rand */}
          <aside className="w-56 flex-shrink-0">
            <nav className="sticky top-4 rounded-xl border border-primary-200 border-l-4 border-l-primary-600 bg-white p-3">
              <ul className="space-y-0.5">
                {SIDEBAR_ITEMS.map((item) => {
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
