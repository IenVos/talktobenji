import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { api } from "./_generated/api";
import { checkAdmin } from "./adminAuth";

/** Admin: alle blogposts */
export const list = query({
  args: { adminToken: v.string() },
  handler: async (ctx, args) => {
    await checkAdmin(ctx, args.adminToken);
    const posts = await ctx.db.query("blogPosts").order("desc").collect();
    return await Promise.all(posts.map(async (p) => ({
      ...p,
      coverImageUrl: p.coverImageStorageId
        ? await ctx.storage.getUrl(p.coverImageStorageId).catch(() => null)
        : null,
    })));
  },
});

/** Publiek: gepubliceerde posts (publishedAt <= nu, isLive = true) */
export const listPublished = query({
  args: {},
  handler: async (ctx) => {
    const now = Date.now();
    const posts = await ctx.db.query("blogPosts")
      .filter((q) => q.eq(q.field("isLive"), true))
      .collect();
    const published = posts.filter((p) => !p.publishedAt || p.publishedAt <= now);
    published.sort((a, b) => (b.publishedAt ?? b.createdAt) - (a.publishedAt ?? a.createdAt));
    return await Promise.all(published.map(async (p) => ({
      ...p,
      coverImageUrl: p.coverImageStorageId
        ? await ctx.storage.getUrl(p.coverImageStorageId).catch(() => null)
        : null,
    })));
  },
});

/** Publiek: lichte dataset voor "Lees ook" kaartjes (slug, title, coverImageUrl) */
export const listCovers = query({
  args: {},
  handler: async (ctx) => {
    const now = Date.now();
    const posts = await ctx.db.query("blogPosts")
      .filter((q) => q.eq(q.field("isLive"), true))
      .collect();
    const published = posts.filter((p) => !p.publishedAt || p.publishedAt <= now);
    return await Promise.all(published.map(async (p) => ({
      slug: p.slug,
      title: p.title,
      coverImageUrl: p.coverImageStorageId
        ? await ctx.storage.getUrl(p.coverImageStorageId).catch(() => null)
        : null,
    })));
  },
});

/** Publiek: lichte dataset voor auto-linking (slug, title, pillarSlug, anchorPhrases) */
export const listAnchorData = query({
  args: {},
  handler: async (ctx) => {
    const now = Date.now();
    const posts = await ctx.db.query("blogPosts")
      .filter((q) => q.eq(q.field("isLive"), true))
      .collect();
    return posts
      .filter((p) => !p.publishedAt || p.publishedAt <= now)
      .filter((p) => p.anchorPhrases && p.anchorPhrases.length > 0)
      .map((p) => ({ slug: p.slug, title: p.title, pillarSlug: p.pillarSlug ?? null, anchorPhrases: p.anchorPhrases! }));
  },
});

/** Server-side preview: één post via slug, ook concepten — token wordt gevalideerd in Next.js page */
export const getBySlugAdmin = query({
  args: { slug: v.string() },
  handler: async (ctx, args) => {
    const post = await ctx.db.query("blogPosts")
      .withIndex("by_slug", (q) => q.eq("slug", args.slug))
      .first();
    if (!post) return null;
    return {
      ...post,
      coverImageUrl: post.coverImageStorageId
        ? await ctx.storage.getUrl(post.coverImageStorageId).catch(() => null)
        : null,
    };
  },
});

/** Publiek: één post via slug */
export const getBySlug = query({
  args: { slug: v.string() },
  handler: async (ctx, args) => {
    const post = await ctx.db.query("blogPosts")
      .withIndex("by_slug", (q) => q.eq("slug", args.slug))
      .first();
    if (!post || !post.isLive) return null;
    if (post.publishedAt && post.publishedAt > Date.now()) return null;
    return {
      ...post,
      coverImageUrl: post.coverImageStorageId
        ? await ctx.storage.getUrl(post.coverImageStorageId).catch(() => null)
        : null,
    };
  },
});

/** Admin: URL ophalen na upload */
export const getImageUrl = mutation({
  args: { adminToken: v.string(), storageId: v.id("_storage") },
  handler: async (ctx, args) => {
    await checkAdmin(ctx, args.adminToken);
    return ctx.storage.getUrl(args.storageId);
  },
});

/** Admin: upload URL genereren */
export const generateUploadUrl = mutation({
  args: { adminToken: v.string() },
  handler: async (ctx, args) => {
    await checkAdmin(ctx, args.adminToken);
    return ctx.storage.generateUploadUrl();
  },
});

