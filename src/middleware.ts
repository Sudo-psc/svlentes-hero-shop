/**
 * Middleware para logging de requisições e monitoramento
 * Intercepta todas as requisições e coleta métricas de performance
 * Integrado com Firebase Admin para autenticação
 */
import { NextRequest, NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';

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

// Extrai informações do usuário
async function getUserInfo(request: NextRequest): Promise<{ userId?: string; sessionId?: string }> {
  const token = await getToken({ req: request });

  // Tentar obter ID do usuário do token JWT
  const userId = token?.sub || token?.id;

  // Obter ou criar session ID
  let sessionId = request.headers.get('x-session-id');
  if (!sessionId) {
    sessionId = generateSessionId();
  }

  return { userId, sessionId };
}

// Extrai IP real (atrás de proxies)
function getClientIP(request: NextRequest): string {
  const forwarded = request.headers.get('x-forwarded-for');
  const realIP = request.headers.get('x-real-ip');
  const clientIP = request.ip;

  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }

  if (realIP) {
    return realIP;
  }

  return clientIP || 'unknown';
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

// Check if route is public (doesn't require authentication)
function isPublicRoute(pathname: string): boolean {
  const publicPaths = [
    '/area-assinante/login',
    '/area-assinante/registro',
    '/api/assinante/register',
    '/api/health-check',
    '/api/monitoring',
    '/api/privacy',
    '/api/webhooks',
    '/api/schedule-consultation',
    '/api/whatsapp-redirect',
    '/api/create-checkout',
    '/api/asaas/create-payment',
  ];

  return publicPaths.some(path => pathname.startsWith(path));
}

// Check if route is protected (requires authentication)
function isProtectedRoute(pathname: string): boolean {
  const protectedPaths = [
    '/area-assinante',
    '/api/assinante',
  ];

  return protectedPaths.some(path => pathname.startsWith(path));
}

// Verify Firebase token from Authorization header
async function verifyFirebaseToken(request: NextRequest): Promise<{ authenticated: boolean; userId?: string }> {
  try {
    const authHeader = request.headers.get('Authorization');

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return { authenticated: false };
    }

    const token = authHeader.split('Bearer ')[1];

    // Import Firebase Admin dynamically to avoid initialization issues
    const { adminAuth } = await import('@/lib/firebase-admin');

    if (!adminAuth) {
      Logger.warn('Firebase Admin not configured');
      return { authenticated: false };
    }

    const decodedToken = await adminAuth.verifyIdToken(token);
    return { authenticated: true, userId: decodedToken.uid };
  } catch (error: any) {
    Logger.error('Token verification failed', { error: error.message });
    return { authenticated: false };
  }
}

export async function middleware(request: NextRequest) {
  const start = Date.now();
  const pathname = request.nextUrl.pathname;

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
  if (pathname.startsWith('/api/')) {
    Logger.info('API Request started', {
      ...logData,
      riskScore,
      isBot: isBot(userAgent)
    });
  }

  // Log de páginas principais
  const mainPages = ['/assinar', '/agendar-consulta', '/area-assinante'];
  if (mainPages.some(page => pathname.startsWith(page))) {
    Logger.info('Main page access', {
      ...logData,
      page: pathname
    });
  }

  // Authentication check for protected routes
  if (isProtectedRoute(pathname) && !isPublicRoute(pathname)) {
    // For API routes, check Bearer token
    if (pathname.startsWith('/api/')) {
      const { authenticated, userId: firebaseUserId } = await verifyFirebaseToken(request);

      if (!authenticated) {
        Logger.warn('Unauthorized API access attempt', {
          ...logData,
          path: pathname,
        });

        return NextResponse.json(
          { error: 'UNAUTHORIZED', message: 'Authentication required' },
          { status: 401 }
        );
      }

      Logger.info('Authenticated API access', {
        ...logData,
        firebaseUserId,
      });
    }
    // For page routes, redirect to login if no session
    // Note: Firebase client-side auth will handle the actual authentication
    // The middleware primarily protects API routes
  }

  // Create response with security headers
  const response = NextResponse.next();

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
  if (pathname.startsWith('/api/')) {
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
  if (pathname === '/api/health-check') {
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
export const config = {
  matcher: [
    // Skip Next.js internals and all static files, unless found in search params
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    // Always run for API routes
    '/(api|trpc)(.*)',
  ],
};
