import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { createPasswordResetToken } from '@/lib/tokens'
import { sendPasswordResetEmail } from '@/lib/email'
import { z } from 'zod'
const forgotPasswordSchema = z.object({
  email: z.string().email('Email inválido').toLowerCase().trim(),
})
/**
 * POST /api/auth/forgot-password
 * Solicita recuperação de senha
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    // Validar email
    const validationResult = forgotPasswordSchema.safeParse(body)
    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'VALIDATION_ERROR', message: 'Email inválido' },
        { status: 400 }
      )
    }
    const { email } = validationResult.data
    // Verificar se usuário existe
    const user = await prisma.user.findUnique({
      where: { email },
    })
    // Não revela se email existe ou não (segurança)
    if (!user) {
      return NextResponse.json(
        {
          message:
            'Se o email estiver cadastrado, você receberá instruções para redefinir sua senha',
        },
        { status: 200 }
      )
    }
    // Verificar se usuário tem senha (pode ser OAuth only)
    if (!user.password) {
      // Usuário OAuth - não tem senha para resetar
      return NextResponse.json(
        {
          message:
            'Se o email estiver cadastrado, você receberá instruções para redefinir sua senha',
        },
        { status: 200 }
      )
    }
    // Criar token de reset e enviar email
    const resetToken = await createPasswordResetToken(email)
    await sendPasswordResetEmail(email, resetToken)
    return NextResponse.json(
      {
        message:
          'Se o email estiver cadastrado, você receberá instruções para redefinir sua senha',
      },
      { status: 200 }
    )
  } catch (error: any) {
    console.error('[API /api/auth/forgot-password] Erro:', error.message)
    return NextResponse.json(
      { error: 'INTERNAL_ERROR', message: 'Erro ao processar solicitação' },
      { status: 500 }
    )
  }
}
export const dynamic = 'force-dynamic'