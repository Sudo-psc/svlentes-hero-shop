'use client'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { customerProblems, svlentesSolutions, impactStats } from '@/data/problems-solutions'
import { openWhatsAppWithContext } from '@/lib/whatsapp'
import {
    ArrowRight,
    MessageCircle,
    CheckCircle,
    AlertTriangle,
    Lightbulb,
    Target,
    TrendingUp
} from 'lucide-react'
interface ProblemSolutionSectionProps {
    className?: string
}
export function ProblemSolutionSection({ className = '' }: ProblemSolutionSectionProps) {
    const handleSpecialistContact = () => {
        openWhatsAppWithContext('support', {
            page: 'landing-page',
            section: 'problem-solution-cta'
        })
    }
    return (
        <section className={`py-16 lg:py-24 bg-white ${className}`}>
            <div className="container-custom">
                {/* Header */}
                <div className="text-center mb-16">
                    <Badge
                        variant="destructive"
                        className="mb-6 px-4 py-2 text-base"
                    >
                        <AlertTriangle className="w-4 h-4 mr-2" />
                        Problemas Comuns
                    </Badge>
                    <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-gray-900 mb-6">
                        Cansado dos{' '}
                        <span className="text-red-600">Problemas</span>{' '}
                        com lentes?
                    </h2>
                    <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
                        Sabemos exatamente pelo que você passa. Por isso criamos a SV Lentes -
                        para resolver de uma vez por todas esses problemas do dia a dia.
                    </p>
                </div>
                {/* Problems vs Solutions */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 mb-16">
                    {/* Problems Column */}
                    <div className="space-y-8">
                        <div className="text-center lg:text-left">
                            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto lg:mx-0 mb-4">
                                <AlertTriangle className="w-8 h-8 text-red-600" />
                            </div>
                            <h3 className="text-2xl font-bold text-gray-900 mb-4">
                                😤 Problemas que você enfrenta
                            </h3>
                            <p className="text-gray-600 mb-8">
                                Reconhece alguma dessas situações? Você não está sozinho!
                            </p>
                        </div>
                        <div className="space-y-4">
                            {customerProblems.map((problem, index) => (
                                <div
                                    key={problem.id}
                                    className="flex items-start space-x-4 p-4 bg-red-50 border border-red-200 rounded-lg hover:bg-red-100 transition-colors"
                                    style={{ animationDelay: `${index * 0.1}s` }}
                                >
                                    <div className="text-2xl flex-shrink-0 mt-1">
                                        {problem.icon}
                                    </div>
                                    <div className="flex-1">
                                        <p className="text-gray-800 font-medium">
                                            {problem.text}
                                        </p>
                                    </div>
                                </div>
                            ))}
                        </div>
                        {/* Problem Stats */}
                        <div className="bg-red-50 border border-red-200 rounded-lg p-6">
                            <h4 className="font-semibold text-red-800 mb-4 flex items-center">
                                <TrendingUp className="w-5 h-5 mr-2" />
                                Impacto dos Problemas
                            </h4>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="text-center">
                                    <div className="text-2xl font-bold text-red-600">12h</div>
                                    <div className="text-sm text-red-700">Perdidas por ano</div>
                                </div>
                                <div className="text-center">
                                    <div className="text-2xl font-bold text-red-600">R$ 800</div>
                                    <div className="text-sm text-red-700">Gasto extra anual</div>
                                </div>
                            </div>
                        </div>
                    </div>
                    {/* Solutions Column */}
                    <div className="space-y-8">
                        <div className="text-center lg:text-left">
                            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto lg:mx-0 mb-4">
                                <Lightbulb className="w-8 h-8 text-green-600" />
                            </div>
                            <h3 className="text-2xl font-bold text-gray-900 mb-4">
                                ✨ Soluções da SV Lentes
                            </h3>
                            <p className="text-gray-600 mb-8">
                                Cada problema tem uma solução inteligente e definitiva!
                            </p>
                        </div>
                        <div className="space-y-4">
                            {svlentesSolutions.map((solution, index) => (
                                <div
                                    key={solution.id}
                                    className="flex items-start space-x-4 p-4 bg-green-50 border border-green-200 rounded-lg hover:bg-green-100 transition-colors group"
                                    style={{ animationDelay: `${index * 0.1 + 0.3}s` }}
                                >
                                    <div className="text-2xl flex-shrink-0 mt-1">
                                        {solution.icon}
                                    </div>
                                    <div className="flex-1">
                                        <h4 className="font-semibold text-gray-900 mb-1 group-hover:text-green-700 transition-colors">
                                            {solution.title}
                                        </h4>
                                        <p className="text-gray-700 text-sm">
                                            {solution.description}
                                        </p>
                                    </div>
                                    <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0 mt-1" />
                                </div>
                            ))}
                        </div>
                        {/* Solution Stats */}
                        <div className="bg-green-50 border border-green-200 rounded-lg p-6">
                            <h4 className="font-semibold text-green-800 mb-4 flex items-center">
                                <Target className="w-5 h-5 mr-2" />
                                Resultados com SV Lentes
                            </h4>
                            <div className="grid grid-cols-2 gap-4">
                                {impactStats.slice(0, 2).map((stat, index) => (
                                    <div key={stat.id} className="text-center">
                                        <div className="text-2xl font-bold text-green-600">{stat.value}</div>
                                        <div className="text-sm text-green-700">{stat.label}</div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
                {/* Transformation Arrow */}
                <div className="flex justify-center mb-16">
                    <div className="bg-primary-100 rounded-full p-4">
                        <ArrowRight className="w-8 h-8 text-primary-600" />
                    </div>
                </div>
                {/* Impact Results */}
                <div className="bg-gradient-to-r from-primary-50 to-secondary-50 rounded-2xl p-8 lg:p-12 mb-16">
                    <div className="text-center mb-8">
                        <h3 className="text-2xl lg:text-3xl font-bold text-gray-900 mb-4">
                            A Transformação que a SV Lentes Proporciona
                        </h3>
                        <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                            Veja o impacto real na vida dos nossos clientes
                        </p>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                        {impactStats.map((stat, index) => (
                            <div
                                key={stat.id}
                                className="text-center p-6 bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow"
                            >
                                <div className="text-3xl font-bold text-primary-600 mb-2">
                                    {stat.value}
                                </div>
                                <div className="text-sm font-medium text-gray-900 mb-1">
                                    {stat.label}
                                </div>
                                <div className="text-xs text-gray-600">
                                    {stat.description}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
                {/* CTA Section */}
                <div className="text-center">
                    <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-8 lg:p-12 max-w-3xl mx-auto">
                        <h3 className="text-2xl lg:text-3xl font-bold text-gray-900 mb-4">
                            Pronto para resolver esses problemas?
                        </h3>
                        <p className="text-lg text-gray-600 mb-8">
                            Fale com um especialista e descubra como a SV Lentes pode transformar
                            sua experiência com lentes de contato.
                        </p>
                        <div className="flex flex-col sm:flex-row gap-4 justify-center">
                            <Button
                                onClick={handleSpecialistContact}
                                size="lg"
                                className="flex items-center space-x-2"
                            >
                                <MessageCircle className="w-5 h-5" />
                                <span>Falar com Especialista</span>
                            </Button>
                            <Button
                                onClick={() => document.getElementById('calculadora-economia')?.scrollIntoView({ behavior: 'smooth' })}
                                variant="outline"
                                size="lg"
                                className="flex items-center space-x-2"
                            >
                                <Target className="w-5 h-5" />
                                <span>Calcular Economia</span>
                            </Button>
                        </div>
                        {/* Trust Indicators */}
                        <div className="mt-8 pt-8 border-t border-gray-200">
                            <div className="flex items-center justify-center space-x-6 text-sm text-gray-600">
                                <div className="flex items-center space-x-2">
                                    <CheckCircle className="w-4 h-4 text-green-500" />
                                    <span>Sem compromisso</span>
                                </div>
                                <div className="flex items-center space-x-2">
                                    <CheckCircle className="w-4 h-4 text-green-500" />
                                    <span>Atendimento especializado</span>
                                </div>
                                <div className="flex items-center space-x-2">
                                    <CheckCircle className="w-4 h-4 text-green-500" />
                                    <span>Resposta rápida</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    )
}