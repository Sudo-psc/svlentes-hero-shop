'use client'
import { Star, Users, Shield, Award, TrendingUp, CheckCircle } from 'lucide-react'
import { socialProofStats } from '@/data/trust-indicators'

interface TestimonialProps {
  name: string
  role: string
  comment: string
  rating: number
  image?: string
}

function Testimonial({ name, role, comment, rating }: TestimonialProps) {
  return (
    <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
      <div className="flex items-center gap-1 mb-2">
        {[...Array(5)].map((_, i) => (
          <Star
            key={i}
            className={`w-4 h-4 ${
              i < rating ? 'fill-amber-400 text-amber-400' : 'text-gray-300'
            }`}
          />
        ))}
      </div>
      <p className="text-sm text-gray-700 mb-3 line-clamp-3">{comment}</p>
      <div className="flex items-center gap-2">
        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-cyan-500 to-blue-500 flex items-center justify-center text-white font-semibold text-xs">
          {name.charAt(0)}
        </div>
        <div>
          <p className="text-sm font-semibold text-gray-900">{name}</p>
          <p className="text-xs text-gray-500">{role}</p>
        </div>
      </div>
    </div>
  )
}

interface SocialProofCardProps {
  icon: React.ReactNode
  value: string
  label: string
  color: string
}

function SocialProofCard({ icon, value, label, color }: SocialProofCardProps) {
  return (
    <div className="text-center p-4 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors">
      <div className={`flex justify-center mb-2 ${color}`}>{icon}</div>
      <p className="text-2xl md:text-3xl font-bold text-gray-900 mb-1">{value}</p>
      <p className="text-xs md:text-sm text-gray-600">{label}</p>
    </div>
  )
}

interface PartnerLogoProps {
  name: string
  description: string
}

function PartnerLogo({ name, description }: PartnerLogoProps) {
  return (
    <div className="flex flex-col items-center justify-center p-3 bg-white rounded-lg border border-gray-200 hover:shadow-sm transition-shadow group">
      <div className="w-16 h-16 mb-2 rounded-lg bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center">
        <span className="text-2xl font-bold text-gray-400 group-hover:text-gray-600 transition-colors">
          {name.substring(0, 2)}
        </span>
      </div>
      <p className="text-xs font-semibold text-gray-700 text-center">{name}</p>
      <p className="text-xs text-gray-500 text-center mt-1">{description}</p>
    </div>
  )
}

interface SecurityBadgeProps {
  icon: React.ReactNode
  title: string
  description: string
  verified?: boolean
}

function SecurityBadge({ icon, title, description, verified = true }: SecurityBadgeProps) {
  return (
    <div className="flex items-start gap-3 p-3 bg-white rounded-lg border border-gray-200">
      <div className="flex-shrink-0 text-cyan-500">{icon}</div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <p className="text-sm font-semibold text-gray-900">{title}</p>
          {verified && (
            <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />
          )}
        </div>
        <p className="text-xs text-gray-600">{description}</p>
      </div>
    </div>
  )
}

interface EnhancedTrustSectionProps {
  variant?: 'full' | 'compact'
  className?: string
}

export function EnhancedTrustSection({
  variant = 'full',
  className = ''
}: EnhancedTrustSectionProps) {
  const testimonials = [
    {
      name: 'Maria Silva',
      role: 'Assinante há 2 anos',
      comment: 'Nunca mais precisei me preocupar em comprar lentes. O atendimento é excelente e as lentes chegam sempre no prazo!',
      rating: 5
    },
    {
      name: 'João Santos',
      role: 'Assinante há 1 ano',
      comment: 'Economia real e muita praticidade. O Dr. Philipe é muito atencioso e profissional.',
      rating: 5
    },
    {
      name: 'Ana Costa',
      role: 'Assinante há 6 meses',
      comment: 'Melhor decisão que tomei! Qualidade impecável e preço justo. Recomendo muito!',
      rating: 5
    }
  ]

  const partners = [
    { name: 'Acuvue', description: 'Lentes Premium' },
    { name: 'Bausch+Lomb', description: 'Tecnologia Avançada' },
    { name: 'CooperVision', description: 'Conforto Superior' },
    { name: 'Alcon', description: 'Inovação Global' }
  ]

  const securityBadges = [
    {
      icon: <Shield className="w-5 h-5" />,
      title: 'Site Seguro SSL',
      description: 'Conexão criptografada e 100% segura'
    },
    {
      icon: <Award className="w-5 h-5" />,
      title: 'Conformidade LGPD',
      description: 'Seus dados protegidos por lei'
    },
    {
      icon: <CheckCircle className="w-5 h-5" />,
      title: 'Produtos ANVISA',
      description: 'Produtos aprovados e certificados'
    }
  ]

  if (variant === 'compact') {
    return (
      <div className={`space-y-6 ${className}`}>
        {/* Social Proof Stats */}
        <div className="grid grid-cols-3 gap-3">
          {socialProofStats.map((stat) => (
            <SocialProofCard
              key={stat.id}
              icon={<span className="text-2xl">{stat.icon}</span>}
              value={stat.value}
              label={stat.label}
              color={stat.color}
            />
          ))}
        </div>

        {/* Security Badges */}
        <div className="grid grid-cols-1 gap-2">
          {securityBadges.map((badge, index) => (
            <SecurityBadge key={index} {...badge} />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className={`space-y-8 ${className}`}>
      {/* Social Proof Stats */}
      <div>
        <div className="flex items-center gap-2 mb-4">
          <TrendingUp className="w-5 h-5 text-cyan-500" />
          <h3 className="text-lg font-semibold text-gray-900">
            Números que Provam Nossa Qualidade
          </h3>
        </div>
        <div className="grid grid-cols-3 gap-4">
          {socialProofStats.map((stat) => (
            <SocialProofCard
              key={stat.id}
              icon={<span className="text-3xl">{stat.icon}</span>}
              value={stat.value}
              label={stat.label}
              color={stat.color}
            />
          ))}
        </div>
      </div>

      {/* Customer Testimonials */}
      <div>
        <div className="flex items-center gap-2 mb-4">
          <Users className="w-5 h-5 text-cyan-500" />
          <h3 className="text-lg font-semibold text-gray-900">
            O Que Nossos Clientes Dizem
          </h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {testimonials.map((testimonial, index) => (
            <Testimonial key={index} {...testimonial} />
          ))}
        </div>
      </div>

      {/* Partner Logos */}
      <div>
        <div className="flex items-center gap-2 mb-4">
          <Award className="w-5 h-5 text-cyan-500" />
          <h3 className="text-lg font-semibold text-gray-900">
            Marcas Parceiras
          </h3>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {partners.map((partner, index) => (
            <PartnerLogo key={index} {...partner} />
          ))}
        </div>
      </div>

      {/* Security Badges */}
      <div>
        <div className="flex items-center gap-2 mb-4">
          <Shield className="w-5 h-5 text-cyan-500" />
          <h3 className="text-lg font-semibold text-gray-900">
            Segurança e Certificações
          </h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {securityBadges.map((badge, index) => (
            <SecurityBadge key={index} {...badge} />
          ))}
        </div>
      </div>
    </div>
  )
}
