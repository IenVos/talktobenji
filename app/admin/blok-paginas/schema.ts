/**
 * Veld-schema per bloktype voor de blok-pagina-editor.
 *
 * De editor is volledig schema-gedreven: elk bloktype krijgt hier een lijst
 * velden met een `kind`, en de generieke form rendert daar de juiste invoer
 * voor. Wil je een veld toevoegen/hernoemen, doe dat hier; renderer =
 * components/BlokPaginaView.tsx.
 */

export type FieldKind =
  | "text"
  | "textarea"
  | "rich"
  | "image"
  | "select"
  | "number"
  | "stringList"
  | "numberList"
  | "objectList";

export type Field = {
  key: string;
  label: string;
  kind: FieldKind;
  rows?: number;
  hint?: string;
  options?: { value: string; label: string }[];
  itemLabel?: string; // voor lijsten ("Stem", "Stap"...)
  fields?: Field[]; // voor objectList
};

const INTAKE_HINT = 'Vul "intake" in om naar het eigen kennismakingsformulier te wijzen.';

// Herbruikbare achtergrond-select (alleen zinvol bij sectie-blokken).
export const ACHTERGROND_OPTIES = [
  { value: "", label: "Standaard grond" },
  { value: "paper", label: "Papier" },
  { value: "wit", label: "Wit" },
];

// Bloktypes die een `achtergrond`-instelling gebruiken (sectionStyle in de renderer).
export const HEEFT_ACHTERGROND = new Set([
  "herkenning", "kern", "cadence", "stappen", "ditkrijgje",
  "account", "document", "nietis", "ien", "ervaringen", "faq", "offer", "ehmagnet", "keuze",
]);

// Iconen voor de keuze-kaartjes.
export const KEUZE_ICOON_OPTIES = [
  { value: "hart", label: "Hartje" },
  { value: "poot", label: "Pootje" },
  { value: "mensen", label: "Twee mensen" },
  { value: "praat", label: "Praatwolk" },
  { value: "blad", label: "Blaadje" },
  { value: "algemeen", label: "Stip (algemeen)" },
];

// Verliestype-codes (voor ?type= koppeling vanuit Even Houvast).
export const KEUZE_TYPE_OPTIES = [
  { value: "", label: "Geen koppeling" },
  { value: "persoon", label: "Persoon" },
  { value: "huisdier", label: "Huisdier" },
  { value: "relatie", label: "Relatie / scheiding" },
  { value: "eenzaamheid", label: "Eenzaamheid" },
  { value: "kinderloos", label: "Ongewenst kinderloos" },
];

export const BLOCK_LABELS: Record<string, string> = {
  header: "Kop / logobalk",
  hero: "Hero (openingsblok)",
  herkenning: "Herkenning",
  band: "Band (donkergroen)",
  kern: "Kern",
  cadence: "Cadans (lagen + tijdlijn)",
  stappen: "Stappen",
  ditkrijgje: "Dit krijg je",
  account: "Account (carousel)",
  document: "Document / handreiking",
  nietis: "Geen / Wel",
  ien: "Over Ien",
  ervaringen: "Ervaringen (quotes)",
  faq: "Veelgestelde vragen",
  ehmagnet: "Even Houvast (magnet)",
  keuze: "Keuze (verliestypes)",
  offer: "Aanbod (prijs)",
  final: "Slotband + CTA",
};

// Volgorde in de "blok toevoegen"-keuzelijst.
export const BLOCK_TYPES = [
  "header", "hero", "herkenning", "band", "kern", "cadence", "stappen",
  "ditkrijgje", "account", "document", "nietis", "ien", "ervaringen", "faq", "ehmagnet", "keuze", "offer", "final",
];

