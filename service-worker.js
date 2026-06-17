const CACHE_NAME = 'verdiqo-cache-v1';
const ASSETS = [
  './',
  './index.html',
  './manifest.json',
  './src/index.css',
  './src/app.js',
  './src/verdiqo_db.js',
  './src/verdiqo_icon.png',
  './src/utils/verificationEngine.js',
  './src/components/DashboardAdmin.js',
  './src/components/DashboardCitizen.js',
  './src/components/DashboardJudge.js',
  './src/components/DashboardStaff.js',
  './src/components/ReportViewer.js'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      return cache.addAll(ASSETS);
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys => {
      return Promise.all(
        keys.map(key => {
          if (key !== CACHE_NAME) {
            return caches.delete(key);
          }
        })
      );
    })
  );
  self.clients.claim();
});

self.addEventListener('fetch', event => {
  // Exclude API requests from cache to ensure real-time sync between users
  if (event.request.url.includes('/api/')) {
    return event.respondWith(fetch(event.request));
  }

  event.respondWith(
    caches.match(event.request).then(cachedResponse => {
      if (cachedResponse) {
        return cachedResponse;
      }
      return fetch(event.request);
    })
  );
});
