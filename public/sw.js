// Service Worker for Hackerspace Mumbai website
// Provides caching, offline functionality, and performance optimizations

const CACHE_NAME = 'hackmum-v1.0.0';
const STATIC_CACHE = 'hackmum-static-v1.0.0';
const DYNAMIC_CACHE = 'hackmum-dynamic-v1.0.0';
const IMAGE_CACHE = 'hackmum-images-v1.0.0';

// Assets to cache immediately
const STATIC_ASSETS = [
  '/',
  '/manifest.json',
  '/favicon.ico',
  '/hero-background.jpg',
  '/social-preview.jpg',
  // Add other critical assets
];

// Cache strategies
const CACHE_STRATEGIES = {
  // Cache first, then network (for static assets)
  CACHE_FIRST: 'cache-first',
  // Network first, then cache (for dynamic content)
  NETWORK_FIRST: 'network-first',
  // Stale while revalidate (for frequently updated content)
  STALE_WHILE_REVALIDATE: 'stale-while-revalidate',
  // Network only (for critical API calls)
  NETWORK_ONLY: 'network-only'
};

// Install event - cache static assets
self.addEventListener('install', (event) => {
  console.log('Service Worker: Installing...');
  
  event.waitUntil(
    caches.open(STATIC_CACHE)
      .then((cache) => {
        console.log('Service Worker: Caching static assets');
        return cache.addAll(STATIC_ASSETS);
      })
      .then(() => {
        console.log('Service Worker: Static assets cached');
        return self.skipWaiting();
      })
      .catch((error) => {
        console.error('Service Worker: Failed to cache static assets', error);
      })
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('Service Worker: Activating...');
  
  event.waitUntil(
    caches.keys()
      .then((cacheNames) => {
        const validPrefixes = [
          STATIC_CACHE.replace(/-v[\d.]+$/, ''),
          DYNAMIC_CACHE.replace(/-v[\d.]+$/, ''),
          IMAGE_CACHE.replace(/-v[\d.]+$/, '')
        ];
        const validNames = [STATIC_CACHE, DYNAMIC_CACHE, IMAGE_CACHE];
        return Promise.all(
          cacheNames.map((cacheName) => {
            // Delete if cacheName starts with a valid prefix but is not the current version
            const shouldDelete = validPrefixes.some(prefix =>
              cacheName.startsWith(prefix) && !validNames.includes(cacheName)
            );
            if (shouldDelete) {
              console.log('Service Worker: Deleting old cache', cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      })
      .then(() => {
        console.log('Service Worker: Activated');
        return self.clients.claim();
      })
  );
});

// Fetch event - handle requests with appropriate caching strategy
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);
  
  // Skip non-GET requests
  if (request.method !== 'GET') {
    return;
  }
  
  // Skip cross-origin requests (except for known CDNs)
  if (url.origin !== location.origin && !isTrustedOrigin(url.origin)) {
    return;
  }
  
  // Determine caching strategy based on request type
  const strategy = getCachingStrategy(request);
  
  switch (strategy) {
    case CACHE_STRATEGIES.CACHE_FIRST:
      event.respondWith(cacheFirst(request));
      break;
    case CACHE_STRATEGIES.NETWORK_FIRST:
      event.respondWith(networkFirst(request));
      break;
    case CACHE_STRATEGIES.STALE_WHILE_REVALIDATE:
      event.respondWith(staleWhileRevalidate(request));
      break;
    case CACHE_STRATEGIES.NETWORK_ONLY:
      // Let the browser handle network-only requests
      break;
    default:
      event.respondWith(networkFirst(request));
  }
});

// Cache-first strategy (for static assets)
async function cacheFirst(request) {
  try {
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }
    
    const networkResponse = await fetch(request);
    if (networkResponse.ok) {
      const cache = await caches.open(getAppropriateCache(request));
      cache.put(request, networkResponse.clone());
    }
    
    return networkResponse;
  } catch (error) {
    console.error('Cache-first strategy failed:', error);
    return getOfflineFallback(request);
  }
}

// Network-first strategy (for dynamic content)
async function networkFirst(request) {
  try {
    const networkResponse = await fetch(request);
    if (networkResponse.ok) {
      const cache = await caches.open(getAppropriateCache(request));
      cache.put(request, networkResponse.clone());
    }
    return networkResponse;
  } catch (error) {
    console.log('Network failed, trying cache:', error);
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }
    return getOfflineFallback(request);
  }
}

// Stale-while-revalidate strategy
async function staleWhileRevalidate(request) {
  const cachedResponse = await caches.match(request);
  
  const networkResponsePromise = fetch(request)
    .then((networkResponse) => {
      if (networkResponse.ok) {
        const cache = caches.open(getAppropriateCache(request));
        cache.then(c => c.put(request, networkResponse.clone()));
      }
      return networkResponse;
    })
    .catch(() => null);
  
  return cachedResponse || networkResponsePromise || getOfflineFallback(request);
}

// Determine caching strategy based on request
function getCachingStrategy(request) {
  const url = new URL(request.url);
  const pathname = url.pathname;
  
  // Static assets - cache first
  if (pathname.match(/\.(css|js|png|jpg|jpeg|gif|svg|webp|avif|ico|woff|woff2|ttf|eot)$/)) {
    return CACHE_STRATEGIES.CACHE_FIRST;
  }
  
  // API endpoints - network first
  // Removed /api/ check for static site
  
  // HTML pages - stale while revalidate
  if (request.headers.get('accept')?.includes('text/html')) {
    return CACHE_STRATEGIES.STALE_WHILE_REVALIDATE;
  }
  
  // Default to network first
  return CACHE_STRATEGIES.NETWORK_FIRST;
}

// Get appropriate cache for request
function getAppropriateCache(request) {
  const url = new URL(request.url);
  const pathname = url.pathname;
  
  // Images
  if (pathname.match(/\.(png|jpg|jpeg|gif|svg|webp|avif|ico)$/)) {
    return IMAGE_CACHE;
  }
  
  // Static assets
  if (pathname.match(/\.(css|js|woff|woff2|ttf|eot)$/)) {
    return STATIC_CACHE;
  }
  
  // Dynamic content
  return DYNAMIC_CACHE;
}

// Check if origin is trusted for caching
function isTrustedOrigin(origin) {
  const trustedOrigins = [
    'https://fonts.googleapis.com',
    'https://fonts.gstatic.com',
    'https://unpkg.com',
    'https://cdn.jsdelivr.net'
  ];
  
  return trustedOrigins.includes(origin);
}

// Get offline fallback response
function getOfflineFallback(request) {
  const url = new URL(request.url);
  const pathname = url.pathname;
  
  // HTML pages - return offline page
  if (request.headers.get('accept')?.includes('text/html')) {
    return new Response(`
      <!DOCTYPE html>
      <html lang="en">
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1">
          <title>Offline - Hackerspace Mumbai</title>
          <style>
            body {
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
              margin: 0;
              padding: 2rem;
              background: #1f2937;
              color: #f9fafb;
              text-align: center;
              min-height: 100vh;
              display: flex;
              flex-direction: column;
              justify-content: center;
              align-items: center;
            }
            .offline-icon {
              font-size: 4rem;
              margin-bottom: 1rem;
            }
            h1 {
              margin-bottom: 1rem;
              color: #ffc107;
            }
            p {
              margin-bottom: 2rem;
              opacity: 0.8;
            }
            .retry-btn {
              background: #ffc107;
              color: #1f2937;
              border: none;
              padding: 0.75rem 1.5rem;
              border-radius: 0.5rem;
              font-weight: 600;
              cursor: pointer;
              transition: background 0.2s;
            }
            .retry-btn:hover {
              background: #f59e0b;
            }
          </style>
        </head>
        <body>
          <div class="offline-icon">📡</div>
          <h1>You're Offline</h1>
          <p>It looks like you're not connected to the internet. Please check your connection and try again.</p>
          <button class="retry-btn" onclick="window.location.reload()">Try Again</button>
        </body>
      </html>
    `, {
      status: 200,
      headers: {
        'Content-Type': 'text/html'
      }
    });
  }
  
  // Images - return placeholder
  if (pathname.match(/\.(png|jpg|jpeg|gif|svg|webp|avif)$/)) {
    return new Response(`
      <svg width="400" height="300" xmlns="http://www.w3.org/2000/svg">
        <rect width="400" height="300" fill="#f3f4f6"/>
        <text x="200" y="150" font-family="Arial, sans-serif" font-size="16" fill="#9ca3af" text-anchor="middle">
          Image unavailable offline
        </text>
      </svg>
    `, {
      status: 200,
      headers: {
        'Content-Type': 'image/svg+xml'
      }
    });
  }
  
  // Default fallback
  return new Response('Offline', {
    status: 503,
    statusText: 'Service Unavailable'
  });
}

// Background sync for analytics and form submissions
self.addEventListener('sync', (event) => {
  if (event.tag === 'background-sync') {
    event.waitUntil(doBackgroundSync());
  }
});

async function doBackgroundSync() {
  // Handle queued analytics events
  try {
    const cache = await caches.open('analytics-queue');
    const requests = await cache.keys();
    
    for (const request of requests) {
      try {
        await fetch(request);
        await cache.delete(request);
      } catch (error) {
        console.log('Failed to sync analytics event:', error);
      }
    }
  } catch (error) {
    console.error('Background sync failed:', error);
  }
}

// Push notification handling
self.addEventListener('push', (event) => {
  if (!event.data) return;
  
  const data = event.data.json();
  const options = {
    body: data.body,
    icon: '/favicon.ico',
    badge: '/favicon.ico',
    data: data.url,
    actions: [
      {
        action: 'open',
        title: 'Open',
        icon: '/favicon.ico'
      },
      {
        action: 'close',
        title: 'Close'
      }
    ]
  };
  
  event.waitUntil(
    self.registration.showNotification(data.title, options)
  );
});

// Notification click handling
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  
  if (event.action === 'open' || !event.action) {
    event.waitUntil(
      clients.openWindow(event.notification.data || '/')
    );
  }
});

// Performance monitoring
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'PERFORMANCE_METRIC') {
    // Store performance metrics for later analysis
    console.log('Performance metric received:', event.data.metric);
  }
});

console.log('Service Worker: Loaded and ready');