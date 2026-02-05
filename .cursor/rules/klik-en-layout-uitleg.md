# Klikfunctie en layout – uitleg

## Mogelijke oorzaken als klikken niet werken

**Let op:** De cookiebanner is NIET de oorzaak als je die niet ziet (bijv. op localhost na eerder accepteren). De banner verschijnt alleen als je nog geen cookies hebt geaccepteerd.

### 1. **Achtergrond/overlay blokkeert**
De achtergrond en witte waas hebben `pointer-events: none`. Als een browser dat niet goed toepast, kunnen ze alsnog klikken blokkeren. Test: tijdelijk de overlay uitschakelen om te zien of klikken dan werken.

### 2. **Z-index / stacking**
De content heeft `z-50`, de overlay `z-0`. De content hoort bovenop te liggen. Als dat niet zo is, kan er een stacking-context probleem zijn.

### 3. **Mobiel / touch / PWA**
- `touch-action: manipulation` is toegevoegd tegen 300ms vertraging
- Sommige PWA’s of browsers gedragen zich anders met touch
- Test in een andere browser of incognito

### 4. **Convex / loading**
Als Convex nog laadt, kan de app in een vreemde staat zitten. Controleer de console op errors.

### 5. **Footer vs. content**
De footer staat in de flow onder de main. De content gebruikt `relative` zodat de footer niet over de content heen komt.

## Layout-structuur

```
[HeaderBar - sticky z-9999]
[Main - flex-1, overflow-y-auto]
  ├─ Achtergrond (absolute z-0, pointer-events: none)
  ├─ Overlay/waas (absolute z-0, pointer-events: none)
  └─ Content (relative z-50, pointer-events: auto)
[Footer - flex-shrink-0]
```
