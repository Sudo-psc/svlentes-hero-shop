/**
 * Middleware para logging de requisições e monitoramento
 * Intercepta todas as requisições e coleta métricas de performance
 * Integrado com Firebase Authentication
 */
import { NextRequest, NextResponse } from 'next/server';

// Interface para dados de logging
interface LogData {
  timestamp: string;
  method: string;
  url: string;
  userAgent?: string;
  ip: string;
  referer?: string;
  responseTime?: number;
  statusCode?: number;
  userId?: string;
  sessionId?: string;
  headers: Record<string, string>;
}

// Logger simples para console e arquivo (em produção)
class Logger {
  static info(message: string, data?: any) {
    const logEntry = {
      level: 'info',
      message,
      data,
      timestamp: new Date().toISOString()
    };

    console.log(JSON.stringify(logEntry));
    this.persistLog(logEntry);
  }

  static warn(message: string, data?: any) {
    const logEntry = {
      level: 'warn',
      message,
      data,
      timestamp: new Date().toISOString()
    };

    console.warn(JSON.stringify(logEntry));
    this.persistLog(logEntry);
  }

  static error(message: string, data?: any) {
    const logEntry = {
      level: 'error',
      message,
      data,
      timestamp: new Date().toISOString()
    };

    console.error(JSON.stringify(logEntry));
    this.persistLog(logEntry);
  }

  private static async persistLog(logEntry: any) {
    // Em produção, enviar para serviço de logging
    if (process.env.NODE_ENV === 'production') {
      try {
        // Enviar para serviço externo (ex: Datadog, LogDNA, etc.)
        // await fetch('https://logs.example.com/api/logs', {
        //   method: 'POST',
        //   headers: { 'Content-Type': 'application/json' },
        //   body: JSON.stringify(logEntry)
        // });
      } catch (error) {
        console.error('Failed to persist log:', error);
      }
    }
  }
}

// Gera ID único de sessão
function generateSessionId(): string {
  return Math.random().toString(36).substr(2, 9) + Date.now().toString(36);
}

// Decode Firebase JWT client-side (without verification - for logging only)
function decodeFirebaseToken(token: string): { uid?: string } {
  try {
    // Firebase JWT is base64-encoded, decode the payload (second part)
    const parts = token.split('.');
    if (parts.length !== 3) return {};

    const payload = Buffer.from(parts[1], 'base64').toString('utf-8');
    const decoded = JSON.parse(payload);

    return { uid: decoded.user_id || decoded.sub };
  } catch (error) {
    console.warn('[Middleware] Failed to decode Firebase token:', error);
    return {};
  }
}

// Extrai informações do usuário do Firebase token
async function getUserInfo(request: NextRequest): Promise<{ userId?: string; sessionId?: string }> {
  // Try to get Firebase token from header or cookie
  const authHeader = request.headers.get('Authorization');
  const firebaseToken = authHeader?.startsWith('Bearer ')
    ? authHeader.split('Bearer ')[1]
    : null;
  const cookieToken = request.cookies.get('firebase-token')?.value;

  const token = firebaseToken || cookieToken;

  // Decode Firebase token to get UID (don't verify - just for logging)
  const userId = token ? decodeFirebaseToken(token).uid : undefined;

  // Obter ou criar session ID
  let sessionId = request.headers.get('x-session-id') as string | null;
  if (!sessionId) {
    sessionId = generateSessionId();
  }

  return { userId, sessionId };
}

// Extrai IP real (atrás de proxies)
function getClientIP(request: NextRequest): string {
  const forwarded = request.headers.get('x-forwarded-for');
  const realIP = request.headers.get('x-real-ip');

  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }

  if (realIP) {
    return realIP;
  }

  // Next.js doesn't have request.ip, use headers instead
  return 'unknown';
}

