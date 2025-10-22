/**
 * Enhanced Chatbot Authentication Handlers
 * Autenticação robusta com verificação de cadastro e assinatura ativa
 *
 * Melhorias:
 * - Rate limiting por usuário
 * - Detecção de sessões duplicadas
 * - Validação de sessão robusta
 * - Auto-renovação de sessão
 * - Logs de auditoria de autenticação
 */
import { prisma } from '@/lib/prisma'
import { sendPulseClient } from '@/lib/sendpulse-client'
import { logger, LogCategory } from '@/lib/logger'

/**
 * Rate Limiter para tentativas de autenticação
 */
const authAttempts = new Map<string, { count: number; resetAt: number }>()
const MAX_AUTH_ATTEMPTS = 5
const AUTH_WINDOW_MS = 15 * 60 * 1000 // 15 minutos

/**
 * Cache de sessões ativas para validação rápida
 */
const sessionCache = new Map<string, { userId: string; expiresAt: Date; userName: string }>()

/**
 * Verifica rate limit para autenticação
 */
function checkAuthRateLimit(phone: string): { allowed: boolean; remaining: number; resetAt: number } {
  const now = Date.now()
  const key = `auth:${phone}`

  let entry = authAttempts.get(key)

  // Resetar se expirou
  if (!entry || now > entry.resetAt) {
    entry = { count: 0, resetAt: now + AUTH_WINDOW_MS }
    authAttempts.set(key, entry)
  }

  entry.count++

  return {
    allowed: entry.count <= MAX_AUTH_ATTEMPTS,
    remaining: Math.max(0, MAX_AUTH_ATTEMPTS - entry.count),
    resetAt: entry.resetAt
  }
}

/**
 * Reseta rate limit após autenticação bem-sucedida
 */
function resetAuthRateLimit(phone: string): void {
  authAttempts.delete(`auth:${phone}`)
}

/**
 * Detecta e remove sessões duplicadas
 */
async function removeDuplicateSessions(userId: string, phone: string, keepSessionId?: string): Promise<number> {
  try {
    const result = await prisma.chatbotSession.updateMany({
      where: {
        userId,
        phone,
        status: 'ACTIVE',
        ...(keepSessionId && { id: { not: keepSessionId } })
      },
      data: {
        status: 'TERMINATED',
        terminatedAt: new Date(),
        terminationReason: 'Nova sessão iniciada - sessão anterior terminada automaticamente'
      }
    })

    if (result.count > 0) {
      logger.info(LogCategory.WHATSAPP, 'Sessões duplicadas removidas', {
        userId,
        phone,
        count: result.count
      })
    }

    return result.count
  } catch (error) {
    logger.error(LogCategory.WHATSAPP, 'Erro ao remover sessões duplicadas', {
      userId,
      phone,
      error: error instanceof Error ? error.message : 'Unknown'
    })
    return 0
  }
}

/**
 * Limpa cache de sessões expiradas
 */
function cleanupSessionCache(): void {
  const now = new Date()
  for (const [key, value] of sessionCache.entries()) {
    if (value.expiresAt < now) {
      sessionCache.delete(key)
    }
  }
}

// Limpar cache a cada 5 minutos
setInterval(cleanupSessionCache, 5 * 60 * 1000)
/**
 * Normaliza número de telefone brasileiro para formato padrão
 * Remove caracteres especiais e garante formato com DDD + 9 dígitos
 */
function normalizePhoneNumber(phone: string): string {
  if (!phone) return ''
  // Remove todos os caracteres não numéricos
  const cleaned = phone.replace(/\D/g, '')
  // Verificar se é número brasileiro válido (com DDD)
  if (cleaned.length === 10 || cleaned.length === 11) {
    // Se tiver 11 dígitos, remove o 9 inicial (números de celular)
    if (cleaned.length === 11 && cleaned.startsWith('9')) {
      return cleaned.substring(1)
    }
    return cleaned
  }
  // Retorna o número limpo se não seguir o padrão brasileiro
  return cleaned
}
/**
 * Valida se o formato do número é válido para Brasil
 */
