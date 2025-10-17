'use client'

import { useEffect } from 'react'

interface RedirectClientProps {
  url: string
  delay?: number
}

/**
 * Componente de redirecionamento client-side
 *
 * Usado como fallback caso o redirecionamento server-side falhe.
 * Também exibe uma mensagem amigável ao usuário durante o redirecionamento.
 *
 * @param url - URL de destino para redirecionamento
 * @param delay - Tempo em milissegundos antes do redirecionamento (padrão: 0)
 */
export default function RedirectClient({ url, delay = 0 }: RedirectClientProps) {
  useEffect(() => {
    const timer = setTimeout(() => {
      window.location.href = url
    }, delay)

    return () => clearTimeout(timer)
  }, [url, delay])

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 px-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 text-center space-y-6">
        {/* Logo/Ícone */}
        <div className="flex justify-center">
          <div className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center animate-pulse">
            <svg
              className="w-8 h-8 text-white"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M13 7l5 5m0 0l-5 5m5-5H6"
              />
            </svg>
          </div>
        </div>

        {/* Título */}
        <h1 className="text-2xl font-bold text-gray-900">
          Redirecionando...
        </h1>

        {/* Descrição */}
        <p className="text-gray-600">
          Você está sendo redirecionado para a página de lentes de contato da{' '}
          <span className="font-semibold text-blue-600">Saraiva Vision</span>.
        </p>

        {/* Spinner de loading */}
        <div className="flex justify-center py-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>

        {/* Link manual */}
        <div className="pt-4 border-t border-gray-200">
          <p className="text-sm text-gray-500 mb-3">
            Se o redirecionamento não funcionar automaticamente:
          </p>
          <a
            href={url}
            className="inline-block px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors duration-200 shadow-md hover:shadow-lg"
          >
            Clique aqui para continuar
          </a>
        </div>

        {/* Informações de contato */}
        <div className="pt-4 text-xs text-gray-400">
          <p>Saraiva Vision - Clínica Oftalmológica</p>
          <p>Caratinga/MG | WhatsApp: (33) 99989-8026</p>
        </div>
      </div>
    </div>
  )
}
