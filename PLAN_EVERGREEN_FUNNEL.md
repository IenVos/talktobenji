# Plan: eigen e-mailsysteem in de admin (weg van MailerLite)

Opgesteld 22 juli 2026. Doel: morgen nalezen, daarna bouwen.

---

## 1. Wat we gaan bouwen, in het kort

Drie dingen, in deze volgorde:

**A. Eén reactivatiemail (eenmalig).** Naar de leads die de huidige Even Houvast-reeks al helemaal doorliepen, niet kochten en niet afmeldden. Zij hebben Benji nooit gezien. Na deze mail stromen zij door naar de evergreen funnel.

**B. De evergreen funnel.** Een lange mailreeks waar leads op hun eigen instroomdag in beginnen, opgedeeld in blokken van ongeveer een kwartaal. Volledig op te maken in de admin, zonder code.

**C. Losse tussendoor-mails.** Een scherm waar je een mail schrijft, kiest wie hem krijgt, hem test en verstuurt. De reactivatiemail uit deel A is meteen de eerste toepassing hiervan.

---

## 2. Uitgangspunten

**De huidige Even Houvast-funnel blijft precies zoals hij is.** Geen migratie, geen gedeelde code die we omgooien, geen datamigratie. Die reeks van 6 mails blijft draaien op `convex/evenHouvastOpvolg.ts` met zijn eigen logboek. Er zitten meer dan 167 lopende leads in en dat risico nemen we niet.

Het nieuwe systeem staat er volledig naast, met eigen tabellen en een eigen cron. Als het nieuwe systeem morgen zou omvallen, merkt de Even Houvast-reeks daar niets van. Andersom ook niet.

Wat we wel hergebruiken, omdat het bewezen werkt:

- De manier waarop een mail wordt opgebouwd en verstuurd (Resend, de opmaak van Ien, de handtekening, de footer).
- Gespreid versturen met 90 seconden tussen elke mail, zodat Hotmail en Outlook ons niet gaan blokkeren.
- De afmeldlink en de afmeldingen-tabel `ehAfmeldingen`. Eén afmelding betekent overal afgemeld. Dat is niet alleen netjes, het is ook wettelijk het enige juiste.
- De Benji-markers `[benji-blok]` en de één-klik-token, zodat elke mail een persoonlijke Benji-knop kan bevatten.

**Woordkeuze in alle teksten en schermen:** Benji is een product, nooit een abonnement. Geen lange streepjes in de teksten, punt of komma.

---

## 3. Deel A: de eenmalige reactivatiemail

### Wie krijgt hem

We nemen alleen de leads die de Even Houvast-reeks helemaal hebben doorlopen. Zij zijn uit de funnel gestroomd en krijgen op dit moment niets meer. Dat is de veiligste groep, want ze zitten niet ook nog in een lopende reeks.

Alle regels op een rij, gecontroleerd per e-mailadres:

| Regel | Waar we dat zien |
|---|---|
| Heeft de brief gehad na 25 juni 2026 | tabel `houvastBrieven` |
| Heeft alle 6 opvolgmails gehad | tabel `ehOpvolgVerzonden` |
| Laatste mail minstens 3 dagen geleden | zelfde tabel, zodat we niet bovenop de vorige mail vallen |
| Heeft zich niet afgemeld | tabel `ehAfmeldingen` |
| Heeft Niet Alleen niet gekocht | tabel `nietAlleenProfiles` en betaalde `userSubscriptions` |
| Heeft nog nooit een Benji-link gekregen | tabel `benjiStartTokens` |
| Heeft nog geen toegang tot Benji | geen enkele `userSubscriptions`-rij |
| Is geen testadres van jou | tabel `analyticsExcludedEmails` |

Die zesde regel is de mooiste vondst. Een Benji-token wordt alleen aangemaakt op het moment dat er een mail met een Benji-blok wordt verstuurd, en dat gebeurt pas sinds 21 juli. Dus wie geen rij in `benjiStartTokens` heeft, heeft aantoonbaar nooit een Benji-uitnodiging gehad. We hoeven dus niet te gokken met datums.

