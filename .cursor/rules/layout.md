# Talk To Benji - Layout regels

## Waarom dit bestand?
Layout- en centeringproblemen komen vaak terug. Dit bestand documenteert de afgesproken patronen zodat wijzigingen consistent blijven.

## WelcomeScreen
- **Container**: `w-full flex flex-col items-center justify-center text-center`
- **Tekstblokken**: `max-w-xl mx-auto` - breed genoeg, gecentreerd
- **Elke paragraaf**: `text-center` expliciet voor zekerheid
- **TopicButtons wrapper**: `flex flex-col items-center` voor centering

## TopicButtons
- **Container**: `max-w-xs sm:max-w-sm mx-auto` - responsive breedte, gecentreerd
- **Buttons**: `text-left` binnen de knop (icon + tekst links), maar container is gecentreerd

## GlobalMenu
- **Chatpagina**: In de sticky header, rechts, verticaal gecentreerd (`embedded` prop). Beweegt mee met de header.
- **Overige pagina's** (privacy, algemene voorwaarden): `fixed` rechtsboven via LayoutMenu

## ChatPageClient content
- **Main content**: `max-w-3xl mx-auto` - gecentreerd op de pagina
- **Geen** `text-left` of `items-start` op de content wrapper - dit breekt centering van WelcomeScreen
