import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { jwtVerify } from 'jose'

const JWT_SECRET = new TextEncoder().encode(
  process.env.NEXTAUTH_SECRET || process.env.JWT_SECRET || 'your-secret-key-change-in-production'
)

// Protected routes that require authentication
const protectedRoutes = [
  '/area-assinante/dashboard',
  '/area-assinante/configuracoes',
  '/api/assinante',
  '/api/admin'
]

// Public routes that don't require authentication
const publicRoutes = [
  '/area-assinante/login',
  '/area-assinante/registro',
  '/api/auth/set-token',
  '/api/health-check',
  '/api/stripe',
  '/'
]

async function verifyToken(token: string): Promise<any> {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET)
    return payload
  } catch (error) {
    return null
  }
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Skip middleware for static files, images, etc.
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api/webhooks') ||
    pathname.startsWith('/images') ||
    pathname.includes('.') // files with extensions
  ) {
    return NextResponse.next()
  }

  // Check if route is public
  const isPublicRoute = publicRoutes.some(route => pathname.startsWith(route))
  if (isPublicRoute) {
    return NextResponse.next()
  }

  // Check if route requires protection
  const isProtectedRoute = protectedRoutes.some(route => pathname.startsWith(route))
  if (isProtectedRoute) {
    // Check for Firebase token in HttpOnly cookie
    const token = request.cookies.get('firebase-token')?.value

    if (!token) {
      // No token found - redirect to login
      const loginUrl = new URL('/area-assinante/login', request.url)
      loginUrl.searchParams.set('redirect', pathname)
      return NextResponse.redirect(loginUrl)
    }

    try {
      // Verify Firebase token (simplified - in production use Firebase Admin SDK)
      const payload = await verifyToken(token)

      if (!payload || !payload.email) {
        // Invalid token - redirect to login
        const loginUrl = new URL('/area-assinante/login', request.url)
        loginUrl.searchParams.set('redirect', pathname)
        loginUrl.searchParams.set('error', 'invalid_token')
        return NextResponse.redirect(loginUrl)
      }

      // Token is valid - proceed
      const response = NextResponse.next()

      // Add user info to headers for downstream use
      response.headers.set('x-user-email', payload.email)
      response.headers.set('x-user-uid', payload.sub || payload.uid)

      return response
    } catch (error) {
      console.error('[AUTH_Middleware] Token verification failed:', error)
      const loginUrl = new URL('/area-assinante/login', request.url)
      loginUrl.searchParams.set('redirect', pathname)
      loginUrl.searchParams.set('error', 'token_verification_failed')
      return NextResponse.redirect(loginUrl)
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!_next/static|_next/image|favicon.ico|public).*)',
  ],
}