/**
 * Resilient Configuration Loader
 *
 * Provides robust configuration loading with:
 * - Exponential backoff retry
 * - Circuit breaker pattern
 * - Local storage caching
 * - Graceful degradation
 * - Error logging
 */

export interface ConfigData {
  site?: any
  content?: any
  contact?: any
  i18n?: any
}

export interface LoadConfigOptions {
  section?: string
  locale?: string
  retries?: number
  timeout?: number
  useCache?: boolean
}

export interface CircuitBreakerState {
  failures: number
  lastFailure: number
  timeout: number
  isOpen: boolean
}

class ResilientConfigLoader {
  private cache = new Map<string, { data: any; timestamp: number; ttl: number }>()
  private circuitBreaker: CircuitBreakerState = {
    failures: 0,
    lastFailure: 0,
    timeout: 30000, // 30 seconds
    isOpen: false
  }

  private readonly DEFAULT_CACHE_TTL = 600000 // 10 minutes
  private readonly MAX_RETRIES = 3
  private readonly BASE_TIMEOUT = 10000 // 10 seconds

  /**
   * Load configuration with retry logic and circuit breaker
   */
  async loadConfig(options: LoadConfigOptions = {}): Promise<ConfigData> {
    const {
      section = null,
      locale = 'pt-BR',
      retries = this.MAX_RETRIES,
      timeout = this.BASE_TIMEOUT,
      useCache = true
    } = options

    const url = this.buildConfigUrl(section, locale)
    const cacheKey = this.getCacheKey(url, section, locale)

    // Check cache first
    if (useCache) {
      const cached = this.getCachedData(cacheKey)
      if (cached) {
        console.log(`[CONFIG] Cache hit for ${section ? section : 'full'} config`)
        return cached
      }
    }

    // Circuit breaker check
    if (this.isCircuitBreakerOpen()) {
      console.warn(`[CONFIG] Circuit breaker open, using fallback for ${section || 'full'} config`)
      return this.getFallbackConfig(section)
    }

    // Fetch with retry
    try {
      const data = await this.fetchWithRetry(url, retries, timeout)
      this.setCachedData(cacheKey, data)
      this.resetCircuitBreaker()

      console.log(`[CONFIG] Successfully loaded ${section ? section : 'full'} config`)
      return data

    } catch (error) {
      this.recordCircuitBreakerFailure()
      console.error(`[CONFIG] Failed to load config after ${retries} attempts:`, error)

      // Return fallback instead of throwing
      return this.getFallbackConfig(section)
    }
  }

  /**
   * Fetch with exponential backoff retry
   */
  private async fetchWithRetry(url: string, maxRetries: number, timeout: number): Promise<ConfigData> {
    let lastError: Error

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        console.log(`[CONFIG] Attempt ${attempt}/${maxRetries}: ${url}`)

        const controller = new AbortController()
        const timeoutId = setTimeout(() => controller.abort(), timeout)

        const response = await fetch(url, {
          headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json',
            'Cache-Control': 'no-cache',
            'X-Request-ID': this.generateRequestId(),
          },
          signal: controller.signal
        })

