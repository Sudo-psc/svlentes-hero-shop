import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(req: NextRequest) {
  try {
    const userId = req.headers.get('x-user-id')

    if (!userId) {
      return NextResponse.json(
        { error: 'Não autenticado' },
        { status: 401 }
      )
    }

    // Find user by database ID or Firebase UID
    let user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        subscriptions: {
          where: { status: 'ACTIVE' },
          orderBy: { createdAt: 'desc' },
          take: 1,
          select: { id: true }
        }
      }
    })

    if (!user) {
      user = await prisma.user.findUnique({
        where: { firebaseUid: userId },
        select: {
          id: true,
          subscriptions: {
            where: { status: 'ACTIVE' },
            orderBy: { createdAt: 'desc' },
            take: 1,
            select: { id: true }
          }
        }
      })
    }

    if (!user) {
      return NextResponse.json(
        { error: 'Usuário não encontrado' },
        { status: 404 }
      )
    }

    if (user.subscriptions.length === 0) {
      return NextResponse.json(
        { error: 'Nenhuma assinatura ativa encontrada' },
        { status: 404 }
      )
    }

    const subscriptionId = user.subscriptions[0].id

    // Fetch subscription history with pagination support
    const page = parseInt(req.nextUrl.searchParams.get('page') || '1')
    const limit = parseInt(req.nextUrl.searchParams.get('limit') || '20')
    const skip = (page - 1) * limit

    // Get total count
    const totalCount = await prisma.subscriptionHistory.count({
      where: { subscriptionId }
    })

    // Fetch history entries
    const history = await prisma.subscriptionHistory.findMany({
      where: { subscriptionId },
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
      select: {
        id: true,
        changeType: true,
        description: true,
        oldValue: true,
        newValue: true,
        metadata: true,
        createdAt: true
      }
    })

    return NextResponse.json({
      history,
      pagination: {
        page,
        limit,
        total: totalCount,
        totalPages: Math.ceil(totalCount / limit),
        hasMore: page * limit < totalCount
      }
    })
  } catch (error) {
    console.error('Error fetching subscription history:', error)
    return NextResponse.json(
      { error: 'Erro ao buscar histórico. Tente novamente mais tarde.' },
      { status: 500 }
    )
  }
}
