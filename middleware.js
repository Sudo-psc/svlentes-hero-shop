import { NextResponse } from 'next/server';
import crypto from 'crypto';

/**
 * Middleware for Next.js App Router
 * 
 * Features:
 * - CSP nonce generation for inline scripts
 * - Proper MIME types for static assets
 * - Cache control headers
 * - Security headers for Stripe integration
 */
export function middleware(request) {
  const response = NextResponse.next();
  
  // Generate CSP nonce for pages that need it (e.g., /planos)
  const nonce = crypto.randomBytes(16).toString('base64');
  
  // Store nonce in request headers so it can be accessed by the page
  response.headers.set('x-csp-nonce', nonce);
  
  // Set CSP header with nonce for HTML pages (not for static assets)
  if (!request.nextUrl.pathname.startsWith('/_next/') && 
      !request.nextUrl.pathname.startsWith('/api/')) {
    
    // Enhanced CSP for Stripe Pricing Table integration
    const cspHeader = [
      "default-src 'self'",
      `script-src 'self' 'unsafe-inline' 'unsafe-eval' https://js.stripe.com https://accounts.google.com https://www.googletagmanager.com https://www.google-analytics.com 'nonce-${nonce}'`,
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
      "img-src 'self' data: https: blob: https://*.stripe.com",
      "font-src 'self' data: https://fonts.gstatic.com",
      "connect-src 'self' https://api.sendpulse.com https://api.stripe.com https://svlentes.shop https://svlentes.com.br https://www.google-analytics.com https://firebasestorage.googleapis.com https://firebase.googleapis.com https://securetoken.googleapis.com https://accounts.google.com https://www.googleapis.com",
      "frame-src 'self' https://js.stripe.com https://checkout.stripe.com https://accounts.google.com",
      "object-src 'none'",
      "base-uri 'self'"
    ].join('; ');
    
    response.headers.set('Content-Security-Policy', cspHeader);
  }
  
  // Forçar headers corretos para arquivos JavaScript
  if (request.nextUrl.pathname.includes('/_next/static/') &&
      request.nextUrl.pathname.endsWith('.js')) {

    // Garantir MIME type correto para JavaScript
    response.headers.set('Content-Type', 'application/javascript; charset=utf-8');

    // Cabeçalhos de cache
    response.headers.set('Cache-Control', 'public, max-age=31536000, immutable');

    return response;
  }

  // Para arquivos CSS
  if (request.nextUrl.pathname.includes('/_next/static/') &&
      request.nextUrl.pathname.endsWith('.css')) {

    response.headers.set('Content-Type', 'text/css; charset=utf-8');
    response.headers.set('Cache-Control', 'public, max-age=31536000, immutable');

    return response;
  }

  return response;
}

// Configure which paths the middleware should run on
export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder files (icons, images, etc)
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)',
  ],
};