// Detectar bots e crawlers
function isBot(userAgent?: string): boolean {
  if (!userAgent) return false;

  const botPatterns = [
    /googlebot/i,
    /bingbot/i,
    /slurp/i,
    /duckduckbot/i,
    /baiduspider/i,
    /yandexbot/i,
    /facebookexternalhit/i,
    /twitterbot/i,
    /whatsapp/i,
    /crawler/i,
    /spider/i
  ];

  return botPatterns.some(pattern => pattern.test(userAgent));
}

// Calcular risco da requisição para segurança
function calculateRiskScore(request: NextRequest): number {
  let risk = 0;

  const url = request.url;
  const userAgent = request.headers.get('user-agent') || '';
  const referer = request.headers.get('referer') || '';

  // Verificar URLs suspeitas
  if (url.includes('../') || url.includes('..\\')) risk += 50;
  if (url.includes('<script') || url.includes('javascript:')) risk += 80;

  // Verificar user agent suspeito
  if (!userAgent || userAgent.length < 10) risk += 20;
  if (isBot(userAgent)) risk -= 10; // Bots são menos arriscados

  // Verificar referer
  if (!referer && !url.includes('/api/')) risk += 10;

  // Verificar métodos HTTP
  if (['POST', 'PUT', 'DELETE', 'PATCH'].includes(request.method)) {
    risk += 15;
  }

  // Rate limiting baseado em IP (simplificado)
  const ip = getClientIP(request);
  if (ip === 'unknown') risk += 25;

  return Math.min(risk, 100);
}

// Logging and monitoring function (extracted from original middleware)
async function performLoggingAndMonitoring(request: NextRequest) {
  const start = Date.now();

  // Extrair informações da requisição
  const userAgent = request.headers.get('user-agent') || undefined;
  const referer = request.headers.get('referer') || undefined;
  const ip = getClientIP(request);
  const { userId, sessionId } = await getUserInfo(request);

  // Calcular risco
  const riskScore = calculateRiskScore(request);

  // Logs básicos da requisição
  const logData: LogData = {
    timestamp: new Date().toISOString(),
    method: request.method,
    url: request.url,
    userAgent,
    ip,
    referer,
    userId,
    sessionId,
    headers: {
      'user-agent': userAgent || '',
      'referer': referer || '',
      'accept': request.headers.get('accept') || '',
      'accept-language': request.headers.get('accept-language') || '',
      'content-type': request.headers.get('content-type') || '',
    }
  };

  // Detecção de padrões suspeitos
  if (riskScore > 50) {
    Logger.warn('High risk request detected', {
      ...logData,
      riskScore,
      reason: 'High risk score detected'
    });
  }

  // Log de requisições de API
  if (request.nextUrl.pathname.startsWith('/api/')) {
    Logger.info('API Request started', {
      ...logData,
      riskScore,
      isBot: isBot(userAgent)
    });
  }

  // Log de páginas principais
  const mainPages = ['/assinar', '/agendar-consulta', '/area-assinante'];
  if (mainPages.some(page => request.nextUrl.pathname.startsWith(page))) {
    Logger.info('Main page access', {
      ...logData,
      page: request.nextUrl.pathname
    });
  }

  return { start, logData, riskScore, sessionId };
}

// Simple route matcher helper
function routeMatcher(patterns: string[]) {
  return (request: NextRequest) => {
    const pathname = request.nextUrl.pathname;
    return patterns.some(pattern => {
      // Convert pattern to regex: /path(.*) becomes /^\/path/
      const regex = new RegExp(`^${pattern.replace('(.*)', '.*')}`);
      return regex.test(pathname);
    });
  };
}

// Define public routes that should NOT require authentication
const isPublicRoute = routeMatcher([
  '/area-assinante/login',
  '/area-assinante/registro',
  '/api/assinante/register',
]);

// Define protected routes that require authentication
const isProtectedRoute = routeMatcher([
  '/area-assinante',
  '/api/assinante',
]);