export const BLOCK_SCHEMAS: Record<string, Field[]> = {
  header: [
    { key: "logo", label: "Logo", kind: "image" },
    { key: "merk", label: "Merknaam", kind: "text" },
    { key: "sub", label: "Subtitel (naast merk)", kind: "text" },
  ],
  hero: [
    { key: "eyebrow", label: "Label (klein, boven titel)", kind: "text" },
    { key: "titel1", label: "Titel regel 1", kind: "text" },
    { key: "titel2", label: "Titel regel 2 (zacht)", kind: "text" },
    {
      key: "body", label: "Alinea's", kind: "objectList", itemLabel: "Alinea",
      fields: [
        { key: "tekst", label: "Tekst", kind: "textarea", rows: 2 },
        { key: "soort", label: "Stijl", kind: "select", options: [
          { value: "", label: "Gewoon" },
          { value: "whisper", label: "Fluister" },
          { value: "thought", label: "Gedachte" },
        ] },
      ],
    },
    { key: "ctaText", label: "Knoptekst", kind: "text" },
    { key: "ctaUrl", label: "Knop-link", kind: "text", hint: INTAKE_HINT },
    { key: "micro", label: "Microtekst onder knop", kind: "text" },
    { key: "facts", label: "Feiten-regel (onderaan)", kind: "rich" },
    { key: "afbeelding", label: "Afbeelding (optioneel)", kind: "image" },
  ],
  herkenning: [
    { key: "eyebrow", label: "Label", kind: "text" },
    { key: "titel", label: "Titel", kind: "text" },
    { key: "lead", label: "Inleiding", kind: "textarea", rows: 2 },
    { key: "voices", label: "Stemmen (herkenning)", kind: "stringList", itemLabel: "Stem" },
    { key: "pull", label: "Uitgelichte zin", kind: "rich" },
    { key: "afbeelding", label: "Afbeelding (optioneel)", kind: "image" },
  ],
  band: [
    { key: "eyebrow", label: "Label", kind: "text" },
    { key: "titel", label: "Titel (Enter = nieuwe regel)", kind: "textarea", rows: 2 },
    { key: "lead", label: "Inleiding", kind: "textarea", rows: 2 },
    { key: "stack", label: "Opsomming", kind: "stringList", itemLabel: "Regel" },
    { key: "kicker", label: "Kicker", kind: "rich" },
    { key: "sub", label: "Subregel", kind: "text" },
    { key: "afbeelding", label: "Afbeelding (optioneel)", kind: "image" },
  ],
  kern: [
    { key: "eyebrow", label: "Label", kind: "text" },
    { key: "titel", label: "Titel (Enter = nieuwe regel)", kind: "textarea", rows: 2 },
    { key: "naastLabel", label: "Label boven lijst", kind: "text" },
    { key: "naast", label: "Lijst", kind: "stringList", itemLabel: "Regel" },
    { key: "slot", label: "Slotzin", kind: "textarea", rows: 2 },
    { key: "afbeelding", label: "Afbeelding (optioneel)", kind: "image" },
  ],
  cadence: [
    { key: "eyebrow", label: "Label", kind: "text" },
    { key: "titel", label: "Titel", kind: "text" },
    { key: "para1", label: "Alinea 1", kind: "rich" },
    { key: "para2", label: "Alinea 2", kind: "textarea", rows: 2 },
    { key: "layersHead", label: "Kop boven lagen", kind: "text" },
    {
      key: "layers", label: "Lagen", kind: "objectList", itemLabel: "Laag",
      fields: [
        { key: "badge", label: "Badge (bv. wk 1)", kind: "text" },
        { key: "lh", label: "Kop", kind: "text" },
        { key: "lb", label: "Subtekst", kind: "text" },
        { key: "kleur", label: "Kleur", kind: "select", options: [
          { value: "", label: "Standaard" },
          { value: "amber", label: "Amber" },
          { value: "ring", label: "Kennismaking (ring)" },
        ] },
      ],
    },
    { key: "foot", label: "Voettekst", kind: "rich" },
    { key: "timelineWeken", label: "Aantal weken tijdlijn", kind: "number" },
    { key: "timelineStart", label: "Startweken (komma-gescheiden)", kind: "numberList" },
    { key: "timelineGesprek", label: "Gespreksweken (komma-gescheiden)", kind: "numberList" },
    {
      key: "legend", label: "Legenda", kind: "objectList", itemLabel: "Item",
      fields: [
        { key: "label", label: "Label", kind: "text" },
        { key: "soort", label: "Vorm", kind: "select", options: [
          { value: "dot", label: "Stip" },
          { value: "ring", label: "Ring" },
          { value: "bar", label: "Balk" },
        ] },
      ],
    },
  ],
  stappen: [
    { key: "eyebrow", label: "Label", kind: "text" },
    { key: "titel", label: "Titel", kind: "text" },
    {
      key: "steps", label: "Stappen", kind: "objectList", itemLabel: "Stap",
      fields: [
        { key: "kop", label: "Kop", kind: "text" },
        { key: "tekst", label: "Tekst", kind: "textarea", rows: 2 },
      ],
    },
    { key: "afbeelding", label: "Afbeelding (optioneel)", kind: "image" },
  ],
  ditkrijgje: [
    { key: "eyebrow", label: "Label", kind: "text" },
    { key: "titel", label: "Titel", kind: "text" },
    {
      key: "items", label: "Items", kind: "objectList", itemLabel: "Item",
      fields: [
        { key: "kop", label: "Kop", kind: "text" },
        { key: "tekst", label: "Tekst", kind: "textarea", rows: 2 },
      ],
    },
    { key: "afbeelding", label: "Afbeelding (optioneel)", kind: "image" },
  ],
  account: [
    { key: "eyebrow", label: "Label", kind: "text" },
    { key: "titel", label: "Titel", kind: "text" },
    { key: "lead", label: "Inleiding", kind: "textarea", rows: 2 },
    {
      key: "shots", label: "Schermafbeeldingen", kind: "objectList", itemLabel: "Beeld",
      fields: [
        { key: "img", label: "Afbeelding", kind: "image" },
        { key: "label", label: "Bijschrift", kind: "text" },
      ],
    },
  ],
  document: [
    { key: "eyebrow", label: "Label", kind: "text" },
    { key: "titel", label: "Titel", kind: "text" },
    { key: "lead", label: "Inleiding", kind: "textarea", rows: 2 },
    {
      key: "cards", label: "Kaarten", kind: "objectList", itemLabel: "Kaart",
      fields: [
        { key: "tag", label: "Tag (klein label)", kind: "text" },
        { key: "kop", label: "Kop", kind: "text" },
        { key: "tekst", label: "Tekst", kind: "textarea", rows: 2 },
        { key: "img", label: "Afbeelding (optioneel)", kind: "image" },
      ],
    },
  ],
  nietis: [
    { key: "eyebrow", label: "Label", kind: "text" },
    { key: "titel", label: "Titel", kind: "text" },
    {
      key: "pairs", label: "Paren", kind: "objectList", itemLabel: "Paar",
      fields: [
        { key: "geen", label: "Geen (eerste woord wordt vet)", kind: "text" },
        { key: "wel", label: "Wel (eerste woord geaccentueerd)", kind: "text" },
      ],
    },
    { key: "afbeelding", label: "Afbeelding (optioneel)", kind: "image" },
  ],
  ien: [
    { key: "eyebrow", label: "Label", kind: "text" },
    { key: "titel", label: "Titel", kind: "text" },
    { key: "foto", label: "Foto", kind: "image" },
    { key: "paras", label: "Alinea's", kind: "stringList", itemLabel: "Alinea" },
  ],
  ervaringen: [
    { key: "eyebrow", label: "Label", kind: "text" },
    { key: "titel", label: "Titel", kind: "text" },
    {
      key: "quotes", label: "Quotes", kind: "objectList", itemLabel: "Quote",
      fields: [
        { key: "tekst", label: "Tekst", kind: "textarea", rows: 2 },
        { key: "bron", label: "Bron", kind: "text" },
        { key: "img", label: "Foto (optioneel)", kind: "image" },
      ],
    },
    { key: "afbeelding", label: "Afbeelding (optioneel)", kind: "image" },
  ],
  faq: [
    { key: "eyebrow", label: "Label", kind: "text" },
    { key: "titel", label: "Titel", kind: "text" },
    { key: "lead", label: "Inleiding (optioneel)", kind: "textarea", rows: 2 },
    {
      key: "items", label: "Vragen", kind: "objectList", itemLabel: "Vraag",
      fields: [
        { key: "vraag", label: "Vraag", kind: "text" },
        { key: "antwoord", label: "Antwoord", kind: "textarea", rows: 3 },
      ],
    },
    { key: "afbeelding", label: "Afbeelding (optioneel)", kind: "image" },
  ],
  ehmagnet: [
    { key: "eyebrow", label: "Label (klein, optioneel)", kind: "text" },
    { key: "kop", label: "Kop", kind: "text" },
    { key: "tekst", label: "Tekst (Enter = nieuwe regel; regel met ✓ wordt een vinkje; **vet**)", kind: "textarea", rows: 9 },
    { key: "knopText", label: "Knoptekst", kind: "text" },
    { key: "knopUrl", label: "Knop-link (bv. /even-houvast/huisdier)", kind: "text" },
    { key: "afbeelding", label: "Afbeelding (optioneel)", kind: "image" },
  ],
  keuze: [
    { key: "eyebrow", label: "Label (klein, boven titel)", kind: "text" },
    { key: "titel", label: "Titel", kind: "text" },
    { key: "lead", label: "Inleiding", kind: "textarea", rows: 2 },
    {
      key: "opties", label: "Keuze-kaartjes", kind: "objectList", itemLabel: "Keuze",
      fields: [
        { key: "titel", label: "Titel", kind: "text" },
        { key: "sub", label: "Subregel", kind: "text" },
        { key: "url", label: "Link", kind: "text", hint: INTAKE_HINT },
        { key: "icoon", label: "Icoon", kind: "select", options: KEUZE_ICOON_OPTIES },
        { key: "type", label: "Koppel aan verliestype (voor ?type= vanuit Even Houvast)", kind: "select", options: KEUZE_TYPE_OPTIES },
      ],
    },
    { key: "slot", label: "Slotzin onder de kaartjes (optioneel)", kind: "text" },
  ],
  offer: [
    { key: "introLabel", label: "Introlabel", kind: "text" },
    { key: "prijs", label: "Prijs", kind: "text" },
    { key: "prijsSub", label: "Prijs-subtekst", kind: "text" },
    { key: "bullets", label: "Opsomming", kind: "stringList", itemLabel: "Regel" },
    { key: "ctaText", label: "Knoptekst", kind: "text" },
    { key: "ctaUrl", label: "Knop-link", kind: "text", hint: INTAKE_HINT },
    { key: "micro", label: "Microtekst onder knop", kind: "text" },
    { key: "anchor", label: "Anker-id (voor #-link)", kind: "text" },
    { key: "afbeelding", label: "Afbeelding (optioneel)", kind: "image" },
  ],
  final: [
    { key: "eyebrow", label: "Label", kind: "text" },
    { key: "titel", label: "Titel (Enter = nieuwe regel)", kind: "textarea", rows: 2 },
    { key: "lead", label: "Inleiding", kind: "textarea", rows: 2 },
    { key: "stack", label: "Opsomming", kind: "stringList", itemLabel: "Regel" },
    { key: "kicker", label: "Kicker", kind: "rich" },
    { key: "sub", label: "Subregel", kind: "text" },
    { key: "ctaText", label: "Knoptekst", kind: "text" },
    { key: "ctaUrl", label: "Knop-link", kind: "text", hint: INTAKE_HINT },
    { key: "micro", label: "Microtekst onder knop", kind: "text" },
    { key: "afbeelding", label: "Afbeelding (optioneel)", kind: "image" },
  ],
};

