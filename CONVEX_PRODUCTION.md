# Convex: Development vs Production (TalkToBenji)

In dit project heb je **twee** deployments:
- **Development:** opulent-anteater-171 (voor lokaal `npx convex dev`)
- **Production:** hardy-turtle-320 (voor live app en Vercel)

Gebruik **hardy-turtle-320** voor productie (Vercel + `npx convex deploy`).

## Waarom "prod:" ervoor zetten niet werkt

De key die je in het dashboard maakt is een **development key** (`dev:...`). Die key is **in zijn geheel** voor je development deployment. Als je er handmatig `prod:` voor zet, verandert de **rest van de key** niet: het token/de payload blijft een development-key. Convex kijkt naar de hele key en ziet dan nog steeds een dev-key, dus die wordt (of blijft) als `dev:` behandeld. Je kunt van een dev-key geen prod-key maken door alleen het voorvoegsel te veranderen.

## Wat je wél moet doen

Elk Convex-project heeft **twee** deployments:

1. **Development** – voor lokaal werk (`npx convex dev`). URL zoals: `opulent-anteater-171.convex.cloud` (vaak deze in je .env.local).
2. **Production** – voor je live app (Vercel). Heeft een **eigen** deploy key.

Je moet een **production deploy key** genereren bij de **production** deployment, niet bij de development deployment.

## Stappen voor Production (hardy-turtle-320)

1. Ga naar **[dashboard.convex.dev](https://dashboard.convex.dev)** → project **Talk-to-benji-chatbot**.
2. Selecteer rechtsboven **Production • hardy-turtle-320** (niet Development • opulent-anteater-171).
3. Ga naar **Settings** → **Deploy Keys**.
4. Klik op **"Generate Production Deploy Key"**.
5. Kopieer de key (begint met `prod:hardy-turtle-320|...`).
6. **Voor Vercel:** zet in Vercel Environment Variables:
   - `NEXT_PUBLIC_CONVEX_URL` = `https://hardy-turtle-320.convex.cloud`
   - `CONVEX_DEPLOY_KEY` = de gekopieerde prod-key
7. **Lokaal voor deploy:** in `.env.local` tijdelijk dezelfde waarden als hierboven, dan `npx convex deploy` runnen.
8. **Lokaal voor development:** gebruik `opulent-anteater-171` en je dev-key (zoals nu) voor `npx convex dev`.

## Als je alleen "Development Deploy Key" ziet

Dan kijk je waarschijnlijk naar de **Development**-deployment. Ga één niveau terug (naar het overzicht van je project of naar **Deployments**) en kies expliciet de **Production**-deployment. De production deploy key maak je alleen bij die deployment aan.

## Samenvatting

- **dev:** = key voor development deployment (lokaal/test).
- **prod:** = key voor production deployment (live/Vercel).
- Je kunt een dev-key niet omzetten naar een prod-key door er `prod:` voor te zetten.
- Gebruik in het dashboard de **Production**-deployment en genereer daar een **Production** deploy key; die gebruik je als `CONVEX_DEPLOY_KEY` voor `npx convex deploy` en Vercel.
