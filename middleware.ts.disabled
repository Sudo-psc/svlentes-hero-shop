import { NextRequest, NextResponse } from 'next/server'
import { DEFAULT_PERSONALIZATION_CONFIG, PERSONA_DEFINITIONS } from '@/lib/personalization/config'
import { UserProfile, BehavioralPattern, DemographicIndicators, RoutingDecision } from '@/types/personalization'

// Interface para dados comportamentais coletados
interface BehavioralData {
    url: string
    userAgent: string
    referer: string
    timestamp: Date
    deviceInfo: DeviceInfo
    pageAnalysis: PageAnalysis
    trafficSource: TrafficSource
    temporalData: TemporalData
}

interface DeviceInfo {
    type: 'desktop' | 'mobile' | 'tablet'
    os: string
    browser: string
}

interface PageAnalysis {
    path: string
    query: Record<string, string>
    hash: string
}

interface TrafficSource {
    type: 'direct' | 'organic' | 'social' | 'referral' | 'paid'
    source?: string
    campaign?: string
}

interface TemporalData {
    hour: number
    dayOfWeek: number
    dayOfMonth: number
    month: number
    timeOfDay: 'morning' | 'afternoon' | 'evening' | 'night'
}

// Cache simples para profiles (em produção usar Redis ou similar)
const profileCache = new Map<string, { profile: UserProfile; timestamp: number }>()

export async function middleware(request: NextRequest) {
    // Verificar se personalização está habilitada
    if (!DEFAULT_PERSONALIZATION_CONFIG.enabled) {
        return NextResponse.next()
    }

    const response = NextResponse.next()
    const startTime = Date.now()

    try {
        // 1. Coletar dados comportamentais básicos
        const behavioralData = collectBehavioralData(request)

        // 2. Obter ou gerar ID de sessão
        const sessionId = getOrCreateSessionId(request)

        // 3. Obter perfil existente ou criar novo
        const userProfile = await getOrCreateUserProfile(request, sessionId, behavioralData)

        // 4. Analisar comportamento e atualizar scores de persona
        const updatedProfile = await analyzeBehavior(userProfile, behavioralData)

        // 5. Determinar estratégia de roteamento
        const routingDecision = getRoutingDecision(updatedProfile, behavioralData)

        // 6. Adicionar headers de personalização
        response.headers.set('x-user-persona', updatedProfile.primaryPersona)
        response.headers.set('x-persona-confidence', updatedProfile.confidenceScore.toString())
        response.headers.set('x-session-id', sessionId)
        response.headers.set('x-routing-strategy', routingDecision.strategy)

        if (routingDecision.cacheKey) {
            response.headers.set('x-cache-key', routingDecision.cacheKey)
        }

        // 7. Aplicar regras de reescrita se necessário
        if (routingDecision.shouldRewrite && routingDecision.targetPath) {
            const rewriteUrl = new URL(routingDecision.targetPath, request.url)

            // Log para debug
            if (DEFAULT_PERSONALIZATION_CONFIG.debug) {
                console.log(`[Personalization] Rewriting ${request.url} to ${rewriteUrl.toString()} for persona ${updatedProfile.primaryPersona}`)
            }

            return NextResponse.rewrite(rewriteUrl, {
                request: {
                    headers: request.headers
                }
            })
        }

        // 8. Configurar cookies de perfil
        if (updatedProfile.shouldUpdateProfile) {
            response.cookies.set('user_profile', JSON.stringify(updatedProfile), {
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                sameSite: 'lax',
                maxAge: DEFAULT_PERSONALIZATION_CONFIG.cacheTTL,
                path: '/'
            })

            response.cookies.set('session_id', sessionId, {
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                sameSite: 'lax',
                maxAge: 60 * 60 * 24, // 24 horas
                path: '/'
            })
        }

        // 9. Log de performance para debug
        if (DEFAULT_PERSONALIZATION_CONFIG.debug) {
            const processingTime = Date.now() - startTime
            console.log(`[Personalization] Processed in ${processingTime}ms - Persona: ${updatedProfile.primaryPersona} (${updatedProfile.confidenceScore})`)
        }

        return response

    } catch (error) {
        console.error('[Personalization] Middleware error:', error)

        // Fallback para experiência padrão
        response.headers.set('x-personalization-error', 'true')
        return response
    }
}

