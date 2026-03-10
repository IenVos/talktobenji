/**
 * Niet Alleen — volledige 30-dagen content
 *
 * Elke dag bevat:
 * - subject: onderwerpregel van de mail
 * - mail.persoon / mail.huisdier / mail.scheiding: de mailtekst
 *   → Begint NIET met "Hi [naam]," (wordt door template toegevoegd)
 *   → Bevat {link} als placeholder voor de CTA-knop
 *   → Bevat de ondertekening als laatste regel
 * - inHetAccount: korte tekst op de dagpagina in de app
 * - alsjewilt: optionele verdiepingsvraag
 * - doedingetje: optioneel voorstel voor kleine actie (elke ~3 dagen)
 *
 * Naamvervanging:
 * - "hem of haar" en "hij of zij" worden bij verzenden vervangen door
 *   de verliesNaam als dat ingevuld is (alleen voor persoon/huisdier)
 */

export type NietAlleenVerliesType = "persoon" | "huisdier" | "scheiding";

export type DagInhoud = {
  dag: number;
  thema: string;
  subject: string;
  mail: Record<NietAlleenVerliesType, string>;
  inHetAccount: string;
  alsjewilt?: string;
  doedingetje?: string;
};

export const NIET_ALLEEN_CONTENT: DagInhoud[] = [
  // ─────────────── WEEK 1 — AANWEZIG ZIJN ───────────────
  {
    dag: 1,
    thema: "Hoe het voelt om hier te zijn",
    subject: "Je hoeft vandaag maar één ding te doen",
    mail: {
      persoon: `Jij bent er. Op dag één. Dat vraagt moed, ook al voelt het misschien niet zo.

Je hebt iemand verloren die er niet meer is. En toch ben jij hier, klaar om iets voor jezelf te doen. Dat is niet vanzelfsprekend.

De vraag voor vandaag is simpel: hoe voel je je nu, op dit moment? Niet zoals je denkt te moeten voelen. Maar wat er echt is.

Schrijf het op. Een zin, een woord, een paar regels. Meer hoeft niet.

{link}

Benji is er.`,

      huisdier: `Jij bent er. Op dag één. Dat vraagt moed, ook al voelt het misschien niet zo.

Het gemis van een dier is echt, ook als anderen dat niet altijd begrijpen. Je hoeft het niet uit te leggen. Het is gewoon zo.

De vraag voor vandaag is simpel: hoe voel je je nu, op dit moment? Niet zoals je denkt te moeten voelen. Maar wat er echt is.

Schrijf het op. Een zin, een woord, een paar regels. Meer hoeft niet.

{link}

Benji is er.`,

      scheiding: `Jij bent er. Op dag één. Dat vraagt moed, ook al voelt het misschien niet zo.

Een relatie die eindigt laat een leegte achter die moeilijk te beschrijven is. Je hoeft het vandaag niet op te lossen.

De vraag voor vandaag is simpel: hoe voel je je nu, op dit moment? Niet zoals je denkt te moeten voelen. Maar wat er echt is.

Schrijf het op. Een zin, een woord, een paar regels. Meer hoeft niet.

{link}

Benji is er.`,
    },
    inHetAccount: "Hoe voel je je nu, op dit moment? Niet zoals je denkt te moeten voelen. Schrijf op wat er echt is. Een zin is genoeg.",
  },

  {
    dag: 2,
    thema: "Het moment waarop alles veranderde",
    subject: "Het moment waarop alles veranderde",
    mail: {
      persoon: `Er is een moment waarop je weet dat alles anders is. Soms was je erbij. Soms hoorde je het via een telefoon, een bericht, een blik van iemand anders. Soms was het langzaam, soms plotseling.

Dat moment draag je met je mee, ook als je er niet bewust aan denkt.

Vandaag vragen we je niet om het te analyseren of er vrede mee te hebben. Alleen om het even aan te raken.

Beschrijf het moment waarop het nieuws binnenkwam, of waarop je besefte dat het echt was. Wat zag je, wat hoorde je, waar was je?

Je hoeft het niet volledig te maken. Een paar zinnen is genoeg.

{link}

Tot morgen. Benji`,

      huisdier: `Er is een moment waarop je wist dat je hem of haar zou verliezen, of al verloren had. Soms was het een beslissing die je moest nemen. Soms was het plotseling. Soms was het na een lang afscheid.

Dat moment blijft hangen, op een manier die moeilijk uit te leggen is aan mensen die het niet kennen.

Vandaag vragen we je alleen om het even aan te raken.

Beschrijf het moment. Waar was je, wat gebeurde er, hoe voelde dat in je lichaam?

{link}

Tot morgen. Benji`,

      scheiding: `Bij een scheiding is er zelden één moment. Soms is het een gesprek. Soms een stilte die te lang duurt. Soms weet je het al lang voordat het wordt uitgesproken.

Toch is er een moment waarop je wist: dit is het. Dit verandert alles.

Beschrijf dat moment. Waar was je? Wat werd er gezegd, of juist niet gezegd? Hoe voelde dat?

Je hoeft het niet mooi te maken.

{link}

Tot morgen. Benji`,
    },
    inHetAccount: "Er was een moment waarop alles veranderde. Beschrijf het zo kort of uitgebreid als je wilt. Waar was je, wat gebeurde er, hoe voelde dat?",
    alsjewilt: "Wat deed je vlak daarna? Hoe zorgde je voor jezelf op dat moment, of lukte dat niet?",
  },

  {
    dag: 3,
    thema: "De leegte die je elke dag tegenkomt",
    subject: "De kleine leegte",
    mail: {
      persoon: `Verlies zit niet alleen in de grote momenten. Het zit in de kleine dingen die je elke dag tegenkomt.

De kant van het bed. Een kop koffie te veel of te weinig zetten. Een grappig bericht typen aan iemand die er niet meer is, en dan pas stoppen. Het geluid van een telefoon die niet meer gaat rinkelen.

Die kleine leegte is soms zwaarder dan alles.

Vandaag de vraag: wat is het kleine ding dat jou elke dag herinnert aan het gemis? Niet het grootste verdriet, maar het meest alledaagse.

{link}

Je bent niet alleen. Benji`,

      huisdier: `Het zijn de kleine dingen die het zwaarst zijn.

De vaste plek die leeg is. Het moment op de dag waarop je altijd samen iets deed. Automatisch kijken als je binnenloopt. Een riem die nog aan de kapstok hangt.

Die kleine leegte is heel echt.

Vandaag de vraag: wat is het kleine dagelijkse ding dat jou het meest herinnert aan het gemis?

{link}

Je bent niet alleen. Benji`,

      scheiding: `Het zijn niet altijd de grote dingen die het zwaarst zijn.

Het is de gewoontes die je samen had. Een grap die niemand anders begrijpt. De kant van de bank. Het geluid van iemand die thuiskomt. Dingen die er gewoon waren, en nu niet meer.

Die kleine leegte is soms moeilijker dan het grote verdriet.

Wat is het alledaagse ding dat jou het meest herinnert aan wat er niet meer is?

{link}

Je bent niet alleen. Benji`,
    },
    inHetAccount: "Verlies leeft in kleine dingen. Wat is het alledaagse moment of ding dat jou steeds herinnert aan het gemis? Schrijf het op, hoe klein het ook lijkt.",
    doedingetje: "Probeer deze week één ding te doen dat vroeger gewoon was en nu misschien lastig voelt. Niet omdat het makkelijk is, maar om te kijken hoe het voelt.",
  },

  {
    dag: 4,
    thema: "Hoe je lichaam het verdriet draagt",
    subject: "Verdriet zit niet alleen in je hoofd",
    mail: {
      persoon: `Verdriet is niet alleen iets wat je denkt of voelt. Het zit ook in je lichaam.

Een zwaar gevoel in je borst. Moe zijn zonder reden. Vergeten te eten, of juist niet kunnen stoppen. Slecht slapen, of alleen maar willen slapen. Een knoop in je maag als je aan bepaalde dingen denkt.

Je lichaam rouwt mee. Dat is niet zwak, dat is menselijk.

Hoe draagt jouw lichaam het verdriet? Wat merk je aan jezelf, fysiek, in de afgelopen tijd?

{link}

Rustig aan. Benji`,

      huisdier: `Verdriet zit ook in je lichaam. Dat geldt voor elk verlies, ook dit.

Een zwaar gevoel. Moe zijn zonder reden. Niet weten waar je je handen moet laten. Automatisch op een bepaald moment van de dag iets willen doen wat er niet meer is.

Je lichaam rouwt mee.

Wat merk je aan jezelf, fysiek, in de afgelopen tijd? Hoe draagt jouw lijf dit verlies?

{link}

Rustig aan. Benji`,

      scheiding: `Verdriet na een scheiding zit ook in je lichaam. Soms juist meer dan je verwacht.

Niet kunnen slapen, of alleen maar willen slapen. Een leegte die fysiek voelbaar is. Spanning die je niet kwijtraakt. Energie die er gewoon niet is.

Je lichaam verwerkt ook wat er is gebeurd.

Hoe merk jij het in je lichaam? Wat voel je fysiek, in de afgelopen tijd?

{link}

Rustig aan. Benji`,
    },
    inHetAccount: "Verdriet zit ook in je lichaam. Wat merk je aan jezelf, fysiek? Moe, gespannen, leeg? Beschrijf hoe jouw lijf dit draagt.",
    alsjewilt: "Is er iets wat je lichaam nodig heeft en dat je jezelf nog niet hebt gegeven? Rust, beweging, aanraking, frisse lucht?",
  },

  {
    dag: 5,
    thema: "Wat je de laatste tijd niet meer kunt",
    subject: "Wat verlies je ook aan jezelf",
    mail: {
      persoon: `Verlies verandert niet alleen wat er om je heen is. Het verandert ook wat je zelf kunt.

Dingen die je vroeger makkelijk deed, lukken nu niet meer. Concentreren. Plannen maken. Genieten van iets. Aanwezig zijn in een gesprek. Lachen zonder schuldgevoel.

Dat is niet omdat je zwak bent. Dat is omdat een deel van jouw wereld is veranderd, en jij mee.

Wat kun jij de laatste tijd niet meer, of moeilijker? Wat heeft dit verlies ook van jou gevraagd?

{link}

Het mag er zijn. Benji`,

      huisdier: `Een huisdier verliezen is ook een deel van je dagelijkse zelf verliezen.

De structuur die een dier geeft aan je dag. De reden om op te staan, naar buiten te gaan, thuis te komen. Het gevoel iemand nodig te zijn.

Wat kun jij de laatste tijd moeilijker, of helemaal niet meer? Wat heeft dit verlies ook van jou gevraagd?

{link}

Het mag er zijn. Benji`,

      scheiding: `Een relatie verliezen is ook een deel van jezelf verliezen.

Wie je was in die relatie. Hoe je de toekomst zag. Gewoontes, rollen, plannen die voor twee waren. Dat verdwijnt allemaal mee.

Wat kun jij de laatste tijd moeilijker, of helemaal niet meer? Wat heeft dit verlies ook van jou gevraagd?

{link}

Het mag er zijn. Benji`,
    },
    inHetAccount: "Verlies verandert ook wie je bent. Wat kun je de laatste tijd niet meer, of moeilijker? Wat heeft dit van jou gevraagd?",
    doedingetje: "Zoek deze week één foto op van een gewone dag met een fijne herinnering. Niet de mooiste of meest bijzondere. Gewoon een dag. Bewaar hem ergens waar je hem kunt zien.",
  },

  {
    dag: 6,
    thema: "Wie er voor jou is",
    subject: "Wie er is, en wie er niet is",
    mail: {
      persoon: `Verdriet laat heel duidelijk zien wie er is. En ook wie er niet is.

Soms verrassen mensen je, op een goede manier. Ze bellen vaker dan je verwachtte, ze komen langs zonder te vragen, ze zeggen de juiste dingen of gewoon niets.

Soms valt het ook tegen. Mensen die wegblijven. Die de verkeerde dingen zeggen. Die niet weten hoe, of het niet proberen.

Beiden zijn waar. En beiden mogen er zijn.

Wie is er voor jou in deze tijd? En is er iemand van wie je meer had verwacht?

{link}

Benji denkt aan je.`,

      huisdier: `Het verlies van een huisdier wordt niet altijd serieus genomen door mensen om je heen. Dat doet pijn op een eigen manier.

Maar soms zijn er ook mensen die het wel begrijpen. Die vragen hoe het gaat. Die de naam uitspreken.

Wie is er voor jou in deze tijd? En is er iemand van wie je meer had verwacht?

{link}

Benji denkt aan je.`,

      scheiding: `Na een scheiding verschuift ook je sociale wereld. Vrienden kiezen soms een kant. Gedeelde vrienden verdwijnen. Mensen weten niet wat te zeggen.

En soms zijn er mensen die je verrassen met hoe ze er voor je zijn.

Wie is er voor jou in deze tijd? En is er iemand van wie je meer had verwacht, of juist minder?

{link}

Benji denkt aan je.`,
    },
    inHetAccount: "Wie is er voor jou in deze tijd? Iemand die je heeft verrast met hun aanwezigheid? En is er iemand van wie je meer had verwacht?",
    alsjewilt: "Is er iemand aan wie jij behoefte hebt die je nog niet hebt benaderd? Wat weerhoudt je?",
  },

  {
    dag: 7,
    thema: "Hoe je deze week voor jezelf hebt gezorgd",
    subject: "Je hebt een week gedaan",
    mail: {
      persoon: `Je bent een week verder.

Dat klinkt misschien als weinig. Maar als je verdriet hebt, is elke dag iets. Je bent opgestaan. Je hebt dit geopend. Je hebt woorden gevonden voor iets wat moeilijk te verwoorden is.

Vandaag geen zware vraag. Eén ding: hoe heb je deze week voor jezelf gezorgd? Hoe klein ook. Eén kopje thee. Eén keer naar buiten. Eén moment van rust.

Als je er geen vindt, schrijf dan wat je nodig had maar niet hebt gekregen.

{link}

Je hebt deze week iets gedaan. Benji`,

      huisdier: `Je bent een week verder.

Een week zonder hem of haar. Dat is zwaar, ook al zegt de buitenwereld er misschien niets over.

Hoe heb jij deze week voor jezelf gezorgd? Hoe klein ook. En als je het antwoord niet weet, schrijf dan wat je nodig had maar niet hebt gekregen.

{link}

Je hebt deze week iets gedaan. Benji`,

      scheiding: `Je bent een week verder.

Een week met dit verdriet dat niet altijd door anderen wordt gezien of benoemd. Dat maakt het soms zwaarder.

Hoe heb jij deze week voor jezelf gezorgd? Eén klein ding. En als je het niet vindt, schrijf dan wat je nodig had maar niet hebt gekregen.

{link}

Je hebt deze week iets gedaan. Benji`,
    },
    inHetAccount: "Je bent een week verder. Hoe heb je voor jezelf gezorgd deze week, hoe klein ook? En wat had je nodig maar niet gekregen?",
  },

  // ─────────────── WEEK 2 — HERINNEREN ───────────────
  {
    dag: 8,
    thema: "Een gewone dag samen",
    subject: "Niet de bijzondere momenten, maar de gewone",
    mail: {
      persoon: `We bewaren de grote momenten. Verjaardagen, vakanties, bijzondere dagen. Die staan in foto's en verhalen.

Maar het zijn de gewone dagen die je het meest mist. Een doodgewone dinsdag. Het avondeten. Een ritje in de auto. Iets kleins dat jullie altijd deden.

Beschrijf een gewone dag met hem of haar. Geen bijzonder moment. Gewoon hoe het was.

{link}

Neem de tijd. Benji`,

      huisdier: `Niet de bijzondere momenten, maar de gewone. De ochtend. De wandeling. Het moment waarop je thuiskwam.

Beschrijf een gewone dag met hem of haar. Hoe laat stond je op? Wat deden jullie? Hoe voelde dat?

{link}

Neem de tijd. Benji`,

      scheiding: `Je mist niet alleen de grote momenten. Je mist ook de gewone dag.

Hoe zag een doordeweekse dag eruit, samen? Ochtend, avond, de kleine gewoontes. Wat was er gewoon aanwezig, wat je nu pas opmerkt omdat het er niet meer is?

{link}

Neem de tijd. Benji`,
    },
    inHetAccount: "Beschrijf een gewone dag samen. Niet het mooiste moment. Gewoon hoe een doodgewone dag eruitzag.",
    alsjewilt: "Welk klein detail van die dag zou je het liefst nog één keer meemaken?",
  },

  {
    dag: 9,
    thema: "Iets wat je nooit wilt vergeten",
    subject: "Vastleggen wat niet mag verdwijnen",
    mail: {
      persoon: `Een van de zwaarste kanten van verlies is de angst te vergeten. Niet de grote dingen, maar de kleine. Hoe iemand lachte. Wat ze zeiden als ze blij waren. De geur van hun jas.

Vandaag mag je iets vastleggen. Niet voor anderen, maar voor jezelf.

Wat is iets wat je nooit wilt vergeten over hem of haar? Een gebaar, een uitdrukking, een geluid, een gewoonte?

{link}

Dit blijft van jou. Benji`,

      huisdier: `De angst om te vergeten is echt. Hoe hij bewoog. Hoe ze klonk. Het gevoel van hem of haar naast je.

Vandaag mag je iets vastleggen.

Wat is iets wat je nooit wilt vergeten? Een gewoonte, een geluid, een gevoel?

{link}

Dit blijft van jou. Benji`,

      scheiding: `Na een scheiding is er soms een neiging om alleen het slechte te onthouden, als een soort bescherming. Maar er was ook iets moois. Iets wat echt was.

Wat is iets van jullie samen dat je niet wilt vergeten? Niet om pijn te doen, maar omdat het een deel van jouw verhaal is.

{link}

Dit blijft van jou. Benji`,
    },
    inHetAccount: "Wat is iets wat je nooit wilt vergeten? Een gebaar, geluid, geur, gewoonte. Leg het hier vast, voor jezelf.",
    doedingetje: "Probeer deze week iets op te schrijven, te tekenen of te bewaren dat aan hem of haar herinnert. Geen groot project. Één klein ding dat voor jou waardevol is.",
  },

  {
    dag: 10,
    thema: "Iets wat je aan het lachen maakte",
    subject: "De lichte kant",
    mail: {
      persoon: `Verdriet en humor sluiten elkaar niet uit. Soms zijn de grappigste herinneringen ook de meest pijnlijke, omdat ze laten zien hoe levend iemand was.

Vandaag een lichtere vraag.

Wat maakte jou aan het lachen bij hem of haar? Een grap, een eigenaardigheid, iets wat ze altijd deden dat tegelijk irritant en lief was?

{link}

Lachen mag. Benji`,

      huisdier: `Dieren doen de gekste dingen. En die kleine grappige gewoontes zijn soms het eerste wat je mist.

Wat maakte jou aan het lachen bij hem of haar? Een gewoonte, een blik, iets wat hij of zij altijd deed?

{link}

Lachen mag. Benji`,

      scheiding: `Er was ook licht, ook plezier, ook lachen. Dat hoeft niet te verdwijnen uit je herinnering.

Wat maakte jou aan het lachen in jullie relatie? Een inside joke, een eigenaardigheid, een moment dat je altijd bijblijft?

{link}

Lachen mag. Benji`,
    },
    inHetAccount: "Wat maakte jou aan het lachen bij hem, haar of hen? Een eigenaardigheid, een grap, iets kleins dat alleen jullie begrepen?",
    alsjewilt: "Als je aan die herinnering denkt, wat voel je dan? Mogen die twee dingen tegelijk bestaan — het lachen en het gemis?",
  },

  {
    dag: 11,
    thema: "Een moment van trots",
    subject: "Trots op hen, of zij op jou",
    mail: {
      persoon: `Vandaag een vraag over trots.

Er zijn momenten waarop je trots was op de ander. Of waarop je wist dat zij trots op jou waren. Die momenten blijven hangen op een bijzondere manier.

Beschrijf zo'n moment. Wanneer was je trots op hem of haar? Of wanneer wist je dat zij trots op jou waren?

{link}

Benji`,

      huisdier: `Er zijn momenten waarop je trots was op je dier. Een nieuwe vaardigheid, een moment van vertrouwen, iets wat alleen jullie samen hadden opgebouwd.

Beschrijf zo'n moment. Wanneer was je trots, of wanneer voelde jullie verbinding het sterkst?

{link}

Benji`,

      scheiding: `Er waren ook momenten in jullie relatie waarop je trots was. Op de ander, of op wat jullie samen hadden gebouwd.

Beschrijf zo'n moment. Wanneer was je trots op hem of haar, of op jullie samen?

{link}

Benji`,
    },
    inHetAccount: "Beschrijf een moment van trots. Wanneer was je trots op hem of haar? Of wanneer voelde je dat zij trots op jou waren?",
  },

  {
    dag: 12,
    thema: "Iets wat onafgemaakt is gebleven",
    subject: "Wat je nog had willen zeggen",
    mail: {
      persoon: `Verlies laat bijna altijd iets onafgemaakt achter. Iets wat je nog had willen zeggen. Een gesprek dat er niet meer van is gekomen. Een sorry, of een dankjewel, of gewoon: ik hou van je, nog één keer.

Dat is pijnlijk om te dragen. Maar het mag er zijn.

Wat is er bij jou onafgemaakt gebleven? Wat had je nog willen zeggen of doen?

{link}

Dit mag er zijn. Benji`,

      huisdier: `Er zijn dingen die onafgemaakt blijven. Een laatste wandeling die er niet van is gekomen. Een moment waarop je niet aanwezig kon zijn. Iets wat je nog had willen geven.

Wat is er bij jou onafgemaakt gebleven?

{link}

Dit mag er zijn. Benji`,

      scheiding: `Na een scheiding blijft er bijna altijd iets onafgemaakt. Een gesprek dat nooit echt is gevoerd. Iets wat je had willen zeggen maar niet durfde.

Wat is er bij jou onafgemaakt gebleven? Wat had je nog willen zeggen of doen?

{link}

Dit mag er zijn. Benji`,
    },
    inHetAccount: "Wat is er onafgemaakt gebleven? Iets wat je nog had willen zeggen, doen of geven. Schrijf het op, ook al kan het nu niet meer.",
    alsjewilt: "Als je het alsnog zou kunnen zeggen, wat zou je dan zeggen? Je mag het hier schrijven.",
  },

  {
    dag: 13,
    thema: "Wat zij jou hebben gegeven",
    subject: "Wat leeft er van hen voort in jou",
    mail: {
      persoon: `Mensen die we liefhebben laten iets achter in ons. Niet alleen herinneringen, maar iets van wie zij waren.

Een manier van doen. Een uitdrukking die je bent gaan gebruiken. Een waarde die je van hen hebt meegekregen. Iets wat je nu anders doet of ziet door hen.

Wat heeft hij of zij jou gegeven, bewust of onbewust? Wat leeft er van hen voort in jou?

{link}

Ze zijn er nog, op hun eigen manier. Benji`,

      huisdier: `Dieren geven ons meer dan we soms beseffen. Geduld. Aanwezigheid. De gewoonte van dagelijkse beweging. Een reden om thuis te komen.

Wat heeft hij of zij jou gegeven? Wat draag je mee van jullie tijd samen?

{link}

Ze zijn er nog, op hun eigen manier. Benji`,

      scheiding: `Een relatie verandert je, ook als ze eindigt. Je hebt dingen geleerd, dingen meegekregen, dingen ontdekt over jezelf die er niet waren geweest zonder die persoon.

Wat heeft deze relatie jou gegeven? Wat draag je mee, ook nu het voorbij is?

{link}

Ze zijn er nog, op hun eigen manier. Benji`,
    },
    inHetAccount: "Wat heeft hij, zij of deze relatie jou gegeven? Wat draag je mee van hen, bewust of onbewust?",
    doedingetje: "Probeer deze week iets te doen wat hij of zij je heeft geleerd, of iets wat jij van hen hebt meegekregen. Hoe klein ook.",
  },

  {
    dag: 14,
    thema: "Een herinnering die pijn doet maar die je koestert",
    subject: "Pijn en liefde in één",
    mail: {
      persoon: `Sommige herinneringen doen pijn en zijn tegelijk het kostbaarste wat je hebt. Ze laten je voelen hoe echt het was.

Vandaag de vraag: is er een herinnering die pijn doet, maar die je toch niet kwijt wilt? Die je koestert, ook al maakt ze je verdrietig?

Je hoeft hem niet te delen als het te zwaar is. Maar als je dat wilt, is er hier ruimte.

{link}

Twee weken. Benji`,

      huisdier: `Er zijn herinneringen die pijn doen en tegelijk het mooiste zijn wat je hebt. Omdat ze laten zien hoe echt jullie band was.

Is er een herinnering die pijn doet maar die je niet kwijt wilt? Die je koestert, ook al maakt ze je verdrietig?

{link}

Twee weken. Benji`,

      scheiding: `Sommige herinneringen doen pijn en zijn tegelijk iets wat je niet kwijt wilt. Dat is geen zwakte. Dat is eerlijkheid over wat er was.

Is er een herinnering die pijn doet maar die je toch koestert? Iets wat je niet wilt loslaten, ook al doet het zeer?

{link}

Twee weken. Benji`,
    },
    inHetAccount: "Is er een herinnering die pijn doet maar die je koestert? Die je niet kwijt wilt, ook al maakt ze je verdrietig?",
    alsjewilt: "Wat maakt deze herinnering zo waardevol voor je? Wat zegt het over wat er was?",
  },

  // ─────────────── WEEK 3 — VOORTLEVEN ───────────────
  {
    dag: 15,
    thema: "Hoe dit verlies jou heeft veranderd",
    subject: "Halverwege. Wie ben jij nu?",
    mail: {
      persoon: `Halverwege.

Vijftien dagen. Dat is iets, ook al voelt het misschien niet zo.

Verlies verandert mensen. Niet altijd zichtbaar voor buitenstaanders, maar van binnenuit. Je kijkt anders naar dingen. Je weet wat telt. Of juist niet meer.

Hoe heeft dit verlies jou veranderd? Wat zie je nu anders dan voor dit verlies?

{link}

Halverwege. Benji`,

      huisdier: `Halverwege. Vijftien dagen.

Verlies verandert mensen, ook het verlies van een dier. Hoe kijk jij nu anders naar dingen? Wat heeft dit je geleerd, of laten zien?

{link}

Halverwege. Benji`,

      scheiding: `Halverwege. Vijftien dagen.

Een scheiding verandert wie je bent. Niet alleen je situatie, maar jijzelf. Hoe kijk jij nu anders naar dingen? Wat zie je in jezelf wat je eerder niet zag?

{link}

Halverwege. Benji`,
    },
    inHetAccount: "Halverwege. Hoe heeft dit verlies jou veranderd? Wat zie je nu anders dan voor dit verlies?",
    alsjewilt: "Is die verandering alleen verlies, of zit er ook iets in wat je wilt bewaren?",
  },

  {
    dag: 16,
    thema: "Wat je van hen hebt geleerd",
    subject: "Wat zij jou hebben bijgebracht",
    mail: {
      persoon: `Mensen leren ons dingen, bewust en onbewust. Door wie zij waren, hoe zij leefden, wat zij waardeerden.

Wat heb jij geleerd van hem of haar? Niet wat ze je letterlijk hebben verteld, maar wat jij hebt meegekregen door hen te kennen?

{link}

Benji`,

      huisdier: `Dieren leren ons dingen die mensen ons soms niet kunnen leren. Aanwezig zijn. Liefhebben zonder oordeel. Genieten van een klein moment.

Wat heb jij geleerd van hem of haar?

{link}

Benji`,

      scheiding: `Elke relatie leert ons iets over onszelf en over liefde. Ook als ze eindigt.

Wat heb jij geleerd van deze relatie, van deze persoon, of van het einde ervan?

{link}

Benji`,
    },
    inHetAccount: "Wat heb jij geleerd van hem, haar of deze relatie? Niet wat je letterlijk bent verteld, maar wat je hebt meegekregen.",
    doedingetje: "Probeer deze week iets te doen op een manier die hij of zij jou heeft geleerd. En merk op hoe dat voelt.",
  },

  {
    dag: 17,
    thema: "Wat zij nu tegen je zouden zeggen",
    subject: "Als ze je nu konden zien",
    mail: {
      persoon: `Stel dat hij of zij je nu kon zien. Niet hoe je vroeger was, maar nu, in deze periode.

Wat zou hij of zij zeggen? Niet wat je zou willen horen, maar wat je denkt dat zij echt zouden zeggen. Met hun stem, hun woorden, hun manier.

{link}

Ze zijn er nog, in jou. Benji`,

      huisdier: `Stel dat hij of zij je nu kon zien, in deze periode van rouw en gemis.

Wat zou hij of zij doen of laten merken? Hoe zou zijn of haar aanwezigheid er nu uitzien?

{link}

Ze zijn er nog, in jou. Benji`,

      scheiding: `Even een andere vraag vandaag. Niet over hem of haar, maar over jou.

Als je eerlijk bent tegen jezelf: wat zou de versie van jou van twee jaar geleden zeggen over hoe je het nu doet? Wat zou die je willen zeggen?

{link}

Ze zijn er nog, in jou. Benji`,
    },
    inHetAccount: "Als hij, zij of een vroegere versie van jezelf je nu kon zien: wat zouden ze zeggen? Schrijf het op, in hun woorden.",
    alsjewilt: "Kun je iets doen met wat ze zouden zeggen? Wat zou je er mee willen doen?",
  },

  {
    dag: 18,
    thema: "Waar je boos op bent",
    subject: "Boosheid is ook rouw",
    mail: {
      persoon: `Boosheid hoort bij verdriet, maar het is het gevoel dat het minst ruimte krijgt.

Je mag boos zijn. Op de situatie. Op wat er is gebeurd. Op mensen die er niet waren. Op het leven dat het zo heeft laten lopen. Op hem of haar, soms, ook als dat onlogisch voelt.

Waar ben jij boos op? Je hoeft het niet te rechtvaardigen. Je mag het gewoon zeggen.

{link}

Boosheid mag. Benji`,

      huisdier: `Boosheid hoort bij verlies, ook dit verlies.

Misschien ben je boos op de situatie. Op een beslissing die je moest nemen. Op mensen die het niet begrijpen. Op het simpele feit dat het leven zo oneerlijk kan zijn.

Waar ben jij boos op? Je hoeft het niet te rechtvaardigen.

{link}

Boosheid mag. Benji`,

      scheiding: `Bij een scheiding is boosheid soms het makkelijkst te voelen, en tegelijk het meest verwarrend. Want je kunt boos zijn op iemand van wie je ook hebt gehouden.

Waar ben jij boos op? Op hem of haar, op jezelf, op de situatie, op wat er had kunnen zijn maar het niet is geworden?

{link}

Boosheid mag. Benji`,
    },
    inHetAccount: "Waar ben je boos op? Je hoeft het niet te rechtvaardigen of mooi te maken. Schrijf het gewoon op.",
    alsjewilt: "Achter boosheid zit vaak ook pijn. Wat zit er onder jouw boosheid?",
  },

  {
    dag: 19,
    thema: "Wat je bang maakt",
    subject: "De angst die niemand vraagt",
    mail: {
      persoon: `Verlies brengt ook angst mee. Voor de toekomst. Voor hoe het verder moet. Voor vergeten. Voor nog meer verlies.

Niemand vraagt daar altijd naar. Maar het is er wel.

Wat maakt jou bang nu? Over de toekomst, over jezelf, over hoe het verdergaat?

{link}

Angst mag er zijn. Benji`,

      huisdier: `Verlies brengt ook angst mee. Bang om te vergeten hoe hij of zij was. Bang voor de leegte. Bang voor een volgend verlies.

Wat maakt jou bang nu?

{link}

Angst mag er zijn. Benji`,

      scheiding: `Na een scheiding komen er veel vragen en angsten. Over wie je bent zonder die ander. Over of je ooit weer iemand zult vinden. Over de toekomst die anders is dan je dacht.

Wat maakt jou het bangst nu?

{link}

Angst mag er zijn. Benji`,
    },
    inHetAccount: "Wat maakt je bang nu? Over de toekomst, over jezelf, over hoe het verdergaat. Schrijf het op.",
    alsjewilt: "Is er iets wat jou zou helpen met die angst? Iets kleins, iets haalbaars?",
  },

  {
    dag: 20,
    thema: "Een moment waarop je even jezelf was",
    subject: "Ruimte voor licht",
    mail: {
      persoon: `Verdriet neemt veel ruimte in. Maar soms is er even een moment waarop je gewoon jezelf bent. Niet de rouwende, niet de sterke, niet de verdoofde. Gewoon jij.

Was er de afgelopen tijd zo'n moment? Hoe kort ook? Een gesprek, een wandeling, een film, een maaltijd, een lach.

Beschrijf het. Het mag er zijn naast het verdriet.

{link}

Er is ruimte voor allebei. Benji`,

      huisdier: `Was er de afgelopen tijd een moment waarop je even gewoon jezelf was? Niet het verdriet, maar jij?

Hoe klein ook. Beschrijf het. Het mag er zijn.

{link}

Er is ruimte voor allebei. Benji`,

      scheiding: `Was er de afgelopen tijd een moment waarop je even gewoon jezelf was? Niet de gescheiden persoon, niet degene die het moeilijk heeft. Gewoon jij.

Beschrijf dat moment. Het mag er zijn naast het verdriet.

{link}

Er is ruimte voor allebei. Benji`,
    },
    inHetAccount: "Was er de afgelopen tijd een moment waarop je even gewoon jezelf was? Hoe kort ook. Beschrijf het.",
    doedingetje: "Probeer deze week bewust één moment voor jezelf te maken. Iets wat jou goed doet, zonder dat het iets met het verlies te maken heeft. Jij mag er ook nog zijn.",
  },

  {
    dag: 21,
    thema: "Wat je nog steeds bij je draagt van hen",
    subject: "Wat nooit verdwijnt",
    mail: {
      persoon: `Drie weken.

Er zijn dingen van iemand die nooit verdwijnen. Die gewoon een deel van jou worden. Niet als pijn, maar als aanwezigheid.

Wat draag jij nog steeds bij je van hem of haar? Wat zal altijd bij jou blijven, ook als de tijd verder gaat?

{link}

Drie weken. Benji`,

      huisdier: `Drie weken.

Er zijn dingen van hem of haar die bij jou blijven. Niet als pijn, maar als aanwezigheid. Hoe hij of zij de dag begon. Wat hij of zij deed als jij verdrietig was.

Wat draag jij nog steeds bij je? Wat blijft altijd een deel van jou?

{link}

Drie weken. Benji`,

      scheiding: `Drie weken.

Er zijn dingen van een relatie die bij je blijven, ook als ze eindigt. Niet als wond, maar als een deel van wie je bent geworden.

Wat draag jij nog steeds bij je van hen, van jullie samen?

{link}

Drie weken. Benji`,
    },
    inHetAccount: "Wat draag je nog steeds bij je van hem, haar of jullie samen? Wat blijft altijd een deel van jou?",
    alsjewilt: "Hoe wil je dat bewaren? Is er iets wat je kunt doen om het een plek te geven?",
  },

  // ─────────────── WEEK 4 — DRAGEN ───────────────
  {
    dag: 22,
    thema: "Wat draaglijker is geworden",
    subject: "Hoe klein ook",
    mail: {
      persoon: `Verdriet verandert niet in een rechte lijn. Het gaat op en neer, soms per uur.

Maar als je terugkijkt op de eerste dagen, is er dan iets wat nu iets draaglijker voelt? Hoe klein ook?

Niet omdat je het hebt verwerkt. Maar omdat je het ook meedraagt, niet alleen tegenhoudt.

{link}

Je doet het. Benji`,

      huisdier: `Als je terugkijkt op de eerste dagen, is er dan iets wat nu iets draaglijker voelt? Hoe klein ook?

Dat is geen verraad aan het gemis. Dat is jij die leert hoe je het kunt dragen.

{link}

Je doet het. Benji`,

      scheiding: `Als je terugkijkt op de eerste tijd, is er dan iets wat nu iets draaglijker voelt? Iets wat makkelijker gaat, of minder pijn doet dan in het begin?

Hoe klein ook, het telt.

{link}

Je doet het. Benji`,
    },
    inHetAccount: "Is er iets wat draaglijker is geworden dan in de eerste dagen? Hoe klein ook. Schrijf het op.",
  },

  {
    dag: 23,
    thema: "Iemand die je heeft verrast",
    subject: "Onverwachte steun",
    mail: {
      persoon: `Verdriet laat zien wie er is. En soms word je verrast.

Is er iemand die jou de afgelopen tijd heeft verrast met hun aanwezigheid, hun woorden of hun stilte? Iemand van wie je het niet had verwacht?

{link}

Er zijn mensen die om je geven. Benji`,

      huisdier: `Is er iemand die jou de afgelopen tijd heeft verrast? Die je gemis serieus nam, of er gewoon voor je was zonder veel woorden?

{link}

Er zijn mensen die om je geven. Benji`,

      scheiding: `Is er iemand die jou de afgelopen tijd heeft verrast? Die er was op een manier die je niet had verwacht? Die je gemis serieus nam zonder oordeel?

{link}

Er zijn mensen die om je geven. Benji`,
    },
    inHetAccount: "Is er iemand die jou de afgelopen tijd heeft verrast met hun steun of aanwezigheid? Wie, en wat deden ze?",
    alsjewilt: "Heb je diegene laten weten wat het voor je heeft betekend?",
    doedingetje: "Stuur die persoon deze week een bericht. Niet groot, niet lang. Alleen: dank je wel, of ik denk aan je.",
  },

  {
    dag: 24,
    thema: "Wat jij nodig hebt de komende tijd",
    subject: "Eerlijk voor jezelf",
    mail: {
      persoon: `We zijn goed in zorgen voor anderen. Minder goed in weten wat we zelf nodig hebben.

Wat heb jij nodig de komende tijd? Niet wat je zou moeten willen. Maar wat je echt nodig hebt, eerlijk, voor jezelf?

Rust. Gezelschap. Afleiding. Stilte. Iemand die luistert. Structuur. Of gewoon tijd.

{link}

Jij telt ook. Benji`,

      huisdier: `Wat heb jij nodig de komende tijd? Niet wat je zou moeten willen, maar wat je echt nodig hebt?

Schrijf het op, ook als je niet weet hoe je het moet krijgen.

{link}

Jij telt ook. Benji`,

      scheiding: `Wat heb jij nodig de komende tijd? Niet wat anderen van je verwachten, niet wat goed klinkt. Wat jij echt nodig hebt, diep van binnen?

{link}

Jij telt ook. Benji`,
    },
    inHetAccount: "Wat heb je nodig de komende tijd? Eerlijk, voor jezelf. Rust, gezelschap, stilte, structuur, of iets anders?",
    alsjewilt: "Is er één stap die je kunt zetten om dat te krijgen? Hoe klein ook?",
  },

  {
    dag: 25,
    thema: "Een gewoonte of ritueel dat je troost",
    subject: "Wat houvast geeft",
    mail: {
      persoon: `In moeilijke tijden zoeken mensen houvast. Soms bewust, soms zonder het te beseffen.

Is er iets wat jou troost, structuur of rust geeft? Een gewoonte, een ritueel, iets kleins dat elke dag terugkomt?

Dat hoeft niet diepzinnig te zijn. Een kop thee op dezelfde plek. Een wandeling. Een muziekje. Iets wat van jou is.

{link}

Benji`,

      huisdier: `Is er iets wat jou troost of structuur geeft in deze tijd? Een gewoonte, een ritueel, iets kleins dat houvast biedt?

Het mag iets nieuws zijn wat je hebt gevonden, of iets wat er altijd al was.

{link}

Benji`,

      scheiding: `Is er iets wat jou houvast geeft in deze periode? Een gewoonte, een ritueel, iets kleins dat structuur brengt?

Soms vinden mensen nieuwe gewoontes na een verlies die ze nooit hadden verwacht. Is er iets dat voor jou werkt?

{link}

Benji`,
    },
    inHetAccount: "Wat geeft jou troost of houvast in deze periode? Een gewoonte, een ritueel, iets kleins? Schrijf het op.",
    doedingetje: "Doe dat ding deze week bewust. Niet automatisch, maar met aandacht. Merk op wat het doet.",
  },

  {
    dag: 26,
    thema: "Wat je wilt onthouden over deze periode",
    subject: "Niet alleen het verdriet",
    mail: {
      persoon: `Deze periode is zwaar. Maar er zit ook iets anders in, als je goed kijkt.

Wat wil je onthouden over deze tijd? Niet alleen het verdriet, maar ook wat het je heeft laten zien. Over mensen, over jezelf, over wat telt.

{link}

Je hebt meer gedaan dan je denkt. Benji`,

      huisdier: `Wat wil je onthouden over deze periode? Niet alleen de pijn, maar ook wat het je heeft laten zien. Over wie er voor je was, over jezelf, over hoe jij liefhebt.

{link}

Je hebt meer gedaan dan je denkt. Benji`,

      scheiding: `Wat wil je onthouden over deze periode? Niet alleen het verlies, maar ook wat je hebt geleerd. Over jezelf, over wat je nodig hebt, over wie je bent.

{link}

Je hebt meer gedaan dan je denkt. Benji`,
    },
    inHetAccount: "Wat wil je onthouden over deze periode? Niet alleen het verdriet, maar ook wat het je heeft laten zien.",
    alsjewilt: "Als je over tien jaar terugkijkt op deze tijd, wat hoop je dan dat je eraan hebt meegekregen?",
  },

  {
    dag: 27,
    thema: "Een brief aan hen",
    subject: "Zeg wat je nog wilt zeggen",
    mail: {
      persoon: `Vandaag een bijzondere opdracht.

Schrijf een brief. Aan hem of haar. Niet voor anderen, alleen voor jezelf. Zeg wat je nog wilt zeggen. Wat je mist. Wat je dankbaar voor bent. Wat je boos over bent. Wat je hoopt.

Er zijn geen regels. Je hoeft het niet af te maken. Je hoeft het aan niemand te laten zien.

Maar schrijf het. Voor jezelf.

{link}

Neem de tijd vandaag. Benji`,

      huisdier: `Vandaag een bijzondere opdracht.

Schrijf een brief aan hem of haar. Zeg wat je nog wilt zeggen. Wat je mist. Wat je dankbaar voor bent. Wat jullie tijd samen voor jou heeft betekend.

Er zijn geen regels. Alleen jij en jouw woorden.

{link}

Neem de tijd vandaag. Benji`,

      scheiding: `Vandaag een bijzondere opdracht.

Schrijf een brief. Niet om te versturen, maar voor jezelf. Zeg wat je nog wilt zeggen. Wat je mist. Wat je boos over bent. Wat je dankbaar voor bent. Wat je hoopt voor jezelf.

Er zijn geen regels.

{link}

Neem de tijd vandaag. Benji`,
    },
    inHetAccount: "Schrijf een brief aan hem, haar of hen. Zeg wat je nog wilt zeggen. Geen regels, geen verwachtingen. Alleen jouw woorden.",
  },

  {
    dag: 28,
    thema: "Wat je loslaat",
    subject: "Niet de persoon, maar iets wat je meedraagt",
    mail: {
      persoon: `Loslaten betekent niet vergeten. Het betekent niet dat het minder heeft betekend.

Maar soms draag je dingen mee die je eigenlijk niet meer nodig hebt. Schuldgevoelens. Woede. De gedachte dat het anders had moeten gaan. Verwachtingen over hoe het rouwen zou moeten zijn.

Is er iets wat jij wilt loslaten? Niet hem of haar. Maar iets wat je meedraagt dat je zwaar maakt?

{link}

Over twee dagen zijn je 30 dagen klaar. Benji`,

      huisdier: `Is er iets wat jij wilt loslaten? Niet hem of haar. Maar iets wat je meedraagt dat je zwaar maakt? Schuldgevoelens, twijfels over beslissingen, de gedachte dat het anders had gemoeten?

{link}

Over twee dagen zijn je 30 dagen klaar. Benji`,

      scheiding: `Is er iets wat jij wilt loslaten? Niet de persoon, niet de herinneringen. Maar iets wat je meedraagt dat je zwaar maakt? Bitterheid, verwijten, het beeld van hoe het had moeten zijn?

{link}

Over twee dagen zijn je 30 dagen klaar. Benji`,
    },
    inHetAccount: "Is er iets wat je wilt loslaten? Niet de persoon. Maar iets wat je meedraagt dat je zwaar maakt. Schrijf het op.",
    alsjewilt: "Hoe zou het voelen als je dat los kon laten? Wat zou er dan ruimte voor komen?",
  },

  {
    dag: 29,
    thema: "Hoe je verder gaat met dit gemis als deel van je — niet achter je",
    subject: "Verder, niet voorbij",
    mail: {
      persoon: `Nog één dag.

Verlies hoeft geen plek te zijn die je achter je laat. Het wordt een deel van wie je bent — niet als gewicht, maar als verhaal.

Je hebt de afgelopen weken woorden gegeven aan iets wat moeilijk te verwoorden is. Dat verandert je. Niet zodat je voorbij het verlies gaat, maar zodat je ermee verder kunt.

Hoe zie jij de weg vooruit? Niet voorbij dit gemis, maar ermee. Wat wil je meenemen van de afgelopen 30 dagen?

{link}

Morgen de laatste dag. Benji`,

      huisdier: `Nog één dag.

De afwezigheid van hem of haar wordt een deel van wie je bent — niet als pijn die je meesjouwt, maar als herinnering die bij je hoort.

Je hebt de afgelopen weken stilgestaan bij wat er was. Dat is niet niets.

Hoe ga jij verder met dit gemis als deel van je? Wat neem je mee?

{link}

Morgen de laatste dag. Benji`,

      scheiding: `Nog één dag.

Een scheiding eindigt, maar het hoofdstuk dat je hebt geleefd blijft een deel van jou. Niet als open wond, maar als ervaring die je heeft gevormd.

Hoe ga jij verder met dit als deel van je verhaal? Niet erover heen, maar ermee. Wat wil je meenemen?

{link}

Morgen de laatste dag. Benji`,
    },
    inHetAccount: "Bijna aan het einde. Hoe wil jij verder met dit gemis als deel van je — niet achter je? Wat neem je mee?",
    alsjewilt: "Is er iets wat je anders wilt doen of zijn in de komende tijd, nu je dit hebt doorlopen?",
  },

  {
    dag: 30,
    thema: "Een brief aan jezelf",
    subject: "De laatste dag. Voor jou.",
    mail: {
      persoon: `Dit is dag dertig.

De afgelopen maand heb je geschreven over wie je mist, over wat er was, over hoe je dit draagt. Vandaag schrijf je niet aan hen, maar aan jezelf.

Schrijf een brief aan de versie van jou die hier vandaag is. Wat heb je de afgelopen 30 dagen ontdekt? Wat wil je deze versie van jezelf meegeven?

Er zijn geen regels. Schrijf wat er komt.

{link}

Je hebt het gedaan. Benji`,

      huisdier: `Dit is dag dertig.

Je hebt de afgelopen maand woorden gegeven aan iets wat moeilijk is. Vandaag schrijf je niet aan hem of haar, maar aan jezelf.

Schrijf een brief aan de versie van jou die hier vandaag is. Wat heb je geleerd? Wat wil je jezelf meegeven?

{link}

Je hebt het gedaan. Benji`,

      scheiding: `Dit is dag dertig.

Je hebt de afgelopen maand stilgestaan bij wat er was, wat het je heeft gevraagd, en hoe je verdergaat. Vandaag schrijf je aan jezelf.

Schrijf een brief aan de versie van jou die hier vandaag is. Wat neem je mee? Wat wil je jezelf zeggen?

{link}

Je hebt het gedaan. Benji`,
    },
    inHetAccount: "Dit is de laatste dag. Schrijf een brief aan jezelf — aan de versie van jou die hier nu is. Wat neem je mee van deze 30 dagen?",
  },
];

