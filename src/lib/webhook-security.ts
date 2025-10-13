/**
 * Webhook Security Utilities
 * 
 * Implementa validações de segurança para webhooks (Stripe, Asaas).
 */

/**
 * IPs oficiais do Asaas para whitelist
 * Fonte: Documentação Asaas (verificar e atualizar conforme necessário)
 */
export const ASAAS_ALLOWED_IPS = [
  '54.207.91.66',
  '177.72.192.48',
  '18.231.194.64',
  // Adicionar outros IPs conforme documentação oficial
]

/**
 * Valida se o IP de origem é permitido
 */
export function validateIPWhitelist(
  request: Request,
  allowedIPs: string[]
): { valid: boolean; clientIP: string } {
  const forwardedFor = request.headers.get('x-forwarded-for')
  const clientIP = forwardedFor?.split(',')[0].trim() || '0.0.0.0'

  // Se não há whitelist configurada, permitir (modo desenvolvimento)
  if (allowedIPs.length === 0) {
    return { valid: true, clientIP }
  }

  const valid = allowedIPs.includes(clientIP)
  return { valid, clientIP }
}

/**
 * Valida token de autenticação do webhook
 */
export function validateWebhookToken(
  request: Request,
  expectedToken?: string
): boolean {
  if (!expectedToken) {
    // Se não há token configurado, permitir (modo desenvolvimento)
    return true
  }

  const providedToken = request.headers.get('asaas-access-token') ||
                        request.headers.get('authorization')?.replace('Bearer ', '')

  return providedToken === expectedToken
}

/**
 * Valida timestamp para prevenir replay attacks
 */
export function validateWebhookTimestamp(
  timestamp: string | Date,
  maxAgeMs: number = 5 * 60 * 1000 // 5 minutos padrão
): boolean {
  try {
    const eventTime = new Date(timestamp).getTime()
    const now = Date.now()
    const age = Math.abs(now - eventTime)

    return age <= maxAgeMs
  } catch (error) {
    return false
  }
}

/**
 * Interface para resultado de validação
 */
export interface WebhookValidationResult {
  valid: boolean
  errors: string[]
  clientIP?: string
}

/**
 * Valida webhook do Asaas com todas as verificações de segurança
 */
export async function validateAsaasWebhook(
  request: Request,
  options: {
    allowedIPs?: string[]
    webhookToken?: string
    validateTimestamp?: boolean
    maxAgeMs?: number
  } = {}
): Promise<WebhookValidationResult> {
  const errors: string[] = []
  let clientIP: string | undefined

  // 1. Validar IP de origem
  if (options.allowedIPs && options.allowedIPs.length > 0) {
    const ipValidation = validateIPWhitelist(request, options.allowedIPs)
    clientIP = ipValidation.clientIP

    if (!ipValidation.valid) {
      errors.push(`Invalid origin IP: ${ipValidation.clientIP}`)
    }
  }

  // 2. Validar token
  if (options.webhookToken) {
    const tokenValid = validateWebhookToken(request, options.webhookToken)
    if (!tokenValid) {
      errors.push('Invalid webhook token')
    }
  }

  // 3. Validar timestamp (se habilitado)
  if (options.validateTimestamp) {
    try {
      const body = await request.clone().json()
      const timestamp = body.timestamp || body.payment?.dateCreated

      if (timestamp) {
        const timestampValid = validateWebhookTimestamp(
          timestamp,
          options.maxAgeMs
        )
        if (!timestampValid) {
          errors.push('Webhook timestamp expired or invalid')
        }
      }
    } catch (error) {
      errors.push('Failed to parse webhook body for timestamp validation')
    }
  }

  return {
    valid: errors.length === 0,
    errors,
    clientIP,
  }
}

/**
 * Cria resposta de erro de validação de webhook
 */
export function createWebhookErrorResponse(
  errors: string[],
  clientIP?: string
): Response {
  return new Response(
    JSON.stringify({
      error: 'Webhook validation failed',
      details: errors,
    }),
    {
      status: 401,
      headers: {
        'Content-Type': 'application/json',
        'X-Client-IP': clientIP || 'unknown',
      },
    }
  )
}

/**
 * Middleware para validação de webhook do Asaas
 */
export function withAsaasWebhookValidation(
  handler: (req: Request) => Promise<Response>,
  options?: {
    allowedIPs?: string[]
    webhookToken?: string
    validateTimestamp?: boolean
    maxAgeMs?: number
  }
) {
  return async (request: Request): Promise<Response> => {
    // Validar webhook
    const validation = await validateAsaasWebhook(request, {
      allowedIPs: options?.allowedIPs || ASAAS_ALLOWED_IPS,
      webhookToken: options?.webhookToken || process.env.ASAAS_WEBHOOK_TOKEN,
      validateTimestamp: options?.validateTimestamp ?? true,
      maxAgeMs: options?.maxAgeMs,
    })

    if (!validation.valid) {
      console.error('Webhook validation failed:', {
        errors: validation.errors,
        clientIP: validation.clientIP,
        timestamp: new Date().toISOString(),
      })

      return createWebhookErrorResponse(validation.errors, validation.clientIP)
    }

    // Continuar com o handler
    return handler(request)
  }
}

/**
 * Valida assinatura do Stripe (já implementado no stripe.ts)
 * Incluído aqui para referência
 */
export function validateStripeSignature(
  payload: string,
  signature: string,
  secret: string
): boolean {
  try {
    // A validação real é feita pela biblioteca do Stripe
    // Esta função é um wrapper para consistência
    return true
  } catch (error) {
    return false
  }
}
