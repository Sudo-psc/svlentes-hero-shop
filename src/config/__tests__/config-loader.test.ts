/**
 * Config Loader Test Suite
 *
 * Tests for centralized configuration system with focus on:
 * - Feature flag toggling
 * - YAML parsing and validation
 * - Medical/Analytics/Privacy data loading
 * - Singleton pattern integrity
 *
 * @jest-environment node
 */

import { describe, it, expect, beforeEach, jest } from '@jest/globals'
import { config } from '../loader'
import { doctorInfo, trustIndicators, clinicInfo } from '@/data/doctor-info'
import { trustBadges, socialProofStats, certifications, testimonialHighlights } from '@/data/trust-indicators'

describe('ConfigService - Feature Flags', () => {
  it('should have centralized medical data enabled', () => {
    const loadedConfig = config.load()

    expect(loadedConfig.featureFlags.useCentralizedMedical).toBe(true)
    expect(loadedConfig.medical).toBeDefined()
    expect(loadedConfig.medical.doctor).toBeDefined()
  })

  it('should have centralized analytics enabled', () => {
    const loadedConfig = config.load()

    expect(loadedConfig.featureFlags.useCentralizedAnalytics).toBe(true)
    expect(loadedConfig.analytics).toBeDefined()
    expect(loadedConfig.analytics.googleAnalytics).toBeDefined()
  })

  it('should have centralized privacy enabled', () => {
    const loadedConfig = config.load()

    expect(loadedConfig.featureFlags.useCentralizedPrivacy).toBe(true)
    expect(loadedConfig.privacy).toBeDefined()
    expect(loadedConfig.privacy.lgpd).toBeDefined()
  })

  it('should return correct values from isFeatureEnabled()', () => {
    config.load()

    expect(config.isFeatureEnabled('useCentralizedMedical')).toBe(true)
    expect(config.isFeatureEnabled('useCentralizedAnalytics')).toBe(true)
    expect(config.isFeatureEnabled('useCentralizedPrivacy')).toBe(true)
  })
})

describe('ConfigService - Singleton Pattern', () => {
  it('should cache loaded configuration', () => {
    const config1 = config.load()
    const config2 = config.load()

    // Should return the same cached instance
    expect(config1).toBe(config2)
  })
})

