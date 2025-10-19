/**
 * Environment Variable Validation for SendPulse Integration
 * Validates required configuration on startup to fail fast
 */

import { ENV_VARS, ERROR_MESSAGES } from './constants'

export interface EnvValidationResult {
  valid: boolean
  errors: string[]
  warnings: string[]
  config: {
    appId: string | null
    appSecret: string | null
    botId: string | null
    webhookToken: string | null
    hasStaticToken: boolean
    hasOAuthCredentials: boolean
  }
}

/**
 * Validate SendPulse environment variables
 * Call this on application startup to ensure proper configuration
 */
export function validateSendPulseEnv(): EnvValidationResult {
  const errors: string[] = []
  const warnings: string[] = []

  // Check for required variables
  const appId = process.env.SENDPULSE_APP_ID
  const appSecret = process.env.SENDPULSE_APP_SECRET
  const botId = process.env.SENDPULSE_BOT_ID
  const webhookToken = process.env.SENDPULSE_WEBHOOK_TOKEN

  // Validate App ID and Secret
  if (!appId || appId.trim() === '') {
    errors.push('SENDPULSE_APP_ID is required but not configured')
  }

  if (!appSecret || appSecret.trim() === '') {
    errors.push('SENDPULSE_APP_SECRET is required but not configured')
  }

  // Validate Bot ID (required for production, warning for development)
  if (!botId || botId.trim() === '') {
    if (process.env.NODE_ENV === 'production') {
      errors.push('SENDPULSE_BOT_ID is required in production environment')
    } else {
      warnings.push('SENDPULSE_BOT_ID not configured. Will attempt auto-discovery from API.')
    }
  }

  // Validate Webhook Token
  if (!webhookToken || webhookToken.trim() === '') {
    errors.push('SENDPULSE_WEBHOOK_TOKEN is required but not configured')
  }

  // Check for optional static token (bypasses OAuth)
  const staticToken = process.env.SENDPULSE_API_TOKEN
  const hasStaticToken = !!(staticToken && staticToken.trim() !== '')

  if (hasStaticToken) {
    warnings.push('Using static SENDPULSE_API_TOKEN. OAuth credentials will be ignored.')
  }

  // Check for legacy OAuth credentials
  const legacyClientId = process.env.SENDPULSE_CLIENT_ID
  const legacyClientSecret = process.env.SENDPULSE_CLIENT_SECRET

  if (legacyClientId || legacyClientSecret) {
    warnings.push(
      'Legacy SENDPULSE_CLIENT_ID/CLIENT_SECRET detected. ' +
      'Use SENDPULSE_APP_ID/APP_SECRET instead.'
    )
  }

  // Validate credential format (basic checks)
  if (appId && appId.length < 10) {
    warnings.push('SENDPULSE_APP_ID seems too short. Verify it is correct.')
  }

  if (appSecret && appSecret.length < 20) {
    warnings.push('SENDPULSE_APP_SECRET seems too short. Verify it is correct.')
  }

  if (webhookToken && webhookToken.length < 16) {
    warnings.push('SENDPULSE_WEBHOOK_TOKEN seems too short. Use a strong random token.')
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
    config: {
      appId: appId || null,
      appSecret: appSecret ? '[REDACTED]' : null,
      botId: botId || null,
      webhookToken: webhookToken ? '[REDACTED]' : null,
      hasStaticToken,
      hasOAuthCredentials: !!(appId && appSecret),
    },
  }
}

/**
 * Validate and throw if configuration is invalid
 * Use this to fail fast on startup
 */
export function requireValidSendPulseEnv(): void {
  const result = validateSendPulseEnv()

  if (!result.valid) {
    const errorMessage = [
      '❌ SendPulse configuration validation failed:',
      '',
      ...result.errors.map(err => `  - ${err}`),
      '',
      'Please configure the required environment variables in .env.local or .env',
      '',
      'Required variables:',
      ...ENV_VARS.REQUIRED.map(v => `  - ${v}`),
    ].join('\n')

    throw new Error(errorMessage)
  }

  // Log warnings if present
  if (result.warnings.length > 0) {
    console.warn('⚠️  SendPulse configuration warnings:')
    result.warnings.forEach(warning => {
      console.warn(`  - ${warning}`)
    })
  }

  // Log success
  console.log('✅ SendPulse configuration validated successfully')
  console.log('Configuration:', result.config)
}

/**
 * Get environment-specific configuration errors
 * Returns user-friendly messages for common issues
 */
export function getDiagnosticMessage(result: EnvValidationResult): string {
  if (result.valid) {
    return '✅ SendPulse integration is properly configured.'
  }

  const messages: string[] = [
    '❌ SendPulse integration is not properly configured.',
    '',
    '**Missing Configuration:**',
  ]

  // Provide specific guidance for each error
  result.errors.forEach(error => {
    messages.push(`  - ${error}`)

    if (error.includes('SENDPULSE_APP_ID')) {
      messages.push('    → Get your App ID from: https://login.sendpulse.com/settings/#api')
    }

    if (error.includes('SENDPULSE_APP_SECRET')) {
      messages.push('    → Get your App Secret from: https://login.sendpulse.com/settings/#api')
    }

    if (error.includes('SENDPULSE_BOT_ID')) {
      messages.push('    → Find your Bot ID in SendPulse WhatsApp bot settings')
      messages.push('    → Or leave empty to auto-discover from first available bot')
    }

    if (error.includes('SENDPULSE_WEBHOOK_TOKEN')) {
      messages.push('    → Generate a strong random token: `openssl rand -hex 32`')
      messages.push('    → Configure the same token in SendPulse webhook settings')
    }
  })

  messages.push('')
  messages.push('**Example .env.local configuration:**')
  messages.push('```')
  messages.push('SENDPULSE_APP_ID=your_app_id_here')
  messages.push('SENDPULSE_APP_SECRET=your_app_secret_here')
  messages.push('SENDPULSE_BOT_ID=your_bot_id_here')
  messages.push('SENDPULSE_WEBHOOK_TOKEN=your_webhook_token_here')
  messages.push('```')

  return messages.join('\n')
}

/**
 * Check if SendPulse integration is configured
 * Non-throwing version for conditional feature availability
 */
export function isSendPulseConfigured(): boolean {
  const result = validateSendPulseEnv()
  return result.valid
}

/**
 * Get SendPulse configuration status for health checks
 */
export function getSendPulseConfigStatus(): {
  configured: boolean
  health: 'healthy' | 'degraded' | 'unhealthy'
  details: string
} {
  const result = validateSendPulseEnv()

  if (result.valid && result.warnings.length === 0) {
    return {
      configured: true,
      health: 'healthy',
      details: 'SendPulse integration fully configured',
    }
  }

  if (result.valid && result.warnings.length > 0) {
    return {
      configured: true,
      health: 'degraded',
      details: `Configured with ${result.warnings.length} warning(s)`,
    }
  }

  return {
    configured: false,
    health: 'unhealthy',
    details: `Configuration errors: ${result.errors.length}`,
  }
}
