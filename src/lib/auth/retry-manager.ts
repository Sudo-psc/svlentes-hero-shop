import type { AuthStatus } from '@/lib/auth/types'

interface RetryOptions {
  baseDelayMs?: number
  maxAttempts?: number
  circuitCooldownMs?: number
}

export class AuthRetryManager {
  private attempts = 0
  private nextRetryIn: number | null = null
  private circuitOpenUntil: number | null = null
  private timer: ReturnType<typeof setTimeout> | null = null

  constructor(private options: RetryOptions = {}) {}

  private get baseDelay(): number {
    return this.options.baseDelayMs ?? 1000
  }

  private get maxAttempts(): number {
    return this.options.maxAttempts ?? 5
  }

  private get circuitCooldownMs(): number {
    return this.options.circuitCooldownMs ?? 60_000
  }

  getState(): Pick<AuthStatus, 'retryAttempts' | 'nextRetryIn' | 'circuitOpen'> & { circuitOpenUntil: number | null } {
    return {
      retryAttempts: this.attempts,
      nextRetryIn: this.nextRetryIn,
      circuitOpen: this.isCircuitOpen(),
      circuitOpenUntil: this.circuitOpenUntil
    }
  }

  isCircuitOpen(): boolean {
    if (!this.circuitOpenUntil) return false
    const now = Date.now()
    if (now >= this.circuitOpenUntil) {
      this.circuitOpenUntil = null
      return false
    }
    return true
  }

  reset(): void {
    this.attempts = 0
    this.nextRetryIn = null
    if (this.timer) {
      clearTimeout(this.timer)
    }
    this.timer = null
  }

  recordSuccess(): void {
    this.reset()
  }

  recordFailure(): number {
    this.attempts += 1
    const delay = this.calculateExponentialBackoff(this.attempts)
    this.nextRetryIn = delay

    if (this.attempts >= this.maxAttempts) {
      this.openCircuit()
    }

    return delay
  }

  private openCircuit(): void {
    this.circuitOpenUntil = Date.now() + this.circuitCooldownMs
    this.nextRetryIn = this.circuitCooldownMs
    if (this.timer) {
      clearTimeout(this.timer)
      this.timer = null
    }
  }

  private calculateExponentialBackoff(attempt: number): number {
    const jitter = Math.random() * 250
    return Math.min(this.baseDelay * Math.pow(2, attempt - 1) + jitter, 16_000)
  }

  schedule(callback: () => Promise<void>): Promise<void> | null {
    if (this.isCircuitOpen()) {
      return null
    }

    const delay = this.recordFailure()

    return new Promise(resolve => {
      this.timer = setTimeout(async () => {
        try {
          await callback()
          this.recordSuccess()
        } finally {
          resolve()
        }
      }, delay)
    })
  }
}

