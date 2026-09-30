=== Momenten ===
Een warme, begeleide mini-gids voor je WordPress-site. De bezoeker staat stil bij
een paar momenten, laat een e-mailadres achter, en jij stuurt een persoonlijke
brief terug. Alles blijft op je eigen site.

== Installeren ==
1. Ga in WordPress naar Plugins -> Nieuwe plugin -> Plugin uploaden.
2. Kies het bestand momenten.zip en klik op Nu installeren.
3. Activeer de plugin.
4. In het menu links verschijnt "Momenten".

== Op een pagina zetten ==
Zet op de gewenste pagina de shortcode:

    [momenten]

In Divi doe je dat met een Tekst-module of een Code-module: plak daar
[momenten] in. De gids verschijnt dan op die plek.

== Wat je zelf kunt aanpassen (menu Momenten) ==
- Teksten: het welkomstscherm, de momenten (toevoegen, verwijderen, volgorde),
  het bewaarscherm en het afrondscherm.
- Instellingen: de MailerLite-sleutel en groep, naar welk adres een melding van
  een nieuwe inzending gaat, de afzender van de brief, de bewaartermijn en de
  kleuren (accent, tekst, achtergrond).
- Inzendingen: bekijken wat er gedeeld is, zelf de brief schrijven en versturen,
  en inzendingen verwijderen.

== MailerLite ==
Maak in MailerLite een API-sleutel aan (Integrations -> API) en vul die in bij
Instellingen. Vul ook het groep-ID in van de groep waar nieuwe e-mailadressen in
moeten komen. Met de knop "Testen" controleer je of de sleutel werkt.

== Privacy en veiligheid ==
- Alle inzendingen staan in de database van deze site, niet ergens extern.
- Alleen beheerders kunnen de inzendingen zien.
- Het publieke formulier is beveiligd met een honeypot en een limiet per bezoeker.
- Het e-mailadres van een bezoeker gaat naar MailerLite en er wordt een brief
  gestuurd; verder wordt er niets met de gegevens gedaan.
- Met de bewaartermijn worden oude inzendingen automatisch opgeruimd.

== Versie ==
1.0.0