// Firebase Authentication Middleware
export async function proxy(request: NextRequest) {
  // Perform logging and monitoring
  const { start, logData, riskScore, sessionId } = await performLoggingAndMonitoring(request);

  // Rate limiting for API routes
  // FIXED (2025-10-30): Refactored rate-limiter.ts to use lazy initialization
  // Skip rate limiting during build time (when request is from static generation)
  const pathname = request.nextUrl.pathname;
  const isBuildTime = !request.headers.get('user-agent'); // Build requests don't have user-agent

  if (pathname.startsWith('/api/') && !isBuildTime) {
    try {
      const {
        selectRateLimiter,
        getRateLimitIdentifier,
        checkRateLimit,
        formatRetryAfter,
        logRateLimitViolation,
      } = await import('./lib/rate-limiter');

      const limiter = await selectRateLimiter(pathname);

      if (limiter) {
        // Get user ID from token if available (for subscriber routes)
        const authHeader = request.headers.get('Authorization');
        const firebaseToken = authHeader?.startsWith('Bearer ')
          ? authHeader.split('Bearer ')[1]
          : null;
        const cookieToken = request.cookies.get('firebase-token')?.value;
        const token = firebaseToken || cookieToken;
        const userId = token ? decodeFirebaseToken(token).uid : undefined;

        // Get webhook token for webhook routes
        const webhookToken = request.headers.get('x-webhook-token') || undefined;

        // Get client IP
        const ip = getClientIP(request);

        // Create identifier for rate limiting
        const identifier = getRateLimitIdentifier(pathname, ip, userId, webhookToken);

        // Check rate limit
        const rateLimitResult = await checkRateLimit(identifier, limiter);

        if (!rateLimitResult.success) {
          // Log rate limit violation
          logRateLimitViolation(identifier, pathname, rateLimitResult.limit);

          // Return 429 Too Many Requests
          const retryAfter = formatRetryAfter(rateLimitResult.reset);

          return NextResponse.json(
            {
              error: 'RATE_LIMIT_EXCEEDED',
              message: 'Too many requests. Please try again later.',
              retryAfter: parseInt(retryAfter),
            },
            {
              status: 429,
              headers: {
                'Retry-After': retryAfter,
                'X-RateLimit-Limit': rateLimitResult.limit.toString(),
                'X-RateLimit-Remaining': '0',
                'X-RateLimit-Reset': rateLimitResult.reset.toString(),
              },
            }
          );
        }

        // Add rate limit headers to the request for logging
        Logger.info('Rate limit checked', {
          identifier,
          pathname,
          limit: rateLimitResult.limit,
          remaining: rateLimitResult.remaining,
          reset: new Date(rateLimitResult.reset).toISOString(),
        });
      }
    } catch (error) {
      // Log error but don't block the request (fail open)
      Logger.error('Rate limit check failed', {
        pathname,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  // Check if route requires authentication (exclude public routes)
  if (isProtectedRoute(request) && !isPublicRoute(request)) {
    // Check for Firebase token in Authorization header
    const authHeader = request.headers.get('Authorization');
    const firebaseToken = authHeader?.startsWith('Bearer ') ? authHeader.split('Bearer ')[1] : null;

    // Check for Firebase token in cookie (for client-side navigation)
    const cookieToken = request.cookies.get('firebase-token')?.value;

    const token = firebaseToken || cookieToken;

    if (!token) {
      // No authentication token found - redirect to login
      Logger.warn('No authentication token found', {
        ...logData,
        path: request.nextUrl.pathname,
        riskScore
      });

      // For API routes, return 401 Unauthorized
      if (request.nextUrl.pathname.startsWith('/api/')) {
        return NextResponse.json(
          { error: 'UNAUTHORIZED', message: 'Token de autenticação não fornecido' },
          { status: 401 }
        );
      }

      // For page routes, redirect to login
      const loginUrl = new URL('/area-assinante/login', request.url);
      loginUrl.searchParams.set('redirect', request.nextUrl.pathname);
      return NextResponse.redirect(loginUrl);
    }

    // Note: Token verification is handled by each API route using Firebase Admin SDK
    // This middleware only checks for token presence and redirects if missing
    // Actual token validation happens in API routes for security reasons
    // (Firebase Admin SDK is only available on the server side)
  }

  // Create response with security headers
  const response = NextResponse.next();

  // Add rate limit headers to successful API responses
  // FIXED (2025-10-30): Rate limiting now enabled with lazy initialization
  // Skip during build time to avoid static generation issues
  if (pathname.startsWith('/api/') && !isBuildTime) {
    try {
      const {
        selectRateLimiter,
        getRateLimitIdentifier,
        checkRateLimit,
      } = await import('./lib/rate-limiter');

      const limiter = await selectRateLimiter(pathname);

      if (limiter) {
        // Get user ID and IP (same logic as above)
        const authHeader = request.headers.get('Authorization');
        const firebaseToken = authHeader?.startsWith('Bearer ')
          ? authHeader.split('Bearer ')[1]
          : null;
        const cookieToken = request.cookies.get('firebase-token')?.value;
        const token = firebaseToken || cookieToken;
        const userId = token ? decodeFirebaseToken(token).uid : undefined;
        const webhookToken = request.headers.get('x-webhook-token') || undefined;
        const ip = getClientIP(request);
        const identifier = getRateLimitIdentifier(pathname, ip, userId, webhookToken);

        // Get current rate limit status (without incrementing again)
        const rateLimitResult = await checkRateLimit(identifier, limiter);

        // Add rate limit headers to response
        response.headers.set('X-RateLimit-Limit', rateLimitResult.limit.toString());
        response.headers.set('X-RateLimit-Remaining', rateLimitResult.remaining.toString());
        response.headers.set('X-RateLimit-Reset', rateLimitResult.reset.toString());
      }
    } catch (error) {
      // Silently fail - don't add headers if there's an error
    }
  }

  // Handle CORS for API routes
  if (request.nextUrl.pathname.startsWith('/api/')) {
    const origin = request.headers.get('origin');
    const productionOrigins = [
      'https://svlentes.com.br',
      'https://www.svlentes.com.br'
    ];

    // Determine allowed origin (must be single value when credentials: true)
    let allowedOrigin: string;
    if (process.env.NODE_ENV === 'production') {
      // In production, validate against allowlist
      allowedOrigin = origin && productionOrigins.includes(origin)
        ? origin
        : productionOrigins[0]; // Default to primary domain
    } else {
      // In development, allow request origin or default to localhost
      allowedOrigin = origin || 'http://localhost:3000';
    }

    response.headers.set('Access-Control-Allow-Origin', allowedOrigin);
    response.headers.set('Access-Control-Allow-Credentials', 'true');
  }

  // Adicionar session ID ao response para tracking
  if (sessionId) {
    response.headers.set('x-session-id', sessionId);
  }

  // Adicionar headers de segurança adicionais
  response.headers.set('x-frame-options', 'SAMEORIGIN');
  response.headers.set('x-content-type-options', 'nosniff');
  response.headers.set('x-xss-protection', '1; mode=block');

  // Calcular tempo de resposta
  const responseTime = Date.now() - start;
  response.headers.set('x-response-time', `${responseTime}ms`);

  // Log final da requisição
  if (request.nextUrl.pathname.startsWith('/api/')) {
    Logger.info('API Request completed', {
      ...logData,
      responseTime,
      statusCode: response.status,
      riskScore
    });
  }

  // Log de performance (requisições lentas)
  if (responseTime > 2000) {
    Logger.warn('Slow request detected', {
      ...logData,
      responseTime,
      statusCode: response.status
    });
  }

  // Monitoramento de saúde da aplicação
  if (request.nextUrl.pathname === '/api/health-check') {
    const healthData = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      responseTime,
      sessionId
    };

    Logger.info('Health check accessed', healthData);
  }

  return response;
}

// Configurar quais rotas o middleware deve interceptar
// Padrão recomendado para Next.js App Router
export const config = {
  matcher: [
    // Skip Next.js internals and all static files, unless found in search params
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    // Always run for API routes
    '/(api|trpc)(.*)',
  ],
};