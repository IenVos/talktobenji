import { query } from "./_generated/server";

/**
 * Returns the current user's ID (from NextAuth JWT) if logged in, null otherwise.
 * Use in the client for isLoggedIn = !!useQuery(api.user.getCurrentUserId).
 */
export const getCurrentUserId = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    return identity?.subject ?? null;
  },
});
