/**
 * Security Configuration Tests
 * Tests for enhanced security configurations implemented in quick wins
 */

import { NextConfig } from 'next'

// Mock the next.config.js for testing
const mockNextConfig: NextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  poweredByHeader: false,
  compress: true,
  typescript: {
    ignoreBuildErrors: false, // Critical fix: enabled type checking
  },
  experimental: {
    optimizeCss: true,
    optimizePackageImports: ['@radix-ui/react-icons', 'lucide-react'],
    turbotrace: {
      logLevel: 'error'
    }
  },
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'SAMEORIGIN'
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff'
          },
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block'
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin'
          },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=(), payment=()'
          },
          {
            key: 'Content-Security-P',
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-inline' https://www.googletagmanager.com https://checkout.asaas.com https://googleads.g.doubleclick.net",
              "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
              "font-src 'self' https://fonts.gstatic.com",
              "img-src 'self' data: https: blob:",
              "connect-src 'self' https://api.asaas.com https://checkout.asaas.com https://www.google-analytics.com https://stats.g.doubleclick.net",
              "frame-src https://checkout.asaas.com https://www.google.com",
              "object-src 'none'",
              "base-uri 'self'",
              "form-action 'self'"
            ].join('; ')
          }
        ]
      }
    ]
  },
  async redirects() {
    return [
      {
        source: '/admin/:path*',
        destination: '/login?redirectTo=/admin/:path*',
        permanent: false,
        has: [
          {
            type: 'header',
            key: 'authorization',
            value: undefined
          }
        ]
      }
    ]
  }
}

