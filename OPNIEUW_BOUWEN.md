# Na het verwijderen van account/inlog

Alle code voor **account aanmaken** en **inloggen** is uit de app gehaald. De app werkt weer zonder NextAuth; je kunt bouwen, pushen en de PWA is weer aan in production.

## Lokaal opnieuw bouwen

Als `npm run build` faalt met een fout over `reusify` of andere modules:

1. **Schone install (aanbevolen):**
   ```bash
   rm -rf node_modules package-lock.json
   npm install
   npm run build
   ```

2. Als de **PWA-build** faalt (Terser "Unexpected early exit"), zet in `next.config.js` tijdelijk PWA weer uit in production:
   - vervang `disable: process.env.NODE_ENV === "development"` door  
     `disable: true`  
   - of voeg bovenaan toe: `const pwaEnabled = false;` en gebruik weer `!pwaEnabled` in `disable`.

## Wat is verwijderd

- NextAuth (`auth.ts`, `/api/auth/*`, ConvexAdapter)
- AuthModal, AuthModalContext, "Account aanmaken / Inloggen" in menu
- Account-prompt na N berichten, "Hi [naam] welkom terug", linkSessionToUser
- Packages: next-auth, @auth/core, bcryptjs, jose, @types/bcryptjs

## Wat blijft

- Chat met Convex, topics, welkomstscherm, spraak, suggesties
- Over Benji, Mijn gesprekken, topic-links in menu
- PWA aan in production (tenzij je die weer uitzet bij build-fouten)

## Vercel

Zet in **Environment Variables** alleen nog wat de app nodig heeft:

- `NEXT_PUBLIC_CONVEX_URL`
- `CONVEX_DEPLOY_KEY`
- `ADMIN_PASSWORD` (voor /admin)
- `ANTHROPIC_API_KEY` (voor de chatbot)

Geen AUTH_SECRET, NEXTAUTH_URL, CONVEX_AUTH_* meer nodig tot je later weer inloggen toevoegt.
