/**
 * Validation Schemas - Biblioteca Centralizada de Validação Zod
 *
 * Schemas reutilizáveis para validação de dados em toda a aplicação.
 * Todos os schemas incluem mensagens de erro em PT-BR user-friendly.
 *
 * @module validation-schemas
 * @author SV Lentes - Security Enhancement (Issue #121)
 */

import { z } from 'zod'

// ============================================================================
// VALIDAÇÕES BRASILEIRAS (Documentos e Formatos)
// ============================================================================

/**
 * Schema para validação de CEP brasileiro
 *
 * @example
 * ```typescript
 * brazilianCEPSchema.parse("35300-001") // ✅ válido
 * brazilianCEPSchema.parse("35300001")  // ✅ válido (sem hífen)
 * brazilianCEPSchema.parse("123")       // ❌ inválido
 * ```
 */
export const brazilianCEPSchema = z
  .string()
  .regex(/^\d{5}-?\d{3}$/, 'CEP inválido (use formato: 12345-678 ou 12345678)')
  .transform((cep) => cep.replace('-', '')) // Normaliza removendo hífen

/**
 * Schema para validação de telefone brasileiro
 *
 * Suporta formatos:
 * - (33) 99999-9999
 * - 33999999999
 * - +55 33 99999-9999
 * - (33) 3521-9999 (fixo)
 *
 * @example
 * ```typescript
 * brazilianPhoneSchema.parse("(33) 99989-8026") // ✅ válido
 * brazilianPhoneSchema.parse("33999898026")     // ✅ válido
 * brazilianPhoneSchema.parse("+55 33 99989-8026") // ✅ válido
 * ```
 */
export const brazilianPhoneSchema = z
  .string()
  .regex(
    /^(?:\+55\s?)?(?:\(?\d{2}\)?\s?)?\d{4,5}-?\d{4}$/,
    'Telefone inválido (use formato: (33) 99999-9999 ou 33999999999)'
  )
  .transform((phone) => phone.replace(/\D/g, '')) // Normaliza para apenas dígitos

/**
 * Schema para validação de CPF brasileiro
 *
 * Valida formato e dígitos verificadores segundo algoritmo oficial.
 *
 * @example
 * ```typescript
 * brazilianCPFSchema.parse("123.456.789-09") // ✅ válido se DV correto
 * brazilianCPFSchema.parse("12345678909")    // ✅ válido sem formatação
 * ```
 */
export const brazilianCPFSchema = z
  .string()
  .regex(/^\d{3}\.?\d{3}\.?\d{3}-?\d{2}$/, 'CPF inválido (use formato: 123.456.789-09)')
  .refine(
    (cpf) => {
      // Remove formatação
      const cleanCPF = cpf.replace(/\D/g, '')

      // Verifica se tem 11 dígitos
      if (cleanCPF.length !== 11) return false

      // Verifica se todos os dígitos são iguais (CPF inválido)
      if (/^(\d)\1{10}$/.test(cleanCPF)) return false

      // Validação dos dígitos verificadores
      let sum = 0
      let remainder: number

      // Primeiro dígito verificador
      for (let i = 1; i <= 9; i++) {
        sum += parseInt(cleanCPF.substring(i - 1, i)) * (11 - i)
      }
      remainder = (sum * 10) % 11
      if (remainder === 10 || remainder === 11) remainder = 0
      if (remainder !== parseInt(cleanCPF.substring(9, 10))) return false

      // Segundo dígito verificador
      sum = 0
      for (let i = 1; i <= 10; i++) {
        sum += parseInt(cleanCPF.substring(i - 1, i)) * (12 - i)
      }
      remainder = (sum * 10) % 11
      if (remainder === 10 || remainder === 11) remainder = 0
      if (remainder !== parseInt(cleanCPF.substring(10, 11))) return false

      return true
    },
    { message: 'CPF inválido - dígitos verificadores incorretos' }
  )
  .transform((cpf) => cpf.replace(/\D/g, '')) // Normaliza para apenas dígitos

/**
 * Schema para validação de UF (Estado brasileiro)
 *
 * @example
 * ```typescript
 * brazilianStateSchema.parse("MG") // ✅ válido
 * ```
 */
export const brazilianStateSchema = z
  .string()
  .length(2, 'Estado deve ter 2 caracteres (ex: MG, SP, RJ)')
  .regex(/^[A-Z]{2}$/, 'Estado deve ser em letras maiúsculas (ex: MG)')
  .refine(
    (state) => {
      const validStates = [
        'AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO', 'MA',
        'MT', 'MS', 'MG', 'PA', 'PB', 'PR', 'PE', 'PI', 'RJ', 'RN',
        'RS', 'RO', 'RR', 'SC', 'SP', 'SE', 'TO'
      ]
      return validStates.includes(state)
    },
    { message: 'UF inválida - não é um estado brasileiro válido' }
  )

