# Talk To Benji - Layout regels

## ⚠️ KRITIEK – NIET WIJZIGEN (anders werken klikken niet meer)

| Component | Waarde | Waarom |
|-----------|--------|--------|
| **HeaderBar** | `z-[9999]` | Moet boven cookiebanner, anders menu niet klikbaar |
| **CookieConsentBanner** | `z-[100]` | Onder header, boven content |
| **ChatPageClient achtergrond** | Eén div met `pointerEvents: "none"` | Achtergrond + waas gecombineerd. Geen aparte overlay-div toevoegen. |
| **ChatPageClient content** | `relative z-50`, GEEN `pointer-events` inline | Default auto is goed. Geen extra wrappers tussen main en content. |

## ⚠️ BIJ WIJZIGINGEN – voorkom klikproblemen

- **Geen extra div** tussen `<main>` en de content-div toevoegen tenzij die div GEEN pointer-events/overflow wijzigt
- **Geen `absolute inset-0`** op de content – die moet `relative` blijven (in flow) zodat footer niet overlapt
- **Achtergrond**: één div, `absolute inset-0 z-0`, `pointer-events: none`

## ⚠️ Scroll-gedrag – NIET WIJZIGEN

- **Homepage**: `mainRef.current?.scrollTo({ top: 0 })` bij `!sessionId && !isAddingOpener`
- **Chat**: `messagesEndRef.current?.scrollIntoView()` alleen wanneer er een sessie is
- **Tooltip-iconen**: alleen hover, geen onClick (welcomescreen-baseline)

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