// Lege waarde voor een veld, op basis van zijn kind.
function leegVeld(f: Field): any {
  switch (f.kind) {
    case "number": return f.key === "timelineWeken" ? 8 : 0;
    case "stringList":
    case "numberList":
    case "objectList": return [];
    case "select": return f.options?.[0]?.value ?? "";
    default: return "";
  }
}

// Bouwt een leeg blok voor een bloktype.
export function leegBlok(type: string): any {
  const blok: any = { key: `${type}-${Math.random().toString(36).slice(2, 8)}`, type };
  for (const f of BLOCK_SCHEMAS[type] || []) blok[f.key] = leegVeld(f);
  if (HEEFT_ACHTERGROND.has(type)) blok.achtergrond = "";
  if (type === "ehmagnet") {
    blok.eyebrow = "";
    blok.kop = "Nog niet klaar? Dat begrijp ik. 💙";
    blok.tekst =
      "Soms is de stap naar een volledig programma nog te groot.\n\nEn dat hoeft ook niet vandaag.\n\n**Maar als je hier bent, draag je iets. En dat verdient een plek.**\n\nEven Houvast is gratis, en het kost je maar een paar minuten:\n✓ Vijf korte vragen\n✓ Typen, inspreken of een foto toevoegen\n✓ Benji maakt er een persoonlijke brief van, om te bewaren\n\nGeen programma. Geen verplichting. Gewoon een klein moment voor het verlies dat je draagt.";
    blok.knopText = "Begin gratis met Even Houvast →";
    blok.knopUrl = "/even-houvast/huisdier";
    blok.achtergrond = "paper";
  }
  return blok;
}
