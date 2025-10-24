/**
 * Phase 3 Error Boundary
 * React Error Boundary específico para features da Fase 3
 *
 * Features:
 * - Isolamento de erros por componente
 * - Recovery automático
 * - Logging para monitoring (zero PII)
 * - UI de erro healthcare-grade
 * - Fallback para dashboard
 */

'use client'

import React, { Component, ReactNode } from 'react'
import { AlertTriangle, RefreshCw, Home, MessageCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { phase3Monitoring } from '@/lib/phase3-monitoring'

// ============================================================================
// TYPES
// ============================================================================

export type Phase3Component =
  | 'prescription-upload'
  | 'payment-history'
  | 'delivery-preferences'

interface Phase3ErrorBoundaryProps {
  children: ReactNode
  component: Phase3Component
  componentName: string
  fallback?: ReactNode
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void
}

interface Phase3ErrorBoundaryState {
  hasError: boolean
  error: Error | null
  errorInfo: React.ErrorInfo | null
  errorCount: number
}

// ============================================================================
// COMPONENT DISPLAY NAMES
// ============================================================================

const COMPONENT_DISPLAY_NAMES: Record<Phase3Component, string> = {
  'prescription-upload': 'Upload de Receita',
  'payment-history': 'Histórico de Pagamentos',
  'delivery-preferences': 'Preferências de Entrega',
}

const COMPONENT_DESCRIPTIONS: Record<Phase3Component, string> = {
  'prescription-upload':
    'Não foi possível carregar o sistema de upload de receitas.',
  'payment-history':
    'Não foi possível carregar o histórico de pagamentos.',
  'delivery-preferences':
    'Não foi possível carregar as preferências de entrega.',
}

const COMPONENT_FALLBACK_ACTIONS: Record<Phase3Component, string> = {
  'prescription-upload':
    'Você pode enviar sua receita diretamente pelo WhatsApp.',
  'payment-history':
    'Entre em contato para verificar seus pagamentos.',
  'delivery-preferences':
    'Entre em contato para atualizar seu endereço de entrega.',
}

// ============================================================================
// ERROR BOUNDARY CLASS
// ============================================================================

export class Phase3ErrorBoundary extends Component<
  Phase3ErrorBoundaryProps,
  Phase3ErrorBoundaryState
> {
  constructor(props: Phase3ErrorBoundaryProps) {
    super(props)
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      errorCount: 0,
    }
  }

  static getDerivedStateFromError(error: Error): Partial<Phase3ErrorBoundaryState> {
    return {
      hasError: true,
      error,
    }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // Update state
    this.setState((prevState) => ({
      errorInfo,
      errorCount: prevState.errorCount + 1,
    }))

    // Log to console
    console.error(
      `[Phase3ErrorBoundary][${this.props.component}] Caught error:`,
      error,
      errorInfo
    )

    // Log to Phase 3 monitoring (LGPD-compliant)
    this.logToMonitoring(error, errorInfo)

    // Callback if provided
    this.props.onError?.(error, errorInfo)
  }

  componentDidUpdate(prevProps: Phase3ErrorBoundaryProps) {
    // Reset error if component changes
    if (
      this.state.hasError &&
      this.props.component !== prevProps.component
    ) {
      this.resetError()
    }
  }

  logToMonitoring(error: Error, errorInfo: React.ErrorInfo) {
    const errorData = {
      component: this.props.component,
      componentName: this.props.componentName,
      message: error.message,
      stack: error.stack,
      componentStack: errorInfo.componentStack,
      errorCount: this.state.errorCount,
      timestamp: new Date().toISOString(),
      url: typeof window !== 'undefined' ? window.location.href : null,
    }

    // Log via Phase 3 monitoring (zero PII)
    console.error(`[Phase3Error][${this.props.component}]`, {
      component: this.props.component,
      errorType: error.name,
      errorCount: this.state.errorCount,
      timestamp: errorData.timestamp,
      // NO PII: não logar userId, dados pessoais, etc.
    })

    // Send to monitoring endpoint (non-blocking)
    fetch('/api/monitoring/errors', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        type: 'phase3_render_error',
        ...errorData,
      }),
      signal: AbortSignal.timeout(2000),
    }).catch(() => {
      // Silently fail - don't break error boundary
    })

    // Save to localStorage for debugging
    try {
      const errors = JSON.parse(
        localStorage.getItem('phase3-render-errors') || '[]'
      )
      errors.push(errorData)

      // Keep last 20 errors
      if (errors.length > 20) {
        errors.splice(0, errors.length - 20)
      }

      localStorage.setItem('phase3-render-errors', JSON.stringify(errors))
    } catch {
      // Ignore if localStorage not available
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

  goToDashboard = () => {
    if (typeof window !== 'undefined') {
      window.location.href = '/area-assinante/dashboard'
    }
  }

  openWhatsApp = () => {
    if (typeof window !== 'undefined') {
      window.open('https://wa.me/5533986061427', '_blank')
    }
  }

  render() {
    if (this.state.hasError) {
      // Use custom fallback if provided
      if (this.props.fallback) {
        return this.props.fallback
      }

      // Default error UI
      const displayName =
        COMPONENT_DISPLAY_NAMES[this.props.component] ||
        this.props.componentName
      const description =
        COMPONENT_DESCRIPTIONS[this.props.component] ||
        'Não foi possível carregar este componente.'
      const fallbackAction =
        COMPONENT_FALLBACK_ACTIONS[this.props.component] ||
        'Entre em contato com o suporte.'

      return (
        <Card className="p-6 bg-white shadow-sm">
          <div className="flex flex-col items-center text-center space-y-6">
            {/* Icon */}
            <div className="w-16 h-16 rounded-full bg-amber-100 flex items-center justify-center">
              <AlertTriangle className="w-8 h-8 text-amber-600" />
            </div>

            {/* Title */}
            <div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                Erro ao carregar {displayName}
              </h3>
              <p className="text-gray-600">{description}</p>
            </div>

            {/* Technical details (development only) */}
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

            {/* Multiple attempts warning */}
            {this.state.errorCount > 2 && (
              <div className="w-full bg-amber-50 border border-amber-200 rounded-lg p-4">
                <p className="text-sm text-amber-800">
                  <strong>Erro persistente:</strong> Este erro ocorreu{' '}
                  {this.state.errorCount} vezes. Recomendamos recarregar a
                  página ou entrar em contato com o suporte.
                </p>
              </div>
            )}

            {/* Alternative action */}
            <div className="w-full bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p className="text-sm text-blue-900">
                <strong>Solução alternativa:</strong> {fallbackAction}
              </p>
            </div>

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
                onClick={this.goToDashboard}
                variant="outline"
                className="flex items-center gap-2"
              >
                <Home className="w-4 h-4" />
                Voltar ao Dashboard
              </Button>

              <Button
                onClick={this.openWhatsApp}
                variant="outline"
                className="flex items-center gap-2 bg-[#25d366] text-white hover:bg-[#20bd5a]"
              >
                <MessageCircle className="w-4 h-4" />
                Suporte WhatsApp
              </Button>
            </div>

            {/* Support contact */}
            <p className="text-sm text-gray-500">
              Precisa de ajuda? Entre em contato:
              <br />
              <a
                href="https://wa.me/5533986061427"
                className="text-cyan-600 hover:text-cyan-700 font-medium"
                target="_blank"
                rel="noopener noreferrer"
              >
                WhatsApp: (33) 98606-1427
              </a>
            </p>
          </div>
        </Card>
      )
    }

    return this.props.children
  }
}

// ============================================================================
// HOC
// ============================================================================

/**
 * HOC to wrap components with Phase 3 Error Boundary
 */
export function withPhase3ErrorBoundary<P extends object>(
  Component: React.ComponentType<P>,
  component: Phase3Component,
  componentName?: string
) {
  const WrappedComponent = (props: P) => (
    <Phase3ErrorBoundary
      component={component}
      componentName={componentName || Component.displayName || Component.name}
    >
      <Component {...props} />
    </Phase3ErrorBoundary>
  )

  WrappedComponent.displayName = `withPhase3ErrorBoundary(${
    Component.displayName || Component.name || 'Component'
  })`

  return WrappedComponent
}
