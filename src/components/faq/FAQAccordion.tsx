'use client'

import { useState } from 'react'
import { ChevronDown } from 'lucide-react'

interface FAQ {
  id: string
  question: string
  answer: string
}

interface FAQAccordionProps {
  faqs: FAQ[]
}

export function FAQAccordion({ faqs }: FAQAccordionProps) {
  const [openIndex, setOpenIndex] = useState<number | null>(null)

  const toggleFAQ = (index: number) => {
    setOpenIndex(openIndex === index ? null : index)
  }

  return (
    <div className="space-y-4">
      {faqs.map((faq, index) => (
        <div
          key={faq.id}
          className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden transition-all duration-200 hover:shadow-md"
        >
          <button
            onClick={() => toggleFAQ(index)}
            className="w-full text-left px-6 py-4 flex items-start justify-between gap-4 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:ring-offset-2"
            aria-expanded={openIndex === index}
          >
            <h2 className="text-lg font-semibold text-gray-900 flex-1">
              {faq.question}
            </h2>
            <ChevronDown
              className={`w-5 h-5 text-cyan-600 flex-shrink-0 transition-transform duration-200 ${
                openIndex === index ? 'transform rotate-180' : ''
              }`}
            />
          </button>

          {openIndex === index && (
            <div className="px-6 pb-4 pt-2">
              <p className="text-gray-700 leading-relaxed">{faq.answer}</p>
            </div>
          )}
        </div>
      ))}
    </div>
  )
}
