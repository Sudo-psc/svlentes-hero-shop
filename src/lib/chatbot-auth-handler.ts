/**
 * Chatbot Authentication Handlers
 * Autenticação simplificada por reconhecimento de número de WhatsApp
 */

import { prisma } from '@/lib/prisma'
import { sendPulseClient } from '@/lib/sendpulse-client'
import { logger, LogCategory } from '@/lib/logger'

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
 * Autentica usuário automaticamente pelo número de WhatsApp
 */
export async function authenticateByPhone(phone: string): Promise<AuthHandlerResult> {
  try {
    // Buscar usuário pelo telefone
    const user = await prisma.user.findFirst({
      where: {
        OR: [
          { phone },
          { whatsappPhone: phone }
        ]
      },
      include: {
        subscriptions: {
          where: {
            status: {
              in: ['ACTIVE', 'PAUSED', 'OVERDUE', 'SUSPENDED']
            }
          },
          orderBy: { createdAt: 'desc' },
          take: 1
        }
      }
    })

    if (!user) {
      return {
        success: false,
        message: '❌ Não encontramos uma conta cadastrada com este número de WhatsApp.\n\nPara criar uma assinatura, acesse:\n👉 https://svlentes.shop\n\nOu fale com nossa equipe:\n📞 WhatsApp: (33) 98606-1427',
        requiresResponse: true,
        error: 'user_not_found'
      }
    }

    // Verificar se tem assinatura ativa
    const hasActiveSubscription = user.subscriptions && user.subscriptions.length > 0

    if (!hasActiveSubscription) {
      return {
        success: false,
        message: `Olá ${user.name || 'Cliente'}! 👋\n\nVocê ainda não possui uma assinatura ativa.\n\nPara assinar:\n👉 https://svlentes.shop\n\nDúvidas? Fale conosco:\n📞 WhatsApp: (33) 98606-1427`,
        requiresResponse: true,
        error: 'no_active_subscription'
      }
    }

    // Criar ou atualizar sessão
    const sessionToken = generateSessionToken()
    const expiresAt = new Date()
    expiresAt.setHours(expiresAt.getHours() + 24) // 24 horas

    await prisma.chatbotSession.upsert({
      where: {
        phone
      },
      create: {
        userId: user.id,
        phone,
        sessionToken,
        status: 'ACTIVE',
        expiresAt,
        lastActivityAt: new Date()
      },
      update: {
        sessionToken,
        status: 'ACTIVE',
        expiresAt,
        lastActivityAt: new Date()
      }
    })

    logger.info(LogCategory.WHATSAPP, 'Autenticação automática por telefone bem-sucedida', {
      phone,
      userId: user.id,
      userName: user.name
    })

    return {
      success: true,
      message: '',
      requiresResponse: false,
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
 */
export async function isUserAuthenticated(phone: string): Promise<{
  authenticated: boolean
  sessionToken?: string
  session?: any
  userId?: string
  userName?: string
}> {
  try {
    const session = await prisma.chatbotSession.findFirst({
      where: {
        phone,
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
      return {
        authenticated: false
      }
    }

    // Atualizar última atividade
    await prisma.chatbotSession.update({
      where: { id: session.id },
      data: { lastActivityAt: new Date() }
    })

    return {
      authenticated: true,
      sessionToken: session.sessionToken,
      session,
      userId: session.userId,
      userName: session.user.name || undefined
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
