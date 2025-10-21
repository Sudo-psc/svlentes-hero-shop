'use client'

import React, { Component, ErrorInfo, ReactNode } from 'react'
import { CreditCard, AlertTriangle, RefreshCw, Phone, Shield } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface Props {
  children: ReactNode
  fallback?: ReactNode
  onError?: (error: Error, errorInfo: ErrorInfo) => void
  paymentContext?: 'checkout' | 'subscription' | 'update' | 'refund'
}

interface State {
  hasError: boolean
  error?: Error
  errorInfo?: ErrorInfo
  retryCount: number
  paymentFailed: boolean
}

export class PaymentErrorBoundary extends Component<Props, State> {
  private maxRetries = 2

  constructor(props: Props) {
    super(props)
    this.state = {
      hasError: false,
      retryCount: 0,
      paymentFailed: false
    }
  }

  static getDerivedStateFromError(error: Error): State {
    // Detectar se é um erro relacionado a pagamento
    const paymentFailed = error.message.toLowerCase().includes('payment') ||
                         error.message.toLowerCase().includes('stripe') ||
                         error.message.toLowerCase().includes('asaas') ||
                         error.message.toLowerCase().includes('cartão')

    return {
      hasError: true,
      error,
      retryCount: 0,
      paymentFailed
    }
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('PaymentErrorBoundary caught an error:', error, errorInfo)
    
    this.setState({
      error,
      errorInfo
    })

    // Registrar erro em serviço de monitoring com contexto de pagamento
    if (typeof window !== 'undefined' && window.gtag) {
      window.gtag('event', 'exception', {
        description: error.message,
        fatal: false,
        custom_map: {
          component: 'payment',
          context: this.props.paymentContext || 'unknown',
          stack: error.stack
        }
      })

      // Evento específico para falha de pagamento
      if (this.state.paymentFailed) {
        window.gtag('event', 'payment_error', {
          error_message: error.message,
          payment_context: this.props.paymentContext
        })
      }
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
        retryCount: prevState.retryCount + 1,
        paymentFailed: false
      }))
    }
  }

  handleTryAlternativePayment = () => {
    // Redirecionar para método alternativo
    const alternativeMethods = {
      'checkout': '/planos',
      'subscription': '/assinar',
      'update': '/area-assinante/assinatura',
      'refund': '/area-assinante/pagamentos'
    }
    
    const target = alternativeMethods[this.props.paymentContext || 'checkout'] || '/planos'
    window.location.href = target
  }

  handleContactSupport = () => {
    // Abrir WhatsApp com mensagem pré-definida
    const message = encodeURIComponent('Olá! Estou com problemas no pagamento. Podem me ajudar?')
    window.location.href = `https://wa.me/553399887765?text=${message}`
  }

  handleSecurePayment = () => {
    // Redirecionar para checkout seguro
    window.location.href = '/checkout-seguro'
  }

  getContextTitle = () => {
    const titles = {
      'checkout': 'Erro no Pagamento',
      'subscription': 'Erro na Assinatura',
      'update': 'Erro na Atualização',
      'refund': 'Erro no Reembolso'
    }
    return titles[this.props.paymentContext || 'checkout'] || 'Erro no Pagamento'
  }

  getContextMessage = () => {
    const messages = {
      'checkout': 'Ocorreu um erro ao processar seu pagamento. Não se preocupe, sua compra não foi finalizada.',
      'subscription': 'Houve um problema ao ativar sua assinatura. Seus dados estão seguros.',
      'update': 'Não foi possível atualizar suas informações de pagamento.',
      'refund': 'Ocorreu um erro ao processar sua solicitação de reembolso.'
    }
    return messages[this.props.paymentContext || 'checkout'] || 'Ocorreu um erro no processamento do pagamento.'
  }

  render() {
    if (this.state.hasError) {
      // Fallback personalizado fornecido
      if (this.props.fallback) {
        return this.props.fallback
      }

      // UI específica para erros de pagamento
      return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
          <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-6">
            <div className="text-center">
              {/* Icone de erro de pagamento */}
              <div className="mx-auto w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
                {this.state.paymentFailed ? (
                  <CreditCard className="w-8 h-8 text-red-600" />
                ) : (
                  <AlertTriangle className="w-8 h-8 text-red-600" />
                )}
              </div>

              <h1 className="text-2xl font-bold text-gray-900 mb-2">
                {this.getContextTitle()}
              </h1>
              
              <p className="text-gray-600 mb-6">
                {this.getContextMessage()}
              </p>

              {/* Badge de segurança */}
              <div className="flex items-center justify-center space-x-2 mb-6">
                <Shield className="w-4 h-4 text-green-600" />
                <span className="text-sm text-green-600">
                  Seus dados estão seguros
                </span>
              </div>

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
                    <div className="mb-2">
                      <strong>Contexto:</strong> {this.props.paymentContext}
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

              {/* Ações específicas do contexto */}
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
                    Não foi possível concluir a operação. Tente uma alternativa abaixo.
                  </div>
                )}

                {/* Ações alternativas */}
                <div className="space-y-2">
                  {this.props.paymentContext === 'checkout' && (
                    <Button
                      onClick={this.handleSecurePayment}
                      variant="outline"
                      className="w-full flex items-center justify-center space-x-2"
                    >
                      <Shield className="w-4 h-4" />
                      <span>Checkout Seguro Alternativo</span>
                    </Button>
                  )}

                  <Button
                    onClick={this.handleTryAlternativePayment}
                    variant="outline"
                    className="w-full flex items-center justify-center space-x-2"
                  >
                    <CreditCard className="w-4 h-4" />
                    <span>Outro Método de Pagamento</span>
                  </Button>

                  <Button
                    onClick={this.handleContactSupport}
                    variant="outline"
                    className="w-full flex items-center justify-center space-x-2 text-green-600 border-green-600 hover:bg-green-50"
                  >
                    <Phone className="w-4 h-4" />
                    <span> Suporte via WhatsApp</span>
                  </Button>
                </div>
              </div>

              {/* Informações de segurança */}
              <div className="mt-6 pt-6 border-t border-gray-200">
                <div className="flex items-center justify-center space-x-4 mb-3">
                  <div className="flex items-center space-x-1">
                    <Shield className="w-4 h-4 text-green-600" />
                    <span className="text-xs text-gray-600">SSL</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <CreditCard className="w-4 h-4 text-blue-600" />
                    <span className="text-xs text-gray-600">PCI</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <AlertTriangle className="w-4 h-4 text-yellow-600" />
                    <span className="text-xs text-gray-600">3D Secure</span>
                  </div>
                </div>
                <p className="text-xs text-gray-500">
                  Pagamento processado com segurança por Stripe e ASAAS
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
export const usePaymentErrorBoundary = (context?: string) => {
  const handleError = React.useCallback((error: Error, errorInfo: ErrorInfo) => {
    // Lógica personalizada de tratamento de erro de pagamento
    console.error('Payment error handled by hook:', error, errorInfo)
    
    // Registrar contexto adicional
    if (typeof window !== 'undefined' && window.gtag) {
      window.gtag('event', 'payment_error_handled', {
        error_message: error.message,
        payment_context: context,
        timestamp: new Date().toISOString()
      })
    }
  }, [context])

  return { handleError }
}

// Componente de fallback inline para pagamentos
export const PaymentFallback = ({ 
  onRetry,
  context = 'checkout'
}: { 
  onRetry?: () => void
  context?: string
}) => (
  <div className="bg-red-50 border border-red-200 rounded-lg p-4">
    <div className="flex items-start space-x-3">
      <CreditCard className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
      <div className="flex-1">
        <h3 className="text-sm font-medium text-red-800">
          Problema no pagamento
        </h3>
        <p className="text-sm text-red-700 mt-1">
          Não foi possível processar o pagamento no momento.
        </p>
        {onRetry && (
          <Button
            onClick={onRetry}
            size="sm"
            variant="outline"
            className="mt-2 text-red-700 border-red-300 hover:bg-red-100"
          >
            <RefreshCw className="w-3 h-3 mr-1" />
            Tentar novamente
          </Button>
        )}
      </div>
    </div>
  </div>
)

// Componente para mostrar status de pagamento seguro
export const SecurePaymentBadge = () => (
  <div className="flex items-center space-x-2 text-xs text-gray-600">
    <Shield className="w-3 h-3 text-green-600" />
    <span>Pagamento 100% seguro</span>
  </div>
)
