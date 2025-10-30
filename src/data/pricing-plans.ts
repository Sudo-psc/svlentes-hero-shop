/**
 * Pricing Plans Data
 *
 * Versão: 1.0.0-fase3
 * Fase: MVP - Pricing (Centralized Config)
 *
 * NOTA: Este arquivo agora funciona como wrapper para o sistema centralizado.
 * Dados reais vêm de src/config/base.yaml quando feature flag está ativa.
 */
import type { PricingPlan, PricingPlanGroup } from '@/types'
// Temporarily disabled to fix build - will re-enable after fixing client-side import issue
// import { config } from '@/config/loader'
/**
 * Get pricing plans from centralized config (new aspheric and toric system)
 * Falls back to hardcoded data if feature flag is disabled
 */
function getPricingPlans(): PricingPlan[] {
  // Temporarily use hardcoded data only - will re-enable config loader after fixing client-side import issue
  return hardcodedPlans

  // TODO: Re-enable centralized config after fixing build
  // Priority: MEDIUM - Configuration management improvement
  // Context: Config loader causes client-side import errors during Next.js build
  // Impact: Pricing data must be manually updated in code instead of centralized YAML
  // Solution: Implement server-only config loading with proper Next.js dynamic imports
  // Guard: only try to load config on server-side
  // if (typeof window !== 'undefined') {
  //   return hardcodedPlans
  // }

  // try {
  //   const appConfig = config.load()
  //   const usePricingAsfericos = config.isFeatureEnabled('usePricingAsfericos')
  //   const usePricingToricos = config.isFeatureEnabled('usePricingToricos')
  //   const useCentralizedPricing = config.isFeatureEnabled('useCentralizedPricing')
  //   const allPlans: PricingPlan[] = []
  //   // Load aspheric plans
  //   if (usePricingAsfericos && appConfig.pricing_asfericos) {
  //     const asphericPlans = Object.values(appConfig.pricing_asfericos) as any[]
  //     allPlans.push(...asphericPlans.map(convertYamlPlanToPricingPlan))
  //   }
  //   // Load toric plans
  //   if (usePricingToricos && appConfig.pricing_toricos) {
  //     const toricPlans = Object.values(appConfig.pricing_toricos) as any[]
  //     allPlans.push(...toricPlans.map(convertYamlPlanToPricingPlan))
  //   }
  //   // Return combined plans if any are loaded
  //   if (allPlans.length > 0) {
  //     return allPlans.sort((a, b) => a.sortOrder - b.sortOrder)
  //   }
  //   // Legacy system: Use old pricing structure
  //   if (useCentralizedPricing && appConfig.pricing?.plans) {
  //     return appConfig.pricing.plans as PricingPlan[]
  //   }
  // } catch (error) {
  //   console.warn('[Pricing] Error loading centralized config, using fallback data:', error)
  // }
  // // Fallback to hardcoded data
  // return hardcodedPlans
}
/**
 * Convert YAML plan structure to PricingPlan interface
 */
function convertYamlPlanToPricingPlan(yamlPlan: any): PricingPlan {
  // Calculate annual price from monthly price for different billing cycles
  let priceAnnual = 0;
  const monthlyPrice = yamlPlan.pricing.priceMonthly || 0;
  switch (yamlPlan.billingCycle) {
    case 'monthly':
      priceAnnual = monthlyPrice * 12;
      break;
    case 'quarterly':
      priceAnnual = monthlyPrice * 3 * 4; // Quarterly price * 4 quarters
      break;
    case 'semiannual':
      priceAnnual = monthlyPrice * 6 * 2; // Semiannual price * 2 periods
      break;
    case 'annual':
      priceAnnual = yamlPlan.pricing.priceTotal || monthlyPrice * 12;
      break;
    default:
      priceAnnual = monthlyPrice * 12;
  }
  return {
    // Identificação
    id: yamlPlan.id,
    name: yamlPlan.name,
    description: yamlPlan.description,
    // Categorização
    lensType: yamlPlan.lensType,
    billingCycle: yamlPlan.billingCycle,
    consultationType: yamlPlan.consultationType,
    serviceLevel: yamlPlan.serviceLevel,
    // Preços
    priceMonthly: yamlPlan.pricing.priceMonthly,
    priceAnnual: priceAnnual,
    priceTotal: yamlPlan.pricing.priceTotal,
    pricePerLens: yamlPlan.pricing.pricePerLens,
    installments: yamlPlan.pricing.installments,
    // Economia
    economy: yamlPlan.economy,
    // Visual
    badge: yamlPlan.badge,
    popularBadge: yamlPlan.popularBadge,
    recommended: yamlPlan.recommended,
    highlight: yamlPlan.highlight,
    // Conteúdo
    features: yamlPlan.features,
    benefits: yamlPlan.benefits,
    // Entrega e Logística
    deliveryInfo: yamlPlan.deliveryInfo,
    // Consultas
    consultationInfo: yamlPlan.consultationInfo,
    // Suporte
    supportInfo: yamlPlan.supportInfo,
    // Integrações (placeholder para implementação futura)
    stripeProductId: `prod_${yamlPlan.id}`,
    stripePriceId: `price_${yamlPlan.id}_${yamlPlan.billingCycle}`,
    asaasProductId: `prod_${yamlPlan.id}`,
    // Marketing
    ctaText: yamlPlan.ctaText,
    tags: yamlPlan.tags,
    targetAudience: yamlPlan.targetAudience,
    // Metadados
    isActive: yamlPlan.isActive,
    sortOrder: yamlPlan.sortOrder
  }
}
/**
 * Get pricing plans grouped by lens type (new system)
 */
