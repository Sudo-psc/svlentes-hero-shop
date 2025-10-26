import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'
import { z } from 'zod'
import { createVerificationToken } from '@/lib/tokens'
import { sendVerificationEmail } from '@/lib/email'
import { rateLimit, rateLimitConfigs } from '@/lib/rate-limit'
import { csrfProtection } from '@/lib/csrf'
/**
 * Schema de validação para registro de usuário
 * Suporta dois fluxos:
 * 1. Registro direto com senha (legacy)
 * 2. Sync de usuário Firebase (novo fluxo)
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
    .max(100, 'Senha deve ter no máximo 100 caracteres')
    .optional(), // Opcional para sync do Firebase
  firebaseUid: z.string()
    .min(1, 'Firebase UID é obrigatório')
    .optional(), // Opcional para registro legacy
  avatarUrl: z.string().url().optional(),
})
/**
 * POST /api/assinante/register
 * Cria uma nova conta de usuário
 */
export async function POST(request: NextRequest) {
  // CSRF Protection
  const csrfResult = await csrfProtection(request)
  if (csrfResult) {
    return csrfResult
  }
  // Rate limiting: 5 tentativas em 15 minutos
  const rateLimitResult = await rateLimit(request, rateLimitConfigs.auth)
  if (rateLimitResult) {
    return rateLimitResult
  }
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
    const { name, email, password, firebaseUid, avatarUrl } = validationResult.data
    // Verificar se o email já está em uso
    const existingUser = await prisma.user.findUnique({
      where: { email }
    })

    // Se usuário já existe e está fazendo sync do Firebase, apenas atualizar
    if (existingUser && firebaseUid) {
      const updatedUser = await prisma.user.update({
        where: { email },
        data: {
          firebaseUid,
          avatarUrl: avatarUrl || existingUser.avatarUrl,
          emailVerified: new Date(), // Firebase users are auto-verified
        },
        select: {
          id: true,
          name: true,
          email: true,
          firebaseUid: true,
          createdAt: true,
        }
      })

      return NextResponse.json(
        {
          message: 'Usuário sincronizado com Firebase',
          user: {
            id: updatedUser.id,
            name: updatedUser.name,
            email: updatedUser.email,
            firebaseUid: updatedUser.firebaseUid,
          },
          synced: true,
        },
        { status: 200 }
      )
    }

    if (existingUser) {
      return NextResponse.json(
        { error: 'EMAIL_EXISTS', message: 'Este email já está cadastrado' },
        { status: 409 }
      )
    }
    // Hash da senha com bcrypt (se fornecida - legacy flow)
    const hashedPassword = password ? await bcrypt.hash(password, 10) : null
    // Criar usuário no banco de dados
    const user = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        firebaseUid: firebaseUid || null,
        role: 'subscriber',
        emailVerified: firebaseUid ? new Date() : null, // Firebase users are auto-verified
        googleId: null,
        image: null,
        avatarUrl: avatarUrl || null,
      },
      select: {
        id: true,
        name: true,
        email: true,
        firebaseUid: true,
        createdAt: true,
      }
    })
    // Enviar email de verificação (não-bloqueante)
    try {
      const verificationToken = await createVerificationToken(email)
      await sendVerificationEmail(email, verificationToken)
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
          firebaseUid: user.firebaseUid,
        },
        emailSent: !firebaseUid, // Only send email for non-Firebase registrations
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