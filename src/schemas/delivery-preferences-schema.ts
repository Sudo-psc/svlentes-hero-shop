/**
 * Delivery Preferences Schema
 * Zod validation schema for delivery preferences with Brazilian address format
 *
 * Features:
 * - CEP validation and formatting
 * - Brazilian state validation
 * - Phone number validation (BR format)
 * - Address field validation
 * - Transform and sanitize inputs
 */

import { z } from 'zod'
import { BRAZILIAN_STATES, BrazilianState } from '@/lib/cep-validator'

// ============================================================================
// CONSTANTS
// ============================================================================

const CEP_REGEX = /^\d{5}-?\d{3}$/
const PHONE_REGEX = /^\d{10,11}$/

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Clean CEP (remove formatting)
 */
function cleanCEP(cep: string): string {
  return cep.replace(/\D/g, '')
}

/**
 * Format CEP for display
 */
function formatCEP(cep: string): string {
  const cleaned = cleanCEP(cep)
  if (cleaned.length !== 8) return cep
  return `${cleaned.slice(0, 5)}-${cleaned.slice(5)}`
}

/**
 * Clean phone number (remove formatting)
 */
function cleanPhone(phone: string): string {
  return phone.replace(/\D/g, '')
}

/**
 * Format phone for display
 */
function formatPhone(phone: string): string {
  const cleaned = cleanPhone(phone)
  if (cleaned.length === 10) {
    // (11) 1234-5678
    return `(${cleaned.slice(0, 2)}) ${cleaned.slice(2, 6)}-${cleaned.slice(6)}`
  } else if (cleaned.length === 11) {
    // (11) 91234-5678
    return `(${cleaned.slice(0, 2)}) ${cleaned.slice(2, 7)}-${cleaned.slice(7)}`
  }
  return phone
}

// ============================================================================
// SCHEMAS
// ============================================================================

/**
 * CEP Schema
 */
export const CEPSchema = z
  .string()
  .min(1, 'CEP é obrigatório')
  .regex(CEP_REGEX, 'CEP inválido. Use o formato: 12345-678')
  .transform(cleanCEP)
  .refine((val) => val.length === 8, {
    message: 'CEP deve ter 8 dígitos',
  })

/**
 * Brazilian State Schema
 */
export const BrazilianStateSchema = z.enum(BRAZILIAN_STATES, {
  errorMap: () => ({ message: 'Estado inválido' }),
})

/**
 * Phone Number Schema (Brazilian format)
 */
export const PhoneNumberSchema = z
  .string()
  .min(1, 'Telefone é obrigatório')
  .transform(cleanPhone)
  .refine((val) => PHONE_REGEX.test(val), {
    message: 'Telefone inválido. Use o formato: (11) 98765-4321',
  })
  .refine(
    (val) => {
      // Validate DDD (area code) - must be valid Brazilian DDD
      const ddd = parseInt(val.slice(0, 2))
      return ddd >= 11 && ddd <= 99
    },
    {
      message: 'DDD inválido',
    }
  )

/**
 * Delivery Address Schema
 */
export const DeliveryAddressSchema = z.object({
  zipCode: CEPSchema,

  street: z
    .string()
    .min(3, 'Rua deve ter no mínimo 3 caracteres')
    .max(100, 'Rua muito longa (máximo 100 caracteres)')
    .transform((val) => val.trim()),

  number: z
    .string()
    .min(1, 'Número é obrigatório')
    .max(10, 'Número muito longo')
    .transform((val) => val.trim()),

  complement: z
    .string()
    .max(50, 'Complemento muito longo (máximo 50 caracteres)')
    .optional()
    .transform((val) => val?.trim() || undefined),

  neighborhood: z
    .string()
    .min(2, 'Bairro deve ter no mínimo 2 caracteres')
    .max(50, 'Bairro muito longo (máximo 50 caracteres)')
    .transform((val) => val.trim()),

  city: z
    .string()
    .min(2, 'Cidade deve ter no mínimo 2 caracteres')
    .max(50, 'Cidade muito longa (máximo 50 caracteres)')
    .transform((val) => val.trim()),

  state: BrazilianStateSchema,

  reference: z
    .string()
    .max(100, 'Ponto de referência muito longo (máximo 100 caracteres)')
    .optional()
    .transform((val) => val?.trim() || undefined),
})

export type DeliveryAddress = z.infer<typeof DeliveryAddressSchema>

/**
 * Delivery Contact Schema
 */
