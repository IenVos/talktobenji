/**
 * Convex auth: accept JWTs issued by our NextAuth (session callback).
 * Zie https://stack.convex.dev/nextauth-adapter
 */
export default {
  providers: [
    {
      domain: process.env.CONVEX_SITE_URL,
      applicationID: "convex",
    },
  ],
};
