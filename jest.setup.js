import '@testing-library/jest-dom'
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