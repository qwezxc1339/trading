self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open('trade-signal-v1').then((cache) => {
      return cache.addAll([
        '/',
        'style.css',
        'script.js',
        'https://d3js.org/d3.v7.min.js'
      ]);
    })
  );
});

self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request).then((response) => {
      return response || fetch(event.request);
    })
  );
});
