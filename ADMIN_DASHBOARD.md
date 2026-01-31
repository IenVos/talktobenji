# Admin dashboard – wat je nodig hebt

Overzicht van wat je in het admin panel moet doen om de chatbot goed te laten werken, en wat je eventueel nog kunt toevoegen.

---

## Wat je nu hebt

| Pagina | Wat het doet |
|--------|----------------|
| **Instellingen** (`/admin`) | Knowledge (algemene kennis) en Rules (hoe de bot moet antwoorden). Worden gebruikt in elk AI-antwoord. |
| **Knowledge Base** (`/admin/knowledge`) | Q&A’s toevoegen, bewerken, importeren. De bot gebruikt deze voor concrete vragen. |

---

## Wat je moet doen om alles te laten werken

### 1. Instellingen invullen (verplicht)

- Ga naar **Instellingen** (`/admin`).
- Vul **Knowledge** in: wie is Benji, wat is het doel, in welke taal.
- Vul **Rules** in: toon, gedragsregels, wanneer doorverwijzen (bijv. 113, huisarts).
- Klik op **Opslaan**.

Zonder opgeslagen instellingen heeft de AI weinig context.

### 2. Q&A’s in de Knowledge Base (verplicht voor inhoudelijke antwoorden)

- Ga naar **Knowledge Base** (`/admin/knowledge`).
- Voeg minstens een paar Q&A’s toe (vraag + antwoord + categorie).
- Zonder Q&A’s zegt de bot: *"Er is nog geen informatie in de knowledge base."*

Tip: gebruik **Bulk Import** (JSON) als je veel Q&A’s tegelijk wilt toevoegen.

### 3. API-sleutel voor AI (verplicht voor echte antwoorden)

- Ga naar [Convex Dashboard](https://dashboard.convex.dev) → jouw project.
- **Settings** → **Environment Variables**.
- Voeg toe: `ANTHROPIC_API_KEY` = je sleutel van [console.anthropic.com](https://console.anthropic.com/).
- Zonder deze key kunnen er geen AI-antwoorden gegenereerd worden.

### 4. Admin-wachtwoord (lokaal / productie)

- In `.env.local`: `ADMIN_PASSWORD=...` (voor lokaal).
- Op Vercel: **Environment Variables** → `ADMIN_PASSWORD` (voor productie).

---

## Status op de Instellingen-pagina

Op **Instellingen** staat nu een blok **Status & configuratie**:

- Of instellingen zijn opgeslagen.
- Hoeveel Q&A’s actief zijn + link naar Knowledge Base.
- Herinnering om `ANTHROPIC_API_KEY` in Convex in te stellen.

Daarmee zie je in één oogopslag of de basis goed staat.

---

## Wat je later kunt toevoegen (backend is er al)

De Convex-backend heeft al functies voor het volgende; er zijn alleen nog geen admin-pagina’s voor:

| Mogelijke pagina | Doel |
|------------------|------|
| **Gesprekken / Sessies** | Recente chats bekijken (alleen lezen) om te zien wat gebruikers vragen en de Q&A’s te verbeteren. |
| **Escalaties** | Gesprekken die naar een mens doorgestuurd zijn beheren (status, toewijzen, afsluiten). |
| **Feedback** | Gebruikersfeedback (bug, suggestie, compliment) bekijken en eventueel beantwoorden. |
| **Analytics** | Statistieken: aantal sessies, berichten, gemiddelde duur, meest gebruikte Q&A’s. |

Als je een van deze pagina’s wilt, kan er een eenvoudige admin-pagina bij gebouwd worden die de bestaande Convex-queries/mutations gebruikt.

---

## Samenvatting

**Minimaal om de chatbot goed te laten werken:**

1. Instellingen invullen en opslaan.
2. Minimaal enkele Q&A’s in de Knowledge Base.
3. `ANTHROPIC_API_KEY` in Convex Environment Variables.
4. `ADMIN_PASSWORD` in `.env.local` (lokaal) en/of Vercel (productie).

Daarna kun je optioneel nog pagina’s voor gesprekken, escalaties, feedback of analytics toevoegen.
