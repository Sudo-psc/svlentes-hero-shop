/**
 * Schema.org Structured Data for SEO
 * Medical Business, Physician, Organization, FAQPage, LocalBusiness
 */
import { doctorInfo, clinicInfo } from '@/data/doctor-info'
/**
 * Organization Schema
 */
export const organizationSchema = {
  '@context': 'https://schema.org',
  '@type': 'Organization',
  name: 'SV Lentes - Saraiva Vision',
  alternateName: 'Saraiva Vision Care LTDA',
  url: 'https://svlentes.com.br',
  logo: 'https://svlentes.com.br/icones/logosv.webp',
  description: 'Pioneiro no Brasil em assinatura de lentes de contato com acompanhamento médico especializado',
  foundingDate: '2010',
  email: clinicInfo.contact.email,
  telephone: clinicInfo.contact.phone,
  address: {
    '@type': 'PostalAddress',
    streetAddress: clinicInfo.address.street,
    addressLocality: clinicInfo.address.city,
    addressRegion: clinicInfo.address.state,
    postalCode: clinicInfo.address.zipCode,
    addressCountry: 'BR'
  },
  sameAs: [
    'https://www.instagram.com/saraiva_vision',
    'https://saraivavision.com.br'
  ],
  contactPoint: {
    '@type': 'ContactPoint',
    telephone: clinicInfo.contact.phone,
    contactType: 'customer service',
    availableLanguage: 'Portuguese',
    areaServed: 'BR'
  }
}
/**
 * Medical Business Schema
 */
export const medicalBusinessSchema = {
  '@context': 'https://schema.org',
  '@type': 'MedicalBusiness',
  '@id': 'https://svlentes.com.br/#medicalbusiness',
  name: 'SV Lentes - Clínica Oftalmológica',
  image: 'https://svlentes.com.br/icones/logosv.webp',
  priceRange: 'R$ 99 - R$ 249',
  telephone: clinicInfo.contact.phone,
  email: clinicInfo.contact.email,
  url: 'https://svlentes.com.br',
  address: {
    '@type': 'PostalAddress',
    streetAddress: clinicInfo.address.street,
    addressLocality: clinicInfo.address.city,
    addressRegion: clinicInfo.address.state,
    postalCode: clinicInfo.address.zipCode,
    addressCountry: 'BR'
  },
  geo: {
    '@type': 'GeoCoordinates',
    latitude: -19.7898,
    longitude: -42.1395
  },
  openingHoursSpecification: [
    {
      '@type': 'OpeningHoursSpecification',
      dayOfWeek: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
      opens: '08:00',
      closes: '18:00'
    },
    {
      '@type': 'OpeningHoursSpecification',
      dayOfWeek: 'Saturday',
      opens: '08:00',
      closes: '12:00'
    }
  ],
  hasOfferCatalog: {
    '@type': 'OfferCatalog',
    name: 'Planos de Assinatura de Lentes de Contato',
    itemListElement: [
      {
        '@type': 'Offer',
        itemOffered: {
          '@type': 'Product',
          name: 'Plano Básico - Lentes Mensais',
          description: '1 par de lentes mensais + acompanhamento médico'
        },
        price: '99.00',
        priceCurrency: 'BRL'
      },
      {
        '@type': 'Offer',
        itemOffered: {
          '@type': 'Product',
          name: 'Plano Plus - Lentes Quinzenais',
          description: '2 pares de lentes quinzenais + acompanhamento médico + solução'
        },
        price: '149.00',
        priceCurrency: 'BRL'
      },
      {
        '@type': 'Offer',
        itemOffered: {
          '@type': 'Product',
          name: 'Plano Premium - Lentes Diárias',
          description: 'Lentes diárias (caixa mensal) + acompanhamento médico + solução + lágrimas'
        },
        price: '249.00',
        priceCurrency: 'BRL'
      }
    ]
  }
}
/**
 * Physician Schema - Dr. Philipe Saraiva Cruz
 */
export const physicianSchema = {
  '@context': 'https://schema.org',
  '@type': 'Physician',
  '@id': 'https://svlentes.com.br/#physician',
  name: doctorInfo.name,
  image: 'https://svlentes.com.br/icones/drphilipe_perfil.jpeg',
  jobTitle: 'Oftalmologista',
  description: `${doctorInfo.specialty} com ${doctorInfo.experience}`,
  alumniOf: {
    '@type': 'EducationalOrganization',
    name: 'Faculdade de Medicina de Jundiaí'
  },
  memberOf: {
    '@type': 'Organization',
    name: 'Sociedade Brasileira de Oftalmologia'
  },
  medicalSpecialty: 'Ophthalmology',
  identifier: {
    '@type': 'PropertyValue',
    propertyID: 'CRM-MG',
    value: '69870'
  },
  worksFor: {
    '@type': 'MedicalBusiness',
    name: 'SV Lentes - Saraiva Vision',
    address: {
      '@type': 'PostalAddress',
      streetAddress: clinicInfo.address.street,
      addressLocality: clinicInfo.address.city,
      addressRegion: clinicInfo.address.state,
      postalCode: clinicInfo.address.zipCode,
      addressCountry: 'BR'
    }
  }
}
/**
 * FAQ Page Schema
 */
