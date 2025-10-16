'use client'

import { ChevronDown } from 'lucide-react'
import { useEffect, useRef } from 'react'

interface VideoHeroSectionProps {
    className?: string
}

export function VideoHeroSection({ className = '' }: VideoHeroSectionProps) {
    const videoRef = useRef<HTMLVideoElement>(null)

    useEffect(() => {
        // Tocar vídeo quando possível
        if (videoRef.current) {
            videoRef.current.play().catch((error) => {
                console.log('Autoplay prevented, video will play on user interaction:', error)
            })
        }
    }, [])

    const handleScrollDown = () => {
        window.scrollTo({
            top: window.innerHeight,
            behavior: 'smooth'
        })
    }

    return (
        <section className={`relative w-full h-screen overflow-hidden ${className}`}>
            {/* Vídeo sempre visível */}
            <video
                ref={videoRef}
                className="absolute inset-0 w-full h-full object-cover"
                autoPlay
                muted
                loop
                playsInline
                poster="/HEro.png"
                preload="auto"
            >
                <source src="/Videos/hero-full-width.mp4" type="video/mp4" />
                <source src="/Videos/hero-mobile-optimized.mp4" type="video/mp4" />
                Seu navegador não suporta vídeos HTML5.
            </video>

            {/* Overlay para melhorar legibilidade do texto */}
            <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-black/50 to-black/60" />

            {/* Conteúdo sobreposto */}
            <div className="relative z-10 h-full flex flex-col items-center justify-center text-center px-6 sm:px-8 lg:px-12">
                {/* Texto principal */}
                <div className="max-w-5xl mx-auto space-y-6 sm:space-y-8 animate-fade-in">
                    <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-extrabold text-white leading-[1.1] drop-shadow-2xl tracking-tight">
                        Nunca mais fique
                        <br />
                        <span className="bg-gradient-to-r from-primary-400 to-cyan-300 bg-clip-text text-transparent inline-block mt-2">sem lentes</span>
                    </h1>

                    <p className="text-lg sm:text-xl md:text-2xl text-white leading-relaxed max-w-3xl mx-auto drop-shadow-lg">
                        Assinatura de lentes com acompanhamento do Dr. Philipe Saraiva Cruz
                    </p>
                </div>

                {/* Indicador de scroll para baixo */}
                <button
                    onClick={handleScrollDown}
                    className="absolute bottom-8 left-1/2 transform -translate-x-1/2 text-white/80 hover:text-white transition-colors animate-bounce"
                    aria-label="Rolar para baixo"
                >
                    <div className="flex flex-col items-center gap-2">
                        <span className="text-sm font-medium drop-shadow-lg">Veja como funciona</span>
                        <ChevronDown className="w-6 h-6" />
                    </div>
                </button>
            </div>
        </section>
    )
}
