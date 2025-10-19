import { calculateEconomy, UnifiedCalculatorInput } from '@/lib/calculator'

describe('calculateEconomy', () => {
  it('should not double-count lens costs in the total annual cost', () => {
    const input: UnifiedCalculatorInput = {
      lensType: 'daily',
      usagePattern: 'regular',
      annualContactLensCost: 2000,
      annualConsultationCost: 500,
    }

    const result = calculateEconomy(input)

    // The 'regular' usage pattern maps to the 'premium' plan, which costs 149.90
    const expectedCost = 12 * 149.90
    expect(result.totalSVLentesAnnualCost).toBeCloseTo(expectedCost, 2)
  })
})
