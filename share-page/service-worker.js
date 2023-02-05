const CACHE_VERSION = '2022/10/06-14:10';
const CACHE_NAME_SEPARATOR = ' '; // path 中の 半角スペース は url encode されるため混同される可能性がない
const CACHE_NAME = `${self.registration.scope}${CACHE_NAME_SEPARATOR}${CACHE_VERSION}`;

const urlsToCache = [
	'./',
	'./index.html',
	'./share_target.html',
	'https://tksugimoto.github.io/my-web-components/check-box/check-box.js',
];

const toNoCacheRequest = url => {
	return new Request(url, {
		cache: 'no-cache',
	});
};

self.addEventListener('install', event => {
	const promise = Promise.all([
		caches.open(CACHE_NAME).then(cache => cache.addAll(urlsToCache.map(toNoCacheRequest))),
		self.skipWaiting(),
	]);
	event.waitUntil(promise);
});

self.addEventListener('activate', event => {
	const cacheDeletionPromise = caches.keys().then(cacheNames => {
		const cachesToDelete = cacheNames.filter(cacheName => {
			const [scope, version] = cacheName.split(CACHE_NAME_SEPARATOR);
			return scope === self.registration.scope && version !== CACHE_VERSION;
		});
		const promises = cachesToDelete.map(cacheName => caches.delete(cacheName));
		return Promise.all(promises);
	});
	event.waitUntil(Promise.all([
		cacheDeletionPromise,
		self.clients.claim(),
	]));
});

self.addEventListener('fetch', event => {
	const responsePromise = caches.open(CACHE_NAME).then(cache => {
		return cache.match(event.request, {
			ignoreSearch: true,
		}).then(cacheResponse => {
			if (cacheResponse) {
				return cacheResponse;
			}

			return fetch(event.request).then(response => {
				if (response.ok) {
					cache.put(event.request, response.clone());
				}
				return response;
			});
		});
	});
	event.respondWith(responsePromise);
});
