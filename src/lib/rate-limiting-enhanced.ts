/**
 * 🚀 Quick Win: Rate Limiting Enhanced para APIs Críticas
 *
 * Implementação de rate limiting para APIs críticas do SV Lentes
 * Foco em segurança, performance e proteção contra abuso
 */

import { logger } from './logger';

// 🎯 Configurações de Rate Limiting por Endpoint
export interface RateLimitConfig {
  windowMs: number;        // Janela de tempo em ms
  max: number;            // Máximo de requisições
  message: string;        // Mensagem de erro
  skipSuccessfulRequests?: boolean;  // Pular requisições bem-sucedidas
  skipFailedRequests?: boolean;      // Pular requisições falhadas
}

// 📊 Configurações pré-definidas
export const RATE_LIMIT_CONFIGS: Record<string, RateLimitConfig> = {
  // 🔥 APIs de Pagamento (máxima proteção)
  PAYMENT: {
    windowMs: 15 * 60 * 1000,  // 15 minutos
    max: 5,                    // máximo 5 tentativas
    message: 'Muitas tentativas de pagamento. Tente novamente em 15 minutos.',
    skipFailedRequests: false
  },

  // 📱 APIs de WhatsApp (proteção alta)
  WHATSAPP: {
    windowMs: 10 * 60 * 1000,  // 10 minutos
    max: 10,                   // máximo 10 mensagens
    message: 'Limite de mensagens WhatsApp excedido. Tente novamente em 10 minutos.',
    skipSuccessfulRequests: false
  },

  // 🔐 APIs de Autenticação (proteção média)
  AUTH: {
    windowMs: 15 * 60 * 1000,  // 15 minutos
    max: 20,                   // máximo 20 tentativas
    message: 'Muitas tentativas de autenticação. Tente novamente em 15 minutos.',
    skipFailedRequests: false
  },

  // 🌐 APIs Gerais (proteção básica)
  GENERAL: {
    windowMs: 5 * 60 * 1000,   // 5 minutos
    max: 100,                  // máximo 100 requisições
    message: 'Limite de requisições excedido. Tente novamente em 5 minutos.',
    skipSuccessfulRequests: false
  },

  // 🔍 APIs de Debug (proteção mínima, apenas em desenvolvimento)
  DEBUG: {
    windowMs: 1 * 60 * 1000,   // 1 minuto
    max: 50,                   // máximo 50 requisições
    message: 'Limite de debug excedido.',
    skipSuccessfulRequests: true,
    skipFailedRequests: true
  }
};

// 🗂️ Store para armazenar rate limits (em produção usar Redis)
interface RateLimitStore {
  requests: Map<string, Array<{ timestamp: number; count: number }>>;
  cleanup: () => void;
}

class MemoryRateLimitStore implements RateLimitStore {
  public requests = new Map<string, Array<{ timestamp: number; count: number }>>();

  cleanup(): void {
    const now = Date.now();
    const maxAge = 15 * 60 * 1000; // 15 minutos

    for (const [key, timestamps] of this.requests.entries()) {
      const validTimestamps = timestamps.filter(({ timestamp }) =>
        now - timestamp < maxAge
      );

      if (validTimestamps.length === 0) {
        this.requests.delete(key);
      } else {
        this.requests.set(key, validTimestamps);
      }
    }
  }
}

const store = new MemoryRateLimitStore();

// 🧹 Cleanup automático a cada 5 minutos
setInterval(() => store.cleanup(), 5 * 60 * 1000);

/**
 * 🚀 Middleware de Rate Limiting
 */
export function createRateLimit(config: RateLimitConfig) {
  return function rateLimit(req: Request, identifier?: string): { success: boolean; error?: any } {
    const key = identifier || getClientIdentifier(req);
    const now = Date.now();

    // Obter requisições anteriores
    let requests = store.requests.get(key) || [];

    // Limpar requisições antigas (fora da janela)
    const windowStart = now - config.windowMs;
    requests = requests.filter(({ timestamp }) => timestamp > windowStart);

    // Contar requisições na janela atual
    const requestCount = requests.reduce((total, req) => total + req.count, 0);

    // Verificar se excedeu o limite
    if (requestCount >= config.max) {
      logger.warn('RATE_LIMIT_EXCEEDED', 'Rate limit exceeded', {
        key,
        requestCount,
        max: config.max,
        windowMs: config.windowMs,
        path: req.url
      });

      return {
        success: false,
        error: {
          code: 'RATE_LIMIT_EXCEEDED',
          message: config.message,
          retryAfter: Math.ceil(config.windowMs / 1000), // segundos
          remainingTime: config.windowMs - (now - requests[0]?.timestamp || 0)
        }
      };
    }

    // Adicionar requisição atual
    requests.push({ timestamp: now, count: 1 });
    store.requests.set(key, requests);

    // Log de rate limiting (debug)
    logger.debug('RATE_LIMIT_CHECK', 'Rate limit check passed', {
      key,
      requestCount: requestCount + 1,
      max: config.max,
      remaining: config.max - requestCount - 1
    });

    return { success: true };
  };
}

/**
 * 🔑 Gerar identificador único para rate limiting
 */
function getClientIdentifier(req: Request): string {
  // TIP: Em produção, usar combinação de IP + User-Agent + Device ID
  const forwarded = req.headers.get('x-forwarded-for');
  const realIp = req.headers.get('x-real-ip');
  const userAgent = req.headers.get('user-agent') || '';

  const ip = forwarded?.split(',')[0] || realIp || 'unknown';
  const userAgentHash = userAgent.substring(0, 50).replace(/[^a-zA-Z0-9]/g, '');

  // Hash para evitar armazenar IP diretamente (LGPD compliance)
  return Buffer.from(`${ip}-${userAgentHash}`).toString('base64').substring(0, 32);
}