// Genereer ankerzinnen automatisch uit titel + focuszoekwoord
const STOP_NL = new Set(["de","het","een","en","of","in","van","aan","op","is","die","dat","te","ook","zijn","wat","hoe","er","naar","met","voor","door","bij","maar","als","om","tot","dan","zo","wel","niet","nog","je","ik","we","ze","hij","zij","haar","hun","hem"]);
function autoAnchorPhrases(title: string, focusKeyword?: string): string[] {
  const phrases: string[] = [];
  const fk = focusKeyword?.trim().toLowerCase() ?? "";

  // 1. Focuszoekwoord altijd eerste keuze (als het meerdere woorden heeft)
  if (fk && fk.includes(" ")) phrases.push(fk);

  // 2. Genereer aaneengesloten spans van 2–4 woorden uit de titel.
  //    Stopwoorden MOGEN binnen de span zitten ("verlies van je hond" > "verlies hond"),
  //    maar niet aan het begin of einde.
  const clean = title.toLowerCase().replace(/[–—&]/g, " ").replace(/[^a-z0-9\s]/g, "").trim();
  const allWords = clean.split(/\s+/).filter(Boolean);
  const fkWords = new Set(fk.split(/\s+/).filter(w => w.length > 3 && !STOP_NL.has(w)));
  const contentWords = new Set(allWords.filter(w => w.length > 3 && !STOP_NL.has(w)));

  const candidates: { phrase: string; score: number }[] = [];
  for (let len = 4; len >= 2; len--) {
    for (let i = 0; i <= allWords.length - len; i++) {
      const span = allWords.slice(i, i + len);
      // Niet starten of eindigen met stopwoord
      if (STOP_NL.has(span[0]) || STOP_NL.has(span[span.length - 1])) continue;
      const phrase = span.join(" ");
      if (phrases.includes(phrase)) continue;
      // Score: focus-keywordwoorden zwaarst, dan inhoudelijke woorden, dan lengte
      const fkHits = span.filter(w => fkWords.has(w)).length;
      const contentHits = span.filter(w => contentWords.has(w)).length;
      candidates.push({ phrase, score: fkHits * 10 + contentHits * 2 + len });
    }
  }

  candidates.sort((a, b) => b.score - a.score);
  for (const c of candidates) {
    if (phrases.length >= 3) break;
    if (!phrases.includes(c.phrase)) phrases.push(c.phrase);
  }

  return phrases.filter(Boolean);
}

/** Admin: nieuw artikel aanmaken */
export const create = mutation({
  args: {
    adminToken: v.string(),
    slug: v.string(),
    title: v.string(),
    seoTitle: v.optional(v.string()),
    content: v.string(),
    excerpt: v.optional(v.string()),
    metaDescription: v.optional(v.string()),
    coverImageStorageId: v.optional(v.id("_storage")),
    publishedAt: v.optional(v.number()),
    isLive: v.boolean(),
    faqItems: v.optional(v.array(v.object({ question: v.string(), answer: v.string() }))),
    internalLinks: v.optional(v.array(v.object({ label: v.string(), slug: v.string() }))),
    pillarSlug: v.optional(v.string()),
    sources: v.optional(v.string()),
    focusKeyword: v.optional(v.string()),
    ctaKey: v.optional(v.string()),
    tags: v.optional(v.array(v.string())),
    anchorPhrases: v.optional(v.array(v.string())),
  },
  handler: async (ctx, args) => {
    await checkAdmin(ctx, args.adminToken);
    const now = Date.now();
    // Auto-genereer ankerzinnen als niet meegegeven
    const anchorPhrases = args.anchorPhrases?.length
      ? args.anchorPhrases
      : autoAnchorPhrases(args.title, args.focusKeyword);
    const id = await ctx.db.insert("blogPosts", {
      slug: args.slug,
      title: args.title,
      seoTitle: args.seoTitle,
      content: args.content,
      excerpt: args.excerpt,
      metaDescription: args.metaDescription,
      coverImageStorageId: args.coverImageStorageId,
      publishedAt: args.publishedAt,
      isLive: args.isLive,
      faqItems: args.faqItems,
      internalLinks: args.internalLinks,
      pillarSlug: args.pillarSlug,
      sources: args.sources,
      focusKeyword: args.focusKeyword,
      ctaKey: args.ctaKey,
      tags: args.tags,
      anchorPhrases: anchorPhrases.length ? anchorPhrases : undefined,
      kbSynced: false,
      createdAt: now,
      updatedAt: now,
    });
    return id;
  },
});

/** Admin: artikel bijwerken */
export const update = mutation({
  args: {
    adminToken: v.string(),
    id: v.id("blogPosts"),
    slug: v.optional(v.string()),
    title: v.optional(v.string()),
    seoTitle: v.optional(v.string()),
    content: v.optional(v.string()),
    excerpt: v.optional(v.string()),
    metaDescription: v.optional(v.string()),
    coverImageStorageId: v.optional(v.id("_storage")),
    publishedAt: v.optional(v.number()),
    isLive: v.optional(v.boolean()),
    faqItems: v.optional(v.array(v.object({ question: v.string(), answer: v.string() }))),
    internalLinks: v.optional(v.array(v.object({ label: v.string(), slug: v.string() }))),
    pillarSlug: v.optional(v.string()),
    sources: v.optional(v.string()),
    focusKeyword: v.optional(v.string()),
    ctaKey: v.optional(v.string()),
    tags: v.optional(v.array(v.string())),
    kbSynced: v.optional(v.boolean()),
    anchorPhrases: v.optional(v.array(v.string())),
  },
  handler: async (ctx, args) => {
    await checkAdmin(ctx, args.adminToken);
    const { adminToken, id, ...fields } = args;
    const patch: Record<string, unknown> = { updatedAt: Date.now() };
    for (const [key, val] of Object.entries(fields)) {
      if (val !== undefined) patch[key] = val === "" ? undefined : val;
    }
    await ctx.db.patch(id, patch);
  },
});

