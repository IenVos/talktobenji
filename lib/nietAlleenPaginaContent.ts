/**
 * Niet Alleen — vaste teksten van de programmapagina (/niet-alleen).
 *
 * De dagelijkse dagcontent staat los (beheerbaar via Niet Alleen e-mails/dagtemplates).
 * Dit gaat alleen over de schermen eromheen: onboarding, naam, afgerond, account
 * gesloten en geen toegang. Beheerbaar via Admin > Pagina's > Niet Alleen
 * (pageContent key "niet-alleen").
 */

export type NietAlleenPaginaContent = {
  // Onboarding stap 1 (verliestype kiezen)
  welkomTitel: string;
  welkomTekst: string;
  verliesLabel: string;
  verderKnop: string;
  // Onboarding stap 2 (naam)
  naamTitelPersoon: string;
  naamTitelHuisdier: string;
  naamTekst: string;
  naamKnop: string;
  naamOverslaan: string;
  // Na dag 30
  afgerondTitel: string;
  afgerondTekst: string;
  afgerondKnopDagboek: string;
  afgerondKnopBenji: string;
  // Account gesloten (vanaf dag 37)
  geslotenTekst: string;
  geslotenKnop: string;
  // Geen toegang (niet ingelogd / verkeerd account)
  geenToegangTekst: string;
  geenToegangKnop: string;
};

export const DEFAULT_NIET_ALLEEN_PAGINA: NietAlleenPaginaContent = {
  welkomTitel: "Welkom bij Niet Alleen",
  welkomTekst:
    "De komende 30 dagen lopen we samen met je mee, één dag tegelijk. Vertel ons eerst waarvoor je hier bent.",
  verliesLabel: "Ik verwerk verlies van:",
  verderKnop: "Verder",

  naamTitelPersoon: "Hoe heette deze persoon?",
  naamTitelHuisdier: "Hoe heette je huisdier?",
  naamTekst:
    "Als je een naam invult, gebruiken we die in de dagelijkse berichten. Je kunt dit ook overslaan.",
  naamKnop: "Begin mijn 30 dagen",
  naamOverslaan: "Overslaan",

  afgerondTitel: "Je 30 dagen zijn klaar",
  afgerondTekst:
    "Dertig dagen lang ben je er geweest voor jezelf. Alles wat je hebt geschreven is van jou.",
  afgerondKnopDagboek: "Bekijk en bewaar jouw dagboek",
  afgerondKnopBenji: "Ga verder met TalkToBenji",

  geslotenTekst:
    "Je 30 dagen zitten erop. Je dagboek blijft van jou, je kunt het altijd bekijken en bewaren.",
  geslotenKnop: "Bekijk jouw dagboek",

  geenToegangTekst:
    "Je hebt geen toegang tot deze pagina. Log in met het account waarmee je Niet Alleen hebt aangeschaft.",
  geenToegangKnop: "Inloggen",
};

/** Voegt opgeslagen (admin) teksten samen met de defaults. Leeg veld = default. */
export function mergeNietAlleenPagina(
  saved: Partial<NietAlleenPaginaContent> | null | undefined
): NietAlleenPaginaContent {
  const d = DEFAULT_NIET_ALLEEN_PAGINA;
  if (!saved) return d;
  const pick = (k: keyof NietAlleenPaginaContent) => {
    const v = saved[k];
    return typeof v === "string" && v.trim() ? v : d[k];
  };
  return {
    welkomTitel: pick("welkomTitel"),
    welkomTekst: pick("welkomTekst"),
    verliesLabel: pick("verliesLabel"),
    verderKnop: pick("verderKnop"),
    naamTitelPersoon: pick("naamTitelPersoon"),
    naamTitelHuisdier: pick("naamTitelHuisdier"),
    naamTekst: pick("naamTekst"),
    naamKnop: pick("naamKnop"),
    naamOverslaan: pick("naamOverslaan"),
    afgerondTitel: pick("afgerondTitel"),
    afgerondTekst: pick("afgerondTekst"),
    afgerondKnopDagboek: pick("afgerondKnopDagboek"),
    afgerondKnopBenji: pick("afgerondKnopBenji"),
    geslotenTekst: pick("geslotenTekst"),
    geslotenKnop: pick("geslotenKnop"),
    geenToegangTekst: pick("geenToegangTekst"),
    geenToegangKnop: pick("geenToegangKnop"),
  };
}
