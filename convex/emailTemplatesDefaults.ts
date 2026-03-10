/**
 * Standaard e-mail templates — plain TS, veilig te importeren in browser én server.
 */
export const DEFAULT_TEMPLATES = {
  trial_day5: {
    subject: "Nog 2 dagen — je proefperiode loopt bijna af",
    bodyText: `We wilden je even laten weten dat je proefperiode over 2 dagen afloopt.\n\nWe hopen dat je de afgelopen dagen hebt kunnen voelen waarvoor Benji er is: een plek waar je je verhaal kwijt kunt, op je eigen tempo.\n\nAls je wilt blijven werken aan wat je bent begonnen, je reflecties, je doelen, je gesprekken, dan is er een abonnement dat daarbij past. En wat je tot nu toe hebt opgebouwd, blijft altijd van jou.`,
  },
  trial_day7: {
    subject: "Vandaag is de laatste dag van je proefperiode",
    bodyText: `Hoe gaat het met je? We hopen dat de afgelopen week met Benji een beetje steun heeft gebracht.\n\nDe afgelopen 7 dagen hebben we je laten proeven van alles wat Benji te bieden heeft, en vandaag is de laatste dag dat je volledige toegang hebt.\n\nHeb je gemerkt dat bepaalde dingen je goed deden? De gesprekken, je reflecties, de check-ins of de memories? Dan is het fijn om te weten dat die gewoon voor je bewaard blijven, wat je ook kiest.\n\nMocht je willen blijven gebruiken wat je de afgelopen tijd hebt ontdekt, dan kan dat via een abonnement dat bij je past. Geen druk, maar we willen je er wel even op wijzen.`,
  },

  // Niet Alleen
  niet_alleen_welkom: {
    subject: "Welkom bij Niet Alleen, dag 1 begint vandaag",
    bodyText: `Fijn dat je er bent. De komende 30 dagen lopen we samen met je mee, één dag tegelijk.\n\nElke ochtend ontvang je een kleine vraag. Geen druk, geen goed of fout. Gewoon ruimte voor wat er in je leeft.`,
  },
  niet_alleen_dag: {
    subject: "Dag {dag}, jouw moment van vandaag",
    bodyText: `Geen zin vandaag? Dat is ook goed. De pagina blijft open staan.`,
  },
  niet_alleen_dag15: {
    subject: "Je bent halverwege — hoe gaat het?",
    bodyText: `Je bent nu halverwege je 30 dagen. Dat is al zoveel.

We wilden even vragen: hoe gaat het? Niet hoe je denkt te moeten gaan. Maar echt.

De afgelopen twee weken heb je elke dag een klein stukje geopend. Dat is niet vanzelfsprekend als je in verdriet zit.

Wist je trouwens dat er naast Niet Alleen nog meer is bij TalkToBenji? Je kunt er gesprekken voeren met Benji, herinneringen bewaren, en altijd terugkijken op wat je hebt geschreven. Geen druk, maar we wilden je het laten weten — het is er als je het ooit nodig hebt.

Tot morgen,
Benji`,
  },
  niet_alleen_dag28: {
    subject: "Nog twee dagen en wat er daarna is",
    bodyText: `Over twee dagen zijn je 30 dagen klaar. Wat je hebt geschreven, is van jou. Het verdwijnt niet zomaar.\n\nOp dag 30 sturen we je een overzicht van alles wat je hebt ingevuld, zodat je het kunt bewaren. Wil je daarna gewoon verdergaan? Dan kun je je account omzetten naar een volledig abonnement.`,
  },
  niet_alleen_dag30: {
    subject: "Je 30 dagen zijn klaar — dit is voor jou",
    bodyText: `Je hebt het gedaan. 30 dagen lang ben je er geweest voor jezelf. Dat is meer dan het klinkt.

Alles wat je hebt geschreven kun je nu bekijken en downloaden als persoonlijk dagboek, een herinnering die helemaal van jou is.

En als je verder wilt: TalkToBenji is er voor als je behoefte hebt aan een luisterend oor. Je kunt er gesprekken voeren met Benji, herinneringen bewaren in je eigen vault, en altijd terugkijken op wat je hebt geschreven. Geen verplichting, maar de deur staat open.

Je hebt nog 7 dagen om alles te bewaren en te beslissen wat je wilt.

We zijn blij dat je er was.`,
  },
} as const;

export type TemplateKey = keyof typeof DEFAULT_TEMPLATES;
