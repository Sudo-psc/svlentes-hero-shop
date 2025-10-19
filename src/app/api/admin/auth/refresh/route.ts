/**
 * POST /api/admin/auth/refresh
 * Refresh token de autenticação
 *
 * Gera novo access token usando refresh token válido
 */

import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import {
  verifyRefreshToken,
  generateAdminToken,
  generateRefreshToken,
  createErrorResponse,
  createSuccessResponse,
  AdminUser
} from '@/lib/admin-auth'
import { refreshTokenSchema } from '@/lib/admin-validations'

/**
 * @swagger
 * /api/admin/auth/refresh:
 *   post:
 *     summary: Renovar token de acesso
 *     description: Gera novo access token usando refresh token válido
 *     tags:
 *       - Autenticação Admin
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               refreshToken:
 *                 type: string
 *                 description: Refresh token válido
 *                 example: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
 *             required:
 *               - refreshToken
 *     responses:
 *       200:
 *         description: Token renovado com sucesso
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
 *                       description: Novo token JWT de acesso
 *                     refreshToken:
 *                       type: string
 *                       description: Novo refresh token
 *                     expiresIn:
 *                       type: number
 *                       description: Tempo de expiração em segundos
 *       400:
 *         description: Erro de validação
 *       401:
 *         description: Refresh token inválido ou expirado
 *       500:
 *         description: Erro interno do servidor
 */
export async function POST(request: NextRequest) {
  try {
    // Validar body da requisição
    const body = await request.json()
    const { data: refreshData, error: validationError } = validateBody(refreshTokenSchema, body)

    if (validationError) {
      return createErrorResponse(
        'VALIDATION_ERROR',
        `Campo inválido: ${validationError.field} - ${validationError.message}`,
        400
      )
    }

    // Verificar refresh token
    const refreshPayload = verifyRefreshToken(refreshData.refreshToken)
    if (!refreshPayload) {
      return createErrorResponse(
        'INVALID_REFRESH_TOKEN',
        'Refresh token inválido ou expirado',
        401
      )
    }

    // Buscar usuário no banco
    const user = await prisma.user.findUnique({
      where: { id: refreshPayload.sub },
      select: {
        id: true,
        email: true,
        name: true,
        role: true
      }
    })

    if (!user) {
      return createErrorResponse(
        'USER_NOT_FOUND',
        'Usuário não encontrado',
        401
      )
    }

    // Verificar se usuário ainda tem role admin
    const validAdminRoles = ['super_admin', 'admin', 'manager', 'support', 'viewer']
    if (!validAdminRoles.includes(user.role)) {
      return createErrorResponse(
        'FORBIDDEN',
        'Usuário não tem mais permissão de acesso administrativo',
        403
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

    // Gerar novos tokens
    const newAccessToken = generateAdminToken(adminUser)
    const newRefreshToken = generateRefreshToken(adminUser)

    // Calcular tempo de expiração (8 horas = 28800 segundos)
    const expiresIn = 8 * 60 * 60

    // Log de segurança
    console.log(`Admin token refresh: ${user.email} (${user.role}) from ${request.ip}`)

    return createSuccessResponse(
      {
        user: {
          id: adminUser.id,
          email: adminUser.email,
          name: adminUser.name,
          role: adminUser.role,
          permissions: adminUser.permissions
        },
        accessToken: newAccessToken,
        refreshToken: newRefreshToken,
        expiresIn
      },
      'Token renovado com sucesso'
    )

  } catch (error) {
    console.error('Admin refresh token error:', error)
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