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
- **`NEXTAUTH_URL`** – **exact je live URL** (bijv. `https://www.talktobenji.com`). Moet overeenkomen met het domein waar gebruikers op inloggen. Geen slash aan het eind.
- **`AUTH_SECRET`** – voor NextAuth (bijv. `openssl rand -base64 32`)
- **`AUTH_TRUST_HOST`** – zet op `true` voor Vercel productie (session/cookies)
- Voor login: ook `CONVEX_AUTH_ADAPTER_SECRET`, `CONVEX_AUTH_PRIVATE_KEY` (zie `.env.example`)

---

## 4. Manifest 404

Als je `manifest.webmanifest 404` ziet: er staat nu een statisch bestand in `public/manifest.webmanifest`. Na een nieuwe deploy zou die fout weg moeten zijn.

---

## 5. Inloggen werkt niet / dashboard niet bereikbaar

Als je na inloggen terugkomt op "Log in om je account te bekijken":

1. **`NEXTAUTH_URL`** moet **exact** overeenkomen met je live URL:
   - Zit je op `https://www.talktobenji.com` → `NEXTAUTH_URL=https://www.talktobenji.com`
   - Zit je op `https://talktobenji.com` (zonder www) → `NEXTAUTH_URL=https://talktobenji.com`
2. **`AUTH_SECRET`** moet gezet zijn in Vercel
3. Na wijziging: opnieuw deployen op Vercel

---

## Samenvatting

| Probleem | Oplossing |
|----------|-----------|
| Bot geeft geen antwoord | `ANTHROPIC_API_KEY` in Convex Dashboard → Production |
| Manifest 404 | Statisch `manifest.webmanifest` toegevoegd – opnieuw deployen |
| Admin werkt niet | `ADMIN_PASSWORD` in Vercel Environment Variables |
| Inloggen/dashboard werkt niet | `NEXTAUTH_URL` + `AUTH_SECRET` correct in Vercel, overeenkomstig je live domein |