/** Admin: scan artikel-tekst op mogelijke interne links — optie C: kernwoorden + beste zin */
export const scanForLinks = query({
  args: {
    adminToken: v.string(),
    content: v.string(),
    pillarSlug: v.optional(v.string()),
    excludeSlug: v.string(),
  },
  handler: async (ctx, args) => {
    await checkAdmin(ctx, args.adminToken);
    const allPosts = await ctx.db.query("blogPosts").collect();

    // Inkomende link-counts berekenen
    const incomingCount = new Map<string, number>();
    for (const post of allPosts) {
      for (const link of (post.internalLinks ?? [])) {
        if (link.slug && !link.slug.startsWith("thema/")) {
          incomingCount.set(link.slug, (incomingCount.get(link.slug) ?? 0) + 1);
        }
      }
    }

    // Kandidaten: alleen artikelen in dezelfde pillar
    const candidates = allPosts.filter(
      (p) => p.slug !== args.excludeSlug && (!args.pillarSlug || p.pillarSlug === args.pillarSlug)
    );

    // Woorden die een span niet mogen STARTEN of EINDIGEN
    const GENERIC = new Set([
      ...Array.from(STOP_NL),
      "gaan","komen","zien","doen","maken","zeggen","weten","worden","blijven","laten","staan",
      "meer","minder","veel","weinig","goed","slecht","groot","klein","lang","kort","nieuw","oud",
      "eerste","tweede","laatste","eigen","hele","zelfde","andere","enkele","alle","elke","ieder",
      "kunnen","willen","moeten","mogen","hoeven","lijken","lijkt","voelen","voelt",
      "echter","altijd","soms","vaak","nooit","misschien","juist","alleen","nog","ook","wel",
      "gewoon","echt","heel","erg","zeer","best","zeker","waarom","wanneer","waardoor","waarmee",
      // Vervoegingen die de basisvorm missen
      "kunt","kan","kon","konden","wil","wilt","wist","werd","werden","ben","bent","was","waren",
      "heeft","hebben","had","hadden","gaat","komt","kwamen","doet","ziet","zag","geeft","staat",
      "vind","vindt","voel","voelt","snap","snapt","denk","denkt","weet","kent","kent","lijkt",
      // Lidwoorden/voornaamwoorden die in STOP_NL missen
      "geen","mijn","jouw","ons","uw","hun","zich","zelf","iets","niets","iemand","niemand",
      "hierbij","hiermee","hiervoor","hierin","hierdoor","daarin","daarmee","daarvoor","daardoor",
    ]);

    // Woorden die NERGENS in een span mogen voorkomen (breekpunten)
    const HARD_STOP = new Set([
      "is","zijn","was","waren","wordt","werden","ben","bent","heeft","hebben","had","hadden",
      "een","de","het","geen","en","of","maar","want","dus","toch","ook","nog","al",
      "naar","van","aan","op","in","bij","uit","door","over","voor","met","om","tot","als",
      "dat","die","dit","deze","zo","dan","er","zich",
      // Voorzetsels die een zin niet mogen eindigen
      "vanuit","zonder","rond","langs","naast","tegenover","ondanks","mede","namens","ten",
      "via","per","plus","minus","versus","contra","betreffende","aangaande","jegens",
      // Verbindingswoorden die een zin niet mogen beginnen of eindigen
      "terwijl","omdat","zodat","tenzij","hoewel","alhoewel","wanneer","waarna","waarbij",
      "nadat","voordat","sindsdien","indien","mits","immers","namelijk","tenzij",
      "waardoor","waarmee","waarvoor","daarna","daarin","daarmee","daarvoor","daardoor",
      // Bijwoorden die geen ankerzin mogen starten of eindigen
      "bijna","ongeveer","pas","net","echt","heel","erg","zeer","best","zeker","eigenlijk",
      "gewoon","juist","zelfs","misschien","wellicht","waarschijnlijk","mogelijk","blijkbaar",
    ]);

    // Vervoegde werkwoorden die een ankerzin niet mogen starten
    const VERB_START = new Set([
      "neemt","heeft","wordt","gaat","komt","ziet","doet","weet","staat","vindt","voelt",
      "denkt","maakt","geeft","laat","noemt","lijkt","houdt","brengt","zorgt","helpt",
      "vraagt","vertelt","begint","eindigt","blijft","loopt","werkt","leeft","sterft",
      "kiest","probeert","probeert","vergeet","herinnert","verwacht","hoopt","vreest",
      "nam","had","deed","zei","ging","stond","lag","zat","vond","wist","kon","mocht",
    ]);

    // Splits brontekst in zinnen — sla markdown-blokken over
    const sentences = args.content
      .replace(/\n+/g, " ")
      .split(/(?<=[.!?])\s+/)
      .map((s) => s.trim().replace(/^[>#*_-]+\s*/, ""))
      .filter((s) => s.length > 20 && !s.startsWith("[") && !s.startsWith("#") && !s.startsWith(">"));

    const usedTargets = new Set<string>();
    const usedPhrases = new Set<string>();
    const matches: Array<{
      targetSlug: string;
      targetTitle: string;
      targetId: string;
      matchedPhrase: string;
      incomingLinkCount: number;
      isNewAnchor: boolean;
      isApproximate: boolean;
      isConceptTarget: boolean;
      sectionHeading: string | null;
      score: number;
    }> = [];

    const contentLower = args.content.toLowerCase();

    // Hulpfunctie: zoek phrase terug in originele tekst (behoudt schrijfwijze)
    function findOriginal(phrase: string): string | null {
      const idx = contentLower.indexOf(phrase.toLowerCase());
      if (idx === -1) return null;
      return args.content.slice(idx, idx + phrase.length);
    }

    // Hulpfunctie: geef de dichtstbijzijnde H2/H3 kop terug vóór de gevonden positie
    function findSectionHeading(phrase: string): string | null {
      const idx = contentLower.indexOf(phrase.toLowerCase().trim());
      if (idx === -1) return null;
      const before = args.content.slice(0, idx);
      const lines = before.split("\n");
      for (let i = lines.length - 1; i >= 0; i--) {
        const m = lines[i].trim().match(/^#{2,3}\s+(.+)/);
        if (m) return m[1].trim();
      }
      return null;
    }

    // Hulpfunctie: genereer n-gram kandidaten uit een tekst (2-4 woorden, no stop-ends)
    function ngramCandidates(text: string, minLen: number, maxLen: number): string[] {
      const clean = text.toLowerCase().replace(/[–—&]/g, " ").replace(/[^a-z0-9\s]/g, "").trim();
      const words = clean.split(/\s+/).filter(Boolean);
      const results: string[] = [];
      for (let len = maxLen; len >= minLen; len--) {
        for (let i = 0; i <= words.length - len; i++) {
          const span = words.slice(i, i + len);
          if (GENERIC.has(span[0]) || GENERIC.has(span[span.length - 1])) continue;
          if (span.some((w) => HARD_STOP.has(w))) continue;
          results.push(span.join(" "));
        }
      }
      return results;
    }

    // Hulpfunctie: is een voorgestelde ankerzin inhoudelijk relevant voor het doelartikel?
    // Vereist dat minstens één woord letterlijk in de titel of het focuszoekwoord voorkomt.
    // Voorkomt zinloze 2-woordmatches zoals "nieuwe nemen" voor een artikel over "nieuwe hond".
    function isPhraseRelevant(phrase: string, targetTitle: string, focusKeyword: string | undefined): boolean {
      const phraseWords = phrase.toLowerCase().replace(/[^a-z0-9\s]/g, "").split(/\s+/)
        .filter(w => w.length > 2 && !GENERIC.has(w) && !HARD_STOP.has(w));
      if (phraseWords.length === 0) return false;
      const titleWords = new Set(
        [targetTitle, focusKeyword ?? ""].join(" ")
          .toLowerCase().replace(/[^a-z0-9\s]/g, "").split(/\s+/)
          .filter(w => w.length > 3 && !GENERIC.has(w) && !HARD_STOP.has(w))
      );
      // Minstens één inhoudelijk woord uit de zin moet in de titel/focuszoekwoord staan
      return phraseWords.some(w => titleWords.has(w));
    }

    for (const post of candidates) {
      if (usedTargets.has(post.slug)) continue;

      // Bestaande ankerzinnen als directe matches meenemen
      const existingAnchors = new Set(post.anchorPhrases ?? []);

      let finalPhrase: string | null = null;
      let isNewAnchor = true;

      // Stap 0: bestaande ankerzin staat al letterlijk in de source-tekst (min. 4 woorden)
      for (const anchor of existingAnchors) {
        const anchorWords = anchor.trim().split(/\s+/);
        if (anchorWords.length >= 4 && contentLower.includes(anchor.toLowerCase())) {
          const orig = findOriginal(anchor);
          if (orig) { finalPhrase = orig; isNewAnchor = false; break; }
        }
      }

      // Stap 1: focusKeyword (min. 4 woorden) letterlijk in de source-tekst
      if (!finalPhrase && post.focusKeyword && post.focusKeyword.trim().split(/\s+/).length >= 4) {
        const kw = post.focusKeyword.trim();
        if (contentLower.includes(kw.toLowerCase())) {
          finalPhrase = findOriginal(kw) ?? kw;
        }
      }

      // Stap 2: pak een echte zinsnede uit de brontekst rondom een trefwoord van het doelartikel
      if (!finalPhrase) {
        const keywords = new Set(
          [post.title, post.focusKeyword ?? ""].join(" ")
            .toLowerCase().replace(/[–—&]/g, " ").replace(/[^a-z0-9\s]/g, "")
            .split(/\s+/)
            .filter(w => w.length > 3 && !GENERIC.has(w) && !HARD_STOP.has(w))
        );
        outer2: for (const sentence of sentences) {
          const sentWords = sentence.split(/\s+/).map(w => w.replace(/^[>#*_"'„«»""]+/, "").replace(/[.,;:!?"'„«»""]+$/, "")).filter(Boolean);
          for (let i = 0; i < sentWords.length; i++) {
            const wLower = sentWords[i].toLowerCase().replace(/[^a-z]/g, "");
            if (!keywords.has(wLower)) continue;
            // Bouw kandidaat: trim woorden voor/na het trefwoord die een stopwoord zijn
            // Zoek linkse grens: ga terug totdat we een niet-stopwoord vinden
            let lStart = Math.max(0, i - 3);
            while (lStart < i && (HARD_STOP.has(sentWords[lStart].toLowerCase().replace(/[^a-z]/g, "")) || GENERIC.has(sentWords[lStart].toLowerCase().replace(/[^a-z]/g, "")))) lStart++;
            // Zoek rechtse grens: ga vooruit totdat we een stopwoord tegenkomen als eindwoord
            let rEnd = Math.min(sentWords.length, i + 4);
            while (rEnd > i + 1 && (HARD_STOP.has(sentWords[rEnd - 1].toLowerCase().replace(/[^a-z]/g, "")) || GENERIC.has(sentWords[rEnd - 1].toLowerCase().replace(/[^a-z]/g, "")))) rEnd--;
            if (rEnd - lStart < 3) continue;
            const candidate = sentWords.slice(lStart, rEnd).join(" ");
            const cWords = candidate.toLowerCase().replace(/[^a-z\s]/g, "").split(/\s+/);
            // Kandidaat moet het trefwoord bevatten en letterlijk in de tekst staan
            if (
              cWords.length >= 4 &&
              !VERB_START.has(cWords[0]) &&
              cWords.some(w => keywords.has(w)) &&
              contentLower.includes(candidate.toLowerCase())
            ) {
              finalPhrase = findOriginal(candidate) ?? candidate;
              break outer2;
            }
          }
        }
      }

      if (!finalPhrase) continue;

      // Zin moet letterlijk in de brontekst staan
      if (!contentLower.includes(finalPhrase.trim().toLowerCase())) continue;

      const isApproximate = false;

      // Verifieer relevantie voor nieuwe (nog niet geactiveerde) zinnen:
      // minstens één woord moet in de titel of het focuszoekwoord van het doelartikel staan.
      // Zo voorkomen we zinloze matches zoals "nieuwe nemen" voor "Wanneer is het tijd voor een nieuwe hond".
      if (isNewAnchor && !isPhraseRelevant(finalPhrase.trim(), post.title, post.focusKeyword)) {
        continue;
      }

      // Zelfde ankerzin mag niet twee keer voorkomen
      const phraseKey = finalPhrase.toLowerCase().trim();
      if (usedPhrases.has(phraseKey)) continue;
      usedPhrases.add(phraseKey);

      // Bereken score voor sortering (keyword-overlap in brontekst)
      const kwSet = new Set(
        [post.title, post.focusKeyword ?? "", post.excerpt ?? ""].join(" ")
          .toLowerCase().replace(/[^a-z0-9\s]/g, "").split(/\s+/)
          .filter((w) => w.length > 3 && !GENERIC.has(w))
      );
      const score = args.content.toLowerCase().split(/\s+/).filter((w) => kwSet.has(w)).length;

      matches.push({
        targetSlug: post.slug,
        targetTitle: post.title,
        targetId: post._id,
        matchedPhrase: finalPhrase.trim(),
        incomingLinkCount: incomingCount.get(post.slug) ?? 0,
        isNewAnchor,
        isApproximate,
        isConceptTarget: !post.isLive,
        sectionHeading: findSectionHeading(finalPhrase.trim()),
        score,
      });
      usedTargets.add(post.slug);
    }

    // Sorteren: eerst score (relevantie), dan minste inkomende links
    return matches
      .sort((a, b) => b.score - a.score || a.incomingLinkCount - b.incomingLinkCount);
  },
});

/** Admin: geef per doelartikel de top-4 meest relevante zinnen uit de brontekst terug.
 *  De gebruiker selecteert zelf met de muis welk stuk tekst als ankerzin moet dienen. */
export const scanSentencesForLinks = query({
  args: {
    adminToken: v.string(),
    content: v.string(),
    pillarSlug: v.optional(v.string()),
    excludeSlug: v.string(),
  },
  handler: async (ctx, args) => {
    await checkAdmin(ctx, args.adminToken);
    const allPosts = await ctx.db.query("blogPosts").collect();

    const incomingCount = new Map<string, number>();
    for (const post of allPosts) {
      for (const link of (post.internalLinks ?? [])) {
        if (link.slug && !link.slug.startsWith("thema/")) {
          incomingCount.set(link.slug, (incomingCount.get(link.slug) ?? 0) + 1);
        }
      }
    }

    const candidates = allPosts.filter(
      (p) => p.slug !== args.excludeSlug && (!args.pillarSlug || p.pillarSlug === args.pillarSlug)
    );

    const sentences = args.content
      .split(/\n/)
      .filter((line) => !/^\s*#{1,6}\s/.test(line)) // koppen nooit als ankerzin
      .flatMap((line) => line.split(/(?<=[.!?])\s+/))
      .map((s) => s.trim().replace(/^[>#*_-]+\s*/, ""))
      .filter((s) => s.length > 40 && !s.startsWith("[") && !s.startsWith(">") && !s.startsWith("http"));

    // Verzamel alle bestaande ankerzinnen van alle kandidaten voor conflict-detectie
    // Elke ankerzin is "eigendom" van één doelartikel — dezelfde zin mag niet naar twee artikelen linken
    const anchorOwner = new Map<string, string>(); // anchorPhrase.toLowerCase() → targetTitle
    for (const post of candidates) {
      for (const phrase of (post.anchorPhrases ?? [])) {
        anchorOwner.set(phrase.toLowerCase(), post.title);
      }
    }

    const results: Array<{
      targetSlug: string;
      targetTitle: string;
      targetId: string;
      sentences: Array<{ text: string; score: number; claimedBy: string | null; suggestedAnchor: string | null }>;
      existingAnchors: string[];
      incomingLinkCount: number;
      isConceptTarget: boolean;
    }> = [];

    for (const post of candidates) {
      const keywords = new Set(
        [post.title, post.focusKeyword ?? ""].join(" ")
          .toLowerCase()
          .replace(/[–—&]/g, " ")
          .replace(/[^a-z0-9\s]/g, "")
          .split(/\s+/)
          .filter((w) => w.length > 3 && !STOP_NL.has(w))
      );
      if (keywords.size === 0) continue;

      // Eigen ankerzinnen van dit artikel (niet als "geclaimd door ander" markeren)
      const ownAnchors = new Set((post.anchorPhrases ?? []).map((p) => p.toLowerCase()));

      const scored: { text: string; score: number; claimedBy: string | null; suggestedAnchor: string | null }[] = [];
      for (const sentence of sentences) {
        const wordsArr = sentence.split(/\s+/);
        const wordsClean = wordsArr.map((w) => w.toLowerCase().replace(/[^a-z0-9]/g, ""));
        const matchIdxs = wordsClean.reduce<number[]>((acc, w, i) => { if (keywords.has(w)) acc.push(i); return acc; }, []);
        const score = matchIdxs.length;
        if (score === 0) continue;

        // Conflict-detectie: alleen ankerzinnen van ≥ 4 woorden tellen mee
        // Korte zinsdelen (1-3 woorden) van het oude algoritme zouden anders bijna elke zin blokkeren
        let claimedBy: string | null = null;
        const sentLower = sentence.toLowerCase();
        for (const [phrase, owner] of anchorOwner) {
          if (phrase.trim().split(/\s+/).length < 4) continue;
          if (ownAnchors.has(phrase)) continue;
          if (sentLower.includes(phrase)) {
            claimedBy = owner;
            break;
          }
        }

        // Beste suggestie: span rondom de gematchte keywords (max 7 woorden)
        let suggestedAnchor: string | null = null;
        if (!claimedBy) {
          const start = Math.max(0, matchIdxs[0] - 2);
          const end = Math.min(wordsArr.length, matchIdxs[matchIdxs.length - 1] + 3);
          const span = wordsArr.slice(start, end).join(" ")
            .replace(/^[^a-zA-ZÀ-ÿ"'«]+/, "")
            .replace(/[^a-zA-ZÀ-ÿ"'»?!.]+$/, "")
            .trim();
          if (span.split(/\s+/).length >= 4) suggestedAnchor = span;
        }

        scored.push({ text: sentence, score, claimedBy, suggestedAnchor });
      }
      if (scored.length === 0) continue;

      scored.sort((a, b) => b.score - a.score);
      results.push({
        targetSlug: post.slug,
        targetTitle: post.title,
        targetId: post._id,
        sentences: scored.slice(0, 4),
        existingAnchors: post.anchorPhrases ?? [],
        incomingLinkCount: incomingCount.get(post.slug) ?? 0,
        isConceptTarget: !post.isLive,
      });
    }

    // Prioritering: 0 inkomende links eerst, dan 1, dan 2+ (max 4 uit die groep)
    // Binnen elke groep gesorteerd op relevantiescore. Totaal max 10 resultaten.
    const byScore = (a: typeof results[0], b: typeof results[0]) => {
      const sA = a.sentences.reduce((s, x) => s + x.score, 0);
      const sB = b.sentences.reduce((s, x) => s + x.score, 0);
      return sB - sA;
    };
    const noLinks = results.filter((r) => r.incomingLinkCount === 0).sort(byScore);
    const fewLinks = results.filter((r) => r.incomingLinkCount === 1).sort(byScore);
    const moreLinks = results.filter((r) => r.incomingLinkCount >= 2).sort(byScore).slice(0, 4);

    return [...noLinks, ...fewLinks, ...moreLinks].slice(0, 10);
  },
});

/** Admin: welke live artikelen bevatten al de ankerzinnen van dit (concept)artikel?
 *  Geeft een vooruitblik: dit zijn de artikelen die straks automatisch linken naar jou. */
export const previewIncomingLinks = query({
  args: {
    adminToken: v.string(),
    anchorPhrases: v.array(v.string()),
    pillarSlug: v.optional(v.string()),
    excludeSlug: v.string(),
  },
  handler: async (ctx, args) => {
    await checkAdmin(ctx, args.adminToken);
    if (!args.anchorPhrases.length) return [];

    const livePosts = await ctx.db.query("blogPosts")
      .filter((q) => q.eq(q.field("isLive"), true))
      .collect();

    const candidates = livePosts.filter(
      (p) => p.slug !== args.excludeSlug && (!args.pillarSlug || p.pillarSlug === args.pillarSlug)
    );

    const results: { slug: string; title: string; phrase: string }[] = [];
    for (const post of candidates) {
      const contentLower = post.content.toLowerCase();
      for (const phrase of args.anchorPhrases) {
        if (phrase.trim().length > 2 && contentLower.includes(phrase.trim().toLowerCase())) {
          results.push({ slug: post.slug, title: post.title, phrase: phrase.trim() });
          break;
        }
      }
    }
    return results;
  },
});

/** Admin: één ankerzin verwijderen uit een doelartikel */
export const removeAnchorPhrase = mutation({
  args: {
    adminToken: v.string(),
    targetId: v.id("blogPosts"),
    phrase: v.string(),
  },
  handler: async (ctx, args) => {
    await checkAdmin(ctx, args.adminToken);
    const post = await ctx.db.get(args.targetId);
    if (!post) return;
    const updated = (post.anchorPhrases ?? []).filter(p => p !== args.phrase);
    await ctx.db.patch(args.targetId, { anchorPhrases: updated.length ? updated : undefined, updatedAt: Date.now() });
  },
});

/** Admin: ankerzinnen toevoegen aan doel-artikelen na scan-goedkeuring */
export const applyLinkSuggestions = mutation({
  args: {
    adminToken: v.string(),
    suggestions: v.array(v.object({
      targetId: v.id("blogPosts"),
      phrase: v.string(),
    })),
  },
  handler: async (ctx, args) => {
    await checkAdmin(ctx, args.adminToken);
    const now = Date.now();
    for (const { targetId, phrase } of args.suggestions) {
      if (phrase.trim().split(/\s+/).length < 3) continue; // minimaal 3 woorden
      const post = await ctx.db.get(targetId);
      if (!post) continue;
      const existing = post.anchorPhrases ?? [];
      if (existing.length >= 4) continue; // maximaal 4 ankerzinnen per artikel
      if (!existing.includes(phrase)) {
        await ctx.db.patch(targetId, {
          anchorPhrases: [...existing, phrase],
          updatedAt: now,
        });
      }
    }
    return args.suggestions.length;
  },
});

/** Admin: genereer ankerzinnen voor artikelen die er nog geen hebben */
export const bulkGenerateAnchorPhrases = mutation({
  args: { adminToken: v.string() },
  handler: async (ctx, args) => {
    await checkAdmin(ctx, args.adminToken);
    const posts = await ctx.db.query("blogPosts").collect();
    const empty = posts.filter((p) => !p.anchorPhrases || p.anchorPhrases.length === 0);
    await Promise.all(empty.map((p) => {
      const phrases = autoAnchorPhrases(p.title, p.focusKeyword ?? undefined);
      if (phrases.length === 0) return Promise.resolve();
      return ctx.db.patch(p._id, { anchorPhrases: phrases, updatedAt: Date.now() });
    }));
    return empty.length;
  },
});

/** Admin: vervang zwakke ankerzinnen (alle phrases ≤ 2 woorden) met verbeterd algoritme */
export const bulkRegenerateWeakAnchorPhrases = mutation({
  args: { adminToken: v.string() },
  handler: async (ctx, args) => {
    await checkAdmin(ctx, args.adminToken);
    const posts = await ctx.db.query("blogPosts").collect();
    const weak = posts.filter((p) =>
      p.anchorPhrases &&
      p.anchorPhrases.length > 0 &&
      p.anchorPhrases.every((phrase) => phrase.trim().split(/\s+/).length <= 2)
    );
    await Promise.all(weak.map((p) => {
      const phrases = autoAnchorPhrases(p.title, p.focusKeyword ?? undefined);
      if (phrases.length === 0) return Promise.resolve();
      return ctx.db.patch(p._id, { anchorPhrases: phrases, updatedAt: Date.now() });
    }));
    return weak.length;
  },
});

/** Admin: alle ankerzinnen van alle posts leegmaken */
export const clearAllAnchorPhrases = mutation({
  args: { adminToken: v.string() },
  handler: async (ctx, args) => {
    await checkAdmin(ctx, args.adminToken);
    const posts = await ctx.db.query("blogPosts").collect();
    await Promise.all(posts.map((p) => ctx.db.patch(p._id, { anchorPhrases: undefined })));
    return posts.length;
  },
});

/** Admin: artikel verwijderen */
export const remove = mutation({
  args: { adminToken: v.string(), id: v.id("blogPosts") },
  handler: async (ctx, args) => {
    await checkAdmin(ctx, args.adminToken);
    await ctx.db.delete(args.id);
  },
});

/** Admin: FAQ + samenvatting synchroniseren naar kennisbank (geen duplicaten) */
export const syncToKnowledgeBase = mutation({
  args: {
    adminToken: v.string(),
    id: v.id("blogPosts"),
  },
  handler: async (ctx, args) => {
    await checkAdmin(ctx, args.adminToken);
    const post = await ctx.db.get(args.id);
    if (!post) throw new Error("Post niet gevonden");

    const now = Date.now();
    const tags = [post.slug, "blog", ...post.title.toLowerCase().split(" ").filter((w) => w.length > 3)];

    // Bepaal categorie op basis van gekoppelde pillar, anders "Rouw & Verdriet"
    // Mapping: pillar-titel (publiek/SEO) → KB-categorienaam (admin)
    const PILLAR_NAAR_KB: Record<string, string> = {
      "Verdriet dat niet zichtbaar is": "Onzichtbaar verdriet",
    };
    let category = "Rouw & Verdriet";
    if (post.pillarSlug) {
      const pillar = await ctx.db.query("pillars")
        .withIndex("by_slug", (q) => q.eq("slug", post.pillarSlug!))
        .first();
      if (pillar?.title) category = PILLAR_NAAR_KB[pillar.title] ?? pillar.title;
    }

    // Haal alle bestaande vragen op (eenmalig, voor upsert)
    const existing = await ctx.db.query("knowledgeBase").collect();
    const existingMap = new Map(existing.map((e) => [e.question.trim().toLowerCase(), e]));

    const upsert = async (question: string, answer: string, priority: number) => {
      if (!question.trim() || !answer.trim()) return;
      const key = question.trim().toLowerCase();
      const found = existingMap.get(key);
      if (found) {
        // Update categorie en antwoord als die gewijzigd zijn
        await ctx.db.patch(found._id, { category, answer, tags, updatedAt: now });
      } else {
        await ctx.db.insert("knowledgeBase", {
          question,
          answer,
          category,
          tags,
          isActive: true,
          usageCount: 0,
          priority,
          createdBy: "blog-sync",
          createdAt: now,
          updatedAt: now,
        });
        existingMap.set(key, {} as any); // voorkom dubbel binnen zelfde sync
      }
    };

    // FAQ-items (blogtitel+excerpt niet meer synced — te algemeen als antwoord)
    if (post.faqItems) {
      for (const faq of post.faqItems) {
        await upsert(faq.question, faq.answer, 6);
      }
    }

    await ctx.db.patch(args.id, { kbSynced: true, updatedAt: now });

    // Plan embedding-berekening in voor nieuwe Q&A's (5 seconden vertraging)
    await ctx.scheduler.runAfter(5000, api.embeddings.embedAllKbItems, { batchSize: 50 });

    return true;
  },
});

/** Admin: alle posts met inkomende/uitgaande link-statistieken */
export const listWithLinkStats = query({
  args: { adminToken: v.string() },
  handler: async (ctx, args) => {
    await checkAdmin(ctx, args.adminToken);
    const posts = await ctx.db.query("blogPosts").collect();

    // Bereken inkomende links per slug
    const incomingCount = new Map<string, number>();
    for (const post of posts) {
      for (const link of (post.internalLinks ?? [])) {
        if (link.slug && !link.slug.startsWith("thema/")) {
          incomingCount.set(link.slug, (incomingCount.get(link.slug) ?? 0) + 1);
        }
      }
    }

    return posts.map((p) => ({
      _id: p._id,
      slug: p.slug,
      title: p.title,
      pillarSlug: p.pillarSlug ?? null,
      isLive: p.isLive,
      anchorPhrases: p.anchorPhrases ?? [],
      outgoingLinks: (p.internalLinks ?? []).filter((l) => l.slug && !l.slug.startsWith("thema/")),
      incomingLinkCount: incomingCount.get(p.slug) ?? 0,
      publishedAt: p.publishedAt ?? null,
      createdAt: p.createdAt,
    }));
  },
});

/** Admin: voorbeeldartikel aanmaken */
export const seedExample = mutation({
  args: { adminToken: v.string() },
  handler: async (ctx, args) => {
    await checkAdmin(ctx, args.adminToken);
    const existing = await ctx.db.query("blogPosts")
      .withIndex("by_slug", (q) => q.eq("slug", "hoe-er-zijn-voor-iemand-die-rouwt"))
      .first();
    if (existing) return existing._id;

    const now = Date.now();
    return await ctx.db.insert("blogPosts", {
      slug: "hoe-er-zijn-voor-iemand-die-rouwt",
      title: "Hoe er zijn voor iemand die rouwt — zonder de verkeerde dingen te zeggen",
      content: `Wanneer iemand verlies ervaart, willen we helpen. Maar we weten niet altijd hoe. We zijn bang de verkeerde woorden te kiezen, of juist bang om te zwijgen.

Toch is aanwezig zijn — echt aanwezig — het krachtigste wat je kunt doen.

**Wat werkt niet**

De meest gemaakte fout is proberen het verdriet weg te praten. Zinnen als "hij is nu op een betere plek" of "de tijd heelt alle wonden" zijn goedbedoeld, maar voelen voor de rouwende vaak aan als een afsluiting van hun gevoel.

Rouw heeft geen oplossing. Het vraagt om ruimte.

**Wat wél werkt**

Kleine, concrete gebaren doen meer dan grote woorden. Stuur een bericht zonder dat je een antwoord verwacht. Breng eten langs. Zeg: "Ik denk aan je." Meer is soms niet nodig.

Vraag ook gewoon: "Hoe gaat het vandaag?" — niet als beleefdheid, maar als echte vraag. En luister dan echt naar het antwoord.

**Het gaat om aanwezigheid, niet om perfectie**

Je hoeft niet de perfecte woorden te hebben. Je mag onzeker zijn. Wat telt is dat je er bent — niet weggaat omdat het ongemakkelijk voelt.

Rouwenden herinneren zich niet altijd wat je zei. Maar ze herinneren zich wel wie bleef.`,
      excerpt: "Aanwezig zijn voor iemand die rouwt hoeft niet perfect te zijn. Dit artikel legt uit waarom kleine gebaren meer doen dan grote woorden, en hoe je er echt kunt zijn voor iemand in verdriet.",
      metaDescription: "Hoe kun je er zijn voor iemand die rouwt? Praktisch en eerlijk advies over aanwezig zijn, zonder de verkeerde dingen te zeggen.",
      publishedAt: now,
      isLive: false,
      faqItems: [
        {
          question: "Wat zeg je tegen iemand die net iemand verloren heeft?",
          answer: "Je hoeft geen perfecte woorden te hebben. 'Ik denk aan je' of 'Ik ben er als je wil praten' is genoeg. Het gaat om aanwezigheid, niet om de juiste zin.",
        },
        {
          question: "Hoe help je iemand die rouwt zonder opdringerig te zijn?",
          answer: "Stuur een bericht zonder een antwoord te verwachten. Breng eten langs. Vraag concreet wat je kunt doen. Kleine, herhaalde gebaren zijn krachtiger dan één grote daad.",
        },
        {
          question: "Wat moet je niet zeggen tegen iemand die rouwt?",
          answer: "Vermijd zinnen als 'alles komt goed', 'hij is op een betere plek' of 'ik weet hoe je je voelt'. Ze sluiten het gevoel van de ander af. Luister liever dan dat je troost aandraagt.",
        },
      ],
      internalLinks: [
        { label: "Wat is rouw en wat mag je verwachten?", slug: "wat-is-rouw" },
        { label: "Praktische steun geven in de eerste weken", slug: "praktische-steun-na-verlies" },
      ],
      kbSynced: false,
      createdAt: now,
      updatedAt: now,
    });
  },
});
