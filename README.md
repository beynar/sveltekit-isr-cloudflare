# sveltekit-cloudflare-isr

Similar to what next-13 does with its overload of globalThis.fetch, this hooks make available an isr fetcher under your app.locals.

Rather than caching at the page level, it implements an isr mechanism at the request level.

This library assumes that your are using the cloudflare page / worker adapter.
