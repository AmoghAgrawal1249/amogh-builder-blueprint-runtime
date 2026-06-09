/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as auth from "../auth.js";
import type * as crons from "../crons.js";
import type * as emailFormats from "../emailFormats.js";
import type * as health from "../health.js";
import type * as http from "../http.js";
import type * as internal_auth from "../internal/auth.js";
import type * as settings from "../settings.js";
import type * as teammateIdentity from "../teammateIdentity.js";
import type * as teammates from "../teammates.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  auth: typeof auth;
  crons: typeof crons;
  emailFormats: typeof emailFormats;
  health: typeof health;
  http: typeof http;
  "internal/auth": typeof internal_auth;
  settings: typeof settings;
  teammateIdentity: typeof teammateIdentity;
  teammates: typeof teammates;
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
