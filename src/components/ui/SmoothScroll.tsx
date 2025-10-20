'use client'
import { useEffect } from 'react'
interface SmoothScrollProps {
    offset?: number
    duration?: number
}
export function SmoothScroll({ offset = 80, duration = 800 }: SmoothScrollProps) {
    useEffect(() => {
        const handleSmoothScroll = (e: Event) => {
            const target = e.target as HTMLAnchorElement
            // Verificar se é um link interno
            if (target.tagName === 'A' && target.hash) {
                e.preventDefault()
                const targetId = target.hash.substring(1)
                const targetElement = document.getElementById(targetId)
                if (targetElement) {
                    const targetPosition = targetElement.offsetTop - offset
                    window.scrollTo({
                        top: targetPosition,
                        behavior: 'smooth'
                    })
                    // Atualizar URL sem recarregar
                    window.history.pushState(null, '', target.hash)
                    // Focar no elemento para acessibilidade
                    setTimeout(() => {
                        targetElement.focus({ preventScroll: true })
                    }, duration)
                }
            }
        }
        // Adicionar listener para todos os links
        document.addEventListener('click', handleSmoothScroll)
        // Cleanup
        return () => {
            document.removeEventListener('click', handleSmoothScroll)
        }
    }, [offset, duration])
    // Verificar se há hash na URL ao carregar a página
    useEffect(() => {
        const hash = window.location.hash
        if (hash) {
            const targetElement = document.getElementById(hash.substring(1))
            if (targetElement) {
                setTimeout(() => {
                    const targetPosition = targetElement.offsetTop - offset
                    window.scrollTo({
                        top: targetPosition,
                        behavior: 'smooth'
                    })
                }, 100) // Pequeno delay para garantir que a página carregou
            }
        }
    }, [offset])
    return null // Este componente não renderiza nada
}
// Hook para scroll suave programático
export function useSmoothScroll(offset: number = 80) {
    const scrollToElement = (elementId: string) => {
        const element = document.getElementById(elementId)
        if (element) {
            const targetPosition = element.offsetTop - offset
            window.scrollTo({
                top: targetPosition,
                behavior: 'smooth'
            })
        }
    }
    const scrollToTop = () => {
        window.scrollTo({
            top: 0,
            behavior: 'smooth'
        })
    }
    return { scrollToElement, scrollToTop }
}