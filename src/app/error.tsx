'use client'
import { useEffect } from 'react'
import Link from 'next/link'
export default function Error({
    error,
    reset,
}: {
    error: Error & { digest?: string }
    reset: () => void
}) {
    useEffect(() => {
        console.error(error)
    }, [error])
    return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
            <div className="max-w-md w-full text-center">
                <h1 className="text-6xl font-bold text-red-600 mb-4">500</h1>
                <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                    Algo deu errado
                </h2>
                <p className="text-gray-600 mb-8">
                    Desculpe, ocorreu um erro inesperado. Por favor, tente novamente.
                </p>
                <div className="flex flex-col gap-4">
                    <button
                        onClick={reset}
                        className="inline-flex items-center justify-center px-6 py-3 bg-primary-600 text-white font-semibold rounded-lg hover:bg-primary-700 transition-colors"
                    >
                        Tentar novamente
                    </button>
                    <Link
                        href="/"
                        className="inline-flex items-center justify-center px-6 py-3 border-2 border-primary-600 text-primary-600 font-semibold rounded-lg hover:bg-primary-600 hover:text-white transition-colors"
                    >
                        Voltar para Home
                    </Link>
                </div>
            </div>
        </div>
    )
}