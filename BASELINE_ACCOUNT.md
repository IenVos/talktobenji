# Baseline voor account-functionaliteit

**Datum:** Januari 2026  

Dit document beschrijft het uitgangspunt vóór het toevoegen van account- en registratie-functionaliteit. Als er iets misgaat, kun je hiernaar terug.

## Terug naar dit moment

```bash
# Keer terug naar de baseline (overschrijft lokale wijzigingen)
git checkout baseline-voor-account
git checkout -b main-fix  # of: git reset --hard baseline-voor-account als je op main bent
```

Of als je een aparte branch wilt behouden:

```bash
# Maak een nieuwe branch vanaf de baseline om opnieuw te proberen
git checkout -b account-v2 baseline-voor-account
```

## Wat zit in deze baseline?

- Benji chatbot met Knowledge + Rules + Q&A knowledge base
- Admin panel (instellingen, knowledge base, analytics, bronnen)
- FAQ-pagina, privacy, algemene voorwaarden
- Convex backend, NextAuth auth-setup
- Geen accountregistratie of login voor eindgebruikers (bezoekers)

## Volgende stap

Account aanmaken mogelijk maken + klantenpagina (registratie/aanmelden).
