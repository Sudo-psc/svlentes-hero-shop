import { useState, useEffect, useCallback, useRef, useMemo } from 'react'
import React from 'react'
import { PersonalizationEngine, PersonalizationState } from '@/lib/personalization/personalization-engine'
import { BehaviorData, ContentVariations } from '@/types/personalization'
import { DEFAULT_PERSONALIZATION_CONFIG } from '@/lib/personalization/config'
interface UsePersonalizationOptions {
    sessionId?: string
    autoInitialize?: boolean
    config?: {
        enabled?: boolean
        debug?: boolean
        autoUpdate?: boolean
        updateInterval?: number
        consentRequired?: boolean
    }
}
interface UsePersonalizationReturn {
    // Estado
    profile: PersonalizationState['profile']
    variations: PersonalizationState['variations']
    isLoading: PersonalizationState['isLoading']
    error: PersonalizationState['error']
    // Ações
    initialize: () => Promise<void>
    updateProfile: () => Promise<void>
    trackBehavior: (behavior: Partial<BehaviorData>) => Promise<void>
    trackConversion: (conversionData: any) => Promise<void>
    refreshProfile: () => Promise<void>
    // Utilidade
    isInitialized: boolean
    isPersonaDetected: boolean
    persona: string | null
    confidence: number
    recommendations: string[]
    // Analytics
    getAnalytics: () => Promise<any>
    debugInfo: () => Promise<any>
}
export function usePersonalization(options: UsePersonalizationOptions = {}): UsePersonalizationReturn {
    const {
        sessionId: providedSessionId,
        autoInitialize = true,
        config: userConfig = {}
    } = options
    // Estado local
    const [engine, setEngine] = useState<PersonalizationEngine | null>(null)
    const [state, setState] = useState<PersonalizationState>({
        profile: null,
        variations: null,
        isLoading: false,
        error: null,
        lastUpdated: new Date(),
        sessionId: providedSessionId || ''
    })
    // Refs para evitar loops
    const engineRef = useRef<PersonalizationEngine | null>(null)
    const isInitializingRef = useRef(false)
    // Gerar sessionId se não fornecido
    const generateSessionId = useCallback(() => {
        // Tentar obter do cookie ou gerar novo
        if (typeof window !== 'undefined') {
            const storedSession = document.cookie
                .split('; ')
                .find(cookie => cookie.trim().startsWith('session_id='))
                ?.split('=')[1]
            if (storedSession) {
                return storedSession
            }
        }
        // Gerar novo sessionId
        return 'session_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9)
    }, [])
    const sessionId = providedSessionId || generateSessionId()
    // Configuração final
    const config = {
        ...DEFAULT_PERSONALIZATION_CONFIG,
        ...userConfig
    }
    // Inicializar engine
    useEffect(() => {
        if (engineRef.current) return
        const initializeEngine = async () => {
            try {
                if (isInitializingRef.current) return
                isInitializingRef.current = true
                const newEngine = new PersonalizationEngine(sessionId, {
                    enabled: config.enabled,
                    debug: config.debug,
                    autoUpdate: config.autoUpdate,
                    updateInterval: config.updateInterval,
                    consentRequired: config.consentRequired
                })
                // Assinar para atualizações de estado
                newEngine.subscribe((newState) => {
                    setState(newState)
                })
                // Inicializar se autoInitialize estiver ativo
                if (autoInitialize && config.enabled) {
                    await newEngine.initialize({
                        // Contexto inicial será criado internamente
                        deviceInfo: undefined,
                        pageAnalysis: undefined,
                        trafficSource: undefined,
                        temporalData: undefined
                    })
                }
                engineRef.current = newEngine
                setEngine(newEngine)
            } catch (error) {
                console.error('[usePersonalization] Engine initialization error:', error)
                setState(prev => ({
                    ...prev,
                    error: error instanceof Error ? error.message : 'Unknown error',
                    isLoading: false
                }))
            } finally {
                isInitializingRef.current = false
            }
        }
        initializeEngine()
    }, [sessionId, config, autoInitialize])
    // Cleanup
    useEffect(() => {
        return () => {
            if (engineRef.current) {
                engineRef.current.destroy()
                engineRef.current = null
            }
        }
    }, [])
    // Métodos de ação
    const initialize = useCallback(async () => {
        if (!engine) {
            throw new Error('Personalization engine not initialized')
        }
        return engine.initialize({
            deviceInfo: undefined,
            pageAnalysis: undefined,
            trafficSource: undefined,
            temporalData: undefined
        })
    }, [engine])
    const updateProfile = useCallback(async (): Promise<void> => {
        if (!engine) {
            throw new Error('Personalization engine not initialized')
        }
        const updatedProfile = await engine.updateProfile({
            deviceInfo: undefined,
            pageAnalysis: undefined,
            trafficSource: undefined,
            temporalData: undefined
        })
        if (updatedProfile) {
            setState(prev => ({ ...prev, profile: updatedProfile }))
        }
    }, [engine])
    const trackBehavior = useCallback(async (behaviorData: Partial<BehaviorData>) => {
        if (!engine || !config.enabled) return
        try {
            await engine.trackBehavior(behaviorData)
        } catch (error) {
            console.error('[usePersonalization] Behavior tracking error:', error)
        }
    }, [engine, config.enabled])
    const trackConversion = useCallback(async (conversionData: any) => {
        if (!engine || !config.enabled) return
        try {
            await engine.trackConversion(conversionData)
        } catch (error) {
            console.error('[usePersonalization] Conversion tracking error:', error)
        }
    }, [engine, config.enabled])
    const refreshProfile = useCallback(async () => {
        if (!engine) return
        try {
            await engine.refreshProfile()
        } catch (error) {
            console.error('[usePersonalization] Profile refresh error:', error)
        }
    }, [engine])
    // Utilidade computada
    const isInitialized = engine !== null
    const isPersonaDetected = state.profile !== null
    const persona = state.profile?.primaryPersona || null
    const confidence = state.profile?.confidenceScore || 0
    const recommendations = useCallback(() => {
        if (!engine) return []
        // Gerar recomendações baseadas no estado atual
        const recommendations = []
        if (state.profile) {
            const profile = state.profile
            if (profile.conversionProbability > 0.7) {
                recommendations.push('Mostrar ofertas especiais')
            }
            if (profile.confidenceScore > 0.8) {
                recommendations.push('Apresentar conteúdo personalizado')
            }
            if (profile.engagementLevel === 'high') {
                recommendations.push('Oferecer upgrade de plano')
            }
            if (profile.engagementLevel === 'low') {
                recommendations.push('Aumentar engajamento')
            }
            // Recomendações específicas por persona
            switch (profile.primaryPersona) {
                case 'price-conscious':
                    recommendations.push('Destacar economia e descontos')
                    break
                case 'quality-focused':
                    recommendations.push('Mostrar qualidade e garantias')
                    break
                case 'convenience-seeker':
                    recommendations.push('Simplificar processo de compra')
                    break
                case 'urgent-buyer':
                    recommendations.push('Remover barreiras de compra')
                    break
            }
        }
        return recommendations
    }, [engine, state.profile])
    // Analytics
    const getAnalytics = useCallback(async () => {
        if (!engine) return null
        try {
            return await engine.getAnalytics()
        } catch (error) {
            console.error('[usePersonalization] Analytics error:', error)
            return null
        }
    }, [engine])
    const debugInfo = useCallback(async () => {
        if (!engine || !config.debug) return null
        try {
            return await engine.debugInfo()
        } catch (error) {
            console.error('[usePersonalization] Debug info error:', error)
            return null
        }
    }, [engine, config.debug])
    // Auto tracking de comportamento
    useEffect(() => {
        if (!engine || !config.enabled) return
        const handlePageView = () => {
            trackBehavior({
                type: 'page_view',
                value: {
                    path: window.location.pathname,
                    title: document.title,
                    referrer: document.referrer
                }
            })
        }
        const handleScroll = () => {
            let lastScroll = 0
            const handleScrollEvent = () => {
                const currentScroll = window.scrollY
                const scrollDepth = (currentScroll / (document.body.scrollHeight - window.innerHeight)) * 100
                // Track scroll a cada 25%
                if (scrollDepth - lastScroll >= 25) {
                    trackBehavior({
                        type: 'scroll',
                        value: {
                            scrollDepth,
                            currentScroll,
                            maxScroll: document.body.scrollHeight - window.innerHeight
                        }
                    })
                    lastScroll = scrollDepth
                }
            }
            window.addEventListener('scroll', handleScrollEvent, { passive: true })
        }
        const handleClick = (event: MouseEvent) => {
            const target = event.target as HTMLElement
            trackBehavior({
                type: 'click',
                element: target.tagName.toLowerCase() + (target.id ? `#${target.id}` : ''),
                value: {
                    text: target.textContent?.trim(),
                    href: (target as HTMLAnchorElement).href,
                    coordinates: { x: event.clientX, y: event.clientY }
                }
            })
        }
        const handleFormInteraction = (event: Event) => {
            const target = event.target as HTMLInputElement
            trackBehavior({
                type: 'form_interaction',
                element: target.name || target.id || 'unknown',
                value: {
                    fieldType: target.type,
                    hasValue: target.value.length > 0,
                    required: target.required
                }
            })
        }
        // Adicionar listeners
        window.addEventListener('load', handlePageView)
        window.addEventListener('beforeunload', handlePageView)
        document.addEventListener('click', handleClick)
        document.addEventListener('input', handleFormInteraction)
        // Scroll tracking
        handleScroll()
        // Cleanup
        return () => {
            window.removeEventListener('load', handlePageView)
            window.removeEventListener('beforeunload', handlePageView)
            document.removeEventListener('click', handleClick)
            document.removeEventListener('input', handleFormInteraction)
        }
    }, [engine, config.enabled, trackBehavior])
    // Auto-refresh periódico
    useEffect(() => {
        if (!engine || !config.autoUpdate) return
        const interval = setInterval(() => {
            if (state.profile && Date.now() - state.lastUpdated.getTime() > 5 * 60 * 1000) {
                refreshProfile()
            }
        }, 5 * 60 * 1000) // 5 minutos
        return () => clearInterval(interval)
    }, [engine, config.autoUpdate, state.profile, state.lastUpdated, refreshProfile])
    return {
        // Estado
        profile: state.profile,
        variations: state.variations,
        isLoading: state.isLoading,
        error: state.error,
        // Ações
        initialize,
        updateProfile,
        trackBehavior,
        trackConversion,
        refreshProfile,
        // Utilidade
        isInitialized,
        isPersonaDetected,
        persona,
        confidence,
        recommendations: recommendations(),
        // Analytics
        getAnalytics,
        debugInfo
    }
}
// Hook para personalização de componentes
export function usePersonalizedContent<T = any>(
    contentType: keyof ContentVariations,
    fallback?: T
): T {
    const { variations, persona } = usePersonalization()
    // Obter conteúdo personalizado baseado na persona
    const getPersonalizedContent = useCallback((): T => {
        if (!variations || !persona) {
            return fallback || {} as T
        }
        const content = variations[contentType]
        return (content as T) || (fallback || {} as T)
    }, [variations, persona, fallback])
    return getPersonalizedContent()
}
// Hook para microcopy personalizada
export function usePersonalizedMicrocopy(
    key: string,
    fallback?: string
): string {
    const { variations, persona } = usePersonalization()
    return useMemo(() => {
        if (!variations?.microcopy || !persona) {
            return fallback || ''
        }
        const microcopy = variations.microcopy
        const value = microcopy[key as keyof typeof microcopy]
        return typeof value === 'string' ? value : fallback || ''
    }, [variations, persona, key, fallback])
}
// Hook para componentes personalizados
export function usePersonalizedComponent<T extends React.ComponentType<any>>(
    Component: T,
    personaVariants: Record<string, Partial<React.ComponentProps<T>>>
) {
    const { persona } = usePersonalization()
    return useMemo(() => {
        if (!persona || !personaVariants[persona]) {
            return Component
        }
        // Criar componente wrapper com props personalizados
        return (props: React.ComponentProps<T>) => {
            const personalizedProps = {
                ...props,
                ...personaVariants[persona],
                persona // Adicionar persona como prop para debug
            }
            return React.createElement(Component, personalizedProps)
        }
    }, [Component, persona, personaVariants])
}
// Hook para experimentos A/B
export function usePersonalizationExperiment(
    experimentId: string,
    variants: Record<string, any>,
    fallback?: any
) {
    const { profile, trackBehavior } = usePersonalization()
    const [assignedVariant, setAssignedVariant] = useState<string>('')
    const [isParticipant, setIsParticipant] = useState(false)
    // Obter ou atribuir variante do experimento
    useEffect(() => {
        if (!profile?.sessionId) return
        // Lógica simplificada - em produção usar sistema real de A/B testing
        const getVariant = () => {
            const hash = profile.sessionId.split('_')[1] || ''
            const hashInt = parseInt(hash, 36)
            const variantKeys = Object.keys(variants)
            const variantIndex = hashInt % variantKeys.length
            return variantKeys[variantIndex]
        }
        const variant = getVariant()
        setAssignedVariant(variant)
        setIsParticipant(true)
        // Track participação no experimento
        trackBehavior({
            type: 'page_view',
            element: 'experiment_participation',
            value: {
                experimentId,
                variant,
                participant: true
            }
        })
    }, [profile?.sessionId, trackBehavior, variants])
    const variant = useMemo(() => {
        if (!isParticipant || !assignedVariant) {
            return fallback
        }
        return variants[assignedVariant] || fallback
    }, [isParticipant, assignedVariant, variants, fallback])
    // Track conversão para o experimento
    const trackExperimentConversion = useCallback((conversionData: any) => {
        if (!isParticipant) return
        trackBehavior({
            type: 'conversion',
            value: {
                ...conversionData,
                experimentId,
                variant: assignedVariant,
                experimentConversion: true
            }
        })
    }, [isParticipant, assignedVariant, trackBehavior])
    return {
        variant,
        isParticipant,
        trackExperimentConversion
    }
}
// Hook para consentimento de personalização
export function usePersonalizationConsent() {
    const [consent, setConsent] = useState<Record<string, boolean>>({
        essential: true,
        analytics: false,
        personalization: false,
        marketing: false
    })
    const [showConsentModal, setShowConsentModal] = useState(false)
    useEffect(() => {
        // Carregar consentimento do localStorage
        if (typeof window !== 'undefined') {
            try {
                const stored = localStorage.getItem('personalization_consent')
                if (stored) {
                    setConsent(JSON.parse(stored))
                }
            } catch (error) {
                console.error('[usePersonalizationConsent] Error loading consent:', error)
            }
        }
    }, [])
    const updateConsent = useCallback((newConsent: Record<string, boolean>) => {
        setConsent(newConsent)
        // Salvar no localStorage
        if (typeof window !== 'undefined') {
            try {
                localStorage.setItem('personalization_consent', JSON.stringify(newConsent))
            } catch (error) {
                console.error('[usePersonalizationConsent] Error saving consent:', error)
            }
        }
        // Disparar evento de atualização de consentimento
        window.dispatchEvent(new CustomEvent('personalizationConsentUpdated', {
            detail: newConsent
        }))
    }, [])
    const requestConsent = useCallback(() => {
        setShowConsentModal(true)
    }, [])
    const acceptAll = useCallback(() => {
        const allConsent = {
            essential: true,
            analytics: true,
            personalization: true,
            marketing: true
        }
        updateConsent(allConsent)
        setShowConsentModal(false)
    }, [updateConsent])
    const acceptRequired = useCallback(() => {
        const requiredConsent = {
            essential: true,
            analytics: true,
            personalization: true,
            marketing: false
        }
        updateConsent(requiredConsent)
        setShowConsentModal(false)
    }, [updateConsent])
    const decline = useCallback(() => {
        const minimalConsent = {
            essential: true,
            analytics: false,
            personalization: false,
            marketing: false
        }
        updateConsent(minimalConsent)
        setShowConsentModal(false)
    }, [updateConsent])
    return {
        consent,
        showConsentModal,
        updateConsent,
        requestConsent,
        acceptAll,
        acceptRequired,
        decline
    }
}
export default usePersonalization