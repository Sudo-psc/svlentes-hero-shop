import { NextRequest, NextResponse } from 'next/server'
import { adminAuth } from '@/lib/firebase-admin'
import { prisma } from '@/lib/prisma'
import { rateLimit, rateLimitConfigs } from '@/lib/rate-limit'
/**
 * GET /api/assinante/orders
 * Retorna histórico de pedidos do usuário autenticado
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
      return NextResponse.json(
        { error: 'CONFIG_ERROR', message: 'Firebase Admin não configurado' },
        { status: 500 }
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
    // Buscar usuário
    const user = await prisma.user.findUnique({
      where: { firebaseUid: firebaseUser.uid }
    })
    if (!user) {
      return NextResponse.json(
        { error: 'NOT_FOUND', message: 'Usuário não encontrado' },
        { status: 404 }
      )
    }
    // Buscar todas as assinaturas do usuário
    const subscriptions = await prisma.subscription.findMany({
      where: { userId: user.id },
      select: { id: true }
    })
    if (subscriptions.length === 0) {
      return NextResponse.json({
        orders: [],
        total: 0
      }, { status: 200 })
    }
    const subscriptionIds = subscriptions.map(sub => sub.id)
    // Buscar pedidos com paginação
    const { searchParams } = request.nextUrl
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const skip = (page - 1) * limit
    // Buscar total de pedidos
    const totalOrders = await prisma.order.count({
      where: {
        subscriptionId: { in: subscriptionIds }
      }
    })
    // Buscar pedidos
    const orders = await prisma.order.findMany({
      where: {
        subscriptionId: { in: subscriptionIds }
      },
      include: {
        subscription: {
          select: {
            planType: true,
            monthlyValue: true
          }
        }
      },
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit
    })
    return NextResponse.json({
      orders: orders.map(order => ({
        id: order.id,
        subscriptionId: order.subscriptionId,
        status: order.status.toLowerCase(),
        planName: order.subscription.planType,
        amount: Number(order.totalAmount),
        trackingCode: order.trackingCode,
        shippingDate: order.shippingDate?.toISOString(),
        deliveryDate: order.deliveryDate?.toISOString(),
        createdAt: order.createdAt.toISOString(),
        updatedAt: order.updatedAt.toISOString()
      })),
      pagination: {
        page,
        limit,
        total: totalOrders,
        totalPages: Math.ceil(totalOrders / limit)
      }
    }, { status: 200 })
  } catch (error: any) {
    console.error('[API /api/assinante/orders] Erro:', error.message)
    return NextResponse.json(
      { error: 'INTERNAL_ERROR', message: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}
// Force dynamic rendering
export const dynamic = 'force-dynamic'