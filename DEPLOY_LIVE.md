# Live versie bijwerken (Vercel + Convex)

Als de **live site** de optie "Account aanmaken / Inloggen" niet toont, of aanpassingen niet zichtbaar zijn, controleer het volgende.

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

In Vercel → Project → **Settings** → **Environment Variables** moeten minimaal staan:

- `NEXT_PUBLIC_CONVEX_URL` = `https://hardy-turtle-320.convex.cloud`
- `CONVEX_DEPLOY_KEY` = production deploy key
- `AUTH_SECRET` = een geheim voor NextAuth (bijv. `openssl rand -base64 32`)
- `CONVEX_AUTH_ADAPTER_SECRET` =zelfde waarde als in Convex Dashboard (production)
- `CONVEX_AUTH_PRIVATE_KEY` = private key voor JWT (of JWKS in Convex)
- Overige: `ADMIN_PASSWORD`, `ANTHROPIC_API_KEY` als je die gebruikt

Na het toevoegen of wijzigen van variabelen: **Redeploy** (Deployments → … bij laatste deploy → Redeploy).

## 4. Controleren

1. Open de live URL (bijv. `https://jouw-project.vercel.app`) in een **incognito** venster.
2. Je zou moeten zien:
   - In de header: knop **"Account / Inloggen"** (of alleen het icoon op kleine schermen)
   - Op het welkomstscherm: link **"Account aanmaken of inloggen"**
   - In het menu (icoon rechtsboven): **"Account aanmaken / Inloggen"**
3. Klik op een van deze → het inlog-/registratiemodal zou moeten openen.

Als er een foutmelding verschijnt, controleer de browserconsole (F12) en de logs in Vercel (Deployments → laatste deploy → Functions / Logs).
