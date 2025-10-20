'use client'
import { createContext, useContext, ReactNode, useState } from 'react'
interface AdminAuthContextType {
  session: any
  permissions: string[]
  hasPermission: (permission: string) => boolean
  hasAnyPermission: (permissions: string[]) => boolean
}
const AdminAuthContext = createContext<AdminAuthContextType | undefined>(undefined)
interface AdminAuthProviderProps {
  children: ReactNode
  session: any
}
export function AdminAuthProvider({ children, session }: AdminAuthProviderProps) {
  // Mock permissions - in real app, get from session or API
  const [permissions] = useState<string[]>([
    'VIEW_DASHBOARD',
    'VIEW_USERS',
    'VIEW_SUBSCRIPTIONS',
    'VIEW_ORDERS',
    'VIEW_PAYMENTS',
    'VIEW_SUPPORT_TICKETS',
    'VIEW_ANALYTICS',
    'VIEW_SETTINGS',
    'CREATE_USERS',
    'EDIT_USERS',
    'EDIT_SUBSCRIPTIONS',
    'CANCEL_SUBSCRIPTIONS',
    'PROCESS_REFUNDS',
    'RESPOND_TICKETS',
    'EXPORT_REPORTS'
  ])
  const hasPermission = (permission: string): boolean => {
    return permissions.includes(permission)
  }
  const hasAnyPermission = (requiredPermissions: string[]): boolean => {
    return requiredPermissions.some(permission => permissions.includes(permission))
  }
  return (
    <AdminAuthContext.Provider
      value={{
        session,
        permissions,
        hasPermission,
        hasAnyPermission,
      }}
    >
      {children}
    </AdminAuthContext.Provider>
  )
}
export function useAdminAuth() {
  const context = useContext(AdminAuthContext)
  if (context === undefined) {
    throw new Error('useAdminAuth must be used within an AdminAuthProvider')
  }
  return context
}