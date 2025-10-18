/**
 * ConfigService - Serviço de Carregamento de Configuração Centralizada
 *
 * Versão: 1.0.0-mvp (Loader simplificado para Fase 1)
 * Fase: MVP - Menu
 *
 * NOTA: Este é um loader simplificado para MVP.
 * Features avançadas (hot-reload, deep merge, interpolação de env vars)
 * serão adicionadas nas Fases 2 e 3.
 */

import { readFileSync } from 'fs'
import { join } from 'path'
import * as yaml from 'js-yaml'
import { ConfigSchema, type AppConfig } from './schema'

class ConfigService {
  private static instance: ConfigService
  private config: AppConfig | null = null

  private constructor() {}

  static getInstance(): ConfigService {
    if (!ConfigService.instance) {
      ConfigService.instance = new ConfigService()
    }
    return ConfigService.instance
  }

  /**
   * Load and validate configuration
   * @param environment - 'development' | 'staging' | 'production'
   */
  load(environment: string = process.env.NODE_ENV || 'development'): AppConfig {
    if (this.config) {
      // Config já carregado, retornar cache
      return this.config
    }

    try {
      // 1. Load base config
      const basePath = join(process.cwd(), 'src', 'config', 'base.yaml')
      const baseContent = readFileSync(basePath, 'utf-8')
      const baseConfig = yaml.load(baseContent)

      // 2. Validate with Zod
      const validated = ConfigSchema.parse(baseConfig)

      this.config = validated

      if (typeof window === 'undefined') {
        // Server-side only (não logar no client)
        console.log(`[ConfigService] Config loaded successfully (env: ${environment})`)
      }

      return this.config
    } catch (error: any) {
      console.error('[ConfigService] Failed to load config:', error.message)

      if (error.issues) {
        // Zod validation errors
        console.error('[ConfigService] Validation errors:')
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
      throw new Error('Configuration not loaded. Call load() first.')
    }
    return this.config
  }

  /**
   * Get menu by locale and area
   */
  getMenu(locale: string, area: 'header' | 'footer'): any {
    const config = this.get()

    // Por enquanto, menus são language-agnostic (sem i18n)
    // Futuramente, podemos adicionar suporte para menus por locale
    return config.menus[area]
  }

  /**
   * Check if feature flag is enabled
   */
  isFeatureEnabled(flag: keyof AppConfig['featureFlags']): boolean {
    const config = this.get()
    return config.featureFlags[flag] ?? false
  }
}

export const config = ConfigService.getInstance()
