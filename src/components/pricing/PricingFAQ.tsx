'use client';

import React from 'react';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/Accordion';
import { Card } from '@/components/ui/card';

interface FAQItem {
  id: string;
  question: string;
  answer: string;
}

interface PricingFAQProps {
  items: FAQItem[];
  title?: string;
  subtitle?: string;
}

export const PricingFAQ: React.FC<PricingFAQProps> = ({
  items,
  title = 'Perguntas Frequentes',
  subtitle = 'Tire suas dúvidas sobre nossos planos de assinatura',
}) => {
  return (
    <section className="py-16 bg-gradient-to-b from-cyan-50 to-white">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-silver-900 mb-4">
            {title}
          </h2>
          {subtitle && (
            <p className="text-lg text-silver-600 max-w-2xl mx-auto">
              {subtitle}
            </p>
          )}
        </div>

        <div className="max-w-3xl mx-auto">
          <Card className="p-6 shadow-lg">
            <Accordion type="single" collapsible className="w-full">
              {items.map((item, index) => (
                <AccordionItem key={item.id} value={item.id}>
                  <AccordionTrigger className="text-left hover:text-cyan-600 transition-colors">
                    <span className="flex items-start gap-3">
                      <span className="flex-shrink-0 w-6 h-6 rounded-full bg-cyan-100 text-cyan-600 text-sm font-bold flex items-center justify-center">
                        {index + 1}
                      </span>
                      <span className="font-semibold">{item.question}</span>
                    </span>
                  </AccordionTrigger>
                  <AccordionContent className="text-silver-700 leading-relaxed pl-9">
                    {item.answer}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </Card>

          {/* Additional help CTA */}
          <div className="mt-8 text-center">
            <p className="text-silver-600 mb-4">
              Ainda tem dúvidas?
            </p>
            <a
              href="https://wa.me/5533998980026"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 text-cyan-600 hover:text-cyan-700 font-semibold"
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
              </svg>
              Fale conosco no WhatsApp
            </a>
          </div>
        </div>
      </div>
    </section>
  );
};

export default PricingFAQ;
