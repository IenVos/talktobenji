# Plan: Account, Limieten & Donaties

**Status:** Plan vastgesteld, klaar voor implementatie  
**Baseline:** `baseline-voor-account` (git tag)

---

## Overzicht

| Onderdeel | Beschrijving |
|-----------|--------------|
| **Account aanmaken** | Registratie met e-mail + wachtwoord |
| **Gratis limiet** | 10 gesprekken zonder account; na 6e gesprek banner tonen |
| **Mijn gesprekken** | Ingelogde gebruikers kunnen eerdere gesprekken terugkijken |
| **Donaties** | Stripe checkout, vrijwillige bijdrage |

---

## 1. Account aanmaken & inloggen

### Wat er al is
- `credentials.createUserWithPassword` (Convex) – backend klaar
- `auth.ts` – NextAuth met e-mail/wachtwoord
- `chat.linkSessionToUser` – anonieme sessies koppelen aan account na inloggen

### Wat we bouwen
- **`/registreren`** – Pagina: e-mail, wachtwoord, bevestig wachtwoord, naam (optioneel)
- **`/inloggen`** – Pagina: e-mail + wachtwoord (of combinatie met registreren)
- **Wachtwoord vergeten** – Link naar flow (e-mail met reset-link)
- Integratie: na registratie/inloggen direct ingelogd, `userId` doorgeven aan chat

---

## 2. Gratis limiet (10 gesprekken)

### Logica
- **Anonieme gebruiker** = bezoeker zonder account
- We tellen **gesprekken** (sessies), niet berichten
- **anonymousId** = unieke ID in localStorage (UUID), wordt meegegeven bij `startSession`

### Stappen
1. **Schema**: `chatSessions` krijgt veld `anonymousId: v.optional(v.string())`
2. **Client**: bij eerste bezoek `anonymousId` genereren en in localStorage opslaan
3. **startSession**: `anonymousId` meesturen als gebruiker niet ingelogd is
4. **Tellen**: aantal sessies met `anonymousId = X` en `userId` leeg

### Grenzen
| Gesprekken | Actie |
|------------|-------|
| 1–5 | Geen boodschap |
| 6–10 | Banner onder chat: *"Maak een account aan om je gesprekken op te slaan en ze later terug te kijken"* |
| 11+ | Geen nieuw gesprek mogelijk; melding dat ze een account moeten aanmaken |

### Tekst banner (na 6e gesprek)
> **Maak een account aan** – Dan kun je je gesprekken later terugkijken en onbeperkt verder chatten met Benji.

---

## 3. Mijn gesprekken (terugkijken)

- **`/mijn-gesprekken`** of **`/account`** – Alleen voor ingelogde gebruikers
- Lijst van eerdere gesprekken (datum, eventueel eerste regel)
- Klik op gesprek → berichten tonen (alleen-lezen)
- Duidelijk maken: *"Met een account kun je al je gesprekken terugkijken"*

---

## 4. Stripe donaties

- **Stripe Checkout** – Stripe-hosted checkout
- **`/steun-benji`** – Pagina met korte uitleg + bedragen (bijv. €3, €5, €10, eigen bedrag)
- Klik op bedrag → redirect naar Stripe Checkout
- Na betaling → bedankpagina of redirect terug
- Webhook voor geslaagde betalingen (optioneel, voor admin-overzicht)

### Benodigd
- Stripe-account
- `STRIPE_SECRET_KEY` en `STRIPE_WEBHOOK_SECRET` (Convex/Vercel env)
- Price IDs of Checkout Session met custom amount

---

## 5. Volgorde van implementatie

1. **Schema + anonymousId** – Aanpassen chatSessions, tellen van anonieme sessies
2. **Registratiepagina** – `/registreren` met formulier
3. **Loginpagina** – `/inloggen` (of gecombineerd met registreren)
4. **Chat + auth** – userId/anoniemeId doorgeven, `linkSessionToUser` na inloggen
5. **Banner + limiet** – Na 6 gesprekken banner, na 10 blokkeren
6. **Mijn gesprekken** – Pagina voor ingelogde gebruikers
7. **Stripe donaties** – `/steun-benji` + Checkout

---

## 6. Veiligheid

- Wachtwoorden: bcrypt (via `hash` van bcryptjs) bij registratie
- Sessies: JWT via NextAuth, 30 dagen
- Convex: auth-check waar nodig (bijv. bij `getUserSessions`)
- HTTPS: Vercel regelt dit
- Geen wachtwoorden in logs of client

---

## 7. Schemawijzigingen

```ts
// chatSessions - toevoegen:
anonymousId: v.optional(v.string()),

// Nieuwe index voor tellen:
.index("by_anonymous", ["anonymousId"])
```

---

*Laatste update: Januari 2026*