/**
 * Geeft de dagcontent terug voor een specifiek dag en verliestype.
 * Als het verliestype "relatie" is, wordt "scheiding" gebruikt.
 * Als het verliestype onbekend is, wordt "persoon" als fallback gebruikt.
 */
export function getDagInhoud(dag: number, verliesType: string): DagInhoud | null {
  const dagIndex = Math.min(Math.max(dag - 1, 0), 29);
  return NIET_ALLEEN_CONTENT[dagIndex] ?? null;
}

export function getMailTekst(dag: number, verliesType: string): string {
  const inhoud = getDagInhoud(dag, verliesType);
  if (!inhoud) return "";

  const type: NietAlleenVerliesType =
    verliesType === "huisdier" ? "huisdier" :
    verliesType === "scheiding" || verliesType === "relatie" ? "scheiding" :
    "persoon";

  return inhoud.mail[type];
}

/**
 * Vervangt "hem of haar" / "hij of zij" door de verliesNaam als die bekend is.
 * Alleen voor persoon en huisdier, niet voor scheiding.
 */
export function vervangVerliesNaam(tekst: string, verliesNaam: string | null | undefined, verliesType: string): string {
  if (!verliesNaam || verliesType === "scheiding" || verliesType === "relatie") return tekst;
  return tekst
    .replace(/hem of haar/g, verliesNaam)
    .replace(/hij of zij/g, verliesNaam)
    .replace(/hem\/haar/g, verliesNaam)
    .replace(/hij\/zij/g, verliesNaam);
}
