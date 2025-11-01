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
  const handlePortalAccess = () => {
    if (!STRIPE_BILLING_PORTAL_URL) {
      showError('Portal indisponível', 'Configuração do portal de pagamento não encontrada. Entre em contato com o suporte.')
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
        <aside className="hidden xl:flex w-72 bg-gradient-to-b from-white to-gray-50 border-r border-gray-200/80 flex-col shadow-sm">
          <div className="px-6 pt-8 pb-6 border-b border-gray-200/80">
            <div className="mb-6">
              <h2 className="text-2xl font-bold bg-gradient-to-r from-cyan-600 to-cyan-500 bg-clip-text text-transparent">
                Área do Assinante
              </h2>
              <p className="text-xs uppercase text-gray-500 tracking-wider mt-1">SV Lentes</p>
            </div>
            <div className="flex items-center gap-3 p-3 rounded-xl bg-white shadow-sm border border-gray-100 hover:shadow-md transition-all duration-300">
              <div className="h-12 w-12 rounded-full bg-gradient-to-br from-cyan-500 to-cyan-600 text-white flex items-center justify-center text-lg font-semibold overflow-hidden shadow-md">
                {avatarUrl ? (
                  <img src={avatarUrl} alt={userName} className="h-full w-full object-cover" />
                ) : (
                  <span>{avatarInitials}</span>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-gray-900 truncate">{userName}</p>
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
                  'w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-300',
                  item.active
                    ? 'bg-gradient-to-r from-cyan-500 to-cyan-600 text-white shadow-md shadow-cyan-200 scale-[1.02]'
                    : 'text-gray-700 hover:bg-gradient-to-r hover:from-gray-50 hover:to-gray-100 hover:text-gray-900 hover:shadow-sm hover:scale-[1.01]'
                )}
              >
                <item.icon className="h-5 w-5 flex-shrink-0" />
                <span className="flex-1 text-left">{item.label}</span>
                {item.active && <span className="ml-auto h-2 w-2 rounded-full bg-white animate-pulse" />}
              </button>
            ))}
            <Separator className="my-6 bg-gray-200" />
            <button
              onClick={() => signOut()}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-red-600 hover:bg-gradient-to-r hover:from-red-50 hover:to-red-100 hover:shadow-sm hover:scale-[1.01] transition-all duration-300"
            >
              <LogOut className="h-5 w-5 flex-shrink-0" />
              <span className="flex-1 text-left">Sair</span>
            </button>
          </nav>
          <div className="px-6 py-6 border-t border-gray-200/80">
            <div className="rounded-2xl bg-gradient-to-br from-cyan-50 to-cyan-100/50 p-5 shadow-sm border border-cyan-200/50 hover:shadow-md transition-all duration-300">
              <div className="flex items-start gap-3 mb-4">
                <div className="p-2.5 rounded-xl bg-white text-cyan-600 shadow-sm">
                  <LifeBuoy className="h-5 w-5" />
                </div>
                <div className="space-y-1 flex-1">
                  <p className="text-sm font-bold text-cyan-900">Precisa de ajuda?</p>
                  <p className="text-xs text-cyan-700 leading-relaxed">
                    Fale com nossa equipe de suporte e receba atendimento prioritário.
                  </p>
                </div>
              </div>
              <Button 
                size="sm" 
                className="w-full bg-gradient-to-r from-cyan-600 to-cyan-500 hover:from-cyan-700 hover:to-cyan-600 text-white shadow-md hover:shadow-lg transition-all duration-300" 
                onClick={handleSupportWhatsApp}
              >
                <MessageCircle className="h-4 w-4 mr-2" /> Falar no WhatsApp
              </Button>
            </div>
          </div>
        </aside>
        <div className="flex-1 flex flex-col">
          <header className="bg-gradient-to-r from-white via-gray-50 to-white border-b border-gray-200/80 shadow-sm">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-sm font-medium text-cyan-600">Bem-vindo de volta, {userName.split(' ')[0]}! 👋</p>
                <h1 className="text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">Meu Dashboard</h1>
              </div>
              <div className="flex items-center gap-3">
                <Button
                  variant="outline"
                  className="hidden sm:inline-flex border-gray-300 hover:border-cyan-500 hover:bg-cyan-50 hover:text-cyan-700 transition-all duration-300 shadow-sm hover:shadow-md"
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
                <Card className="border-dashed border-2 border-cyan-300 bg-gradient-to-br from-cyan-50 to-white shadow-lg hover:shadow-xl transition-all duration-300">
                  <CardContent className="py-16 flex flex-col items-center text-center gap-6">
                    <div className="p-6 rounded-3xl bg-gradient-to-br from-cyan-500 to-cyan-600 text-white shadow-2xl">
                      <Wallet className="h-16 w-16" />
                    </div>
                    <h2 className="text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">Você ainda não possui uma assinatura ativa</h2>
                    <p className="text-gray-700 max-w-xl text-lg font-medium leading-relaxed">
                      Escolha o plano ideal para receber suas lentes com acompanhamento médico e benefícios exclusivos.
                    </p>
                    <div className="flex flex-wrap gap-4 justify-center mt-4">
                      <Button size="lg" className="bg-gradient-to-r from-cyan-600 to-cyan-500 hover:from-cyan-700 hover:to-cyan-600 shadow-lg hover:shadow-xl transition-all duration-300 text-base px-8" onClick={() => router.push('/planos')}>
                        <ArrowRight className="h-5 w-5 mr-2" /> Conhecer planos
                      </Button>
                      <Button size="lg" variant="outline" className="border-2 border-cyan-600 text-cyan-700 hover:bg-cyan-50 shadow-md hover:shadow-lg transition-all duration-300 text-base px-8" onClick={handleSupportWhatsApp}>
                        <MessageCircle className="h-5 w-5 mr-2" /> Falar com um especialista
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )}
              {subscription && (
                <div className="space-y-8">
                  <div className="grid gap-6 xl:grid-cols-[2fr_1fr]">
                    <div className="space-y-6">
                      <Card className="bg-white shadow-md border border-gray-100 hover:shadow-xl transition-all duration-300 hover:border-cyan-200">
                        <CardHeader className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                          <div>
                            <CardTitle className="text-2xl flex items-center gap-3 font-bold">
                              <div className="p-2 rounded-xl bg-gradient-to-br from-cyan-500 to-cyan-600 text-white shadow-md">
                                <CreditCard className="h-5 w-5" />
                              </div>
                              Pagamentos
                            </CardTitle>
                            <CardDescription className="text-gray-600 mt-2">Veja o status da sua assinatura e gerencie suas cobranças.</CardDescription>
                          </div>
                          <Badge className={cn('px-4 py-2 text-xs font-bold shadow-sm', getSubscriptionStatusColor(subscription.status))}>
                            {getSubscriptionStatusLabel(subscription.status)}
                          </Badge>
                        </CardHeader>
                        <CardContent className="space-y-6">
                          <div className="grid gap-4 lg:grid-cols-2">
                            <div className="flex items-start gap-3 p-5 rounded-2xl border border-cyan-200/50 bg-gradient-to-br from-cyan-50 to-white shadow-sm hover:shadow-md transition-all duration-300 hover:border-cyan-300">
                              <div className="p-2.5 rounded-xl bg-gradient-to-br from-cyan-500 to-cyan-600 text-white shadow-md">
                                <Wallet className="h-5 w-5" />
                              </div>
                              <div>
                                <p className="text-xs font-medium text-cyan-700 uppercase tracking-wide">Plano atual</p>
                                <p className="text-lg font-bold text-gray-900 mt-1">{subscription.plan.name}</p>
                                <p className="text-sm font-medium text-gray-600 mt-0.5">{formatCurrency(subscription.plan.price)} · {billingLabel}</p>
                              </div>
                            </div>
                            <div className="flex items-start gap-3 p-5 rounded-2xl border border-purple-200/50 bg-gradient-to-br from-purple-50 to-white shadow-sm hover:shadow-md transition-all duration-300 hover:border-purple-300">
                              <div className="p-2.5 rounded-xl bg-gradient-to-br from-purple-500 to-purple-600 text-white shadow-md">
                                <Calendar className="h-5 w-5" />
                              </div>
                              <div>
                                <p className="text-xs font-medium text-purple-700 uppercase tracking-wide">Próxima cobrança</p>
                                <p className="text-lg font-bold text-gray-900 mt-1">
                                  {formatDate(subscription.nextBillingDate)}
                                </p>
                                <p className="text-sm font-medium text-gray-600 mt-0.5">Ciclo atual até {formatDate(subscription.currentPeriodEnd)}</p>
                              </div>
                            </div>
                          </div>
                          <div className="grid gap-4 lg:grid-cols-2">
                            <div className="flex items-start gap-3 p-5 rounded-2xl border border-amber-200/50 bg-gradient-to-br from-amber-50 to-white shadow-sm hover:shadow-md transition-all duration-300 hover:border-amber-300">
                              <div className="p-2.5 rounded-xl bg-gradient-to-br from-amber-500 to-amber-600 text-white shadow-md">
                                <CreditCard className="h-5 w-5" />
                              </div>
                              <div className="flex-1">
                                <p className="text-xs font-medium text-amber-700 uppercase tracking-wide">Forma de pagamento</p>
                                <p className="text-lg font-bold text-gray-900 mt-1">{paymentLabel}</p>
                                <Button variant="ghost" className="mt-2 px-0 h-auto text-sm font-semibold text-cyan-600 hover:text-cyan-700 hover:bg-transparent transition-colors" onClick={() => openModal('updatePayment')}>
                                  Atualizar pagamento <ChevronRight className="h-4 w-4 ml-1" />
                                </Button>
                              </div>
                            </div>
                            <div className="flex items-start gap-3 p-5 rounded-2xl border border-green-200/50 bg-gradient-to-br from-green-50 to-white shadow-sm hover:shadow-md transition-all duration-300 hover:border-green-300">
                              <div className="p-2.5 rounded-xl bg-gradient-to-br from-green-500 to-green-600 text-white shadow-md">
                                <MapPin className="h-5 w-5" />
                              </div>
                              <div className="flex-1">
                                <p className="text-xs font-medium text-green-700 uppercase tracking-wide">Endereço de entrega</p>
                                {subscription.shippingAddress ? (
                                  <p className="text-sm font-medium text-gray-700 leading-relaxed mt-1">
                                    {subscription.shippingAddress.street}, {subscription.shippingAddress.number}
                                    {subscription.shippingAddress.complement ? `, ${subscription.shippingAddress.complement}` : ''}
                                    <br />
                                    {subscription.shippingAddress.city} - {subscription.shippingAddress.state}
                                  </p>
                                ) : (
                                  <p className="text-sm font-medium text-gray-600 mt-1">Nenhum endereço cadastrado</p>
                                )}
                                <Button variant="ghost" className="mt-2 px-0 h-auto text-sm font-semibold text-cyan-600 hover:text-cyan-700 hover:bg-transparent transition-colors" onClick={() => openModal('updateAddress')}>
                                  Atualizar endereço <ChevronRight className="h-4 w-4 ml-1" />
                                </Button>
                              </div>
                            </div>
                          </div>
                          <div className="flex flex-wrap gap-3">
                            <Button variant="outline" className="border-gray-300 hover:border-cyan-500 hover:bg-cyan-50 hover:text-cyan-700 shadow-sm hover:shadow-md transition-all duration-300" onClick={() => openModal('invoices')}>
                              <FileText className="h-4 w-4 mr-2" /> Histórico de transações
                            </Button>
                            <Button variant="outline" className="border-gray-300 hover:border-cyan-500 hover:bg-cyan-50 hover:text-cyan-700 shadow-sm hover:shadow-md transition-all duration-300" onClick={() => openModal('orders')}>
                              <ShoppingBag className="h-4 w-4 mr-2" /> Meus pedidos
                            </Button>
                            <Button className="bg-gradient-to-r from-cyan-600 to-cyan-500 hover:from-cyan-700 hover:to-cyan-600 shadow-md hover:shadow-lg transition-all duration-300" onClick={() => openModal('changePlan')}>
                              <Layers className="h-4 w-4 mr-2" /> Alterar plano
                            </Button>
                            <Button variant="ghost" className="hover:bg-gray-100 transition-all duration-300" onClick={handlePortalAccess}>
                              <CreditCard className="h-4 w-4 mr-2" /> Portal de pagamento
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                      <Card className="border border-gray-100 shadow-md hover:shadow-xl transition-all duration-300">
                        <CardHeader>
                          <CardTitle className="flex items-center gap-3 text-gray-900 font-bold">
                            <div className="p-2 rounded-xl bg-gradient-to-br from-cyan-500 to-cyan-600 text-white shadow-md">
                              <ClipboardList className="h-5 w-5" />
                            </div>
                            Ações rápidas
                          </CardTitle>
                          <CardDescription className="text-gray-600 mt-2">Gerencie suas informações com poucos cliques.</CardDescription>
                        </CardHeader>
                        <CardContent>
                          <div className="grid gap-4 sm:grid-cols-2">
                            {quickActions.map(action => (
                              <button
                                key={action.label}
                                onClick={action.onClick}
                                className="group flex flex-col items-start gap-3 rounded-2xl border border-gray-200 p-5 text-left hover:border-cyan-300 hover:bg-gradient-to-br hover:from-cyan-50 hover:to-white hover:shadow-lg transition-all duration-300 hover:scale-[1.02]"
                              >
                                <div className="p-2.5 rounded-xl bg-cyan-100 text-cyan-700 group-hover:bg-gradient-to-br group-hover:from-cyan-500 group-hover:to-cyan-600 group-hover:text-white group-hover:shadow-md transition-all duration-300">
                                  <action.icon className="h-5 w-5" />
                                </div>
                                <p className="text-sm font-bold text-gray-900 group-hover:text-cyan-700 transition-colors">{action.label}</p>
                                <p className="text-xs text-gray-600 leading-relaxed">{action.description}</p>
                              </button>
                            ))}
                          </div>
                        </CardContent>
                      </Card>
                      <Card id="gamificacao" className="bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-600 text-white shadow-2xl border-none hover:shadow-3xl transition-all duration-300 hover:scale-[1.01]">
                        <CardHeader>
                          <CardTitle className="flex items-center gap-3 text-white font-bold text-2xl">
                            <div className="p-2 rounded-xl bg-white/20 backdrop-blur-sm">
                              <Sparkles className="h-6 w-6" />
                            </div>
                            Gamificação
                          </CardTitle>
                          <CardDescription className="text-white/90 text-base mt-2">
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
                            <div className="rounded-2xl bg-white/20 backdrop-blur-sm p-5 shadow-lg hover:bg-white/30 hover:shadow-xl transition-all duration-300 hover:scale-[1.05]">
                              <p className="text-xs font-semibold text-white/90 uppercase tracking-wide">Sequência atual</p>
                              <p className="text-2xl font-bold mt-2">{gamificationProfile?.points.streakDays ?? 0} dias 🔥</p>
                            </div>
                            <div className="rounded-2xl bg-white/20 backdrop-blur-sm p-5 shadow-lg hover:bg-white/30 hover:shadow-xl transition-all duration-300 hover:scale-[1.05]">
                              <p className="text-xs font-semibold text-white/90 uppercase tracking-wide">Missões ativas</p>
                              <p className="text-2xl font-bold mt-2">{gamificationProfile?.missions?.filter(m => !m.completedAt && m.isActive).length ?? 0}</p>
                            </div>
                            <div className="rounded-2xl bg-white/20 backdrop-blur-sm p-5 shadow-lg hover:bg-white/30 hover:shadow-xl transition-all duration-300 hover:scale-[1.05]">
                              <p className="text-xs font-semibold text-white/90 uppercase tracking-wide">Conquistas</p>
                              <p className="text-2xl font-bold mt-2">{gamificationProfile?.achievements?.filter(a => a.unlockedAt).length ?? 0} desbloqueadas</p>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                      <Card className="border border-gray-100 shadow-md hover:shadow-xl transition-all duration-300">
                        <CardHeader>
                          <CardTitle className="flex items-center gap-3 font-bold">
                            <div className="p-2 rounded-xl bg-gradient-to-br from-yellow-500 to-yellow-600 text-white shadow-md">
                              <Trophy className="h-5 w-5" />
                            </div>
                            Minhas conquistas
                          </CardTitle>
                          <CardDescription className="text-gray-600 mt-2">Continue avançando para desbloquear mais recompensas.</CardDescription>
                        </CardHeader>
                        <CardContent>
                          {gamificationLoading && (
                            <div className="flex items-center justify-center py-6 text-gray-500 font-medium">Carregando conquistas...</div>
                          )}
                          {!gamificationLoading && gamificationError && (
                            <div className="py-6 text-sm font-medium text-red-600">{gamificationError}</div>
                          )}
                          {!gamificationLoading && !gamificationError && (
                            <div className="grid gap-4 sm:grid-cols-3">
                              {achievements.map(achievement => (
                                <div key={achievement.id} className="rounded-2xl border border-gray-200 p-5 bg-gradient-to-br from-gray-50 to-white shadow-sm hover:shadow-md hover:border-yellow-300 transition-all duration-300 hover:scale-[1.05]">
                                  <div className="flex items-center gap-2 mb-3">
                                    <div className="text-3xl">{achievement.icon}</div>
                                    <p className="font-bold text-gray-900 text-sm">{achievement.name}</p>
                                  </div>
                                  <p className="text-xs text-gray-600 leading-relaxed">{achievement.description}</p>
                                </div>
                              ))}
                              {achievements.length === 0 && (
                                <div className="col-span-full py-8 text-center text-sm font-medium text-gray-500">
                                  Nenhuma conquista disponível no momento. Conclua missões para desbloquear.
                                </div>
                              )}
                            </div>
                          )}
                        </CardContent>
                      </Card>
                      <Card className="border border-gray-100 shadow-md hover:shadow-xl transition-all duration-300">
                        <CardHeader>
                          <CardTitle className="flex items-center gap-3 font-bold">
                            <div className="p-2 rounded-xl bg-gradient-to-br from-cyan-500 to-cyan-600 text-white shadow-md">
                              <Clock className="h-5 w-5" />
                            </div>
                            Histórico da assinatura
                          </CardTitle>
                          <CardDescription className="text-gray-600 mt-2">Acompanhe os principais eventos e atualizações.</CardDescription>
                        </CardHeader>
                        <CardContent>
                          <SubscriptionHistoryTimeline userId={authUser.uid} />
                        </CardContent>
                      </Card>
                    </div>
                    <div className="space-y-6">
                      <Card className="border border-gray-100 shadow-md hover:shadow-xl transition-all duration-300">
                        <CardHeader>
                          <CardTitle className="flex items-center gap-3 font-bold">
                            <div className="p-2 rounded-xl bg-gradient-to-br from-cyan-500 to-cyan-600 text-white shadow-md">
                              <Bell className="h-5 w-5" />
                            </div>
                            Lembretes
                          </CardTitle>
                          <CardDescription className="text-gray-600 mt-2">Mantenha-se em dia com sua rotina de cuidados.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                          <div className="rounded-2xl border border-cyan-200/50 p-4 bg-gradient-to-br from-cyan-50 to-white shadow-sm hover:shadow-md transition-all duration-300">
                            <p className="text-sm font-bold text-gray-900">Renovação do plano</p>
                            <p className="text-xs text-gray-600 mt-1">Renovar até {formatDate(subscription.nextBillingDate)}</p>
                          </div>
                          <div className="rounded-2xl border border-blue-200/50 p-4 bg-gradient-to-br from-blue-50 to-white shadow-sm hover:shadow-md transition-all duration-300">
                            <p className="text-sm font-bold text-gray-900">Consulta médica</p>
                            <p className="text-xs text-gray-600 mt-1">Agende um acompanhamento antes de {formatDate(subscription.currentPeriodEnd)}</p>
                          </div>
                          <Button variant="outline" className="w-full border-gray-300 hover:border-cyan-500 hover:bg-cyan-50 hover:text-cyan-700 shadow-sm hover:shadow-md transition-all duration-300" onClick={() => router.push('/area-assinante/configuracoes')}>
                            <Bell className="h-4 w-4 mr-2" /> Configurar notificações
                          </Button>
                        </CardContent>
                      </Card>
                      <Card className="border border-gray-100 shadow-md hover:shadow-xl transition-all duration-300">
                        <CardHeader>
                          <CardTitle className="flex items-center gap-3 font-bold">
                            <div className="p-2 rounded-xl bg-gradient-to-br from-cyan-500 to-cyan-600 text-white shadow-md">
                              <MessageCircle className="h-5 w-5" />
                            </div>
                            Contato
                          </CardTitle>
                          <CardDescription className="text-gray-600 mt-2">Nossa equipe está pronta para ajudar você.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                          <div className="rounded-2xl border border-green-200/50 p-4 bg-gradient-to-br from-green-50 to-white shadow-sm hover:shadow-md transition-all duration-300 flex items-center justify-between gap-3">
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-bold text-gray-900">WhatsApp</p>
                              <p className="text-xs text-gray-600">(33) 98606-1427</p>
                            </div>
                            <Button size="sm" className="bg-gradient-to-r from-green-600 to-green-500 hover:from-green-700 hover:to-green-600 shadow-sm hover:shadow-md transition-all duration-300 flex-shrink-0" onClick={handleSupportWhatsApp}>
                              <MessageCircle className="h-4 w-4" />
                            </Button>
                          </div>
                          <div className="rounded-2xl border border-blue-200/50 p-4 bg-gradient-to-br from-blue-50 to-white shadow-sm hover:shadow-md transition-all duration-300 flex items-center justify-between gap-3">
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-bold text-gray-900">Telefone</p>
                              <p className="text-xs text-gray-600">(33) 98606-1427</p>
                            </div>
                            <Button size="sm" variant="outline" className="border-gray-300 hover:border-blue-500 hover:bg-blue-50 hover:text-blue-700 shadow-sm hover:shadow-md transition-all duration-300 flex-shrink-0" onClick={handleSupportCall}>
                              <Phone className="h-4 w-4" />
                            </Button>
                          </div>
                          <div className="rounded-2xl border border-purple-200/50 p-4 bg-gradient-to-br from-purple-50 to-white shadow-sm hover:shadow-md transition-all duration-300 flex items-center justify-between gap-3">
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-bold text-gray-900">E-mail</p>
                              <p className="text-xs text-gray-600 truncate">oi@svlentes.com.br</p>
                            </div>
                            <Button size="sm" variant="ghost" className="hover:bg-purple-100 transition-all duration-300 flex-shrink-0" onClick={handleSupportEmail}>
                              <Mail className="h-4 w-4" />
                            </Button>
                          </div>
                          <Button variant="outline" className="w-full border-gray-300 hover:border-cyan-500 hover:bg-cyan-50 hover:text-cyan-700 shadow-sm hover:shadow-md transition-all duration-300" onClick={() => router.push('/contato')}>
                            <LifeBuoy className="h-4 w-4 mr-2" /> Abrir ticket de suporte
                          </Button>
                        </CardContent>
                      </Card>
                      <Card className="border border-gray-100 shadow-md hover:shadow-xl transition-all duration-300">
                        <CardHeader>
                          <CardTitle className="flex items-center gap-3 font-bold">
                            <div className="p-2 rounded-xl bg-gradient-to-br from-pink-500 to-pink-600 text-white shadow-md">
                              <Gift className="h-5 w-5" />
                            </div>
                            Suas recompensas
                          </CardTitle>
                          <CardDescription className="text-gray-600 mt-2">Resgate benefícios exclusivos com seus pontos.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                          {availableRewards.map(reward => {
                            const isClaimed = claimedRewards.includes(reward.id)
                            const canClaim = (gamificationProfile?.points.totalPoints ?? 0) >= reward.pointsCost
                            return (
                              <div key={reward.id} className="rounded-2xl border border-pink-200/50 p-5 bg-gradient-to-br from-pink-50 to-white shadow-sm hover:shadow-md transition-all duration-300 space-y-4">
                                <div className="flex items-start gap-3">
                                  <div className="p-2.5 rounded-xl bg-gradient-to-br from-pink-500 to-pink-600 text-white shadow-md">
                                    {reward.icon ? (
                                      <reward.icon className="h-5 w-5" />
                                    ) : null}
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <p className="font-bold text-gray-900">{reward.name}</p>
                                    <p className="text-xs text-gray-600 leading-relaxed mt-1">{reward.description}</p>
                                  </div>
                                  <Badge variant="outline" className="text-xs font-bold border-pink-300 text-pink-700 flex-shrink-0">
                                    {reward.pointsCost.toLocaleString('pt-BR')} pts
                                  </Badge>
                                </div>
                                <div className="flex flex-wrap gap-2">
                                  <Button
                                    size="sm"
                                    className="bg-gradient-to-r from-cyan-600 to-cyan-500 hover:from-cyan-700 hover:to-cyan-600 shadow-sm hover:shadow-md transition-all duration-300"
                                    onClick={() => handleClaimReward(reward.id)}
                                    disabled={!canClaim || isClaimed || claimingReward === reward.id}
                                  >
                                    {isClaimed ? (
                                      <>
                                        <CheckCircle2 className="h-4 w-4 mr-2" /> Resgatado
                                      </>
                                    ) : (
                                      <>
                                        <ShoppingCart className="h-4 w-4 mr-2" /> Resgatar
                                      </>
                                    )}
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    className="border-gray-300 hover:border-pink-500 hover:bg-pink-50 hover:text-pink-700 shadow-sm hover:shadow-md transition-all duration-300"
                                    onClick={() => handleCopyRewardCode(reward.code)}
                                  >
                                    <Copy className="h-4 w-4 mr-2" /> Copiar código
                                  </Button>
                                </div>
                              </div>
                            )
                          })}
                          {availableRewards.length === 0 && (
                            <p className="text-sm font-medium text-gray-500 text-center py-4">Nenhuma recompensa disponível no momento.</p>
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
