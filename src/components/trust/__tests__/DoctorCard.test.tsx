import { render, screen, fireEvent } from '@testing-library/react'
import { DoctorCard } from '../DoctorCard'
import { openWhatsAppWithContext } from '@/lib/whatsapp'

// Mock the WhatsApp integration
jest.mock('@/lib/whatsapp')
const mockOpenWhatsApp = openWhatsAppWithContext as jest.MockedFunction<typeof openWhatsAppWithContext>

// Mock the doctor info data
jest.mock('@/data/doctor-info', () => ({
    doctorInfo: {
        name: 'Dr. Philipe Saraiva Cruz',
        crm: 'CRM 69.870',
        specialty: 'Oftalmologia',
        experience: '15+ anos de experiência',
        bio: 'Especialista em lentes de contato com mais de 15 anos de experiência.',
        credentials: [
            'Graduação em Medicina - UFMT',
            'Residência em Oftalmologia - UNIFESP',
            'Especialização em Lentes de Contato - SBO'
        ]
    }
}))

// Mock social proof stats
jest.mock('@/data/trust-indicators', () => ({
    socialProofStats: [
        { id: '1', value: '5000+', label: 'Pacientes' },
        { id: '2', value: '98%', label: 'Satisfação' },
        { id: '3', value: '15+', label: 'Anos' },
        { id: '4', value: '24/7', label: 'Suporte' }
    ]
}))

