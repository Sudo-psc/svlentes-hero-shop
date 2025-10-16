import { APP_CONFIG, BUSINESS_CONSTANTS } from '../constants'

describe('constants', () => {
  describe('APP_CONFIG', () => {
    it('should have whatsapp configuration', () => {
      expect(APP_CONFIG.whatsapp).toBeDefined()
      expect(APP_CONFIG.whatsapp.number).toBeDefined()
      expect(typeof APP_CONFIG.whatsapp.number).toBe('string')
    })

    it('should have asaas configuration', () => {
      expect(APP_CONFIG.asaas).toBeDefined()
      expect(APP_CONFIG.asaas.environment).toBeDefined()
      expect(['sandbox', 'production']).toContain(APP_CONFIG.asaas.environment)
    })

    it('should have urls configuration', () => {
      expect(APP_CONFIG.urls).toBeDefined()
      expect(APP_CONFIG.urls.baseUrl).toBeDefined()
      expect(typeof APP_CONFIG.urls.baseUrl).toBe('string')
    })
  })

  describe('BUSINESS_CONSTANTS', () => {
    it('should have add-on prices', () => {
      expect(BUSINESS_CONSTANTS.addOnPrices).toBeDefined()
      expect(BUSINESS_CONSTANTS.addOnPrices.solution).toBe(25)
      expect(BUSINESS_CONSTANTS.addOnPrices.drops).toBe(15)
      expect(BUSINESS_CONSTANTS.addOnPrices.case).toBe(10)
      expect(BUSINESS_CONSTANTS.addOnPrices.consultation).toBe(80)
    })

    it('should have plan base prices', () => {
      expect(BUSINESS_CONSTANTS.planBasePrices).toBeDefined()
      expect(BUSINESS_CONSTANTS.planBasePrices.mensal).toBe(89)
      expect(BUSINESS_CONSTANTS.planBasePrices.trimestral).toBe(79)
      expect(BUSINESS_CONSTANTS.planBasePrices.semestral).toBe(69)
    })

    it('should have positive prices', () => {
      Object.values(BUSINESS_CONSTANTS.addOnPrices).forEach(price => {
        expect(price).toBeGreaterThan(0)
      })

      Object.values(BUSINESS_CONSTANTS.planBasePrices).forEach(price => {
        expect(price).toBeGreaterThan(0)
      })
    })
  })
})
