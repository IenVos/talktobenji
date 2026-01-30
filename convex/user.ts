import { query } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";

/**
 * Returns the current user's ID if logged in, null otherwise.
 * Use in the client for isLoggedIn = !!useQuery(api.user.getCurrentUserId).
 */
export const getCurrentUserId = query({
  args: {},
  handler: async (ctx) => {
    return await getAuthUserId(ctx);
  },
});
