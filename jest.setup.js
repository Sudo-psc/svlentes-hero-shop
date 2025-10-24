import '@testing-library/jest-dom'

// Polyfill for Next.js Request/Response in Node environment
if (typeof Request === 'undefined') {
  global.Request = class Request {
    constructor(input, init) {
      this.url = typeof input === 'string' ? input : input.url
      this.method = init?.method || 'GET'
      this.headers = new Headers(init?.headers || {})
      this.body = init?.body
    }
  }
}

if (typeof Response === 'undefined') {
  global.Response = class Response {
    constructor(body, init) {
      this.body = body
      this.status = init?.status || 200
      this.statusText = init?.statusText || 'OK'
      this.headers = new Headers(init?.headers || {})
      this.ok = this.status >= 200 && this.status < 300
    }
    
    async json() {
      return typeof this.body === 'string' ? JSON.parse(this.body) : this.body
    }
    
    async text() {
      return typeof this.body === 'string' ? this.body : JSON.stringify(this.body)
    }
  }
}

if (typeof Headers === 'undefined') {
  global.Headers = class Headers {
    constructor(init) {
      this.headers = new Map()
      if (init) {
        Object.entries(init).forEach(([key, value]) => {
          this.headers.set(key.toLowerCase(), value)
        })
      }
    }
    
    get(name) {
      return this.headers.get(name.toLowerCase())
    }
    
    set(name, value) {
      this.headers.set(name.toLowerCase(), value)
    }
    
    has(name) {
      return this.headers.has(name.toLowerCase())
    }
    
    delete(name) {
      this.headers.delete(name.toLowerCase())
    }
    
    forEach(callback) {
      this.headers.forEach((value, key) => callback(value, key, this))
    }
  }
}
import { config as dotenvConfig } from 'dotenv'
import { resolve } from 'path'

// Load test environment variables
dotenvConfig({ path: resolve(__dirname, '.env.test') })

// Mock Next.js router
jest.mock('next/navigation', () => ({
    useRouter() {
        return {
            push: jest.fn(),
            replace: jest.fn(),
            prefetch: jest.fn(),
            back: jest.fn(),
            forward: jest.fn(),
            refresh: jest.fn(),
        }
    },
    useSearchParams() {
        return new URLSearchParams()
    },
    usePathname() {
        return '/'
    },
}))

// Mock window.gtag for analytics (only in jsdom environment)
if (typeof window !== 'undefined') {
    Object.defineProperty(window, 'gtag', {
        value: jest.fn(),
        writable: true,
    })
}



// Mock WhatsApp integration
jest.mock('@/lib/whatsapp', () => ({
    openWhatsAppWithContext: jest.fn(),
}))