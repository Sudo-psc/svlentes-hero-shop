/**
 * JWT Admin Authentication Middleware
 * Fornece autenticação e autorização para APIs administrativas
 */
import jwt from 'jsonwebtoken'
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
// Interfaces
export interface AdminUser {
  id: string
  email: string
  name: string | null
  role: string
  permissions: string[]
}
export interface JWTPayload {
  sub: string // user ID
  email: string
  role: string
  permissions: string[]
  iat: number
  exp: number
}
// JWT Configuration
const JWT_SECRET = process.env.ADMIN_JWT_SECRET || process.env.NEXTAUTH_SECRET || process.env.JWT_SECRET
const JWT_EXPIRES_IN = process.env.ADMIN_JWT_EXPIRES_IN || '8h'
const REFRESH_TOKEN_EXPIRES_IN = process.env.ADMIN_REFRESH_TOKEN_EXPIRES_IN || '7d'
if (!JWT_SECRET && process.env.NODE_ENV !== 'production') {
  console.warn('⚠️ JWT_SECRET not configured - admin auth will not work properly')
}
/**
 * Lista de permissões disponíveis no sistema
 */
export const PERMISSIONS = {
  // Dashboard
  DASHBOARD_VIEW: 'dashboard:view',
  DASHBOARD_METRICS: 'dashboard:metrics',
  // Clientes
  CUSTOMERS_VIEW: 'customers:view',
  CUSTOMERS_CREATE: 'customers:create',
  CUSTOMERS_UPDATE: 'customers:update',
  CUSTOMERS_DELETE: 'customers:delete',
  CUSTOMERS_SEARCH: 'customers:search',
  // Assinaturas
  SUBSCRIPTIONS_VIEW: 'subscriptions:view',
  SUBSCRIPTIONS_CREATE: 'subscriptions:create',
  SUBSCRIPTIONS_UPDATE: 'subscriptions:update',
  SUBSCRIPTIONS_DELETE: 'subscriptions:delete',
  SUBSCRIPTIONS_ANALYTICS: 'subscriptions:analytics',
  SUBSCRIPTIONS_STATUS_UPDATE: 'subscriptions:status_update',
  // Pedidos
  ORDERS_VIEW: 'orders:view',
  ORDERS_CREATE: 'orders:create',
  ORDERS_UPDATE: 'orders:update',
  ORDERS_DELETE: 'orders:delete',
  ORDERS_STATUS_UPDATE: 'orders:status_update',
  // Suporte
  SUPPORT_VIEW: 'support:view',
  SUPPORT_CREATE: 'support:create',
  SUPPORT_UPDATE: 'support:update',
  SUPPORT_DELETE: 'support:delete',
  SUPPORT_ASSIGN: 'support:assign',
  SUPPORT_ESCALATE: 'support:escalate',
  // Administração
  ADMIN_USERS: 'admin:users',
  ADMIN_ROLES: 'admin:roles',
  ADMIN_SETTINGS: 'admin:settings',
  ADMIN_LOGS: 'admin:logs',
  ADMIN_SYSTEM: 'admin:system'
} as const
/**
 * Mapa de roles para permissões
 */
