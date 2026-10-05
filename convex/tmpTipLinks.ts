import { internalMutation } from "./_generated/server";

// Eenmalige, idempotente migratie: voegt relevante inline-links toe aan de tip-blogs
// (artikelen zonder pillar). Cross-pillar is hier bewust toegestaan. Alleen naar
// reeds gepubliceerde artikelen. Na uitvoeren mag dit bestand weg.
const EDITS: Record<string, Array<[string, string]>> = {
  "rouwcafe-gewoon-binnen-lopen": [
    ["het verlies al jaren geleden is en toch nog voelbaar blijft",
     "[het verlies al jaren geleden is en toch nog voelbaar blijft](/blog/waarom-rouw-ik-nu-pas-uitgestelde-rouw)"],
    ["de mensen die luisteren, hoe lief ze ook zijn, het niet helemaal begrijpen",
     "[de mensen die luisteren, hoe lief ze ook zijn, het niet helemaal begrijpen](/blog/niemand-begrijpt-mijn-verdriet-meer-eenzaamheid-na-verlies)"],
  ],
  "een-veilige-plek-voor-vlaamse-jongeren-in-rouw": [
    ["of hoe je erover moet praten.",
     "of [hoe je erover moet praten](/blog/met-iemand-praten-over-problemen-klein-beginnen)."],
    ["Jongeren die weten hoe het voelt om iemand te missen en dat met elkaar delen.",
     "Jongeren die [weten hoe het voelt om iemand te missen](/blog/niemand-begrijpt-mijn-verdriet-meer-eenzaamheid-na-verlies) en dat met elkaar delen."],
  ],
  "leaf-like-a-tree-rouwwandelingen-amsterdam": [
    ["Als je verlies zich moeilijk laat uitleggen aan mensen die het niet kennen, is zo'n wandeling iets anders dan een algemene groep.",
     "Als je [verlies zich moeilijk laat uitleggen aan mensen die het niet kennen](/blog/niemand-begrijpt-mijn-verdriet-meer-eenzaamheid-na-verlies), is zo'n wandeling iets anders dan een algemene groep."],
  ],
  "freya-vereniging-onvervulde-kinderwens": [
    ["Maar jij loopt met iets rond waar geen woord voor is.",
     "Maar jij loopt met [iets rond waar geen woord voor is](/blog/ongewenste-kinderloosheid)."],
    ["Die tweede bestaat omdat dit verdriet niet overgaat.",
     "Die tweede bestaat omdat [dit verdriet niet overgaat](/blog/waarom-komt-het-verdriet-steeds-terug-golven)."],
  ],
  "lotgenotenkring-rouw-en-verlies-gelderland": [
    ["hoe een rouwproces kan verlopen en wat het met je doet",
     "[hoe een rouwproces kan verlopen en wat het met je doet](/blog/eerste-jaar-na-verlies-wat-is-normaal)"],
    ["een doodgeboren of overleden kindje, een miskraam.",
     "een doodgeboren of overleden kindje, [een miskraam](/blog/rouw-na-miskraam-stil-verlies-verwerken)."],
  ],
  "nomo-retreats-geen-moeder-geworden": [
    ["Maar je bent iets kwijt waar geen woord voor is.",
     "Maar je bent [iets kwijt waar geen woord voor is](/blog/ongewenste-kinderloosheid)."],
    ["Het is alleen onzichtbaar.",
     "[Het is alleen onzichtbaar](/blog/levend-verlies)."],
  ],
  "death-cafe-amsterdam-praten-over-de-dood": [
    ["Soms is iemand die je liefhebt ziek en weet je niet wat je moet zeggen.",
     "Soms is iemand die je liefhebt ziek en [weet je niet wat je moet zeggen](/blog/iemand-helpen-die-rouwt-wat-zeggen)."],
    ["Dan is een rouwcafé of een lotgenotengroep passender.",
     "Dan is [een rouwcafé](/blog/rouwcafe-gewoon-binnen-lopen) of een lotgenotengroep passender."],
  ],
  "walk-of-grief-rouwen-terwijl-je-loopt-op-terschelling": [
    ["Maar het verdriet is er nog steeds.",
     "Maar [het verdriet is er nog steeds](/blog/waarom-komt-het-verdriet-steeds-terug-golven)."],
    ["wanneer de structuur wegvalt en je er ineens alleen voor staat.",
     "wanneer de structuur wegvalt en [je er ineens alleen voor staat](/blog/niet-weten-hoe-verder-na-verlies-het-gevoel-van-verloren-zijn)."],
  ],
};

export const apply = internalMutation({
  args: {},
  handler: async (ctx) => {
    const log: string[] = [];
    for (const [slug, edits] of Object.entries(EDITS)) {
      const post = await ctx.db
        .query("blogPosts")
        .withIndex("by_slug", (q) => q.eq("slug", slug))
        .first();
      if (!post) { log.push(`GEEN POST: ${slug}`); continue; }
      let content = post.content;
      let applied = 0, skipped = 0;
      for (const [oldS, newS] of edits) {
        if (content.includes(newS)) { skipped++; continue; } // al toegepast
        const occurrences = content.split(oldS).length - 1;
        if (occurrences !== 1) { log.push(`  ! ${slug}: "${oldS.slice(0, 40)}" komt ${occurrences}x voor, overgeslagen`); continue; }
        content = content.replace(oldS, newS);
        applied++;
      }
      if (content !== post.content) {
        await ctx.db.patch(post._id, { content, updatedAt: Date.now() });
      }
      log.push(`${slug}: ${applied} toegevoegd, ${skipped} al aanwezig`);
    }
    return log;
  },
});
