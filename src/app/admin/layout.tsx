import { redirect } from 'next/navigation'
import { getServerSession } from 'next-auth'
import { AdminSidebar } from '@/components/admin/layout/AdminSidebar'
import { AdminHeader } from '@/components/admin/layout/AdminHeader'
import { AdminAuthProvider } from '@/components/admin/providers/AdminAuthProvider'
import { checkAdminPermissions } from '@/lib/admin/auth'
import { Permission } from '@/types/admin'

export const metadata = {
  title: 'Painel Administrativo - SVLentes',
  description: 'Painel administrativo para gerenciamento do sistema SVLentes',
}

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  // Verificar se o usuário está autenticado
  const session = await getServerSession()

  if (!session) {
    redirect('/auth/signin?callbackUrl=/admin')
  }

  // Verificar se o usuário tem permissão de administrador
  const hasPermission = await checkAdminPermissions(
    session.user?.email || '',
    Permission.VIEW_DASHBOARD
  )

  if (!hasPermission) {
    redirect('/unauthorized')
  }

  return (
    <AdminAuthProvider session={session}>
      <div className="min-h-screen bg-admin-dashboard">
        {/* Sidebar */}
        <AdminSidebar />

        {/* Main Content */}
        <div className="lg:pl-64">
          {/* Header */}
          <AdminHeader session={session} />

          {/* Page Content */}
          <main className="p-6">
            <div className="max-w-7xl mx-auto">
              {children}
            </div>
          </main>
        </div>
      </div>
    </AdminAuthProvider>
  )
}