const ROLE_PERMISSIONS: Record<string, string[]> = {
  super_admin: Object.values(PERMISSIONS),
  admin: [
    PERMISSIONS.DASHBOARD_VIEW,
    PERMISSIONS.DASHBOARD_METRICS,
    PERMISSIONS.CUSTOMERS_VIEW,
    PERMISSIONS.CUSTOMERS_CREATE,
    PERMISSIONS.CUSTOMERS_UPDATE,
    PERMISSIONS.CUSTOMERS_SEARCH,
    PERMISSIONS.SUBSCRIPTIONS_VIEW,
    PERMISSIONS.SUBSCRIPTIONS_UPDATE,
    PERMISSIONS.SUBSCRIPTIONS_ANALYTICS,
    PERMISSIONS.SUBSCRIPTIONS_STATUS_UPDATE,
    PERMISSIONS.ORDERS_VIEW,
    PERMISSIONS.ORDERS_CREATE,
    PERMISSIONS.ORDERS_UPDATE,
    PERMISSIONS.ORDERS_STATUS_UPDATE,
    PERMISSIONS.SUPPORT_VIEW,
    PERMISSIONS.SUPPORT_CREATE,
    PERMISSIONS.SUPPORT_UPDATE,
    PERMISSIONS.SUPPORT_ASSIGN,
    PERMISSIONS.ADMIN_LOGS
  ],
  manager: [
    PERMISSIONS.DASHBOARD_VIEW,
    PERMISSIONS.DASHBOARD_METRICS,
    PERMISSIONS.CUSTOMERS_VIEW,
    PERMISSIONS.CUSTOMERS_UPDATE,
    PERMISSIONS.CUSTOMERS_SEARCH,
    PERMISSIONS.SUBSCRIPTIONS_VIEW,
    PERMISSIONS.SUBSCRIPTIONS_ANALYTICS,
    PERMISSIONS.SUBSCRIPTIONS_STATUS_UPDATE,
    PERMISSIONS.ORDERS_VIEW,
    PERMISSIONS.ORDERS_UPDATE,
    PERMISSIONS.ORDERS_STATUS_UPDATE,
    PERMISSIONS.SUPPORT_VIEW,
    PERMISSIONS.SUPPORT_UPDATE,
    PERMISSIONS.SUPPORT_ASSIGN
  ],
  support: [
    PERMISSIONS.DASHBOARD_VIEW,
    PERMISSIONS.CUSTOMERS_VIEW,
    PERMISSIONS.CUSTOMERS_SEARCH,
    PERMISSIONS.SUBSCRIPTIONS_VIEW,
    PERMISSIONS.ORDERS_VIEW,
    PERMISSIONS.SUPPORT_VIEW,
    PERMISSIONS.SUPPORT_CREATE,
    PERMISSIONS.SUPPORT_UPDATE
  ],
  viewer: [
    PERMISSIONS.DASHBOARD_VIEW,
    PERMISSIONS.CUSTOMERS_VIEW,
    PERMISSIONS.SUBSCRIPTIONS_VIEW,
    PERMISSIONS.ORDERS_VIEW,
    PERMISSIONS.SUPPORT_VIEW
  ]
}
/**
 * Roles válidas no sistema
 */
export const VALID_ROLES = ['super_admin', 'admin', 'manager', 'support', 'viewer'] as const
/**
 * Gera token JWT para usuário admin
 */
export function generateAdminToken(user: AdminUser): string {
  const payload: Omit<JWTPayload, 'iat' | 'exp'> = {
    sub: user.id,
    email: user.email,
    role: user.role,
    permissions: user.permissions
  }
  return jwt.sign(payload, JWT_SECRET!, {
    expiresIn: JWT_EXPIRES_IN,
    issuer: 'svlentes-admin',
    audience: 'svlentes-admin-api'
  })
}
/**
 * Gera refresh token para usuário admin
 */
export function generateRefreshToken(user: AdminUser): string {
  const payload = {
    sub: user.id,
    email: user.email,
    type: 'refresh'
  }
  return jwt.sign(payload, JWT_SECRET!, {
    expiresIn: REFRESH_TOKEN_EXPIRES_IN,
    issuer: 'svlentes-admin',
    audience: 'svlentes-admin-refresh'
  })
}
/**
 * Verifica e decodifica token JWT
 */
export function verifyAdminToken(token: string): JWTPayload | null {
  try {
    const decoded = jwt.verify(token, JWT_SECRET!, {
      issuer: 'svlentes-admin',
      audience: 'svlentes-admin-api'
    }) as JWTPayload
    return decoded
  } catch (error) {
    console.error('JWT verification error:', error)
    return null
  }
}
/**
 * Verifica refresh token
 */
export function verifyRefreshToken(token: string): { sub: string; email: string } | null {
  try {
    const decoded = jwt.verify(token, JWT_SECRET!, {
      issuer: 'svlentes-admin',
      audience: 'svlentes-admin-refresh'
    }) as any
    if (decoded.type !== 'refresh') {
      return null
    }
    return {
      sub: decoded.sub,
      email: decoded.email
    }
  } catch (error) {
    console.error('Refresh token verification error:', error)
    return null
  }
}
/**
 * Busca usuário admin no banco com permissões
 */
async function getAdminUser(userId: string): Promise<AdminUser | null> {
  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        name: true,
        role: true
      }
    })
    if (!user || !VALID_ROLES.includes(user.role as any)) {
      return null
    }
    return {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      permissions: ROLE_PERMISSIONS[user.role] || []
    }
  } catch (error) {
    console.error('Error fetching admin user:', error)
    return null
  }
}
/**
 * Extrai token do header Authorization
 */
