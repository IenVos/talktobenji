import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Mensen om je heen | Talk To Benji",
  description:
    "Benji is er voor de momenten dat er niemand is. Hier vind je initiatieven, groepen en mensen die begrijpen wat jij doormaakt.",
};

export default function MensenOmJeHeenLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
