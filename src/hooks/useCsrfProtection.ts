'use client'

import { useEffect, useState } from 'react'

/**
 * Hook para obter e gerenciar o token CSRF do cliente
 */
export function useCsrfProtection() {
  const [csrfToken, setCsrfToken] = useState<string | null>(null)

  useEffect(() => {
    // Obter token do cookie
    const getCsrfToken = (): string | null => {
      if (typeof document === 'undefined') return null

      const cookies = document.cookie.split(';')
      const csrfCookie = cookies.find(cookie =>
        cookie.trim().startsWith('csrf_token=')
      )

      if (!csrfCookie) return null

      return csrfCookie.split('=')[1]
    }

    const token = getCsrfToken()
    setCsrfToken(token)

    // Verificar periodicamente se o token mudou (a cada 30 segundos)
    const interval = setInterval(() => {
      const newToken = getCsrfToken()
      if (newToken !== csrfToken) {
        setCsrfToken(newToken)
      }
    }, 30000)

    return () => clearInterval(interval)
  }, [csrfToken])

  /**
   * Adiciona o token CSRF aos headers de uma requisição
   */
  const withCsrfHeaders = (headers: Record<string, string> = {}): Record<string, string> => {
    if (csrfToken) {
      return {
        ...headers,
        'x-csrf-token': csrfToken
      }
    }
    return headers
  }

  /**
   * Wrapper para fetch que automaticamente inclui o token CSRF
   */
  const fetchWithCsrf = async (url: string, options: RequestInit = {}) => {
    const headers = withCsrfHeaders(options.headers as Record<string, string> || {})

    return fetch(url, {
      ...options,
      headers
    })
  }

  return {
    csrfToken,
    withCsrfHeaders,
    fetchWithCsrf
  }
}
