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
- **Positie**: `fixed`, rechts in de header
- **Style**: `right: max(0.75rem, env(safe-area-inset-right))`
- **Verticaal**: `top: max(1.25rem, calc(env(safe-area-inset-top) + 1rem))` - in het midden van de header

## ChatPageClient content
- **Main content**: `max-w-3xl mx-auto` - gecentreerd op de pagina
- **Geen** `text-left` of `items-start` op de content wrapper - dit breekt centering van WelcomeScreen