export const DeliveryContactSchema = z.object({
  recipientName: z
    .string()
    .min(3, 'Nome deve ter no mínimo 3 caracteres')
    .max(100, 'Nome muito longo (máximo 100 caracteres)')
    .transform((val) => val.trim()),

  phone: PhoneNumberSchema,

  alternativePhone: PhoneNumberSchema.optional(),

  email: z
    .string()
    .email('E-mail inválido')
    .optional()
    .transform((val) => val?.trim().toLowerCase() || undefined),
})

export type DeliveryContact = z.infer<typeof DeliveryContactSchema>

/**
 * Delivery Instructions Schema
 */
export const DeliveryInstructionsSchema = z.object({
  preferredDeliveryTime: z
    .enum(['morning', 'afternoon', 'evening', 'anytime'], {
      errorMap: () => ({ message: 'Horário de entrega inválido' }),
    })
    .optional(),

  leaveWithReceptionist: z.boolean().optional().default(false),

  requiresSignature: z.boolean().optional().default(true),

  specialInstructions: z
    .string()
    .max(500, 'Instruções muito longas (máximo 500 caracteres)')
    .optional()
    .transform((val) => val?.trim() || undefined),
})

export type DeliveryInstructions = z.infer<typeof DeliveryInstructionsSchema>

/**
 * Complete Delivery Preferences Schema
 */
export const DeliveryPreferencesSchema = z.object({
  deliveryAddress: DeliveryAddressSchema,
  deliveryContact: DeliveryContactSchema,
  deliveryInstructions: DeliveryInstructionsSchema.optional(),
  notifyByWhatsApp: z.boolean().optional().default(true),
  notifyByEmail: z.boolean().optional().default(false),
  notifyBySms: z.boolean().optional().default(false),
})

export type DeliveryPreferences = z.infer<typeof DeliveryPreferencesSchema>

// ============================================================================
// PARTIAL SCHEMAS (for updates)
// ============================================================================

export const PartialDeliveryAddressSchema = DeliveryAddressSchema.partial()
export const PartialDeliveryContactSchema = DeliveryContactSchema.partial()
export const PartialDeliveryPreferencesSchema = DeliveryPreferencesSchema.partial()

// ============================================================================
// VALIDATION HELPERS
// ============================================================================

/**
 * Validate delivery preferences
 */
export function validateDeliveryPreferences(
  data: unknown
): { success: true; data: DeliveryPreferences } | { success: false; errors: string[] } {
  try {
    const validated = DeliveryPreferencesSchema.parse(data)
    return { success: true, data: validated }
  } catch (error) {
    if (error instanceof z.ZodError) {
      const errors = error.errors.map((err) => {
        const field = err.path.join('.')
        return `${field}: ${err.message}`
      })
      return { success: false, errors }
    }
    return { success: false, errors: ['Erro de validação desconhecido'] }
  }
}

/**
 * Sanitize delivery preferences for display (remove sensitive data)
 */
export function sanitizeDeliveryPreferencesForDisplay(
  data: DeliveryPreferences
): DeliveryPreferences {
  return {
    ...data,
    deliveryContact: {
      ...data.deliveryContact,
      // Mask phone numbers
      phone: formatPhone(data.deliveryContact.phone),
      alternativePhone: data.deliveryContact.alternativePhone
        ? formatPhone(data.deliveryContact.alternativePhone)
        : undefined,
    },
    deliveryAddress: {
      ...data.deliveryAddress,
      // Format CEP
      zipCode: formatCEP(data.deliveryAddress.zipCode),
    },
  }
}

/**
 * Create empty delivery preferences
 */
export function createEmptyDeliveryPreferences(): Partial<DeliveryPreferences> {
  return {
    deliveryAddress: {
      zipCode: '',
      street: '',
      number: '',
      neighborhood: '',
      city: '',
      state: undefined,
    } as any,
    deliveryContact: {
      recipientName: '',
      phone: '',
    } as any,
    deliveryInstructions: {
      leaveWithReceptionist: false,
      requiresSignature: true,
    },
    notifyByWhatsApp: true,
    notifyByEmail: false,
    notifyBySms: false,
  }
}

// ============================================================================
// DISPLAY FORMATTERS
// ============================================================================

/**
 * Format address for single-line display
 */
export function formatAddressOneLine(address: DeliveryAddress): string {
  const parts = [
    `${address.street}, ${address.number}`,
    address.complement,
    address.neighborhood,
    `${address.city} - ${address.state}`,
    formatCEP(address.zipCode),
  ].filter(Boolean)

  return parts.join(', ')
}

/**
 * Format address for multi-line display
 */
export function formatAddressMultiLine(address: DeliveryAddress): string[] {
  return [
    `${address.street}, ${address.number}`,
    address.complement || '',
    `${address.neighborhood} - ${address.city}/${address.state}`,
    `CEP: ${formatCEP(address.zipCode)}`,
  ].filter(Boolean)
}
