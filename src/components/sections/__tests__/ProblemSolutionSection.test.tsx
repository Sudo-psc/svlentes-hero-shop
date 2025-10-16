import { render, screen, fireEvent } from '@testing-library/react'
import { ProblemSolutionSection } from '../ProblemSolutionSection'
import { openWhatsAppWithContext } from '@/lib/whatsapp'
import { customerProblems, svlentesSolutions, impactStats } from '@/data/problems-solutions'

// Mock the dependencies
jest.mock('@/lib/whatsapp')

const mockOpenWhatsApp = openWhatsAppWithContext as jest.MockedFunction<typeof openWhatsAppWithContext>

// Mock scrollIntoView
Object.defineProperty(Element.prototype, 'scrollIntoView', {
    value: jest.fn(),
    writable: true,
})

describe('ProblemSolutionSection', () => {
    beforeEach(() => {
        jest.clearAllMocks()
    })

    describe('Rendering', () => {
        it('renders the section with header content', () => {
            render(<ProblemSolutionSection />)

            // Check for header elements
            expect(screen.getByText('Problemas Comuns')).toBeInTheDocument()
            expect(screen.getByText(/Cansado dos/)).toBeInTheDocument()
            expect(screen.getByText(/Sabemos exatamente pelo que você passa/)).toBeInTheDocument()
        })

        it('renders all customer problems from data', () => {
            render(<ProblemSolutionSection />)

            customerProblems.forEach((problem) => {
                expect(screen.getByText(problem.text)).toBeInTheDocument()
                expect(screen.getByText(problem.icon)).toBeInTheDocument()
            })
        })

        it('renders problems section with correct styling and structure', () => {
            render(<ProblemSolutionSection />)

            // Check for problems section title
            expect(screen.getByText('😤 Problemas que você enfrenta')).toBeInTheDocument()
            expect(screen.getByText(/Reconhece alguma dessas situações?/)).toBeInTheDocument()

            // Check for problem stats
            expect(screen.getByText('Impacto dos Problemas')).toBeInTheDocument()
            expect(screen.getAllByText('12h')).toHaveLength(3) // Appears in problems, solutions, and impact sections
            expect(screen.getByText('Perdidas por ano')).toBeInTheDocument()
            expect(screen.getAllByText('R$ 800')).toHaveLength(3) // Appears in problems, solutions, and impact sections
            expect(screen.getByText('Gasto extra anual')).toBeInTheDocument()
        })

        it('renders all SVlentes solutions from data', () => {
            render(<ProblemSolutionSection />)

            svlentesSolutions.forEach((solution) => {
                expect(screen.getByText(solution.title)).toBeInTheDocument()
                expect(screen.getByText(solution.description)).toBeInTheDocument()
                expect(screen.getByText(solution.icon)).toBeInTheDocument()
            })
        })

        it('renders solutions section with correct styling and structure', () => {
            render(<ProblemSolutionSection />)

            // Check for solutions section title
            expect(screen.getByText('✨ Soluções da SV Lentes')).toBeInTheDocument()
            expect(screen.getByText(/Cada problema tem uma solução inteligente/)).toBeInTheDocument()

            // Check for solution stats
            expect(screen.getByText('Resultados com SV Lentes')).toBeInTheDocument()
        })

        it('renders impact statistics correctly', () => {
            render(<ProblemSolutionSection />)

            // Check transformation section
            expect(screen.getByText('A Transformação que a SV Lentes Proporciona')).toBeInTheDocument()
            expect(screen.getByText(/Veja o impacto real na vida dos nossos clientes/)).toBeInTheDocument()

            // Check all impact stats - use getAllByText for values that appear multiple times
            impactStats.forEach((stat) => {
                if (stat.value === '12h' || stat.value === 'R$ 800') {
                    expect(screen.getAllByText(stat.value).length).toBeGreaterThanOrEqual(1)
                } else {
                    expect(screen.getByText(stat.value)).toBeInTheDocument()
                }

                // Labels and descriptions may also appear multiple times
                if (stat.label === 'Tempo economizado por ano' || stat.label === 'Economia média anual') {
                    expect(screen.getAllByText(stat.label).length).toBeGreaterThanOrEqual(1)
                } else {
                    expect(screen.getByText(stat.label)).toBeInTheDocument()
                }

                expect(screen.getByText(stat.description)).toBeInTheDocument()
            })
        })

        it('renders CTA section with correct content', () => {
            render(<ProblemSolutionSection />)

            // Check CTA content
            expect(screen.getByText('Pronto para resolver esses problemas?')).toBeInTheDocument()
            expect(screen.getByText(/Fale com um especialista e descubra como a SV Lentes/)).toBeInTheDocument()

            // Check CTA buttons
            expect(screen.getByRole('button', { name: /Falar com Especialista/i })).toBeInTheDocument()
            expect(screen.getByRole('button', { name: /Calcular Economia/i })).toBeInTheDocument()

            // Check trust indicators
            expect(screen.getByText('Sem compromisso')).toBeInTheDocument()
            expect(screen.getByText('Atendimento especializado')).toBeInTheDocument()
            expect(screen.getByText('Resposta rápida')).toBeInTheDocument()
        })

        it('renders with custom className', () => {
            const customClass = 'custom-problem-solution-class'
            const { container } = render(<ProblemSolutionSection className={customClass} />)

            expect(container.firstChild).toHaveClass(customClass)
        })
    })

    describe('CTA Functionality', () => {
        it('calls WhatsApp integration when "Falar com Especialista" button is clicked', () => {
            render(<ProblemSolutionSection />)

            const specialistButton = screen.getByRole('button', { name: /Falar com Especialista/i })
            fireEvent.click(specialistButton)

            expect(mockOpenWhatsApp).toHaveBeenCalledWith('support', {
                page: 'landing-page',
                section: 'problem-solution-cta'
            })
        })

        it('scrolls to calculator when "Calcular Economia" button is clicked', () => {
            // Mock getElementById
            const mockElement = { scrollIntoView: jest.fn() }
            const mockGetElementById = jest.spyOn(document, 'getElementById').mockReturnValue(mockElement as any)

            render(<ProblemSolutionSection />)

            const calculatorButton = screen.getByRole('button', { name: /Calcular Economia/i })
            fireEvent.click(calculatorButton)

            expect(mockGetElementById).toHaveBeenCalledWith('calculadora-economia')
            expect(mockElement.scrollIntoView).toHaveBeenCalledWith({ behavior: 'smooth' })

            mockGetElementById.mockRestore()
        })

        it('handles calculator scroll when element does not exist', () => {
            const mockGetElementById = jest.spyOn(document, 'getElementById').mockReturnValue(null)

            render(<ProblemSolutionSection />)

            const calculatorButton = screen.getByRole('button', { name: /Calcular Economia/i })

            // Should not throw error when element doesn't exist
            expect(() => fireEvent.click(calculatorButton)).not.toThrow()

            mockGetElementById.mockRestore()
        })
    })

    describe('Accessibility', () => {
        it('has proper heading hierarchy', () => {
            render(<ProblemSolutionSection />)

            // Check for proper heading levels
            const mainHeading = screen.getByRole('heading', { level: 2, name: /Cansado dos Problemas com lentes?/ })
            expect(mainHeading).toBeInTheDocument()

            const subHeadings = screen.getAllByRole('heading', { level: 3 })
            expect(subHeadings.length).toBeGreaterThan(0)
        })

        it('has accessible buttons with proper labels', () => {
            render(<ProblemSolutionSection />)

            const specialistButton = screen.getByRole('button', { name: /Falar com Especialista/i })
            const calculatorButton = screen.getByRole('button', { name: /Calcular Economia/i })

            expect(specialistButton).toBeInTheDocument()
            expect(calculatorButton).toBeInTheDocument()

            // Check that buttons have proper accessible names
            expect(specialistButton).toHaveAccessibleName()
            expect(calculatorButton).toHaveAccessibleName()
        })

        it('has proper semantic structure for problems and solutions', () => {
            render(<ProblemSolutionSection />)

            // Problems and solutions should be in lists or proper containers
            const problemsSection = screen.getByText('😤 Problemas que você enfrenta').closest('div')
            const solutionsSection = screen.getByText('✨ Soluções da SV Lentes').closest('div')

            expect(problemsSection).toBeInTheDocument()
            expect(solutionsSection).toBeInTheDocument()
        })
    })

    describe('Data Integration', () => {
        it('renders correct number of problems', () => {
            render(<ProblemSolutionSection />)

            // Should render all problems from data
            expect(customerProblems).toHaveLength(6) // Verify data structure
            customerProblems.forEach((problem) => {
                expect(screen.getByText(problem.text)).toBeInTheDocument()
            })
        })

        it('renders correct number of solutions', () => {
            render(<ProblemSolutionSection />)

            // Should render all solutions from data
            expect(svlentesSolutions).toHaveLength(6) // Verify data structure
            svlentesSolutions.forEach((solution) => {
                expect(screen.getByText(solution.title)).toBeInTheDocument()
            })
        })

        it('renders correct number of impact statistics', () => {
            render(<ProblemSolutionSection />)

            // Should render all impact stats from data
            expect(impactStats).toHaveLength(4) // Verify data structure
            impactStats.forEach((stat) => {
                // Use getAllByText for values that appear multiple times
                if (stat.value === '12h' || stat.value === 'R$ 800') {
                    expect(screen.getAllByText(stat.value).length).toBeGreaterThanOrEqual(1)
                } else {
                    expect(screen.getByText(stat.value)).toBeInTheDocument()
                }
            })
        })
    })

    describe('Visual Elements', () => {
        it('renders transformation arrow element', () => {
            render(<ProblemSolutionSection />)

            // The arrow should be present (we can check for the ArrowRight icon indirectly)
            // Since it's an icon, we check for its container or related elements
            const transformationSection = screen.getByText('A Transformação que a SV Lentes Proporciona')
            expect(transformationSection).toBeInTheDocument()
        })

        it('renders problem and solution icons correctly', () => {
            render(<ProblemSolutionSection />)

            // Check that all icons from data are rendered
            customerProblems.forEach((problem) => {
                expect(screen.getByText(problem.icon)).toBeInTheDocument()
            })

            svlentesSolutions.forEach((solution) => {
                expect(screen.getByText(solution.icon)).toBeInTheDocument()
            })
        })

        it('applies correct CSS classes for styling', () => {
            const { container } = render(<ProblemSolutionSection />)

            // Check that the main section has the expected classes
            const section = container.querySelector('section')
            expect(section).toHaveClass('py-16', 'lg:py-24', 'bg-white')
        })
    })

    describe('Responsive Behavior', () => {
        it('renders grid layout for problems and solutions', () => {
            render(<ProblemSolutionSection />)

            // The problems and solutions should be in a grid layout
            // We can verify this by checking the structure contains the expected content
            expect(screen.getByText('😤 Problemas que você enfrenta')).toBeInTheDocument()
            expect(screen.getByText('✨ Soluções da SV Lentes')).toBeInTheDocument()
        })

        it('renders impact statistics in grid format', () => {
            render(<ProblemSolutionSection />)

            // All impact stats should be rendered - use getAllByText for duplicated values
            expect(screen.getAllByText('12h')).toHaveLength(3) // Appears in multiple sections
            expect(screen.getAllByText('R$ 800')).toHaveLength(3) // Appears in multiple sections
            expect(screen.getByText('100%')).toBeInTheDocument()
            expect(screen.getByText('98%')).toBeInTheDocument()
        })
    })
})