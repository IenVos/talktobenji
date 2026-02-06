"use client";

import { usePathname } from "next/navigation";
import { GlobalMenu } from "./GlobalMenu";

/** Toont GlobalMenu alleen op pagina's zonder eigen header/menu. Admin heeft eigen layout. */
const PAGES_WITH_OWN_MENU = ["/", "/privacy", "/algemene-voorwaarden", "/faq", "/registreren", "/inloggen"];
// account/* heeft eigen sidebar, gesprek/[id] krijgt wel GlobalMenu

export function LayoutMenu() {
  const pathname = usePathname();
  if (PAGES_WITH_OWN_MENU.includes(pathname) || pathname.startsWith("/admin") || pathname.startsWith("/account")) return null;
  return <GlobalMenu />;
}
