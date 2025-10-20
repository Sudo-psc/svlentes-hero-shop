/**
 * Testes automatizados para a calculadora de preços
 * Validações de acordo com a especificação técnica
 */

import {
  calcularCustoTotal,
  calcularMargemLucro,
  calcularPrecoAnualComDesconto,
  calcularEconomiaAnual,
  formatarMoeda,
  formatarPercentual,
  validarCustos,
  validarDescontos,
  gerarMetricasComparativas,
  getCustosPadrao,
  getDescontosPadrao
} from '@/lib/pricing-calculator'

import {
  PlanoAssinatura,
  CustosOperacionais,
  ConfigDescontoProgressivo,
  VALIDATION_CONSTANTS
} from '@/types/pricing-calculator'

describe('Calculadora de Preços', () => {
  // Dados de teste
  const custosPadrao: CustosOperacionais = {
    id: 'test',
    nome: 'Teste',
    taxaProcessamento: 2.99,
    custoParcelamento: 1.5,
    embalagens: 8.50,
    exames: 50,
    administrativo: 150,
    insumos: 35,
    operacional: 80,
    beneficios: []
  }

  const planoBasico: PlanoAssinatura = {
    id: 'plano-basico',
    nome: 'Plano Básico',
    categoria: 'basico',
    ciclo: 'mensal',
    precoBase: 100,
    custos: custosPadrao,
    beneficios: [],
    ativo: true,
    createdAt: new Date(),
    updatedAt: new Date()
  }

  describe('Cálculo de Custo Total', () => {
    test('deve calcular custo total corretamente', () => {
      const precoVenda = 100
      const resultado = calcularCustoTotal(custosPadrao, precoVenda)

      // Cálculo esperado:
      // Percentuais: 100 * ((2.99 + 1.5) / 100) = 4.49
      // Fixos: 8.50 + 50 + 150 + 35 + 80 = 323.50
      // Total: 4.49 + 323.50 = 327.99

      expect(resultado).toBeCloseTo(327.99, 2)
    })

    test('deve incluir custo de benefícios', () => {
      const custosComBeneficios = {
        ...custosPadrao,
        beneficios: [
          {
            id: 'b1',
            descricao: 'Consulta',
            custo: 100,
            frequencia: 'mensal' as const,
            incluido: true,
            quantidade: 1
          }
        ]
      }

      const precoVenda = 100
      const resultado = calcularCustoTotal(custosComBeneficios, precoVenda)

      // Custo total + benefício = 327.99 + 100 = 427.99
      expect(resultado).toBeCloseTo(427.99, 2)
    })

    test('deve calcular benefícios trimestrais corretamente', () => {
      const custosComBeneficios = {
        ...custosPadrao,
        beneficios: [
          {
            id: 'b1',
            descricao: 'Exame',
            custo: 150,
            frequencia: 'trimestral' as const,
            incluido: true,
            quantidade: 1
          }
        ]
      }

      const precoVenda = 100
      const resultado = calcularCustoTotal(custosComBeneficios, precoVenda)

      // Custo mensal do benefício = 150 / 3 = 50
      // Total = 327.99 + 50 = 377.99
      expect(resultado).toBeCloseTo(377.99, 2)
    })
  })

  describe('Cálculo de Margem de Lucro', () => {
    test('deve calcular margem de 30% como alta', () => {
      const precoVenda = 100
      const custoTotal = 70
      const resultado = calcularMargemLucro(precoVenda, custoTotal)

      expect(resultado.percentual).toBe(30)
      expect(resultado.valorAbsoluto).toBe(30)
      expect(resultado.indicador).toBe('alta')
    })

    test('deve calcular margem de 20% como média', () => {
      const precoVenda = 100
      const custoTotal = 80
      const resultado = calcularMargemLucro(precoVenda, custoTotal)

      expect(resultado.percentual).toBe(20)
      expect(resultado.valorAbsoluto).toBe(20)
      expect(resultado.indicador).toBe('media')
    })

    test('deve calcular margem de 10% como baixa', () => {
      const precoVenda = 100
      const custoTotal = 90
      const resultado = calcularMargemLucro(precoVenda, custoTotal)

      expect(resultado.percentual).toBe(10)
      expect(resultado.valorAbsoluto).toBe(10)
      expect(resultado.indicador).toBe('baixa')
    })

    test('deve lidar com margem zero', () => {
      const precoVenda = 100
      const custoTotal = 100
      const resultado = calcularMargemLucro(precoVenda, custoTotal)

      expect(resultado.percentual).toBe(0)
      expect(resultado.valorAbsoluto).toBe(0)
      expect(resultado.indicador).toBe('baixa')
    })
  })

  describe('Cálculo de Preço Anual com Desconto', () => {
    test('deve calcular preço anual com desconto de 20%', () => {
      const precoMensal = 100
      const desconto = 20
      const resultado = calcularPrecoAnualComDesconto(precoMensal, desconto)

      // Preço anual sem desconto = 100 * 12 = 1200
      // Com desconto = 1200 * (1 - 0.20) = 960
      expect(resultado).toBe(960)
    })

    test('deve retornar preço sem desconto se desconto for 0', () => {
      const precoMensal = 100
      const desconto = 0
      const resultado = calcularPrecoAnualComDesconto(precoMensal, desconto)

      expect(resultado).toBe(1200)
    })
  })

  describe('Cálculo de Economia Anual', () => {
    test('deve calcular economia corretamente', () => {
      const precoMensal = 100
      const desconto = 15
      const resultado = calcularEconomiaAnual(precoMensal, desconto)

      // Preço sem desconto = 1200
      // Preço com desconto = 1020
      // Economia = 180
      // Percentual = 15%

      expect(resultado.valor).toBe(180)
      expect(resultado.percentual).toBe(15)
    })
  })

  describe('Formatação', () => {
    test('deve formatar moeda brasileira', () => {
      expect(formatarMoeda(100)).toBe('R$ 100,00')
      expect(formatarMoeda(100.50)).toBe('R$ 100,50')
      expect(formatarMoeda(1000.99)).toBe('R$ 1.000,99')
    })

    test('deve formatar percentual', () => {
      expect(formatarPercentual(25)).toBe('25%')
      expect(formatarPercentual(25.5)).toBe('25.50%')
      expect(formatarPercentual(25.567)).toBe('25.57%')
    })
  })

  describe('Validações', () => {
    test('deve validar custos dentro dos limites', () => {
      const custosValidos = {
        ...custosPadrao,
        taxaProcessamento: 5,
        custoParcelamento: 5,
        embalagens: 25,
        exames: 100,
        administrativo: 200,
        insumos: 50,
        operacional: 100
      }

      const resultado = validarCustos(custosValidos)
      expect(resultado.isValid).toBe(true)
      expect(resultado.errors).toHaveLength(0)
    })

    test('deve rejeitar taxa de processamento acima do limite', () => {
      const custosInvalidos = {
        ...custosPadrao,
        taxaProcessamento: 15 // Acima do limite de 10
      }

      const resultado = validarCustos(custosInvalidos)
      expect(resultado.isValid).toBe(false)
      expect(resultado.errors).toContain('Taxa de processamento deve estar entre 0% e 10%')
    })

    test('deve rejeitar custos negativos', () => {
      const custosInvalidos = {
        ...custosPadrao,
        embalagens: -10
      }

      const resultado = validarCustos(custosInvalidos)
      expect(resultado.isValid).toBe(false)
      expect(resultado.errors.some(e => e.includes('Embalagens'))).toBe(true)
    })

    test('deve validar descontos progressivos', () => {
      const descontosValidos: ConfigDescontoProgressivo = {
        basicoAnual: 15,
        padraoAnual: 18,
        premiumAnual: 20
      }

      const resultado = validarDescontos(descontosValidos)
      expect(resultado.isValid).toBe(true)
      expect(resultado.errors).toHaveLength(0)
    })

    test('deve rejeitar desconto acima de 30%', () => {
      const descontosInvalidos: ConfigDescontoProgressivo = {
        basicoAnual: 35, // Acima do limite
        padraoAnual: 18,
        premiumAnual: 20
      }

      const resultado = validarDescontos(descontosInvalidos)
      expect(resultado.isValid).toBe(false)
      expect(resultado.errors).toContain('Desconto plano básico deve estar entre 0% e 30%')
    })
  })

  describe('Métricas Comparativas', () => {
    test('deve gerar métricas para plano mensal', () => {
      const descontos = getDescontosPadrao()
      const metricas = gerarMetricasComparativas(planoBasico, descontos)

      expect(metricas.precoMensal).toBe(100)
      expect(metricas.precoAnual).toBe(1200)
      expect(metricas.margemPercentual).toBeLessThan(0) // Prejuízo com custo de 327.99
      expect(metricas.economiaAnualValor).toBe(0)
      expect(metricas.beneficiosCount).toBe(0)
    })

    test('deve gerar métricas para plano anual com desconto', () => {
      const planoAnual = {
        ...planoBasico,
        ciclo: 'anual' as const,
        descontoAnual: 15
      }

      const descontos = getDescontosPadrao()
      const metricas = gerarMetricasComparativas(planoAnual, descontos)

      expect(metricas.precoMensal).toBe(100)
      expect(metricas.precoAnual).toBe(1020) // 1200 * 0.85
      expect(metricas.economiaAnualValor).toBe(180)
      expect(metricas.economiaAnualPercentual).toBe(15)
    })
  })

  describe('Configurações Padrão', () => {
    test('deve retornar custos padrão com valores corretos', () => {
      const custos = getCustosPadrao()

      expect(custos.taxaProcessamento).toBe(VALIDATION_CONSTANTS.TAXA_PROCESSAMENTO.default)
      expect(custos.custoParcelamento).toBe(VALIDATION_CONSTANTS.CUSTO_PARCELAMENTO.default)
      expect(custos.embalagens).toBe(VALIDATION_CONSTANTS.EMBALAGENS.default)
      expect(custos.exames).toBe(VALIDATION_CONSTANTS.EXAMES.default)
      expect(custos.administrativo).toBe(VALIDATION_CONSTANTS.ADMINISTRATIVO.default)
      expect(custos.insumos).toBe(VALIDATION_CONSTANTS.INSUMOS.default)
      expect(custos.operacional).toBe(VALIDATION_CONSTANTS.OPERACIONAL.default)
    })

    test('deve retornar descontos padrão com valores corretos', () => {
      const descontos = getDescontosPadrao()

      expect(descontos.basicoAnual).toBe(VALIDATION_CONSTANTS.DESCONTO_BASICO.default)
      expect(descontos.padraoAnual).toBe(VALIDATION_CONSTANTS.DESCONTO_PADRAO.default)
      expect(descontos.premiumAnual).toBe(VALIDATION_CONSTANTS.DESCONTO_PREMIUM.default)
    })
  })

  describe('Testes de Edge Cases', () => {
    test('deve lidar com preço zero', () => {
      const resultado = calcularMargemLucro(0, 100)
      expect(resultado.percentual).toBe(-100)
      expect(resultado.valorAbsoluto).toBe(-100)
    })

    test('deve lidar com valores decimais', () => {
      const precoVenda = 99.99
      const custoTotal = 66.66
      const resultado = calcularMargemLucro(precoVenda, custoTotal)

      expect(resultado.percentual).toBeCloseTo(33.34, 2)
      expect(resultado.valorAbsoluto).toBeCloseTo(33.33, 2)
    })

    test('deve lidar com múltiplos benefícios com frequências diferentes', () => {
      const custosComMultiplosBeneficios = {
        ...custosPadrao,
        beneficios: [
          {
            id: 'b1',
            descricao: 'Consulta mensal',
            custo: 100,
            frequencia: 'mensal' as const,
            incluido: true,
            quantidade: 1
          },
          {
            id: 'b2',
            descricao: 'Exame trimestral',
            custo: 150,
            frequencia: 'trimestral' as const,
            incluido: true,
            quantidade: 1
          },
          {
            id: 'b3',
            descricao: 'Benefício anual',
            custo: 300,
            frequencia: 'anual' as const,
            incluido: true,
            quantidade: 1
          }
        ]
      }

      const precoVenda = 100
      const resultado = calcularCustoTotal(custosComMultiplosBeneficios, precoVenda)

      // Custo mensal benefícios = 100 + (150/3) + (300/12) = 100 + 50 + 25 = 175
      // Total = 327.99 + 175 = 502.99
      expect(resultado).toBeCloseTo(502.99, 2)
    })
  })
})