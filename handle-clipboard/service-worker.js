const CACHE_VERSION = '2023/04/12-17:50';
const CACHE_NAME_SEPARATOR = ' '; // path 中の 半角スペース は url encode されるため混同される可能性がない
const CACHE_NAME = `${self.registration.scope}${CACHE_NAME_SEPARATOR}${CACHE_VERSION}`;

const urlsToCache = [
	'./',
	'./index.html',
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

const showNotification = ({
	silent,
}) => {
	const title = 'Handle Clipboard';
	return self.registration.showNotification(title, {
		body: 'Open',
		icon: './icons/144.png',
		silent,
		tag: 'open',
	});
};

self.addEventListener('message', event => {
	if (event.data.method === 'start-notification') {
		event.waitUntil(showNotification({
			silent: event.data.silent,
		}));
	} else if (event.data.method === 'stop-notification') {
		const promise = self.registration.getNotifications().then(notifications => {
			notifications.forEach(n => n.close());
		});
		event.waitUntil(promise);
	}
});

self.addEventListener('notificationclick', (event) => {
	if (event.notification.tag === 'open') {
		event.waitUntil(self.clients.openWindow('./?from=notification'));
	}
});

// Android Chrome: 動作確認済み
// Windows Chrome: デフォルトだと未発火 ( chrome://flags/#enable-system-notifications を disabled にすれば発火する )
self.addEventListener('notificationclose', (event) => {
	// event.waitUntil を使うと無限に通知を出せない
	showNotification({
		silent: event.notification.silent,
	});
});
