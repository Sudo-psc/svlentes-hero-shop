/**
 * Sistema de retry com exponential backoff para requisições de rede
 * Implementa resiliência para falhas temporárias de conectividade
 */

export interface RetryOptions {
  maxRetries?: number;
  baseDelay?: number;
  maxDelay?: number;
  backoffFactor?: number;
  retryCondition?: (error: Error, response?: Response) => boolean;
  onRetry?: (attempt: number, error: Error, delay: number) => void;
  timeout?: number;
}

export interface FetchError extends Error {
  status?: number;
  isRetryable: boolean;
  attempt: number;
  totalAttempts: number;
}

export class ResilientFetcher {
  private static readonly DEFAULT_OPTIONS: Required<RetryOptions> = {
    maxRetries: 3,
    baseDelay: 1000,
    maxDelay: 10000,
    backoffFactor: 2,
    retryCondition: ResilientFetcher.defaultRetryCondition,
    onRetry: () => {},
    timeout: 10000
  };

  /**
   * Função fetch com retry automático
   */
  static async fetchWithRetry(
    url: string,
    options: RequestInit = {},
    retryOptions: RetryOptions = {}
  ): Promise<Response> {
    const opts = { ...this.DEFAULT_OPTIONS, ...retryOptions };
    let lastError: Error | null = null;

    for (let attempt = 1; attempt <= opts.maxRetries + 1; attempt++) {
      try {
        const response = await this.fetchWithTimeout(url, options, opts.timeout);

        // Verificar se a resposta requer retry
        if (opts.retryCondition(lastError || new Error(), response)) {
          if (attempt <= opts.maxRetries) {
            const delay = this.calculateDelay(attempt - 1, opts);
            opts.onRetry(attempt, lastError || new Error('Retry condition met'), delay);
            await this.sleep(delay);
            continue;
          }
        }

        return response;
      } catch (error) {
        lastError = error as Error;

        // Verificar se o erro é retryable
        if (!opts.retryCondition(lastError)) {
          break;
        }

        if (attempt <= opts.maxRetries) {
          const delay = this.calculateDelay(attempt - 1, opts);
          opts.onRetry(attempt, lastError, delay);
          await this.sleep(delay);
        }
      }
    }

    // Criar erro final com informações de retry
    const fetchError: FetchError = new Error(
      `Falha após ${opts.maxRetries + 1} tentativas: ${lastError?.message || 'Erro desconhecido'}`
    ) as FetchError;
    fetchError.status = this.extractStatusFromError(lastError);
    fetchError.isRetryable = true;
    fetchError.attempt = opts.maxRetries + 1;
    fetchError.totalAttempts = opts.maxRetries + 1;
    fetchError.cause = lastError;

    throw fetchError;
  }