/**
 * Schema para validação de CRM médico brasileiro
 *
 * Formato: CRM-UF 123456
 *
 * @example
 * ```typescript
 * brazilianCRMSchema.parse("CRM-MG 69870") // ✅ válido
 * ```
 */
export const brazilianCRMSchema = z
  .string()
  .regex(
    /^CRM-[A-Z]{2}\s+\d{4,6}$/,
    'CRM inválido (use formato: CRM-UF 123456)'
  )

// ============================================================================
// ENDEREÇOS E LOCALIZAÇÃO
// ============================================================================

/**
 * Schema para validação de endereço brasileiro completo
 *
 * Inclui validação de CEP, UF, e campos obrigatórios.
 *
 * @example
 * ```typescript
 * brazilianAddressSchema.parse({
 *   street: "Rua das Flores",
 *   number: "123",
 *   complement: "Apt 45",
 *   neighborhood: "Centro",
 *   city: "Caratinga",
 *   state: "MG",
 *   zipCode: "35300-001",
 *   country: "Brasil"
 * })
 * ```
 */
export const brazilianAddressSchema = z.object({
  street: z
    .string()
    .min(3, 'Rua/Avenida deve ter pelo menos 3 caracteres')
    .max(200, 'Rua/Avenida deve ter no máximo 200 caracteres'),
  number: z
    .string()
    .min(1, 'Número é obrigatório')
    .max(10, 'Número deve ter no máximo 10 caracteres'),
  complement: z
    .string()
    .max(100, 'Complemento deve ter no máximo 100 caracteres')
    .optional(),
  neighborhood: z
    .string()
    .min(2, 'Bairro deve ter pelo menos 2 caracteres')
    .max(100, 'Bairro deve ter no máximo 100 caracteres'),
  city: z
    .string()
    .min(2, 'Cidade deve ter pelo menos 2 caracteres')
    .max(100, 'Cidade deve ter no máximo 100 caracteres'),
  state: brazilianStateSchema,
  zipCode: brazilianCEPSchema,
  country: z.string().default('Brasil'),
})

// ============================================================================
// NOTIFICAÇÕES E PREFERÊNCIAS
// ============================================================================

/**
 * Schema para preferências de notificação
 *
 * @example
 * ```typescript
 * notificationPreferencesSchema.parse({
 *   email: true,
 *   whatsapp: true,
 *   sms: false
 * })
 * ```
 */
export const notificationPreferencesSchema = z.object({
  email: z.boolean().default(true),
  whatsapp: z.boolean().default(false),
  sms: z.boolean().default(false),
})

// ============================================================================
// PRESCRIÇÕES MÉDICAS (Oftalmologia)
// ============================================================================

/**
 * Schema para dados oftalmológicos de um olho
 *
 * Valida prescrições de lentes de contato segundo padrões CFM.
 *
 * @example
 * ```typescript
 * prescriptionEyeSchema.parse({
 *   sphere: -2.5,
 *   cylinder: -0.75,
 *   axis: 180,
 *   addition: 1.5 // para multifocal
 * })
 * ```
 */
export const prescriptionEyeSchema = z.object({
  sphere: z
    .number()
    .min(-20, 'Esfera deve estar entre -20 e +20')
    .max(20, 'Esfera deve estar entre -20 e +20'),
  cylinder: z
    .number()
    .min(-6, 'Cilindro deve estar entre -6 e +6')
    .max(6, 'Cilindro deve estar entre -6 e +6')
    .optional(),
  axis: z
    .number()
    .min(0, 'Eixo deve estar entre 0 e 180')
    .max(180, 'Eixo deve estar entre 0 e 180')
    .optional(),
  addition: z
    .number()
    .min(0, 'Adição deve estar entre 0 e 4')
    .max(4, 'Adição deve estar entre 0 e 4')
    .optional()
    .describe('Para lentes multifocais'),
})

/**
 * Schema para upload de prescrição médica
 *
 * Valida:
 * - Arquivo em base64 (PDF, JPG, PNG)
 * - Tamanho máximo: 5MB
 * - MIME type correto
 * - Dados do médico (CRM obrigatório)
 * - Dados oftalmológicos para ambos os olhos
 *
 * @example
 * ```typescript
 * prescriptionUploadSchema.parse({
 *   file: "base64-encoded-file...",
 *   fileName: "prescricao_dr_philipe.pdf",
 *   fileSize: 2048576, // 2MB em bytes
 *   mimeType: "application/pdf",
 *   leftEye: { sphere: -2.5, cylinder: -0.75, axis: 180 },
 *   rightEye: { sphere: -3.0, cylinder: -1.0, axis: 175 },
 *   doctorName: "Dr. Philipe Saraiva Cruz",
 *   doctorCRM: "CRM-MG 69870",
 *   prescriptionDate: "2024-10-15T00:00:00.000Z"
 * })
 * ```
 */
