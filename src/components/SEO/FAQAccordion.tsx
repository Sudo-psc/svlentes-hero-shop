'use client'

import { type FC, useState } from 'react'
import { ChevronDown } from 'lucide-react'
import { cn } from '@/lib/utils'
import { type FAQItem } from './FAQSchema'

interface FAQAccordionProps {
  faqs: FAQItem[]
  className?: string
  title?: string
  subtitle?: string
}

export const FAQAccordion: FC<FAQAccordionProps> = ({
  faqs,
  className,
  title = 'Perguntas Frequentes',
  subtitle,
}) => {
  const [openIndex, setOpenIndex] = useState<number | null>(null)

  const toggleAccordion = (index: number) => {
    setOpenIndex(openIndex === index ? null : index)
  }

  return (
    <section className={cn('w-full py-12', className)}>
      <div className="container mx-auto px-4">
        {title && (
          <div className="mb-8 text-center">
            <h2 className="text-3xl font-bold text-gray-900 md:text-4xl">
              {title}
            </h2>
            {subtitle && (
              <p className="mt-3 text-lg text-gray-600">{subtitle}</p>
            )}
          </div>
        )}

        <div className="mx-auto max-w-3xl space-y-4">
          {faqs.map((faq, index) => (
            <div
              key={index}
              className="overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm transition-shadow hover:shadow-md"
            >
              <button
                onClick={() => toggleAccordion(index)}
                className="flex w-full items-center justify-between gap-4 p-5 text-left transition-colors hover:bg-gray-50"
                aria-expanded={openIndex === index}
                aria-controls={`faq-answer-${index}`}
              >
                <span className="text-lg font-semibold text-gray-900">
                  {faq.question}
                </span>
                <ChevronDown
                  className={cn(
                    'h-5 w-5 flex-shrink-0 text-primary transition-transform duration-200',
                    openIndex === index && 'rotate-180'
                  )}
                />
              </button>

              <div
                id={`faq-answer-${index}`}
                className={cn(
                  'overflow-hidden transition-all duration-300 ease-in-out',
                  openIndex === index
                    ? 'max-h-[1000px] opacity-100'
                    : 'max-h-0 opacity-0'
                )}
              >
                <div className="border-t border-gray-100 p-5 pt-4">
                  <p className="text-gray-700 leading-relaxed whitespace-pre-line">
                    {faq.answer}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
