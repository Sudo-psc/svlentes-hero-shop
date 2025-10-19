import {
  calculateEconomy,
  formatCurrency,
  formatPercentage,
  validateCalculatorInput,
  type UnifiedCalculatorInput,
} from '../calculator'

describe('calculateEconomy', () => {
  const baseInput: UnifiedCalculatorInput = {
    lensType: 'daily',
    usagePattern: 'regular',
  }

  it('computes savings metrics for valid inputs', () => {
    const result = calculateEconomy(baseInput)

    expect(result.lensesPerMonth).toBe(40)
    expect(result.monthlyAvulso).toBeCloseTo(180)
    expect(result.monthlySubscription).toBeCloseTo(108)
    expect(result.monthlySavings).toBeCloseTo(72)
    expect(result.yearlyAvulso).toBeCloseTo(2160)
    expect(result.yearlySubscription).toBeCloseTo(1296)
    expect(result.yearlySavings).toBeCloseTo(864)
    expect(result.savingsPercentage).toBeCloseTo(40)
    expect(result.recommendedPlan).toBe('premium')
    expect(result.totalCurrentAnnualCost).toBeCloseTo(2560)
    expect(result.totalSVLentesAnnualCost).toBeCloseTo(3094.8)
    expect(result.totalAnnualSavings).toBeCloseTo(-534.8)
    expect(result.includedConsultations).toBe(2)
    expect(result.costPerLens).toEqual({ current: 4.5, subscription: 2.7 })
  })

  it('incorporates provided annual spending details', () => {
    const result = calculateEconomy({
      lensType: 'weekly',
      usagePattern: 'daily',
      annualContactLensCost: 4800,
      annualConsultationCost: 600,
    })

    expect(result.lensesPerMonth).toBe(60)
    expect(result.totalCurrentAnnualCost).toBe(5400)
    expect(result.totalSVLentesAnnualCost).toBeCloseTo(6982.8)
    expect(result.totalAnnualSavings).toBeCloseTo(-1582.8)
  })

  it('throws when lens configuration is invalid', () => {
    expect(() =>
      calculateEconomy({ lensType: 'daily', usagePattern: 'invalid' as any })
    ).toThrow('Padrão de uso ou tipo de lente inválido')
  })
})

describe('format helpers', () => {
  it('formats currency using Brazilian locale', () => {
    expect(formatCurrency(1234.56)).toBe('R$\u00a01.234,56')
    expect(formatCurrency(-50)).toBe('-R$\u00a050,00')
  })

  it('rounds percentage values', () => {
    expect(formatPercentage(37.2)).toBe('37%')
    expect(formatPercentage(37.8)).toBe('38%')
  })
})

describe('validateCalculatorInput', () => {
  it('accepts complete valid payload', () => {
    const result = validateCalculatorInput({
      lensType: 'daily',
      usagePattern: 'regular',
      currentSpending: 200,
    })

    expect(result).toEqual({ isValid: true, errors: [] })
  })

  it('collects errors for missing mandatory fields', () => {
    const result = validateCalculatorInput({})

    expect(result.isValid).toBe(false)
    expect(result.errors).toEqual([
      'Tipo de lente é obrigatório',
      'Padrão de uso é obrigatório',
    ])
  })

  it('validates spending boundaries', () => {
    const negative = validateCalculatorInput({
      lensType: 'daily',
      usagePattern: 'regular',
      currentSpending: -10,
    })
    expect(negative.isValid).toBe(false)
    expect(negative.errors).toContain('Gasto atual não pode ser negativo')

    const veryHigh = validateCalculatorInput({
      lensType: 'daily',
      usagePattern: 'regular',
      currentSpending: 1500,
    })
    expect(veryHigh.isValid).toBe(false)
    expect(veryHigh.errors).toContain('Gasto atual parece muito alto, verifique o valor')
  })
})
