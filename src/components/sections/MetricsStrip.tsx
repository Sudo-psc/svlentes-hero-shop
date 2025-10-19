'use client'

import { InlineTrustIndicators } from '@/components/trust/TrustBadges'
import { socialProofStats } from '@/data/trust-indicators'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

interface MetricsStripProps {
    className?: string
}

export function MetricsStrip({ className = '' }: MetricsStripProps) {
    return (
        <section className={`bg-gradient-to-r from-primary-50 via-white to-secondary-50 py-16 sm:py-20 ${className}`}>
            <div className="container-custom">
                <Card className="backdrop-blur-sm p-10 sm:p-12 border-2 border-primary-200/50 shadow-2xl hover:shadow-3xl transition-all duration-300">
                    <div className="text-center mb-10">
                        <Badge variant="secondary" className="mb-4 bg-primary-100 text-primary-700 hover:bg-primary-200 px-4 py-2">
                            📊 Números que Impressionam
                        </Badge>
                        <h2 className="text-2xl sm:text-3xl font-bold text-gray-900">
                            Confiado por milhares de brasileiros
                        </h2>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-4 gap-8 sm:gap-10">
                        {socialProofStats.map((stat) => (
                            <Card
                                key={stat.id}
                                className="text-center group p-6 border-primary-100 hover:border-primary-300 hover:shadow-lg transition-all duration-300 hover:-translate-y-1"
                            >
                                <div className="flex flex-col items-center space-y-3">
                                    <div className="w-14 h-14 bg-gradient-to-br from-primary-100 to-primary-200 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform">
                                        <span className="text-3xl">{stat.icon}</span>
                                    </div>
                                    <span className="text-4xl sm:text-5xl font-extrabold bg-gradient-to-r from-primary-600 to-primary-800 bg-clip-text text-transparent">
                                        {stat.value}
                                    </span>
                                    <p className="text-sm sm:text-base text-gray-700 font-semibold leading-tight">{stat.label}</p>
                                </div>
                            </Card>
                        ))}
                    </div>

                    <div className="mt-10 pt-10 border-t-2 border-primary-100">
                        <InlineTrustIndicators className="justify-center" />
                    </div>
                </Card>
            </div>
        </section>
    )
}
