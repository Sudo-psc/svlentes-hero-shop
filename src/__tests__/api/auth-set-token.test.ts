/**
 * Tests for secure token management API
 * Verifies HttpOnly cookie implementation
 */

import { NextRequest } from 'next/server'
import { POST, GET } from '@/app/api/auth/set-token/route'

describe('/api/auth/set-token', () => {
  describe('POST', () => {
    it('should set HttpOnly cookie with valid token', async () => {
      const request = new NextRequest('http://localhost:3000/api/auth/set-token', {
        method: 'POST',
        body: JSON.stringify({ token: 'test-firebase-token-123' }),
        headers: {
          'Content-Type': 'application/json',
        },
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.message).toBe('Token stored securely')

      // Verify cookie is set with proper security attributes
      const setCookieHeader = response.headers.get('set-cookie')
      expect(setCookieHeader).toContain('firebase-token=')
      expect(setCookieHeader).toContain('HttpOnly')
      expect(setCookieHeader).toContain('SameSite=Lax')
      expect(setCookieHeader).toContain('Path=/')
      expect(setCookieHeader).toContain('Max-Age=3600')
    })

    it('should clear cookie when action is clear', async () => {
      const request = new NextRequest('http://localhost:3000/api/auth/set-token', {
        method: 'POST',
        body: JSON.stringify({ action: 'clear' }),
        headers: {
          'Content-Type': 'application/json',
        },
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.message).toBe('Token cleared')

      // Verify cookie is cleared (Max-Age=0)
      const setCookieHeader = response.headers.get('set-cookie')
      expect(setCookieHeader).toContain('firebase-token=')
      expect(setCookieHeader).toContain('Max-Age=0')
    })

    it('should reject invalid token', async () => {
      const request = new NextRequest('http://localhost:3000/api/auth/set-token', {
        method: 'POST',
        body: JSON.stringify({ token: 123 }), // Invalid: number instead of string
        headers: {
          'Content-Type': 'application/json',
        },
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe('Invalid token provided')
    })

    it('should reject missing token', async () => {
      const request = new NextRequest('http://localhost:3000/api/auth/set-token', {
        method: 'POST',
        body: JSON.stringify({}),
        headers: {
          'Content-Type': 'application/json',
        },
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe('Invalid token provided')
    })

    it('should handle malformed JSON', async () => {
      const request = new NextRequest('http://localhost:3000/api/auth/set-token', {
        method: 'POST',
        body: 'invalid-json',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.error).toBe('Failed to process authentication token')
    })
  })

  describe('GET', () => {
    it('should return 405 Method Not Allowed', async () => {
      const response = await GET()
      const data = await response.json()

      expect(response.status).toBe(405)
      expect(data.error).toContain('Method not allowed')
    })
  })

  describe('Security attributes', () => {
    it('should set Secure flag in production', async () => {
      const originalEnv = process.env.NODE_ENV
      process.env.NODE_ENV = 'production'

      const request = new NextRequest('http://localhost:3000/api/auth/set-token', {
        method: 'POST',
        body: JSON.stringify({ token: 'test-token' }),
        headers: {
          'Content-Type': 'application/json',
        },
      })

      const response = await POST(request)
      const setCookieHeader = response.headers.get('set-cookie')

      // In production, Secure flag should be present
      expect(setCookieHeader).toContain('Secure')

      process.env.NODE_ENV = originalEnv
    })

    it('should not expose token to client-side JavaScript', async () => {
      const request = new NextRequest('http://localhost:3000/api/auth/set-token', {
        method: 'POST',
        body: JSON.stringify({ token: 'test-token' }),
        headers: {
          'Content-Type': 'application/json',
        },
      })

      const response = await POST(request)
      const setCookieHeader = response.headers.get('set-cookie')

      // HttpOnly flag prevents document.cookie access
      expect(setCookieHeader).toContain('HttpOnly')
    })
  })
})
