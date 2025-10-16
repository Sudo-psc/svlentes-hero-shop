'use client'

import Image from 'next/image'
import { useState, useMemo } from 'react'
import { Star, Shield, Clock, User } from 'lucide-react'

interface HeroImageProps {
    className?: string
    imageVariant?: 'hero1' | 'hero2' | 'hero3'
}

export function HeroImage({ className = '', imageVariant = 'hero1' }: HeroImageProps) {
    const [isLoaded, setIsLoaded] = useState(false)

    // Memoize image mapping for performance
    const imageMap = useMemo(() => ({
        hero1: '/HEro.png',
        hero2: '/Hero2.png',
        hero3: '/Hero3.png'
    }), [])

    const imageSrc = imageMap[imageVariant]

    return (
        <div className={`relative ${className}`}>
            {/* Main image container - Mobile Optimized */}
            <div className="relative w-full aspect-[4/5] sm:aspect-square lg:aspect-auto lg:h-[600px] rounded-2xl sm:rounded-3xl overflow-hidden shadow-2xl">
                {/* Enhanced loading skeleton with mobile optimization */}
                {!isLoaded && (
                    <div className="absolute inset-0 bg-gradient-to-br from-cyan-50 via-white to-blue-50">
                        <div className="absolute inset-0 bg-gradient-to-t from-primary-100/50 via-transparent to-transparent animate-pulse" />
                        {/* Mobile placeholder content */}
                        <div className="absolute inset-0 flex items-center justify-center">
                            <div className="text-center space-y-4 p-8">
                                <div className="w-16 h-16 bg-gradient-to-r from-primary-500 to-cyan-500 rounded-full mx-auto animate-pulse shadow-lg"></div>
                                <div className="space-y-2">
                                    <div className="h-4 bg-gray-200 rounded animate-pulse w-32 mx-auto"></div>
                                    <div className="h-3 bg-gray-100 rounded animate-pulse w-24 mx-auto"></div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Hero Image with optimized loading */}
                <picture>
                    <source
                        srcSet={imageSrc}
                        type="image/png"
                    />
                    <Image
                        src={imageSrc}
                        alt="Paciente usando lentes com acompanhamento médico do Dr. Philipe Saraiva Cruz - CRM-MG 69.870"
                        fill
                        priority={false}
                        loading="lazy"
                        quality={85}
                        sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 600px"
                        className={`object-cover transition-all duration-1000 ease-out ${isLoaded ? 'opacity-100 scale-100' : 'opacity-0 scale-105'
                            }`}
                        onLoad={() => setIsLoaded(true)}
                    />
                </picture>

                {/* Optimized gradient overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/10 via-transparent to-transparent lg:from-black/20" />
            </div>

            {/* Mobile-First Trust Badges */}
            <div className="absolute -bottom-4 sm:-bottom-6 left-1/2 transform -translate-x-1/2 w-full max-w-xs sm:max-w-sm animate-float">
                <div className="bg-white/95 backdrop-blur-xl rounded-2xl sm:rounded-3xl p-4 sm:p-6 shadow-glass-lg border border-white/20">
                    {/* Mobile-first layout */}
                    <div className="grid grid-cols-3 gap-2 sm:gap-4">
                        <div className="text-center group">
                            <div className="flex items-center justify-center mb-1 sm:mb-2">
                                <div className="p-1.5 sm:p-2 bg-gradient-to-r from-primary-100 to-cyan-100 rounded-full group-hover:from-primary-200 group-hover:to-cyan-200 transition-all duration-300">
                                    <Star className="w-3 h-3 sm:w-4 sm:h-4 text-primary-600" />
                                </div>
                            </div>
                            <p className="text-lg sm:text-xl font-bold text-gray-900">98%</p>
                            <p className="text-xs text-gray-600">Satisfação</p>
                        </div>

                        <div className="text-center group">
                            <div className="flex items-center justify-center mb-1 sm:mb-2">
                                <div className="p-1.5 sm:p-2 bg-gradient-to-r from-green-100 to-emerald-100 rounded-full group-hover:from-green-200 group-hover:to-emerald-200 transition-all duration-300">
                                    <Shield className="w-3 h-3 sm:w-4 sm:h-4 text-green-600" />
                                </div>
                            </div>
                            <p className="text-lg sm:text-xl font-bold text-gray-900">5K+</p>
                            <p className="text-xs text-gray-600">Pacientes</p>
                        </div>

                        <div className="text-center group">
                            <div className="flex items-center justify-center mb-1 sm:mb-2">
                                <div className="p-1.5 sm:p-2 bg-gradient-to-r from-blue-100 to-cyan-100 rounded-full group-hover:from-blue-200 group-hover:to-cyan-200 transition-all duration-300">
                                    <Clock className="w-3 h-3 sm:w-4 sm:h-4 text-blue-600" />
                                </div>
                            </div>
                            <p className="text-lg sm:text-xl font-bold text-gray-900">15+</p>
                            <p className="text-xs text-gray-600">Anos</p>
                        </div>
                    </div>

                    {/* Mobile Medical Credibility */}
                    <div className="mt-3 sm:mt-4 pt-3 sm:pt-4 border-t border-gray-200">
                        <div className="flex items-center justify-center space-x-2 bg-gradient-to-r from-cyan-50 to-blue-50 rounded-xl p-2 sm:p-3 border border-cyan-200">
                            <div className="w-2 h-2 sm:w-2.5 sm:h-2.5 bg-green-500 rounded-full animate-pulse"></div>
                            <div className="text-center">
                                <p className="text-xs font-bold text-cyan-800">Dr. Philipe Saraiva Cruz</p>
                                <p className="text-xs text-cyan-600">CRM-MG 69.870</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Optimized decorative floating elements - Mobile performance */}
            <div className="absolute -top-6 -right-6 sm:-top-8 sm:-right-8 w-16 h-16 sm:w-24 sm:h-24 bg-gradient-to-br from-primary-400 to-primary-600 rounded-full opacity-10 sm:opacity-20 blur-xl animate-pulse-slow" />
            <div className="absolute -bottom-6 -left-6 sm:-bottom-8 sm:-left-8 w-20 h-20 sm:w-32 sm:h-32 bg-gradient-to-br from-secondary-400 to-secondary-600 rounded-full opacity-8 sm:opacity-15 blur-xl animate-pulse-slow" style={{ animationDelay: '2s' }} />
            <div className="absolute top-1/4 -right-3 sm:-right-4 w-12 h-12 sm:w-16 sm:h-16 bg-gradient-to-br from-cyan-400 to-blue-500 rounded-full opacity-12 sm:opacity-25 blur-lg animate-pulse-slow" style={{ animationDelay: '4s' }} />
        </div>
    )
}
