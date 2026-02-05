# Klikfunctie en layout – uitleg

## ROOT CAUSE: wijzigingen die klikken breken

**Het patroon:** Elke keer als we iets wijzigen, werken klikken niet meer. De oorzaak zit in WAT we toevoegen/aanpassen.

### Wat we NIET moeten doen bij wijzigingen

1. **Geen extra wrapper-div** tussen main en content – extra lagen kunnen stacking/pointer-events breken
2. **Geen aparte overlay-div** – achtergrond en waas zijn gecombineerd in één div (linear-gradient)
3. **Geen `absolute inset-0` op content** – content moet `relative` blijven (in flow) voor correcte footer-positie
4. **Geen `pointer-events` inline** op content tenzij nodig – default auto werkt

### Huidige structuur (niet wijzigen)

```
[Main - flex-1 overflow-y-auto relative]
  ├─ Achtergrond (absolute inset-0 z-0) – beeld + waas in linear-gradient, pointer-events: none
  └─ Content (relative z-50) – direct child van main, geen wrappers
[Footer - flex-shrink-0]
```

### Als klikken toch niet werken

- Cookiebanner: niet de oorzaak als die niet zichtbaar is
- Test: tijdelijk de achtergrond-div uitschakelen
- Controleer: geen nieuwe div met overflow/pointer-events toegevoegd?
