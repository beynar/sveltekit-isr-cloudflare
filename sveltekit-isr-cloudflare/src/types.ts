import type { MaybePromise, RequestEvent } from "@sveltejs/kit/types/internal";

export type duration =
  | `${number} ${"second" | "minute" | "hour" | "day" | "week" | "month" | "year"}${"s" | ""}`
  | number;

export interface ISRConfig {
  duration: duration;
  forceRefresh?: boolean;
  avoidCache?: boolean;
}

export type Fetcher = (
  input: RequestInfo | URL,
  init?: RequestInit | undefined | ISRConfig,
  revalidate?: ISRConfig
) => Promise<Response>;

export interface FetchWithCacheConfig {
  cache?: keyof App.Platform["caches"];
  key:
    | {
        [K in keyof App.Locals]: App.Locals[K] extends Fetcher ? K : never;
      }[keyof App.Locals]
    | null;
  longTermCacheDuration?: duration;
  longTermKVDuration?: duration;
  KVNamespace?: {
    [K in keyof App.Platform["env"]]: App.Platform["env"][K] extends KVNamespace ? K : never;
  }[keyof App.Platform["env"]];
  shouldAvoidCache?: ({ event, request }: { event: RequestEvent; request: Request }) => MaybePromise<boolean>;
  shouldRefreshCache?: ({ event, request }: { event: RequestEvent; request: Request }) => MaybePromise<boolean>;
}
