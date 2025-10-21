/**
 * Biblioteca de cálculos financeiros para a calculadora de preços
 * Implementa todas as fórmulas e validações according to spec
 */

import {
  PlanoAssinatura,
  CustosOperacionais,
  BeneficioPlano,
  MetricasComparativas,
  MargemLucro,
  ResumoFinanceiro,
  ConfigDescontoProgressivo,
  TipoLente,
  Acessorio,
  ConfigPainelCustos,
  FORMULAS,
  VALIDATION_CONSTANTS
} from '@/types/pricing-calculator'

/**
 * Formata valor para moeda brasileira (R$)
 */
export function formatarMoeda(valor: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  }).format(valor)
}

/**
 * Formata percentual com casas decimais
 */
export function formatarPercentual(valor: number, decimais: number = 2): string {
  return `${valor.toFixed(decimais)}%`
}

/**
 * Calcula o custo total operacional de um plano
 */
export function calcularCustoTotal(custos: CustosOperacionais, precoVenda: number): number {
  // Cálculo de custos percentuais sobre o preço
  const custoPercentuais = precoVenda * ((custos.taxaProcessamento + custos.custoParcelamento) / 100)

  // Soma dos custos fixos
  const custoFixos = custos.embalagens + custos.exames + custos.administrativo + custos.insumos + custos.operacional

  // Custo dos benefícios
  const custoBeneficios = custos.beneficios?.reduce((total, beneficio) => {
    const mensalidade = beneficio.frequencia === 'mensal' ? beneficio.custo :
                       beneficio.frequencia === 'trimestral' ? beneficio.custo / 3 :
                       beneficio.frequencia === 'anual' ? beneficio.custo / 12 :
                       beneficio.custo // único
    return total + (mensalidade * (beneficio.quantidade || 1))
  }, 0) || 0

  return custoPercentuais + custoFixos + custoBeneficios
}

/**
 * Calcula a margem de lucro de um plano
 */
export function calcularMargemLucro(precoVenda: number, custoTotal: number): MargemLucro {
  const percentual = ((precoVenda - custoTotal) / precoVenda) * 100
  const valorAbsoluto = precoVenda - custoTotal

  let indicador: 'baixa' | 'media' | 'alta'
  if (percentual >= 30) {
    indicador = 'alta'
  } else if (percentual >= 15) {
    indicador = 'media'
  } else {
    indicador = 'baixa'
  }

  return {
    percentual,
    valorAbsoluto,
    indicador
  }
}

/**
 * Calcula o preço anual com desconto
 */
export function calcularPrecoAnualComDesconto(precoMensal: number, desconto: number): number {
  const precoAnualSemDesconto = precoMensal * 12
  return precoAnualSemDesconto * (1 - desconto / 100)
}

/**
 * Calcula a economia anual do plano anual
 */
export function calcularEconomiaAnual(precoMensal: number, desconto: number) {
  const precoAnualSemDesconto = precoMensal * 12
  const precoAnualComDesconto = calcularPrecoAnualComDesconto(precoMensal, desconto)

  return {
    valor: precoAnualSemDesconto - precoAnualComDesconto,
    percentual: ((precoAnualSemDesconto - precoAnualComDesconto) / precoAnualSemDesconto) * 100
  }
}

/**
 * Gera resumo financeiro completo do plano
 */
export function gerarResumoFinanceiro(
  plano: PlanoAssinatura,
  descontos: ConfigDescontoProgressivo
): ResumoFinanceiro {
  const precoMensal = plano.precoBase
  const custoTotalMensal = calcularCustoTotal(plano.custos, precoMensal)
  const margem = calcularMargemLucro(precoMensal, custoTotalMensal)

  let economiaAnual
  if (plano.ciclo === 'anual' && plano.descontoAnual) {
    economiaAnual = calcularEconomiaAnual(precoMensal, plano.descontoAnual)
  }

  return {
    precoVenda: precoMensal,
    custoTotal: custoTotalMensal,
    margem,
    economiaAnual
  }
}

/**
 * Gera métricas comparativas para a tabela
 */
