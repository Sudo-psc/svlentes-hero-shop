'use client'

import Link from 'next/link'

export default function OfflinePage() {
    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-cyan-50 to-silver-50 px-4">
            <div className="max-w-md w-full text-center space-y-6">
                <div className="relative">
                    <div className="absolute inset-0 flex items-center justify-center">
                        <div className="w-32 h-32 bg-cyan-100 rounded-full animate-pulse"></div>
                    </div>
                    <div className="relative">
                        <svg
                            className="w-32 h-32 mx-auto text-cyan-600"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M18.364 5.636a9 9 0 010 12.728m0 0l-2.829-2.829m2.829 2.829L21 21M15.536 8.464a5 5 0 010 7.072m0 0l-2.829-2.829m-4.243 2.829a4.978 4.978 0 01-1.414-2.83m-1.414 5.658a9 9 0 01-2.167-9.238m7.824 2.167a1 1 0 111.414 1.414m-1.414-1.414L3 3m8.293 8.293l1.414 1.414"
                            />
                        </svg>
                    </div>
                </div>

                <div className="space-y-3">
                    <h1 className="text-3xl font-bold text-gray-900">
                        Você está offline
                    </h1>
                    <p className="text-lg text-gray-600">
                        Não foi possível conectar à internet. Verifique sua conexão e tente novamente.
                    </p>
                </div>

                <div className="space-y-4 pt-4">
                    <button
                        onClick={() => window.location.reload()}
                        className="w-full inline-flex items-center justify-center px-6 py-3 border border-transparent text-base font-medium rounded-lg text-white bg-cyan-600 hover:bg-cyan-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-cyan-500 transition-colors"
                    >
                        <svg
                            className="w-5 h-5 mr-2"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                            />
                        </svg>
                        Tentar Novamente
                    </button>

                    <Link
                        href="/"
                        className="w-full inline-flex items-center justify-center px-6 py-3 border-2 border-cyan-600 text-base font-medium rounded-lg text-cyan-600 bg-white hover:bg-cyan-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-cyan-500 transition-colors"
                    >
                        Voltar para Home
                    </Link>
                </div>

                <div className="pt-6 text-sm text-gray-500">
                    <p>Dicas para resolver problemas de conexão:</p>
                    <ul className="mt-2 space-y-1 text-left">
                        <li>• Verifique se o Wi-Fi está ativado</li>
                        <li>• Reinicie seu roteador</li>
                        <li>• Verifique se há problemas com sua operadora</li>
                        <li>• Tente usar dados móveis se disponível</li>
                    </ul>
                </div>
            </div>
        </div>
    )
}