        clearTimeout(timeoutId)

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`)
        }

        const result = await response.json()

        // Validate response structure
        if (!result.success) {
          throw new Error(result.error || 'Invalid response format')
        }

        return result.data

      } catch (error) {
        lastError = error as Error
        console.error(`[CONFIG] Attempt ${attempt} failed:`, error.message)

        // Don't retry on client errors (4xx)
        if (error.message.includes('HTTP 4')) {
          throw error
        }

        // If not the last attempt, wait with exponential backoff
        if (attempt < maxRetries) {
          const delay = Math.min(1000 * Math.pow(2, attempt - 1), 5000) // Max 5 seconds
          console.log(`[CONFIG] Retrying in ${delay}ms...`)
          await this.sleep(delay)
        }
      }
    }

    throw lastError!
  }

  /**
   * Circuit breaker management
   */
  private isCircuitBreakerOpen(): boolean {
    const now = Date.now()
    const timeSinceLastFailure = now - this.circuitBreaker.lastFailure

    if (this.circuitBreaker.failures >= 3 && timeSinceLastFailure < this.circuitBreaker.timeout) {
      return true
    }

    if (timeSinceLastFailure > this.circuitBreaker.timeout && this.circuitBreaker.isOpen) {
      this.resetCircuitBreaker()
    }

    return false
  }

  private recordCircuitBreakerFailure(): void {
    this.circuitBreaker.failures++
    this.circuitBreaker.lastFailure = Date.now()
    this.circuitBreaker.isOpen = this.circuitBreaker.failures >= 3
  }

  private resetCircuitBreaker(): void {
    this.circuitBreaker.failures = 0
    this.circuitBreaker.isOpen = false
    this.circuitBreaker.lastFailure = 0
  }

  /**
   * Cache management
   */
  private getCachedData(key: string): ConfigData | null {
    const cached = this.cache.get(key)
    if (!cached) return null

    const isExpired = Date.now() - cached.timestamp > cached.ttl
    if (isExpired) {
      this.cache.delete(key)
      return null
    }

    return cached.data
  }

  private setCachedData(key: string, data: ConfigData): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl: this.DEFAULT_CACHE_TTL
    })

    // Limit cache size
    if (this.cache.size > 50) {
      const firstKey = this.cache.keys().next().value
      if (firstKey) {
        this.cache.delete(firstKey)
      }
    }
  }

  private getCacheKey(url: string, section?: string, locale?: string): string {
    return `${url}:${section || 'full'}:${locale || 'pt-BR'}`
  }

  /**
   * URL helpers
   */
  private buildConfigUrl(section?: string | null, locale?: string): string {
    const baseUrl = window.location.origin
    const url = new URL('/api/config', baseUrl)

    if (section) url.searchParams.set('section', section)
    if (locale) url.searchParams.set('locale', locale)

    return url.toString()
  }

  /**
   * Fallback configuration
   */
  private getFallbackConfig(section?: string | null): ConfigData {
    const fallback: ConfigData = {
      site: {
        name: 'SV Lentes',
        shortName: 'SVLentes',
        tagline: 'Pioneiro no Brasil em Assinatura de Lentes de Contato',
        description: 'Assinatura de lentes de contato com acompanhamento médico especializado.',
        url: 'https://svlentes.com.br'
      },
      content: {
        hero: {
          title: {
            line1: 'Assinatura com acompanhamento médico especializado.',
            line2: 'Nunca mais fique sem lentes',
            line3: 'Receba no conforto da sua casa'
          },
          subtitle: 'Lentes de contato de qualidade com entrega mensal e suporte dedicado.',
          cta: {
            primary: 'Agendar consulta com oftalmologista',
            secondary: 'Calculadora de Economia'
          }
        }
      },
      contact: {
        phone: '(33) 99989-8026',
        email: 'saraivavision@gmail.com',
        whatsapp: 'https://wa.me/5533999898026'
      },
      i18n: {
        translations: {
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
          'button.cancel': 'Cancelar',
          'hero.title.line1': 'Assinatura com acompanhamento médico especializado.',
          'hero.title.line2': 'Nunca mais fique sem lentes',
          'hero.title.line3': 'Receba no conforto da sua casa',
          'hero.subtitle': 'Lentes de contato de qualidade com entrega mensal e suporte dedicado.',
          'hero.cta.primary': 'Agendar consulta com oftalmologista',
          'hero.cta.secondary': 'Calculadora de Economia'
        }
      }
    }

    if (section && fallback[section as keyof ConfigData]) {
      return { [section]: fallback[section as keyof ConfigData] }
    }

    return fallback
  }

  /**
   * Utility functions
   */
  private generateRequestId(): string {
    return `req_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms))
  }

  /**
   * Cache management methods
   */
  clearCache(): void {
    this.cache.clear()
    console.log('[CONFIG] Cache cleared')
  }

  getCacheStats(): { size: number; entries: string[] } {
    return {
      size: this.cache.size,
      entries: Array.from(this.cache.keys())
    }
  }

  getCircuitBreakerStats(): CircuitBreakerState {
    return { ...this.circuitBreaker }
  }

  /**
   * Health check method
   */
  async healthCheck(): Promise<{ healthy: boolean; stats: any }> {
    try {
      const data = await this.loadConfig({ retries: 1, timeout: 5000 })
      return {
        healthy: true,
        stats: {
          cacheSize: this.cache.size,
          circuitBreaker: this.getCircuitBreakerStats(),
          lastConfigLoad: new Date().toISOString()
        }
      }
    } catch (error) {
      return {
        healthy: false,
        stats: {
          error: error.message,
          circuitBreaker: this.getCircuitBreakerStats()
        }
      }
    }
  }
}

// Singleton instance
export const configLoader = new ResilientConfigLoader()

export default configLoader