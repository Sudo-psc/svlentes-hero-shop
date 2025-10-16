'use client'

import { useState, useEffect, useMemo } from 'react'
import { Star, Users, TrendingUp, Award, MessageCircle, CheckCircle } from 'lucide-react'

export function MobileSocialProof() {
  const [activeTestimonial, setActiveTestimonial] = useState(0)
  const [visibleStats, setVisibleStats] = useState(false)

  // Auto-rotate testimonials
  useEffect(() => {
    const interval = setInterval(() => {
      setActiveTestimonial((prev) => (prev + 1) % testimonials.length)
    }, 5000)
    return () => clearInterval(interval)
  }, [])

  // Animate stats on mount
  useEffect(() => {
    const timer = setTimeout(() => setVisibleStats(true), 500)
    return () => clearTimeout(timer)
  }, [])

  // Memoize testimonials for performance
  const testimonials = useMemo(() => [
    {
      name: "Ana Clara S.",
      city: "Belo Horizonte",
      rating: 5,
      text: "Economizei R$ 1.200 no primeiro ano! O acompanhamento do Dr. Philipe fez toda a diferença.",
      avatar: "👩‍💼",
      condition: "Miopia moderada",
      savings: "R$ 1.200/ano"
    },
    {
      name: "Carlos Mendes",
      city: "Rio de Janeiro",
      rating: 5,
      text: "Recebo minhas lentes em casa todo mês. Prático e muito mais em conta que farmácia.",
      avatar: "👨‍💻",
      condition: "Astigmatismo",
      savings: "R$ 980/ano"
    },
    {
      name: "Mariana Costa",
      city: "São Paulo",
      rating: 5,
      text: "Consulta sempre inclusa no plano. Dr. Philipe é super atencioso e profissional.",
      avatar: "👩‍🎓",
      condition: "Presbiopia",
      savings: "R$ 1.450/ano"
    }
  ], [])

  const stats = useMemo(() => [
    {
      icon: <Users className="w-5 h-5" />,
      value: "5.847+",
      label: "Pacientes Atendidos",
      description: "Em todo Brasil",
      color: "text-blue-600",
      bgColor: "bg-blue-50"
    },
    {
      icon: <Star className="w-5 h-5" />,
      value: "98.7%",
      label: "Satisfação",
      description: "Clientes felizes",
      color: "text-green-600",
      bgColor: "bg-green-50"
    },
    {
      icon: <TrendingUp className="w-5 h-5" />,
      value: "67%",
      label: "Economia Média",
      description: "vs farmácia",
      color: "text-purple-600",
      bgColor: "bg-purple-50"
    },
    {
      icon: <Award className="w-5 h-5" />,
      value: "15+",
      label: "Anos Experiência",
      description: "Dr. Philipe",
      color: "text-cyan-600",
      bgColor: "bg-cyan-50"
    }
  ], [])

  return (
    <section className="bg-gradient-to-br from-gray-50 to-white py-12 sm:py-16 overflow-hidden">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute top-20 left-10 w-32 h-32 bg-primary-400 rounded-full filter blur-xl"></div>
        <div className="absolute bottom-20 right-10 w-40 h-40 bg-cyan-400 rounded-full filter blur-xl"></div>
      </div>

      <div className="container-custom relative">
        {/* Header */}
        <div className="text-center mb-8 sm:mb-12">
          <div className="inline-flex items-center space-x-2 bg-gradient-to-r from-green-100 to-emerald-100 rounded-full px-4 py-2 mb-4">
            <CheckCircle className="w-4 h-4 text-green-600" />
            <span className="text-sm font-semibold text-green-800">Comprovado por milhares de pacientes</span>
          </div>

          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 mb-4">
            Por que <span className="text-gradient">milhares de brasileiros</span> confiam na SV Lentes
          </h2>

          <p className="text-gray-600 max-w-2xl mx-auto text-sm sm:text-base">
            Descubra por que nossos pacientes recomendam nosso serviço com acompanhamento médico especializado
          </p>
        </div>

        {/* Mobile-First Stats Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-8 sm:mb-12">
          {stats.map((stat, index) => (
            <div
              key={index}
              className={`
                ${stat.bgColor} rounded-xl sm:rounded-2xl p-4 sm:p-6
                transform transition-all duration-700 ease-out
                ${visibleStats
                  ? 'translate-y-0 opacity-100 scale-100'
                  : 'translate-y-4 opacity-0 scale-95'
                }
                hover:scale-105 hover:shadow-lg cursor-pointer
              `}
              style={{ transitionDelay: `${index * 100}ms` }}
            >
              <div className={`${stat.color} mb-3 sm:mb-4 flex items-center justify-center w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-white/50`}>
                {stat.icon}
              </div>
              <div className={`font-bold text-lg sm:text-xl ${stat.color} mb-1`}>
                {stat.value}
              </div>
              <div className="text-xs sm:text-sm font-semibold text-gray-900 mb-1">
                {stat.label}
              </div>
              <div className="text-xs text-gray-600">
                {stat.description}
              </div>
            </div>
          ))}
        </div>

        {/* Mobile Testimonials Carousel */}
        <div className="lg:hidden">
          <div className="bg-white rounded-2xl shadow-xl p-6 mb-6 border border-gray-100">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-3">
                <div className="text-3xl">{testimonials[activeTestimonial].avatar}</div>
                <div>
                  <div className="font-bold text-gray-900">{testimonials[activeTestimonial].name}</div>
                  <div className="text-xs text-gray-500">{testimonials[activeTestimonial].city}</div>
                </div>
              </div>
              <div className="flex items-center space-x-1">
                {[...Array(testimonials[activeTestimonial].rating)].map((_, i) => (
                  <Star key={i} className="w-4 h-4 text-yellow-400 fill-current" />
                ))}
              </div>
            </div>

            <div className="mb-4">
              <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg p-2 inline-block mb-2">
                <span className="text-xs font-semibold text-green-700">
                  💰 Economia: {testimonials[activeTestimonial].savings}
                </span>
              </div>
              <p className="text-gray-700 text-sm leading-relaxed">
                "{testimonials[activeTestimonial].text}"
              </p>
            </div>

            <div className="bg-gray-50 rounded-lg px-3 py-2 text-center">
              <span className="text-xs text-gray-600">
                Condição: {testimonials[activeTestimonial].condition}
              </span>
            </div>
          </div>

          {/* Carousel Indicators */}
          <div className="flex justify-center space-x-2">
            {testimonials.map((_, index) => (
              <button
                key={index}
                onClick={() => setActiveTestimonial(index)}
                className={`h-2 rounded-full transition-all duration-300 ${
                  activeTestimonial === index
                    ? 'bg-primary-600 w-8'
                    : 'bg-gray-300 w-2 hover:bg-gray-400'
                }`}
                aria-label={`Ver depoimento ${index + 1}`}
              />
            ))}
          </div>
        </div>

        {/* Desktop Testimonials Grid */}
        <div className="hidden lg:grid grid-cols-3 gap-6">
          {testimonials.map((testimonial, index) => (
            <div
              key={index}
              className="bg-white rounded-2xl shadow-xl p-6 border border-gray-100 hover:shadow-2xl transition-all duration-300 hover:scale-105"
            >
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <div className="text-3xl">{testimonial.avatar}</div>
                  <div>
                    <div className="font-bold text-gray-900">{testimonial.name}</div>
                    <div className="text-xs text-gray-500">{testimonial.city}</div>
                  </div>
                </div>
                <div className="flex items-center space-x-1">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <Star key={i} className="w-4 h-4 text-yellow-400 fill-current" />
                  ))}
                </div>
              </div>

              <div className="mb-4">
                <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg p-2 inline-block mb-2">
                  <span className="text-xs font-semibold text-green-700">
                    💰 Economia: {testimonial.savings}
                  </span>
                </div>
                <p className="text-gray-700 text-sm leading-relaxed">
                  "{testimonial.text}"
                </p>
              </div>

              <div className="bg-gray-50 rounded-lg px-3 py-2 text-center">
                <span className="text-xs text-gray-600">
                  Condição: {testimonial.condition}
                </span>
              </div>
            </div>
          ))}
        </div>

        {/* Trust Badges */}
        <div className="mt-12 bg-gradient-to-r from-cyan-50 to-blue-50 rounded-2xl p-6 border border-cyan-200">
          <div className="text-center mb-6">
            <h3 className="text-lg font-bold text-gray-900 mb-2">
              🏥 Acompanhamento Médico Garantido
            </h3>
            <p className="text-sm text-gray-600">
              Dr. Philipe Saraiva Cruz (CRM-MG 69.870) - Especialista em lentes de contato
            </p>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl mb-2">🩺</div>
              <div className="font-semibold text-sm text-gray-900">Consultas Incluídas</div>
              <div className="text-xs text-gray-600">Avaliação completa</div>
            </div>
            <div className="text-center">
              <div className="text-2xl mb-2">🏆</div>
              <div className="font-semibold text-sm text-gray-900">Especialista</div>
              <div className="text-xs text-gray-600">15+ anos experiência</div>
            </div>
            <div className="text-center">
              <div className="text-2xl mb-2">📍</div>
              <div className="font-semibold text-sm text-gray-900">Atendimento</div>
              <div className="text-xs text-gray-600">Caratinga/MG</div>
            </div>
            <div className="text-center">
              <div className="text-2xl mb-2">💚</div>
              <div className="font-semibold text-sm text-gray-900">Seguro</div>
              <div className="text-xs text-gray-600">LGPD compliant</div>
            </div>
          </div>
        </div>

        {/* CTA Section */}
        <div className="mt-12 text-center">
          <div className="bg-gradient-to-r from-primary-600 to-cyan-600 rounded-2xl p-6 sm:p-8 text-white">
            <h3 className="text-xl sm:text-2xl font-bold mb-3">
              Junte-se a milhares de pacientes satisfeitos
            </h3>
            <p className="text-sm sm:text-base opacity-90 mb-6 max-w-2xl mx-auto">
              Comece hoje mesmo com avaliação médica gratuita e descubra quanto você pode economiar
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <a
                href="/calculadora"
                className="inline-flex items-center justify-center space-x-2 bg-white text-primary-600 rounded-xl px-6 py-3 font-bold hover:bg-gray-50 transition-colors min-h-[44px] touch-manipulation"
              >
                <span className="text-xl">💰</span>
                <span>Calcular Minha Economia</span>
              </a>
              <a
                href="https://wa.me/5533998601427"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center space-x-2 bg-green-500 hover:bg-green-600 text-white rounded-xl px-6 py-3 font-bold transition-colors min-h-[44px] touch-manipulation"
              >
                <MessageCircle className="w-5 h-5" />
                <span>Agendar Consulta</span>
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}