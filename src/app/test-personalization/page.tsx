import { Metadata } from 'next'
import PersonalizationTest from '@/components/personalization/PersonalizationTest'
export const metadata: Metadata = {
    title: 'Teste de Personalização | SV Lentes',
    description: 'Página de teste do sistema de personalização dinâmica',
    robots: 'noindex, nofollow'
}
export default function TestPersonalizationPage() {
    return (
        <div className="min-h-screen bg-gray-50 py-8">
            <div className="container mx-auto px-4">
                <div className="text-center mb-8">
                    <h1 className="text-3xl font-bold text-gray-900 mb-2">
                        🧪 Teste do Sistema de Personalização
                    </h1>
                    <p className="text-gray-600">
                        Demonstração do sistema de personalização dinâmica com 8 personas
                    </p>
                </div>
                <PersonalizationTest />
                <div className="mt-8 text-center text-sm text-gray-500">
                    <p>
                        Esta página é apenas para testes e desenvolvimento do sistema de personalização.
                    </p>
                    <p>
                        Em produção, o sistema funciona de forma transparente em todas as páginas.
                    </p>
                </div>
            </div>
        </div>
    )
}