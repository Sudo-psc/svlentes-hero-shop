'use client'

import { CheckCircle, Users, Truck, Shield, Heart, Award } from 'lucide-react'

export function BenefitsSection() {
  const benefits = [
    {
      icon: <CheckCircle className="w-6 h-6 text-primary-600" />,
      title: 'Adaptação com Dr. Philipe Saraiva',
      description: 'Acompanhamento pessoal com Dr. Philipe Saraiva Cruz (CRM-MG 69.870)',
      features: ['Consulta inicial completa', 'Avaliação personalizada', 'Ajuste fino das lentes']
    },
    {
      icon: <Users className="w-6 h-6 text-primary-600" />,
      title: 'Exames Especializados Inclusos',
      description: 'Tecnologia de ponta para avaliação ocular completa',
      features: ['Mapeamento de córnea', 'Análise de lágrima', 'Avaliação de saúde ocular']
    },
    {
      icon: <Shield className="w-6 h-6 text-primary-600" />,
      title: 'Suporte Local em Caratinga',
      description: 'Atendimento presencial com agilidade e confiança',
      features: ['Consultas presenciais', 'Retirada de produtos', 'Suporte emergencial']
    },
    {
      icon: <Truck className="w-6 h-6 text-primary-600" />,
      title: 'Entregas Automáticas',
      description: 'Receba suas lentes em casa sem preocupação',
      features: ['Entrega programada', 'Lembretes automáticos', 'Flexibilidade de prazo']
    },
    {
      icon: <Heart className="w-6 h-6 text-primary-600" />,
      title: 'Acompanhamento Contínuo',
      description: 'Cuidado com sua saúde ocular durante todo o ano',
      features: ['Consultas de retorno', 'Avaliação periódica', 'Ajustes gratuitos']
    },
    {
      icon: <Award className="w-6 h-6 text-primary-600" />,
      title: 'Qualidade Garantida',
      description: 'Produtos originais com garantia do fabricante',
      features: ['Lentes originais', 'Certificado de autenticidade', 'Garantia de satisfação']
    }
  ]

  const differentiators = [
    {
      label: 'Economia Comprovada',
      value: 'Até 40%',
      description: 'Mais barato que comprar avulso'
    },
    {
      label: 'Exames Inclusos',
      value: 'Anuais',
      description: 'Acompanhamento completo'
    },
    {
      label: 'Frete Grátis',
      value: 'Todo Brasil',
      description: 'Em planos trimestrais e anuais'
    },
    {
      label: 'Cancelamento',
      value: 'Flexível',
      description: 'Sem multa no plano mensal'
    }
  ]

  return (
    <div className="bg-gradient-to-br from-gray-50 to-primary-50 rounded-2xl p-8 md:p-12">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            Por que escolher Saraiva Vision?
          </h2>
          <p className="text-lg text-gray-600 max-w-3xl mx-auto">
            Cuidado completo para sua visão com economia, conveniência e atendimento médico especializado
          </p>
        </div>

        {/* Main Benefits Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 mb-12">
          {benefits.map((benefit, index) => (
            <div
              key={index}
              className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow"
            >
              <div className="flex items-start space-x-4">
                <div className="flex-shrink-0 p-2 bg-primary-50 rounded-lg">
                  {benefit.icon}
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    {benefit.title}
                  </h3>
                  <p className="text-sm text-gray-600 mb-4">
                    {benefit.description}
                  </p>
                  <ul className="space-y-2">
                    {benefit.features.map((feature, featureIndex) => (
                      <li key={featureIndex} className="flex items-center space-x-2 text-sm text-gray-700">
                        <div className="w-1.5 h-1.5 bg-primary-400 rounded-full flex-shrink-0"></div>
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Differentiators */}
        <div className="bg-white rounded-xl p-8 border border-gray-200">
          <h3 className="text-2xl font-bold text-gray-900 text-center mb-8">
            Diferenciais Saraiva Vision
          </h3>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {differentiators.map((item, index) => (
              <div key={index} className="text-center">
                <div className="text-3xl font-bold text-primary-600 mb-2">
                  {item.value}
                </div>
                <div className="text-lg font-semibold text-gray-900 mb-1">
                  {item.label}
                </div>
                <div className="text-sm text-gray-600">
                  {item.description}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Trust Section */}
        <div className="mt-12 text-center">
          <div className="inline-flex items-center space-x-3 bg-primary-600 text-white px-6 py-3 rounded-full">
            <Shield className="w-5 h-5" />
            <span className="font-semibold">
              Dr. Philipe Saraiva Cruz - CRM-MG 69.870
            </span>
          </div>
          <p className="text-sm text-gray-600 mt-3 max-w-2xl mx-auto">
            Médico oftalmologista com especialização em lentes de contato,
            dedicado a proporcionar o melhor cuidado visual para você.
          </p>
        </div>

        {/* Emergency Contact */}
        <div className="mt-8 bg-amber-50 border border-amber-200 rounded-xl p-6">
          <div className="flex items-center justify-center space-x-4">
            <div className="text-amber-600">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 15.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
            <div className="text-left">
              <div className="text-sm font-semibold text-amber-900">
                Contato de Emergência
              </div>
              <div className="text-sm text-amber-700">
                WhatsApp: +55 33 99860-1427 | Em caso de urgência ocular
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}