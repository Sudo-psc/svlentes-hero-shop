import { UserProfile, ContentVariations, BehaviorData, PersonalizationConfig } from '@/types/personalization'
import { DEFAULT_PERSONALIZATION_CONFIG } from './config'
import { PersonaAnalyzer, AnalysisContext } from './persona-analyzer'
import { personalizationStorage } from './storage'
import { PersonalizationError } from '@/types/personalization'
export interface PersonalizationEngineConfig {
    enabled: boolean
    debug: boolean
    autoUpdate: boolean
    updateInterval: number
    consentRequired: boolean
}
export interface PersonalizationState {
    profile: UserProfile | null
    variations: ContentVariations | null
    isLoading: boolean
    error: string | null
    lastUpdated: Date
    sessionId: string
}
export class PersonalizationEngine {
    private sessionId: string
    private config: PersonalizationEngineConfig
    private state: PersonalizationState
    private personaAnalyzer: PersonaAnalyzer
    private updateTimer?: NodeJS.Timeout
    private listeners: Set<(state: PersonalizationState) => void>
    constructor(sessionId: string, config?: Partial<PersonalizationEngineConfig>) {
        this.sessionId = sessionId
        this.config = {
            enabled: DEFAULT_PERSONALIZATION_CONFIG.enabled,
            debug: DEFAULT_PERSONALIZATION_CONFIG.debug,
            autoUpdate: true,
            updateInterval: 60000, // 1 minuto
            consentRequired: DEFAULT_PERSONALIZATION_CONFIG.consentRequired,
            ...config
        }
        this.state = {
            profile: null,
            variations: null,
            isLoading: false,
            error: null,
            lastUpdated: new Date(),
            sessionId
        }
        this.personaAnalyzer = new PersonaAnalyzer(sessionId)
        this.listeners = new Set()
        if (this.config.autoUpdate) {
            this.startAutoUpdate()
        }
    }
    // Métodos principais
    async initialize(context: Partial<AnalysisContext>): Promise<void> {
        try {
            this.setState({ isLoading: true, error: null })
            // Verificar consentimento
            if (this.config.consentRequired) {
                const hasConsent = await this.checkConsent()
                if (!hasConsent) {
                    throw new PersonalizationError('Consent required for personalization', 'CONSENT_ERROR')
                }
            }
            // Criar contexto completo
            const fullContext = await this.createAnalysisContext(context)
            // Analisar perfil do usuário
            const profile = await this.personaAnalyzer.analyzeUserProfile(fullContext)
            // Gerar variações de conteúdo
            const variations = await this.generateContentVariations(profile)
            // Atualizar estado
            this.setState({
                profile,
                variations,
                isLoading: false,
                lastUpdated: new Date()
            })
            // Salvar no storage
            await personalizationStorage.setUserProfile(this.sessionId, profile)
            if (this.config.debug) {
                console.log('[PersonalizationEngine] Initialized successfully', {
                    persona: profile.primaryPersona,
                    confidence: profile.confidenceScore,
                    variations: variations.variant
                })
            }
        } catch (error) {
            console.error('[PersonalizationEngine] Initialization error:', error)
            this.setState({
                isLoading: false,
                error: error instanceof Error ? error.message : 'Unknown error'
            })
        }
    }
    async updateProfile(context: Partial<AnalysisContext>): Promise<UserProfile | null> {
        try {
            if (!this.config.enabled) return null
            const fullContext = await this.createAnalysisContext(context)
            const profile = await this.personaAnalyzer.analyzeUserProfile(fullContext)
            const variations = await this.generateContentVariations(profile)
            this.setState({
                profile,
                variations,
                lastUpdated: new Date()
            })
            await personalizationStorage.setUserProfile(this.sessionId, profile)
            return profile
        } catch (error) {
            console.error('[PersonalizationEngine] Profile update error:', error)
            this.setState({
                error: error instanceof Error ? error.message : 'Unknown error'
            })
            return null
        }
    }
    async trackBehavior(behaviorData: Partial<BehaviorData>): Promise<void> {
        try {
            if (!this.config.enabled) return
            const behavior: BehaviorData = {
                type: behaviorData.type || 'page_view',
                element: behaviorData.element,
                value: behaviorData.value,
                timestamp: new Date(),
                sessionId: this.sessionId,
                context: behaviorData.context || {},
                userId: this.state.profile?.sessionId,
                persona: this.state.profile?.primaryPersona
            }
            await personalizationStorage.addBehaviorData(this.sessionId, behavior)
            // Disparar atualização automática se comportamento for significativo
            if (this.isSignificantBehavior(behavior)) {
                await this.triggerAutoUpdate('significant_behavior')
            }
            if (this.config.debug) {
                console.log('[PersonalizationEngine] Behavior tracked:', {
                    type: behavior.type,
                    element: behavior.element,
                    persona: behavior.persona
                })
            }
        } catch (error) {
            console.error('[PersonalizationEngine] Behavior tracking error:', error)
        }
    }
    async trackConversion(conversionData: any): Promise<void> {
        try {
            if (!this.config.enabled) return
            const behavior: BehaviorData = {
                type: 'conversion',
                value: conversionData,
                timestamp: new Date(),
                sessionId: this.sessionId,
                context: {
                    conversionValue: conversionData.value,
                    conversionType: conversionData.type
                },
                userId: this.state.profile?.sessionId,
                persona: this.state.profile?.primaryPersona
            }
            await personalizationStorage.addBehaviorData(this.sessionId, behavior)
            // Atualizar perfil após conversão
            if (this.state.profile) {
                const updatedProfile = {
                    ...this.state.profile,
                    conversionProbability: Math.min(
                        this.state.profile.conversionProbability + 0.1,
                        1.0
                    ),
                    lastUpdated: new Date()
                }
                this.setState({ profile: updatedProfile })
                await personalizationStorage.setUserProfile(this.sessionId, updatedProfile)
            }
            if (this.config.debug) {
            }
        } catch (error) {
            console.error('[PersonalizationEngine] Conversion tracking error:', error)
        }
    }
    async getContentVariations(): Promise<ContentVariations | null> {
        return this.state.variations
    }
    async refreshProfile(): Promise<void> {
        try {
            if (!this.state.profile) return
            this.setState({ isLoading: true })
            // Recarregar do storage
            const storedProfile = await personalizationStorage.getUserProfile(this.sessionId)
            if (storedProfile) {
                const variations = await this.generateContentVariations(storedProfile)
                this.setState({
                    profile: storedProfile,
                    variations,
                    isLoading: false,
                    lastUpdated: new Date()
                })
            } else {
                this.setState({ isLoading: false })
            }
        } catch (error) {
            console.error('[PersonalizationEngine] Profile refresh error:', error)
            this.setState({
                isLoading: false,
                error: error instanceof Error ? error.message : 'Unknown error'
            })
        }
    }
    // Métodos de estado
    getState(): PersonalizationState {
        return { ...this.state }
    }
    subscribe(listener: (state: PersonalizationState) => void): () => void {
        this.listeners.add(listener)
        // Retornar função de unsubscribe
        return () => {
            this.listeners.delete(listener)
        }
    }
    private setState(newState: Partial<PersonalizationState>): void {
        const updatedState = { ...this.state, ...newState }
        this.state = updatedState
        // Notificar listeners
        this.listeners.forEach(listener => {
            try {
                listener(updatedState)
            } catch (error) {
                console.error('[PersonalizationEngine] Listener error:', error)
            }
        })
    }
    // Métodos auxiliares
    private async createAnalysisContext(context: Partial<AnalysisContext>): Promise<AnalysisContext> {
        const now = new Date()
        return {
            sessionId: this.sessionId,
            timestamp: now,
            userAgent: context.userAgent || (typeof navigator !== 'undefined' ? navigator.userAgent : ''),
            url: context.url || (typeof window !== 'undefined' ? window.location.href : ''),
            referer: context.referer || (typeof document !== 'undefined' ? document.referrer : ''),
            deviceInfo: context.deviceInfo || this.getDeviceInfo(),
            pageAnalysis: context.pageAnalysis || this.getPageAnalysis(),
            trafficSource: context.trafficSource || this.getTrafficSource(),
            temporalData: context.temporalData || this.getTemporalData(now)
        }
    }
    private async generateContentVariations(profile: UserProfile): Promise<ContentVariations> {
        // Implementar geração de variações baseada no perfil
        const persona = profile.primaryPersona
        return {
            variant: `${persona}-default`,
            microcopy: this.getMicrocopyVariations(persona),
            visualElements: this.getVisualVariations(persona),
            layout: this.getLayoutVariations(persona),
            features: this.getFeatureVariations(persona, profile),
            locale: 'pt-BR'
        }
    }
    private getMicrocopyVariations(persona: string): any {
        // Implementar variações de microcopy baseadas na persona
        const microcopyLibrary = {
            'price-conscious': {
                headlines: {
                    hero: 'Economize até 70% em suas lentes de contato',
                    pricing: 'Os melhores preços do mercado',
                    calculator: 'Calcule sua economia'
                },
                ctas: {
                    primary: 'Calcular minha economia',
                    secondary: 'Ver planos e preços'
                }
            },
            'quality-focused': {
                headlines: {
                    hero: 'Lentes premium com qualidade superior',
                    pricing: 'Invista na saúde dos seus olhos',
                    calculator: 'Qualidade que vale o investimento'
                },
                ctas: {
                    primary: 'Conhecer produtos premium',
                    secondary: 'Ver qualidade garantida'
                }
            },
            'convenience-seeker': {
                headlines: {
                    hero: 'Lentes na porta da sua casa todo mês',
                    pricing: 'Praticidade e conforto para sua rotina',
                    calculator: 'Economia de tempo e dinheiro'
                },
                ctas: {
                    primary: 'Receber amostra gratuita',
                    secondary: 'Testar por 30 dias'
                }
            }
        }
        return microcopyLibrary[persona as keyof typeof microcopyLibrary] || microcopyLibrary['price-conscious']
    }
    private getVisualVariations(persona: string): any {
        // Implementar variações visuais baseadas na persona
        const visualLibrary = {
            'price-conscious': {
                heroImages: {
                    home: '/images/hero/savings-focused.jpg',
                    pricing: '/images/hero/price-comparison.jpg'
                },
                colorSchemes: {
                    primary: '#10B981', // Verde
                    secondary: '#059669',
                    accent: '#F59E0B' // Amarelo
                }
            },
            'quality-focused': {
                heroImages: {
                    home: '/images/hero/premium-quality.jpg',
                    pricing: '/images/hero/luxury-presentation.jpg'
                },
                colorSchemes: {
                    primary: '#1E40AF', // Azul escuro
                    secondary: '#1E3A8A',
                    accent: '#DC2626' // Vermelho
                }
            },
            'convenience-seeker': {
                heroImages: {
                    home: '/images/hero/convenience-lifestyle.jpg',
                    pricing: '/images/hero/easy-solution.jpg'
                },
                colorSchemes: {
                    primary: '#7C3AED', // Roxo
                    secondary: '#6D28D9',
                    accent: '#06B6D4' // Ciano
                }
            }
        }
        return visualLibrary[persona as keyof typeof visualLibrary] || visualLibrary['price-conscious']
    }
    private getLayoutVariations(persona: string): any {
        // Implementar variações de layout baseadas na persona
        const layoutLibrary = {
            'price-conscious': {
                componentOrder: {
                    home: ['hero', 'calculator', 'pricing', 'benefits', 'testimonials', 'cta', 'faq'],
                    pricing: ['hero', 'plans', 'comparison', 'guarantee', 'cta']
                },
                sectionVisibility: {
                    testimonials: true,
                    guarantees: true,
                    trustBadges: true
                }
            },
            'quality-focused': {
                componentOrder: {
                    home: ['hero', 'quality-badges', 'benefits', 'testimonials', 'pricing', 'cta', 'faq'],
                    pricing: ['hero', 'premium-features', 'plans', 'quality-guarantee', 'cta']
                },
                sectionVisibility: {
                    testimonials: true,
                    guarantees: true,
                    specifications: true
                }
            },
            'convenience-seeker': {
                componentOrder: {
                    home: ['hero', 'how-it-works', 'benefits', 'testimonials', 'pricing', 'cta', 'faq'],
                    pricing: ['hero', 'convenience-features', 'plans', 'easy-setup', 'cta']
                },
                sectionVisibility: {
                    testimonials: true,
                    features: true,
                    quickStart: true
                }
            }
        }
        return layoutLibrary[persona as keyof typeof layoutLibrary] || layoutLibrary['price-conscious']
    }
    private getFeatureVariations(persona: string, profile: UserProfile): any {
        // Implementar variações de features baseadas na persona e perfil
        const baseFeatures = ['savings-calculator', 'price-comparison', 'email-notifications']
        const personaFeatures = {
            'price-conscious': [...baseFeatures, 'budget-alerts', 'discount-finder'],
            'quality-focused': [...baseFeatures, 'premium-support', 'quality-guarantee'],
            'convenience-seeker': [...baseFeatures, 'auto-delivery', 'quick-reorder'],
            'urgent-buyer': [...baseFeatures, 'express-checkout', 'priority-support'],
            'researcher': [...baseFeatures, 'detailed-comparison', 'specification-download']
        }
        return {
            enabledFeatures: personaFeatures[persona as keyof typeof personaFeatures] || baseFeatures,
            featureHighlights: this.getFeatureHighlights(profile),
            promotionalOffers: this.getPromotionalOffers(persona, profile)
        }
    }
    private getFeatureHighlights(profile: UserProfile): string[] {
        // Gerar highlights baseados no perfil atual
        const highlights = []
        if (profile.conversionProbability > 0.7) {
            highlights.push('alta probabilidade de conversão')
        }
        if (profile.confidenceScore > 0.8) {
            highlights.push('perfil bem definido')
        }
        if (profile.engagementLevel === 'high') {
            highlights.push('alto engajamento')
        }
        return highlights
    }
    private getPromotionalOffers(persona: string, profile: UserProfile): any {
        // Gerar ofertas promocionais baseadas na persona
        const offers = {
            'price-conscious': {
                type: 'discount',
                value: '15%',
                condition: 'primeira compra',
                expiration: '24h'
            },
            'quality-focused': {
                type: 'upgrade',
                value: 'premium',
                condition: 'assinatura anual',
                expiration: '48h'
            },
            'convenience-seeker': {
                type: 'service',
                value: 'entrega expressa',
                condition: 'primeiro mês',
                expiration: '15d'
            },
            'urgent-buyer': {
                type: 'priority',
                value: 'atendimento prioritário',
                condition: 'imediato',
                expiration: '6h'
            }
        }
        return offers[persona as keyof typeof offers] || offers['price-conscious']
    }
    private getDeviceInfo(): any {
        if (typeof window === 'undefined') {
            return {
                type: 'unknown',
                os: 'unknown',
                browser: 'unknown'
            }
        }
        const ua = navigator.userAgent
        // Detectar tipo de dispositivo
        let type: 'desktop' | 'mobile' | 'tablet' = 'desktop'
        if (/Mobile|Android|iPhone|iPad/.test(ua)) {
            if (/iPad|Tablet/.test(ua)) {
                type = 'tablet'
            } else {
                type = 'mobile'
            }
        }
        // Detectar sistema operacional
        let os = 'unknown'
        if (ua.includes('Windows')) os = 'windows'
        else if (ua.includes('Mac')) os = 'mac'
        else if (ua.includes('Linux')) os = 'linux'
        else if (ua.includes('Android')) os = 'android'
        else if (ua.includes('iOS')) os = 'ios'
        // Detectar browser
        let browser = 'unknown'
        if (ua.includes('Chrome')) browser = 'chrome'
        else if (ua.includes('Firefox')) browser = 'firefox'
        else if (ua.includes('Safari')) browser = 'safari'
        else if (ua.includes('Edge')) browser = 'edge'
        return {
            type,
            os,
            browser,
            screenResolution: `${screen.width}x${screen.height}`,
            viewportSize: `${window.innerWidth}x${window.innerHeight}`
        }
    }
    private getPageAnalysis(): any {
        if (typeof window === 'undefined') {
            return {
                path: '/',
                query: {},
                hash: '',
                sections: []
            }
        }
        const url = new URL(window.location.href)
        const sections = Array.from(document.querySelectorAll('section[id]'))
            .map(section => section.id)
            .filter(Boolean)
        return {
            path: url.pathname,
            query: Object.fromEntries(url.searchParams),
            hash: url.hash,
            sections,
            scrollDepth: window.scrollY,
            timeOnPage: 0 // Será calculado pelo BehaviorTracker
        }
    }
    private getTrafficSource(): any {
        if (typeof document === 'undefined') {
            return { type: 'direct' }
        }
        const referer = document.referrer
        if (!referer) return { type: 'direct' }
        try {
            const refererUrl = new URL(referer)
            const domain = refererUrl.hostname
            if (domain.includes('google')) return { type: 'organic', source: 'google' }
            if (domain.includes('facebook')) return { type: 'social', source: 'facebook' }
            if (domain.includes('instagram')) return { type: 'social', source: 'instagram' }
            if (domain.includes('whatsapp')) return { type: 'social', source: 'whatsapp' }
            return { type: 'referral', source: domain }
        } catch {
            return { type: 'direct' }
        }
    }
    private getTemporalData(date: Date): any {
        return {
            hour: date.getHours(),
            dayOfWeek: date.getDay(),
            dayOfMonth: date.getDate(),
            month: date.getMonth(),
            year: date.getFullYear(),
            timeOfDay: this.getTimeOfDay(date),
            isWeekend: date.getDay() === 0 || date.getDay() === 6,
            isBusinessHours: date.getHours() >= 9 && date.getHours() <= 17,
            season: this.getSeason(date)
        }
    }
    private getTimeOfDay(date: Date): 'morning' | 'afternoon' | 'evening' | 'night' {
        const hour = date.getHours()
        if (hour >= 6 && hour < 12) return 'morning'
        if (hour >= 12 && hour < 18) return 'afternoon'
        if (hour >= 18 && hour < 22) return 'evening'
        return 'night'
    }
    private getSeason(date: Date): 'spring' | 'summer' | 'fall' | 'winter' {
        const month = date.getMonth()
        if (month >= 2 && month <= 4) return 'spring'
        if (month >= 5 && month <= 7) return 'summer'
        if (month >= 8 && month <= 10) return 'fall'
        return 'winter'
    }
    private async checkConsent(): Promise<boolean> {
        try {
            const consent = await personalizationStorage.getConsentStatus()
            return consent?.personalization || false
        } catch {
            return false
        }
    }
    private isSignificantBehavior(behavior: BehaviorData): boolean {
        // Determinar se o comportamento é significativo o suficiente para justificar atualização
        const significantTypes = ['conversion', 'form_interaction', 'abandonment']
        return significantTypes.includes(behavior.type)
    }
    private async triggerAutoUpdate(reason: string): Promise<void> {
        if (this.config.debug) {
        }
        try {
            const context = {
                deviceInfo: this.getDeviceInfo(),
                pageAnalysis: this.getPageAnalysis(),
                trafficSource: this.getTrafficSource(),
                temporalData: this.getTemporalData(new Date())
            }
            await this.updateProfile(context)
        } catch (error) {
            console.error('[PersonalizationEngine] Auto update error:', error)
        }
    }
    private startAutoUpdate(): void {
        if (this.updateTimer) {
            clearInterval(this.updateTimer)
        }
        this.updateTimer = setInterval(async () => {
            if (this.state.profile) {
                const timeSinceLastUpdate = Date.now() - this.state.lastUpdated.getTime()
                // Atualizar se passou tempo suficiente
                if (timeSinceLastUpdate > this.config.updateInterval) {
                    await this.refreshProfile()
                }
            }
        }, this.config.updateInterval)
    }
    private stopAutoUpdate(): void {
        if (this.updateTimer) {
            clearInterval(this.updateTimer)
            this.updateTimer = undefined
        }
    }
    // Métodos de lifecycle
    async destroy(): Promise<void> {
        this.stopAutoUpdate()
        this.listeners.clear()
        // Limpar estado
        this.setState({
            profile: null,
            variations: null,
            isLoading: false,
            error: null
        })
    }
    // Métodos de utilidade
    async getAnalytics(): Promise<any> {
        if (!this.state.profile) return null
        return {
            sessionId: this.sessionId,
            persona: this.state.profile.primaryPersona,
            confidence: this.state.profile.confidenceScore,
            engagementLevel: this.state.profile.engagementLevel,
            conversionProbability: this.state.profile.conversionProbability,
            lastUpdated: this.state.lastUpdated,
            behavioralPatternsCount: this.state.profile.behavioralPatterns.length,
            recommendations: this.getRecommendations()
        }
    }
    private getRecommendations(): string[] {
        if (!this.state.profile) return []
        const recommendations = []
        const persona = this.state.profile.primaryPersona
        // Recomendações baseadas na persona
        switch (persona) {
            case 'price-conscious':
                if (this.state.profile.conversionProbability > 0.7) {
                    recommendations.push('Mostrar ofertas especiais')
                }
                if (this.state.profile.engagementLevel === 'low') {
                    recommendations.push('Apresentar calculadora de economia')
                }
                break
            case 'quality-focused':
                if (this.state.profile.confidenceScore < 0.5) {
                    recommendations.push('Apresentar provas sociais')
                }
                break
            case 'convenience-seeker':
                if (this.state.profile.engagementLevel === 'high') {
                    recommendations.push('Oferecer upgrade de plano')
                }
                break
            case 'urgent-buyer':
                if (this.state.profile.conversionProbability > 0.8) {
                    recommendations.push('Remover barreiras de compra')
                }
                break
        }
        return recommendations
    }
    // Métodos de debug
    async debugInfo(): Promise<any> {
        if (!this.config.debug) return null
        return {
            config: this.config,
            state: this.state,
            sessionId: this.sessionId,
            listenersCount: this.listeners.size,
            autoUpdateTimer: this.updateTimer ? 'active' : 'inactive',
            storageStats: await personalizationStorage.getStorageStats(),
            healthCheck: await personalizationStorage.healthCheck()
        }
    }
    // Métodos estáticos de fábrica
    static async create(sessionId: string): Promise<PersonalizationEngine> {
        const engine = new PersonalizationEngine(sessionId)
        // Inicialização automática
        await engine.initialize({})
        return engine
    }
    static async createWithConfig(
        sessionId: string,
        config: Partial<PersonalizationEngineConfig>
    ): Promise<PersonalizationEngine> {
        const engine = new PersonalizationEngine(sessionId, config)
        if (config.enabled !== false) {
            await engine.initialize({})
        }
        return engine
    }
}
// Export padrão
export default PersonalizationEngine
// Funções de conveniência
export async function createPersonalizationEngine(sessionId: string): Promise<PersonalizationEngine> {
    return PersonalizationEngine.create(sessionId)
}
export async function createPersonalizationEngineWithConfig(
    sessionId: string,
    config: Partial<PersonalizationEngineConfig>
): Promise<PersonalizationEngine> {
    return PersonalizationEngine.createWithConfig(sessionId, config)
}