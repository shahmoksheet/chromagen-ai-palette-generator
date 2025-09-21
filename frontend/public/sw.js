const CACHE_NAME = 'chromagen-v1';
const STATIC_ASSETS = [
  '/',
  '/static/js/bundle.js',
  '/static/css/main.css',
  '/manifest.json',
];

// Install event - cache static assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('Caching static assets');
        return cache.addAll(STATIC_ASSETS);
      })
      .catch((error) => {
        console.error('Failed to cache static assets:', error);
      })
  );
  self.skipWaiting();
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// Fetch event - serve from cache with network fallback
self.addEventListener('fetch', (event) => {
  // Skip non-GET requests
  if (event.request.method !== 'GET') {
    return;
  }

  // Skip API requests
  if (event.request.url.includes('/api/')) {
    return;
  }

  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        // Return cached version if available
        if (response) {
          return response;
        }

        // Otherwise fetch from network
        return fetch(event.request)
          .then((response) => {
            // Don't cache non-successful responses
            if (!response || response.status !== 200 || response.type !== 'basic') {
              return response;
            }

            // Clone the response for caching
            const responseToCache = response.clone();

            caches.open(CACHE_NAME)
              .then((cache) => {
                cache.put(event.request, responseToCache);
              });

            return response;
          })
          .catch(() => {
            // Return offline fallback if available
            if (event.request.destination === 'document') {
              return caches.match('/');
            }
          });
      })
  );
});

// Background sync for offline palette generation
self.addEventListener('sync', (event) => {
  if (event.tag === 'palette-generation') {
    event.waitUntil(
      // Handle offline palette generation queue
      handleOfflinePaletteGeneration()
    );
  }
});

async function handleOfflinePaletteGeneration() {
  try {
    // Get queued palette generation requests from IndexedDB
    const queuedRequests = await getQueuedRequests();
    
    for (const request of queuedRequests) {
      try {
        const response = await fetch('/api/generate/text', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(request.data),
        });

        if (response.ok) {
          // Remove from queue and notify client
          await removeFromQueue(request.id);
          await notifyClient('palette-generated', await response.json());
        }
      } catch (error) {
        console.error('Failed to process queued request:', error);
      }
    }
  } catch (error) {
    console.error('Background sync failed:', error);
  }
}

async function getQueuedRequests() {
  // Implementation would use IndexedDB to store offline requests
  return [];
}

async function removeFromQueue(id) {
  // Implementation would remove request from IndexedDB
}

async function notifyClient(type, data) {
  const clients = await self.clients.matchAll();
  clients.forEach(client => {
    client.postMessage({ type, data });
  });
}