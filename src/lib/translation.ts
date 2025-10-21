/**
 * Translation Utility - i18n Support
 *
 * Versão: 2.0.0 (Client-Side Ready)
 * Fase: Production - Copy/Content (i18n)
 *
 * Now uses API-based configuration for client-side translation loading
 */

import { useState, useEffect, useMemo } from 'react'
import { DEFAULT_CLIENT_CONFIG } from './use-server-config'

type LocaleCode = 'pt-BR' | 'en-US'

// Cache translations in memory
const translationsCache: Record<string, Record<string, string>> = {}
let translationsPromise: Promise<Record<string, string>> | null = null

/**
 * Fetch translations from API
 */
async function fetchTranslations(locale: LocaleCode = 'pt-BR'): Promise<Record<string, string>> {
  // Return cached translations if available
  if (translationsCache[locale]) {
    return translationsCache[locale]
  }

  // Return existing promise if request is in progress
  if (translationsPromise) {
    return translationsPromise
  }

  // Create new request promise
  translationsPromise = (async () => {
    try {
      const response = await fetch(`/api/config?locale=${locale}&section=i18n`)

      if (!response.ok) {
        throw new Error(`Failed to fetch translations: ${response.status}`)
      }

      const result = await response.json()

      if (!result.success) {
        throw new Error('Translation API returned error')
      }

      const translations = result.data.i18n?.translations || {}
      translationsCache[locale] = translations
      return translations
    } catch (error) {
      console.warn('Failed to fetch translations, using defaults:', error)

      // Return default translations based on content
      const defaultTranslations = getDefaultTranslations(locale)
      translationsCache[locale] = defaultTranslations
      return defaultTranslations
    } finally {
      translationsPromise = null
    }
  })()

  return translationsPromise
}

/**
 * Get default translations from content
 */
function getDefaultTranslations(locale: LocaleCode = 'pt-BR'): Record<string, string> {
  const content = DEFAULT_CLIENT_CONFIG.content

  if (locale === 'pt-BR') {
    return {
      'hero.title.line1': content.hero?.title?.line1 || 'Assinatura com acompanhamento médico especializado.',
      'hero.title.line2': content.hero?.title?.line2 || 'Nunca mais fique sem lentes',
      'hero.title.line3': content.hero?.title?.line3 || 'Receba no conforto da sua casa',
      'hero.subtitle': content.hero?.subtitle || 'Lentes de contato de qualidade com entrega mensal e suporte dedicado.',
      'hero.cta.primary': content.hero?.cta?.primary || 'Agendar consulta com oftalmologista',
      'hero.cta.secondary': content.hero?.cta?.secondary || 'Calculadora de Economia',
      'footer.about': 'Sobre',
      'footer.contact': 'Contato',
      'footer.legal': 'Legal',
      'footer.privacy': 'Política de Privacidade',
      'footer.terms': 'Termos de Uso',
      'footer.rights': 'Todos os direitos reservados',
      'loading': 'Carregando...',
      'error.required': 'Este campo é obrigatório',
      'error.email': 'Email inválido',
      'error.phone': 'Telefone inválido (formato: (XX) 9XXXX-XXXX)',
      'success.message': 'Mensagem enviada com sucesso!',
      'button.send': 'Enviar',
      'button.cancel': 'Cancelar'
    }
  }

  // English translations
  return {
    'hero.title.line1': 'Subscription with specialized medical follow-up.',
    'hero.title.line2': 'Never run out of lenses again',
    'hero.title.line3': 'Receive in the comfort of your home',
    'hero.subtitle': 'Quality contact lenses with monthly delivery and dedicated support.',
    'hero.cta.primary': 'Schedule appointment with ophthalmologist',
    'hero.cta.secondary': 'Savings Calculator',
    'footer.about': 'About',
    'footer.contact': 'Contact',
    'footer.legal': 'Legal',
    'footer.privacy': 'Privacy Policy',
    'footer.terms': 'Terms of Use',
    'footer.rights': 'All rights reserved',
    'loading': 'Loading...',
    'error.required': 'This field is required',
    'error.email': 'Invalid email',
    'error.phone': 'Invalid phone number',
    'success.message': 'Message sent successfully!',
    'button.send': 'Send',
    'button.cancel': 'Cancel'
  }
}

/**
 * Get translation for a given key and locale
 *
 * @param key - Dot-notation path to translation (e.g., 'hero.title.line1')
 * @param locale - Locale code (default: pt-BR)
 * @returns Translated string or key if not found
 */
export async function getTranslation(key: string, locale: LocaleCode = 'pt-BR'): Promise<string> {
  const translations = await fetchTranslations(locale)
  return translations[key] || key
}

/**
 * React hook for translations
 *
 * @param locale - Locale code (default: pt-BR)
 * @returns Translation function (key) => string
 *
 * @example
 * const t = useTranslation()
 * <h1>{t('hero.title.line1')}</h1>
 */
export function useTranslation(locale: LocaleCode = 'pt-BR') {
  const [translations, setTranslations] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let mounted = true

    const loadTranslations = async () => {
      try {
        const result = await fetchTranslations(locale)
        if (mounted) {
          setTranslations(result)
          setLoading(false)
        }
      } catch (error) {
        console.error('Failed to load translations:', error)
        if (mounted) {
          const fallback = getDefaultTranslations(locale)
          setTranslations(fallback)
          setLoading(false)
        }
      }
    }

    loadTranslations()

    return () => {
      mounted = false
    }
  }, [locale])

  const translate = useMemo(() => {
    return (key: string): string => {
      return translations[key] || key
    }
  }, [translations])

  return { t: translate, loading, hasTranslation: (key: string) => !!translations[key] }
}

/**
 * Get multiple translations at once
 *
 * @param keys - Array of translation keys
 * @param locale - Locale code (default: pt-BR)
 * @returns Promise with object with keys mapped to translations
 *
 * @example
 * const { title, subtitle } = await getTranslations(['hero.title.line1', 'hero.subtitle'])
 */
export async function getTranslations(
  keys: string[],
  locale: LocaleCode = 'pt-BR'
): Promise<Record<string, string>> {
  const translations = await fetchTranslations(locale)
  return keys.reduce((acc, key) => {
    acc[key] = translations[key] || key
    return acc
  }, {} as Record<string, string>)
}

/**
 * Check if translation key exists
 *
 * @param key - Translation key to check
 * @param locale - Locale code (default: pt-BR)
 * @returns Promise with true if key exists, false otherwise
 */
export async function hasTranslation(key: string, locale: LocaleCode = 'pt-BR'): Promise<boolean> {
  const translations = await fetchTranslations(locale)
  return !!translations[key]
}