/**
 * Eenmalige opschoning: verwijder de dubbele productafbeelding op de
 * huisdier-landingspagina. Run: npx convex run --prod clearLpProductImage:run
 * Daarna mag dit bestand weer weg.
 */
import { internalMutation } from "./_generated/server";

export const run = internalMutation({
  args: {},
  handler: async (ctx) => {
    const page = await ctx.db
      .query("landingPages")
      .withIndex("by_slug", (q) => q.eq("slug", "niet-alleen-voor-hulp-bij-verlies-van-huisdier"))
      .first();
    if (!page) return { status: "niet gevonden" };
    await ctx.db.patch(page._id, {
      productImageStorageId: undefined,
      productImagePath: undefined,
      updatedAt: Date.now(),
    });
    return { status: "productafbeelding verwijderd", id: page._id };
  },
});
