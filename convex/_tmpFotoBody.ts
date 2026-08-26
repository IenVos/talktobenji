import { internalQuery } from "./_generated/server";
export const b = internalQuery({
  args: {},
  handler: async (ctx) => {
    const sch = await ctx.db.query("emailTemplates").withIndex("by_key",(q)=>q.eq("key","eh_scheiding_3")).unique();
    let benji: any = null;
    for (const m of await ctx.db.query("funnelMails").collect() as any[]) if ((m.bodyText||"").includes("Zoek vandaag")) benji = m;
    const snip = (s:string)=>{const i=s.indexOf("Zoek vandaag");return i<0?"(-)":s.slice(i, i+360);};
    return { benji_dag5: snip(benji?.bodyText||""), eh_scheiding_3: snip(sch?.bodyText||"") };
  },
});
