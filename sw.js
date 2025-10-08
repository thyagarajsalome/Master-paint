const CACHE_NAME = "wall-paint-v1";
// Essential files for the app shell
const urlsToCache = [
  "/",
  "/index.html",
  "/css/style.css",
  "/css/normalize.css",
  "/index.js",
  "/colors.js",
  "/logo-small.png",
  "/images-livingroom/base.jpg",
  "/images-kitchen/base.jpg",
  "/images-bedroom/base.jpg",
  "/images-exterior/base.jpg",
  // Add other essential pages if any
  "/pages/about.html",
  "/pages/contact.html",
  "/pages/faq.html",
  "/pages/policy.html",
  "/pages/disclaimer.html",
  "icons/icon-192x192.png",
  "icons/icon-512x512.png",
  "manifest.json",
];

// Install event: cache the app shell
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log("Opened cache");
      return cache.addAll(urlsToCache);
    })
  );
});

// Activate event: clean up old caches
self.addEventListener("activate", (event) => {
  const cacheWhitelist = [CACHE_NAME];
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheWhitelist.indexOf(cacheName) === -1) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});

// Fetch event: serve from cache first, then network
self.addEventListener("fetch", (event) => {
  event.respondWith(
    caches.match(event.request).then((response) => {
      // Cache hit - return response
      if (response) {
        return response;
      }

      // Clone the request because it's a one-time-use stream
      const fetchRequest = event.request.clone();

      return fetch(fetchRequest).then((response) => {
        // Check if we received a valid response
        if (!response || response.status !== 200 || response.type !== "basic") {
          return response;
        }

        // Clone the response because it's also a one-time-use stream
        const responseToCache = response.clone();

        caches.open(CACHE_NAME).then((cache) => {
          cache.put(event.request, responseToCache);
        });

        return response;
      });
    })
  );
});
