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
    this.appId = process.env.SENDPULSE_APP_ID || ''
    this.appSecret = process.env.SENDPULSE_APP_SECRET || ''
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
        const errorData = await response.json().catch(() => ({}))
        throw new Error(
          `SendPulse OAuth error: ${response.status} - ${
            errorData.error_description || response.statusText
          }`
        )
      }

      const data: TokenResponse = await response.json()

      // Cache token (expires_in is in seconds, subtract 60s for safety margin)
      this.cachedToken = data.access_token
      this.tokenExpiry = Date.now() + (data.expires_in - 60) * 1000

      console.log('SendPulse token generated successfully, expires in:', data.expires_in, 'seconds')

      return data.access_token

    } catch (error) {
      console.error('Error generating SendPulse token:', error)
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
