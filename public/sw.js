// Yondaime Mobile-First Service Worker for Push Notifications and PWA Caching

const CACHE_NAME = 'pexih-cache-v3';
const DYNAMIC_CACHE = 'pexih-dynamic-v3';

// App shell resources to pre-cache
const PRECACHE_URLS = [
  '/',
  '/explore',
  '/bookmarks',
  '/profile',
  '/favicon.svg',
  '/logo-default.svg'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        return cache.addAll(PRECACHE_URLS);
      })
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.filter((name) => {
          return name !== CACHE_NAME && name !== DYNAMIC_CACHE;
        }).map((name) => {
          return caches.delete(name);
        })
      );
    }).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  // Skip cross-origin requests, like those for Google Analytics.
  if (!event.request.url.startsWith(self.location.origin) || event.request.method !== 'GET') {
    return;
  }
  
  // Skip chrome-extension:// and socket connections
  if (event.request.url.includes('socket') || event.request.url.startsWith('chrome-extension')) {
    return;
  }

  // Network First, fallback to cache for HTML (so we get fresh articles if online, cached if offline)
  // For other assets (JS/CSS/images), Stale While Revalidate
  if (event.request.headers.get('accept').includes('text/html')) {
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          const resClone = response.clone();
          caches.open(DYNAMIC_CACHE).then((cache) => {
            cache.put(event.request, resClone);
          });
          return response;
        })
        .catch(() => {
          return caches.match(event.request);
        })
    );
  } else {
    event.respondWith(
      caches.match(event.request)
        .then((response) => {
          return response || fetch(event.request).then((res) => {
            const resClone = res.clone();
            caches.open(DYNAMIC_CACHE).then((cache) => {
              cache.put(event.request, resClone);
            });
            return res;
          });
        })
    );
  }
});

self.addEventListener("push", function (event) {
  event.waitUntil(
    fetch("/api/notifications/latest")
      .then(function (response) {
        if (!response.ok) {
          throw new Error("Failed to fetch latest notification details");
        }
        return response.json();
      })
      .then(function (data) {
        var title = data.title || "Yondaime";
        var options = {
          body: data.body || "A new story is online. Dive into the world of tech!",
          icon: "/favicon.svg",
          badge: "/y-icon.svg",
          data: {
            url: data.url || "/"
          },
          tag: "yondaime-push-notification",
          renotify: true
        };
        return self.registration.showNotification(title, options);
      })
      .catch(function (err) {
        console.error("Push event fetch/display error:", err);
        // Fallback generic notification
        return self.registration.showNotification("Yondaime", {
          body: "New updates are available on Yondaime! Tap to open.",
          icon: "/favicon.svg",
          badge: "/y-icon.svg",
          data: {
            url: "/"
          }
        });
      })
  );
});

self.addEventListener("notificationclick", function (event) {
  event.notification.close();
  var urlToOpen = event.notification.data ? event.notification.data.url : "/";

  event.waitUntil(
    clients.matchAll({ type: "window", includeUncontrolled: true })
      .then(function (windowClients) {
        // Correctly handle focusing an existing window tab or opening a new one
        for (var i = 0; i < windowClients.length; i++) {
          var client = windowClients[i];
          if (client.url.indexOf(urlToOpen) !== -1 && "focus" in client) {
            return client.focus();
          }
        }
        if (clients.openWindow) {
          return clients.openWindow(urlToOpen);
        }
      })
  );
});
