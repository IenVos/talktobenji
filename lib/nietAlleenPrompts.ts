/**
 * Niet Alleen — dagprompts per verliestype
 *
 * TODO: vervang de placeholder teksten door de echte 30 prompts per verliestype.
 * Elke array bevat exact 30 items (index 0 = dag 1, index 29 = dag 30).
 *
 * De prompts passen zich aan op basis van het verliestype dat de gebruiker
 * heeft gekozen bij de onboarding.
 */

type VerliesType = "persoon" | "huisdier" | "relatie" | "gezondheid" | "anders";

const PROMPTS: Record<VerliesType, string[]> = {
  persoon: Array.from({ length: 30 }, (_, i) => `[Dag ${i + 1} — prompt voor verlies van een persoon]`),
  huisdier: Array.from({ length: 30 }, (_, i) => `[Dag ${i + 1} — prompt voor verlies van een huisdier]`),
  relatie: Array.from({ length: 30 }, (_, i) => `[Dag ${i + 1} — prompt voor verlies van een relatie]`),
  gezondheid: Array.from({ length: 30 }, (_, i) => `[Dag ${i + 1} — prompt voor verlies van gezondheid]`),
  anders: Array.from({ length: 30 }, (_, i) => `[Dag ${i + 1} — prompt]`),
};

/**
 * Geeft de prompt terug voor een specifieke dag en verliestype.
 * @param verliesType - het verliestype van de gebruiker
 * @param dag - dagnummer (1-30)
 */
export function getNietAlleenPrompt(verliesType: string, dag: number): string {
  const type = (verliesType as VerliesType) in PROMPTS ? (verliesType as VerliesType) : "anders";
  const index = Math.min(Math.max(dag - 1, 0), 29);
  return PROMPTS[type][index];
}