### Wat er nadrukkelijk niet in zit

- **Afgemelde mensen.** Die hebben hun toestemming ingetrokken. Nooit aanschrijven, ook niet eenmalig.
- **Leads die nog midden in de reeks zitten.** Zij krijgen deze week toch al mails. Zij zien Benji vanzelf, want de Benji-link zit sinds 21 juli in mail 2 van de reeks.
- **De oude leads van vóór 25 juni.** Die kregen alleen de brief en daarna nooit iets. Dat is de koudste groep, met de grootste kans op afmeldingen en bounces. Wil je die later toch aanschrijven, dan doen we dat als aparte actie met een eigen tekst, nadat we zien hoe deze eerste zending loopt.

### Hoe hij verstuurd wordt

Via het losse-mail-scherm uit deel C. Dus geen aparte eenmalige code die we daarna weggooien. Concreet:

1. Je opent het scherm, kiest de doelgroep "uitgestroomd uit Even Houvast, nog geen Benji".
2. Je ziet meteen de aantallen: hoeveel mensen totaal, uitgesplitst per verliestype, en hoeveel er afvielen en waarom.
3. Je schrijft of past de tekst aan.
4. Je stuurt een test naar jezelf.
5. Pas dan verschijnt de verstuurknop. De mails worden 90 seconden uit elkaar ingepland.

Vlak voor elke individuele mail wordt nog één keer gecontroleerd of die persoon zich intussen niet heeft afgemeld of heeft gekocht. Bij een lijst van een paar honderd mensen duurt de zending een paar uur, en in die tijd kan er van alles gebeuren.

### Wat er daarna gebeurt

Iedereen die deze mail kreeg, wordt ingeschreven in de evergreen funnel op dag 1. Dat gebeurt in dezelfde handeling, zodat je het niet kunt vergeten.

---

## 4. Deel B: de evergreen funnel

### Hoe de klok loopt

Elke lead heeft zijn eigen dag 1, namelijk de dag dat hij instroomt. Wie op 1 maart binnenkomt en wie op 20 mei binnenkomt, krijgen allebei dezelfde mail 1 op hun eigen eerste dag. Dat is wat evergreen betekent: de reeks staat stil, de mensen bewegen erdoorheen.

### Fases en blokken

De reeks heeft twee niveaus, precies zoals in het masterplan. Een **fase** bepaalt het ritme, een **blok** bepaalt het thema. Een blok is twee of drie mails over hetzelfde onderwerp.

**24 mails in totaal, verspreid over bijna een jaar.**

**Intensieve fase, 12 mails, elke 7 dagen (dag 1 tot 78)**

| Blok | Thema | Mails | Dagen |
|---|---|---|---|
| 1 | De nachten | 3 | 1, 8, 15 |
| 2 | Waarom het na lange tijd opeens weer rauw kan voelen | 2 | 22, 29 |
| 3 | Je omgeving die het niet snapt | 2 | 36, 43 |
| 4 | Schuldgevoel en "had ik maar" | 3 | 50, 57, 64 |
| 5 | Goede dagen, en het schuldgevoel daarover | 2 | 71, 78 |

**Verdiepingsfase, 6 mails, elke 14 dagen (dag 92 tot 162)**

| Blok | Thema | Mails | Dagen |
|---|---|---|---|
| 6 | Er Zijn, de omgekeerde invalshoek | 1 | 92 |
| 7 | Iedereen lijkt verder te gaan behalve jij | 1 | 106 |
| 8 | Herinneringen bewaren | 1 | 120 |
| 9 | Wat rouw met je lijf doet | 1 | 134 |
| 10 | Verder leven zonder te vergeten | 2 | 148, 162 |

**Aanwezigheidsfase, 6 mails, één per maand (dag 195 tot 345)**

| Blok | Thema | Mails | Dagen |
|---|---|---|---|
| 11 | Terugkijken zonder schuld | 2 | 195, 225 |
| 12 | Ruimte voor iets nieuws | 3 | 255, 285, 315 |
| 13 | De late brug naar Niet Alleen | 1 | 345 |

