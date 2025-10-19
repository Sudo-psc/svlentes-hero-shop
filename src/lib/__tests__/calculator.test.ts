import {
  calculateEconomy,
  formatCurrency,
  formatPercentage,
  validateCalculatorInput,
  validateCustomUsageDays
} from '../calculator'
import { CalculatorInput } from '@/types/calculator'

describe('Calculator Functions', () => {
  describe('calculateEconomy', () => {
    it('should calculate economy for daily lenses with regular usage', () => {
      const input: CalculatorInput = {
        lensType: 'daily',
        usagePattern: 'regular',
      }

      const result = calculateEconomy(input)

      expect(result.lensesPerMonth).toBe(40) // 20 days * 2 lenses
      expect(result.monthlyAvulso).toBe(180) // 40 * 4.50
      expect(result.monthlySubscription).toBe(108) // 40 * 2.70
      expect(result.monthlySavings).toBe(72)
      expect(result.yearlySavings).toBe(864)
      expect(result.savingsPercentage).toBeCloseTo(40, 0)
    })

    it('should calculate economy for monthly lenses with daily usage', () => {
      const input: CalculatorInput = {
        lensType: 'monthly',
        usagePattern: 'daily',
      }

      const result = calculateEconomy(input)

      expect(result.lensesPerMonth).toBe(60) // 30 days * 2 lenses
      expect(result.monthlyAvulso).toBe(1500) // 60 * 25.00
      expect(result.monthlySubscription).toBe(900) // 60 * 15.00
      expect(result.monthlySavings).toBe(600)
      expect(result.yearlySavings).toBe(7200)
      expect(result.savingsPercentage).toBeCloseTo(40, 0)
    })

    it('should calculate economy for weekly lenses with occasional usage', () => {
      const input: CalculatorInput = {
        lensType: 'weekly',
        usagePattern: 'occasional',
      }

      const result = calculateEconomy(input)

      expect(result.lensesPerMonth).toBe(20) // 10 days * 2 lenses
      expect(result.monthlyAvulso).toBe(240) // 20 * 12.00
      expect(result.monthlySubscription).toBe(144) // 20 * 7.20
      expect(result.monthlySavings).toBe(96)
      expect(result.yearlySavings).toBe(1152)
    })

    it('should use custom usage days when provided', () => {
      const input: CalculatorInput = {
        lensType: 'daily',
        usagePattern: 'regular', // 20 days default
        customUsageDays: 15, // Override with 15 days
      }

      const result = calculateEconomy(input)

      expect(result.lensesPerMonth).toBe(30) // 15 days * 2 lenses
      expect(result.monthlyAvulso).toBe(135) // 30 * 4.50
      expect(result.monthlySubscription).toBe(81) // 30 * 2.70
      expect(result.monthlySavings).toBe(54)
    })

    it('should include annual costs when provided', () => {
      const input: CalculatorInput = {
        lensType: 'monthly',
        usagePattern: 'regular',
        annualContactLensCost: 1500,
        annualConsultationCost: 500,
      }

      const result = calculateEconomy(input)

      expect(result.totalCurrentAnnualCost).toBe(2000) // 1500 + 500
      expect(result.totalSVLentesAnnualCost).toBeGreaterThan(0)
      // Com SV Lentes o custo pode ser maior ou menor dependendo do plano e uso
      // O importante é que o cálculo seja consistente
      expect(result.totalAnnualSavings).toBeDefined()
      expect(typeof result.totalAnnualSavings).toBe('number')
      expect(result.includedConsultations).toBeGreaterThanOrEqual(1)
    })

    it('should recommend correct plan based on usage pattern', () => {
      const occasionalInput: CalculatorInput = {
        lensType: 'daily',
        usagePattern: 'occasional',
      }
      const regularInput: CalculatorInput = {
        lensType: 'monthly',
        usagePattern: 'regular',
      }
      const dailyInput: CalculatorInput = {
        lensType: 'daily',
        usagePattern: 'daily',
      }

      expect(calculateEconomy(occasionalInput).recommendedPlan).toBe('basic')
      expect(calculateEconomy(regularInput).recommendedPlan).toBe('premium')
      expect(calculateEconomy(dailyInput).recommendedPlan).toBe('premium')
    })

    it('should throw error for invalid lens type', () => {
      const input = {
        lensType: 'invalid' as any,
        usagePattern: 'regular' as any,
      }

      expect(() => calculateEconomy(input)).toThrow('Padrão de uso ou tipo de lente inválido')
    })

    it('should throw error for invalid usage pattern', () => {
      const input = {
        lensType: 'daily' as any,
        usagePattern: 'invalid' as any,
      }

      expect(() => calculateEconomy(input)).toThrow('Padrão de uso ou tipo de lente inválido')
    })
  })

  describe('formatCurrency', () => {
    it('should format currency correctly in BRL', () => {
      expect(formatCurrency(100)).toBe('R$ 100,00')
      expect(formatCurrency(1234.56)).toBe('R$ 1.234,56')
      expect(formatCurrency(0.5)).toBe('R$ 0,50')
      expect(formatCurrency(0)).toBe('R$ 0,00')
    })

    it('should handle negative values', () => {
      expect(formatCurrency(-50)).toBe('-R$ 50,00')
    })

    it('should handle large values', () => {
      expect(formatCurrency(1000000)).toBe('R$ 1.000.000,00')
    })
  })

  describe('formatPercentage', () => {
    it('should format percentage correctly', () => {
      expect(formatPercentage(40)).toBe('40%')
      expect(formatPercentage(40.5)).toBe('41%')
      expect(formatPercentage(40.4)).toBe('40%')
      expect(formatPercentage(0)).toBe('0%')
      expect(formatPercentage(100)).toBe('100%')
    })

    it('should round to nearest integer', () => {
      expect(formatPercentage(33.33)).toBe('33%')
      expect(formatPercentage(66.67)).toBe('67%')
    })
  })

  describe('validateCalculatorInput', () => {
    it('should validate complete valid input', () => {
      const input: Partial<CalculatorInput> = {
        lensType: 'daily',
        usagePattern: 'regular',
        customUsageDays: 15,
        annualContactLensCost: 1200,
        annualConsultationCost: 400,
      }

      const result = validateCalculatorInput(input)

      expect(result.isValid).toBe(true)
      expect(result.errors).toHaveLength(0)
    })

    it('should require lens type', () => {
      const input: Partial<CalculatorInput> = {
        usagePattern: 'regular',
      }

      const result = validateCalculatorInput(input)

      expect(result.isValid).toBe(false)
      expect(result.errors).toContain('Tipo de lente é obrigatório')
    })

    it('should require usage pattern', () => {
      const input: Partial<CalculatorInput> = {
        lensType: 'daily',
      }

      const result = validateCalculatorInput(input)

      expect(result.isValid).toBe(false)
      expect(result.errors).toContain('Padrão de uso é obrigatório')
    })

    it('should validate customUsageDays range', () => {
      const inputTooLow: Partial<CalculatorInput> = {
        lensType: 'daily',
        usagePattern: 'regular',
        customUsageDays: 0,
      }

      const inputTooHigh: Partial<CalculatorInput> = {
        lensType: 'daily',
        usagePattern: 'regular',
        customUsageDays: 32,
      }

      const inputNonInteger: Partial<CalculatorInput> = {
        lensType: 'daily',
        usagePattern: 'regular',
        customUsageDays: 15.5,
      }

      expect(validateCalculatorInput(inputTooLow).isValid).toBe(false)
      expect(validateCalculatorInput(inputTooHigh).isValid).toBe(false)
      expect(validateCalculatorInput(inputNonInteger).isValid).toBe(false)
    })

    it('should reject negative annual costs', () => {
      const inputNegativeLens: Partial<CalculatorInput> = {
        lensType: 'daily',
        usagePattern: 'regular',
        annualContactLensCost: -100,
      }

      const inputNegativeConsultation: Partial<CalculatorInput> = {
        lensType: 'daily',
        usagePattern: 'regular',
        annualConsultationCost: -50,
      }

      expect(validateCalculatorInput(inputNegativeLens).isValid).toBe(false)
      expect(validateCalculatorInput(inputNegativeConsultation).isValid).toBe(false)
    })

    it('should allow zero annual costs', () => {
      const input: Partial<CalculatorInput> = {
        lensType: 'daily',
        usagePattern: 'regular',
        annualContactLensCost: 0,
        annualConsultationCost: 0,
      }

      const result = validateCalculatorInput(input)

      expect(result.isValid).toBe(true)
    })
  })

  describe('validateCustomUsageDays', () => {
    it('should validate correct values', () => {
      expect(validateCustomUsageDays('1')).toBe(1)
      expect(validateCustomUsageDays('15')).toBe(15)
      expect(validateCustomUsageDays('31')).toBe(31)
    })

    it('should reject values below 1', () => {
      expect(validateCustomUsageDays('0')).toBeNull()
      expect(validateCustomUsageDays('-1')).toBeNull()
    })

    it('should reject values above 31', () => {
      expect(validateCustomUsageDays('32')).toBeNull()
      expect(validateCustomUsageDays('100')).toBeNull()
    })

    it('should reject non-numeric values', () => {
      expect(validateCustomUsageDays('abc')).toBeNull()
      expect(validateCustomUsageDays('12.5')).toBeNull()
      expect(validateCustomUsageDays('')).toBeNull()
    })

    it('should handle whitespace', () => {
      expect(validateCustomUsageDays('  15  ')).toBe(15)
      expect(validateCustomUsageDays('   ')).toBeNull()
    })

    it('should reject decimal values', () => {
      expect(validateCustomUsageDays('15.5')).toBeNull()
      expect(validateCustomUsageDays('20.1')).toBeNull()
    })
  })

  describe('Edge Cases and Boundary Conditions', () => {
    it('should handle minimum usage (1 day per month)', () => {
      const input: CalculatorInput = {
        lensType: 'daily',
        usagePattern: 'occasional',
        customUsageDays: 1,
      }

      const result = calculateEconomy(input)

      expect(result.lensesPerMonth).toBe(2)
      expect(result.monthlySavings).toBeGreaterThan(0)
    })

    it('should handle maximum usage (31 days per month)', () => {
      const input: CalculatorInput = {
        lensType: 'daily',
        usagePattern: 'daily',
        customUsageDays: 31,
      }

      const result = calculateEconomy(input)

      expect(result.lensesPerMonth).toBe(62)
      expect(result.monthlySavings).toBeGreaterThan(0)
    })

    it('should maintain percentage accuracy across different inputs', () => {
      const inputs: CalculatorInput[] = [
        { lensType: 'daily', usagePattern: 'occasional' },
        { lensType: 'weekly', usagePattern: 'regular' },
        { lensType: 'monthly', usagePattern: 'daily' },
      ]

      inputs.forEach(input => {
        const result = calculateEconomy(input)
        expect(result.savingsPercentage).toBeGreaterThan(0)
        expect(result.savingsPercentage).toBeLessThanOrEqual(100)
      })
    })
  })
})
