/**
 * Dashboard Error Boundary
 * React Error Boundary específico para área do assinante
 *
 * Features:
 * - Captura erros de renderização
 * - UI de erro elegante
 * - Botão de retry sem recarregar página
 * - Logging para analytics
 * - Fallback para componentes críticos
 */

'use client'

import React, { Component, ReactNode } from 'react'
import { AlertTriangle, RefreshCw, Home } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'

interface ErrorBoundaryProps {
  children: ReactNode
  fallback?: ReactNode
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void
  resetKeys?: Array<string | number>
}

interface ErrorBoundaryState {
  hasError: boolean
  error: Error | null
  errorInfo: React.ErrorInfo | null
  errorCount: number
}

export class DashboardErrorBoundary extends Component<
  ErrorBoundaryProps,
  ErrorBoundaryState
> {
  constructor(props: ErrorBoundaryProps) {
    super(props)
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      errorCount: 0,
    }
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    return {
      hasError: true,
      error,
    }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // Log erro para console
    console.error('[Error Boundary] Caught error:', error, errorInfo)

    // Update state com informações do erro
    this.setState(prevState => ({
      errorInfo,
      errorCount: prevState.errorCount + 1,
    }))

    // Callback customizado (se fornecido)
    this.props.onError?.(error, errorInfo)

    // Log para monitoring
    this.logErrorToMonitoring(error, errorInfo)
  }

  componentDidUpdate(prevProps: ErrorBoundaryProps) {
    // Reset error se resetKeys mudarem
    if (
      this.state.hasError &&
      this.props.resetKeys &&
      prevProps.resetKeys &&
      this.props.resetKeys.some((key, index) => key !== prevProps.resetKeys?.[index])
    ) {
      this.resetError()
    }
  }

  logErrorToMonitoring(error: Error, errorInfo: React.ErrorInfo) {
    const errorData = {
      message: error.message,
      stack: error.stack,
      componentStack: errorInfo.componentStack,
      errorCount: this.state.errorCount,
      timestamp: new Date().toISOString(),
      url: typeof window !== 'undefined' ? window.location.href : null,
      userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : null,
    }

    // Enviar para API de monitoring (não-bloqueante)
    fetch('/api/monitoring/errors', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        type: 'render_error',
        ...errorData,
      }),
      signal: AbortSignal.timeout(2000),
    }).catch(() => {
      // Silently fail - não queremos quebrar error boundary
    })

    // Salvar no localStorage para debug
    try {
      const errors = JSON.parse(localStorage.getItem('render-errors') || '[]')
      errors.push(errorData)

      // Manter apenas últimos 20 erros
      if (errors.length > 20) {
        errors.splice(0, errors.length - 20)
      }

      localStorage.setItem('render-errors', JSON.stringify(errors))
    } catch {
      // Ignorar se localStorage não disponível
    }
  }

  resetError = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    })
  }

  reloadPage = () => {
    if (typeof window !== 'undefined') {
      window.location.reload()
    }
  }

  goToHome = () => {
    if (typeof window !== 'undefined') {
      window.location.href = '/'
    }
  }

  render() {
    if (this.state.hasError) {
      // Usar fallback customizado se fornecido
      if (this.props.fallback) {
        return this.props.fallback
      }

      // UI padrão de erro
      return (
        <div className="min-h-[400px] flex items-center justify-center p-4">
          <Card className="max-w-2xl w-full p-8">
            <div className="flex flex-col items-center text-center space-y-6">
              {/* Icon */}
              <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center">
                <AlertTriangle className="w-8 h-8 text-red-600" />
              </div>

              {/* Título */}
              <div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">
                  Algo deu errado
                </h2>
                <p className="text-gray-600">
                  Encontramos um erro inesperado ao carregar esta seção do dashboard.
                </p>
              </div>

              {/* Detalhes do erro (apenas em desenvolvimento) */}
              {process.env.NODE_ENV === 'development' && this.state.error && (
                <details className="w-full text-left">
                  <summary className="cursor-pointer text-sm font-medium text-gray-700 mb-2">
                    Detalhes técnicos (desenvolvimento)
                  </summary>
                  <div className="bg-gray-50 rounded-lg p-4 text-xs font-mono overflow-auto max-h-48">
                    <p className="text-red-600 font-semibold mb-2">
                      {this.state.error.message}
                    </p>
                    <pre className="text-gray-700 whitespace-pre-wrap">
                      {this.state.error.stack}
                    </pre>
                  </div>
                </details>
              )}

              {/* Tentativas múltiplas */}
              {this.state.errorCount > 2 && (
                <div className="w-full bg-amber-50 border border-amber-200 rounded-lg p-4">
                  <p className="text-sm text-amber-800">
                    <strong>Erro persistente:</strong> Este erro ocorreu {this.state.errorCount} vezes.
                    Recomendamos recarregar a página ou voltar para a página inicial.
                  </p>
                </div>
              )}

              {/* Actions */}
              <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
                <Button
                  onClick={this.resetError}
                  variant="default"
                  className="flex items-center gap-2"
                  disabled={this.state.errorCount > 3}
                >
                  <RefreshCw className="w-4 h-4" />
                  Tentar Novamente
                </Button>

                {this.state.errorCount > 2 && (
                  <Button
                    onClick={this.reloadPage}
                    variant="outline"
                    className="flex items-center gap-2"
                  >
                    <RefreshCw className="w-4 h-4" />
                    Recarregar Página
                  </Button>
                )}

                <Button
                  onClick={this.goToHome}
                  variant="outline"
                  className="flex items-center gap-2"
                >
                  <Home className="w-4 h-4" />
                  Voltar ao Início
                </Button>
              </div>

              {/* Mensagem de suporte */}
              <p className="text-sm text-gray-500">
                Se o problema persistir, entre em contato com nosso suporte pelo WhatsApp:
                <br />
                <a
                  href="https://wa.me/5533986061427"
                  className="text-cyan-600 hover:text-cyan-700 font-medium"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  (33) 98606-1427
                </a>
              </p>
            </div>
          </Card>
        </div>
      )
    }

    return this.props.children
  }
}

/**
 * HOC para envolver componentes com Error Boundary
 */
export function withErrorBoundary<P extends object>(
  Component: React.ComponentType<P>,
  errorBoundaryProps?: Omit<ErrorBoundaryProps, 'children'>
) {
  const WrappedComponent = (props: P) => (
    <DashboardErrorBoundary {...errorBoundaryProps}>
      <Component {...props} />
    </DashboardErrorBoundary>
  )

  WrappedComponent.displayName = `withErrorBoundary(${
    Component.displayName || Component.name || 'Component'
  })`

  return WrappedComponent
}
