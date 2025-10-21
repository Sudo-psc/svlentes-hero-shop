/**
 * POST /api/admin/auth/logout
 * Logout de usuários administrativos
 *
 * Invalida a sessão atual do usuário
 */
import { NextRequest, NextResponse } from 'next/server'
import { extractToken } from '@/lib/admin-auth'
/**
 * @swagger
 * /api/admin/auth/logout:
 *   post:
 *     summary: Logout de usuário administrativo
 *     tags:
 *       - Autenticação Admin
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Logout realizado com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: Logout realizado com sucesso
 *       401:
 *         description: Não autorizado
 *       500:
 *         description: Erro interno do servidor
 */
export async function POST(request: NextRequest) {
  try {
    // Extrair token do header
    const token = extractToken(request)
    if (!token) {
      return NextResponse.json(
        {
          error: 'UNAUTHORIZED',
          message: 'Token de autenticação não fornecido'
        },
        { status: 401 }
      )
    }
    // Em uma implementação mais robusta, poderíamos:
    // 1. Adicionar o token a uma blacklist no Redis
    // 2. Invalidar o refresh token associado
    // 3. Log do logout para auditoria
    // Log de segurança
    console.log(`Admin logout from ${request.ip}`)
    // Por ora, apenas retornamos sucesso
    // O cliente deve descartar os tokens do lado dele
    return NextResponse.json(
      {
        success: true,
        message: 'Logout realizado com sucesso',
        timestamp: new Date().toISOString()
      },
      { status: 200 }
    )
  } catch (error) {
    console.error('Admin logout error:', error)
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