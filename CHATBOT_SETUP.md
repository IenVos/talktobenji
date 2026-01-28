# TalkToBenji Support Chatbot - Database Schema ✅

## Wat is er zojuist gebouwd?

Je hebt nu een compleet database schema voor je AI support chatbot! Dit is de basis waarop alles gebouwd wordt.

---

## 📁 Bestanden die zijn aangemaakt

### 1. `convex/schema.ts`
Dit is het belangrijkste bestand. Het definieert 6 database tabellen:

#### **📚 knowledgeBase** - Je Q&A kennisbank
- Bevat alle vragen en antwoorden
- Heeft categorieën en tags voor organisatie
- Houdt bij hoe vaak elke Q&A gebruikt wordt
- Kan alternatieve vraagformuleringen opslaan

#### **💬 chatSessions** - Chat sessies
- Elke keer dat iemand de chat opent = nieuwe sessie
- Houdt status bij (actief, opgelost, geëscaleerd)
- Slaat gebruiker info op (optioneel)
- Bewaart ratings en feedback

#### **📨 chatMessages** - Individuele berichten
- Elk bericht (van gebruiker of bot) wordt opgeslagen
- Houdt bij welke Q&A gebruikt is voor het antwoord
- Slaat "confidence score" op (hoe zeker de AI was)
- Bevat metadata over AI gebruik (tokens, responstijd)

#### **⚠️ escalations** - Doorverwijzingen naar mensen
- Wanneer de bot het niet weet, wordt dit hier opgeslagen
- Verschillende redenen (geen match, te complex, klacht)
- Priority levels (low, medium, high, urgent)
- Kan toegewezen worden aan support agents

#### **⭐ userFeedback** - Algemene feedback
- Gebruikers kunnen feedback geven
- Types: bug, suggestie, compliment, klacht, feature request
- Kan gevolgd worden door admins

#### **📊 analytics** - Dagelijkse statistieken
- Automatisch gegenereerde statistieken per dag
- Aantal chats, berichten, resoluties
- Gemiddelde scores en populairste vragen
- Perfect voor monitoring en verbetering

### 2. `convex/exampleData.ts`
Voorbeelden van hoe je data eruit ziet in elke tabel. Super handig om te begrijpen hoe alles werkt!

---

## 🚀 Volgende stappen om de chatbot werkend te krijgen

### STAP 1: Convex Development omgeving starten

```bash
npx convex dev
```

Dit commando:
- Start een lokale development server
- Maakt een Convex project aan (als je dit nog niet hebt)
- Genereert TypeScript types voor je schema
- Synchroniseert je schema met de cloud

⚠️ **Eerste keer?** Je wordt gevraagd om in te loggen bij Convex. Volg de instructies in je terminal.

---

### STAP 2: Basis Convex functies maken

Je moet functies maken om met de database te praten. Maak deze bestanden:

#### `convex/knowledgeBase.ts` - Functies voor Q&A beheer
```typescript
// Voorbeelden:
// - addQuestion (nieuwe Q&A toevoegen)
// - getQuestions (alle Q&As ophalen)
// - searchQuestions (zoeken in Q&As)
// - updateQuestion (Q&A bijwerken)
// - deleteQuestion (Q&A verwijderen)
```

#### `convex/chat.ts` - Chat functionaliteit
```typescript
// Voorbeelden:
// - startSession (nieuwe chat starten)
// - sendMessage (bericht versturen)
// - getMessages (berichten ophalen)
// - endSession (chat afsluiten)
```

#### `convex/admin.ts` - Admin functies
```typescript
// Voorbeelden:
// - getAnalytics (statistieken ophalen)
// - getEscalations (doorverwijzingen bekijken)
// - getFeedback (feedback ophalen)
```

---

### STAP 3: Je bestaande Q&As importeren

Je zei dat je al veel Q&As hebt verzameld in Claude. Die moeten in de database:

#### Optie A: Handmatig via admin interface (later te bouwen)
Je maakt straks een admin pagina waar je Q&As kunt toevoegen

#### Optie B: Bulk import via script
Maak een bestand `convex/seedKnowledgeBase.ts` om veel Q&As tegelijk toe te voegen

---

### STAP 4: Next.js app opzetten

Je hebt nog geen Next.js app. Die moet je maken:

