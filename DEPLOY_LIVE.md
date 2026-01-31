# Live versie bijwerken (Vercel + Convex)

Als de **live site** de optie "Account aanmaken / Inloggen" niet toont, of aanpassingen niet zichtbaar zijn, controleer het volgende.

---

## Als de deploy op Vercel faalt (Git zegt: deploy niet gelukt)

Vercel heeft **geen** toegang tot je `.env.local`. Als er ook maar één verplichte variabele ontbreekt, faalt de build of de site. Doe dit in volgorde:

### Stap A: Bekijk de echte fout (belangrijk)

De melding "Command `npm run build` exited with 1" zegt alleen dát het misging, niet **waarom**. De echte oorzaak staat **onderaan** de Build Logs:

1. Ga naar [vercel.com](https://vercel.com) → jouw project → **Deployments**.
2. Klik op de **mislukte** deploy (rode kruis).
3. Open **Build Logs** (of "Building").
4. **Scroll helemaal naar beneden** – de eerste regels zijn vaak alleen `npm install` en deprecation warnings; de **echte fout** staat na "Running build command" of "next build".
5. Zoek de regel met **Error**, **Failed**, of een rode melding. **Kopieer die regel** (of maak een screenshot) en gebruik die om te fixen of te delen.

Zonder die regel blijven we gissen; met die regel kunnen we in één keer de juiste fix doen.

### Stap B: Zet alle environment variables in Vercel

Vercel → **Settings** → **Environment Variables**. Zet **alle** onderstaande (voor Production, en eventueel Preview):

| Naam | Waarde (voorbeeld / waar te halen) |
|------|-------------------------------------|
| `NEXT_PUBLIC_CONVEX_URL` | `https://hardy-turtle-320.convex.cloud` (jouw Convex production URL) |
| `CONVEX_DEPLOY_KEY` | `prod:hardy-turtle-320|...` (Convex Dashboard → Settings → Deploy Key) |
| `AUTH_SECRET` | Willekeurige string, bijv. `openssl rand -base64 32` in de terminal |
| **`NEXTAUTH_URL`** | **Exact je live URL**, bijv. `https://jouw-project.vercel.app` (zonder slash aan het eind) |
| `CONVEX_AUTH_ADAPTER_SECRET` | **Exact dezelfde** waarde als in Convex Dashboard → Environment Variables |
| `CONVEX_AUTH_PRIVATE_KEY` | De private key (PEM) die je gebruikt voor JWT (zelfde als in `.env.local`) |
| `ADMIN_PASSWORD` | Wachtwoord voor `/admin` |
| `ANTHROPIC_API_KEY` | API key voor de chatbot |

**Belangrijk:** `NEXTAUTH_URL` moet je **live Vercel-URL** zijn. Zonder deze kan NextAuth op Vercel problemen geven.

### Stap C: Opnieuw deployen

Na het toevoegen of wijzigen van variabelen: **Deployments** → drie puntjes bij de laatste deploy → **Redeploy** (vink "Use existing Build Cache" uit als je net env vars hebt gewijzigd).

### Stap D: Lokaal eerst checken

Voordat je pusht: `npm run build` in de projectmap. Als die **lokaal** slaagt maar Vercel faalt, komt het bijna altijd door ontbrekende of verkeerde env vars op Vercel (zie Stap B).

---

## 1. Code naar Git pushen

Zorg dat je laatste wijzigingen gecommit en naar `main` gepusht zijn:

```bash
git status
git add .
git commit -m "Account-optie in header + deploy-instructie"
git push origin main
```

Vercel bouwt automatisch na een push op `main`. Controleer in [vercel.com](https://vercel.com) → jouw project → **Deployments** of de laatste deploy geslaagd is.

## 2. Convex productie deployen

De live site praat met de **Convex production** deployment (`hardy-turtle-320`). Die moet dezelfde functies hebben als lokaal.

In `.env.local` tijdelijk de **productie**-waarden zetten (zie CONVEX_PRODUCTION.md):

- `NEXT_PUBLIC_CONVEX_URL` = `https://hardy-turtle-320.convex.cloud`
- `CONVEX_DEPLOY_KEY` = je **production** deploy key (begint met `prod:hardy-turtle-320|...`)

Daarna:

```bash
npm run deploy:convex
```

Of direct:

```bash
dotenv -e .env.local -- npx convex deploy
```

Daarna `.env.local` weer op development zetten als je lokaal verder wilt werken.

## 3. Vercel environment variables

In Vercel → Project → **Settings** → **Environment Variables** moeten **alle** uit de tabel in "Als de deploy op Vercel faalt" staan, inclusief **`NEXTAUTH_URL`** = je live URL (bijv. `https://jouw-project.vercel.app`).

Na het toevoegen of wijzigen van variabelen: **Redeploy** (Deployments → … bij laatste deploy → Redeploy).

## 4. Controleren

1. Open de live URL (bijv. `https://jouw-project.vercel.app`) in een **incognito** venster.
2. Je zou moeten zien:
   - In de header: knop **"Account / Inloggen"** (of alleen het icoon op kleine schermen)
   - Op het welkomstscherm: link **"Account aanmaken of inloggen"**
   - In het menu (icoon rechtsboven): **"Account aanmaken / Inloggen"**
3. Klik op een van deze → het inlog-/registratiemodal zou moeten openen.

Als er een foutmelding verschijnt, controleer de browserconsole (F12) en de logs in Vercel (Deployments → laatste deploy → Functions / Logs).
