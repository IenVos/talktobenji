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
import type * as chat from "../chat.js";
import type * as credentials from "../credentials.js";
import type * as crons from "../crons.js";
import type * as deleteAccount from "../deleteAccount.js";
import type * as emailTemplates from "../emailTemplates.js";
import type * as emails from "../emails.js";
import type * as exampleData from "../exampleData.js";
import type * as featureVotes from "../featureVotes.js";
import type * as feedback from "../feedback.js";
import type * as handreikingen from "../handreikingen.js";
import type * as http from "../http.js";
import type * as inspiratie from "../inspiratie.js";
import type * as klantbeheer from "../klantbeheer.js";
import type * as knowledgeBase from "../knowledgeBase.js";
import type * as memories from "../memories.js";
import type * as notes from "../notes.js";
import type * as onderweg from "../onderweg.js";
import type * as preferences from "../preferences.js";
import type * as pushNotifications from "../pushNotifications.js";
import type * as pushSubscriptions from "../pushSubscriptions.js";
import type * as reflecties from "../reflecties.js";
import type * as seedData from "../seedData.js";
import type * as settings from "../settings.js";
import type * as sources from "../sources.js";
import type * as subscriptions from "../subscriptions.js";
import type * as supportFaq from "../supportFaq.js";
import type * as trials from "../trials.js";
import type * as user from "../user.js";

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
  chat: typeof chat;
  credentials: typeof credentials;
  crons: typeof crons;
  deleteAccount: typeof deleteAccount;
  emailTemplates: typeof emailTemplates;
  emails: typeof emails;
  exampleData: typeof exampleData;
  featureVotes: typeof featureVotes;
  feedback: typeof feedback;
  handreikingen: typeof handreikingen;
  http: typeof http;
  inspiratie: typeof inspiratie;
  klantbeheer: typeof klantbeheer;
  knowledgeBase: typeof knowledgeBase;
  memories: typeof memories;
  notes: typeof notes;
  onderweg: typeof onderweg;
  preferences: typeof preferences;
  pushNotifications: typeof pushNotifications;
  pushSubscriptions: typeof pushSubscriptions;
  reflecties: typeof reflecties;
  seedData: typeof seedData;
  settings: typeof settings;
  sources: typeof sources;
  subscriptions: typeof subscriptions;
  supportFaq: typeof supportFaq;
  trials: typeof trials;
  user: typeof user;
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
