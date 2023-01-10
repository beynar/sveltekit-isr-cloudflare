import type { MaybePromise, RequestEvent } from "@sveltejs/kit/types/internal";

export type duration =
  | `${number} ${"second" | "minute" | "hour" | "day" | "week" | "month" | "year"}${"s" | ""}`
  | number;

export interface ISRConfig {
  duration: duration;
  forceRefresh?: boolean;
  avoidCache?: boolean;
  swr?: boolean;
}

export type Fetcher = (
  input: RequestInfo | URL,
  init?: RequestInit | undefined | ISRConfig,
  requestConfig?: ISRConfig
) => Promise<Response>;

export interface FetchWithCacheConfig {
  /**
   * The name of the cache to use.
   * @default "default"
   */
  cacheName?: "default" | (string & {});
  /**
   * @example "fetch"
   * @description
   * The key of the isr fetcher function in your App.Locals
   * You must define it in your app.d.ts first like this:
   * @example
   * declare namespace App {
   *  interface Locals {
   *   fetch: import('sveltekit-cloudflare-isr').Fetcher;
   * }
   *
   */
  key:
    | {
        [K in keyof App.Locals]: App.Locals[K] extends Fetcher ? K : never;
      }[keyof App.Locals]
    | null;
  /**
   * The duration for the cache to be stored
   *
   * It can be a string like "1 day" or a number of milliseconds
   * @default "1 year"
   * @example "1 day" | "12 weeks" | 3600
   */
  longTermCacheDuration?: duration;
  /**
   * The duration for the cache to be stored in the KV store
   *
   * It can be a string like "1 day" or a number of milliseconds
   * @default "1 year"
   * @example "1 day"  | "12 weeks" | 3600
   */
  longTermKVDuration?: duration;
  /**
   * Define it if you want to use a KV store for the cache.
   *
   * This can lead to a better performance because unlike cache KV store is replicated outside of the locale datacenter of the worker.
   * But it can be more expensive.
   *
   * You must define it in your app.d.ts first like this:
   * @example
   * declare namespace App {
   * interface Platform {
   *  env: {
   *  CACHE_STORE: KVNamespace;
   * }
   */
  KVNamespace?: {
    [K in keyof App.Platform["env"]]: App.Platform["env"][K] extends KVNamespace ? K : never;
  }[keyof App.Platform["env"]];
  /**
   * Define it if you want to avoid the cache for some requests.
   *
   * It receives the event triggering the hook and the request that will be fetched
   * @example
   * shouldAvoidCache: ({ event }) => {
   *    return event.request.headers.has('avoid-cache')
   * }
   */
  shouldAvoidCache?: ({ event, request }: { event: RequestEvent; request: Request }) => MaybePromise<boolean>;
  /**
   * Define it if you want to refresh the cache for some requests.
   *
   * It receives the event triggering the hook and the request that will be fetched.
   * @example
   * shouldRefreshCache: ({ event }) => {
   *    return event.request.headers.has('refresh-cache')
   * }
   */
  shouldRefreshCache?: ({ event, request }: { event: RequestEvent; request: Request }) => MaybePromise<boolean>;
}
