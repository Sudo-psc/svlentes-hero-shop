import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { createVerificationToken } from '@/lib/tokens'
import { sendVerificationEmail } from '@/lib/email'
import { z } from 'zod'
const resendSchema = z.object({
  email: z.string().email('Email inválido').toLowerCase().trim(),
})
/**
 * POST /api/auth/resend-verification
 * Reenvia email de verificação
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    // Validar email
    const validationResult = resendSchema.safeParse(body)
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
    if (!user) {
      // Não revela se email existe ou não (segurança)
      return NextResponse.json(
        {
          message: 'Se o email existir, um link de verificação será enviado',
        },
        { status: 200 }
      )
    }
    // Verificar se email já foi verificado
    if (user.emailVerified) {
      return NextResponse.json(
        { error: 'ALREADY_VERIFIED', message: 'Este email já foi verificado' },
        { status: 400 }
      )
    }
    // Criar token e enviar email
    const verificationToken = await createVerificationToken(email)
    await sendVerificationEmail(email, verificationToken)
    return NextResponse.json(
      {
        message: 'Email de verificação enviado com sucesso',
      },
      { status: 200 }
    )
  } catch (error: any) {
    console.error('[API /api/auth/resend-verification] Erro:', error.message)
    return NextResponse.json(
      { error: 'INTERNAL_ERROR', message: 'Erro ao enviar email de verificação' },
      { status: 500 }
    )
  }
}
export const dynamic = 'force-dynamic'