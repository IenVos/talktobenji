"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { AdminLogin } from "@/components/admin/AdminLogin";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { AdminAuthProvider, useAdminQuery } from "./AdminAuthContext";
import {
  Settings, LogOut, Home, Menu, X, BookOpen, FileStack, BarChart3,
  MessageSquare, Sparkles, HandHelping, MessageCircleHeart, Bell,
  ShoppingBag, Mail, Users, HelpCircle, ThumbsUp,
  ThumbsDown, Quote, ChevronDown, ChevronRight, LayoutTemplate, CreditCard, Shield, Newspaper, Layers, MousePointerClick, Smile, Network,
} from "lucide-react";

type NavItem = {
  href: string;
  label: string;
  icon: React.ElementType;
  badge?: number;
};

type NavGroup = {
  id: string;
  label: string;
  icon: React.ElementType;
  items: NavItem[];
};

type NavEntry =
  | { type: "group"; group: NavGroup }
  | { type: "item"; item: NavItem }
  | { type: "separator" };

function NavLink({
  item,
  isActive,
  dark,
  onClick,
}: {
  item: NavItem;
  isActive: boolean;
  dark?: boolean;
  onClick?: () => void;
}) {
  const Icon = item.icon;
  if (dark) {
    return (
      <Link
        href={item.href}
        onClick={onClick}
        className={`flex items-center gap-3 px-4 py-2.5 rounded-lg transition-colors border text-sm ${
          isActive
            ? "bg-white/10 text-white border-primary-700"
            : "text-gray-300 hover:bg-white/5 border-transparent"
        }`}
      >
        <Icon size={17} className="flex-shrink-0" />
        <span className="flex-1">{item.label}</span>
        {(item.badge ?? 0) > 0 && (
          <span className="inline-flex items-center justify-center min-w-[18px] h-4.5 px-1.5 rounded-full text-xs font-bold bg-red-500 text-white">
            {item.badge}
          </span>
        )}
      </Link>
    );
  }
  return (
    <Link
      href={item.href}
      onClick={onClick}
      className={`flex items-center gap-3 px-4 py-2.5 rounded-lg transition-colors text-sm ${
        isActive ? "bg-primary-50 text-primary-600" : "text-gray-600 hover:bg-gray-50"
      }`}
    >
      <Icon size={17} className="flex-shrink-0" />
      <span className="flex-1">{item.label}</span>
      {(item.badge ?? 0) > 0 && (
        <span className="inline-flex items-center justify-center min-w-[18px] px-1.5 rounded-full text-xs font-bold bg-red-500 text-white">
          {item.badge}
        </span>
      )}
    </Link>
  );
}

