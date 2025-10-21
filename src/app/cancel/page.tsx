import { Metadata } from 'next'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
export const metadata: Metadata = {
    title: 'Pagamento Cancelado - SVlentes',
    description: 'Seu pagamento foi cancelado. Você pode tentar novamente a qualquer momento.',
}
export default function CancelPage() {
    return (
        <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-2xl mx-auto">
                <div className="text-center mb-8">
                    <div className="mx-auto h-20 w-20 text-orange-500 mb-6">
                        <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" className="w-full h-full">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                        </svg>
                    </div>
                    <h1 className="text-3xl font-bold text-gray-900 mb-4">
                        Pagamento Cancelado
                    </h1>
                    <p className="text-lg text-gray-600 mb-2">
                        Seu pagamento foi cancelado e nenhuma cobrança foi realizada.
                    </p>
                    <p className="text-gray-500">
                        Não se preocupe, você pode tentar novamente a qualquer momento.
                    </p>
                </div>
                {/* Reasons and Solutions */}
                <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
                    <h2 className="text-xl font-semibold text-gray-900 mb-4">
                        Possíveis motivos para o cancelamento:
                    </h2>
                    <div className="space-y-3 text-gray-600 mb-6">
                        <div className="flex items-start">
                            <svg className="w-5 h-5 text-gray-400 mr-2 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            <p>Você decidiu revisar os planos antes de assinar</p>
                        </div>
                        <div className="flex items-start">
                            <svg className="w-5 h-5 text-gray-400 mr-2 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            <p>Problema técnico durante o processamento</p>
                        </div>
                        <div className="flex items-start">
                            <svg className="w-5 h-5 text-gray-400 mr-2 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            <p>Dados do cartão incorretos ou limite insuficiente</p>
                        </div>
                        <div className="flex items-start">
                            <svg className="w-5 h-5 text-gray-400 mr-2 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            <p>Preferiu falar com nossa equipe antes de assinar</p>
                        </div>
                    </div>
                </div>
                {/* Benefits Reminder */}
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-8">
                    <h3 className="font-semibold text-blue-900 mb-3">Lembre-se dos benefícios da SVlentes:</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-blue-800 text-sm">
                        <div className="flex items-center">
                            <svg className="w-4 h-4 text-blue-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                            Acompanhamento médico especializado
                        </div>
                        <div className="flex items-center">
                            <svg className="w-4 h-4 text-blue-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                            Economia de até 40% vs compra avulsa
                        </div>
                        <div className="flex items-center">
                            <svg className="w-4 h-4 text-blue-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                            Entrega automática em casa
                        </div>
                        <div className="flex items-center">
                            <svg className="w-4 h-4 text-blue-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                            Cancele quando quiser
                        </div>
                    </div>
                </div>
                {/* Action Buttons */}
                <div className="space-y-4">
                    <Link href="/#planos-precos" className="block">
                        <Button className="w-full bg-blue-600 hover:bg-blue-700 text-white">
                            Tentar Novamente
                        </Button>
                    </Link>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <a
                            href="https://wa.me/+5533999898026?text=Olá! Estava tentando assinar a SVlentes mas tive um problema no pagamento. Podem me ajudar?"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="block"
                        >
                            <Button variant="outline" className="w-full">
                                <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 24 24">
                                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893A11.821 11.821 0 0020.885 3.488" />
                                </svg>
                                Falar no WhatsApp
                            </Button>
                        </a>
                        <Link href="/" className="block">
                            <Button variant="outline" className="w-full">
                                Voltar ao Início
                            </Button>
                        </Link>
                    </div>
                </div>
                {/* Help Section */}
                <div className="text-center mt-8 p-4 bg-gray-100 rounded-lg">
                    <p className="text-sm text-gray-600 mb-2">
                        <strong>Precisa de ajuda?</strong>
                    </p>
                    <p className="text-xs text-gray-500">
                        Nossa equipe está disponível para esclarecer dúvidas e ajudar com problemas técnicos
                    </p>
                </div>
            </div>
        </div>
    )
}