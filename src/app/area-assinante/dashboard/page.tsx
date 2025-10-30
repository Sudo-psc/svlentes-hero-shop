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
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Separator } from '@/components/ui/separator'
import { Logo } from '@/components/ui/logo'
import { formatCurrency, formatDate } from '@/lib/formatters'
import { getSubscriptionStatusColor, getSubscriptionStatusLabel } from '@/lib/subscription-helpers'
import { STRIPE_BILLING_PORTAL_URL } from '@/lib/constants'
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
        section?.scrollIntoView({ behavior: 'smooth', block: 'start' })
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
  const handlePortalAccess = () => {
    if (!STRIPE_BILLING_PORTAL_URL || STRIPE_BILLING_PORTAL_URL.includes('test00000000000000000')) {
      showInfo('Portal indisponível', 'Entre em contato com o suporte para ajustar sua cobrança.')
      return
    }
    window.open(STRIPE_BILLING_PORTAL_URL, '_blank', 'noopener,noreferrer')
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
    <div className="min-h-screen bg-[#F5F7FB] text-gray-900">
      <div className="flex min-h-screen">
        <aside className="hidden xl:flex w-72 bg-white border-r border-gray-200 flex-col">
          <div className="px-6 pt-8 pb-6 border-b border-gray-200">
            <Link href="/" className="flex items-center gap-3">
              <div className="h-10 w-10">
                <Logo size="md" variant="header" />
              </div>
              <div>
                <p className="text-xs uppercase text-gray-400 tracking-wide">SV Lentes</p>
                <p className="text-lg font-semibold text-gray-900">Área do Assinante</p>
              </div>
            </Link>
            <div className="mt-6 flex items-center gap-3">
              <div className="h-12 w-12 rounded-full bg-cyan-100 text-cyan-700 flex items-center justify-center text-lg font-semibold overflow-hidden">
                {avatarUrl ? (
                  <img src={avatarUrl} alt={userName} className="h-full w-full object-cover" />
                ) : (
                  <span>{avatarInitials}</span>
                )}
              </div>
              <div>
                <p className="font-semibold text-gray-900">{userName}</p>
                <p className="text-sm text-gray-500">{userEmail}</p>
              </div>
            </div>
          </div>
          <nav className="flex-1 px-4 py-6 space-y-1">
            {navigation.map(item => (
              <button
                key={item.label}
                onClick={item.onClick}
                className={cn(
                  'w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors',
                  item.active
                    ? 'bg-cyan-50 text-cyan-700'
                    : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                )}
              >
                <item.icon className="h-4 w-4" />
                {item.label}
                {item.active && <span className="ml-auto h-2 w-2 rounded-full bg-cyan-600" />}
              </button>
            ))}
            <Separator className="my-6" />
            <button
              onClick={() => signOut()}
              className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-red-600 hover:bg-red-50 transition-colors"
            >
              <LogOut className="h-4 w-4" />
              Sair
            </button>
          </nav>
          <div className="px-6 py-6 border-t border-gray-200">
            <div className="rounded-xl bg-cyan-50 p-4">
              <div className="flex items-start gap-3">
                <div className="p-2 rounded-full bg-white text-cyan-600">
                  <LifeBuoy className="h-4 w-4" />
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-semibold text-cyan-900">Precisa de ajuda?</p>
                  <p className="text-sm text-cyan-700 leading-relaxed">
                    Fale com nossa equipe de suporte e receba atendimento prioritário.
                  </p>
                </div>
              </div>
              <Button size="sm" variant="outline" className="mt-4 w-full" onClick={handleSupportWhatsApp}>
                <MessageCircle className="h-4 w-4 mr-2" /> Falar no WhatsApp
              </Button>
            </div>
          </div>
        </aside>
        <div className="flex-1 flex flex-col">
          <header className="bg-white border-b border-gray-200">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-sm text-gray-500">Bem-vindo de volta, {userName.split(' ')[0]}!</p>
                <h1 className="text-3xl font-bold text-gray-900">Meu Dashboard</h1>
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
          <main className="flex-1 overflow-y-auto">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
              {!subscription && (
                <Card className="border-dashed border-2 border-cyan-200 bg-white">
                  <CardContent className="py-12 flex flex-col items-center text-center gap-4">
                    <Wallet className="h-12 w-12 text-cyan-500" />
                    <h2 className="text-2xl font-semibold text-gray-900">Você ainda não possui uma assinatura ativa</h2>
                    <p className="text-gray-600 max-w-xl">
                      Escolha o plano ideal para receber suas lentes com acompanhamento médico e benefícios exclusivos.
                    </p>
                    <div className="flex flex-wrap gap-3 justify-center">
                      <Button size="lg" onClick={() => router.push('/planos')}>
                        <ArrowRight className="h-4 w-4 mr-2" /> Conhecer planos
                      </Button>
                      <Button size="lg" variant="outline" onClick={handleSupportWhatsApp}>
                        <MessageCircle className="h-4 w-4 mr-2" /> Falar com um especialista
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )}
              {subscription && (
                <div className="space-y-8">
                  <div className="grid gap-6 xl:grid-cols-[2fr_1fr]">
                    <div className="space-y-6">
                      <Card className="bg-white shadow-sm border border-gray-100">
                        <CardHeader className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                          <div>
                            <CardTitle className="text-2xl flex items-center gap-2">
                              <CreditCard className="h-5 w-5 text-cyan-600" /> Pagamentos
                            </CardTitle>
                            <CardDescription>Veja o status da sua assinatura e gerencie suas cobranças.</CardDescription>
                          </div>
                          <Badge className={cn('px-3 py-1 text-xs font-semibold', getSubscriptionStatusColor(subscription.status))}>
                            {getSubscriptionStatusLabel(subscription.status)}
                          </Badge>
                        </CardHeader>
                        <CardContent className="space-y-6">
                          <div className="grid gap-4 lg:grid-cols-2">
                            <div className="flex items-start gap-3 p-4 rounded-lg border border-gray-100 bg-gray-50">
                              <div className="p-2 rounded-full bg-cyan-100 text-cyan-700">
                                <Wallet className="h-5 w-5" />
                              </div>
                              <div>
                                <p className="text-sm text-gray-500">Plano atual</p>
                                <p className="text-lg font-semibold text-gray-900">{subscription.plan.name}</p>
                                <p className="text-sm text-gray-600">{formatCurrency(subscription.plan.price)} · {billingLabel}</p>
                              </div>
                            </div>
                            <div className="flex items-start gap-3 p-4 rounded-lg border border-gray-100 bg-gray-50">
                              <div className="p-2 rounded-full bg-purple-100 text-purple-700">
                                <Calendar className="h-5 w-5" />
                              </div>
                              <div>
                                <p className="text-sm text-gray-500">Próxima cobrança</p>
                                <p className="text-lg font-semibold text-gray-900">
                                  {formatDate(subscription.nextBillingDate)}
                                </p>
                                <p className="text-sm text-gray-600">Ciclo atual até {formatDate(subscription.currentPeriodEnd)}</p>
                              </div>
                            </div>
                          </div>
                          <div className="grid gap-4 lg:grid-cols-2">
                            <div className="flex items-start gap-3 p-4 rounded-lg border border-gray-100 bg-gray-50">
                              <div className="p-2 rounded-full bg-amber-100 text-amber-700">
                                <CreditCard className="h-5 w-5" />
                              </div>
                              <div>
                                <p className="text-sm text-gray-500">Forma de pagamento</p>
                                <p className="text-lg font-semibold text-gray-900">{paymentLabel}</p>
                                <Button variant="ghost" className="mt-2 px-0 text-sm text-cyan-600 hover:text-cyan-700" onClick={() => openModal('updatePayment')}>
                                  Atualizar pagamento <ChevronRight className="h-4 w-4 ml-1" />
                                </Button>
                              </div>
                            </div>
                            <div className="flex items-start gap-3 p-4 rounded-lg border border-gray-100 bg-gray-50">
                              <div className="p-2 rounded-full bg-green-100 text-green-700">
                                <MapPin className="h-5 w-5" />
                              </div>
                              <div>
                                <p className="text-sm text-gray-500">Endereço de entrega</p>
                                {subscription.shippingAddress ? (
                                  <p className="text-sm text-gray-700 leading-relaxed">
                                    {subscription.shippingAddress.street}, {subscription.shippingAddress.number}
                                    {subscription.shippingAddress.complement ? `, ${subscription.shippingAddress.complement}` : ''}
                                    <br />
                                    {subscription.shippingAddress.city} - {subscription.shippingAddress.state}
                                  </p>
                                ) : (
                                  <p className="text-sm text-gray-600">Nenhum endereço cadastrado</p>
                                )}
                                <Button variant="ghost" className="mt-2 px-0 text-sm text-cyan-600 hover:text-cyan-700" onClick={() => openModal('updateAddress')}>
                                  Atualizar endereço <ChevronRight className="h-4 w-4 ml-1" />
                                </Button>
                              </div>
                            </div>
                          </div>
                          <div className="flex flex-wrap gap-3">
                            <Button variant="outline" onClick={() => openModal('invoices')}>
                              <FileText className="h-4 w-4 mr-2" /> Histórico de transações
                            </Button>
                            <Button variant="outline" onClick={() => openModal('orders')}>
                              <ShoppingBag className="h-4 w-4 mr-2" /> Meus pedidos
                            </Button>
                            <Button onClick={() => openModal('changePlan')}>
                              <Layers className="h-4 w-4 mr-2" /> Alterar plano
                            </Button>
                            <Button variant="ghost" onClick={handlePortalAccess}>
                              <CreditCard className="h-4 w-4 mr-2" /> Portal de pagamento
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                      <Card className="border border-gray-100">
                        <CardHeader>
                          <CardTitle className="flex items-center gap-2 text-gray-900">
                            <ClipboardList className="h-5 w-5 text-cyan-600" /> Ações rápidas
                          </CardTitle>
                          <CardDescription>Gerencie suas informações com poucos cliques.</CardDescription>
                        </CardHeader>
                        <CardContent>
                          <div className="grid gap-4 sm:grid-cols-2">
                            {quickActions.map(action => (
                              <button
                                key={action.label}
                                onClick={action.onClick}
                                className="group flex flex-col items-start gap-2 rounded-lg border border-gray-100 p-4 text-left hover:border-cyan-200 hover:bg-cyan-50 transition-colors"
                              >
                                <div className="p-2 rounded-full bg-cyan-100 text-cyan-700">
                                  <action.icon className="h-4 w-4" />
                                </div>
                                <p className="text-sm font-semibold text-gray-900 group-hover:text-cyan-700">{action.label}</p>
                                <p className="text-sm text-gray-600 leading-relaxed">{action.description}</p>
                              </button>
                            ))}
                          </div>
                        </CardContent>
                      </Card>
                      <Card id="gamificacao" className="bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 text-white shadow-lg border-none">
                        <CardHeader>
                          <CardTitle className="flex items-center gap-2 text-white">
                            <Sparkles className="h-5 w-5" /> Gamificação
                          </CardTitle>
                          <CardDescription className="text-white/80">
                            Acompanhe sua evolução e desbloqueie benefícios exclusivos.
                          </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                          <div className="flex flex-wrap items-center gap-6">
                            <div>
                              <p className="text-sm uppercase tracking-wide text-white/70">Pontuação total</p>
                              <p className="text-4xl font-bold">{gamificationPoints.toLocaleString('pt-BR')} pts</p>
                            </div>
                            <div className="flex items-center gap-3">
                              <div className="text-4xl">🏆</div>
                              <div>
                                <p className="text-sm text-white/70">Seu nível</p>
                                <p className="text-2xl font-semibold">Cliente Nível {gamificationLevel}</p>
                              </div>
                            </div>
                          </div>
                          <div>
                            <div className="flex items-center justify-between text-sm text-white/80 mb-2">
                              <span>Próximo nível</span>
                              <span>{Math.round(gamificationProgress)}% completo</span>
                            </div>
                            <Progress value={gamificationProgress} className="h-2 bg-white/20" />
                          </div>
                          <div className="grid gap-4 sm:grid-cols-3">
                            <div className="rounded-xl bg-white/15 p-4">
                              <p className="text-sm text-white/80">Sequência atual</p>
                              <p className="text-xl font-semibold">{gamificationProfile?.points.streakDays ?? 0} dias 🔥</p>
                            </div>
                            <div className="rounded-xl bg-white/15 p-4">
                              <p className="text-sm text-white/80">Missões ativas</p>
                              <p className="text-xl font-semibold">{gamificationProfile?.missions?.filter(m => !m.completedAt && m.isActive).length ?? 0}</p>
                            </div>
                            <div className="rounded-xl bg-white/15 p-4">
                              <p className="text-sm text-white/80">Conquistas</p>
                              <p className="text-xl font-semibold">{gamificationProfile?.achievements?.filter(a => a.unlockedAt).length ?? 0} desbloqueadas</p>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                      <Card className="border border-gray-100">
                        <CardHeader>
                          <CardTitle className="flex items-center gap-2">
                            <Trophy className="h-5 w-5 text-cyan-600" /> Minhas conquistas
                          </CardTitle>
                          <CardDescription>Continue avançando para desbloquear mais recompensas.</CardDescription>
                        </CardHeader>
                        <CardContent>
                          {gamificationLoading && (
                            <div className="flex items-center justify-center py-6 text-gray-500">Carregando conquistas...</div>
                          )}
                          {!gamificationLoading && gamificationError && (
                            <div className="py-6 text-sm text-red-500">{gamificationError}</div>
                          )}
                          {!gamificationLoading && !gamificationError && (
                            <div className="grid gap-4 sm:grid-cols-3">
                              {achievements.map(achievement => (
                                <div key={achievement.id} className="rounded-lg border border-gray-100 p-4 bg-gray-50">
                                  <div className="flex items-center gap-2 mb-2">
                                    <div className="text-2xl">{achievement.icon}</div>
                                    <p className="font-semibold text-gray-900">{achievement.name}</p>
                                  </div>
                                  <p className="text-sm text-gray-600 leading-relaxed">{achievement.description}</p>
                                </div>
                              ))}
                              {achievements.length === 0 && (
                                <div className="col-span-full py-6 text-center text-sm text-gray-500">
                                  Nenhuma conquista disponível no momento. Conclua missões para desbloquear.
                                </div>
                              )}
                            </div>
                          )}
                        </CardContent>
                      </Card>
                      <Card className="border border-gray-100">
                        <CardHeader>
                          <CardTitle className="flex items-center gap-2">
                            <Clock className="h-5 w-5 text-cyan-600" /> Histórico da assinatura
                          </CardTitle>
                          <CardDescription>Acompanhe os principais eventos e atualizações.</CardDescription>
                        </CardHeader>
                        <CardContent>
                          <SubscriptionHistoryTimeline userId={authUser.uid} />
                        </CardContent>
                      </Card>
                    </div>
                    <div className="space-y-6">
                      <Card className="border border-gray-100">
                        <CardHeader>
                          <CardTitle className="flex items-center gap-2">
                            <Bell className="h-5 w-5 text-cyan-600" /> Lembretes
                          </CardTitle>
                          <CardDescription>Mantenha-se em dia com sua rotina de cuidados.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                          <div className="rounded-lg border border-gray-100 p-4 bg-gray-50">
                            <p className="text-sm font-semibold text-gray-900">Renovação do plano</p>
                            <p className="text-sm text-gray-600">Renovar até {formatDate(subscription.nextBillingDate)}</p>
                          </div>
                          <div className="rounded-lg border border-gray-100 p-4 bg-gray-50">
                            <p className="text-sm font-semibold text-gray-900">Consulta médica</p>
                            <p className="text-sm text-gray-600">Agende um acompanhamento antes de {formatDate(subscription.currentPeriodEnd)}</p>
                          </div>
                          <Button variant="outline" className="w-full" onClick={() => router.push('/area-assinante/configuracoes')}>
                            <Bell className="h-4 w-4 mr-2" /> Configurar notificações
                          </Button>
                        </CardContent>
                      </Card>
                      <Card className="border border-gray-100">
                        <CardHeader>
                          <CardTitle className="flex items-center gap-2">
                            <MessageCircle className="h-5 w-5 text-cyan-600" /> Contato
                          </CardTitle>
                          <CardDescription>Nossa equipe está pronta para ajudar você.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                          <div className="rounded-lg border border-gray-100 p-4 bg-gray-50 flex items-center justify-between">
                            <div>
                              <p className="text-sm font-semibold text-gray-900">WhatsApp</p>
                              <p className="text-sm text-gray-600">(33) 98606-1427</p>
                            </div>
                            <Button size="sm" onClick={handleSupportWhatsApp}>
                              <MessageCircle className="h-4 w-4 mr-2" /> Enviar mensagem
                            </Button>
                          </div>
                          <div className="rounded-lg border border-gray-100 p-4 bg-gray-50 flex items-center justify-between">
                            <div>
                              <p className="text-sm font-semibold text-gray-900">Telefone</p>
                              <p className="text-sm text-gray-600">(33) 98606-1427</p>
                            </div>
                            <Button size="sm" variant="outline" onClick={handleSupportCall}>
                              <Phone className="h-4 w-4 mr-2" /> Ligar agora
                            </Button>
                          </div>
                          <div className="rounded-lg border border-gray-100 p-4 bg-gray-50 flex items-center justify-between">
                            <div>
                              <p className="text-sm font-semibold text-gray-900">E-mail</p>
                              <p className="text-sm text-gray-600">oi@svlentes.com.br</p>
                            </div>
                            <Button size="sm" variant="ghost" onClick={handleSupportEmail}>
                              <Mail className="h-4 w-4 mr-2" /> Enviar e-mail
                            </Button>
                          </div>
                          <Button variant="outline" className="w-full" onClick={() => router.push('/contato')}>
                            <LifeBuoy className="h-4 w-4 mr-2" /> Abrir ticket de suporte
                          </Button>
                        </CardContent>
                      </Card>
                      <Card className="border border-gray-100">
                        <CardHeader>
                          <CardTitle className="flex items-center gap-2">
                            <Gift className="h-5 w-5 text-cyan-600" /> Suas recompensas
                          </CardTitle>
                          <CardDescription>Resgate benefícios exclusivos com seus pontos.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                          {availableRewards.map(reward => {
                            const isClaimed = claimedRewards.includes(reward.id)
                            const canClaim = (gamificationProfile?.points.totalPoints ?? 0) >= reward.pointsCost
                            return (
                              <div key={reward.id} className="rounded-lg border border-gray-100 p-4 bg-gray-50 space-y-3">
                                <div className="flex items-start gap-3">
                                  <div className="p-2 rounded-full bg-cyan-100 text-cyan-700">
                                    {reward.icon ? (
                                      <reward.icon className="h-5 w-5" />
                                    ) : null}
                                  </div>
                                  <div className="flex-1">
                                    <p className="font-semibold text-gray-900">{reward.name}</p>
                                    <p className="text-sm text-gray-600 leading-relaxed">{reward.description}</p>
                                  </div>
                                  <Badge variant="outline" className="text-xs">
                                    {reward.pointsCost.toLocaleString('pt-BR')} pts
                                  </Badge>
                                </div>
                                <div className="flex flex-wrap gap-3">
                                  <Button
                                    size="sm"
                                    onClick={() => handleClaimReward(reward.id)}
                                    disabled={!canClaim || isClaimed || claimingReward === reward.id}
                                  >
                                    {isClaimed ? (
                                      <>
                                        <CheckCircle2 className="h-4 w-4 mr-2" /> Resgatado
                                      </>
                                    ) : (
                                      <>
                                        <ShoppingCart className="h-4 w-4 mr-2" /> Adicionar ao carrinho
                                      </>
                                    )}
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => handleCopyRewardCode(reward.id.toUpperCase())}
                                  >
                                    <Copy className="h-4 w-4 mr-2" /> Copiar código
                                  </Button>
                                </div>
                              </div>
                            )
                          })}
                          {availableRewards.length === 0 && (
                            <p className="text-sm text-gray-500">Nenhuma recompensa disponível no momento.</p>
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

export const dynamic = 'force-dynamic'
