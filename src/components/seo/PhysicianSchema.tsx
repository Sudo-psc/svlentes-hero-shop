import { doctorInfo, clinicInfo } from '@/data/doctor-info'

/**
 * Schema.org Physician structured data for Dr. Philipe Saraiva Cruz
 * Provides medical professional information for search engines
 */
export function PhysicianSchema() {
  const schema = {
    "@context": "https://schema.org",
    "@type": "Physician",
    "name": doctorInfo.name,
    "medicalSpecialty": "Ophthalmology",
    "identifier": doctorInfo.crm,
    "description": doctorInfo.bio || "Oftalmologista especializado em lentes de contato e saúde ocular",
    "image": doctorInfo.photo ? `https://svlentes.com.br${doctorInfo.photo}` : undefined,
    "worksFor": {
      "@type": "MedicalBusiness",
      "name": clinicInfo.name,
      "alternateName": clinicInfo.fullName,
      "url": "https://svlentes.com.br",
      "address": {
        "@type": "PostalAddress",
        "streetAddress": clinicInfo.address.street,
        "addressLocality": clinicInfo.address.city,
        "addressRegion": clinicInfo.address.state,
        "postalCode": clinicInfo.address.zipCode,
        "addressCountry": clinicInfo.address.country
      },
      "telephone": clinicInfo.contact.phone,
      "email": clinicInfo.contact.email
    },
    "availableService": {
      "@type": "MedicalProcedure",
      "name": "Consulta Oftalmológica e Adaptação de Lentes de Contato",
      "description": "Consulta oftalmológica completa com avaliação e adaptação de lentes de contato"
    },
    "memberOf": {
      "@type": "MedicalOrganization",
      "name": "Conselho Regional de Medicina de Minas Gerais",
      "alternateName": "CRM-MG"
    },
    "performsInLocation": [
      {
        "@type": "Place",
        "name": "Clínica Saraiva Vision - Caratinga",
        "address": {
          "@type": "PostalAddress",
          "addressLocality": "Caratinga",
          "addressRegion": "MG",
          "addressCountry": "BR"
        }
      },
      {
        "@type": "Place",
        "name": "Telemedicina - Todo o Brasil",
        "address": {
          "@type": "PostalAddress",
          "addressCountry": "BR"
        }
      }
    ]
  }

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema, null, 0) }}
    />
  )
}
