/**
 * Standaardteksten voor het intake-formulier, per verliestype.
 *
 * De admin kan deze overschrijven (opgeslagen in Convex, tabel intakeFormulieren).
 * De publieke pagina leest de opgeslagen versie en valt terug op deze defaults.
 * INTAKE_FIELDS stuurt zowel de editor als de volgorde/labels aan.
 */

export type IntakeConfig = {
  eyebrow: string;
  titel: string;
  lede: string;
  situatieLegend: string;
  wieLabel: string;
  wieOpties: string[];
  wanneerLabel: string;
  wanneerOpties: string[];
  zwaarstLabel: string;
  zwaarstSub: string;
  zoektLegend: string;
  hoopLabel: string;
  hoopSub: string;
  waaromLabel: string;
  waaromSub: string;
  belangrijkLegend: string;
  belangrijkHint: string;
  veiligheidLabel: string;
  veiligheidSub: string;
  veiligheidOpties: string[];
  crisisTitel: string;
  crisisTekst: string;
  hulpLabel: string;
  hulpSub: string;
  hulpOpties: string[];
  akkoordLabel: string;
  akkoordItems: string[];
  budgetLabel: string;
  budgetOpties: string[];
  slotLegend: string;
  extraLabel: string;
  submitTekst: string;
  noteTekst: string;
  dankTitel: string;
  dankTekst1: string;
  dankTekst2: string;
  footer: string;
};

const GEDEELDE_LEDE = "Dit is geen inschrijving, maar een eerste kennismaking. **Kosteloos en vrijblijvend.** Ik lees alles zelf, en ik ben eerlijk: Zij aan Zij past niet bij iedereen, en dat is oke. Deze vragen helpen ons allebei om te voelen of het klopt.";

// Velden die persoon & kinderloos delen.
const GEDEELD: Omit<IntakeConfig, "lede" | "situatieLegend" | "wieLabel" | "wieOpties" | "wanneerLabel" | "wanneerOpties"> = {
  eyebrow: "Even kennismaken",
  titel: "Vertel me kort wie je bent",
  zwaarstLabel: "Wat is op dit moment het zwaarst voor je?",
  zwaarstSub: "In je eigen woorden. Een paar zinnen is genoeg, je hoeft het niet mooi te maken.",
  zoektLegend: "Wat je zoekt",
  hoopLabel: "Wat hoop je dat deze acht weken je brengen?",
  hoopSub: "Er is geen goed antwoord. Ik wil vooral weten wat je verwacht.",
  waaromLabel: "Waarom nu?",
  waaromSub: "Is er iets dat maakt dat je juist op dit moment de stap zet?",
  belangrijkLegend: "Belangrijk, voor jou en voor mij",
  belangrijkHint: "Zodat we allebei weten waar we aan toe zijn.",
  veiligheidLabel: "Hoe gaat het op dit moment echt met je?",
  veiligheidSub: "Ik vraag dit serieus, omdat Zij aan Zij geen crisishulp is. Je antwoord verandert niks aan of je welkom bent.",
  veiligheidOpties: [
    "Ik heb verdriet, maar ik ben veilig bij mezelf.",
    "Ik heb soms donkere gedachten, maar niet acuut.",
    "Ik denk er soms aan om er niet meer te zijn.",
  ],
  crisisTitel: "Fijn dat je dit eerlijk deelt.",
  crisisTekst: "Dit bespreken we samen in het kennismakingsgesprek, en ik denk met je mee over wat je op dit moment het beste kan helpen. Je bent hier welkom.",
  hulpLabel: "Krijg je op dit moment professionele hulp?",
  hulpSub: "Bijvoorbeeld van je huisarts, een psycholoog of therapeut.",
  hulpOpties: ["Nee", "Ja", "Niet nu, wel eerder gehad"],
  akkoordLabel: "Weet je wat Zij aan Zij wel en niet is?",
  akkoordItems: [
    "Ik begrijp dat dit **geen therapie of crisishulp** is.",
    "Ik weet dat **Ien er niet dag en nacht is**, en dat Benji dat deel opvangt.",
    "Ik ben oke met **chatten met Benji** (AI) tussen de gesprekken door.",
  ],
  budgetLabel: "De investering is €425 voor acht weken. Past dat bij je?",
  budgetOpties: ["Ja, dat is duidelijk.", "Ik wil er graag eerst even over praten."],
  slotLegend: "Tot slot",
  extraLabel: "Is er iets wat ik vooraf zou moeten weten?",
  submitTekst: "Versturen naar Ien",
  noteTekst: "Ik lees je bericht zelf en neem binnen twee werkdagen contact met je op. Je krijgt zo een bevestiging in je mail.",
  dankTitel: "Dank je wel. Het is bij me binnen.",
  dankTekst1: "Ik lees je bericht zelf, rustig, en neem binnen twee werkdagen contact met je op. Je hebt ook een bevestiging in je mail gekregen.",
  dankTekst2: "Mocht het tot die tijd zwaar worden: Benji is er dag en nacht.",
  footer: "Ik lees je bericht zelf, rustig. Je zit nergens aan vast.",
};

