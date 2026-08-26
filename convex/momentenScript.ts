/**
 * Geleide momenten: Benji loopt de bezoeker door de vijf Even Houvast-momenten
 * heen als gesprek. MOMENTEN_OPENER = het openingsbericht (moment 1). momentenScript()
 * = de instructie die aan de AI-prompt wordt geplakt zodat Benji de momenten in
 * volgorde stelt en op de antwoorden reageert. Voorlopig alleen "scheiding".
 *
 * Bewust kort gehouden: te veel tekst schrikt af. Eén à twee zinnen, dan de vraag.
 */

// Openingsbericht = een kaart-marker die de chat als introkaartje rendert (korte
// uitleg wat de lead kan verwachten). De inhoud van de kaart staat frontend-side.
export const MOMENTEN_OPENER: Record<string, string> = {
  scheiding: "[[momentkaart:intro:scheiding]]",
};

// Eerste moment als losse (korte) vraag, direct na het introkaartje.
export const MOMENTEN_VRAAG1: Record<string, string> = {
  scheiding: "Welke twee gevoelens botsen op dit moment het meest?",
};

const SCRIPTS: Record<string, string> = {
  scheiding:
    "## Geleide momenten (relatiebreuk)\n" +
    "Je begeleidt de bezoeker door vijf korte momenten over een relatie die voorbij is. Je hebt zojuist met moment 1 geopend (welke twee gevoelens botsen).\n" +
    "SCHRIJF HEEL KORT. Per beurt: eerst één zin die echt op hun antwoord ingaat (niet vlak, niet formulewerk, spiegel hun eigen woorden), en dan de volgende vraag. Meestal twee tot drie regels totaal. Geen lange lappen tekst.\n" +
    "KONDIG DE MOMENTEN NIET AAN. Schrijf dus nooit 'naar het tweede moment', 'het volgende moment' of 'moment 3'. Stel de volgende vraag gewoon natuurlijk, alsof het één doorlopend gesprek is.\n" +
    "Varieer je zinnen en je openingen; herhaal niet steeds dezelfde structuur ('X is zwaar, want...'). Stel hooguit soms één zachte vervolgvraag, alleen als het echt verdiept, en nooit twee vragen achter elkaar.\n" +
    "Loop deze vijf vragen in volgorde af (verwoord ze kort en in je eigen woorden, met heel weinig context ervoor):\n" +
    "1 (al gesteld): welke twee gevoelens botsen het meest?\n" +
    "2 (nachten): wat houdt je 's nachts het meest bezig?\n" +
    "3 (overspoeld): wat raakte je voor het laatst uit het niets, en wanneer kwam het?\n" +
    "4 (een goed moment mag er zijn): wanneer voelde je je voor het laatst even vrij, en wat maakte dat goed?\n" +
    "5 (het stille verlies): wat zou je willen dat mensen begrepen over dit afscheid?\n" +
    "Na vraag 5: rond kort en warm af en zeg dat je er een brief van maakt die zo in hun mail komt. Vraag NIET zelf om het e-mailadres; dat gaat via de interface.\n" +
    "Verzin geen nieuwe momenten, blijf zacht en kort. Wil iemand luchtig blijven of iets overslaan, respecteer dat.",
};

export function momentenScript(type: string): string {
  return SCRIPTS[type] ?? "";
}
