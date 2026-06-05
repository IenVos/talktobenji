import ChatPageClient, { type NachtConfig } from "../ChatPageClient";
import { fetchQuery } from "convex/nextjs";
import { api } from "@/convex/_generated/api";

export const revalidate = 60;

// Standaardwaarden — overschrijfbaar in de admin (Pagina's → Benji Nacht).
const DEFAULT_NACHT: NachtConfig = {
  introText: "Wakker en alleen met je gedachten? Benji luistert — juist nu, midden in de nacht.",
  question: "Waar wil je over praten?",
  subText: "Anoniem · zonder oordeel · altijd beschikbaar",
  inputPlaceholder: "Wat houdt je wakker?",
  showWaaromButton: false,
  buttons: [
    { id: "voel-me-alleen", label: "Ik kan niet slapen" },
    { id: "omgaan-verdriet", label: "Ik zit met verdriet" },
    { id: "verlies-dierbare", label: "Ik mis iemand" },
    { id: "gewoon-praten", label: "Ik wil gewoon praten" },
  ],
};

type PageProps = {
  searchParams?: { [key: string]: string | string[] | undefined };
};

export default async function Page({ searchParams }: PageProps) {
  const saved = await fetchQuery(api.pageContent.getPublicPageContent, {
    pageKey: "benji-nacht",
  }).catch(() => null);

  const config: NachtConfig = { ...DEFAULT_NACHT };
  if (saved) {
    if (saved.backgroundImageUrl) config.backgroundImageUrl = saved.backgroundImageUrl;
    if (saved.backgroundPosition) config.backgroundPosition = saved.backgroundPosition;
    if (saved.introText) config.introText = saved.introText;
    if (saved.question) config.question = saved.question;
    if (saved.subText !== undefined) config.subText = saved.subText;
    if (saved.inputPlaceholder) config.inputPlaceholder = saved.inputPlaceholder;
    if (saved.showWaaromButton !== undefined) config.showWaaromButton = saved.showWaaromButton === "true";
    if (saved.buttons) {
      try {
        const parsed = JSON.parse(saved.buttons);
        if (Array.isArray(parsed) && parsed.length > 0) config.buttons = parsed;
      } catch {
        /* val terug op standaard */
      }
    }
  }

  return <ChatPageClient searchParams={searchParams ?? {}} nachtConfig={config} />;
}
