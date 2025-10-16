// Service Worker para PWA SVLentes
// Versão 1.0.0 - Suporte offline completo com estratégias de cache

const CACHE_VERSION = 'v1.0.0';
const CACHE_NAME = `svlentes-pwa-${CACHE_VERSION}`;
const OFFLINE_CACHE = `svlentes-offline-${CACHE_VERSION}`;
const RUNTIME_CACHE = `svlentes-runtime-${CACHE_VERSION}`;

// URLs essenciais que devem ser cacheadas na instalação
const PRECACHE_URLS = [
  '/',
  '/offline.html',
  '/calculadora',
  '/assinar',
  '/como-funciona',
  '/images/logo_transparent.png',
  '/images/favicon.png',
  '/HEro.png',
  '/site.webmanifest'
];

// Padrões de URLs para diferentes estratégias de cache
const CACHE_STRATEGIES = {
  // Cache First: Assets estáticos que raramente mudam
  cacheFirst: [
    /\.(?:png|jpg|jpeg|svg|gif|webp|avif)$/,
    /\.(?:woff|woff2|ttf|eot)$/,
    /\.(?:css)$/,
    /\/_next\/static\//,
  ],

  // Network First: Conteúdo dinâmico que deve ser atualizado
  networkFirst: [
    /\/api\//,
    /\/area-assinante\//,
    /\/_next\/data\//,
  ],

  // Stale While Revalidate: Páginas que podem mostrar cache mas devem atualizar
  staleWhileRevalidate: [
    /\/blog/,
    /\/planos/,
    /\/lentes-diarias/,
  ]
};

// ============================================
// INSTALL EVENT - Pré-cache de assets críticos
// ============================================
self.addEventListener('install', (event) => {
  console.log('[SW] Installing Service Worker...', CACHE_VERSION);

  event.waitUntil(
    (async () => {
      try {
        const cache = await caches.open(CACHE_NAME);
        console.log('[SW] Pre-caching essential assets...');

        // Cachear assets essenciais com fallback
        const cachePromises = PRECACHE_URLS.map(async (url) => {
          try {
            const response = await fetch(url);
            if (response.ok) {
              await cache.put(url, response);
              console.log('[SW] Cached:', url);
            }
          } catch (error) {
            console.warn('[SW] Failed to cache:', url, error);
          }
        });

        await Promise.all(cachePromises);
        console.log('[SW] Pre-caching complete');

        // Forçar ativação imediata
        await self.skipWaiting();
      } catch (error) {
        console.error('[SW] Installation failed:', error);
      }
    })()
  );
});

// ============================================
// ACTIVATE EVENT - Limpeza de caches antigos
// ============================================
self.addEventListener('activate', (event) => {
  console.log('[SW] Activating Service Worker...', CACHE_VERSION);

  event.waitUntil(
    (async () => {
      try {
        // Limpar caches antigos
        const cacheNames = await caches.keys();
        const currentCaches = [CACHE_NAME, OFFLINE_CACHE, RUNTIME_CACHE];

        await Promise.all(
          cacheNames.map(async (cacheName) => {
            if (!currentCaches.includes(cacheName)) {
              console.log('[SW] Deleting old cache:', cacheName);
              await caches.delete(cacheName);
            }
          })
        );

        console.log('[SW] Cache cleanup complete');

        // Assumir controle de todas as páginas abertas
        await self.clients.claim();
        console.log('[SW] Service Worker activated and claimed clients');
      } catch (error) {
        console.error('[SW] Activation failed:', error);
      }
    })()
  );
});

// ============================================
// FETCH EVENT - Estratégias de cache
// ============================================
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Ignorar requisições não-HTTP/HTTPS
  if (!request.url.startsWith('http')) {
    return;
  }

  // Ignorar requisições de outros domínios (exceto CDNs confiáveis)
  if (url.origin !== self.location.origin &&
      !url.origin.includes('googleapis.com') &&
      !url.origin.includes('gstatic.com') &&
      !url.origin.includes('unsplash.com')) {
    return;
  }

  event.respondWith(handleFetch(request));
});

// ============================================
// ESTRATÉGIAS DE CACHE
// ============================================

async function handleFetch(request) {
  const url = new URL(request.url);

  // Determinar estratégia baseada na URL
  if (matchesPattern(url, CACHE_STRATEGIES.cacheFirst)) {
    return cacheFirst(request);
  }

  if (matchesPattern(url, CACHE_STRATEGIES.networkFirst)) {
    return networkFirst(request);
  }

  if (matchesPattern(url, CACHE_STRATEGIES.staleWhileRevalidate)) {
    return staleWhileRevalidate(request);
  }

  // Estratégia padrão: Network First com fallback
  return networkFirst(request);
}

// Cache First - Para assets estáticos
async function cacheFirst(request) {
  try {
    const cache = await caches.open(CACHE_NAME);
    const cached = await cache.match(request);

    if (cached) {
      console.log('[SW] Cache hit:', request.url);
      return cached;
    }

    console.log('[SW] Cache miss, fetching:', request.url);
    const response = await fetch(request);

    if (response.ok) {
      await cache.put(request, response.clone());
    }

    return response;
  } catch (error) {
    console.error('[SW] Cache First failed:', error);
    return getOfflineFallback(request);
  }
}

