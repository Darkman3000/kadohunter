/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as crons from "../crons.js";
import type * as engine from "../engine.js";
import type * as friends from "../friends.js";
import type * as http from "../http.js";
import type * as imageBackfill from "../imageBackfill.js";
import type * as images from "../images.js";
import type * as notifications from "../notifications.js";
import type * as prices from "../prices.js";
import type * as sessions from "../sessions.js";
import type * as testing from "../testing.js";
import type * as trades from "../trades.js";
import type * as users from "../users.js";
import type * as utils_auth from "../utils/auth.js";
import type * as utils_friendships from "../utils/friendships.js";
import type * as utils_imageResolver from "../utils/imageResolver.js";
import type * as wishlists from "../wishlists.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  crons: typeof crons;
  engine: typeof engine;
  friends: typeof friends;
  http: typeof http;
  imageBackfill: typeof imageBackfill;
  images: typeof images;
  notifications: typeof notifications;
  prices: typeof prices;
  sessions: typeof sessions;
  testing: typeof testing;
  trades: typeof trades;
  users: typeof users;
  "utils/auth": typeof utils_auth;
  "utils/friendships": typeof utils_friendships;
  "utils/imageResolver": typeof utils_imageResolver;
  wishlists: typeof wishlists;
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
