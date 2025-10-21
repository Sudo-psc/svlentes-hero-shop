/**
 * Lazy Loading Components for Payment
 * Implementa code splitting para componentes de pagamento pesados
 */
import React from 'react'
import dynamic from 'next/dynamic'
import { Loader2, CreditCard, Shield } from 'lucide-react'

// Loading component para pagamento
const PaymentLoader = () => (
  <div className="flex items-center justify-center p-8 min-h-[200px]">
    <div className="flex flex-col items-center space-y-4">
      <Loader2 className="h-8 w-8 animate-spin text-cyan-600" />
      <p className="text-sm text-gray-600">Carregando pagamento...</p>
      <div className="flex items-center space-x-2 text-xs text-gray-500">
        <Shield className="w-3 h-3" />
        <span>Ambiente seguro</span>
      </div>
    </div>
  </div>
)

// Error component para pagamento
const PaymentError = ({ error }: { error: Error }) => (
  <div className="flex items-center justify-center p-8 min-h-[200px]">
    <div className="text-center">
      <div className="text-red-600 mb-4">
        <CreditCard className="h-12 w-12 mx-auto" />
      </div>
      <h3 className="text-lg font-semibold text-gray-900 mb-2">Erro no pagamento</h3>
      <p className="text-sm text-gray-600 mb-4">{error.message}</p>
      <button 
        onClick={() => window.location.reload()}
        className="px-4 py-2 bg-cyan-600 text-white rounded-lg hover:bg-cyan-700 transition-colors"
      >
        Tentar novamente
      </button>
    </div>
  </div>
)

// Lazy Components de pagamento com loading e error states
export const LazyPaymentForm = dynamic(
  () => import('./PaymentForm').then(mod => ({ default: mod.PaymentForm })),
  {
    loading: PaymentLoader,
    ssr: false
  }
)

export const LazyStripeCheckout = dynamic(
  () => import('./StripeCheckout').then(mod => ({ default: mod.StripeCheckout })),
  {
    loading: PaymentLoader,
    ssr: false
  }
)

export const LazyAsaasPayment = dynamic(
  () => import('./AsaasPayment').then(mod => ({ default: mod.AsaasPayment })),
  {
    loading: PaymentLoader,
    ssr: false
  }
)

export const LazyPaymentMethods = dynamic(
  () => import('./PaymentMethods').then(mod => ({ default: mod.PaymentMethods })),
  {
    loading: PaymentLoader,
    ssr: false
  }
)

export const LazyPaymentSummary = dynamic(
  () => import('./PaymentSummary').then(mod => ({ default: mod.PaymentSummary })),
  {
    loading: PaymentLoader,
    ssr: false
  }
)

export const LazyBillingForm = dynamic(
  () => import('./BillingForm').then(mod => ({ default: mod.BillingForm })),
  {
    loading: PaymentLoader,
    ssr: false
  }
)

export const LazyCouponForm = dynamic(
  () => import('./CouponForm').then(mod => ({ default: mod.CouponForm })),
  {
    loading: PaymentLoader,
    ssr: false
  }
)

// Component wrapper com security badge
export const SecurePaymentWrapper = ({ 
  children, 
  showSecurityBadge = true 
}: { 
  children: React.ReactNode
  showSecurityBadge?: boolean 
}) => {
  return (
    <div className="secure-payment-wrapper">
      {showSecurityBadge && (
        <div className="flex items-center justify-center space-x-2 mb-4 text-xs text-gray-600">
          <Shield className="w-3 h-3 text-green-600" />
          <span>Pagamento 100% seguro</span>
        </div>
      )}
      {children}
      <div className="mt-4 pt-4 border-t border-gray-200">
        <div className="flex items-center justify-center space-x-4 text-xs text-gray-500">
          <div className="flex items-center space-x-1">
            <Shield className="w-3 h-3 text-green-600" />
            <span>SSL</span>
          </div>
          <div className="flex items-center space-x-1">
            <CreditCard className="w-3 h-3 text-blue-600" />
            <span>PCI</span>
          </div>
          <span>Stripe & ASAAS</span>
        </div>
      </div>
    </div>
  )
}

// Componente de fallback para pagamento
export const PaymentFallback = ({ 
  onRetry 
}: { 
  onRetry?: () => void 
}) => (
  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
    <div className="flex items-center space-x-3">
      <CreditCard className="w-5 h-5 text-yellow-600 flex-shrink-0" />
      <div className="flex-1">
        <h3 className="text-sm font-medium text-yellow-800">
          Problema no pagamento
        </h3>
        <p className="text-sm text-yellow-700 mt-1">
          Não foi possível carregar o formulário de pagamento no momento.
        </p>
        {onRetry && (
          <button
            onClick={onRetry}
            className="mt-2 px-3 py-1 text-xs bg-yellow-600 text-white rounded hover:bg-yellow-700 transition-colors"
          >
            Tentar novamente
          </button>
        )}
      </div>
    </div>
  </div>
)

// Hook para detectar quando componentes de pagamento estão visíveis
export const usePaymentIntersection = (elementRef: React.RefObject<HTMLElement>) => {
  const [isVisible, setIsVisible] = React.useState(false)

  React.useEffect(() => {
    const element = elementRef.current
    if (!element) return

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true)
          observer.disconnect()
        }
      },
      { threshold: 0.1 }
    )

    observer.observe(element)
    return () => observer.disconnect()
  }, [elementRef])

  return isVisible
}

// Componente que carrega pagamento apenas quando visível
export const LazyPaymentOnDemand = ({ 
  children,
  fallback = <PaymentLoader />
}: { 
  children: React.ReactNode
  fallback?: React.ReactNode 
}) => {
  const ref = React.useRef<HTMLDivElement>(null)
  const isVisible = usePaymentIntersection(ref)

  return (
    <div ref={ref}>
      {isVisible ? children : fallback}
    </div>
  )
}
