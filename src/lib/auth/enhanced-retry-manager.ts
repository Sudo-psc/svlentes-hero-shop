import { backOff } from 'exponential-backoff'
import type { AuthStatus } from '@/lib/auth/types'

interface EnhancedRetryOptions {
    baseDelayMs?: number
    maxDelayMs?: number
    maxAttempts?: number
    circuitCooldownMs?: number
    jitterMs?: number
    adaptiveDelay?: boolean
    healthCheckInterval?: number
}

interface RetryState {
    attempt: number
    lastAttemptAt: number
    nextRetryAt: number
    circuitOpenUntil: number | null
    consecutiveFailures: number
    averageLatency: number
    latencyHistory: number[]
    errorHistory: Array<{ error: string; timestamp: number; attempt: number }>
}

interface RetryResult<T> {
    success: boolean
    data?: T
    error?: Error
    attempt: number
    totalDelay: number
    fromCache: boolean
    circuitBroken: boolean
}

interface QueuedRetry<T> {
    id: string
    operation: () => Promise<T>
    priority: 'low' | 'medium' | 'high' | 'critical'
    attempts: number
    maxAttempts: number
    nextRetryAt: number
    createdAt: number
    lastAttemptAt: number
    resolve: (result: RetryResult<T>) => void
    reject: (error: Error) => void
}

export class EnhancedAuthRetryManager {
    private state: RetryState
    private options: Required<EnhancedRetryOptions>
    private queuedRetries: Map<string, QueuedRetry<any>> = new Map()
    private processingQueue = false
    private healthCheckTimer: ReturnType<typeof setInterval> | null = null

    constructor(options: EnhancedRetryOptions = {}) {
        this.options = {
            baseDelayMs: options.baseDelayMs ?? 1000,
            maxDelayMs: options.maxDelayMs ?? 30000,
            maxAttempts: options.maxAttempts ?? 5,
            circuitCooldownMs: options.circuitCooldownMs ?? 60000,
            jitterMs: options.jitterMs ?? 250,
            adaptiveDelay: options.adaptiveDelay ?? true,
            healthCheckInterval: options.healthCheckInterval ?? 30000
        }

        this.state = this.initializeState()
        this.startHealthChecks()
    }

    private initializeState(): RetryState {
        return {
            attempt: 0,
            lastAttemptAt: 0,
            nextRetryAt: 0,
            circuitOpenUntil: null,
            consecutiveFailures: 0,
            averageLatency: 0,
            latencyHistory: [],
            errorHistory: []
        }
    }

    getState(): RetryState {
        return { ...this.state }
    }

    isCircuitOpen(): boolean {
        if (!this.state.circuitOpenUntil) return false
        const now = Date.now()
        if (now >= this.state.circuitOpenUntil) {
            this.state.circuitOpenUntil = null
            this.state.consecutiveFailures = 0
            return false
        }
        return true
    }

    reset(): void {
        this.state = this.initializeState()
        this.clearAllQueuedRetries()
    }

    recordSuccess(latency?: number): void {
        this.state.consecutiveFailures = 0
        this.state.attempt = 0
        this.state.circuitOpenUntil = null

        if (latency !== undefined) {
            this.updateLatencyHistory(latency)
        }

        this.state.errorHistory = []
    }

    recordFailure(error: Error, attempt?: number): number {
        const currentAttempt = attempt ?? this.state.attempt + 1
        this.state.attempt = currentAttempt
        this.state.consecutiveFailures++
        this.state.lastAttemptAt = Date.now()

        // Adicionar erro ao histórico
        this.state.errorHistory.push({
            error: error.message,
            timestamp: Date.now(),
            attempt: currentAttempt
        })

        // Manter apenas os últimos 50 erros
        if (this.state.errorHistory.length > 50) {
            this.state.errorHistory = this.state.errorHistory.slice(-50)
        }

        // Calcular delay adaptativo baseado no histórico
        const delay = this.calculateAdaptiveDelay(currentAttempt, error)

        // Verificar se deve abrir o circuit breaker
        if (this.state.consecutiveFailures >= this.options.maxAttempts) {
            this.openCircuit()
        }

        this.state.nextRetryAt = Date.now() + delay
        return delay
    }

    private updateLatencyHistory(latency: number): void {
        this.state.latencyHistory.push(latency)

        // Manter apenas as últimas 20 medições
        if (this.state.latencyHistory.length > 20) {
            this.state.latencyHistory = this.state.latencyHistory.slice(-20)
        }

        // Calcular média móvel
        this.state.averageLatency = this.state.latencyHistory.reduce((sum, lat) => sum + lat, 0) / this.state.latencyHistory.length
    }