function collectBehavioralData(request: NextRequest): BehavioralData {
    const url = request.url
    const userAgent = request.headers.get('user-agent') || ''
    const referer = request.headers.get('referer') || ''
    const timestamp = new Date()

    return {
        url,
        userAgent,
        referer,
        timestamp,
        deviceInfo: parseUserAgent(userAgent),
        pageAnalysis: analyzeCurrentPage(url),
        trafficSource: analyzeTrafficSource(referer),
        temporalData: analyzeTemporalData(timestamp)
    }
}

function parseUserAgent(userAgent: string): DeviceInfo {
    // Simplificado - em produção usar ua-parser-js ou similar
    const isMobile = /Mobile|Android|iPhone|iPad/.test(userAgent)
    const isTablet = /iPad|Tablet/.test(userAgent)

    let type: 'desktop' | 'mobile' | 'tablet' = 'desktop'
    if (isTablet) type = 'tablet'
    else if (isMobile) type = 'mobile'

    let os = 'unknown'
    if (userAgent.includes('Windows')) os = 'windows'
    else if (userAgent.includes('Mac')) os = 'mac'
    else if (userAgent.includes('Linux')) os = 'linux'
    else if (userAgent.includes('Android')) os = 'android'
    else if (userAgent.includes('iOS')) os = 'ios'

    let browser = 'unknown'
    if (userAgent.includes('Chrome')) browser = 'chrome'
    else if (userAgent.includes('Firefox')) browser = 'firefox'
    else if (userAgent.includes('Safari')) browser = 'safari'
    else if (userAgent.includes('Edge')) browser = 'edge'

    return { type, os, browser }
}

function analyzeCurrentPage(url: string): PageAnalysis {
    const urlObj = new URL(url)
    return {
        path: urlObj.pathname,
        query: Object.fromEntries(urlObj.searchParams),
        hash: urlObj.hash
    }
}

function analyzeTrafficSource(referer: string): TrafficSource {
    if (!referer) return { type: 'direct' }

    try {
        const refererUrl = new URL(referer)
        const domain = refererUrl.hostname

        if (domain.includes('google')) return { type: 'organic', source: 'google' }
        if (domain.includes('facebook')) return { type: 'social', source: 'facebook' }
        if (domain.includes('instagram')) return { type: 'social', source: 'instagram' }
        if (domain.includes('whatsapp')) return { type: 'social', source: 'whatsapp' }
        if (domain.includes('linkedin')) return { type: 'social', source: 'linkedin' }

        return { type: 'referral', source: domain }
    } catch {
        return { type: 'direct' }
    }
}

function analyzeTemporalData(timestamp: Date): TemporalData {
    const hour = timestamp.getHours()
    const dayOfWeek = timestamp.getDay()
    const dayOfMonth = timestamp.getDate()
    const month = timestamp.getMonth()

    let timeOfDay: 'morning' | 'afternoon' | 'evening' | 'night'
    if (hour >= 6 && hour < 12) timeOfDay = 'morning'
    else if (hour >= 12 && hour < 18) timeOfDay = 'afternoon'
    else if (hour >= 18 && hour < 22) timeOfDay = 'evening'
    else timeOfDay = 'night'

    return { hour, dayOfWeek, dayOfMonth, month, timeOfDay }
}

function getOrCreateSessionId(request: NextRequest): string {
    const existingSession = request.cookies.get('session_id')?.value

    if (existingSession) {
        return existingSession
    }

    // Gerar novo ID de sessão
    const sessionId = 'session_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9)
    return sessionId
}

async function getOrCreateUserProfile(
    request: NextRequest,
    sessionId: string,
    behavioralData: BehavioralData
): Promise<UserProfile> {
    // 1. Tentar obter do cache
    const cachedProfile = profileCache.get(sessionId)
    if (cachedProfile && Date.now() - cachedProfile.timestamp < DEFAULT_PERSONALIZATION_CONFIG.cacheTTL * 1000) {
        return cachedProfile.profile
    }

    // 2. Tentar obter do cookie
    const profileCookie = request.cookies.get('user_profile')?.value
    if (profileCookie) {
        try {
            const profile = JSON.parse(profileCookie) as UserProfile
            // Atualizar cache
            profileCache.set(sessionId, { profile, timestamp: Date.now() })
            return profile
        } catch (error) {
            console.error('[Personalization] Error parsing profile cookie:', error)
        }
    }

    // 3. Criar perfil básico baseado em dados disponíveis
    const newProfile = createBasicProfile(sessionId, behavioralData)

    // Salvar no cache
    profileCache.set(sessionId, { profile: newProfile, timestamp: Date.now() })

    return newProfile
}

