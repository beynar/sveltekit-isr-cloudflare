import { Handle } from "@sveltejs/kit";
import type { FetchWithCacheConfig, Fetcher } from "./types";
import { durationToMilliseconds, generateHash, makeCacheableResponse } from "./utils";

export const isr =
  (
    {
      key,
      cacheName,
      shouldAvoidCache = () => false,
      shouldRefreshCache = () => false,
      longTermCacheDuration = "1 year",
      longTermKVDuration = "1 year",
      KVNamespace
    }: FetchWithCacheConfig | undefined = { key: null }
  ): Handle =>
  ({ resolve, event }) => {
    if (!key) {
      throw new Error("Please set the the key under which the isr fetcher is stored in the locals object.");
    }
    const cacheFetcher: Fetcher = async (input, init, requestIsr) => {
      const getInit = (): RequestInit | undefined => {
        if (init && "duration" in init) {
          requestIsr = init;
          init = {};
        }
        return init || {};
      };

      const { duration, forceRefresh, avoidCache, swr = true } = requestIsr || {};
      const { platform } = event as { platform: App.Platform };
      const request = new Request(input, getInit());
      const programmaticRevalidation = event.request.headers.get("x-revalidate") === "true";

      if (avoidCache || !duration || (await shouldAvoidCache({ event, request }))) {
        return fetch(input, getInit());
      }

      return new Promise(async (res) => {
        const CACHE = (
          cacheName === "default" || !cacheName ? platform?.caches?.default : await platform?.caches?.open(cacheName)
        ) as Cache;
        const KV = KVNamespace ? platform?.env?.[KVNamespace] : undefined;
        if (CACHE) {
          const { hash, cacheKey } = await generateHash(request);

          const revalidate = (response?: Response) =>
            platform.context?.waitUntil(
              new Promise<void>((res) => {
                const put = async (response: Response) => {
                  if (KV) {
                    await KV.put(hash, await new Response(response.clone().body, response).text(), {
                      expirationTtl: durationToMilliseconds(longTermKVDuration) / 60
                    });
                  }
                  return CACHE.put(
                    cacheKey,
                    makeCacheableResponse(response, { longTermCacheDuration, duration, longTermKVDuration }).clone()
                  ).then(res);
                };
                if (response) {
                  put(response);
                } else if (request) {
                  fetch(request.clone()).then(put);
                }
              })
            );

          if (programmaticRevalidation || forceRefresh || (await shouldRefreshCache({ event, request }))) {
            console.log("force refresh", hash);
            revalidate();
            return res(fetch(request));
          }

          const match = await CACHE.match(cacheKey);
          if (match) {
            console.log("cache hit", hash);
            const isExpired = new Date(match.headers.get("Expires") || "").getTime() < Date.now();
            if (isExpired) {
              console.log("cache expired", hash);
              revalidate();
              if (!swr) {
                return res(fetch(request));
              }
            }
            return res(match);
          } else {
            if (!swr) {
              revalidate();
              return res(fetch(request));
            }
            if (KV) {
              const kvMatch = await KV.get(hash, "text");

              if (kvMatch) {
                console.log("kv hit", hash);

                revalidate();
                return res(new Response(kvMatch));
              }
            }
            const response = await fetch(request.clone());
            console.log("cache miss", hash);
            revalidate(response);
            return res(response);
          }
        } else {
          return res(fetch(request));
        }
      });
    };
    if (event.url.pathname === "/revalidateRoute") {
      const route = new URL(event.request.url).searchParams.get("route");
      console.log(event.url.origin, `${event.url.origin}${route}`, { route });
      fetch(`${event.url.origin}${route}`, {
        headers: {
          "x-revalidate": "true"
        }
      });
      return new Response(`Revalidating ${event.url.origin}${route}`, { status: 200 });
    }
    // @ts-ignore
    event.locals[key] = cacheFetcher;
    return resolve(event);
  };