    private calculateAdaptiveDelay(attempt: number, error: Error): number {
        if (!this.options.adaptiveDelay) {
            return this.calculateStandardBackoff(attempt)
        }

        // Ajustar delay baseado no tipo de erro
        let multiplier = 1

        if (error.message.includes('network') || error.message.includes('timeout')) {
            multiplier = 2 // Erros de rede precisam de mais tempo
        } else if (error.message.includes('rate-limit') || error.message.includes('too-many')) {
            multiplier = 3 // Rate limiting precisa de espera maior
        } else if (error.message.includes('auth') || error.message.includes('unauthorized')) {
            multiplier = 0.5 // Erros de auth podem ser retry mais rápidos
        }

        // Ajustar baseado na latência média
        const latencyMultiplier = this.state.averageLatency > 5000 ? 1.5 : 1

        // Calcular delay base
        const baseDelay = this.calculateStandardBackoff(attempt)

        // Aplicar multiplicadores
        let adaptiveDelay = baseDelay * multiplier * latencyMultiplier

        // Adicionar jitter
        const jitter = Math.random() * this.options.jitterMs
        adaptiveDelay += jitter

        // Limitar ao máximo
        return Math.min(adaptiveDelay, this.options.maxDelayMs)
    }

    private calculateStandardBackoff(attempt: number): number {
        // Calcular delay manualmente (mais confiável)
        return Math.min(
            this.options.baseDelayMs * Math.pow(2, attempt - 1),
            this.options.maxDelayMs
        )
    }

    private openCircuit(): void {
        this.state.circuitOpenUntil = Date.now() + this.options.circuitCooldownMs
        console.warn('[EnhancedRetryManager] Circuit breaker opened due to consecutive failures')
    }

    async executeWithRetry<T>(
        operation: () => Promise<T>,
        options?: {
            maxAttempts?: number
            priority?: 'low' | 'medium' | 'high' | 'critical'
            useCache?: () => Promise<T | null>
        }
    ): Promise<RetryResult<T>> {
        const maxAttempts = options?.maxAttempts ?? this.options.maxAttempts
        const priority = options?.priority ?? 'medium'
        let totalDelay = 0

        // Verificar circuit breaker
        if (this.isCircuitOpen()) {
            // Tentar usar cache se disponível
            if (options?.useCache) {
                try {
                    const cachedData = await options.useCache()
                    if (cachedData !== null) {
                        return {
                            success: true,
                            data: cachedData,
                            attempt: 0,
                            totalDelay: 0,
                            fromCache: true,
                            circuitBroken: true
                        }
                    }
                } catch (cacheError) {
                    console.warn('[EnhancedRetryManager] Cache fallback failed:', cacheError)
                }
            }

            return {
                success: false,
                error: new Error('Circuit breaker is open'),
                attempt: 0,
                totalDelay: 0,
                fromCache: false,
                circuitBroken: true
            }
        }

        for (let attempt = 1; attempt <= maxAttempts; attempt++) {
            const startTime = Date.now()

            try {
                const result = await operation()
                const latency = Date.now() - startTime

                this.recordSuccess(latency)
                totalDelay += (Date.now() - startTime)

                return {
                    success: true,
                    data: result,
                    attempt,
                    totalDelay,
                    fromCache: false,
                    circuitBroken: false
                }
            } catch (error) {
                const err = error as Error
                const attemptDelay = this.recordFailure(err, attempt)

                totalDelay += attemptDelay

                // Se for a falha crítica, não tentar novamente
                if (this.isCriticalError(err)) {
                    return {
                        success: false,
                        error: err,
                        attempt,
                        totalDelay,
                        fromCache: false,
                        circuitBroken: false
                    }
                }

                // Se não for a última tentativa, esperar
                if (attempt < maxAttempts) {
                    await this.delay(attemptDelay)
                } else {
                    // Última tentativa falhou - tentar cache
                    if (options?.useCache) {
                        try {
                            const cachedData = await options.useCache()
                            if (cachedData !== null) {
                                return {
                                    success: true,
                                    data: cachedData,
                                    attempt,
                                    totalDelay,
                                    fromCache: true,
                                    circuitBroken: false
                                }
                            }
                        } catch (cacheError) {
                            console.warn('[EnhancedRetryManager] Final cache fallback failed:', cacheError)
                        }
                    }

                    return {
                        success: false,
                        error: err,
                        attempt,
                        totalDelay,
                        fromCache: false,
                        circuitBroken: false
                    }
                }
            }
        }

        // Nunca deveria chegar aqui
        return {
            success: false,
            error: new Error('Unexpected retry state'),
            attempt: maxAttempts,
            totalDelay,
            fromCache: false,
            circuitBroken: false
        }
    }

