// Service Worker Enhanced com tratamento robusto de erros e filtros avançados
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

// Sistemas de esquemas que não devem ser cacheados
const BLOCKED_SCHEMES = [
  'chrome-extension://',
  'chrome://',
  'moz-extension://',
  'safari-extension://',
  'edge://',
  'opera://',
  'brave://'
]

// Métodos HTTP que não devem ser cacheados
const NON_CACHEABLE_METHODS = [
  'POST',
  'PUT',
  'DELETE',
  'PATCH'
]

// WebSocket configuration com retry
class WebSocketManager {
  constructor() {
    this.retryAttempts = new Map()
    this.maxRetries = 5
    this.baseDelay = 1000 // 1 segundo
  }

  // Calcula delay com backoff exponencial
  getBackoffDelay(attempt) {
    const delay = this.baseDelay * Math.pow(2, attempt)
    const jitter = Math.random() * 0.1 * delay // 10% de jitter
    return Math.min(delay + jitter, 30000) // Máximo de 30 segundos
  }

  // Função de retry para WebSocket
  async retryWebSocket(url, options = {}) {
    const attemptKey = `${url}:${JSON.stringify(options)}`
    const currentAttempt = this.retryAttempts.get(attemptKey) || 0

    if (currentAttempt >= this.maxRetries) {
      console.warn(`[SW] WebSocket max retries reached for: ${url}`)
      return null
    }

    try {
      console.log(`[SW] WebSocket attempt ${currentAttempt + 1}/${this.maxRetries} for: ${url}`)

      const ws = new WebSocket(url, options.protocols)

      return new Promise((resolve, reject) => {
        const timeout = setTimeout(() => {
          ws.close()
          reject(new Error('WebSocket connection timeout'))
        }, 10000) // 10 segundos timeout

        ws.onopen = () => {
          clearTimeout(timeout)
          console.log(`[SW] WebSocket connected successfully: ${url}`)
          this.retryAttempts.delete(attemptKey) // Reset counter on success
          resolve(ws)
        }

        ws.onerror = (error) => {
          clearTimeout(timeout)
          console.error(`[SW] WebSocket error (attempt ${currentAttempt + 1}):`, error)
          reject(error)
        }

        ws.onclose = (event) => {
          clearTimeout(timeout)
          if (!ws.readyState || ws.readyState === WebSocket.CLOSED) {
            console.log(`[SW] WebSocket closed: ${event.code} - ${event.reason}`)
          }
        }
      })

    } catch (error) {
      console.error(`[SW] WebSocket connection failed (attempt ${currentAttempt + 1}):`, error)
      this.retryAttempts.set(attemptKey, currentAttempt + 1)

      // Agendar retry com backoff exponencial
      const delay = this.getBackoffDelay(currentAttempt)
      console.log(`[SW] Scheduling WebSocket retry in ${delay}ms`)

      return new Promise(resolve => {
        setTimeout(() => {
          resolve(this.retryWebSocket(url, options))
        }, delay)
      })
    }
  }
}

const wsManager = new WebSocketManager()

// Verifica se URL deve ser ignorada pelo cache
function shouldIgnoreUrl(url) {
  const urlString = url.toString()

  // Bloquear esquemas não suportados
  for (const scheme of BLOCKED_SCHEMES) {
    if (urlString.startsWith(scheme)) {
      console.log(`[SW] Ignoring blocked scheme: ${scheme}`)
      return true
    }
  }

  // Bloquear requisições para extensões
  if (urlString.includes('extension://') || urlString.includes('web-ext://')) {
    console.log(`[SW] Ignoring extension request: ${urlString}`)
    return true
  }

  return false
}

// Verifica se método HTTP não deve ser cacheado
function shouldIgnoreMethod(request) {
  return NON_CACHEABLE_METHODS.includes(request.method)
}

// Verifica se a requisição é para fontes externas problemáticas
function isProblematicExternalRequest(url) {
  const hostname = url.hostname

  // Lista de domínios que podem causar problemas
  const problematicDomains = [
    'ws.jam.dev',
    'r2cdn.perplexity.ai' // Mencionado nos erros
  ]

  return problematicDomains.includes(hostname)
}