function getPricingPlanGroups(): PricingPlanGroup[] {
  // Temporarily disabled centralized config - using hardcoded data only
  // TODO: Re-enable centralized config after fixing build

  // Group plans by lens type from hardcoded data
  const plans = getPricingPlans()
  const groups: PricingPlanGroup[] = []

  // Aspheric lenses group
  const asphericPlans = plans.filter(plan => plan.lensType === 'asferica')
  if (asphericPlans.length > 0) {
    groups.push({
      id: 'asfericas',
      name: 'Lentes Asféricas',
      description: 'Lentes com design avançado para maior conforto e visão nítida',
      lensType: 'asferica',
      icon: 'eye',
      plans: asphericPlans.sort((a, b) => a.sortOrder - b.sortOrder),
      order: 1
    })
  }

  // Toric lenses group
  const toricPlans = plans.filter(plan => plan.lensType === 'torica')
  if (toricPlans.length > 0) {
    groups.push({
      id: 'toricas',
      name: 'Lentes Tóricas (Astigmatismo)',
      description: 'Lentes especializadas para correção de astigmatismo com máxima precisão',
      lensType: 'torica',
      icon: 'target',
      plans: toricPlans.sort((a, b) => a.sortOrder - b.sortOrder),
      order: 2
    })
  }

  return groups.sort((a, b) => a.order - b.order)
}
// Hardcoded fallback data (sincronizado com base.yaml) - Novo formato asférico
const hardcodedPlans: PricingPlan[] = [
    {
        // Identificação
        id: 'express-mensal',
        name: 'Plano Express',
        description: 'Plano essencial para uso regular de lentes asféricas',
        // Categorização
        lensType: 'asferica',
        billingCycle: 'monthly',
        consultationType: 'none',
        serviceLevel: 'express',
        // Preços
        priceMonthly: 128.00,
        priceTotal: 128.00,
        pricePerLens: 4.27,
        installments: {
            count: 1,
            value: 128.00,
            show: false
        },
        // Economia
        economy: {
            percentage: 0,
            amount: 0,
            previousPrice: 0,
            accessoriesValue: 0
        },
        // Visual
        badge: null,
        popularBadge: null,
        recommended: false,
        highlight: false,
        // Conteúdo
        features: [
            'Lentes asféricas mensais',
            'Suporte por WhatsApp',
            'Entrega padrão',
            'Cancelamento a qualquer momento'
        ],
        benefits: [
            {
                id: 'lentes-mensais',
                name: 'Lentes Asféricas',
                description: '1 par de lentes de alta qualidade',
                icon: 'eye',
                included: true,
                quantity: 1,
                value: 128.00
            },
            {
                id: 'suporte-whatsapp',
                name: 'Suporte por WhatsApp',
                description: 'Atendimento de segunda a sexta',
                icon: 'message-circle',
                included: true,
                quantity: 1,
                value: 0
            }
        ],
        // Entrega e Logística
        deliveryInfo: {
            frequency: 'mensal',
            freightFree: false,
            locations: ['Brasil']
        },
        // Consultas
        consultationInfo: {
            included: false,
            type: 'none',
            count: 0,
            location: []
        },
        // Suporte
        supportInfo: {
            type: 'WhatsApp',
            availability: 'Seg-Sex 9h-18h',
            priority: 'standard'
        },
        // Integrações
        stripeProductId: 'prod_express_mensal',
        stripePriceId: 'price_express_mensal_monthly',
        asaasProductId: 'prod_express_mensal',
        // Marketing
        ctaText: 'Assinar Agora',
        tags: ['essencial', 'flexível'],
        targetAudience: ['primeira-compra', 'orçamento-limitado'],
        // Metadados
        isActive: true,
        sortOrder: 1
    },
    {
        // Identificação
        id: 'vip-anual',
        name: 'Plano VIP',
        description: 'A experiência mais completa e exclusiva para sua saúde ocular',
        // Categorização
        lensType: 'asferica',
        billingCycle: 'annual',
        consultationType: 'hybrid',
        serviceLevel: 'vip',
        // Preços
        priceMonthly: 91.00,
        priceTotal: 1091.00,
        pricePerLens: 3.03,
        installments: {
            count: 12,
            value: 91.00,
            show: true
        },
        // Economia
        economy: {
            percentage: 29,
            amount: 445,
            previousPrice: 1536.00,
            accessoriesValue: 120.00
        },
        // Visual
        badge: 'Exclusivo VIP',
        popularBadge: null,
        recommended: true,
        highlight: true,
        // Conteúdo
        features: [
            'Lentes asféricas anuais premium',
            'Consultas híbridas ilimitadas',
            'Entrega prioritária em 24h',
            'Acessórios exclusivos VIP',
            'Economia de 29%',
            'Suporte pessoal dedicado',
            'Serviços oftalmológicos completos'
        ],
        benefits: [
            {
                id: 'lentes-anuais',
                name: 'Lentes Asféricas Premium',
                description: '12 pares de lentes de tecnologia superior',
                icon: 'eye',
                included: true,
                quantity: 12,
                value: 1536.00
            },
            {
                id: 'consultas-hibridas',
                name: 'Consultas Híbridas',
                description: 'Consultas ilimitadas (presenciais + online)',
                icon: 'users',
                included: true,
                quantity: 99,
                value: 1200.00
            },
            {
                id: 'entrega-24h',
                name: 'Entrega 24h',
                description: 'Entrega prioritária em 24 horas',
                icon: 'zap',
                included: true,
                quantity: 12,
                value: 240.00
            }
        ],
        // Entrega e Logística
        deliveryInfo: {
            frequency: 'mensal',
            freightFree: true,
            locations: ['Todo Brasil (prioridade em capitais)']
        },
        // Consultas
        consultationInfo: {
            included: true,
            type: 'hybrid',
            count: 99,
            location: ['Clínica Saraiva Vision', 'Online'],
            value: 1200.00
        },
        // Suporte
        supportInfo: {
            type: 'Assistente Pessoal + WhatsApp VIP',
            availability: '24/7',
            priority: 'vip'
        },
        // Integrações
        stripeProductId: 'prod_vip_anual',
        stripePriceId: 'price_vip_anual_annual',
        asaasProductId: 'prod_vip_anual',
        // Marketing
        ctaText: 'Assinar VIP',
        tags: ['vip', 'exclusivo', 'completo', 'economia-maxima'],
        targetAudience: ['luxo', 'saude-ocular', 'conveniencia-total'],
        // Metadados
        isActive: true,
        sortOrder: 4
    }
]
// ============================================================================
// HELPER FUNCTIONS - Must be defined BEFORE exports to avoid TDZ
// ============================================================================
function getFeatureComparison() {
  // Guard: only try to load config on server-side
  if (typeof window !== 'undefined') {
    return hardcodedFeatureComparison
  }

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
function getServiceBenefits() {
  // Guard: only try to load config on server-side
  if (typeof window !== 'undefined') {
    return hardcodedServiceBenefits
  }

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
function getCoverageInfo() {
  // Guard: only try to load config on server-side
  if (typeof window !== 'undefined') {
    return hardcodedCoverageInfo
  }

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
function getPricingFAQ() {
  // Guard: only try to load config on server-side
  if (typeof window !== 'undefined') {
    return hardcodedPricingFAQ
  }

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
function getEconomyCalculatorData() {
  // Guard: only try to load config on server-side
  if (typeof window !== 'undefined') {
    return hardcodedEconomyCalculatorData
  }

  try {
    const appConfig = config.load()
    const useCentralizedPricing = config.isFeatureEnabled('useCentralizedPricing')
    if (useCentralizedPricing && appConfig.pricing?.economyCalculator) {
      return appConfig.pricing.economyCalculator
    }
  } catch (error) {
    console.warn('[Pricing] Error loading calculator data, using fallback:', error)
  }
  return hardcodedEconomyCalculatorData
}
// ============================================================================
// HARDCODED FALLBACK DATA
// ============================================================================
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
// ============================================================================
// EXPORTS - All functions and data are defined above
// ============================================================================
// Export via função para suportar centralização
export const pricingPlans: PricingPlan[] = getPricingPlans()
// Novo sistema: Grupos de planos por tipo de lente  
export const pricingPlanGroups: PricingPlanGroup[] = getPricingPlanGroups()
// Comparação de features entre planos
export const featureComparison = hardcodedFeatureComparison
// Benefícios gerais do serviço
export const serviceBenefits = hardcodedServiceBenefits
// Informações de cobertura geográfica
export const coverageInfo = hardcodedCoverageInfo
// FAQ específica de planos
export const pricingFAQ = hardcodedPricingFAQ
// Dados para calculadora de economia
export const economyCalculatorData = hardcodedEconomyCalculatorData