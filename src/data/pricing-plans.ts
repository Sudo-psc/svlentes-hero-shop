/**
 * Pricing Plans Data
 *
 * Versão: 1.0.0-fase3
 * Fase: MVP - Pricing (Centralized Config)
 *
 * NOTA: Este arquivo agora funciona como wrapper para o sistema centralizado.
 * Dados reais vêm de src/config/base.yaml quando feature flag está ativa.
 */

import { PricingPlan } from '@/types'
import { config } from '@/config/loader'

/**
 * Get pricing plans from centralized config
 * Falls back to hardcoded data if feature flag is disabled
 */
function getPricingPlans(): PricingPlan[] {
  try {
    const appConfig = config.load()
    const useCentralizedPricing = config.isFeatureEnabled('useCentralizedPricing')

    if (useCentralizedPricing) {
      return appConfig.pricing.plans as PricingPlan[]
    }
  } catch (error) {
    console.warn('[Pricing] Error loading centralized config, using fallback data:', error)
  }

  // Fallback to hardcoded data
  return hardcodedPlans
}

// Hardcoded fallback data (sincronizado com base.yaml)
const hardcodedPlans: PricingPlan[] = [
    {
        id: 'basico',
        name: 'Plano Express Mensal',
        badge: 'Sem Fidelidade',
        priceMonthly: 128.00,
        priceAnnual: 1091.00,
        description: 'Plano básico de lentes asféricas mensais com entrega em casa. Sem fidelidade, cancele quando quiser.',
        features: [
            '1 par de lentes asféricas mensais',
            'Entrega em casa',
            'Sem fidelidade - cancele quando quiser',
            'Acompanhamento via WhatsApp',
            'Troca gratuita em caso de defeito',
            'Atendimento em todo o Brasil'
        ],
        recommended: false,
        stripeProductId: 'prod_basic_svlentes',
        stripePriceId: 'price_basic_monthly',
        asaasProductId: 'prod_basico_svlentes',
        ctaText: 'Assinar Plano Express'
    },
    {
        id: 'padrao',
        name: 'Plano VIP Anual',
        badge: 'RECOMENDADO',
        popularBadge: 'Mais Popular - Economia de 29%',
        priceMonthly: 91.00,
        priceAnnual: 1091.00,
        description: 'Plano anual com máxima economia. 12 pares de lentes + acessórios + frete grátis. Economize R$ 445/ano!',
        features: [
            '12 pares de lentes asféricas (1 ano completo)',
            '3 estojos protetores (R$ 60 em brindes)',
            '3 soluções multiuso 300ml (R$ 90 em brindes)',
            'Frete grátis (2 envios/ano)',
            'Desconto de 29% vs plano mensal',
            'Parcelamento: 12x de R$ 90,92 sem juros',
            'Suporte via WhatsApp 24/7',
            'Economia total: R$ 445 + R$ 150 em acessórios'
        ],
        recommended: true,
        stripeProductId: 'prod_standard_svlentes',
        stripePriceId: 'price_standard_monthly',
        asaasProductId: 'prod_padrao_svlentes',
        ctaText: 'Assinar Plano VIP Anual'
    },
    {
        id: 'premium',
        name: 'Plano Saúde Ocular Anual',
        badge: 'Premium com Telemedicina',
        priceMonthly: 138.00,
        priceAnnual: 1661.00,
        description: 'Acompanhamento preventivo completo com 4 consultas de telemedicina/ano. Ideal para grau instável, diabéticos e +50 anos.',
        features: [
            '✅ 4 consultas por telemedicina/ano (1 por trimestre)',
            '12 pares de lentes asféricas',
            '3 estojos protetores (R$ 60)',
            '3 soluções multiuso 300ml (R$ 90)',
            'Frete grátis (2 envios/ano)',
            'Ajustes de grau ilimitados',
            'Prioridade no atendimento',
            'Parcelamento: 12x de R$ 138,42 sem juros'
        ],
        recommended: false,
        stripeProductId: 'prod_premium_svlentes',
        stripePriceId: 'price_premium_monthly',
        asaasProductId: 'prod_premium_svlentes',
        ctaText: 'Assinar Plano Saúde Ocular'
    }
]

// Export via função para suportar centralização
export const pricingPlans: PricingPlan[] = getPricingPlans()

// Comparação de features entre planos
export const featureComparison = getFeatureComparison()

