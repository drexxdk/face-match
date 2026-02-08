const CACHE_NAME = "guess-who-v1";
const OFFLINE_URL = "/offline";

// Assets to cache immediately on install
const PRECACHE_ASSETS = ["/", "/offline", "/manifest.json"];

// Install event - cache core assets
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(PRECACHE_ASSETS);
    }),
  );
  self.skipWaiting();
});

// Activate event - clean up old caches
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => name !== CACHE_NAME)
          .map((name) => caches.delete(name)),
      );
    }),
  );
  self.clients.claim();
});

// Fetch event - network first, fallback to cache
self.addEventListener("fetch", (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests
  if (request.method !== "GET") return;

  // Only handle http and https requests (skip chrome-extension://, etc.)
  if (!url.protocol.startsWith("http")) return;

  // Skip API requests and Supabase calls
  if (url.pathname.startsWith("/api") || url.hostname.includes("supabase")) {
    return;
  }

  // For navigation requests, try network first, then offline page
  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request).catch(() => {
        return caches.match(OFFLINE_URL);
      }),
    );
    return;
  }

  // For other requests, try network first, then cache
  event.respondWith(
    fetch(request)
      .then((response) => {
        // Cache successful responses
        if (response.ok) {
          const responseClone = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(request, responseClone);
          });
        }
        return response;
      })
      .catch(() => {
        return caches.match(request);
      }),
  );
});

// Handle messages from the app
self.addEventListener("message", (event) => {
  if (event.data === "skipWaiting") {
    self.skipWaiting();
  }
});
