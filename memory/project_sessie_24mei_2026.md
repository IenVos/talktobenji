---
name: project-sessie-24mei-2026
description: Chat volledig stuk na security-commit — alle bugs gefixed, Benji-training nog open (24 mei 2026)
metadata:
  type: project
---

Alle chat-problemen uit de security-commit (c56e853) zijn opgelost en gedeployd.

**Gefixte bugs:**
- Convex ontving nooit auth-token → ConvexProvider vervangen door ConvexProviderWithAuth
- Provider-volgorde fout → SessionProvider boven ConvexClientProvider gezet
- Chat reset naar welkomstscherm → convexAuthLoading check in cleanup effect
- Leeg scherm voor ingelogde gebruikers → queries skippen tijdens convexAuthLoading
- Flikkering elke 2 seconden → convexToken gecacht in JWT callback (auth.ts), was bij elke getSession() opnieuw gegenereerd via setIssuedAt()
- Benji antwoordde Engels → taalinstructie stond achteraan de prompt en werd afgekapt, naar voren verplaatst
- Sessie-samenvattingen/admin-analyses werkten niet voor ingelogde gebruikers → internalQuery getMessagesRaw + getSessionRaw toegevoegd
- Blog FAQ-embedding werd niet herberekend na update → embedding resetten bij sync

**Why:** Alle problemen stammen uit één beveiligingscommit die auth-checks toevoegde zonder de frontend auth te laten sturen.

**Open punt: Benji-training**
Gebruiker wil morgen verder met het verbeteren van Benji's reacties. Nog niet besproken wat er precies mis gaat — dat gesprek moet nog starten.

**How to apply:** Bij volgende sessie direct beginnen met de vraag: welk gedrag van Benji stoort het meest?
