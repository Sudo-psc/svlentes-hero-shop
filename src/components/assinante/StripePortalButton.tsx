'use client'
import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Settings, ExternalLink, Loader2, AlertCircle, CreditCard, Receipt } from 'lucide-react'
import { useStripePortal } from '@/hooks/useStripePortal'
import { cn } from '@/lib/utils'

interface StripePortalButtonProps {
  variant?: 'default' | 'outline' | 'secondary' | 'ghost'
  size?: 'sm' | 'default' | 'lg'
  fullWidth?: boolean
  showIcon?: boolean
  children?: React.ReactNode
  className?: string
  returnUrl?: string
}

/**
 * Stripe Portal Button Component
 * 
 * Pre-configured button that securely redirects users to the Stripe Customer Portal
 * for managing subscriptions, payment methods, invoices, and billing information.
 * 
 * Features:
 * - Secure token-based authentication
 * - Loading states with visual feedback
 * - Error handling with user-friendly messages
 * - Accessibility (WCAG 2.1 AA compliant)
 * - Responsive design
 * 
 * @example
 * ```tsx
 * // Default button
 * <StripePortalButton />
 * 
 * // Custom variant
 * <StripePortalButton variant="outline" size="lg" fullWidth />
 * 
 * // Custom return URL
 * <StripePortalButton returnUrl="/area-assinante/dashboard?tab=payment" />
 * 
 * // Custom content
 * <StripePortalButton>
 *   Gerenciar Minha Assinatura
 * </StripePortalButton>
 * ```
 * 
 * @author Dr. Philipe Saraiva Cruz
 */
export function StripePortalButton({
  variant = 'default',
  size = 'default',
  fullWidth = false,
  showIcon = true,
  children,
  className,
  returnUrl,
}: StripePortalButtonProps) {
  const { openPortal, isLoading, error, isAvailable } = useStripePortal()
  const [showError, setShowError] = useState(false)
  useEffect(() => {
    if (!error) {
      setShowError(false)
      return
    }

    setShowError(true)
    const timeoutId = window.setTimeout(() => setShowError(false), 6000)

    return () => {
      window.clearTimeout(timeoutId)
    }
  }, [error])

  const handleClick = async () => {
    setShowError(false)
    await openPortal(returnUrl)
  }

  if (!isAvailable) {
    return null
  }

  return (
    <div className={cn('relative', fullWidth && 'w-full')}>
      <motion.div
        whileHover={{ scale: isLoading ? 1 : 1.02 }}
        whileTap={{ scale: isLoading ? 1 : 0.98 }}
      >
        <Button
          variant={variant}
          size={size}
          onClick={handleClick}
          disabled={isLoading}
          className={cn(
            'relative overflow-hidden transition-all duration-300',
            fullWidth && 'w-full',
            className
          )}
          aria-label="Abrir portal de gerenciamento de assinatura Stripe"
          aria-busy={isLoading}
        >
          {/* Background gradient animation */}
          <motion.div
            className="absolute inset-0 bg-gradient-to-r from-cyan-500/0 via-cyan-500/10 to-cyan-500/0"
            animate={{
              x: isLoading ? ['-100%', '100%'] : 0,
            }}
            transition={{
              duration: 1.5,
              repeat: isLoading ? Infinity : 0,
              ease: 'linear',
            }}
          />

          {/* Content */}
          <span className="relative flex items-center gap-2">
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
            ) : showIcon ? (
              <div className="relative">
                <Settings className="h-4 w-4" aria-hidden="true" />
                <ExternalLink className="h-2.5 w-2.5 absolute -top-1 -right-1" aria-hidden="true" />
              </div>
            ) : null}
            
            <span>
              {isLoading 
                ? 'Carregando portal...' 
                : children || 'Gerenciar Assinatura'
              }
            </span>
          </span>
        </Button>
      </motion.div>

      {/* Error message */}
      {showError && error && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          className="absolute left-0 right-0 top-full mt-2 z-50"
          role="alert"
          aria-live="assertive"
        >
          <div className="bg-red-50 border border-red-200 rounded-lg p-3 shadow-lg">
            <div className="flex items-start gap-2">
              <AlertCircle className="h-4 w-4 text-red-600 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="text-sm font-medium text-red-900">
                  Erro ao abrir portal
                </p>
                <p className="text-xs text-red-700 mt-1">
                  {error}
                </p>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </div>
  )
}

