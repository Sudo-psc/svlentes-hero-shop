'use client'

import { useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { StripeScript } from '@/components/payment/StripeScript'
import { StripePricingTable } from '@/components/payment/StripePricingTable'
import { useAuth } from '@/contexts/AuthContext'
import { APP_CONFIG, STRIPE_BILLING_PORTAL_URL } from '@/lib/constants'
import { type LucideIcon, BadgeCheck, CreditCard, Headset, LogIn, ShieldCheck, Sparkles, Truck, Users } from 'lucide-react'

type Highlight = {
  title: string
  description: string
  icon: LucideIcon
}

const subscriberHighlights: Highlight[] = [
  {
    title: 'Pedidos e entregas em tempo real',
    description: 'Acompanhe cada envio e receba notificações quando sua caixa de lentes sair para entrega.',
    icon: Truck
  },
  {
    title: 'Pagamentos protegidos pelo Stripe',
    description: 'Atualize forma de pagamento com poucos cliques e resolva qualquer pendência com segurança.',
    icon: CreditCard
  },
  {
    title: 'Receitas sempre válidas',
    description: 'Envie prescrições digitais e receba lembretes automáticos quando for hora de renovar.',
    icon: ShieldCheck
  },
  {
    title: 'Suporte humano dedicado',
    description: 'Nossa equipe acompanha cada etapa por WhatsApp, telefone ou presencialmente na clínica.',
    icon: Headset
  }
]

const visitorBenefits: Highlight[] = [
  {
    title: 'Planos flexíveis',
    description: 'Escolha assinaturas mensais ou trimestrais e ajuste conforme seu ritmo de uso.',
    icon: Sparkles
  },
  {
    title: 'Checkout seguro',
    description: 'Pagamentos recorrentes com Stripe e dados criptografados do início ao fim.',
    icon: CreditCard
  },
  {
    title: 'Entrega programada',
    description: 'Receba suas lentes em casa com rastreio completo e reposição automática.',
    icon: Truck
  },
  {
    title: 'Atendimento personalizado',
    description: 'Conte com especialistas de visão para tirar dúvidas e acompanhar a adaptação das lentes.',
    icon: Users
  }
]

export default function AreaAssinantePage() {
  const router = useRouter()
  const { user, loading } = useAuth()
  const stripeKey = APP_CONFIG.stripe.publishableKey
  const stripeTableId = APP_CONFIG.stripe.pricingTableId
  const whatsappLink = `https://wa.me/${APP_CONFIG.whatsapp.number}`
  const hasBillingPortal = Boolean(STRIPE_BILLING_PORTAL_URL)

  useEffect(() => {
    if (!loading) {
      router.prefetch('/area-assinante/dashboard')
    }
  }, [loading, router])

  useEffect(() => {
    if (!loading && user) {
      const timeout = window.setTimeout(() => {
        router.replace('/area-assinante/dashboard')
      }, 1200)
      return () => window.clearTimeout(timeout)
    }
  }, [loading, user, router])

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-cyan-50 via-white to-slate-50">
        <div className="flex flex-col items-center gap-4 rounded-3xl bg-white/80 px-10 py-8 shadow-xl">
          <div className="h-12 w-12 animate-spin rounded-full border-2 border-cyan-500 border-t-transparent" />
          <p className="text-sm font-medium text-gray-600">Carregando sua experiência personalizada...</p>
        </div>
      </div>
    )
  }

  const firstName = user?.displayName?.split(' ')[0] || user?.email || 'assinante'

  const openBillingPortal = () => {
    if (!hasBillingPortal) {
      return
    }
    const url = STRIPE_BILLING_PORTAL_URL
    if (typeof window !== 'undefined') {
      window.open(url, '_blank', 'noopener,noreferrer')
    }
  }

  return (
    <div className="relative min-h-screen overflow-hidden bg-gradient-to-br from-cyan-50 via-white to-slate-50">
      <StripeScript publishableKey={stripeKey} includePricingTable />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(8,145,178,0.18),transparent_60%)]" />
      <main className="relative z-10 py-16">
        <div className="mx-auto flex w-full max-w-6xl flex-col gap-12 px-4 lg:flex-row lg:items-start lg:px-8">
          <section className="flex-1 space-y-10">
            {user ? (
              <div className="space-y-6">
                <span className="inline-flex items-center gap-2 rounded-full bg-cyan-100 px-4 py-1 text-xs font-semibold text-cyan-700">
                  <LogIn className="h-3.5 w-3.5" />
                  Assinante autenticado
                </span>
                <div className="space-y-4">
                  <h1 className="text-4xl font-bold text-gray-900 sm:text-5xl">Bem-vindo de volta, {firstName}.</h1>
                  <p className="max-w-2xl text-base text-gray-600">
                    Estamos carregando seu painel completo com métricas, receitas e preferências. Use os atalhos abaixo para continuar agora mesmo.
                  </p>
                </div>
                <div className="flex flex-col gap-3 sm:flex-row">
                  <Button size="lg" className="w-full sm:w-auto" onClick={() => router.push('/area-assinante/dashboard')}>
                    Acessar painel agora
                  </Button>
                  <Button
                    variant="outline"
                    size="lg"
                    className="w-full sm:w-auto"
                    onClick={openBillingPortal}
                    disabled={!hasBillingPortal}
                  >
                    Portal de cobrança Stripe
                  </Button>
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  {subscriberHighlights.map((item) => (
                    <div key={item.title} className="rounded-2xl border border-cyan-100 bg-white/90 p-5 shadow-sm backdrop-blur">
                      <item.icon className="mb-3 h-6 w-6 text-cyan-600" />
                      <h2 className="text-lg font-semibold text-gray-900">{item.title}</h2>
                      <p className="mt-2 text-sm text-gray-600">{item.description}</p>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="space-y-6">
                <span className="inline-flex items-center gap-2 rounded-full bg-cyan-100 px-4 py-1 text-xs font-semibold text-cyan-700">
                  <Sparkles className="h-3.5 w-3.5" />
                  Portal do Assinante
                </span>
                <div className="space-y-4">
                  <h1 className="text-4xl font-bold text-gray-900 sm:text-5xl">Sua jornada de lentes começa aqui.</h1>
                  <p className="max-w-2xl text-base text-gray-600">
                    Faça login para acompanhar pedidos ou assine agora mesmo e receba suas lentes com renovação automática, suporte especializado e pagamentos seguros.
                  </p>
                </div>
                <div className="flex flex-col gap-3 sm:flex-row">
                  <Button size="lg" className="w-full sm:w-auto" asChild>
                    <Link href="/area-assinante/login">Entrar na conta</Link>
                  </Button>
                  <Button variant="outline" size="lg" className="w-full sm:w-auto" asChild>
                    <Link href="/area-assinante/registro">Quero assinar</Link>
                  </Button>
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  {visitorBenefits.map((item) => (
                    <div key={item.title} className="rounded-2xl border border-cyan-100 bg-white/90 p-5 shadow-sm backdrop-blur">
                      <item.icon className="mb-3 h-6 w-6 text-cyan-600" />
                      <h2 className="text-lg font-semibold text-gray-900">{item.title}</h2>
                      <p className="mt-2 text-sm text-gray-600">{item.description}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </section>
          <aside className="w-full space-y-6 lg:max-w-md">
            <div className="rounded-3xl border border-cyan-100 bg-white/90 p-6 shadow-xl backdrop-blur">
              <h2 className="text-2xl font-semibold text-gray-900">
                {user ? 'Como aproveitar ao máximo' : 'Assine em poucos minutos'}
              </h2>
              <p className="mt-2 text-sm text-gray-600">
                {user
                  ? 'Atualize preferências, confira histórico e mantenha seus dados sempre em dia com a tecnologia Stripe.'
                  : 'Escolha o plano ideal e finalize o pagamento com cartão em um ambiente seguro e auditado pelo Stripe.'}
              </p>
              {user ? (
                <ul className="mt-5 space-y-3 text-sm text-gray-700">
                  <li className="flex items-center gap-2">
                    <BadgeCheck className="h-4 w-4 text-cyan-600" />
                    Verifique alertas de entrega e prossiga com a confirmação.
                  </li>
                  <li className="flex items-center gap-2">
                    <BadgeCheck className="h-4 w-4 text-cyan-600" />
                    Atualize endereço e forma de pagamento sem sair do painel.
                  </li>
                  <li className="flex items-center gap-2">
                    <BadgeCheck className="h-4 w-4 text-cyan-600" />
                    Acompanhe prescrições e valide recomendações do seu especialista.
                  </li>
                </ul>
              ) : (
                <div className="mt-6">
                  <StripePricingTable
                    pricingTableId={stripeTableId}
                    publishableKey={stripeKey}
                    className="rounded-2xl border border-cyan-100 bg-white"
                  />
                </div>
              )}
            </div>
            <div className="rounded-3xl bg-cyan-900 p-6 text-white shadow-xl">
              <h3 className="text-xl font-semibold">Precisa de ajuda agora?</h3>
              <p className="mt-2 text-sm text-cyan-100">
                Nossa equipe está disponível para ajudar com assinatura, pagamento ou ajuste de lentes.
              </p>
              <a
                href={whatsappLink}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-5 inline-flex items-center justify-center rounded-full bg-white px-5 py-2 text-sm font-semibold text-cyan-900 transition hover:bg-cyan-50"
              >
                Conversar no WhatsApp
              </a>
              <p className="mt-4 text-xs text-cyan-100">Atendimento de segunda a sexta, 09h às 18h.</p>
            </div>
          </aside>
        </div>
      </main>
    </div>
  )
}

export const dynamic = 'force-dynamic'
