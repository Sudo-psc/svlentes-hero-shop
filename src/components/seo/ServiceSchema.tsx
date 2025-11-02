import { doctorInfo, clinicInfo } from '@/data/doctor-info'

/**
 * Schema.org Service structured data for SVLentes subscription service
 * Optimized for search engines and LLM indexing
 *
 * NOTE: Pricing reflects actual Stripe plans, NOT hardcoded pricingPlans data
 */
export function ServiceSchema() {
  // Correct pricing from Stripe - DO NOT use hardcoded pricingPlans
  const stripePlans = [
    { id: "basico-mensal", nome: "Plano Básico Online - Mensal", descricao: "Plano essencial para uso regular", precoMensal: 129.99, cicloPagamento: "monthly", tipoLente: "Asféricas" },
    { id: "basico-anual", nome: "Plano Básico Online - Anual", descricao: "Plano essencial com economia anual", precoMensal: 99.92, precoTotal: 1199.00, cicloPagamento: "yearly", tipoLente: "Asféricas" },
    { id: "padrao-mensal", nome: "Plano Padrão Online - Mensal", descricao: "Plano intermediário com benefícios completos", precoMensal: 179.99, cicloPagamento: "monthly", tipoLente: "Asféricas Premium" },
    { id: "padrao-anual", nome: "Plano Padrão Online - Anual", descricao: "Plano intermediário com economia anual", precoMensal: 139.08, precoTotal: 1668.90, cicloPagamento: "yearly", tipoLente: "Asféricas Premium" },
    { id: "premium-mensal", nome: "Plano Premium Online - Mensal", descricao: "Plano completo com todos os benefícios VIP", precoMensal: 229.99, cicloPagamento: "monthly", tipoLente: "Asféricas Premium Plus" },
    { id: "premium-anual", nome: "Plano Premium Online - Anual", descricao: "Plano completo com máxima economia", precoMensal: 189.00, precoTotal: 2268.00, cicloPagamento: "yearly", tipoLente: "Asféricas Premium Plus" }
  ]

  const schema = {
    "@context": "https://schema.org",
    "@type": "Service",
    "serviceType": "Assinatura de Lentes de Contato com Acompanhamento Médico",
    "name": "SVLentes - Assinatura de Lentes de Contato",
    "description": "Serviço pioneiro no Brasil de assinatura de lentes de contato com acompanhamento médico oftalmológico. Entrega automática mensal em todo o Brasil.",
    "provider": {
      "@type": "MedicalBusiness",
      "name": clinicInfo.name,
      "alternateName": clinicInfo.fullName,
      "url": "https://svlentes.com.br",
      "logo": "https://svlentes.com.br/logo.png",
      "image": "https://svlentes.com.br/HEro.png",
      "telephone": clinicInfo.contact.phone,
      "email": clinicInfo.contact.email,
      "address": {
        "@type": "PostalAddress",
        "streetAddress": clinicInfo.address.street,
        "addressLocality": clinicInfo.address.city,
        "addressRegion": clinicInfo.address.state,
        "postalCode": clinicInfo.address.zipCode,
        "addressCountry": clinicInfo.address.country
      },
      "medicalSpecialty": "Ophthalmology",
      "physician": {
        "@type": "Physician",
        "name": doctorInfo.name,
        "medicalSpecialty": "Ophthalmology",
        "identifier": doctorInfo.crm
      }
    },
    "areaServed": {
      "@type": "Country",
      "name": "Brasil"
    },
    "availableChannel": {
      "@type": "ServiceChannel",
      "serviceUrl": "https://svlentes.com.br",
      "serviceSmsNumber": clinicInfo.contact.whatsapp,
      "servicePhone": clinicInfo.contact.phone
    },
    "category": "Medical Service",
    "offers": stripePlans.map(plan => ({
        "@type": "Offer",
        "name": plan.nome,
        "description": plan.descricao,
        "price": plan.precoMensal.toFixed(2),
        "priceCurrency": "BRL",
        "priceSpecification": {
          "@type": "UnitPriceSpecification",
          "price": plan.precoMensal.toFixed(2),
          "priceCurrency": "BRL",
          "unitText": plan.cicloPagamento === 'monthly' ? "por mês" : "por mês (cobrado anualmente)"
        },
        "availability": "https://schema.org/InStock",
        "itemCondition": "https://schema.org/NewCondition",
        "eligibleRegion": {
          "@type": "Country",
          "name": "Brasil"
        },
        "additionalProperty": [
          {
            "@type": "PropertyValue",
            "name": "Tipo de Lente",
            "value": plan.tipoLente
          },
          {
            "@type": "PropertyValue",
            "name": "Ciclo de Pagamento",
            "value": plan.cicloPagamento
          }
        ]
      })),
    "termsOfService": "https://svlentes.com.br/termos-uso",
    "hasCertification": {
      "@type": "Certification",
      "certificationIdentification": "ANVISA - Agência Nacional de Vigilância Sanitária",
      "about": "Lentes de contato certificadas pela ANVISA"
    },
    "audience": {
      "@type": "MedicalAudience",
      "audienceType": "Pacientes que necessitam de lentes de contato com acompanhamento médico"
    }
  }

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema, null, 0) }}
    />
  )
}
