/// <reference types="@sveltejs/adapter-cloudflare" />
/// <reference types="@sveltejs/kit" />

declare namespace App {
	interface Platform {
		env: {
			CACHE: KVNamespace<string>;
		};
		context?: {
			waitUntil(promise: Promise<any>): void;
		};
		caches?: CacheStorage & { default: Cache };
	}
	interface Locals {
		fetch: import('sveltekit-cloudflare-isr').Fetcher;
	}
}
