# Plan: privacy/versleuteling Benji-gesprekken

Datum onderzoek: 2 aug 2026. Alles hieronder is geverifieerd in de code.

## Het probleem (feitelijk)

De EH-mails (`eh_<type>_6`, alle types) claimen dat gesprekken "versleuteld en voor
niemand zichtbaar zijn, ook niet voor mij". Dat klopt nu niet:

- `chatMessages.content` staat als **platte tekst** in de Convex-DB (`schema.ts:76`).
- Admin leest volledige gesprekken uit via `admin.getChatHistoryDetail` (`admin.ts:76`)
  en `getEscalationWithSession` (`admin.ts:160`).
- "Na ~3 dagen weg" = de inbox toont alleen de nieuwste ~100 (display-limiet), geen privacy.

## Wat er WEL afgeleid en behoudbaar is

Ruwe berichttekst is maar op 3 momenten nodig:

1. **Tijdens het gesprek** — live chat leest sessie-berichten terug voor context (`ai.ts:207-215`).
2. **Bij afsluiten** — 2 achtergrond-jobs:
   - samenvatting `summarizeSession` (`ai.ts:1120`) → `chatSessions.summary` (geanonimiseerd, 3e persoon)
   - kwaliteitsrapport `analyzeSessionAdmin` (`ai.ts:1206`) → `chatSessions.adminRapport` (geen citaten)
3. **Cross-sessie geheugen** — gebruikt NOOIT ruwe oude berichten, alleen `summary` +
   embedding (`ai.ts:254-262`) en losse `memories`/`goals`-tabellen.

Conclusie: **zodra samenvatting + rapport klaar zijn, is de ruwe gesprekstekst voor het
product wegwerpbaar.** Alleen admin-inzage leest het dan nog.

## De opties (Ien kiest)

### Optie A+ (advies) — ruwe berichten wissen ná rapport
Na afloop van de sessie draaien samenvatting + rapport zoals nu. Zodra beide klaar zijn,
wist een achtergrond-job de ruwe `content` van de berichten (nullen/leegmaken). Wat blijft:
de geanonimiseerde samenvatting, het kwaliteitsrapport, en de metadata (rating, aantal
berichten). Admin-inzage in ruwe gesprekken (`getChatHistoryDetail`, escalatie-detail)
gaat eruit.

- Voor: sterkste privacy, simpelste code, geen sleutelbeheer. Er is letterlijk niets meer
  te lezen. Mailclaim wordt vrijwel volledig waar.
- Tegen: onomkeerbaar. Geen heranalyse van een ruw gesprek meer mogelijk, en bij een
  klacht kun je het exacte gesprek niet meer terugzien (alleen de samenvatting).
- Mailtekst: "Ik bewaar je gesprekken niet. Zodra een gesprek klaar is, houdt het systeem
  alleen een geanonimiseerde samenvatting voor kwaliteit. Niemand leest je gesprekken terug."
- Bewaarvenster instelbaar (bv. wissen 24u na sessie-einde) als vangnet voor de jobs.

### Optie A — versleuteld-at-rest ná rapport, admin-inzage eruit
Zelfde moment, maar in plaats van wissen versleutelt de server de `content` met een
server-sleutel (Convex env var). Admin-inzage-queries eruit.

- Voor: terugdraaibaar/heranalyseerbaar zolang de sleutel er is; DB-dump/leak toont geen
  platte tekst.
- Tegen: de server (= ik als beheerder) kán technisch nog ontsleutelen, dus "voor niemand
  zichtbaar" blijft strikt genomen niet 100% waar. Sleutelbeheer + migratie nodig.
- Mailtekst: "Je gesprekken worden versleuteld bewaard. Ik lees ze niet; het systeem checkt
  alleen automatisch de kwaliteit."

### Optie B — alleen de mailtekst eerlijk maken
Geen techniek. Herschrijf de claim naar wat nu waar is (bv. "vertrouwelijk, alleen gebruikt
om Benji te verbeteren", zonder "versleuteld/voor niemand zichtbaar").

- Voor: 5 minuten werk, geen risico.
- Tegen: lost de onderliggende privacy niet op; admin blijft alles kunnen lezen.

### Optie C — echte end-to-end versleuteling
Sleutel alleen bij de gebruiker; server ziet nooit platte tekst.

- Niet haalbaar: de live chat én de AI-rapporten/training draaien server-side op de platte
  tekst. E2E breekt beide. Vermeld voor volledigheid, niet aan te raden.

## Aanbeveling

**A+**, tenzij Ien heranalyse van ruwe gesprekken echt wil behouden, dan **A**. Beide
maken de mailclaim eerlijk en houden de AI-kwaliteitsrapporten intact. B is een prima
tussenstap als we vandaag alleen de claim willen rechttrekken en de techniek later doen.

## Implementatie-schets (A+ of A)

1. Nieuwe internal-mutation `redactSessionMessages` (A+) of `encryptSessionMessages` (A)
   in `chat.ts`.
2. Aan het eind van `analyzeSessionAdmin` (`ai.ts:1287`, na rapport + suggestie) de job
   triggeren, of via een aparte cron die sessies pakt met `adminRapport` gezet + `summary`
   gezet + ruwe content nog aanwezig.
3. Admin-inzage weghalen: `getChatHistoryDetail` en de messages in `getEscalationWithSession`
   niet meer teruggeven (frontend eerst live, dan pas query weg — Convex-loopt-achter-regel).
4. Mailtekst `eh_<type>_6` aanpassen (alle types) naar de gekozen claim.
5. (A) `ENCRYPTIE_SLEUTEL` als Convex env var (PROD = hardy-turtle-320), decrypt-pad alleen
   in de achtergrond-jobs.
