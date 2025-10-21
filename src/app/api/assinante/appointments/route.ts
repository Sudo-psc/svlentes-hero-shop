import { NextRequest, NextResponse } from 'next/server'
import { adminAuth } from '@/lib/firebase-admin'
import { prisma } from '@/lib/prisma'
import { rateLimit, rateLimitConfigs } from '@/lib/rate-limit'
import { csrfProtection } from '@/lib/csrf'
import { z } from 'zod'

const appointmentCreateSchema = z.object({
  type: z.enum(['INITIAL_CONSULTATION', 'FOLLOW_UP', 'EMERGENCY', 'ROUTINE_CHECK', 'PRESCRIPTION_RENEWAL']),
  scheduledDate: z.string().datetime(),
  duration: z.number().min(15).max(180).optional(),
  isVirtual: z.boolean().optional(),
  patientNotes: z.string().max(1000).optional()
})

/**
 * GET /api/assinante/appointments
 * Retorna agendamentos do usuário autenticado
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
    const status = searchParams.get('status')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const skip = (page - 1) * limit

    const where: any = { userId: user.id }
    if (status) {
      where.status = status
    }

    const [appointments, total] = await Promise.all([
      prisma.appointment.findMany({
        where,
        orderBy: { scheduledDate: 'desc' },
        skip,
        take: limit
      }),
      prisma.appointment.count({ where })
    ])

    return NextResponse.json({
      appointments: appointments.map(apt => ({
        id: apt.id,
        appointmentNumber: apt.appointmentNumber,
        type: apt.type,
        status: apt.status,
        scheduledDate: apt.scheduledDate.toISOString(),
        duration: apt.duration,
        doctorName: apt.doctorName,
        doctorCRM: apt.doctorCRM,
        location: apt.location,
        isVirtual: apt.isVirtual,
        meetingLink: apt.meetingLink,
        patientNotes: apt.patientNotes,
        createdAt: apt.createdAt.toISOString(),
        updatedAt: apt.updatedAt.toISOString()
      })),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    }, { status: 200 })
  } catch (error: any) {
    console.error('[API /api/assinante/appointments] Erro:', error.message)
    return NextResponse.json(
      { error: 'INTERNAL_ERROR', message: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/assinante/appointments
 * Cria novo agendamento
 */
export async function POST(request: NextRequest) {
  const csrfResult = await csrfProtection(request)
  if (csrfResult) {
    return csrfResult
  }

  const rateLimitResult = await rateLimit(request, rateLimitConfigs.write)
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

    const body = await request.json()
    const validatedData = appointmentCreateSchema.parse(body)

    const appointmentNumber = `APT-${Date.now()}-${Math.random().toString(36).substr(2, 6).toUpperCase()}`

    const appointment = await prisma.appointment.create({
      data: {
        userId: user.id,
        appointmentNumber,
        type: validatedData.type,
        scheduledDate: new Date(validatedData.scheduledDate),
        duration: validatedData.duration || 30,
        isVirtual: validatedData.isVirtual || false,
        patientNotes: validatedData.patientNotes,
        doctorName: 'Dr. Philipe Saraiva Cruz',
        doctorCRM: 'CRM-MG 69.870',
        status: 'SCHEDULED'
      }
    })

    return NextResponse.json({
      success: true,
      appointment: {
        id: appointment.id,
        appointmentNumber: appointment.appointmentNumber,
        type: appointment.type,
        status: appointment.status,
        scheduledDate: appointment.scheduledDate.toISOString(),
        duration: appointment.duration,
        doctorName: appointment.doctorName,
        doctorCRM: appointment.doctorCRM,
        isVirtual: appointment.isVirtual,
        createdAt: appointment.createdAt.toISOString()
      },
      message: 'Agendamento criado com sucesso'
    }, { status: 201 })
  } catch (error: any) {
    console.error('[API /api/assinante/appointments POST] Erro:', error.message)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'VALIDATION_ERROR', message: 'Dados inválidos', details: error.errors },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: 'INTERNAL_ERROR', message: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}

export const dynamic = 'force-dynamic'
