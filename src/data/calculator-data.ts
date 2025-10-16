import { UsagePattern, LensType } from '@/types';

// Padrões de uso de lentes
export const usagePatterns: UsagePattern[] = [
  {
    id: 'occasional',
    name: 'Uso Ocasional',
    daysPerMonth: 10,
    description: 'Fins de semana e eventos especiais'
  },
  {
    id: 'regular',
    name: 'Uso Regular',
    daysPerMonth: 20,
    description: 'Trabalho e atividades sociais'
  },
  {
    id: 'daily',
    name: 'Uso Diário',
    daysPerMonth: 30,
    description: 'Todos os dias da semana'
  }
];

// Tipos de lentes com preços por unidade
// Lentes mensais: 6 lentes/caixa (1 lente dura 30 dias)
// Lentes diárias: 30 lentes/caixa (1 lente por dia)
export const lensTypes: LensType[] = [
  {
    id: 'monthly-premium',
    name: 'Lentes Mensais',
    brand: 'Biofinity/Acuvue Oasys/Air Optix',
    basePrice: 43.33, // R$260/caixa ÷ 6 lentes = R$43.33/lente
    boxesPerPeriod: 1, // 1 caixa = 6 lentes = 6 meses (1 lente/mês por olho)
    period: 'month', // lente mensal (dura 30 dias)
    description: 'Tecnologia de ponta para máximo conforto',
    icon: '👁️',
    features: ['Tecnologia silicone-hidrogel', 'Alta transmissão de oxigênio', 'Tratamento umectante']
  },
  {
    id: 'daily-premium',
    name: 'Lentes Diárias',
    brand: 'Acuvue Moist/Solotica/Acuvue Oasys 1 Day',
    basePrice: 3.84, // R$115/caixa ÷ 30 lentes = R$3.84/lente (50% de desconto)
    boxesPerPeriod: 1, // 1 caixa = 30 lentes = 1 mês (1 lente/dia por olho)
    period: 'month', // lente diária (dura 1 dia, mas agrupado em período mensal)
    description: 'Máxima praticidade e higiene com uso único diário',
    icon: '☀️',
    features: ['Uso único diário', 'Sem necessidade de limpeza', 'Proteção UV integrada', 'Alto conforto visual']
  },
  {
    id: 'toric-monthly',
    name: 'Astigmatismo/Premium',
    brand: 'Várias marcas disponíveis',
    basePrice: 58.33, // R$350/caixa ÷ 6 lentes = R$58.33/lente
    boxesPerPeriod: 1,
    period: 'month',
    description: 'Correção precisa de astigmatismo com tecnologia premium',
    icon: '🎯',
    features: ['Estabilização dinâmica', 'Visão nítida', 'Design personalizado', 'Alta qualidade']
  },
  {
    id: 'multifocal-monthly',
    name: 'Lentes Multifocais',
    brand: 'Várias marcas disponíveis',
    basePrice: 73.33, // R$440/caixa ÷ 6 lentes = R$73.33/lente
    boxesPerPeriod: 1,
    period: 'month',
    description: 'Correção de presbiopia (vista cansada)',
    icon: '👓',
    features: ['Tecnologia progressiva', 'Transição suave', 'Visão em múltiplas distâncias']
  }
];

// Mapeamento de planos recomendados baseado no uso
export const planRecommendations = {
  occasional: 'basic',
  regular: 'premium',
  daily: 'premium'
};

// Planos de assinatura SV Lentes (apenas mensal e anual)
export const subscriptionPlans = {
  monthly: {
    id: 'monthly',
    name: 'Mensal sem Fidelidade',
    badge: 'Flexível',
    discount: 0.05, // 5%
    shipping: {
      free: false,
      condition: 'Caratinga e região, acima R$ 150',
      nationwide: false
    },
    payment: {
      method: 'Mensal recorrente',
      installments: 1
    },
    cancellation: 'Cancele quando quiser',
    benefits: [],
    description: 'Flexibilidade máxima sem compromisso'
  },
  annual: {
    id: 'annual',
    name: 'Anual com Fidelidade',
    badge: 'Melhor Economia',
    discount: 0.20, // 20%
    shipping: {
      free: true,
      condition: 'Todo Brasil',
      nationwide: true
    },
    payment: {
      method: '12x sem juros',
      installments: 12
    },
    cancellation: 'Multa 30% após cancelamento antecipado',
    benefits: [
      { name: 'Kit Completo', value: 100 },
      { name: '1 Consulta Reavaliação', value: 200 }
    ],
    description: 'Máxima economia com benefícios exclusivos'
  }
};

// Preços médios de consultas oftalmológicas no mercado
export const consultationPrices = {
  market: {
    consultation: 200.00, // Preço médio de consulta avulsa
    followUp: 150.00,     // Preço médio de retorno
    exam: 120.00          // Preço médio de exames complementares
  },
  svlentes: {
    // As consultas já estão incluídas nos planos
    includedInPlan: true
  }
};