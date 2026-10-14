import type { Metadata } from "next";

// Eigen titel voor de contactpagina (anders erft hij de root-standaardtitel).
export const metadata: Metadata = {
  title: "Contact | Talk To Benji",
};

export default function ContactLayout({ children }: { children: React.ReactNode }) {
  return children;
}
