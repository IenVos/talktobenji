"use client";

import Image from "next/image";
import Link from "next/link";
import { GlobalMenu } from "./GlobalMenu";

const HEADER_LOGO = "/images/benji-logo-2.png";

const headerStyle = {
  paddingTop: "max(1rem, calc(0.75rem + env(safe-area-inset-top)))",
  paddingBottom: "max(0.75rem, calc(0.5rem + env(safe-area-inset-top) * 0.1))",
} as const;

type HeaderBarProps = {
  /** Op de chatpagina: bij klik op logo, reset sessie i.p.v. navigeren */
  onLogoClick?: () => void;
};

/** Eén gedeelde header voor alle pagina's – logo, Talk To Benji, menu. Altijd identiek. */
export function HeaderBar({ onLogoClick }: HeaderBarProps) {
  const logoContent = (
    <>
      <div className="h-10 sm:h-12 flex items-center justify-center flex-shrink-0 overflow-hidden">
        <Image
          src={HEADER_LOGO}
          alt=""
          width={56}
          height={48}
          className="object-contain h-full w-auto"
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
        {onLogoClick ? (
          <button
            type="button"
            onClick={onLogoClick}
            className="flex items-center gap-3 min-w-0 group cursor-pointer no-underline outline-none bg-transparent border-0 p-0 text-left"
            aria-label="Naar Talk To Benji"
          >
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
        <div className="flex-shrink-0 flex items-center">
          <GlobalMenu embedded />
        </div>
      </div>
    </header>
  );
}
