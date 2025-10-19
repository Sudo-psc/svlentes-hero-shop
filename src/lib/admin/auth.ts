import { getServerSession } from 'next-auth'
import { redirect } from 'next/navigation'
import { Permission, AdminRole } from '@/types/admin'

// Mock admin users - in production, this would come from database
const MOCK_ADMIN_USERS = {
  'admin@svlentes.com.br': {
    email: 'admin@svlentes.com.br',
    role: AdminRole.SUPER_ADMIN,
    permissions: Object.values(Permission),
  },
  'manager@svlentes.com.br': {
    email: 'manager@svlentes.com.br',
    role: AdminRole.MANAGER,
    permissions: [
      Permission.VIEW_DASHBOARD,
      Permission.VIEW_USERS,
      Permission.VIEW_SUBSCRIPTIONS,
      Permission.EDIT_SUBSCRIPTIONS,
      Permission.CANCEL_SUBSCRIPTIONS,
      Permission.VIEW_ORDERS,
      Permission.EDIT_ORDERS,
      Permission.VIEW_PAYMENTS,
      Permission.PROCESS_REFUNDS,
      Permission.VIEW_SUPPORT_TICKETS,
      Permission.RESPOND_TICKETS,
      Permission.VIEW_ANALYTICS,
      Permission.EXPORT_REPORTS,
      Permission.VIEW_SETTINGS,
    ],
  },
  'support@svlentes.com.br': {
    email: 'support@svlentes.com.br',
    role: AdminRole.SUPPORT,
    permissions: [
      Permission.VIEW_DASHBOARD,
      Permission.VIEW_USERS,
      Permission.VIEW_SUBSCRIPTIONS,
      Permission.VIEW_ORDERS,
      Permission.VIEW_PAYMENTS,
      Permission.VIEW_SUPPORT_TICKETS,
      Permission.RESPOND_TICKETS,
      Permission.VIEW_ANALYTICS,
    ],
  },
}

/**
 * Verifica se um usuário tem permissão de administrador
 */
export async function checkAdminPermission(
  userEmail: string,
  requiredPermission: Permission
): Promise<boolean> {
  const adminUser = MOCK_ADMIN_USERS[userEmail as keyof typeof MOCK_ADMIN_USERS]

  if (!adminUser) {
    return false
  }

  return adminUser.permissions.includes(requiredPermission)
}

/**
 * Verifica se um usuário tem alguma das permissões necessárias
 */
export async function checkAdminPermissions(
  userEmail: string,
  requiredPermissions: Permission | Permission[]
): Promise<boolean> {
  const adminUser = MOCK_ADMIN_USERS[userEmail as keyof typeof MOCK_ADMIN_USERS]

  if (!adminUser) {
    return false
  }

  const permissions = Array.isArray(requiredPermissions)
    ? requiredPermissions
    : [requiredPermissions]

  return permissions.some(permission => adminUser.permissions.includes(permission))
}

/**
 * Obtém informações do usuário administrador
 */
export async function getAdminUser(userEmail: string) {
  const adminUser = MOCK_ADMIN_USERS[userEmail as keyof typeof MOCK_ADMIN_USERS]

  if (!adminUser) {
    return null
  }

  return {
    email: adminUser.email,
    role: adminUser.role,
    permissions: adminUser.permissions,
  }
}

/**
 * Middleware para verificar autenticação admin em server components
 */
export async function requireAuth(
  requiredPermissions?: Permission | Permission[]
) {
  const session = await getServerSession()

  if (!session?.user?.email) {
    redirect('/auth/signin?callbackUrl=/admin')
  }

  if (requiredPermissions) {
    const hasPermission = await checkAdminPermissions(
      session.user.email,
      requiredPermissions
    )

    if (!hasPermission) {
      redirect('/unauthorized')
    }
  }

  return {
    session,
    user: await getAdminUser(session.user.email),
  }
}

/**
 * Wrapper para APIs administrativas
 */
export function withAdminAuth(
  handler: (req: Request, context: { user: any; session: any }) => Promise<Response>,
  requiredPermissions?: Permission | Permission[]
) {
  return async (req: Request, context: any) => {
    try {
      const session = await getServerSession()

      if (!session?.user?.email) {
        return Response.json(
          { success: false, error: 'Não autorizado' },
          { status: 401 }
        )
      }

      const adminUser = await getAdminUser(session.user.email)

      if (!adminUser) {
        return Response.json(
          { success: false, error: 'Acesso administrativo negado' },
          { status: 403 }
        )
      }

      if (requiredPermissions) {
        const hasPermission = await checkAdminPermissions(
          session.user.email,
          requiredPermissions
        )

        if (!hasPermission) {
          return Response.json(
            { success: false, error: 'Permissões insuficientes' },
            { status: 403 }
          )
        }
      }

      return handler(req, { user: adminUser, session })
    } catch (error) {
      console.error('Admin auth middleware error:', error)
      return Response.json(
        { success: false, error: 'Erro interno do servidor' },
        { status: 500 }
      )
    }
  }
}

/**
 * Hook para usar autenticação admin em client components
 */
export function useAdminAuth() {
  // This would be implemented with NextAuth's useSession hook
  // For now, we'll create a placeholder
  throw new Error('useAdminAuth should be used with NextAuth client-side hooks')
}

/**
 * Helper para criar rotas de API protegidas
 */
export function createProtectedRoute(
  handler: (req: Request, context: { user: any; session: any }) => Promise<Response>,
  options: {
    permissions?: Permission | Permission[]
    roles?: AdminRole | AdminRole[]
  } = {}
) {
  return async (req: Request, context: any) => {
    try {
      const session = await getServerSession()

      if (!session?.user?.email) {
        return Response.json(
          { success: false, error: 'Não autorizado' },
          { status: 401 }
        )
      }

      const adminUser = await getAdminUser(session.user.email)

      if (!adminUser) {
        return Response.json(
          { success: false, error: 'Acesso administrativo negado' },
          { status: 403 }
        )
      }

      // Check role requirements
      if (options.roles) {
        const roles = Array.isArray(options.roles) ? options.roles : [options.roles]
        if (!roles.includes(adminUser.role)) {
          return Response.json(
            { success: false, error: 'Função não autorizada' },
            { status: 403 }
          )
        }
      }

      // Check permission requirements
      if (options.permissions) {
        const permissions = Array.isArray(options.permissions)
          ? options.permissions
          : [options.permissions]

        const hasPermission = permissions.some(permission =>
          adminUser.permissions.includes(permission)
        )

        if (!hasPermission) {
          return Response.json(
            { success: false, error: 'Permissões insuficientes' },
            { status: 403 }
          )
        }
      }

      return handler(req, { user: adminUser, session })
    } catch (error) {
      console.error('Protected route error:', error)
      return Response.json(
        { success: false, error: 'Erro interno do servidor' },
        { status: 500 }
      )
    }
  }
}

/**
 * Activity logging for admin actions
 */
export async function logAdminAction(
  userEmail: string,
  action: string,
  resource: string,
  resourceId: string,
  details?: Record<string, any>
) {
  // In production, this would log to database
  console.log('Admin Action Log:', {
    userEmail,
    action,
    resource,
    resourceId,
    details,
    timestamp: new Date().toISOString(),
  })
}