export const APP_CONFIG = {
  whatsapp: {
    number: process.env.NEXT_PUBLIC_WHATSAPP_CHATBOT || process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || '5533999898026',
    businessNumber: process.env.WHATSAPP_BUSINESS_NUMBER || '5533999898026',
    chatbot: process.env.NEXT_PUBLIC_WHATSAPP_CHATBOT || '5533999898026',
    support: process.env.NEXT_PUBLIC_SUPPORT_PHONE || '5533986061427',
  },
  asaas: {
    environment: (process.env.ASAAS_ENV as 'sandbox' | 'production') || 'sandbox',
    apiKeySandbox: process.env.ASAAS_API_KEY_SANDBOX,
    apiKeyProduction: process.env.ASAAS_API_KEY_PROD,
  },
  urls: {
    baseUrl: process.env.NEXT_PUBLIC_BASE_URL || 'https://svlentes.com.br',
    stripeBillingPortal: process.env.NEXT_PUBLIC_STRIPE_BILLING_PORTAL_URL || 'https://billing.stripe.com/p/login/test00000000000000000',
  },
} as const

/**
 * Stripe billing portal URL
 * Centralized constant for managing customer subscriptions
 * @deprecated Use STRIPE_BILLING_PORTAL_URL instead
 */
export const STRIPE_BILLING_PORTAL_URL = APP_CONFIG.urls.stripeBillingPortal
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