function createBasicProfile(sessionId: string, behavioralData: BehavioralData): UserProfile {
    // Inferir persona inicial baseada em dados básicos
    const initialPersona = inferInitialPersona(behavioralData)

    return {
        primaryPersona: initialPersona,
        confidenceScore: 0.5, // Baixa confiança inicial
        behavioralPatterns: [],
        demographicIndicators: inferBasicDemographics(behavioralData),
        engagementLevel: 'medium',
        conversionProbability: 0.3,
        shouldUpdateProfile: true,
        sessionId,
        lastUpdated: new Date()
    }
}

function inferInitialPersona(behavioralData: BehavioralData): string {
    const { pageAnalysis, deviceInfo, trafficSource } = behavioralData

    // Lógica simples de inferência inicial
    if (pageAnalysis.path.includes('/pricing') || pageAnalysis.path.includes('/calculator')) {
        return 'price-conscious'
    }

    if (pageAnalysis.path.includes('/how-it-works') || pageAnalysis.path.includes('/about')) {
        return 'quality-focused'
    }

    if (deviceInfo.type === 'mobile' && trafficSource.type === 'social') {
        return 'convenience-seeker'
    }

    if (pageAnalysis.path.includes('/agendar-consulta')) {
        return 'urgent-buyer'
    }

    return DEFAULT_PERSONALIZATION_CONFIG.defaultPersona
}

function inferBasicDemographics(behavioralData: BehavioralData): DemographicIndicators {
    const { deviceInfo, temporalData } = behavioralData

    return {
        likelyAge: inferAgeFromBehavior(deviceInfo, temporalData),
        likelyIncome: 'medium', // Default, será refinado depois
        likelyLocation: 'brazil', // Baseado no idioma do site
        devicePreference: deviceInfo.type,
        browsingTime: temporalData.timeOfDay,
        language: 'pt-BR',
        timezone: 'America/Sao_Paulo'
    }
}

function inferAgeFromBehavior(deviceInfo: DeviceInfo, temporalData: TemporalData): string {
    // Lógica simplificada de inferência de idade
    if (deviceInfo.type === 'mobile' && temporalData.hour >= 20 && temporalData.hour <= 23) {
        return '18-25'
    } else if (deviceInfo.type === 'desktop' && temporalData.hour >= 9 && temporalData.hour <= 17) {
        return '26-45'
    } else {
        return '46+'
    }
}

async function analyzeBehavior(profile: UserProfile, behavioralData: BehavioralData): Promise<UserProfile> {
    // Adicionar padrão comportamental atual
    const newPattern: BehavioralPattern = {
        type: 'navigation',
        weight: 0.3,
        value: behavioralData.pageAnalysis,
        timestamp: behavioralData.timestamp
    }

    const updatedPatterns = [...profile.behavioralPatterns, newPattern]

    // Manter apenas últimos 50 padrões para não sobrecarregar
    if (updatedPatterns.length > 50) {
        updatedPatterns.splice(0, updatedPatterns.length - 50)
    }

    // Recalcular scores de persona
    const personaScores = calculatePersonaScores(updatedPatterns, behavioralData)
    const topPersona = Object.entries(personaScores)
        .sort(([, a], [, b]) => b - a)[0]

    // Determinar se precisa atualizar
    const shouldUpdate =
        profile.primaryPersona !== topPersona[0] ||
        Date.now() - new Date(profile.lastUpdated).getTime() > 60 * 60 * 1000 || // 1 hora
        profile.confidenceScore < 0.7

    return {
        ...profile,
        primaryPersona: topPersona[0],
        confidenceScore: topPersona[1],
        behavioralPatterns: updatedPatterns,
        shouldUpdateProfile: shouldUpdate,
        lastUpdated: new Date()
    }
}