  /**
   * Função fetch com timeout
   */
  private static async fetchWithTimeout(
    url: string,
    options: RequestInit,
    timeout: number
  ): Promise<Response> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    try {
      const response = await fetch(url, {
        ...options,
        signal: controller.signal
      });
      return response;
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        const timeoutError: FetchError = new Error(
          `Timeout de ${timeout}ms excedido para ${url}`
        ) as FetchError;
        timeoutError.isRetryable = true;
        timeoutError.attempt = 1;
        timeoutError.totalAttempts = 1;
        throw timeoutError;
      }
      throw error;
    } finally {
      clearTimeout(timeoutId);
    }
  }

  /**
   * Condição padrão para retry
   */
  private static defaultRetryCondition(
    error: Error | null,
    response?: Response
  ): boolean {
    // 🚨 RATE LIMITING DETECTION - Don't retry on rate limit errors
    if (this.isRateLimitError(error, response)) {
      console.warn('[ResilientFetcher] Rate limit detected - preventing retry');
      return false;
    }

    // Retry em erros de rede
    if (error) {
      // Timeout
      if (error.message.includes('Timeout') || error.message.includes('AbortError')) {
        return true;
      }

      // Erros de rede/Fetch
      if (error.message.includes('Failed to fetch') ||
          error.message.includes('NetworkError') ||
          error.message.includes('ECONNRESET') ||
          error.message.includes('ENOTFOUND')) {
        return true;
      }

      // Erros específicos do IndexedDB/Storage
      if (error.message.includes('IndexedDB') ||
          error.message.includes('Connection to Indexed Database') ||
          error.message.includes('quota')) {
        return false; // Não retry em erros de storage
      }
    }

    // Retry em status HTTP específicos
    if (response) {
      const status = response.status;

      // Server errors e alguns client errors
      if (status >= 500 || // Server errors
          status === 408 || // Request Timeout
          status === 429 || // Too Many Requests
          status === 503) { // Service Unavailable
        return true;
      }

      // Não retry em erros de cliente definitivos
      if (status >= 400 && status < 500 && status !== 408 && status !== 429) {
        return false;
      }
    }

    return true;
  }

  /**
   * Calcula delay com exponential backoff e jitter
   */
  private static calculateDelay(attempt: number, options: Required<RetryOptions>): number {
    // Exponential backoff
    let delay = options.baseDelay * Math.pow(options.backoffFactor, attempt);

    // Adicionar jitter para evitar thundering herd
    const jitter = delay * 0.1 * Math.random();
    delay += jitter;

    // Limitar ao máximo
    delay = Math.min(delay, options.maxDelay);

    return Math.floor(delay);
  }

  /**
   * Helper para sleep
   */
  private static sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Extrai status HTTP de erro quando possível
   */
  private static extractStatusFromError(error: Error | null): number | undefined {
    if (!error) return undefined;

    // Tentar extrair de mensagens de erro comuns
    const statusMatch = error.message.match(/status (\d+)/i);
    if (statusMatch) {
      return parseInt(statusMatch[1], 10);
    }

    // Status codes comuns em mensagens de erro
    if (error.message.includes('503')) return 503;
    if (error.message.includes('502')) return 502;
    if (error.message.includes('504')) return 504;
    if (error.message.includes('500')) return 500;
    if (error.message.includes('429')) return 429;
    if (error.message.includes('408')) return 408;

    return undefined;
  }

  /**
   * Verifica saúde da conexão
   */
  static async checkConnectivity(): Promise<{
    online: boolean;
    latency?: number;
    error?: string;
  }> {
    const startTime = Date.now();

    try {
      const response = await this.fetchWithRetry(
        'https://httpbin.org/get',
        { method: 'HEAD' },
        { maxRetries: 1, timeout: 3000 }
      );

      const latency = Date.now() - startTime;

      return {
        online: response.ok,
        latency
      };
    } catch (error) {
      return {
        online: false,
        error: (error as Error).message
      };
    }
  }

  /**
   * Wrapper específico para scripts externos (como o Stripe)
   */
  static async loadExternalScript(
    src: string,
    options: RetryOptions = {}
  ): Promise<HTMLScriptElement> {
    const opts = {
      ...this.DEFAULT_OPTIONS,
      maxRetries: 2,
      baseDelay: 500,
      ...options
    };

    return new Promise((resolve, reject) => {
      let attempt = 0;
      let lastError: Error | null = null;

      const loadScript = () => {
        attempt++;

        const script = document.createElement('script');
        script.src = src;
        script.async = true;

        // Timeout para carregamento do script
        const timeoutId = setTimeout(() => {
          script.remove();
          const error = new Error(`Timeout carregando script: ${src}`);

          if (attempt <= opts.maxRetries + 1) {
            lastError = error;
            const delay = this.calculateDelay(attempt - 1, opts);
            opts.onRetry(attempt, error, delay);
            setTimeout(loadScript, delay);
          } else {
            reject(error);
          }
        }, opts.timeout);

        script.onload = () => {
          clearTimeout(timeoutId);
          resolve(script);
        };

        script.onerror = () => {
          clearTimeout(timeoutId);
          const error = new Error(`Falha ao carregar script: ${src}`);

          if (attempt <= opts.maxRetries + 1) {
            lastError = error;
            const delay = this.calculateDelay(attempt - 1, opts);
            opts.onRetry(attempt, error, delay);
            setTimeout(loadScript, delay);
          } else {
            reject(error);
          }
        };

        // Adicionar ao DOM
        document.head.appendChild(script);
      };

      loadScript();
    });
  }

  /**
   * Monitora status de recursos externos
   */
  static async checkExternalResources(): Promise<{
    stripe: boolean;
    googleApis: boolean;
    cdnResources: boolean;
    errors: string[];
  }> {
    const results = {
      stripe: false,
      googleApis: false,
      cdnResources: false,
      errors: [] as string[]
    };

    // Verificar Stripe
    try {
      const stripeScript = await this.loadExternalScript(
        'https://js.stripe.com/v3/pricing-table.js',
        { maxRetries: 1, timeout: 3000 }
      );
      results.stripe = !!stripeScript;
    } catch (error) {
      results.errors.push(`Stripe: ${(error as Error).message}`);
    }

    // Verificar Google APIs
    try {
      const response = await this.fetchWithRetry(
        'https://apis.google.com/js/api.js',
        { method: 'HEAD' },
        { maxRetries: 1, timeout: 3000 }
      );
      results.googleApis = response.ok;
    } catch (error) {
      results.errors.push(`Google APIs: ${(error as Error).message}`);
    }

    // Verificar CDN geral
    try {
      const response = await this.fetchWithRetry(
        'https://www.google.com',
        { method: 'HEAD' },
        { maxRetries: 1, timeout: 3000 }
      );
      results.cdnResources = response.ok;
    } catch (error) {
      results.errors.push(`CDN: ${(error as Error).message}`);
    }

    return results;
  }

  /**
   * 🚨 RATE LIMITING DETECTION - Check if error/response indicates rate limiting
   */
  private static isRateLimitError(error: Error | null, response?: Response): boolean {
    // Check HTTP status codes that indicate rate limiting
    if (response) {
      const rateLimitStatuses = [429, 503, 402]; // Too Many Requests, Service Unavailable, Payment Required
      if (rateLimitStatuses.includes(response.status)) {
        return true;
      }

      // Check Rate Limit headers
      const rateLimitHeaders = [
        'x-ratelimit-remaining',
        'x-rate-limit-remaining',
        'x-ratelimit-reset',
        'x-rate-limit-reset',
        'retry-after'
      ];

      for (const header of rateLimitHeaders) {
        if (response.headers.get(header)) {
          return true;
        }
      }
    }

    // Check error messages for rate limiting indicators
    if (error) {
      const rateLimitPatterns = [
        'rate limit',
        'rate-limit',
        'too many requests',
        'quota exceeded',
        'api limit',
        'throttled',
        'retry after',
        'service temporarily unavailable'
      ];

      const errorMessage = error.message.toLowerCase();
      return rateLimitPatterns.some(pattern => errorMessage.includes(pattern));
    }

    return false;
  }
}

// Função de conveniência para uso global
export const fetchWithRetry = ResilientFetcher.fetchWithRetry;
export const loadExternalScript = ResilientFetcher.loadExternalScript;
export const checkConnectivity = ResilientFetcher.checkConnectivity;
export const checkExternalResources = ResilientFetcher.checkExternalResources;