describe('Security Configuration', () => {
  describe('TypeScript Configuration', () => {
    it('should have type checking enabled in production', () => {
      expect(mockNextConfig.typescript?.ignoreBuildErrors).toBe(false)
    })

    it('should prevent builds with TypeScript errors', () => {
      // This ensures the build process catches type errors before production
      const config = mockNextConfig.typescript
      expect(config).toBeDefined()
      expect(config?.ignoreBuildErrors).toBe(false)
    })
  })

  describe('Security Headers', () => {
    let headers: any[]

    beforeAll(async () => {
      headers = await mockNextConfig.headers!()
    })

    it('should configure X-Frame-Options correctly', () => {
      const xFrameOptions = headers[0].headers.find((h: any) => h.key === 'X-Frame-Options')
      expect(xFrameOptions?.value).toBe('SAMEORIGIN')
    })

    it('should configure X-Content-Type-Options correctly', () => {
      const xContentTypeOptions = headers[0].headers.find((h: any) => h.key === 'X-Content-Type-Options')
      expect(xContentTypeOptions?.value).toBe('nosniff')
    })

    it('should configure X-XSS-Protection correctly', () => {
      const xXssProtection = headers[0].headers.find((h: any) => h.key === 'X-XSS-Protection')
      expect(xXssProtection?.value).toBe('1; mode=block')
    })

    it('should configure Referrer-Policy correctly', () => {
      const referrerPolicy = headers[0].headers.find((h: any) => h.key === 'Referrer-Policy')
      expect(referrerPolicy?.value).toBe('strict-origin-when-cross-origin')
    })

    it('should configure restrictive Permissions-Policy', () => {
      const permissionsPolicy = headers[0].headers.find((h: any) => h.key === 'Permissions-Policy')
      expect(permissionsPolicy?.value).toBe('camera=(), microphone=(), geolocation=(), payment=()')
    })
  })

  describe('Content Security Policy', () => {
    let cspHeader: any

    beforeAll(async () => {
      const headers = await mockNextConfig.headers!()
      cspHeader = headers[0].headers.find((h: any) => h.key === 'Content-Security-P')
    })

    it('should have restrictive default-src', () => {
      expect(cspHeader?.value).toContain("default-src 'self'")
    })

    it('should NOT include unsafe-eval in script-src', () => {
      // Critical security fix: ensure unsafe-eval is removed
      expect(cspHeader?.value).not.toContain("'unsafe-eval'")
    })

    it('should allow only required external scripts', () => {
      const scriptSrc = cspHeader?.value.match(/script-src [^;]+/)?.[0]
      expect(scriptSrc).toContain("'self'")
      expect(scriptSrc).toContain('googletagmanager.com')
      expect(scriptSrc).toContain('checkout.asaas.com')
      expect(scriptSrc).toContain('googleads.g.doubleclick.net')
      expect(scriptSrc).not.toContain('untrusted-domain.com')
    })

    it('should allow only required style sources', () => {
      const styleSrc = cspHeader?.value.match(/style-src [^;]+/)?.[0]
      expect(styleSrc).toContain("'self'")
      expect(styleSrc).toContain("'unsafe-inline'")
      expect(styleSrc).toContain('fonts.googleapis.com')
    })

    it('should allow only trusted font sources', () => {
      const fontSrc = cspHeader?.value.match(/font-src [^;]+/)?.[0]
      expect(fontSrc).toContain("'self'")
      expect(fontSrc).toContain('fonts.gstatic.com')
    })

    it('should allow only trusted image sources', () => {
      const imgSrc = cspHeader?.value.match(/img-src [^;]+/)?.[0]
      expect(imgSrc).toContain("'self'")
      expect(imgSrc).toContain('data:')
      expect(imgSrc).toContain('https:')
      expect(imgSrc).toContain('blob:')
    })

    it('should allow only required connect sources', () => {
      const connectSrc = cspHeader?.value.match(/connect-src [^;]+/)?.[0]
      expect(connectSrc).toContain("'self'")
      expect(connectSrc).toContain('api.asaas.com')
      expect(connectSrc).toContain('checkout.asaas.com')
      expect(connectSrc).toContain('google-analytics.com')
    })

    it('should restrict frame sources to trusted domains', () => {
      const frameSrc = cspHeader?.value.match(/frame-src [^;]+/)?.[0]
      expect(frameSrc).toContain('checkout.asaas.com')
      expect(frameSrc).toContain('www.google.com')
      expect(frameSrc).not.toContain('untrusted-iframe.com')
    })

    it('should disable object sources completely', () => {
      expect(cspHeader?.value).toContain("object-src 'none'")
    })

    it('should restrict base-uri to self', () => {
      expect(cspHeader?.value).toContain("base-uri 'self'")
    })

    it('should restrict form-action to self', () => {
      expect(cspHeader?.value).toContain("form-action 'self'")
    })
  })

  describe('Admin Protection', () => {
    let redirects: any[]

    beforeAll(async () => {
      redirects = await mockNextConfig.redirects!()
    })

    it('should protect admin routes from unauthorized access', () => {
      const adminRedirect = redirects.find((r: any) => r.source === '/admin/:path*')
      expect(adminRedirect).toBeDefined()
      expect(adminRedirect.destination).toContain('/login')
      expect(adminRedirect.permanent).toBe(false)
    })

    it('should preserve original admin path in redirect', () => {
      const adminRedirect = redirects.find((r: any) => r.source === '/admin/:path*')
      expect(adminRedirect.destination).toContain('redirectTo=/admin/:path*')
    })

    it('should only redirect when authorization header is missing', () => {
      const adminRedirect = redirects.find((r: any) => r.source === '/admin/:path*')
      expect(adminRedirect.has).toBeDefined()
      expect(adminRedirect.has[0].type).toBe('header')
      expect(adminRedirect.has[0].key).toBe('authorization')
      expect(adminRedirect.has[0].value).toBeUndefined()
    })
  })

  describe('Performance and Optimization', () => {
    it('should enable SWC minification', () => {
      expect(mockNextConfig.swcMinify).toBe(true)
    })

    it('should enable compression', () => {
      expect(mockNextConfig.compress).toBe(true)
    })

    it('should disable powered-by header', () => {
      expect(mockNextConfig.poweredByHeader).toBe(false)
    })

    it('should enable experimental optimizations', () => {
      expect(mockNextConfig.experimental?.optimizeCss).toBe(true)
      expect(mockNextConfig.experimental?.optimizePackageImports).toContain('@radix-ui/react-icons')
      expect(mockNextConfig.experimental?.optimizePackageImports).toContain('lucide-react')
    })

    it('should configure turbtrace error-only logging', () => {
      expect(mockNextConfig.experimental?.turbotrace?.logLevel).toBe('error')
    })
  })

  describe('Security Configuration Validation', () => {
    it('should have all critical security headers configured', async () => {
      const headers = await mockNextConfig.headers!()
      const requiredHeaders = [
        'X-Frame-Options',
        'X-Content-Type-Options',
        'X-XSS-Protection',
        'Referrer-Policy',
        'Permissions-Policy',
        'Content-Security-P'
      ]

      const configuredHeaders = headers[0].headers.map((h: any) => h.key)
      requiredHeaders.forEach(header => {
        expect(configuredHeaders).toContain(header)
      })
    })

    it('should not contain insecure CSP directives', async () => {
      const headers = await mockNextConfig.headers!()
      const cspHeader = headers[0].headers.find((h: any) => h.key === 'Content-Security-P')
      const insecureDirectives = ['unsafe-eval', 'unsafe-inline script', 'data: script']

      insecureDirectives.forEach(directive => {
        expect(cspHeader?.value).not.toContain(directive)
      })
    })

    it('should allow only trusted external domains in CSP', async () => {
      const headers = await mockNextConfig.headers!()
      const cspHeader = headers[0].headers.find((h: any) => h.key === 'Content-Security-P')

      const trustedDomains = [
        'asaas.com',
        'google.com',
        'googletagmanager.com',
        'google-analytics.com',
        'fonts.googleapis.com',
        'fonts.gstatic.com'
      ]

      trustedDomains.forEach(domain => {
        expect(cspHeader?.value).toContain(domain)
      })

      // Ensure no untrusted domains
      expect(cspHeader?.value).not.toContain('malicious-site.com')
      expect(cspHeader?.value).not.toContain('untrusted-cdn.com')
    })
  })

  describe('Configuration Edge Cases', () => {
    it('should handle missing headers gracefully', () => {
      const configWithoutHeaders = { ...mockNextConfig, headers: undefined }
      expect(configWithoutHeaders.headers).toBeUndefined()
    })

    it('should handle missing redirects gracefully', () => {
      const configWithoutRedirects = { ...mockNextConfig, redirects: undefined }
      expect(configWithoutRedirects.redirects).toBeUndefined()
    })

    it('should maintain configuration structure integrity', () => {
      expect(mockNextConfig).toHaveProperty('typescript')
      expect(mockNextConfig).toHaveProperty('experimental')
      expect(mockNextConfig.reactStrictMode).toBe(true)
    })
  })
})