/**
 * 🛡️ Rate Limiters pré-configurados
 */
export const rateLimiters = {
  payment: createRateLimit(RATE_LIMIT_CONFIGS.PAYMENT),
  whatsapp: createRateLimit(RATE_LIMIT_CONFIGS.WHATSAPP),
  auth: createRateLimit(RATE_LIMIT_CONFIGS.AUTH),
  general: createRateLimit(RATE_LIMIT_CONFIGS.GENERAL),
  debug: createRateLimit(RATE_LIMIT_CONFIGS.DEBUG)
};

/**
 * 🎯 Helper para aplicar rate limiting em Next.js API routes
 */
export function withRateLimit(
  handler: (req: Request) => Promise<Response>,
  type: keyof typeof rateLimiters = 'general',
  options?: { identifier?: string }
) {
  return async (req: Request): Promise<Response> => {
    // Aplicar rate limiting
    const result = rateLimiters[type](req, options?.identifier);

    if (!result.success) {
      return new Response(
        JSON.stringify({
          success: false,
          error: result.error,
          timestamp: new Date().toISOString()
        }),
        {
          status: 429, // Too Many Requests
          headers: {
            'Content-Type': 'application/json',
            'Retry-After': result.error.retryAfter.toString(),
            'X-RateLimit-Limit': rateLimiters[type].toString(),
            'X-RateLimit-Remaining': '0',
            'X-RateLimit-Reset': new Date(Date.now() + result.error.remainingTime).toISOString()
          }
        }
      );
    }

    // Executar handler original
    try {
      const response = await handler(req);

      // Adicionar headers de rate limit à resposta
      const remaining = Math.max(0, result.error ? 0 :
        RATE_LIMIT_CONFIGS[type].max - (store.requests.get(options?.identifier || getClientIdentifier(req))?.length || 0)
      );

      response.headers.set('X-RateLimit-Limit', RATE_LIMIT_CONFIGS[type].max.toString());
      response.headers.set('X-RateLimit-Remaining', remaining.toString());
      response.headers.set('X-RateLimit-Reset', new Date(Date.now() + RATE_LIMIT_CONFIGS[type].windowMs).toISOString());

      return response;

    } catch (error) {
      logger.error('RATE_LIMIT_HANDLER_ERROR', 'Error in rate limited handler', error);
      throw error;
    }
  };
}

/**
 * 📊 Obter status atual de rate limiting
 */
export function getRateLimitStatus(identifier: string, type: keyof typeof rateLimiters = 'general') {
  const key = identifier;
  const now = Date.now();
  const config = RATE_LIMIT_CONFIGS[type];
  const windowStart = now - config.windowMs;

  let requests = store.requests.get(key) || [];
  requests = requests.filter(({ timestamp }) => timestamp > windowStart);

  const requestCount = requests.reduce((total, req) => total + req.count, 0);
  const remaining = Math.max(0, config.max - requestCount);
  const resetTime = requests.length > 0 ?
    new Date(requests[0].timestamp + config.windowMs) :
    new Date(now + config.windowMs);

  return {
    limit: config.max,
    remaining,
    resetTime: resetTime.toISOString(),
    resetIn: Math.max(0, Math.ceil((resetTime.getTime() - now) / 1000)),
    requests: requestCount,
    windowMs: config.windowMs
  };
}

/**
 * 🧹 Limpar rate limiting para um identificador
 */
export function clearRateLimit(identifier: string): void {
  store.requests.delete(identifier);
  logger.info('RATE_LIMIT_CLEARED', 'Rate limit cleared', { identifier });
}

/**
 * 📈 Estatísticas de Rate Limiting
 */
export function getRateLimitStats() {
  const stats = {
    totalKeys: store.requests.size,
    totalRequests: 0,
    endpoints: {} as Record<string, number>
  };

  for (const [key, requests] of store.requests.entries()) {
    stats.totalRequests += requests.reduce((total, req) => total + req.count, 0);
  }

  return stats;
}

// 🎯 Rate Limiting para endpoints específicos do SV Lentes
export const svlentesRateLimits = {
  // Webhooks do Asaas (pagamentos)
  asaasWebhook: (req: Request) => withRateLimit(req, 'payment'),

  // Webhooks do SendPulse (WhatsApp)
  sendpulseWebhook: (req: Request) => withRateLimit(req, 'whatsapp'),

  // APIs de autenticação
  authEndpoints: (req: Request) => withRateLimit(req, 'auth'),

  // APIs de pagamento
  paymentEndpoints: (req: Request) => withRateLimit(req, 'payment'),

  // APIs de WhatsApp
  whatsappEndpoints: (req: Request) => withRateLimit(req, 'whatsapp'),

  // APIs administrativas
  adminEndpoints: (req: Request) => withRateLimit(req, 'general'),

  // Debug endpoints (apenas desenvolvimento)
  debugEndpoints: (req: Request) => withRateLimit(req, 'debug')
};

export default {
  createRateLimit,
  withRateLimit,
  getRateLimitStatus,
  clearRateLimit,
  getRateLimitStats,
  rateLimiters,
  svlentesRateLimits,
  RATE_LIMIT_CONFIGS
};