function CollapsibleGroup({
  group,
  pathname,
  dark,
  onItemClick,
}: {
  group: NavGroup;
  pathname: string;
  dark?: boolean;
  onItemClick?: () => void;
}) {
  const hasActive = group.items.some((i) => pathname === i.href);
  const [open, setOpen] = useState(hasActive);
  const Icon = group.icon;

  // Auto-open als een pagina binnen deze groep actief wordt
  useEffect(() => {
    if (hasActive) setOpen(true);
  }, [hasActive]);

  const headerBase = dark
    ? `flex items-center gap-3 w-full px-4 py-2.5 rounded-lg transition-colors text-sm border ${
        hasActive
          ? "text-white border-primary-700 bg-white/5"
          : "text-gray-300 hover:bg-white/5 border-transparent"
      }`
    : `flex items-center gap-3 w-full px-4 py-2.5 rounded-lg transition-colors text-sm ${
        hasActive ? "text-primary-600" : "text-gray-600 hover:bg-gray-50"
      }`;

  return (
    <div>
      <button onClick={() => setOpen((o) => !o)} className={headerBase}>
        <Icon size={17} className="flex-shrink-0" />
        <span className="flex-1 text-left">{group.label}</span>
        {open ? (
          <ChevronDown size={14} className="opacity-60" />
        ) : (
          <ChevronRight size={14} className="opacity-60" />
        )}
      </button>

      {open && (
        <ul className="mt-0.5 ml-3 space-y-0.5 border-l pl-3" style={{ borderColor: dark ? "rgba(255,255,255,0.1)" : "#e5e7eb" }}>
          {group.items.map((item) => (
            <li key={item.href}>
              <NavLink
                item={item}
                isActive={pathname === item.href}
                dark={dark}
                onClick={onItemClick}
              />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function AdminLayoutInner({ children }: { children: React.ReactNode }) {
  const pathname = usePathname() ?? "";
  const allFeedback = useAdminQuery(api.admin.getAllFeedback, {});
  const newFeedbackCount = allFeedback?.filter((f: any) => f.status === "new").length ?? 0;
  const notHelpful = useAdminQuery(api.admin.getNotHelpfulMessages, {});
  const notHelpfulCount = notHelpful?.length ?? 0;
  const helpful = useAdminQuery(api.admin.getHelpfulMessages, {});
  const helpfulCount = helpful?.length ?? 0;
  const securityAlertCount = (useAdminQuery(api.security.getAlertCount, {}) as number | undefined) ?? 0;
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const entries: NavEntry[] = [
    {
      type: "group",
      group: {
        id: "overzicht",
        label: "Overzicht",
        icon: BarChart3,
        items: [
          { href: "/admin/analytics", label: "Analytics", icon: BarChart3 },
          { href: "/admin/revenue", label: "Omzet & verkopen", icon: CreditCard },
        ],
      },
    },
    {
      type: "group",
      group: {
        id: "producten",
        label: "Producten",
        icon: ShoppingBag,
        items: [
          { href: "/admin/checkout", label: "Producten", icon: CreditCard },
          { href: "/admin/landingspaginas", label: "Landingspagina's", icon: LayoutTemplate },
          { href: "/admin/niet-alleen-emails", label: "Niet Alleen", icon: Mail },
          { href: "/admin/onderweg", label: "Shop", icon: ShoppingBag },
        ],
      },
    },
    {
      type: "group",
      group: {
        id: "klanten",
        label: "Klanten",
        icon: Users,
        items: [
          { href: "/admin/klantbeheer", label: "Klantbeheer", icon: Users },
          { href: "/admin/support-faq", label: "Support FAQ", icon: HelpCircle },
        ],
      },
    },
    {
      type: "group",
      group: {
        id: "content",
        label: "Content",
        icon: Newspaper,
        items: [
          { href: "/admin/blog", label: "Blog artikelen", icon: Newspaper },
          { href: "/admin/cta", label: "CTA blokken", icon: MousePointerClick },
          { href: "/admin/benji-teasers", label: "Benji teasers", icon: Smile },
          { href: "/admin/pillars", label: "Pillar pagina's", icon: Layers },
          { href: "/admin/paginas", label: "Pagina's", icon: LayoutTemplate },
          { href: "/admin/homepage-faq", label: "Homepage FAQ", icon: HelpCircle },
          { href: "/admin/linkstructuur", label: "Linkstructuur", icon: Network },
        ],
      },
    },
    {
      type: "group",
      group: {
        id: "benji",
        label: "Benji",
        icon: Sparkles,
        items: [
          { href: "/admin/chat-history", label: "Chat history", icon: MessageSquare },
          { href: "/admin/instellingen", label: "Kennis & regels", icon: Settings },
          { href: "/admin/knowledge", label: "Benji FAQ", icon: BookOpen },
          { href: "/admin/bronnen", label: "Bronnen", icon: FileStack },
          { href: "/admin/inspiratie", label: "Inspiratie & troost", icon: Sparkles },
          { href: "/admin/handreikingen", label: "Handreikingen", icon: HandHelping },
          { href: "/admin/testimonials", label: "Reviews", icon: Quote },
          { href: "/admin/notificaties", label: "Notificaties", icon: Bell },
        ],
      },
    },
    {
      type: "group",
      group: {
        id: "feedback",
        label: "Feedback",
        icon: MessageCircleHeart,
        items: [
          { href: "/admin/feedback", label: "Feedback", icon: MessageCircleHeart, badge: newFeedbackCount },
          { href: "/admin/goede-antwoorden", label: "Goede antwoorden", icon: ThumbsUp, badge: helpfulCount },
          { href: "/admin/slechte-antwoorden", label: "Slechte antwoorden", icon: ThumbsDown, badge: notHelpfulCount },
          { href: "/admin/wensen", label: "Wensen", icon: MessageCircleHeart },
        ],
      },
    },
    { type: "separator" },
    { type: "item", item: { href: "/admin/beveiliging", label: "Beveiliging", icon: Shield, badge: securityAlertCount } },
  ];

  function renderEntries(dark: boolean, onItemClick?: () => void) {
    return entries.map((entry, i) => {
      if (entry.type === "separator") {
        return (
          <li key={`sep-${i}`} className="border-t my-2" style={{ borderColor: dark ? "rgba(255,255,255,0.12)" : "#e5e7eb" }} />
        );
      }
      if (entry.type === "group") {
        return (
          <li key={entry.group.id}>
            <CollapsibleGroup
              group={entry.group}
              pathname={pathname}
              dark={dark}
              onItemClick={onItemClick}
            />
          </li>
        );
      }
      return (
        <li key={entry.item.href}>
          <NavLink
            item={entry.item}
            isActive={pathname === entry.item.href}
            dark={dark}
            onClick={onItemClick}
          />
        </li>
      );
    });
  }

  return (
    <div className="min-h-screen min-h-[100dvh] bg-white">
      {/* Mobile header */}
      <header className="lg:hidden bg-primary-900 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 flex-shrink-0 flex items-center justify-center overflow-hidden rounded-lg">
            <Image src="/images/benji-logo-2.png" alt="Talk To Benji" width={32} height={32} className="object-contain h-full w-auto" style={{ width: "auto", height: "auto" }} />
          </div>
          <div>
            <h1 className="text-lg font-bold text-white">Talk To Benji</h1>
            <p className="text-xs text-gray-300">Admin Panel</p>
          </div>
        </div>
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="p-2 text-gray-300 hover:bg-white/5 rounded-lg"
        >
          {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </header>

      {mobileMenuOpen && (
        <div className="lg:hidden fixed inset-0 bg-black/50 z-40" onClick={() => setMobileMenuOpen(false)} />
      )}

      {/* Mobile slide-in menu */}
      <div className={`lg:hidden fixed top-0 right-0 h-full w-64 bg-white z-50 transform transition-transform ${mobileMenuOpen ? "translate-x-0" : "translate-x-full"}`}>
        <div className="p-4 border-b border-gray-200 flex items-center justify-between">
          <span className="font-semibold text-gray-900">Menu</span>
          <button onClick={() => setMobileMenuOpen(false)} className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg">
            <X size={20} />
          </button>
        </div>
        <nav className="p-4 overflow-y-auto h-[calc(100%-120px)]">
          <ul className="space-y-0.5">
            {renderEntries(false, () => setMobileMenuOpen(false))}
          </ul>
        </nav>
        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-gray-200">
          <Link
            href="/"
            onClick={() => setMobileMenuOpen(false)}
            className="flex items-center gap-3 px-4 py-2.5 text-gray-600 hover:bg-gray-50 rounded-lg transition-colors text-sm"
          >
            <Home size={17} />
            Naar chat
          </Link>
        </div>
      </div>

      <div className="flex">
        {/* Desktop sidebar */}
        <aside className="hidden lg:flex w-60 bg-primary-900 flex-col fixed h-screen">
          <div className="p-5 border-b border-primary-700">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 flex-shrink-0 flex items-center justify-center overflow-hidden rounded-lg">
                <Image src="/images/benji-logo-2.png" alt="Talk To Benji" width={36} height={36} className="object-contain h-full w-auto" style={{ width: "auto", height: "auto" }} />
              </div>
              <div>
                <h1 className="text-lg font-bold text-white">Talk To Benji</h1>
                <p className="text-xs text-gray-300">Admin Panel</p>
              </div>
            </div>
          </div>

          <nav className="flex-1 p-4 overflow-y-auto">
            <ul className="space-y-0.5">
              {renderEntries(true)}
            </ul>
          </nav>

          <div className="p-4 border-t border-primary-700">
            <Link
              href="/"
              className="flex items-center gap-3 px-4 py-2.5 text-gray-300 hover:bg-white/5 rounded-lg transition-colors border border-transparent hover:border-primary-700 text-sm"
            >
              <Home size={17} />
              Naar chat
            </Link>
          </div>
        </aside>

        <main className="flex-1 lg:ml-60 min-h-screen bg-primary-50">
          <div className="p-4 sm:p-6 lg:p-8">{children}</div>
        </main>
      </div>
    </div>
  );
}

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [adminToken, setAdminToken] = useState<string | null>(null);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const res = await fetch("/api/admin/check");
      if (res.ok) {
        const data = await res.json();
        setIsAuthenticated(true);
        setAdminToken(data.adminToken || null);
      } else {
        setIsAuthenticated(false);
        setAdminToken(null);
      }
    } catch {
      setIsAuthenticated(false);
      setAdminToken(null);
    }
  };

  const handleLogin = (token: string) => {
    setIsAuthenticated(true);
    setAdminToken(token || null);
  };

  const handleLogout = async () => {
    await fetch("/api/admin/logout", { method: "POST" });
    setIsAuthenticated(false);
    setAdminToken(null);
  };

  if (isAuthenticated === null) {
    return (
      <div className="min-h-screen bg-primary-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <AdminLogin onLogin={handleLogin} />;
  }

  return (
    <AdminAuthProvider adminToken={adminToken}>
      <AdminLayoutInner>{children}</AdminLayoutInner>
      <button
        onClick={handleLogout}
        className="fixed bottom-4 right-4 lg:bottom-6 lg:right-6 z-50 flex items-center gap-2 px-4 py-2 bg-gray-200 text-gray-500 rounded-full shadow hover:bg-gray-300 transition-colors text-sm"
      >
        <LogOut size={16} />
        Uitloggen
      </button>
    </AdminAuthProvider>
  );
}
