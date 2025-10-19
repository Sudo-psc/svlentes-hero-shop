'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import { referralProgramData } from '@/data/referral-program'
import { trackEvent } from '@/lib/analytics'

interface ReferralCardProps {
    title: string
    description?: string
    icon: string
    children: React.ReactNode
    highlight?: boolean
    className?: string
}

function ReferralCard({
    title,
    description,
    icon,
    children,
    highlight = false,
    className
}: ReferralCardProps) {
    return (
        <div className={cn(
            'bg-white rounded-2xl border-2 p-8 shadow-lg transition-all duration-300 hover:shadow-xl',
            highlight
                ? 'border-primary-500 ring-2 ring-primary-100 bg-gradient-to-br from-primary-50 to-white'
                : 'border-gray-200 hover:border-primary-300',
            className
        )}>
            <div className="text-center mb-6">
                <div className="text-4xl mb-4">{icon}</div>
                <h3 className="text-2xl font-bold text-gray-900 mb-2">{title}</h3>
                {description && (
                    <p className="text-gray-600">{description}</p>
                )}
            </div>
            {children}
        </div>
    )
}

interface BenefitBadgeProps {
    amount: string
    label: string
    variant?: 'primary' | 'secondary'
}

function BenefitBadge({ amount, label, variant = 'primary' }: BenefitBadgeProps) {
    return (
        <div className={cn(
            'inline-flex flex-col items-center px-6 py-4 rounded-xl font-semibold',
            variant === 'primary'
                ? 'bg-primary-600 text-white'
                : 'bg-green-100 text-green-800'
        )}>
            <span className="text-2xl font-bold">{amount}</span>
            <span className="text-sm opacity-90">{label}</span>
        </div>
    )
}

interface StepCardProps {
    number: number
    title: string
    description: string
    icon: string
}

function StepCard({ number, title, description, icon }: StepCardProps) {
    return (
        <div className="flex items-start space-x-4 p-4 rounded-xl bg-gray-50 hover:bg-gray-100 transition-colors">
            <div className="flex-shrink-0">
                <div className="w-12 h-12 bg-primary-600 text-white rounded-full flex items-center justify-center font-bold text-lg">
                    {number}
                </div>
            </div>
            <div className="flex-1">
                <div className="flex items-center mb-2">
                    <span className="text-2xl mr-2">{icon}</span>
                    <h4 className="text-lg font-semibold text-gray-900">{title}</h4>
                </div>
                <p className="text-gray-600">{description}</p>
            </div>
        </div>
    )
}

