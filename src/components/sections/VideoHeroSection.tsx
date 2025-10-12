'use client'

import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { openWhatsAppWithContext } from '@/lib/whatsapp'
import { ChevronDown, Star, TrendingUp, Shield } from 'lucide-react'
import { useEffect, useRef } from 'react'

interface VideoHeroSectionProps {
    className?: string
}

export function VideoHeroSection({ className = '' }: VideoHeroSectionProps) {
    const videoRef = useRef<HTMLVideoElement>(null)

    useEffect(() => {
        // Garantir que o vídeo toque automaticamente
        if (videoRef.current) {
            videoRef.current.play().catch((error) => {
                console.log('Autoplay prevented:', error)
            })
        }
    }, [])

    const handleVerPlanos = () => {
        // Scroll suave para a seção de planos
        const planosSection = document.getElementById('planos-precos')
        if (planosSection) {
            planosSection.scrollIntoView({ behavior: 'smooth' })
        }
    }

    const handleFalarEspecialista = () => {
        openWhatsAppWithContext('hero', {
            page: 'landing-page',
            section: 'hero-secondary-cta'
        })
    }

    const handleScrollDown = () => {
        window.scrollTo({
            top: window.innerHeight,
            behavior: 'smooth'
        })
    }

    return (
        <section className={`relative w-full h-screen overflow-hidden ${className}`}>
            {/* Vídeo em largura total */}
            <video
                ref={videoRef}
                className="absolute inset-0 w-full h-full object-cover"
                autoPlay
                muted
                loop
                playsInline
                poster="/HEro.png"
            >
                <source src="/Videos/hero-full-width.mp4" type="video/mp4" />
                Seu navegador não suporta vídeos HTML5.
            </video>

            {/* Overlay escuro para melhorar legibilidade do texto */}
            <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-black/40 to-black/50" />

            {/* Conteúdo sobreposto */}
            <div className="relative z-10 h-full flex flex-col items-center justify-center text-center px-6 sm:px-8 lg:px-12">

                {/* Texto principal */}
                <div className="max-w-6xl mx-auto space-y-8 sm:space-y-10 animate-fade-in">
                    {/* Badge superior */}
                    <div className="flex justify-center gap-3 flex-wrap">
                        <Badge variant="secondary" className="bg-white/20 backdrop-blur-md text-white border-white/30 px-4 py-2 text-sm font-semibold hover:bg-white/30 transition-colors">
                            <Star className="w-4 h-4 mr-2 fill-yellow-400 text-yellow-400" />
                            4.9/5 - Mais de 1.000 clientes
                        </Badge>
                        <Badge variant="secondary" className="bg-white/20 backdrop-blur-md text-white border-white/30 px-4 py-2 text-sm font-semibold hover:bg-white/30 transition-colors">
                            <TrendingUp className="w-4 h-4 mr-2" />
                            Economia de até 40%
                        </Badge>
                        <Badge variant="secondary" className="bg-white/20 backdrop-blur-md text-white border-white/30 px-4 py-2 text-sm font-semibold hover:bg-white/30 transition-colors">
                            <Shield className="w-4 h-4 mr-2" />
                            CRM 69.870
                        </Badge>
                    </div>

                    <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl xl:text-8xl font-extrabold text-white leading-[1.1] drop-shadow-2xl tracking-tight">
                        Nunca mais fique
                        <br />
                        <span className="bg-gradient-to-r from-blue-400 to-cyan-300 bg-clip-text text-transparent inline-block mt-2">sem lentes</span>
                    </h1>

                    <p className="text-xl sm:text-2xl md:text-3xl lg:text-4xl text-white leading-relaxed max-w-4xl mx-auto drop-shadow-2xl font-semibold">
                        Acompanhamento médico + entrega automática em casa
                    </p>

                    {/* CTAs */}
                    <div className="flex flex-col sm:flex-row gap-5 sm:gap-6 justify-center items-center pt-6 sm:pt-8">
                        <Button
                            onClick={handleVerPlanos}
                            size="lg"
                            className="w-full sm:w-auto min-w-[280px] bg-primary-600 hover:bg-primary-700 text-white font-bold text-xl py-7 px-10 shadow-2xl hover:shadow-primary-500/60 transform hover:scale-[1.08] transition-all duration-300 ring-2 ring-white/20 hover:ring-white/40"
                            aria-label="Ver planos e preços"
                        >
                            Ver Planos e Preços
                        </Button>

                        <Button
                            onClick={handleFalarEspecialista}
                            variant="outline"
                            size="lg"
                            className="w-full sm:w-auto min-w-[280px] bg-white hover:bg-white text-gray-900 font-bold text-xl py-7 px-10 border-3 border-white shadow-2xl transform hover:scale-[1.08] transition-all duration-300 hover:bg-primary-50"
                            aria-label="Falar com especialista"
                        >
                            Falar com Especialista
                        </Button>
                    </div>
                </div>

                {/* Indicador de scroll para baixo */}
                <button
                    onClick={handleScrollDown}
                    className="absolute bottom-8 left-1/2 transform -translate-x-1/2 text-white/80 hover:text-white transition-colors animate-bounce"
                    aria-label="Rolar para baixo"
                >
                    <div className="flex flex-col items-center gap-2">
                        <span className="text-sm font-medium drop-shadow-lg">Entenda como funciona</span>
                        <ChevronDown className="w-6 h-6" />
                    </div>
                </button>
            </div>

            {/* Mobile Sticky CTA */}
            <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t-2 border-primary-200 p-4 z-50 shadow-2xl backdrop-blur-sm bg-white/95">
                <Button
                    onClick={handleVerPlanos}
                    size="lg"
                    className="w-full flex items-center justify-center space-x-2 bg-gradient-to-r from-primary-600 to-primary-700 hover:from-primary-700 hover:to-primary-800 text-white font-bold text-lg py-5 shadow-lg transform active:scale-95 transition-all duration-200"
                    aria-label="Ver planos - Sticky CTA mobile"
                >
                    <span>Ver Planos e Preços</span>
                </Button>
            </div>
        </section>
    )
}
