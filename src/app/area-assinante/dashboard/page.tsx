'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  LayoutDashboard,
  Layers,
  CreditCard,
  ShoppingBag,
  Eye,
  Trophy,
  Settings as SettingsIcon,
  LogOut,
  LifeBuoy,
  Wallet,
  Calendar,
  FileText,
  MapPin,
  Bell,
  MessageCircle,
  Phone,
  Mail,
  Gift,
  Sparkles,
  ClipboardList,
  Clock,
  Copy,
  ShoppingCart,
  CheckCircle2,
  ArrowRight,
  ChevronRight
} from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { useSubscription } from '@/hooks/useSubscription'
import { useModals } from '@/hooks/useModals'
import { usePricingPlans, PricingPlansProvider } from '@/contexts/PricingPlansContext'
import { useGamification } from '@/hooks/useGamification'
import { ToastContainer, useToast } from '@/components/assinante/ToastFeedback'
import { DashboardLoading } from '@/components/assinante/DashboardLoading'
import { DashboardError } from '@/components/assinante/DashboardError'
import { ChangePlanModal } from '@/components/assinante/ChangePlanModal'
import { UpdateAddressModal } from '@/components/assinante/UpdateAddressModal'
import { UpdatePaymentModal } from '@/components/assinante/UpdatePaymentModal'
import { OrdersModal } from '@/components/assinante/OrdersModal'
import { InvoicesModal } from '@/components/assinante/InvoicesModal'
import { SubscriptionHistoryTimeline } from '@/components/assinante/SubscriptionHistoryTimeline'
import { StripePortalButton } from '@/components/assinante/StripePortalButton'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Separator } from '@/components/ui/separator'

import { formatCurrency, formatDate } from '@/lib/formatters'
import { getSubscriptionStatusColor, getSubscriptionStatusLabel } from '@/lib/subscription-helpers'
import { cn } from '@/lib/utils'

