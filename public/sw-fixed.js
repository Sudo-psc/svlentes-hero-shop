// Service Worker com tratamento robusto de erros
// Para deploy em /root/svlentes-hero-shop/public/

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

// Instalação do Service Worker
self.addEventListener('install', (event) => {
  console.log('[SW] Installing service worker...')

  event.waitUntil(
    caches.open(STATIC_CACHE)
      .then(cache => {
        console.log('[SW] Caching static assets')
        // Não fazer cache de tudo durante install para evitar falhas
        return cache.addAll(['/'])
      })
      .catch(err => {
        console.error('[SW] Install failed:', err)
        // Não falhar instalação
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

// Estratégia de fetch com retry
self.addEventListener('fetch', (event) => {
  const { request } = event
  const url = new URL(request.url)

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

// Função para tratar requisições de chunks com retry
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

// Função para tratar requisições estáticas
async function handleStaticRequest(request) {
  const cache = await caches.open(STATIC_CACHE)

  try {
    // Cache first para assets estáticos
    const cachedResponse = await cache.match(request)
    if (cachedResponse) {
      return cachedResponse
    }

    // Se não tem cache, buscar da rede
    const networkResponse = await fetch(request)

    if (networkResponse.ok) {
      // Cache apenas se for bem-sucedido
      cache.put(request, networkResponse.clone())
      return networkResponse
    }

    throw new Error(`Static asset not available: ${networkResponse.status}`)
  } catch (error) {
    console.error('[SW] Static request failed:', request.url, error.message)

    // Retornar página de erro ou fallback
    if (request.destination === 'document') {
      return caches.match('/') || new Response('Offline', { status: 503 })
    }

    return new Response('Asset not available', { status: 503 })
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

// Função para determinar se deve cachear
function shouldCache(request) {
  const url = new URL(request.url)

  // Não cachear APIs que mudam frequentemente
  if (url.pathname.startsWith('/api/webhooks/')) {
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

// Tratamento de erros globais
self.addEventListener('error', (event) => {
  console.error('[SW] Global error:', event.error)
})

self.addEventListener('unhandledrejection', (event) => {
  console.error('[SW] Unhandled promise rejection:', event.reason)
})