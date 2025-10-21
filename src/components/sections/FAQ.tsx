'use client'
import React, { useCallback, useMemo } from 'react'
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion'
import { featuredFAQ } from '@/data/faq-data'
import { FAQProps } from '@/types/wireframe'
import { trackEvent } from '@/lib/analytics'
interface FAQSectionProps {
    className?: string
}
export default function FAQ({ className }: FAQSectionProps) {
    const faqProps: FAQProps = useMemo(
        () => ({
            items: featuredFAQ,
            layout: 'accordion',
            numbering: true,
        }),
        []
    )
    const handleFAQClick = useCallback((questionId: string, questionText: string, position: number) => {
        trackEvent('faq_opened', {
            question_id: questionId,
            question_text: questionText,
            section_position: position,
        })
    }, [])
    const structuredData = useMemo(
        () => ({
            '@context': 'https://schema.org',
            '@type': 'FAQPage',
            mainEntity: faqProps.items.map((item) => ({
                '@type': 'Question',
                name: item.question,
                acceptedAnswer: {
                    '@type': 'Answer',
                    text: item.answer,
                },
            })),
        }),
        [faqProps.items]
    )
    return (
        <section
            className={`py-16 lg:py-24 bg-white ${className || ''}`}
        >
            {/* Structured Data for SEO */}
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
            />
            <div className="container mx-auto px-4 max-w-4xl">
                {/* Section Header */}
                <div className="text-center mb-12">
                    <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
                        Perguntas Frequentes
                    </h2>
                    <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                        Tire suas dúvidas sobre nosso serviço de assinatura de lentes com acompanhamento médico
                    </p>
                </div>
                {/* FAQ Accordion */}
                <div className="max-w-3xl mx-auto">
                    <Accordion type="single" collapsible className="space-y-4">
                        {faqProps.items.map((item, index) => (
                            <AccordionItem
                                key={item.id}
                                value={item.id}
                                className="border border-gray-200 rounded-lg px-6 py-2 bg-white shadow-sm hover:shadow-md transition-shadow"
                            >
                                <AccordionTrigger
                                    className="text-left hover:no-underline py-6"
                                    onClick={() => handleFAQClick(item.id, item.question, index + 1)}
                                >
                                    <div className="flex items-start gap-4 text-left">
                                        {/* Question Number */}
                                        {faqProps.numbering && (
                                            <span className="flex-shrink-0 w-8 h-8 bg-primary-600 text-white rounded-full flex items-center justify-center text-sm font-semibold mt-1">
                                                {String(index + 1).padStart(2, '0')}
                                            </span>
                                        )}
                                        {/* Question Text */}
                                        <span className="font-semibold text-gray-900 text-base md:text-lg leading-relaxed">
                                            {item.question}
                                        </span>
                                    </div>
                                </AccordionTrigger>
                                <AccordionContent className="pt-2 pb-6">
                                    <div className={`${faqProps.numbering ? 'ml-12' : ''} text-gray-600 text-base leading-relaxed`}>
                                        {item.answer}
                                    </div>
                                </AccordionContent>
                            </AccordionItem>
                        ))}
                    </Accordion>
                </div>
                {/* Contact CTA */}
                <div className="text-center mt-12">
                    <p className="text-gray-600 mb-6">
                        Não encontrou a resposta que procurava?
                    </p>
                    <div className="flex flex-col sm:flex-row gap-4 justify-center">
                        <a
                            href="https://wa.me/+5533999898026?text=Olá! Tenho uma dúvida sobre o serviço de assinatura de lentes."
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center justify-center px-6 py-3 bg-green-600 text-white font-semibold rounded-lg hover:bg-green-700 transition-colors"
                        >
                            Falar no WhatsApp
                        </a>
                        <a
                            href="#contato"
                            className="inline-flex items-center justify-center px-6 py-3 border-2 border-primary-600 text-primary-600 font-semibold rounded-lg hover:bg-primary-600 hover:text-white transition-colors"
                        >
                            Agendar Consulta
                        </a>
                    </div>
                </div>
            </div>
        </section>
    )
}