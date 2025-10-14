'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/Button'
import { Logo } from '@/components/ui/Logo'
import {
  User,
  Package,
  AlertTriangle
} from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'

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
            Aqui você pode acompanhar sua assinatura de lentes de contato e gerenciar seus dados.
          </p>
        </div>

        {/* Simple Dashboard Content */}
        <div className="grid md:grid-cols-2 gap-8">
          {/* Subscription Status */}
          <div className="bg-white p-6 rounded-xl shadow-sm border">
            <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Package className="h-5 w-5 text-cyan-600" />
              Status da Assinatura
            </h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-gray-600">Plano:</span>
                <span className="font-medium">Lentes Diárias Mensal</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-600">Status:</span>
                <span className="px-2 py-1 text-xs bg-green-100 text-green-800 rounded-full">Ativa</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-600">Próxima cobrança:</span>
                <span className="font-medium">14/11/2025</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-600">Valor:</span>
                <span className="font-bold text-cyan-600">R$ 149,90</span>
              </div>
            </div>
          </div>

          {/* Emergency Contact */}
          <div className="bg-white p-6 rounded-xl shadow-sm border">
            <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-cyan-600" />
              Contato de Emergência
            </h3>
            <div className="space-y-3">
              <div>
                <p className="text-sm text-gray-600">WhatsApp:</p>
                <a
                  href="https://wa.me/553399898026"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-cyan-600 hover:underline font-medium"
                >
                  +55 33 99898-026
                </a>
              </div>
              <div>
                <p className="text-sm text-gray-600">Email:</p>
                <a
                  href="mailto:saraivavision@gmail.com"
                  className="text-cyan-600 hover:underline font-medium"
                >
                  saraivavision@gmail.com
                </a>
              </div>
              <div className="pt-3 border-t">
                <p className="text-sm font-medium text-yellow-800 bg-yellow-50 p-2 rounded">
                  <strong>Dr. Philipe Saraiva Cruz</strong><br />
                  CRM-MG 69.870
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="mt-8 flex flex-wrap gap-4">
          <Button>
            <Package className="h-4 w-4 mr-2" />
            Ver Histórico de Pedidos
          </Button>
          <Button variant="outline">
            Baixar Fatura
          </Button>
          <Button variant="outline">
            Alterar Forma de Pagamento
          </Button>
        </div>

        {/* Development Notice */}
        <div className="mt-8 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <p className="text-sm text-blue-800">
            <strong>🚀 Dashboard em Desenvolvimento</strong><br />
            Esta é uma versão inicial do dashboard. Em breve você terá acesso completo a todos os recursos da sua assinatura.
          </p>
        </div>
      </main>
    </div>
  )
}

// Force dynamic rendering for authenticated routes
export const dynamic = 'force-dynamic'
