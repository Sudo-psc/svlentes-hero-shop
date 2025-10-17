import { Button } from '@/components/ui/Button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  AlertTriangle,
  RefreshCw,
  Home,
  MessageCircle,
  Phone
} from 'lucide-react'

interface DashboardErrorProps {
  error?: string
  onRetry?: () => void
  onContactSupport?: () => void
}

export function DashboardError({
  error = 'Ocorreu um erro inesperado',
  onRetry,
  onContactSupport
}: DashboardErrorProps) {
  const handleWhatsApp = () => {
    const phoneNumber = '5533999898026'
    const message = encodeURIComponent('Olá! Preciso de ajuda com o dashboard da minha assinatura.')
    window.open(`https://wa.me/${phoneNumber}?text=${message}`, '_blank')
  }

  const handlePhoneCall = () => {
    window.open('tel:+5533999898026', '_self')
  }

  const handleBackToHome = () => {
    window.location.href = '/'
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-cyan-50 to-silver-50">
      <div className="max-w-md w-full mx-4">
        <Card>
          <CardHeader className="text-center">
            <div className="mx-auto w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
              <AlertTriangle className="h-8 w-8 text-red-600" />
            </div>
            <CardTitle className="text-xl text-gray-900">
              Erro no Dashboard
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="text-center">
              <p className="text-gray-600 mb-4">
                {error}
              </p>
              <p className="text-sm text-gray-500">
                Por favor, tente novamente ou entre em contato com nosso suporte se o problema persistir.
              </p>
            </div>

            <div className="space-y-3">
              {onRetry && (
                <Button
                  onClick={onRetry}
                  className="w-full"
                  variant="default"
                >
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Tentar Novamente
                </Button>
              )}

              <div className="grid grid-cols-2 gap-3">
                <Button
                  onClick={handleWhatsApp}
                  variant="outline"
                  size="sm"
                  className="flex items-center gap-2"
                >
                  <MessageCircle className="h-4 w-4" />
                  WhatsApp
                </Button>

                <Button
                  onClick={handlePhoneCall}
                  variant="outline"
                  size="sm"
                  className="flex items-center gap-2"
                >
                  <Phone className="h-4 w-4" />
                  Ligar
                </Button>
              </div>
            </div>

            <div className="pt-4 border-t border-gray-200">
              <div className="text-center space-y-2">
                <p className="text-sm text-gray-500">
                  <strong>Contato de Suporte:</strong>
                </p>
                <div className="space-y-1 text-xs text-gray-600">
                  <p>WhatsApp: +55 33 99989-8026</p>
                  <p>Email: saraivavision@gmail.com</p>
                  <p>Dr. Philipe Saraiva Cruz (CRM-MG 69.870)</p>
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-gray-200">
              <Button
                onClick={handleBackToHome}
                variant="ghost"
                className="w-full"
              >
                <Home className="h-4 w-4 mr-2" />
                Voltar para Página Inicial
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

interface DashboardInlineErrorProps {
  error?: string
  onRetry?: () => void
  compact?: boolean
}

export function DashboardInlineError({
  error = 'Ocorreu um erro',
  onRetry,
  compact = false
}: DashboardInlineErrorProps) {
  if (compact) {
    return (
      <div className="flex items-center gap-3 p-3 bg-red-50 border border-red-200 rounded-lg">
        <AlertTriangle className="h-4 w-4 text-red-600 flex-shrink-0" />
        <div className="flex-1 min-w-0">
          <p className="text-sm text-red-800">{error}</p>
        </div>
        {onRetry && (
          <Button
            onClick={onRetry}
            size="sm"
            variant="outline"
            className="border-red-200 text-red-700 hover:bg-red-100"
          >
            <RefreshCw className="h-3 w-3" />
          </Button>
        )}
      </div>
    )
  }

  return (
    <Card className="border-red-200">
      <CardContent className="pt-6">
        <div className="text-center space-y-4">
          <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto">
            <AlertTriangle className="h-6 w-6 text-red-600" />
          </div>
          <div>
            <h3 className="font-medium text-red-900 mb-1">
              Erro ao carregar informações
            </h3>
            <p className="text-sm text-red-700">{error}</p>
          </div>
          {onRetry && (
            <Button
              onClick={onRetry}
              size="sm"
              variant="outline"
              className="border-red-200 text-red-700 hover:bg-red-100"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Tentar Novamente
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

interface NetworkErrorProps {
  onRetry?: () => void
}

export function NetworkError({ onRetry }: NetworkErrorProps) {
  return (
    <DashboardInlineError
      error="Falha na conexão. Verifique sua internet e tente novamente."
      onRetry={onRetry}
    />
  )
}

interface UnauthorizedErrorProps {
  onLogin?: () => void
}

export function UnauthorizedError({ onLogin }: UnauthorizedErrorProps) {
  const handleLogin = () => {
    window.location.href = '/area-assinante/login'
  }

  return (
    <Card className="border-orange-200">
      <CardContent className="pt-6">
        <div className="text-center space-y-4">
          <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center mx-auto">
            <AlertTriangle className="h-6 w-6 text-orange-600" />
          </div>
          <div>
            <h3 className="font-medium text-orange-900 mb-1">
              Sessão expirada
            </h3>
            <p className="text-sm text-orange-700">
              Você precisa fazer login novamente para acessar o dashboard.
            </p>
          </div>
          <Button
            onClick={onLogin || handleLogin}
            size="sm"
            className="bg-orange-600 hover:bg-orange-700"
          >
            Fazer Login
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

export default DashboardError