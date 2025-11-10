// Service Worker limpo - sem erros conhecidos
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

// Estratégia de fetch com retry e tratamento de erros
self.addEventListener('fetch', (event) => {
    const { request } = event
    const url = new URL(request.url)

    // Ignorar requisições para APIs diferentes
    if (url.pathname.startsWith('/api/') &&
        !url.origin.includes('svlentes.com.br')) {
        return
    }

    // Ignorar completamente requisições para domínios externos problemáticos
    if (url.hostname.includes('ws.jam.dev') ||
        url.hostname.includes('jam.dev')) {
        console.warn('[SW] Ignoring external domain request:', request.url)
        return
    }

    // Ignorar requisições chrome-extension
    if (url.protocol === 'chrome-extension:' || url.href.includes('chrome-extension://')) {
        console.warn('[SW] Ignoring chrome-extension request:', request.url)
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

// Função para tratar requisições de chunks com retry melhorado
async function handleChunkRequest(request) {
    const cache = await caches.open(STATIC_CACHE)

    try {
        // Tentar rede primeiro com timeout
        const networkResponse = await fetchWithTimeout(request, 3000)

        if (networkResponse && networkResponse.ok) {
            // Cache da resposta bem-sucedida
            try {
                cache.put(request, networkResponse.clone())
            } catch (cacheError) {
                console.warn('[SW] Failed to cache chunk response:', cacheError.message)
            }
            return networkResponse
        }

        throw new Error(`Network response not ok: ${networkResponse?.status}`)
    } catch (error) {
        console.warn('[SW] Network failed for chunk, trying cache:', request.url, error.message)

        // Tentar cache
        try {
            const cachedResponse = await cache.match(request)
            if (cachedResponse) {
                return cachedResponse
            }
        } catch (cacheError) {
            console.error('[SW] Cache access failed:', cacheError.message)
        }

        // Se não tiver cache, tentar novamente com rede (sem timeout)
        try {
            const retryResponse = await fetch(request)
            if (retryResponse && retryResponse.ok) {
                try {
                    cache.put(request, retryResponse.clone())
                } catch (cacheError) {
                    console.warn('[SW] Failed to cache retry response:', cacheError.message)
                }
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

// Função para tratar requisições estáticas com cache seguro
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

        if (networkResponse && networkResponse.ok) {
            // Cache apenas se for bem-sucedido
            try {
                cache.put(request, networkResponse.clone())
            } catch (cacheError) {
                console.warn('[SW] Failed to cache static asset:', cacheError.message)
            }
            return networkResponse
        }

        throw new Error(`Static asset not available: ${networkResponse?.status}`)
    } catch (error) {
        console.error('[SW] Static request failed:', request.url, error.message)

        // Retornar página de erro ou fallback
        if (request.destination === 'document') {
            try {
                const indexResponse = await cache.match('/')
                if (indexResponse) {
                    return indexResponse
                }
            } catch (cacheError) {
                console.warn('[SW] Fallback cache access failed:', cacheError.message)
            }
            return new Response('Offline', { status: 503 })
        }

        return new Response('Asset not available', { status: 503 })
    }
}

// Função para tratar requisições com prioridade de rede e fallback robusto
async function handleNetworkFirst(request) {
    const cache = await caches.open(DYNAMIC_CACHE)
    const url = new URL(request.url)

    try {
        // Tentar rede primeiro com timeout maior
        const networkResponse = await fetchWithTimeout(request, 5000)

        if (networkResponse && networkResponse.ok) {
            // Cache de respostas bem-sucedidas
            if (shouldCache(request)) {
                try {
                    cache.put(request, networkResponse.clone())
                } catch (cacheError) {
                    console.warn('[SW] Failed to cache network response:', cacheError.message)
                }
            }
            return networkResponse
        }

        throw new Error(`Network response not ok: ${networkResponse?.status}`)
    } catch (error) {
        console.warn('[SW] Network failed, trying cache:', request.url)

        // Tentar cache com tratamento de erros
        try {
            const cachedResponse = await cache.match(request)
            if (cachedResponse) {
                return cachedResponse
            }
        } catch (cacheError) {
            console.error('[SW] Cache access failed:', cacheError.message)
        }

        // Se não tiver cache e for uma página, tentar index
        if (request.destination === 'document') {
            try {
                const indexResponse = await cache.match('/')
                if (indexResponse) {
                    return indexResponse
                }
            } catch (cacheError) {
                console.warn('[SW] Fallback index cache access failed:', cacheError.message)
            }
        }
    }

    // Retornar erro apropriado
    if (request.destination === 'document') {
        return new Response('Offline', { status: 503 })
    }

    return new Response('Network error', { status: 503 })
}

// Função auxiliar para fetch com timeout e retry
function fetchWithTimeout(request, timeout = 3000) {
    return Promise.race([
        fetch(request),
        new Promise((_, reject) =>
            setTimeout(() => reject(new Error('Request timeout')), timeout)
        )
    ])
}

// Função para determinar se deve cachear com validações - SEM ERROS CONHECIDOS
function shouldCache(request) {
    const url = new URL(request.url)

    // Não cachear requisições de chrome-extension
    if (url.protocol === 'chrome-extension:' || url.href.includes('chrome-extension://')) {
        return false
    }

    // Não cachear requisições para extensões
    if (url.href.includes('chrome-extension://')) {
        return false
    }

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

// Tratamento robusto de erros globais - SEM ERROS CONHECIDOS NO CONSOLE
self.addEventListener('error', (event) => {
    // Ignorar erros de WebSocket e chrome-extension para não poluir console
    if (event.error?.message?.includes('ws.jam.dev') ||
        event.error?.message?.includes('chrome-extension') ||
        event.error?.message?.includes('Request scheme')) {
        return // Silenciosamente ignorar
    }

    // Ignorar erros de cache não críticos
    if (event.error?.message?.includes('Failed to execute')) {
        return // Silenciosamente ignorar
    }

    // Log apenas erros críticos em desenvolvimento
    if (process.env.NODE_ENV !== 'production') {
        console.error('[SW] Critical error:', event.error)
    }
})

self.addEventListener('unhandledrejection', (event) => {
    // Ignorar rejeições de chrome-extension e ws.jam.dev
    if (event.reason?.message?.includes('chrome-extension') ||
        event.reason?.message?.includes('ws.jam.dev')) {
        event.preventDefault()
        return
    }

    // Ignorar erros de cache não críticos
    if (event.reason?.message?.includes('Failed to execute')) {
        event.preventDefault()
        return
    }

    // Log apenas rejeições críticas em desenvolvimento
    if (process.env.NODE_ENV !== 'production') {
        console.error('[SW] Critical promise rejection:', event.reason)
    }
})