describe('ConfigService - Medical Data', () => {
  let loadedConfig: ReturnType<typeof config.load>

  beforeEach(() => {
    loadedConfig = config.load()
  })

  it('should load doctor information correctly', () => {
    expect(loadedConfig.medical.doctor).toBeDefined()
    expect(loadedConfig.medical.doctor.name).toBe('Dr. Philipe Saraiva Cruz')
    expect(loadedConfig.medical.doctor.crm).toBe('CRM 69.870')
    expect(loadedConfig.medical.doctor.crmEquipe).toBe('CRM_EQP 155869.006')
    expect(loadedConfig.medical.doctor.specialty).toBe('Oftalmologia')
  })

  it('should load clinic information correctly', () => {
    expect(loadedConfig.medical.clinic).toBeDefined()
    expect(loadedConfig.medical.clinic.name).toBe('SV Lentes')
    expect(loadedConfig.medical.clinic.cnpj).toBe('53.864.119/0001-79')
    expect(loadedConfig.medical.clinic.address.city).toBe('Caratinga')
    expect(loadedConfig.medical.clinic.address.state).toBe('MG')
  })

  it('should load trust indicators correctly', () => {
    expect(loadedConfig.medical.trust).toBeDefined()
    expect(loadedConfig.medical.trust.badges).toBeInstanceOf(Array)
    expect(loadedConfig.medical.trust.badges.length).toBeGreaterThan(0)

    const anvisaBadge = loadedConfig.medical.trust.badges.find((b: any) => b.id === 'anvisa')
    expect(anvisaBadge).toBeDefined()
    expect(anvisaBadge?.verified).toBe(true)
  })

  it('should validate CRM format', () => {
    const crm = loadedConfig.medical.doctor.crm
    expect(crm).toMatch(/CRM/)
    expect(crm).toContain('69.870')
  })

  it('should validate CNPJ format', () => {
    const cnpj = loadedConfig.medical.clinic.cnpj
    expect(cnpj).toMatch(/^\d{2}\.\d{3}\.\d{3}\/\d{4}-\d{2}$/)
  })

  it('should validate email addresses', () => {
    const doctorEmail = loadedConfig.medical.doctor.contact.email
    const clinicEmail = loadedConfig.medical.clinic.contact.email

    expect(doctorEmail).toMatch(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)
    expect(clinicEmail).toMatch(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)
  })

  it('should load certifications with verified status', () => {
    expect(loadedConfig.medical.trust.certifications).toBeInstanceOf(Array)
    expect(loadedConfig.medical.trust.certifications.length).toBeGreaterThan(0)

    loadedConfig.medical.trust.certifications.forEach((cert: any) => {
      expect(cert.verified).toBe(true)
      expect(cert.id).toBeDefined()
      expect(cert.name).toBeDefined()
      expect(cert.institution).toBeDefined()
    })
  })

  it('should load social proof stats', () => {
    expect(loadedConfig.medical.trust.socialProofStats).toBeInstanceOf(Array)
    expect(loadedConfig.medical.trust.socialProofStats.length).toBeGreaterThan(0)

    loadedConfig.medical.trust.socialProofStats.forEach((stat: any) => {
      expect(stat.id).toBeDefined()
      expect(stat.value).toBeDefined()
      expect(stat.label).toBeDefined()
      expect(stat.icon).toBeDefined()
    })
  })

  it('should load testimonial highlights', () => {
    expect(loadedConfig.medical.trust.highlights).toBeInstanceOf(Array)
    expect(loadedConfig.medical.trust.highlights.length).toBeGreaterThan(0)

    loadedConfig.medical.trust.highlights.forEach((highlight: any) => {
      expect(highlight.id).toBeDefined()
      expect(highlight.text).toBeDefined()
      expect(highlight.description).toBeDefined()
      expect(highlight.icon).toBeDefined()
      expect(highlight.featured).toBeDefined()
    })
  })
})

describe('ConfigService - Analytics Data', () => {
  let loadedConfig: ReturnType<typeof config.load>

  beforeEach(() => {
    loadedConfig = config.load()
  })

  it('should load Google Analytics config correctly', () => {
    expect(loadedConfig.analytics.googleAnalytics).toBeDefined()
    expect(loadedConfig.analytics.googleAnalytics.enabled).toBe(true)
    expect(loadedConfig.analytics.googleAnalytics.measurementId).toBeDefined()
  })

  it('should load conversion events', () => {
    expect(loadedConfig.analytics.conversionEvents).toBeInstanceOf(Array)
    expect(loadedConfig.analytics.conversionEvents.length).toBeGreaterThanOrEqual(10)

    const firstEvent = loadedConfig.analytics.conversionEvents[0]
    expect(firstEvent).toHaveProperty('event')
    expect(firstEvent).toHaveProperty('category')
    expect(firstEvent).toHaveProperty('label')
    expect(firstEvent).toHaveProperty('value')
  })

  it('should validate web vitals thresholds', () => {
    const vitals = loadedConfig.analytics.monitoring.vitals
    expect(vitals.LCP).toBeLessThanOrEqual(2500)
    expect(vitals.FID).toBeLessThanOrEqual(100)
    expect(vitals.CLS).toBeLessThanOrEqual(0.1)
  })

  it('should validate consent settings', () => {
    const consent = loadedConfig.analytics.googleAnalytics.consent
    expect(consent.analytics_storage).toMatch(/^(granted|denied)$/)
    expect(consent.ad_storage).toMatch(/^(granted|denied)$/)
  })

  it('should have monitoring configuration', () => {
    expect(loadedConfig.analytics.monitoring).toBeDefined()
    expect(loadedConfig.analytics.monitoring.errorTracking).toBeDefined()
    expect(loadedConfig.analytics.monitoring.performanceMetrics).toBeDefined()
    expect(loadedConfig.analytics.monitoring.vitals).toBeDefined()
  })
})

