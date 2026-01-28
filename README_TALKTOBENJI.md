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
     - `NEXT_PUBLIC_CONVEX_URL` en `CONVEX_DEPLOY_KEY` (van Convex Dashboard)
     - Overige keys (bijv. Anthropic, ADMIN_PASSWORD) indien je die gebruikt.
   - **Lokaal:** run `npx convex dev` om schema en functions te deployen.
   - **Productie (Vercel):** run **`npx convex deploy`** zodat je live site de Convex-functies heeft. Zonder dit krijg je "Could not find public function for 'settings:get'" op Vercel.

4. **Logo (optioneel)**  
   De app gebruikt nu een icoon; de PWA-manifest gebruikt `public/vibetracker-logo.png`. Vervang dat bestand door je eigen logo indien gewenst.

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
