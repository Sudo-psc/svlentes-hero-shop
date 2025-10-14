import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { validateVerificationToken } from '@/lib/tokens'

/**
 * GET /api/auth/verify-email?token=xxx
 * Verifica o email do usuário usando o token
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const token = searchParams.get('token')

    if (!token) {
      return NextResponse.json(
        { error: 'MISSING_TOKEN', message: 'Token não fornecido' },
        { status: 400 }
      )
    }

    // Validar token
    const email = await validateVerificationToken(token)

    if (!email) {
      return NextResponse.json(
        { error: 'INVALID_TOKEN', message: 'Token inválido ou expirado' },
        { status: 400 }
      )
    }

    // Verificar se usuário existe
    const user = await prisma.user.findUnique({
      where: { email },
    })

    if (!user) {
      return NextResponse.json(
        { error: 'USER_NOT_FOUND', message: 'Usuário não encontrado' },
        { status: 404 }
      )
    }

    // Marcar email como verificado
    await prisma.user.update({
      where: { email },
      data: { emailVerified: new Date() },
    })

    console.log(`[VERIFY-EMAIL] Email verified: ${email}`)

    return NextResponse.json(
      {
        message: 'Email verificado com sucesso',
        email,
      },
      { status: 200 }
    )
  } catch (error: any) {
    console.error('[API /api/auth/verify-email] Erro:', error.message)
    return NextResponse.json(
      { error: 'INTERNAL_ERROR', message: 'Erro ao verificar email' },
      { status: 500 }
    )
  }
}

export const dynamic = 'force-dynamic'
