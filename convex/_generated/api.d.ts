/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as admin from "../admin.js";
import type * as adminAuth from "../adminAuth.js";
import type * as ai from "../ai.js";
import type * as analytics from "../analytics.js";
import type * as authAdapter from "../authAdapter.js";
import type * as authSchema from "../authSchema.js";
import type * as benjiTeasers from "../benjiTeasers.js";
import type * as blogPosts from "../blogPosts.js";
import type * as chat from "../chat.js";
import type * as checkoutProducts from "../checkoutProducts.js";
import type * as comingSoonFeatures from "../comingSoonFeatures.js";
import type * as credentials from "../credentials.js";
import type * as crons from "../crons.js";
import type * as ctaBlocks from "../ctaBlocks.js";
import type * as dataExport from "../dataExport.js";
import type * as deleteAccount from "../deleteAccount.js";
import type * as emailTemplates from "../emailTemplates.js";
import type * as emailTemplatesDefaults from "../emailTemplatesDefaults.js";
import type * as emails from "../emails.js";
import type * as embeddings from "../embeddings.js";
import type * as exampleData from "../exampleData.js";
import type * as featureVotes from "../featureVotes.js";
import type * as feedback from "../feedback.js";
import type * as giftActions from "../giftActions.js";
import type * as giftCodes from "../giftCodes.js";
import type * as giftScheduled from "../giftScheduled.js";
import type * as handreikingen from "../handreikingen.js";
import type * as homepageFaq from "../homepageFaq.js";
import type * as houvast from "../houvast.js";
import type * as http from "../http.js";
import type * as inactiveAccounts from "../inactiveAccounts.js";
import type * as inspiratie from "../inspiratie.js";
import type * as jaarRenewal from "../jaarRenewal.js";
import type * as klantbeheer from "../klantbeheer.js";
import type * as knowledgeBase from "../knowledgeBase.js";
import type * as landingPages from "../landingPages.js";
import type * as memories from "../memories.js";
import type * as nietAlleen from "../nietAlleen.js";
import type * as nietAlleenAnkerContent from "../nietAlleenAnkerContent.js";
import type * as nietAlleenContent from "../nietAlleenContent.js";
import type * as nietAlleenEmails from "../nietAlleenEmails.js";
import type * as notes from "../notes.js";
import type * as onderweg from "../onderweg.js";
import type * as pageContent from "../pageContent.js";
import type * as pillars from "../pillars.js";
import type * as preferences from "../preferences.js";
import type * as pushNotifications from "../pushNotifications.js";
import type * as pushSubscriptions from "../pushSubscriptions.js";
import type * as reflecties from "../reflecties.js";
import type * as security from "../security.js";
import type * as seedData from "../seedData.js";
import type * as settings from "../settings.js";
import type * as siteAnalytics from "../siteAnalytics.js";
import type * as sources from "../sources.js";
import type * as subscriptions from "../subscriptions.js";
import type * as supportFaq from "../supportFaq.js";
import type * as testimonials from "../testimonials.js";
import type * as trials from "../trials.js";
import type * as user from "../user.js";
import type * as verliesTypen from "../verliesTypen.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  admin: typeof admin;
  adminAuth: typeof adminAuth;
  ai: typeof ai;
  analytics: typeof analytics;
  authAdapter: typeof authAdapter;
  authSchema: typeof authSchema;
  benjiTeasers: typeof benjiTeasers;
  blogPosts: typeof blogPosts;
  chat: typeof chat;
  checkoutProducts: typeof checkoutProducts;
  comingSoonFeatures: typeof comingSoonFeatures;
  credentials: typeof credentials;
  crons: typeof crons;
  ctaBlocks: typeof ctaBlocks;
  dataExport: typeof dataExport;
  deleteAccount: typeof deleteAccount;
  emailTemplates: typeof emailTemplates;
  emailTemplatesDefaults: typeof emailTemplatesDefaults;
  emails: typeof emails;
  embeddings: typeof embeddings;
  exampleData: typeof exampleData;
  featureVotes: typeof featureVotes;
  feedback: typeof feedback;
  giftActions: typeof giftActions;
  giftCodes: typeof giftCodes;
  giftScheduled: typeof giftScheduled;
  handreikingen: typeof handreikingen;
  homepageFaq: typeof homepageFaq;
  houvast: typeof houvast;
  http: typeof http;
  inactiveAccounts: typeof inactiveAccounts;
  inspiratie: typeof inspiratie;
  jaarRenewal: typeof jaarRenewal;
  klantbeheer: typeof klantbeheer;
  knowledgeBase: typeof knowledgeBase;
  landingPages: typeof landingPages;
  memories: typeof memories;
  nietAlleen: typeof nietAlleen;
  nietAlleenAnkerContent: typeof nietAlleenAnkerContent;
  nietAlleenContent: typeof nietAlleenContent;
  nietAlleenEmails: typeof nietAlleenEmails;
  notes: typeof notes;
  onderweg: typeof onderweg;
  pageContent: typeof pageContent;
  pillars: typeof pillars;
  preferences: typeof preferences;
  pushNotifications: typeof pushNotifications;
  pushSubscriptions: typeof pushSubscriptions;
  reflecties: typeof reflecties;
  security: typeof security;
  seedData: typeof seedData;
  settings: typeof settings;
  siteAnalytics: typeof siteAnalytics;
  sources: typeof sources;
  subscriptions: typeof subscriptions;
  supportFaq: typeof supportFaq;
  testimonials: typeof testimonials;
  trials: typeof trials;
  user: typeof user;
  verliesTypen: typeof verliesTypen;
}>;

/**
 * A utility for referencing Convex functions in your app's public API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;

/**
 * A utility for referencing Convex functions in your app's internal API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = internal.myModule.myFunction;
 * ```
 */
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;

export declare const components: {};
