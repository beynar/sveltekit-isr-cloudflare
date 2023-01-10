# sveltekit-cloudflare-isr

Similar to what next-13 does with its overload of globalThis.fetch, this hooks make available an ISR fetcher under your app.locals.

Rather than performing a page caching, it implements an ISR mechanism at the request level.

This library assumes that your are using the cloudflare page / worker adapter.

I don't really know if we can call it an isr library stricto sensu because we need a way to populate / refresh the cache at build time.
But I think it's pretty close to the experience we had with next.js and it's still pretty fast.

- Request level caching
- Avoid cache / force refresh / duration request configuration
- Programmatic revalidation
- Programmatic cache avoidance global configuration (useful for preview mode for example).
- Use cloudflare worker cache api by default but you can also use a KV store to replicate the cache at the edge.

## How it works

It first look up in the cache of the data center of the request. If a match is found it will return it. If no match is found and you have a KV namespace configured it will look up in the KV store and return the eventual result. If no KV match, it will fetch the request and return the response.

If any of the following condition are truthy it will revalidate the cache (and KV f configured):

- No match is found in the cache
- The match in the cache is Expired
- The shouldRevalidate function return true
- The forceRevalidate request option is set to true

If any of the following conditions are truthy it will avoid the cache

- No cache is found in the context
- The shouldAvoidCache function return true
- The avoidCache request option is set to true

The revalidation process uses the `waitUntil` cloudflare function in order to be executed in the background and not to block the main response to be delivered.

If the request need to be revalidated, the function will always return the stale response unless the `swr` option is set to false at the request level.

![schema](./schema.png)

## How to use

### The fetcher

Use the fetcher as a normal fetch function, but with a last argument which will tell the isr config.

```ts
interface ISRConfig {
  duration: duration;
  forceRefresh?: boolean;
  avoidCache?: boolean;
  swr?: boolean;
}
type duration = `${number} ${"second" | "minute" | "hour" | "day" | "week" | "month" | "year"}${"s" | ""}` | number;
```

```ts
// routes/+page.server.ts
import type { PageServerLoad } from "./$types";

export const load: PageServerLoad = async ({ locals }) => {
  const posts = await locals.fetch("https://api.example.com/posts", { duration: "1 day" });

  return {
    posts
  };
};
```

### The hook

```ts
// src/hooks.server.ts
// Simple example
import { Handle } from "@sveltejs/kit";
import { isr } from "sveltekit-cloudflare-isr";

export const handle: Handle = isr({ key: "fetch" });
```

```ts
// src/hooks.server.ts
// Complex example
import { Handle } from "@sveltejs/kit";
import { isr } from "sveltekit-cloudflare-isr";

export const handle: Handle = isr({
  key: "fetch",
  longTermCacheDuration: "1 year",
  longTermKVDuration: "1 year",
  KVNamespace: "CACHE",
  shouldRefreshCache: ({ event }) => {
    return event.request.headers.has("refresh-cache");
  },
  shouldAvoidCache: ({ event }) => {
    return event.cookies.get("DATA-PREVIEW") === "true";
  },
  cacheName: "default"
});
```
