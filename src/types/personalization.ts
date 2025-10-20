export interface UserProfile {
    primaryPersona: string
    confidenceScore: number
    behavioralPatterns: BehavioralPattern[]
    demographicIndicators: DemographicIndicators
    engagementLevel: 'low' | 'medium' | 'high'
    conversionProbability: number
    shouldUpdateProfile: boolean
    sessionId: string
    lastUpdated: Date
}
export interface BehavioralPattern {
    type: 'navigation' | 'interaction' | 'temporal' | 'content' | 'conversion'
    weight: number
    value: any
    timestamp: Date
    context?: any
}
export interface DemographicIndicators {
    likelyAge: string
    likelyIncome: string
    likelyLocation: string
    devicePreference: string
    browsingTime: string
    language: string
    timezone: string
}
export interface ContentVariations {
    variant: string
    microcopy: MicrocopyVariations
    visualElements: VisualVariations
    layout: LayoutVariations
    features: FeatureVariations
    locale: string
}
export interface MicrocopyVariations {
    headlines: Record<string, string>
    subheadlines: Record<string, string>
    ctas: Record<string, string>
    descriptions: Record<string, string>
    socialProof: Record<string, string>
    urgency: Record<string, string>
    errorMessages: Record<string, string>
}
export interface VisualVariations {
    heroImages: Record<string, string>
    colorSchemes: Record<string, ColorScheme>
    typography: Record<string, TypographyScheme>
    icons: Record<string, string>
    animations: Record<string, any>
}
export interface ColorScheme {
    primary: string
    secondary: string
    accent: string
    background: string
    text: string
    muted: string
}
export interface TypographyScheme {
    headings: string
    body: string
    accents: string
    mono: string
}
export interface LayoutVariations {
    componentOrder: Record<string, string[]>
    sectionVisibility: Record<string, boolean>
    componentVariants: Record<string, string>
    spacing: Record<string, any>
}
export interface FeatureVariations {
    enabledFeatures: string[]
    featureHighlights: Record<string, string[]>
    promotionalOffers: Record<string, any>
    integrations: string[]
}
export interface RoutingDecision {
    strategy: 'default' | 'personalized' | 'variant' | 'redirect'
    targetPath?: string
    shouldRewrite: boolean
    priority: 'low' | 'medium' | 'high'
    reasoning: string
    cacheKey?: string
}
export interface Experiment {
    id: string
    name: string
    description: string
    variants: ExperimentVariant[]
    trafficAllocation: Record<string, number>
    targetAudience?: string[]
    startDate: Date
    endDate?: Date
    status: 'draft' | 'active' | 'paused' | 'completed'
    metrics: ExperimentMetrics
    configuration: ExperimentConfiguration
}
export interface ExperimentVariant {
    id: string
    name: string
    description: string
    changes: VariantChanges
    weight: number
    isActive: boolean
}
export interface VariantChanges {
    microcopy?: Record<string, string>
    visual?: Record<string, any>
    layout?: Record<string, any>
    features?: string[]
    routing?: Record<string, any>
}
export interface ExperimentMetrics {
    participants: number
    conversions: number
    conversionRate: number
    revenue: number
    variants: Record<string, VariantMetrics>
    confidence: number
    significance: number
    lastUpdated: Date
}
export interface VariantMetrics {
    participants: number
    conversions: number
    conversionRate: number
    revenue: number
    confidence: number
    improvement?: number
    pValue?: number
}
export interface ExperimentConfiguration {
    sampleSize?: number
    confidenceLevel: number
    minimumDetectableEffect: number
    duration?: number
    autoStop?: boolean
    trafficSplitType: 'even' | 'weighted' | 'adaptive'
}
export interface BehaviorData {
    type: 'page_view' | 'click' | 'scroll' | 'dwell' | 'form_interaction' | 'conversion' | 'abandonment'
    element?: string
    value?: any
    timestamp: Date
    sessionId: string
    context: any
    userId?: string
    persona?: string
}
export interface PersonalizationConfig {
    enabled: boolean
    debug: boolean
    cacheTTL: number
    behaviorTracking: boolean
    consentRequired: boolean
    dataRetentionDays: number
    edgeRuntime: boolean
    defaultPersona: string
    fallbackStrategy: 'default' | 'random' | 'weighted'
}
export interface PersonaDefinition {
    id: string
    name: string
    description: string
    characteristics: PersonaCharacteristics
    triggers: PersonaTrigger[]
    scoringWeights: ScoringWeights
    contentPreferences: ContentPreferences
    behavioralIndicators: BehavioralIndicators
}
export interface PersonaCharacteristics {
    ageRange: string[]
    incomeLevel: string[]
    devicePreference: string[]
    browsingHabits: string[]
    purchaseMotivations: string[]
    painPoints: string[]
}
export interface PersonaTrigger {
    type: 'page_view' | 'action' | 'time' | 'frequency'
    condition: string
    weight: number
    decay?: number
}
export interface ScoringWeights {
    navigation: number
    interaction: number
    temporal: number
    content: number
    demographic: number
    contextual: number
}
export interface ContentPreferences {
    tone: 'formal' | 'casual' | 'professional' | 'friendly'
    complexity: 'simple' | 'moderate' | 'detailed'
    visualStyle: 'minimal' | 'modern' | 'classic' | 'bold'
    informationDensity: 'low' | 'medium' | 'high'
    callToActionStyle: 'direct' | 'subtle' | 'urgent' | 'informative'
}
export interface BehavioralIndicators {
    highValueActions: string[]
    conversionSignals: string[]
    abandonmentRisks: string[]
    engagementMarkers: string[]
    researchBehaviors: string[]
}
export interface LocalizationConfig {
    code: string
    name: string
    flag: string
    currency: string
    dateFormat: string
    numberFormat: string
    rtl: boolean
    cultural: CulturalAdaptations
}
export interface CulturalAdaptations {
    paymentMethods: string[]
    trustSignals: string[]
    localReferences: string[]
    seasonalEvents: string[]
    communicationStyle: 'direct' | 'indirect' | 'formal' | 'casual'
    colorPreferences: Record<string, string>
}
export interface PersonalizationAnalytics {
    personalizedUsers: number
    personalizationGrowth: string
    conversionRate: number
    conversionGrowth: string
    engagementRate: number
    engagementGrowth: string
    revenuePerUser: string
    revenueGrowth: string
    personaData: PersonaAnalytics
    experimentData: ExperimentAnalytics
    contentData: ContentAnalytics
    funnelData: FunnelAnalytics
}
export interface PersonaAnalytics {
    distribution: Record<string, number>
    performance: Record<string, PersonaPerformance>
    trends: Record<string, number[]>
    accuracy: number
}
export interface PersonaPerformance {
    conversionRate: number
    engagementRate: number
    averageOrderValue: number
    retentionRate: number
    satisfaction: number
}
export interface ExperimentAnalytics {
    active: number
    completed: number
    totalRevenue: number
    averageImprovement: number
    statisticalPower: number
    winners: ExperimentWinner[]
}
export interface ExperimentWinner {
    experimentId: string
    variantId: string
    improvement: number
    confidence: number
    impact: string
}
export interface ContentAnalytics {
    variantPerformance: Record<string, VariantPerformance>
    popularVariations: string[]
    underperforming: string[]
    recommendations: ContentRecommendation[]
}
export interface VariantPerformance {
    views: number
    conversions: number
    engagement: number
    bounceRate: number
    averageTimeOnPage: number
}
export interface ContentRecommendation {
    type: 'optimize' | 'test' | 'replace' | 'promote'
    target: string
    reason: string
    expectedImpact: number
    priority: 'low' | 'medium' | 'high'
}
export interface FunnelAnalytics {
    stages: FunnelStage[]
    conversionRates: Record<string, number>
    dropoffPoints: DropoffPoint[]
    personaFunnels: Record<string, FunnelStage[]>
}
export interface FunnelStage {
    name: string
    users: number
    conversionRate: number
    averageTime: number
    abandonmentRate: number
}
export interface DropoffPoint {
    stage: string
    percentage: number
    reasons: string[]
    affectedPersonas: string[]
}
// Utility types
export type PersonaType =
    | 'price-conscious'
    | 'quality-focused'
    | 'convenience-seeker'
    | 'tech-savvy'
    | 'health-conscious'
    | 'budget-planner'
    | 'urgent-buyer'
    | 'researcher'