export function gerarMetricasComparativas(
  plano: PlanoAssinatura,
  descontos: ConfigDescontoProgressivo
): MetricasComparativas {
  const precoMensal = plano.precoBase
  const custoTotalMensal = calcularCustoTotal(plano.custos, precoMensal)
  const margem = calcularMargemLucro(precoMensal, custoTotalMensal)

  // Cálculo do preço anual
  let precoAnual: number
  let economiaAnualValor = 0
  let economiaAnualPercentual = 0

  if (plano.ciclo === 'anual') {
    const desconto = plano.descontoAnual || descontos[`${plano.categoria}Anual` as keyof ConfigDescontoProgressivo]
    precoAnual = calcularPrecoAnualComDesconto(precoMensal, desconto)
    const economia = calcularEconomiaAnual(precoMensal, desconto)
    economiaAnualValor = economia.valor
    economiaAnualPercentual = economia.percentual
  } else {
    precoAnual = precoMensal * 12
  }

  const custoTotalAnual = custoTotalMensal * 12

  // Cálculo do ROI
  const lucroAnual = precoAnual - custoTotalAnual
  const investimento = custoTotalAnual
  const roi = investimento > 0 ? (lucroAnual / investimento) * 100 : 0

  // Contagem de benefícios e custo por benefício
  const beneficiosCount = plano.beneficios.filter(b => b.incluido).length
  const custoPorBeneficio = beneficiosCount > 0 ? custoTotalMensal / beneficiosCount : 0

  return {
    precoMensal,
    precoAnual,
    custoTotalMensal,
    custoTotalAnual,
    margemPercentual: margem.percentual,
    margemValor: margem.valorAbsoluto,
    economiaAnualValor,
    economiaAnualPercentual,
    roi,
    beneficiosCount,
    custoPorBeneficio
  }
}

/**
 * Valida campos de custos
 */
export function validarCustos(custos: Partial<CustosOperacionais>): {
  isValid: boolean
  errors: string[]
} {
  const errors: string[] = []

  // Validação de taxas percentuais
  if (custos.taxaProcessamento !== undefined) {
    if (custos.taxaProcessamento < 0 || custos.taxaProcessamento > 10) {
      errors.push('Taxa de processamento deve estar entre 0% e 10%')
    }
  }

  if (custos.custoParcelamento !== undefined) {
    if (custos.custoParcelamento < 0 || custos.custoParcelamento > 15) {
      errors.push('Custo de parcelamento deve estar entre 0% e 15%')
    }
  }

  // Validação de valores fixos
  const valoresFixos = {
    embalagens: { min: 0, max: 50, nome: 'Embalagens' },
    exames: { min: 0, max: 500, nome: 'Exames' },
    administrativo: { min: 0, max: 1000, nome: 'Despesas administrativas' },
    insumos: { min: 0, max: 200, nome: 'Custos de insumos' },
    operacional: { min: 0, max: 500, nome: 'Despesas operacionais' }
  }

  Object.entries(valoresFixos).forEach(([campo, config]) => {
    const valor = custos[campo as keyof CustosOperacionais]
    if (valor !== undefined) {
      if (valor < config.min || valor > config.max) {
        errors.push(`${config.nome} deve estar entre R$ ${config.min} e R$ ${config.max}`)
      }
    }
  })

  return {
    isValid: errors.length === 0,
    errors
  }
}

/**
 * Valida descontos progressivos
 */
export function validarDescontos(descontos: Partial<ConfigDescontoProgressivo>): {
  isValid: boolean
  errors: string[]
} {
  const errors: string[] = []

  if (descontos.basicoAnual !== undefined) {
    if (descontos.basicoAnual < 0 || descontos.basicoAnual > 30) {
      errors.push('Desconto plano básico deve estar entre 0% e 30%')
    }
  }

  if (descontos.padraoAnual !== undefined) {
    if (descontos.padraoAnual < 0 || descontos.padraoAnual > 30) {
      errors.push('Desconto plano padrão deve estar entre 0% e 30%')
    }
  }

  if (descontos.premiumAnual !== undefined) {
    if (descontos.premiumAnual < 0 || descontos.premiumAnual > 30) {
      errors.push('Desconto plano premium deve estar entre 0% e 30%')
    }
  }

  return {
    isValid: errors.length === 0,
    errors
  }
}

/**
 * Calcula projeção de receita
 */
