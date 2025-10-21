'use client'

import React, { Component, ErrorInfo, ReactNode } from 'react'
import { AlertTriangle, RefreshCw, Home, Phone } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface Props {
  children: ReactNode
  fallback?: ReactNode
  onError?: (error: Error, errorInfo: ErrorInfo) => void
}

interface State {
  hasError: boolean
  error?: Error
  errorInfo?: ErrorInfo
  retryCount: number
}

export class SubscriptionErrorBoundary extends Component<Props, State> {
  private maxRetries = 3

  constructor(props: Props) {
    super(props)
    this.state = {
      hasError: false,
      retryCount: 0
    }
  }

  static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      error,
      retryCount: 0
    }
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('SubscriptionErrorBoundary caught an error:', error, errorInfo)
    
    this.setState({
      error,
      errorInfo
    })

    // Registrar erro em serviço de monitoring
    if (typeof window !== 'undefined' && window.gtag) {
      window.gtag('event', 'exception', {
        description: error.message,
        fatal: false,
        custom_map: {
          component: 'subscription',
          stack: error.stack
        }
      })
    }

    // Callback personalizado
    this.props.onError?.(error, errorInfo)
  }

  handleRetry = () => {
    if (this.state.retryCount < this.maxRetries) {
      this.setState(prevState => ({
        hasError: false,
        error: undefined,
        errorInfo: undefined,
        retryCount: prevState.retryCount + 1
      }))
    }
  }

  handleGoHome = () => {
    window.location.href = '/'
  }

  handleContactSupport = () => {
    window.location.href = 'https://wa.me/553399887765'
  }

  render() {
    if (this.state.hasError) {
      // Fallback personalizado fornecido
      if (this.props.fallback) {
        return this.props.fallback
      }

      // UI padrão de erro para assinaturas
      return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
          <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-6">
            <div className="text-center">
              {/* Icone de erro */}
              <div className="mx-auto w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
                <AlertTriangle className="w-8 h-8 text-red-600" />
              </div>

              <h1 className="text-2xl font-bold text-gray-900 mb-2">
                Erro na Assinatura
              </h1>
              
              <p className="text-gray-600 mb-6">
                Ocorreu um erro ao carregar suas informações de assinatura. 
                Nossa equipe foi notificada e está trabalhando para resolver.
              </p>

              {/* Detalhes do erro (em desenvolvimento) */}
              {process.env.NODE_ENV === 'development' && this.state.error && (
                <details className="mb-6 text-left">
                  <summary className="text-sm text-gray-500 cursor-pointer mb-2">
                    Ver detalhes técnicos
                  </summary>
                  <div className="bg-gray-100 p-3 rounded text-xs font-mono text-gray-700">
                    <div className="mb-2">
                      <strong>Erro:</strong> {this.state.error.message}
                    </div>
                    {this.state.error.stack && (
                      <div className="text-xs text-gray-600 whitespace-pre-wrap">
                        {this.state.error.stack}
                      </div>
                    )}
                  </div>
                </details>
              )}

              {/* Contador de tentativas */}
              {this.state.retryCount > 0 && (
                <div className="mb-4 text-sm text-gray-600">
                  Tentativa {this.state.retryCount} de {this.maxRetries}
                </div>
              )}

              {/* Ações */}
              <div className="space-y-3">
                {this.state.retryCount < this.maxRetries ? (
                  <Button
                    onClick={this.handleRetry}
                    className="w-full flex items-center justify-center space-x-2 bg-cyan-600 hover:bg-cyan-700"
                  >
                    <RefreshCw className="w-4 h-4" />
                    <span>Tentar Novamente</span>
                  </Button>
                ) : (
                  <div className="text-sm text-gray-600 mb-4">
                    Número máximo de tentativas atingido. Por favor, contate o suporte.
                  </div>
                )}

                <div className="grid grid-cols-2 gap-3">
                  <Button
                    onClick={this.handleGoHome}
                    variant="outline"
                    className="flex items-center justify-center space-x-2"
                  >
                    <Home className="w-4 h-4" />
                    <span>Página Inicial</span>
                  </Button>

                  <Button
                    onClick={this.handleContactSupport}
                    variant="outline"
                    className="flex items-center justify-center space-x-2 text-green-600 border-green-600 hover:bg-green-50"
                  >
                    <Phone className="w-4 h-4" />
                    <span> Suporte</span>
                  </Button>
                </div>
              </div>

              {/* Informações de contato */}
              <div className="mt-6 pt-6 border-t border-gray-200">
                <p className="text-xs text-gray-500">
                  Se o problema persistir, entre em contato:
                </p>
                <p className="text-xs text-gray-600 mt-1">
                  WhatsApp: (33) 99988-7765<br />
                  Email: suporte@svlentes.com.br
                </p>
              </div>
            </div>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}

// Hook para usar com componentes funcionais
export const useSubscriptionErrorBoundary = () => {
  const handleError = React.useCallback((error: Error, errorInfo: ErrorInfo) => {
    // Lógica personalizada de tratamento de erro
    console.error('Subscription error handled by hook:', error, errorInfo)
  }, [])

  return { handleError }
}

// Componente de fallback personalizado
export const SubscriptionFallback = ({ 
  onRetry 
}: { 
  onRetry?: () => void 
}) => (
  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
    <div className="flex items-center space-x-3">
      <AlertTriangle className="w-5 h-5 text-yellow-600 flex-shrink-0" />
      <div className="flex-1">
        <h3 className="text-sm font-medium text-yellow-800">
          Problema temporário
        </h3>
        <p className="text-sm text-yellow-700 mt-1">
          Não foi possível carregar as informações da assinatura no momento.
        </p>
      </div>
      {onRetry && (
        <Button
          onClick={onRetry}
          size="sm"
          variant="outline"
          className="text-yellow-700 border-yellow-300 hover:bg-yellow-100"
        >
          Tentar
        </Button>
      )}
    </div>
  </div>
)
