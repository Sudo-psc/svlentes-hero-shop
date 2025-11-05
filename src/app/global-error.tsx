'use client'

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <html>
      <body>
        <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
          <div className="max-w-md w-full text-center">
            <h1 className="text-6xl font-bold text-red-600 mb-4">Erro</h1>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">
              Algo deu errado!
            </h2>
            <p className="text-gray-600 mb-8">
              {error?.message || 'Ocorreu um erro inesperado.'}
            </p>
            <button
              onClick={() => reset()}
              className="inline-flex items-center px-6 py-3 bg-cyan-600 text-white font-semibold rounded-lg hover:bg-cyan-700 transition-colors"
            >
              Tentar novamente
            </button>
          </div>
        </div>
      </body>
    </html>
  )
}
