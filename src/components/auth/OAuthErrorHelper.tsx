'use client'

import React from 'react'
import { AlertCircle, ExternalLink, RefreshCw, Settings } from 'lucide-react'

interface OAuthErrorHelperProps {
  error?: {
    code?: string
    message?: string
  }
  onRetry?: () => void
}

export function OAuthErrorHelper({ error, onRetry }: OAuthErrorHelperProps) {
  const isOAuthError = error?.code === 'auth/network-request-failed'
  const isUnauthorizedDomain = error?.code === 'auth/unauthorized-domain'

  if (!isOAuthError && !isUnauthorizedDomain) {
    return null
  }

  const handleTestOAuth = () => {
    window.open('/oauth-test.html', '_blank')
  }

  return (
    <div className="rounded-lg border border-red-200 bg-red-50 p-4 my-4">
      <div className="flex items-start space-x-3">
        <div className="flex-shrink-0">
          <AlertCircle className="h-5 w-5 text-red-400" />
        </div>
        <div className="flex-1">
          <h3 className="text-sm font-medium text-red-800">
            Problema de Configuração OAuth Detectado
          </h3>

          <div className="mt-2 text-sm text-red-700">
            <p>
              {isOAuthError
                ? "O sistema detectou um problema na configuração OAuth do Google. Isso geralmente ocorre quando o Client ID não está configurado corretamente no Google Cloud Console."
                : "O domínio atual não está autorizado no Firebase Authentication. É necessário adicionar este domínio à lista de domínios autorizados."
              }
            </p>
          </div>

          <div className="mt-4 space-y-3">
            {isOAuthError && (
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={onRetry}
                  className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded text-red-700 bg-red-100 hover:bg-red-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                >
                  <RefreshCw className="h-3 w-3 mr-1" />
                  Tentar Novamente
                </button>

                <button
                  onClick={handleTestOAuth}
                  className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded text-red-700 bg-red-100 hover:bg-red-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                >
                  <Settings className="h-3 w-3 mr-1" />
                  Testar Configuração
                </button>
              </div>
            )}

            <div className="rounded-md bg-white p-3 border border-red-200">
              <h4 className="text-xs font-semibold text-red-800 mb-2">
                Para resolver este problema:
              </h4>
              <ol className="text-xs text-red-700 space-y-1 list-decimal list-inside">
                <li>
                  Acesse o{' '}
                  <a
                    href="https://console.cloud.google.com/apis/credentials"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:text-blue-800 underline inline-flex items-center"
                  >
                    Google Cloud Console
                    <ExternalLink className="h-3 w-3 ml-1" />
                  </a>
                </li>
                <li>Verifique se existe um "OAuth 2.0 Client ID" para "Web application"</li>
                <li>Se não existir, crie um novo com as seguintes configurações:</li>
                <ul className="mt-1 ml-4 space-y-1">
                  <li className="flex items-center">
                    <span className="font-mono bg-gray-100 px-1 rounded">Application type:</span>
                    <span className="ml-2">Web application</span>
                  </li>
                  <li className="flex items-center">
                    <span className="font-mono bg-gray-100 px-1 rounded">Authorized JavaScript origins:</span>
                    <span className="ml-2">https://svlentes.com.br, https://svlentes.shop</span>
                  </li>
                  {isUnauthorizedDomain && (
                    <li className="flex items-center">
                      <span className="font-mono bg-gray-100 px-1 rounded">Authorized redirect URIs:</span>
                      <span className="ml-2">https://svlentes.com.br</span>
                    </li>
                  )}
                </ul>
                <li>Copie o Client ID gerado e adicione às variáveis de ambiente</li>
              </ol>
            </div>

            {isOAuthError && (
              <div className="flex items-center space-x-2 text-xs text-red-600">
                <span>Erro específico:</span>
                <code className="bg-red-100 px-2 py-1 rounded font-mono">
                  {error?.code || 'auth/network-request-failed'}
                </code>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default OAuthErrorHelper