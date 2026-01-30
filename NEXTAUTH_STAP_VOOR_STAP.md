# NextAuth + Convex – Stap voor stap

Volg deze stappen **in volgorde**. Je bestaande regels in `.env.local` (zoals `NEXT_PUBLIC_CONVEX_URL`, `ANTHROPIC_API_KEY`, enz.) laat je gewoon staan; je voegt alleen **nieuwe** regels toe.

---

## Stap 1: Geheim voor de adapter (CONVEX_AUTH_ADAPTER_SECRET)

Dit geheim gebruikt NextAuth op je computer om veilig met Convex te praten. **Dezelfde waarde** moet in `.env.local` én in het Convex-dashboard staan.

### 1a. Waarde genereren

In de terminal (in de map van je project):

```bash
openssl rand -base64 33
```

Kopieer de uitkomst (één lange regel, zonder spaties).

### 1b. In .env.local zetten

Open `.env.local` en voeg **onderaan** deze regel toe (vervang `JOUW_GEHEIM_HIER` door de gegenereerde waarde):

```
CONVEX_AUTH_ADAPTER_SECRET=JOUW_GEHEIM_HIER
```

Geen aanhalingstekens, geen spaties. Bewaar het bestand.

### 1c. In Convex Dashboard zetten

1. Ga naar [dashboard.convex.dev](https://dashboard.convex.dev)
2. Kies je project (talk-to-benji-chatbot / hardy-turtle-320)
3. Links: **Settings** → **Environment Variables**
4. Klik **Add Environment Variable**
5. Name: `CONVEX_AUTH_ADAPTER_SECRET`
6. Value: **exact dezelfde** waarde als in stap 1b
7. Opslaan

---

## Stap 2: Sleutelpaar voor Convex JWT (CONVEX_AUTH_PRIVATE_KEY + JWKS)

NextAuth tekent een JWT met een **private key**; Convex controleert die met een **publieke key** (JWKS). Die twee horen bij elkaar.

### 2a. Sleutelpaar genereren

In de terminal (in de map van je project):

```bash
node scripts/generate-auth-keys.mjs
```

Het script print twee blokken:

- **Eerste blok** → dat is `CONVEX_AUTH_PRIVATE_KEY` (voor .env.local)
- **Tweede blok** → dat is `JWKS` (voor Convex Dashboard)

### 2b. Private key in .env.local

1. Kopieer het **hele** eerste blok (van `-----BEGIN PRIVATE KEY-----` tot `-----END PRIVATE KEY-----` inclusief).
2. In `.env.local`: voeg een nieuwe regel toe. De waarde moet tussen **dubbele aanhalingstekens** omdat er regeleinden in zitten:

```
CONVEX_AUTH_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----
MIIE... (alle regels) ...
...xxx
-----END PRIVATE KEY-----"
```

Zorg dat er geen spaties vóór of na de key staan en dat alle regels van de key erin zitten.

### 2c. JWKS in Convex Dashboard

1. Kopieer het **hele** tweede blok (de JSON die begint met `{"keys":[...]}`).
2. Convex Dashboard → **Settings** → **Environment Variables**
3. **Add Environment Variable**
4. Name: `JWKS`
5. Value: plak de gekopieerde JSON (één regel is het makkelijkst)
6. Opslaan

---

## Stap 3: NextAuth geheim (AUTH_SECRET)

Dit is het algemene geheim van NextAuth (cookies, etc.).

### 3a. Genereren

```bash
openssl rand -base64 32
```

### 3b. In .env.local

Onderaan in `.env.local`:

```
AUTH_SECRET=JOUW_GEHEIM_HIER
```

(weer de gegenereerde waarde, geen aanhalingstekens)

---

## Stap 4: Google inloggen (AUTH_GOOGLE_ID en AUTH_GOOGLE_SECRET)

Zonder deze werkt “Doorgaan met Google” niet.

### 4a. Google Cloud Console

1. Ga naar [console.cloud.google.com](https://console.cloud.google.com)
2. Maak een project aan of kies een bestaand project
3. Menu links: **APIs & Services** → **Credentials**
4. **Create Credentials** → **OAuth client ID**
5. Application type: **Web application**
6. Name: bijv. “TalkToBenji”
7. **Authorized JavaScript origins**:
   - Lokaal: `http://localhost:3000`
   - Later voor productie: bijv. `https://jouwdomein.nl`
8. **Authorized redirect URIs**:
   - Lokaal: `http://localhost:3000/api/auth/callback/google`
   - Productie: `https://jouwdomein.nl/api/auth/callback/google`
9. Create → je krijgt een **Client ID** en **Client Secret**

### 4b. In .env.local

Voeg toe (vervang door jouw echte waarden):

```
AUTH_GOOGLE_ID=xxxx.apps.googleusercontent.com
AUTH_GOOGLE_SECRET=GOCSPX-xxxx
```

Geen aanhalingstekens nodig tenzij er spaties in zitten.

---

## Controlelijst

- [ ] `CONVEX_AUTH_ADAPTER_SECRET` in `.env.local` (stap 1b)
- [ ] `CONVEX_AUTH_ADAPTER_SECRET` in Convex Dashboard (stap 1c)
- [ ] `CONVEX_AUTH_PRIVATE_KEY` in `.env.local` (stap 2b)
- [ ] `JWKS` in Convex Dashboard (stap 2c)
- [ ] `AUTH_SECRET` in `.env.local` (stap 3b)
- [ ] `AUTH_GOOGLE_ID` en `AUTH_GOOGLE_SECRET` in `.env.local` (stap 4b)

---

## Daarna

- Convex dev opnieuw starten als die draait: `npx convex dev`
- Next.js opnieuw starten: `npm run dev`
- In de app: menu → “Account aanmaken / Inloggen” → “Doorgaan met Google” proberen

Als er een foutmelding komt, noteer die (en of die in de browser of in de terminal staat); dan kunnen we gericht kijken zonder je code te veranderen.
