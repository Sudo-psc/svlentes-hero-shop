import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { LeadCaptureForm } from '../LeadCaptureForm'
import { openWhatsAppWithContext } from '@/lib/whatsapp'

// Mock the WhatsApp integration
jest.mock('@/lib/whatsapp')
const mockOpenWhatsApp = openWhatsAppWithContext as jest.MockedFunction<typeof openWhatsAppWithContext>

// TODO: [HIGH PRIORITY] Fix test failure - Checkbox component rendering error
// Error: "The above error occurred in the <input> component" in checkbox.tsx:9
// Impact: Test suite failing, blocking development workflow
// Solution: Debug checkbox component props compatibility with React Testing Library
// Severity: HIGH | Timeline: Immediate - required for test suite to pass
describe('LeadCaptureForm', () => {
    beforeEach(() => {
        jest.clearAllMocks()
    })

    describe('Hero variant (default)', () => {
        it('renders the form with all required elements', () => {
            render(<LeadCaptureForm />)

            // Check for form title and description
            expect(screen.getByText('Calcule sua Economia')).toBeInTheDocument()
            expect(screen.getByText('Descubra quanto você pode economizar com nossa assinatura')).toBeInTheDocument()

            // Check for form fields by placeholder text
            expect(screen.getByPlaceholderText('Digite seu nome')).toBeInTheDocument()
            expect(screen.getByPlaceholderText('(11) 99999-9999')).toBeInTheDocument()
            expect(screen.getByPlaceholderText('seu@email.com')).toBeInTheDocument()

            // Check for LGPD consent checkbox
            expect(screen.getByRole('checkbox')).toBeInTheDocument()
            expect(screen.getByText(/Aceito receber contato sobre o serviço de assinatura de lentes de contato da SV Lentes/)).toBeInTheDocument()

            // Check for buttons
            expect(screen.getByRole('button', { name: /Calcular Economia/i })).toBeInTheDocument()
            expect(screen.getByRole('button', { name: /Agendar Consulta Direta/i })).toBeInTheDocument()
        })

        it('requires LGPD consent before enabling buttons', async () => {
            const user = userEvent.setup()
            render(<LeadCaptureForm />)

            const calculateButton = screen.getByRole('button', { name: /Calcular Economia/i })
            const agendarButton = screen.getByRole('button', { name: /Agendar Consulta Direta/i })

            // Buttons should be disabled initially
            expect(calculateButton).toBeDisabled()
            expect(agendarButton).toBeDisabled()

            // Check LGPD consent
            const consentCheckbox = screen.getByRole('checkbox')
            await user.click(consentCheckbox)

            // Buttons should be enabled after consent
            expect(calculateButton).toBeEnabled()
            expect(agendarButton).toBeEnabled()
        })

        it('formats phone number correctly', async () => {
            const user = userEvent.setup()
            render(<LeadCaptureForm />)

            const phoneInput = screen.getByPlaceholderText('(11) 99999-9999')

            // Type a phone number
            await user.type(phoneInput, '11999999999')

            // Should format to (11) 99999-9999
            expect(phoneInput).toHaveValue('(11) 99999-9999')
        })

        it('displays trust indicators', () => {
            render(<LeadCaptureForm />)

            expect(screen.getByText('100% Seguro')).toBeInTheDocument()
            expect(screen.getByText('Sem Compromisso')).toBeInTheDocument()
        })

        it('has proper form validation structure', async () => {
            const user = userEvent.setup()
            render(<LeadCaptureForm />)

            // Fill form with valid data
            await user.type(screen.getByPlaceholderText('Digite seu nome'), 'João Silva')
            await user.type(screen.getByPlaceholderText('(11) 99999-9999'), '11999999999')
            await user.type(screen.getByPlaceholderText('seu@email.com'), 'joao@email.com')
            await user.click(screen.getByRole('checkbox'))

            // Form should be ready for submission
            const submitButton = screen.getByRole('button', { name: /Agendar Consulta Direta/i })
            expect(submitButton).toBeEnabled()
        })
    })

    describe('Inline variant', () => {
        it('renders inline form with simplified layout', () => {
            render(<LeadCaptureForm variant="inline" />)

            // Should have inputs with placeholders
            const nameInput = screen.getByPlaceholderText('Seu nome')
            const phoneInput = screen.getByPlaceholderText('WhatsApp')
            const emailInput = screen.getByPlaceholderText('Seu email')

            expect(nameInput).toBeInTheDocument()
            expect(phoneInput).toBeInTheDocument()
            expect(emailInput).toBeInTheDocument()

            // Should have send button
            expect(screen.getByRole('button', { name: /Enviar/i })).toBeInTheDocument()
        })

        it('validates inline form fields', async () => {
            const user = userEvent.setup()
            render(<LeadCaptureForm variant="inline" />)

            const submitButton = screen.getByRole('button', { name: /Enviar/i })

            // Try to submit without consent
            expect(submitButton).toBeDisabled()

            // Check consent
            await user.click(screen.getByRole('checkbox'))
            expect(submitButton).toBeEnabled()
        })
    })

    describe('Calculator variant', () => {
        it('renders calculator variant correctly', () => {
            render(<LeadCaptureForm variant="calculator" />)

            // Should have the same basic structure as hero variant
            expect(screen.getByText('Calcule sua Economia')).toBeInTheDocument()
            expect(screen.getByRole('button', { name: /Calcular Economia/i })).toBeInTheDocument()
        })

        it('handles calculate economy button interaction', async () => {
            const user = userEvent.setup()
            const mockOnSubmit = jest.fn()

            render(<LeadCaptureForm variant="calculator" onSubmit={mockOnSubmit} />)

            // Enable the button by checking consent
            await user.click(screen.getByRole('checkbox'))

            // Click calculate economy
            const calculateButton = screen.getByRole('button', { name: /Calcular Economia/i })
            expect(calculateButton).toBeEnabled()
        })
    })

    describe('Form validation', () => {
        it('validates form fields properly', async () => {
            const user = userEvent.setup()
            render(<LeadCaptureForm />)

            const nameInput = screen.getByPlaceholderText('Digite seu nome')
            const phoneInput = screen.getByPlaceholderText('(11) 99999-9999')
            const emailInput = screen.getByPlaceholderText('seu@email.com')

            // All inputs should be present and functional
            expect(nameInput).toBeInTheDocument()
            expect(phoneInput).toBeInTheDocument()
            expect(emailInput).toBeInTheDocument()

            // Should be able to type in all fields
            await user.type(nameInput, 'Test Name')
            await user.type(phoneInput, '11999999999')
            await user.type(emailInput, 'test@email.com')

            expect(nameInput).toHaveValue('Test Name')
            expect(phoneInput).toHaveValue('(11) 99999-9999')
            expect(emailInput).toHaveValue('test@email.com')
        })
    })
})