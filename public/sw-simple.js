// Service Worker Simplificado e Corrigido - Versão 2.0
// Sem erros de cache, sem WebSocket externo, sem problemas com extensões

const CACHE_NAME = 'svlentes-v2'
const STATIC_CACHE = 'svlentes-static-v2'
const DYNAMIC_CACHE = 'svlentes-dynamic-v2'

// URLs que devem ser cacheadas estaticamente
const STATIC_ASSETS = [
  '/',
  '/planos',
  '/como-funciona',
  '/area-assinante/login'
]

// Métodos HTTP que nunca devem ser cacheados
const NON_CACHEABLE_METHODS = ['POST', 'PUT', 'DELETE', 'PATCH']

// Esquemas não suportados que devem ser ignorados completamente
const UNSUPPORTED_SCHEMES = [
  'chrome-extension', 'chrome', 'about', 'moz-extension',
  'safari-extension', 'edge', 'opera', 'brave', 'ws', 'wss'
]

// Domínios externos que não devem ser interceptados
const EXTERNAL_DOMAINS = [
  'js.stripe.com',
  'checkout.stripe.com',
  'api.stripe.com',
  'ws.jam.dev',
  'www.google-analytics.com',
  'connect.facebook.net',
  'stats.g.doubleclick.net'
]

// Instalação do Service Worker
self.addEventListener('install', (event) => {
  console.log('[SW] Installing service worker v2...')
  event.waitUntil(
    caches.open(STATIC_CACHE)
      .then(cache => {
        console.log('[SW] Caching static assets')
        return cache.addAll(['/'])
      })
      .catch(err => {
        console.error('[SW] Install failed:', err)
      })
  )
})

// Ativação do Service Worker
self.addEventListener('activate', (event) => {
  console.log('[SW] Activating service worker v2...')
  event.waitUntil(
    caches.keys()
      .then(cacheNames => {
        return Promise.all(
          cacheNames.map(cacheName => {
            if (cacheName !== STATIC_CACHE && cacheName !== DYNAMIC_CACHE) {
              console.log('[SW] Deleting old cache:', cacheName)
              return caches.delete(cacheName)
            }
            return Promise.resolve()
          })
        )
      })
      .then(() => {
        console.log('[SW] Service worker v2 activated')
        return self.clients.claim()
      })
  )
})

// Verificação se request pode ser cacheada
function shouldCacheRequest(request) {
  try {
    const url = new URL(request.url)

    // 1. Ignorar completamente esquemas não suportados
    if (UNSUPPORTED_SCHEMES.includes(url.protocol.replace(':', ''))) {
      console.log(`[SW] Ignoring unsupported scheme: ${url.protocol}`)
      return false
    }

    // 2. Ignorar completamente domínios externos
    if (EXTERNAL_DOMAINS.includes(url.hostname)) {
      console.log(`[SW] Ignoring external domain: ${url.hostname}`)
      return false
    }

    // 3. Ignorar requisições POST/PUT/DELETE
    if (NON_CACHEABLE_METHODS.includes(request.method)) {
      console.log(`[SW] Ignoring non-cacheable method: ${request.method}`)
      return false
    }

    // 4. Ignorar APIs que mudam frequentemente
    if (url.pathname.startsWith('/api/webhooks/') ||
        url.pathname.startsWith('/api/auth/') ||
        url.pathname.includes('/set-token')) {
      console.log(`[SW] Ignoring sensitive API: ${url.pathname}`)
      return false
    }

    // 5. Permitir apenas recursos seguros para cache
    const allowedDestinations = [
      'document',
      'script',
      'style',
      'image',
      'font'
    ]

    return allowedDestinations.includes(request.destination)

  } catch (error) {
    console.error('[SW] Error checking request cacheability:', error)
    return false
  }
}

// Estratégia de cache Network First para recursos permitidos
async function handleNetworkFirst(request) {
  if (!shouldCacheRequest(request)) {
    // Se não pode ser cacheado, apenas buscar na rede
    return fetch(request).catch(error => {
      console.error('[SW] Network request failed:', error)
      return new Response('Network error', { status: 500 })
    })
  }

  const cache = await caches.open(DYNAMIC_CACHE)

  try {
    // Tentar rede primeiro
    const networkResponse = await fetch(request)

    if (networkResponse.ok) {
      // Cache apenas respostas bem-sucedidas
      const responseClone = networkResponse.clone()
      cache.put(request, responseClone).catch(error => {
        console.warn('[SW] Cache write failed:', error)
      })
      return networkResponse
    }

    throw new Error(`Network response not ok: ${networkResponse.status}`)

  } catch (error) {
    console.warn('[SW] Network failed, trying cache:', request.url)

    // Tentar cache como fallback
    const cachedResponse = await cache.match(request)
    if (cachedResponse) {
      return cachedResponse
    }

    // Se for uma página, tentar servir index.html
    if (request.destination === 'document') {
      const indexResponse = await cache.match('/')
      if (indexResponse) {
        return indexResponse
      }
    }

    // Último recurso: erro genérico
    return new Response('Offline - No cached version available', {
      status: 503,
      statusText: 'Service Unavailable'
    })
  }
}

// Estratégia de Cache First para recursos estáticos
async function handleCacheFirst(request) {
  if (!shouldCacheRequest(request)) {
    return fetch(request).catch(error => {
      console.error('[SW] Network request failed:', error)
      return new Response('Network error', { status: 500 })
    })
  }

  const cache = await caches.open(STATIC_CACHE)
  const cachedResponse = await cache.match(request)

  if (cachedResponse) {
    return cachedResponse
  }

  try {
    const networkResponse = await fetch(request)
    if (networkResponse.ok) {
      cache.put(request, networkResponse.clone()).catch(error => {
        console.warn('[SW] Cache write failed:', error)
      })
    }
    return networkResponse
  } catch (error) {
    console.error('[SW] Network request failed:', error)
    return new Response('Network error', { status: 500 })
  }
}

// Fetch event listener melhorado
self.addEventListener('fetch', (event) => {
  const { request } = event

  try {
    const url = new URL(request.url)

    // Ignorar completamente requisições para esquemas não suportados
    if (UNSUPPORTED_SCHEMES.includes(url.protocol.replace(':', ''))) {
      console.log(`[SW] Skipping unsupported scheme: ${url.protocol}`)
      return
    }

    // Ignorar requisições para domínios externos
    if (EXTERNAL_DOMAINS.includes(url.hostname)) {
      return
    }

    // Estratégia baseada no tipo de recurso
    if (url.pathname.includes('/_next/static/') ||
        url.pathname.includes('/images/') ||
        url.pathname.includes('/fonts/')) {
      // Cache first para recursos estáticos
      event.respondWith(handleCacheFirst(request))
    } else {
      // Network first para páginas e API seguras
      event.respondWith(handleNetworkFirst(request))
    }

  } catch (error) {
    console.error('[SW] Fetch event error:', error)
    // Fallback para rede em caso de erro no SW
    event.respondWith(fetch(request).catch(() => {
      return new Response('Service Worker Error', { status: 500 })
    }))
  }
})

// Tratamento de erros global
self.addEventListener('error', (event) => {
  console.error('[SW] Global error:', event.error)
})

self.addEventListener('unhandledrejection', (event) => {
  console.error('[SW] Unhandled promise rejection:', event.reason)
  event.preventDefault()
})

console.log('[SW] Service worker v2 loaded successfully')