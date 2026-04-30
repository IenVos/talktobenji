/**
 * Niet Alleen — 30-dagen content voor ongewenst kinderlozen
 *
 * Elk item bevat:
 * - subject: onderwerpregel van de mail
 * - mail: de mailtekst (bevat {link} als placeholder)
 * - inHetAccount: korte tekst op de dagpagina in de app
 * - alsjewilt: optionele verdiepingsvraag
 * - doedingetje: optionele kleine actie (~elke 3 dagen)
 */

export type KinderloosDAg = {
  dag: number;
  thema: string;
  subject: string;
  mail: string;
  inHetAccount: string;
  alsjewilt?: string;
  doedingetje?: string;
};

export const KINDERLOOS_CONTENT: KinderloosDAg[] = [
  // ─────────────── WEEK 1 — AANWEZIG ZIJN ───────────────
  {
    dag: 1,
    thema: "Hoe het voelt om hier te zijn",
    subject: "Je hoeft vandaag maar één ding te doen",
    mail: `Jij bent er. Op dag één. Dat vraagt moed, ook al voelt het misschien niet zo.

Er is een verlangen dat jij draagt — naar een kind dat er niet is gekomen. Dat verlangen is echt. Het verdriet daarover ook. En het feit dat de wereld dat niet altijd ziet of begrijpt, maakt het zwaarder, niet makkelijker.

Je hoeft het vandaag niet op te lossen. Je hoeft het niet eens te begrijpen.

De vraag voor vandaag is simpel: hoe voel je je nu, op dit moment? Niet zoals je denkt te moeten voelen. Maar wat er echt is.

Schrijf het op. Een zin, een woord, een paar regels. Meer hoeft niet.

{link}

Benji is er.`,
    inHetAccount: "Hoe voel je je nu, op dit moment? Niet zoals je denkt te moeten voelen. Schrijf op wat er echt is. Een zin is genoeg.",
  },

  {
    dag: 2,
    thema: "Wanneer je voor het eerst wist dat het anders zou lopen",
    subject: "Het moment waarop alles veranderde",
    mail: `Er is een moment waarop je wist — of begon te begrijpen — dat het anders zou lopen dan je had gehoopt.

Voor sommigen was dat een uitslag. Een gesprek met een arts. Een zoveelste teleurstelling na een behandeling. Voor anderen was het een langzaam besef, zonder één duidelijk moment.

Maar ergens was er een kantelpunt.

Vandaag vragen we je niet om er vrede mee te hebben. Alleen om het even aan te raken.

Beschrijf dat moment. Waar was je, wat hoorde je, hoe voelde dat in je lichaam?

Je hoeft het niet volledig te maken. Een paar zinnen is genoeg.

{link}

Tot morgen. Benji`,
    inHetAccount: "Er was een moment waarop je wist dat het anders zou lopen. Beschrijf het zo kort of uitgebreid als je wilt. Waar was je, wat hoorde je, hoe voelde dat?",
    alsjewilt: "Wat deed je vlak daarna? Hoe zorgde je voor jezelf op dat moment, of lukte dat niet?",
  },

  {
    dag: 3,
    thema: "De leegte die je elke dag tegenkomt",
    subject: "De kleine leegte",
    mail: `Dit verlies zit niet alleen in de grote momenten. Het zit in de kleine dingen die je elke dag tegenkomt.

Een zwangerschapsaankondiging op je telefoon. Een kinderstoel in een restaurant. Moederdag. Een vraag op een verjaardag die goed bedoeld is maar snijdt. De lege kamer die anders had kunnen zijn.

Die kleine leegte is soms zwaarder dan alles.

Vandaag de vraag: wat is het kleine, alledaagse ding dat jou steeds herinnert aan wat je mist? Niet het grootste verdriet, maar het meest gewone.

{link}

Je bent niet alleen. Benji`,
    inHetAccount: "Verlies leeft in kleine dingen. Wat is het alledaagse moment of ding dat jou steeds herinnert aan het gemis? Schrijf het op, hoe klein het ook lijkt.",
    doedingetje: "Kies één plek of situatie die je de laatste tijd uit de weg gaat. Je hoeft er niet naartoe — maar schrijf op wat je eigenlijk zou willen dat anders was.",
  },

  {
    dag: 4,
    thema: "Hoe je lichaam het verdriet draagt",
    subject: "Verdriet zit niet alleen in je hoofd",
    mail: `Verdriet is niet alleen iets wat je denkt of voelt. Het zit ook in je lichaam.

Een zwaar gevoel in je borst. Moe zijn zonder reden. Gespannen zijn bij bepaalde situaties. Je lichaam dat maanden of jaren onder druk heeft gestaan — van behandelingen, van hopen, van teleurstellingen.

Je lichaam heeft veel gedragen. Dat is niet zwak, dat is menselijk.

Vandaag de vraag: waar draag jij het verdriet in je lichaam? Welke plek of welk gevoel ken je het best?

{link}

Je bent niet alleen. Benji`,
    inHetAccount: "Verdriet zit ook in je lichaam. Waar voel jij het? Een spanning, een zwaarte, een vermoeidheid? Schrijf op wat je herkent.",
    alsjewilt: "Wat heeft je lichaam doorgemaakt in deze periode? Schrijf het op — niet als klacht, maar als erkenning.",
  },

  {
    dag: 5,
    thema: "Wat je de laatste tijd vermijdt",
    subject: "Wat je liever niet ziet of voelt",
    mail: `Er zijn dingen die je vermijdt. Plekken, mensen, gesprekken, sociale media. Niet uit zwakte — maar omdat het gewoon te veel is.

Een kraamvisitatie. De speelgoedafdeling. Een WhatsApp-groep vol kinderfoto's. Het gesprek met die ene vriendin die het niet begrijpt. Dat is niet raar. Dat is zelfbescherming.

Maar soms helpt het om even te benoemen wat je vermijdt, in plaats van er stilletjes omheen te lopen.

Wat is het, voor jou? Wat ga je liever uit de weg?

{link}

Tot morgen. Benji`,
    inHetAccount: "Wat vermijd je de laatste tijd? Plekken, mensen, situaties? Schrijf het op — zonder oordeel over jezelf.",
  },

  {
    dag: 6,
    thema: "Wie er voor jou is",
    subject: "Wie staat er naast je?",
    mail: `Niet iedereen begrijpt wat jij draagt. Dat kan eenzaam zijn.

Maar ergens is er iemand — of misschien meer dan één — die er voor je probeert te zijn. Misschien zegt die persoon niet altijd de goede dingen. Misschien is het meer een gevoel dan een gesprek. Maar hij of zij is er.

Vandaag de vraag: wie staat er naast jou in dit verdriet, ook als het onhandig of onvolledig is?

En als je het gevoel hebt dat er niemand is: schrijf dat dan op. Dat is ook iets wat echt is, en dat verdient ook een plek.

{link}

Benji is er. Elke dag.`,
    inHetAccount: "Wie staat er naast jou? Iemand die het begrijpt, of in ieder geval probeert? Schrijf op wie er is — en wat je van hen nodig hebt.",
    alsjewilt: "Is er iemand van wie je wilt dat ze het beter begreep, maar het niet doet? Wat zou je willen dat ze wist?",
  },

  {
    dag: 7,
    thema: "Hoe je deze week voor jezelf hebt gezorgd",
    subject: "Een kleine check-in",
    mail: `Je bent nu een week onderweg. Dat is niet niets.

Elke dag hier zijn — ook als je niets schreef, ook als je alleen maar opende en weer sloot — dat telt.

Vandaag de vraag: hoe heb je jezelf deze week verzorgd? Niet wat je had moeten doen. Maar wat je wel deed.

Misschien was het een wandeling. Een gesprek. Iets lekkers eten. Eerder naar bed. Een dag gewoon niks.

Dat is genoeg. Meer hoeft niet.

{link}

Tot morgen. Benji`,
    inHetAccount: "Hoe heb je jezelf deze week verzorgd? Niet wat je had moeten doen — maar wat je wel deed. Schrijf het op, hoe klein ook.",
    doedingetje: "Doe vandaag iets alleen voor jezelf. Niet om productief te zijn of iemand tevreden te stellen. Gewoon voor jou.",
  },

  // ─────────────── WEEK 2 — ONDER DE OPPERVLAKTE ───────────────
  {
    dag: 8,
    thema: "Het verlangen zelf",
    subject: "Wat je eigenlijk wilde",
    mail: `Vandaag gaan we een stap dieper. Niet naar het verdriet over wat er niet is gekomen — maar naar het verlangen zelf.

Wat wilde je eigenlijk? Niet als abstract idee, maar concreet. Hoe zag dat kind eruit in je hoofd? Wat voor moeder of vader wilde jij zijn? Welk moment had je het liefst gehad?

Het verlangen is echt. En het mag er zijn, ook als het nu pijn doet om het aan te raken.

Schrijf op wat jij verlangde. In zoveel detail als je kunt.

{link}

Tot morgen. Benji`,
    inHetAccount: "Niet het verdriet over wat er niet is — maar het verlangen zelf. Wat wilde jij? Hoe zag dat eruit in je hoofd? Schrijf het op.",
    alsjewilt: "Welk moment had je het liefst gehad? Beschrijf het zo concreet mogelijk.",
  },

  {
    dag: 9,
    thema: "Iets wat je nooit wilt vergeten",
    subject: "Iets wat bewaard mag blijven",
    mail: `Er zijn dingen die je niet wilt vergeten. Misschien een moment van hoop. Een gesprek dat je heeft geraakt. Een behandeling die even goed leek te gaan. De manier waarop je partner naar je keek.

Of misschien iets meer tastbaars — een foto, een datum, een gedachte die je had op een heel gewone dag.

Niet alles van deze periode is alleen pijn. Sommige dingen zijn het waard om te bewaren.

Vandaag de vraag: wat wil jij onthouden? Wat mag er blijven?

{link}

Tot morgen. Benji`,
    inHetAccount: "Wat wil je nooit vergeten uit deze periode? Een moment, een gevoel, een gesprek? Schrijf het op zodat het bewaard blijft.",
  },

  {
    dag: 10,
    thema: "Iets wat je even deed lachen of opluchten",
    subject: "Even adem halen",
    mail: `Verdriet duurt lang. En in die lange periode zijn er ook momenten geweest — hoe klein ook — waarop je even kon lachen, ontspannen, of gewoon adem halen.

Dat is geen verraad aan je verdriet. Dat is overleven.

Vandaag de vraag: wat zorgde de laatste tijd voor een moment van lucht? Een film, een gesprek, iets doms op internet, een dier, een wandeling?

Schrijf het op. Het mag klein zijn.

{link}

Tot morgen. Benji`,
    inHetAccount: "Wat gaf je de afgelopen tijd even lucht? Een lach, een opluchting, een moment van rust? Schrijf het op — ook al voelt het onbelangrijk.",
    doedingetje: "Doe vandaag iets wat je de laatste tijd niet hebt gedaan omdat het 'niet passend' leek bij hoe je je voelt. Gewoon proberen.",
  },

  {
    dag: 11,
    thema: "Een moment van trots op jezelf",
    subject: "Kijk eens wat jij hebt doorstaan",
    mail: `Je hebt veel doorstaan.

Behandelingen. Hoop. Teleurstelling. Gesprekken die je liever niet had gehad. Momenten waarop je niet wist hoe je door de dag moest komen. En toch deed je het.

Dat is geen vanzelfsprekendheid. Dat vraagt kracht, ook als het niet zo voelde.

Vandaag de vraag: waar ben je stiekem trots op jezelf om? Niet op grote prestaties. Maar op iets wat je hebt gedaan, gezegd of volgehouden terwijl het zwaar was.

{link}

Tot morgen. Benji`,
    inHetAccount: "Waar ben je trots op jezelf om, uit deze periode? Iets wat je hebt gedaan, gezegd of volgehouden terwijl het zwaar was. Schrijf het op.",
    alsjewilt: "Wat had je van jezelf nooit verwacht dat je dit aankon? Klopt dat beeld nog?",
  },

  {
    dag: 12,
    thema: "Wat er onafgemaakt voelt",
    subject: "Iets wat onafgemaakt is gebleven",
    mail: `Er zijn dingen die onafgemaakt voelen. Een traject dat je had gewild dat anders was gelopen. Een gesprek dat je nog wilt voeren. Een beslissing die je misschien nog moet nemen, of juist al hebt genomen maar die nog niet voelt als klaar.

Onafgemaakt betekent niet mislukt. Maar het verdient wel een plek.

Vandaag de vraag: wat voelt voor jou nog onafgemaakt? Niet wat anderen vinden — maar wat jij voelt.

{link}

Tot morgen. Benji`,
    inHetAccount: "Wat voelt nog onafgemaakt voor jou? Een beslissing, een gesprek, een gevoel? Schrijf het op — zonder het te hoeven oplossen.",
  },

  {
    dag: 13,
    thema: "Wat dit jou heeft gegeven",
    subject: "Wat heeft dit jou gebracht?",
    mail: `Dit is misschien een moeilijke vraag. Maar hij is eerlijk bedoeld.

Je hebt iets verloren. Maar in die periode heb je ook iets geleerd — over jezelf, over anderen, over wat er echt toe doet.

Misschien is er duidelijker geworden wat je wilt. Misschien heeft het je dichter bij iemand gebracht, of juist laten zien wie er echt voor je staat. Misschien heb je een kracht ontdekt die je niet wist dat je had.

Vandaag de vraag: wat heeft dit jou gegeven? Hoe klein of onverwacht ook.

{link}

Tot morgen. Benji`,
    inHetAccount: "Wat heeft deze periode jou gegeven? Over jezelf, over anderen, over wat er echt toe doet. Schrijf het op, hoe onverwacht ook.",
    alsjewilt: "Is er iets in je leven veranderd door dit verlies wat je eigenlijk niet had willen missen?",
  },

  {
    dag: 14,
    thema: "De hoop die er was",
    subject: "De hoop die je hebt gedragen",
    mail: `Je hebt gehoopt. Misschien lang. Misschien door dingen heen die anderen al hadden opgegeven.

Die hoop was echt. En hoewel het pijn doet dat ze niet is uitgekomen zoals je wilde, zegt die hoop ook iets over jou. Over hoe graag je het wilde. Over hoe lief je al had.

Vandaag vragen we je die hoop terug te halen — niet om er verdrietig van te worden, maar om hem te eren.

Hoe zag die hoop eruit? Wat geloofde je, op je hoopvolste momenten?

{link}

Tot morgen. Benji`,
    inHetAccount: "Hoe zag jouw hoop eruit? Op de momenten dat je geloofde dat het zou lukken — wat dacht je, wat voelde je? Schrijf het op om het te eren.",
    doedingetje: "Schrijf een zin op over iets wat je hoopte. Niet om er verdrietig van te worden — maar om het een plek te geven.",
  },

  // ─────────────── WEEK 3 — WAT JE DRAAGT ───────────────
  {
    dag: 15,
    thema: "Hoe dit jou heeft veranderd",
    subject: "Jij bent niet meer dezelfde",
    mail: `Dit heeft je veranderd. Dat is niet erg — het is onvermijdelijk.

Misschien ben je stiller geworden op feestjes. Misschien kijk je anders aan tegen vriendschappen. Misschien heb je grenzen getrokken die je vroeger nooit had durven trekken. Misschien ben je zachter geworden voor anderen die pijn dragen.

Verandering door verlies is niet altijd mooier — maar het is altijd dieper.

Vandaag de vraag: hoe ben jij veranderd? Wat zie je in jezelf wat er vroeger niet of anders was?

{link}

Tot morgen. Benji`,
    inHetAccount: "Hoe heeft dit jou veranderd? Wat zie je in jezelf nu wat er vroeger niet of anders was? Schrijf het op — ook wat pijnlijk is.",
    alsjewilt: "Is er iets in die verandering wat je eigenlijk wel waardeert, ook al had je het liever anders gehad?",
  },

  {
    dag: 16,
    thema: "Wat je van jezelf hebt geleerd",
    subject: "Wat je van jezelf weet nu",
    mail: `Je hebt iets geleerd. Over wie je bent als het moeilijk wordt. Over wat je aankan. Over wat je nodig hebt.

Misschien heb je geleerd dat je sterker bent dan je dacht. Of juist dat je eerder hulp had moeten vragen. Dat je beter weet wat je wilt. Of juist hoe moeilijk het is om te accepteren wat buiten je macht ligt.

Vandaag de vraag: wat weet je nu van jezelf, wat je vroeger niet zo duidelijk wist?

{link}

Tot morgen. Benji`,
    inHetAccount: "Wat weet je nu van jezelf dat je vroeger niet zo duidelijk wist? Over je kracht, je grenzen, je behoeften? Schrijf het op.",
  },

  {
    dag: 17,
    thema: "Wat je tegen je jongere zelf zou zeggen",
    subject: "Een bericht aan jezelf van vroeger",
    mail: `Stel je voor dat je terug kon gaan naar de jij van een paar jaar geleden — voor dit allemaal begon, of midden in de moeilijkste periode.

Wat zou je tegen haar of hem zeggen?

Niet wat je had moeten doen. Niet wat anders had gemoeten. Maar wat je nu weet, en wat diegene destijds had kunnen gebruiken.

Schrijf het op. Zo lang of zo kort als het wil komen.

{link}

Tot morgen. Benji`,
    inHetAccount: "Wat zou je tegen je jongere zelf zeggen — de jij van voor dit allemaal, of midden erin? Schrijf het op als een brief.",
    alsjewilt: "Wat zou je willen dat iemand je destijds had gezegd, maar niemand zei?",
  },

  {
    dag: 18,
    thema: "Waar je boos op bent",
    subject: "Boosheid mag er zijn",
    mail: `Boosheid hoort bij rouw. Niet altijd, niet voor iedereen — maar vaak.

Misschien ben je boos op je lichaam. Op de oneerlijkheid van het leven. Op mensen die het zomaar lijkt te lukken. Op artsen, op behandelingen, op omstandigheden buiten je macht. Op jezelf, soms. Op hoe anderen reageren.

Boosheid betekent niet dat je slecht bent. Het betekent dat je iets verloren hebt wat belangrijk voor je was.

Vandaag: waar ben je boos op? Schrijf het op zonder het te censureren.

{link}

Tot morgen. Benji`,
    inHetAccount: "Waar ben je boos op? Op je lichaam, op het leven, op de oneerlijkheid ervan? Schrijf het op — boosheid mag er zijn.",
    doedingetje: "Schrijf alles op waar je boos over bent, zonder filter. Daarna mag je het bewaren of weggooien — jouw keuze.",
  },

  {
    dag: 19,
    thema: "Wat je bang maakt over de toekomst",
    subject: "Wat er in je hoofd rondspookt",
    mail: `Er zijn dingen die je bang maken als je naar de toekomst kijkt.

Misschien is het de vraag wie je bent als je geen ouder wordt. Hoe je naar jezelf kijkt over tien jaar. Hoe de lege jaren eruit zien. Of je ooit echt vrede kunt hebben.

Die angst is geen teken dat het niet goed zal komen. Het is een teken dat er iets is wat er echt toe doet.

Vandaag de vraag: wat maakt je bang als je aan de toekomst denkt? Benoem het zo eerlijk als je kunt.

{link}

Tot morgen. Benji`,
    inHetAccount: "Wat maakt je bang als je aan de toekomst denkt? Benoem het zo eerlijk als je kunt — angst verdient een plek, geen oordeel.",
    alsjewilt: "Wat zou er moeten veranderen — aan jezelf, aan je leven, aan de wereld — om die angst een beetje minder te maken?",
  },

  {
    dag: 20,
    thema: "Een moment waarop je even jezelf was",
    subject: "Even gewoon jijzelf",
    mail: `In al het verdriet zijn er ook momenten geweest waarop je even gewoon jezelf was. Niet de persoon die rouwt, niet de persoon die uitleg geeft, niet de persoon die sterk probeert te zijn.

Gewoon jij. Lachend, genietend, aanwezig.

Vandaag de vraag: wanneer was zo'n moment de laatste tijd? Wat deed je, met wie was je, hoe voelde het?

{link}

Tot morgen. Benji`,
    inHetAccount: "Wanneer was je de laatste tijd gewoon jezelf — niet de persoon die rouwt of uitlegt? Schrijf dat moment op.",
  },

  {
    dag: 21,
    thema: "Wat je bij je draagt dat je niet wil loslaten",
    subject: "Wat mag blijven",
    mail: `Er zijn dingen die je bij je draagt die je niet wilt loslaten. De droom zelf, misschien. De herinneringen aan de hoop. Het gevoel van wie je had willen zijn.

Loslaten betekent niet vergeten. Het betekent niet dat het niet mocht zijn of niet echt was.

Maar soms helpt het om te benoemen wat je bij je houdt — en wat je daarin koestert.

Vandaag de vraag: wat draag je bij je wat je niet wilt missen, ook al is het pijnlijk?

{link}

Tot morgen. Benji`,
    inHetAccount: "Wat draag je bij je uit deze periode wat je niet wilt loslaten? De hoop, een gevoel, een deel van je? Schrijf het op.",
    doedingetje: "Zoek een voorwerp, een foto of een woord dat staat voor iets wat je wil bewaren. Leg het ergens neer waar je het kunt zien.",
  },

  // ─────────────── WEEK 4 — VERDER LEVEN ───────────────
  {
    dag: 22,
    thema: "Wat draaglijker is geworden",
    subject: "Wat iets lichter aanvoelt",
    mail: `Niet alles is even zwaar meer als in het begin. Sommige dingen zijn draaglijker geworden — misschien maar een klein beetje, maar toch.

Dat is geen verraad. Dat is hoe mensen overleven.

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
    mail: `In moeilijke tijden leer je mensen kennen. Soms vallen ze tegen — dat is ook een les. Maar soms verrassen ze je positief.

Iemand die iets zei wat raak was. Die er gewoon was, zonder grote woorden. Die niet probeerde het op te lossen maar het wel erkende. Die contact bleef houden ook als het ongemakkelijk was.

Vandaag de vraag: wie heeft jou verrast in deze periode? En wat deed of zei die persoon?

{link}

Tot morgen. Benji`,
    inHetAccount: "Wie heeft jou verrast in deze periode — op een goede manier? Wat deed of zei die persoon? Schrijf het op.",
  },

  {
    dag: 24,
    thema: "Wat jij nodig hebt de komende tijd",
    subject: "Wat heb jij nodig?",
    mail: `Niet wat je denkt te moeten willen. Niet wat anderen zeggen dat goed voor je is.

Maar wat jij, eerlijk gezegd, nodig hebt de komende tijd.

Rust? Structuur? Afleiding? Verbinding? Ruimte om te rouwen? Toestemming om vooruit te gaan? Antwoorden op vragen die je misschien nog niet wil stellen?

Vandaag de vraag: wat heb jij nodig?

{link}

Tot morgen. Benji`,
    inHetAccount: "Wat heb jij nodig de komende tijd? Niet wat zou moeten — maar wat voelt als iets wat jou echt zou helpen? Schrijf het op.",
    doedingetje: "Vraag één ding wat je nodig hebt vandaag aan iemand. Of geef het jezelf, als je dat kunt.",
  },

  {
    dag: 25,
    thema: "Een gewoonte of ritueel dat je troost",
    subject: "Wat je houvast geeft",
    mail: `Wat geeft jou houvast? Niet per se iets groots of betekenisvols — maar gewoon iets wat werkt.

Een kopje thee op een vaste tijd. Een wandeling. Een liedje. Een boek voor het slapen. Contact met een bepaalde persoon. Een plek waar je naartoe gaat.

Die kleine ritmes zijn meer waard dan je denkt. Ze geven het leven structuur als alles los aanvoelt.

Vandaag de vraag: welk ritueel of welke gewoonte geeft jou houvast?

{link}

Tot morgen. Benji`,
    inHetAccount: "Welk ritueel of welke gewoonte geeft jou houvast? Hoe klein ook — schrijf het op en erken dat het ertoe doet.",
    alsjewilt: "Is er een ritueel dat je zou willen beginnen — iets wat je tot nu toe niet hebt gedaan maar wat je aantrekt?",
  },

  {
    dag: 26,
    thema: "Wat je wilt onthouden van deze periode",
    subject: "Wat mag er blijven",
    mail: `Je bent bijna aan het einde van deze 30 dagen.

Voordat je afsluit, een vraag over wat je meeneemt. Niet het verdriet — dat draag je al. Maar wat wil je bewust onthouden van deze periode?

Een inzicht. Een gevoel. Een beslissing die je hebt genomen. Een les over jezelf. Iemand die er was.

Wat wil jij meenemen?

{link}

Tot morgen. Benji`,
    inHetAccount: "Wat wil je meenemen uit deze 30 dagen? Een inzicht, een gevoel, een beslissing? Schrijf op wat je bewust wilt onthouden.",
  },

  {
    dag: 27,
    thema: "Een brief aan de toekomst",
    subject: "Een brief aan jezelf",
    mail: `Vandaag schrijf je een brief — aan jezelf in de toekomst.

Niet een list van wat je wil bereiken. Maar een bericht van wie je nu bent, aan wie je dan zult zijn.

Schrijf over wat je draagt. Over wat je hoopt. Over wat je wil dat die toekomstige jij weet. Over wat je wil dat die jij niet vergeet.

Er is geen goede manier om dit te doen. Schrijf gewoon.

{link}

Tot morgen. Benji`,
    inHetAccount: "Schrijf een brief aan jezelf in de toekomst. Wat wil jij dat die toekomstige jij weet, onthoudt, of niet vergeet?",
    doedingetje: "Bewaar deze brief ergens waar je hem over een jaar terug kunt vinden.",
  },

  {
    dag: 28,
    thema: "Wat je loslaat",
    subject: "Wat je kunt loslaten",
    mail: `Loslaten is niet hetzelfde als vergeten. Het is niet hetzelfde als accepteren dat het oké was. Het is niet hetzelfde als stoppen met rouwen.

Loslaten betekent: dit hoeft niet langer zoveel energie van me te nemen.

Is er iets wat je kunt loslaten? Een schuldgevoel. Een verwijt aan jezelf. Een scenario van hoe het anders had kunnen lopen. Een verwachting van hoe anderen hadden moeten reageren.

Vandaag de vraag: wat is er iets wat jij kunt loslaten?

{link}

Tot morgen. Benji`,
    inHetAccount: "Wat kun jij loslaten? Een schuldgevoel, een verwachting, een 'had ik maar'? Schrijf het op — loslaten begint met benoemen.",
    alsjewilt: "Wat houdt je ervan te loslaten? Wat maakt het moeilijk?",
  },

  {
    dag: 29,
    thema: "Hoe je verder gaat — met dit gemis als deel van je, niet achter je",
    subject: "Dit gemis gaat mee",
    mail: `Morgen is de laatste dag. En het gemis gaat mee.

Het verdwijnt niet na 30 dagen. Het wordt misschien zachter, meer vertrouwd, meer draagbaar. Maar het is een deel van wie jij bent geworden.

Dat is geen tragedie. Mensen die hebben gerouwd dragen iets diepers in zich. Ze weten wat er echt toe doet. Ze zien dingen die anderen missen.

Vandaag de vraag: hoe ga jij verder — met dit gemis als deel van je verhaal, niet als iets wat achter je ligt?

{link}

Tot morgen. Benji`,
    inHetAccount: "Hoe ga jij verder — met dit gemis als deel van je, niet als iets wat achter je ligt? Wat betekent dat voor jou concreet?",
  },

  {
    dag: 30,
    thema: "Een brief aan jezelf",
    subject: "Je laatste dag — en een brief",
    mail: `Dit is dag 30.

Je hebt 30 dagen lang geschreven — over wat je draagt, wat je verloor, wat je hoopte, wat je voelt. Dat is niet niks. Dat vraagt moed.

Vandaag schrijf je een brief aan jezelf. Niet aan wie je had willen zijn. Maar aan wie je bent — nu, na deze 30 dagen.

Schrijf over wat je hebt ontdekt. Over wat je wil zeggen aan de jij die hier begon. Over wat je meeneemt.

Er is geen goede manier. Schrijf gewoon.

{link}

Ik ben trots op je.
Benji`,
    inHetAccount: "Schrijf een brief aan jezelf — aan wie je nu bent, na deze 30 dagen. Over wat je hebt ontdekt, wat je meeneemt, wat je wil zeggen.",
    alsjewilt: "Wat wil je dat de mensen om je heen weten, nu je deze 30 dagen achter de rug hebt?",
  },
];
