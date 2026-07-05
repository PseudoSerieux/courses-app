// Intentionally minimal: this app's data is realtime and account-specific,
// so we don't cache API/auth responses (that would risk showing stale or
// mismatched data). This service worker exists mainly so the app qualifies
// as installable ("Add to Home Screen") on more platforms.
self.addEventListener("install", () => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener("fetch", () => {
  // Pass-through: no caching, always hit the network.
});
