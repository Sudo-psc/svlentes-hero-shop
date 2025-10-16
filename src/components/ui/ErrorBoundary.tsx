'use client'

import React, { Component, ReactNode } from 'react'
import { AlertTriangle, RefreshCw, Home, Mail } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Card, CardContent } from '@/components/ui/card'

interface ErrorBoundaryProps {
  children: ReactNode
  fallback?: (error: Error, errorInfo: React.ErrorInfo, reset: () => void) => ReactNode
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void
}

interface ErrorBoundaryState {
  hasError: boolean
  error: Error | null
  errorInfo: React.ErrorInfo | null
}

/**
 * Error Boundary Component
 *
 * Catches JavaScript errors anywhere in child component tree and displays
 * a fallback UI with recovery actions instead of crashing the whole app.
 */
export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props)
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null
    }
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    return {
      hasError: true,
      error
    }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // Log error to error reporting service
    console.error('ErrorBoundary caught an error:', error, errorInfo)

    this.setState({
      error,
      errorInfo
    })

    // Call custom error handler if provided
    if (this.props.onError) {
      this.props.onError(error, errorInfo)
    }
  }

  handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null
    })
  }

  handleGoHome = () => {
    window.location.href = '/'
  }

  handleReload = () => {
    window.location.reload()
  }

  handleContactSupport = () => {
    window.location.href = 'mailto:saraivavision@gmail.com?subject=Erro%20na%20plataforma'
  }

  render() {
    if (this.state.hasError && this.state.error) {
      // Use custom fallback if provided
      if (this.props.fallback) {
        return this.props.fallback(
          this.state.error,
          this.state.errorInfo!,
          this.handleReset
        )
      }

      // Default error UI
      return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-50 to-orange-50 p-4">
          <Card className="max-w-2xl w-full">
            <CardContent className="p-8">
              <div className="flex flex-col items-center text-center">
                {/* Error Icon */}
                <div className="w-20 h-20 rounded-full bg-red-100 flex items-center justify-center mb-6">
                  <AlertTriangle className="w-10 h-10 text-red-600" />
                </div>

                {/* Error Message */}
                <h1 className="text-2xl font-bold text-gray-900 mb-3">
                  Ops! Algo deu errado
                </h1>
                <p className="text-gray-600 mb-6">
                  Ocorreu um erro inesperado. Não se preocupe, seus dados estão seguros.
                  Tente uma das opções abaixo para continuar.
                </p>

                {/* Error Details (only in development) */}
                {process.env.NODE_ENV === 'development' && (
                  <details className="w-full mb-6 text-left">
                    <summary className="cursor-pointer text-sm font-medium text-gray-700 mb-2">
                      Detalhes do erro (somente desenvolvimento)
                    </summary>
                    <div className="p-4 bg-gray-100 rounded-lg overflow-auto max-h-64">
                      <p className="text-xs font-mono text-red-700 mb-2">
                        {this.state.error.toString()}
                      </p>
                      {this.state.errorInfo && (
                        <pre className="text-xs text-gray-700 whitespace-pre-wrap">
                          {this.state.errorInfo.componentStack}
                        </pre>
                      )}
                    </div>
                  </details>
                )}

                {/* Recovery Actions */}
                <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
                  <Button
                    onClick={this.handleReset}
                    variant="primary"
                    className="flex items-center gap-2"
                  >
                    <RefreshCw className="w-4 h-4" />
                    Tentar Novamente
                  </Button>
                  <Button
                    onClick={this.handleGoHome}
                    variant="outline"
                    className="flex items-center gap-2"
                  >
                    <Home className="w-4 h-4" />
                    Ir para Início
                  </Button>
                  <Button
                    onClick={this.handleContactSupport}
                    variant="outline"
                    className="flex items-center gap-2"
                  >
                    <Mail className="w-4 h-4" />
                    Contatar Suporte
                  </Button>
                </div>

                {/* Additional Help */}
                <div className="mt-8 pt-6 border-t border-gray-200 w-full">
                  <p className="text-sm text-gray-500">
                    Se o problema persistir, entre em contato com nossa equipe:
                  </p>
                  <p className="text-sm font-medium text-cyan-600 mt-1">
                    saraivavision@gmail.com • WhatsApp: (33) 99898-026
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )
    }

    return this.props.children
  }
}

/**
 * Error Fallback Component
 *
 * A simpler inline error display for use in specific sections
 */
export function ErrorFallback({
  error,
  reset,
  title = 'Erro ao carregar',
  showDetails = false
}: {
  error: Error
  reset: () => void
  title?: string
  showDetails?: boolean
}) {
  return (
    <div className="flex flex-col items-center justify-center p-8 text-center">
      <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center mb-4">
        <AlertTriangle className="w-8 h-8 text-red-600" />
      </div>

      <h3 className="text-lg font-semibold text-gray-900 mb-2">
        {title}
      </h3>

      <p className="text-gray-600 mb-4 max-w-md">
        Ocorreu um erro ao carregar esta seção. Por favor, tente novamente.
      </p>

      {showDetails && process.env.NODE_ENV === 'development' && (
        <div className="w-full max-w-md mb-4 p-3 bg-red-50 rounded-lg text-left">
          <p className="text-xs font-mono text-red-700">
            {error.message}
          </p>
        </div>
      )}

      <Button onClick={reset} variant="primary" size="sm">
        <RefreshCw className="w-4 h-4 mr-2" />
        Tentar Novamente
      </Button>
    </div>
  )
}

/**
 * Higher-Order Component to wrap components with error boundary
 */
export function withErrorBoundary<P extends object>(
  Component: React.ComponentType<P>,
  errorBoundaryProps?: Omit<ErrorBoundaryProps, 'children'>
) {
  return function WithErrorBoundaryComponent(props: P) {
    return (
      <ErrorBoundary {...errorBoundaryProps}>
        <Component {...props} />
      </ErrorBoundary>
    )
  }
}

export default ErrorBoundary
