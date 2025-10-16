import { 
  calculateEconomy, 
  formatCurrency, 
  formatPercentage,
  validateCalculatorInput,
  type UnifiedCalculatorInput 
} from '../calculator-service'

describe('calculator-service', () => {
  describe('calculateEconomy', () => {
    it('should calculate economy correctly for daily usage', () => {
      const input: UnifiedCalculatorInput = {
        lensType: 'daily',
        usagePattern: 'daily',
      }

      const result = calculateEconomy(input)

      expect(result).toHaveProperty('monthlyAvulso')
      expect(result).toHaveProperty('monthlySubscription')
      expect(result).toHaveProperty('monthlySavings')
      expect(result.monthlySavings).toBeGreaterThan(0)
      expect(result.savingsPercentage).toBeGreaterThan(0)
    })

    it('should calculate economy correctly for occasional usage', () => {
      const input: UnifiedCalculatorInput = {
        lensType: 'monthly',
        usagePattern: 'occasional',
      }

      const result = calculateEconomy(input)

      expect(result.monthlySavings).toBeGreaterThan(0)
      expect(result.recommendedPlan).toBe('basic')
    })

    it('should calculate economy correctly for regular usage', () => {
      const input: UnifiedCalculatorInput = {
        lensType: 'weekly',
        usagePattern: 'regular',
      }

      const result = calculateEconomy(input)

      expect(result.monthlySavings).toBeGreaterThan(0)
      expect(result.recommendedPlan).toBe('premium')
    })

    it('should use custom spending if provided', () => {
      const input: UnifiedCalculatorInput = {
        lensType: 'daily',
        usagePattern: 'daily',
        currentSpending: 500,
      }

      const result = calculateEconomy(input)

      expect(result.monthlySavings).toBeGreaterThan(0)
    })

    it('should throw error for invalid lens type', () => {
      const input = {
        lensType: 'invalid' as any,
        usagePattern: 'daily',
      }

      expect(() => calculateEconomy(input)).toThrow('Padrão de uso ou tipo de lente inválido')
    })

    it('should throw error for invalid usage pattern', () => {
      const input = {
        lensType: 'daily',
        usagePattern: 'invalid' as any,
      }

      expect(() => calculateEconomy(input)).toThrow('Padrão de uso ou tipo de lente inválido')
    })

    it('should calculate total annual savings including consultations', () => {
      const input: UnifiedCalculatorInput = {
        lensType: 'daily',
        usagePattern: 'daily',
      }

      const result = calculateEconomy(input)

      expect(result).toHaveProperty('totalAnnualSavings')
      expect(result).toHaveProperty('includedConsultations')
      expect(result.includedConsultations).toBeGreaterThan(0)
    })
  })

  describe('formatCurrency', () => {
    it('should format currency correctly', () => {
      expect(formatCurrency(100)).toContain('100,00')
      expect(formatCurrency(1234.56)).toContain('1.234,56')
      expect(formatCurrency(0)).toContain('0,00')
      expect(formatCurrency(100)).toMatch(/R\$/)
    })

    it('should handle negative values', () => {
      expect(formatCurrency(-100)).toContain('-')
      expect(formatCurrency(-100)).toContain('100,00')
    })
  })

  describe('formatPercentage', () => {
    it('should format percentage correctly', () => {
      expect(formatPercentage(50)).toBe('50%')
      expect(formatPercentage(33.33)).toBe('33%')
      expect(formatPercentage(0)).toBe('0%')
    })

    it('should round to nearest integer', () => {
      expect(formatPercentage(45.6)).toBe('46%')
      expect(formatPercentage(45.4)).toBe('45%')
    })
  })

  describe('validateCalculatorInput', () => {
    it('should validate correct input', () => {
      const input: Partial<UnifiedCalculatorInput> = {
        lensType: 'daily',
        usagePattern: 'daily',
        currentSpending: 200,
      }

      const result = validateCalculatorInput(input)

      expect(result.isValid).toBe(true)
      expect(result.errors).toHaveLength(0)
    })

    it('should reject missing lens type', () => {
      const input: Partial<UnifiedCalculatorInput> = {
        usagePattern: 'daily',
      }

      const result = validateCalculatorInput(input)

      expect(result.isValid).toBe(false)
      expect(result.errors).toContain('Tipo de lente é obrigatório')
    })

    it('should reject missing usage pattern', () => {
      const input: Partial<UnifiedCalculatorInput> = {
        lensType: 'daily',
      }

      const result = validateCalculatorInput(input)

      expect(result.isValid).toBe(false)
      expect(result.errors).toContain('Padrão de uso é obrigatório')
    })

    it('should reject negative spending', () => {
      const input: Partial<UnifiedCalculatorInput> = {
        lensType: 'daily',
        usagePattern: 'daily',
        currentSpending: -100,
      }

      const result = validateCalculatorInput(input)

      expect(result.isValid).toBe(false)
      expect(result.errors).toContain('Gasto atual não pode ser negativo')
    })

    it('should reject unreasonably high spending', () => {
      const input: Partial<UnifiedCalculatorInput> = {
        lensType: 'daily',
        usagePattern: 'daily',
        currentSpending: 1500,
      }

      const result = validateCalculatorInput(input)

      expect(result.isValid).toBe(false)
      expect(result.errors).toContain('Gasto atual parece muito alto, verifique o valor')
    })
  })
})
