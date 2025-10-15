const CACHE_NAME = "wall-paint-cache-v2";
const urlsToCache = [
  "/",
  "./index.html",
  "./custom.html", // Added new page
  "./css/style.css",
  "./css/custom-visualizer.css", // Added new CSS
  "./js/main.js",
  "./js/custom-visualizer.js", // Added new JS
  "./colors.js",
  "./icons/icon-192x192.png",
  "./icons/icon-512x512.png",
  // Add other important assets like logo, etc.
  "./icons/logo-brand-wallpaint.png",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log("Opened cache");
      return cache.addAll(urlsToCache);
    })
  );
});

self.addEventListener("fetch", (event) => {
  event.respondWith(
    caches.match(event.request).then((response) => {
      if (response) {
        return response;
      }
      return fetch(event.request);
    })
  );
});

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
