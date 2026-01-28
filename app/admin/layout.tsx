"use client";

import { useState, useEffect } from "react";
import { AdminLogin } from "@/components/admin/AdminLogin";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Settings, LogOut, Home, Menu, X, BookOpen } from "lucide-react";
import Image from "next/image";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const res = await fetch("/api/admin/check");
      setIsAuthenticated(res.ok);
    } catch {
      setIsAuthenticated(false);
    }
  };

  const handleLogout = async () => {
    await fetch("/api/admin/logout", { method: "POST" });
    setIsAuthenticated(false);
  };

  // Loading state
  if (isAuthenticated === null) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  // Show login if not authenticated
  if (!isAuthenticated) {
    return <AdminLogin onLogin={() => setIsAuthenticated(true)} />;
  }

  const navItems = [
    { href: "/admin", label: "Instellingen", icon: Settings },
    { href: "/admin/knowledge", label: "Knowledge Base", icon: BookOpen },
  ];

  return (
    <div className="min-h-screen min-h-[100dvh] bg-white">
      {/* Mobile header */}
      <header className="lg:hidden bg-primary-900 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-white/10 rounded-lg flex items-center justify-center border border-primary-700">
            <Image src="/talktobenji-logo.png" alt="TalkToBenji Logo" width={16} height={16} />
          </div>
          <div>
            <h1 className="text-lg font-bold text-white">TalkToBenji</h1>
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

      {/* Mobile menu overlay */}
      {mobileMenuOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/50 z-40"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* Mobile menu */}
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
                      isActive
                        ? "bg-primary-50 text-primary-600"
                        : "text-gray-600 hover:bg-gray-50"
                    }`}
                  >
                    <Icon size={20} />
                    {item.label}
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
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 px-4 py-3 text-red-600 hover:bg-red-50 rounded-lg transition-colors w-full"
          >
            <LogOut size={20} />
            Uitloggen
          </button>
        </div>
      </div>

      <div className="flex">
        {/* Desktop Sidebar - PAARS */}
        <aside className="hidden lg:flex w-64 bg-primary-900 flex-col fixed h-screen">
          <div className="p-6 border-b border-primary-700">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white/10 rounded-lg flex items-center justify-center border border-primary-700">
                <Image src="/talktobenji-logo.png" alt="TalkToBenji Logo" width={20} height={20} />
              </div>
              <div>
                <h1 className="text-xl font-bold text-white">TalkToBenji</h1>
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
                      {item.label}
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
            <button
              onClick={handleLogout}
              className="flex items-center gap-3 px-4 py-3 text-red-400 hover:bg-red-900/20 rounded-lg transition-colors w-full border border-transparent hover:border-red-800"
            >
              <LogOut size={20} />
              Uitloggen
            </button>
          </div>
        </aside>

        {/* Main content - WIT */}
        <main className="flex-1 lg:ml-64 min-h-screen bg-gray-50">
          <div className="p-4 sm:p-6 lg:p-8">{children}</div>
        </main>
      </div>
    </div>
  );
}