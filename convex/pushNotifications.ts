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
  handler: async (ctx, args): Promise<{ sent: number; failed: number }> => {
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
    const allSubs: any[] = await ctx.runQuery(api.pushSubscriptions.getAllSubscriptions);

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

    // Verzamel unieke userIds van succesvolle verzendingen
    const sentUserIds = allSubs
      .filter((s: any) => !failedEndpoints.includes(s.endpoint))
      .map((s: any) => s.userId as string);
    const uniqueRecipients = Array.from(new Set(sentUserIds));

    // Sla notificatie op in geschiedenis
    await ctx.runMutation(api.pushSubscriptions.recordNotification, {
      title: args.title,
      body: args.body,
      url: args.url,
      recipientCount: successCount,
      recipients: uniqueRecipients,
    });

    return { sent: successCount, failed: allSubs.length - successCount };
  },
});

/** Verstuur een push notificatie naar alleen nieuwe subscribers (die nog nooit een notificatie ontvingen) */
export const sendToNewOnly = action({
  args: {
    title: v.string(),
    body: v.string(),
    url: v.optional(v.string()),
  },
  handler: async (ctx, args): Promise<{ sent: number; failed: number; skipped: number }> => {
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
    const allSubs: any[] = await ctx.runQuery(api.pushSubscriptions.getAllSubscriptions);

    // Haal alle userIds op die al eerder een notificatie ontvingen
    const alreadyNotified: string[] = await ctx.runQuery(api.pushSubscriptions.getAllNotifiedUserIds);
    const notifiedSet = new Set(alreadyNotified);

    // Filter: alleen subscribers die nog nooit een notificatie kregen
    const newSubs = allSubs.filter((s: any) => !notifiedSet.has(s.userId));

    if (newSubs.length === 0) {
      return { sent: 0, failed: 0, skipped: allSubs.length };
    }

    const payload = JSON.stringify({
      title: args.title,
      body: args.body,
      url: args.url || "/account",
      icon: "/icon-192.png",
      badge: "/icon-192.png",
    });

    let successCount = 0;
    const failedEndpoints: string[] = [];

    for (const sub of newSubs) {
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

    // Verzamel unieke userIds van succesvolle verzendingen
    const sentUserIds = newSubs
      .filter((s: any) => !failedEndpoints.includes(s.endpoint))
      .map((s: any) => s.userId as string);
    const uniqueRecipients = Array.from(new Set(sentUserIds));

    // Sla notificatie op in geschiedenis
    if (successCount > 0) {
      await ctx.runMutation(api.pushSubscriptions.recordNotification, {
        title: args.title,
        body: args.body,
        url: args.url,
        recipientCount: successCount,
        recipients: uniqueRecipients,
      });
    }

    return { sent: successCount, failed: newSubs.length - successCount, skipped: allSubs.length - newSubs.length };
  },
});
