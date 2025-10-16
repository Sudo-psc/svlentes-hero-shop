import {
  getLangSmithConfig,
  isLangSmithConfigured,
  getLangSmithEnvVars,
  getLangSmithRunConfig
} from '../langsmith-config'

describe('LangSmith Configuration', () => {
  const originalEnv = process.env

  beforeEach(() => {
    jest.resetModules()
    process.env = { ...originalEnv }
  })

  afterAll(() => {
    process.env = originalEnv
  })

  describe('getLangSmithConfig', () => {
    it('should return default config when no env vars set', () => {
      delete process.env.LANGCHAIN_TRACING_V2
      delete process.env.LANGCHAIN_API_KEY
      delete process.env.LANGCHAIN_PROJECT

      const config = getLangSmithConfig()

      expect(config.tracingEnabled).toBe(false)
      expect(config.apiKey).toBeUndefined()
      expect(config.endpoint).toBe('https://api.smith.langchain.com')
      expect(config.projectName).toBe('svlentes-whatsapp-support')
    })

    it('should return config with tracing enabled', () => {
      process.env.LANGCHAIN_TRACING_V2 = 'true'
      process.env.LANGCHAIN_API_KEY = 'test-key'
      process.env.LANGCHAIN_PROJECT = 'test-project'

      const config = getLangSmithConfig()

      expect(config.tracingEnabled).toBe(true)
      expect(config.apiKey).toBe('test-key')
      expect(config.projectName).toBe('test-project')
    })

    it('should handle custom endpoint', () => {
      process.env.LANGCHAIN_ENDPOINT = 'https://custom.endpoint.com'

      const config = getLangSmithConfig()

      expect(config.endpoint).toBe('https://custom.endpoint.com')
    })
  })

  describe('isLangSmithConfigured', () => {
    it('should return false when tracing disabled', () => {
      process.env.LANGCHAIN_TRACING_V2 = 'false'
      process.env.LANGCHAIN_API_KEY = 'test-key'

      expect(isLangSmithConfigured()).toBe(false)
    })

    it('should return false when API key missing', () => {
      process.env.LANGCHAIN_TRACING_V2 = 'true'
      delete process.env.LANGCHAIN_API_KEY

      expect(isLangSmithConfigured()).toBe(false)
    })

    it('should return true when fully configured', () => {
      process.env.LANGCHAIN_TRACING_V2 = 'true'
      process.env.LANGCHAIN_API_KEY = 'test-key'

      expect(isLangSmithConfigured()).toBe(true)
    })
  })

  describe('getLangSmithEnvVars', () => {
    it('should return empty object when tracing disabled', () => {
      process.env.LANGCHAIN_TRACING_V2 = 'false'

      const envVars = getLangSmithEnvVars()

      expect(envVars).toEqual({})
    })

    it('should return env vars when tracing enabled', () => {
      process.env.LANGCHAIN_TRACING_V2 = 'true'
      process.env.LANGCHAIN_API_KEY = 'test-key'
      process.env.LANGCHAIN_PROJECT = 'test-project'
      process.env.LANGCHAIN_ENDPOINT = 'https://test.com'

      const envVars = getLangSmithEnvVars()

      expect(envVars).toEqual({
        LANGCHAIN_TRACING_V2: 'true',
        LANGCHAIN_API_KEY: 'test-key',
        LANGCHAIN_PROJECT: 'test-project',
        LANGCHAIN_ENDPOINT: 'https://test.com'
      })
    })

    it('should not include API key if not set', () => {
      process.env.LANGCHAIN_TRACING_V2 = 'true'
      delete process.env.LANGCHAIN_API_KEY

      const envVars = getLangSmithEnvVars()

      expect(envVars.LANGCHAIN_API_KEY).toBeUndefined()
      expect(envVars.LANGCHAIN_TRACING_V2).toBe('true')
    })
  })

  describe('getLangSmithRunConfig', () => {
    it('should return empty object when not configured', () => {
      process.env.LANGCHAIN_TRACING_V2 = 'false'

      const runConfig = getLangSmithRunConfig()

      expect(runConfig).toEqual({})
    })

    it('should return run config with metadata when configured', () => {
      process.env.LANGCHAIN_TRACING_V2 = 'true'
      process.env.LANGCHAIN_API_KEY = 'test-key'
      process.env.LANGCHAIN_PROJECT = 'test-project'

      const customMetadata = {
        userId: 'user-123',
        intent: 'test-intent',
        tags: ['tag1', 'tag2']
      }

      const runConfig = getLangSmithRunConfig(customMetadata)

      expect(runConfig).toEqual({
        metadata: {
          project: 'test-project',
          userId: 'user-123',
          intent: 'test-intent',
          tags: ['tag1', 'tag2']
        },
        tags: ['tag1', 'tag2']
      })
    })

    it('should handle metadata without tags', () => {
      process.env.LANGCHAIN_TRACING_V2 = 'true'
      process.env.LANGCHAIN_API_KEY = 'test-key'

      const runConfig = getLangSmithRunConfig({ userId: 'test' })

      expect(runConfig.tags).toEqual([])
      expect(runConfig.metadata?.userId).toBe('test')
    })
  })
})
