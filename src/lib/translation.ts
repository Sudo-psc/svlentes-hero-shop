/**
 * Translation Utility - i18n Support
 *
 * Versão: 1.0.0-fase2
 * Fase: MVP - Copy/Content (i18n)
 *
 * Provides type-safe translation function with fallback support
 */

import { config } from '@/config/loader'
import type { AppConfig } from '@/config/schema'

type LocaleCode = 'pt-BR' | 'en-US'

/**
 * Get nested property from object using dot notation
 * Example: get(obj, 'hero.title.line1')
 */
function getNestedValue(obj: any, path: string): any {
  return path.split('.').reduce((current, key) => current?.[key], obj)
}

/**
 * Get translation for a given key and locale
 *
 * @param key - Dot-notation path to translation (e.g., 'hero.title.line1')
 * @param locale - Locale code (default: pt-BR)
 * @returns Translated string or key if not found
 */
export function getTranslation(key: string, locale: LocaleCode = 'pt-BR'): string {
  try {
    const appConfig = config.load()
    const useCentralizedCopy = config.isFeatureEnabled('useCentralizedCopy')

    if (!useCentralizedCopy) {
      // Feature flag disabled - return key as fallback
      return key
    }

    const localeCopy = appConfig.copy[locale]
    if (!localeCopy) {
      console.warn(`[Translation] Locale not found: ${locale}`)
      return key
    }

    const value = getNestedValue(localeCopy, key)
    if (value === undefined || value === null) {
      console.warn(`[Translation] Key not found: ${key} for locale ${locale}`)
      return key
    }

    return value
  } catch (error) {
    console.error(`[Translation] Error getting translation for key ${key}:`, error)
    return key
  }
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
  return (key: string): string => getTranslation(key, locale)
}

/**
 * Get multiple translations at once
 *
 * @param keys - Array of translation keys
 * @param locale - Locale code (default: pt-BR)
 * @returns Object with keys mapped to translations
 *
 * @example
 * const { title, subtitle } = getTranslations(['hero.title.line1', 'hero.subtitle'])
 */
export function getTranslations(
  keys: string[],
  locale: LocaleCode = 'pt-BR'
): Record<string, string> {
  return keys.reduce((acc, key) => {
    acc[key] = getTranslation(key, locale)
    return acc
  }, {} as Record<string, string>)
}

/**
 * Check if translation key exists
 *
 * @param key - Translation key to check
 * @param locale - Locale code (default: pt-BR)
 * @returns true if key exists, false otherwise
 */
export function hasTranslation(key: string, locale: LocaleCode = 'pt-BR'): boolean {
  try {
    const appConfig = config.load()
    const localeCopy = appConfig.copy[locale]
    if (!localeCopy) return false

    const value = getNestedValue(localeCopy, key)
    return value !== undefined && value !== null
  } catch {
    return false
  }
}
