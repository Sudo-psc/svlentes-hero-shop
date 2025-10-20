import { generateWhatsAppLink } from './utils'
import { trackEvent } from './analytics'
import { APP_CONFIG } from './constants'
export interface WhatsAppContextData {
    page: string
    section?: string
    planInterest?: string
    calculatedEconomy?: number
    userInfo?: {
        nome?: string
        email?: string
        whatsapp?: string
    }
}
// Mensagens pré-definidas por contexto
export const whatsappMessages = {
    hero: {
        title: 'Interesse na SV Lentes',
        message: `Olá! Vi o site da SV Lentes e tenho interesse no serviço de assinatura de lentes de contato com acompanhamento médico.
Gostaria de saber mais sobre:
• Como funciona o serviço
• Planos disponíveis
• Acompanhamento médico com Dr. Philipe
Quando posso agendar uma consulta?`
    },
    pricing: {
        title: 'Interesse em Plano',
        message: `Olá! Estou interessado(a) nos planos de assinatura da SV Lentes.
Gostaria de mais informações sobre:
• Diferenças entre os planos
• Processo de adesão
• Primeira consulta médica
• Formas de pagamento
Posso agendar uma consulta com Dr. Philipe?`
    },
    consultation: {
        title: 'Agendar Consulta',
        message: `Olá Dr. Philipe! Gostaria de agendar uma consulta para avaliar minha necessidade de lentes de contato.
Informações:
• Interesse no serviço SV Lentes
• Primeira consulta
• Disponibilidade: [informar horários]
Aguardo retorno para agendarmos!`
    },
    support: {
        title: 'Suporte SV Lentes',
        message: `Olá! Preciso de ajuda com o serviço SV Lentes.
Minha dúvida é sobre:
• [descrever a dúvida]
Aguardo retorno da equipe!`
    },
    calculator: {
        title: 'Resultado da Calculadora',
        message: `Olá! Usei a calculadora de economia da SV Lentes e me interessei pelo resultado.
Gostaria de:
• Confirmar a economia calculada
• Entender melhor os planos
• Agendar consulta médica
• Iniciar o processo de assinatura
Quando posso conversar com a equipe?`
    },
    emergency: {
        title: 'Suporte de Emergência',
        message: `Olá! Preciso de suporte emergencial com minhas lentes de contato.
Situação:
• [descrever o problema]
• Sou cliente SV Lentes: [sim/não]
Preciso de ajuda urgente!`
    }
}
// Função para gerar mensagem contextual
export function generateContextualMessage(
    context: keyof typeof whatsappMessages,
    data?: WhatsAppContextData
): string {
    let message = whatsappMessages[context].message
    // Adicionar informações do usuário se disponível
    if (data?.userInfo) {
        message += '\n\n--- Meus dados ---'
        if (data.userInfo.nome) {
            message += `\nNome: ${data.userInfo.nome}`
        }
        if (data.userInfo.email) {
            message += `\nEmail: ${data.userInfo.email}`
        }
        if (data.userInfo.whatsapp) {
            message += `\nWhatsApp: ${data.userInfo.whatsapp}`
        }
    }
    // Adicionar informações específicas do contexto
    if (data?.planInterest) {
        message += `\n\nPlano de interesse: ${data.planInterest}`
    }
    if (data?.calculatedEconomy) {
        message += `\n\nEconomia calculada: R$ ${data.calculatedEconomy.toFixed(2)} por ano`
    }
    if (data?.section) {
        message += `\n\nSeção do site: ${data.section}`
    }
    // Adicionar timestamp
    message += `\n\nEnviado em: ${new Date().toLocaleString('pt-BR')}`
    return message
}
export function openWhatsAppWithContext(
    context: keyof typeof whatsappMessages,
    data?: WhatsAppContextData
) {
    const phone = APP_CONFIG.whatsapp.number
    const message = generateContextualMessage(context, data)
    const link = generateWhatsAppLink(phone, message)
    trackEvent('whatsapp_redirect', {
        context: context,
        user_data: !!data?.userInfo,
        message_type: 'support',
    })
    window.open(link, '_blank')
}
// Configurações do WhatsApp Business
export const whatsappConfig = {
    businessHours: {
        start: 8, // 8h
        end: 18,  // 18h
        timezone: 'America/Sao_Paulo'
    },
    autoResponses: {
        businessHours: 'Olá! Obrigado por entrar em contato. Nossa equipe responderá em breve durante nosso horário de atendimento (8h às 18h).',
        afterHours: 'Olá! Recebemos sua mensagem fora do horário comercial. Responderemos na próxima manhã a partir das 8h. Para emergências, mencione "URGENTE" no início da mensagem.',
        weekend: 'Olá! Recebemos sua mensagem no fim de semana. Responderemos na segunda-feira. Para emergências médicas, procure atendimento hospitalar.'
    },
    quickReplies: [
        'Quero agendar consulta',
        'Informações sobre planos',
        'Como funciona o serviço',
        'Suporte técnico',
        'Emergência com lentes'
    ]
}
// Função para verificar horário comercial
export function isBusinessHours(): boolean {
    const now = new Date()
    const hour = now.getHours()
    const day = now.getDay() // 0 = domingo, 6 = sábado
    // Verificar se é fim de semana
    if (day === 0 || day === 6) return false
    // Verificar horário
    return hour >= whatsappConfig.businessHours.start && hour < whatsappConfig.businessHours.end
}
// Função para obter status de atendimento
export function getAttendanceStatus(): {
    isOpen: boolean
    message: string
    nextOpenTime?: string
} {
    const isOpen = isBusinessHours()
    if (isOpen) {
        return {
            isOpen: true,
            message: 'Online agora • Resposta rápida'
        }
    }
    const now = new Date()
    const day = now.getDay()
    const hour = now.getHours()
    if (day === 0 || day === 6) {
        return {
            isOpen: false,
            message: 'Offline • Responderemos na segunda-feira',
            nextOpenTime: 'Segunda-feira às 8h'
        }
    }
    if (hour < whatsappConfig.businessHours.start) {
        return {
            isOpen: false,
            message: 'Offline • Responderemos às 8h',
            nextOpenTime: 'Hoje às 8h'
        }
    }
    return {
        isOpen: false,
        message: 'Offline • Responderemos amanhã',
        nextOpenTime: 'Amanhã às 8h'
    }
}