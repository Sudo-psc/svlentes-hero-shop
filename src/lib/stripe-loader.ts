// Stripe loader com retry logic e fallback
// Para tratar falhas de carregamento do Stripe.js

interface StripeInstance {
  redirectToCheckout?: (options: any) => Promise<any>
  elements?: (options: any) => any
  createPaymentMethod?: (options: any) => Promise<any>
  confirmCardPayment?: (clientSecret: string, data?: any) => Promise<any>
}

interface StripeLoadOptions {
  retries?: number
  timeout?: number
  fallbackUrl?: string
}

// Cache para evitar múltiplas tentativas
let stripeLoadPromise: Promise<StripeInstance | null> | null = null
let lastLoadAttempt = 0
const LOAD_COOLDOWN = 5000 // 5 segundos entre tentativas

/**
 * Carrega o Stripe com retry automático
 */
export async function loadStripeWithRetry(
  publishableKey: string,
  options: StripeLoadOptions = {}
): Promise<StripeInstance | null> {
  const {
    retries = 3,
    timeout = 10000,
    fallbackUrl = 'https://js.stripe.com/v3/'
  } = options

  // Evitar múltiplas tentativas em curto período
  const now = Date.now()
  if (stripeLoadPromise && (now - lastLoadAttempt) < LOAD_COOLDOWN) {
    return stripeLoadPromise
  }

  lastLoadAttempt = now

  // Se já temos uma promise em andamento, retorná-la
  if (stripeLoadPromise) {
    return stripeLoadPromise
  }

  stripeLoadPromise = attemptStripeLoad(publishableKey, retries, timeout, fallbackUrl)
    .finally(() => {
      // Resetar a promise após 30 segundos para permitir novas tentativas
      setTimeout(() => {
        stripeLoadPromise = null
      }, 30000)
    })

  return stripeLoadPromise
}

/**
 * Função interna para tentar carregar o Stripe
 */
async function attemptStripeLoad(
  publishableKey: string,
  maxRetries: number,
  timeout: number,
  fallbackUrl: string
): Promise<StripeInstance | null> {
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      console.log(`[Stripe] Load attempt ${attempt + 1}/${maxRetries}`)

      const stripe = await loadStripeWithTimeout(publishableKey, timeout)

      if (stripe) {
        console.log('[Stripe] Loaded successfully')
        return stripe
      }
    } catch (error) {
      console.warn(`[Stripe] Load attempt ${attempt + 1} failed:`, error.message)

      // Se não for a falha de rede ou timeout, não tentar novamente
      if (isNonRetryableError(error)) {
        console.error('[Stripe] Non-retryable error:', error)
        return null
      }

      // Se for a falha temporária, tentar novamente com delay
      if (attempt < maxRetries - 1) {
        const delay = calculateRetryDelay(attempt)
        console.log(`[Stripe] Retrying in ${delay}ms...`)
        await new Promise(resolve => setTimeout(resolve, delay))
      }
    }
  }

  console.error('[Stripe] All load attempts failed')
  return null
}

/**
 * Carrega o Stripe com timeout
 */
async function loadStripeWithTimeout(
  publishableKey: string,
  timeout: number
): Promise<StripeInstance | null> {
  return Promise.race([
    loadStripeFromScript(publishableKey),
    new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error('Stripe load timeout')), timeout)
    )
  ])
}

/**
 * Carrega o Stripe do script ou do módulo
 */
async function loadStripeFromScript(publishableKey: string): Promise<StripeInstance | null> {
  try {
    // Tentar carregar do módulo primeiro (ambiente Next.js)
    if (typeof window !== 'undefined') {
      // Verificar se Stripe já está disponível globalmente
      if ((window as any).Stripe) {
        console.log('[Stripe] Found global Stripe instance')
        return (window as any).Stripe(publishableKey)
      }

      // Tentar carregar via script dinâmico
      await loadStripeScript()

      if ((window as any).Stripe) {
        return (window as any).Stripe(publishableKey)
      }
    }

    return null
  } catch (error) {
    console.error('[Stripe] Script load error:', error)
    throw error
  }
}

/**
 * Carrega o script do Stripe dinamicamente
 */