```bash
# Ga naar parent directory
cd ..

# Maak nieuwe Next.js app
npx create-next-app@latest talktobenji

# Kies tijdens setup:
# ✅ TypeScript: Yes
# ✅ ESLint: Yes
# ✅ Tailwind CSS: Yes
# ✅ App Router: Yes
# ✅ Import alias: Yes (@/*)
```

---

### STAP 5: Convex koppelen aan Next.js

```bash
cd talktobenji
npm install convex
npx convex dev
```

Volg de instructies om Convex te koppelen aan je Next.js app.

---

### STAP 6: Claude API setup

Je hebt Claude Pro, maar voor de API heb je een apart account nodig:

1. Ga naar https://console.anthropic.com/
2. Maak een API key aan
3. Voeg toe aan je `.env.local`:

```
ANTHROPIC_API_KEY=sk-ant-...
```

4. Installeer de SDK:

```bash
npm install @anthropic-ai/sdk
```

---

## 💡 Concepten die je moet begrijpen

### 1. **Convex Mutations vs Queries**

**Query** = Data ophalen (lezen)
- Voorbeelden: getMessages, searchQuestions
- Gebruikers kunnen queries cachen
- Super snel

**Mutation** = Data wijzigen (schrijven)
- Voorbeelden: sendMessage, addQuestion
- Wijzigt de database
- Kan queries automatisch updaten (realtime!)

### 2. **Indexes - Waarom ze belangrijk zijn**

Zonder index:
```typescript
// LANGZAAM - moet ALLE berichten checken
const messages = await db.query("chatMessages")
  .filter(q => q.eq(q.field("sessionId"), sessionId))
  .collect();
```

Met index:
```typescript
// SNEL - gebruikt index om direct te vinden
const messages = await db.query("chatMessages")
  .withIndex("by_session", q => q.eq("sessionId", sessionId))
  .collect();
```

### 3. **TypeScript Types**

Convex genereert automatisch types voor je! Bijvoorbeeld:

```typescript
import { Doc, Id } from "./_generated/dataModel";

// Dit geeft je een volledig getypeerd chat message object
type ChatMessage = Doc<"chatMessages">;

// Dit geeft je een geldig ID voor een chat sessie
type SessionId = Id<"chatSessions">;
```

---

## 📋 Je huidige status

✅ **Klaar:**
- Database schema volledig opgezet
- 6 tabellen gedefinieerd
- Indexes toegevoegd voor snelheid
- Voorbeelddata voor begrip

⏳ **Nog te doen:**
1. Convex dev omgeving starten
2. Basis functies maken (mutations & queries)
3. Next.js app opzetten
4. Chat UI bouwen
5. Claude API integreren
6. Q&As importeren
7. Admin interface bouwen

---

## 🤔 Hulp nodig?

### Veelgestelde vragen:

**Q: Moet ik alle 6 tabellen meteen gebruiken?**
A: Nee! Begin met `knowledgeBase`, `chatSessions` en `chatMessages`. De rest kun je later toevoegen.

**Q: Hoe test ik of mijn schema werkt?**
A: Run `npx convex dev` en ga naar de Convex dashboard. Daar kun je handmatig data toevoegen en bekijken.

**Q: Kan ik het schema later aanpassen?**
A: Ja! Je kunt altijd velden toevoegen. Verwijderen is ook mogelijk, maar wees voorzichtig met bestaande data.

**Q: Hoeveel kost Convex?**
A: Convex heeft een gratis tier (prima voor development). Daarna betaal je per usage.

---

## 🎯 Wat je nu moet doen

Kies één van deze opties:

### Optie A: Snel prototypen (aanbevolen voor beginners)
1. Run `npx convex dev`
2. Voeg handmatig 5-10 Q&As toe via Convex dashboard
3. Test of alles werkt
4. Dan pas code schrijven

### Optie B: Meteen doorpakken
1. Vraag mij om de basis Convex functies te maken
2. Ik bouw `knowledgeBase.ts` en `chat.ts` voor je
3. Dan kun je testen met echte code

### Optie C: Stap-voor-stap met uitleg
1. Ik leg elke stap uit
2. We bouwen alles samen
3. Jij leert precies hoe het werkt

**Wat wil jij? Laat het me weten!**

---

## 📚 Handige resources

- [Convex Docs](https://docs.convex.dev/)
- [Anthropic API Docs](https://docs.anthropic.com/)
- [Next.js Docs](https://nextjs.org/docs)

---

**Gemaakt op:** ${new Date().toLocaleDateString('nl-NL')}
**Status:** ✅ Stap 1 van 6 voltooid
