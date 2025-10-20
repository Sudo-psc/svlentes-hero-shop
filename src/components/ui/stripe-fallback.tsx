'use client'
import { loadStripe } from '@stripe/stripe-js'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Loader2, CreditCard } from 'lucide-react'
interface StripeFallbackProps {
  planId: string
  customerEmail: string
  className?: string
}
const StripeFallback = ({
  planId,
  customerEmail,
  className
}: StripeFallbackProps) => {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const handleStripeCheckout = async () => {
    setIsLoading(true)
    setError(null)
    try {
      // Initialize Stripe with publishable key
      const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!)
      const stripe = await stripePromise
      if (!stripe) {
        throw new Error('Falha ao carregar o Stripe')
      }
      // Create checkout session on your server (server-side validation)
      const response = await fetch('/api/stripe/create-checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          planId,
          customerEmail,
        }),
      })
      const { sessionId, error: sessionError } = await response.json()
      if (sessionError) {
        throw new Error(sessionError)
      }
      if (!sessionId) {
        throw new Error('Falha ao criar sessão de pagamento')
      }
      // Redirect to Stripe Checkout
      const { error: redirectError } = await stripe.redirectToCheckout({
        sessionId,
      })
      if (redirectError) {
        throw new Error(redirectError.message)
      }
    } catch (err) {
      console.error('Stripe checkout error:', err)
      setError(err instanceof Error ? err.message : 'Erro ao processar pagamento com Stripe')
    } finally {
      setIsLoading(false)
    }
  }
  return (
    <div className={className}>
      <Button
        onClick={handleStripeCheckout}
        disabled={isLoading}
        className="w-full bg-blue-600 hover:bg-blue-700 text-white flex items-center gap-2"
        variant="default"
      >
        {isLoading ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : (
          <CreditCard className="w-4 h-4" />
        )}
        {isLoading ? 'Processando...' : 'Pagar com Stripe'}
      </Button>
      {error && (
        <div className="mt-2 text-sm text-red-600 text-center">
          {error}
        </div>
      )}
      <div className="mt-2 text-xs text-gray-500 text-center">
        Pagamento processado pelo Stripe • Opção alternativa ao Asaas
      </div>
    </div>
  )
}
export default StripeFallback