export const DEFAULT_INTAKE: Record<string, IntakeConfig> = {
  persoon: {
    ...GEDEELD,
    lede: GEDEELDE_LEDE,
    situatieLegend: "Je verlies",
    wieLabel: "Wie ben je verloren?",
    wieOpties: ["Mijn partner", "Mijn kind", "Mijn vader of moeder", "Een broer of zus", "Een ander familielid", "Een dierbare vriend(in)", "Iemand anders"],
    wanneerLabel: "Hoe lang geleden?",
    wanneerOpties: ["Korter dan 3 maanden", "3 tot 12 maanden", "1 tot 3 jaar", "Langer dan 3 jaar"],
  },
  kinderloos: {
    ...GEDEELD,
    lede: GEDEELDE_LEDE,
    situatieLegend: "Je situatie",
    wieLabel: "Wat past het beste bij jouw situatie?",
    wieOpties: [
      "We hebben het lang geprobeerd, het is niet gelukt",
      "Om medische redenen kan het niet (meer)",
      "Geen partner om het mee te doen",
      "Ik heb een zwangerschap of kindje verloren",
      "Mijn kinderwens is onvervuld gebleven",
      "Anders",
    ],
    wanneerLabel: "Hoe lang draag je dit al?",
    wanneerOpties: ["Korter dan 3 maanden", "3 tot 12 maanden", "1 tot 3 jaar", "Langer dan 3 jaar"],
  },
};

// Terugval als een verliestype geen eigen default heeft.
export function defaultIntake(verliestype: string): IntakeConfig {
  return DEFAULT_INTAKE[verliestype] ?? DEFAULT_INTAKE.persoon;
}

// Voegt opgeslagen (deel)config samen met de defaults, zodat nieuwe velden nooit leeg zijn.
export function mergeIntake(verliestype: string, opgeslagen: Partial<IntakeConfig> | null | undefined): IntakeConfig {
  const base = defaultIntake(verliestype);
  if (!opgeslagen) return base;
  const out: any = { ...base };
  for (const k of Object.keys(base) as (keyof IntakeConfig)[]) {
    const v = (opgeslagen as any)[k];
    if (v !== undefined && v !== null && !(typeof v === "string" && v === "")) out[k] = v;
  }
  return out as IntakeConfig;
}

// Editor-indeling: groepen met velden.
export type IntakeVeld = { key: keyof IntakeConfig; label: string; kind: "text" | "textarea" | "stringList" };
export const INTAKE_GROEPEN: { groep: string; velden: IntakeVeld[] }[] = [
  { groep: "Kop", velden: [
    { key: "eyebrow", label: "Klein label boven titel", kind: "text" },
    { key: "titel", label: "Titel", kind: "text" },
    { key: "lede", label: "Inleiding (** = vet)", kind: "textarea" },
  ] },
  { groep: "Situatie", velden: [
    { key: "situatieLegend", label: "Sectiekop", kind: "text" },
    { key: "wieLabel", label: "Vraag 1 (keuze)", kind: "text" },
    { key: "wieOpties", label: "Opties vraag 1", kind: "stringList" },
    { key: "wanneerLabel", label: "Vraag 2 (keuze)", kind: "text" },
    { key: "wanneerOpties", label: "Opties vraag 2", kind: "stringList" },
    { key: "zwaarstLabel", label: "Open vraag: zwaarst", kind: "text" },
    { key: "zwaarstSub", label: "Subtekst zwaarst", kind: "text" },
  ] },
  { groep: "Wat je zoekt", velden: [
    { key: "zoektLegend", label: "Sectiekop", kind: "text" },
    { key: "hoopLabel", label: "Vraag: wat hoop je", kind: "text" },
    { key: "hoopSub", label: "Subtekst hoop", kind: "text" },
    { key: "waaromLabel", label: "Vraag: waarom nu", kind: "text" },
    { key: "waaromSub", label: "Subtekst waarom", kind: "text" },
  ] },
  { groep: "Belangrijk (veiligheid, hulp, akkoord, budget)", velden: [
    { key: "belangrijkLegend", label: "Sectiekop", kind: "text" },
    { key: "belangrijkHint", label: "Subtekst sectie", kind: "text" },
    { key: "veiligheidLabel", label: "Vraag: hoe gaat het echt", kind: "text" },
    { key: "veiligheidSub", label: "Subtekst veiligheid", kind: "text" },
    { key: "veiligheidOpties", label: "Opties veiligheid (1e = veilig, 2e/3e tonen crisis-kaart)", kind: "stringList" },
    { key: "crisisTitel", label: "Crisis-kaart titel", kind: "text" },
    { key: "crisisTekst", label: "Crisis-kaart tekst", kind: "textarea" },
    { key: "hulpLabel", label: "Vraag: professionele hulp", kind: "text" },
    { key: "hulpSub", label: "Subtekst hulp", kind: "text" },
    { key: "hulpOpties", label: "Opties hulp", kind: "stringList" },
    { key: "akkoordLabel", label: "Vraag: wel/niet is (akkoorden)", kind: "text" },
    { key: "akkoordItems", label: "Akkoord-vinkjes (** = vet, allemaal verplicht)", kind: "stringList" },
    { key: "budgetLabel", label: "Vraag: budget", kind: "text" },
    { key: "budgetOpties", label: "Opties budget", kind: "stringList" },
  ] },
  { groep: "Tot slot & verzenden", velden: [
    { key: "slotLegend", label: "Sectiekop", kind: "text" },
    { key: "extraLabel", label: "Open vraag: nog iets", kind: "text" },
    { key: "submitTekst", label: "Verzendknop", kind: "text" },
    { key: "noteTekst", label: "Tekst onder knop", kind: "textarea" },
  ] },
  { groep: "Bedankt-scherm", velden: [
    { key: "dankTitel", label: "Titel", kind: "text" },
    { key: "dankTekst1", label: "Tekst 1", kind: "textarea" },
    { key: "dankTekst2", label: "Tekst 2", kind: "textarea" },
    { key: "footer", label: "Voettekst", kind: "text" },
  ] },
];
