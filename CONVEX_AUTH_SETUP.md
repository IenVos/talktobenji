# Account aanmaken (Convex Auth) – setup

Er is **Google inloggen** toegevoegd. Om het te laten werken:

## 1. Convex Auth initialiseren (eenmalig)

In de projectmap:

```bash
npx @convex-dev/auth
```

Dit vraagt om o.a. **SITE_URL** en kan **JWT keys** genereren. Volg de instructies.

## 2. Environment variables in Convex Dashboard

Ga naar [Convex Dashboard](https://dashboard.convex.dev) → jouw project → **Settings** → **Environment Variables**.

Zet (of controleer):

- **SITE_URL** – URL van je app, bijv. `http://localhost:3000` (lokaal) of `https://talktobenji.vercel.app` (productie).
- **AUTH_GOOGLE_ID** – Google OAuth Client ID (zie hieronder).
- **AUTH_GOOGLE_SECRET** – Google OAuth Client secret.

Als `npx @convex-dev/auth` JWT keys heeft gegenereerd, plak die ook in de Convex env (zoals aangegeven in de output).

## 3. Google OAuth aanmaken

1. Ga naar [Google Cloud Console](https://console.cloud.google.com/) → **APIs & Services** → **Credentials**.
2. Maak een **OAuth 2.0 Client ID** (type “Web application”).
3. **Authorized redirect URIs**:  
   `https://<JOUW-CONVEX-DEPLOYMENT>.convex.site/api/auth/callback/google`  
   (Convex Dashboard → Settings → URL & Deploy Key → “Site URL” of deployment URL + `.site`).
4. Kopieer **Client ID** en **Client secret** naar Convex env als **AUTH_GOOGLE_ID** en **AUTH_GOOGLE_SECRET**.

Daarna kun je in de app op **Account aanmaken / Inloggen** klikken en **Doorgaan met Google** gebruiken.