function DashboardContent() {
  const router = useRouter()
  const { user: authUser, loading: authLoading, signOut } = useAuth()
  const { subscription, user, loading: subLoading, error, refetch } = useSubscription()
  const { modals, openModal, closeModal } = useModals()
  const { plans: availablePlans } = usePricingPlans()
  const gamificationUserId = authUser?.uid ?? null
  const {
    profile: gamificationProfile,
    loading: gamificationLoading,
    error: gamificationError,
    claimReward
  } = useGamification(gamificationUserId)
  const {
    toasts,
    removeToast,
    success: showSuccess,
    error: showError,
    info: showInfo
  } = useToast()
  const [isLoading, setIsLoading] = useState(false)
  const [claimingReward, setClaimingReward] = useState<string | null>(null)
  useEffect(() => {
    if (!authLoading && !authUser) {
      router.push('/area-assinante/login')
    }
  }, [authLoading, authUser, router])
  const userName = user?.name || authUser?.displayName || 'Assinante'
  const userEmail = user?.email || authUser?.email || 'sem-email@svlentes.com.br'
  const avatarUrl = user?.avatarUrl || authUser?.photoURL || ''
  const avatarInitials = useMemo(() => {
    return userName
      .split(' ')
      .map(part => part.charAt(0))
      .slice(0, 2)
      .join('')
      .toUpperCase()
  }, [userName])
  const billingLabel = subscription?.plan.billingCycle === 'annual' ? 'Anual' : 'Mensal'
  const paymentLabel = useMemo(() => {
    if (!subscription) return 'Pagamento não configurado'
    if (subscription.paymentMethod === 'PIX') return 'PIX'
    if (subscription.paymentMethod === 'BOLETO') return 'Boleto'
    if (subscription.paymentMethod === 'CREDIT_CARD') {
      return subscription.paymentMethodLast4
        ? `Cartão final ${subscription.paymentMethodLast4}`
        : 'Cartão de crédito'
    }
    return 'Pagamento não configurado'
  }, [subscription])
  const gamificationPoints = gamificationProfile?.points.totalPoints ?? 0
  const gamificationLevel = gamificationProfile?.points.currentLevel ?? 1
  const gamificationProgress = gamificationProfile
    ? Math.min(
      100,
      (gamificationProfile.points.experiencePoints /
        Math.max(gamificationProfile.points.experienceToNextLevel, 1)) * 100
    )
    : 0
  const achievements = gamificationProfile?.achievements
    ? gamificationProfile.achievements.slice(0, 6)
    : []
  const availableRewards = gamificationProfile?.rewards
    ? gamificationProfile.rewards.filter(reward => reward.isAvailable).slice(0, 2)
    : []
  const claimedRewards = gamificationProfile?.claimedRewards ?? []
  const quickActions = [
    {
      label: 'Pedidos',
      description: 'Acompanhe suas entregas',
      icon: ShoppingBag,
      onClick: () => openModal('orders')
    },
    {
      label: 'Notas Fiscais',
      description: 'Baixe seus documentos',
      icon: FileText,
      onClick: () => openModal('invoices')
    },
    {
      label: 'Endereço',
      description: 'Atualize o local de entrega',
      icon: MapPin,
      onClick: () => openModal('updateAddress')
    },
    {
      label: 'Plano',
      description: 'Gerencie sua assinatura',
      icon: Layers,
      onClick: () => openModal('changePlan')
    }
  ]
  const navigation = [
    {
      label: 'Dashboard',
      icon: LayoutDashboard,
      active: true,
      onClick: () => router.push('/area-assinante/dashboard')
    },
    {
      label: 'Plano',
      icon: Layers,
      active: false,
      onClick: () => openModal('changePlan')
    },
    {
      label: 'Pagamentos',
      icon: CreditCard,
      active: false,
      onClick: () => openModal('invoices')
    },
    {
      label: 'Meus Pedidos',
      icon: ShoppingBag,
      active: false,
      onClick: () => openModal('orders')
    },
    {
      label: 'Lentes',
      icon: Eye,
      active: false,
      onClick: () => router.push('/area-assinante/configuracoes')
    },
    {
      label: 'Gamificação',
      icon: Trophy,
      active: false,
      onClick: () => {
        const section = document.getElementById('gamificacao')
        const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
        section?.scrollIntoView({ behavior: prefersReducedMotion ? 'auto' : 'smooth', block: 'start' })
      }
    },
    {
      label: 'Configurações',
      icon: SettingsIcon,
      active: false,
      onClick: () => router.push('/area-assinante/configuracoes')
    }
  ]
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
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || 'Erro ao alterar plano')
      }
      await refetch()
      showSuccess('Plano atualizado', 'Sua assinatura foi atualizada com sucesso.')
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro ao alterar plano'
      showError('Não foi possível alterar o plano', message)
      throw err
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
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || 'Erro ao atualizar endereço')
      }
      await refetch()
      showSuccess('Endereço atualizado', 'O endereço de entrega foi atualizado.')
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro ao atualizar endereço'
      showError('Não foi possível atualizar o endereço', message)
      throw err
    } finally {
      setIsLoading(false)
    }
  }
  const handlePaymentUpdate = async (paymentData: any) => {
    setIsLoading(true)
    try {
      const token = await authUser?.getIdToken()
      if (!token) {
        throw new Error('Usuário não autenticado')
      }
      const response = await fetch('/api/subscription/update-payment', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(paymentData)
      })
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || 'Erro ao atualizar forma de pagamento')
      }
      await refetch()
      showSuccess('Pagamento atualizado', 'A forma de pagamento foi atualizada.')
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro ao atualizar forma de pagamento'
      showError('Não foi possível atualizar o pagamento', message)
      throw err
    } finally {
      setIsLoading(false)
    }
  }
  const handleSupportWhatsApp = () => {
    const phone = '5533986061427'
    const message = encodeURIComponent('Olá! Preciso de ajuda com minha assinatura SV Lentes.')
    window.open(`https://wa.me/${phone}?text=${message}`, '_blank')
  }
  const handleSupportCall = () => {
    window.open('tel:+5533986061427', '_self')
  }
  const handleSupportEmail = () => {
    window.open('mailto:oi@svlentes.com.br?subject=Ajuda com minha assinatura', '_blank')
  }
  const handleClaimReward = async (rewardId: string) => {
    setClaimingReward(rewardId)
    try {
      await claimReward(rewardId)
      showSuccess('Recompensa resgatada', 'Seu benefício foi adicionado à sua conta.')
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro ao resgatar recompensa'
      showError('Não foi possível resgatar a recompensa', message)
    } finally {
      setClaimingReward(null)
    }
  }
  const handleCopyRewardCode = async (code: string) => {
    try {
      await navigator.clipboard.writeText(code)
      showSuccess('Código copiado', 'Cole o código no checkout para usar o benefício.')
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro ao copiar código'
      showError('Não foi possível copiar o código', message)
    }
  }
  if (authLoading || subLoading) {
    return <DashboardLoading />
  }
  if (!authUser) {
    return null
  }
  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-cyan-50 to-silver-50 flex items-center justify-center">
        <div className="max-w-md w-full mx-4 space-y-4">
          <DashboardError error={error} onRetry={refetch} />
          <Button variant="outline" onClick={() => router.push('/area-assinante/login')}>Voltar ao login</Button>
        </div>
      </div>
    )
  }
  return (
    <div className="min-h-screen bg-gray-50 text-gray-900">
      <div className="flex min-h-screen">
        <aside className="hidden xl:flex w-64 bg-white border-r border-gray-200 flex-col">
          <div className="px-6 pt-8 pb-6 border-b border-gray-200">
            <div className="mb-6">
              <h2 className="text-xl font-semibold text-gray-900">
                Área do Assinante
              </h2>
              <p className="text-xs text-gray-500 mt-1">SV Lentes</p>
            </div>
            <div className="flex items-center gap-3 p-3 rounded-lg bg-gray-50 border border-gray-200">
              <div className="h-10 w-10 rounded-full bg-blue-600 text-white flex items-center justify-center text-sm font-medium overflow-hidden">
                {avatarUrl ? (
                  <img src={avatarUrl} alt={userName} className="h-full w-full object-cover" />
                ) : (
                  <span>{avatarInitials}</span>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-gray-900 text-sm truncate">{userName}</p>
                <p className="text-xs text-gray-500 truncate">{userEmail}</p>
              </div>
            </div>
          </div>
          <nav className="flex-1 px-4 py-6 space-y-1">
            {navigation.map(item => (
              <button
                key={item.label}
                onClick={item.onClick}
                className={cn(
                  'w-full flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors',
                  item.active
                    ? 'bg-blue-50 text-blue-700 border-l-2 border-blue-600'
                    : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
                )}
              >
                <item.icon className="h-4 w-4 flex-shrink-0" />
                <span className="flex-1 text-left">{item.label}</span>
              </button>
            ))}
            <Separator className="my-4 bg-gray-200" />
            <button
              onClick={() => signOut()}
              className="w-full flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium text-red-600 hover:bg-red-50 transition-colors"
            >
              <LogOut className="h-4 w-4 flex-shrink-0" />
              <span className="flex-1 text-left">Sair</span>
            </button>
          </nav>
          <div className="px-6 py-6 border-t border-gray-200">
            <div className="rounded-lg bg-gray-50 p-4 border border-gray-200">
              <div className="flex items-start gap-3 mb-3">
                <div className="p-2 rounded-md bg-blue-100 text-blue-700">
                  <LifeBuoy className="h-4 w-4" />
                </div>
                <div className="space-y-1 flex-1">
                  <p className="text-sm font-medium text-gray-900">Precisa de ajuda?</p>
                  <p className="text-xs text-gray-600">
                    Fale com nossa equipe de suporte.
                  </p>
                </div>
              </div>
              <Button
                size="sm"
                className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                onClick={handleSupportWhatsApp}
              >
                <MessageCircle className="h-4 w-4 mr-2" /> WhatsApp
              </Button>
            </div>
          </div>
        </aside>
        <div className="flex-1 flex flex-col">
          <header className="bg-white border-b border-gray-200">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-sm text-gray-600">Bem-vindo de volta, {userName.split(' ')[0]}</p>
                <h1 className="text-2xl font-semibold text-gray-900">Meu Dashboard</h1>
              </div>
              <div className="flex items-center gap-3">
                <Button
                  variant="outline"
                  className="hidden sm:inline-flex"
                  onClick={() => router.push('/area-assinante/configuracoes')}
                >
                  <SettingsIcon className="h-4 w-4 mr-2" /> Configurações
                </Button>
              </div>
            </div>
          </header>
          <main className="flex-1 overflow-y-auto bg-gray-50">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
              {!subscription && (
                <Card className="border border-gray-200">
                  <CardContent className="py-12 flex flex-col items-center text-center gap-6">
                    <div className="p-4 rounded-lg bg-blue-50 text-blue-600">
                      <Wallet className="h-12 w-12" />
                    </div>
                    <h2 className="text-xl font-semibold text-gray-900">Você ainda não possui uma assinatura ativa</h2>
                    <p className="text-gray-600 max-w-xl">
                      Escolha o plano ideal para receber suas lentes com acompanhamento médico e benefícios exclusivos.
                    </p>
                    <div className="flex flex-wrap gap-3 justify-center mt-2">
                      <Button className="bg-blue-600 hover:bg-blue-700" onClick={() => router.push('/planos')}>
                        <ArrowRight className="h-4 w-4 mr-2" /> Conhecer planos
                      </Button>
                      <Button variant="outline" onClick={handleSupportWhatsApp}>
                        <MessageCircle className="h-4 w-4 mr-2" /> Falar com um especialista
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )}
              {subscription && (
                <div className="space-y-6">
                  <div className="grid gap-6 xl:grid-cols-[2fr_1fr]">
                    <div className="space-y-6">
                      <Card className="bg-white border border-gray-200">
                        <CardHeader className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                          <div>
                            <CardTitle className="text-lg flex items-center gap-2 font-semibold">
                              <CreditCard className="h-5 w-5 text-gray-700" />
                              Pagamentos
                            </CardTitle>
                            <CardDescription className="text-gray-600 mt-1">Veja o status da sua assinatura e gerencie suas cobranças.</CardDescription>
                          </div>
                          <Badge className={cn('px-3 py-1 text-xs font-medium', getSubscriptionStatusColor(subscription.status))}>
                            {getSubscriptionStatusLabel(subscription.status)}
                          </Badge>
                        </CardHeader>
                        <CardContent className="space-y-4">
                          <div className="grid gap-4 lg:grid-cols-2">
                            <div className="flex items-start gap-3 p-4 rounded-lg border border-gray-200 bg-white">
                              <div className="p-2 rounded-md bg-blue-50 text-blue-600">
                                <Wallet className="h-4 w-4" />
                              </div>
                              <div>
                                <p className="text-xs font-medium text-gray-500 uppercase">Plano atual</p>
                                <p className="text-base font-semibold text-gray-900 mt-1">{subscription.plan.name}</p>
                                <p className="text-sm text-gray-600 mt-0.5">{formatCurrency(subscription.plan.price)} · {billingLabel}</p>
                              </div>
                            </div>
                            <div className="flex items-start gap-3 p-4 rounded-lg border border-gray-200 bg-white">
                              <div className="p-2 rounded-md bg-blue-50 text-blue-600">
                                <Calendar className="h-4 w-4" />
                              </div>
                              <div>
                                <p className="text-xs font-medium text-gray-500 uppercase">Próxima cobrança</p>
                                <p className="text-base font-semibold text-gray-900 mt-1">
                                  {formatDate(subscription.nextBillingDate)}
                                </p>
                                <p className="text-sm text-gray-600 mt-0.5">Até {formatDate(subscription.currentPeriodEnd)}</p>
                              </div>
                            </div>
                          </div>
                          <div className="grid gap-4 lg:grid-cols-2">
                            <div className="flex items-start gap-3 p-4 rounded-lg border border-gray-200 bg-white">
                              <div className="p-2 rounded-md bg-blue-50 text-blue-600">
                                <CreditCard className="h-4 w-4" />
                              </div>
                              <div className="flex-1">
                                <p className="text-xs font-medium text-gray-500 uppercase">Forma de pagamento</p>
                                <p className="text-base font-semibold text-gray-900 mt-1">{paymentLabel}</p>
                                <Button variant="ghost" className="mt-2 px-0 h-auto text-sm text-blue-600 hover:text-blue-700" onClick={() => openModal('updatePayment')}>
                                  Atualizar <ChevronRight className="h-3 w-3 ml-1" />
                                </Button>
                              </div>
                            </div>
                            <div className="flex items-start gap-3 p-4 rounded-lg border border-gray-200 bg-white">
                              <div className="p-2 rounded-md bg-blue-50 text-blue-600">
                                <MapPin className="h-4 w-4" />
                              </div>
                              <div className="flex-1">
                                <p className="text-xs font-medium text-gray-500 uppercase">Endereço de entrega</p>
                                {subscription.shippingAddress ? (
                                  <p className="text-sm text-gray-700 mt-1">
                                    {subscription.shippingAddress.street}, {subscription.shippingAddress.number}
                                    {subscription.shippingAddress.complement ? `, ${subscription.shippingAddress.complement}` : ''}
                                    <br />
                                    {subscription.shippingAddress.city} - {subscription.shippingAddress.state}
                                  </p>
                                ) : (
                                  <p className="text-sm text-gray-600 mt-1">Nenhum endereço cadastrado</p>
                                )}
                                <Button variant="ghost" className="mt-2 px-0 h-auto text-sm text-blue-600 hover:text-blue-700" onClick={() => openModal('updateAddress')}>
                                  Atualizar <ChevronRight className="h-3 w-3 ml-1" />
                                </Button>
                              </div>
                            </div>
                          </div>
                          <div className="flex flex-wrap gap-2">
                            <Button variant="outline" size="sm" onClick={() => openModal('invoices')}>
                              <FileText className="h-4 w-4 mr-2" /> Transações
                            </Button>
                            <Button variant="outline" size="sm" onClick={() => openModal('orders')}>
                              <ShoppingBag className="h-4 w-4 mr-2" /> Pedidos
                            </Button>
                            <Button size="sm" className="bg-blue-600 hover:bg-blue-700" onClick={() => openModal('changePlan')}>
                              <Layers className="h-4 w-4 mr-2" /> Alterar plano
                            </Button>
                            <StripePortalButton
                              variant="ghost"
                              size="sm"
                              returnUrl="/area-assinante/dashboard"
                            >
                              Portal Stripe
                            </StripePortalButton>
                          </div>
                        </CardContent>
                      </Card>
                      <Card className="border border-gray-200">
                        <CardHeader>
                          <CardTitle className="flex items-center gap-2 text-gray-900 font-semibold text-lg">
                            <ClipboardList className="h-5 w-5 text-gray-700" />
                            Ações rápidas
                          </CardTitle>
                          <CardDescription className="text-gray-600 mt-1">Gerencie suas informações com poucos cliques.</CardDescription>
                        </CardHeader>
                        <CardContent>
                          <div className="grid gap-3 sm:grid-cols-2">
                            {quickActions.map(action => (
                              <button
                                key={action.label}
                                onClick={action.onClick}
                                className="group flex flex-col items-start gap-2 rounded-lg border border-gray-200 p-4 text-left hover:border-blue-300 hover:bg-blue-50 transition-colors"
                              >
                                <div className="p-2 rounded-md bg-blue-50 text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                                  <action.icon className="h-4 w-4" />
                                </div>
                                <p className="text-sm font-medium text-gray-900">{action.label}</p>
                                <p className="text-xs text-gray-600">{action.description}</p>
                              </button>
                            ))}
                          </div>
                        </CardContent>
                      </Card>
                      <Card id="gamificacao" className="bg-blue-600 text-white border-none">
                        <CardHeader>
                          <CardTitle className="flex items-center gap-2 text-white font-semibold text-lg">
                            <Sparkles className="h-5 w-5" />
                            Gamificação
                          </CardTitle>
                          <CardDescription className="text-blue-100 mt-1">
                            Acompanhe sua evolução e desbloqueie benefícios exclusivos.
                          </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                          <div className="flex flex-wrap items-center gap-6">
                            <div>
                              <p className="text-sm text-blue-100">Pontuação total</p>
                              <p className="text-3xl font-semibold">{gamificationPoints.toLocaleString('pt-BR')} pts</p>
                            </div>
                            <div className="flex items-center gap-3">
                              <div className="text-3xl">🏆</div>
                              <div>
                                <p className="text-sm text-blue-100">Seu nível</p>
                                <p className="text-xl font-semibold">Nível {gamificationLevel}</p>
                              </div>
                            </div>
                          </div>
                          <div>
                            <div className="flex items-center justify-between text-sm text-blue-100 mb-2">
                              <span>Próximo nível</span>
                              <span>{Math.round(gamificationProgress)}%</span>
                            </div>
                            <Progress value={gamificationProgress} className="h-2 bg-blue-500" />
                          </div>
                          <div className="grid gap-3 sm:grid-cols-3">
                            <div className="rounded-lg bg-blue-500 p-4">
                              <p className="text-xs text-blue-100 uppercase">Sequência</p>
                              <p className="text-xl font-semibold mt-1">{gamificationProfile?.points.streakDays ?? 0} dias</p>
                            </div>
                            <div className="rounded-lg bg-blue-500 p-4">
                              <p className="text-xs text-blue-100 uppercase">Missões</p>
                              <p className="text-xl font-semibold mt-1">{gamificationProfile?.missions?.filter(m => !m.completedAt && m.isActive).length ?? 0}</p>
                            </div>
                            <div className="rounded-lg bg-blue-500 p-4">
                              <p className="text-xs text-blue-100 uppercase">Conquistas</p>
                              <p className="text-xl font-semibold mt-1">{gamificationProfile?.achievements?.filter(a => a.unlockedAt).length ?? 0}</p>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                      <Card className="border border-gray-200">
                        <CardHeader>
                          <CardTitle className="flex items-center gap-2 font-semibold text-lg">
                            <Trophy className="h-5 w-5 text-gray-700" />
                            Minhas conquistas
                          </CardTitle>
                          <CardDescription className="text-gray-600 mt-1">Continue avançando para desbloquear mais recompensas.</CardDescription>
                        </CardHeader>
                        <CardContent>
                          {gamificationLoading && (
                            <div className="flex items-center justify-center py-6 text-gray-500">Carregando conquistas...</div>
                          )}
                          {!gamificationLoading && gamificationError && (
                            <div className="py-6 text-sm text-red-600">{gamificationError}</div>
                          )}
                          {!gamificationLoading && !gamificationError && (
                            <div className="grid gap-3 sm:grid-cols-3">
                              {achievements.map(achievement => (
                                <div key={achievement.id} className="rounded-lg border border-gray-200 p-4 bg-white hover:bg-gray-50 transition-colors">
                                  <div className="flex items-center gap-2 mb-2">
                                    <div className="text-2xl">{achievement.icon}</div>
                                    <p className="font-medium text-gray-900 text-sm">{achievement.name}</p>
                                  </div>
                                  <p className="text-xs text-gray-600">{achievement.description}</p>
                                </div>
                              ))}
                              {achievements.length === 0 && (
                                <div className="col-span-full py-8 text-center text-sm text-gray-500">
                                  Nenhuma conquista disponível no momento.
                                </div>
                              )}
                            </div>
                          )}
                        </CardContent>
                      </Card>
                      <Card className="border border-gray-200">
                        <CardHeader>
                          <CardTitle className="flex items-center gap-2 font-semibold text-lg">
                            <Clock className="h-5 w-5 text-gray-700" />
                            Histórico da assinatura
                          </CardTitle>
                          <CardDescription className="text-gray-600 mt-1">Acompanhe os principais eventos e atualizações.</CardDescription>
                        </CardHeader>
                        <CardContent>
                          <SubscriptionHistoryTimeline userId={authUser.uid} />
                        </CardContent>
                      </Card>
                    </div>
                    <div className="space-y-6">
                      <Card className="border border-gray-200">
                        <CardHeader>
                          <CardTitle className="flex items-center gap-2 font-semibold text-lg">
                            <Bell className="h-5 w-5 text-gray-700" />
                            Lembretes
                          </CardTitle>
                          <CardDescription className="text-gray-600 mt-1">Mantenha-se em dia com sua rotina.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-3">
                          <div className="rounded-lg border border-gray-200 p-3 bg-white">
                            <p className="text-sm font-medium text-gray-900">Renovação do plano</p>
                            <p className="text-xs text-gray-600 mt-1">Renovar até {formatDate(subscription.nextBillingDate)}</p>
                          </div>
                          <div className="rounded-lg border border-gray-200 p-3 bg-white">
                            <p className="text-sm font-medium text-gray-900">Consulta médica</p>
                            <p className="text-xs text-gray-600 mt-1">Agende antes de {formatDate(subscription.currentPeriodEnd)}</p>
                          </div>
                          <Button variant="outline" size="sm" className="w-full" onClick={() => router.push('/area-assinante/configuracoes')}>
                            <Bell className="h-4 w-4 mr-2" /> Configurar
                          </Button>
                        </CardContent>
                      </Card>
                      <Card className="border border-gray-200">
                        <CardHeader>
                          <CardTitle className="flex items-center gap-2 font-semibold text-lg">
                            <MessageCircle className="h-5 w-5 text-gray-700" />
                            Contato
                          </CardTitle>
                          <CardDescription className="text-gray-600 mt-1">Nossa equipe está pronta para ajudar.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-3">
                          <div className="rounded-lg border border-gray-200 p-3 bg-white flex items-center justify-between gap-3">
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-gray-900">WhatsApp</p>
                              <p className="text-xs text-gray-600">(33) 98606-1427</p>
                            </div>
                            <Button size="sm" className="bg-green-600 hover:bg-green-700 flex-shrink-0" onClick={handleSupportWhatsApp}>
                              <MessageCircle className="h-4 w-4" />
                            </Button>
                          </div>
                          <div className="rounded-lg border border-gray-200 p-3 bg-white flex items-center justify-between gap-3">
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-gray-900">Telefone</p>
                              <p className="text-xs text-gray-600">(33) 98606-1427</p>
                            </div>
                            <Button size="sm" variant="outline" className="flex-shrink-0" onClick={handleSupportCall}>
                              <Phone className="h-4 w-4" />
                            </Button>
                          </div>
                          <div className="rounded-lg border border-gray-200 p-3 bg-white flex items-center justify-between gap-3">
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-gray-900">E-mail</p>
                              <p className="text-xs text-gray-600 truncate">oi@svlentes.com.br</p>
                            </div>
                            <Button size="sm" variant="ghost" className="flex-shrink-0" onClick={handleSupportEmail}>
                              <Mail className="h-4 w-4" />
                            </Button>
                          </div>
                          <Button variant="outline" size="sm" className="w-full" onClick={() => router.push('/contato')}>
                            <LifeBuoy className="h-4 w-4 mr-2" /> Abrir ticket
                          </Button>
                        </CardContent>
                      </Card>
                      <Card className="border border-gray-200">
                        <CardHeader>
                          <CardTitle className="flex items-center gap-2 font-semibold text-lg">
                            <Gift className="h-5 w-5 text-gray-700" />
                            Suas recompensas
                          </CardTitle>
                          <CardDescription className="text-gray-600 mt-1">Resgate benefícios exclusivos.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-3">
                          {availableRewards.map(reward => {
                            const isClaimed = claimedRewards.includes(reward.id)
                            const canClaim = (gamificationProfile?.points.totalPoints ?? 0) >= reward.pointsCost
                            return (
                              <div key={reward.id} className="rounded-lg border border-gray-200 p-4 bg-white space-y-3">
                                <div className="flex items-start gap-3">
                                  <div className="p-2 rounded-md bg-blue-50 text-blue-600">
                                    {reward.icon ? (
                                      <reward.icon className="h-4 w-4" />
                                    ) : null}
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <p className="font-medium text-gray-900 text-sm">{reward.name}</p>
                                    <p className="text-xs text-gray-600 mt-1">{reward.description}</p>
                                  </div>
                                  <Badge variant="outline" className="text-xs flex-shrink-0">
                                    {reward.pointsCost.toLocaleString('pt-BR')} pts
                                  </Badge>
                                </div>
                                <div className="flex flex-wrap gap-2">
                                  <Button
                                    size="sm"
                                    className="bg-blue-600 hover:bg-blue-700"
                                    onClick={() => handleClaimReward(reward.id)}
                                    disabled={!canClaim || isClaimed || claimingReward === reward.id}
                                  >
                                    {isClaimed ? (
                                      <>
                                        <CheckCircle2 className="h-3 w-3 mr-1" /> Resgatado
                                      </>
                                    ) : (
                                      <>
                                        <ShoppingCart className="h-3 w-3 mr-1" /> Resgatar
                                      </>
                                    )}
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => handleCopyRewardCode(reward.code)}
                                  >
                                    <Copy className="h-3 w-3 mr-1" /> Copiar
                                  </Button>
                                </div>
                              </div>
                            )
                          })}
                          {availableRewards.length === 0 && (
                            <p className="text-sm text-gray-500 text-center py-4">Nenhuma recompensa disponível.</p>
                          )}
                        </CardContent>
                      </Card>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </main>
        </div>
      </div>
      <OrdersModal isOpen={modals.orders} onClose={() => closeModal('orders')} />
      <InvoicesModal isOpen={modals.invoices} onClose={() => closeModal('invoices')} />
      {subscription && (
        <>
          <ChangePlanModal
            isOpen={modals.changePlan}
            onClose={() => closeModal('changePlan')}
            currentPlan={{
              id: subscription.id,
              name: subscription.plan.name,
              price: subscription.plan.price
            }}
            availablePlans={availablePlans ?? []}
            onPlanChange={handlePlanChange}
          />
          <UpdateAddressModal
            isOpen={modals.updateAddress}
            onClose={() => closeModal('updateAddress')}
            currentAddress={subscription.shippingAddress}
            onAddressUpdate={handleAddressUpdate}
          />
          <UpdatePaymentModal
            isOpen={modals.updatePayment}
            onClose={() => closeModal('updatePayment')}
            currentPaymentMethod={{
              type: (subscription.paymentMethod || 'PIX') as any,
              last4: subscription.paymentMethodLast4 || undefined
            }}
            onPaymentUpdate={handlePaymentUpdate}
          />
        </>
      )}
      <ToastContainer toasts={toasts} onRemove={removeToast} />
      {isLoading && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-lg flex flex-col items-center gap-3">
            <div className="h-8 w-8 border-2 border-cyan-600 border-t-transparent rounded-full animate-spin" />
            <p className="text-sm text-gray-600">Processando solicitação...</p>
          </div>
        </div>
      )}
    </div>
  )
}

export default function DashboardPage() {
  return (
    <PricingPlansProvider>
      <DashboardContent />
    </PricingPlansProvider>
  )
}
