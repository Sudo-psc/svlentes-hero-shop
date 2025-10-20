/**
 * Tipos para a calculadora de preços e rentabilidade de assinaturas
 * Especificação Técnica: Sistema de Calculadora de Preços para Assinatura de Lentes de Contato
 */

// Tipos base para planos
export type PlanCategory = 'basico' | 'padrao' | 'premium'
export type BillingCycle = 'mensal' | 'anual'

// Estrutura de custos operacionais
export interface CustosOperacionais {
  id: string
  nome: string
  // Percentuais
  taxaProcessamento: number // % sobre cada pagamento
  custoParcelamento: number // % para parcelamentos
  // Valores fixos em R$
  embalagens: number // custo médio por kit
  exames: number // exames complementares por mês
  administrativo: number // despesas admin mensais
  insumos: number // custo de insumos por assinatura
  operacional: number // despesas operacionais mensais
}

// Estrutura de benefícios por plano
export interface BeneficioPlano {
  id: string
  descricao: string
  custo: number // valor unitário em R$
  frequencia: 'unico' | 'mensal' | 'trimestral' | 'anual'
  incluido: boolean
  quantidade?: number
}

// Plano de assinatura completo
export interface PlanoAssinatura {
  id: string
  nome: string
  categoria: PlanCategory
  ciclo: BillingCycle
  precoBase: number // preço de venda base em R$
  custos: CustosOperacionais
  beneficios: BeneficioPlano[]
  descontoAnual?: number // % de desconto para planos anuais
  ativo: boolean
  createdAt: Date
  updatedAt: Date
}

// Cálculo de margem de lucro
export interface MargemLucro {
  percentual: number // %
  valorAbsoluto: number // R$
  indicador: 'baixa' | 'media' | 'alta'
}

// Resumo financeiro do plano
export interface ResumoFinanceiro {
  precoVenda: number
  custoTotal: number
  margem: MargemLucro
  economiaAnual?: {
    valor: number
    percentual: number
  }
}

// Métricas para tabela comparativa
export interface MetricasComparativas {
  precoMensal: number
  precoAnual: number
  custoTotalMensal: number
  custoTotalAnual: number
  margemPercentual: number
  margemValor: number
  economiaAnualValor: number
  economiaAnualPercentual: number
  roi: number // Return on Investment
  beneficiosCount: number
  custoPorBeneficio: number
}

// Dados para tabela comparativa
export interface TabelaComparativa {
  planos: PlanoAssinatura[]
  metricas: Record<string, MetricasComparativas>
  ordenacao: {
    campo: string
    direcao: 'asc' | 'desc'
  }
  filtros: {
    ciclo?: BillingCycle
    categoria?: PlanCategory
    faixaPreco?: {
      min: number
      max: number
    }
  }
}

// Configuração de descontos progressivos
export interface ConfigDescontoProgressivo {
  basicoAnual: number // % padrão: 15
  padraoAnual: number // % padrão: 18
  premiumAnual: number // % padrão: 20
}

// Histórico de alterações de custos
export interface HistoricoAlteracao {
  id: string
  timestamp: Date
  usuario: string
  campo: string
  valorAnterior: number | string
  valorNovo: number | string
  motivo?: string
}

// Configuração do painel de custos
export interface ConfigPainelCustos {
  custos: CustosOperacionais
  descontos: ConfigDescontoProgressivo
  historico: HistoricoAlteracao[]
  ultimoAtualizacao: Date
  usuarioAtualizacao: string
}

// Tipos de relatórios analíticos
export type TipoRelatorio =
  | 'rentabilidade_por_plano'
  | 'comparativo_margens'
  | 'projecao_receita'
  | 'distribuicao_custos'
  | 'tendencias_precificacao'

// Dados para relatórios
export interface DadosRelatorio {
  periodo: {
    inicio: Date
    fim: Date
  }
  planos: string[] // IDs dos planos
  metricas: Record<string, any>
  graficos: Array<{
    tipo: 'bar' | 'line' | 'pie' | 'area'
    dados: any[]
    titulo: string
  }>
}

// Relatório gerado
export interface RelatorioAnalitico {
  id: string
  tipo: TipoRelatorio
  titulo: string
  dados: DadosRelatorio
  geradoEm: Date
  geradoPor: string
  arquivoUrl?: string // URL do PDF/Excel gerado
}