export default function ReferralProgram() {
    const [showTerms, setShowTerms] = useState(false)
    const [referralLink, setReferralLink] = useState('')
    const [isGeneratingLink, setIsGeneratingLink] = useState(false)

    const generateReferralLink = async () => {
        setIsGeneratingLink(true)
        try {
            // Simulate API call to generate referral link
            await new Promise(resolve => setTimeout(resolve, 1000))
            const mockLink = `https://svlentes.com.br/ref/${Math.random().toString(36).substr(2, 9)}`
            setReferralLink(mockLink)

            // Track analytics event
            trackEvent('referral_link_generated', {
                source: 'main_card',
                user_type: 'new', // Could be determined based on user state
            })
        } catch (error) {
            console.error('Erro ao gerar link de indicação:', error)
            alert('Erro ao gerar link. Tente novamente.')
        } finally {
            setIsGeneratingLink(false)
        }
    }

    const shareReferralLink = async (platform: string) => {
        if (!referralLink) return

        const shareText = `🎯 Descubra a SVlentes - Nunca mais fique sem lentes de contato!\n\n✅ Lentes entregues em casa\n✅ Acompanhamento médico incluído\n✅ Economia garantida\n\nUse meu link e ganhe R$ 30 de desconto: ${referralLink}`

        try {
            if (platform === 'whatsapp') {
                const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(shareText)}`
                window.open(whatsappUrl, '_blank')
            } else if (platform === 'copy') {
                await navigator.clipboard.writeText(referralLink)
                alert('Link copiado para a área de transferência!')
            } else if (platform === 'email') {
                const emailUrl = `mailto:?subject=${encodeURIComponent('Conheça a SVlentes - Assinatura de Lentes')}&body=${encodeURIComponent(shareText)}`
                window.open(emailUrl)
            }

            // Track analytics event
            trackEvent('referral_link_shared', {
                platform: platform,
                method: 'direct_share',
            })
        } catch (error) {
            console.error('Erro ao compartilhar:', error)
            alert('Erro ao compartilhar. Tente novamente.')
        }
    }

    const { mainCard, rulesCard, howItWorks, terms } = referralProgramData

    return (
        <section id="programa-indicacao" className="py-16 lg:py-24 bg-gradient-to-br from-gray-50 to-primary-50">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                {/* Header */}
                <div className="text-center mb-16">
                    <div className="inline-flex items-center px-4 py-2 rounded-full bg-primary-100 text-primary-800 text-sm font-semibold mb-6">
                        <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                        </svg>
                        Programa de Indicação
                    </div>
                    <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
                        Compartilhe o Cuidado com a Visão
                    </h2>
                    <p className="text-xl text-gray-600 max-w-3xl mx-auto">
                        Indique amigos e familiares para a SVlentes e ambos ganham descontos especiais
                    </p>
                </div>

                {/* Main Cards Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-16">
                    {/* Main Benefits Card */}
                    <ReferralCard
                        title={mainCard.title}
                        description={mainCard.description}
                        icon={mainCard.icon}
                        highlight={mainCard.highlight}
                    >
                        <div className="space-y-6">
                            {/* Benefits Display */}
                            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
                                <div className="text-center">
                                    <BenefitBadge
                                        amount={mainCard.benefitIndicator}
                                        label="Para você"
                                        variant="primary"
                                    />
                                    <p className="text-sm text-gray-600 mt-2">Na sua próxima mensalidade</p>
                                </div>

                                <div className="hidden sm:flex items-center">
                                    <svg className="w-8 h-8 text-primary-400" fill="currentColor" viewBox="0 0 20 20">
                                        <path fillRule="evenodd" d="M10.293 15.707a1 1 0 010-1.414L14.586 10l-4.293-4.293a1 1 0 111.414-1.414l5 5a1 1 0 010 1.414l-5 5a1 1 0 01-1.414 0z" clipRule="evenodd" />
                                        <path fillRule="evenodd" d="M3 10a1 1 0 011-1h10a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd" />
                                    </svg>
                                </div>

                                <div className="text-center">
                                    <BenefitBadge
                                        amount={mainCard.benefitIndicated}
                                        label="Para seu amigo"
                                        variant="secondary"
                                    />
                                    <p className="text-sm text-gray-600 mt-2">Na primeira assinatura</p>
                                </div>
                            </div>

                            {/* Referral Link Generation */}
                            <div className="space-y-4">
                                {!referralLink ? (
                                    <Button
                                        onClick={generateReferralLink}
                                        disabled={isGeneratingLink}
                                        className="w-full py-3 text-lg font-semibold bg-primary-600 hover:bg-primary-700 text-white"
                                    >
                                        {isGeneratingLink ? (
                                            <div className="flex items-center justify-center">
                                                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                                </svg>
                                                Gerando seu link...
                                            </div>
                                        ) : (
                                            <>
                                                <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                                                    <path fillRule="evenodd" d="M12.586 4.586a2 2 0 112.828 2.828l-3 3a2 2 0 01-2.828 0 1 1 0 00-1.414 1.414 4 4 0 005.656 0l3-3a4 4 0 00-5.656-5.656l-1.5 1.5a1 1 0 101.414 1.414l1.5-1.5zm-5 5a2 2 0 012.828 0 1 1 0 101.414-1.414 4 4 0 00-5.656 0l-3 3a4 4 0 105.656 5.656l1.5-1.5a1 1 0 10-1.414-1.414l-1.5 1.5a2 2 0 11-2.828-2.828l3-3z" clipRule="evenodd" />
                                                </svg>
                                                Gerar Meu Link de Indicação
                                            </>
                                        )}
                                    </Button>
                                ) : (
                                    <div className="space-y-3">
                                        {/* Generated Link Display */}
                                        <div className="bg-gray-100 rounded-lg p-4 border-2 border-dashed border-gray-300">
                                            <p className="text-sm font-medium text-gray-700 mb-2">Seu link de indicação:</p>
                                            <div className="flex items-center space-x-2">
                                                <code className="flex-1 text-sm bg-white px-3 py-2 rounded border text-gray-800 font-mono">
                                                    {referralLink}
                                                </code>
                                                <Button
                                                    onClick={() => shareReferralLink('copy')}
                                                    variant="outline"
                                                    size="sm"
                                                    className="flex-shrink-0"
                                                >
                                                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                                        <path d="M8 3a1 1 0 011-1h2a1 1 0 110 2H9a1 1 0 01-1-1z" />
                                                        <path d="M6 3a2 2 0 00-2 2v11a2 2 0 002 2h8a2 2 0 002-2V5a2 2 0 00-2-2 3 3 0 01-3 3H9a3 3 0 01-3-3z" />
                                                    </svg>
                                                </Button>
                                            </div>
                                        </div>

                                        {/* Share Buttons */}
                                        <div className="flex flex-col sm:flex-row gap-2">
                                            <Button
                                                onClick={() => shareReferralLink('whatsapp')}
                                                className="flex-1 bg-green-600 hover:bg-green-700 text-white"
                                            >
                                                <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 24 24">
                                                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893A11.821 11.821 0 0020.885 3.106" />
                                                </svg>
                                                Compartilhar no WhatsApp
                                            </Button>
                                            <Button
                                                onClick={() => shareReferralLink('email')}
                                                variant="outline"
                                                className="flex-1"
                                            >
                                                <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                                                    <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" />
                                                    <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" />
                                                </svg>
                                                Enviar por Email
                                            </Button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </ReferralCard>

                    {/* Rules Card */}
                    <ReferralCard
                        title={rulesCard.title}
                        icon={rulesCard.icon}
                    >
                        <div className="space-y-4">
                            <ul className="space-y-3">
                                {rulesCard.rules.map((rule, index) => (
                                    <li key={index} className="flex items-start">
                                        <svg
                                            className="w-5 h-5 text-green-500 mt-0.5 mr-3 flex-shrink-0"
                                            fill="currentColor"
                                            viewBox="0 0 20 20"
                                        >
                                            <path
                                                fillRule="evenodd"
                                                d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                                                clipRule="evenodd"
                                            />
                                        </svg>
                                        <span className="text-gray-700">{rule}</span>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    </ReferralCard>
                </div>

                {/* How It Works Section */}
                <div className="bg-white rounded-2xl border border-gray-200 p-8 mb-8">
                    <div className="text-center mb-8">
                        <h3 className="text-2xl font-bold text-gray-900 mb-4">{howItWorks.title}</h3>
                        <p className="text-gray-600">Processo simples em 3 passos</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {howItWorks.steps.map((step) => (
                            <StepCard
                                key={step.number}
                                number={step.number}
                                title={step.title}
                                description={step.description}
                                icon={step.icon}
                            />
                        ))}
                    </div>
                </div>

                {/* Terms and Conditions */}
                <div className="text-center">
                    <Button
                        variant="outline"
                        onClick={() => setShowTerms(!showTerms)}
                        className="mb-4"
                    >
                        {showTerms ? 'Ocultar' : 'Ver'} Termos e Condições
                        <svg
                            className={cn("w-4 h-4 ml-2 transition-transform", showTerms && "rotate-180")}
                            fill="currentColor"
                            viewBox="0 0 20 20"
                        >
                            <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                        </svg>
                    </Button>

                    {showTerms && (
                        <div className="bg-gray-50 rounded-xl p-6 text-left max-w-4xl mx-auto">
                            <h4 className="text-lg font-semibold text-gray-900 mb-4">{terms.title}</h4>
                            <ul className="space-y-2 text-sm text-gray-700">
                                {terms.conditions.map((condition, index) => (
                                    <li key={index} className="flex items-start">
                                        <span className="text-primary-500 mr-2 mt-1">•</span>
                                        {condition}
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}
                </div>
            </div>
        </section>
    )
}