describe('DoctorCard', () => {
    beforeEach(() => {
        jest.clearAllMocks()
    })

    describe('Hero variant (default)', () => {
        it('renders doctor information correctly', () => {
            render(<DoctorCard />)

            // Check doctor name and credentials
            expect(screen.getByText('Dr. Philipe Saraiva Cruz')).toBeInTheDocument()
            expect(screen.getByText('CRM 69.870 | Oftalmologia')).toBeInTheDocument()
            expect(screen.getByText('15+ anos de experiência')).toBeInTheDocument()
        })

        it('displays trust badges', () => {
            render(<DoctorCard />)

            // Check for trust badges
            expect(screen.getByText('SBO')).toBeInTheDocument()
            expect(screen.getByText('Especialista')).toBeInTheDocument()
            expect(screen.getByText('5000+ pacientes')).toBeInTheDocument()
        })

        it('shows quick stats', () => {
            render(<DoctorCard />)

            // Check for satisfaction and support stats
            expect(screen.getByText('98%')).toBeInTheDocument()
            expect(screen.getByText('Satisfação')).toBeInTheDocument()
            expect(screen.getByText('24/7')).toBeInTheDocument()
            expect(screen.getByText('Suporte')).toBeInTheDocument()
        })

        it('renders CTA button when showCTA is true', () => {
            render(<DoctorCard showCTA={true} />)

            const ctaButton = screen.getByRole('button', { name: /Agendar Consulta/i })
            expect(ctaButton).toBeInTheDocument()
            expect(screen.getByText('✓ Primeira consulta sem compromisso')).toBeInTheDocument()
        })

        it('does not render CTA button when showCTA is false', () => {
            render(<DoctorCard showCTA={false} />)

            expect(screen.queryByRole('button', { name: /Agendar Consulta/i })).not.toBeInTheDocument()
        })

        it('calls WhatsApp integration when CTA button is clicked', () => {
            render(<DoctorCard showCTA={true} />)

            const ctaButton = screen.getByRole('button', { name: /Agendar Consulta/i })
            fireEvent.click(ctaButton)

            expect(mockOpenWhatsApp).toHaveBeenCalledWith('consultation', {
                page: 'landing-page',
                section: 'doctor-card',
                userInfo: {
                    nome: 'Interessado via Doctor Card'
                }
            })
        })

        it('applies custom className', () => {
            const customClass = 'custom-doctor-card'
            const { container } = render(<DoctorCard className={customClass} />)

            expect(container.firstChild).toHaveClass(customClass)
        })
    })

    describe('Compact variant', () => {
        it('renders compact layout with essential information', () => {
            render(<DoctorCard variant="compact" />)

            // Should show doctor name and CRM in compact format
            expect(screen.getByText('Dr. Philipe Saraiva Cruz')).toBeInTheDocument()
            expect(screen.getByText('CRM 69.870')).toBeInTheDocument()
        })

        it('renders WhatsApp button when showCTA is true', () => {
            render(<DoctorCard variant="compact" showCTA={true} />)

            // Should have a WhatsApp button (icon only)
            const whatsappButton = screen.getByRole('button')
            expect(whatsappButton).toBeInTheDocument()
        })

        it('calls WhatsApp integration when compact CTA is clicked', () => {
            render(<DoctorCard variant="compact" showCTA={true} />)

            const whatsappButton = screen.getByRole('button')
            fireEvent.click(whatsappButton)

            expect(mockOpenWhatsApp).toHaveBeenCalledWith('hero', {
                page: 'landing-page',
                section: 'doctor-card-whatsapp'
            })
        })
    })

    describe('Full variant', () => {
        it('renders complete doctor information', () => {
            render(<DoctorCard variant="full" />)

            // Should show all doctor information
            expect(screen.getByText('Dr. Philipe Saraiva Cruz')).toBeInTheDocument()
            expect(screen.getByText('CRM 69.870 | Oftalmologia')).toBeInTheDocument()
            expect(screen.getByText('15+ anos de experiência')).toBeInTheDocument()
        })

        it('displays bio and credentials', () => {
            render(<DoctorCard variant="full" />)

            // Check for bio
            expect(screen.getByText(/Especialista em lentes de contato com mais de 15 anos/)).toBeInTheDocument()

            // Check for credentials section
            expect(screen.getByText('Formação e Especialização')).toBeInTheDocument()
            expect(screen.getByText('Graduação em Medicina - UFMT')).toBeInTheDocument()
            expect(screen.getByText('Residência em Oftalmologia - UNIFESP')).toBeInTheDocument()
            expect(screen.getByText('Especialização em Lentes de Contato - SBO')).toBeInTheDocument()
        })

        it('shows social proof statistics', () => {
            render(<DoctorCard variant="full" />)

            // Check for social proof section
            expect(screen.getByText('Números que Comprovam')).toBeInTheDocument()
            expect(screen.getByText('5000+')).toBeInTheDocument()
            expect(screen.getByText('Pacientes')).toBeInTheDocument()
        })

        it('renders both CTA buttons when showCTA is true', () => {
            render(<DoctorCard variant="full" showCTA={true} />)

            expect(screen.getByRole('button', { name: /Agendar Consulta/i })).toBeInTheDocument()
            expect(screen.getByRole('button', { name: /Conversar no WhatsApp/i })).toBeInTheDocument()
        })

        it('calls correct WhatsApp integration for each button', () => {
            render(<DoctorCard variant="full" showCTA={true} />)

            // Test consultation button
            const consultationButton = screen.getByRole('button', { name: /Agendar Consulta/i })
            fireEvent.click(consultationButton)

            expect(mockOpenWhatsApp).toHaveBeenCalledWith('consultation', {
                page: 'landing-page',
                section: 'doctor-card',
                userInfo: {
                    nome: 'Interessado via Doctor Card'
                }
            })

            // Test WhatsApp button
            const whatsappButton = screen.getByRole('button', { name: /Conversar no WhatsApp/i })
            fireEvent.click(whatsappButton)

            expect(mockOpenWhatsApp).toHaveBeenCalledWith('hero', {
                page: 'landing-page',
                section: 'doctor-card-whatsapp'
            })
        })
    })

    describe('Accessibility', () => {
        it('has proper button accessibility', () => {
            render(<DoctorCard showCTA={true} />)

            const ctaButton = screen.getByRole('button', { name: /Agendar Consulta/i })
            expect(ctaButton).toBeInTheDocument()
            expect(ctaButton).toHaveAttribute('type', 'button')
        })

        it('has proper heading structure in full variant', () => {
            render(<DoctorCard variant="full" />)

            // Should have proper headings
            expect(screen.getByRole('heading', { name: /Dr. Philipe Saraiva Cruz/i })).toBeInTheDocument()
            expect(screen.getByRole('heading', { name: /Formação e Especialização/i })).toBeInTheDocument()
            expect(screen.getByRole('heading', { name: /Números que Comprovam/i })).toBeInTheDocument()
        })
    })

    describe('Visual states', () => {
        it('applies hover effects and transitions', () => {
            const { container } = render(<DoctorCard />)

            // Hero variant should have transform hover effect
            expect(container.firstChild).toHaveClass('transform', 'hover:scale-105', 'transition-all')
        })

        it('shows verification badge', () => {
            const { container } = render(<DoctorCard />)

            // Should have verification badge (Award icon)
            const verificationBadge = container.querySelector('.bg-green-500')
            expect(verificationBadge).toBeInTheDocument()
        })
    })
})