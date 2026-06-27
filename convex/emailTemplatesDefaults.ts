/**
 * Standaard e-mail templates — plain TS, veilig te importeren in browser én server.
 */

const TTB = "https://www.talktobenji.com";
const BOEKJE_URL = "https://heyzine.com/flip-book/1b15e11883.html";

// Gedeelde "Wie ik ben"-mail (Ien's verhaal). Per verliestype aanpasbaar in de
// admin, maar overal gelijk voorgevuld.
const EH_IEN_VERHAAL = `Hi {voornaam},\n\nIk wil je even vertellen wie ik ben. Want je krijgt de komende dagen mails van mij, en dat verdient wat context.\n\nIk ben Ien. Ik woon al veertien jaar in Zweden, samen met de liefde van mijn leven. In de loop der jaren heb ik veel verlies gekend. Een kindje dat er niet mocht zijn, een bedrijf dat we ondanks alles moesten loslaten. Verlies heeft me gevormd op manieren die ik niet altijd had gevraagd.\n\nMaar het verlies dat me het meest heeft bijgehouden, begon op een gewone dag.\n\nZoro was negen jaar oud toen hij werd aangereden. Hij verloor een poot. De dierenarts was voorzichtig over wat Zoro nog zou kunnen.\n\nZoro dacht daar anders over.\n\nHij liep. Hij kwispelde. Elke ochtend stond hij bij de deur te wachten, drie poten, een hart zo groot als een huis. We hebben hem nog acht jaar gehad in die vorm. Op 22 maart 2016 overleed hij. Hij werd zeventien jaar oud.\n\nErgens in huis staat een bronzen beeldje van een hondje op drie poten. Op zware dagen kijk ik er even naar.\n\nIk mis hem nog steeds.\n\nHet is uit dat verdriet, en uit alles wat ik daarna heb geleerd over hoe verlies werkt, dat ik Talk To Benji heb gebouwd. En Niet Alleen.\n\nNiet omdat ik alle antwoorden heb. Maar omdat ik weet hoe het voelt als de wereld gewoon doorgaat terwijl jij nog midden in iets zit.\n\nJe bent hier op de goede plek.\n\nVeel liefs,`;

// Bouwt de 6 opvolgmails voor één verliestype. Zelfde skelet, eigen teksten + links.
function ehMailSet(
  type: string,
  c: {
    lp: string;
    checkout: string;
    m1s: string; m1: string;
    m2s: string; m2: string;
    m3s: string; m3: string;
    m4s: string; m4: string;
    m5s: string; m5: string;
  }
) {
  return {
    [`eh_${type}_1`]: { subject: c.m1s, bodyText: c.m1, buttonText: "Schrijf Ien een bericht", buttonUrl: "mailto:contactmetien@talktobenji.com" },
    [`eh_${type}_6`]: { subject: "Even voorstellen, dit ben ik", bodyText: EH_IEN_VERHAAL },
    [`eh_${type}_2`]: { subject: c.m2s, bodyText: c.m2, buttonText: "Woorden die je omarmen bekijken", buttonUrl: BOEKJE_URL, imageCaption: "Woorden die je omarmen, open het boekje" },
    [`eh_${type}_3`]: { subject: c.m3s, bodyText: c.m3, buttonText: "Lees meer over Niet Alleen", buttonUrl: `${TTB}${c.lp}` },
    [`eh_${type}_4`]: { subject: c.m4s, bodyText: c.m4, buttonText: "Lees meer ervaringen", buttonUrl: `${TTB}${c.lp}` },
    [`eh_${type}_5`]: { subject: c.m5s, bodyText: c.m5, buttonText: "Start Niet Alleen — eenmalig €37", buttonUrl: `${TTB}${c.checkout}` },
  };
}

