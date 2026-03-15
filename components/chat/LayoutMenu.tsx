"use client";

import { usePathname } from "next/navigation";
import { GlobalMenu } from "./GlobalMenu";

/** Toont GlobalMenu alleen op pagina's zonder eigen header/menu. Admin heeft eigen layout. */
const PAGES_WITH_OWN_MENU = ["/", "/privacy", "/algemene-voorwaarden", "/faq", "/registreren", "/inloggen", "/na-verlies", "/alleen-dragen", "/midden-in-de-nacht"];
// account/* heeft eigen sidebar, gesprek/[id] krijgt wel GlobalMenu

export function LayoutMenu() {
  const pathname = usePathname();
  if (!pathname || PAGES_WITH_OWN_MENU.includes(pathname) || pathname.startsWith("/admin") || pathname.startsWith("/account") || pathname.startsWith("/niet-alleen") || pathname.startsWith("/houvast") || pathname.startsWith("/lp/")) return null;
  return <GlobalMenu />;
}
