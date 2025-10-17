import { NextRequest, NextResponse } from 'next/server'
import { adminAuth } from '@/lib/firebase-admin'
import { prisma } from '@/lib/prisma'
import { rateLimit, rateLimitConfigs } from '@/lib/rate-limit'
import { csrfProtection } from '@/lib/csrf'

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
    const user = await prisma.user.findUnique({
      where: { firebaseUid: firebaseUser.uid },
      include: {
        subscriptions: {
          where: { status: 'ACTIVE' },
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

    const body = await request.json()
    const { shippingAddress } = body

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

    // Buscar assinatura ativa do usuário
    const subscription = await prisma.subscription.findFirst({
      where: {
        userId: user.id,
        status: 'ACTIVE'
      }
    })

    if (!subscription) {
      return NextResponse.json(
        { error: 'NOT_FOUND', message: 'Assinatura não encontrada' },
        { status: 404 }
      )
    }

    // Atualizar endereço de entrega
    const updatedSubscription = await prisma.subscription.update({
      where: { id: subscription.id },
      data: {
        shippingAddress: shippingAddress as any,
        updatedAt: new Date()
      }
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
