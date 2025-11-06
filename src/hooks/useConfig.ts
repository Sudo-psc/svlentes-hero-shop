/**
 * React Hook for Configuration Loading
 *
 * Provides reactive configuration loading with:
 * - Loading states
 * - Error handling
 * - Automatic retries
 * - Cache management
 * - Component integration
 */

import { useState, useEffect, useCallback, useRef } from 'react'
import { configLoader, ConfigData, LoadConfigOptions } from '@/lib/resilient-config-loader'

interface UseConfigReturn {
  config: ConfigData | null
  loading: boolean
  error: string | null
  refetch: (options?: LoadConfigOptions) => Promise<ConfigData>
  clearCache: () => void
  healthCheck: () => Promise<boolean>
}

/**
 * Main hook for configuration loading
 */
export function useConfig(options: LoadConfigOptions = {}): UseConfigReturn {
  const [config, setConfig] = useState<ConfigData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const mountedRef = useRef(true)

  const {
    section = null,
    locale = 'pt-BR',
    retries = 3,
    timeout = 10000,
    useCache = true
  } = options

  const loadConfig = useCallback(async (overrideOptions?: LoadConfigOptions) => {
    if (!mountedRef.current) return

    const finalOptions = { section, locale, retries, timeout, useCache, ...overrideOptions }
    setLoading(true)
    setError(null)

    try {
      const data = await configLoader.loadConfig(finalOptions)
      if (mountedRef.current) {
        setConfig(data)
        setError(null)
      }
      return data
    } catch (err) {
      if (mountedRef.current) {
        setError(err instanceof Error ? err.message : 'Unknown error')
      }
      throw err
    } finally {
      if (mountedRef.current) {
        setLoading(false)
      }
    }
  }, [section, locale, retries, timeout, useCache])

  // Initial load
  useEffect(() => {
    loadConfig()

    return () => {
      mountedRef.current = false
    }
  }, [loadConfig])

  const refetch = useCallback(async (overrideOptions?: LoadConfigOptions) => {
    return loadConfig({ ...options, ...overrideOptions })
  }, [loadConfig, options])

  const clearCache = useCallback(() => {
    configLoader.clearCache()
    setConfig(null)
    setError(null)
  }, [])

  const healthCheck = useCallback(async (): Promise<boolean> => {
    try {
      const result = await configLoader.healthCheck()
      return result.healthy
    } catch {
      return false
    }
  }, [])

  return {
    config,
    loading,
    error,
    refetch,
    clearCache,
    healthCheck
  }
}

/**
 * Hook for specific configuration sections
 */
export function useConfigSection(
  section: string,
  locale = 'pt-BR'
): UseConfigReturn {
  return useConfig({ section, locale })
}

/**
 * Hook for i18n translations
 */
export function useI18n(locale = 'pt-BR') {
  const { config, loading, error, refetch } = useConfigSection('i18n', locale)

  const translations = config?.i18n?.translations || {}

  const t = useCallback((key: string, fallback?: string): string => {
    return translations[key] || fallback || key
  }, [translations])

  return {
    translations,
    t,
    loading,
    error,
    refetch
  }
}

/**
 * Hook for site configuration
 */
export function useSiteConfig(locale = 'pt-BR') {
  return useConfigSection('site', locale)
}

/**
 * Hook for content configuration
 */
export function useContentConfig(locale = 'pt-BR') {
  return useConfigSection('content', locale)
}

export default useConfig