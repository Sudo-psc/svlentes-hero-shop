'use client'

import React, { Component, ErrorInfo, ReactNode } from 'react'

interface Props {
  children: ReactNode
  fallback?: ReactNode
}

interface State {
  hasError: boolean
  error: Error | null
  errorInfo: ErrorInfo | null
}

/**
 * Error Boundary Component
 *
 * Catches React errors including hydration mismatches
 * Provides fallback UI and error logging
 */
export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    }
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    // Update state so next render shows fallback UI
    return {
      hasError: true,
      error,
    }
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Log error details
    console.error('🚨 ErrorBoundary caught an error:', {
      error,
      errorInfo,
      componentStack: errorInfo.componentStack,
    })

    this.setState({
      error,
      errorInfo,
    })

    // Check if it's a hydration error
    const isHydrationError =
      error.message?.includes('Hydration') ||
      error.message?.includes('did not match') ||
      error.message?.includes('server-rendered HTML')

    if (isHydrationError) {
      console.error('🚨 HYDRATION ERROR DETECTED:', {
        message: error.message,
        stack: error.stack,
        componentStack: errorInfo.componentStack,
      })

      // Send to monitoring service
      this.reportToMonitoring(error, errorInfo, 'hydration')
    } else {
      // Send other errors to monitoring
      this.reportToMonitoring(error, errorInfo, 'runtime')
    }
  }

  private reportToMonitoring(error: Error, errorInfo: ErrorInfo, type: string) {
    // Send to Sentry or similar service
    if (typeof window !== 'undefined' && (window as any).Sentry) {
      (window as any).Sentry.captureException(error, {
        tags: {
          type: `error_boundary_${type}`,
        },
        contexts: {
          react: {
            componentStack: errorInfo.componentStack,
          },
        },
      })
    }

    // Send to custom analytics
    if (typeof window !== 'undefined' && (window as any).gtag) {
      (window as any).gtag('event', 'exception', {
        description: error.message,
        fatal: true,
        error_type: type,
      })
    }
  }

  private handleReload = () => {
    // Clear any cached data
    if (typeof window !== 'undefined') {
      // Clear session storage
      sessionStorage.clear()

      // Clear relevant localStorage keys (preserve user preferences)
      const keysToPreserve = ['theme', 'language', 'consent']
      const localStorageBackup: Record<string, string> = {}

      keysToPreserve.forEach(key => {
        const value = localStorage.getItem(key)
        if (value) localStorageBackup[key] = value
      })

      localStorage.clear()

      // Restore preserved keys
      Object.entries(localStorageBackup).forEach(([key, value]) => {
        localStorage.setItem(key, value)
      })

      // Reload the page
      window.location.reload()
    }
  }

  private handleGoHome = () => {
    if (typeof window !== 'undefined') {
      window.location.href = '/'
    }
  }

  render() {
    if (this.state.hasError) {
      // Custom fallback UI if provided
      if (this.props.fallback) {
        return this.props.fallback
      }

      // Default fallback UI
      return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-50 to-red-100 p-4">
          <div className="max-w-lg w-full bg-white shadow-2xl rounded-2xl p-8">
            <div className="text-center mb-6">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-red-100 rounded-full mb-4">
                <svg
                  className="w-8 h-8 text-red-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                  />
                </svg>
              </div>
              <h1 className="text-2xl font-bold text-gray-900 mb-2">
                Algo deu errado
              </h1>
              <p className="text-gray-600">
                Ocorreu um erro inesperado. Por favor, tente recarregar a página.
              </p>
            </div>

            <div className="space-y-3">
              <button
                onClick={this.handleReload}
                className="w-full bg-red-600 hover:bg-red-700 text-white font-medium py-3 px-4 rounded-lg transition-colors duration-200 flex items-center justify-center"
              >
                <svg
                  className="w-5 h-5 mr-2"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                  />
                </svg>
                Recarregar Página
              </button>

              <button
                onClick={this.handleGoHome}
                className="w-full bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium py-3 px-4 rounded-lg transition-colors duration-200"
              >
                Voltar para Início
              </button>
            </div>

            {process.env.NODE_ENV === 'development' && this.state.error && (
              <details className="mt-6 bg-gray-50 rounded-lg p-4">
                <summary className="cursor-pointer text-sm font-medium text-gray-700 hover:text-gray-900">
                  Detalhes Técnicos
                </summary>
                <div className="mt-3 space-y-2">
                  <div>
                    <p className="text-xs font-semibold text-gray-600 mb-1">Erro:</p>
                    <pre className="text-xs bg-white p-2 rounded border border-gray-200 overflow-auto">
                      {this.state.error.toString()}
                    </pre>
                  </div>
                  {this.state.error.stack && (
                    <div>
                      <p className="text-xs font-semibold text-gray-600 mb-1">Stack:</p>
                      <pre className="text-xs bg-white p-2 rounded border border-gray-200 overflow-auto max-h-40">
                        {this.state.error.stack}
                      </pre>
                    </div>
                  )}
                  {this.state.errorInfo?.componentStack && (
                    <div>
                      <p className="text-xs font-semibold text-gray-600 mb-1">Component Stack:</p>
                      <pre className="text-xs bg-white p-2 rounded border border-gray-200 overflow-auto max-h-40">
                        {this.state.errorInfo.componentStack}
                      </pre>
                    </div>
                  )}
                </div>
              </details>
            )}

            <p className="text-xs text-gray-500 text-center mt-6">
              Se o problema persistir, entre em contato com o suporte.
            </p>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}
