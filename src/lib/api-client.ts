/**
 * API Client with retry logic and error handling
 * Provides resilient HTTP requests with exponential backoff
 */
export class ApiClient {
  private baseUrl: string;
  private timeout: number = 30000;
  private defaultHeaders: Record<string, string>;

  constructor(baseUrl?: string) {
    this.baseUrl = baseUrl || (typeof window !== 'undefined'
      ? window.location.origin
      : process.env.NEXT_PUBLIC_API_URL || 'https://svlentes.com.br');

    this.defaultHeaders = {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    };
  }

  async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeout);

    const url = endpoint.startsWith('http')
      ? endpoint
      : `${this.baseUrl}${endpoint}`;

    try {
      const response = await fetch(url, {
        ...options,
        headers: {
          ...this.defaultHeaders,
          ...options.headers,
        },
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorText = await response.text().catch(() => 'Unknown error');
        throw new Error(`HTTP ${response.status}: ${response.statusText} - ${errorText}`);
      }

      return await response.json();
    } catch (error) {
      clearTimeout(timeoutId);

      if (error instanceof Error) {
        if (error.name === 'AbortError') {
          throw new Error('Request timeout after 30 seconds');
        }

        // Handle network errors
        if (error.message.includes('fetch')) {
          throw new Error('Network connection failed. Please check your internet connection.');
        }

        throw error;
      }

      throw new Error('Unknown request error');
    }
  }

  // Retry logic com exponential backoff
  async requestWithRetry<T>(
    endpoint: string,
    options: RequestInit = {},
    maxRetries: number = 3
  ): Promise<T> {
    let lastError: Error;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        return await this.request<T>(endpoint, options);
      } catch (error) {
        lastError = error as Error;

        if (attempt === maxRetries) {
          console.error(`Request failed after ${maxRetries} attempts:`, {
            endpoint,
            error: lastError.message,
            attempts: maxRetries
          });
          throw lastError;
        }

        // Exponential backoff: 1s, 2s, 4s, 8s, etc. (max 10s)
        const delay = Math.min(1000 * Math.pow(2, attempt - 1), 10000);

        console.warn(`Retry attempt ${attempt}/${maxRetries} for ${endpoint} in ${delay}ms:`, lastError.message);

        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }

    throw lastError!;
  }

  // Métodos convenientes
  async get<T>(endpoint: string, options?: RequestInit): Promise<T> {
    return this.requestWithRetry<T>(endpoint, { ...options, method: 'GET' });
  }

  async post<T>(endpoint: string, data?: any, options?: RequestInit): Promise<T> {
    return this.requestWithRetry<T>(endpoint, {
      ...options,
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  async put<T>(endpoint: string, data?: any, options?: RequestInit): Promise<T> {
    return this.requestWithRetry<T>(endpoint, {
      ...options,
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  async delete<T>(endpoint: string, options?: RequestInit): Promise<T> {
    return this.requestWithRetry<T>(endpoint, { ...options, method: 'DELETE' });
  }

  // Health check
  async healthCheck(): Promise<{ status: string; timestamp: string }> {
    return this.get('/api/health-check');
  }
}

// Singleton instance
export const apiClient = new ApiClient();