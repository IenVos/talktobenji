"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { AdminLogin } from "@/components/admin/AdminLogin";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { AdminAuthProvider, useAdminQuery } from "./AdminAuthContext";
import { Settings, LogOut, Home, Menu, X, BookOpen, FileStack, BarChart3, MessageSquare, Sparkles, HandHelping, MessageCircleHeart, Bell, ShoppingBag } from "lucide-react";

function AdminLayoutInner({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const allFeedback = useAdminQuery(api.admin.getAllFeedback, {});
  const newFeedbackCount = allFeedback?.filter((f: any) => f.status === "new").length ?? 0;
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navItems = [
    { href: "/admin", label: "Instellingen", icon: Settings, badge: 0 },
    { href: "/admin/feedback", label: "Feedback", icon: MessageCircleHeart, badge: newFeedbackCount },
    { href: "/admin/analytics", label: "Analytics", icon: BarChart3, badge: 0 },
    { href: "/admin/chat-history", label: "Chat history", icon: MessageSquare, badge: 0 },
    { href: "/admin/knowledge", label: "Knowledge Base", icon: BookOpen, badge: 0 },
    { href: "/admin/bronnen", label: "Bronnen", icon: FileStack, badge: 0 },
    { href: "/admin/inspiratie", label: "Inspiratie & troost", icon: Sparkles, badge: 0 },
    { href: "/admin/handreikingen", label: "Handreikingen", icon: HandHelping, badge: 0 },
    { href: "/admin/onderweg", label: "Iets voor onderweg", icon: ShoppingBag, badge: 0 },
    { href: "/admin/notificaties", label: "Notificaties", icon: Bell, badge: 0 },
  ];

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
        <div
          className="lg:hidden fixed inset-0 bg-black/50 z-40"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      <div
        className={`lg:hidden fixed top-0 right-0 h-full w-64 bg-white z-50 transform transition-transform ${
          mobileMenuOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <div className="p-4 border-b border-gray-200 flex items-center justify-between">
          <span className="font-semibold text-gray-900">Menu</span>
          <button
            onClick={() => setMobileMenuOpen(false)}
            className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg"
          >
            <X size={20} />
          </button>
        </div>
        <nav className="p-4">
          <ul className="space-y-2">
            {navItems.map((item) => {
              const isActive = pathname === item.href;
              const Icon = item.icon;
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    onClick={() => setMobileMenuOpen(false)}
                    className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                      isActive ? "bg-primary-50 text-primary-600" : "text-gray-600 hover:bg-gray-50"
                    }`}
                  >
                    <Icon size={20} />
                    <span className="flex-1">{item.label}</span>
                    {item.badge > 0 && (
                      <span className="inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 rounded-full text-xs font-bold bg-red-500 text-white">
                        {item.badge}
                      </span>
                    )}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>
        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-gray-200 space-y-2">
          <Link
            href="/"
            onClick={() => setMobileMenuOpen(false)}
            className="flex items-center gap-3 px-4 py-3 text-gray-600 hover:bg-gray-50 rounded-lg transition-colors"
          >
            <Home size={20} />
            Naar chat
          </Link>
        </div>
      </div>

      <div className="flex">
        <aside className="hidden lg:flex w-64 bg-primary-900 flex-col fixed h-screen">
          <div className="p-6 border-b border-primary-700">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 flex-shrink-0 flex items-center justify-center overflow-hidden rounded-lg">
                <Image src="/images/benji-logo-2.png" alt="Talk To Benji" width={40} height={40} className="object-contain h-full w-auto" style={{ width: "auto", height: "auto" }} />
              </div>
              <div>
                <h1 className="text-xl font-bold text-white">Talk To Benji</h1>
                <p className="text-sm text-gray-300">Admin Panel</p>
              </div>
            </div>
          </div>

          <nav className="flex-1 p-4">
            <ul className="space-y-2">
              {navItems.map((item) => {
                const isActive = pathname === item.href;
                const Icon = item.icon;
                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors border ${
                        isActive
                          ? "bg-white/10 text-white border-primary-700"
                          : "text-gray-300 hover:bg-white/5 border-transparent"
                      }`}
                    >
                      <Icon size={20} />
                      <span className="flex-1">{item.label}</span>
                      {item.badge > 0 && (
                        <span className="inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 rounded-full text-xs font-bold bg-red-500 text-white">
                          {item.badge}
                        </span>
                      )}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </nav>

          <div className="p-4 border-t border-primary-700 space-y-2">
            <Link
              href="/"
              className="flex items-center gap-3 px-4 py-3 text-gray-300 hover:bg-white/5 rounded-lg transition-colors border border-transparent hover:border-primary-700"
            >
              <Home size={20} />
              Naar chat
            </Link>
          </div>
        </aside>

        <main className="flex-1 lg:ml-64 min-h-screen bg-primary-50">
          <div className="p-4 sm:p-6 lg:p-8">{children}</div>
        </main>
      </div>
    </div>
  );
}

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
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
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <AdminLogin onLogin={handleLogin} />;
  }

  return (
    <AdminAuthProvider adminToken={adminToken}>
      <AdminLayoutInner>{children}</AdminLayoutInner>
      {/* Floating logout button */}
      <button
        onClick={handleLogout}
        className="fixed bottom-4 right-4 lg:bottom-6 lg:right-6 z-50 flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-full shadow-lg hover:bg-red-700 transition-colors text-sm"
      >
        <LogOut size={16} />
        Uitloggen
      </button>
    </AdminAuthProvider>
  );
}
