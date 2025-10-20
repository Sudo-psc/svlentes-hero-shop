/**
 * Client Configuration Hook
 * Fetches and manages configuration data in client components
 */
import { useState, useEffect, useCallback } from 'react'
import { DEFAULT_CLIENT_CONFIG, type ServerConfigData } from './use-server-config'
interface UseConfigOptions {
  section?: string
  locale?: string
  fallbackOnError?: boolean
}
interface UseConfigReturn {
  config: ServerConfigData
  loading: boolean
  error: string | null
  refetch: () => Promise<void>
}
/**
 * Client-side hook to fetch configuration data
 * @param options - Configuration options
 * @returns Configuration data and loading state
 */
export function useConfig(options: UseConfigOptions = {}): UseConfigReturn {
  const { section, locale = 'pt-BR', fallbackOnError = true } = options
  const [config, setConfig] = useState<ServerConfigData>(DEFAULT_CLIENT_CONFIG)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const fetchConfig = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const params = new URLSearchParams({
        locale,
        ...(section && { section })
      })
      const response = await fetch(`/api/config?${params.toString()}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        cache: 'default'
      })
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }
      const result = await response.json()
      if (!result.success) {
        throw new Error(result.error || 'Failed to fetch configuration')
      }
      // Merge with default config to ensure all required fields exist
      const mergedConfig: ServerConfigData = {
        ...DEFAULT_CLIENT_CONFIG,
        ...result.data
      }
      setConfig(mergedConfig)
      // If fallback was used, log it
      if (result.fallback) {
        console.warn('Using fallback configuration due to server error')
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error'
      console.error('Failed to fetch configuration:', errorMessage)
      setError(errorMessage)
      if (fallbackOnError) {
        console.warn('Using default configuration due to error')
        setConfig(DEFAULT_CLIENT_CONFIG)
      }
    } finally {
      setLoading(false)
    }
  }, [section, locale, fallbackOnError])
  useEffect(() => {
    fetchConfig()
  }, [fetchConfig])
  return {
    config,
    loading,
    error,
    refetch: fetchConfig
  }
}
/**
 * Simple hook to get a specific configuration value
 * @param key - Configuration key (e.g., 'site.name', 'content.hero.title.line1')
 * @param defaultValue - Default value if key not found
 * @returns Configuration value
 */
export function useConfigValue<T = any>(key: string, defaultValue?: T): T {
  const { config } = useConfig()
  return getNestedValue(config, key) ?? defaultValue
}
/**
 * Helper function to get nested value from object using dot notation
 */
function getNestedValue(obj: any, path: string): any {
  return path.split('.').reduce((current, key) => {
    return current && current[key] !== undefined ? current[key] : undefined
  }, obj)
}
/**
 * Hook to get site configuration
 */
export function useSiteConfig() {
  const { config } = useConfig({ section: 'site' })
  return config.site
}
/**
 * Hook to get content configuration
 */
export function useContentConfig() {
  const { config } = useConfig({ section: 'content' })
  return config.content
}
/**
 * Hook to get contact configuration
 */
export function useContactConfig() {
  const { config } = useConfig({ section: 'contact' })
  return config.contact
}