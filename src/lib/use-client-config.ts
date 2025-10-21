/**
 * Client Configuration Hook
 *
 * Fetches configuration data from the API for client components
 * Provides cached configuration with fallback to defaults
 */

import { useState, useEffect, useMemo } from 'react'
import { DEFAULT_CLIENT_CONFIG, type ServerConfigData } from './use-server-config'

interface ClientConfigState {
  config: ServerConfigData | null
  loading: boolean
  error: string | null
}

// Cache configuration in memory to avoid repeated API calls
let configCache: ServerConfigData | null = null
let configPromise: Promise<ServerConfigData> | null = null

/**
 * Fetch configuration from API
 */
async function fetchConfig(): Promise<ServerConfigData> {
  // Return cached config if available
  if (configCache) {
    return configCache
  }

  // Return existing promise if request is in progress
  if (configPromise) {
    return configPromise
  }

  // Create new request promise
  configPromise = (async () => {
    try {
      const response = await fetch('/api/config?locale=pt-BR')

      if (!response.ok) {
        throw new Error(`Failed to fetch config: ${response.status}`)
      }

      const result = await response.json()

      if (!result.success) {
        throw new Error('Config API returned error')
      }

      configCache = result.data
      return result.data
    } catch (error) {
      console.warn('Failed to fetch config, using defaults:', error)
      return DEFAULT_CLIENT_CONFIG
    } finally {
      configPromise = null
    }
  })()

  return configPromise
}

/**
 * Hook to get client-side configuration
 * Automatically fetches config on mount and caches it
 */
export function useClientConfig(): ClientConfigState & { config: ServerConfigData } {
  const [state, setState] = useState<ClientConfigState>({
    config: null,
    loading: true,
    error: null
  })

  useEffect(() => {
    let mounted = true

    const loadConfig = async () => {
      try {
        const config = await fetchConfig()

        if (mounted) {
          setState({
            config,
            loading: false,
            error: null
          })
        }
      } catch (error) {
        if (mounted) {
          setState({
            config: DEFAULT_CLIENT_CONFIG,
            loading: false,
            error: error instanceof Error ? error.message : 'Failed to load configuration'
          })
        }
      }
    }

    loadConfig()

    return () => {
      mounted = false
    }
  }, [])

  // Always return a config object (fallback to defaults)
  return {
    ...state,
    config: state.config || DEFAULT_CLIENT_CONFIG
  }
}

/**
 * Hook to get specific configuration section
 */
export function useConfigSection<K extends keyof ServerConfigData>(
  section: K
): ServerConfigData[K] {
  const { config } = useClientConfig()
  return useMemo(() => config[section], [config, section])
}

/**
 * Hook to get site configuration
 */
export function useSiteConfig() {
  return useConfigSection('site')
}

/**
 * Hook to get contact configuration
 */
export function useContactConfig() {
  return useConfigSection('contact')
}

/**
 * Hook to get content configuration
 */
export function useContentConfig() {
  return useConfigSection('content')
}

/**
 * Hook to get i18n configuration
 */
export function useI18nConfig() {
  return useConfigSection('i18n')
}