import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'
import { z } from 'zod'
import { createVerificationToken } from '@/lib/tokens'
import { sendVerificationEmail } from '@/lib/email'

/**
 * Schema de validação para registro de usuário
 */
const registerSchema = z.object({
  name: z.string()
    .min(3, 'Nome deve ter pelo menos 3 caracteres')
    .max(255, 'Nome deve ter no máximo 255 caracteres'),
  email: z.string()
    .email('Email inválido')
    .toLowerCase()
    .trim(),
  password: z.string()
    .min(6, 'Senha deve ter pelo menos 6 caracteres')
    .max(100, 'Senha deve ter no máximo 100 caracteres'),
})

/**
 * POST /api/assinante/register
 * Cria uma nova conta de usuário
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    // Validar dados com Zod
    const validationResult = registerSchema.safeParse(body)

    if (!validationResult.success) {
      const errors = validationResult.error.errors.map(err => err.message).join(', ')
      return NextResponse.json(
        { error: 'VALIDATION_ERROR', message: errors },
        { status: 400 }
      )
    }

    const { name, email, password } = validationResult.data

    // Verificar se o email já está em uso
    const existingUser = await prisma.user.findUnique({
      where: { email }
    })

    if (existingUser) {
      return NextResponse.json(
        { error: 'EMAIL_EXISTS', message: 'Este email já está cadastrado' },
        { status: 409 }
      )
    }

    // Hash da senha com bcrypt
    const hashedPassword = await bcrypt.hash(password, 10)

    // Criar usuário no banco de dados
    const user = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        role: 'subscriber',
        emailVerified: null, // Será verificado após confirmação por email (futuro)
        googleId: null,
        image: null,
        avatarUrl: null,
      },
      select: {
        id: true,
        name: true,
        email: true,
        createdAt: true,
      }
    })

    console.log(`[REGISTER] New user created: ${user.email} (ID: ${user.id})`)

    // Enviar email de verificação (não-bloqueante)
    try {
      const verificationToken = await createVerificationToken(email)
      await sendVerificationEmail(email, verificationToken)
      console.log(`[REGISTER] Verification email sent to ${email}`)
    } catch (emailError: any) {
      // Log erro mas não bloqueia o registro
      console.error('[REGISTER] Failed to send verification email:', emailError.message)
    }

    return NextResponse.json(
      {
        message: 'Conta criada com sucesso',
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
        },
        emailSent: true,
      },
      { status: 201 }
    )
  } catch (error: any) {
    console.error('[API /api/assinante/register] Erro:', error.message)

    // Erro de constraint unique (email duplicado)
    if (error.code === 'P2002') {
      return NextResponse.json(
        { error: 'EMAIL_EXISTS', message: 'Este email já está cadastrado' },
        { status: 409 }
      )
    }

    return NextResponse.json(
      { error: 'INTERNAL_ERROR', message: 'Erro ao criar conta. Tente novamente.' },
      { status: 500 }
    )
  }
}

// Force dynamic rendering
export const dynamic = 'force-dynamic'
