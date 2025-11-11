import { type ScientificReference } from './scientific'

export interface BaseScore {
    factor: string
    weight: number
    contactLensScore: number
    glassesScore: number
    confidence: number
    scientificBasis: ScientificReference['id'][]
    category: string
}

export type InteractionType = 'synergistic' | 'antagonistic' | 'conditional'

export interface FactorInteraction {
    factors: string[]
    interactionType: InteractionType
    modifier: number
    description: string
    scientificEvidence: string
}

export type RiskLevel = 'low' | 'moderate' | 'high' | 'critical'

export interface RiskAssessment {
    riskLevel: RiskLevel
    contraindicationFor: 'contacts' | 'glasses' | 'both' | 'none'
    reasons: string[]
    requiresConsultation: boolean
    urgencyLevel: 'routine' | 'soon' | 'urgent'
}

export interface ConfidenceMetrics {
    dataCompleteness: number
    factorConsistency: number
    scientificSupport: number
    edgeCaseDetection: number
    overallConfidence: 'low' | 'medium' | 'high' | 'very-high'
}

export interface ConfidenceBreakdown {
    metrics: ConfidenceMetrics
    score: number
}

export interface ConfidenceResult {
    breakdown: ConfidenceBreakdown
    messages: string[]
}

export interface RecommendationOption {
    option: 'contact-lenses' | 'glasses' | 'both' | 'consultation-required'
    score: number
    confidence: ConfidenceMetrics
    reasoning: string[]
}

export interface SecondaryRecommendation {
    option: 'contact-lenses' | 'glasses'
    score: number
    useCase: string
}

export type ContactLensType = 'soft' | 'rigid' | 'hybrid' | 'scleral'
export type WearSchedule = 'daily' | 'weekly' | 'monthly'

export interface ContactLensSuggestion {
    type: ContactLensType
    material: string[]
    wearSchedule: WearSchedule
    specialFeatures: string[]
}

export interface GlassesSuggestion {
    lensType: 'single-vision' | 'bifocal' | 'progressive' | 'occupational'
    coatings: string[]
    frameSuggestions: string[]
    specialFeatures: string[]
}

export interface Recommendation {
    primary: RecommendationOption
    secondary?: SecondaryRecommendation
    specificSuggestions: {
        contactLenses?: ContactLensSuggestion
        glasses?: GlassesSuggestion
    }
    warnings: string[]
    nextSteps: string[]
    estimatedCosts: {
        initial: { min: number; max: number }
        monthly: { min: number; max: number }
        annual: { min: number; max: number }
    }
}

export interface FactorImpact {
    onContactLenses: 'strongly-positive' | 'positive' | 'neutral' | 'negative' | 'strongly-negative'
    onGlasses: 'strongly-positive' | 'positive' | 'neutral' | 'negative' | 'strongly-negative'
    magnitude: number
}

export interface FactorExplanation {
    category: string
    factor: string
    userAnswer: string
    impact: FactorImpact
    explanation: {
        simple: string
        technical?: string
    }
    scientificReferences: ScientificReference[]
    relatedFactors: string[]
}

export interface RecommendationNarrative {
    introduction: string
    keyFactors: {
        factor: string
        explanation: string
        weight: 'primary' | 'secondary' | 'tertiary'
    }[]
    considerations: string[]
    alternatives: {
        scenario: string
        recommendation: string
    }[]
    conclusion: string
}

export interface Alert {
    id: string
    severity: 'info' | 'warning' | 'critical'
    category: 'health' | 'safety' | 'cost' | 'maintenance'
    title: string
    message: string
    actionRequired: boolean
    suggestedAction?: string
    learnMoreUrl?: string
    dismissible: boolean
}

export interface ActionPlan {
    immediate: string[]
    shortTerm: string[]
    longTerm: string[]
}

export interface ResourceLink {
    title: string
    description: string
    url: string
    category: string
}

export interface FinalResult {
    summary: {
        recommendation: Recommendation
        confidence: ConfidenceMetrics
        timestamp: Date
        sessionId: string
    }
    detailedAnalysis: {
        scoreBreakdown: FactorExplanation[]
        comparativeAnalysis: {
            contactLenses: {
                totalScore: number
                pros: string[]
                cons: string[]
                bestFor: string[]
            }
            glasses: {
                totalScore: number
                pros: string[]
                cons: string[]
                bestFor: string[]
            }
        }
        visualizations: {
            radarChart: Record<string, unknown>
            barChart: Record<string, unknown>
            confidenceGauge: Record<string, unknown>
        }
    }
    personalizedSuggestions: {
        contactLenses?: ContactLensSuggestion
        glasses?: GlassesSuggestion
        hybrid?: {
            description: string
            scenarios: string[]
        }
    }
    alerts: Alert[]
    actionPlan: ActionPlan
    resources: {
        educationalMaterials: ResourceLink[]
        findProfessional: {
            specialty: string
            urgency: string
            tips: string[]
        }
        costEstimates: {
            monthly: { min: number; max: number }
            annual: { min: number; max: number }
        }
    }
    followUp: {
        recommendedCheckups: string[]
        signsToWatch: string[]
        whenToReassess: string
    }
    narrative?: RecommendationNarrative
}
