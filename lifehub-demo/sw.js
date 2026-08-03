/**
 * LifeHub Service Worker — enables offline use and "Add to Home Screen" install.
 */

const CACHE_NAME = "lifehub-v1";
const ASSETS = [
  "./",
  "./index.html",
  "./manifest.json",
  "./css/themes.css",
  "./css/styles.css",
  "./css/home.css",
  "./css/landing.css",
  "./js/app.js",
  "./js/components/appLinks.js",
  "./js/components/documentsTab.js",
  "./js/components/homeTab.js",
  "./js/components/icons.js",
  "./js/components/landing.js",
  "./js/components/login.js",
  "./js/components/logo.js",
  "./js/components/modal.js",
  "./js/components/onboarding.js",
  "./js/components/settingsTab.js",
  "./js/components/todayTab.js",
  "./js/data/dummyData.js",
  "./js/services/aiService.js",
  "./js/services/appLinksService.js",
  "./js/services/clarityService.js",
  "./js/services/notificationService.js",
  "./js/services/pwaService.js",
  "./js/services/storageService.js",
  "./js/utils/dates.js",
  "./js/utils/helpers.js",
  "./js/utils/lifeScore.js",
  "./icons/icon.svg",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS).catch(() => {}))
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;

  event.respondWith(
    caches.match(event.request).then((cached) => {
      const fetched = fetch(event.request)
        .then((response) => {
          if (response.ok) {
            const clone = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
          }
          return response;
        })
        .catch(() => cached);

      return cached || fetched;
    })
  );
});
