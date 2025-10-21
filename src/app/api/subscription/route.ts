import { NextRequest, NextResponse } from 'next/server'
/**
 * API Route Alias: /api/subscription → /api/assinante/subscription
 *
 * This endpoint exists for backward compatibility and cleaner URLs.
 * It redirects all requests to the actual implementation at /api/assinante/subscription
 *
 * Supports:
 * - GET: Fetch user subscription data
 * - PUT: Update subscription data
 */
const TARGET_API = '/api/assinante/subscription'
/**
 * Enhanced fetch with retry logic and proper error handling
 */
async function fetchWithRetry(url: string, options: RequestInit, maxRetries = 3): Promise<Response> {
  let lastError: Error | null = null

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const response = await fetch(url, {
        ...options,
        signal: AbortSignal.timeout(5000), // 5 second timeout
      })
      return response
    } catch (error: any) {
      lastError = error

      // Don't retry on client errors (4xx)
      if (error.status && error.status >= 400 && error.status < 500) {
        throw error
      }

      // Log retry attempt
      console.warn(`[API /api/subscription] Retry attempt ${attempt}/${maxRetries}:`, {
        url,
        error: error.message,
        status: error.status
      })

      // Exponential backoff: 1s, 2s, 4s
      if (attempt < maxRetries) {
        await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt - 1) * 1000))
      }
    }
  }

  throw lastError
}
/**
 * GET /api/subscription
 * Enhanced redirect with retry logic and better error handling
 */
export async function GET(request: NextRequest) {
  try {
    // Import the actual route handler directly to avoid fetch issues
    const { GET: targetGetHandler } = await import('@/app/api/assinante/subscription/route')

    if (targetGetHandler) {
      return await targetGetHandler(request)
    }

    // Fallback to fetch if import fails
    return await handleFetchFallback(request, 'GET')
  } catch (error: any) {
    console.error('[API /api/subscription] Error importing target route:', error)
    return NextResponse.json(
      {
        error: 'ROUTE_IMPORT_ERROR',
        message: 'Erro ao carregar endpoint destino',
        details: error.message
      },
      { status: 500 }
    )
  }
}
/**
 * PUT /api/subscription
 * Enhanced redirect with retry logic and better error handling
 */
export async function PUT(request: NextRequest) {
  try {
    // Import the actual route handler directly
    const { PUT: targetPutHandler } = await import('@/app/api/assinante/subscription/route')

    if (targetPutHandler) {
      return await targetPutHandler(request)
    }

    // Fallback to fetch if import fails
    return await handleFetchFallback(request, 'PUT')
  } catch (error: any) {
    console.error('[API /api/subscription PUT] Error importing target route:', error)
    return NextResponse.json(
      {
        error: 'ROUTE_IMPORT_ERROR',
        message: 'Erro ao carregar endpoint destino',
        details: error.message
      },
      { status: 500 }
    )
  }
}
/**
 * Fallback fetch handler with enhanced retry logic
 */
async function handleFetchFallback(request: NextRequest, method: 'GET' | 'PUT') {
  const baseUrl = new URL(request.url).origin
  const targetUrl = `${baseUrl}${TARGET_API}`

  try {
    // Prepare options
    const options: RequestInit = {
      method,
      headers: {},
    }

    // Copy safe headers only
    const safeHeaders = [
      'accept',
      'accept-language',
      'content-type',
      'authorization',
      'x-requested-with',
      'user-agent'
    ]

    safeHeaders.forEach(headerName => {
      const value = request.headers.get(headerName)
      if (value) {
        options.headers![headerName] = value
      }
    })

    // Add body for PUT requests
    if (method === 'PUT') {
      try {
        const body = await request.json()
        options.body = JSON.stringify(body)
        options.headers!['content-type'] = 'application/json'
      } catch (bodyError) {
        console.error('[API /api/subscription] Error parsing request body:', bodyError)
        return NextResponse.json(
          {
            error: 'INVALID_BODY',
            message: 'Corpo da requisição inválido'
          },
          { status: 400 }
        )
      }
    }

    // Enhanced fetch with retry
    const response = await fetchWithRetry(targetUrl, options, 3)

    // Handle response
    const data = await response.json()
    return NextResponse.json(data, {
      status: response.status,
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      }
    })
  } catch (error: any) {
    console.error(`[API /api/subscription ${method}] Enhanced redirect error:`, {
      url: targetUrl,
      error: error.message,
      stack: error.stack
    })

    return NextResponse.json(
      {
        error: 'ENHANCED_REDIRECT_ERROR',
        message: 'Erro ao processar requisição',
        details: error.message,
        retryCount: 3
      },
      {
        status: error.status || 500,
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate'
        }
      }
    )
  }
}
// Force dynamic rendering
export const dynamic = 'force-dynamic'