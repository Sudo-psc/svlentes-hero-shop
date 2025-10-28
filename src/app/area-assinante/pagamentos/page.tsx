'use client'

import { useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Calendar, CreditCard, ShieldCheck } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { useSubscription } from '@/hooks/useSubscription'
import { DashboardLoading } from '@/components/assinante/DashboardLoading'
import { StripePortalCard } from '@/components/assinante/StripePortalCard'
import { PaymentHistoryTable } from '@/components/assinante/PaymentHistoryTable'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { formatCurrency, formatDate } from '@/lib/formatters'

export default function PagamentosPage() {
  const router = useRouter()
  const { user: authUser, loading: authLoading } = useAuth()
  const { subscription, loading: subscriptionLoading } = useSubscription()

  useEffect(() => {
    if (!authLoading && !authUser) {
      router.replace('/area-assinante/login')
    }
  }, [authLoading, authUser, router])

  if (authLoading || subscriptionLoading) {
    return <DashboardLoading />
  }

  if (!authUser) {
    return null
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="border-b border-slate-200 bg-white/70 backdrop-blur">
        <div className="mx-auto flex h-20 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" className="text-slate-600" onClick={() => router.push('/area-assinante/dashboard')}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Voltar
            </Button>
            <div>
              <h1 className="text-xl font-semibold text-slate-900 sm:text-2xl">Pagamentos &amp; Faturas</h1>
              <p className="text-sm text-slate-500">Gerencie sua assinatura com o portal oficial do Stripe.</p>
            </div>
          </div>
          <Badge variant="secondary" className="flex items-center gap-2 text-xs font-medium">
            <ShieldCheck className="h-4 w-4" />
            Stripe Protegido
          </Badge>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="grid gap-6 lg:grid-cols-[1.5fr,1fr]">
          <StripePortalCard subscription={subscription} className="h-full" />
          <Card className="h-full">
            <CardHeader>
              <CardTitle>Resumo financeiro</CardTitle>
              <CardDescription>Informações rápidas sobre seu plano atual.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {subscription ? (
                <>
                  <div className="rounded-lg border border-slate-200 bg-white p-4">
                    <div className="text-sm font-medium text-slate-500">Plano ativo</div>
                    <div className="text-lg font-semibold text-slate-900">{subscription.plan.name}</div>
                    <div className="mt-2 flex items-center gap-2 text-sm text-slate-600">
                      <CreditCard className="h-4 w-4" />
                      {formatCurrency(subscription.plan.price)} por ciclo {subscription.plan.billingCycle === 'monthly' ? 'mensal' : 'recorrente'}
                    </div>
                  </div>
                  <div className="rounded-lg border border-slate-200 bg-white p-4">
                    <div className="flex items-center gap-2 text-sm font-medium text-slate-500">
                      <Calendar className="h-4 w-4" />
                      Próxima cobrança
                    </div>
                    <p className="mt-2 text-lg font-semibold text-slate-900">
                      {formatDate(subscription.nextBillingDate)}
                    </p>
                    <p className="text-sm text-slate-500">O portal Stripe envia recibos e confirmações por email automaticamente.</p>
                  </div>
                </>
              ) : (
                <div className="rounded-lg border border-dashed border-cyan-200 bg-cyan-50 p-6 text-cyan-900">
                  <p className="text-sm font-medium">Você ainda não possui uma assinatura ativa.</p>
                  <p className="mt-2 text-sm">
                    Explore nossos planos e conclua a contratação em{' '}
                    <Link href="/planos" className="font-semibold underline underline-offset-4">
                      svlentes.com.br/planos
                    </Link>
                    .
                  </p>
                </div>
              )}
              <Separator />
              <div className="space-y-2 text-sm text-slate-600">
                <p>Precisa de ajuda? Nosso time está disponível pelo WhatsApp em horário comercial.</p>
                <p className="font-medium text-slate-700">WhatsApp: (33) 98606-1427</p>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card className="mt-8">
          <CardHeader>
            <CardTitle>Histórico de pagamentos</CardTitle>
            <CardDescription>Consulte as cobranças registradas e recibos emitidos.</CardDescription>
          </CardHeader>
          <CardContent className="-mx-6 overflow-x-auto px-6 pb-6">
            <PaymentHistoryTable />
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
