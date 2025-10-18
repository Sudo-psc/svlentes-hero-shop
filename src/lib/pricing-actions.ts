'use client'

import { trackEvent, trackSubscriptionEvent } from './analytics'
import { trackPlanSelection as trackPlanSelectionConversion, trackCheckoutStarted, trackConsultationBooked } from './conversion-tracking'

// Tipos para as ações de pricing
export interface SubscriptionData {
    planId: string
    billingInterval: 'monthly' | 'annual'
    customerData?: {
        name: string
        email: string
        phone?: string
    }
    leadData?: {
        nome: string
        whatsapp: string
        email: string
        lgpdConsent: boolean
    }
}

export interface ScheduleData {
    planId: string
    customerData?: {
        name: string
        email: string
        phone?: string
    }
}

// Função para iniciar processo de assinatura
export async function handleSubscription(data: SubscriptionData) {
    try {
        // Obter o valor do plano baseado no plano e intervalo
        const planValue = getPriceId(data.planId, data.billingInterval)

        if (!planValue) {
            throw new Error('Plano não encontrado')
        }

        // Preparar dados para a API de checkout (Asaas)
        const checkoutData = {
            planId: data.planId,
            billingType: 'PIX' as const, // Default to PIX, can be overridden
            value: planValue,
            customerData: {
                name: data.customerData?.name || data.leadData?.nome || '',
                email: data.customerData?.email || data.leadData?.email || '',
                phone: data.customerData?.phone || data.leadData?.whatsapp || '',
                cpfCnpj: '', // Will be filled in the form
            },
            billingInterval: data.billingInterval,
            leadData: data.leadData,
            source: 'pricing-section',
        }

        // Chamar API de checkout
        const response = await fetch('/api/create-checkout', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(checkoutData),
        })

        const result = await response.json()

        if (!result.success) {
            throw new Error(result.error || 'Erro ao criar checkout')
        }

        // Registrar evento de analytics e conversão
        const planPrice = getPlanPrice(data.planId, data.billingInterval)
        const planTier = data.planId.includes('premium') ? 'premium' : data.planId.includes('vip') ? 'vip' : 'basic'

        trackPlanSelection(data.planId, data.billingInterval)

        trackCheckoutStarted({
            planId: data.planId,
            value: planPrice,
        })

        // Track subscription event for enhanced ecommerce
        trackSubscriptionEvent('begin_checkout', {
            item_id: data.planId,
            item_name: `Plano ${data.planId}`,
            item_category: 'subscription',
            price: planPrice,
            currency: 'BRL',
            billing_interval: data.billingInterval,
        })

        // Para Asaas, retornar os dados da assinatura para processamento no frontend
        // O frontend pode mostrar opções de pagamento (PIX, Boleto, Cartão)
        return result

    } catch (error) {
        console.error('Erro ao processar assinatura:', error)

        // Registrar erro no analytics
        trackEvent('subscription_error', {
            error_type: 'checkout_error',
            error_message: error instanceof Error ? error.message : 'Erro desconhecido',
            plan_name: data.planId,
            step: 'payment',
        })

        throw error
    }
}

// Função para agendar consulta
export async function handleScheduleConsultation(data: ScheduleData) {
    try {
        // Preparar dados para WhatsApp
        const whatsappData = {
            type: 'consultation' as const,
            userData: data.customerData,
            context: {
                page: 'pricing-section',
                planInterest: data.planId,
            },
            prefilledMessage: `Olá! Gostaria de agendar uma consulta para conhecer melhor o ${getPlanName(data.planId)}. Pode me ajudar com os próximos passos?`,
        }

        // Registrar evento de analytics e conversão
        trackConsultationBooked({
            planInterest: data.planId,
            source: 'pricing-section',
        })

        // Redirecionar para WhatsApp
        const whatsappUrl = generateWhatsAppUrl(whatsappData)
        window.open(whatsappUrl, '_blank')

        return { success: true }

    } catch (error) {
        console.error('Erro ao agendar consulta:', error)

        // Registrar erro no analytics
        trackEvent('subscription_error', {
            error_type: 'schedule_error',
            error_message: error instanceof Error ? error.message : 'Erro desconhecido',
            plan_name: data.planId,
            step: 'form',
        })

        throw error
    }
}

// Função auxiliar para obter price ID (Asaas uses plan value directly)
// Atualizado com novo sistema de precificação (+15%)
function getPriceId(planId: string, billingInterval: 'monthly' | 'annual'): number | null {
    const prices = {
        basico: { monthly: 128.00, annual: 1091.00 },  // Express Mensal / VIP Anual
        padrao: { monthly: 91.00, annual: 1091.00 },   // VIP Anual (equivalente mensal)
        premium: { monthly: 138.00, annual: 1661.00 }, // Saúde Ocular Anual
        // Mapeamento alternativo por nome antigo (backward compatibility)
        basic: { monthly: 128.00, annual: 1091.00 },
        vip: { monthly: 91.00, annual: 1091.00 },
    }

    const plan = prices[planId as keyof typeof prices]
    if (!plan) return null

    return plan[billingInterval] || null
}

// Função auxiliar para obter preço do plano
// Atualizado com novo sistema de precificação (+15%)
function getPlanPrice(planId: string, billingInterval: 'monthly' | 'annual'): number {
    const prices = {
        basico: { monthly: 128.00, annual: 1091.00 },  // Express Mensal / VIP Anual
        padrao: { monthly: 91.00, annual: 1091.00 },   // VIP Anual (equivalente mensal)
        premium: { monthly: 138.00, annual: 1661.00 }, // Saúde Ocular Anual
        // Mapeamento alternativo por nome antigo (backward compatibility)
        basic: { monthly: 128.00, annual: 1091.00 },
        vip: { monthly: 91.00, annual: 1091.00 },
    }

    const plan = prices[planId as keyof typeof prices]
    if (!plan) return 0

    return plan[billingInterval]
}

// Função auxiliar para obter nome do plano
// Atualizado com novo sistema de nomenclatura
function getPlanName(planId: string): string {
    const names = {
        basico: 'Plano Express Mensal',
        padrao: 'Plano VIP Anual',
        premium: 'Plano Saúde Ocular Anual',
        // Mapeamento alternativo por nome antigo (backward compatibility)
        basic: 'Plano Express Mensal',
        vip: 'Plano VIP Anual',
    }

    return names[planId as keyof typeof names] || planId
}

// Função auxiliar para gerar URL do WhatsApp
function generateWhatsAppUrl(data: {
    type: 'consultation'
    userData?: {
        name?: string
        email?: string
        phone?: string
    }
    context: {
        page: string
        planInterest?: string
    }
    prefilledMessage: string
}): string {
    const phoneNumber = '5565999887766' // Número do WhatsApp Business
    const message = encodeURIComponent(data.prefilledMessage)

    return `https://wa.me/${phoneNumber}?text=${message}`
}

// Função para registrar seleção de plano (analytics)
export function trackPlanSelection(planId: string, billingInterval: 'monthly' | 'annual') {
    const planPrice = getPlanPrice(planId, billingInterval)
    trackSubscriptionEvent('view_item', {
        item_id: planId,
        item_name: `Plano ${planId}`,
        item_category: 'subscription',
        price: planPrice,
        currency: 'BRL',
        billing_interval: billingInterval,
    })
}

// Função para registrar mudança de aba (analytics)
export function trackTabChange(tabId: string) {
    // This function is kept for backward compatibility
    // The actual tracking is now done in the component using trackEvent
    console.log('Tab changed to:', tabId)
}

// Tipos do gtag já declarados em analytics.ts