import type { Metadata } from "next";

// Eigen titel voor de inlogpagina (anders erft hij de root-standaardtitel).
export const metadata: Metadata = {
  title: "Inloggen | Talk To Benji",
};

export default function InloggenLayout({ children }: { children: React.ReactNode }) {
  return children;
}
