/**
 * Enhanced ConfigService with Advanced Error Recovery
 *
 * Versão: 2.0.0 - Production-ready with error recovery
 *
 * Features:
 * - Circuit breaker pattern for fault tolerance
 * - Retry logic with exponential backoff
 * - Health monitoring and metrics
 * - Graceful degradation
 */
import { readFileSync } from 'fs'
import { join } from 'path'
import * as yaml from 'js-yaml'
import { ConfigSchema, type AppConfig } from './schema'
import { errorRecovery, type HealthMetrics } from './error-recovery'
class EnhancedConfigService {
  private static instance: EnhancedConfigService
  private config: AppConfig | null = null
  private loadAttempts = 0
  private lastLoadTime: Date | null = null
  private constructor() {}
  static getInstance(): EnhancedConfigService {
    if (!EnhancedConfigService.instance) {
      EnhancedConfigService.instance = new EnhancedConfigService()
    }
    return EnhancedConfigService.instance
  }
  /**
   * Load configuration with advanced error recovery
   */
  async loadWithRecovery(environment: string = process.env.NODE_ENV || 'development'): Promise<AppConfig> {
    // Guard: only run on server-side
    if (typeof window !== 'undefined') {
      throw new Error(
        'EnhancedConfigService.loadWithRecovery() can only be called on the server. ' +
        'Use getServerSideConfig() in server components or API routes.'
      )
    }
    // Return cached config if available
    if (this.config) {
      return this.config
    }
    // Execute with error recovery (circuit breaker + retry logic)
    const result = await errorRecovery.executeWithRecovery(
      () => this.loadConfigInternal(environment),
      'ConfigService.loadWithRecovery'
    )
    return result
  }
  /**
   * Internal config loading logic
   */
  private async loadConfigInternal(environment: string): Promise<AppConfig> {
    this.loadAttempts++
    try {
      // Simulate async operation (file read wrapped in Promise)
      const config = await this.performAsyncLoad(environment)
      this.config = config
      this.lastLoadTime = new Date()
      console.log(
        `[EnhancedConfigService] Config loaded successfully (env: ${environment}, ` +
        `attempts: ${this.loadAttempts}, health: ${errorRecovery.getHealthStatus()})`
      )
      return config
    } catch (error: any) {
      console.error('[EnhancedConfigService] Failed to load config:', error.message)
      if (error.issues) {
        // Zod validation errors
        console.error('[EnhancedConfigService] Validation errors:')
        error.issues.forEach((issue: any) => {
          console.error(`  - ${issue.path.join('.')}: ${issue.message}`)
        })
      }
      throw new Error(`Configuration validation failed: ${error.message}`)
    }
  }
  /**
   * Perform async config load (wraps sync file operations)
   */
  private async performAsyncLoad(environment: string): Promise<AppConfig> {
    return new Promise((resolve, reject) => {
      try {
        // 1. Load base config
        const basePath = join(process.cwd(), 'src', 'config', 'base.yaml')
        const baseContent = readFileSync(basePath, 'utf-8')
        const baseConfig = yaml.load(baseContent)
        // 2. Validate with Zod
        const validated = ConfigSchema.parse(baseConfig)
        resolve(validated)
      } catch (error) {
        reject(error)
      }
    })
  }
  /**
   * Synchronous load (backward compatible)
   */
  load(environment: string = process.env.NODE_ENV || 'development'): AppConfig {
    // Guard: only run on server-side
    if (typeof window !== 'undefined') {
      throw new Error(
        'EnhancedConfigService.load() can only be called on the server. ' +
        'Use getServerSideConfig() in server components or API routes.'
      )
    }
    if (this.config) {
      return this.config
    }
    try {
      this.loadAttempts++
      // 1. Load base config
      const basePath = join(process.cwd(), 'src', 'config', 'base.yaml')
      const baseContent = readFileSync(basePath, 'utf-8')
      const baseConfig = yaml.load(baseContent)
      // 2. Validate with Zod
      const validated = ConfigSchema.parse(baseConfig)
      this.config = validated
      this.lastLoadTime = new Date()
      console.log(
        `[EnhancedConfigService] Config loaded successfully (env: ${environment}, ` +
        `attempts: ${this.loadAttempts})`
      )
      return this.config
    } catch (error: any) {
      console.error('[EnhancedConfigService] Failed to load config:', error.message)
      if (error.issues) {
        // Zod validation errors
        console.error('[EnhancedConfigService] Validation errors:')
        error.issues.forEach((issue: any) => {
          console.error(`  - ${issue.path.join('.')}: ${issue.message}`)
        })
      }
      throw new Error(`Configuration validation failed: ${error.message}`)
    }
  }
  /**
   * Get current configuration
   */
  get(): AppConfig {
    if (!this.config) {
      throw new Error('Configuration not loaded. Call load() or loadWithRecovery() first.')
    }
    return this.config
  }
  /**
   * Get menu by locale and area
   */
  getMenu(locale: string, area: 'header' | 'footer'): any {
    const config = this.get()
    return config.menus[area]
  }
  /**
   * Check if feature flag is enabled
   */
  isFeatureEnabled(flag: keyof AppConfig['featureFlags']): boolean {
    const config = this.get()
    return config.featureFlags[flag] ?? false
  }
  /**
   * Get health metrics
   */
  getHealthMetrics(): HealthMetrics {
    return errorRecovery.getHealthMetrics()
  }
  /**
   * Get health status
   */
  getHealthStatus(): 'healthy' | 'degraded' | 'failed' {
    return errorRecovery.getHealthStatus()
  }
  /**
   * Check if config system is operational
   */
  isOperational(): boolean {
    return errorRecovery.isOperational()
  }
  /**
   * Get load statistics
   */
  getLoadStats(): {
    attempts: number
    lastLoadTime: Date | null
    isLoaded: boolean
    healthStatus: string
  } {
    return {
      attempts: this.loadAttempts,
      lastLoadTime: this.lastLoadTime,
      isLoaded: this.config !== null,
      healthStatus: this.getHealthStatus()
    }
  }
  /**
   * Force reload configuration
   */
  async reload(environment: string = process.env.NODE_ENV || 'development'): Promise<AppConfig> {
    this.config = null
    return this.loadWithRecovery(environment)
  }
  /**
   * Reset config service (for testing)
   */
  reset(): void {
    this.config = null
    this.loadAttempts = 0
    this.lastLoadTime = null
    errorRecovery.reset()
  }
}
export const enhancedConfig = EnhancedConfigService.getInstance()