import type { Metadata } from "next";

// Eigen titel voor de jaar-toegang landingspagina (anders erft hij de root-standaardtitel).
export const metadata: Metadata = {
  title: "Een jaar lang Benji dichtbij | Talk To Benji",
  description:
    "Een jaar lang onbeperkt praten met Benji, dag en nacht. Een luisterend oor bij verdriet, rouw en eenzaamheid, wanneer jij het nodig hebt.",
};

export default function JaarToegangLayout({ children }: { children: React.ReactNode }) {
  return children;
}
