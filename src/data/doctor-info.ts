/**
 * Doctor Information Data
 *
 * Versão: 1.0.0-fase4
 * Fase: MVP - Medical Data (Centralized Config)
 *
 * NOTA: Este arquivo agora funciona como wrapper para o sistema centralizado.
 * Dados reais vêm de src/config/base.yaml quando feature flag está ativa.
 */

import { config } from '@/config/loader'

/**
 * Get doctor information from centralized config
 * Falls back to hardcoded data if feature flag is disabled
 */
function getDoctorInfo() {
  try {
    const appConfig = config.load()
    const useCentralizedMedical = config.isFeatureEnabled('useCentralizedMedical')

    if (useCentralizedMedical) {
      return appConfig.medical.doctor
    }
  } catch (error) {
    console.warn('[Medical] Error loading doctor info, using fallback:', error)
  }

  return hardcodedDoctorInfo
}

// Hardcoded fallback data
const hardcodedDoctorInfo = {
    name: 'Dr. Philipe Saraiva Cruz',
    crm: 'CRM 69.870',
    crmEquipe: 'CRM_EQP 155869.006',
    specialty: 'Oftalmologia',
    photo: '/icones/drphilipe_perfil.jpeg',
    credentials: [
        'Especialista em Oftalmologia',
        'Graduado em Medicina pela Universidade Federal',
        'Residência em Oftalmologia',
        'Especialização em Lentes de Contato',
        'Membro da Sociedade Brasileira de Oftalmologia'
    ],
    experience: 'Especialista em oftalmologia',
    bio: 'Dr. Philipe Saraiva Cruz é pioneiro no Brasil em serviços de assinatura de lentes de contato com acompanhamento médico especializado, dedicando-se a proporcionar cuidado oftalmológico personalizado e acessível.',
    contact: {
        whatsapp: '+5533999898026',
        email: 'dr.philipe@svlentes.com.br',
        clinicAddress: 'Rua Catarina Maria Passos, 97 - Santa Zita, Caratinga/MG'
    },
    socialProof: {
        patientsServed: '5000+',
        satisfactionRate: '98%',
        consultationsPerformed: '10000+'
    }
}

// Export via função para suportar centralização
export const doctorInfo = getDoctorInfo()

/**
 * Get trust indicators (legacy format for backward compatibility)
 * Falls back to hardcoded data if feature flag is disabled
 */
function getTrustIndicators() {
  try {
    const appConfig = config.load()
    const useCentralizedMedical = config.isFeatureEnabled('useCentralizedMedical')

    if (useCentralizedMedical) {
      // Convert new centralized format to legacy format for backward compatibility
      const badges = appConfig.medical.trust.badges
      return {
        anvisa: {
          name: badges.find((b: any) => b.id === 'anvisa')?.name || 'ANVISA',
          description: badges.find((b: any) => b.id === 'anvisa')?.description || 'Produtos aprovados pela ANVISA',
          logo: '/images/selo-anvisa.png',
          verified: badges.find((b: any) => b.id === 'anvisa')?.verified || true
        },
        crm: {
          name: 'Conselho Regional de Medicina',
          description: 'Médico registrado no CRM-SP',
          number: appConfig.medical.doctor.crm,
          logo: '/images/selo-crm.png',
          verified: true
        },
        sbo: {
          name: 'Sociedade Brasileira de Oftalmologia',
          description: 'Membro ativo da SBO',
          logo: '/images/selo-sbo.png',
          verified: true
        },
        ssl: {
          name: badges.find((b: any) => b.id === 'ssl')?.name || 'Certificado SSL',
          description: badges.find((b: any) => b.id === 'ssl')?.description || 'Conexão segura',
          logo: '/images/ssl-badge.png',
          verified: badges.find((b: any) => b.id === 'ssl')?.verified || true
        },
        lgpd: {
          name: badges.find((b: any) => b.id === 'lgpd')?.name || 'Conformidade LGPD',
          description: badges.find((b: any) => b.id === 'lgpd')?.description || 'Em conformidade com LGPD',
          logo: '/images/lgpd-badge.png',
          verified: badges.find((b: any) => b.id === 'lgpd')?.verified || true
        }
      }
    }
  } catch (error) {
    console.warn('[Medical] Error loading trust indicators, using fallback:', error)
  }

  return hardcodedTrustIndicators
}

// Hardcoded fallback data
const hardcodedTrustIndicators = {
    anvisa: {
        name: 'ANVISA',
        description: 'Produtos aprovados pela Agência Nacional de Vigilância Sanitária',
        logo: '/images/selo-anvisa.png',
        verified: true
    },
    crm: {
        name: 'Conselho Regional de Medicina',
        description: 'Médico registrado no CRM-SP',
        number: 'CRM 69.870',
        logo: '/images/selo-crm.png',
        verified: true
    },
    sbo: {
        name: 'Sociedade Brasileira de Oftalmologia',
        description: 'Membro ativo da SBO',
        logo: '/images/selo-sbo.png',
        verified: true
    },
    ssl: {
        name: 'Certificado SSL',
        description: 'Conexão segura e criptografada',
        logo: '/images/ssl-badge.png',
        verified: true
    },
    lgpd: {
        name: 'Conformidade LGPD',
        description: 'Em conformidade com a Lei Geral de Proteção de Dados',
        logo: '/images/lgpd-badge.png',
        verified: true
    }
}

/**
 * Get clinic information from centralized config
 * Falls back to hardcoded data if feature flag is disabled
 */
function getClinicInfo() {
  try {
    const appConfig = config.load()
    const useCentralizedMedical = config.isFeatureEnabled('useCentralizedMedical')

    if (useCentralizedMedical) {
      return appConfig.medical.clinic
    }
  } catch (error) {
    console.warn('[Medical] Error loading clinic info, using fallback:', error)
  }

  return hardcodedClinicInfo
}

// Hardcoded fallback data
const hardcodedClinicInfo = {
    name: 'SV Lentes',
    fullName: 'SV Lentes - Serviços Oftalmológicos Especializados',
    cnpj: '53.864.119/0001-79',
    address: {
        street: 'Rua Catarina Maria Passos, 97',
        neighborhood: 'Santa Zita',
        city: 'Caratinga',
        state: 'MG',
        zipCode: '35300-299',
        country: 'Brasil'
    },
    contact: {
        phone: '+55 33 99989-8026',
        whatsapp: '+55 33 99989-8026',
        email: 'contato@svlentes.com.br',
        website: 'https://svlentes.com.br'
    },
    businessHours: {
        weekdays: 'Segunda a Sexta: 8h às 18h',
        saturday: 'Sábado: 8h às 12h',
        sunday: 'Domingo: Fechado',
        emergency: '24h via WhatsApp para emergências'
    },
    coverage: {
        area: 'Atendimento em todo o Brasil',
        shipping: 'Entrega gratuita em todo território nacional',
        consultation: 'Consultas presenciais e telemedicina'
    }
}

// Export via função para suportar centralização
export const trustIndicators = getTrustIndicators()
export const clinicInfo = getClinicInfo()
