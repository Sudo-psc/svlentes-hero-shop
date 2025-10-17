import { render, screen, fireEvent } from '@testing-library/react'
import FAQ from '../FAQ'
import { featuredFAQ } from '@/data/faq-data'

// Mock the structured data script
const mockStructuredData = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: featuredFAQ.map((item) => ({
        '@type': 'Question',
        name: item.question,
        acceptedAnswer: {
            '@type': 'Answer',
            text: item.answer
        }
    }))
}

describe('FAQ Component', () => {
    it('renders the FAQ section with correct title', () => {
        render(<FAQ />)

        expect(screen.getByText('Perguntas Frequentes')).toBeInTheDocument()
        expect(screen.getByText(/Tire suas dúvidas sobre nosso serviço/)).toBeInTheDocument()
    })

    it('renders all featured FAQ items with numbering', () => {
        render(<FAQ />)

        // Check if all questions are rendered
        featuredFAQ.forEach((item, index) => {
            expect(screen.getByText(item.question)).toBeInTheDocument()

            // Check numbering (01, 02, etc.)
            const numberElement = screen.getByText(String(index + 1).padStart(2, '0'))
            expect(numberElement).toBeInTheDocument()
        })
    })

    it('expands and collapses accordion items when clicked', () => {
        render(<FAQ />)

        const firstQuestion = featuredFAQ[0]
        const questionButton = screen.getByText(firstQuestion.question)

        // Initially, the answer should not be visible
        expect(screen.queryByText(firstQuestion.answer)).not.toBeInTheDocument()

        // Click to expand
        fireEvent.click(questionButton)

        // Now the answer should be visible
        expect(screen.getByText(firstQuestion.answer)).toBeInTheDocument()
    })

    it('renders contact CTAs at the bottom', () => {
        render(<FAQ />)

        expect(screen.getByText('Não encontrou a resposta que procurava?')).toBeInTheDocument()
        expect(screen.getByText('Falar no WhatsApp')).toBeInTheDocument()
        expect(screen.getByText('Agendar Consulta')).toBeInTheDocument()
    })

    it('has correct WhatsApp link with pre-filled message', () => {
        render(<FAQ />)

        const whatsappLink = screen.getByText('Falar no WhatsApp').closest('a')
        expect(whatsappLink).toHaveAttribute('href',
            'https://wa.me/+5533999898026?text=Olá! Tenho uma dúvida sobre o serviço de assinatura de lentes.'
        )
        expect(whatsappLink).toHaveAttribute('target', '_blank')
        expect(whatsappLink).toHaveAttribute('rel', 'noopener noreferrer')
    })

    it('has correct anchor link for consultation booking', () => {
        render(<FAQ />)

        const consultationLink = screen.getByText('Agendar Consulta').closest('a')
        expect(consultationLink).toHaveAttribute('href', '#contato')
    })

    it('includes structured data for SEO', () => {
        render(<FAQ />)

        const scriptElement = document.querySelector('script[type="application/ld+json"]')
        expect(scriptElement).toBeInTheDocument()

        if (scriptElement) {
            const structuredData = JSON.parse(scriptElement.textContent || '{}')
            expect(structuredData['@type']).toBe('FAQPage')
            expect(structuredData.mainEntity).toHaveLength(featuredFAQ.length)

            // Check first FAQ item structure
            expect(structuredData.mainEntity[0]['@type']).toBe('Question')
            expect(structuredData.mainEntity[0].name).toBe(featuredFAQ[0].question)
            expect(structuredData.mainEntity[0].acceptedAnswer['@type']).toBe('Answer')
            expect(structuredData.mainEntity[0].acceptedAnswer.text).toBe(featuredFAQ[0].answer)
        }
    })

    it('has correct section id for navigation', () => {
        render(<FAQ />)

        const section = document.querySelector('#perguntas-frequentes')
        expect(section).toBeInTheDocument()
    })

    it('applies responsive classes correctly', () => {
        render(<FAQ />)

        const title = screen.getByText('Perguntas Frequentes')
        expect(title).toHaveClass('text-3xl', 'md:text-4xl')

        const container = document.querySelector('.container')
        expect(container).toHaveClass('mx-auto', 'px-4', 'max-w-4xl')
    })
})