De dagnummers zijn een voorstel, geen wet. Je zet ze zelf in de admin en kunt ze altijd verschuiven. Ze zijn zo gekozen dat er tussen de fases even lucht zit, zodat de overgang naar een rustiger ritme voelbaar is.

In de admin klap je één blok open en zie je alleen die twee of drie mails. Per blok zie je hoeveel mensen erin zitten, hoeveel er doorheen kwamen, hoeveel er afmeldden, en wat de open-, klik- en verkoopcijfers zijn. Zo zie je welk thema verkoopt en welk niet. Dat stuurt wat je later uitbreidt: een winnend blok krijgt een tweede reeks.

Een blok kun je in zijn geheel op pauze zetten zonder de rest te raken. Technisch is een blok niets meer dan een groepje mails met een naam en een volgnummer, dus het kan nooit iets breken.

**Je hoeft niet alles vooraf te schrijven.** Met blok 1 erin kan het systeem aan: niemand komt bij dag 22 voordat dag 15 voorbij is. Daarna heb je telkens een week voor het volgende blok. Als een mail nog niet klaar is, staat hij op uit en wordt hij overgeslagen zonder dat de rest verschuift.

### Instroom

Er zijn drie manieren om in de funnel te komen, en je zet ze afzonderlijk aan of uit:

1. **De reactivatiegroep**, eenmalig bij de zending uit deel A.
2. **Nieuwe Even Houvast-leads**, automatisch zodra zij de bestaande reeks van 6 mails hebben uitgelopen. Zo loopt de oude funnel netjes over in de nieuwe zonder dat we de oude aanpassen.
3. **Handmatig**, via een knop in de admin, voor als je iemand er los in wilt zetten.

### Wanneer iemand eruit gaat

- Bij afmelden. Direct en definitief.
- Bij een aankoop van Niet Alleen. Dan hoort iemand in het klanttraject, niet in de verkoopfunnel.
- Bij het kiezen van de rustoptie, zie hieronder.
- Als de reeks op is. Dan blijft de lead gewoon geregistreerd en kan hij nog wel losse mails krijgen, maar de automatische reeks stopt.

### De rustoptie

Onder elke mail staat naast de afmeldlink een tweede zinnetje: *"Liever even minder mail? Klik hier en je hoort ons alleen nog maandelijks."*

Bij een klik gaat de automatische reeks voor die persoon uit, maar blijft hij wel op de lijst voor de maandmail. Dat is de zachte tussenweg tussen alles ontvangen en helemaal weg zijn, en het scheelt afmeldingen: iemand die het even te veel vindt hoeft niet de deur dicht te doen.

Technisch is dit een status op de lead (`alleen-maandmail`), met dezelfde beveiligde link als de afmeldlink. Wil iemand later weer de hele reeks, dan kun jij dat in de admin terugzetten. De reeks pakt dan gewoon op waar hij was, want het logboek weet welke mails hij al had.

Statussen die een lead kan hebben:

| Status | Betekent |
|---|---|
| `in-funnel` | zit nog in de Even Houvast-reeks, nog niet in de evergreen |
| `in-backend` | loopt de evergreen reeks door |
| `alleen-maandmail` | rustoptie gekozen, of de reeks helemaal uitgelopen |
| `koper` | heeft Niet Alleen gekocht, zit in de koperflow |
| `afgemeld` | krijgt niets meer |

### Hoe het versturen werkt

Eén keer per dag kijkt de cron: voor elke lead in de funnel, hoeveel dagen is hij binnen, welke mail is nu aan de beurt, en heeft hij die al gehad. Precies één mail per lead per dag, ook als hij achterloopt. Zo krijgt niemand ooit drie mails op één ochtend. Daarna worden alle mails van die dag ingepland met 90 seconden ertussen.

Dat is exact hetzelfde principe als de Even Houvast-reeks nu gebruikt, alleen met de dagen en de mails uit de database in plaats van uit de code.

---

## 5. Deel C: losse tussendoor-mails

Een scherm waar je een mail schrijft en verstuurt zonder dat er iets aan een reeks vastzit.

