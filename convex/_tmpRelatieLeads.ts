import { internalQuery } from "./_generated/server";

// Tijdelijk: overzicht relatie/scheiding-leads sinds 20 aug 2026.
export const overzicht = internalQuery({
  args: {},
  handler: async (ctx) => {
    // 20 aug 2026 00:00 Europe/Amsterdam (CEST = UTC+2)
    const grens = Date.parse("2026-08-19T22:00:00.000Z");

    // Alle EH-leads (brief) van type scheiding sinds de grens.
    const brieven = (await ctx.db.query("houvastBrieven").collect())
      .filter((b) => (b.verliesType || "") === "scheiding" && b.sentAt >= grens)
      .sort((a, b) => a.sentAt - b.sentAt);

    // Sessies indexeren op userEmail (lowercase) voor Benji-koppeling.
    const sessies = await ctx.db.query("chatSessions").collect();
    const sessiesPerEmail = new Map<string, typeof sessies>();
    for (const s of sessies) {
      const e = (s.userEmail || "").toLowerCase();
      if (!e) continue;
      if (!sessiesPerEmail.has(e)) sessiesPerEmail.set(e, []);
      sessiesPerEmail.get(e)!.push(s);
    }

    const rows = [];
    for (const b of brieven) {
      const email = b.email.toLowerCase();

      // EH-opvolgmails verzonden
      const opvolg = await ctx.db
        .query("ehOpvolgVerzonden")
        .withIndex("by_email", (q) => q.eq("email", email))
        .collect();
      const opvolgNrs = opvolg.map((o) => o.mailNummer).sort((x, y) => x - y);

      // Afmelding?
      const afmeldingen = await ctx.db
        .query("ehAfmeldingen")
        .withIndex("by_email", (q) => q.eq("email", email))
        .collect();

      // Benji-link verzonden in mail?
      const benjiLinks = await ctx.db
        .query("benjiLinkVerzonden")
        .withIndex("by_email", (q) => q.eq("email", email))
        .collect();

      // Benji-starttoken ingewisseld?
      const tokens = await ctx.db
        .query("benjiStartTokens")
        .withIndex("by_email", (q) => q.eq("email", email))
        .collect();
      const tokenIngewisseld = tokens.some((t) => t.usedAt);

      // Funnel-lead (spoor + status)
      const fl = await ctx.db
        .query("funnelLeads")
        .withIndex("by_email", (q) => q.eq("email", email))
        .collect();

      // Benji-gesprekken (via userEmail)
      const mySessies = sessiesPerEmail.get(email) || [];
      let userBerichten = 0;
      let botBerichten = 0;
      let laatsteActiviteit = 0;
      for (const s of mySessies) {
        const msgs = await ctx.db
          .query("chatMessages")
          .withIndex("by_session", (q) => q.eq("sessionId", s._id))
          .collect();
        for (const m of msgs) {
          if (m.role === "user") userBerichten++;
          else botBerichten++;
        }
        if (s.lastActivityAt > laatsteActiviteit) laatsteActiviteit = s.lastActivityAt;
      }

      rows.push({
        email,
        naam: b.naam || null,
        briefOp: new Date(b.sentAt).toISOString(),
        bron: b.bron || null,
        ehOpvolgMails: opvolgNrs,
        afgemeld: afmeldingen.length > 0
          ? afmeldingen.map((a) => a.mail || "?").join(",")
          : null,
        benjiLinksInMail: benjiLinks.length,
        benjiTokenIngewisseld: tokenIngewisseld,
        benjiGesprekken: mySessies.length,
        benjiUserBerichten: userBerichten,
        benjiBotBerichten: botBerichten,
        benjiLaatsteActiviteit: laatsteActiviteit
          ? new Date(laatsteActiviteit).toISOString()
          : null,
        funnelSpoor: fl.length ? fl.map((f) => f.spoor || "evergreen").join(",") : null,
        funnelStatus: fl.length ? fl.map((f) => f.status).join(",") : null,
      });
    }

    // Samenvatting
    const totaal = rows.length;
    const metGesprek = rows.filter((r) => r.benjiGesprekken > 0).length;
    const metTokenIngewisseld = rows.filter((r) => r.benjiTokenIngewisseld).length;
    const afgemeld = rows.filter((r) => r.afgemeld).length;
    const inBenjiSpoor = rows.filter((r) => (r.funnelSpoor || "").includes("benji")).length;
    const inEvergreen = rows.filter((r) => (r.funnelSpoor || "").includes("evergreen")).length;
    const geenFunnel = rows.filter((r) => !r.funnelSpoor).length;
    const kopers = rows.filter((r) => (r.funnelStatus || "").includes("koper")).length;

    return {
      samenvatting: {
        totaalLeads: totaal,
        metBenjiGesprek: metGesprek,
        benjiTokenIngewisseld: metTokenIngewisseld,
        afgemeld,
        inBenjiFunnel: inBenjiSpoor,
        inEvergreenFunnel: inEvergreen,
        geenFunnelrecord: geenFunnel,
        kopers,
      },
      leads: rows,
    };
  },
});
