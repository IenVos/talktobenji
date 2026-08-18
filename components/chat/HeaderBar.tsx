"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { GlobalMenu } from "./GlobalMenu";

const HEADER_LOGO = "/images/benji-logo-2.png";

const headerStyle = {
  paddingTop: "max(1rem, calc(0.75rem + env(safe-area-inset-top)))",
  paddingBottom: "max(0.75rem, calc(0.5rem + env(safe-area-inset-top) * 0.1))",
} as const;

type HeaderBarProps = {
  /** Op de chatpagina: bij klik op logo, reset sessie i.p.v. navigeren */
  onLogoClick?: () => void;
  /** Klein "maak een gratis account"-regeltje onder de titel (alleen voor bezoekers zonder account). */
  accountLink?: boolean;
};

/** Eén gedeelde header voor alle pagina's – logo, Talk To Benji, menu. Altijd identiek. */
export function HeaderBar({ onLogoClick, accountLink }: HeaderBarProps) {
  const [tabGeopend, setTabGeopend] = useState(false);

  // Opent registratie in een NIEUW tabblad (chat blijft hier open staan) met een
  // callbackUrl terug naar de chat. Synchroon in de klik, anders blokkeert de browser
  // de popup. Na bevestigen koppelt de app het anonieme gesprek automatisch aan het account.
  const openRegistratie = () => {
    const terug = typeof window !== "undefined" ? window.location.pathname : "/benji";
    if (typeof window !== "undefined") {
      window.open(`/registreren?callbackUrl=${encodeURIComponent(terug)}`, "_blank", "noopener");
    }
    setTabGeopend(true);
  };

  const logoContent = (
    <>
      <div className="h-8 w-8 flex items-center justify-center flex-shrink-0 overflow-hidden">
        <Image
          src={HEADER_LOGO}
          alt=""
          width={32}
          height={32}
          className="object-contain"
          style={{ width: "auto", height: "auto" }}
        />
      </div>
      <div className="flex flex-col items-start min-w-0">
        <span className="font-semibold text-primary-500 text-sm sm:text-base leading-tight group-hover:text-primary-400">
          Talk To Benji
        </span>
      </div>
    </>
  );

  return (
    <header
      className="sticky top-0 z-[9999] bg-primary-900 px-4 sm:px-6 flex-shrink-0 flex items-center"
      style={{ ...headerStyle, pointerEvents: "auto" }}
    >
      <div className="max-w-3xl mx-auto flex items-center justify-between gap-3 min-w-0 min-h-[2.5rem] sm:min-h-[3rem] w-full">
        <div className="flex flex-col min-w-0">
          {onLogoClick ? (
            <button
              type="button"
              onClick={onLogoClick}
              className="flex items-center gap-2 min-w-0 group cursor-pointer no-underline outline-none bg-transparent border-0 p-0 text-left"
              aria-label="Terug naar startscherm"
              title="Terug naar startscherm"
            >
              <ArrowLeft size={16} className="text-white/40 group-hover:text-white/70 transition-colors flex-shrink-0" />
              {logoContent}
            </button>
          ) : (
            <Link
              href="/"
              className="flex items-center gap-3 min-w-0 group cursor-pointer no-underline outline-none"
              aria-label="Naar Talk To Benji"
            >
              {logoContent}
            </Link>
          )}
          {accountLink && (
            tabGeopend ? (
              <span className="self-start ml-11 -mt-0.5 text-[11px] leading-tight text-primary-300">
                Nieuw tabblad geopend. Je gesprek blijft hier bewaard.
              </span>
            ) : (
              <button
                type="button"
                onClick={openRegistratie}
                className="self-start ml-11 -mt-0.5 text-[11px] leading-tight text-primary-400/90 hover:text-primary-300 transition-colors bg-transparent border-0 p-0 cursor-pointer text-left"
              >
                Bewaar je gesprek
              </button>
            )
          )}
        </div>
        <div className="flex-shrink-0 flex items-center">
          <GlobalMenu embedded />
        </div>
      </div>
    </header>
  );
}