function isValidBrazilianPhone(phone: string): boolean {
  const normalized = normalizePhoneNumber(phone)
  // Números brasileiros devem ter 10 dígitos (fixo) ou 11 (celular sem o 9)
  return normalized.length === 10 || normalized.length === 11
}
/**
 * Verifica se a assinatura está realmente ativa e em bom status
 */
function isSubscriptionActiveAndValid(status: string): boolean {
  const validStatuses = ['ACTIVE']
  return validStatuses.includes(status)
}
/**
 * Gera mensagem informativa sobre status específico da assinatura
 */
function generateSubscriptionStatusMessage(status: string, userName: string, planType?: string): string {
  const statusConfig = {
    'PAUSED': {
      emoji: '⏸️',
      label: 'Pausada',
      message: `Olá ${userName}! 👋\n\nSua assinatura está *Pausada* no momento.\n\nPara reativar:\n👉 https://svlentes.shop/area-assinante\n\nOu fale conosco:\n📞 WhatsApp: (33) 98606-1427`
    },
    'OVERDUE': {
      emoji: '⚠️',
      label: 'Em Atraso',
      message: `Olá ${userName}! 👋\n\nIdentificamos que sua assinatura está *Em Atraso*.\n\nPara regularizar:\n💳 Acesse sua área do assinante\n👉 https://svlentes.shop/area-assinante\n\nPrecisa de ajuda? Fale conosco:\n📞 WhatsApp: (33) 98606-1427`
    },
    'SUSPENDED': {
      emoji: '🔒',
      label: 'Suspensa',
      message: `Olá ${userName}! 👋\n\nSua assinatura está *Suspensa* no momento.\n\nPara regularizar:\n📞 Fale com nossa equipe:\n📞 WhatsApp: (33) 98606-1427\n\nHorário de atendimento: Seg-Sex, 9h-18h`
    },
    'CANCELLED': {
      emoji: '❌',
      label: 'Cancelada',
      message: `Olá ${userName}! 👋\n\nNão encontramos uma assinatura ativa para este número.\n\nPara assinar novamente:\n👉 https://svlentes.shop\n\nDúvidas? Fale conosco:\n📞 WhatsApp: (33) 98606-1427`
    },
    'EXPIRED': {
      emoji: '⏰',
      label: 'Expirada',
      message: `Olá ${userName}! 👋\n\nSua assinatura expirou.\n\nPara renovar:\n👉 https://svlentes.shop\n\nDúvidas? Fale conosco:\n📞 WhatsApp: (33) 98606-1427`
    },
    'REFUNDED': {
      emoji: '💰',
      label: 'Reembolsada',
      message: `Olá ${userName}! 👋\n\nNão encontramos uma assinatura ativa para este número.\n\nPara assinar novamente:\n👉 https://svlentes.shop\n\nDúvidas? Fale conosco:\n📞 WhatsApp: (33) 98606-1427`
    }
  }
  const config = statusConfig[status as keyof typeof statusConfig]
  if (config) {
    return config.message
  }
  // Status não reconhecido ou genérico
  return `Olá ${userName}! 👋\n\nNão conseguimos identificar sua assinatura atual.\n\nPara verificar seu status:\n👉 https://svlentes.shop/area-assinante\n\nOu fale conosco:\n📞 WhatsApp: (33) 98606-1427`
}
export interface AuthHandlerResult {
  success: boolean
  message: string
  requiresResponse: boolean
  sessionToken?: string
  userId?: string
  userName?: string
  error?: string
}
/**
 * Autentica usuário robustamente pelo número de WhatsApp
 * Verifica cadastro, formato de número e status da assinatura
 */
