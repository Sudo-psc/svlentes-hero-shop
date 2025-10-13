'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { Tabs, TabItem } from '@/components/ui/tabs'
import { Icon } from '@/components/ui/Icon'
import { OptimizedImage } from '@/components/ui/OptimizedImage'
import { howItWorksSteps, processTimeline, serviceFeatures } from '@/data/how-it-works'
import { openWhatsAppWithContext } from '@/lib/whatsapp'
import { trackEvent } from '@/lib/analytics'
import { formatCurrency } from '@/lib/utils'
import {
    Play,
    CheckCircle,
    Clock,
    DollarSign,
    ArrowRight,
    MessageCircle,
    Phone,
    Calendar,
    Truck,
    Heart,
    Shield,
    Award,
    Users
} from 'lucide-react'

interface HowItWorksSectionProps {
    className?: string
}

export function HowItWorksSection({ className = '' }: HowItWorksSectionProps) {
    const [activeTab, setActiveTab] = useState<'monthly' | 'annual'>('monthly')

    const handleStartProcess = () => {
        openWhatsAppWithContext('consultation', {
            page: 'landing-page',
            section: 'how-it-works-cta',
            planInterest: activeTab === 'monthly' ? 'Plano Mensal' : 'Plano Anual'
        })
    }

    const handleLearnMore = () => {
        openWhatsAppWithContext('hero', {
            page: 'landing-page',
            section: 'how-it-works-info'
        })
    }

    // Preparar dados das abas
    const tabItems: TabItem[] = [
        {
            id: 'monthly',
            label: 'Plano Mensal',
            badge: 'Flexível',
            content: (
                <div className="space-y-8">
                    {/* Steps */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        {howItWorksSteps.monthly.map((step, index) => (
                            <div
                                key={step.number}
                                className="relative bg-white rounded-xl shadow-lg border border-gray-100 p-6 hover:shadow-xl transition-all duration-300 group"
                                style={{ animationDelay: `${index * 0.1}s` }}
                            >
                                {/* Step Number */}
                                <div className="absolute -top-4 -left-4 w-8 h-8 bg-primary-600 text-white rounded-full flex items-center justify-center font-bold text-sm group-hover:bg-primary-700 transition-colors">
                                    {step.number}
                                </div>

                                {/* Icon */}
                                <div className="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center mb-4 group-hover:bg-primary-200 transition-colors">
                                    <span className="text-2xl">{step.icon}</span>
                                </div>

                                {/* Content */}
                                <h4 className="text-lg font-semibold text-gray-900 mb-2 group-hover:text-primary-700 transition-colors">
                                    {step.title}
                                </h4>

                                <p className="text-gray-600 text-sm mb-4 leading-relaxed">
                                    {step.description}
                                </p>

                                {/* Cost & Economy */}
                                <div className="space-y-2">
                                    <div className="flex items-center justify-between text-sm">
                                        <span className="text-gray-500">Custo:</span>
                                        <span className="font-medium text-gray-900">{step.cost}</span>
                                    </div>
                                    <div className="flex items-center justify-between text-sm">
                                        <span className="text-green-600">Economia:</span>
                                        <span className="font-medium text-green-600">{step.economy}</span>
                                    </div>
                                    <div className="flex items-center justify-between text-sm">
                                        <span className="text-gray-500">Tempo:</span>
                                        <span className="font-medium text-gray-900">{step.duration}</span>
                                    </div>
                                </div>

                                {/* Arrow for connection (except last) */}
                                {index < howItWorksSteps.monthly.length - 1 && (
                                    <div className="hidden lg:block absolute -right-3 top-1/2 transform -translate-y-1/2 text-primary-300">
                                        <ArrowRight className="w-6 h-6" />
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>

                    {/* Timeline Summary */}
                    <div className="bg-primary-50 border border-primary-200 rounded-lg p-6">
                        <h4 className="font-semibold text-primary-800 mb-4 flex items-center">
                            <Clock className="w-5 h-5 mr-2" />
                            Cronograma do Processo
                        </h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <h5 className="font-medium text-primary-700 mb-2">Etapas do Processo:</h5>
                                <ul className="space-y-1 text-sm text-primary-600">
                                    {processTimeline.steps.slice(0, 3).map((step, index) => (
                                        <li key={index} className="flex items-center space-x-2">
                                            <CheckCircle className="w-4 h-4 text-green-500" />
                                            <span>{step}</span>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                            <div>
                                <h5 className="font-medium text-primary-700 mb-2">Prazos:</h5>
                                <div className="space-y-1 text-sm text-primary-600">
                                    <div className="flex items-center space-x-2">
                                        <Calendar className="w-4 h-4" />
                                        <span>{processTimeline.totalTime}</span>
                                    </div>
                                    <div className="flex items-center space-x-2">
                                        <Truck className="w-4 h-4" />
                                        <span>{processTimeline.firstDelivery}</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )
        },
        {
            id: 'annual',
            label: 'Plano Anual',
            badge: '2 meses grátis',
            content: (
                <div className="space-y-8">
                    {/* Steps */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        {howItWorksSteps.annual.map((step, index) => (
                            <div
                                key={step.number}
                                className="relative bg-white rounded-xl shadow-lg border border-gray-100 p-6 hover:shadow-xl transition-all duration-300 group"
                                style={{ animationDelay: `${index * 0.1}s` }}
                            >
                                {/* Step Number */}
                                <div className="absolute -top-4 -left-4 w-8 h-8 bg-secondary-600 text-white rounded-full flex items-center justify-center font-bold text-sm group-hover:bg-secondary-700 transition-colors">
                                    {step.number}
                                </div>

                                {/* Icon */}
                                <div className="w-12 h-12 bg-secondary-100 rounded-lg flex items-center justify-center mb-4 group-hover:bg-secondary-200 transition-colors">
                                    <span className="text-2xl">{step.icon}</span>
                                </div>

                                {/* Content */}
                                <h4 className="text-lg font-semibold text-gray-900 mb-2 group-hover:text-secondary-700 transition-colors">
                                    {step.title}
                                </h4>

                                <p className="text-gray-600 text-sm mb-4 leading-relaxed">
                                    {step.description}
                                </p>

                                {/* Cost & Economy */}
                                <div className="space-y-2">
                                    <div className="flex items-center justify-between text-sm">
                                        <span className="text-gray-500">Benefício:</span>
                                        <span className="font-medium text-secondary-700">{step.cost}</span>
                                    </div>
                                    <div className="flex items-center justify-between text-sm">
                                        <span className="text-green-600">Economia:</span>
                                        <span className="font-medium text-green-600">{step.economy}</span>
                                    </div>
                                    <div className="flex items-center justify-between text-sm">
                                        <span className="text-gray-500">Duração:</span>
                                        <span className="font-medium text-gray-900">{step.duration}</span>
                                    </div>
                                </div>

                                {/* Arrow for connection (except last) */}
                                {index < howItWorksSteps.annual.length - 1 && (
                                    <div className="hidden lg:block absolute -right-3 top-1/2 transform -translate-y-1/2 text-secondary-300">
                                        <ArrowRight className="w-6 h-6" />
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>

                    {/* Annual Benefits */}
                    <div className="bg-gradient-to-r from-secondary-50 to-green-50 border border-secondary-200 rounded-lg p-6">
                        <h4 className="font-semibold text-secondary-800 mb-4 flex items-center">
                            <Award className="w-5 h-5 mr-2" />
                            Vantagens do Plano Anual
                        </h4>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div className="text-center">
                                <div className="text-2xl font-bold text-secondary-600">2 meses</div>
                                <div className="text-sm text-secondary-700">Grátis</div>
                            </div>
                            <div className="text-center">
                                <div className="text-2xl font-bold text-green-600">R$ 600</div>
                                <div className="text-sm text-green-700">Economia extra</div>
                            </div>
                            <div className="text-center">
                                <div className="text-2xl font-bold text-blue-600">R$ 800</div>
                                <div className="text-sm text-blue-700">Em serviços médicos</div>
                            </div>
                        </div>
                    </div>
                </div>
            )
        }
    ]

    return (
        <section className={`py-16 lg:py-24 bg-gradient-to-br from-gray-50 to-white ${className}`}>
            <div className="container-custom">

                {/* Header */}
                <div className="text-center mb-16">
                    <Badge
                        variant="secondary"
                        className="mb-6 px-4 py-2 text-base"
                    >
                        <Play className="w-4 h-4 mr-2" />
                        Processo Simples
                    </Badge>

                    <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-gray-900 mb-6">
                        Como o{' '}
                        <span className="text-gradient">SVlentes Funciona</span>
                    </h2>

                    <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
                        Um processo simples e transparente para você nunca mais se preocupar
                        com suas lentes de contato. Veja como é fácil começar.
                    </p>
                </div>

                {/* Service Features */}
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-16">
                    {serviceFeatures.map((feature, index) => (
                        <div
                            key={feature.id}
                            className={cn(
                                'text-center p-4 rounded-lg transition-all duration-300 hover:shadow-md',
                                feature.highlight
                                    ? 'bg-primary-50 border border-primary-200'
                                    : 'bg-white border border-gray-100'
                            )}
                        >
                            <div className="text-2xl mb-2">{feature.icon}</div>
                            <h4 className="font-medium text-gray-900 text-sm mb-1">
                                {feature.title}
                            </h4>
                            <p className="text-xs text-gray-600">
                                {feature.description}
                            </p>
                        </div>
                    ))}
                </div>

                {/* Tabs */}
                <Tabs
                    items={tabItems}
                    defaultTab="monthly"
                    variant="pills"
                    size="lg"
                    onChange={(tabId) => {
                        const newTab = tabId as 'monthly' | 'annual'
                        const previousTab = activeTab
                        setActiveTab(newTab)
                        trackEvent('how_it_works_tab', {
                            tab: newTab === 'monthly' ? 'mensal' : 'anual',
                            time_spent: Date.now(), // Could track actual time spent on previous tab
                        })
                    }}
                    className="mb-16"
                />

                {/* CTA Section */}
                <div className="text-center">
                    <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-8 lg:p-12 max-w-4xl mx-auto">
                        <h3 className="text-2xl lg:text-3xl font-bold text-gray-900 mb-4">
                            Pronto para começar sua jornada SVlentes?
                        </h3>
                        <p className="text-lg text-gray-600 mb-8">
                            {activeTab === 'monthly'
                                ? 'Comece com flexibilidade total e cancele quando quiser.'
                                : 'Economize mais com o plano anual e ganhe 2 meses grátis!'
                            }
                        </p>

                        <div className="flex flex-col sm:flex-row gap-4 justify-center mb-8">
                            <Button
                                onClick={handleStartProcess}
                                size="lg"
                                className="flex items-center space-x-2"
                            >
                                <Phone className="w-5 h-5" />
                                <span>Iniciar Processo</span>
                            </Button>

                            <Button
                                onClick={handleLearnMore}
                                variant="outline"
                                size="lg"
                                className="flex items-center space-x-2"
                            >
                                <MessageCircle className="w-5 h-5" />
                                <span>Tirar Dúvidas</span>
                            </Button>
                        </div>

                        {/* Trust Elements - Usando Ícones Customizados */}
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-8 border-t border-gray-200">
                            <div className="text-center">
                                <div className="flex items-center justify-center mx-auto mb-2">
                                    <Icon name="shieldSecurity" size="md" />
                                </div>
                                <div className="text-sm font-medium text-gray-900">100% Seguro</div>
                                <div className="text-xs text-gray-600">Processo protegido</div>
                            </div>

                            <div className="text-center">
                                <div className="flex items-center justify-center mx-auto mb-2">
                                    <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-primary-200">
                                        <OptimizedImage
                                            src="/icones/drphilipe_perfil.jpeg"
                                            alt="Dr. Philipe Saraiva Cruz"
                                            width={48}
                                            height={48}
                                            quality={85}
                                            className="w-full h-full object-cover"
                                        />
                                    </div>
                                </div>
                                <div className="text-sm font-medium text-gray-900">Cuidado Médico</div>
                                <div className="text-xs text-gray-600">Dr. Philipe CRM 69.870</div>
                            </div>

                            <div className="text-center">
                                <div className="flex items-center justify-center mx-auto mb-2">
                                    <Icon name="delivery" size="md" />
                                </div>
                                <div className="text-sm font-medium text-gray-900">Entrega Garantida</div>
                                <div className="text-xs text-gray-600">Lentes em casa</div>
                            </div>

                            <div className="text-center">
                                <div className="flex items-center justify-center mx-auto mb-2">
                                    <Icon name="eyeCheckAward" size="md" />
                                </div>
                                <div className="text-sm font-medium text-gray-900">Qualidade Certificada</div>
                                <div className="text-xs text-gray-600">Exames completos</div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    )
}

// Função utilitária para className condicional
function cn(...classes: (string | boolean | undefined)[]): string {
    return classes.filter(Boolean).join(' ')
}