// Per verliestype: huisdier blijft hand-geschreven (zie onder). Deze types zijn
// startversies, aangepast aan het verlies. Te verfijnen in de admin.
const EH_TYPE_TEMPLATES: Record<string, { subject: string; bodyText: string; buttonText?: string; buttonUrl?: string; imageCaption?: string }> = {
  ...ehMailSet("persoon", {
    lp: "/lp/je-mist-iemand",
    checkout: "/betalen/niet-alleen-verlies-persoon",
    m1s: "Ik dacht aan je vandaag",
    m1: `Hi {voornaam},\n\nEen paar dagen geleden heb je Even Houvast gedaan, en daarna een brief aan jezelf gekregen.\n\nIk hoop dat die brief iets heeft gedaan. Iets kleins. Een zucht, een traan, of gewoon het gevoel: dit klopt.\n\nWat ik je vandaag mee wil geven, is dit: wat je voelt na het verlies van iemand die je liefhad, is echt. Het is niet overdreven, en het hoeft niet binnen een bepaalde tijd over te zijn.\n\nJe mag dat gewoon weten.\n\nIk denk aan je.`,
    m2s: "Je verdriet mag er zijn",
    m2: `Hi {voornaam},\n\nMisschien heb je het al gehoord. Van iemand die het goed bedoelde.\n\n"Hij zou niet willen dat je verdrietig bent." Of: "Met de tijd wordt het vanzelf minder."\n\nHet steekt, omdat het je verdriet klein maakt.\n\nRouw volgt geen schema. Sommige dagen draag je het, andere dagen overvalt het je midden in de supermarkt. Dat hoort erbij, en het betekent niet dat je iets verkeerd doet.\n\nJe hoeft je verdriet niet weg te stoppen, en niet uit te leggen. Het mag er zijn, zo lang als nodig is.\n\nIk heb een klein boekje voor je gemaakt. Woorden die je omarmen: spreuken en gedichtjes om bij stil te staan op de zware momenten. Klik op het boekje om het te openen.`,
    m3s: "Wat als je er elke dag even bij stil mocht staan?",
    m3: `Hi {voornaam},\n\nRouwen is niet iets wat je in een weekend doet. Het gaat in golven, soms verwacht, soms ineens.\n\nWat helpt, is er niet tegen vechten, maar er elke dag een beetje ruimte voor maken. Een paar minuten.\n\nDaarom bestaat Niet Alleen. Dertig dagen, elke dag een korte mail in je inbox. Geen zware opdrachten, gewoon een rustig moment voor jou en voor het verlies dat je draagt.\n\nJe leest het wanneer jij er klaar voor bent. Er is geen goed of fout.\n\nVolgende week vertel ik je meer over wat het mensen geeft. Voor nu: weet dat het er is.`,
    m4s: `"Ik wist niet dat ik dit nodig had"`,
    m4: `Hi {voornaam},\n\nIk wil je iets laten lezen van iemand die Niet Alleen deed na het verlies van haar moeder.\n\n"Ik begon zonder grote verwachtingen. Ik dacht: wat kan een mailtje nou doen? Maar elke ochtend was er iets wat me het gevoel gaf dat ik er niet alleen voor stond. Niet dat de pijn minder werd, maar ik wist beter hoe ermee te zijn."\n\nDat is wat ik zo vaak hoor: niet dat het verdriet verdwijnt, maar dat mensen beter leren er naast te staan.\n\nDertig korte mails, elke dag één moment voor jou. Voor wie niet steeds opnieuw wil uitleggen hoe het voelt, en gewoon even een hand wil vasthouden.`,
    m5s: "Je hoeft dit niet alleen te doen",
    m5: `Hi {voornaam},\n\nDe afgelopen dagen vertelde ik je meer over Niet Alleen. Vandaag ook gewoon wat het kost, want dat wil je weten.\n\nNiet Alleen kost eenmalig €37. Iets meer dan een euro per dag. Geen abonnement, geen automatische verlenging. Je koopt het één keer en hebt er 30 dagen begeleiding voor.\n\nJe start wanneer jij er klaar voor bent.\n\nElke dag een korte, zachte mail, geschreven voor mensen die iemand missen die er altijd was. Geen huiswerk, geen druk om snel beter te worden. Gewoon ruimte, en het gevoel: hier ben ik niet alleen.\n\nTwijfel je? Dan bewaar je deze mail en open je hem als de tijd er rijp voor is.\n\nIk ben blij dat je er bent.`,
  }),
  ...ehMailSet("scheiding", {
    lp: "/lp/mijn-relatie-is-voorbij",
    checkout: "/betalen/niet-alleen-relatie",
    m1s: "Ik dacht aan je vandaag",
    m1: `Hi {voornaam},\n\nEen paar dagen geleden heb je Even Houvast gedaan, en daarna een brief aan jezelf gekregen.\n\nIk hoop dat die brief iets heeft gedaan. Iets kleins. Een zucht, een traan, of gewoon het gevoel: dit klopt.\n\nWat ik je vandaag mee wil geven, is dit: rouwen om een relatie die voorbij is, om iemand die nog leeft, is echt verdriet. Het is niet aanstellerij, en het doet evenveel pijn.\n\nJe mag dat gewoon weten.\n\nIk denk aan je.`,
    m2s: "Je verdriet mag er zijn",
    m2: `Hi {voornaam},\n\nMisschien heb je het al gehoord. Van iemand die het goed bedoelde.\n\n"Je bent beter af zonder." Of: "Je vindt vast snel weer iemand."\n\nHet steekt, omdat het je verdriet klein maakt.\n\nEr is geen begrafenis, geen kaart, geen erkend moment van afscheid. En toch ben je iemand kwijt, en een toekomst die je voor je zag. Dat stille verlies is echt.\n\nJe hoeft het niet weg te lachen, en niet uit te leggen. Het mag er zijn, zo lang als nodig is.\n\nIk heb een klein boekje voor je gemaakt. Woorden die je omarmen: spreuken en gedichtjes om bij stil te staan op de zware momenten. Klik op het boekje om het te openen.`,
    m3s: "Wat als je er elke dag even bij stil mocht staan?",
    m3: `Hi {voornaam},\n\nRouwen om een relatie gaat in golven. Het ene moment opluchting, het volgende gemis, soms allebei binnen een uur.\n\nWat helpt, is er niet tegen vechten, maar er elke dag een beetje ruimte voor maken. Een paar minuten.\n\nDaarom bestaat Niet Alleen. Dertig dagen, elke dag een korte mail in je inbox. Geen zware opdrachten, gewoon een rustig moment voor jou en voor wat je doormaakt.\n\nJe leest het wanneer jij er klaar voor bent. Er is geen goed of fout.\n\nVolgende week vertel ik je meer. Voor nu: weet dat het er is.`,
    m4s: `"Ik wist niet dat ik dit nodig had"`,
    m4: `Hi {voornaam},\n\nIk wil je iets laten lezen van iemand die Niet Alleen deed na het einde van haar huwelijk.\n\n"Ik begon zonder grote verwachtingen. Maar elke ochtend was er iets wat me het gevoel gaf dat ik er niet alleen voor stond. Niet dat het verdriet weg was, maar ik wist beter hoe ermee te zijn."\n\nDat is wat ik zo vaak hoor: niet dat de pijn verdwijnt, maar dat mensen beter leren er naast te staan.\n\nDertig korte mails, elke dag één moment voor jou. Voor wie niet steeds opnieuw wil uitleggen hoe het voelt.`,
    m5s: "Je hoeft dit niet alleen te doen",
    m5: `Hi {voornaam},\n\nDe afgelopen dagen vertelde ik je meer over Niet Alleen. Vandaag ook gewoon wat het kost.\n\nNiet Alleen kost eenmalig €37. Iets meer dan een euro per dag. Geen abonnement, geen automatische verlenging. Je koopt het één keer en hebt er 30 dagen begeleiding voor.\n\nJe start wanneer jij er klaar voor bent.\n\nElke dag een korte, zachte mail, geschreven voor wie rouwt om een relatie die voorbij is. Geen huiswerk, geen druk. Gewoon ruimte, en het gevoel: hier ben ik niet alleen.\n\nTwijfel je? Dan bewaar je deze mail en open je hem als de tijd er rijp voor is.\n\nIk ben blij dat je er bent.`,
  }),
  ...ehMailSet("eenzaamheid", {
    lp: "/lp/ik-voel-me-eenzaam",
    checkout: "/betalen/niet-alleen-eenzaamheid",
    m1s: "Ik dacht aan je vandaag",
    m1: `Hi {voornaam},\n\nEen paar dagen geleden heb je Even Houvast gedaan, en daarna een brief aan jezelf gekregen.\n\nIk hoop dat die brief iets heeft gedaan. Iets kleins. Een zucht, een traan, of gewoon het gevoel: dit klopt.\n\nWat ik je vandaag mee wil geven, is dit: je eenzaam voelen, ook als er mensen om je heen zijn, is echt. Het zegt niets over je waarde. Het is gewoon iets wat je nu draagt.\n\nJe mag dat gewoon weten.\n\nIk denk aan je.`,
    m2s: "Je hoeft je niet te schamen",
    m2: `Hi {voornaam},\n\nEenzaamheid is iets waar bijna niemand hardop over praat. Alsof het iets is om je voor te schamen.\n\nMaar dat is het niet. Je kunt je leeg en ongezien voelen midden tussen anderen. Dat maakt je niet zwak of mislukt. Het laat alleen zien dat je verbinding mist.\n\nJe hoeft dat gevoel niet mooier te maken dan het is, en niet weg te stoppen. Het mag er zijn.\n\nIk heb een klein boekje voor je gemaakt. Woorden die je omarmen: spreuken en gedichtjes om bij stil te staan op de momenten dat het stil is. Klik op het boekje om het te openen.`,
    m3s: "Wat als er elke dag even iemand was?",
    m3: `Hi {voornaam},\n\nEenzaamheid wordt zwaarder als er niets is om het te overstemmen. Juist op die stille momenten.\n\nWat helpt, is niet alleen proberen het te vullen, maar er elke dag een klein, vast moment voor hebben. Iets wat er gewoon is.\n\nDaarom bestaat Niet Alleen. Dertig dagen, elke dag een korte mail in je inbox. Als een hand op je schouder, zonder dat je iets hoeft uit te leggen.\n\nJe leest het wanneer jij er klaar voor bent.\n\nVolgende week vertel ik je meer. Voor nu: weet dat het er is.`,
    m4s: `"Ik wist niet dat ik dit nodig had"`,
    m4: `Hi {voornaam},\n\nIk wil je iets laten lezen van iemand die Niet Alleen deed in een eenzame periode.\n\n"Ik begon zonder grote verwachtingen. Maar elke ochtend was er iets wat me het gevoel gaf dat er aan me gedacht werd. Klein, maar het maakte verschil."\n\nDat is wat ik zo vaak hoor: niet dat de eenzaamheid ineens weg is, maar dat mensen zich weer een beetje gezien voelen.\n\nDertig korte mails, elke dag één moment voor jou.`,
    m5s: "Je hoeft dit niet alleen te doen",
    m5: `Hi {voornaam},\n\nDe afgelopen dagen vertelde ik je meer over Niet Alleen. Vandaag ook gewoon wat het kost.\n\nNiet Alleen kost eenmalig €37. Iets meer dan een euro per dag. Geen abonnement, geen automatische verlenging. Je koopt het één keer en hebt er 30 dagen begeleiding voor.\n\nJe start wanneer jij er klaar voor bent.\n\nElke dag een korte, zachte mail, juist voor de momenten dat je je alleen voelt. Geen huiswerk, geen druk. Gewoon iemand die er is.\n\nTwijfel je? Dan bewaar je deze mail en open je hem als de tijd er rijp voor is.\n\nIk ben blij dat je er bent.`,
  }),
  ...ehMailSet("kinderloos", {
    lp: "/lp/ongewenst-kinderloos-die-pijn-gaat-nooit-weg",
    checkout: "/betalen/niet-alleen-kinderloos",
    m1s: "Ik dacht aan je vandaag",
    m1: `Hi {voornaam},\n\nEen paar dagen geleden heb je Even Houvast gedaan, en daarna een brief aan jezelf gekregen.\n\nIk hoop dat die brief iets heeft gedaan. Iets kleins. Een zucht, een traan, of gewoon het gevoel: dit klopt.\n\nWat ik je vandaag mee wil geven, is dit: rouwen om een kind dat er nooit kwam, om een toekomst die niet is geworden, is echt verdriet. Het is een van de meest onzichtbare vormen van verlies, en het telt volledig.\n\nJe mag dat gewoon weten.\n\nIk denk aan je.`,
    m2s: "Je verdriet is echt",
    m2: `Hi {voornaam},\n\nMisschien ken je de vraag. Bedoeld als interesse, maar hij komt binnen als een mes.\n\n"En, wanneer komen er kindjes?" Je lacht het weg, of zegt "we zien wel." En niemand ziet wat het met je doet.\n\nDit verdriet heeft geen vorm die anderen herkennen. Geen afscheid, geen kaart. En juist daarom voelt het zo eenzaam.\n\nMaar het is echt. Je hoeft het niet kleiner te maken dan het is.\n\nIk heb een klein boekje voor je gemaakt. Woorden die je omarmen: spreuken en gedichtjes om bij stil te staan op de zware momenten. Klik op het boekje om het te openen.`,
    m3s: "Wat als je er elke dag even bij stil mocht staan?",
    m3: `Hi {voornaam},\n\nRouwen om wat er nooit kwam gaat in golven. Een aankondiging, een zwangere buik, een verjaardag die er niet is. Zonder waarschuwing.\n\nWat helpt, is er niet tegen vechten, maar er elke dag een beetje ruimte voor maken. Een paar minuten.\n\nDaarom bestaat Niet Alleen. Dertig dagen, elke dag een korte mail in je inbox. Voor het verdriet dat geen datum heeft, zonder dat je iets hoeft uit te leggen.\n\nJe leest het wanneer jij er klaar voor bent.\n\nVolgende week vertel ik je meer. Voor nu: weet dat het er is.`,
    m4s: `"Ik wist niet dat ik dit nodig had"`,
    m4: `Hi {voornaam},\n\nIk wil je iets laten lezen van iemand die Niet Alleen deed met een onvervulde kinderwens.\n\n"Ik begon zonder grote verwachtingen. Maar elke ochtend was er iets wat me het gevoel gaf dat mijn verdriet er mocht zijn. Dat het gezien werd, terwijl bijna niemand erover begint."\n\nDat is wat ik zo vaak hoor: niet dat het gemis verdwijnt, maar dat mensen zich minder alleen voelen met iets wat zo onzichtbaar is.\n\nDertig korte mails, elke dag één moment voor jou.`,
    m5s: "Je hoeft dit niet alleen te doen",
    m5: `Hi {voornaam},\n\nDe afgelopen dagen vertelde ik je meer over Niet Alleen. Vandaag ook gewoon wat het kost.\n\nNiet Alleen kost eenmalig €37. Iets meer dan een euro per dag. Geen abonnement, geen automatische verlenging. Je koopt het één keer en hebt er 30 dagen begeleiding voor.\n\nJe start wanneer jij er klaar voor bent.\n\nElke dag een korte, zachte mail, voor het verdriet om een kind dat er nooit kwam. Geen huiswerk, geen druk. Gewoon ruimte, en het gevoel: hier ben ik niet alleen.\n\nTwijfel je? Dan bewaar je deze mail en open je hem als de tijd er rijp voor is.\n\nIk ben blij dat je er bent.`,
  }),
  ...ehMailSet("algemeen", {
    lp: "/lp/je-hoeft-het-niet-alleen-te-doen",
    checkout: "/betalen/je-hoeft-het-niet-alleen-te-dragen",
    m1s: "Ik dacht aan je vandaag",
    m1: `Hi {voornaam},\n\nEen paar dagen geleden heb je Even Houvast gedaan, en daarna een brief aan jezelf gekregen.\n\nWat je draagt is echt, wat het ook is. Verlies heeft veel gezichten, en ze tellen allemaal.\n\nOm je de steun te geven die het beste past, help je me met één ding: waar gaat jouw verdriet vooral over? Kies hieronder, dan stuur ik je verder op de manier die bij jou past.`,
    m2s: "Je verdriet mag er zijn",
    m2: `Hi {voornaam},\n\nWat je ook verloor, de kans is groot dat iemand het ooit klein maakte. Met een opmerking die goed bedoeld was, maar precies verkeerd binnenkwam.\n\nJouw verdriet hoeft niet in een hokje te passen om echt te zijn. Het hoeft niet uitgelegd, en niet weggestopt.\n\nIk heb een klein boekje voor je gemaakt. Woorden die je omarmen: spreuken en gedichtjes om bij stil te staan op de zware momenten. Klik op het boekje om het te openen.`,
    m3s: "Wat als je er elke dag even bij stil mocht staan?",
    m3: `Hi {voornaam},\n\nRouwen doe je niet in een weekend. Het gaat in golven, soms verwacht, soms ineens.\n\nWat helpt, is er elke dag een beetje ruimte voor maken. Een paar minuten.\n\nDaarom bestaat Niet Alleen. Dertig dagen, elke dag een korte mail in je inbox, afgestemd op jouw verlies. Geen zware opdrachten, gewoon een rustig moment voor jou.\n\nWeet je al waar jouw verdriet over gaat? Kies hieronder, dan sluit alles beter aan.`,
    m4s: `"Ik wist niet dat ik dit nodig had"`,
    m4: `Hi {voornaam},\n\nIk wil je iets laten lezen van iemand die Niet Alleen deed.\n\n"Ik begon zonder grote verwachtingen. Maar elke ochtend was er iets wat me het gevoel gaf dat ik er niet alleen voor stond. Niet dat de pijn minder werd, maar ik wist beter hoe ermee te zijn."\n\nDat hoor ik zo vaak: niet dat het verdriet verdwijnt, maar dat mensen beter leren er naast te staan.\n\nDertig korte mails, elke dag één moment voor jou.`,
    m5s: "Je hoeft dit niet alleen te doen",
    m5: `Hi {voornaam},\n\nDe afgelopen dagen vertelde ik je meer over Niet Alleen. Vandaag ook gewoon wat het kost.\n\nNiet Alleen kost eenmalig €37. Iets meer dan een euro per dag. Geen abonnement, geen automatische verlenging. Je koopt het één keer en hebt er 30 dagen begeleiding voor.\n\nJe start wanneer jij er klaar voor bent.\n\nElke dag een korte, zachte mail. Geen huiswerk, geen druk om snel beter te worden. Gewoon ruimte, en het gevoel: hier ben ik niet alleen.\n\nTwijfel je? Dan bewaar je deze mail en open je hem als de tijd er rijp voor is.\n\nIk ben blij dat je er bent.`,
  }),
};