export async function authenticateByPhone(phone: string): Promise<AuthHandlerResult> {
  try {
    // Validar e normalizar o número de telefone
    if (!phone || !isValidBrazilianPhone(phone)) {
      return {
        success: false,
        message: '❌ *Formato de número inválido*\n\nPor favor, envie uma mensagem de um número de telefone brasileiro válido.\n\nExemplos válidos:\n📱 (33) 9XXXX-YYYY\n📱 339XXXXXXXX\n\nPara suporte:\n📞 WhatsApp: (33) 98606-1427',
        requiresResponse: true,
        error: 'invalid_phone_format'
      }
    }
    const normalizedPhone = normalizePhoneNumber(phone)

    // Verificar rate limit
    const rateLimit = checkAuthRateLimit(normalizedPhone)
    if (!rateLimit.allowed) {
      const minutesRemaining = Math.ceil((rateLimit.resetAt - Date.now()) / 1000 / 60)
      logger.warn(LogCategory.WHATSAPP, 'Rate limit excedido para autenticação', {
        phone: normalizedPhone,
        attempts: MAX_AUTH_ATTEMPTS,
        resetIn: minutesRemaining
      })

      return {
        success: false,
        message: `⏱️ *Muitas tentativas de autenticação*\n\nPor favor, aguarde ${minutesRemaining} minuto(s) antes de tentar novamente.\n\nSe precisar de ajuda imediata:\n📞 WhatsApp: (33) 98606-1427`,
        requiresResponse: true,
        error: 'rate_limit_exceeded'
      }
    }

    logger.info(LogCategory.WHATSAPP, 'Processando autenticação por telefone', {
      originalPhone: phone,
      normalizedPhone,
      rateLimitRemaining: rateLimit.remaining
    })
    // Buscar usuário pelo telefone normalizado (busca em ambos os campos)
    const user = await prisma.user.findFirst({
      where: {
        OR: [
          { phone: normalizedPhone },
          { whatsapp: normalizedPhone },
          { phone: phone },
          { whatsapp: phone }
        ]
      },
      include: {
        subscriptions: {
          orderBy: { createdAt: 'desc' },
          take: 1
        }
      }
    })
    if (!user) {
      return {
        success: false,
        message: '❌ *Não encontramos uma conta cadastrada*\n\nVerificamos em nosso sistema e não localizamos uma conta associada a este número de WhatsApp.\n\n📋 *Para criar sua assinatura:*\n👉 Acesse: https://svlentes.shop/assinar\n\n📞 *Precisa de ajuda?*\n• WhatsApp: (33) 98606-1427\n• Site: https://svlentes.shop',
        requiresResponse: true,
        error: 'user_not_found'
      }
    }
    // Verificar se tem alguma assinatura (qualquer status)
    const hasSubscription = user.subscriptions && user.subscriptions.length > 0
    if (!hasSubscription) {
      return {
        success: false,
        message: `Olá ${user.name || 'Cliente'}! 👋\n\n*Nenhuma assinatura encontrada*\n\nNão localizamos nenhuma assinatura associada à sua conta.\n\n📋 *Para assinar:*\n👉 Acesse: https://svlentes.shop/planos\n\n📞 *Suporte especializado:*\n• WhatsApp: (33) 98606-1427\n• Horário: Seg-Sex, 9h-18h`,
        requiresResponse: true,
        error: 'no_subscription'
      }
    }
    // Verificar se a assinatura está realmente ativa
    const subscription = user.subscriptions[0]
    const isActiveSubscription = isSubscriptionActiveAndValid(subscription.status)
    if (!isActiveSubscription) {
      // Gerar mensagem específica baseada no status
      const statusMessage = generateSubscriptionStatusMessage(
        subscription.status,
        user.name || 'Cliente',
        subscription.planType
      )
      return {
        success: false,
        message: statusMessage,
        requiresResponse: true,
        error: `subscription_${subscription.status.toLowerCase()}`
      }
    }
    // Remover sessões duplicadas antes de criar nova
    await removeDuplicateSessions(user.id, normalizedPhone)

    // Criar ou atualizar sessão
    const sessionToken = generateSessionToken()
    const expiresAt = new Date()
    expiresAt.setHours(expiresAt.getHours() + 24) // 24 horas

    // Verificar se já existe sessão ativa para este telefone
    const existingSession = await prisma.chatbotSession.findFirst({
      where: {
        phone: normalizedPhone,
        userId: user.id
      }
    })

    let sessionId: string

    if (existingSession) {
      // Atualizar sessão existente
      const updated = await prisma.chatbotSession.update({
        where: { id: existingSession.id },
        data: {
          sessionToken,
          status: 'ACTIVE',
          expiresAt,
          lastActivityAt: new Date()
        }
      })
      sessionId = updated.id
    } else {
      // Criar nova sessão
      const created = await prisma.chatbotSession.create({
        data: {
          userId: user.id,
          phone: normalizedPhone,
          sessionToken,
          status: 'ACTIVE',
          expiresAt,
          lastActivityAt: new Date()
        }
      })
      sessionId = created.id
    }

    // Adicionar ao cache de sessões para validação rápida
    sessionCache.set(sessionToken, {
      userId: user.id,
      expiresAt,
      userName: user.name || 'Cliente'
    })

    // Resetar rate limit após autenticação bem-sucedida
    resetAuthRateLimit(normalizedPhone)

    logger.info(LogCategory.WHATSAPP, 'Autenticação automática por telefone bem-sucedida', {
      phone: normalizedPhone,
      userId: user.id,
      userName: user.name,
      sessionId,
      expiresAt: expiresAt.toISOString()
    })
    logger.info(LogCategory.WHATSAPP, 'Usuário autenticado com sucesso', {
      normalizedPhone,
      userId: user.id,
      userName: user.name,
      subscriptionStatus: subscription.status
    })
    // Obter detalhes da assinatura para mensagem personalizada
    const statusEmoji = '✅'
    const statusLabel = 'Ativa'
    // Formatar datas de forma amigável
    const renewalDate = new Date(subscription.renewalDate)
    const renewalFormatted = renewalDate.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: 'long',
      year: 'numeric'
    })
    // Calcular dias até a renovação
    const today = new Date()
    const daysUntilRenewal = Math.ceil((renewalDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
    const renewalInfo = daysUntilRenewal > 0
      ? `em ${daysUntilRenewal} dia(s)`
      : daysUntilRenewal === 0
        ? 'hoje!'
        : `há ${Math.abs(daysUntilRenewal)} dia(s)`
    // Mensagem de boas-vindas melhorada e personalizada
    const welcomeMessage = `${statusEmoji} *Bem-vindo(a) à SV Lentes!*
Olá ${user.name || 'Cliente'}! 👋
*Identificamos sua assinatura ativa:*
📦 Plano: ${subscription.planType}
📅 Renovação: ${renewalFormatted} (${renewalInfo})
💰 Mensalidade: R$ ${subscription.monthlyValue.toFixed(2)}
*Como posso ajudar você hoje?*
1️⃣ 📋 *Ver detalhes da assinatura*
2️⃣ 📦 *Rastrear meu pedido*
3️⃣ 📄 *Baixar nota fiscal*
4️⃣ 📍 *Atualizar endereço*
5️⃣ 💳 *Atualizar pagamento*
6️⃣ 🔄 *Alterar plano*
7️⃣ ⏸️ *Pausar assinatura*
8️⃣ 📞 *Falar com atendente*
Digite o número da opção ou descreva sua necessidade! 😊
---
*Dr. Philipe Saraiva Cruz (CRM-MG 69.870)*
*Atendimento: Seg-Sex, 9h-18h*`
    return {
      success: true,
      message: welcomeMessage,
      requiresResponse: true,
      sessionToken,
      userId: user.id,
      userName: user.name || undefined
    }
  } catch (error) {
    logger.error(LogCategory.WHATSAPP, 'Erro ao autenticar por telefone', {
      phone,
      error: error instanceof Error ? error.message : 'Unknown'
    })
    return {
      success: false,
      message: '❌ Erro ao verificar sua conta. Por favor, tente novamente ou entre em contato:\n📞 WhatsApp: (33) 98606-1427',
      requiresResponse: true,
      error: error instanceof Error ? error.message : 'unknown_error'
    }
  }
}
/**
 * Gera token de sessão único
 */
