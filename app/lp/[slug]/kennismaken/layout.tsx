import type { Metadata } from "next";

type Props = { params: { slug: string } };

// Eigen titel per intake-/kennismaakpagina. Zonder dit erft elke pagina de
// root-standaardtitel (dubbele <title> over alle verliestypes heen).
const TITELS: Record<string, string> = {
  "ik-voel-me-eenzaam": "Kennismaken | Niet meer alleen met je eenzaamheid",
  "relatie-voorbij": "Kennismaken | Steun na een relatiebreuk of scheiding",
  "verlies-huisdier": "Kennismaken | Steun bij het verlies van je huisdier",
  "zij-aan-zij-eenzaamheid": "Zij aan Zij | Persoonlijke begeleiding bij eenzaamheid",
  "zij-aan-zij-huisdier": "Zij aan Zij | Begeleiding na het verlies van je huisdier",
  "zij-aan-zij-kinderloos": "Zij aan Zij | Begeleiding bij ongewenst kinderloos zijn",
  "zij-aan-zij-relatie": "Zij aan Zij | Begeleiding na een relatiebreuk",
  "zij-aan-zij-verlies-van-iemand": "Zij aan Zij | Persoonlijke begeleiding bij rouw",
};

export function generateMetadata({ params }: Props): Metadata {
  return {
    title: TITELS[params.slug] ?? "Kennismaken | Talk To Benji",
  };
}

export default function KennismakenLayout({ children }: { children: React.ReactNode }) {
  return children;
}