// Instalação do Service Worker
self.addEventListener('install', (event) => {
  console.log('[SW] Installing enhanced service worker...')

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
  console.log('[SW] Activating enhanced service worker...')

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

// Estratégia de fetch com retry e filtros avançados
self.addEventListener('fetch', (event) => {
  const { request } = event
  const url = new URL(request.url)

  // Filtrar requisições bloqueadas
  if (shouldIgnoreUrl(url)) {
    console.log(`[SW] Skipping blocked URL: ${request.url}`)
    return
  }

  // Filtrar métodos não cacheáveis
  if (shouldIgnoreMethod(request)) {
    console.log(`[SW] Skipping non-cacheable method: ${request.method} ${request.url}`)
    // Deixar requisições POST passarem sem cache
    return
  }

  // Tratar requisições WebSocket
  if (url.protocol === 'ws:' || url.protocol === 'wss:') {
    event.respondWith(handleWebSocketRequest(request))
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

// Função para tratar requisições WebSocket
async function handleWebSocketRequest(request) {
  const url = request.url

  try {
    // Tentar conexão WebSocket com retry
    const ws = await wsManager.retryWebSocket(url, {
      protocols: request.headers.get('Sec-WebSocket-Protocol')?.split(',').map(s => s.trim())
    })

    if (ws) {
      // Retornar uma resposta que indica sucesso da conexão
      return new Response('WebSocket connection established', {
        status: 200,
        statusText: 'OK',
        headers: {
          'X-WebSocket-Status': 'connected'
        }
      })
    }
  } catch (error) {
    console.error('[SW] WebSocket connection failed:', error)
  }

  // Se falhar, retornar resposta de fallback
  return new Response(
    JSON.stringify({
      error: 'WebSocket connection failed',
      url: request.url,
      retryable: true
    }),
    {
      status: 503,
      statusText: 'Service Unavailable',
      headers: {
        'Content-Type': 'application/json',
        'X-Retry-After': '5' // Sugere retry em 5 segundos
      }
    }
  )
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

// Função para tratar requisições estáticas com filtros aprimorados
async function handleStaticRequest(request) {
  const url = new URL(request.url)

  // Verificar se é uma requisição para fontes externas problemáticas
  if (isProblematicExternalRequest(url)) {
    console.log(`[SW] Handling problematic external request: ${request.url}`)
    return handleExternalResourceFallback(request, url)
  }

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

// Função para tratar recursos externos com fallback
async function handleExternalResourceFallback(request, url) {
  try {
    // Tentar busca direta primeiro
    const response = await fetchWithTimeout(request, 5000)
    if (response.ok) {
      return response
    }
  } catch (error) {
    console.warn(`[SW] External resource failed: ${request.url}`, error.message)
  }

  // Fallbacks específicos por domínio
  if (url.hostname === 'r2cdn.perplexity.ai') {
    return new Response(
      JSON.stringify({
        error: 'External resource unavailable',
        domain: 'r2cdn.perplexity.ai',
        fallback: true
      }),
      {
        status: 200,
        statusText: 'OK',
        headers: { 'Content-Type': 'application/json' }
      }
    )
  }

  if (url.hostname === 'lh3.googleusercontent.com') {
    // Fallback para imagem do Google
    return new Response(
      `<svg width="100" height="100" xmlns="http://www.w3.org/2000/svg">
        <rect width="100" height="100" fill="#f0f0f0"/>
        <text x="50" y="50" text-anchor="middle" dy=".3em" font-family="sans-serif" font-size="14" fill="#666">
          Image Unavailable
        </text>
      </svg>`,
      {
        status: 200,
        statusText: 'OK',
        headers: { 'Content-Type': 'image/svg+xml' }
      }
    )
  }

  // Fallback genérico
  return new Response('External resource unavailable', { status: 404 })
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
  if (shouldIgnoreUrl(url)) {
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

// Tratamento de erros globais aprimorado
self.addEventListener('error', (event) => {
  console.error('[SW] Global error:', event.error)

  // Relatar erros para analytics se disponível
  if (self.clients) {
    self.clients.matchAll().then(clients => {
      clients.forEach(client => {
        client.postMessage({
          type: 'SW_ERROR',
          error: event.error?.message || 'Unknown error',
          filename: event.filename,
          lineno: event.lineno,
          colno: event.colno
        })
      })
    })
  }
})

self.addEventListener('unhandledrejection', (event) => {
  console.error('[SW] Unhandled promise rejection:', event.reason)

  // Prevenir que a falha se propague
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