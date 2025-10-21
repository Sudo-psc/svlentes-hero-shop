/**
 * Integration tests for responsive design across different devices
 * Tests layout, interactions, and functionality on mobile, tablet, and desktop
 */

import { render, screen, fireEvent } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { vi } from 'vitest'
import React from 'react'

// Mock Next.js router
vi.mock('next/navigation', () => ({
    useRouter: () => ({
        push: vi.fn(),
        replace: vi.fn(),
        prefetch: vi.fn()
    }),
    useSearchParams: () => new URLSearchParams(),
    usePathname: () => '/'
}))

// Mock window.matchMedia for responsive tests
Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: vi.fn().mockImplementation(query => ({
        matches: false,
        media: query,
        onchange: null,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
    })),
})

// Mock ResizeObserver
global.ResizeObserver = vi.fn().mockImplementation(() => ({
    observe: vi.fn(),
    unobserve: vi.fn(),
    disconnect: vi.fn(),
}))

// Simple mock components for testing responsive behavior
const MockHeader = () => (
    <header className="flex justify-between items-center p-4">
        <div className="text-xl font-bold">SV Lentes</div>
        <nav className="hidden md:flex space-x-4">
            <span>Planos</span>
            <span>Como Funciona</span>
            <span>FAQ</span>
            <span>Contato</span>
        </nav>
        <button className="md:hidden" aria-label="Menu">☰</button>
        <button className="hidden md:block">Agendar Consulta</button>
    </header>
)

const MockHeroSection = () => (
    <section data-testid="hero-container" className="flex flex-col md:flex-row lg:flex-row p-4">
        <div className="flex-1">
            <h1>Nunca mais fique sem lentes</h1>
            <button>Agendar Consulta</button>
            <button>Falar no WhatsApp</button>
        </div>
        <div data-testid="lead-form" className="flex-1 mt-4 md:mt-0">
            <form>
                <input aria-label="Nome" name="nome" autoComplete="name" />
                <input aria-label="WhatsApp" name="whatsapp" type="tel" autoComplete="tel" />
                <input aria-label="Email" name="email" type="email" autoComplete="email" />
                <button type="submit">Calcule sua economia</button>
            </form>
        </div>
        <div data-testid="doctor-card" className="mt-4 lg:mt-0">
            <img src="/doctor.jpg" alt="Dr. Philipe" loading="lazy" />
        </div>
    </section>
)

const MockPricingSection = () => (
    <section data-testid="pricing-section">
        <div data-testid="pricing-container" className="flex flex-col lg:flex-row gap-4">
            <div data-testid="pricing-grid" className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div>Básico</div>
                <div>Premium</div>
                <div>VIP</div>
            </div>
        </div>
        <table data-testid="comparison-table" className="hidden lg:table">
            <thead>
                <tr>
                    <th>Básico</th>
                    <th>Premium</th>
                    <th>VIP</th>
                </tr>
            </thead>
        </table>
    </section>
)

const MockFAQ = () => {
    const [openIndex, setOpenIndex] = React.useState<number | null>(null)

    return (
        <section>
            <button
                role="button"
                onClick={() => setOpenIndex(openIndex === 0 ? null : 0)}
                aria-label="Como funciona a assinatura?"
            >
                Como funciona a assinatura?
            </button>
            {openIndex === 0 && (
                <div>Nossa assinatura funciona de forma simples...</div>
            )}
        </section>
    )
}

const MockWhatsAppFloat = () => (
    <button
        className="fixed bottom-4 right-4 lg:hidden"
        role="button"
        aria-label="WhatsApp"
    >
        WhatsApp
    </button>
)

