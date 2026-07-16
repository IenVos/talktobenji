/**
 * Gedeelde per-verliestype configuratie voor de "ervaren"-flow:
 * brief-naschrift → taster (/niet-alleen/proef) → brugpagina (/niet-alleen/waarom)
 * → bestaande checkout (/betalen/<slug>).
 *
 * Client-safe (geen server-imports), zodat zowel de pagina's als de mail dit
 * kunnen gebruiken. De teksten hier zijn de defaults; later admin-bewerkbaar.
 */

export type Verliestype =
  | "persoon"
  | "huisdier"
  | "scheiding"
  | "eenzaamheid"
  | "kinderloos"
  | "algemeen";

const GELDIG: Verliestype[] = [
  "persoon",
  "huisdier",
  "scheiding",
  "eenzaamheid",
  "kinderloos",
  "algemeen",
];

export function normVerlies(t?: string | null): Verliestype {
  return t && (GELDIG as string[]).includes(t) ? (t as Verliestype) : "algemeen";
}

// getDagInhoud kent alleen persoon/huisdier/scheiding/eenzaamheid/kinderloos.
// "algemeen" valt terug op de persoon-content.
export function contentTypeVoor(t: Verliestype): string {
  return t === "algemeen" ? "persoon" : t;
}

// Bestaande, werkende checkout-pagina per type (de "kale" betaalstap).
export const CHECKOUT_SLUG: Record<Verliestype, string> = {
  persoon: "niet-alleen-verlies-persoon",
  huisdier: "niet-alleen-huisdier",
  scheiding: "niet-alleen-relatie",
  eenzaamheid: "niet-alleen-eenzaamheid",
  kinderloos: "niet-alleen-kinderloos",
  algemeen: "je-hoeft-het-niet-alleen-te-dragen",
};

export function checkoutPad(t: Verliestype): string {
  return `/betalen/${CHECKOUT_SLUG[t]}`;
}

// Korte, warme aanduiding van het verlies (voor zinnen op de brugpagina).
export const VERLIES_LABEL: Record<Verliestype, string> = {
  persoon: "het gemis van iemand die je liefhad",
  huisdier: "het gemis van een maatje dat elke dag om je heen was",
  scheiding: "het einde van je relatie",
  eenzaamheid: "de dagen dat je je alleen voelt",
  kinderloos: "het verdriet om een kind dat er nooit kwam",
  algemeen: "het verdriet dat je draagt",
};
