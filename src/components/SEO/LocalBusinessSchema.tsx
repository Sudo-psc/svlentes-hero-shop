'use client'

export function LocalBusinessSchema() {
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'MedicalBusiness',
    '@id': 'https://saraivavision.com.br/#organization',
    name: 'Saraiva Vision Clínica Oftalmológica',
    alternateName: 'Saraiva Vision',
    description:
      'Clínica oftalmológica especializada em cirurgia de catarata, tratamento de glaucoma e adaptação de lentes de contato.',
    url: 'https://saraivavision.com.br',
    logo: 'https://saraivavision.com.br/images/logo.png',
    image: 'https://saraivavision.com.br/images/clinica.jpg',

    telephone: '+55-XX-XXXX-XXXX',
    email: 'contato@saraivavision.com.br',

    address: {
      '@type': 'PostalAddress',
      streetAddress: '[Rua, número]',
      addressLocality: '[Cidade]',
      addressRegion: '[Estado - Sigla]',
      postalCode: '[CEP]',
      addressCountry: 'BR',
    },

    geo: {
      '@type': 'GeoCoordinates',
      latitude: 0,
      longitude: 0,
    },

    openingHoursSpecification: [
      {
        '@type': 'OpeningHoursSpecification',
        dayOfWeek: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
        opens: '08:00',
        closes: '18:00',
      },
      {
        '@type': 'OpeningHoursSpecification',
        dayOfWeek: 'Saturday',
        opens: '08:00',
        closes: '12:00',
      },
    ],

    priceRange: '$$',

    medicalSpecialty: ['Ophthalmology'],

    hasOfferCatalog: {
      '@type': 'OfferCatalog',
      name: 'Serviços Oftalmológicos',
      itemListElement: [
        {
          '@type': 'Offer',
          itemOffered: {
            '@type': 'MedicalProcedure',
            name: 'Cirurgia de Catarata',
            description:
              'Cirurgia de catarata com implante de lente intraocular',
          },
        },
        {
          '@type': 'Offer',
          itemOffered: {
            '@type': 'MedicalTherapy',
            name: 'Tratamento de Glaucoma',
            description: 'Tratamento clínico e cirúrgico de glaucoma',
          },
        },
        {
          '@type': 'Offer',
          itemOffered: {
            '@type': 'MedicalTest',
            name: 'Consulta Oftalmológica Completa',
            description: 'Consulta com exames especializados',
          },
        },
        {
          '@type': 'Offer',
          itemOffered: {
            '@type': 'Product',
            name: 'Lentes de Contato',
            description: 'Adaptação e venda de lentes de contato',
          },
        },
      ],
    },

    founder: {
      '@type': 'Person',
      name: 'Dr. Philipe Saraiva Cruz',
      jobTitle: 'Médico Oftalmologista',
      description:
        'Oftalmologista especialista em cirurgia de catarata e glaucoma',
      url: 'https://saraivavision.com.br/dr-philipe',
    },

    sameAs: [
      'https://www.facebook.com/saraivavision',
      'https://www.instagram.com/saraivavision',
      'https://www.linkedin.com/company/saraivavision',
    ],

    aggregateRating: {
      '@type': 'AggregateRating',
      ratingValue: '4.9',
      reviewCount: '127',
    },
  }

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  )
}
