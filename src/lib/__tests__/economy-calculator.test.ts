import { getRecommendedPlan } from '../economy-calculator';

import { calculateEconomy } from '../economy-calculator';

describe('calculateEconomy', () => {
  it('should recommend VIP plan for high annual savings even with regular usage', () => {
    const input = {
      lensType: 'daily' as const,
      usage: 'regular' as const,
      // Mocking a high spending to trigger high savings
      currentSpending: 1500,
    };

    const result = calculateEconomy(input);

    // With current spending of 1500, annual savings will be well over 1000
    // so the VIP plan should be recommended.
    expect(result.recommendedPlan.id).toBe('vip');
  });
});