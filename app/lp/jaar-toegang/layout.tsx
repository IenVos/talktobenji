import type { Metadata } from "next";

// Eigen titel voor de jaar-toegang landingspagina (anders erft hij de root-standaardtitel).
export const metadata: Metadata = {
  title: "Een jaar lang Benji dichtbij | Talk To Benji",
};

export default function JaarToegangLayout({ children }: { children: React.ReactNode }) {
  return children;
}
