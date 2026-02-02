# Deployment checklist – productie (Vercel)

Als de bot geen antwoord geeft op de live site, controleer het volgende:

---

## 1. ANTHROPIC_API_KEY in Convex (belangrijkste oorzaak)

De AI draait op **Convex**, niet op Vercel. De API-sleutel moet dus in het **Convex Dashboard** staan:

1. Ga naar [dashboard.convex.dev](https://dashboard.convex.dev)
2. Kies je project (TalkToBenji)
3. **Settings** → **Environment Variables**
4. Voeg toe: `ANTHROPIC_API_KEY` = `sk-ant-api03-...` (van [console.anthropic.com](https://console.anthropic.com/))
5. Kies **Production** (niet Development)
6. Sla op

**Let op:** `.env.local` wordt alleen lokaal gebruikt. Voor productie (Vercel) moet de key in Convex staan.

Na het toevoegen: Convex herstart automatisch. Test de chat opnieuw.

---

## 2. Convex deployen vóór Git push

Als je Convex-bestanden hebt gewijzigd:

```bash
npm run deploy:convex
```

Daarna pas pushen naar Git (zodat Vercel deployt).

---

## 3. Vercel environment variables

Voor de frontend (Next.js) heb je nodig:

- `NEXT_PUBLIC_CONVEX_URL` – staat meestal al via Convex/Vercel-integratie
- `ADMIN_PASSWORD` – voor toegang tot `/admin`

---

## 4. Manifest 404

Als je `manifest.webmanifest 404` ziet: er staat nu een statisch bestand in `public/manifest.webmanifest`. Na een nieuwe deploy zou die fout weg moeten zijn.

---

## Samenvatting

| Probleem | Oplossing |
|----------|-----------|
| Bot geeft geen antwoord | `ANTHROPIC_API_KEY` in Convex Dashboard → Production |
| Manifest 404 | Statisch `manifest.webmanifest` toegevoegd – opnieuw deployen |
| Admin werkt niet | `ADMIN_PASSWORD` in Vercel Environment Variables |
