/**
 * POST /api/admin/auth/login
 * Login de usuários administrativos
 *
 * Autentica usuários com role admin e retorna tokens JWT
 */
import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { rateLimit, rateLimitConfigs } from '@/lib/rate-limit'
import {
  generateAdminToken,
  generateRefreshToken,
  createErrorResponse,
  createSuccessResponse,
  requireRole,
  AdminUser
} from '@/lib/admin-auth'
import { loginSchema } from '@/lib/admin-validations'
/**
 * @swagger
 * /api/admin/auth/login:
 *   post:
 *     summary: Login de usuário administrativo
 *     tags:
 *       - Autenticação Admin
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 description: Email do usuário administrativo
 *                 example: admin@svlentes.com.br
 *               password:
 *                 type: string
 *                 minLength: 1
 *                 description: Senha do usuário
 *                 example: senha123
 *             required:
 *               - email
 *               - password
 *     responses:
 *       200:
 *         description: Login realizado com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     user:
 *                       type: object
 *                       properties:
 *                         id:
 *                           type: string
 *                           example: user_123
 *                         email:
 *                           type: string
 *                           example: admin@svlentes.com.br
 *                         name:
 *                           type: string
 *                           example: Administrador
 *                         role:
 *                           type: string
 *                           example: admin
 *                         permissions:
 *                           type: array
 *                           items:
 *                             type: string
 *                           example: ["dashboard:view", "customers:view"]
 *                     accessToken:
 *                       type: string
 *                       description: Token JWT para autenticação
 *                     refreshToken:
 *                       type: string
 *                       description: Token para renovação de sessão
 *                     expiresIn:
 *                       type: number
 *                       description: Tempo de expiração em segundos
 *       400:
 *         description: Erro de validação
 *       401:
 *         description: Credenciais inválidas
 *       429:
 *         description: Muitas tentativas (rate limit)
 *       500:
 *         description: Erro interno do servidor
 */
export async function POST(request: NextRequest) {
  try {
    // Rate limiting para login
    const rateLimitResult = await rateLimit(request, rateLimitConfigs.auth)
    if (rateLimitResult) {
      return rateLimitResult
    }
    // Validar body da requisição
    const body = await request.json()
    const { data: loginData, error: validationError } = validateBody(loginSchema, body)
    if (validationError) {
      return createErrorResponse(
        'VALIDATION_ERROR',
        `Campo inválido: ${validationError.field} - ${validationError.message}`,
        400
      )
    }
    // Buscar usuário no banco
    const user = await prisma.user.findUnique({
      where: { email: loginData.email.toLowerCase() },
      select: {
        id: true,
        email: true,
        name: true,
        password: true,
        role: true,
        createdAt: true,
        lastLoginAt: true
      }
    })
    // Verificar se usuário existe
    if (!user) {
      return createErrorResponse(
        'INVALID_CREDENTIALS',
        'Email ou senha inválidos',
        401
      )
    }
    // Verificar se usuário tem role admin
    const validAdminRoles = ['super_admin', 'admin', 'manager', 'support', 'viewer']
    if (!validAdminRoles.includes(user.role)) {
      return createErrorResponse(
        'FORBIDDEN',
        'Usuário não tem permissão de acesso administrativo',
        403
      )
    }
    // Verificar senha (se usuário tiver senha)
    if (user.password) {
      const isValidPassword = await bcrypt.compare(loginData.password, user.password)
      if (!isValidPassword) {
        return createErrorResponse(
          'INVALID_CREDENTIALS',
          'Email ou senha inválidos',
          401
        )
      }
    } else {
      // Usuários sem senha (Google OAuth) precisam de fluxo diferente
      return createErrorResponse(
        'INVALID_CREDENTIALS',
        'Email ou senha inválidos',
        401
      )
    }
    // Obter permissões do usuário baseado no role
    const getPermissionsForRole = (role: string): string[] => {
      const rolePermissions: Record<string, string[]> = {
        super_admin: [
          'dashboard:view', 'dashboard:metrics',
          'customers:view', 'customers:create', 'customers:update', 'customers:delete', 'customers:search',
          'subscriptions:view', 'subscriptions:create', 'subscriptions:update', 'subscriptions:delete',
          'subscriptions:analytics', 'subscriptions:status_update',
          'orders:view', 'orders:create', 'orders:update', 'orders:delete', 'orders:status_update',
          'support:view', 'support:create', 'support:update', 'support:delete', 'support:assign', 'support:escalate',
          'admin:users', 'admin:roles', 'admin:settings', 'admin:logs', 'admin:system'
        ],
        admin: [
          'dashboard:view', 'dashboard:metrics',
          'customers:view', 'customers:create', 'customers:update', 'customers:search',
          'subscriptions:view', 'subscriptions:update', 'subscriptions:analytics', 'subscriptions:status_update',
          'orders:view', 'orders:create', 'orders:update', 'orders:status_update',
          'support:view', 'support:create', 'support:update', 'support:assign',
          'admin:logs'
        ],
        manager: [
          'dashboard:view', 'dashboard:metrics',
          'customers:view', 'customers:update', 'customers:search',
          'subscriptions:view', 'subscriptions:analytics', 'subscriptions:status_update',
          'orders:view', 'orders:update', 'orders:status_update',
          'support:view', 'support:update', 'support:assign'
        ],
        support: [
          'dashboard:view',
          'customers:view', 'customers:search',
          'subscriptions:view',
          'orders:view',
          'support:view', 'support:create', 'support:update'
        ],
        viewer: [
          'dashboard:view',
          'customers:view',
          'subscriptions:view',
          'orders:view',
          'support:view'
        ]
      }
      return rolePermissions[role] || []
    }
    const adminUser: AdminUser = {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      permissions: getPermissionsForRole(user.role)
    }
    // Gerar tokens
    const accessToken = generateAdminToken(adminUser)
    const refreshToken = generateRefreshToken(adminUser)
    // Atualizar último login
    await prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() }
    })
    // Calcular tempo de expiração (8 horas = 28800 segundos)
    const expiresIn = 8 * 60 * 60
    // Log de segurança
    console.log(`Admin login attempt from ${request.ip}`)
    return createSuccessResponse(
      {
        user: {
          id: adminUser.id,
          email: adminUser.email,
          name: adminUser.name,
          role: adminUser.role,
          permissions: adminUser.permissions
        },
        accessToken,
        refreshToken,
        expiresIn
      },
      'Login realizado com sucesso'
    )
  } catch (error) {
    console.error('Admin login error:', error)
    return createErrorResponse(
      'INTERNAL_ERROR',
      'Erro interno do servidor',
      500
    )
  }
}
// Função auxiliar para validação
function validateBody<T>(schema: z.ZodSchema<T>, body: unknown): {
  data: T | null
  error: { field: string; message: string } | null
} {
  try {
    const data = schema.parse(body)
    return { data, error: null }
  } catch (error) {
    if (error instanceof z.ZodError) {
      const firstError = error.errors[0]
      return {
        data: null,
        error: {
          field: firstError.path.join('.'),
          message: firstError.message
        }
      }
    }
    return {
      data: null,
      error: {
        field: 'unknown',
        message: 'Erro de validação desconhecido'
      }
    }
  }
}