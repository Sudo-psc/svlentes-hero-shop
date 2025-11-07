'use client'
import { Button } from '@/components/ui/button'
import { ChevronDown, Phone, Calculator, MessageCircle } from 'lucide-react'
import { useCallback, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { openWhatsAppWithContext } from '@/lib/whatsapp'
interface VideoHeroSectionProps {
    className?: string
}
export function VideoHeroSection({ className = '' }: VideoHeroSectionProps) {
    const videoRef = useRef<HTMLVideoElement>(null)
    const router = useRouter()

    useEffect(() => {
        // Garantir que o vídeo toque automaticamente
        if (videoRef.current) {
            videoRef.current.play().catch(() => {
                // Autoplay pode falhar em alguns navegadores - ignorar silenciosamente
            })
        }
    }, [])

    const handleScrollDown = useCallback(() => {
        window.scrollTo({
            top: window.innerHeight,
            behavior: 'smooth'
        })
    }, [])

    const handleAgendarConsulta = useCallback(() => {
        router.push('/agendar-consulta')
    }, [router])

    const handleCalculadora = useCallback(() => {
        router.push('/calculadora')
    }, [router])

    const handleWhatsApp = useCallback(() => {
        openWhatsAppWithContext('landing_hero', {
            message: 'Olá! Vi o site da SV Lentes e gostaria de saber mais sobre a assinatura de lentes.'
        })
    }, [])
    return (
        <section className={`relative w-full h-screen overflow-hidden ${className}`}>
            {/* Vídeo em largura total */}
            <video
                ref={videoRef}
                className="absolute inset-0 w-full h-full object-cover scale-105"
                autoPlay
                muted
                loop
                playsInline
                poster="/Hero2.webp"
            >
                <source src="/Videos/hero-full-width.mp4" type="video/mp4" />
                Seu navegador não suporta vídeos HTML5.
            </video>
            {/* Overlay escuro para melhorar legibilidade do texto */}
            <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-black/50 to-black/60" />
            {/* Conteúdo sobreposto */}
            <div className="relative z-10 h-full flex flex-col items-center justify-center text-center px-6 sm:px-8 lg:px-12">
                {/* Texto principal */}
                <div className="max-w-5xl mx-auto space-y-6 sm:space-y-8 animate-fade-in">
                    <h1 className="text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-extrabold text-white leading-[1.1] drop-shadow-2xl tracking-tight">
                        Nunca mais fique
                        <br />
                        <span className="bg-gradient-to-r from-cyan-300 to-cyan-200 bg-clip-text text-transparent inline-block mt-2 font-black">sem lentes</span>
                    </h1>
                    <p className="text-xl sm:text-2xl md:text-3xl text-white leading-relaxed max-w-4xl mx-auto drop-shadow-lg font-light">
                        Assinatura de lentes com acompanhamento do Dr. Philipe Saraiva Cruz
                        <br />
                        <span className="text-lg sm:text-xl md:text-2xl text-cyan-100">CRM-MG 69.870</span>
                    </p>

                    {/* CTA Buttons */}
                    <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
                        <Button
                            onClick={handleAgendarConsulta}
                            size="lg"
                            className="w-full sm:w-auto bg-cyan-600 hover:bg-cyan-700 text-white font-semibold px-8 py-6 text-lg shadow-2xl hover:shadow-cyan-500/50 hover:scale-105 active:scale-95 transition-all duration-300 group"
                        >
                            <Phone className="w-5 h-5 mr-2 group-hover:rotate-12 transition-transform" />
                            Agendar Consulta
                        </Button>

                        <Button
                            onClick={handleCalculadora}
                            size="lg"
                            variant="outline"
                            className="w-full sm:w-auto bg-white/10 backdrop-blur-md border-2 border-white/30 text-white font-semibold px-8 py-6 text-lg hover:bg-white/20 hover:border-white/50 shadow-xl hover:shadow-2xl hover:scale-105 active:scale-95 transition-all duration-300 group"
                        >
                            <Calculator className="w-5 h-5 mr-2 group-hover:scale-110 transition-transform" />
                            Calcular Economia
                        </Button>

                        <Button
                            onClick={handleWhatsApp}
                            size="lg"
                            variant="outline"
                            className="w-full sm:w-auto bg-green-600/20 backdrop-blur-md border-2 border-green-400/50 text-white font-semibold px-8 py-6 text-lg hover:bg-green-600/30 hover:border-green-400/70 shadow-xl hover:shadow-green-500/30 hover:scale-105 active:scale-95 transition-all duration-300 group"
                        >
                            <MessageCircle className="w-5 h-5 mr-2 group-hover:scale-110 transition-transform" />
                            WhatsApp
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
                        <span className="text-sm font-medium drop-shadow-lg">Veja como funciona</span>
                        <ChevronDown className="w-6 h-6" />
                    </div>
                </button>
            </div>
          </section>
    )
}