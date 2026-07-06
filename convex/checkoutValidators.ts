import { v } from "convex/values";

/**
 * Validator voor de "rustige" checkout-layout (variant voor verdriet/rouw).
 * Bewust rustig: geen sales-trucs, veel witruimte, herkenning i.p.v. verkoop.
 * Gedeeld tussen schema.ts en checkoutProducts.ts (create/update) zodat de vorm
 * op één plek staat. Alle velden optioneel → een product kan deels ingevuld zijn.
 */
export const rustigeContentValidator = v.object({
  // Sectie 1 — Hero (boven de vouw)
  hero: v.optional(
    v.object({
      imageStorageId: v.optional(v.id("_storage")),
      titel: v.optional(v.string()),
      subtitel: v.optional(v.string()),
      intro: v.optional(v.string()),
      bullets: v.optional(v.array(v.string())),
      prijsLabel: v.optional(v.string()),
      buttonText: v.optional(v.string()),
      buttonEnabled: v.optional(v.boolean()),
      buttonColor: v.optional(v.string()),
    })
  ),
  // Sectie 2 — Wat je krijgt (met voorbeeld-prompts)
  watJeKrijgt: v.optional(
    v.object({
      imageStorageId: v.optional(v.id("_storage")),
      titel: v.optional(v.string()),
      tekst: v.optional(v.string()),
      bullets: v.optional(v.array(v.string())),
      prompts: v.optional(
        v.array(v.object({ dag: v.string(), vraag: v.string() }))
      ),
    })
  ),
  // Sectie 3 — Herkenning
  herkenning: v.optional(
    v.object({
      imageStorageId: v.optional(v.id("_storage")),
      quote: v.optional(v.string()),
      intro: v.optional(v.string()),
      bullets: v.optional(v.array(v.string())),
      slot: v.optional(v.string()),
    })
  ),
  // Sectie 4 — Reviews: titel hier, de reviews zelf hergebruiken het bestaande `reviews`-veld
  reviewsTitel: v.optional(v.string()),
  // Sectie 5 — Persoonlijk verhaal Benji
  benjiVerhaal: v.optional(
    v.object({
      imageStorageId: v.optional(v.id("_storage")),
      titel: v.optional(v.string()),
      tekst: v.optional(v.string()),
    })
  ),
  // Sectie 6 — Veiligheid vlak boven de laatste knop
  veiligheid: v.optional(
    v.object({
      bullets: v.optional(v.array(v.string())),
      buttonText: v.optional(v.string()),
      buttonEnabled: v.optional(v.boolean()),
      buttonColor: v.optional(v.string()),
    })
  ),
  // Sectie 7 — FAQ
  faq: v.optional(
    v.array(v.object({ vraag: v.string(), antwoord: v.string() }))
  ),
  // Volgorde van de secties (sleutels: hero, watJeKrijgt, herkenning, benjiVerhaal,
  // veiligheid, reviews, betaalblok, extra, faq). Ontbrekende sleutels worden
  // achteraan in standaardvolgorde aangevuld.
  sectionOrder: v.optional(v.array(v.string())),
  // Secties die uit staan (aan/uit-vinkje). Betaalblok kan niet uit.
  hiddenSections: v.optional(v.array(v.string())),
});
