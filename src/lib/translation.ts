/**
 * Translation Utility - i18n Support
 *
 * Versão: 1.0.0-fase2 (Client-Side Safe)
 * Fase: MVP - Copy/Content (i18n)
 *
 * FIXME: Centralized config disabled - always returns key
 * TODO: Implement client-safe translation loading (API route or build-time generation)
 */
type LocaleCode = 'pt-BR' | 'en-US'
/**
 * Get translation for a given key and locale
 *
 * @param key - Dot-notation path to translation (e.g., 'hero.title.line1')
 * @param locale - Locale code (default: pt-BR)
 * @returns Translated string or key if not found
 */
export function getTranslation(key: string, locale: LocaleCode = 'pt-BR'): string {
  // FIXME: Config service disabled on client - return key as fallback
  // Centralized config requires Node.js fs which doesn't work in browser
  return key
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
  // FIXME: Config service disabled - always return false
  return false
}