- **Schrijven** in dezelfde editor die je al kent van de andere mails, met dezelfde opmaak, dezelfde knop, hetzelfde Benji-blok als je dat wilt.
- **Doelgroep kiezen** uit een lijst: iedereen in de evergreen funnel, of alleen één verliestype, of alleen de mensen in een bepaald blok, of de reactivatiegroep uit deel A.
- **Aantallen zien** voor je iets verstuurt. Altijd. Er verschijnt geen verstuurknop voordat je de aantallen hebt gezien en een testmail hebt gestuurd.
- **Versturen**, gespreid, met dezelfde veiligheidscontroles.
- **Teruglezen** in een overzicht van verstuurde losse mails, met per mail hoeveel er weg zijn en wat de open- en klikcijfers zijn.

Afgemelde mensen worden altijd overgeslagen, in elk segment, zonder dat je daar zelf aan hoeft te denken.

---

## 6. De verliestypes: mijn advies

Je vroeg wat hier het beste is. Mijn advies: **één reeks, waarbij je per mail een variant per verliestype kunt toevoegen als je dat wilt.**

Waarom niet zes losse reeksen, zoals Even Houvast nu doet:

De huidige reeks is 6 mails maal 6 types, dat zijn 36 teksten. Dat is al veel. Een evergreen funnel van bijvoorbeeld 30 mails wordt dan 180 teksten, en elke keer dat je één zin wilt aanpassen moet je dat zes keer doen. Dat gaat niemand volhouden, en dan verzandt het systeem.

Waarom ook niet helemaal zonder types:

De afstemming op het verlies is juist wat jouw mails goed maakt. Iemand die zijn hond verloor en iemand die zijn kinderwens moest loslaten, die wil je niet dezelfde zin sturen.

Dus het middenpad, en dat werkt zo:

- Je schrijft elke mail één keer. Dat is de algemene versie, en die staat er altijd.
- Bij een mail waar het echt uitmaakt, klik je op "variant toevoegen", kiest een verliestype en schrijft een aangepaste versie.
- Bij het versturen wordt gekeken: is er een variant voor het type van deze lead, dan die. Zo niet, dan de algemene versie.
- In het overzicht zie je per mail met een klein label welke varianten er zijn. Zo blijft zichtbaar waar je nog kunt verfijnen zonder dat het moet.

Praktisch betekent dit dat je gewoon kunt beginnen. Alle mails algemeen, en je verfijnt in de loop van de tijd de mails waarvan je in de cijfers ziet dat het loont.

Daar bovenop werkt nog steeds wat er nu al in de mails zit: de voornaam, en waar bekend de naam van wie of wat gemist wordt. Dat geeft al veel persoonlijk gevoel zonder aparte teksten.

---

## 7. Wat er in de database bij komt

Vier nieuwe tabellen, allemaal nieuw, geen enkele bestaande tabel verandert van vorm.

| Tabel | Wat erin zit |
|---|---|
| `funnelBlokken` | Een blok: naam, volgnummer, van dag tot dag, aan of uit |
| `funnelMails` | Eén mail: bij welk blok, op welke dag, onderwerp, tekst, knop, eventueel verliestype voor een variant, aan of uit |
| `funnelLeads` | Wie zit in de funnel: e-mail, naam, verliestype, instroomdatum, hoe binnengekomen, status |
| `funnelVerzonden` | Logboek: welke mail is wanneer naar wie gegaan. Voorkomt dubbele mails |

Plus een tabel voor de losse mails met hun doelgroep en verzendstatus.

De bestaande tabellen `houvastBrieven`, `ehOpvolgVerzonden`, `emailTemplates` en `ehAfmeldingen` blijven ongemoeid. Van `ehAfmeldingen` lezen we alleen, we schrijven er niets nieuws in behalve gewone afmeldingen.

---

## 8. De veiligheden

Dit zijn de dingen die voorkomen dat er ooit iets misgaat met mensen in je lijst.