export const faqPageSchema = {
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: [
    {
      '@type': 'Question',
      name: 'Como funciona a assinatura de lentes de contato?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'A assinatura SV Lentes entrega suas lentes de contato mensalmente em casa, com acompanhamento médico especializado incluído. Você escolhe o plano ideal, recebe suas lentes automaticamente e tem consultas regulares com oftalmologista.'
      }
    },
    {
      '@type': 'Question',
      name: 'Quanto custa a assinatura de lentes de contato?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Os planos começam a partir de R$ 99,00/mês (Plano Básico com lentes mensais), R$ 149,00/mês (Plano Plus com lentes quinzenais) e R$ 249,00/mês (Plano Premium com lentes diárias). Todos incluem acompanhamento médico.'
      }
    },
    {
      '@type': 'Question',
      name: 'O acompanhamento médico está incluído?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Sim! O Dr. Philipe Saraiva Cruz (CRM 69.870) realiza consultas regulares conforme seu plano, além de estar disponível para teleorientação. Você tem acesso a um especialista em oftalmologia sempre que precisar.'
      }
    },
    {
      '@type': 'Question',
      name: 'Posso cancelar a assinatura quando quiser?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Sim, você pode cancelar sua assinatura a qualquer momento sem multas ou taxas adicionais. Basta entrar em contato conosco pelo WhatsApp ou e-mail com 30 dias de antecedência.'
      }
    },
    {
      '@type': 'Question',
      name: 'As lentes são aprovadas pela ANVISA?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Sim! Todas as lentes de contato fornecidas são de marcas certificadas e aprovadas pela ANVISA, garantindo sua segurança e qualidade.'
      }
    },
    {
      '@type': 'Question',
      name: 'Para qual região vocês atendem?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Atendemos todo o Brasil com frete grátis. Nossa clínica física fica em Caratinga/MG, mas oferecemos teleorientação e consultas presenciais para clientes de qualquer região.'
      }
    },
    {
      '@type': 'Question',
      name: 'Qual a economia com a assinatura?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Em média, nossos clientes economizam 40% comparado à compra avulsa de lentes. Além disso, você economiza tempo (12 horas por ano sem ir à ótica) e tem a comodidade de receber em casa.'
      }
    }
  ]
}
/**
 * Local Business Schema
 */
export const localBusinessSchema = {
  '@context': 'https://schema.org',
  '@type': 'LocalBusiness',
  '@id': 'https://svlentes.com.br/#localbusiness',
  name: 'SV Lentes - Saraiva Vision',
  image: 'https://svlentes.com.br/icones/logosv.webp',
  telephone: clinicInfo.contact.phone,
  email: clinicInfo.contact.email,
  address: {
    '@type': 'PostalAddress',
    streetAddress: clinicInfo.address.street,
    addressLocality: clinicInfo.address.city,
    addressRegion: clinicInfo.address.state,
    postalCode: clinicInfo.address.zipCode,
    addressCountry: 'BR'
  },
  geo: {
    '@type': 'GeoCoordinates',
    latitude: -19.7898,
    longitude: -42.1395
  },
  url: 'https://svlentes.com.br',
  priceRange: 'R$ 99 - R$ 249',
  openingHoursSpecification: [
    {
      '@type': 'OpeningHoursSpecification',
      dayOfWeek: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
      opens: '08:00',
      closes: '18:00'
    },
    {
      '@type': 'OpeningHoursSpecification',
      dayOfWeek: 'Saturday',
      opens: '08:00',
      closes: '12:00'
    }
  ],
  aggregateRating: {
    '@type': 'AggregateRating',
    ratingValue: '4.9',
    ratingCount: '127',
    bestRating: '5',
    worstRating: '1'
  },
  review: [
    {
      '@type': 'Review',
      author: {
        '@type': 'Person',
        name: 'Maria Silva'
      },
      reviewRating: {
        '@type': 'Rating',
        ratingValue: '5',
        bestRating: '5'
      },
      reviewBody: 'Excelente serviço! Nunca mais precisei me preocupar com lentes. O acompanhamento médico é impecável.'
    }
  ]
}
/**
 * Combined schema for all types
 */
export const allSchemas = [
  organizationSchema,
  medicalBusinessSchema,
  physicianSchema,
  faqPageSchema,
  localBusinessSchema
]