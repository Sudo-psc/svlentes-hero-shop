import { z } from 'zod'
import {
    validateCPF as validateCPFBase,
    formatCPF as formatCPFBase,
    formatPhone as formatPhoneBase,
} from './validators'

// Schema para dados de lead (formulário do hero)
export const leadFormSchema = z.object({
    nome: z.string()
        .min(2, 'Nome deve ter pelo menos 2 caracteres')
        .max(100, 'Nome deve ter no máximo 100 caracteres'),
    whatsapp: z.string()
        .min(10, 'WhatsApp deve ter pelo menos 10 dígitos')
        .max(15, 'WhatsApp deve ter no máximo 15 dígitos')
        .regex(/^[\d\s\(\)\-\+]+$/, 'WhatsApp deve conter apenas números e símbolos válidos'),
    email: z.string()
        .email('Email inválido')
        .max(255, 'Email deve ter no máximo 255 caracteres'),
    lgpdConsent: z.boolean()
        .refine(val => val === true, 'Você deve aceitar os termos de privacidade')
})

// Schema para dados da calculadora de economia
export const calculatorSchema = leadFormSchema.extend({
    currentSpending: z.number()
        .min(0, 'Gasto atual deve ser positivo')
        .max(10000, 'Valor muito alto'),
    lensType: z.enum(['daily', 'weekly', 'monthly'], {
        errorMap: () => ({ message: 'Tipo de lente inválido' })
    }),
    usage: z.enum(['occasional', 'regular', 'daily'], {
        errorMap: () => ({ message: 'Padrão de uso inválido' })
    })
})

// Schema para dados pessoais completos
export const personalInfoSchema = z.object({
    fullName: z.string()
        .min(5, 'Nome completo deve ter pelo menos 5 caracteres')
        .max(200, 'Nome completo deve ter no máximo 200 caracteres'),
    cpf: z.string()
        .length(11, 'CPF deve ter 11 dígitos')
        .regex(/^\d{11}$/, 'CPF deve conter apenas números'),
    birthDate: z.string()
        .regex(/^\d{4}-\d{2}-\d{2}$/, 'Data deve estar no formato YYYY-MM-DD'),
    address: z.object({
        cep: z.string()
            .length(8, 'CEP deve ter 8 dígitos')
            .regex(/^\d{8}$/, 'CEP deve conter apenas números'),
        street: z.string()
            .min(5, 'Endereço deve ter pelo menos 5 caracteres')
            .max(200, 'Endereço deve ter no máximo 200 caracteres'),
        number: z.string()
            .min(1, 'Número é obrigatório')
            .max(10, 'Número deve ter no máximo 10 caracteres'),
        complement: z.string()
            .max(100, 'Complemento deve ter no máximo 100 caracteres')
            .optional(),
        city: z.string()
            .min(2, 'Cidade deve ter pelo menos 2 caracteres')
            .max(100, 'Cidade deve ter no máximo 100 caracteres'),
        state: z.string()
            .length(2, 'Estado deve ter 2 caracteres')
            .regex(/^[A-Z]{2}$/, 'Estado deve ser uma sigla válida (ex: SP)')
    })
})

// Schema para dados de prescrição médica
export const prescriptionSchema = z.object({
    hasValidPrescription: z.boolean(),
    prescriptionFile: z.any().optional(), // File será validado no frontend
    rightEye: z.object({
        sphere: z.number()
            .min(-20, 'Esfera deve estar entre -20 e +20')
            .max(20, 'Esfera deve estar entre -20 e +20'),
        cylinder: z.number()
            .min(-10, 'Cilindro deve estar entre -10 e +10')
            .max(10, 'Cilindro deve estar entre -10 e +10'),
        axis: z.number()
            .min(0, 'Eixo deve estar entre 0 e 180')
            .max(180, 'Eixo deve estar entre 0 e 180')
    }),
    leftEye: z.object({
        sphere: z.number()
            .min(-20, 'Esfera deve estar entre -20 e +20')
            .max(20, 'Esfera deve estar entre -20 e +20'),
        cylinder: z.number()
            .min(-10, 'Cilindro deve estar entre -10 e +10')
            .max(10, 'Cilindro deve estar entre -10 e +10'),
        axis: z.number()
            .min(0, 'Eixo deve estar entre 0 e 180')
            .max(180, 'Eixo deve estar entre 0 e 180')
    }),
    prescriptionDate: z.string()
        .regex(/^\d{4}-\d{2}-\d{2}$/, 'Data deve estar no formato YYYY-MM-DD'),
    doctorName: z.string()
        .min(5, 'Nome do médico deve ter pelo menos 5 caracteres')
        .max(200, 'Nome do médico deve ter no máximo 200 caracteres'),
    needsConsultation: z.boolean()
})

// Schema para preferências do cliente
export const preferencesSchema = z.object({
    lensType: z.enum(['daily', 'weekly', 'monthly'], {
        errorMap: () => ({ message: 'Tipo de lente inválido' })
    }),
    deliveryFrequency: z.enum(['monthly', 'quarterly', 'semiannual'], {
        errorMap: () => ({ message: 'Frequência de entrega inválida' })
    }),
    specialNeeds: z.string()
        .max(500, 'Necessidades especiais devem ter no máximo 500 caracteres')
        .optional(),
    addOns: z.array(z.string())
        .max(10, 'Máximo de 10 add-ons permitidos')
})

// Schema completo para formulário de assinatura
export const subscriptionFormSchema = z.object({
    leadInfo: leadFormSchema,
    personalInfo: personalInfoSchema,
    prescription: prescriptionSchema,
    preferences: preferencesSchema,
    selectedPlan: z.enum(['basic', 'premium', 'vip'], {
        errorMap: () => ({ message: 'Plano selecionado inválido' })
    })
})

// Schema para contato via WhatsApp
export const whatsappContactSchema = z.object({
    type: z.enum(['lead', 'consultation', 'support'], {
        errorMap: () => ({ message: 'Tipo de contato inválido' })
    }),
    userData: leadFormSchema.partial(),
    context: z.object({
        page: z.string().min(1, 'Página é obrigatória'),
        planInterest: z.string().optional(),
        calculatedEconomy: z.number().optional()
    }),
    prefilledMessage: z.string()
        .min(10, 'Mensagem deve ter pelo menos 10 caracteres')
        .max(1000, 'Mensagem deve ter no máximo 1000 caracteres')
})

// Função para validar CEP
export function validateCEP(cep: string): boolean {
    const cleanCEP = cep.replace(/\D/g, '')
    return /^\d{8}$/.test(cleanCEP)
}

// Função para formatar CEP
export function formatCEP(cep: string): string {
    const cleanCEP = cep.replace(/\D/g, '')
    return cleanCEP.replace(/(\d{5})(\d{3})/, '$1-$2')
}

export const validateCPF = validateCPFBase
export const formatCPF = formatCPFBase
export const formatPhone = formatPhoneBase

// Tipos derivados dos schemas
export type LeadFormData = z.infer<typeof leadFormSchema>
export type CalculatorData = z.infer<typeof calculatorSchema>
export type PersonalInfoData = z.infer<typeof personalInfoSchema>
export type PrescriptionData = z.infer<typeof prescriptionSchema>
export type PreferencesData = z.infer<typeof preferencesSchema>
export type SubscriptionFormData = z.infer<typeof subscriptionFormSchema>
export type WhatsAppContactData = z.infer<typeof whatsappContactSchema>