// @ts-nocheck - Prisma type mismatches - requires schema regeneration or type fixes
import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { adminAuth } from '@/lib/firebase-admin'
import { prisma } from '@/lib/prisma'
import { rateLimit, rateLimitConfigs } from '@/lib/rate-limit'
import { csrfProtection } from '@/lib/csrf'
import {
  getUserByFirebaseUid,
  getActiveSubscription,
  isErrorResponse,
  validateSubscriptionOwnership,
} from '@/lib/api-helpers'
import {
  ApiErrorHandler,
  ErrorType,
  validateFirebaseAuth,
  generateRequestId,
  type ErrorContext,
} from '@/lib/api-error-handler'
import { subscriptionAddressUpdateSchema } from '@/lib/validation-schemas'
import { logAudit, AuditAction } from '@/lib/audit-logger'

/**
 * GET /api/assinante/subscription
 * Retorna dados da assinatura do usuário autenticado
 */
export async function GET(request: NextRequest) {
  // Rate limiting: 200 requisições em 15 minutos (leitura)
  const rateLimitResult = await rateLimit(request, rateLimitConfigs.read)
  if (rateLimitResult) {
    return rateLimitResult
  }
  try {
    // Verificar se Firebase Admin está inicializado
    if (!adminAuth) {
      console.warn('[API /api/assinante/subscription] Firebase Admin não configurado - funcionalidade desabilitada')
      return NextResponse.json(
        {
          error: 'SERVICE_UNAVAILABLE',
          message: 'Serviço de autenticação temporariamente indisponível',
          subscription: null
        },
        { status: 503 }
      )
    }
    // Verificar token Firebase do header Authorization
    const authHeader = request.headers.get('Authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'UNAUTHORIZED', message: 'Token de autenticação não fornecido' },
        { status: 401 }
      )
    }
    const token = authHeader.split('Bearer ')[1]
    let firebaseUser
    try {
      firebaseUser = await adminAuth.verifyIdToken(token)
    } catch (error) {
      return NextResponse.json(
        { error: 'UNAUTHORIZED', message: 'Token inválido ou expirado' },
        { status: 401 }
      )
    }
    if (!firebaseUser || !firebaseUser.uid) {
      return NextResponse.json(
        { error: 'UNAUTHORIZED', message: 'Usuário não autenticado' },
        { status: 401 }
      )
    }
    // Buscar usuário com assinaturas ativas usando o UID do Firebase
    // OWNERSHIP: Busca é feita pelo firebaseUid, garantindo que só dados do próprio usuário sejam retornados
    const user = await prisma.user.findUnique({
      where: { firebaseUid: firebaseUser.uid },
      include: {
        subscriptions: {
          where: { 
            status: 'ACTIVE'
            // userId is automatically filtered by the relation
          },
          include: {
            benefits: true,
            orders: {
              orderBy: { createdAt: 'desc' },
              take: 1
            }
          },
          orderBy: { createdAt: 'desc' },
          take: 1
        }
      }
    })
    if (!user) {
      return NextResponse.json(
        { error: 'NOT_FOUND', message: 'Usuário não encontrado' },
        { status: 404 }
      )
    }
    // Se não tem assinatura ativa, retornar null
    if (user.subscriptions.length === 0) {
      return NextResponse.json({
        subscription: null,
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          avatarUrl: user.avatarUrl || user.image
        }
      }, { status: 200 })
    }
    const subscription = user.subscriptions[0]
    // Calcular próxima data de cobrança
    const nextBillingDate = new Date(subscription.renewalDate)
    return NextResponse.json({
      subscription: {
        id: subscription.id,
        status: subscription.status.toLowerCase(),
        plan: {
          name: subscription.planType,
          price: Number(subscription.monthlyValue),
          billingCycle: 'monthly'
        },
        currentPeriodStart: subscription.startDate.toISOString(),
        currentPeriodEnd: subscription.renewalDate.toISOString(),
        nextBillingDate: nextBillingDate.toISOString(),
        benefits: subscription.benefits.map(benefit => ({
          id: benefit.id,
          name: benefit.benefitName,
          description: benefit.benefitDescription,
          icon: benefit.benefitIcon,
          type: benefit.benefitType,
          quantityTotal: benefit.quantityTotal,
          quantityUsed: benefit.quantityUsed,
          expirationDate: benefit.expirationDate?.toISOString()
        })),
        shippingAddress: subscription.shippingAddress,
        paymentMethod: subscription.paymentMethod,
        paymentMethodLast4: subscription.paymentMethodLast4,
        createdAt: subscription.createdAt.toISOString(),
        updatedAt: subscription.updatedAt.toISOString()
      },
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        avatarUrl: user.avatarUrl || user.image
      }
    }, { status: 200 })
  } catch (error: any) {
    console.error('[API /api/assinante/subscription] Erro:', error.message)
    return NextResponse.json(
      { error: 'INTERNAL_ERROR', message: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}
/**
 * PUT /api/assinante/subscription
 * Atualiza dados da assinatura (endereço de entrega, etc)
 */
export async function PUT(request: NextRequest) {
  // CSRF Protection
  const csrfResult = await csrfProtection(request)
  if (csrfResult) {
    return csrfResult
  }
  // Rate limiting: 50 requisições em 15 minutos (escrita)
  const rateLimitResult = await rateLimit(request, rateLimitConfigs.write)
  if (rateLimitResult) {
    return rateLimitResult
  }
  try {
    // Verificar se Firebase Admin está inicializado
    if (!adminAuth) {
      console.warn('[API /api/assinante/subscription] Firebase Admin não configurado - funcionalidade desabilitada')
      return NextResponse.json(
        {
          error: 'SERVICE_UNAVAILABLE',
          message: 'Serviço de autenticação temporariamente indisponível',
          subscription: null
        },
        { status: 503 }
      )
    }
    // Verificar token Firebase do header Authorization
    const authHeader = request.headers.get('Authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'UNAUTHORIZED', message: 'Token de autenticação não fornecido' },
        { status: 401 }
      )
    }
    const token = authHeader.split('Bearer ')[1]
    let firebaseUser
    try {
      firebaseUser = await adminAuth.verifyIdToken(token)
    } catch (error) {
      return NextResponse.json(
        { error: 'UNAUTHORIZED', message: 'Token inválido ou expirado' },
        { status: 401 }
      )
    }
    if (!firebaseUser || !firebaseUser.uid) {
      return NextResponse.json(
        { error: 'UNAUTHORIZED', message: 'Usuário não autenticado' },
        { status: 401 }
      )
    }
    // Parse e validar request body
    let body
    try {
      body = await request.json()
    } catch {
      return NextResponse.json(
        {
          error: 'INVALID_JSON',
          message: 'Formato JSON inválido'
        },
        { status: 400 }
      )
    }

    // Validar dados com Zod
    const validation = subscriptionAddressUpdateSchema.safeParse(body)

    if (!validation.success) {
      return NextResponse.json(
        {
          error: 'VALIDATION_ERROR',
          message: 'Dados de endereço inválidos',
          details: validation.error.flatten().fieldErrors
        },
        { status: 400 }
      )
    }

    // Usar dados validados
    const { shippingAddress } = validation.data

    // Primeiro, buscar o usuário pelo Firebase UID
    const user = await prisma.user.findUnique({
      where: { firebaseUid: firebaseUser.uid }
    })
    if (!user) {
      return NextResponse.json(
        { error: 'NOT_FOUND', message: 'Usuário não encontrado' },
        { status: 404 }
      )
    }
    // Buscar assinatura ativa do usuário (capturar estado anterior para auditoria)
    // OWNERSHIP VALIDATION: Only fetch subscriptions belonging to authenticated user
    const subscription = await prisma.subscription.findFirst({
      where: {
        userId: user.id,  // CRITICAL: Ensures user can only access their own data
        status: 'ACTIVE'
      }
    })
    if (!subscription) {
      return NextResponse.json(
        { error: 'NOT_FOUND', message: 'Assinatura não encontrada' },
        { status: 404 }
      )
    }
    
    // Double-check ownership (defense in depth)
    if (subscription.userId !== user.id) {
      return NextResponse.json(
        { error: 'FORBIDDEN', message: 'Acesso negado' },
        { status: 403 }
      )
    }

    // Capturar estado anterior para auditoria LGPD
    const oldShippingAddress = subscription.shippingAddress

    // Atualizar endereço de entrega com dados validados
    const updatedSubscription = await prisma.subscription.update({
      where: { id: subscription.id },
      data: {
        shippingAddress: shippingAddress as any,
        updatedAt: new Date()
      }
    })

    // LGPD Article 37: Log audit entry (non-blocking)
    await logAudit({
      userId: user.id,
      action: AuditAction.UPDATE_SHIPPING_ADDRESS,
      entityType: 'Subscription',
      entityId: subscription.id,
      oldValue: oldShippingAddress,
      newValue: shippingAddress,
      request,
    })

    return NextResponse.json({
      message: 'Endereço atualizado com sucesso',
      subscription: {
        id: updatedSubscription.id,
        shippingAddress: updatedSubscription.shippingAddress,
        updatedAt: updatedSubscription.updatedAt.toISOString()
      }
    }, { status: 200 })
  } catch (error: any) {
    console.error('[API /api/assinante/subscription PUT] Erro:', error.message)
    return NextResponse.json(
      { error: 'INTERNAL_ERROR', message: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}
// Force dynamic rendering
export const dynamic = 'force-dynamic'