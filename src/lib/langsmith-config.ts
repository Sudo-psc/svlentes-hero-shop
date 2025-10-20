/**
 * LangSmith Configuration and Utilities
 * Provides centralized configuration for LangChain observability via LangSmith
 */
export interface LangSmithConfig {
  tracingEnabled: boolean
  endpoint: string
  apiKey: string | undefined
  projectName: string
}
/**
 * Get LangSmith configuration from environment variables
 */
export function getLangSmithConfig(): LangSmithConfig {
  const tracingEnabled = process.env.LANGCHAIN_TRACING_V2 === 'true'
  const apiKey = process.env.LANGCHAIN_API_KEY
  const endpoint = process.env.LANGCHAIN_ENDPOINT || 'https://api.smith.langchain.com'
  const projectName = process.env.LANGCHAIN_PROJECT || 'svlentes-whatsapp-support'
  return {
    tracingEnabled,
    endpoint,
    apiKey,
    projectName
  }
}
/**
 * Check if LangSmith is properly configured
 */
export function isLangSmithConfigured(): boolean {
  const config = getLangSmithConfig()
  return config.tracingEnabled && !!config.apiKey
}
/**
 * Get LangSmith environment variables for LangChain
 * These will be automatically picked up by LangChain SDK
 */
export function getLangSmithEnvVars(): Record<string, string> {
  const config = getLangSmithConfig()
  if (!config.tracingEnabled) {
    return {}
  }
  const envVars: Record<string, string> = {
    LANGCHAIN_TRACING_V2: 'true',
    LANGCHAIN_ENDPOINT: config.endpoint,
    LANGCHAIN_PROJECT: config.projectName
  }
  if (config.apiKey) {
    envVars.LANGCHAIN_API_KEY = config.apiKey
  }
  return envVars
}
/**
 * Log LangSmith configuration status
 */
export function logLangSmithStatus(): void {
  const config = getLangSmithConfig()
  if (config.tracingEnabled && config.apiKey) {
  } else if (config.tracingEnabled && !config.apiKey) {
    console.warn('⚠️  LangSmith tracing enabled but API key not configured')
    console.warn('   Set LANGCHAIN_API_KEY environment variable to enable observability')
  } else {
  }
}
/**
 * Get run configuration for LangChain calls
 * This can be passed to LangChain invoke/stream methods
 */
export function getLangSmithRunConfig(metadata?: Record<string, any>) {
  const config = getLangSmithConfig()
  if (!config.tracingEnabled || !config.apiKey) {
    return {}
  }
  return {
    metadata: {
      project: config.projectName,
      ...metadata
    },
    tags: metadata?.tags || []
  }
}