// Análise de rentabilidade
export interface AnaliseRentabilidade {
  planoId: string
  periodo: {
    inicio: Date
    fim: Date
  }
  receitaTotal: number
  custoTotal: number
  lucroBruto: number
  margemBruta: number
  assinaturasAtivas: number
  receitaMediaPorAssinatura: number
  tendencia: 'crescente' | 'estavel' | 'decrescente'
}

// Projeção de receita
export interface ProjecaoReceita {
  periodo: number // meses à frente
  cenario: 'conservador' | 'realista' | 'otimista'
  planos: Array<{
    planoId: string
    crescimentoAssinaturas: number // % ao mês
    taxaRetencao: number // %
    projecaoReceita: number[]
  }>
  totalProjetado: number[]
}

// Configurações de validação
export interface ValidacaoCampos {
  campo: string
  obrigatorio: boolean
  tipo: 'number' | 'string' | 'boolean'
  min?: number
  max?: number
  regex?: string
}

// Estado da aplicação
export interface PricingCalculatorState {
  planos: PlanoAssinatura[]
  configCustos: ConfigPainelCustos
  tabelaComparativa: TabelaComparativa
  relatorios: RelatorioAnalitico[]
  loading: boolean
  erro?: string
}

// Props para componentes
export interface PricingCalculatorProps {
  onSavePlano?: (plano: PlanoAssinatura) => void
  onDeletePlano?: (planoId: string) => void
  onToggleAtivo?: (planoId: string) => void
}

export interface CostPanelProps {
  config: ConfigPainelCustos
  onSave: (config: ConfigPainelCustos) => void
  onRestoreDefault: () => void
}

export interface ComparisonTableProps {
  planos: PlanoAssinatura[]
  metricas: Record<string, MetricasComparativas>
  onOrdenar: (campo: string) => void
  onFiltrar: (filtros: any) => void
  onExportar: (formato: 'csv' | 'pdf') => void
}

export interface ReportGeneratorProps {
  tipo: TipoRelatorio
  planos: PlanoAssinatura[]
  onGenerate: (relatorio: RelatorioAnalitico) => void
}

// Constantes para validação
export const VALIDATION_CONSTANTS = {
  TAXA_PROCESSAMENTO: { min: 0, max: 10, default: 2.99 },
  CUSTO_PARCELAMENTO: { min: 0, max: 15, default: 1.5 },
  EMBALAGENS: { min: 0, max: 50, default: 8.50 },
  EXAMES: { min: 0, max: 500, default: 50 },
  ADMINISTRATIVO: { min: 0, max: 1000, default: 150 },
  INSUMOS: { min: 0, max: 200, default: 35 },
  OPERACIONAL: { min: 0, max: 500, default: 80 },
  DESCONTO_BASICO: { min: 0, max: 30, default: 15 },
  DESCONTO_PADRAO: { min: 0, max: 30, default: 18 },
  DESCONTO_PREMIUM: { min: 0, max: 30, default: 20 }
} as const

// Fórmulas de cálculo
export const FORMULAS = {
  CUSTO_TOTAL: (custos: CustosOperacionais, preco: number) => {
    const percentuais = preco * ((custos.taxaProcessamento + custos.custoParcelamento) / 100)
    const fixos = custos.embalagens + custos.exames + custos.administrativo + custos.insumos + custos.operacional
    return percentuais + fixos
  },
  MARGEM_LUCRO: (precoVenda: number, custoTotal: number) => {
    return ((precoVenda - custoTotal) / precoVenda) * 100
  },
  PRECO_ANUAL_COM_DESCONTO: (precoMensal: number, desconto: number) => {
    const precoAnualSemDesconto = precoMensal * 12
    return precoAnualSemDesconto * (1 - desconto / 100)
  },
  ECONOMIA_ANUAL: (precoMensal: number, precoAnual: number) => {
    const anualSemDesconto = precoMensal * 12
    return {
      valor: anualSemDesconto - precoAnual,
      percentual: ((anualSemDesconto - precoAnual) / anualSemDesconto) * 100
    }
  },
  ROI: (lucro: number, investimento: number) => {
    return (lucro / investimento) * 100
  }
} as const