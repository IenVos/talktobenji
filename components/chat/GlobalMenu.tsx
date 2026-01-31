"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Info, MessageCircle, Heart, PawPrint, LogIn } from "lucide-react";
import Image from "next/image";
import { useAboutModal } from "@/lib/AboutModalContext";

const MENU_ICON_COLOR = "#859abd";

type GlobalMenuProps = {
  lastConversationDate?: string | null;
};

export function GlobalMenu({ lastConversationDate = null }: GlobalMenuProps) {
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const { setShowAbout } = useAboutModal();

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    if (open) {
      document.addEventListener("click", handleClickOutside);
    }
    return () => document.removeEventListener("click", handleClickOutside);
  }, [open]);

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
      label: "Inloggen",
      icon: LogIn,
      onClick: () => {
        setOpen(false);
        // Inloggen komt later
      },
    },
    {
      label: lastConversationDate
        ? `Mijn gesprekken · ${lastConversationDate}`
        : "Mijn gesprekken",
      icon: MessageCircle,
      onClick: () => {
        setOpen(false);
        // Gesprekken bekijken komt later; nu gewoon menu sluiten
      },
    },
    {
      label: "Ik heb iemand verloren",
      icon: Heart,
      onClick: () => {
        setOpen(false);
        router.push("/?topic=verlies-dierbare");
      },
    },
    {
      label: "Ik zit met verdriet",
      icon: null,
      iconSrc: "/images/verdriet-icon.png",
      onClick: () => {
        setOpen(false);
        router.push("/?topic=omgaan-verdriet");
      },
    },
    {
      label: "Ik mis mijn huisdier",
      icon: PawPrint,
      onClick: () => {
        setOpen(false);
        router.push("/?topic=afscheid-huisdier");
      },
    },
  ];

  return (
    <div className="fixed top-0 right-0 z-50 w-fit p-3 sm:p-4" ref={menuRef}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="p-2 rounded-full text-white/90 hover:bg-white/10 hover:text-white transition-colors"
        title="Menu"
        aria-label="Menu openen"
        aria-expanded={open}
      >
        <Info size={22} strokeWidth={2} />
      </button>

      {open && (
        <div
          className="absolute right-0 top-full mt-1 w-64 bg-white rounded-xl shadow-lg border border-gray-100 py-1"
          role="menu"
        >
          {menuItems.map((item) => {
            const Icon = item.icon;
            const iconSrc = "iconSrc" in item ? item.iconSrc : null;
            return (
              <button
                key={item.label}
                type="button"
                onClick={item.onClick}
                className="w-full flex items-center gap-3 px-4 py-2.5 text-left text-sm text-gray-800 hover:bg-gray-100 first:rounded-t-xl last:rounded-b-xl transition-all duration-200"
                role="menuitem"
              >
                {iconSrc ? (
                  <span className="w-[18px] h-[18px] flex-shrink-0 flex items-center justify-center">
                    <Image src={iconSrc} alt="" width={18} height={18} className="object-contain mix-blend-multiply" />
                  </span>
                ) : Icon ? (
                  <Icon
                    size={18}
                    strokeWidth={2}
                    className="flex-shrink-0"
                    style={{ color: MENU_ICON_COLOR }}
                  />
                ) : null}
                <span className="truncate">{item.label}</span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
