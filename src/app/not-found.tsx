import Link from 'next/link'
export default function NotFound() {
    return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
            <div className="max-w-md w-full text-center">
                <h1 className="text-6xl font-bold text-primary-600 mb-4">404</h1>
                <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                    Página não encontrada
                </h2>
                <p className="text-gray-600 mb-8">
                    Desculpe, a página que você está procurando não existe.
                </p>
                <Link
                    href="/"
                    className="inline-flex items-center px-6 py-3 bg-primary-600 text-white font-semibold rounded-lg hover:bg-primary-700 transition-colors"
                >
                    Voltar para Home
                </Link>
            </div>
        </div>
    )
}