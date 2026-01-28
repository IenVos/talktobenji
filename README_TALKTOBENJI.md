# TalkToBenji – kopie van vibe-chatbot

Dit project is een kopie van **vibe-chatbot** met branding aangepast naar **TalkToBenji**.

## Volgende stappen

1. **Project verplaatsen (optioneel)**  
   Als je talktobenji als apart project naast vibe-chatbot wilt:
   - Verplaats de map `talktobenji` naar de gewenste plek (bijv. `com~apple~CloudDocs/talktobenji`).
   - Open die map in Cursor als nieuw project.

2. **Dependencies installeren**
   ```bash
   cd talktobenji
   npm install
   ```

3. **Convex voor TalkToBenji**
   - Maak een **nieuw** Convex-project op [convex.dev](https://convex.dev) voor TalkToBenji (of koppel een bestaand project).
   - Maak `.env.local` met o.a.:
     - `CONVEX_DEPLOY_KEY` of `NEXT_PUBLIC_CONVEX_URL`
     - Overige keys (bijv. Anthropic) indien je die gebruikt.
   - Run: `npx convex dev` om schema en functions te deployen.

4. **Logo (optioneel)**  
   Er wordt nog het oude logo gebruikt: `public/talktobenji-logo.png`.  
   Vervang dit bestand door je eigen logo (bijv. `talktobenji-logo.png`) en pas in de app de `src` van de `<Image>`-componenten aan naar het nieuwe bestand.

5. **Development starten**
   ```bash
   npm run dev
   ```
   Chatbot staat op http://localhost:3000.

## Wat is aangepast t.o.v. vibe-chatbot

- Projectnaam: `talktobenji`
- Tekst en branding: VibeTracker → TalkToBenji, vibetracker.com → talktobenji.com
- Geen `.env.local`, `node_modules` of `.git` gekopieerd (schone start)

Vibe-chatbot zelf is ongewijzigd.