1. **Nooit dubbel.** Elke verzonden mail wordt gelogd voordat we hem als klaar beschouwen, en er wordt altijd eerst in het logboek gekeken.
2. **Maximaal één mail per persoon per dag** vanuit de reeks. Ook als er achterstand is.
3. **Nooit meer dan één zending tegelijk.** Draait er een losse zending, dan kan er geen tweede gestart worden.
4. **Afmelding is heilig.** Wordt op drie momenten gecontroleerd: bij het samenstellen van de lijst, bij het inplannen, en vlak voor de mail echt de deur uit gaat.
5. **Nooit een verstuurknop zonder droogloop.** Aantallen zien en een testmail sturen komen altijd eerst.
6. **Een noodrem.** Eén knop in de admin die alle geplande zendingen stopt. Wat al weg is is weg, maar de rest blijft staan.
7. **De hele funnel op pauze** kan met één schakelaar, net zoals `EH_OPVOLG_ACTIEF` dat nu voor Even Houvast doet.
8. **Geen automatische start.** Het systeem gaat pas mailen als jij het aanzet.

---

## 9. In welke volgorde we bouwen

Ik push elke stap los naar main, zodat je onderweg kunt meekijken en we nooit een grote brok tegelijk live zetten.

**Stap 1. Het overzicht, zonder dat er iets kan versturen.**
De vier tabellen, plus een adminpagina die de reactivatiegroep laat zien met de exacte aantallen. Er is nog geen enkele knop die een mail kan sturen. Jij controleert of de aantallen kloppen en of je de namen herkent.

**Stap 2. De losse mail, en daarmee de reactivatiemail.**
Het schrijfscherm, de doelgroepkiezer, de testmail, de verstuurknop met de spreiding. Hiermee gaat de reactivatiemail de deur uit. Iedereen die hem krijgt gaat meteen de evergreen funnel in, ook al staat die nog stil.

**Stap 3. De funnelbouwer in de admin.**
Blokken aanmaken, mails erin zetten met een dagnummer, slepen om te ordenen, per mail en per blok aan en uit. Met een tijdlijn die laat zien wat een lead in welke volgorde krijgt. Nog steeds verstuurt er niets.

**Stap 4. De motor aanzetten.**
De dagelijkse cron, uit op scherp. Eerst testen op jouw eigen adres met een testfunnel van drie mails op dag 1, 2 en 3. Als dat klopt, zetten we hem aan voor het echt.

**Stap 5. De automatische instroom.**
Nieuwe Even Houvast-leads stromen na hun laatste opvolgmail automatisch door naar de evergreen funnel. Dit doen we bewust als laatste, want dit is het enige punt waar het nieuwe systeem het oude aanraakt, en dan alleen door te lezen.

Na stap 2 heb je al waarde in handen. Na stap 4 kun je zelf funnels bouwen. Stap 5 maakt het geheel rond.

---

## 10. Wat ik van jou nodig heb

Niet meteen, maar wel voor stap 3 en 4 echt af zijn:

1. **De drie mails van blok 1, de nachtreeks.** Meer heb je niet nodig om te starten. De rest schrijf je terwijl de eerste leads al lopen.
2. **De tekst van de reactivatiemail.** Ik schrijf een eerste versie in jouw toon, jij past hem aan in de admin.
3. **Op welk moment mag de reactivatiemail eruit.** Liefst een ochtend doordeweeks, en niet op een dag dat er ook Even Houvast-mails uitgaan.

De blokindeling en de dagnummers staan al in hoofdstuk 4, uit jouw masterplan. Die hoef je alleen na te kijken.

---

## 11. Nog open

- **Bounces.** Adressen die eerder hard bouncen zouden we willen overslaan. De gegevens zitten in `resendEmailEvents`, maar die tabel heeft geen index op de ontvanger, dus dat wordt een aparte doorloop. Voorstel: in stap 1 tonen we het als waarschuwing bij de aantallen, en pas als het echt een probleem blijkt bouwen we er een filter op.
- **De oude leads van vóór 25 juni.** Bewust uitgesteld. Beslissen we na de eerste zending.
- **Een seizoenslaag.** Mails op een echte kalenderdatum, zoals rond de feestdagen of Allerzielen. Past er later netjes bij, maar hoort niet in deze eerste bouw.
