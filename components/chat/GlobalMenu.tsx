"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { MoreVertical, Info, MessageCircle, MessagesSquare, UserPlus, LogIn } from "lucide-react";
import { useAboutModal } from "@/lib/AboutModalContext";

type GlobalMenuProps = {
  lastConversationDate?: string | null;
};

export function GlobalMenu({ lastConversationDate = null }: GlobalMenuProps) {
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
      label: "Nieuw gesprek",
      icon: MessageCircle,
      onClick: () => {
        setOpen(false);
        if (typeof window !== "undefined") {
          localStorage.removeItem("benji_session_id");
          window.location.href = "/";
        } else {
          router.push("/");
        }
      },
    },
    {
      label: "Registreren",
      icon: UserPlus,
      onClick: () => handleAccountItem("Binnenkort beschikbaar"),
    },
    {
      label: "Inloggen",
      icon: LogIn,
      onClick: () => handleAccountItem("Binnenkort beschikbaar"),
    },
    {
      label: lastConversationDate ? `Mijn gesprekken · ${lastConversationDate}` : "Mijn gesprekken",
      icon: MessagesSquare,
      onClick: () => {
        handleAccountItem(
          lastConversationDate
            ? "Mijn gesprekken is binnenkort beschikbaar. Je gesprekken worden lokaal opgeslagen."
            : "Log in om je gesprekken te bekijken. Binnenkort beschikbaar."
        );
      },
    },
  ];

  return (
    <div
      className="fixed right-0 z-[9999] w-fit flex items-center"
      style={{
        top: "max(1.25rem, calc(env(safe-area-inset-top) + 1rem))",
        right: "max(0.75rem, env(safe-area-inset-right))",
      }}
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
          className="absolute right-0 top-full mt-1 w-64 bg-white rounded-xl shadow-lg border border-gray-100 py-1 z-[100]"
          role="menu"
          onClick={(e) => e.stopPropagation()}
        >
          {binnenkortMsg && (
            <div className="px-4 py-2 text-xs text-primary-700 bg-primary-100 border-b border-primary-200">
              {binnenkortMsg}
            </div>
          )}
          {menuItems.map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.label}
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  item.onClick();
                }}
                className="w-full flex items-center gap-3 px-4 py-2.5 text-left text-sm text-gray-800 hover:bg-gray-100 first:rounded-t-xl last:rounded-b-xl transition-all duration-200"
                role="menuitem"
              >
                <Icon size={18} strokeWidth={2} className="flex-shrink-0 text-primary-600" />
                <span className="truncate">{item.label}</span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
