'use client'
import { useState, useEffect } from 'react'
import { HeroImage } from './HeroImage'
import { ChevronLeft, ChevronRight } from 'lucide-react'
interface HeroImageCarouselProps {
    className?: string
    autoPlay?: boolean
    autoPlayInterval?: number
}
export function HeroImageCarousel({
    className = '',
    autoPlay = true,
    autoPlayInterval = 5000
}: HeroImageCarouselProps) {
    const [currentImage, setCurrentImage] = useState<'hero1' | 'hero2' | 'hero3'>('hero1')
    const images: ('hero1' | 'hero2' | 'hero3')[] = ['hero1', 'hero2', 'hero3']
    const currentIndex = images.indexOf(currentImage)
    useEffect(() => {
        if (!autoPlay) return
        const interval = setInterval(() => {
            setCurrentImage(prev => {
                const currentIdx = images.indexOf(prev)
                const nextIdx = (currentIdx + 1) % images.length
                return images[nextIdx]
            })
        }, autoPlayInterval)
        return () => clearInterval(interval)
    }, [autoPlay, autoPlayInterval])
    const goToPrevious = () => {
        const prevIdx = currentIndex === 0 ? images.length - 1 : currentIndex - 1
        setCurrentImage(images[prevIdx])
    }
    const goToNext = () => {
        const nextIdx = (currentIndex + 1) % images.length
        setCurrentImage(images[nextIdx])
    }
    return (
        <div className={`relative ${className}`}>
            {/* Main Image */}
            <HeroImage
                imageVariant={currentImage}
                className="transform hover:scale-105 transition-transform duration-500"
            />
            {/* Navigation Arrows */}
            <button
                onClick={goToPrevious}
                className="absolute left-4 top-1/2 transform -translate-y-1/2 bg-white/80 hover:bg-white backdrop-blur-sm rounded-full p-2 shadow-lg transition-all duration-200 hover:scale-110"
                aria-label="Imagem anterior"
            >
                <ChevronLeft className="w-5 h-5 text-gray-700" />
            </button>
            <button
                onClick={goToNext}
                className="absolute right-4 top-1/2 transform -translate-y-1/2 bg-white/80 hover:bg-white backdrop-blur-sm rounded-full p-2 shadow-lg transition-all duration-200 hover:scale-110"
                aria-label="Próxima imagem"
            >
                <ChevronRight className="w-5 h-5 text-gray-700" />
            </button>
            {/* Dots Indicator */}
            <div className="absolute bottom-20 left-1/2 transform -translate-x-1/2 flex space-x-2">
                {images.map((_, index) => (
                    <button
                        key={index}
                        onClick={() => setCurrentImage(images[index])}
                        className={`w-3 h-3 rounded-full transition-all duration-200 ${index === currentIndex
                                ? 'bg-white shadow-lg scale-110'
                                : 'bg-white/50 hover:bg-white/75'
                            }`}
                        aria-label={`Ir para imagem ${index + 1}`}
                    />
                ))}
            </div>
        </div>
    )
}