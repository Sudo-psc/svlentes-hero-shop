import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'
export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs))
}
// Função para scroll suave para seções
export function scrollToSection(sectionId: string) {
    // Tenta encontrar o elemento imediatamente
    let element = document.getElementById(sectionId)
    if (element) {
        // Se encontrou, faz o scroll suave
        element.scrollIntoView({
            behavior: 'smooth',
            block: 'start',
        })
        return
    }
    // Se não encontrou, tenta novamente após um pequeno delay
    // (útil para lazy loading)
    setTimeout(() => {
        element = document.getElementById(sectionId)
        if (element) {
            element.scrollIntoView({
                behavior: 'smooth',
                block: 'start',
            })
        }
    }, 100)
    // Se ainda não encontrou, tenta novamente com mais tempo
    setTimeout(() => {
        element = document.getElementById(sectionId)
        if (element) {
            element.scrollIntoView({
                behavior: 'smooth',
                block: 'start',
            })
        } else {
            // Última tentativa: scroll para o final da página
            console.warn(`Element with id "${sectionId}" not found, scrolling to bottom of page`)
            window.scrollTo({
                top: document.body.scrollHeight,
                behavior: 'smooth'
            })
        }
    }, 500)
}
// Função para gerar link do WhatsApp
export function generateWhatsAppLink(
    phone: string,
    message: string,
    userData?: {
        nome?: string
        email?: string
        planInterest?: string
    }
) {
    const cleanPhone = phone.replace(/\D/g, '')
    let finalMessage = message
    if (userData) {
        if (userData.nome) {
            finalMessage += `\n\nNome: ${userData.nome}`
        }
        if (userData.email) {
            finalMessage += `\nEmail: ${userData.email}`
        }
        if (userData.planInterest) {
            finalMessage += `\nInteresse: ${userData.planInterest}`
        }
    }
    const encodedMessage = encodeURIComponent(finalMessage)
    return `https://wa.me/${cleanPhone}?text=${encodedMessage}`
}
// Função para formatar moeda brasileira
export function formatCurrency(value: number): string {
    return new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL',
    }).format(value)
}
// Função para calcular desconto percentual
export function calculateDiscount(originalPrice: number, discountedPrice: number): number {
    return Math.round(((originalPrice - discountedPrice) / originalPrice) * 100)
}
// Função para debounce
export function debounce<T extends (...args: any[]) => any>(
    func: T,
    wait: number
): (...args: Parameters<T>) => void {
    let timeout: NodeJS.Timeout
    return (...args: Parameters<T>) => {
        clearTimeout(timeout)
        timeout = setTimeout(() => func(...args), wait)
    }
}
// Função para verificar se está em dispositivo móvel
export function isMobile(): boolean {
    if (typeof window === 'undefined') return false
    return window.innerWidth < 768
}
// Função para gerar ID único
export function generateId(): string {
    return Math.random().toString(36).substr(2, 9)
}