/**
 * Server Configuration Hook for Client Components
 *
 * Provides access to centralized configuration data in client components
 * through server-side prop passing or API calls.
 */

import { useMemo } from 'react'
import { config } from '@/config/loader'

export interface ServerConfigData {
  site: {
    name: string
    shortName: string
    tagline: string
    description: string
    url: string
  }
  i18n: {
    defaultLocale: string
    locales: string[]
    fallback: string
  }
  content?: {
    hero?: {
      title?: {
        line1?: string
        line2?: string
        line3?: string
      }
      subtitle?: string
      cta?: {
        primary?: string
        secondary?: string
      }
    }
    pricing?: {
      plans?: Array<{
        name: string
        price: number
        description: string
        features: string[]
      }>
    }
  }
  contact?: {
    whatsapp?: string
    phone?: string
    email?: string
  }
}

/**
 * Hook to get server configuration data
 * This should be called in server components and the result passed to client components
 */
export function useServerConfig(): ServerConfigData {
  // This function should only be called on the server
  if (typeof window !== 'undefined') {
    throw new Error('useServerConfig() can only be called in server components')
  }

  const configData = config.get()

  return useMemo(() => ({
    site: configData.site,
    i18n: configData.i18n,
    content: configData.content || {},
    contact: configData.contact || {}
  }), [configData])
}

/**
 * Client-safe hook that receives server config as props
 * Use this in client components to access configuration data
 */
export function useClientConfig(serverConfig: ServerConfigData) {
  return useMemo(() => serverConfig, [serverConfig])
}

/**
 * Default configuration for client-side fallback
 */
export const DEFAULT_CLIENT_CONFIG: ServerConfigData = {
  site: {
    name: "SV Lentes",
    shortName: "SVLentes",
    tagline: "Pioneiro no Brasil em Assinatura de Lentes de Contato",
    description: "Assinatura de lentes de contato com acompanhamento médico especializado",
    url: "https://svlentes.com.br"
  },
  i18n: {
    defaultLocale: "pt-BR",
    locales: ["pt-BR"],
    fallback: "soft"
  },
  content: {
    hero: {
      title: {
        line1: "Assinatura com acompanhamento médico especializado.",
        line2: "Nunca mais fique sem lentes",
        line3: "Receba no conforto da sua casa"
      },
      subtitle: "Lentes de contato de qualidade com entrega mensal e suporte dedicado.",
      cta: {
        primary: "Agendar consulta com oftalmologista",
        secondary: "Calculadora de Economia"
      }
    },
    pricing: {
      plans: [
        {
          name: "Plano Express",
          price: 128.00,
          description: "Lentes mensais com entrega rápida",
          features: ["Lentes de alta qualidade", "Entrega mensal", "Suporte por WhatsApp"]
        },
        {
          name: "Plano VIP",
          price: 91.00,
          description: "Economize com nosso plano anual",
          features: ["Desconto especial", "Entrega prioritária", "Consultas inclusas"]
        }
      ]
    }
  },
  contact: {
    whatsapp: "5533999898026",
    phone: "5533986061427",
    email: "saraivavision@gmail.com"
  }
}