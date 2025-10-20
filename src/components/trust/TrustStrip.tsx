'use client'
import { Shield, Award, Clock, Truck, CheckCircle } from 'lucide-react'
import { doctorInfo } from '@/data/doctor-info'
interface TrustBadgeProps {
  icon: React.ReactNode
  text: string
  className?: string
}
function TrustBadge({ icon, text, className = '' }: TrustBadgeProps) {
  return (
    <div className={`flex items-center gap-1.5 ${className}`}>
      <div className="flex-shrink-0 text-primary-600" aria-hidden="true">
        {icon}
      </div>
      <span className="text-xs md:text-sm font-medium whitespace-nowrap">
        {text}
      </span>
    </div>
  )
}
interface TrustStripProps {
  variant?: 'compact' | 'full'
  className?: string
}
export function TrustStrip({ variant = 'full', className = '' }: TrustStripProps) {
  const badges = [
    {
      icon: <Shield className="w-4 h-4" />,
      text: doctorInfo.crm,
      key: 'crm',
    },
    {
      icon: <CheckCircle className="w-4 h-4" />,
      text: 'ANVISA',
      key: 'anvisa',
    },
    {
      icon: <Award className="w-4 h-4" />,
      text: 'Pioneiro no Brasil',
      key: 'pioneer',
    },
    {
      icon: <Clock className="w-4 h-4" />,
      text: 'Atendimento Rápido',
      key: 'fast-service',
    },
    {
      icon: <Truck className="w-4 h-4" />,
      text: 'Entrega Grátis',
      key: 'shipping',
    },
  ]
  // Compact variant shows only first 3 badges
  const displayBadges = variant === 'compact' ? badges.slice(0, 3) : badges
  return (
    <div
      className={`flex items-center justify-center flex-wrap gap-4 md:gap-6 ${className}`}
      role="list"
      aria-label="Indicadores de confiança"
    >
      {displayBadges.map((badge) => (
        <TrustBadge
          key={badge.key}
          icon={badge.icon}
          text={badge.text}
          className="text-gray-700"
        />
      ))}
    </div>
  )
}