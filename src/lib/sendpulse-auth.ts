/**
 * SendPulse OAuth2 Authentication
 * Generates API token from app_id and app_secret using SendPulse OAuth2 flow
 */
import { logger, LogCategory } from './logger'
interface TokenResponse {
  access_token: string
  token_type: string
  expires_in: number
}
export class SendPulseAuth {
  private appId: string
  private appSecret: string
  private tokenUrl = 'https://api.sendpulse.com/oauth/access_token'
  private cachedToken: string | null = null
  private tokenExpiry: number = 0
  // P1: Performance optimizations
  private refreshPromise: Promise<string> | null = null // Prevent concurrent refresh
  private proactiveRefreshThreshold: number = 300 // Refresh 5min before expiry
  private retryAttempts: number = 3
  private retryDelayMs: number = 1000
  constructor() {
    // C2: Validate required credentials at startup
    const appId = process.env.SENDPULSE_APP_ID
    const appSecret = process.env.SENDPULSE_APP_SECRET
    if (!appId || !appSecret) {
      throw new Error(
        'SendPulse credentials not configured. Required environment variables: ' +
        'SENDPULSE_APP_ID and SENDPULSE_APP_SECRET'
      )
    }
    this.appId = appId
    this.appSecret = appSecret
  }
  /**
   * Get access token (cached or fresh)
   * P1: Implements proactive refresh to prevent expiry during use
   */
  async getAccessToken(): Promise<string> {
    const now = Date.now()
    const timeUntilExpiry = Math.floor((this.tokenExpiry - now) / 1000)
    // P1: Return cached token if still valid (not near expiry)
    if (this.cachedToken && timeUntilExpiry > this.proactiveRefreshThreshold) {
      return this.cachedToken
    }
    // P1: Proactive refresh - token is close to expiry but still valid
    if (this.cachedToken && timeUntilExpiry > 0 && timeUntilExpiry <= this.proactiveRefreshThreshold) {
      logger.info(LogCategory.SENDPULSE, 'Proactive token refresh', {
        expiresIn: timeUntilExpiry
      })
      // Trigger background refresh but return current token
      this.generateTokenWithLock().catch(err =>
        logger.error(LogCategory.SENDPULSE, 'Background refresh failed', {
          error: err.message
        })
      )
      return this.cachedToken
    }
    // P1: Token expired or missing - wait for new token
    return await this.generateTokenWithLock()
  }
  /**
   * Generate new access token from SendPulse OAuth2
   */
  private async generateToken(): Promise<string> {
    try {
      if (!this.appId || !this.appSecret) {
        throw new Error('SendPulse app_id and app_secret not configured')
      }
      const response = await fetch(this.tokenUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          grant_type: 'client_credentials',
          client_id: this.appId,
          client_secret: this.appSecret
        })
      })
      if (!response.ok) {
        const text = await response.text()
        // Log error without exposing sensitive response data
        logger.error(LogCategory.SENDPULSE, 'OAuth failed', {
          status: response.status,
          statusText: response.statusText
        })
        const errorData = JSON.parse(text || '{}')
        throw new Error(
          `SendPulse OAuth error: ${response.status} - ${
            errorData.error_description || response.statusText
          }`
        )
      }
      const text = await response.text()
      // C3: Safe JSON parsing with validation
      let data: TokenResponse
      try {
        data = JSON.parse(text)
        // Validate token response structure
        if (!data.access_token || typeof data.access_token !== 'string') {
          throw new Error('Invalid token response: missing or invalid access_token')
        }
        if (!data.expires_in || typeof data.expires_in !== 'number') {
          throw new Error('Invalid token response: missing or invalid expires_in')
        }
      } catch (parseError) {
        throw new Error(
          `Failed to parse SendPulse token response: ${
            parseError instanceof Error ? parseError.message : 'Invalid JSON'
          }`
        )
      }
      // C1: Log success WITHOUT exposing token
      logger.info(LogCategory.SENDPULSE, 'Token generated successfully', {
        expiresIn: data.expires_in
      })
      // Cache token (expires_in is in seconds, subtract 60s for safety margin)
      this.cachedToken = data.access_token
      this.tokenExpiry = Date.now() + (data.expires_in - 60) * 1000
      return data.access_token
    } catch (error) {
      // C1: Log error without exposing sensitive data
      logger.error(LogCategory.SENDPULSE, 'Token generation failed', {
        error: error instanceof Error ? error.message : 'Unknown error',
        // Do NOT log request/response bodies
      })
      throw error
    }
  }
  /**
   * P1: Generate token with concurrency control
   * Prevents multiple simultaneous refresh requests
   */
  private async generateTokenWithLock(): Promise<string> {
    // If a refresh is already in progress, wait for it
    if (this.refreshPromise) {
      logger.info(LogCategory.SENDPULSE, 'Token refresh already in progress, waiting...')
      return await this.refreshPromise
    }
    // Start new refresh and store promise
    this.refreshPromise = this.generateTokenWithRetry()
      .finally(() => {
        // Clear promise when done
        this.refreshPromise = null
      })
    return await this.refreshPromise
  }
  /**
   * P1: Generate token with exponential backoff retry
   */
  private async generateTokenWithRetry(): Promise<string> {
    let lastError: Error | null = null
    for (let attempt = 1; attempt <= this.retryAttempts; attempt++) {
      try {
        return await this.generateToken()
      } catch (error) {
        lastError = error as Error
        if (attempt < this.retryAttempts) {
          const delayMs = this.retryDelayMs * Math.pow(2, attempt - 1) // Exponential backoff
          logger.warn(LogCategory.SENDPULSE, `Retry ${attempt}/${this.retryAttempts}`, {
            delayMs,
            error: lastError.message
          })
          await new Promise(resolve => setTimeout(resolve, delayMs))
        }
      }
    }
    throw lastError || new Error('Token generation failed after retries')
  }
  /**
   * Force token refresh
   */
  async refreshToken(): Promise<string> {
    this.cachedToken = null
    this.tokenExpiry = 0
    return await this.generateTokenWithLock()
  }
  /**
   * Check if token is valid
   */
  isTokenValid(): boolean {
    return !!(this.cachedToken && Date.now() < this.tokenExpiry)
  }
  /**
   * Get token info
   */
  getTokenInfo() {
    return {
      hasToken: !!this.cachedToken,
      isValid: this.isTokenValid(),
      expiresIn: this.tokenExpiry > 0 ? Math.floor((this.tokenExpiry - Date.now()) / 1000) : 0
    }
  }
}
// Singleton instance
export const sendPulseAuth = new SendPulseAuth()