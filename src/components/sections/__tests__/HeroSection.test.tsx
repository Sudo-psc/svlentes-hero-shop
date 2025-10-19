import { render, screen, fireEvent } from '@testing-library/react'
import { HeroSection } from '../HeroSection'
import { openWhatsAppWithContext } from '@/lib/whatsapp'

// Mock the dependencies
jest.mock('@/lib/whatsapp')
jest.mock('@/lib/utils', () => ({
    ...jest.requireActual('@/lib/utils'),
    scrollToSection: jest.fn(),
}))

const mockOpenWhatsApp = openWhatsAppWithContext as jest.MockedFunction<typeof openWhatsAppWithContext>

describe('HeroSection', () => {
    beforeEach(() => {
        jest.clearAllMocks()
    })

    it('renders the hero section with all main elements', () => {
        render(<HeroSection />)

        // Check for pioneer badge
        expect(screen.getByText('🏆 Pioneiro no Brasil')).toBeInTheDocument()

        // Check for main headline
        expect(screen.getByText('Nunca mais')).toBeInTheDocument()
        expect(screen.getByText('fique sem lentes')).toBeInTheDocument()

        // Check for subheadline
        expect(screen.getByText('Assinatura com acompanhamento médico especializado.')).toBeInTheDocument()
        expect(screen.getByText('Receba suas lentes em casa com logística integrada e consultas regulares.')).toBeInTheDocument()

        // Check for CTAs
        expect(screen.getByRole('button', { name: /Agendar consulta com oftalmologista/i })).toBeInTheDocument()
        expect(screen.getByRole('button', { name: /Tirar dúvidas no WhatsApp/i })).toBeInTheDocument()
    })

    it('displays pioneer badge and award icon', () => {
        render(<HeroSection />)

        // Check for pioneer badge with award icon
        expect(screen.getByText('🏆 Pioneiro no Brasil')).toBeInTheDocument()
        expect(screen.getByRole('img', { hidden: true })).toBeInTheDocument() // Award icon
    })

    it('calls WhatsApp integration when "Agendar Consulta" button is clicked', () => {
        render(<HeroSection />)

        const agendarButton = screen.getByRole('button', { name: /Agendar consulta com oftalmologista/i })
        fireEvent.click(agendarButton)

        expect(mockOpenWhatsApp).toHaveBeenCalledWith('consultation', {
            page: 'landing-page',
            section: 'hero-primary-cta'
        })
    })

    it('calls WhatsApp integration when "Falar no WhatsApp" button is clicked', () => {
        render(<HeroSection />)

        const whatsappButton = screen.getByRole('button', { name: /Tirar dúvidas no WhatsApp/i })
        fireEvent.click(whatsappButton)

        expect(mockOpenWhatsApp).toHaveBeenCalledWith('hero', {
            page: 'landing-page',
            section: 'hero-secondary-cta'
        })
    })

    it('renders with custom className', () => {
        const customClass = 'custom-hero-class'
        const { container } = render(<HeroSection className={customClass} />)

        expect(container.firstChild).toHaveClass(customClass)
    })

    it('has proper accessibility attributes', () => {
        render(<HeroSection />)

        // Check for proper heading hierarchy
        const mainHeading = screen.getByRole('heading', { level: 1 })
        expect(mainHeading).toBeInTheDocument()

        // Check for buttons with proper labels
        const agendarButton = screen.getByRole('button', { name: /Agendar consulta com oftalmologista/i })
        const whatsappButton = screen.getByRole('button', { name: /Tirar dúvidas no WhatsApp/i })

        expect(agendarButton).toBeInTheDocument()
        expect(whatsappButton).toBeInTheDocument()
    })

    it('displays mobile sticky CTA', () => {
        render(<HeroSection />)

        // Check for mobile sticky CTA (visible in mobile viewport)
        const mobileStickyCTA = screen.getByLabelText('Agendar consulta - Sticky CTA mobile')
        expect(mobileStickyCTA).toBeInTheDocument()
    })
})