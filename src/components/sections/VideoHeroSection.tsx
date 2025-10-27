'use client'
import { Button } from '@/components/ui/button'
import { ChevronDown } from 'lucide-react'
import { useCallback, useEffect, useRef } from 'react'
interface VideoHeroSectionProps {
    className?: string
}
export function VideoHeroSection({ className = '' }: VideoHeroSectionProps) {
    const videoRef = useRef<HTMLVideoElement>(null)
    useEffect(() => {
        // Garantir que o vídeo toque automaticamente
        if (videoRef.current) {
            videoRef.current.play().catch((error) => {
            })
        }
    }, [])
    const handleScrollDown = useCallback(() => {
        window.scrollTo({
            top: window.innerHeight,
            behavior: 'smooth'
        })
    }, [])
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
                poster="/Hero2.webp"
            >
                <source src="/Videos/hero-full-width.mp4" type="video/mp4" />
                Seu navegador não suporta vídeos HTML5.
            </video>
            {/* Overlay suave premium */}
            <div className="absolute inset-0 bg-gradient-to-b from-primary-900/40 via-primary-800/50 to-primary-900/70" />

            {/* Conteúdo sobreposto */}
            <div className="relative z-10 h-full flex flex-col items-center justify-center text-center px-6 sm:px-8 lg:px-12">
                {/* Texto principal */}
                <div className="max-w-5xl mx-auto space-y-8 sm:space-y-10 animate-fade-in-up">
                    {/* Tag premium */}
                    <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-white/90 text-sm font-medium tracking-wide">
                        <span className="w-2 h-2 bg-accent rounded-full animate-pulse"></span>
                        Acompanhamento oftalmológico incluso
                    </div>

                    <h1 className="text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-semibold text-white leading-[1.05] tracking-tight">
                        Liberdade para
                        <br />
                        <span className="bg-gradient-to-r from-white via-accent to-white bg-clip-text text-transparent inline-block mt-2 font-bold">enxergar a vida</span>
                    </h1>

                    <p className="text-lg sm:text-xl md:text-2xl text-white/90 leading-relaxed max-w-2xl mx-auto font-light tracking-wide">
                        Mais que lentes. Cuidado contínuo.
                    </p>

                    {/* CTA discreto */}
                    <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
                        <a
                            href="#planos-precos"
                            className="inline-flex items-center justify-center px-8 py-4 bg-white text-primary-700 rounded-xl font-medium text-base tracking-wide transition-all duration-300 hover:bg-white/95 hover:shadow-premium-lg hover:-translate-y-0.5 min-h-[48px] min-w-[200px]"
                        >
                            Descubra seu plano
                        </a>
                        <button
                            onClick={handleScrollDown}
                            className="inline-flex items-center justify-center px-8 py-4 bg-white/10 backdrop-blur-md text-white border border-white/20 rounded-xl font-medium text-base tracking-wide transition-all duration-300 hover:bg-white/20 hover:border-white/30 min-h-[48px] min-w-[200px]"
                        >
                            Saiba mais
                        </button>
                    </div>
                </div>

                {/* Indicador de scroll para baixo */}
                <button
                    onClick={handleScrollDown}
                    className="absolute bottom-10 left-1/2 transform -translate-x-1/2 text-white/70 hover:text-white transition-all duration-300 animate-bounce"
                    aria-label="Rolar para baixo"
                >
                    <ChevronDown className="w-7 h-7" />
                </button>
            </div>
        </section>
    )
}