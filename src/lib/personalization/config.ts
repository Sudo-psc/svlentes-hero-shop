import { PersonalizationConfig } from '@/types/personalization'
export const DEFAULT_PERSONALIZATION_CONFIG: PersonalizationConfig = {
    enabled: process.env.PERSONALIZATION_ENABLED === 'true',
    debug: process.env.PERSONALIZATION_DEBUG === 'true',
    cacheTTL: parseInt(process.env.PERSONALIZATION_CACHE_TTL || '3600'),
    behaviorTracking: process.env.BEHAVIOR_TRACKING_ENABLED === 'true',
    consentRequired: process.env.CONSENT_REQUIRED === 'true',
    dataRetentionDays: parseInt(process.env.BEHAVIOR_DATA_RETENTION_DAYS || '90'),
    edgeRuntime: process.env.PERSONALIZATION_EDGE_RUNTIME === 'true',
    defaultPersona: 'price-conscious',
    fallbackStrategy: 'default'
}
export const PERSONA_DEFINITIONS = {
    'price-conscious': {
        id: 'price-conscious',
        name: 'Consciente do Preço',
        description: 'Focado em economia e melhores ofertas',
        characteristics: {
            ageRange: ['25-45', '45-60'],
            incomeLevel: ['low', 'medium'],
            devicePreference: ['mobile', 'desktop'],
            browsingHabits: ['comparison-shopping', 'deal-hunting'],
            purchaseMotivations: ['savings', 'value-for-money'],
            painPoints: ['high-prices', 'hidden-fees']
        },
        triggers: [
            { type: 'page_view' as const, condition: '/pricing', weight: 0.8 },
            { type: 'page_view' as const, condition: '/calculator', weight: 0.9 },
            { type: 'action' as const, condition: 'price-compare', weight: 0.7 }
        ],
        scoringWeights: {
            navigation: 0.3,
            interaction: 0.25,
            temporal: 0.2,
            content: 0.15,
            demographic: 0.05,
            contextual: 0.05
        },
        contentPreferences: {
            tone: 'casual',
            complexity: 'simple',
            visualStyle: 'modern',
            informationDensity: 'medium',
            callToActionStyle: 'direct'
        },
        behavioralIndicators: {
            highValueActions: ['price-compare', 'calculator-use', 'discount-search'],
            conversionSignals: ['add-to-cart-after-discount', 'apply-coupon'],
            abandonmentRisks: ['price-too-high', 'shipping-costs'],
            engagementMarkers: ['price-comparison', 'deal-clicks'],
            researchBehaviors: ['competitor-price-check', 'review-reading']
        }
    },
    'quality-focused': {
        id: 'quality-focused',
        name: 'Focado em Qualidade',
        description: 'Prioriza qualidade e marcas premium',
        characteristics: {
            ageRange: ['35-60'],
            incomeLevel: ['medium', 'high'],
            devicePreference: ['desktop'],
            browsingHabits: ['research-heavy', 'brand-investigation'],
            purchaseMotivations: ['quality', 'durability', 'brand-trust'],
            painPoints: ['poor-quality', 'unreliable-products']
        },
        triggers: [
            { type: 'page_view' as const, condition: '/how-it-works', weight: 0.7 },
            { type: 'page_view' as const, condition: '/about', weight: 0.6 },
            { type: 'action' as const, condition: 'quality-inquiry', weight: 0.8 }
        ],
        scoringWeights: {
            navigation: 0.25,
            interaction: 0.3,
            temporal: 0.15,
            content: 0.2,
            demographic: 0.05,
            contextual: 0.05
        },
        contentPreferences: {
            tone: 'professional',
            complexity: 'detailed',
            visualStyle: 'classic',
            informationDensity: 'high',
            callToActionStyle: 'informative'
        },
        behavioralIndicators: {
            highValueActions: ['specification-review', 'quality-check', 'warranty-inquiry'],
            conversionSignals: ['premium-plan-selection', 'extended-warranty-purchase'],
            abandonmentRisks: ['quality-concerns', 'lack-of-information'],
            engagementMarkers: ['detailed-page-views', 'specification-downloads'],
            researchBehaviors: ['deep-research', 'comparison-study']
        }
    },
    'convenience-seeker': {
        id: 'convenience-seeker',
        name: 'Buscador de Conveniência',
        description: 'Valoriza praticidade e facilidade',
        characteristics: {
            ageRange: ['25-45'],
            incomeLevel: ['medium', 'high'],
            devicePreference: ['mobile'],
            browsingHabits: ['quick-decisions', 'mobile-first'],
            purchaseMotivations: ['convenience', 'time-saving', 'simplicity'],
            painPoints: ['complicated-processes', 'time-consuming']
        },
        triggers: [
            { type: 'page_view' as const, condition: '/quick-start', weight: 0.8 },
            { type: 'action' as const, condition: 'quick-checkout', weight: 0.9 },
            { type: 'time' as const, condition: 'quick-session', weight: 0.6 }
        ],
        scoringWeights: {
            navigation: 0.35,
            interaction: 0.3,
            temporal: 0.2,
            content: 0.1,
            demographic: 0.03,
            contextual: 0.02
        },
        contentPreferences: {
            tone: 'friendly',
            complexity: 'simple',
            visualStyle: 'minimal',
            informationDensity: 'low',
            callToActionStyle: 'direct'
        },
        behavioralIndicators: {
            highValueActions: ['quick-checkout', 'one-click-purchase', 'express-delivery'],
            conversionSignals: ['subscription-signup', 'auto-renewal'],
            abandonmentRisks: ['complicated-checkout', 'too-many-steps'],
            engagementMarkers: ['quick-actions', 'mobile-interactions'],
            researchBehaviors: ['quick-scans', 'summary-reading']
        }
    },
    'urgent-buyer': {
        id: 'urgent-buyer',
        name: 'Comprador Urgente',
        description: 'Necessidade de solução rápida',
        characteristics: {
            ageRange: ['18-45'],
            incomeLevel: ['low', 'medium', 'high'],
            devicePreference: ['mobile', 'desktop'],
            browsingHabits: ['rapid-decisions', 'solution-focused'],
            purchaseMotivations: ['immediacy', 'problem-solving', 'urgency'],
            painPoints: ['slow-delivery', 'delays', 'unavailability']
        },
        triggers: [
            { type: 'page_view' as const, condition: '/emergency', weight: 0.9 },
            { type: 'action' as const, condition: 'express-search', weight: 0.8 },
            { type: 'frequency' as const, condition: 'rapid-clicks', weight: 0.7 }
        ],
        scoringWeights: {
            navigation: 0.4,
            interaction: 0.35,
            temporal: 0.15,
            content: 0.05,
            demographic: 0.03,
            contextual: 0.02
        },
        contentPreferences: {
            tone: 'direct',
            complexity: 'simple',
            visualStyle: 'bold',
            informationDensity: 'low',
            callToActionStyle: 'urgent'
        },
        behavioralIndicators: {
            highValueActions: ['express-checkout', 'urgent-purchase', 'fast-delivery'],
            conversionSignals: ['immediate-purchase', 'expedited-shipping'],
            abandonmentRisks: ['slow-process', 'delivery-delays'],
            engagementMarkers: ['rapid-navigation', 'quick-decisions'],
            researchBehaviors: ['minimal-research', 'solution-focused']
        }
    },
    'researcher': {
        id: 'researcher',
        name: 'Pesquisador',
        description: 'Faz pesquisa detalhada antes de decidir',
        characteristics: {
            ageRange: ['25-55'],
            incomeLevel: ['medium', 'high'],
            devicePreference: ['desktop', 'tablet'],
            browsingHabits: ['thorough-research', 'multiple-visits'],
            purchaseMotivations: ['informed-decision', 'best-option', 'comprehensive-analysis'],
            painPoints: ['insufficient-information', 'lack-of-details']
        },
        triggers: [
            { type: 'page_view' as const, condition: '/resources', weight: 0.8 },
            { type: 'frequency' as const, condition: 'multiple-visits', weight: 0.9 }
        ],
        scoringWeights: {
            navigation: 0.2,
            interaction: 0.25,
            temporal: 0.15,
            content: 0.3,
            demographic: 0.05,
            contextual: 0.05
        },
        contentPreferences: {
            tone: 'professional',
            complexity: 'detailed',
            visualStyle: 'modern',
            informationDensity: 'high',
            callToActionStyle: 'informative'
        },
        behavioralIndicators: {
            highValueActions: ['detailed-reading', 'comparison-analysis', 'specification-study'],
            conversionSignals: ['well-informed-purchase', 'confident-decision'],
            abandonmentRisks: ['insufficient-info', 'uncertainty'],
            engagementMarkers: ['long-sessions', 'multiple-page-views'],
            researchBehaviors: ['comprehensive-study', 'detailed-analysis']
        }
    },
    'tech-savvy': {
        id: 'tech-savvy',
        name: 'Tecnológico',
        description: 'Adota tecnologia facilmente',
        characteristics: {
            ageRange: ['18-40'],
            incomeLevel: ['medium', 'high'],
            devicePreference: ['mobile', 'desktop', 'tablet'],
            browsingHabits: ['early-adopter', 'feature-exploration'],
            purchaseMotivations: ['innovation', 'technology', 'efficiency'],
            painPoints: ['outdated-technology', 'poor-user-experience']
        },
        triggers: [
            { type: 'page_view' as const, condition: '/features', weight: 0.8 },
            { type: 'action' as const, condition: 'advanced-settings', weight: 0.9 },
            { type: 'page_view' as const, condition: '/integrations', weight: 0.7 }
        ],
        scoringWeights: {
            navigation: 0.25,
            interaction: 0.35,
            temporal: 0.15,
            content: 0.2,
            demographic: 0.03,
            contextual: 0.02
        },
        contentPreferences: {
            tone: 'casual',
            complexity: 'moderate',
            visualStyle: 'modern',
            informationDensity: 'medium',
            callToActionStyle: 'direct'
        },
        behavioralIndicators: {
            highValueActions: ['feature-exploration', 'advanced-settings', 'api-integration'],
            conversionSignals: ['early-adoption', 'premium-features'],
            abandonmentRisks: ['basic-features', 'limited-options'],
            engagementMarkers: ['feature-discovery', 'advanced-interactions'],
            researchBehaviors: ['technology-review', 'feature-comparison']
        }
    },
    'health-conscious': {
        id: 'health-conscious',
        name: 'Consciente da Saúde',
        description: 'Preocupado com saúde e bem-estar',
        characteristics: {
            ageRange: ['30-65'],
            incomeLevel: ['medium', 'high'],
            devicePreference: ['mobile', 'desktop'],
            browsingHabits: ['health-research', 'wellness-focus'],
            purchaseMotivations: ['health-benefits', 'safety', 'wellness'],
            painPoints: ['health-risks', 'safety-concerns']
        },
        triggers: [
            { type: 'page_view' as const, condition: '/health-benefits', weight: 0.9 },
            { type: 'page_view' as const, condition: '/safety', weight: 0.8 },
            { type: 'page_view' as const, condition: '/agendar-consulta', weight: 0.7 }
        ],
        scoringWeights: {
            navigation: 0.25,
            interaction: 0.3,
            temporal: 0.2,
            content: 0.2,
            demographic: 0.03,
            contextual: 0.02
        },
        contentPreferences: {
            tone: 'professional',
            complexity: 'moderate',
            visualStyle: 'clean',
            informationDensity: 'medium',
            callToActionStyle: 'informative'
        },
        behavioralIndicators: {
            highValueActions: ['health-research', 'safety-check', 'consultation-scheduling'],
            conversionSignals: ['health-purchase', 'wellness-investment'],
            abandonmentRisks: ['safety-concerns', 'health-risks'],
            engagementMarkers: ['health-content', 'safety-information'],
            researchBehaviors: ['health-study', 'wellness-research']
        }
    },
    'budget-planner': {
        id: 'budget-planner',
        name: 'Planejador de Orçamento',
        description: 'Planejamento financeiro cuidadoso',
        characteristics: {
            ageRange: ['25-50'],
            incomeLevel: ['low', 'medium'],
            devicePreference: ['desktop', 'mobile'],
            browsingHabits: ['budget-planning', 'calculation-heavy'],
            purchaseMotivations: ['budget-alignment', 'cost-planning', 'financial-control'],
            painPoints: ['budget-overruns', 'unexpected-costs']
        },
        triggers: [
            { type: 'page_view' as const, condition: '/calculator', weight: 0.9 },
            { type: 'action' as const, condition: 'budget-calculation', weight: 0.8 },
            { type: 'page_view' as const, condition: '/planning', weight: 0.7 }
        ],
        scoringWeights: {
            navigation: 0.3,
            interaction: 0.3,
            temporal: 0.2,
            content: 0.15,
            demographic: 0.03,
            contextual: 0.02
        },
        contentPreferences: {
            tone: 'professional',
            complexity: 'moderate',
            visualStyle: 'modern',
            informationDensity: 'medium',
            callToActionStyle: 'informative'
        },
        behavioralIndicators: {
            highValueActions: ['budget-calculation', 'cost-analysis', 'planning-tools'],
            conversionSignals: ['planned-purchase', 'budget-aligned'],
            abandonmentRisks: ['cost-uncertainty', 'budget-constraints'],
            engagementMarkers: ['calculation-tools', 'planning-features'],
            researchBehaviors: ['cost-analysis', 'budget-research']
        }
    }
}
export const CACHE_KEYS = {
    USER_PROFILE: 'user_profile',
    BEHAVIOR_DATA: 'behavior_data',
    PERSONA_SCORES: 'persona_scores',
    CONTENT_VARIATIONS: 'content_variations',
    EXPERIMENT_ASSIGNMENTS: 'experiment_assignments',
    CONSENT_STATUS: 'consent_status'
}
export const API_ENDPOINTS = {
    PERSONALIZATION: '/api/personalization',
    ANALYTICS: '/api/analytics',
    EXPERIMENTS: '/api/experiments',
    CONSENT: '/api/consent',
    BEHAVIOR: '/api/behavior'
}
export const EVENT_NAMES = {
    PAGE_VIEW: 'page_view',
    CLICK: 'click',
    SCROLL: 'scroll',
    DWELL: 'dwell',
    FORM_INTERACTION: 'form_interaction',
    CONVERSION: 'conversion',
    ABANDONMENT: 'abandonment',
    PERSONA_UPDATE: 'persona_update',
    EXPERIMENT_PARTICIPATION: 'experiment_participation'
}
export const CONSENT_TYPES = {
    ESSENTIAL: 'essential',
    ANALYTICS: 'analytics',
    PERSONALIZATION: 'personalization',
    MARKETING: 'marketing'
}
export const RETENTION_POLICIES = {
    BEHAVIOR_DATA: 90, // days
    PERSONA_DATA: 365, // days
    CONSENT_DATA: 1825, // 5 years
    EXPERIMENT_DATA: 180 // days
}