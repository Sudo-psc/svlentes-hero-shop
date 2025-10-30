import type { Auth } from 'firebase/auth'
import type { AuthHealthStatus } from '@/lib/auth/types'

interface HealthMonitorOptions {
  checkIntervalMs?: number
  timeoutMs?: number
}

const DEFAULT_INTERVAL = 30_000
const DEFAULT_TIMEOUT = 5_000

export class AuthHealthMonitor {
  private status: AuthHealthStatus = 'unavailable'
  private timer: ReturnType<typeof setInterval> | null = null
  private listeners: Set<(status: AuthHealthStatus) => void> = new Set()

  constructor(private auth: Auth | null, private options: HealthMonitorOptions = {}) {
    if (!this.auth) {
      this.status = 'unavailable'
    }
  }

  private get interval(): number {
    return this.options.checkIntervalMs ?? DEFAULT_INTERVAL
  }

  private get timeout(): number {
    return this.options.timeoutMs ?? DEFAULT_TIMEOUT
  }

  getStatus(): AuthHealthStatus {
    return this.status
  }

  private updateStatus(newStatus: AuthHealthStatus) {
    if (this.status === newStatus) return
    this.status = newStatus
    this.emit()
  }

  private emit() {
    this.listeners.forEach(listener => {
      try {
        listener(this.status)
      } catch (error) {
        console.error('[AuthHealthMonitor] Listener failed:', error)
      }
    })
  }

  start(): void {
    if (!this.auth) {
      this.updateStatus('unavailable')
      return
    }

    if (this.timer) return
    this.checkHealth()
    this.timer = setInterval(() => this.checkHealth(), this.interval)
  }

  stop(): void {
    if (this.timer) {
      clearInterval(this.timer)
      this.timer = null
    }
  }

  async checkHealth(): Promise<AuthHealthStatus> {
    if (!this.auth) {
      this.updateStatus('unavailable')
      return this.status
    }

    if (typeof window !== 'undefined' && !navigator.onLine) {
      this.updateStatus('offline')
      return this.status
    }

    try {
      const user = this.auth.currentUser
      if (!user) {
        // Even sem usuário, podemos testar endpoint via getIdToken force refresh usando promise com timeout
        await this.withTimeout(this.auth.app.checkDestroyed?.() ?? Promise.resolve(), this.timeout)
        this.updateStatus('healthy')
        return this.status
      }

      await this.withTimeout(user.getIdToken(true), this.timeout)
      this.updateStatus('healthy')
    } catch (error) {
      console.warn('[AuthHealthMonitor] Health check degraded:', error)
      this.updateStatus('degraded')
    }

    return this.status
  }

  subscribe(listener: (status: AuthHealthStatus) => void): () => void {
    this.listeners.add(listener)
    return () => {
      this.listeners.delete(listener)
    }
  }

  private async withTimeout<T>(promise: Promise<T>, timeoutMs: number): Promise<T> {
    let timer: ReturnType<typeof setTimeout> | null = null
    const timeoutPromise = new Promise<never>((_, reject) => {
      timer = setTimeout(() => reject(new Error('health-check-timeout')), timeoutMs)
    })

    try {
      const result = await Promise.race([promise, timeoutPromise])
      return result as T
    } finally {
      if (timer) clearTimeout(timer)
    }
  }
}