export const prescriptionUploadSchema = z.object({
  file: z
    .string()
    .min(1, 'Arquivo é obrigatório')
    .refine(
      (file) => {
        // Verifica se é base64 válido
        try {
          // Base64 válido tem caracteres específicos
          return /^[A-Za-z0-9+/]+=*$/.test(file)
        } catch {
          return false
        }
      },
      { message: 'Arquivo deve estar em formato base64 válido' }
    ),
  fileName: z
    .string()
    .min(1, 'Nome do arquivo é obrigatório')
    .max(255, 'Nome do arquivo deve ter no máximo 255 caracteres')
    .refine(
      (name) => /\.(pdf|jpg|jpeg|png)$/i.test(name),
      { message: 'Nome do arquivo deve terminar com .pdf, .jpg, .jpeg ou .png' }
    ),
  fileSize: z
    .number()
    .positive('Tamanho do arquivo deve ser positivo')
    .max(5 * 1024 * 1024, 'Arquivo deve ter no máximo 5MB'),
  mimeType: z.enum(['application/pdf', 'image/jpeg', 'image/png'], {
    errorMap: () => ({ message: 'Formato inválido. Use PDF, JPG ou PNG' }),
  }),
  leftEye: prescriptionEyeSchema,
  rightEye: prescriptionEyeSchema,
  doctorName: z
    .string()
    .min(1, 'Nome do médico é obrigatório')
    .max(200, 'Nome do médico deve ter no máximo 200 caracteres'),
  doctorCRM: brazilianCRMSchema,
  prescriptionDate: z.string().datetime({ message: 'Data da prescrição deve ser uma data válida no formato ISO 8601' }),
})

/**
 * Schema para atualização de prescrição existente
 *
 * Todos os campos são opcionais exceto prescriptionId.
 */
export const prescriptionUpdateSchema = prescriptionUploadSchema.partial().extend({
  prescriptionId: z.string().cuid({ message: 'ID da prescrição inválido' }),
})

// ============================================================================
// ASSINATURAS E DELIVERY
// ============================================================================

/**
 * Schema para atualização de endereço de entrega da assinatura
 *
 * Usado em PUT /api/assinante/subscription para validar shippingAddress.
 *
 * @example
 * ```typescript
 * subscriptionAddressUpdateSchema.parse({
 *   shippingAddress: {
 *     street: "Rua das Flores",
 *     number: "123",
 *     neighborhood: "Centro",
 *     city: "Caratinga",
 *     state: "MG",
 *     zipCode: "35300-001"
 *   }
 * })
 * ```
 */
export const subscriptionAddressUpdateSchema = z.object({
  shippingAddress: brazilianAddressSchema,
})

/**
 * Schema para preferências de entrega completas
 *
 * Usado em PUT /api/assinante/delivery-preferences.
 */
export const deliveryPreferencesUpdateSchema = z.object({
  deliveryAddress: brazilianAddressSchema,
  deliveryInstructions: z
    .string()
    .max(500, 'Instruções devem ter no máximo 500 caracteres')
    .optional(),
  preferredDeliveryTime: z
    .enum(['MORNING', 'AFTERNOON', 'EVENING', 'ANY'], {
      errorMap: () => ({ message: 'Horário de entrega inválido' }),
    })
    .optional(),
  deliveryFrequency: z
    .enum(['MONTHLY', 'BIMONTHLY', 'QUARTERLY'], {
      errorMap: () => ({ message: 'Frequência de entrega inválida' }),
    })
    .optional(),
  contactPhone: brazilianPhoneSchema,
  alternativePhone: brazilianPhoneSchema.optional(),
  notificationPreferences: notificationPreferencesSchema,
})

// ============================================================================
// TYPE EXPORTS (para TypeScript)
// ============================================================================

export type BrazilianAddress = z.infer<typeof brazilianAddressSchema>
export type NotificationPreferences = z.infer<typeof notificationPreferencesSchema>
export type PrescriptionEye = z.infer<typeof prescriptionEyeSchema>
export type PrescriptionUpload = z.infer<typeof prescriptionUploadSchema>
export type PrescriptionUpdate = z.infer<typeof prescriptionUpdateSchema>
export type SubscriptionAddressUpdate = z.infer<typeof subscriptionAddressUpdateSchema>
export type DeliveryPreferencesUpdate = z.infer<typeof deliveryPreferencesUpdateSchema>
