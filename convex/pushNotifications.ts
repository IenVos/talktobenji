"use node";

import { v } from "convex/values";
import { action } from "./_generated/server";
import { api } from "./_generated/api";

// ============================================================================
// PUSH NOTIFICATIE ACTION (Node.js — gebruikt web-push)
// ============================================================================

/** Verstuur een push notificatie naar alle subscribers */
export const sendToAll = action({
  args: {
    title: v.string(),
    body: v.string(),
    url: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const webpush = require("web-push");

    const vapidPublic = process.env.VAPID_PUBLIC_KEY;
    const vapidPrivate = process.env.VAPID_PRIVATE_KEY;

    if (!vapidPublic || !vapidPrivate) {
      throw new Error(
        "VAPID keys niet geconfigureerd. Voeg VAPID_PUBLIC_KEY en VAPID_PRIVATE_KEY toe in Convex Dashboard → Settings → Environment Variables."
      );
    }

    webpush.setVapidDetails(
      "mailto:info@talktobenji.nl",
      vapidPublic,
      vapidPrivate
    );

    // Haal alle subscriptions op
    const allSubs = await ctx.runQuery(api.pushSubscriptions.getAllSubscriptions);

    const payload = JSON.stringify({
      title: args.title,
      body: args.body,
      url: args.url || "/account",
      icon: "/icon-192.png",
      badge: "/icon-192.png",
    });

    let successCount = 0;
    const failedEndpoints: string[] = [];

    for (const sub of allSubs) {
      try {
        await webpush.sendNotification(
          {
            endpoint: sub.endpoint,
            keys: {
              p256dh: sub.p256dh,
              auth: sub.auth,
            },
          },
          payload
        );
        successCount++;
      } catch (error: any) {
        if (error?.statusCode === 410 || error?.statusCode === 404) {
          failedEndpoints.push(sub.endpoint);
        }
        console.error("Push failed for endpoint:", sub.endpoint, error?.message);
      }
    }

    // Verwijder verlopen subscriptions
    if (failedEndpoints.length > 0) {
      await ctx.runMutation(api.pushSubscriptions.removeExpiredSubscriptions, {
        endpoints: failedEndpoints,
      });
    }

    // Sla notificatie op in geschiedenis
    await ctx.runMutation(api.pushSubscriptions.recordNotification, {
      title: args.title,
      body: args.body,
      url: args.url,
      recipientCount: successCount,
    });

    return { sent: successCount, failed: allSubs.length - successCount };
  },
});
