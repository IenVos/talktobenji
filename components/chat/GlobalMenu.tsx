"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { MoreVertical, Info, HelpCircle, MessageSquare, MessagesSquare, UserPlus, LogIn, PencilLine, CalendarCheck, Target, ClipboardCheck, House, Gem } from "lucide-react";
import { useAboutModal } from "@/lib/AboutModalContext";
import { hexToDarker } from "@/lib/utils";

type GlobalMenuProps = {
  lastConversationDate?: string | null;
  /** In de header: vast in de sticky header, verticaal gecentreerd. Anders: fixed rechtsboven. */
  embedded?: boolean;
};

const ORIGINAL_ACCENT = "#6d84a8";

export function GlobalMenu({ lastConversationDate = null, embedded = false }: GlobalMenuProps) {
  const [open, setOpen] = useState(false);
  const [binnenkortMsg, setBinnenkortMsg] = useState<string | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const { setShowAbout } = useAboutModal();
  const { data: session } = useSession();
  const preferences = useQuery(
    api.preferences.getPreferences,
    session?.userId ? { userId: session.userId as string } : "skip"
  );
  const accent = preferences?.accentColor || ORIGINAL_ACCENT;

  useEffect(() => {
    if (!open) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpen(false);
        setBinnenkortMsg(null);
      }
    };
    const timer = setTimeout(() => {
      document.addEventListener("mousedown", handleClickOutside);
    }, 100);
    return () => {
      clearTimeout(timer);
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [open]);

  const handleAccountItem = (msg: string) => {
    setBinnenkortMsg(msg);
    setTimeout(() => setBinnenkortMsg(null), 2000);
  };

  const isLoggedIn = !!session?.userId;

  const menuItems = [
    {
      label: "Over Talk To Benji",
      icon: Info,
      onClick: () => {
        setOpen(false);
        setShowAbout(true);
      },
    },
    {
      label: "Veelgestelde vragen",
      icon: HelpCircle,
      onClick: () => {
        setOpen(false);
        router.push("/faq");
      },
    },
    {
      label: "Nieuw gesprek",
      icon: MessageSquare,
      href: "/chat",
      onBeforeNavigate: () => {
        setOpen(false);
        localStorage.removeItem("benji_session_id");
      },
    },
    {
      label: "Aanmelden",
      icon: UserPlus,
      onClick: () => {
        setOpen(false);
        router.push("/registreren");
      },
    },
    {
      label: "Inloggen",
      icon: LogIn,
      onClick: () => {
        setOpen(false);
        router.push("/inloggen");
      },
    },
    {
      label: "Mijn plek",
      icon: House,
      requiresAuth: true,
      onClick: () => {
        setOpen(false);
        router.push("/account");
      },
    },
    {
      label: lastConversationDate ? `Jouw gesprekken · ${lastConversationDate}` : "Jouw gesprekken",
      icon: MessagesSquare,
      requiresAuth: true,
      onClick: () => {
        setOpen(false);
        router.push("/account/gesprekken");
      },
    },
    {
      label: "Reflecties",
      icon: PencilLine,
      requiresAuth: true,
      onClick: () => {
        setOpen(false);
        router.push("/account/reflecties");
      },
    },
    {
      label: "Persoonlijke doelen",
      icon: Target,
      requiresAuth: true,
      onClick: () => {
        setOpen(false);
        router.push("/account/doelen");
      },
    },
    {
      label: "Check-ins",
      icon: ClipboardCheck,
      requiresAuth: true,
      onClick: () => {
        setOpen(false);
        router.push("/account/reflecties/eerdere-checkins");
      },
    },
    {
      label: "Jouw schatkist",
      icon: Gem,
      requiresAuth: true,
      onClick: () => {
        setOpen(false);
        router.push("/account/herinneringen");
      },
    },
  ];

  return (
    <div
      className={`w-fit flex items-center ${embedded ? "relative" : "fixed right-0 z-[9999]"}`}
      style={
        embedded
          ? { pointerEvents: "auto" }
          : {
              top: "max(1.25rem, calc(env(safe-area-inset-top) + 1rem))",
              right: "max(0.75rem, env(safe-area-inset-right))",
              pointerEvents: "auto",
            }
      }
      ref={menuRef}
    >
      <button
        type="button"
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          setOpen((o) => !o);
        }}
        className="p-2.5 rounded-full text-white transition-colors shadow-md"
        style={{ backgroundColor: hexToDarker(accent, 20) }}
        title="Menu"
        aria-label="Menu openen"
        aria-expanded={open}
      >
        <MoreVertical size={22} strokeWidth={2} className="text-white" />
      </button>

      {open && (
        <div
          className="absolute right-0 top-full mt-1 w-64 bg-white rounded-xl shadow-lg border border-gray-100 py-1 z-[99999]"
          role="menu"
          style={{ pointerEvents: "auto" }}
          onClick={(e) => e.stopPropagation()}
        >
          {binnenkortMsg && (
            <div className="px-4 py-2 text-xs text-primary-700 bg-primary-100 border-b border-primary-200">
              {binnenkortMsg}
            </div>
          )}
          {menuItems.map((item, index) => {
            const Icon = item.icon;
            const showDividerBefore = index === 3 || index === 5;
            const locked = "requiresAuth" in item && item.requiresAuth && !isLoggedIn;
            const itemClass = `w-full flex items-center gap-3 px-4 py-2.5 text-left text-sm transition-all duration-200 ${
              locked ? "text-gray-400 cursor-default" : "text-gray-800 hover:bg-gray-100"
            } ${index === 0 ? "rounded-t-xl" : ""} ${index === menuItems.length - 1 ? "rounded-b-xl" : ""}`;
            if ("href" in item && item.href) {
              return (
                <div key={item.label}>
                  {showDividerBefore && (
                    <div className="my-1 mx-4 border-t border-gray-200" aria-hidden />
                  )}
                  <a
                    href={item.href}
                    onClick={(e) => {
                      item.onBeforeNavigate?.();
                    }}
                    className={`block ${itemClass}`}
                    role="menuitem"
                  >
                    <Icon size={18} strokeWidth={2} className={`flex-shrink-0 ${locked ? "text-gray-400" : "text-primary-600"}`} />
                    <span className="truncate">{item.label}</span>
                  </a>
                </div>
              );
            }
            return (
              <div key={item.label} className="relative group/locked">
                {showDividerBefore && (
                  <div className="my-1 mx-4 border-t border-gray-200" aria-hidden />
                )}
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    if (!locked) item.onClick?.();
                  }}
                  disabled={locked}
                  className={itemClass}
                  role="menuitem"
                >
                  <Icon size={18} strokeWidth={2} className={`flex-shrink-0 ${locked ? "text-gray-400" : "text-primary-600"}`} />
                  <span className="truncate">{item.label}</span>
                </button>
                {locked && (
                  <div className="absolute left-1/2 -translate-x-1/2 bottom-full mb-1 px-3 py-2 bg-primary-800 text-white text-xs rounded-xl whitespace-nowrap opacity-0 group-hover/locked:opacity-100 transition-opacity pointer-events-none z-10 shadow-lg">
                    Met een account krijg je hier toegang tot
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
