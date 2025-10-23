/**
 * Trust Indicators Data
 *
 * Versão: 1.0.0-fase4
 * Fase: MVP - Medical Data (Centralized Config)
 *
 * NOTA: Este arquivo agora funciona como wrapper para o sistema centralizado.
 * Dados reais vêm de src/config/base.yaml quando feature flag está ativa.
 */
import { config } from '@/config/loader'
/**
 * Get trust badges from centralized config
 * Falls back to hardcoded data if feature flag is disabled
 */
function getTrustBadges() {
  // Guard: only try to load config on server-side
  if (typeof window !== 'undefined') {
    return hardcodedTrustBadges
  }

  try {
    const appConfig = config.load()
    const useCentralizedMedical = config.isFeatureEnabled('useCentralizedMedical')
    if (useCentralizedMedical) {
      // Add color property for backward compatibility (not in YAML schema)
      return appConfig.medical.trust.badges.map((badge: any) => ({
        ...badge,
        color: badge.id === 'anvisa' ? 'text-purple-400' :
               badge.id === 'lgpd' ? 'text-blue-400' :
               badge.id === 'ssl' ? 'text-green-400' : 'text-gray-400'
      }))
    }
  } catch (error) {
    console.warn('[Trust] Error loading trust badges, using fallback:', error)
  }
  return hardcodedTrustBadges
}
// Hardcoded fallback data
const hardcodedTrustBadges = [
    {
        id: 'anvisa',
        name: 'Produtos ANVISA',
        description: 'Produtos aprovados pela ANVISA',
        icon: '🏥',
        color: 'text-purple-400',
        verified: true
    },
    {
        id: 'lgpd',
        name: 'Conformidade LGPD',
        description: 'Conformidade com LGPD',
        icon: '🛡️',
        color: 'text-blue-400',
        verified: true
    },
    {
        id: 'ssl',
        name: 'Site Seguro SSL',
        description: 'Conexão 100% segura',
        icon: '🔒',
        color: 'text-green-400',
        verified: true
    }
]
// Export via função para suportar centralização
export const trustBadges = getTrustBadges()
/**
 * Get social proof stats from centralized config
 * Falls back to hardcoded data if feature flag is disabled
 */
function getSocialProofStats() {
  // Guard: only try to load config on server-side
  if (typeof window !== 'undefined') {
    return hardcodedSocialProofStats
  }

  try {
    const appConfig = config.load()
    const useCentralizedMedical = config.isFeatureEnabled('useCentralizedMedical')
    if (useCentralizedMedical) {
      // Add color property for backward compatibility (not in YAML schema)
      return appConfig.medical.trust.socialProofStats.map((stat: any) => ({
        ...stat,
        color: stat.id === 'patients' ? 'text-primary-600' :
               stat.id === 'satisfaction' ? 'text-green-600' :
               stat.id === 'support' ? 'text-blue-600' : 'text-gray-600'
      }))
    }
  } catch (error) {
    console.warn('[Trust] Error loading social proof stats, using fallback:', error)
  }
  return hardcodedSocialProofStats
}
// Hardcoded fallback data
const hardcodedSocialProofStats = [
    {
        id: 'patients',
        value: '5.000+',
        label: 'Pacientes',
        icon: '👥',
        color: 'text-primary-600'
    },
    {
        id: 'satisfaction',
        value: '98%',
        label: 'Satisfação',
        icon: '⭐',
        color: 'text-green-600'
    },
    {
        id: 'support',
        value: '24/7',
        label: 'Suporte',
        icon: '📞',
        color: 'text-blue-600'
    }
]
// Export via função para suportar centralização
export const socialProofStats = getSocialProofStats()
/**
 * Get certifications from centralized config
 * Falls back to hardcoded data if feature flag is disabled
 */
function getCertifications() {
  // Guard: only try to load config on server-side
  if (typeof window !== 'undefined') {
    return hardcodedCertifications
  }

  try {
    const appConfig = config.load()
    const useCentralizedMedical = config.isFeatureEnabled('useCentralizedMedical')
    if (useCentralizedMedical) {
      return appConfig.medical.trust.certifications
    }
  } catch (error) {
    console.warn('[Trust] Error loading certifications, using fallback:', error)
  }
  return hardcodedCertifications
}
// Hardcoded fallback data
const hardcodedCertifications = [
    {
        id: 'medical-degree',
        name: 'Graduação em Medicina',
        institution: 'Universidade Federal',
        year: '2008',
        verified: true
    },
    {
        id: 'ophthalmology-residency',
        name: 'Residência em Oftalmologia',
        institution: 'Hospital das Clínicas',
        year: '2011',
        verified: true
    },
    {
        id: 'contact-lens-specialization',
        name: 'Especialização em Lentes de Contato',
        institution: 'Instituto de Oftalmologia',
        year: '2013',
        verified: true
    },
    {
        id: 'sbo-membership',
        name: 'Membro da SBO',
        institution: 'Sociedade Brasileira de Oftalmologia',
        year: '2011',
        verified: true
    }
]
/**
 * Get testimonial highlights from centralized config
 * Falls back to hardcoded data if feature flag is disabled
 */
function getTestimonialHighlights() {
  // Guard: only try to load config on server-side
  if (typeof window !== 'undefined') {
    return hardcodedTestimonialHighlights
  }

  try {
    const appConfig = config.load()
    const useCentralizedMedical = config.isFeatureEnabled('useCentralizedMedical')
    if (useCentralizedMedical) {
      return appConfig.medical.trust.highlights
    }
  } catch (error) {
    console.warn('[Trust] Error loading highlights, using fallback:', error)
  }
  return hardcodedTestimonialHighlights
}
// Hardcoded fallback data
const hardcodedTestimonialHighlights = [
    {
        id: 'pioneer-badge',
        text: 'Pioneiro no Brasil',
        description: 'Primeiro serviço de assinatura de lentes com acompanhamento médico',
        icon: '🏆',
        featured: true
    },
    {
        id: 'quality-badge',
        text: 'Qualidade Garantida',
        description: 'Produtos de alta qualidade com garantia total',
        icon: '✅',
        featured: true
    },
    {
        id: 'support-badge',
        text: 'Suporte 24/7',
        description: 'Atendimento especializado sempre disponível',
        icon: '📞',
        featured: true
    }
]
// Export via função para suportar centralização
export const certifications = getCertifications()
export const testimonialHighlights = getTestimonialHighlights()