export function extractToken(request: NextRequest): string | null {
  const authHeader = request.headers.get('authorization')
  if (!authHeader) {
    return null
  }
  // Bearer token format
  if (authHeader.startsWith('Bearer ')) {
    return authHeader.substring(7)
  }
  return null
}
/**
 * Middleware de autenticação para APIs admin
 */
export async function requireAuth(request: NextRequest): Promise<{
  user: AdminUser | null
  error?: NextResponse
}> {
  const token = extractToken(request)
  if (!token) {
    return {
      user: null,
      error: NextResponse.json(
        { error: 'UNAUTHORIZED', message: 'Token de autenticação não fornecido' },
        { status: 401 }
      )
    }
  }
  // Verificar token
  const payload = verifyAdminToken(token)
  if (!payload) {
    return {
      user: null,
      error: NextResponse.json(
        { error: 'UNAUTHORIZED', message: 'Token inválido ou expirado' },
        { status: 401 }
      )
    }
  }
  // Buscar usuário no banco
  const user = await getAdminUser(payload.sub)
  if (!user) {
    return {
      user: null,
      error: NextResponse.json(
        { error: 'FORBIDDEN', message: 'Usuário não encontrado ou sem permissão' },
        { status: 403 }
      )
    }
  }
  return { user }
}
/**
 * Middleware de verificação de permissões
 */
export function requirePermission(permission: string) {
  return async (request: NextRequest): Promise<{
    user: AdminUser | null
    error?: NextResponse
  }> => {
    const authResult = await requireAuth(request)
    if (authResult.error) {
      return authResult
    }
    const { user } = authResult
    if (!user?.permissions.includes(permission)) {
      return {
        user: null,
        error: NextResponse.json(
          {
            error: 'FORBIDDEN',
            message: 'Permissão insuficiente',
            required: permission,
            userPermissions: user?.permissions
          },
          { status: 403 }
        )
      }
    }
    return { user }
  }
}
/**
 * Middleware de verificação de role
 */
export function requireRole(role: string) {
  return async (request: NextRequest): Promise<{
    user: AdminUser | null
    error?: NextResponse
  }> => {
    const authResult = await requireAuth(request)
    if (authResult.error) {
      return authResult
    }
    const { user } = authResult
    if (user?.role !== role) {
      return {
        user: null,
        error: NextResponse.json(
          {
            error: 'FORBIDDEN',
            message: 'Role insuficiente',
            required: role,
            userRole: user?.role
          },
          { status: 403 }
        )
      }
    }
    return { user }
  }
}
/**
 * Verifica se usuário tem pelo menos uma das permissões listadas
 */
export function hasAnyPermission(user: AdminUser, permissions: string[]): boolean {
  return permissions.some(permission => user.permissions.includes(permission))
}
/**
 * Verifica se usuário tem todas as permissões listadas
 */
export function hasAllPermissions(user: AdminUser, permissions: string[]): boolean {
  return permissions.every(permission => user.permissions.includes(permission))
}
/**
 * Cria resposta de erro padrão
 */
export function createErrorResponse(
  error: string,
  message: string,
  status: number = 400
): NextResponse {
  return NextResponse.json(
    { error, message, timestamp: new Date().toISOString() },
    { status }
  )
}
/**
 * Cria resposta de sucesso padrão
 */
export function createSuccessResponse<T>(
  data: T,
  message?: string,
  meta?: any
): NextResponse {
  return NextResponse.json({
    success: true,
    data,
    message,
    meta,
    timestamp: new Date().toISOString()
  })
}
/**
 * Tipos para respostas de API
 */
export interface ApiResponse<T = any> {
  success: boolean
  data?: T
  error?: string
  message?: string
  meta?: {
    pagination?: {
      page: number
      limit: number
      total: number
      totalPages: number
    }
    filters?: Record<string, any>
    sorting?: Record<string, any>
  }
  timestamp: string
}
/**
 * Tipos para paginação
 */
export interface PaginationParams {
  page?: number
  limit?: number
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
}
/**
 * Valida e normaliza parâmetros de paginação
 */
export function validatePagination(params: PaginationParams): {
  page: number
  limit: number
  offset: number
  sortBy: string
  sortOrder: 'asc' | 'desc'
} {
  const page = Math.max(1, Number(params.page) || 1)
  const limit = Math.min(100, Math.max(1, Number(params.limit) || 20))
  const offset = (page - 1) * limit
  const sortBy = params.sortBy || 'createdAt'
  const sortOrder = params.sortOrder || 'desc'
  return { page, limit, offset, sortBy, sortOrder }
}