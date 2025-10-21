import { NextRequest, NextResponse } from 'next/server'
import { adminAuth } from '@/lib/firebase-admin'
import { prisma } from '@/lib/prisma'
import { rateLimit, rateLimitConfigs } from '@/lib/rate-limit'

/**
 * GET /api/assinante/medical-records
 * Retorna histórico médico do usuário autenticado
 */
export async function GET(request: NextRequest) {
  const rateLimitResult = await rateLimit(request, rateLimitConfigs.read)
  if (rateLimitResult) {
    return rateLimitResult
  }

  try {
    if (!adminAuth) {
      return NextResponse.json(
        { error: 'CONFIG_ERROR', message: 'Firebase Admin não configurado' },
        { status: 500 }
      )
    }

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

    const user = await prisma.user.findUnique({
      where: { firebaseUid: firebaseUser.uid }
    })

    if (!user) {
      return NextResponse.json(
        { error: 'NOT_FOUND', message: 'Usuário não encontrado' },
        { status: 404 }
      )
    }

    const { searchParams } = request.nextUrl
    const recordType = searchParams.get('type')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const skip = (page - 1) * limit

    const where: any = { 
      userId: user.id,
      isActive: true
    }
    
    if (recordType) {
      where.recordType = recordType
    }

    const [records, total] = await Promise.all([
      prisma.medicalRecord.findMany({
        where,
        include: {
          appointment: {
            select: {
              appointmentNumber: true,
              scheduledDate: true,
              type: true
            }
          }
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit
      }),
      prisma.medicalRecord.count({ where })
    ])

    return NextResponse.json({
      records: records.map(record => ({
        id: record.id,
        recordType: record.recordType,
        title: record.title,
        description: record.description,
        data: record.data,
        documentUrl: record.documentUrl,
        documentType: record.documentType,
        issuedBy: record.issuedBy,
        issuedByCRM: record.issuedByCRM,
        issuedAt: record.issuedAt?.toISOString(),
        expiresAt: record.expiresAt?.toISOString(),
        isActive: record.isActive,
        isConfidential: record.isConfidential,
        appointment: record.appointment ? {
          appointmentNumber: record.appointment.appointmentNumber,
          scheduledDate: record.appointment.scheduledDate.toISOString(),
          type: record.appointment.type
        } : null,
        createdAt: record.createdAt.toISOString(),
        updatedAt: record.updatedAt.toISOString()
      })),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    }, { status: 200 })
  } catch (error: any) {
    console.error('[API /api/assinante/medical-records] Erro:', error.message)
    return NextResponse.json(
      { error: 'INTERNAL_ERROR', message: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}

export const dynamic = 'force-dynamic'
