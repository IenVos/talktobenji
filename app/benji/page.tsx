import type { Metadata } from "next";
import ChatPageClient from "../ChatPageClient";

export const metadata: Metadata = {
  title: "Praat met Benji | Direct een luisterend oor, dag en nacht",
  description:
    "Start meteen een gesprek met Benji. Anoniem je hart luchten bij verdriet, rouw of eenzaamheid, zonder oordeel en op elk moment van de dag of nacht.",
};

type PageProps = {
  searchParams?: { [key: string]: string | string[] | undefined };
};

export default function Page({ searchParams }: PageProps) {
  return (
    <>
      {/* Server-gerenderde H1 (sr-only): geeft Google en schermlezers context
          over de chatpagina, zonder de UI te veranderen. Geen verborgen SEO-tekst. */}
      <h1 className="sr-only">
        Praat met Benji: een luisterend oor bij verdriet, rouw en eenzaamheid
      </h1>
      <ChatPageClient searchParams={searchParams ?? {}} />
    </>
  );
}
