"use client";

import { usePathname } from "next/navigation";
import { GlobalMenu } from "./GlobalMenu";

/** Toont GlobalMenu alleen op pagina's zonder eigen header met menu. Chat, privacy en AV hebben het menu in de header. */
const PAGES_WITH_HEADER_MENU = ["/", "/privacy", "/algemene-voorwaarden", "/faq"];

export function LayoutMenu() {
  const pathname = usePathname();
  if (PAGES_WITH_HEADER_MENU.includes(pathname)) return null;
  return <GlobalMenu />;
}