function calculatePersonaScores(patterns: BehavioralPattern[], behavioralData: BehavioralData): Record<string, number> {
    const personas = Object.keys(PERSONA_DEFINITIONS)
    const scores: Record<string, number> = {}

    personas.forEach(personaId => {
        const personaDef = PERSONA_DEFINITIONS[personaId as keyof typeof PERSONA_DEFINITIONS]
        let score = 0

        // Calcular score baseado nos padrões
        patterns.forEach(pattern => {
            if (pattern.type === 'navigation') {
                score += scoreNavigationPattern(personaId, pattern.value, personaDef.triggers)
            }
        })

        // Adicionar score baseado em dados temporais
        score += scoreTemporalPattern(personaId, behavioralData.temporalData)

        // Adicionar score baseado em dispositivo
        score += scoreDevicePattern(personaId, behavioralData.deviceInfo)

        scores[personaId] = Math.max(0, Math.min(1, score)) // Normalizar entre 0 e 1
    })

    return scores
}

function scoreNavigationPattern(personaId: string, pageAnalysis: PageAnalysis, triggers: any[]): number {
    let score = 0

    triggers.forEach(trigger => {
        if (trigger.type === 'page_view' && pageAnalysis.path.includes(trigger.condition)) {
            score += trigger.weight
        }
    })

    return score
}

function scoreTemporalPattern(personaId: string, temporalData: TemporalData): number {
    // Lógica simples baseada em horários para diferentes personas
    const hour = temporalData.hour
    const dayOfWeek = temporalData.dayOfWeek

    switch (personaId) {
        case 'price-conscious':
            return (hour >= 19 && hour <= 23) ? 0.2 : 0.1 // Horário comercial para pesquisa de preços
        case 'quality-focused':
            return (hour >= 9 && hour <= 17) ? 0.2 : 0.1 // Horário comercial para pesquisas detalhadas
        case 'convenience-seeker':
            return (dayOfWeek >= 1 && dayOfWeek <= 5) ? 0.15 : 0.1 // Dias de semana para conveniência
        case 'urgent-buyer':
            return hour >= 12 && hour <= 20 ? 0.25 : 0.1 // Horário de pico para urgências
        default:
            return 0.1
    }
}

function scoreDevicePattern(personaId: string, deviceInfo: DeviceInfo): number {
    const personaDef = PERSONA_DEFINITIONS[personaId as keyof typeof PERSONA_DEFINITIONS]

    if (personaDef.characteristics.devicePreference.includes(deviceInfo.type)) {
        return 0.2
    }

    return 0.05
}

function getRoutingDecision(profile: UserProfile, behavioralData: BehavioralData): RoutingDecision {
    const { pageAnalysis } = behavioralData
    const persona = profile.primaryPersona

    // Regras de roteamento baseadas em persona
    const routingRules: Record<string, Record<string, RoutingDecision>> = {
        'price-conscious': {
            '/': {
                strategy: 'personalized',
                targetPath: '/variants/price-focused-home',
                shouldRewrite: true,
                priority: 'high',
                reasoning: 'Show pricing-focused homepage to price-conscious users',
                cacheKey: `price-conscious-home-${profile.confidenceScore.toFixed(2)}`
            },
            '/pricing': {
                strategy: 'personalized',
                targetPath: '/variants/price-detailed-pricing',
                shouldRewrite: true,
                priority: 'high',
                reasoning: 'Show detailed pricing comparison'
            }
        },
        'quality-focused': {
            '/': {
                strategy: 'personalized',
                targetPath: '/variants/quality-home',
                shouldRewrite: true,
                priority: 'high',
                reasoning: 'Show quality-focused homepage'
            }
        },
        'convenience-seeker': {
            '/': {
                strategy: 'personalized',
                targetPath: '/variants/convenience-home',
                shouldRewrite: true,
                priority: 'high',
                reasoning: 'Show convenience-focused homepage'
            }
        }
    }

    const personaRules = routingRules[persona]
    if (personaRules && personaRules[pageAnalysis.path]) {
        return personaRules[pageAnalysis.path]
    }

    // Regra padrão
    return {
        strategy: 'default',
        shouldRewrite: false,
        priority: 'low',
        reasoning: 'No specific routing rules for this persona and path'
    }
}

export const config = {
    matcher: [
        '/((?!api|_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml|images).*)',
    ],
}