export function calcularProjecaoReceita(
  planos: PlanoAssinatura[],
  meses: number,
  cenario: 'conservador' | 'realista' | 'otimista' = 'realista'
) {
  const cenarios = {
    conservador: { crescimento: 0.02, retencao: 0.85 },
    realista: { crescimento: 0.05, retencao: 0.90 },
    otimista: { crescimento: 0.10, retencao: 0.95 }
  }

  const config = cenarios[cenario]
  const projecoes: number[] = []

  for (let mes = 1; mes <= meses; mes++) {
    let totalMes = 0

    planos.forEach(plano => {
      if (plano.ativo) {
        const assinaturasAtivas = 100 * Math.pow(1 + config.crescimento, mes - 1) * Math.pow(config.retencao, mes - 1)
        const receitaMes = plano.precoBase * assinaturasAtivas
        totalMes += receitaMes
      }
    })

    projecoes.push(totalMes)
  }

  return projecoes
}

/**
 * Exporta dados para CSV
 */
export function exportarCSV(dados: any[], nomeArquivo: string) {
  if (dados.length === 0) return

  const headers = Object.keys(dados[0])
  const csvContent = [
    headers.join(','),
    ...dados.map(row =>
      headers.map(header => {
        const value = row[header]
        if (typeof value === 'number') {
          return value.toLocaleString('pt-BR')
        }
        return `"${value}"`
      }).join(',')
    )
  ].join('\n')

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
  const link = document.createElement('a')
  const url = URL.createObjectURL(blob)
  link.setAttribute('href', url)
  link.setAttribute('download', `${nomeArquivo}.csv`)
  link.style.visibility = 'hidden'
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
}

/**
 * Validação de precisão decimal (2 casas)
 */
export function validarPrecisaoDecimal(valor: number): boolean {
  const rounded = Math.round(valor * 100) / 100
  return Math.abs(valor - rounded) < 0.001
}

/**
 * Arredonda valor para 2 casas decimais
 */
export function arredondarValor(valor: number): number {
  return Math.round(valor * 100) / 100
}

/**
 * Retorna classe CSS baseada na margem de lucro
 */
export function getCorIndicadorMargem(margem: number): string {
  if (margem >= 30) return 'text-green-600 bg-green-50'
  if (margem >= 15) return 'text-yellow-600 bg-yellow-50'
  return 'text-red-600 bg-red-50'
}

/**
 * Calcula custo mensal de lentes para um plano
 */
export function calcularCustoMensalLentes(
  tiposLente: TipoLente[],
  configuracaoLentes: Array<{ tipoId: string; quantidade: number }>
): number {
  let custoTotal = 0

  configuracaoLentes.forEach(config => {
    const tipoLente = tiposLente.find(t => t.id === config.tipoId)
    if (tipoLente) {
      // Custo mensal baseado no consumo mensal (considerando 1 par por mês)
      const custoPorUnidade = tipoLente.custoUnitario
      const custoMensal = custoPorUnidade * config.quantidade
      custoTotal += custoMensal
    }
  })

  return custoTotal
}

/**
 * Calcula custo mensal de acessórios para um plano
 */
export function calcularCustoMensalAcessorios(
  acessorios: Acessorio[],
  configuracaoAcessorios: Array<{ acessorioId: string; frequencia: 'mensal' | 'trimestral' | 'semestral' | 'anual' }>
): number {
  let custoTotal = 0

  configuracaoAcessorios.forEach(config => {
    const acessorio = acessorios.find(a => a.id === config.acessorioId)
    if (acessorio) {
      let custoMensal = 0

      switch (config.frequencia) {
        case 'mensal':
          custoMensal = acessorio.custo
          break
        case 'trimestral':
          custoMensal = acessorio.custo / 3
          break
        case 'semestral':
          custoMensal = acessorio.custo / 6
          break
        case 'anual':
          custoMensal = acessorio.custo / 12
          break
      }

      custoTotal += custoMensal
    }
  })

  return custoTotal
}

/**
 * Calcula análise de rentabilidade
 */
export function calcularAnaliseRentabilidade(
  plano: PlanoAssinatura,
  assinaturasAtivas: number,
  periodo: { inicio: Date; fim: Date }
) {
  const diasNoPeriodo = Math.ceil((periodo.fim.getTime() - periodo.inicio.getTime()) / (1000 * 60 * 60 * 24))
  const mesesNoPeriodo = diasNoPeriodo / 30.44 // média de dias no mês

  const receitaTotal = plano.precoBase * assinaturasAtivas * mesesNoPeriodo
  const custoTotal = calcularCustoTotal(plano.custos, plano.precoBase) * assinaturasAtivas * mesesNoPeriodo
  const lucroBruto = receitaTotal - custoTotal
  const margemBruta = (lucroBruto / receitaTotal) * 100
  const receitaMediaPorAssinatura = receitaTotal / assinaturasAtivas

  return {
    planoId: plano.id,
    periodo,
    receitaTotal,
    custoTotal,
    lucroBruto,
    margemBruta,
    assinaturasAtivas,
    receitaMediaPorAssinatura,
    tendencia: margemBruta > 30 ? 'crescente' : margemBruta > 15 ? 'estavel' : 'decrescente' as 'crescente' | 'estavel' | 'decrescente'
  }
}

