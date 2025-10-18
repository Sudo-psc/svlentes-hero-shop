/**
 * Script de Validação de Configuração - SV Lentes
 *
 * Este é um EXEMPLO de como implementar a validação de config.
 * Copie para scripts/validate-config.ts quando implementar o plano.
 *
 * Uso:
 *   npx ts-node scripts/validate-config.ts
 *   npm run config:validate (adicionar ao package.json)
 *
 * Adicionar ao package.json:
 * {
 *   "scripts": {
 *     "config:validate": "ts-node scripts/validate-config.ts",
 *     "prebuild": "npm run config:validate"
 *   }
 * }
 */

// ⚠️ NOTA: Este arquivo é um EXEMPLO
// Ele não funcionará até que você implemente:
// - config/schema.ts
// - config/loader.ts
// - config/base.yaml

/* EXEMPLO DE IMPLEMENTAÇÃO:

import { config } from '../config/loader'
import { ConfigSchema } from '../config/schema'
import chalk from 'chalk' // opcional: npm install chalk

interface ValidationResult {
  valid: boolean
  errors: string[]
  warnings: string[]
  stats: {
    locales: string[]
    plansCount: number
    pagesWithSeo: number
    featureFlagsCount: number
    configHash: string
  }
}

async function validateConfig(): Promise<ValidationResult> {
  const result: ValidationResult = {
    valid: true,
    errors: [],
    warnings: [],
    stats: {
      locales: [],
      plansCount: 0,
      pagesWithSeo: 0,
      featureFlagsCount: 0,
      configHash: '',
    },
  }

  try {
    console.log('🔍 Validating configuration...\n')

    // 1. Load config
    console.log('📂 Loading config...')
    const cfg = config.load(process.env.NODE_ENV || 'production', false)

    // 2. Validate with Zod
    console.log('✓ Schema validation passed')

    // 3. Collect stats
    result.stats.locales = cfg.i18n.locales
    result.stats.plansCount = cfg.plans.plans.length
    result.stats.pagesWithSeo = Object.keys(cfg.seo.pages).length
    result.stats.featureFlagsCount = Object.keys(cfg.featureFlags).length
    result.stats.configHash = config.getHash()

    // 4. Business logic validations
    console.log('\n🔍 Running business logic validations...\n')

    // 4.1. WhatsApp number format
    const whatsapp = cfg.doctor.contact.whatsapp
    if (!whatsapp.match(/^\+\d{13}$/)) {
      result.errors.push(`Invalid WhatsApp format: ${whatsapp} (expected: +5533999898026)`)
      result.valid = false
    } else {
      console.log('✓ WhatsApp number format valid')
    }

    // 4.2. SEO description length
    const seoPages = Object.entries(cfg.seo.pages)
    for (const [page, seo] of seoPages) {
      if (seo.description.length < 50) {
        result.warnings.push(`SEO description for ${page} is too short: ${seo.description.length} chars (min: 50)`)
      } else if (seo.description.length > 160) {
        result.errors.push(`SEO description for ${page} is too long: ${seo.description.length} chars (max: 160)`)
        result.valid = false
      } else {
        console.log(`✓ SEO description for ${page} is valid (${seo.description.length} chars)`)
      }
    }

    // 4.3. Plan annual discount calculation
    cfg.plans.plans.forEach(plan => {
      const monthlyTotal = plan.price.monthly * 12
      const annualPrice = plan.price.annual

      if (annualPrice >= monthlyTotal) {
        result.warnings.push(`Plan ${plan.id}: annual price (${annualPrice}) is not discounted vs. monthly (${monthlyTotal})`)
      } else {
        const discount = ((monthlyTotal - annualPrice) / monthlyTotal * 100).toFixed(1)
        console.log(`✓ Plan ${plan.id}: annual discount is ${discount}%`)
      }
    })

    // 4.4. Required i18n keys
    const requiredKeys = [
      'hero.title',
      'hero.subtitle',
      'hero.cta',
      'common.cta.primary',
      'common.cta.secondary',
    ]

    requiredKeys.forEach(key => {
      try {
        const value = config.t(cfg.i18n.defaultLocale, key, 'strict')
        if (!value) {
          result.errors.push(`Missing i18n key: ${key}`)
          result.valid = false
        }
      } catch (e) {
        result.errors.push(`Missing i18n key: ${key}`)
        result.valid = false
      }
    })
    console.log(`✓ All required i18n keys present (${requiredKeys.length} checked)`)

    // 4.5. Theme tokens completeness
    const requiredColorScales = ['primary', 'secondary', 'success', 'warning', 'whatsapp']
    const requiredShades = [50, 100, 200, 300, 400, 500, 600, 700, 800, 900]

    requiredColorScales.forEach(colorName => {
      const colorScale = (cfg.theme.tokens.colors as any)[colorName]
      if (!colorScale) {
        result.errors.push(`Missing color scale: ${colorName}`)
        result.valid = false
        return
      }

      requiredShades.forEach(shade => {
        if (!colorScale[shade]) {
          result.errors.push(`Missing shade ${shade} for color ${colorName}`)
          result.valid = false
        }
      })
    })
    console.log(`✓ Theme tokens complete (${requiredColorScales.length} color scales)`)

  } catch (error: any) {
    result.valid = false
    result.errors.push(`Configuration validation failed: ${error.message}`)

    if (error.issues) {
      // Zod validation errors
      error.issues.forEach((issue: any) => {
        result.errors.push(`  - ${issue.path.join('.')}: ${issue.message}`)
      })
    }
  }

  return result
}

// Main execution
async function main() {
  const result = await validateConfig()

  // Print results
  console.log('\n' + '='.repeat(60))
  console.log('📊 Configuration Validation Results')
  console.log('='.repeat(60) + '\n')

  if (result.valid) {
    console.log('✅ Configuration is VALID\n')
  } else {
    console.log('❌ Configuration is INVALID\n')
  }

  // Stats
  console.log('📈 Stats:')
  console.log(`   - Locales: ${result.stats.locales.join(', ')}`)
  console.log(`   - Plans: ${result.stats.plansCount}`)
  console.log(`   - Pages with SEO: ${result.stats.pagesWithSeo}`)
  console.log(`   - Feature flags: ${result.stats.featureFlagsCount}`)
  console.log(`   - Config hash: ${result.stats.configHash}\n`)

  // Errors
  if (result.errors.length > 0) {
    console.log('❌ Errors:')
    result.errors.forEach(err => console.log(`   - ${err}`))
    console.log('')
  }

  // Warnings
  if (result.warnings.length > 0) {
    console.log('⚠️  Warnings:')
    result.warnings.forEach(warn => console.log(`   - ${warn}`))
    console.log('')
  }

  console.log('='.repeat(60))

  // Exit with appropriate code
  process.exit(result.valid ? 0 : 1)
}

main()

*/

// Mensagem de orientação para desenvolvedores
console.log(`
╔════════════════════════════════════════════════════════════════════════╗
║                                                                        ║
║  📋 Script de Validação de Configuração - EXEMPLO                      ║
║                                                                        ║
║  Este arquivo é um EXEMPLO de implementação.                           ║
║                                                                        ║
║  Para usar:                                                            ║
║  1. Implementar o plano de centralização de configuração              ║
║  2. Criar config/schema.ts, config/loader.ts, config/base.yaml        ║
║  3. Descomentar o código acima                                        ║
║  4. Renomear para scripts/validate-config.ts                          ║
║  5. Adicionar script ao package.json:                                  ║
║     "config:validate": "ts-node scripts/validate-config.ts"           ║
║                                                                        ║
║  Documentação completa:                                                ║
║  - claudedocs/INDICE_CENTRALIZACAO_CONFIG.md                          ║
║  - claudedocs/CENTRALIZACAO_CONFIG_GUIA_RAPIDO.md                     ║
║                                                                        ║
╚════════════════════════════════════════════════════════════════════════╝
`)

export {}