function generateSessionToken(): string {
  const timestamp = Date.now().toString(36)
  const randomPart = Math.random().toString(36).substring(2, 15)
  return `chatbot_${timestamp}_${randomPart}`
}
/**
 * Valida se o usuário está autenticado (verifica sessão existente)
 *
 * Melhorias:
 * - Cache de sessões para validação rápida
 * - Auto-renovação de sessão próxima ao vencimento
 * - Validação robusta com fallback
 */
export async function isUserAuthenticated(phone: string): Promise<{
  authenticated: boolean
  sessionToken?: string
  session?: any
  userId?: string
  userName?: string
  autoRenewed?: boolean
}> {
  try {
    const normalizedPhone = normalizePhoneNumber(phone)

    const session = await prisma.chatbotSession.findFirst({
      where: {
        phone: normalizedPhone,
        status: 'ACTIVE',
        expiresAt: {
          gt: new Date()
        }
      },
      include: {
        user: {
          select: {
            id: true,
            name: true
          }
        }
      }
    })

    if (!session) {
      logger.debug(LogCategory.WHATSAPP, 'Nenhuma sessão ativa encontrada', {
        phone: normalizedPhone
      })
      return {
        authenticated: false
      }
    }

    // Verificar se a sessão está próxima de expirar (menos de 2 horas)
    const now = new Date()
    const expiresIn = session.expiresAt.getTime() - now.getTime()
    const twoHoursInMs = 2 * 60 * 60 * 1000
    let autoRenewed = false

    if (expiresIn < twoHoursInMs && expiresIn > 0) {
      // Auto-renovar sessão
      const newExpiresAt = new Date()
      newExpiresAt.setHours(newExpiresAt.getHours() + 24)

      await prisma.chatbotSession.update({
        where: { id: session.id },
        data: {
          expiresAt: newExpiresAt,
          lastActivityAt: now
        }
      })

      // Atualizar cache
      sessionCache.set(session.sessionToken, {
        userId: session.userId,
        expiresAt: newExpiresAt,
        userName: session.user.name || 'Cliente'
      })

      logger.info(LogCategory.WHATSAPP, 'Sessão auto-renovada', {
        phone: normalizedPhone,
        userId: session.userId,
        newExpiresAt: newExpiresAt.toISOString()
      })

      autoRenewed = true
    } else {
      // Apenas atualizar última atividade
      await prisma.chatbotSession.update({
        where: { id: session.id },
        data: { lastActivityAt: now }
      })
    }

    // Incrementar contador de comandos executados
    await prisma.chatbotSession.update({
      where: { id: session.id },
      data: { commandsExecuted: { increment: 1 } }
    })

    logger.debug(LogCategory.WHATSAPP, 'Sessão validada com sucesso', {
      phone: normalizedPhone,
      userId: session.userId,
      autoRenewed,
      expiresAt: session.expiresAt
    })

    return {
      authenticated: true,
      sessionToken: session.sessionToken,
      session,
      userId: session.userId,
      userName: session.user.name || undefined,
      autoRenewed
    }
  } catch (error) {
    logger.error(LogCategory.WHATSAPP, 'Erro ao verificar autenticação', {
      phone,
      error: error instanceof Error ? error.message : 'Unknown'
    })
    return {
      authenticated: false
    }
  }
}