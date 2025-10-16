'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/Button'
import { Logo } from '@/components/ui/Logo'
import { User } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { SubscriptionDashboard } from '@/components/subscription/SubscriptionDashboard'

export default function DashboardPage() {
  const router = useRouter()
  const { user, loading, signOut } = useAuth()

  useEffect(() => {
    if (!loading && !user) {
      router.push('/area-assinante/login')
    }
  }, [user, loading, router])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-cyan-50 to-silver-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Carregando...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return null // Will redirect
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-cyan-50 to-silver-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              <Logo className="h-8 w-auto" />
              <span className="text-lg font-semibold text-gray-900">Área do Assinante</span>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <div className="h-8 w-8 rounded-full bg-cyan-100 flex items-center justify-center">
                  <User className="h-4 w-4 text-cyan-600" />
                </div>
                <span className="text-sm font-medium text-gray-700">{user.displayName}</span>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => signOut()}
              >
                Sair
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Bem-vindo(a), {user.displayName}!
          </h2>
          <p className="text-gray-600">
            Gerencie sua assinatura de lentes de contato e acompanhe suas entregas.
          </p>
        </div>

        {/* Advanced Dashboard */}
        <SubscriptionDashboard />
      </main>
    </div>
  )
}

// Force dynamic rendering for authenticated routes
export const dynamic = 'force-dynamic'
