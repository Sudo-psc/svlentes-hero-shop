import { Badge } from '@/components/ui/badge'
import { trustBadges } from '@/data/trust-indicators'
import { Shield, CheckCircle } from 'lucide-react'

interface TrustBadgesProps {
    variant?: 'horizontal' | 'vertical' | 'grid'
    showIcons?: boolean
    className?: string
}

export function TrustBadges({
    variant = 'horizontal',
    showIcons = true,
    className = ''
}: TrustBadgesProps) {
    const layoutClasses = {
        horizontal: 'flex flex-wrap items-center gap-3',
        vertical: 'flex flex-col space-y-3',
        grid: 'grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3'
    }

    return (
        <div className={`${layoutClasses[variant]} ${className}`}>
            {trustBadges.map((badge) => (
                <div
                    key={badge.id}
                    className="flex items-center space-x-2 group"
                >
                    {showIcons && (
                        <div className="flex items-center space-x-1">
                            <span className="text-lg">{badge.icon}</span>
                            {badge.verified && (
                                <CheckCircle className="w-3 h-3 text-green-500" />
                            )}
                        </div>
                    )}

                    <Badge
                        variant="default"
                        className={`${badge.color} transition-all duration-200 group-hover:scale-105 text-xs`}
                    >
                        {badge.name}
                    </Badge>
                </div>
            ))}
        </div>
    )
}

// Componente simplificado para selo Pioneiro (outros badges no Footer)
export function InlineTrustIndicators({ className = '' }: { className?: string }) {
    return (
        <div className={`flex items-center justify-center space-x-2 ${className}`}>
            <Shield className="w-4 h-4 text-primary-600" />
            <span className="text-sm font-medium text-primary-700">
                Pioneiro no Brasil em Assinatura de Lentes
            </span>
        </div>
    )
}