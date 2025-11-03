/**
 * Enhanced No Subscription State Component
 *
 * Improved empty state with visual hierarchy, benefits, testimonials, and plan comparison
 * Following UX/UI recommendations for better conversion
 *
 * @author Dr. Philipe Saraiva Cruz
 */

'use client'

import { motion } from 'framer-motion'
import {
  ArrowRight,
  MessageCircle,
  Check,
  Eye,
  Truck,
  Shield,
  Calendar,
  DollarSign,
  Star
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

interface EnhancedNoSubscriptionStateProps {
  /**
   * Callback when user clicks to view plans
   */
  onViewPlans: () => void
  /**
   * Callback when user clicks to contact specialist
   */
  onContactSpecialist?: () => void
}

const BENEFITS = [
  {
    icon: Eye,
    title: 'Lentes de Qualidade',
    description: 'Marcas premium com garantia de procedência'
  },
  {
    icon: Truck,
    title: 'Entrega Rápida',
    description: 'Receba em casa em até 3 dias úteis'
  },
  {
    icon: Shield,
    title: 'Acompanhamento Médico',
    description: 'Consultas oftalmológicas incluídas'
  },
  {
    icon: Calendar,
    title: 'Renovação Automática',
    description: 'Nunca mais fique sem suas lentes'
  }
]

const PLANS = [
  {
    name: 'Essencial',
    price: 149,
    period: 'mensal',
    features: [
      'Lentes de contato mensais',
      '1 par por mês',
      'Entrega grátis',
      'Suporte via WhatsApp'
    ],
    popular: false
  },
  {
    name: 'Conforto',
    price: 239,
    period: 'mensal',
    features: [
      'Lentes de contato quinzenais',
      '2 pares por mês',
      'Entrega expressa grátis',
      'Consulta anual incluída',
      'Desconto em exames'
    ],
    popular: true
  },
  {
    name: 'Premium',
    price: 379,
    period: 'mensal',
    features: [
      'Lentes de contato diárias',
      '1 caixa completa/mês',
      'Entrega prioritária',
      '2 consultas anuais',
      'Descontos exclusivos',
      'Atendimento VIP'
    ],
    popular: false
  }
]

const TESTIMONIALS = [
  {
    name: 'Maria Silva',
    age: 28,
    city: 'Caratinga',
    text: 'Recebo todo mês em casa, nunca mais fiquei sem lente. O acompanhamento médico é excelente!',
    rating: 5
  },
  {
    name: 'João Santos',
    age: 35,
    city: 'Belo Horizonte',
    text: 'Economizo muito com o plano anual. Além disso, a qualidade das lentes é impecável.',
    rating: 5
  },
  {
    name: 'Ana Paula',
    age: 42,
    city: 'Caratinga',
    text: 'O Dr. Philipe e sua equipe são muito atenciosos. Me sinto muito segura com o acompanhamento.',
    rating: 5
  }
]

const STEPS = [
  {
    number: '1',
    title: 'Escolha seu plano',
    description: 'Selecione o plano ideal para seu estilo de vida',
    icon: DollarSign
  },
  {
    number: '2',
    title: 'Teleconsulta + Prescrição',
    description: 'Consulta online com oftalmologista certificado',
    icon: Calendar
  },
  {
    number: '3',
    title: 'Receba em casa',
    description: 'Suas lentes chegam todos os meses automaticamente',
    icon: Truck
  }
]

export function EnhancedNoSubscriptionState({
  onViewPlans,
  onContactSpecialist
}: EnhancedNoSubscriptionStateProps) {
  return (
    <div className="space-y-12">
      {/* Hero Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <Card className="border-2 border-dashed border-cyan-300 bg-gradient-to-br from-cyan-50 via-white to-cyan-50/30 shadow-xl overflow-hidden">
          <CardContent className="py-16 px-8">
            <div className="max-w-4xl mx-auto text-center space-y-8">
              {/* Main Title */}
              <div className="space-y-4">
                <Badge
                  variant="outline"
                  className="text-cyan-700 border-cyan-300 bg-cyan-100/50 px-4 py-1.5 text-sm font-semibold"
                >
                  ✨ Bem-vindo à SV Lentes
                </Badge>
                <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900 bg-clip-text text-transparent leading-tight">
                  Você ainda não possui uma assinatura ativa
                </h1>
                <p className="text-xl md:text-2xl text-gray-700 font-medium max-w-2xl mx-auto leading-relaxed">
                  Escolha o plano ideal e receba suas lentes em casa com acompanhamento médico especializado
                </p>
              </div>

              {/* CTAs */}
              <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
                <Button
                  size="lg"
                  className="bg-gradient-to-r from-cyan-600 to-cyan-500 hover:from-cyan-700 hover:to-cyan-600 shadow-lg hover:shadow-xl transition-all duration-300 text-lg px-8 py-6 group"
                  onClick={onViewPlans}
                >
                  Ver Planos Disponíveis
                  <ArrowRight className="h-5 w-5 ml-2 group-hover:translate-x-1 transition-transform" />
                </Button>
                {onContactSpecialist && (
                  <Button
                    size="lg"
                    variant="outline"
                    className="border-2 border-cyan-600 text-cyan-700 hover:bg-cyan-50 shadow-md hover:shadow-lg transition-all duration-300 text-lg px-8 py-6"
                    onClick={onContactSpecialist}
                  >
                    <MessageCircle className="h-5 w-5 mr-2" />
                    Falar com Especialista
                  </Button>
                )}
              </div>

              {/* Savings Indicator */}
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.3, duration: 0.4 }}
                className="inline-block"
              >
                <div className="bg-gradient-to-r from-yellow-100 to-yellow-50 border-2 border-yellow-300 rounded-full px-6 py-3 shadow-md">
                  <p className="text-yellow-900 font-bold text-sm">
                    💰 Economize até <span className="text-2xl">32%</span> ao ano comparado com compras avulsas
                  </p>
                </div>
              </motion.div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Benefits Grid */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2, duration: 0.5 }}
      >
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-2">
            Por que escolher a SV Lentes?
          </h2>
          <p className="text-gray-600 text-lg">
            Benefícios exclusivos para sua saúde ocular
          </p>
        </div>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {BENEFITS.map((benefit, index) => (
            <motion.div
              key={benefit.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 + index * 0.1, duration: 0.4 }}
            >
              <Card className="h-full border border-gray-200 hover:border-cyan-300 hover:shadow-lg transition-all duration-300 group">
                <CardContent className="p-6 space-y-4">
                  <div className="p-3 rounded-2xl bg-gradient-to-br from-cyan-500 to-cyan-600 text-white w-fit group-hover:scale-110 transition-transform duration-300 shadow-md">
                    <benefit.icon className="h-6 w-6" />
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900 text-lg mb-2">
                      {benefit.title}
                    </h3>
                    <p className="text-gray-600 text-sm leading-relaxed">
                      {benefit.description}
                    </p>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* How It Works */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4, duration: 0.5 }}
        className="bg-white rounded-2xl shadow-lg border border-gray-200 p-8 md:p-12"
      >
        <div className="text-center mb-10">
          <h2 className="text-3xl font-bold text-gray-900 mb-2">
            Como funciona?
          </h2>
          <p className="text-gray-600 text-lg">
            Simples, rápido e conveniente
          </p>
        </div>
        <div className="grid gap-8 md:grid-cols-3">
          {STEPS.map((step, index) => (
            <div key={step.number} className="relative">
              {index < STEPS.length - 1 && (
                <div className="hidden md:block absolute top-12 left-[60%] w-full h-0.5 bg-gradient-to-r from-cyan-300 to-transparent" />
              )}
              <div className="text-center space-y-4">
                <div className="relative inline-flex items-center justify-center">
                  <div className="absolute inset-0 bg-gradient-to-br from-cyan-400 to-cyan-600 rounded-full blur-xl opacity-30 animate-pulse" />
                  <div className="relative p-6 rounded-full bg-gradient-to-br from-cyan-500 to-cyan-600 text-white shadow-xl">
                    <step.icon className="h-8 w-8" />
                  </div>
                  <div className="absolute -bottom-2 -right-2 h-10 w-10 rounded-full bg-white shadow-lg flex items-center justify-center border-4 border-cyan-500">
                    <span className="text-2xl font-bold bg-gradient-to-br from-cyan-600 to-cyan-700 bg-clip-text text-transparent">
                      {step.number}
                    </span>
                  </div>
                </div>
                <div>
                  <h3 className="font-bold text-gray-900 text-xl mb-2">
                    {step.title}
                  </h3>
                  <p className="text-gray-600 leading-relaxed">
                    {step.description}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </motion.div>

      {/* Plans Comparison */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5, duration: 0.5 }}
      >
        <div className="text-center mb-10">
          <h2 className="text-3xl font-bold text-gray-900 mb-2">
            Escolha seu plano ideal
          </h2>
          <p className="text-gray-600 text-lg">
            Todos os planos incluem acompanhamento médico e entrega grátis
          </p>
        </div>
        <div className="grid gap-6 md:grid-cols-3">
          {PLANS.map((plan, index) => (
            <motion.div
              key={plan.name}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 + index * 0.1, duration: 0.4 }}
            >
              <Card
                className={`relative h-full ${
                  plan.popular
                    ? 'border-2 border-cyan-500 shadow-2xl scale-105'
                    : 'border border-gray-200 hover:border-cyan-300 hover:shadow-lg'
                } transition-all duration-300`}
              >
                {plan.popular && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                    <Badge className="bg-gradient-to-r from-cyan-600 to-cyan-500 text-white px-4 py-1.5 text-sm font-bold shadow-lg">
                      ⭐ Mais Popular
                    </Badge>
                  </div>
                )}
                <CardContent className="p-8 space-y-6">
                  <div>
                    <h3 className="text-2xl font-bold text-gray-900 mb-2">
                      {plan.name}
                    </h3>
                    <div className="flex items-baseline gap-1">
                      <span className="text-4xl font-bold bg-gradient-to-r from-cyan-600 to-cyan-700 bg-clip-text text-transparent">
                        R$ {plan.price}
                      </span>
                      <span className="text-gray-600 font-medium">
                        /{plan.period}
                      </span>
                    </div>
                  </div>
                  <ul className="space-y-3">
                    {plan.features.map((feature, i) => (
                      <li key={i} className="flex items-start gap-3">
                        <div className="p-1 rounded-full bg-green-100 text-green-600 flex-shrink-0 mt-0.5">
                          <Check className="h-4 w-4" />
                        </div>
                        <span className="text-gray-700 leading-relaxed">
                          {feature}
                        </span>
                      </li>
                    ))}
                  </ul>
                  <Button
                    className={`w-full ${
                      plan.popular
                        ? 'bg-gradient-to-r from-cyan-600 to-cyan-500 hover:from-cyan-700 hover:to-cyan-600 shadow-lg'
                        : 'bg-gray-900 hover:bg-gray-800'
                    } transition-all duration-300`}
                    size="lg"
                    onClick={onViewPlans}
                  >
                    Escolher {plan.name}
                  </Button>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* Testimonials */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.7, duration: 0.5 }}
        className="bg-gradient-to-br from-gray-50 to-white rounded-2xl shadow-lg border border-gray-200 p-8 md:p-12"
      >
        <div className="text-center mb-10">
          <h2 className="text-3xl font-bold text-gray-900 mb-2">
            O que nossos clientes dizem
          </h2>
          <p className="text-gray-600 text-lg">
            Depoimentos reais de quem confia na SV Lentes
          </p>
        </div>
        <div className="grid gap-6 md:grid-cols-3">
          {TESTIMONIALS.map((testimonial, index) => (
            <motion.div
              key={testimonial.name}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.8 + index * 0.1, duration: 0.4 }}
            >
              <Card className="h-full bg-white border border-gray-200 hover:shadow-xl transition-all duration-300">
                <CardContent className="p-6 space-y-4">
                  <div className="flex gap-1">
                    {Array.from({ length: testimonial.rating }).map((_, i) => (
                      <Star
                        key={i}
                        className="h-5 w-5 fill-yellow-400 text-yellow-400"
                      />
                    ))}
                  </div>
                  <p className="text-gray-700 leading-relaxed italic">
                    "{testimonial.text}"
                  </p>
                  <div className="pt-4 border-t border-gray-100">
                    <p className="font-bold text-gray-900">
                      {testimonial.name}
                    </p>
                    <p className="text-sm text-gray-600">
                      {testimonial.age} anos • {testimonial.city}
                    </p>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* Final CTA */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.9, duration: 0.5 }}
      >
        <Card className="bg-gradient-to-r from-cyan-600 via-cyan-500 to-cyan-600 border-none shadow-2xl overflow-hidden">
          <CardContent className="py-12 px-8 text-center text-white space-y-6">
            <h2 className="text-3xl md:text-4xl font-bold">
              Pronto para começar?
            </h2>
            <p className="text-xl text-cyan-50 max-w-2xl mx-auto">
              Faça parte dos milhares de brasileiros que já cuidam da saúde ocular com a SV Lentes
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center pt-4">
              <Button
                size="lg"
                variant="secondary"
                className="bg-white text-cyan-700 hover:bg-cyan-50 shadow-lg hover:shadow-xl transition-all duration-300 text-lg px-8 py-6 group"
                onClick={onViewPlans}
              >
                Ver Todos os Planos
                <ArrowRight className="h-5 w-5 ml-2 group-hover:translate-x-1 transition-transform" />
              </Button>
              {onContactSpecialist && (
                <Button
                  size="lg"
                  variant="outline"
                  className="border-2 border-white text-white hover:bg-white/10 shadow-lg hover:shadow-xl transition-all duration-300 text-lg px-8 py-6"
                  onClick={onContactSpecialist}
                >
                  <MessageCircle className="h-5 w-5 mr-2" />
                  Tire suas dúvidas
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  )
}
