'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { Settings, ClipboardList, Receipt, Truck, Package, Calendar, FileText, MapPin, ExternalLink } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { useSubscription } from '@/hooks/useSubscription'
import { AccessibleDashboard } from '@/components/assinante/AccessibleDashboard'
import { ToastContainer, useToast } from '@/components/assinante/ToastFeedback'
import { DashboardLoading } from '@/components/assinante/DashboardLoading'
import { DashboardError } from '@/components/assinante/DashboardError'
import { OrdersModal } from '@/components/assinante/OrdersModal'
import { InvoicesModal } from '@/components/assinante/InvoicesModal'
import { ChangePlanModal } from '@/components/assinante/ChangePlanModal'
import { UpdateAddressModal } from '@/components/assinante/UpdateAddressModal'
import { SubscriptionHistoryTimeline } from '@/components/assinante/SubscriptionHistoryTimeline'
import { EmergencyContact } from '@/components/assinante/EmergencyContact'
import { PrescriptionManager } from '@/components/assinante/PrescriptionManager'
import { PaymentHistoryTable } from '@/components/assinante/PaymentHistoryTable'
import { DeliveryPreferences } from '@/components/assinante/DeliveryPreferences'
import { StripePortalCard } from '@/components/assinante/StripePortalCard'
import { formatCurrency, formatDate } from '@/lib/formatters'
import { getSubscriptionStatusColor, getSubscriptionStatusLabel } from '@/lib/subscription-helpers'
import { Button } from '@/components/ui/button'
import { Logo } from '@/components/ui/logo'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { cn } from '@/lib/utils'