/**
 * Compact Stripe Portal Button (Icon only)
 */
export function StripePortalIconButton({
  className,
  returnUrl,
}: Pick<StripePortalButtonProps, 'className' | 'returnUrl'>) {
  const { openPortal, isLoading, isAvailable } = useStripePortal()

  if (!isAvailable) {
    return null
  }

  return (
    <motion.div
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
    >
      <Button
        variant="outline"
        size="icon"
        onClick={() => openPortal(returnUrl)}
        disabled={isLoading}
        className={cn('relative', className)}
        aria-label="Gerenciar assinatura no Stripe"
      >
        {isLoading ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <div className="relative">
            <Settings className="h-4 w-4" />
            <ExternalLink className="h-2 w-2 absolute -top-0.5 -right-0.5" />
          </div>
        )}
      </Button>
    </motion.div>
  )
}

/**
 * Stripe Portal Card Button (for dashboard quick actions)
 */
export function StripePortalCard({
  className,
  returnUrl,
}: Pick<StripePortalButtonProps, 'className' | 'returnUrl'>) {
  const { openPortal, isLoading, isAvailable } = useStripePortal()

  if (!isAvailable) {
    return null
  }

  return (
    <motion.button
      onClick={() => openPortal(returnUrl)}
      disabled={isLoading}
      whileHover={{ y: -2, boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
      whileTap={{ scale: 0.98 }}
      className={cn(
        'relative w-full p-6 bg-gradient-to-br from-cyan-50 to-blue-50',
        'border-2 border-cyan-200 rounded-xl',
        'hover:border-cyan-400 transition-all duration-300',
        'disabled:opacity-50 disabled:cursor-not-allowed',
        'text-left group',
        className
      )}
    >
      {/* Icon */}
      <div className="flex items-start justify-between mb-3">
        <div className="p-3 bg-white rounded-lg shadow-sm group-hover:shadow-md transition-shadow">
          <CreditCard className="h-6 w-6 text-cyan-600" />
        </div>
        {isLoading ? (
          <Loader2 className="h-5 w-5 text-cyan-600 animate-spin" />
        ) : (
          <ExternalLink className="h-5 w-5 text-cyan-600 opacity-0 group-hover:opacity-100 transition-opacity" />
        )}
      </div>

      {/* Content */}
      <h3 className="text-lg font-semibold text-gray-900 mb-1">
        Portal Stripe
      </h3>
      <p className="text-sm text-gray-600 mb-4">
        Gerencie sua assinatura, pagamentos e faturas
      </p>

      {/* Features list */}
      <ul className="space-y-1 text-xs text-gray-500">
        <li className="flex items-center gap-2">
          <Receipt className="h-3 w-3" />
          <span>Visualizar faturas e histórico</span>
        </li>
        <li className="flex items-center gap-2">
          <CreditCard className="h-3 w-3" />
          <span>Atualizar métodos de pagamento</span>
        </li>
        <li className="flex items-center gap-2">
          <Settings className="h-3 w-3" />
          <span>Alterar plano ou cancelar</span>
        </li>
      </ul>

      {/* Loading overlay */}
      {isLoading && (
        <div className="absolute inset-0 bg-white/50 backdrop-blur-sm rounded-xl flex items-center justify-center">
          <div className="text-center">
            <Loader2 className="h-6 w-6 animate-spin text-cyan-600 mx-auto mb-2" />
            <p className="text-sm text-gray-600">Abrindo portal...</p>
          </div>
        </div>
      )}
    </motion.button>
  )
}
