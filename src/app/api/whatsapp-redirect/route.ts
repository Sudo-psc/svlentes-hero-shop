import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { whatsappContactSchema } from '@/lib/validations'
import { generateContextualMessage, whatsappMessages, isBusinessHours, getAttendanceStatus } from '@/lib/whatsapp'
import { generateWhatsAppLink } from '@/lib/utils'
// Schema específico para a API de redirecionamento
const whatsappRedirectSchema = z.object({
    context: z.enum(['hero', 'pricing', 'consultation', 'support', 'calculator', 'emergency'], {
        errorMap: () => ({ message: 'Contexto inválido' })
    }),
    userData: z.object({
        nome: z.string().optional(),
        email: z.string().email().optional().or(z.literal('')),
        whatsapp: z.string().optional(),
    }).optional(),
    contextData: z.object({
        page: z.string().min(1, 'Página é obrigatória'),
        section: z.string().optional(),
        planInterest: z.string().optional(),
        calculatedEconomy: z.number().optional(),
        customMessage: z.string().max(500, 'Mensagem personalizada muito longa').optional(),
    }),
    trackingData: z.object({
        source: z.string().optional(),
        medium: z.string().optional(),
        campaign: z.string().optional(),
        sessionId: z.string().optional(),
    }).optional(),
})
// Função para registrar evento de redirecionamento
function logWhatsAppRedirect(data: {
    context: string
    page: string
    hasUserData: boolean
    timestamp: string
    userAgent?: string
    referer?: string
    trackingData?: any
}) {
    console.log('WHATSAPP_REDIRECT:', JSON.stringify({
        ...data,
        source: 'whatsapp_api'
    }))
}
export async function POST(request: NextRequest) {
    try {
        const body = await request.json()
        // Validar dados de entrada
        const validatedData = whatsappRedirectSchema.parse(body)
        const { context, userData, contextData, trackingData } = validatedData
        // Obter número do WhatsApp das variáveis de ambiente
        const whatsappNumber = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || process.env.WHATSAPP_BUSINESS_NUMBER
        if (!whatsappNumber) {
            return NextResponse.json(
                { error: 'Número do WhatsApp não configurado' },
                { status: 500 }
            )
        }
        // Preparar dados para geração da mensagem
        const messageData = {
            page: contextData.page,
            section: contextData.section,
            planInterest: contextData.planInterest,
            calculatedEconomy: contextData.calculatedEconomy,
            userInfo: userData && (userData.nome || userData.email || userData.whatsapp) ? userData : undefined
        }
        // Gerar mensagem contextual
        let message = generateContextualMessage(context, messageData)
        // Adicionar mensagem personalizada se fornecida
        if (contextData.customMessage) {
            message += `\n\n--- Mensagem adicional ---\n${contextData.customMessage}`
        }
        // Gerar link do WhatsApp
        const whatsappLink = generateWhatsAppLink(whatsappNumber, message)
        // Obter status de atendimento
        const attendanceStatus = getAttendanceStatus()
        // Registrar evento para analytics
        logWhatsAppRedirect({
            context,
            page: contextData.page,
            hasUserData: !!(userData && (userData.nome || userData.email || userData.whatsapp)),
            timestamp: new Date().toISOString(),
            userAgent: request.headers.get('user-agent') || undefined,
            referer: request.headers.get('referer') || undefined,
            trackingData
        })
        // Preparar resposta
        const response = {
            success: true,
            whatsappLink,
            message: {
                preview: message.substring(0, 100) + (message.length > 100 ? '...' : ''),
                context: whatsappMessages[context].title,
                fullMessage: message
            },
            attendance: attendanceStatus,
            metadata: {
                timestamp: new Date().toISOString(),
                context,
                page: contextData.page,
                hasUserData: !!(userData && (userData.nome || userData.email || userData.whatsapp)),
                messageLength: message.length
            }
        }
        return NextResponse.json(response)
    } catch (error) {
        console.error('Erro na API de redirecionamento WhatsApp:', error)
        // Tratar erros de validação
        if (error instanceof z.ZodError) {
            return NextResponse.json(
                {
                    error: 'Dados inválidos',
                    details: error.errors.map(err => ({
                        field: err.path.join('.'),
                        message: err.message
                    }))
                },
                { status: 400 }
            )
        }
        // Erro genérico
        return NextResponse.json(
            { error: 'Erro interno do servidor. Tente novamente.' },
            { status: 500 }
        )
    }
}
// Endpoint GET para obter informações sobre contextos disponíveis
export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url)
        const includeMessages = searchParams.get('include_messages') === 'true'
        // Obter status de atendimento atual
        const attendanceStatus = getAttendanceStatus()
        // Preparar informações dos contextos
        const contexts = Object.keys(whatsappMessages).map(key => ({
            id: key,
            title: whatsappMessages[key as keyof typeof whatsappMessages].title,
            ...(includeMessages && {
                message: whatsappMessages[key as keyof typeof whatsappMessages].message
            })
        }))
        const response = {
            success: true,
            attendance: attendanceStatus,
            contexts,
            whatsappNumber: process.env.NEXT_PUBLIC_WHATSAPP_NUMBER ?
                process.env.NEXT_PUBLIC_WHATSAPP_NUMBER.replace(/\D/g, '') : null,
            metadata: {
                timestamp: new Date().toISOString(),
                totalContexts: contexts.length,
                businessHours: {
                    start: 8,
                    end: 18,
                    timezone: 'America/Sao_Paulo'
                }
            }
        }
        return NextResponse.json(response)
    } catch (error) {
        console.error('Erro ao obter informações do WhatsApp:', error)
        return NextResponse.json(
            { error: 'Erro ao carregar informações do WhatsApp' },
            { status: 500 }
        )
    }
}
// Endpoint para analytics - rastrear cliques sem redirecionamento
export async function PUT(request: NextRequest) {
    try {
        const body = await request.json()
        const trackingSchema = z.object({
            context: z.string(),
            page: z.string(),
            action: z.enum(['click', 'view', 'copy']),
            userData: z.object({
                hasName: z.boolean(),
                hasEmail: z.boolean(),
                hasPhone: z.boolean(),
            }).optional(),
            timestamp: z.string().optional(),
        })
        const validatedData = trackingSchema.parse(body)
        // Registrar evento de tracking
        console.log('WHATSAPP_TRACKING:', JSON.stringify({
            ...validatedData,
            timestamp: validatedData.timestamp || new Date().toISOString(),
            userAgent: request.headers.get('user-agent'),
            referer: request.headers.get('referer'),
            source: 'whatsapp_tracking_api'
        }))
        return NextResponse.json({
            success: true,
            tracked: true,
            timestamp: new Date().toISOString()
        })
    } catch (error) {
        console.error('Erro no tracking do WhatsApp:', error)
        if (error instanceof z.ZodError) {
            return NextResponse.json(
                { error: 'Dados de tracking inválidos' },
                { status: 400 }
            )
        }
        return NextResponse.json(
            { error: 'Erro no tracking' },
            { status: 500 }
        )
    }
}