export type EngagementLevel = 'low' | 'medium' | 'high'
export type ConversionType = 'purchase' | 'lead' | 'signup' | 'engagement'
export type PersonalizationStrategy = 'rule-based' | 'ml-based' | 'hybrid'
export type CacheStrategy = 'memory' | 'localStorage' | 'sessionStorage' | 'edge'
// Error types
export class PersonalizationError extends Error {
    constructor(
        message: string,
        public code: string,
        public context?: any
    ) {
        super(message)
        this.name = 'PersonalizationError'
    }
}
export class PersonaAnalysisError extends PersonalizationError {
    constructor(message: string, context?: any) {
        super(message, 'PERSONA_ANALYSIS_ERROR', context)
    }
}
export class ContentAdaptationError extends PersonalizationError {
    constructor(message: string, context?: any) {
        super(message, 'CONTENT_ADAPTATION_ERROR', context)
    }
}
export class RoutingError extends PersonalizationError {
    constructor(message: string, context?: any) {
        super(message, 'ROUTING_ERROR', context)
    }
}
export class ExperimentError extends PersonalizationError {
    constructor(message: string, context?: any) {
        super(message, 'EXPERIMENT_ERROR', context)
    }
}
export class ConsentError extends PersonalizationError {
    constructor(message: string, context?: any) {
        super(message, 'CONSENT_ERROR', context)
    }
}