/**
 * GET /api/admin/auth/me
 * Obter informações do usuário atual
 *
 * Retorna dados do usuário administrativo autenticado
 */

import { NextRequest, NextResponse } from 'next/server'
import { requireAuth, createSuccessResponse } from '@/lib/admin-auth'

/**
 * @swagger
 * /api/admin/auth/me:
 *   get:
 *     summary: Obter usuário atual
 *     description: Retorna informações do usuário administrativo autenticado
 *     tags:
 *       - Autenticação Admin
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Dados do usuário retornados com sucesso
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
 *                     id:
 *                       type: string
 *                       example: user_123
 *                     email:
 *                       type: string
 *                       example: admin@svlentes.com.br
 *                     name:
 *                       type: string
 *                       nullable: true
 *                       example: Administrador
 *                     role:
 *                       type: string
 *                       example: admin
 *                     permissions:
 *                       type: array
 *                       items:
 *                         type: string
 *                       example: ["dashboard:view", "customers:view"]
 *       401:
 *         description: Não autorizado
 *       403:
 *         description: Acesso negado
 *       500:
 *         description: Erro interno do servidor
 */
export async function GET(request: NextRequest) {
  try {
    // Verificar autenticação
    const { user, error } = await requireAuth(request)

    if (error) {
      return error
    }

    if (!user) {
      return NextResponse.json(
        {
          error: 'UNAUTHORIZED',
          message: 'Usuário não autenticado'
        },
        { status: 401 }
      )
    }

    // Retornar dados do usuário
    return createSuccessResponse(
      {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        permissions: user.permissions
      },
      'Dados do usuário obtidos com sucesso'
    )

  } catch (error) {
    console.error('Admin auth me error:', error)
    return NextResponse.json(
      {
        error: 'INTERNAL_ERROR',
        message: 'Erro interno do servidor',
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    )
  }
}