// Network First - Para conteúdo dinâmico
async function networkFirst(request) {
  try {
    const response = await fetch(request);

    if (response.ok) {
      const cache = await caches.open(RUNTIME_CACHE);
      await cache.put(request, response.clone());
    }

    return response;
  } catch (error) {
    console.log('[SW] Network failed, trying cache:', request.url);

    const cached = await caches.match(request);
    if (cached) {
      return cached;
    }

    return getOfflineFallback(request);
  }
}

// Stale While Revalidate - Para páginas que podem mostrar versão antiga
async function staleWhileRevalidate(request) {
  const cache = await caches.open(RUNTIME_CACHE);
  const cached = await cache.match(request);

  // Buscar nova versão em background
  const fetchPromise = fetch(request).then((response) => {
    if (response.ok) {
      cache.put(request, response.clone());
    }
    return response;
  }).catch(() => null);

  // Retornar cache imediatamente ou esperar network
  return cached || await fetchPromise || getOfflineFallback(request);
}

// ============================================
// FALLBACK OFFLINE
// ============================================

async function getOfflineFallback(request) {
  const url = new URL(request.url);

  // Para páginas HTML, retornar página offline
  if (request.headers.get('accept')?.includes('text/html')) {
    const offlineCache = await caches.open(OFFLINE_CACHE);
    const offlinePage = await offlineCache.match('/offline.html');

    if (offlinePage) {
      return offlinePage;
    }

    // Fallback básico se offline.html não existe
    return new Response(
      `
      <!DOCTYPE html>
      <html lang="pt-BR">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Offline - SV Lentes</title>
        <style>
          body {
            font-family: system-ui, -apple-system, sans-serif;
            display: flex;
            justify-content: center;
            align-items: center;
            min-height: 100vh;
            margin: 0;
            background: linear-gradient(135deg, #06b6d4 0%, #0891b2 100%);
            color: white;
            text-align: center;
            padding: 20px;
          }
          .container {
            max-width: 500px;
          }
          h1 {
            font-size: 2.5rem;
            margin-bottom: 1rem;
          }
          p {
            font-size: 1.2rem;
            margin-bottom: 2rem;
            opacity: 0.9;
          }
          button {
            background: white;
            color: #06b6d4;
            border: none;
            padding: 15px 30px;
            font-size: 1rem;
            font-weight: bold;
            border-radius: 50px;
            cursor: pointer;
            transition: transform 0.2s;
          }
          button:hover {
            transform: scale(1.05);
          }
        </style>
      </head>
      <body>
        <div class="container">
          <h1>🌐 Você está offline</h1>
          <p>Parece que você está sem conexão com a internet. Verifique sua conexão e tente novamente.</p>
          <button onclick="window.location.reload()">Tentar Novamente</button>
        </div>
      </body>
      </html>
      `,
      {
        status: 503,
        statusText: 'Service Unavailable',
        headers: { 'Content-Type': 'text/html; charset=UTF-8' }
      }
    );
  }

  // Para outros recursos, retornar erro
  return new Response('Offline - Resource not available', {
    status: 503,
    statusText: 'Service Unavailable'
  });
}

// ============================================
// UTILIDADES
// ============================================

function matchesPattern(url, patterns) {
  return patterns.some(pattern => pattern.test(url.pathname + url.search));
}

// ============================================
// MENSAGENS DO CLIENTE
// ============================================

self.addEventListener('message', (event) => {
  console.log('[SW] Received message:', event.data);

  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }

  if (event.data && event.data.type === 'CACHE_CLEAR') {
    clearAllCaches().then(() => {
      event.ports[0].postMessage({ success: true });
    });
  }

  if (event.data && event.data.type === 'CACHE_SIZE') {
    getCacheSize().then(size => {
      event.ports[0].postMessage({ size });
    });
  }
});

async function clearAllCaches() {
  const cacheNames = await caches.keys();
  await Promise.all(cacheNames.map(name => caches.delete(name)));
  console.log('[SW] All caches cleared');
}

async function getCacheSize() {
  try {
    if ('storage' in navigator && 'estimate' in navigator.storage) {
      const estimate = await navigator.storage.estimate();
      return estimate.usage;
    }
    return 0;
  } catch (error) {
    console.error('[SW] Failed to get cache size:', error);
    return 0;
  }
}

// ============================================
// PUSH NOTIFICATIONS (Preparado para futuro)
// ============================================

self.addEventListener('push', (event) => {
  console.log('[SW] Push notification received:', event);

  const options = {
    body: event.data ? event.data.text() : 'Nova atualização disponível!',
    icon: '/android-chrome-192x192.png',
    badge: '/android-chrome-192x192.png',
    vibrate: [200, 100, 200],
    data: {
      dateOfArrival: Date.now(),
      primaryKey: 1
    },
    actions: [
      {
        action: 'explore',
        title: 'Ver Agora',
        icon: '/android-chrome-192x192.png'
      },
      {
        action: 'close',
        title: 'Fechar',
        icon: '/android-chrome-192x192.png'
      }
    ]
  };

  event.waitUntil(
    self.registration.showNotification('SV Lentes', options)
  );
});

self.addEventListener('notificationclick', (event) => {
  console.log('[SW] Notification click received:', event);

  event.notification.close();

  if (event.action === 'explore') {
    event.waitUntil(
      clients.openWindow('/')
    );
  }
});

console.log('[SW] Service Worker script loaded successfully');
