'use client'
import React, { Component, ReactNode, ErrorInfo } from 'react'
import { useResilientSubscription } from '@/hooks/useResilientSubscription'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import {
  Wifi,
  WifiOff,
  Database,
  RefreshCw,
  AlertTriangle,
  CheckCircle,
  Clock,
  Activity
} from 'lucide-react'
interface Props {
  children: ReactNode
  fallback?: ReactNode
}
interface State {
  hasError: boolean
  error?: Error
  errorInfo?: ErrorInfo
}
/**
 * Error Boundary para dashboard do assinante
 */
class ResilientDashboardErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false }
  }
  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }
  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('[ResilientDashboard] Error caught:', error, errorInfo)
    this.setState({ error, errorInfo })
    // Enviar erro para monitoring (se disponível)
    if (typeof window !== 'undefined' && (window as any).Sentry) {
      (window as any).Sentry.captureException(error, {
        contexts: {
          react: {
            componentStack: errorInfo.componentStack
          }
        }
      })
    }
  }
  handleRetry = () => {
    this.setState({ hasError: false, error: undefined, errorInfo: undefined })
  }
  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback
      }
      return (
        <div className="min-h-screen bg-gradient-to-br from-cyan-50 to-silver-50 flex items-center justify-center p-4">
          <div className="max-w-md w-full bg-white rounded-xl shadow-lg p-6">
            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <AlertTriangle className="w-8 h-8 text-red-600" />
              </div>
              <h2 className="text-xl font-semibold text-gray-900 mb-2">
                Ops! Algo deu errado
              </h2>
              <p className="text-gray-600 text-sm">
                O sistema encontrou um erro inesperado. Tente novamente ou contate o suporte.
              </p>
            </div>
            <div className="space-y-3">
              <Button onClick={this.handleRetry} className="w-full">
                <RefreshCw className="w-4 h-4 mr-2" />
                Tentar Novamente
              </Button>
              <details className="text-left">
                <summary className="text-sm text-gray-500 cursor-pointer hover:text-gray-700">
                  Detalhes do erro
                </summary>
                <div className="mt-2 p-3 bg-gray-100 rounded text-xs font-mono text-gray-700 max-h-32 overflow-auto">
                  {this.state.error?.message}
                </div>
              </details>
            </div>
          </div>
        </div>
      )
    }
    return this.props.children
  }
}
/**
 * Componente de status de conexão e redundância
 */
function ConnectionStatus() {
  const {
    isOnline,
    isUsingFallback,
    isUsingCache,
    connectionStats,
    retryConnection,
    clearCache
  } = useResilientSubscription()
  return (
    <div className="fixed top-4 right-4 z-50 space-y-2">
      {/* Status de Conexão */}
      <Alert className={`max-w-sm ${
        isOnline && !isUsingFallback
          ? 'border-green-200 bg-green-50'
          : isUsingFallback
          ? 'border-yellow-200 bg-yellow-50'
          : 'border-red-200 bg-red-50'
      }`}>
        <div className="flex items-center gap-2">
          {isOnline && !isUsingFallback ? (
            <>
              <Wifi className="w-4 h-4 text-green-600" />
              <CheckCircle className="w-4 h-4 text-green-600" />
              <span className="text-sm font-medium text-green-800">Conectado</span>
            </>
          ) : isUsingFallback ? (
            <>
              <Database className="w-4 h-4 text-yellow-600" />
              <span className="text-sm font-medium text-yellow-800">
                {isUsingCache ? 'Modo Cache' : 'Modo Offline'}
              </span>
            </>
          ) : (
            <>
              <WifiOff className="w-4 h-4 text-red-600" />
              <AlertTriangle className="w-4 h-4 text-red-600" />
              <span className="text-sm font-medium text-red-800">Offline</span>
            </>
          )}
        </div>
        {/* Ações rápidas */}
        {(isUsingFallback || !isOnline) && (
          <div className="mt-2 flex gap-2">
            {isOnline && (
              <Button size="sm" variant="outline" onClick={retryConnection}>
                <RefreshCw className="w-3 h-3 mr-1" />
                Reconectar
              </Button>
            )}
            <Button size="sm" variant="outline" onClick={clearCache}>
              Limpar Cache
            </Button>
          </div>
        )}
      </Alert>
      {/* Estatísticas Detalhadas (em modo desenvolvimento) */}
      {process.env.NODE_ENV === 'development' && (
        <Alert className="max-w-sm border-blue-200 bg-blue-50">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Activity className="w-4 h-4 text-blue-600" />
              <span className="text-sm font-medium text-blue-800">Stats</span>
            </div>
            <div className="text-xs text-blue-700 space-y-1">
              <div className="flex justify-between">
                <span>Tentativas:</span>
                <span>{connectionStats.totalAttempts}</span>
              </div>
              <div className="flex justify-between">
                <span>Sucesso:</span>
                <span>{connectionStats.successfulAttempts}</span>
              </div>
              <div className="flex justify-between">
                <span>Falhas:</span>
                <span>{connectionStats.failedAttempts}</span>
              </div>
              <div className="flex justify-between">
                <span>Tempo médio:</span>
                <span>{Math.round(connectionStats.averageResponseTime)}ms</span>
              </div>
              {connectionStats.lastSuccessfulFetch && (
                <div className="flex justify-between">
                  <span>Último sucesso:</span>
                  <span>{new Date(connectionStats.lastSuccessfulFetch).toLocaleTimeString()}</span>
                </div>
              )}
            </div>
          </div>
        </Alert>
      )}
    </div>
  )
}
/**
 * Componente de degradação graceful
 */
function GracefulDegradation({ children }: { children: ReactNode }) {
  const { isUsingFallback, isUsingCache, error, loading } = useResilientSubscription()
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-cyan-50 to-silver-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Carregando...</p>
        </div>
      </div>
    )
  }
  if (error && !isUsingFallback) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-cyan-50 to-silver-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-xl shadow-lg p-6">
          <div className="text-center mb-6">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <AlertTriangle className="w-8 h-8 text-red-600" />
            </div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              Falha na Conexão
            </h2>
            <p className="text-gray-600 text-sm mb-4">
              Não foi possível carregar seus dados. Verifique sua conexão e tente novamente.
            </p>
          </div>
          {/* Mostrar dados em cache se disponível */}
          {isUsingCache && (
            <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded">
              <p className="text-sm text-yellow-800">
                <Clock className="w-4 h-4 inline mr-1" />
                Exibindo dados em cache. Podem não estar atualizados.
              </p>
            </div>
          )}
          {children}
        </div>
      </div>
    )
  }
  return (
    <div className={isUsingFallback ? 'opacity-75' : ''}>
      {children}
    </div>
  )
}
/**
 * Wrapper principal do dashboard resiliente
 */
export function ResilientDashboardWrapper({ children, fallback }: Props) {
  return (
    <ResilientDashboardErrorBoundary fallback={fallback}>
      <GracefulDegradation>
        {children}
        <ConnectionStatus />
      </GracefulDegradation>
    </ResilientDashboardErrorBoundary>
  )
}
export { ResilientDashboardErrorBoundary, ConnectionStatus, GracefulDegradation }