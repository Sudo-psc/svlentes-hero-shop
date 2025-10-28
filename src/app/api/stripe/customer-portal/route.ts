import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { adminAuth } from '@/lib/firebase-admin'
import { prisma } from '@/lib/prisma'
import { logger, LogCategory } from '@/lib/logger'

let stripe: Stripe | null = null
if (process.env.STRIPE_SECRET_KEY) {
  stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
    apiVersion: '2025-09-30.clover',
  })
}

function getStripeCustomerId(metadata: unknown): string | null {
  if (!metadata || typeof metadata !== 'object') {
    return null
  }

  const meta = metadata as Record<string, unknown>
  const candidates = [
    meta.stripeCustomerId,
    meta.stripe_customer_id,
    (meta.stripe as Record<string, unknown> | undefined)?.customerId,
    (meta.payment as Record<string, unknown> | undefined)?.stripeCustomerId,
  ]

  for (const candidate of candidates) {
    if (typeof candidate === 'string' && candidate.trim().length > 0) {
      return candidate
    }
  }

  return null
}

export async function POST(request: NextRequest) {
  try {
    if (!stripe) {
      return NextResponse.json(
        { error: 'Stripe não está configurado no momento. Entre em contato com o suporte.' },
        { status: 503 }
      )
    }

    if (!adminAuth) {
      return NextResponse.json(
        { error: 'Serviço de autenticação indisponível. Tente novamente em instantes.' },
        { status: 503 }
      )
    }

    const authHeader = request.headers.get('Authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Autenticação necessária para acessar o portal do Stripe.' },
        { status: 401 }
      )
    }

    const token = authHeader.split('Bearer ')[1]
    let firebaseUser
    try {
      firebaseUser = await adminAuth.verifyIdToken(token)
    } catch {
      return NextResponse.json(
        { error: 'Sessão expirada. Faça login novamente.' },
        { status: 401 }
      )
    }

    if (!firebaseUser?.uid) {
      return NextResponse.json(
        { error: 'Usuário não autenticado.' },
        { status: 401 }
      )
    }

    const user = await prisma.user.findUnique({
      where: { firebaseUid: firebaseUser.uid },
      select: { id: true }
    })

    if (!user) {
      return NextResponse.json(
        { error: 'Conta de usuário não localizada.' },
        { status: 404 }
      )
    }

    const subscription = await prisma.subscription.findFirst({
      where: {
        userId: user.id,
        status: { in: ['ACTIVE', 'PENDING_ACTIVATION', 'OVERDUE', 'PAUSED'] },
      },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        metadata: true,
      }
    })

    if (!subscription) {
      return NextResponse.json(
        { error: 'Nenhuma assinatura ativa encontrada.' },
        { status: 404 }
      )
    }

    let providedCustomerId: string | null = null
    if (request.headers.get('content-type')?.includes('application/json')) {
      try {
        const body = await request.json()
        if (body && typeof body.customerId === 'string') {
          providedCustomerId = body.customerId
        }
      } catch {
        providedCustomerId = null
      }
    }

    const stripeCustomerId = providedCustomerId || getStripeCustomerId(subscription.metadata)

    if (!stripeCustomerId) {
      logger.logPayment('stripe_portal_missing_customer', {
        subscriptionId: subscription.id,
        userId: user.id,
      })
      return NextResponse.json(
        { error: 'Portal do Stripe não disponível para esta assinatura. Fale com nosso suporte.' },
        { status: 404 }
      )
    }

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://svlentes.com.br'
    const session = await stripe.billingPortal.sessions.create({
      customer: stripeCustomerId,
      return_url: `${baseUrl}/area-assinante/pagamentos?retorno=ok`,
    })

    logger.logPayment('stripe_portal_session_created', {
      subscriptionId: subscription.id,
      userId: user.id,
    })

    return NextResponse.json({ portalUrl: session.url })
  } catch (error) {
    logger.error(LogCategory.PAYMENT, 'Failed to create Stripe portal session', error as Error)
    return NextResponse.json(
      { error: 'Não foi possível abrir o portal de pagamentos. Tente novamente em instantes.' },
      { status: 500 }
    )
  }
}