describe('ConfigService - Privacy Data', () => {
  let loadedConfig: ReturnType<typeof config.load>

  beforeEach(() => {
    loadedConfig = config.load()
  })

  it('should load LGPD settings correctly', () => {
    expect(loadedConfig.privacy.lgpd).toBeDefined()
    expect(loadedConfig.privacy.lgpd.enabled).toBe(true)
    expect(loadedConfig.privacy.lgpd.consentRequired).toBe(true)
  })

  it('should load cookie consent settings', () => {
    const cookieConsent = loadedConfig.privacy.lgpd.cookieConsent
    expect(cookieConsent.essential).toBe(true)
    expect(cookieConsent.analytics).toMatch(/^(required|optional|disabled)$/)
    expect(cookieConsent.marketing).toMatch(/^(required|optional|disabled)$/)
  })

  it('should load all data subject rights', () => {
    const rights = loadedConfig.privacy.lgpd.dataSubjectRights
    expect(rights).toBeInstanceOf(Array)
    expect(rights.length).toBeGreaterThanOrEqual(6)

    expect(rights).toContain('access')
    expect(rights).toContain('rectification')
    expect(rights).toContain('erasure')
    expect(rights).toContain('portability')
  })

  it('should validate data retention days', () => {
    const retentionDays = loadedConfig.privacy.lgpd.dataRetentionDays
    expect(retentionDays).toBeGreaterThan(0)
    expect(retentionDays).toBeLessThanOrEqual(3650)
  })
})

