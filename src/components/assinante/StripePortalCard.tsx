'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import { useAuth } from '@/contexts/AuthContext'
import type { Subscription } from '@/types/subscription'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { CreditCard, ExternalLink, ShieldCheck } from 'lucide-react'

interface StripePortalCardProps {
  subscription: Subscription | null
  className?: string
}

export function StripePortalCard({ subscription, className }: StripePortalCardProps) {
  const { user: authUser } = useAuth()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)

  const paymentMethodLabel = useMemo(() => {
    if (!subscription?.paymentMethod) {
      return 'Não definido'
    }

    const methodMap: Record<string, string> = {
      CREDIT_CARD: 'Cartão de Crédito',
      DEBIT_CARD: 'Cartão de Débito',
      PIX: 'PIX',
      BOLETO: 'Boleto Bancário'
    }

    return methodMap[subscription.paymentMethod] || subscription.paymentMethod
  }, [subscription])

  const handlePortalRedirect = async () => {
    try {
      setIsLoading(true)
      setError(null)
      setSuccessMessage(null)

      const token = await authUser?.getIdToken()
      if (!token) {
        setError('Faça login novamente para gerenciar seus pagamentos.')
        return
      }

      const response = await fetch('/api/stripe/customer-portal', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      })

      if (!response.ok) {
        const payload = await response.json().catch(() => ({ error: 'Não foi possível abrir o portal do Stripe.' }))
        setError(payload.error || 'Não foi possível abrir o portal do Stripe.')
        return
      }

      const data = await response.json()
      if (!data?.portalUrl) {
        setError('Portal de pagamentos indisponível no momento.')
        return
      }

      setSuccessMessage('Redirecionando para o portal seguro do Stripe...')
      window.location.href = data.portalUrl
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro inesperado ao acessar o portal do Stripe.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Card className={className}>
      <CardHeader className="space-y-3">
        <div className="flex items-start justify-between gap-3">
          <div>
            <CardTitle className="text-xl font-semibold">Portal de Pagamentos Stripe</CardTitle>
            <CardDescription>Gerencie forma de pagamento, faturas e recibos em um ambiente seguro.</CardDescription>
          </div>
          <Badge variant="secondary" className="flex items-center gap-1 text-xs">
            <ShieldCheck className="h-3.5 w-3.5" />
            Stripe Secure
          </Badge>
        </div>
        <div className="flex items-center gap-2 rounded-lg border border-dashed border-cyan-200 bg-cyan-50/60 px-3 py-2 text-sm text-cyan-900">
          <CreditCard className="h-4 w-4 shrink-0" />
          <span>Pagamentos processados pela Stripe com conformidade PCI DSS.</span>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {!subscription && (
          <Alert variant="default" className="border-cyan-200 bg-cyan-50 text-cyan-900">
            <AlertTitle>Assinatura não encontrada</AlertTitle>
            <AlertDescription>
              Assine um plano para acessar o portal de pagamentos Stripe. Explore nossos planos em{' '}
              <Link href="/planos" className="font-semibold text-cyan-700 underline underline-offset-4">
                svlentes.com.br/planos
              </Link>.
            </AlertDescription>
          </Alert>
        )}
        {subscription && (
          <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <p className="text-sm font-medium text-slate-600">Forma de pagamento atual</p>
                <p className="text-base font-semibold text-slate-900">
                  {paymentMethodLabel}
                  {subscription.paymentMethodLast4 && (
                    <span className="ml-2 text-sm font-normal text-slate-500">•••• {subscription.paymentMethodLast4}</span>
                  )}
                </p>
              </div>
              <Badge variant="outline" className="uppercase tracking-wide text-slate-600">
                {subscription.plan.billingCycle === 'monthly' ? 'Cobrança Mensal' : 'Cobrança Recorrente'}
              </Badge>
            </div>
            <Separator className="my-4" />
            <p className="text-sm text-slate-600">
              No portal Stripe você pode atualizar cartão de crédito, gerar segundas vias e consultar comprovantes oficiais.
            </p>
          </div>
        )}
        {error && (
          <Alert variant="destructive">
            <AlertTitle>Não foi possível abrir o portal</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        {successMessage && (
          <Alert variant="default" className="border-cyan-200 bg-cyan-50 text-cyan-900">
            <AlertTitle>Aguarde um instante</AlertTitle>
            <AlertDescription>{successMessage}</AlertDescription>
          </Alert>
        )}
      </CardContent>
      <CardFooter className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="text-sm text-muted-foreground">
          Você será redirecionado para uma nova aba com autenticação Stripe.
        </div>
        <Button
          onClick={handlePortalRedirect}
          disabled={isLoading || !subscription}
          className="inline-flex items-center gap-2"
        >
          Abrir portal seguro
          <ExternalLink className="h-4 w-4" />
        </Button>
      </CardFooter>
    </Card>
  )
}
