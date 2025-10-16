export const APP_CONFIG = {
  whatsapp: {
    number: process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || '5511947038078',
    businessNumber: process.env.WHATSAPP_BUSINESS_NUMBER || '5511947038078',
  },
  asaas: {
    environment: (process.env.ASAAS_ENV as 'sandbox' | 'production') || 'sandbox',
    apiKeySandbox: process.env.ASAAS_API_KEY_SANDBOX,
    apiKeyProduction: process.env.ASAAS_API_KEY_PROD,
  },
  urls: {
    baseUrl: process.env.NEXT_PUBLIC_BASE_URL || 'https://svlentes.com.br',
  },
} as const

export const BUSINESS_CONSTANTS = {
  addOnPrices: {
    solution: 25,
    drops: 15,
    case: 10,
    consultation: 80,
  },
  planBasePrices: {
    mensal: 89,
    trimestral: 79,
    semestral: 69,
  },
} as const
