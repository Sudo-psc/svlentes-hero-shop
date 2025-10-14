'use client'

import { useSearchParams, useRouter } from 'next/navigation'
import { useEffect, useState, Suspense } from 'react'
import { Button } from '@/components/ui/Button'
import { CheckCircleIcon, ClockIcon, PhoneIcon, EnvelopeIcon } from '@heroicons/react/24/outline'

interface SchedulingDetails {
    id: string
    status: string
    estimatedConfirmation: string
    nextSteps: string[]
}

function AgendamentoConfirmadoContent() {
    const searchParams = useSearchParams()
    const router = useRouter()
    const [schedulingDetails, setSchedulingDetails] = useState<SchedulingDetails | null>(null)
    const [isLoading, setIsLoading] = useState(true)

    const schedulingId = searchParams.get('id')

    useEffect(() => {
        if (!schedulingId) {
            router.push('/agendar-consulta')
            return
        }

        // Simular busca dos detalhes do agendamento
        // Em produção, isso seria uma chamada para API
        setTimeout(() => {
            setSchedulingDetails({
                id: schedulingId,
                status: 'pending',
                estimatedConfirmation: '24 horas',
                nextSteps: [
                    'Você receberá uma confirmação por email em até 24 horas',
                    'Nossa equipe entrará em contato via WhatsApp para confirmar',
                    'Prepare seus documentos e prescrição médica (se tiver)'
                ]
            })
            setIsLoading(false)
        }, 1000)
    }, [schedulingId, router])

    if (isLoading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                    <p className="text-gray-600">Carregando detalhes do agendamento...</p>
                </div>
            </div>
        )
    }

    if (!schedulingDetails) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <p className="text-red-600 mb-4">Agendamento não encontrado</p>
                    <Button onClick={() => router.push('/agendar-consulta')}>
                        Fazer Novo Agendamento
                    </Button>
                </div>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-gray-50 py-8">
            <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
                {/* Success Header */}
                <div className="text-center mb-8">
                    <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-green-100 mb-4">
                        <CheckCircleIcon className="h-8 w-8 text-green-600" />
                    </div>
                    <h1 className="text-3xl font-bold text-gray-900 mb-2">
                        Agendamento Confirmado!
                    </h1>
                    <p className="text-lg text-gray-600">
                        Seu agendamento foi recebido com sucesso
                    </p>
                </div>

                {/* Scheduling Details Card */}
                <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
                    <div className="border-b border-gray-200 pb-4 mb-4">
                        <h2 className="text-xl font-semibold text-gray-900 mb-2">
                            Detalhes do Agendamento
                        </h2>
                        <div className="flex items-center text-sm text-gray-600">
                            <span className="font-medium">ID:</span>
                            <span className="ml-2 font-mono bg-gray-100 px-2 py-1 rounded">
                                {schedulingDetails.id}
                            </span>
                        </div>
                    </div>

                    {/* Doctor Info */}
                    <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
                        <div className="flex items-center">
                            <div className="flex-shrink-0">
                                <div className="h-12 w-12 rounded-full bg-green-100 flex items-center justify-center">
                                    <span className="text-green-600 font-semibold text-lg">Dr</span>
                                </div>
                            </div>
                            <div className="ml-4">
                                <h3 className="font-semibold text-green-900">Dr. Philipe Saraiva Cruz</h3>
                                <p className="text-green-700 text-sm">CRM 69.870 - Oftalmologista</p>
                                <p className="text-green-600 text-sm">Especialista em lentes de contato</p>
                            </div>
                        </div>
                    </div>

                    {/* Status */}
                    <div className="flex items-center mb-4">
                        <ClockIcon className="h-5 w-5 text-yellow-500 mr-2" />
                        <span className="text-sm text-gray-600">
                            <strong>Status:</strong> Aguardando confirmação
                        </span>
                    </div>

                    <div className="flex items-center mb-6">
                        <span className="text-sm text-gray-600">
                            <strong>Tempo estimado para confirmação:</strong> {schedulingDetails.estimatedConfirmation}
                        </span>
                    </div>

                    {/* Next Steps */}
                    <div className="border-t border-gray-200 pt-4">
                        <h3 className="font-semibold text-gray-900 mb-3">Próximos Passos:</h3>
                        <ul className="space-y-2">
                            {schedulingDetails.nextSteps.map((step, index) => (
                                <li key={index} className="flex items-start">
                                    <span className="flex-shrink-0 h-6 w-6 rounded-full bg-blue-100 text-blue-600 text-xs font-semibold flex items-center justify-center mr-3 mt-0.5">
                                        {index + 1}
                                    </span>
                                    <span className="text-sm text-gray-700">{step}</span>
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>

                {/* Contact Information */}
                <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
                    <h3 className="font-semibold text-gray-900 mb-4">Informações de Contato</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="flex items-center">
                            <PhoneIcon className="h-5 w-5 text-gray-400 mr-3" />
                            <div>
                                <p className="text-sm font-medium text-gray-900">WhatsApp</p>
                                <p className="text-sm text-gray-600">Nossa equipe entrará em contato</p>
                            </div>
                        </div>
                        <div className="flex items-center">
                            <EnvelopeIcon className="h-5 w-5 text-gray-400 mr-3" />
                            <div>
                                <p className="text-sm font-medium text-gray-900">Email</p>
                                <p className="text-sm text-gray-600">Confirmação será enviada</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Important Notes */}
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
                    <h4 className="font-semibold text-yellow-900 mb-2">Importante:</h4>
                    <ul className="text-sm text-yellow-800 space-y-1">
                        <li>• Mantenha seu WhatsApp disponível para contato</li>
                        <li>• Verifique sua caixa de email (incluindo spam)</li>
                        <li>• Tenha em mãos sua prescrição médica atual (se possuir)</li>
                        <li>• Prepare um documento com foto para a consulta</li>
                    </ul>
                </div>

                {/* Action Buttons */}
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                    <Button
                        onClick={() => router.push('/')}
                        variant="outline"
                        className="w-full sm:w-auto"
                    >
                        Voltar ao Início
                    </Button>

                    <Button
                        onClick={() => {
                            const whatsappMessage = encodeURIComponent(
                                `Olá! Acabei de fazer um agendamento no site da SVlentes. ID: ${schedulingDetails.id}. Gostaria de confirmar os detalhes.`
                            )
                            window.open(`https://wa.me/+553399898026?text=${whatsappMessage}`, '_blank')
                        }}
                        className="w-full sm:w-auto"
                    >
                        Falar no WhatsApp
                    </Button>
                </div>

                {/* Additional Help */}
                <div className="text-center mt-8">
                    <p className="text-sm text-gray-600">
                        Precisa de ajuda? Entre em contato conosco pelo WhatsApp ou email
                    </p>
                </div>
            </div>
        </div>
    )
}

export default function AgendamentoConfirmadoPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                    <p className="text-gray-600">Carregando...</p>
                </div>
            </div>
        }>
            <AgendamentoConfirmadoContent />
        </Suspense>
    )
}
