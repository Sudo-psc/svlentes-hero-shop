// Conversion Tracking and Funnel Analytics
// Implements lead capture, plan selection, and abandonment tracking
import { trackEvent, trackConversionFunnel, setUserProperties } from './analytics'
// Conversion funnel stages based on the design document
export type FunnelStage =
    | 'page_view'           // User lands on page
    | 'hero_engagement'     // User interacts with hero section
    | 'lead_capture'        // User submits lead form
    | 'calculator_used'     // User uses economy calculator
    | 'pricing_viewed'      // User views pricing section
    | 'plan_selected'       // User selects a plan
    | 'checkout_started'    // User starts checkout process
    | 'payment_completed'   // User completes payment
    | 'consultation_booked' // User books consultation
// Funnel step mapping for analytics
const FUNNEL_STEPS: Record<FunnelStage, number> = {
    page_view: 1,
    hero_engagement: 2,
    lead_capture: 3,
    calculator_used: 4,
    pricing_viewed: 5,
    plan_selected: 6,
    checkout_started: 7,
    payment_completed: 8,
    consultation_booked: 8, // Alternative to payment
}
// User journey state management
interface UserJourneyState {
    sessionId: string
    startTime: number
    currentStage: FunnelStage
    completedStages: FunnelStage[]
    leadData?: {
        nome: string
        email: string
        whatsapp: string
    }
    calculatorData?: {
        currentSpending: number
        lensType: string
        usage: string
        economyCalculated: number
    }
    selectedPlan?: {
        planId: string
        billingInterval: 'monthly' | 'annual'
        price: number
    }
    abandonmentPoints: Array<{
        stage: FunnelStage
        timestamp: number
        reason?: string
    }>
}
// Session storage key for user journey
const JOURNEY_STORAGE_KEY = 'svlentes_user_journey'
// Initialize user journey tracking
export function initializeUserJourney(): string {
    const sessionId = generateSessionId()
    const initialState: UserJourneyState = {
        sessionId,
        startTime: Date.now(),
        currentStage: 'page_view',
        completedStages: ['page_view'],
        abandonmentPoints: []
    }
    saveJourneyState(initialState)
    // Track initial page view
    trackConversionFunnel('awareness', {
        funnel_step: FUNNEL_STEPS.page_view,
        funnel_name: 'svlentes_subscription',
    })
    // Set initial user properties
    setUserProperties({
        user_type: 'new',
        subscription_status: 'none',
        acquisition_source: getAcquisitionSource(),
    })
    return sessionId
}
// Progress to next funnel stage
export function progressFunnelStage(
    stage: FunnelStage,
    data?: {
        leadData?: UserJourneyState['leadData']
        calculatorData?: UserJourneyState['calculatorData']
        selectedPlan?: UserJourneyState['selectedPlan']
        value?: number
    }
) {
    const currentState = getJourneyState()
    if (!currentState) return
    // Don't regress in the funnel
    if (FUNNEL_STEPS[stage] <= FUNNEL_STEPS[currentState.currentStage]) {
        return
    }
    const updatedState: UserJourneyState = {
        ...currentState,
        currentStage: stage,
        completedStages: [...currentState.completedStages, stage],
        ...(data?.leadData && { leadData: data.leadData }),
        ...(data?.calculatorData && { calculatorData: data.calculatorData }),
        ...(data?.selectedPlan && { selectedPlan: data.selectedPlan }),
    }
    saveJourneyState(updatedState)
    // Track funnel progression
    const funnelStage = getFunnelStageForAnalytics(stage)
    trackConversionFunnel(funnelStage, {
        funnel_step: FUNNEL_STEPS[stage],
        funnel_name: 'svlentes_subscription',
        value: data?.value,
        currency: data?.value ? 'BRL' : undefined,
    })
    // Update user properties based on stage
    updateUserPropertiesForStage(stage, updatedState)
}
// Track abandonment at specific points
export function trackAbandonment(
    stage: FunnelStage,
    reason?: string,
    additionalData?: Record<string, any>
) {
    const currentState = getJourneyState()
    if (!currentState) return
    const abandonmentPoint = {
        stage,
        timestamp: Date.now(),
        reason
    }
    const updatedState: UserJourneyState = {
        ...currentState,
        abandonmentPoints: [...currentState.abandonmentPoints, abandonmentPoint]
    }
    saveJourneyState(updatedState)
    // Track abandonment event
    trackEvent('section_viewed', {
        section_name: 'abandonment_point',
        scroll_depth: FUNNEL_STEPS[stage],
        time_on_section: Date.now() - currentState.startTime,
    })
    // Track specific abandonment reasons
    if (reason) {
        trackEvent('form_validation_error', {
            form_type: stage,
            field_name: reason,
            error_message: reason,
        })
    }
}
// Get conversion metrics for analysis
export function getConversionMetrics(): {
    sessionDuration: number
    stagesCompleted: number
    conversionRate: number
    abandonmentPoints: number
    currentStage: FunnelStage
} {
    const state = getJourneyState()
    if (!state) {
        return {
            sessionDuration: 0,
            stagesCompleted: 0,
            conversionRate: 0,
            abandonmentPoints: 0,
            currentStage: 'page_view'
        }
    }
    const sessionDuration = Date.now() - state.startTime
    const totalStages = Object.keys(FUNNEL_STEPS).length
    const stagesCompleted = state.completedStages.length
    const conversionRate = (stagesCompleted / totalStages) * 100
    return {
        sessionDuration,
        stagesCompleted,
        conversionRate,
        abandonmentPoints: state.abandonmentPoints.length,
        currentStage: state.currentStage
    }
}
// Lead capture tracking
export function trackLeadCapture(leadData: {
    nome: string
    email: string
    whatsapp: string
    source: string
}) {
    progressFunnelStage('lead_capture', { leadData })
    trackEvent('lead_form_submit', {
        source: leadData.source as 'hero_form',
        form_variant: 'standard',
        user_type: 'new',
    })
    // Update user properties with lead data
    setUserProperties({
        user_type: 'returning',
        acquisition_source: leadData.source,
    })
}
// Plan selection tracking
export function trackPlanSelection(planData: {
    planId: string
    billingInterval: 'monthly' | 'annual'
    price: number
    planTier: 'basic' | 'premium' | 'vip'
}) {
    progressFunnelStage('plan_selected', {
        selectedPlan: planData,
        value: planData.price
    })
    trackEvent('plan_selected', {
        plan_name: planData.planId,
        price: planData.price,
        billing_interval: planData.billingInterval,
        plan_tier: planData.planTier,
    })
    // Update user properties
    setUserProperties({
        plan_type: planData.planId,
        customer_lifetime_value: planData.billingInterval === 'annual'
            ? planData.price
            : planData.price * 12,
    })
}
// Calculator usage tracking
export function trackCalculatorUsage(calculatorData: {
    currentSpending: number
    lensType: string
    usage: string
    economyCalculated: number
}) {
    progressFunnelStage('calculator_used', { calculatorData })
    trackEvent('calculator_used', {
        economy_calculated: calculatorData.economyCalculated,
        lens_type: calculatorData.lensType,
        usage_pattern: calculatorData.usage,
        current_spending: calculatorData.currentSpending,
    })
}
// Checkout tracking
export function trackCheckoutStarted(checkoutData: {
    planId: string
    value: number
    sessionId?: string
}) {
    progressFunnelStage('checkout_started', { value: checkoutData.value })
    trackEvent('plan_selected', {
        plan_name: checkoutData.planId,
        price: checkoutData.value,
        billing_interval: 'monthly', // Could be determined from plan
        plan_tier: 'basic', // Could be determined from plan
    })
}
// Payment completion tracking
export function trackPaymentCompleted(paymentData: {
    transactionId: string
    planId: string
    value: number
    currency: string
    subscriptionId?: string
}) {
    progressFunnelStage('payment_completed', { value: paymentData.value })
    trackEvent('subscription_started', {
        plan_id: paymentData.planId,
        value: paymentData.value,
        currency: 'BRL',
        billing_interval: 'monthly', // Could be determined from plan
        transaction_id: paymentData.transactionId,
    })
    // Update user properties for successful conversion
    setUserProperties({
        user_type: 'subscriber',
        subscription_status: 'active',
        plan_type: paymentData.planId,
        customer_lifetime_value: paymentData.value,
    })
}
// Consultation booking tracking
export function trackConsultationBooked(consultationData: {
    planInterest: string
    source: string
}) {
    progressFunnelStage('consultation_booked')
    trackEvent('consultation_scheduled', {
        plan_interest: consultationData.planInterest,
        source: consultationData.source,
        form_completion_time: Date.now(),
    })
}
// Utility functions
function generateSessionId(): string {
    return `svlentes_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
}
function getJourneyState(): UserJourneyState | null {
    if (typeof window === 'undefined') return null
    try {
        const stored = localStorage.getItem(JOURNEY_STORAGE_KEY)
        return stored ? JSON.parse(stored) : null
    } catch {
        return null
    }
}
function saveJourneyState(state: UserJourneyState): void {
    if (typeof window === 'undefined') return
    try {
        localStorage.setItem(JOURNEY_STORAGE_KEY, JSON.stringify(state))
    } catch (error) {
        console.warn('Failed to save journey state:', error)
    }
}
function getFunnelStageForAnalytics(stage: FunnelStage): 'awareness' | 'interest' | 'consideration' | 'intent' | 'evaluation' | 'purchase' {
    switch (stage) {
        case 'page_view':
        case 'hero_engagement':
            return 'awareness'
        case 'lead_capture':
        case 'calculator_used':
            return 'interest'
        case 'pricing_viewed':
            return 'consideration'
        case 'plan_selected':
            return 'intent'
        case 'checkout_started':
            return 'evaluation'
        case 'payment_completed':
        case 'consultation_booked':
            return 'purchase'
        default:
            return 'awareness'
    }
}
function updateUserPropertiesForStage(stage: FunnelStage, state: UserJourneyState): void {
    const properties: Record<string, any> = {}
    if (state.leadData) {
        properties.user_type = 'returning'
    }
    if (state.selectedPlan) {
        properties.plan_type = state.selectedPlan.planId
    }
    if (stage === 'payment_completed') {
        properties.subscription_status = 'active'
        properties.user_type = 'subscriber'
    }
    if (Object.keys(properties).length > 0) {
        setUserProperties(properties)
    }
}
function getAcquisitionSource(): string {
    if (typeof window === 'undefined') return 'direct'
    const urlParams = new URLSearchParams(window.location.search)
    const utmSource = urlParams.get('utm_source')
    const referrer = document.referrer
    if (utmSource) return utmSource
    if (referrer) {
        try {
            const referrerDomain = new URL(referrer).hostname
            if (referrerDomain.includes('google')) return 'google'
            if (referrerDomain.includes('facebook')) return 'facebook'
            if (referrerDomain.includes('instagram')) return 'instagram'
            return 'referral'
        } catch {
            return 'referral'
        }
    }
    return 'direct'
}
// Initialize journey tracking on page load
if (typeof window !== 'undefined') {
    // Check if journey is already initialized
    const existingJourney = getJourneyState()
    if (!existingJourney) {
        initializeUserJourney()
    }
}