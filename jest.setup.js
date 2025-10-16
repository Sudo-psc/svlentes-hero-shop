import '@testing-library/jest-dom'
import { TextEncoder, TextDecoder } from 'util'
import { ReadableStream, TransformStream } from 'stream/web'

// Polyfill for LangChain/LangGraph
global.TextEncoder = TextEncoder
global.TextDecoder = TextDecoder
global.ReadableStream = ReadableStream
global.TransformStream = TransformStream

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

// Mock window.gtag for analytics
Object.defineProperty(window, 'gtag', {
    value: jest.fn(),
    writable: true,
})



// Mock WhatsApp integration
jest.mock('@/lib/whatsapp', () => ({
    openWhatsAppWithContext: jest.fn(),
}))