'use client'

import { useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { trackEvent, trackSubscriptionEvent } from '@/lib/analytics'
import { trackPaymentCompleted } from '@/lib/conversion-tracking'

// Force dynamic rendering to avoid Suspense boundary issue with useSearchParams
export const dynamic = 'force-dynamic'

interface SessionData {
    customer_email: string
    customer_details: {
        name: string
        email: string
        phone?: string
    }
    subscription: {
        id: string
        status: string
    }
    amount_total: number
    currency: string
}

export default function SuccessPage() {
    const searchParams = useSearchParams()
    const sessionId = searchParams.get('session_id')
    const [sessionData, setSessionData] = useState<SessionData | null>(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    useEffect(() => {
        if (sessionId) {
            fetchSessionData(sessionId)
        } else {
            setError('ID da sessão não encontrado')
            setLoading(false)
        }
    }, [sessionId])

    const fetchSessionData = async (sessionId: string) => {
        try {
            const response = await fetch(`/api/checkout-session?session_id=${sessionId}`)
            const data = await response.json()

            if (data.success) {
                setSessionData(data.session)

                // Track successful conversion
                trackPaymentCompleted({
                    transactionId: sessionId,
                    planId: data.session.subscription?.id || 'unknown',
                    value: data.session.amount_total / 100,
                    currency: 'BRL',
                    subscriptionId: data.session.subscription?.id,
                })
            } else {
                setError(data.error || 'Erro ao carregar dados da sessão')
            }
        } catch (err) {
            setError('Erro ao conectar com o servidor')
        } finally {
            setLoading(false)
        }
    }

    if (loading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-green-50 to-primary-50 flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
                    <p className="text-gray-600">Carregando informações...</p>
                </div>
            </div>
        )
    }

    if (error) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-red-50 to-orange-50 flex items-center justify-center">
                <div className="max-w-md mx-auto text-center p-8">
                    <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
                        <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                        </svg>
                    </div>
                    <h1 className="text-2xl font-bold text-gray-900 mb-4">Ops! Algo deu errado</h1>
                    <p className="text-gray-600 mb-6">{error}</p>
                    <Link href="/">
                        <Button>Voltar ao Início</Button>
                    </Link>
                </div>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-green-50 to-primary-50">
            <div className="max-w-4xl mx-auto px-4 py-16">
                {/* Success Header */}
                <div className="text-center mb-12">
                    <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                        <svg className="w-10 h-10 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                    </div>

                    <Badge variant="default" className="mb-4">
                        Assinatura Confirmada
                    </Badge>

                    <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
                        Bem-vindo à SVlentes! 🎉
                    </h1>

                    <p className="text-xl text-gray-600 max-w-2xl mx-auto">
                        Sua assinatura foi processada com sucesso. Você nunca mais ficará sem lentes!
                    </p>
                </div>

                {/* Subscription Details */}
                {sessionData && (
                    <div className="bg-white rounded-2xl shadow-xl p-8 mb-8">
                        <h2 className="text-2xl font-bold text-gray-900 mb-6">Detalhes da Sua Assinatura</h2>

                        <div className="grid md:grid-cols-2 gap-6">
                            <div>
                                <h3 className="font-semibold text-gray-900 mb-2">Informações Pessoais</h3>
                                <div className="space-y-2 text-gray-600">
                                    <p><strong>Nome:</strong> {sessionData.customer_details.name}</p>
                                    <p><strong>Email:</strong> {sessionData.customer_details.email}</p>
                                    {sessionData.customer_details.phone && (
                                        <p><strong>Telefone:</strong> {sessionData.customer_details.phone}</p>
                                    )}
                                </div>
                            </div>

                            <div>
                                <h3 className="font-semibold text-gray-900 mb-2">Assinatura</h3>
                                <div className="space-y-2 text-gray-600">
                                    <p><strong>ID:</strong> {sessionData.subscription.id}</p>
                                    <p><strong>Status:</strong>
                                        <Badge variant="default" className="ml-2">
                                            {sessionData.subscription.status === 'active' ? 'Ativa' : sessionData.subscription.status}
                                        </Badge>
                                    </p>
                                    <p><strong>Valor:</strong> R$ {(sessionData.amount_total / 100).toFixed(2).replace('.', ',')}</p>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Next Steps */}
                <div className="bg-white rounded-2xl shadow-xl p-8 mb-8">
                    <h2 className="text-2xl font-bold text-gray-900 mb-6">Próximos Passos</h2>

                    <div className="space-y-6">
                        <div className="flex items-start">
                            <div className="flex-shrink-0 w-10 h-10 bg-green-100 rounded-full flex items-center justify-center mr-4">
                                <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                </svg>
                            </div>
                            <div>
                                <h3 className="font-semibold text-gray-900">Pagamento Processado</h3>
                                <p className="text-gray-600">Sua assinatura foi ativada com sucesso e o pagamento foi processado.</p>
                                <p className="text-sm text-green-600 mt-1">✓ Concluído</p>
                            </div>
                        </div>

                        <div className="flex items-start">
                            <div className="flex-shrink-0 w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center mr-4">
                                <span className="text-blue-600 font-bold text-sm">1</span>
                            </div>
                            <div>
                                <h3 className="font-semibold text-gray-900">Confirmação por Email</h3>
                                <p className="text-gray-600">Você receberá um email de confirmação com todos os detalhes da sua assinatura e instruções importantes.</p>
                                <p className="text-sm text-blue-600 mt-1">Em até 15 minutos</p>
                            </div>
                        </div>

                        <div className="flex items-start">
                            <div className="flex-shrink-0 w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center mr-4">
                                <span className="text-blue-600 font-bold text-sm">2</span>
                            </div>
                            <div>
                                <h3 className="font-semibold text-gray-900">Contato da Equipe Médica</h3>
                                <p className="text-gray-600">Dr. Philipe Saraiva Cruz ou sua equipe entrará em contato via WhatsApp para agendar sua primeira consulta oftalmológica.</p>
                                <p className="text-sm text-blue-600 mt-1">Em até 24 horas</p>
                            </div>
                        </div>

                        <div className="flex items-start">
                            <div className="flex-shrink-0 w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center mr-4">
                                <span className="text-blue-600 font-bold text-sm">3</span>
                            </div>
                            <div>
                                <h3 className="font-semibold text-gray-900">Consulta Oftalmológica</h3>
                                <p className="text-gray-600">Realize sua consulta para obter/atualizar sua prescrição e definir o tipo de lente ideal para você.</p>
                                <p className="text-sm text-blue-600 mt-1">Conforme agendamento</p>
                            </div>
                        </div>

                        <div className="flex items-start">
                            <div className="flex-shrink-0 w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center mr-4">
                                <span className="text-blue-600 font-bold text-sm">4</span>
                            </div>
                            <div>
                                <h3 className="font-semibold text-gray-900">Primeira Entrega</h3>
                                <p className="text-gray-600">Após a consulta, suas lentes serão enviadas para o endereço cadastrado conforme a frequência do seu plano.</p>
                                <p className="text-sm text-blue-600 mt-1">3-5 dias úteis após consulta</p>
                            </div>
                        </div>

                        <div className="flex items-start">
                            <div className="flex-shrink-0 w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center mr-4">
                                <span className="text-blue-600 font-bold text-sm">5</span>
                            </div>
                            <div>
                                <h3 className="font-semibold text-gray-900">Acompanhamento Contínuo</h3>
                                <p className="text-gray-600">Receba suas lentes automaticamente e tenha acompanhamento médico regular conforme seu plano.</p>
                                <p className="text-sm text-blue-600 mt-1">Conforme frequência do plano</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Important Information */}
                <div className="bg-yellow-50 border border-yellow-200 rounded-2xl p-8 mb-8">
                    <h2 className="text-xl font-bold text-yellow-900 mb-4">Informações Importantes</h2>
                    <div className="space-y-3 text-yellow-800">
                        <div className="flex items-start">
                            <svg className="w-5 h-5 text-yellow-600 mr-2 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            <p><strong>WhatsApp:</strong> Mantenha seu WhatsApp disponível para contato da equipe médica</p>
                        </div>
                        <div className="flex items-start">
                            <svg className="w-5 h-5 text-yellow-600 mr-2 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            <p><strong>Email:</strong> Verifique sua caixa de entrada e spam para não perder informações importantes</p>
                        </div>
                        <div className="flex items-start">
                            <svg className="w-5 h-5 text-yellow-600 mr-2 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            <p><strong>Prescrição:</strong> Se você já tem uma prescrição válida (menos de 1 ano), tenha-a em mãos para a consulta</p>
                        </div>
                        <div className="flex items-start">
                            <svg className="w-5 h-5 text-yellow-600 mr-2 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            <p><strong>Cancelamento:</strong> Você pode pausar ou cancelar sua assinatura a qualquer momento</p>
                        </div>
                    </div>
                </div>

                {/* Contact Information */}
                <div className="bg-primary-50 rounded-2xl p-8 text-center">
                    <h2 className="text-2xl font-bold text-gray-900 mb-4">Precisa de Ajuda?</h2>
                    <p className="text-gray-600 mb-6">
                        Nossa equipe está pronta para te atender e esclarecer qualquer dúvida.
                    </p>

                    <div className="flex flex-col sm:flex-row gap-4 justify-center">
                        <a
                            href="https://wa.me/+553399898026?text=Olá! Acabei de assinar a SVlentes e gostaria de tirar algumas dúvidas."
                            target="_blank"
                            rel="noopener noreferrer"
                        >
                            <Button className="bg-green-600 hover:bg-green-700">
                                <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 24 24">
                                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893A11.821 11.821 0 0020.885 3.488" />
                                </svg>
                                Falar no WhatsApp
                            </Button>
                        </a>

                        <Link href="/">
                            <Button variant="outline">
                                Voltar ao Início
                            </Button>
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    )
}