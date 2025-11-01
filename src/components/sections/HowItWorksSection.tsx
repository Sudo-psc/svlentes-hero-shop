'use client'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
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
                                className="relative bg-white rounded-2xl shadow-md border border-primary-100/50 p-6 hover:shadow-2xl hover:shadow-primary-500/10 hover:-translate-y-1 transition-all duration-500 ease-out group overflow-hidden"
                                style={{ animationDelay: `${index * 0.1}s` }}
                            >
                                {/* Material Design 3 Surface Tint */}
                                <div className="absolute inset-0 bg-gradient-to-br from-primary-50/50 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
                                
                                {/* Step Number - Material Design 3 Badge */}
                                <div className="absolute -top-3 -left-3 w-10 h-10 bg-gradient-to-br from-primary-500 to-primary-600 text-white rounded-full flex items-center justify-center font-bold text-base shadow-lg shadow-primary-500/30 group-hover:scale-110 group-hover:shadow-xl group-hover:shadow-primary-500/40 transition-all duration-300">
                                    {step.number}
                                </div>
                                
                                {/* Icon with Material Design 3 Container */}
                                <div className="relative w-14 h-14 bg-gradient-to-br from-primary-50 to-primary-100 rounded-2xl flex items-center justify-center mb-5 group-hover:from-primary-100 group-hover:to-primary-200 transition-all duration-300 shadow-sm">
                                    <span className="text-3xl transform group-hover:scale-110 transition-transform duration-300">{step.icon}</span>
                                </div>
                                
                                {/* Content */}
                                <h4 className="text-xl font-bold text-gray-900 mb-3 group-hover:text-primary-700 transition-colors duration-300">
                                    {step.title}
                                </h4>
                                <p className="text-gray-600 text-sm mb-5 leading-relaxed">
                                    {step.description}
                                </p>
                                
                                {/* Cost & Economy - Material Design 3 Chips */}
                                <div className="space-y-2.5">
                                    <div className="flex items-center justify-between text-sm bg-primary-50/50 rounded-lg px-3 py-2 border border-primary-100/50">
                                        <span className="text-gray-700 font-medium">Custo:</span>
                                        <span className="font-semibold text-primary-700">{step.cost}</span>
                                    </div>
                                    <div className="flex items-center justify-between text-sm bg-success-50/50 rounded-lg px-3 py-2 border border-success-100/50">
                                        <span className="text-gray-700 font-medium">Economia:</span>
                                        <span className="font-semibold text-success-700">{step.economy}</span>
                                    </div>
                                    <div className="flex items-center justify-between text-sm bg-gray-50 rounded-lg px-3 py-2 border border-gray-100">
                                        <span className="text-gray-600 font-medium">Tempo:</span>
                                        <span className="font-semibold text-gray-900">{step.duration}</span>
                                    </div>
                                </div>
                                
                                {/* Arrow for connection (except last) */}
                                {index < howItWorksSteps.monthly.length - 1 && (
                                    <div className="hidden lg:block absolute -right-3 top-1/2 transform -translate-y-1/2 text-primary-400 animate-pulse">
                                        <ArrowRight className="w-7 h-7 drop-shadow-md" />
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                    {/* Timeline Summary - Material Design 3 Card */}
                    <div className="bg-gradient-to-br from-primary-50 to-primary-100/50 border border-primary-200/50 rounded-2xl p-8 shadow-md hover:shadow-xl transition-all duration-500">
                        <h4 className="font-bold text-primary-900 mb-6 flex items-center text-lg">
                            <div className="w-10 h-10 bg-primary-600 rounded-full flex items-center justify-center mr-3 shadow-lg shadow-primary-600/30">
                                <Clock className="w-5 h-5 text-white" />
                            </div>
                            Cronograma do Processo
                        </h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <div className="space-y-3">
                                <h5 className="font-semibold text-primary-800 mb-4 text-base">Etapas do Processo:</h5>
                                <ul className="space-y-3">
                                    {processTimeline.steps.slice(0, 3).map((step, index) => (
                                        <li key={index} className="flex items-center space-x-3 text-sm text-primary-700 bg-white/60 rounded-lg px-3 py-2 hover:bg-white/80 transition-colors duration-200">
                                            <CheckCircle className="w-5 h-5 text-success-600 flex-shrink-0" />
                                            <span className="font-medium">{step}</span>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                            <div className="space-y-3">
                                <h5 className="font-semibold text-primary-800 mb-4 text-base">Prazos:</h5>
                                <div className="space-y-3">
                                    <div className="flex items-center space-x-3 text-sm text-primary-700 bg-white/60 rounded-lg px-3 py-2 hover:bg-white/80 transition-colors duration-200">
                                        <Calendar className="w-5 h-5 text-primary-600 flex-shrink-0" />
                                        <span className="font-medium">{processTimeline.totalTime}</span>
                                    </div>
                                    <div className="flex items-center space-x-3 text-sm text-primary-700 bg-white/60 rounded-lg px-3 py-2 hover:bg-white/80 transition-colors duration-200">
                                        <Truck className="w-5 h-5 text-primary-600 flex-shrink-0" />
                                        <span className="font-medium">{processTimeline.firstDelivery}</span>
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
                                className="relative bg-white rounded-2xl shadow-md border border-primary-100/50 p-6 hover:shadow-2xl hover:shadow-primary-500/10 hover:-translate-y-1 transition-all duration-500 ease-out group overflow-hidden"
                                style={{ animationDelay: `${index * 0.1}s` }}
                            >
                                {/* Material Design 3 Surface Tint with Gold Accent for Annual */}
                                <div className="absolute inset-0 bg-gradient-to-br from-warning-50/40 via-primary-50/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
                                
                                {/* Step Number - Premium Badge for Annual Plan */}
                                <div className="absolute -top-3 -left-3 w-10 h-10 bg-gradient-to-br from-warning-500 to-primary-600 text-white rounded-full flex items-center justify-center font-bold text-base shadow-lg shadow-warning-500/30 group-hover:scale-110 group-hover:shadow-xl group-hover:shadow-warning-500/40 transition-all duration-300">
                                    {step.number}
                                </div>
                                
                                {/* Icon with Material Design 3 Container - Premium Style */}
                                <div className="relative w-14 h-14 bg-gradient-to-br from-warning-50 to-primary-100 rounded-2xl flex items-center justify-center mb-5 group-hover:from-warning-100 group-hover:to-primary-200 transition-all duration-300 shadow-sm">
                                    <span className="text-3xl transform group-hover:scale-110 transition-transform duration-300">{step.icon}</span>
                                </div>
                                
                                {/* Content */}
                                <h4 className="text-xl font-bold text-gray-900 mb-3 group-hover:text-primary-700 transition-colors duration-300">
                                    {step.title}
                                </h4>
                                <p className="text-gray-600 text-sm mb-5 leading-relaxed">
                                    {step.description}
                                </p>
                                
                                {/* Cost & Economy - Material Design 3 Chips with Premium Styling */}
                                <div className="space-y-2.5">
                                    <div className="flex items-center justify-between text-sm bg-gradient-to-r from-warning-50/60 to-primary-50/60 rounded-lg px-3 py-2 border border-warning-100/50">
                                        <span className="text-gray-700 font-medium">Benefício:</span>
                                        <span className="font-semibold text-warning-700">{step.cost}</span>
                                    </div>
                                    <div className="flex items-center justify-between text-sm bg-success-50/50 rounded-lg px-3 py-2 border border-success-100/50">
                                        <span className="text-gray-700 font-medium">Economia:</span>
                                        <span className="font-semibold text-success-700">{step.economy}</span>
                                    </div>
                                    <div className="flex items-center justify-between text-sm bg-gray-50 rounded-lg px-3 py-2 border border-gray-100">
                                        <span className="text-gray-600 font-medium">Duração:</span>
                                        <span className="font-semibold text-gray-900">{step.duration}</span>
                                    </div>
                                </div>
                                
                                {/* Arrow for connection (except last) */}
                                {index < howItWorksSteps.annual.length - 1 && (
                                    <div className="hidden lg:block absolute -right-3 top-1/2 transform -translate-y-1/2 text-warning-400 animate-pulse">
                                        <ArrowRight className="w-7 h-7 drop-shadow-md" />
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                    {/* Annual Benefits - Material Design 3 Premium Card */}
                    <div className="bg-gradient-to-br from-warning-50 via-primary-50 to-success-50 border border-warning-200/50 rounded-2xl p-8 shadow-md hover:shadow-xl transition-all duration-500">
                        <h4 className="font-bold text-warning-900 mb-6 flex items-center text-lg">
                            <div className="w-10 h-10 bg-gradient-to-br from-warning-500 to-primary-600 rounded-full flex items-center justify-center mr-3 shadow-lg shadow-warning-500/30">
                                <Award className="w-5 h-5 text-white" />
                            </div>
                            Vantagens do Plano Anual
                        </h4>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <div className="text-center bg-white/80 rounded-xl p-6 shadow-sm hover:shadow-md hover:-translate-y-1 transition-all duration-300">
                                <div className="text-3xl font-bold text-warning-600 mb-2">2 meses</div>
                                <div className="text-sm font-semibold text-warning-700">Grátis</div>
                                <div className="text-xs text-gray-600 mt-1">Valor total de R$ 179,80</div>
                            </div>
                            <div className="text-center bg-white/80 rounded-xl p-6 shadow-sm hover:shadow-md hover:-translate-y-1 transition-all duration-300">
                                <div className="text-3xl font-bold text-success-600 mb-2">R$ 600</div>
                                <div className="text-sm font-semibold text-success-700">Economia extra</div>
                                <div className="text-xs text-gray-600 mt-1">Comparado ao mensal</div>
                            </div>
                            <div className="text-center bg-white/80 rounded-xl p-6 shadow-sm hover:shadow-md hover:-translate-y-1 transition-all duration-300">
                                <div className="text-3xl font-bold text-primary-600 mb-2">R$ 800</div>
                                <div className="text-sm font-semibold text-primary-700">Em serviços médicos</div>
                                <div className="text-xs text-gray-600 mt-1">Consultas incluídas</div>
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
                {/* Service Features - Material Design 3 Cards */}
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-16">
                    {serviceFeatures.map((feature, index) => (
                        <div
                            key={feature.id}
                            className={cn(
                                'text-center p-5 rounded-2xl transition-all duration-500 hover:shadow-xl hover:-translate-y-2 cursor-pointer group',
                                feature.highlight
                                    ? 'bg-gradient-to-br from-primary-50 to-primary-100 border border-primary-200/50 shadow-md shadow-primary-500/10'
                                    : 'bg-white border border-gray-200/50 shadow-sm hover:border-primary-200'
                            )}
                            style={{ animationDelay: `${index * 0.05}s` }}
                        >
                            <div className="text-3xl mb-3 transform group-hover:scale-110 transition-transform duration-300">{feature.icon}</div>
                            <h4 className={cn(
                                "font-semibold text-sm mb-1.5 transition-colors duration-300",
                                feature.highlight 
                                    ? "text-primary-900 group-hover:text-primary-700" 
                                    : "text-gray-900 group-hover:text-primary-700"
                            )}>
                                {feature.title}
                            </h4>
                            <p className="text-xs text-gray-600 leading-relaxed">
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
                {/* CTA Section - Material Design 3 Elevated Surface */}
                <div className="text-center">
                    <div className="relative bg-gradient-to-br from-white via-primary-50/30 to-white rounded-3xl shadow-2xl shadow-primary-500/10 border border-primary-100/50 p-10 lg:p-14 max-w-4xl mx-auto overflow-hidden group hover:shadow-3xl hover:shadow-primary-500/20 transition-all duration-700">
                        {/* Material Design 3 Decorative Background */}
                        <div className="absolute top-0 right-0 w-64 h-64 bg-primary-100/40 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 group-hover:scale-150 transition-transform duration-1000" />
                        <div className="absolute bottom-0 left-0 w-64 h-64 bg-success-100/30 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2 group-hover:scale-150 transition-transform duration-1000" />
                        
                        <div className="relative z-10">
                            <h3 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-5 leading-tight">
                                Pronto para começar sua jornada{' '}
                                <span className="text-gradient">SVlentes</span>?
                            </h3>
                            <p className="text-lg lg:text-xl text-gray-600 mb-10 leading-relaxed">
                                {activeTab === 'monthly'
                                    ? 'Comece com flexibilidade total e cancele quando quiser.'
                                    : 'Economize mais com o plano anual e ganhe 2 meses grátis!'
                                }
                            </p>
                            <div className="flex flex-col sm:flex-row gap-5 justify-center mb-10">
                                <Button
                                    onClick={handleStartProcess}
                                    size="lg"
                                    className="flex items-center space-x-2 shadow-lg shadow-primary-500/30 hover:shadow-xl hover:shadow-primary-500/40 hover:scale-105 transition-all duration-300 text-base px-8 py-6"
                                >
                                    <Phone className="w-5 h-5" />
                                    <span>Iniciar Processo</span>
                                </Button>
                                <Button
                                    onClick={handleLearnMore}
                                    variant="outline"
                                    size="lg"
                                    className="flex items-center space-x-2 hover:bg-primary-50 hover:border-primary-300 hover:scale-105 transition-all duration-300 text-base px-8 py-6 border-2"
                                >
                                    <MessageCircle className="w-5 h-5" />
                                    <span>Tirar Dúvidas</span>
                                </Button>
                            </div>
                            {/* Trust Elements - Material Design 3 Cards */}
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-5 pt-10 border-t border-primary-100">
                                <div className="text-center bg-white/80 backdrop-blur-sm rounded-xl p-4 hover:bg-white hover:shadow-md hover:-translate-y-1 transition-all duration-300">
                                    <div className="flex items-center justify-center mx-auto mb-3 w-14 h-14 bg-primary-100 rounded-full">
                                        <Icon name="shieldSecurity" size="md" />
                                    </div>
                                    <div className="text-sm font-semibold text-gray-900 mb-1">100% Seguro</div>
                                    <div className="text-xs text-gray-600">Processo protegido</div>
                                </div>
                                <div className="text-center bg-white/80 backdrop-blur-sm rounded-xl p-4 hover:bg-white hover:shadow-md hover:-translate-y-1 transition-all duration-300">
                                    <div className="flex items-center justify-center mx-auto mb-3">
                                        <div className="w-14 h-14 rounded-full overflow-hidden border-3 border-primary-200 shadow-md">
                                            <OptimizedImage
                                                src="/icones/drphilipe_perfil.jpeg"
                                                alt="Dr. Philipe Saraiva Cruz"
                                                width={56}
                                                height={56}
                                                quality={85}
                                                className="w-full h-full object-cover"
                                            />
                                        </div>
                                    </div>
                                    <div className="text-sm font-semibold text-gray-900 mb-1">Cuidado Médico</div>
                                    <div className="text-xs text-gray-600">Dr. Philipe CRM 69.870</div>
                                </div>
                                <div className="text-center bg-white/80 backdrop-blur-sm rounded-xl p-4 hover:bg-white hover:shadow-md hover:-translate-y-1 transition-all duration-300">
                                    <div className="flex items-center justify-center mx-auto mb-3 w-14 h-14 bg-primary-100 rounded-full">
                                        <Icon name="delivery" size="md" />
                                    </div>
                                    <div className="text-sm font-semibold text-gray-900 mb-1">Entrega Garantida</div>
                                    <div className="text-xs text-gray-600">Lentes em casa</div>
                                </div>
                                <div className="text-center bg-white/80 backdrop-blur-sm rounded-xl p-4 hover:bg-white hover:shadow-md hover:-translate-y-1 transition-all duration-300">
                                    <div className="flex items-center justify-center mx-auto mb-3 w-14 h-14 bg-primary-100 rounded-full">
                                        <Icon name="eyeCheckAward" size="md" />
                                    </div>
                                    <div className="text-sm font-semibold text-gray-900 mb-1">Qualidade Certificada</div>
                                    <div className="text-xs text-gray-600">Exames completos</div>
                                </div>
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