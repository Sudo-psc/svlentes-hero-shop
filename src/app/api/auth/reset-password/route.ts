import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { validatePasswordResetToken, consumePasswordResetToken } from '@/lib/tokens'
import bcrypt from 'bcryptjs'
import { z } from 'zod'

const resetPasswordSchema = z.object({
  token: z.string().min(1, 'Token é obrigatório'),
  password: z
    .string()
    .min(6, 'Senha deve ter pelo menos 6 caracteres')
    .max(100, 'Senha deve ter no máximo 100 caracteres'),
})

/**
 * POST /api/auth/reset-password
 * Reseta a senha do usuário
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    // Validar dados
    const validationResult = resetPasswordSchema.safeParse(body)

    if (!validationResult.success) {
      const errors = validationResult.error.errors.map((err) => err.message).join(', ')
      return NextResponse.json(
        { error: 'VALIDATION_ERROR', message: errors },
        { status: 400 }
      )
    }

    const { token, password } = validationResult.data

    // Validar token
    const email = await validatePasswordResetToken(token)

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

    // Hash nova senha
    const hashedPassword = await bcrypt.hash(password, 10)

    // Atualizar senha
    await prisma.user.update({
      where: { email },
      data: { password: hashedPassword },
    })

    // Consumir token (deletar)
    await consumePasswordResetToken(token)

    console.log(`[RESET-PASSWORD] Password reset successful for ${email}`)

    return NextResponse.json(
      {
        message: 'Senha redefinida com sucesso',
      },
      { status: 200 }
    )
  } catch (error: any) {
    console.error('[API /api/auth/reset-password] Erro:', error.message)
    return NextResponse.json(
      { error: 'INTERNAL_ERROR', message: 'Erro ao redefinir senha' },
      { status: 500 }
    )
  }
}

export const dynamic = 'force-dynamic'
