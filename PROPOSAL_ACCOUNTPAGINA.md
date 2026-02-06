# Voorstel: Accountpagina met zijbalk

**Datum:** Februari 2026

---

## Waarom zie ik mijn gesprek niet?

Je gesprek verschijnt alleen in **Mijn gesprekken** als:

1. **Je was ingelogd toen je het gesprek startte** – dan wordt het direct aan je account gekoppeld.
2. **Je logde in terwijl het gesprek nog open stond** – de app probeert het lopende gesprek aan je account te koppelen.

**Als je gesprek níet verschijnt, kan het zijn dat:**
- Je anoniem begon en pas later inlogde (in een andere tab of na het sluiten van de chat)
- Je in een andere browser/op een ander apparaat inlogde dan waar je chatte

**Tip:** Start een nieuw gesprek terwijl je ingelogd bent – dat gesprek hoort direct in Mijn gesprekken te verschijnen.

---

## Voorstel: Accountpagina layout

### Schets

```
┌─────────────────────────────────────────────────────────────────┐
│  [Logo]  Talk To Benji                              [Menu ⋮]    │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌──────────────┬──────────────────────────────────────────────┐│
│  │ ▐            │                                              ││
│  │ ▐  Mijn      │                                              ││
│  │ ▐  gesprekken│     [Inhoud van geselecteerde sectie]        ││
│  │ ▐            │                                              ││
│  │ ▐  ───────   │                                              ││
│  │ ▐            │                                              ││
│  │ ▐  Abonnement│                                              ││
│  │ ▐  loopt tot │                                              ││
│  │ ▐  [datum]   │                                              ││
│  │ ▐            │                                              ││
│  │ ▐  Betalingen│                                              ││
│  │ ▐            │                                              ││
│  │ ▐  ───────   │                                              ││
│  │ ▐            │                                              ││
│  │ ▐  [Afbeelding│                                              ││
│  │ ▐   product] │     bv. "Steun Benji" / webshop-item         ││
│  │ ▐            │                                              ││
│  └──────────────┴──────────────────────────────────────────────┘│
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### Linkerzijbalk (blauwe rand)

- **Blauwe rand links** – accentkleur (bijv. `border-l-4 border-primary-600`)
- **Categorieën:**
  1. **Mijn gesprekken** – link naar `/mijn-gesprekken` of inline lijst
  2. **Abonnement** – knop/tekst: *"Je abonnement loopt tot [datum]"* (of *"Geen actief abonnement"*)
  3. **Betalingen** – overzicht van betalingen / donaties
  4. **Steun Benji** – afbeelding/knop voor iets dat gebruikers kunnen kopen (donatie, merchandise, etc.)

### Rechterkant: inhoud

- Boven de zijbalk: gekozen sectie (Mijn gesprekken, Abonnement, Betalingen, Steun Benji)
- Responsive: op mobiel kan de zijbalk als dropdown/tabs onder elkaar

### Afbeelding / product

- Uploadbare afbeelding in de sidebar
- Klik leidt naar een pagina of checkout (donatie, webshop-item)
- Admin kan de afbeelding en link instellen

---

## Route-structuur

| Route | Beschrijving |
|-------|--------------|
| `/account` | Hoofdpagina account – redirect naar `/account/gesprekken` |
| `/account/gesprekken` | Mijn gesprekken (lijst) |
| `/account/abonnement` | Abonnement-status, looptijd |
| `/account/betalingen` | Overzicht betalingen |
| `/account/steun` of `/steun-benji` | Donatie / product aankoop |

---

## Technische aanpak

1. **Layout** – `app/account/layout.tsx` met zijbalk
2. **Zijbalk** – client component met links, blauwe rand
3. **Abonnement** – schema uitbreiden (users of subscription tabel) als je abonnementen wilt
4. **Betalingen** – Stripe/Mollie webhooks, opslaan in `payments` tabel
5. **Afbeelding** – Convex Storage of statisch bestand, admin instelbaar

---

## Volgorde van bouwen

1. **Account layout** – zijbalk met blauwe rand, navigatie
2. **Mijn gesprekken** – verplaatsen naar `/account/gesprekken` of als eerste sectie
3. **Abonnement-knop** – placeholder met datum (later echte abo-logica)
4. **Betalingen** – placeholder, later Stripe/Mollie
5. **Steun-afbeelding** – upload + link, admin-pagina

---

## Betaalmethode

**Stripe** – gekozen voor donaties en betalingen. Uitwerking volgt later (Stripe Checkout + webhook).

## Vragen om te verduidelijken

1. **Abonnement** – is dit een betaald abonnement of alleen een donatie/eenmalige steun?
2. **Product/afbeelding** – wat wil je verkopen? (donatie, fysiek product, digitaal?)
3. **Admin** – moet je de sidebar-afbeelding zelf kunnen wijzigen via een admin-pagina?

---

*Dit voorstel kan worden aangepast op basis van jouw feedback.*