    async queueRetry<T>(
        id: string,
        operation: () => Promise<T>,
        options?: {
            priority?: 'low' | 'medium' | 'high' | 'critical'
            maxAttempts?: number
            delay?: number
        }
    ): Promise<RetryResult<T>> {
        return new Promise((resolve, reject) => {
            const queuedRetry: QueuedRetry<T> = {
                id,
                operation,
                priority: options?.priority ?? 'medium',
                attempts: 0,
                maxAttempts: options?.maxAttempts ?? this.options.maxAttempts,
                nextRetryAt: Date.now() + (options?.delay ?? 0),
                createdAt: Date.now(),
                lastAttemptAt: 0,
                resolve,
                reject
            }

            this.queuedRetries.set(id, queuedRetry)
            this.processQueue()
        })
    }

    private async processQueue(): Promise<void> {
        if (this.processingQueue) return
        this.processingQueue = true

        try {
            const now = Date.now()
            const readyRetries = Array.from(this.queuedRetries.values())
                .filter(retry => retry.nextRetryAt <= now)
                .sort((a, b) => {
                    // Prioridade primeiro
                    const priorityOrder = { critical: 4, high: 3, medium: 2, low: 1 }
                    const priorityDiff = priorityOrder[b.priority] - priorityOrder[a.priority]
                    if (priorityDiff !== 0) return priorityDiff

                    // Depois por tempo de criação
                    return a.createdAt - b.createdAt
                })

            for (const retry of readyRetries) {
                if (this.isCircuitOpen() && retry.priority !== 'critical') {
                    continue // Pular não-críticos se circuito estiver aberto
                }

                this.queuedRetries.delete(retry.id)

                try {
                    const result = await this.executeWithRetry(
                        retry.operation,
                        {
                            maxAttempts: 1, // Já estamos em retry
                            priority: retry.priority
                        }
                    )

                    retry.resolve(result)
                } catch (error) {
                    retry.reject(error as Error)
                }
            }
        } finally {
            this.processingQueue = false

            // Se há mais itens na fila, continuar processando
            if (this.queuedRetries.size > 0) {
                setTimeout(() => this.processQueue(), 1000)
            }
        }
    }

    private clearAllQueuedRetries(): void {
        for (const [id, retry] of Array.from(this.queuedRetries.entries())) {
            retry.reject(new Error('Retry manager reset'))
        }
        this.queuedRetries.clear()
    }

    private isCriticalError(error: Error): boolean {
        const criticalErrors = [
            'auth/user-disabled',
            'auth/operation-not-allowed',
            'auth/invalid-email',
            'auth/weak-password'
        ]

        return criticalErrors.some(criticalError =>
            error.message.includes(criticalError) || error.message.includes('User not found')
        )
    }

    private delay(ms: number): Promise<void> {
        return new Promise(resolve => setTimeout(resolve, ms))
    }

    private startHealthChecks(): void {
        if (this.healthCheckTimer) {
            clearInterval(this.healthCheckTimer)
        }

        this.healthCheckTimer = setInterval(() => {
            this.performHealthCheck()
        }, this.options.healthCheckInterval)
    }

    private async performHealthCheck(): Promise<void> {
        // Limpar erros antigos (mais de 1 hora)
        const oneHourAgo = Date.now() - 60 * 60 * 1000
        this.state.errorHistory = this.state.errorHistory.filter(
            error => error.timestamp > oneHourAgo
        )

        // Limpar histórico de latência antigo (mais de 10 minutos)
        const tenMinutesAgo = Date.now() - 10 * 60 * 1000
        const recentLatencies = this.state.latencyHistory.filter(() => true) // Já limitado a 20 items

        if (recentLatencies.length !== this.state.latencyHistory.length) {
            this.state.latencyHistory = recentLatencies
        }
    }

    getStats(): {
        circuitOpen: boolean
        consecutiveFailures: number
        averageLatency: number
        queuedRetries: number
        errorRate: number
        recentErrors: Array<{ error: string; timestamp: number; attempt: number }>
    } {
        const recentErrors = this.state.errorHistory.filter(
            error => Date.now() - error.timestamp < 5 * 60 * 1000 // Últimos 5 minutos
        )

        return {
            circuitOpen: this.isCircuitOpen(),
            consecutiveFailures: this.state.consecutiveFailures,
            averageLatency: this.state.averageLatency,
            queuedRetries: this.queuedRetries.size,
            errorRate: this.state.errorHistory.length > 0
                ? recentErrors.length / this.state.errorHistory.length
                : 0,
            recentErrors
        }
    }

    destroy(): void {
        if (this.healthCheckTimer) {
            clearInterval(this.healthCheckTimer)
            this.healthCheckTimer = null
        }
        this.clearAllQueuedRetries()
    }
}