export const DEFAULT_TEMPLATES = {
  trial_day5: {
    subject: "Nog 2 dagen, je proefperiode loopt bijna af",
    aanhef: "Lieve {naam},",
    bodyText: `Over 2 dagen loopt je proefperiode af.\n\nIk hoop dat je in deze week hebt gevoeld waarvoor Benji er is, een plek om je verhaal kwijt te kunnen, op je eigen tempo.\n\nAls je wilt doorgaan met wat je bent begonnen, je gesprekken, je reflecties, je doelen, dan is er een mogelijkheid die bij je past. Wat je tot nu toe hebt opgebouwd, blijft altijd van jou.`,
    buttonText: "Kies wat bij je past",
    buttonUrl: "https://www.talktobenji.com/lp/prijzen",
  },
  trial_day7: {
    subject: "Vandaag is de laatste dag van je proefperiode",
    aanhef: "Lieve {naam},",
    bodyText: `Hoe gaat het met je?\n\nVandaag is de laatste dag van je 7 dagen met Benji. Ik hoop dat het iets heeft gebracht, al was het maar het gevoel dat je er niet alleen voor stond.\n\nAlles wat je hebt opgebouwd, je gesprekken, reflecties en memories, blijft bewaard, wat je ook kiest.\n\nWil je verder? De deur staat open.`,
    buttonText: "Kies wat bij je past",
    buttonUrl: "https://www.talktobenji.com/lp/prijzen",
  },
  // ── Jaar ──
  renewal_jaar_1: {
    subject: "Hoe gaat het met je?",
    aanhef: "Hi {naam},",
    bodyText: `Het is bijna een jaar geleden dat je met Talk To Benji bent begonnen. Ik hoop dat het je heeft geholpen, op welke manier dan ook.\n\nJe toegang loopt over ongeveer een maand af op {einddatum}. Als je nog een jaar samen wil gaan, is dat van harte welkom.`,
    buttonText: "Nog een jaar samen",
    buttonUrl: "https://www.talktobenji.com/betalen/je-hoeft-het-niet-alleen-te-dragen",
  },
  renewal_jaar_2: {
    subject: "Nog twee weken, wil je verder?",
    aanhef: "Hi {naam},",
    bodyText: `Nog twee weken, dan loopt je toegang tot Talk To Benji af op {einddatum}.\n\nAlles wat je hebt opgebouwd, je gesprekken, reflecties en memories, blijft bewaard zolang je account bestaat. Maar Benji zal na die datum niet meer voor je beschikbaar zijn.\n\nWil je nog een jaar verder?`,
    buttonText: "Toegang verlengen",
    buttonUrl: "https://www.talktobenji.com/betalen/je-hoeft-het-niet-alleen-te-dragen",
  },
  renewal_jaar_3: {
    subject: "Vandaag is je laatste dag, tot ziens of tot snel",
    aanhef: "Hi {naam},",
    bodyText: `Vandaag is de laatste dag van je jaar met Talk To Benji.\n\nIk ben blij dat je er was. Ik hoop dat het jaar je iets heeft gegeven, al was het maar het gevoel dat je er niet alleen voor stond.\n\nAls je nog een jaar verder wilt, kun je dat hieronder regelen. Benji staat voor je klaar.\n\nWil je liever stoppen? Je kunt al je gegevens downloaden of je account verwijderen via Instellingen in je account.`,
    buttonText: "Nog een jaar samen",
    buttonUrl: "https://www.talktobenji.com/betalen/je-hoeft-het-niet-alleen-te-dragen",
  },

  // ── Kwartaal ──
  renewal_kwartaal_1: {
    subject: "Je kwartaal loopt bijna af",
    aanhef: "Hi {naam},",
    bodyText: `Over twee weken loopt je toegang tot Talk To Benji af op {einddatum}.\n\nIk hoop dat de afgelopen maanden je iets hebben gegeven, een plek om je verhaal kwijt te kunnen, op je eigen tempo.\n\nWil je doorgaan?`,
    buttonText: "Nog een kwartaal",
    buttonUrl: "https://www.talktobenji.com/betalen/47-kwartaal",
    upsellText: "Een heel jaar voor €97",
    upsellUrl: "https://www.talktobenji.com/betalen/je-hoeft-het-niet-alleen-te-dragen",
  },
  renewal_kwartaal_2: {
    subject: "Nog een week, wil je verder?",
    aanhef: "Hi {naam},",
    bodyText: `Nog één week, dan loopt je toegang af op {einddatum}.\n\nAlles wat je hebt opgebouwd blijft bewaard, wat je ook kiest. Maar Benji zal na die datum niet meer voor je beschikbaar zijn.\n\nWil je nog een kwartaal?`,
    buttonText: "Toegang verlengen",
    buttonUrl: "https://www.talktobenji.com/betalen/47-kwartaal",
    upsellText: "Een heel jaar voor €97",
    upsellUrl: "https://www.talktobenji.com/betalen/je-hoeft-het-niet-alleen-te-dragen",
  },
  renewal_kwartaal_3: {
    subject: "Vandaag is je laatste dag",
    aanhef: "Hi {naam},",
    bodyText: `Vandaag loopt je toegang tot Talk To Benji af.\n\nIk ben blij dat je er was. Als je wilt doorgaan, kun je dat hieronder regelen. Benji staat voor je klaar.\n\nWil je liever stoppen? Je kunt al je gegevens downloaden via Instellingen in je account.`,
    buttonText: "Nog een kwartaal",
    buttonUrl: "https://www.talktobenji.com/betalen/47-kwartaal",
    upsellText: "Een heel jaar voor €97",
    upsellUrl: "https://www.talktobenji.com/betalen/je-hoeft-het-niet-alleen-te-dragen",
  },

  // ── Maand ──
  renewal_maand_1: {
    subject: "Je toegang loopt bijna af",
    aanhef: "Hi {naam},",
    bodyText: `Over een week loopt je maandtoegang tot Talk To Benji af op {einddatum}.\n\nWil je doorgaan? Je kunt je toegang eenvoudig verlengen via de knop hieronder.`,
    buttonText: "Nog een maand",
    buttonUrl: "https://www.talktobenji.com/betalen/17-voor-1-maand",
    upsellText: "3 maanden voor €47",
    upsellUrl: "https://www.talktobenji.com/betalen/47-kwartaal",
  },
  renewal_maand_2: {
    subject: "Nog 3 dagen, wil je verder?",
    aanhef: "Hi {naam},",
    bodyText: `Nog 3 dagen, dan loopt je toegang af op {einddatum}.\n\nAlles wat je hebt opgebouwd blijft bewaard. Maar Benji zal na die datum niet meer voor je beschikbaar zijn.\n\nWil je nog een maand?`,
    buttonText: "Toegang verlengen",
    buttonUrl: "https://www.talktobenji.com/betalen/17-voor-1-maand",
    upsellText: "3 maanden voor €47",
    upsellUrl: "https://www.talktobenji.com/betalen/47-kwartaal",
  },
  renewal_maand_3: {
    subject: "Vandaag is je laatste dag",
    aanhef: "Hi {naam},",
    bodyText: `Vandaag loopt je maandtoegang tot Talk To Benji af.\n\nAls je wilt doorgaan, kun je dat hieronder direct regelen. Benji staat voor je klaar.`,
    buttonText: "Nog een maand",
    buttonUrl: "https://www.talktobenji.com/betalen/17-voor-1-maand",
    upsellText: "3 maanden voor €47",
    upsellUrl: "https://www.talktobenji.com/betalen/47-kwartaal",
  },

  // legacy keys — worden niet meer gebruikt maar staan voor backwards compat
  renewal_email1: {
    subject: "Hoe gaat het met je?",
    aanhef: "Hi {naam},",
    bodyText: `Je toegang loopt binnenkort af. Wil je doorgaan?`,
    buttonText: "Verlengen",
    buttonUrl: "https://www.talktobenji.com/betalen/je-hoeft-het-niet-alleen-te-dragen",
  },
  renewal_email2: {
    subject: "Nog twee weken, wil je verder?",
    aanhef: "Hi {naam},",
    bodyText: `Je toegang loopt binnenkort af.`,
    buttonText: "Toegang verlengen",
    buttonUrl: "https://www.talktobenji.com/betalen/je-hoeft-het-niet-alleen-te-dragen",
  },
  renewal_email3: {
    subject: "Vandaag is je laatste dag",
    aanhef: "Hi {naam},",
    bodyText: `Vandaag loopt je toegang af.`,
    buttonText: "Verlengen",
    buttonUrl: "https://www.talktobenji.com/betalen/je-hoeft-het-niet-alleen-te-dragen",
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
    subject: "Je bent halverwege. Hoe gaat het?",
    bodyText: `Je bent nu halverwege. Vijftien dagen. Dat is niet niks.

Hoe gaat het echt? Niet hoe je denkt dat het zou moeten gaan. Maar wat er nu in je leeft.

De afgelopen twee weken heb je elke dag iets in jezelf aangekeken. Dat vraagt moed, ook al voelt het van binnenuit misschien gewoon als doorgaan.

En als je merkt dat je soms meer nodig hebt: bij TalkToBenji kun je ook gewoon praten met Benji. Herinneringen bewaren. Altijd terugkijken op wat je hebt geschreven. Het is er als je het ooit nodig hebt, zonder verplichtingen.

Tot morgen,
Benji`,
  },
  niet_alleen_dag28: {
    subject: "Nog twee dagen en wat er daarna is",
    bodyText: `Over twee dagen zijn je 30 dagen klaar. Wat je hebt geschreven, is van jou. Het verdwijnt niet zomaar.\n\nOp dag 30 sturen we je een overzicht van alles wat je hebt ingevuld, zodat je het kunt bewaren. Wil je daarna gewoon verdergaan? Dan kun je volledige toegang tot Benji nemen, zonder verplichting.`,
  },
  niet_alleen_dag30: {
    subject: "Je 30 dagen zijn klaar, dit is voor jou",
    bodyText: `Je hebt het gedaan. 30 dagen lang ben je er geweest voor jezelf. Dat is meer dan het klinkt.

Alles wat je hebt geschreven kun je nu bekijken en downloaden als persoonlijk dagboek, een herinnering die helemaal van jou is.

En als je verder wilt: TalkToBenji is er voor als je behoefte hebt aan een luisterend oor. Je kunt er gesprekken voeren met Benji, herinneringen bewaren in je eigen vault, en altijd terugkijken op wat je hebt geschreven. Geen verplichting, maar de deur staat open.

Je hebt nog 7 dagen om alles te bewaren en te beslissen wat je wilt.

We zijn blij dat je er was.`,
  },
  // ── Even Houvast opvolgreeks (huisdier) ──
  eh_huisdier_1: {
    subject: "Ik dacht aan je vandaag",
    bodyText: `Hi {voornaam},\n\nEen paar dagen geleden heb je Even Houvast gedaan. En daarna een brief aan jezelf gekregen.\n\nIk hoop dat die brief iets heeft gedaan. Iets kleins. Een zucht. Een traan. Of gewoon het gevoel: dit klopt.\n\nHoe was het om die brief te lezen?\n\nJe hoeft me niet te antwoorden. Maar als er iets in je opkomt, mag je altijd terugschrijven. Ik lees het.\n\nWat ik je vandaag mee wil geven, is één ding:\n\nWat je voelt na het verlies van je huisdier is echt. Het is niet overdreven. Het is niet klein. Jij miste iemand die elke dag bij je was. Dat is een groot verlies, ook al begrijpt niet iedereen dat.\n\nJe mag dat gewoon weten.\n\nIk denk aan je.`,
    buttonText: "Schrijf Ien een bericht",
    buttonUrl: "mailto:contactmetien@talktobenji.com",
  },
  eh_huisdier_2: {
    subject: "Je bent niet overdreven",
    bodyText: `Hi {voornaam},\n\nMisschien heb je het al eens gehoord. Van iemand die het goed bedoelde.\n\n"Het was maar een kat." Of: "Je kunt toch een nieuwe nemen."\n\nHet steekt elke keer. Omdat het niet klopt.\n\nJe huisdier was er altijd. Op de slechte ochtenden. Op de late avonden. Op de dagen dat je het even niet trok. Hij of zij vroeg nooit iets terug. Was er gewoon.\n\nDat soort verbinding verdwijnt niet vanzelf als je van rouw praat. Maar het wordt er wel minder over gezegd.\n\nWeet je wat ik veel hoor van mensen die een huisdier verloren? Dat ze het verdriet een beetje verstopten. Dat ze het kleiner maakten dan het was. Omdat ze bang waren dat anderen het niet zouden begrijpen.\n\nMaar verdriet wordt niet kleiner als je het wegstopt. Het wacht gewoon.\n\nJij hoeft het niet weg te stoppen. Je mag rouwen om dit verlies, net zoals je om een ander groot verlies zou rouwen. Zonder excuses. Zonder uitleg.\n\nJe bent niet overdreven.

Ik heb een klein boekje voor je gemaakt. Woorden die je omarmen: spreuken en gedichtjes om bij stil te staan op de momenten dat het zwaar is. Klik op het boekje om het te openen.`,
    buttonUrl: "https://heyzine.com/flip-book/1b15e11883.html",
    imageCaption: "Woorden die je omarmen, open het boekje",
  },
  eh_huisdier_3: {
    subject: "Wat als je er elke dag even bij stil mocht staan?",
    bodyText: `Hi {voornaam},\n\nRouwen is niet iets wat je in een weekend doet. Of in een gesprek. Of in één goede huilbui.\n\nHet gaat in golven. Soms verwacht. Soms midden in de supermarkt.\n\nWat helpt, is niet proberen het sneller te laten gaan. Maar er een beetje ruimte voor maken. Elke dag. Een paar minuten.\n\nDaarom bestaat Niet Alleen.\n\nHet is een programma van 30 dagen. Elke dag krijg je een korte mail in je inbox. Geen zware opdrachten, geen therapie. Gewoon een rustig moment voor jou, en voor het verlies dat je draagt.\n\nJe leest het wanneer jij er klaar voor bent. Soms op de ochtend. Soms laat op de avond. Sommige mensen lezen het op de dag zelf. Anderen bewaren de mails voor een moment dat ze er iets meer voor openstaan.\n\nEr is geen goed of fout.\n\nIk schreef Niet Alleen vanuit mijn eigen verlies. Niet als therapeut, maar als iemand die weet hoe het is om iets te missen dat er altijd was.\n\nVolgende week vertel ik je meer over wat het mensen geeft. Maar voor nu: weet dat het er is, als je er behoefte aan hebt.`,
    buttonText: "Lees meer over Niet Alleen",
    buttonUrl: "https://www.talktobenji.com/lp/niet-alleen-voor-hulp-bij-verlies-van-huisdier",
  },
  eh_huisdier_4: {
    subject: `"Ik wist niet dat ik dit nodig had"`,
    bodyText: `Hi {voornaam},\n\nIk wil je iets laten lezen van iemand die Niet Alleen deed na het verlies van haar hond.\n\n"Ik begon eigenlijk zonder grote verwachtingen. Ik dacht: wat kan een mailtje nou doen? Maar elke ochtend was er ineens iets wat me het gevoel gaf dat ik er niet alleen voor stond. Niet dat de pijn minder werd. Maar ik wist beter hoe ermee te zijn."\n\nDit is wat ik zo vaak hoor: niet dat het verdriet verdwijnt, maar dat mensen beter leren er naast te staan. Dat ze ruimte maken, in plaats van wegduwen.\n\n30 korte mails. Elke dag één moment voor jou.\n\nSommige mensen lezen ze in één adem door op een moeilijke dag. Anderen nemen er de volle 30 dagen voor. Allebei goed.\n\nNiet Alleen is er voor wie niet elke keer opnieuw wil uitleggen hoe het voelt. Die gewoon even een hand wil vasthouden. Stil. Zonder veel woorden.`,
    buttonText: "Lees meer ervaringen",
    buttonUrl: "https://www.talktobenji.com/lp/niet-alleen-voor-hulp-bij-verlies-van-huisdier",
  },
  eh_huisdier_5: {
    subject: "Je hoeft dit niet alleen te doen",
    bodyText: `Hi {voornaam},\n\nDe afgelopen dagen heb ik je wat meer verteld over Niet Alleen. Vandaag vertel ik je ook gewoon wat het kost, want dat wil je weten.\n\nNiet Alleen kost eenmalig €37. Dat is iets meer dan een euro per dag. Geen abonnement, geen automatische verlengingen. Je koopt het één keer, en je hebt er 30 dagen begeleiding voor.\n\nJe start wanneer jij er klaar voor bent. Er is geen haast.\n\nWat je krijgt:\n\nElke dag een korte, zachte mail. Geschreven voor mensen die rouwen om iemand die er altijd voor hen was. Geen opdrachten die aanvoelen als huiswerk. Geen druk om snel beter te worden.\n\nGewoon ruimte. En het gevoel: hier ben ik niet alleen.\n\nAls je denkt: dit is iets voor mij, dan is de knop hieronder de enige stap.\n\nEn als je twijfelt: dat is ook goed. Dan bewaar je deze mail, en je opent hem als de tijd er rijp voor is.\n\nIk ben blij dat je er bent.`,
    buttonText: "Start Niet Alleen — eenmalig €37",
    buttonUrl: "https://www.talktobenji.com/betalen/niet-alleen-huisdier",
  },
  eh_huisdier_6: {
    subject: "Even voorstellen, dit ben ik",
    bodyText: EH_IEN_VERHAAL,
  },
  // Opvolgmails voor de overige verliestypes (persoon, scheiding, eenzaamheid,
  // kinderloos, algemeen) — startversies, te verfijnen in de admin.
  ...EH_TYPE_TEMPLATES,
  // ── Cadeau ──
  gift_gever: {
    subject: "Je cadeaucode voor {product}",
    aanhef: "Hi {naam},",
    bodyText: `Bedankt voor je aankoop! Hieronder vind je de cadeaucode voor {product}.\n\nDe ontvanger kan de code inwisselen via talktobenji.com/cadeau-inwisselen.\n\nJe factuur vind je als bijlage bij deze e-mail.`,
    buttonText: "Naar de inwisselpagina",
    buttonUrl: "https://www.talktobenji.com/cadeau-inwisselen",
    upsellText: "",
    upsellUrl: "",
  },
  gift_ontvanger: {
    subject: "{gever} heeft iets voor je",
    aanhef: "Hoi,",
    bodyText: `{gever} heeft je een cadeau gegeven: toegang tot {product}.\n\n{bericht}\n\nWissel je code in en maak een gratis account aan.`,
    buttonText: "Cadeau inwisselen",
    buttonUrl: "https://www.talktobenji.com/cadeau-inwisselen",
    upsellText: "",
    upsellUrl: "",
  },
  gift_verzonden: {
    subject: "Je cadeau is verstuurd",
    aanhef: "Hi {naam},",
    bodyText: `Je cadeau voor {product} is zojuist verstuurd naar {ontvanger}.\n\nAls de ontvanger vragen heeft, kunnen ze jou bereiken of mailen naar contactmetien@talktobenji.com.`,
    buttonText: "",
    buttonUrl: "",
    upsellText: "",
    upsellUrl: "",
  },
} as const;

export type TemplateKey = keyof typeof DEFAULT_TEMPLATES;
