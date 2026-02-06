"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { MoreVertical, Info, HelpCircle, MessageSquare, MessagesSquare, UserPlus, LogIn } from "lucide-react";
import { useAboutModal } from "@/lib/AboutModalContext";

type GlobalMenuProps = {
  lastConversationDate?: string | null;
  /** In de header: vast in de sticky header, verticaal gecentreerd. Anders: fixed rechtsboven. */
  embedded?: boolean;
};

export function GlobalMenu({ lastConversationDate = null, embedded = false }: GlobalMenuProps) {
  const [open, setOpen] = useState(false);
  const [binnenkortMsg, setBinnenkortMsg] = useState<string | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const { setShowAbout } = useAboutModal();

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
      label: lastConversationDate ? `Mijn gesprekken · ${lastConversationDate}` : "Mijn gesprekken",
      icon: MessagesSquare,
      onClick: () => {
        setOpen(false);
        router.push("/mijn-gesprekken");
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
        className="p-2.5 rounded-full bg-primary-800/90 text-white hover:bg-primary-700 transition-colors shadow-md"
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
            const showDividerBefore = index === 3; // Lichte streep vóór "Aanmelden"
            const itemClass = `w-full flex items-center gap-3 px-4 py-2.5 text-left text-sm text-gray-800 hover:bg-gray-100 transition-all duration-200 ${index === 0 ? "rounded-t-xl" : ""} ${index === menuItems.length - 1 ? "rounded-b-xl" : ""}`;
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
                    <Icon size={18} strokeWidth={2} className="flex-shrink-0 text-primary-600" />
                    <span className="truncate">{item.label}</span>
                  </a>
                </div>
              );
            }
            return (
              <div key={item.label}>
                {showDividerBefore && (
                  <div className="my-1 mx-4 border-t border-gray-200" aria-hidden />
                )}
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    item.onClick?.();
                  }}
                  className={itemClass}
                  role="menuitem"
                >
                  <Icon size={18} strokeWidth={2} className="flex-shrink-0 text-primary-600" />
                  <span className="truncate">{item.label}</span>
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
