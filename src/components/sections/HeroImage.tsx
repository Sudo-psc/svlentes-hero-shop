'use client'

import Image from 'next/image'
import { useState } from 'react'
import { Star, Shield, Clock } from 'lucide-react'

interface HeroImageProps {
    className?: string
    imageVariant?: 'hero1' | 'hero2' | 'hero3'
}

export function HeroImage({ className = '', imageVariant = 'hero1' }: HeroImageProps) {
    const [isLoaded, setIsLoaded] = useState(false)

    const imageMap = {
        hero1: '/HEro.png',
        hero2: '/Hero2.png',
        hero3: '/Hero3.png'
    }

    const imageSrc = imageMap[imageVariant]

    return (
        <div className={`relative ${className}`}>
            {/* Main image container */}
            <div className="relative w-full aspect-square lg:aspect-auto lg:h-[600px] rounded-3xl overflow-hidden shadow-2xl">
                {/* Loading skeleton */}
                {!isLoaded && (
                    <div className="absolute inset-0 bg-gradient-to-br from-primary-100 via-white to-secondary-100 animate-pulse" />
                )}

                {/* Hero Image */}
                <picture>
                    <source
                        srcSet={imageSrc}
                        type="image/png"
                    />
                    <Image
                        src={imageSrc}
                        alt="Paciente usando lentes com acompanhamento do Dr. Philipe em Itaim Bibi, São Paulo"
                        fill
                        priority={false}
                        loading="lazy"
                        quality={90}
                        sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 600px"
                        className={`object-cover transition-all duration-700 ${isLoaded ? 'opacity-100 scale-100' : 'opacity-0 scale-105'
                            }`}
                        onLoad={() => setIsLoaded(true)}
                    />
                </picture>

                {/* Gradient overlay for better text readability */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent" />
            </div>

            {/* Floating trust badges */}
            <div className="absolute -bottom-6 left-1/2 transform -translate-x-1/2 w-full max-w-sm animate-float">
                <div className="bg-white/90 backdrop-blur-xl rounded-3xl p-6 shadow-glass-lg border border-white/20">
                    <div className="grid grid-cols-3 gap-4">
                        <div className="text-center group">
                            <div className="flex items-center justify-center mb-2">
                                <div className="p-2 bg-primary-100 rounded-full group-hover:bg-primary-200 transition-colors">
                                    <Star className="w-4 h-4 text-primary-600" />
                                </div>
                            </div>
                            <p className="text-xl font-bold text-gray-900">98%</p>
                            <p className="text-xs text-gray-600">Satisfação</p>
                        </div>

                        <div className="text-center group">
                            <div className="flex items-center justify-center mb-2">
                                <div className="p-2 bg-green-100 rounded-full group-hover:bg-green-200 transition-colors">
                                    <Shield className="w-4 h-4 text-green-600" />
                                </div>
                            </div>
                            <p className="text-xl font-bold text-gray-900">5K+</p>
                            <p className="text-xs text-gray-600">Pacientes</p>
                        </div>

                        <div className="text-center group">
                            <div className="flex items-center justify-center mb-2">
                                <div className="p-2 bg-primary-100 rounded-full group-hover:bg-primary-200 transition-colors">
                                    <Clock className="w-4 h-4 text-primary-600" />
                                </div>
                            </div>
                            <p className="text-xl font-bold text-gray-900">15+</p>
                            <p className="text-xs text-gray-600">Anos</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Decorative floating elements */}
            <div className="absolute -top-8 -right-8 w-24 h-24 bg-gradient-to-br from-primary-400 to-primary-600 rounded-full opacity-20 blur-xl animate-pulse-slow" />
            <div className="absolute -bottom-8 -left-8 w-32 h-32 bg-gradient-to-br from-secondary-400 to-secondary-600 rounded-full opacity-15 blur-2xl animate-pulse-slow" style={{ animationDelay: '2s' }} />
            <div className="absolute top-1/4 -right-4 w-16 h-16 bg-gradient-to-br from-purple-400 to-pink-500 rounded-full opacity-25 blur-xl animate-pulse-slow" style={{ animationDelay: '4s' }} />

            {/* Medical credibility badge */}
            <div className="absolute top-6 left-6 bg-white/80 backdrop-blur-md rounded-2xl px-6 py-3 shadow-glass border border-white/30 transform hover:scale-105 transition-all duration-300">
                <div className="flex items-center space-x-3">
                    <div className="w-3 h-3 bg-gradient-to-r from-green-400 to-emerald-500 rounded-full animate-pulse shadow-lg shadow-green-500/50" />
                    <span className="text-sm font-semibold text-gray-800 drop-shadow-sm">Acompanhamento Médico</span>
                </div>
            </div>
        </div>
    )
}
