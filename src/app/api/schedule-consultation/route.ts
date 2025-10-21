import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import {
    leadFormSchema,
    personalInfoSchema,
    prescriptionSchema,
    preferencesSchema
} from '@/lib/validations'
// Schema para dados de agendamento
const schedulingSchema = z.object({
    preferredDate: z.string().min(1, 'Data preferida é obrigatória'),
    preferredTime: z.enum(['morning', 'afternoon', 'evening']),
    consultationType: z.enum(['initial', 'followup', 'emergency']),
    additionalNotes: z.string().max(500).optional()
})
// Schema completo para o endpoint
const scheduleConsultationSchema = z.object({
    leadInfo: leadFormSchema,
    personalInfo: personalInfoSchema,
    prescription: prescriptionSchema,
    preferences: preferencesSchema,
    selectedPlan: z.enum(['basic', 'premium', 'vip']),
    scheduling: schedulingSchema
})
export async function POST(request: NextRequest) {
    try {
        const body = await request.json()
        // Validar dados recebidos
        const validatedData = scheduleConsultationSchema.parse(body)
        // Gerar ID único para o agendamento
        const schedulingId = `SCH-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
        // Aqui seria a integração com o sistema de agendamento real
        // Por exemplo: Google Calendar API, sistema interno, etc.
        // Simular processamento do agendamento
        const schedulingData = {
            id: schedulingId,
            ...validatedData,
            status: 'pending',
            createdAt: new Date().toISOString(),
            estimatedConfirmationTime: '24 horas'
        }
        // Log para desenvolvimento (em produção, salvar no banco de dados)
        console.log('Novo agendamento criado:', {
            id: schedulingId,
            patient: validatedData.leadInfo.nome,
            email: validatedData.leadInfo.email,
            phone: validatedData.leadInfo.whatsapp,
            plan: validatedData.selectedPlan,
            preferredDate: validatedData.scheduling.preferredDate,
            preferredTime: validatedData.scheduling.preferredTime,
            consultationType: validatedData.scheduling.consultationType,
            needsConsultation: validatedData.prescription.needsConsultation,
            hasValidPrescription: validatedData.prescription.hasValidPrescription
        })
        // Enviar notificações (email, WhatsApp, etc.)
        await sendSchedulingNotifications(schedulingData)
        // Retornar sucesso
        return NextResponse.json({
            success: true,
            schedulingId,
            message: 'Agendamento criado com sucesso',
            estimatedConfirmation: '24 horas',
            nextSteps: [
                'Você receberá uma confirmação por email em até 24 horas',
                'Nossa equipe entrará em contato via WhatsApp para confirmar',
                'Prepare seus documentos e prescrição médica (se tiver)'
            ]
        })
    } catch (error) {
        console.error('Erro ao processar agendamento:', error)
        if (error instanceof z.ZodError) {
            return NextResponse.json({
                success: false,
                error: 'Dados inválidos',
                details: error.errors
            }, { status: 400 })
        }
        return NextResponse.json({
            success: false,
            error: 'Erro interno do servidor'
        }, { status: 500 })
    }
}
// Função para enviar notificações
async function sendSchedulingNotifications(schedulingData: any) {
    try {
        // Notificação por email (implementar com seu provedor de email)
        await sendEmailNotification(schedulingData)
        // Notificação via WhatsApp (implementar com WhatsApp Business API)
        await sendWhatsAppNotification(schedulingData)
        // Notificação interna para a equipe médica
        await sendInternalNotification(schedulingData)
    } catch (error) {
        console.error('Erro ao enviar notificações:', error)
        // Não falhar o agendamento se as notificações falharem
    }
}
// Placeholder para notificação por email
async function sendEmailNotification(schedulingData: any) {
    // Implementar integração com provedor de email (SendGrid, AWS SES, etc.)
    const emailContent = {
        to: schedulingData.leadInfo.email,
        subject: 'Agendamento de Consulta - SVlentes',
        template: 'scheduling-confirmation',
        data: {
            patientName: schedulingData.leadInfo.nome,
            schedulingId: schedulingData.id,
            preferredDate: schedulingData.scheduling.preferredDate,
            preferredTime: schedulingData.scheduling.preferredTime,
            planName: schedulingData.selectedPlan,
            doctorName: 'Dr. Philipe Saraiva Cruz',
            doctorCRM: 'CRM 69.870'
        }
    }
    // Aqui seria a chamada real para o provedor de email
    return Promise.resolve(emailContent)
}
// Placeholder para notificação via WhatsApp
async function sendWhatsAppNotification(schedulingData: any) {
    // Implementar integração com WhatsApp Business API
    const whatsappMessage = `
🏥 *SVlentes - Agendamento Confirmado*
Olá ${schedulingData.leadInfo.nome}!
Seu agendamento foi recebido com sucesso:
📅 *Data preferida:* ${new Date(schedulingData.scheduling.preferredDate).toLocaleDateString('pt-BR')}
⏰ *Período:* ${getTimeLabel(schedulingData.scheduling.preferredTime)}
👨‍⚕️ *Médico:* Dr. Philipe Saraiva Cruz (CRM 69.870)
📋 *Tipo:* ${getConsultationTypeLabel(schedulingData.scheduling.consultationType)}
📞 Nossa equipe entrará em contato em até 24h para confirmar o horário exato.
*ID do Agendamento:* ${schedulingData.id}
  `.trim()
    // Aqui seria a chamada real para a API do WhatsApp
    return Promise.resolve({ message: whatsappMessage })
}
// Placeholder para notificação interna
async function sendInternalNotification(schedulingData: any) {
    // Notificar equipe médica/administrativa
    const internalData = {
        type: 'new_scheduling',
        schedulingId: schedulingData.id,
        patient: {
            name: schedulingData.leadInfo.nome,
            email: schedulingData.leadInfo.email,
            phone: schedulingData.leadInfo.whatsapp,
            cpf: schedulingData.personalInfo.cpf
        },
        scheduling: schedulingData.scheduling,
        prescription: schedulingData.prescription,
        plan: schedulingData.selectedPlan,
        priority: schedulingData.scheduling.consultationType === 'emergency' ? 'high' : 'normal'
    }
    // Aqui seria a integração com sistema interno (Slack, email interno, etc.)
    return Promise.resolve(internalData)
}
// Funções auxiliares para labels
function getTimeLabel(time: string): string {
    const labels = {
        morning: 'Manhã (8h às 12h)',
        afternoon: 'Tarde (13h às 17h)',
        evening: 'Noite (18h às 20h)'
    }
    return labels[time as keyof typeof labels] || time
}
function getConsultationTypeLabel(type: string): string {
    const labels = {
        initial: 'Consulta Inicial',
        followup: 'Retorno',
        emergency: 'Urgência'
    }
    return labels[type as keyof typeof labels] || type
}