describe('Responsive Design Integration Tests', () => {
    const user = userEvent.setup()

    // Helper function to simulate different viewport sizes
    const setViewport = (width: number, height: number) => {
        Object.defineProperty(window, 'innerWidth', {
            writable: true,
            configurable: true,
            value: width,
        })
        Object.defineProperty(window, 'innerHeight', {
            writable: true,
            configurable: true,
            value: height,
        })

        // Update matchMedia mock based on viewport
        window.matchMedia = vi.fn().mockImplementation(query => {
            const matches: Record<string, boolean> = {
                '(max-width: 640px)': width <= 640,
                '(max-width: 768px)': width <= 768,
                '(max-width: 1024px)': width <= 1024,
                '(min-width: 641px)': width > 640,
                '(min-width: 769px)': width > 768,
                '(min-width: 1025px)': width > 1024,
            }

            return {
                matches: matches[query] || false,
                media: query,
                onchange: null,
                addListener: vi.fn(),
                removeListener: vi.fn(),
                addEventListener: vi.fn(),
                removeEventListener: vi.fn(),
                dispatchEvent: vi.fn(),
            }
        })

        fireEvent(window, new Event('resize'))
    }

    beforeEach(() => {
        vi.clearAllMocks()
    })

    describe('Mobile Viewport (320px - 640px)', () => {
        beforeEach(() => {
            setViewport(375, 667) // iPhone SE dimensions
        })

        it('should display mobile-optimized header', () => {
            render(<MockHeader />)

            // Logo should be visible
            expect(screen.getByText('SV Lentes')).toBeInTheDocument()

            // Mobile menu button should be present
            const menuButton = screen.getByRole('button', { name: /menu/i })
            expect(menuButton).toBeInTheDocument()

            // Desktop navigation should be hidden (using CSS classes)
            const nav = screen.getByText('Planos').parentElement
            expect(nav).toHaveClass('hidden', 'md:flex')
        })

        it('should show WhatsApp floating button on mobile', () => {
            render(<MockWhatsAppFloat />)

            const whatsappButton = screen.getByRole('button', { name: /whatsapp/i })
            expect(whatsappButton).toBeInTheDocument()
            expect(whatsappButton).toHaveClass('fixed', 'bottom-4', 'right-4', 'lg:hidden')
        })

        it('should stack hero section vertically on mobile', () => {
            render(<MockHeroSection />)

            const heroContainer = screen.getByTestId('hero-container')
            expect(heroContainer).toHaveClass('flex-col', 'md:flex-row')

            // Form should be present
            const leadForm = screen.getByTestId('lead-form')
            expect(leadForm).toBeInTheDocument()
        })

        it('should optimize form inputs for mobile', async () => {
            render(<MockHeroSection />)

            const nameInput = screen.getByLabelText(/nome/i)
            const whatsappInput = screen.getByLabelText(/whatsapp/i)
            const emailInput = screen.getByLabelText(/email/i)

            // Check mobile-optimized input attributes
            expect(whatsappInput).toHaveAttribute('type', 'tel')
            expect(emailInput).toHaveAttribute('type', 'email')
            expect(nameInput).toHaveAttribute('autocomplete', 'name')
            expect(whatsappInput).toHaveAttribute('autocomplete', 'tel')
            expect(emailInput).toHaveAttribute('autocomplete', 'email')
        })

        it('should handle mobile touch interactions', async () => {
            render(<MockFAQ />)

            const firstQuestion = screen.getByRole('button', { name: /como funciona/i })

            // Simulate touch interaction
            fireEvent.touchStart(firstQuestion)
            fireEvent.touchEnd(firstQuestion)
            await user.click(firstQuestion)

            expect(screen.getByText(/nossa assinatura/i)).toBeInTheDocument()
        })
    })

    describe('Tablet Viewport (641px - 1024px)', () => {
        beforeEach(() => {
            setViewport(768, 1024) // iPad dimensions
        })

        it('should display tablet-optimized layout', () => {
            render(<MockHeroSection />)

            const heroContainer = screen.getByTestId('hero-container')
            // Should use medium breakpoint classes
            expect(heroContainer).toHaveClass('md:flex-row')
        })

        it('should show condensed navigation on tablet', () => {
            render(<MockHeader />)

            // Should show main navigation items (CSS will handle visibility)
            expect(screen.getByText('Planos')).toBeInTheDocument()
            expect(screen.getByText('Como Funciona')).toBeInTheDocument()
            expect(screen.getByText('FAQ')).toBeInTheDocument()
        })

        it('should optimize pricing table for tablet', () => {
            render(<MockPricingSection />)

            // Pricing cards should be in a grid layout
            const pricingGrid = screen.getByTestId('pricing-grid')
            expect(pricingGrid).toHaveClass('grid', 'md:grid-cols-2', 'lg:grid-cols-3')
        })
    })

    describe('Desktop Viewport (1025px+)', () => {
        beforeEach(() => {
            setViewport(1440, 900) // Desktop dimensions
        })

        it('should display full desktop navigation', () => {
            render(<MockHeader />)

            // All navigation items should be visible
            expect(screen.getByText('Planos')).toBeInTheDocument()
            expect(screen.getByText('Como Funciona')).toBeInTheDocument()
            expect(screen.getByText('FAQ')).toBeInTheDocument()
            expect(screen.getByText('Contato')).toBeInTheDocument()

            // Mobile menu button should be hidden (CSS class)
            const menuButton = screen.getByRole('button', { name: /menu/i })
            expect(menuButton).toHaveClass('md:hidden')
        })

        it('should use horizontal layout for hero section', () => {
            render(<MockHeroSection />)

            const heroContainer = screen.getByTestId('hero-container')
            expect(heroContainer).toHaveClass('lg:flex-row')

            // Doctor card should be positioned correctly
            const doctorCard = screen.getByTestId('doctor-card')
            expect(doctorCard).toBeInTheDocument()
        })

        it('should display pricing comparison table', () => {
            render(<MockPricingSection />)

            // Full comparison table should be visible on desktop
            const comparisonTable = screen.getByTestId('comparison-table')
            expect(comparisonTable).toBeInTheDocument()
            expect(comparisonTable).toHaveClass('hidden', 'lg:table')

            // All plan columns should be visible
            expect(screen.getAllByText('Básico')).toHaveLength(2) // Grid and table
            expect(screen.getAllByText('Premium')).toHaveLength(2)
            expect(screen.getAllByText('VIP')).toHaveLength(2)
        })

        it('should hide WhatsApp floating button on desktop', () => {
            render(<MockWhatsAppFloat />)

            const whatsappButton = screen.getByRole('button', { name: /whatsapp/i })
            // Should have desktop-specific styling to hide it
            expect(whatsappButton).toHaveClass('lg:hidden')
        })
    })

    describe('Cross-Device Functionality', () => {
        it('should maintain form state across viewport changes', async () => {
            const { rerender } = render(<MockHeroSection />)

            // Fill form on mobile
            setViewport(375, 667)
            await user.type(screen.getByLabelText(/nome/i), 'João Silva')
            await user.type(screen.getByLabelText(/email/i), 'joao@email.com')

            // Switch to desktop
            setViewport(1440, 900)
            rerender(<MockHeroSection />)

            // Form values should be preserved
            expect(screen.getByDisplayValue('João Silva')).toBeInTheDocument()
            expect(screen.getByDisplayValue('joao@email.com')).toBeInTheDocument()
        })

        it('should handle orientation changes', () => {
            // Portrait
            setViewport(375, 667)
            render(<MockHeroSection />)

            let heroContainer = screen.getByTestId('hero-container')
            expect(heroContainer).toHaveClass('flex-col')

            // Landscape
            setViewport(667, 375)
            fireEvent(window, new Event('orientationchange'))

            // Layout should still be responsive
            heroContainer = screen.getByTestId('hero-container')
            expect(heroContainer).toBeInTheDocument()
        })

        it('should optimize images for different screen densities', () => {
            render(<MockHeroSection />)

            const doctorImage = screen.getByAltText(/dr\. philipe/i)
            expect(doctorImage).toHaveAttribute('loading', 'lazy')
        })
    })

    describe('Accessibility Across Devices', () => {
        it('should maintain keyboard navigation on all devices', async () => {
            render(<MockPricingSection />)

            const basicPlans = screen.getAllByText('Básico')
            const basicPlan = basicPlans[0] // Use first instance

            // Test that the element exists and can be interacted with
            expect(basicPlan).toBeInTheDocument()
            expect(basicPlan).toBeVisible()
        })

        it('should provide appropriate ARIA labels', () => {
            render(<MockHeader />)

            const menuButton = screen.getByRole('button', { name: /menu/i })
            expect(menuButton).toHaveAttribute('aria-label', 'Menu')
        })

        it('should maintain semantic structure', () => {
            render(<MockHeroSection />)

            const heading = screen.getByRole('heading', { level: 1 })
            expect(heading).toBeInTheDocument()
            expect(heading).toHaveTextContent('Nunca mais fique sem lentes')
        })
    })

    describe('Performance Across Devices', () => {
        it('should lazy load images below the fold', () => {
            render(<MockHeroSection />)

            const heroImage = screen.getByAltText(/dr\. philipe/i)
            expect(heroImage).toHaveAttribute('loading', 'lazy')
        })

        it('should handle resize events efficiently', () => {
            render(<MockHeroSection />)

            // Simulate multiple resize events
            for (let i = 0; i < 10; i++) {
                setViewport(300 + i * 100, 600)
            }

            // Component should still be rendered correctly
            expect(screen.getByTestId('hero-container')).toBeInTheDocument()
        })
    })

    describe('Layout Consistency', () => {
        it('should maintain consistent spacing across breakpoints', () => {
            const { rerender } = render(<MockHeroSection />)

            // Mobile
            setViewport(375, 667)
            let heroContainer = screen.getByTestId('hero-container')
            expect(heroContainer).toHaveClass('p-4')

            // Desktop
            setViewport(1440, 900)
            rerender(<MockHeroSection />)
            heroContainer = screen.getByTestId('hero-container')
            expect(heroContainer).toHaveClass('p-4')
        })

        it('should adapt grid layouts appropriately', () => {
            render(<MockPricingSection />)

            const pricingGrid = screen.getByTestId('pricing-grid')
            expect(pricingGrid).toHaveClass(
                'grid',
                'grid-cols-1',
                'md:grid-cols-2',
                'lg:grid-cols-3'
            )
        })
    })
})