describe('Doctor Info Data Layer', () => {
  it('should return centralized doctor data', () => {
    expect(doctorInfo).toBeDefined()
    expect(doctorInfo.name).toBe('Dr. Philipe Saraiva Cruz')
    expect(doctorInfo.crm).toBe('CRM 69.870')
    expect(doctorInfo.specialty).toBe('Oftalmologia')
  })

  it('should convert trust indicators to legacy format', () => {
    expect(trustIndicators).toBeDefined()
    expect(trustIndicators.anvisa).toBeDefined()
    expect(trustIndicators.crm).toBeDefined()
    expect(trustIndicators.sbo).toBeDefined()
    expect(trustIndicators.ssl).toBeDefined()
    expect(trustIndicators.lgpd).toBeDefined()
  })

  it('should preserve badge properties in legacy format', () => {
    expect(trustIndicators.anvisa.name).toBeDefined()
    expect(trustIndicators.anvisa.description).toBeDefined()
    expect(trustIndicators.anvisa.logo).toBeDefined()
    expect(trustIndicators.anvisa.verified).toBe(true)
  })

  it('should return complete clinic data', () => {
    expect(clinicInfo).toBeDefined()
    expect(clinicInfo.name).toBe('SV Lentes')
    expect(clinicInfo.cnpj).toBe('53.864.119/0001-79')
  })

  it('should validate clinic address structure', () => {
    expect(clinicInfo.address).toBeDefined()
    expect(clinicInfo.address.street).toBeDefined()
    expect(clinicInfo.address.city).toBe('Caratinga')
    expect(clinicInfo.address.state).toBe('MG')
    expect(clinicInfo.address.zipCode).toMatch(/^\d{5}-\d{3}$/)
  })

  it('should validate clinic contact information', () => {
    expect(clinicInfo.contact).toBeDefined()
    expect(clinicInfo.contact.whatsapp).toMatch(/^\+55/)
    expect(clinicInfo.contact.email).toMatch(/@/)
    expect(clinicInfo.contact.website).toMatch(/^https?:\/\//)
  })
})

describe('Trust Indicators Data Layer', () => {
  it('should add color properties to trust badges', () => {
    expect(trustBadges).toBeInstanceOf(Array)
    expect(trustBadges.length).toBeGreaterThan(0)

    trustBadges.forEach((badge: any) => {
      expect(badge.color).toBeDefined()
      expect(badge.color).toMatch(/^text-/)
    })
  })

  it('should map anvisa badge to purple color', () => {
    const anvisaBadge = trustBadges.find((b: any) => b.id === 'anvisa')
    expect(anvisaBadge).toBeDefined()
    expect(anvisaBadge?.color).toBe('text-purple-400')
  })

  it('should map lgpd badge to blue color', () => {
    const lgpdBadge = trustBadges.find((b: any) => b.id === 'lgpd')
    expect(lgpdBadge).toBeDefined()
    expect(lgpdBadge?.color).toBe('text-blue-400')
  })

  it('should map ssl badge to green color', () => {
    const sslBadge = trustBadges.find((b: any) => b.id === 'ssl')
    expect(sslBadge).toBeDefined()
    expect(sslBadge?.color).toBe('text-green-400')
  })

  it('should add color properties to social proof stats', () => {
    expect(socialProofStats).toBeInstanceOf(Array)

    socialProofStats.forEach((stat: any) => {
      expect(stat.color).toBeDefined()
      expect(stat.color).toMatch(/^text-/)
    })
  })

  it('should return all required stats', () => {
    expect(socialProofStats.length).toBeGreaterThanOrEqual(3)

    socialProofStats.forEach((stat: any) => {
      expect(stat.id).toBeDefined()
      expect(stat.value).toBeDefined()
      expect(stat.label).toBeDefined()
      expect(stat.icon).toBeDefined()
    })
  })

  it('should return all certifications', () => {
    expect(certifications).toBeInstanceOf(Array)
    expect(certifications.length).toBeGreaterThanOrEqual(4)
  })

  it('should include verified status for certifications', () => {
    certifications.forEach((cert: any) => {
      expect(cert.verified).toBe(true)
      expect(cert.id).toBeDefined()
      expect(cert.name).toBeDefined()
      expect(cert.institution).toBeDefined()
    })
  })

  it('should return highlights with featured flag', () => {
    expect(testimonialHighlights).toBeInstanceOf(Array)

    testimonialHighlights.forEach((highlight: any) => {
      expect(highlight.featured).toBeDefined()
      expect(highlight.text).toBeDefined()
      expect(highlight.description).toBeDefined()
      expect(highlight.icon).toBeDefined()
    })
  })
})

describe('ConfigService - Schema Validation', () => {
  it('should have all required top-level sections', () => {
    const loadedConfig = config.load()

    expect(loadedConfig.site).toBeDefined()
    expect(loadedConfig.i18n).toBeDefined()
    expect(loadedConfig.menus).toBeDefined()
    expect(loadedConfig.copy).toBeDefined()
    expect(loadedConfig.pricing).toBeDefined()
    expect(loadedConfig.seo).toBeDefined()
    expect(loadedConfig.medical).toBeDefined()
    expect(loadedConfig.analytics).toBeDefined()
    expect(loadedConfig.privacy).toBeDefined()
    expect(loadedConfig.featureFlags).toBeDefined()
  })

  it('should have valid site configuration', () => {
    const loadedConfig = config.load()

    expect(loadedConfig.site.name).toBeDefined()
    expect(loadedConfig.site.shortName).toBeDefined()
    expect(loadedConfig.site.tagline).toBeDefined()
    expect(loadedConfig.site.description).toBeDefined()
    expect(loadedConfig.site.url).toMatch(/^https?:\/\//)
  })

  it('should have valid i18n configuration', () => {
    const loadedConfig = config.load()

    expect(loadedConfig.i18n.defaultLocale).toBe('pt-BR')
    expect(loadedConfig.i18n.locales).toContain('pt-BR')
    expect(loadedConfig.i18n.fallback).toMatch(/^(strict|soft)$/)
  })

  it('should have valid menu structure', () => {
    const loadedConfig = config.load()

    expect(loadedConfig.menus.header).toBeDefined()
    expect(loadedConfig.menus.header.main).toBeInstanceOf(Array)
    expect(loadedConfig.menus.header.cta).toBeDefined()
    expect(loadedConfig.menus.footer).toBeDefined()
  })
})
