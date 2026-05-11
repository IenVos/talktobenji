/**
 * Niet Alleen — 30-dagen content voor eenzaamheid
 *
 * Elk item bevat:
 * - subject: onderwerpregel van de mail
 * - mail: de mailtekst (bevat {link} als placeholder)
 * - inHetAccount: korte tekst op de dagpagina in de app
 * - alsjewilt: optionele verdiepingsvraag
 * - doedingetje: optionele kleine actie (op dezelfde dagen als hoofdprogramma: 3, 5, 9, 13, 16, 20, 23, 25)
 */

export type EenzaamheidDag = {
  dag: number;
  thema: string;
  subject: string;
  mail: string;
  inHetAccount: string;
  alsjewilt?: string;
  doedingetje?: string;
};

export const EENZAAMHEID_CONTENT: EenzaamheidDag[] = [
  // ─────────────── WEEK 1 — AANWEZIG ZIJN ───────────────
  {
    dag: 1,
    thema: "Hoe het voelt om hier te zijn",
    subject: "Je hoeft vandaag maar één ding te doen",
    mail: `Jij bent er. Op dag één. Dat vraagt moed, ook al voelt het misschien niet zo.

Eenzaamheid is een van de moeilijkste dingen om te benoemen. Niet omdat het niet echt is — het is heel echt — maar omdat de wereld er weinig ruimte voor maakt. Je bent omgeven door mensen, misschien zelfs druk bezet, en toch is er dat gevoel: niemand ziet echt wie ik ben.

Je hoeft het vandaag niet op te lossen. Je hoeft het niet eens te begrijpen.

De vraag voor vandaag is simpel: hoe voel je je nu, op dit moment? Niet zoals je denkt te moeten voelen. Maar wat er echt is.

Schrijf het op. Een zin, een woord, een paar regels. Meer hoeft niet.

{link}

Benji is er.`,
    inHetAccount: "Hoe voel je je nu, op dit moment? Niet zoals je denkt te moeten voelen. Schrijf op wat er echt is. Een zin is genoeg.",
  },

  {
    dag: 2,
    thema: "Wanneer voel je je het meest alleen",
    subject: "Het moment waarop het het zwaarst is",
    mail: `Er zijn momenten waarop eenzaamheid het zwaarst voelt. Soms is het 's avonds, als de dag stilvalt. Soms midden in een gesprek, als je beseft dat de ander je niet echt hoort. Soms op een feestje, omringd door mensen.

Dat zijn de momenten die het pijnlijkst zijn: niet de stilte op zichzelf, maar het gevoel van erbij zijn en toch niet erbij zijn.

Vandaag vragen we je niet om het weg te maken. Alleen om het even aan te raken.

Wanneer voel jij je het meest alleen? Beschrijf het moment. Waar ben je, wat is er om je heen, wat zit er in je hoofd?

Je hoeft het niet mooi te maken.

{link}

Tot morgen. Benji`,
    inHetAccount: "Wanneer voel je je het meest alleen? Beschrijf het moment zo concreet mogelijk. Waar ben je, wat gebeurt er, hoe voelt dat?",
    alsjewilt: "Wat doet dat moment met je? Wat ga je dan doen, of juist niet doen?",
  },

  {
    dag: 3,
    thema: "De kleine momenten van gemis aan verbinding",
    subject: "De kleine leegte",
    mail: `Eenzaamheid zit niet alleen in de grote momenten. Het zit in de kleine dingen.

Een grappig bericht typen zonder te weten aan wie je het wil sturen. Een film kijken en niemand hebben om het mee te bespreken. Een dag meemaken die de moeite waard was en het nergens kwijt kunnen. Automatisch je telefoon pakken en dan niet weten wat je zoekt.

Die kleine leegte is soms zwaarder dan alles.

Vandaag de vraag: wat is het kleine, alledaagse ding dat jou het meest herinnert aan het gemis aan verbinding? Niet het grootste gevoel, maar het meest gewone moment.

{link}

Je bent niet alleen. Benji`,
    inHetAccount: "Eenzaamheid leeft in kleine dingen. Wat is het alledaagse moment dat jou steeds herinnert aan het gemis aan verbinding? Schrijf het op, hoe klein het ook lijkt.",
    doedingetje: "Stuur vandaag een berichtje aan iemand zonder aanleiding. Gewoon: 'Ik dacht aan je.' Meer hoeft niet.",
  },

  {
    dag: 4,
    thema: "Hoe je lichaam eenzaamheid draagt",
    subject: "Eenzaamheid zit ook in je lichaam",
    mail: `Eenzaamheid is niet alleen iets wat je denkt of voelt. Het zit ook in je lichaam.

Een zwaar gevoel in je borst. Moe zijn zonder reden. Een soort gespannenheid als je tussen mensen bent. Het gevoel dat je jezelf kleiner maakt. De vanzelfsprekende aanraking die er niet is.

Je lichaam weet het ook. Dat is niet zwak, dat is menselijk.

Hoe draagt jouw lichaam de eenzaamheid? Wat merk je aan jezelf, fysiek, als je eerlijk kijkt?

{link}

Rustig aan. Benji`,
    inHetAccount: "Eenzaamheid zit ook in je lichaam. Waar voel jij het? Een spanning, een zwaarte, een vermoeidheid? Schrijf op wat je herkent.",
    alsjewilt: "Wat heeft je lichaam nodig de komende tijd? Wat zou het een beetje zachter maken?",
  },

  {
    dag: 5,
    thema: "Wat je de laatste tijd vermijdt",
    subject: "Wat je liever niet ziet of voelt",
    mail: `Er zijn dingen die je vermijdt. Sociale situaties die te veel van je vragen. Vragen van anderen die je niet wilt beantwoorden. Momenten van stilte die te leeg voelen.

Dat is niet raar. Dat is zelfbescherming.

Maar soms helpt het om even te benoemen wat je vermijdt, in plaats van er stilletjes omheen te lopen.

Wat is het, voor jou? Wat ga je liever uit de weg?

{link}

Zie je morgen. Benji`,
    inHetAccount: "Wat vermijd je de laatste tijd? Plekken, mensen, situaties? Schrijf het op, zonder oordeel over jezelf.",
    doedingetje: "Kies één situatie die je vermijdt maar waarvan je weet dat je er eigenlijk wél naartoe wil. Schrijf op wat je tegenhoudt.",
  },

  {
    dag: 6,
    thema: "Wie er voor je probeert te zijn",
    subject: "Wie staat er naast je?",
    mail: `Niet iedereen begrijpt wat jij draagt. Dat kan eenzaam zijn, zelfs als je omringd bent door mensen.

Maar ergens is er misschien iemand die het probeert. Die je een berichtje stuurt. Die vraagt hoe het gaat, ook al weet jij niet hoe je het moet uitleggen. Die er gewoon is, ook als het onhandig voelt.

Vandaag de vraag: wie staat er naast jou, ook als het onvolledig of onhandig is?

En als je het gevoel hebt dat er niemand is: schrijf dat dan op. Dat is ook iets wat echt is, en dat verdient ook een plek.

{link}

Denk aan je. Benji`,
    inHetAccount: "Wie staat er naast jou? Iemand die het begrijpt, of in ieder geval probeert? Schrijf op wie er is, en wat je van hen nodig hebt.",
    alsjewilt: "Is er iemand van wie je wilt dat ze beter begreep wat je draagt? Wat zou je willen dat ze wist?",
  },

  {
    dag: 7,
    thema: "Hoe je deze week voor jezelf hebt gezorgd",
    subject: "Een kleine check-in",
    mail: `Je bent nu een week onderweg. Dat is niet niets.

Elke dag hier zijn, ook als je niets schreef, ook als je alleen maar opende en weer sloot — dat telt.

Vandaag de vraag: hoe heb je jezelf deze week verzorgd? Niet wat je had moeten doen. Maar wat je wel deed.

Misschien was het een wandeling. Een film. Iets lekkers eten. Eerder naar bed. Een dag gewoon niks.

Dat is genoeg. Meer hoeft niet.

{link}

Tot morgen. Benji`,
    inHetAccount: "Hoe heb je jezelf deze week verzorgd? Niet wat je had moeten doen, maar wat je wel deed. Schrijf het op, hoe klein ook.",
  },

  // ─────────────── WEEK 2 — ONDER DE OPPERVLAKTE ───────────────
  {
    dag: 8,
    thema: "Wat jij verlangt in verbinding",
    subject: "Wat je eigenlijk wil",
    mail: `Vandaag gaan we een stap dieper. Niet naar de eenzaamheid zelf, maar naar wat eronder zit: het verlangen.

Wat wil jij eigenlijk? Niet als abstract idee, maar concreet. Wil je iemand die je echt ziet? Die vraagt hoe het écht gaat? Die gewoon aanwezig is zonder dat je het hoeft te verdienen?

Dat verlangen is echt. En het mag er zijn.

Schrijf op wat jij verlangt. Zo eerlijk en zo concreet als je kunt.

{link}

Fijne dag. Groet Benji`,
    inHetAccount: "Niet de eenzaamheid zelf, maar wat eronder zit: het verlangen. Wat wil jij eigenlijk? Schrijf het op, zo concreet mogelijk.",
    alsjewilt: "Hoe zou jou leven eruitzien als je dat verlangen vervuld zou zijn? Beschrijf het.",
  },

  {
    dag: 9,
    thema: "Een moment van echte verbinding",
    subject: "Een moment dat je nooit wilt vergeten",
    mail: `Er zijn momenten geweest waarop je je echt verbonden voelde. Misschien lang geleden, misschien recent. Misschien kort, misschien onverwacht.

Een gesprek dat doorging na middernacht. Iemand die precies het juiste zei. Een moment waarop je je gezien voelde, zonder dat je het hoefde uit te leggen.

Dat moment is echt. Het was er. En het zegt iets over wat mogelijk is.

Vandaag de vraag: wanneer voelde jij je voor het laatst echt verbonden? Beschrijf het zo gedetailleerd als je kunt.

{link}

Morgen weer. Benji`,
    inHetAccount: "Wanneer voelde jij je voor het laatst echt verbonden? Een gesprek, een moment, een gevoel van gezien zijn. Schrijf het op.",
    doedingetje: "Stuur een bericht aan de persoon die je aan dat moment herinnert. Of schrijf op wat je zou willen zeggen als je dat kon.",
  },

  {
    dag: 10,
    thema: "Een moment van lucht",
    subject: "Even adem halen",
    mail: `Eenzaamheid duurt lang. En in die lange periode zijn er ook momenten geweest, hoe klein ook, waarop je even kon adem halen.

Een film die je meezoog. Een liedje dat precies klopte. Een wandeling waarop je je hoofd even leeg voelde. Een moment van onverwachte verbinding.

Dat is geen verraad aan je gevoel. Dat is overleven.

Vandaag de vraag: wat zorgde de laatste tijd voor een moment van lucht? Hoe klein ook.

{link}

Geniet van de dag. Groet Benji`,
    inHetAccount: "Wat gaf je de afgelopen tijd even lucht? Een lach, een film, een wandeling, een onverwacht gesprek? Schrijf het op, ook al voelt het onbelangrijk.",
  },

  {
    dag: 11,
    thema: "Waar je trots op bent",
    subject: "Kijk eens wat jij hebt gedragen",
    mail: `Je hebt veel gedragen.

Dagen waarop je je alleen voelde maar toch functioneerde. Momenten waarop je de moed vond om ergens naartoe te gaan, ook al was het zwaar. Periodes waarin je jezelf gezelschap hield, ook als dat niet vanzelfsprekend was.

Dat is geen vanzelfsprekendheid. Dat vraagt kracht.

Vandaag de vraag: waar ben je stiekem trots op jezelf om? Niet op grote prestaties. Maar op iets wat je hebt gedaan of volgehouden terwijl het zwaar was.

{link}

Spreek je morgen. Benji`,
    inHetAccount: "Waar ben je trots op jezelf om, in deze periode? Iets wat je hebt gedaan, gezegd of volgehouden terwijl het zwaar was. Schrijf het op.",
    alsjewilt: "Wat had je van jezelf nooit verwacht dat je dit zou aankunnen?",
  },

  {
    dag: 12,
    thema: "Wat onafgemaakt voelt",
    subject: "Iets wat onafgemaakt is gebleven",
    mail: `Er zijn verbindingen die onafgemaakt voelen. Vriendschappen die weggleden. Gesprekken die je had gewild maar nooit zijn gevoerd. Mensen van wie je je hebt teruggetrokken, of die zich van jou hebben teruggetrokken.

Onafgemaakt betekent niet mislukt. Maar het verdient wel een plek.

Vandaag de vraag: wat voelt voor jou nog onafgemaakt, in je relaties of in jezelf? Niet wat anderen vinden, maar wat jij voelt.

{link}

Zie je morgen. Benji`,
    inHetAccount: "Wat voelt nog onafgemaakt voor jou? Een vriendschap, een gesprek, een gevoel? Schrijf het op, zonder het te hoeven oplossen.",
  },

  {
    dag: 13,
    thema: "Wat eenzaamheid jou heeft geleerd",
    subject: "Wat heeft dit jou gebracht?",
    mail: `Dit is misschien een moeilijke vraag. Maar hij is eerlijk bedoeld.

Je hebt je alleen gevoeld. Maar in die periode heb je ook iets geleerd: over jezelf, over wat je nodig hebt, over wat echte verbinding voor jou betekent.

Misschien weet je nu beter wat je wilt van relaties. Misschien heb je ontdekt hoe goed je je eigen gezelschap kunt zijn. Misschien heb je een kracht in jezelf gevonden die je niet kende.

Vandaag de vraag: wat heeft deze periode jou gegeven? Hoe klein of onverwacht ook.

{link}

Rust goed. Benji`,
    inHetAccount: "Wat heeft deze periode jou gegeven? Over jezelf, over wat je nodig hebt, over verbinding. Schrijf het op, hoe onverwacht ook.",
    doedingetje: "Schrijf drie dingen op die je over jezelf hebt ontdekt in deze periode. Dingen die je niet zou hebben geweten zonder dit.",
  },

  {
    dag: 14,
    thema: "De hoop die je draagt",
    subject: "De hoop die er nog is",
    mail: `Er is iets wat je hoopt. Misschien stil, misschien beschaamd, misschien nauwelijks uitgesproken, ook niet voor jezelf.

Maar de hoop is er. Op verbinding. Op gezien worden. Op het gevoel dat je erbij hoort.

Vandaag vragen we je die hoop terug te halen — niet om er verdrietig van te worden, maar om hem te eren.

Hoe ziet die hoop eruit? Wat hoop jij, op je hoopvolste momenten?

{link}

Tot morgen. Benji`,
    inHetAccount: "Hoe ziet jouw hoop op verbinding eruit? Wat hoop jij, op de momenten dat je het het sterkst voelt? Schrijf het op.",
    alsjewilt: "Wat houdt je er soms van af om die hoop te voelen of toe te laten?",
  },

  // ─────────────── WEEK 3 — WAT JE DRAAGT ───────────────
  {
    dag: 15,
    thema: "Hoe dit jou heeft veranderd",
    subject: "Jij bent niet meer dezelfde",
    mail: `Dit heeft je veranderd. Dat is niet erg, het is onvermijdelijk.

Misschien ben je stiller geworden. Misschien selectiever in wie je in je nabijheid toelaat. Misschien kijk je anders aan tegen oppervlakkige vriendschappen. Misschien heb je meer oog gekregen voor anderen die alleen zijn.

Verandering door moeilijke periodes is niet altijd makkelijker, maar het is altijd dieper.

Vandaag de vraag: hoe ben jij veranderd? Wat zie je in jezelf wat er vroeger niet of anders was?

{link}

Denk aan je. Benji`,
    inHetAccount: "Hoe heeft deze periode jou veranderd? Wat zie je in jezelf nu wat er vroeger niet of anders was? Schrijf het op, ook wat pijnlijk is.",
    alsjewilt: "Is er iets in die verandering wat je eigenlijk wel waardeert, ook al had je het liever anders gehad?",
  },

  {
    dag: 16,
    thema: "Wat je van jezelf hebt geleerd",
    subject: "Wat je van jezelf weet nu",
    mail: `Je hebt iets geleerd. Over wie je bent als het moeilijk wordt. Over wat je nodig hebt om je goed te voelen. Over wat voor soort verbinding echt goed doet.

Misschien heb je geleerd dat je meer nodig hebt dan je dacht. Of juist dat je fijner alleen bent dan je ooit had verwacht. Dat je meer in jezelf kunt vinden dan je wist.

Vandaag de vraag: wat weet je nu van jezelf, wat je vroeger niet zo duidelijk wist?

{link}

Fijne dag. Groet Benji`,
    inHetAccount: "Wat weet je nu van jezelf dat je vroeger niet zo duidelijk wist? Over wat je nodig hebt, over verbinding, over jezelf? Schrijf het op.",
    doedingetje: "Doe vandaag iets dat je fijn vindt maar normaal alleen doet. Ga een beetje langzamer. Wees je bewust van het genot van je eigen gezelschap.",
  },

  {
    dag: 17,
    thema: "Een brief aan je jongere zelf",
    subject: "Een bericht aan jezelf van vroeger",
    mail: `Stel je voor dat je terug kon gaan naar de jij van een paar jaar geleden — voor dit gevoel zo zwaar werd, of midden erin.

Wat zou je tegen haar zeggen?

Niet wat je had moeten doen. Niet wat anders had gemoeten. Maar wat je nu weet, en wat diegene destijds had kunnen gebruiken.

Schrijf het op. Zo lang of zo kort als het wil komen.

{link}

Morgen weer. Benji`,
    inHetAccount: "Wat zou je tegen je jongere zelf zeggen, de jij van voor of tijdens dit gevoel? Schrijf het op als een brief.",
    alsjewilt: "Wat zou je willen dat iemand je destijds had gezegd, maar niemand zei?",
  },

  {
    dag: 18,
    thema: "Waar je boos op bent",
    subject: "Boosheid mag er zijn",
    mail: `Boosheid hoort bij eenzaamheid. Niet altijd, niet voor iedereen, maar vaak.

Misschien ben je boos op mensen die je hebben laten vallen. Op vriendschappen die verdwenen. Op de oneerlijkheid van hoe makkelijk verbinding voor anderen lijkt te gaan. Op een wereld die weinig ruimte maakt voor mensen die alleen zijn.

Boosheid betekent niet dat je slecht bent. Het betekent dat er iets is wat je mist en dat er echt toe doet.

Vandaag: waar ben je boos op? Schrijf het op zonder het te censureren.

{link}

Geniet van de dag. Groet Benji`,
    inHetAccount: "Waar ben je boos op? Op mensen, op situaties, op hoe het gegaan is? Schrijf het op, boosheid mag er zijn.",
  },

  {
    dag: 19,
    thema: "Wat je bang maakt over de toekomst",
    subject: "Wat er in je hoofd rondspookt",
    mail: `Er zijn dingen die je bang maken als je naar de toekomst kijkt.

Misschien is het de vraag of het ooit anders wordt. Of je ooit echt verbinding zult voelen. Of je niet te lang hebt gewacht, te veel bent weggeweest, te moeilijk bent voor anderen.

Die angst is geen bewijs dat het niet goed zal komen. Het is een teken dat er iets is wat er voor jou echt toe doet.

Vandaag de vraag: wat maakt je bang als je aan de toekomst denkt?

{link}

Spreek je morgen. Benji`,
    inHetAccount: "Wat maakt je bang als je aan de toekomst denkt? Benoem het zo eerlijk als je kunt, angst verdient een plek, geen oordeel.",
    alsjewilt: "Wat zou er moeten veranderen om die angst een beetje minder te maken? Wat ligt daar in jouw macht?",
  },

  {
    dag: 20,
    thema: "Een moment waarop je even jezelf was",
    subject: "Even gewoon jijzelf",
    mail: `In al het zware zijn er ook momenten geweest waarop je even gewoon jezelf was. Niet de persoon die zich alleen voelt, niet de persoon die het probeert te verbergen.

Gewoon jij. Lachend, aanwezig, met jezelf.

Vandaag de vraag: wanneer was zo'n moment de laatste tijd? Wat deed je, wie was erbij of juist niet, hoe voelde het?

{link}

Zie je morgen. Benji`,
    inHetAccount: "Wanneer was je de laatste tijd gewoon jezelf, niet de persoon die zich alleen voelt? Schrijf dat moment op.",
    doedingetje: "Plan vandaag iets voor jezelf: iets wat jou goed doet, zonder dat het iets hoeft op te lossen. Gewoon voor jou.",
  },

  {
    dag: 21,
    thema: "Wat je bij je draagt dat je niet wil loslaten",
    subject: "Wat mag blijven",
    mail: `Er zijn dingen die je bij je draagt die je niet wil loslaten. Het verlangen zelf, misschien. De overtuiging dat echte verbinding bestaat. Het gevoel dat jij de moeite waard bent om gekend te worden.

Loslaten betekent niet vergeten. Het betekent niet dat het niet meer telt.

Maar soms helpt het om te benoemen wat je bij je houdt, en wat je daarin koestert.

Vandaag de vraag: wat draag je bij je wat je niet wil missen, ook al is het soms pijnlijk?

{link}

Rust goed. Benji`,
    inHetAccount: "Wat draag je bij je uit deze periode wat je niet wilt loslaten? Het verlangen, een overtuiging, iets over jezelf? Schrijf het op.",
  },

  // ─────────────── WEEK 4 — VERDER LEVEN ───────────────
  {
    dag: 22,
    thema: "Wat draaglijker is geworden",
    subject: "Wat iets lichter aanvoelt",
    mail: `Niet alles is even zwaar meer als in het begin. Sommige dingen zijn draaglijker geworden, misschien maar een klein beetje, maar toch.

Dat is geen verraad aan je gevoel. Dat is hoe mensen groeien.

Vandaag de vraag: wat is er de laatste tijd iets draaglijker geworden? Wat doe je nu wat je eerder niet kon? Wat voelt minder scherp?

{link}

Tot morgen. Benji`,
    inHetAccount: "Wat is er draaglijker geworden? Wat doe je nu wat je eerder niet kon, of wat voelt minder scherp dan vroeger?",
    alsjewilt: "Hoe verklaar je dat? Wat heeft daartoe bijgedragen?",
  },

  {
    dag: 23,
    thema: "Iemand die je heeft verrast",
    subject: "Iemand die er was toen je het niet verwachtte",
    mail: `In moeilijke tijden leer je mensen kennen. Soms vallen ze tegen. Maar soms verrassen ze je.

Iemand die iets zei wat raak was. Die er gewoon was zonder grote woorden. Die contact bleef houden ook als het ongemakkelijk was. Die niet probeerde het op te lossen maar het wel erkende.

Vandaag de vraag: wie heeft jou verrast in deze periode? En wat deed of zei die persoon?

{link}

Denk aan je. Benji`,
    inHetAccount: "Wie heeft jou verrast in deze periode, op een goede manier? Wat deed of zei die persoon? Schrijf het op.",
    doedingetje: "Laat die persoon weten dat je aan hem of haar denkt. Een kort berichtje is genoeg.",
  },

  {
    dag: 24,
    thema: "Wat jij nodig hebt de komende tijd",
    subject: "Wat heb jij nodig?",
    mail: `Niet wat je denkt te moeten willen. Niet wat anderen zeggen dat goed voor je is.

Maar wat jij, eerlijk gezegd, nodig hebt de komende tijd.

Rust? Structuur? Meer contact? Meer tijd alleen? Toestemming om te zijn wie je bent? Iemand die vraagt hoe het echt gaat?

Vandaag de vraag: wat heb jij nodig?

{link}

Fijne dag. Groet Benji`,
    inHetAccount: "Wat heb jij nodig de komende tijd? Niet wat zou moeten, maar wat voelt als iets wat jou echt zou helpen? Schrijf het op.",
  },

  {
    dag: 25,
    thema: "Wat je houvast geeft",
    subject: "Wat je houvast geeft",
    mail: `Wat geeft jou houvast? Niet per se iets groots of betekenisvols, maar gewoon iets wat werkt.

Een kopje thee op een vaste tijd. Een wandeling. Een liedje. Een boek voor het slapen. Een ritueel dat van jou is en van niemand anders.

Die kleine ritmes zijn meer waard dan je denkt. Ze geven het leven structuur als alles los aanvoelt.

Vandaag de vraag: welk ritueel of welke gewoonte geeft jou houvast?

{link}

Morgen weer. Benji`,
    inHetAccount: "Welk ritueel of welke gewoonte geeft jou houvast? Hoe klein ook, schrijf het op en erken dat het ertoe doet.",
    alsjewilt: "Is er een ritueel dat je zou willen beginnen, iets wat je tot nu toe niet hebt gedaan maar wat je aantrekt?",
    doedingetje: "Bescherm één moment deze week bewust voor jezelf. Zet het in je agenda als afspraak. Jij bent de moeite waard.",
  },

  {
    dag: 26,
    thema: "Wat je wil meenemen",
    subject: "Wat mag er blijven",
    mail: `Je bent bijna aan het einde van deze 30 dagen.

Voordat je afsluit, een vraag over wat je meeneemt. Niet het zware gevoel — dat draag je al. Maar wat wil je bewust onthouden van deze periode?

Een inzicht. Een gevoel. Een beslissing die je hebt genomen. Een les over jezelf. Iets wat je over verbinding hebt geleerd.

Wat wil jij meenemen?

{link}

Geniet van de dag. Groet Benji`,
    inHetAccount: "Wat wil je meenemen uit deze 30 dagen? Een inzicht, een gevoel, een beslissing? Schrijf op wat je bewust wilt onthouden.",
  },

  {
    dag: 27,
    thema: "Een brief aan de toekomst",
    subject: "Een brief aan jezelf",
    mail: `Vandaag schrijf je een brief: aan jezelf in de toekomst.

Niet een lijst van wat je wil bereiken. Maar een bericht van wie je nu bent, aan wie je dan zult zijn.

Schrijf over wat je draagt. Over wat je hoopt. Over wat je wil dat die toekomstige jij weet. Over wat je wil dat ze niet vergeet.

Er is geen goede manier om dit te doen. Schrijf gewoon.

{link}

Spreek je morgen. Benji`,
    inHetAccount: "Schrijf een brief aan jezelf in de toekomst. Wat wil jij dat die toekomstige jij weet, onthoudt, of niet vergeet?",
  },

  {
    dag: 28,
    thema: "Wat je kunt loslaten",
    subject: "Wat je kunt loslaten",
    mail: `Loslaten is niet hetzelfde als vergeten. Het is niet hetzelfde als accepteren dat het oké was. Het is niet hetzelfde als stoppen met verlangen.

Loslaten betekent: dit hoeft niet langer zoveel energie van me te nemen.

Is er iets wat je kunt loslaten? Een schuldgevoel. Een verwijt aan jezelf. Een scenario van hoe het anders had kunnen lopen. Een overtuiging over jezelf die niet meer klopt.

Vandaag de vraag: wat kun jij loslaten?

{link}

Rust goed. Benji`,
    inHetAccount: "Wat kun jij loslaten? Een schuldgevoel, een verwachting, een overtuiging over jezelf? Schrijf het op: loslaten begint met benoemen.",
    alsjewilt: "Wat houdt je ervan te loslaten? Wat maakt het moeilijk?",
  },

  {
    dag: 29,
    thema: "Dit gevoel gaat mee, maar verandert",
    subject: "Dit gevoel gaat mee",
    mail: `Morgen is de laatste dag. En het leven gaat door.

Eenzaamheid verdwijnt niet na 30 dagen. Maar iets heeft dit de afgelopen maand wel veranderd: jij hebt er meer woorden voor. Jij kent jezelf een beetje beter. En dat is niet niks.

Het gevoel kan meegaan — maar het hoeft je niet te leiden.

Vandaag de vraag: hoe ga jij verder, met alles wat je de afgelopen 30 dagen hebt ontdekt? Wat neem je mee?

{link}

Zie je morgen. Benji`,
    inHetAccount: "Hoe ga jij verder, met alles wat je de afgelopen 30 dagen hebt ontdekt? Wat neem je mee, wat laat je achter?",
  },

  {
    dag: 30,
    thema: "Een brief aan jezelf",
    subject: "Je laatste dag, en een brief",
    mail: `Dit is dag 30.

Je hebt 30 dagen lang geschreven: over wat je voelt, over wat je verlangen is, over wie je bent als je eerlijk kijkt. Dat is niet niks. Dat vraagt moed.

Vandaag schrijf je een brief aan jezelf. Niet aan wie je had willen zijn. Maar aan wie je bent, nu, na deze 30 dagen.

Schrijf over wat je hebt ontdekt. Over wat je wil zeggen aan de jij die hier begon. Over wat je meeneemt.

Er is geen goede manier. Schrijf gewoon.

{link}

Ik ben trots op je.
Benji`,
    inHetAccount: "Schrijf een brief aan jezelf, aan wie je nu bent, na deze 30 dagen. Over wat je hebt ontdekt, wat je meeneemt, wat je wil zeggen.",
    alsjewilt: "Wat wil je dat de mensen om je heen weten, nu je deze 30 dagen achter de rug hebt?",
  },
];
