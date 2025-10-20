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
// Tipos de lentes com preços
export const lensTypes: LensType[] = [
  {
    id: 'daily',
    name: 'Lentes Diárias',
    avulsoPrice: 4.50, // por lente
    subscriptionPrice: 2.70 // por lente na assinatura
  },
  {
    id: 'weekly',
    name: 'Lentes Semanais',
    avulsoPrice: 12.00, // por lente
    subscriptionPrice: 7.20 // por lente na assinatura
  },
  {
    id: 'monthly',
    name: 'Lentes Mensais',
    avulsoPrice: 25.00, // por lente
    subscriptionPrice: 15.00 // por lente na assinatura
  }
];
// Mapeamento de planos recomendados baseado no uso
export const planRecommendations = {
  occasional: 'basic',
  regular: 'premium',
  daily: 'premium'
};
// Preços dos planos SV Lentes
export const planPrices = {
  basic: {
    name: 'Plano Básico',
    monthlyPrice: 89.90,
    includedConsultations: 1,
    description: 'Uso ocasional e acompanhamento básico'
  },
  premium: {
    name: 'Plano Premium',
    monthlyPrice: 149.90,
    includedConsultations: 2,
    description: 'Uso diário e acompanhamento completo'
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