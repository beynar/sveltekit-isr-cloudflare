import { Handle } from '@sveltejs/kit';
import { isr } from 'sveltekit-cloudflare-isr';

export const handle: Handle = isr({
	key: 'fetch',
	longTermCacheDuration: '1 year',
	longTermKVDuration: '1 year',
	KVNamespace: 'CACHE',
	shouldRefreshCache: ({ event }) => {
		return event.request.headers.has('refresh-cache');
	},
	shouldAvoidCache: ({ event }) => {
		return event.cookies.get('DATA-PREVIEW') === 'true';
	},
	cacheName: 'default'
});