function getFeatureComparison() {
  try {
    const appConfig = config.load()
    const useCentralizedPricing = config.isFeatureEnabled('useCentralizedPricing')

    if (useCentralizedPricing) {
      return appConfig.pricing.featureComparison
    }
  } catch (error) {
    console.warn('[Pricing] Error loading feature comparison, using fallback:', error)
  }

  return hardcodedFeatureComparison
}

const hardcodedFeatureComparison = {
    features: [
        'Lentes de contato',
        'Frequência de entrega',
        'Consultas médicas',
        'Teleorientação',
        'Suporte',
        'Frete',
        'Seguro',
        'App móvel',
        'Exames incluídos',
        'Atendimento domiciliar'
    ],
    planComparison: [
        {
            feature: 'Lentes de contato',
            basic: 'Mensais',
            premium: 'Diárias ou mensais',
            vip: 'Premium última geração'
        },
        {
            feature: 'Frequência de entrega',
            basic: 'A cada 3 meses',
            premium: 'Mensal',
            vip: 'Quinzenal se necessário'
        },
        {
            feature: 'Consultas médicas',
            basic: 'Básico',
            premium: 'Semestral incluída',
            vip: 'Trimestral incluída'
        },
        {
            feature: 'Teleorientação',
            basic: false,
            premium: 'Ilimitada',
            vip: 'Ilimitada + prioritária'
        },
        {
            feature: 'Suporte',
            basic: 'WhatsApp',
            premium: '24/7 prioritário',
            vip: 'Concierge dedicado'
        },
        {
            feature: 'Frete',
            basic: 'Grátis',
            premium: 'Grátis express',
            vip: 'Grátis express + emergencial'
        },
        {
            feature: 'Seguro',
            basic: 'Básico',
            premium: 'Contra perda/dano',
            vip: 'Premium completo'
        },
        {
            feature: 'App móvel',
            basic: false,
            premium: true,
            vip: true
        },
        {
            feature: 'Exames incluídos',
            basic: false,
            premium: false,
            vip: true
        },
        {
            feature: 'Atendimento domiciliar',
            basic: false,
            premium: false,
            vip: true
        }
    ]
}

// Benefícios gerais do serviço
export const serviceBenefits = getServiceBenefits()

function getServiceBenefits() {
  try {
    const appConfig = config.load()
    const useCentralizedPricing = config.isFeatureEnabled('useCentralizedPricing')

    if (useCentralizedPricing) {
      return appConfig.pricing.serviceBenefits
    }
  } catch (error) {
    console.warn('[Pricing] Error loading service benefits, using fallback:', error)
  }

  return hardcodedServiceBenefits
}

const hardcodedServiceBenefits = [
    {
        id: 'economy',
        title: 'Economia Garantida',
        description: 'Economia de até 40% comparado à compra avulsa de lentes',
        icon: '💰',
        highlight: true
    },
    {
        id: 'medical-care',
        title: 'Acompanhamento Médico',
        description: 'Acompanhamento médico especializado incluído em todos os planos',
        icon: '👨‍⚕️',
        highlight: true
    },
    {
        id: 'convenience',
        title: 'Entrega Regular',
        description: 'Entrega automática sem preocupação, sempre no prazo',
        icon: '📦',
        highlight: true
    },
    {
        id: 'quality',
        title: 'Certificação ANVISA',
        description: 'Lentes premium certificadas pela ANVISA, garantia de qualidade',
        icon: '✅',
        highlight: false
    },
    {
        id: 'support',
        title: 'Suporte Completo',
        description: 'Suporte via WhatsApp e telemedicina sempre que precisar',
        icon: '💬',
        highlight: false
    },
    {
        id: 'flexibility',
        title: 'Flexibilidade Total',
        description: 'Pause ou cancele sua assinatura a qualquer momento sem burocracia',
        icon: '🔄',
        highlight: false
    }
]

// Informações de cobertura geográfica
export const coverageInfo = getCoverageInfo()

function getCoverageInfo() {
  try {
    const appConfig = config.load()
    const useCentralizedPricing = config.isFeatureEnabled('useCentralizedPricing')

    if (useCentralizedPricing) {
      return appConfig.pricing.coverageInfo
    }
  } catch (error) {
    console.warn('[Pricing] Error loading coverage info, using fallback:', error)
  }

  return hardcodedCoverageInfo
}