function loadStripeScript(): Promise<void> {
  return new Promise((resolve, reject) => {
    // Verificar se o script já existe
    const existingScript = document.querySelector('script[src*="stripe.com"]')
    if (existingScript) {
      resolve()
      return
    }

    const script = document.createElement('script')
    script.src = 'https://js.stripe.com/v3/'
    script.async = true

    script.onload = () => resolve()
    script.onerror = () => reject(new Error('Failed to load Stripe script'))

    // Adicionar tratamento de erros de rede
    script.addEventListener('error', (e) => {
      console.error('[Stripe] Script loading error:', e)
      reject(new Error('Network error loading Stripe script'))
    })

    document.head.appendChild(script)
  })
}

/**
 * Verifica se o erro pode ser recuperado
 */
function isNonRetryableError(error: any): boolean {
  const message = error.message?.toLowerCase() || ''

  // Erros que não devem ser retry
  const nonRetryableErrors = [
    'invalid key',
    'authentication',
    'forbidden',
    'unauthorized',
    'malformed',
    'invalid'
  ]

  return nonRetryableErrors.some(err => message.includes(err))
}

/**
 * Calcula o delay para retry com backoff exponencial
 */
function calculateRetryDelay(attempt: number): number {
  const baseDelay = 1000 // 1 segundo
  const maxDelay = 10000 // 10 segundos máximo

  const delay = baseDelay * Math.pow(2, attempt)
  return Math.min(delay, maxDelay)
}

/**
 * Wrapper seguro para chamadas da API do Stripe
 */
export function createSafeStripeWrapper(stripe: StripeInstance | null) {
  if (!stripe) {
    return {
      redirectToCheckout: async () => {
        throw new Error('Stripe not available')
      },
      elements: () => {
        throw new Error('Stripe not available')
      },
      createPaymentMethod: async () => {
        throw new Error('Stripe not available')
      },
      confirmCardPayment: async () => {
        throw new Error('Stripe not available')
      }
    }
  }

  return {
    async redirectToCheckout(options: any) {
      try {
        return await stripe.redirectToCheckout?.(options)
      } catch (error) {
        console.error('[Stripe] redirectToCheckout error:', error)
        throw error
      }
    },

    elements(options: any) {
      try {
        return stripe.elements?.(options)
      } catch (error) {
        console.error('[Stripe] elements error:', error)
        throw error
      }
    },

    async createPaymentMethod(options: any) {
      try {
        return await stripe.createPaymentMethod?.(options)
      } catch (error) {
        console.error('[Stripe] createPaymentMethod error:', error)
        throw error
      }
    },

    async confirmCardPayment(clientSecret: string, data?: any) {
      try {
        return await stripe.confirmCardPayment?.(clientSecret, data)
      } catch (error) {
        console.error('[Stripe] confirmCardPayment error:', error)
        throw error
      }
    }
  }
}

/**
 * Hook React para uso do Stripe com retry
 */
export function useStripeLoader(publishableKey: string, options?: StripeLoadOptions) {
  const [stripe, setStripe] = useState<StripeInstance | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [retryCount, setRetryCount] = useState(0)

  const loadStripe = useCallback(async () => {
    if (!publishableKey) {
      setError('No publishable key provided')
      return
    }

    setLoading(true)
    setError(null)

    try {
      const stripeInstance = await loadStripeWithRetry(publishableKey, options)

      if (stripeInstance) {
        setStripe(stripeInstance)
        setRetryCount(0)
      } else {
        setError('Failed to load Stripe after multiple attempts')
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error'
      setError(errorMessage)
      console.error('[Stripe] Load error:', err)
    } finally {
      setLoading(false)
    }
  }, [publishableKey, options])

  // Retry automático com delay exponencial
  const retry = useCallback(async () => {
    const delay = calculateRetryDelay(retryCount)
    await new Promise(resolve => setTimeout(resolve, delay))
    setRetryCount(prev => prev + 1)
    await loadStripe()
  }, [loadStripe, retryCount])

  // Reset state
  const reset = useCallback(() => {
    setStripe(null)
    setLoading(false)
    setError(null)
    setRetryCount(0)
    stripeLoadPromise = null
  }, [])

  return {
    stripe: stripe ? createSafeStripeWrapper(stripe) : null,
    loading,
    error,
    retryCount,
    loadStripe,
    retry,
    reset
  }
}

// Exportar tipos para uso em componentes
export type { StripeInstance, StripeLoadOptions }