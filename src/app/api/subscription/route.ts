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
 * GET /api/subscription
 * Redirects to /api/assinante/subscription
 */
export async function GET(request: NextRequest) {
  // Get the base URL from the request
  const baseUrl = new URL(request.url).origin
  const targetUrl = `${baseUrl}${TARGET_API}`
  try {
    // Forward the request with all headers
    const response = await fetch(targetUrl, {
      method: 'GET',
      headers: request.headers,
    })
    // Get response data
    const data = await response.json()
    // Return with same status code
    return NextResponse.json(data, { status: response.status })
  } catch (error: any) {
    console.error('[API /api/subscription] Redirect error:', error)
    return NextResponse.json(
      {
        error: 'REDIRECT_ERROR',
        message: 'Erro ao processar requisição',
        details: error.message
      },
      { status: 500 }
    )
  }
}
/**
 * PUT /api/subscription
 * Redirects to /api/assinante/subscription
 */
export async function PUT(request: NextRequest) {
  const baseUrl = new URL(request.url).origin
  const targetUrl = `${baseUrl}${TARGET_API}`
  try {
    // Get request body
    const body = await request.json()
    // Forward the request with all headers and body
    const response = await fetch(targetUrl, {
      method: 'PUT',
      headers: request.headers,
      body: JSON.stringify(body),
    })
    // Get response data
    const data = await response.json()
    // Return with same status code
    return NextResponse.json(data, { status: response.status })
  } catch (error: any) {
    console.error('[API /api/subscription PUT] Redirect error:', error)
    return NextResponse.json(
      {
        error: 'REDIRECT_ERROR',
        message: 'Erro ao processar requisição',
        details: error.message
      },
      { status: 500 }
    )
  }
}
// Force dynamic rendering
export const dynamic = 'force-dynamic'