const hardcodedCoverageInfo = [
    {
        id: 'presencial',
        icon: '📍',
        title: 'Consultas Presenciais',
        description: 'Disponíveis em Caratinga, Ipatinga e Belo Horizonte/MG',
        locations: ['Caratinga/MG', 'Ipatinga/MG', 'Belo Horizonte/MG'],
        nationwide: false
    },
    {
        id: 'telemedicina',
        icon: '🌐',
        title: 'Telemedicina',
        description: 'Válida em todo o território nacional',
        nationwide: true
    },
    {
        id: 'entrega',
        icon: '📦',
        title: 'Entrega de Lentes',
        description: 'Válida em todo o território nacional via Correios',
        nationwide: true
    }
]

// FAQ específica de planos
export const pricingFAQ = getPricingFAQ()

function getPricingFAQ() {
  try {
    const appConfig = config.load()
    const useCentralizedPricing = config.isFeatureEnabled('useCentralizedPricing')

    if (useCentralizedPricing) {
      return appConfig.pricing.faq
    }
  } catch (error) {
    console.warn('[Pricing] Error loading FAQ, using fallback:', error)
  }

  return hardcodedPricingFAQ
}

const hardcodedPricingFAQ = [
    {
        id: 'entrega',
        question: 'Como funciona a entrega?',
        answer: 'As lentes são entregadas mensalmente no seu endereço cadastrado, sem custo adicional de frete. Você recebe automaticamente antes de acabar suas lentes atuais, garantindo que nunca fique sem suas lentes de contato.'
    },
    {
        id: 'consultas',
        question: 'As consultas estão incluídas?',
        answer: 'Sim! Todos os planos incluem consultas de acompanhamento com oftalmologista, tanto presenciais quanto por telemedicina, para garantir a saúde dos seus olhos. A quantidade de consultas varia de acordo com o plano escolhido.'
    },
    {
        id: 'diferenca',
        question: 'Qual a diferença entre os planos?',
        answer: 'A principal diferença está na quantidade de lentes, frequência de consultas e benefícios adicionais. O Plano Padrão oferece mais consultas e telemedicina ilimitada. O Plano Premium inclui lentes multifocais, exames complementares e kit de higienização.'
    },
    {
        id: 'cancelamento',
        question: 'Posso cancelar a assinatura?',
        answer: 'Sim, você pode pausar ou cancelar sua assinatura a qualquer momento, sem multas ou taxas de cancelamento. Basta entrar em contato através do portal do cliente ou via WhatsApp.'
    },
    {
        id: 'pagamento',
        question: 'Como funciona o pagamento?',
        answer: 'Você pode pagar em até 12 vezes no cartão de crédito ou à vista com desconto via PIX ou boleto bancário. O pagamento é processado de forma segura através da plataforma Asaas.'
    },
    {
        id: 'receita',
        question: 'Preciso de receita médica?',
        answer: 'Sim, para sua segurança e saúde ocular, é necessário ter uma receita médica válida. Se você ainda não tem, podemos agendar uma consulta de avaliação e adaptação de lentes de contato.'
    },
    {
        id: 'qualidade',
        question: 'As lentes são de qualidade?',
        answer: 'Sim! Trabalhamos apenas com lentes de contato de marcas reconhecidas e certificadas pela ANVISA. Todas as lentes são embaladas individualmente e em ambiente estéril, garantindo máxima segurança e qualidade.'
    },
    {
        id: 'acompanhamento',
        question: 'Como funciona o acompanhamento médico?',
        answer: 'Você terá acesso a consultas de acompanhamento com oftalmologista, tanto presenciais em nossas clínicas quanto por telemedicina. Além disso, oferecemos suporte via WhatsApp para dúvidas sobre uso e cuidados com as lentes.'
    }
]

// Dados para calculadora de economia
export const economyCalculatorData = getEconomyCalculatorData()

function getEconomyCalculatorData() {
  try {
    const appConfig = config.load()
    const useCentralizedPricing = config.isFeatureEnabled('useCentralizedPricing')

    if (useCentralizedPricing) {
      return appConfig.pricing.economyCalculator
    }
  } catch (error) {
    console.warn('[Pricing] Error loading economy calculator, using fallback:', error)
  }

  return hardcodedEconomyCalculatorData
}

const hardcodedEconomyCalculatorData = {
    averagePrices: {
        daily: {
            avulso: 4.50, // por lente
            subscription: 2.70 // por lente na assinatura
        },
        weekly: {
            avulso: 12.00,
            subscription: 7.20
        },
        monthly: {
            avulso: 25.00,
            subscription: 15.00
        }
    },
    usagePatterns: {
        occasional: { daysPerMonth: 10, multiplier: 0.33 },
        regular: { daysPerMonth: 20, multiplier: 0.67 },
        daily: { daysPerMonth: 30, multiplier: 1.0 }
    }
}