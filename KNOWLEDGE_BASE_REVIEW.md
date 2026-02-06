# Knowledge Base Review – 2026-02-06

## Samenvatting
- **Totaal Q&As:** 66
- **Streepjes opgeschoond:** 45 Q&As
- **Mogelijke dubbele/overlappende vragen:** 23 paren

## Streepjes verwijderd
De volgende patronen zijn vervangen: ` - ` → `, ` in alle vraag-, antwoord- en alternatieven-teksten.

## Mogelijke dubbele of overlappende Q&As
Overweeg om deze te combineren of de ene te laten verwijzen naar de andere:

### 1. Overlap ~67%
- **A:** Wat kan ik zeggen tegen iemand die een miskraam heeft gehad?
- **B:** Wat kan ik zeggen tegen iemand die een dierbare heeft verloren?

### 2. Overlap ~67%
- **A:** Hoe herdenk ik mijn overleden moeder?
- **B:** Hoe ga ik om met het verlies van mijn moeder?

### 3. Overlap ~75%
- **A:** Hoe kan ik mijn overleden huisdier herdenken?
- **B:** Hoe kan ik mijn overleden dierbare herdenken?

### 4. Overlap ~67%
- **A:** Hoe kan ik omgaan met het verlies van mijn huisdier?
- **B:** Hoe ga ik om met het verlies van mijn moeder?

### 5. Overlap ~67%
- **A:** Hoe kan ik omgaan met het verlies van mijn huisdier?
- **B:** Hoe ga ik om met het verlies van mijn vader?

### 6. Overlap ~67%
- **A:** Is het normaal om intens te rouwen om het verlies van mijn hond?
- **B:** Hoe ga ik om met het verlies van mijn moeder?

### 7. Overlap ~67%
- **A:** Is het normaal om intens te rouwen om het verlies van mijn hond?
- **B:** Hoe ga ik om met het verlies van mijn vader?

### 8. Overlap ~75%
- **A:** Hoe kan muziek helpen bij het verwerken van verdriet?
- **B:** Hoe kan de natuur helpen bij het verwerken van verdriet?

### 9. Overlap ~67%
- **A:** Hoe ga ik om met de eerste Vaderdag zonder mijn vader?
- **B:** Hoe ga ik om met het verlies van mijn vader?

### 10. Overlap ~67%
- **A:** Hoe ga ik om met de eerste Moederdag zonder mijn moeder?
- **B:** Hoe ga ik om met het verlies van mijn moeder?

### 11. Overlap ~67%
- **A:** Hoe kan ik stoppen met piekeren over mijn verlies?
- **B:** Hoe ga ik om met het verlies van mijn moeder?

### 12. Overlap ~67%
- **A:** Hoe kan ik stoppen met piekeren over mijn verlies?
- **B:** Hoe ga ik om met het verlies van mijn vader?

### 13. Overlap ~67%
- **A:** Kan mindfulness helpen als ik niet kan slapen door verdriet?
- **B:** Hoe kan mindfulness helpen bij rouw?

### 14. Overlap ~100%
- **A:** Kan mindfulness helpen als ik niet kan slapen door verdriet?
- **B:** Wat is mindfulness?

### 15. Overlap ~100%
- **A:** Hoe begin ik met mindfulness?
- **B:** Wat is mindfulness?

### 16. Overlap ~67%
- **A:** Wat zijn de 7 pijlers van mindfulness?
- **B:** Wat zijn de voordelen van mindfulness bij rouw?

### 17. Overlap ~100%
- **A:** Wat zijn de 7 pijlers van mindfulness?
- **B:** Wat is mindfulness?

### 18. Overlap ~67%
- **A:** Wat zijn de voordelen van mindfulness bij rouw?
- **B:** Hoe kan mindfulness helpen bij rouw?

### 19. Overlap ~100%
- **A:** Wat zijn de voordelen van mindfulness bij rouw?
- **B:** Wat is mindfulness?

### 20. Overlap ~100%
- **A:** Hoe kan mindfulness helpen bij rouw?
- **B:** Wat is mindfulness?

... en 3 andere paren.

## Hoe de opschoning toepassen

### Optie 1: Streepjes verwijderen via Admin (aanbevolen)
1. Ga naar **Admin → Knowledge Base**
2. Klik op **"Streepjes verwijderen"** (naast Export)
3. Hiermee worden alle ` - ` en ` – ` in bestaande Q&As vervangen door `, ` op de server

### Optie 2: Volledige herimport met opgeschoonde data
1. Het bestand `knowledge-base-cleaned.json` is klaar voor import
2. Ga naar **Admin → Knowledge Base → Bulk Import**
3. Plak de inhoud van `knowledge-base-cleaned.json`
4. **Let op:** Dit voegt NIEUWE Q&As toe. Bestaande worden niet automatisch verwijderd. Als je wilt vervangen, verwijder eerst de oude via de admin of via Convex Dashboard

## Aanbevelingen
1. **Mindfulness Q&As:** Er zijn 5+ vragen over mindfulness die sterk overlappen ("Wat is mindfulness?", "Hoe kan mindfulness helpen bij rouw?", "Wat zijn de voordelen?", etc.). Overweeg deze te consolideren tot 2–3 Q&As.
2. **alternativeAnswers:** Veel Q&As hebben 4–5 alternatieve antwoorden die bijna hetzelfde zeggen. Overweeg dit terug te brengen naar 1–2 per Q&A voor kortere, duidelijkere antwoorden.
3. **Verlies-specifieke vragen:** Vragen als "Hoe ga ik om met verlies van moeder/vader/huisdier/baby" hebben elk hun eigen context. Houd ze apart, maar controleer of de antwoorden niet te veel overlap hebben.
