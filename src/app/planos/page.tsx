'use client';

import React from 'react';
import { Badge } from '@/components/ui/Badge';
import { PricingCard } from '@/components/pricing/PricingCard';
import { CoverageSection } from '@/components/pricing/CoverageSection';
import { BenefitsGrid } from '@/components/pricing/BenefitsGrid';
import { PricingFAQ } from '@/components/pricing/PricingFAQ';
import { pricingPlans, serviceBenefits, coverageInfo, pricingFAQ } from '@/data/pricing-plans';

export default function PlanosPage() {
  // Set page metadata dynamically using Head or next/head for client components
  React.useEffect(() => {
    document.title = 'Planos de Assinatura de Lentes de Contato | SV Lentes';
  }, []);
  const presencialCoverage = coverageInfo.find((item) => item.id === 'presencial');
  const presencialLocations = Array.isArray(presencialCoverage?.locations) ? presencialCoverage.locations : [];
  const handleSaibaMais = () => {
    // Scroll to FAQ or open modal with plan details
    const faqSection = document.getElementById('faq');
    if (faqSection) {
      faqSection.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const handleAssinar = (planId: string) => {
    // Redirect to checkout or scheduling page
    window.location.href = `/agendar-consulta?plano=${planId}`;
  };

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative pt-24 pb-16 bg-gradient-to-b from-cyan-600 via-cyan-500 to-cyan-400 text-white overflow-hidden">
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 left-0 w-96 h-96 bg-white rounded-full mix-blend-overlay filter blur-3xl animate-pulse" />
          <div className="absolute bottom-0 right-0 w-96 h-96 bg-white rounded-full mix-blend-overlay filter blur-3xl animate-pulse delay-700" />
        </div>

        <div className="container mx-auto px-4 relative z-10">
          <div className="text-center max-w-4xl mx-auto">
            <Badge variant="secondary" className="mb-4 bg-white/20 text-white border-white/30 backdrop-blur-sm">
              Pioneiro no Brasil
            </Badge>

            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 leading-tight">
              Planos de Assinatura
            </h1>

            <p className="text-xl md:text-2xl text-cyan-50 mb-4 leading-relaxed">
              Escolha o Plano Ideal Para Você
            </p>

            <p className="text-lg text-cyan-100 max-w-2xl mx-auto">
              Lentes de contato com entrega regular, acompanhamento médico e economia garantida
            </p>
          </div>
        </div>

        {/* Wave decoration */}
        <div className="absolute bottom-0 left-0 right-0">
          <svg
            viewBox="0 0 1440 120"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className="w-full h-auto"
          >
            <path
              d="M0 120L60 105C120 90 240 60 360 45C480 30 600 30 720 37.5C840 45 960 60 1080 67.5C1200 75 1320 75 1380 75L1440 75V120H1380C1320 120 1200 120 1080 120C960 120 840 120 720 120C600 120 480 120 360 120C240 120 120 120 60 120H0Z"
              fill="white"
            />
          </svg>
        </div>
      </section>

      {/* Pricing Cards Section */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-3 gap-8 max-w-7xl mx-auto">
            {pricingPlans.map((plan) => (
              <PricingCard
                key={plan.id}
                id={plan.id}
                name={plan.name}
                badge={plan.badge}
                popularBadge={plan.popularBadge}
                description={plan.description || ''}
                price={plan.priceMonthly}
                installments={12}
                features={plan.features}
                highlighted={plan.recommended || false}
                onSaibaMais={handleSaibaMais}
                onAssinar={() => handleAssinar(plan.id)}
              />
            ))}
          </div>
          <div className="mt-12 rounded-3xl border border-silver-200 bg-silver-50/60 p-8 shadow-lg shadow-silver-200/40">
            <div className="flex flex-col gap-8 md:flex-row md:items-center md:justify-between">
              <div className="space-y-4 md:max-w-2xl">
                <h2 className="text-2xl font-semibold text-silver-900">Prefere atendimento presencial?</h2>
                <p className="text-base text-silver-600">
                  Conheça os planos presenciais com consulta de adaptação e acompanhamento em nossas clínicas parceiras. Escolha a cidade mais próxima e garanta um cuidado completo com sua visão.
                </p>
                {presencialLocations.length > 0 && (
                  <ul className="flex flex-wrap gap-3">
                    {presencialLocations.map((location) => (
                      <li
                        key={location}
                        className="rounded-full bg-white px-4 py-2 text-sm font-medium text-silver-600 shadow-sm"
                      >
                        {location}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
              <div className="flex w-full flex-col gap-3 md:w-auto">
                <a
                  href="/agendar-consulta?modalidade=presencial"
                  className="inline-flex items-center justify-center rounded-lg bg-cyan-600 px-6 py-3 text-base font-semibold text-white shadow-lg shadow-cyan-600/30 transition-colors hover:bg-cyan-700"
                >
                  Ver planos presenciais
                </a>
                <a
                  href="https://wa.me/5533999898026"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center rounded-lg border border-silver-300 px-6 py-3 text-base font-semibold text-cyan-600 transition-colors hover:border-cyan-200 hover:bg-cyan-50"
                >
                  Falar com especialista
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Coverage Section */}
      <CoverageSection items={coverageInfo} />

      {/* Benefits Grid */}
      <BenefitsGrid benefits={serviceBenefits} />

      {/* FAQ Section */}
      <div id="faq">
        <PricingFAQ items={pricingFAQ} />
      </div>

      {/* Final CTA Section */}
      <section className="py-16 bg-gradient-to-r from-cyan-600 to-cyan-500 text-white">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Pronto para começar?
          </h2>
          <p className="text-xl text-cyan-50 mb-8 max-w-2xl mx-auto">
            Agende sua consulta de avaliação e adaptação de lentes de contato
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a
              href="/agendar-consulta"
              className="inline-flex items-center justify-center px-8 py-4 bg-white text-cyan-600 font-semibold rounded-lg hover:bg-cyan-50 transition-colors duration-200 shadow-lg"
            >
              Agendar Consulta
            </a>
            <a
              href="https://wa.me/5533999898026"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-green-500 text-white font-semibold rounded-lg hover:bg-green-600 transition-colors duration-200 shadow-lg"
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
              </svg>
              Falar no WhatsApp
            </a>
          </div>
        </div>
      </section>
    </div>
  );
}
