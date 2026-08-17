# Gratis-model: van 7 dagen naar ~175 berichten

Gebouwd 17 aug 2026, **achter de flag, nog niet live**. Dit document = de aan-knop + wat er nog moet voor go-live.

## De ene schakelaar

Alles hangt aan één Convex-env-var:

```
BENJI_BERICHTEN_MODEL_ACTIEF = true
```

- **Niet gezet / "false"** → oude 7-dagen-trial blijft volledig leidend. Er verandert live niets.
- **"true"** → gratis toegang wordt een berichten-tegoed van **175 berichten** (grens `GRATIS_BERICHTEN_LIMIET` in `convex/benjiLimiet.ts`). Rond bericht **130** (`ZACHT_SEIN_VANAF`) verschijnt één zachte regel; op 175 de paywall.

De frontend leest deze vlag via `api.benjiLimiet.getConfig`, dus **deze ene env-var stuurt zowel backend als UI**.

## Zo testen we samen (zonder iedereen te raken)

1. Zet `BENJI_BERICHTEN_MODEL_ACTIEF=true` **op de DEV-Convex-deployment** (niet prod).
2. Log in met een testaccount, chat door tot ~130 (zachte regel) en tot 175 (paywall).
3. Check: betaalde/admin-accounts raken de paywall NIET; paywall-knop gaat naar `/wat-kost-benji`.
4. Pas als dat klopt: env-var op **PROD**-Convex op `true`.

## Wat al gebouwd is (code, dormant)

- `convex/benjiLimiet.ts` — grenzen, teller `telGebruikersberichten`, `getConfig`, `getBerichtenStatus`, paywall-melding.
- `convex/subscriptions.ts` `getConversationCount` — onder de vlag: trial ≠ onbeperkt, gratis = 175-berichten-tegoed (`isBerichtenModel`).
- `convex/ai.ts` `handleUserMessage` — onder de vlag: harde grens = teller, per-sessie-limiet vervalt voor deze users, error `BENJI_LIMIET_BEREIKT`.
- `app/ChatPageClient.tsx` — paywall-overlay op 175, zachte regel vanaf 130, meldt paywall voor advertentie-meting.
- `convex/schema.ts` — veld `paywallBereiktAt` op `userSubscriptions` = **leading indicator voor ad-rendement** (klik → account → paywall → koop).

## Nog te doen VÓÓR (of tegelijk met) go-live

Dit is copy/mail die "7 dagen" belooft. Zolang de vlag uit staat klopt de oude tekst; zet je de vlag aan, dan moet dit mee, anders belooft de mail iets anders dan de chat geeft.

**Teksten (code):**
- [ ] `app/page.tsx` — 2× uitleg/FAQ "7 dagen gratis" → "5 gesprekken gratis"
- [ ] `app/faq/page.tsx` + `convex/supportFaq.ts` — proefperiode-antwoorden
- [ ] `app/benji-start/page.tsx` — verlopen-token tekst ("na de 7 dagen")
- [ ] `app/account/wachtwoord/page.tsx` (r. 721-733) — usage-bar toont nu alleen bij type "free" en labelt "Gesprekken deze maand"; onder nieuw model relabelen naar "Berichten (gratis) — x / 175" en ook voor trial tonen
- [ ] admin-labels: `klantbeheer`, `even-houvast-funnel`, `trial-test`, `trial-emails`

**Mails (code + DB-templates):**
- [ ] `convex/emails.ts` welkomstmail "7 dagen"
- [ ] EH-opvolgmails + evergreen: de Benji-mail "Probeer Benji 7 dagen gratis" en het `[benji-blok]` in `convex/evenHouvastOpvolg.ts` ("7 dagen gratis met Benji"). Raakt ALLE verliestypes. Deze staan deels in de live mail-templates (DB), niet alleen in code.

**Tijd-machine (uitzetten of laten uitdoven):**
- [ ] `convex/crons.ts` — `checkAndProcessTrials` (2×/dag) uitzetten
- [ ] `convex/trials.ts` — dagen aftellen / dag5+dag7 reminders / verlopen→free: overbodig bij usage-model
- [ ] `trial_day5` / `trial_day7`-mails + `app/admin/trial-emails` — vervangen door optioneel 1 "bijna op"-mail, of laten vallen
- [ ] `convex/benjiStart.ts` — trial-subscription blijft prima (wordt onder de vlag als teller-gratis behandeld); `TRIAL_MS`/`expiresAt` doen dan niets meer functioneel

**Benji-prompt:**
- [ ] Regel toevoegen: Benji praat NOOIT over proef/limiet/berichten-over/betalen. De UI regelt dat, buiten hem om.

## Advertentie-rendement meten

Meet niet op "dag 7" maar op de **paywall** (`paywallBereiktAt`) binnen een vast attributievenster (bijv. 14 dagen). Funnel per ad: klik → account → paywall bereikt → koop. De dag-8-terugkomer is nu een winst: die loopt tegen de paywall op het moment dat hij het meest betrokken is.
