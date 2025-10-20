'use client'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
    Eye,
    Clock,
    Shield,
    Star,
    ChevronRight,
    CheckCircle,
    AlertCircle,
    Heart,
    Droplets
} from 'lucide-react'
interface LensType {
    id: string
    name: string
    description: string
    benefits: string[]
    bestFor: string
    replacementFrequency: string
    priceRange: string
}
interface CareTopic {
    id: string
    title: string
    icon: React.ReactNode
    content: string[]
    tips: string[]
}
const lensTypes: LensType[] = [
    {
        id: 'soft-daily',
        name: 'Lentes Gel Diárias',
        description: 'Descartáveis diárias, máxima praticidade e higiene',
        benefits: ['Sem necessidade de limpeza', 'Menor risco de infecções', 'Ideais para viagens', 'Perfeitas para esportes'],
        bestFor: 'Pessoas ocupadas, esportistas, viajantes',
        replacementFrequency: 'Diária',
        priceRange: 'R$ 120-180/mês'
    },
    {
        id: 'soft-monthly',
        name: 'Lentes Gel Mensais',
        description: 'Econômicas com troca mensal e cuidados básicos',
        benefits: ['Mais econômicas', 'Boa oxigenação', 'Várias opções de curvatura', 'Fácil adaptação'],
        bestFor: 'Uso contínuo, orçamento limitado',
        replacementFrequency: 'Mensal',
        priceRange: 'R$ 60-100/mês'
    },
    {
        id: 'toric',
        name: 'Lentes Tóricas',
        description: 'Especializadas para astigmatismo leve a moderado',
        benefits: ['Correção precisa do astigmatismo', 'Estabilidade visual', 'Conforto otimizado', 'Opções diárias e mensais'],
        bestFor: 'Pessoas com astigmatismo',
        replacementFrequency: 'Diária/Mensal',
        priceRange: 'R$ 150-250/mês'
    },
    {
        id: 'multifocal',
        name: 'Lentes Multifocais',
        description: 'Correção de perto, intermediário e longe simultaneamente',
        benefits: ['Visão completa em todas distâncias', 'Sem necessidade de óculos', 'Tecnologia avançada', 'Adaptação gradual'],
        bestFor: 'Presbiopia (40+ anos)',
        replacementFrequency: 'Mensal',
        priceRange: 'R$ 200-350/mês'
    }
]
const careTopics: CareTopic[] = [
    {
        id: 'hygiene',
        title: 'Higiene e Manuseio',
        icon: <Droplets className="w-5 h-5" />,
        content: [
            'Lave sempre as mãos antes de manusear',
            'Use solução própria para lentes de contato',
            'Nunca use água da torneira',
            'Limpe a caixinha com solução e substitua mensalmente'
        ],
        tips: [
            'Mantenha as unhas curtas para evitar danos',
            'Secue as mãos com toalha sem fiapos',
            'Evite cremes nas mãos antes do manuseio'
        ]
    },
    {
        id: 'usage-time',
        title: 'Tempo de Uso',
        icon: <Clock className="w-5 h-5" />,
        content: [
            'Respeite o tempo máximo recomendado (8-12 horas)',
            'Nunca durma com as lentes (exceto modelos específicos)',
            'Inicie com períodos curtos e aumente gradualmente',
            'Descanse os olhos se sentir desconforto'
        ],
        tips: [
            'Tenha um par de óculos de reserva',
            'Use lubrificantes se sentir olhos secos',
            'Evite ambientes muito secos ou fumacentos'
        ]
    },
    {
        id: 'health',
        title: 'Saúde Ocular',
        icon: <Heart className="w-5 h-5" />,
        content: [
            'Consulte seu oftalmologista regularmente',
            'Nunca compartilhe suas lentes',
            'Interrompa o uso se tiver vermelhidão ou dor',
            'Fique atento a qualquer mudança na visão'
        ],
        tips: [
            'Exames anuais são obrigatórios',
            'Informe sobre outras condições médicas',
            'Evite nadar com lentes sem proteção'
        ]
    }
]
export function LensEducationSection() {
    const [selectedLens, setSelectedLens] = useState<string>('soft-daily')
    const [expandedTopic, setExpandedTopic] = useState<string | null>(null)
    const selectedLensData = lensTypes.find(lens => lens.id === selectedLens)
    return (
        <section className="py-16 lg:py-24 bg-gradient-to-b from-white to-gray-50">
            <div className="container-custom">
                {/* Header */}
                <div className="text-center mb-16">
                    <div className="flex items-center justify-center mb-4">
                        <Eye className="w-8 h-8 text-primary-600 mr-3" />
                        <h2 className="text-3xl lg:text-4xl font-bold text-gray-900">
                            Guia Completo de Lentes de Contato
                        </h2>
                    </div>
                    <p className="text-xl text-gray-600 max-w-3xl mx-auto">
                        Entenda os diferentes tipos de lentes, cuidados essenciais e encontre o modelo
                        ideal para seu estilo de vida com acompanhamento do Dr. Philipe Saraiva Cruz.
                    </p>
                </div>
                {/* Tipos de Lentes */}
                <div className="mb-16">
                    <h3 className="text-2xl font-bold text-gray-900 mb-8 text-center">
                        Tipos de Lentes de Contato
                    </h3>
                    {/* Lens Type Selector */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                        {lensTypes.map((lens) => (
                            <button
                                key={lens.id}
                                onClick={() => setSelectedLens(lens.id)}
                                className={`p-4 rounded-lg border-2 transition-all duration-200 text-left ${selectedLens === lens.id
                                    ? 'border-primary-600 bg-primary-50 shadow-lg'
                                    : 'border-gray-200 hover:border-gray-300 bg-white'
                                    }`}
                            >
                                <h4 className="font-semibold text-gray-900 mb-2">{lens.name}</h4>
                                <p className="text-sm text-gray-600 mb-3">{lens.description}</p>
                                <div className="flex items-center justify-between">
                                    <Badge variant="default" className="text-xs">
                                        {lens.replacementFrequency}
                                    </Badge>
                                    <ChevronRight className={`w-4 h-4 transition-transform ${selectedLens === lens.id ? 'rotate-90' : ''
                                        }`} />
                                </div>
                            </button>
                        ))}
                    </div>
                    {/* Selected Lens Details */}
                    {selectedLensData && (
                        <div className="bg-white rounded-2xl p-8 shadow-lg border border-gray-200">
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                                <div>
                                    <h4 className="text-2xl font-bold text-gray-900 mb-4">
                                        {selectedLensData.name}
                                    </h4>
                                    <p className="text-gray-600 mb-6">{selectedLensData.description}</p>
                                    <div className="mb-6">
                                        <h5 className="font-semibold text-gray-900 mb-3">Benefícios Principais:</h5>
                                        <ul className="space-y-2">
                                            {selectedLensData.benefits.map((benefit, index) => (
                                                <li key={index} className="flex items-start">
                                                    <CheckCircle className="w-5 h-5 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                                                    <span className="text-gray-700">{benefit}</span>
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                    <div className="bg-primary-50 rounded-lg p-4">
                                        <div className="flex items-center mb-2">
                                            <Star className="w-5 h-5 text-primary-600 mr-2" />
                                            <span className="font-semibold text-primary-900">Ideal para:</span>
                                        </div>
                                        <p className="text-primary-700">{selectedLensData.bestFor}</p>
                                    </div>
                                </div>
                                <div>
                                    <div className="bg-gray-50 rounded-lg p-6 mb-6">
                                        <div className="flex items-center justify-between mb-4">
                                            <span className="text-gray-600">Frequência de Troca:</span>
                                            <Badge variant="secondary">{selectedLensData.replacementFrequency}</Badge>
                                        </div>
                                        <div className="flex items-center justify-between">
                                            <span className="text-gray-600">Faixa de Preço:</span>
                                            <span className="font-semibold text-primary-600">{selectedLensData.priceRange}</span>
                                        </div>
                                    </div>
                                    <div className="text-center">
                                        <p className="text-sm text-gray-600 mb-4">
                                            Precisa de ajuda para escolher? Fale com nosso especialista.
                                        </p>
                                        <Button className="w-full">
                                            Agendar Avaliação Gratuita
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
                {/* Cuidados Essenciais */}
                <div className="mb-16">
                    <h3 className="text-2xl font-bold text-gray-900 mb-8 text-center">
                        Cuidados Essenciais com Lentes
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {careTopics.map((topic) => (
                            <div
                                key={topic.id}
                                className="bg-white rounded-xl border border-gray-200 overflow-hidden hover:shadow-lg transition-shadow duration-200"
                            >
                                <div className="p-6">
                                    <div className="flex items-center mb-4">
                                        <div className="w-12 h-12 bg-primary-100 rounded-full flex items-center justify-center text-primary-600 mr-4">
                                            {topic.icon}
                                        </div>
                                        <h4 className="text-lg font-semibold text-gray-900">{topic.title}</h4>
                                    </div>
                                    <div className="space-y-3 mb-4">
                                        {topic.content.slice(0, 2).map((item, index) => (
                                            <div key={index} className="flex items-start">
                                                <CheckCircle className="w-4 h-4 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                                                <span className="text-sm text-gray-700">{item}</span>
                                            </div>
                                        ))}
                                    </div>
                                    <button
                                        onClick={() => setExpandedTopic(expandedTopic === topic.id ? null : topic.id)}
                                        className="text-primary-600 hover:text-primary-700 text-sm font-medium flex items-center"
                                    >
                                        {expandedTopic === topic.id ? 'Ver menos' : 'Ver mais dicas'}
                                        <ChevronRight className={`w-4 h-4 ml-1 transition-transform ${expandedTopic === topic.id ? 'rotate-90' : ''
                                            }`} />
                                    </button>
                                </div>
                                {expandedTopic === topic.id && (
                                    <div className="px-6 pb-6 bg-gray-50 border-t border-gray-200">
                                        <h5 className="font-semibold text-gray-900 mb-3">Dicas Adicionais:</h5>
                                        <ul className="space-y-2">
                                            {topic.tips.map((tip, index) => (
                                                <li key={index} className="flex items-start">
                                                    <AlertCircle className="w-4 h-4 text-primary-500 mr-2 mt-0.5 flex-shrink-0" />
                                                    <span className="text-sm text-gray-700">{tip}</span>
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
                {/* Internal Links */}
                <div className="text-center">
                    <div className="bg-gradient-to-r from-primary-50 to-secondary-50 rounded-2xl p-8 border border-primary-200">
                        <h4 className="text-xl font-bold text-gray-900 mb-4">
                            Quer saber mais sobre como funciona nosso serviço?
                        </h4>
                        <p className="text-gray-600 mb-6">
                            Entenda todo o processo de assinatura, desde a avaliação até a entrega mensal.
                        </p>
                        <div className="flex flex-col sm:flex-row gap-4 justify-center">
                            <a href="#como-funciona">
                                <Button className="w-full sm:w-auto flex items-center justify-center space-x-2">
                                    <span>Como Funciona</span>
                                    <ChevronRight className="w-4 h-4" />
                                </Button>
                            </a>
                            <a href="#perguntas-frequentes">
                                <Button 
                                    variant="outline" 
                                    className="w-full sm:w-auto flex items-center justify-center space-x-2"
                                >
                                    <span>Dúvidas Frequentes</span>
                                    <ChevronRight className="w-4 h-4" />
                                </Button>
                            </a>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    )
}