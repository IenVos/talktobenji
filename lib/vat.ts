export const EU_VAT_RATES: Record<string, number> = {
  AT: 0.20, BE: 0.21, BG: 0.20, CY: 0.19, CZ: 0.21,
  DE: 0.19, DK: 0.25, EE: 0.22, ES: 0.21, FI: 0.25,
  FR: 0.20, GR: 0.24, HR: 0.25, HU: 0.27, IE: 0.23,
  IT: 0.22, LT: 0.21, LU: 0.17, LV: 0.21, MT: 0.18,
  NL: 0.21, PL: 0.23, PT: 0.23, RO: 0.19, SE: 0.25,
  SI: 0.22, SK: 0.23,
};

export const EU_COUNTRY_CODES = Object.keys(EU_VAT_RATES);

export const EU_COUNTRY_NAMES_NL: Record<string, string> = {
  AT: "Oostenrijk",
  BE: "België",
  BG: "Bulgarije",
  CY: "Cyprus",
  CZ: "Tsjechië",
  DE: "Duitsland",
  DK: "Denemarken",
  EE: "Estland",
  ES: "Spanje",
  FI: "Finland",
  FR: "Frankrijk",
  GR: "Griekenland",
  HR: "Kroatië",
  HU: "Hongarije",
  IE: "Ierland",
  IT: "Italië",
  LT: "Litouwen",
  LU: "Luxemburg",
  LV: "Letland",
  MT: "Malta",
  NL: "Nederland",
  PL: "Polen",
  PT: "Portugal",
  RO: "Roemenië",
  SE: "Zweden",
  SI: "Slovenië",
  SK: "Slowakije",
};

export function getVatRate(countryCode: string): number {
  return EU_VAT_RATES[countryCode] ?? 0;
}

export function calculateVat(
  totalPriceCents: number,
  countryCode: string
): {
  totalPrice: number;
  vatRate: number;
  vatAmount: number;
  basePrice: number;
} {
  const vatRate = getVatRate(countryCode);
  const basePrice = Math.round(totalPriceCents / (1 + vatRate));
  const vatAmount = totalPriceCents - basePrice;
  return { totalPrice: totalPriceCents, vatRate, vatAmount, basePrice };
}