/**
 * Dados reais de lentes SV Lentes
 */
export const getTiposLenteReais = (): TipoLente[] => [
  {
    id: 'asferica',
    nome: 'Lente Asférica',
    categoria: 'asferica',
    custoUnitario: 20,
    unidadesPorCaixa: 6,
    descricao: 'Lentes nacionais asféricas de alta qualidade'
  },
  {
    id: 'torica',
    nome: 'Lente Tórica',
    categoria: 'torica',
    custoUnitario: 40,
    unidadesPorCaixa: 6,
    descricao: 'Lentes nacionais tóricas para astigmatismo'
  },
  {
    id: 'multifocal',
    nome: 'Lente Multifocal',
    categoria: 'multifocal',
    custoUnitario: 50,
    unidadesPorCaixa: 6,
    descricao: 'Lentes nacionais multifocais progressivas'
  }
]

/**
 * Dados reais de acessórios SV Lentes
 */
export const getAcessoriosReais = (): Acessorio[] => [
  {
    id: 'solucao-300ml',
    nome: 'Solução de Limpeza 300ml',
    custo: 30,
    tipo: 'solucao',
    descricao: 'Solução completa para limpeza diária'
  },
  {
    id: 'solucao-viagem',
    nome: 'Solução para Viagem 120ml',
    custo: 20,
    tipo: 'solucao',
    descricao: 'Solução compacta para viagens'
  },
  {
    id: 'colirio-renu',
    nome: 'Colírio RENU',
    custo: 23.50,
    tipo: 'colirio',
    descricao: 'Colírio lubrificante'
  },
  {
    id: 'estojo-completo',
    nome: 'Estojo Completo',
    custo: 10,
    tipo: 'estojo',
    descricao: 'Estojo premium com case'
  },
  {
    id: 'pegador',
    nome: 'Pegador de Lentes',
    custo: 2,
    tipo: 'pegador',
    descricao: 'Pinça para manipulação segura'
  },
  {
    id: 'aplicador-colirio',
    nome: 'Aplicador de Colírio',
    custo: 25,
    tipo: 'aplicador',
    descricao: 'Aplicador preciso para colírios'
  },
  {
    id: 'abridor-olho',
    nome: 'Abridor de Olho',
    custo: 10,
    tipo: 'abridor',
    descricao: 'Abridor especializado para pálpebras'
  }
]

/**
 * Configuração padrão de custos atualizada com dados reais SV Lentes
 */
export const getCustosPadrao = (): ConfigPainelCustos => ({
  id: 'default-svlentes-2025',
  nome: 'Configuração SV Lentes 2025',
  taxaProcessamento: VALIDATION_CONSTANTS.TAXA_PROCESSAMENTO.default,
  custoParcelamento: VALIDATION_CONSTANTS.CUSTO_PARCELAMENTO.default,
  embalagens: VALIDATION_CONSTANTS.EMBALAGENS.default,
  exames: VALIDATION_CONSTANTS.EXAMES.default,
  administrativo: VALIDATION_CONSTANTS.ADMINISTRATIVO.default,
  insumos: VALIDATION_CONSTANTS.INSUMOS.default,
  operacional: VALIDATION_CONSTANTS.OPERACIONAL.default,
  beneficios: [],
  // Metadados
  dataAtualizacao: new Date().toISOString(),
  versao: '2.0.0',
  atualizadoPor: 'Admin SV Lentes',
  // Custos específicos
  tiposLente: getTiposLenteReais(),
  acessorios: getAcessoriosReais()
})

/**
 * Configuração padrão de descontos
 */
export const getDescontosPadrao = (): ConfigDescontoProgressivo => ({
  basicoAnual: VALIDATION_CONSTANTS.DESCONTO_BASICO.default,
  padraoAnual: VALIDATION_CONSTANTS.DESCONTO_PADRAO.default,
  premiumAnual: VALIDATION_CONSTANTS.DESCONTO_PREMIUM.default
})