function DashboardContent() {
  const router = useRouter()
  const { user: authUser, loading: authLoading, signOut } = useAuth()
  const { subscription, loading: subLoading, error, refetch } = useSubscription()
  const { toasts, removeToast } = useToast()
  const [showOrdersModal, setShowOrdersModal] = useState(false)
  const [showInvoicesModal, setShowInvoicesModal] = useState(false)
  const [showChangePlanModal, setShowChangePlanModal] = useState(false)
  const [showUpdateAddressModal, setShowUpdateAddressModal] = useState(false)
  const [availablePlans, setAvailablePlans] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    const loadPlans = async () => {
      try {
        const plansModule = await import('@/data/pricing-plans')
        const plansData = plansModule.pricingPlans || []
        setAvailablePlans(plansData)
      } catch (loadError) {
        console.error('Error loading plans:', loadError)
      }
    }

    loadPlans()
  }, [])

  useEffect(() => {
    if (!authLoading && !authUser) {
      router.push('/area-assinante/login')
    }
  }, [authLoading, authUser, router])

  const handlePlanChange = async (newPlanId: string) => {
    setIsLoading(true)
    try {
      const token = await authUser?.getIdToken()
      if (!token) {
        throw new Error('Usuário não autenticado')
      }

      const response = await fetch('/api/subscription/change-plan', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ newPlanId })
      })

      if (!response.ok) {
        const errorPayload = await response.json()
        throw new Error(errorPayload.error || 'Erro ao alterar plano')
      }

      await refetch()
      return response.json()
    } finally {
      setIsLoading(false)
    }
  }

  const handleAddressUpdate = async (addressData: any) => {
    setIsLoading(true)
    try {
      const token = await authUser?.getIdToken()
      if (!token) {
        throw new Error('Usuário não autenticado')
      }

      const response = await fetch('/api/subscription/update-address', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(addressData)
      })

      if (!response.ok) {
        const errorPayload = await response.json()
        throw new Error(errorPayload.error || 'Erro ao atualizar endereço')
      }

      await refetch()
      return response.json()
    } finally {
      setIsLoading(false)
    }
  }

  const subscriptionStatusBadge = useMemo(() => {
    if (!subscription) {
      return null
    }

    return (
      <Badge
        variant="outline"
        className={cn(
          'px-3 py-1 text-xs font-semibold uppercase tracking-wide',
          getSubscriptionStatusColor(subscription.status as any)
        )}
      >
        {getSubscriptionStatusLabel(subscription.status as any)}
      </Badge>
    )
  }, [subscription])

  if (authLoading || subLoading) {
    return <DashboardLoading />
  }

  if (!authUser) {
    return null
  }

  if (error) {
    return (
      <div className="min-h-screen bg-slate-50">
        <div className="flex min-h-screen items-center justify-center px-4">
          <div className="w-full max-w-md">
            <DashboardError error={error} onRetry={refetch} />
            <Alert className="mt-6">
              <AlertTitle>Interface simplificada disponível</AlertTitle>
              <AlertDescription>
                Caso o problema persista, você pode acessar suas informações de cobrança diretamente em{' '}
                <Link href="/area-assinante/pagamentos" className="font-semibold text-cyan-600 underline underline-offset-4">
                  svlentes.com.br/area-assinante/pagamentos
                </Link>
                .
              </AlertDescription>
            </Alert>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="border-b border-slate-200 bg-white/70 backdrop-blur">
        <div className="mx-auto flex h-20 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-4">
            <Link href="/" className="flex items-center">
              <Logo size="md" variant="header" />
            </Link>
            <div>
              <h1 className="text-xl font-semibold text-slate-900 sm:text-2xl">Área do Assinante</h1>
              <p className="text-sm text-slate-500">Acompanhe sua assinatura, pedidos e pagamentos em um só lugar.</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {subscriptionStatusBadge}
            <Button variant="outline" size="sm" onClick={() => signOut()}>
              Sair
            </Button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        {!subscription && (
          <Card className="border-dashed border-cyan-200 bg-cyan-50">
            <CardHeader>
              <CardTitle className="text-slate-900">Você ainda não possui uma assinatura ativa</CardTitle>
              <CardDescription>Escolha um plano personalizado e comece a economizar com lentes de contato.</CardDescription>
            </CardHeader>
            <CardContent>
              <Button size="lg" onClick={() => router.push('/planos')} className="inline-flex items-center gap-2">
                Ver planos disponíveis
                <ExternalLink className="h-4 w-4" />
              </Button>
            </CardContent>
          </Card>
        )}

        {subscription && (
          <Tabs defaultValue="overview" className="mt-6 w-full">
            <TabsList className="grid w-full grid-cols-4 lg:w-[640px]">
              <TabsTrigger value="overview" className="flex items-center gap-2">
                <Settings className="h-4 w-4" />
                <span className="hidden sm:inline">Visão Geral</span>
                <span className="sm:hidden">Geral</span>
              </TabsTrigger>
              <TabsTrigger value="prescription" className="flex items-center gap-2">
                <ClipboardList className="h-4 w-4" />
                <span className="hidden sm:inline">Prescrição</span>
                <span className="sm:hidden">Receita</span>
              </TabsTrigger>
              <TabsTrigger value="payments" className="flex items-center gap-2">
                <Receipt className="h-4 w-4" />
                <span className="hidden sm:inline">Pagamentos</span>
                <span className="sm:hidden">Pag.</span>
              </TabsTrigger>
              <TabsTrigger value="delivery" className="flex items-center gap-2">
                <Truck className="h-4 w-4" />
                <span className="hidden sm:inline">Entrega</span>
                <span className="sm:hidden">Entrega</span>
              </TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="mt-8 space-y-6">
              <div className="grid gap-6 lg:grid-cols-[1.6fr,1fr]">
                <Card>
                  <CardHeader className="space-y-2">
                    <CardTitle>Resumo da assinatura</CardTitle>
                    <CardDescription>Dados principais do seu plano atual.</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="grid gap-4 sm:grid-cols-2">
                      <div>
                        <p className="text-sm text-slate-500">Plano atual</p>
                        <p className="text-lg font-semibold text-slate-900">{subscription.plan.name}</p>
                      </div>
                      <div>
                        <p className="text-sm text-slate-500">Valor recorrente</p>
                        <p className="text-lg font-semibold text-slate-900">{formatCurrency(subscription.plan.price)}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-slate-400" />
                        <div>
                          <p className="text-sm text-slate-500">Próxima cobrança</p>
                          <p className="text-base font-medium text-slate-900">{formatDate(subscription.nextBillingDate)}</p>
                        </div>
                      </div>
                      {subscription.shippingAddress && (
                        <div className="flex items-start gap-2">
                          <MapPin className="mt-1 h-4 w-4 text-slate-400" />
                          <div>
                            <p className="text-sm text-slate-500">Endereço de entrega</p>
                            <p className="text-sm text-slate-900">
                              {subscription.shippingAddress.street}, {subscription.shippingAddress.number}{' '}
                              {subscription.shippingAddress.complement ? `- ${subscription.shippingAddress.complement}` : ''}
                              <br />
                              {subscription.shippingAddress.city} - {subscription.shippingAddress.state}
                            </p>
                          </div>
                        </div>
                      )}
                    </div>
                  </CardContent>
                  <CardFooter className="flex flex-wrap gap-3">
                    <Button variant="outline" onClick={() => setShowChangePlanModal(true)} className="inline-flex items-center gap-2">
                      Alterar plano
                    </Button>
                    <Button variant="outline" onClick={() => setShowUpdateAddressModal(true)} className="inline-flex items-center gap-2">
                      Atualizar endereço
                    </Button>
                    <Button asChild className="inline-flex items-center gap-2">
                      <Link href="/area-assinante/pagamentos">
                        Gerenciar pagamentos
                        <ExternalLink className="h-4 w-4" />
                      </Link>
                    </Button>
                  </CardFooter>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Ações rápidas</CardTitle>
                    <CardDescription>Atalhos úteis para serviços do assinante.</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <Button variant="secondary" className="w-full justify-start" onClick={() => setShowOrdersModal(true)}>
                      <Package className="mr-2 h-4 w-4" /> Histórico de pedidos
                    </Button>
                    <Button variant="ghost" className="w-full justify-start" onClick={() => setShowInvoicesModal(true)}>
                      <FileText className="mr-2 h-4 w-4" /> Faturas e recibos
                    </Button>
                    <Button variant="ghost" className="w-full justify-start" onClick={() => router.push('/area-assinante/configuracoes')}>
                      <Settings className="mr-2 h-4 w-4" /> Configurações da conta
                    </Button>
                  </CardContent>
                </Card>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle>Indicadores da assinatura</CardTitle>
                  <CardDescription>Acompanhe o desempenho da sua assinatura.</CardDescription>
                </CardHeader>
                <CardContent className="p-0">
                  <AccessibleDashboard />
                </CardContent>
              </Card>

              {subscription.benefits && subscription.benefits.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle>Benefícios inclusos</CardTitle>
                    <CardDescription>Utilize os benefícios disponíveis antes da renovação.</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                      {subscription.benefits.map((benefit, index) => (
                        <motion.div
                          key={benefit.id}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: index * 0.05 }}
                          className="rounded-lg border border-slate-200 bg-white p-4"
                        >
                          <p className="font-medium text-slate-900">{benefit.name}</p>
                          {benefit.description && (
                            <p className="mt-1 text-sm text-slate-500">{benefit.description}</p>
                          )}
                          {benefit.quantityTotal && (
                            <p className="mt-2 text-xs text-slate-500">
                              Uso: {benefit.quantityUsed || 0}/{benefit.quantityTotal}
                            </p>
                          )}
                        </motion.div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              <Card>
                <CardHeader>
                  <CardTitle>Histórico de alterações</CardTitle>
                  <CardDescription>Veja as últimas movimentações da sua assinatura.</CardDescription>
                </CardHeader>
                <CardContent>
                  <SubscriptionHistoryTimeline userId={authUser.uid} />
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Contato emergencial</CardTitle>
                  <CardDescription>Estamos sempre prontos para ajudar em situações urgentes.</CardDescription>
                </CardHeader>
                <CardContent>
                  <EmergencyContact />
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="prescription" className="mt-8">
              <Card>
                <CardHeader>
                  <CardTitle>Gerenciamento de prescrição</CardTitle>
                  <CardDescription>Atualize e acompanhe suas receitas médicas em um só lugar.</CardDescription>
                </CardHeader>
                <CardContent className="p-0">
                  <PrescriptionManager />
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="payments" className="mt-8 space-y-6">
              <div className="grid gap-6 lg:grid-cols-[1.6fr,1fr]">
                <StripePortalCard subscription={subscription} />
                <Card>
                  <CardHeader>
                    <CardTitle>Projeção financeira</CardTitle>
                    <CardDescription>Acompanhe valores e prazos importantes.</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="rounded-lg border border-slate-200 bg-white p-4">
                      <p className="text-sm text-slate-500">Próxima cobrança</p>
                      <p className="text-base font-semibold text-slate-900">{formatDate(subscription.nextBillingDate)}</p>
                    </div>
                    <div className="rounded-lg border border-slate-200 bg-white p-4">
                      <p className="text-sm text-slate-500">Valor mensal</p>
                      <p className="text-base font-semibold text-slate-900">{formatCurrency(subscription.plan.price)}</p>
                    </div>
                    <Alert>
                      <AlertTitle>Portal dedicado do Stripe</AlertTitle>
                      <AlertDescription>
                        Todas as alterações de cartão, emissões de recibo e atualizações de cobrança agora acontecem no portal
                        seguro do Stripe.
                      </AlertDescription>
                    </Alert>
                  </CardContent>
                </Card>
              </div>
              <Card>
                <CardHeader>
                  <CardTitle>Histórico de pagamentos</CardTitle>
                  <CardDescription>Consulte lançamentos recentes e status de cobrança.</CardDescription>
                </CardHeader>
                <CardContent className="-mx-6 overflow-x-auto px-6 pb-6">
                  <PaymentHistoryTable />
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="delivery" className="mt-8">
              <Card>
                <CardHeader>
                  <CardTitle>Preferências de entrega</CardTitle>
                  <CardDescription>Personalize local, horários e instruções especiais.</CardDescription>
                </CardHeader>
                <CardContent className="p-0">
                  <DeliveryPreferences />
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        )}
      </main>

      <OrdersModal isOpen={showOrdersModal} onClose={() => setShowOrdersModal(false)} />
      <InvoicesModal isOpen={showInvoicesModal} onClose={() => setShowInvoicesModal(false)} />
      {subscription && (
        <>
          <ChangePlanModal
            isOpen={showChangePlanModal}
            onClose={() => setShowChangePlanModal(false)}
            currentPlan={{
              id: subscription.id,
              name: subscription.plan.name,
              price: subscription.plan.price
            }}
            availablePlans={availablePlans}
            onPlanChange={handlePlanChange}
          />
          <UpdateAddressModal
            isOpen={showUpdateAddressModal}
            onClose={() => setShowUpdateAddressModal(false)}
            currentAddress={subscription.shippingAddress}
            onAddressUpdate={handleAddressUpdate}
          />
        </>
      )}

      <ToastContainer toasts={toasts} onRemove={removeToast} />

      {isLoading && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="rounded-lg bg-white p-6 shadow-lg">
            <div className="mx-auto h-8 w-8 animate-spin rounded-full border-b-2 border-cyan-600" />
            <p className="mt-2 text-sm text-slate-600">Processando...</p>
          </div>
        </div>
      )}
    </div>
  )
}

export default function DashboardPage() {
  return <DashboardContent />
}

export const dynamic = 'force-dynamic'
