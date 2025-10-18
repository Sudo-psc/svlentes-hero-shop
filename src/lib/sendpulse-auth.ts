/**
 * SendPulse OAuth2 Authentication
 * Generates API token from app_id and app_secret using SendPulse OAuth2 flow
 */

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
   */
  async getAccessToken(): Promise<string> {
    // Return cached token if still valid
    if (this.cachedToken && Date.now() < this.tokenExpiry) {
      return this.cachedToken
    }

    // Generate new token
    return await this.generateToken()
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
        console.error('[SendPulse Auth] OAuth failed:', {
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
      console.log('[SendPulse Auth] Token generated successfully')
      console.log('[SendPulse Auth] Token expires in:', data.expires_in, 'seconds')

      // Cache token (expires_in is in seconds, subtract 60s for safety margin)
      this.cachedToken = data.access_token
      this.tokenExpiry = Date.now() + (data.expires_in - 60) * 1000

      return data.access_token

    } catch (error) {
      // C1: Log error without exposing sensitive data
      console.error('[SendPulse Auth] Token generation failed:', {
        error: error instanceof Error ? error.message : 'Unknown error',
        // Do NOT log request/response bodies
      })
      throw error
    }
  }

  /**
   * Force token refresh
   */
  async refreshToken(): Promise<string> {
    this.cachedToken = null
    this.tokenExpiry = 0
    return await this.generateToken()
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
