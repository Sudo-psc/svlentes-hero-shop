// Service Worker Simplificado - Sem WebSocket, Sem CSP
// Para deploy em /root/svlentes-hero-shop/public/sw.js

const CACHE_NAME = 'svlentes-v1'
const STATIC_CACHE = 'svlentes-static-v1'
const DYNAMIC_CACHE = 'svlentes-dynamic-v1'

// URLs que devem ser cacheadas estaticamente
const STATIC_ASSETS = [
  '/',
  '/planos',
  '/como-funciona',
  '/area-assinante/login',
  '/_next/static/css/',
  '/_next/static/chunks/',
  '/images/',
  '/favicon.ico'
]

// Métodos HTTP que não devem ser cacheados
const NON_CACHEABLE_METHODS = ['POST', 'PUT', 'DELETE', 'PATCH']
const UNSUPPORTED_SCHEMES = ['chrome-extension', 'chrome', 'about', 'moz-extension', 'safari-extension', 'edge', 'opera', 'brave']

// Instalação do Service Worker
self.addEventListener('install', (event) => {
  console.log('[SW] Installing service worker...')
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
  console.log('[SW] Activating service worker...')
  event.waitUntil(
    caches.keys()
      .then(cacheNames => {
        return Promise.all(
          cacheNames.map(cacheName => {
            if (cacheName !== STATIC_CACHE && cacheName !== DYNAMIC_CACHE) {
              console.log('[SW] Deleting old cache:', cacheName)
              return caches.delete(cacheName)
            }
          })
        )
      })
      .then(() => self.clients.claim())
  )
})

// Função corrigida para tratar requisições estáticas
async function handleStaticRequest(request) {
  try {
    // Filtrar requisições que não podem ser cacheadas
    const url = new URL(request.url);

    // Não cachear se:
    if (UNSUPPORTED_SCHEMES.includes(url.protocol.replace(':', '')) ||
        NON_CACHEABLE_METHODS.includes(request.method)) {
      return fetch(request);
    }

    const cache = await caches.open(STATIC_CACHE);
    const cached = await cache.match(request);

    if (cached) return cached;

    const response = await fetch(request);

    // Não cachear respostas parciais ou erros
    if (response.status === 206 || response.status >= 400) {
      return response;
    }

    // Clonar antes de cachear
    cache.put(request, response.clone());
    return response;

  } catch (error) {
    console.error('[SW] Cache error:', error.message);
    return fetch(request); // Fallback para network
  }
}

// Função para tratar requisições de chunks com retry melhorado
async function handleChunkRequest(request) {
  const cache = await caches.open(STATIC_CACHE)

  try {
    // Tentar rede primeiro com timeout
    const networkResponse = await fetchWithTimeout(request, 3000)

    if (networkResponse.ok) {
      // Cache da resposta bem-sucedida
      cache.put(request, networkResponse.clone())
      return networkResponse
    }

    throw new Error(`Network response not ok: ${networkResponse.status}`)
  } catch (error) {
    console.warn('[SW] Network failed for chunk, trying cache:', request.url, error.message)

    // Tentar cache
    const cachedResponse = await cache.match(request)
    if (cachedResponse) {
      return cachedResponse
    }

    // Se não tiver cache, tentar novamente com rede (sem timeout)
    try {
      const retryResponse = await fetch(request)
      if (retryResponse.ok) {
        cache.put(request, retryResponse.clone())
        return retryResponse
      }
    } catch (retryError) {
      console.error('[SW] Retry failed for chunk:', request.url, retryError.message)
    }

    // Retornar resposta de erro genérica
    return new Response(
      JSON.stringify({ error: 'Chunk not available', url: request.url }),
      {
        status: 503,
        statusText: 'Service Unavailable',
        headers: { 'Content-Type': 'application/json' }
      }
    )
  }
}

// Função para tratar requisições com prioridade de rede
async function handleNetworkFirst(request) {
  const cache = await caches.open(DYNAMIC_CACHE)

  try {
    // Tentar rede primeiro
    const networkResponse = await fetchWithTimeout(request, 5000)

    if (networkResponse.ok) {
      // Cache de respostas bem-sucedidas
      if (shouldCache(request)) {
        cache.put(request, networkResponse.clone())
      }
      return networkResponse
    }

    throw new Error(`Network response not ok: ${networkResponse.status}`)
  } catch (error) {
    console.warn('[SW] Network failed, trying cache:', request.url)

    // Tentar cache
    const cachedResponse = await cache.match(request)
    if (cachedResponse) {
      return cachedResponse
    }

    // Se não tiver cache e for uma página, tentar index
    if (request.destination === 'document') {
      const indexResponse = await cache.match('/')
      if (indexResponse) {
        return indexResponse
      }
    }

    throw error
  }
}

// Função auxiliar para fetch com timeout
function fetchWithTimeout(request, timeout = 3000) {
  return Promise.race([
    fetch(request),
    new Promise((_, reject) =>
      setTimeout(() => reject(new Error('Request timeout')), timeout)
    )
  ])
}

// Função para determinar se deve cachear (melhorada)
function shouldCache(request) {
  const url = new URL(request.url)

  // Não cachear APIs que mudam frequentemente
  if (url.pathname.startsWith('/api/webhooks/')) {
    return false
  }

  // Não cachear requisições POST/PUT/DELETE
  if (NON_CACHEABLE_METHODS.includes(request.method)) {
    return false
  }

  // Não cachear recursos de extensões
  if (UNSUPPORTED_SCHEMES.includes(url.protocol.replace(':', ''))) {
    return false
  }

  // Cachear APIs por um tempo curto
  if (url.pathname.startsWith('/api/')) {
    return true
  }

  // Cachear páginas e assets
  return request.destination === 'document' ||
         request.destination === 'script' ||
         request.destination === 'style' ||
         request.destination === 'image'
}

// Estratégia de fetch com filtros corrigidos
self.addEventListener('fetch', (event) => {
  const { request } = event
  const url = new URL(request.url)

  // Ignorar requisições para esquemas não suportados
  if (UNSUPPORTED_SCHEMES.includes(url.protocol.replace(':', ''))) {
    console.log(`[SW] Skipping unsupported scheme: ${url.protocol}`)
    return
  }

  // Ignorar requisições para APIs diferentes
  if (url.pathname.startsWith('/api/') &&
      !url.origin.includes('svlentes.com.br')) {
    return
  }

  // Estratégia para chunks estáticos do Next.js
  if (url.pathname.includes('/_next/static/chunks/')) {
    event.respondWith(
      handleChunkRequest(request)
    )
    return
  }

  // Estratégia para assets estáticos
  if (STATIC_ASSETS.some(asset => url.pathname.includes(asset))) {
    event.respondWith(
      handleStaticRequest(request)
    )
    return
  }

  // Para outras requisições, tentar network primeiro
  event.respondWith(
    handleNetworkFirst(request)
  )
})

// Tratamento de erros globais aprimorado
self.addEventListener('error', (event) => {
  console.error('[SW] Global error:', event.error)
})

// Adicionar tratamento de erros global conforme solicitado
self.addEventListener('unhandledrejection', (event) => {
  console.warn('[SW] Unhandled rejection prevented:', event.reason)
  event.preventDefault()
})

// Listener para mensagens do client
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting()
  }

  if (event.data && event.data.type === 'GET_VERSION') {
    event.ports[0].postMessage({
      type: 'VERSION',
      version: CACHE_NAME,
      timestamp: Date.now()
    })
  }
})