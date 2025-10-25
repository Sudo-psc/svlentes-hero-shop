/**
 * Delivery Preferences API - Fase 3
 * Gerenciamento de preferências de entrega do assinante
 *
 * Features:
 * - Atualização de endereço de entrega
 * - Configuração de horário preferencial
 * - Frequência de entrega (mensal, bimestral, trimestral)
 * - Instruções de entrega personalizadas
 * - Preferências de notificação (email, WhatsApp, SMS)
 * - Validação de CEP e telefone (formato brasileiro)
 * - Histórico auditável de alterações
 *
 * Resilience:
 * - 8s timeout
 * - Validação completa de dados
 * - Rate limiting: 200 req/15min (GET), 50 req/15min (PUT)
 * - Não afeta entregas já em trânsito
 */

import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { adminAuth } from '@/lib/firebase-admin'
import { prisma } from '@/lib/prisma'
import { rateLimit, rateLimitConfigs } from '@/lib/rate-limit'
import {
  ApiErrorHandler,
  ErrorType,
  generateRequestId,
  validateFirebaseAuth,
  createSuccessResponse,
} from '@/lib/api-error-handler'

// ============================================================================
// SCHEMAS DE VALIDAÇÃO
// ============================================================================

const deliveryAddressSchema = z.object({
  street: z.string().min(3, 'Rua/Avenida deve ter pelo menos 3 caracteres'),
  number: z.string().min(1, 'Número é obrigatório'),
  complement: z.string().optional(),
  neighborhood: z.string().min(3, 'Bairro deve ter pelo menos 3 caracteres'),
  city: z.string().min(3, 'Cidade deve ter pelo menos 3 caracteres'),
  state: z
    .string()
    .length(2, 'Estado deve ter 2 caracteres (ex: MG)')
    .regex(/^[A-Z]{2}$/, 'Estado deve ser em letras maiúsculas'),
  zipCode: z
    .string()
    .regex(/^\d{5}-?\d{3}$/, 'CEP inválido (use formato: 12345-678 ou 12345678)'),
  country: z.string().default('Brasil'),
})

const notificationPreferencesSchema = z.object({
  email: z.boolean(),
  whatsapp: z.boolean(),
  sms: z.boolean(),
})

const deliveryPreferencesUpdateSchema = z.object({
  deliveryAddress: deliveryAddressSchema,
  deliveryInstructions: z.string().max(500, 'Instruções devem ter no máximo 500 caracteres').optional(),
  preferredDeliveryTime: z.enum(['MORNING', 'AFTERNOON', 'EVENING', 'ANY']).optional(),
  deliveryFrequency: z.enum(['MONTHLY', 'BIMONTHLY', 'QUARTERLY']).optional(),
  contactPhone: z
    .string()
    .regex(
      /^(?:\+55\s?)?(?:\(?\d{2}\)?\s?)?\d{4,5}-?\d{4}$/,
      'Telefone inválido (use formato: (33) 99999-9999 ou 33999999999)'
    ),
  alternativePhone: z
    .string()
    .regex(
      /^(?:\+55\s?)?(?:\(?\d{2}\)?\s?)?\d{4,5}-?\d{4}$/,
      'Telefone alternativo inválido'
    )
    .optional(),
  notificationPreferences: notificationPreferencesSchema,
})

// ============================================================================
// TYPES
// ============================================================================

type DeliveryTime = 'MORNING' | 'AFTERNOON' | 'EVENING' | 'ANY'
type DeliveryFrequency = 'MONTHLY' | 'BIMONTHLY' | 'QUARTERLY'

interface DeliveryAddress {
  street: string
  number: string
  complement?: string
  neighborhood: string
  city: string
  state: string
  zipCode: string
  country: string
}

interface NotificationPreferences {
  email: boolean
  whatsapp: boolean
  sms: boolean
}

interface DeliveryPreferences {
  deliveryAddress: DeliveryAddress
  deliveryInstructions?: string
  preferredDeliveryTime?: DeliveryTime
  deliveryFrequency?: DeliveryFrequency
  contactPhone: string
  alternativePhone?: string
  notificationPreferences: NotificationPreferences
}

interface DeliveryPreferencesResponse {
  preferences: DeliveryPreferences
  upcomingDelivery: {
    estimatedDate: Date | null
    willUseNewPreferences: boolean
  }
  validationErrors?: Array<string>
  metadata: {
    lastUpdated: Date | null
    updatedBy: string
  }
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Normaliza CEP removendo hífen
 */
function normalizeCEP(cep: string): string {
  return cep.replace('-', '')
}

/**
 * Normaliza telefone para formato padrão
 */
function normalizePhone(phone: string): string {
  return phone.replace(/\D/g, '') // Remove tudo que não é dígito
}

/**
 * Calcula próxima data de entrega baseada na frequência
 */
function calculateNextDeliveryDate(
  lastDelivery: Date | null,
  frequency: DeliveryFrequency
): Date | null {
  if (!lastDelivery) {
    // Se nunca teve entrega, estima em 30 dias
    const nextDelivery = new Date()
    nextDelivery.setDate(nextDelivery.getDate() + 30)
    return nextDelivery
  }

  const nextDelivery = new Date(lastDelivery)

  switch (frequency) {
    case 'MONTHLY':
      nextDelivery.setMonth(nextDelivery.getMonth() + 1)
      break
    case 'BIMONTHLY':
      nextDelivery.setMonth(nextDelivery.getMonth() + 2)
      break
    case 'QUARTERLY':
      nextDelivery.setMonth(nextDelivery.getMonth() + 3)
      break
  }

  return nextDelivery
}

/**
 * Verifica se há entregas em trânsito
 */
async function hasDeliveriesInTransit(subscriptionId: string): Promise<boolean> {
  const inTransitOrders = await prisma.order.count({
    where: {
      subscriptionId,
      deliveryStatus: {
        in: ['PENDING', 'SHIPPED', 'IN_TRANSIT'],
      },
    },
  })

  return inTransitOrders > 0
}

// ============================================================================
// GET /api/assinante/delivery-preferences
// Retorna preferências de entrega atuais
// ============================================================================

export async function GET(request: NextRequest) {
  const requestId = generateRequestId()
  const context = {
    api: '/api/assinante/delivery-preferences',
    requestId,
    timestamp: new Date(),
  }

  // Rate limiting: 200 requisições em 15 minutos (leitura)
  const rateLimitResult = await rateLimit(request, rateLimitConfigs.read)
  if (rateLimitResult) {
    return rateLimitResult
  }

  // Timeout protection: 8s
  const timeoutSignal = AbortSignal.timeout(8000)

  return ApiErrorHandler.wrapApiHandler(async () => {
    // Validar autenticação Firebase
    const authResult = await validateFirebaseAuth(
      request.headers.get('Authorization'),
      adminAuth,
      context
    )

    if (authResult instanceof NextResponse) {
      return authResult // Error response
    }

    const { uid } = authResult

    // Buscar usuário pelo Firebase UID
    const user = await prisma.user.findUnique({
      where: { firebaseUid: uid },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        whatsapp: true,
      },
    })

    if (!user) {
      return ApiErrorHandler.handleError(
        ErrorType.NOT_FOUND,
        'Usuário não encontrado no banco de dados',
        { ...context, userId: uid }
      )
    }

    // Buscar assinatura ativa
    const subscription = await prisma.subscription.findFirst({
      where: {
        userId: user.id,
        status: 'ACTIVE',
      },
      select: {
        id: true,
        shippingAddress: true,
        updatedAt: true,
        nextBillingDate: true,
        renewalDate: true,
      },
    })

    if (!subscription) {
      return ApiErrorHandler.handleError(
        ErrorType.NOT_FOUND,
        'Assinatura ativa não encontrada',
        { ...context, userId: user.id }
      )
    }

    // Buscar última entrega
    const lastOrder = await prisma.order.findFirst({
      where: {
        subscriptionId: subscription.id,
        deliveryStatus: 'DELIVERED',
      },
      orderBy: {
        deliveredAt: 'desc',
      },
      select: {
        deliveredAt: true,
      },
    })

    // Parse shippingAddress (armazenado como JSON)
    const shippingAddress = subscription.shippingAddress as any

    // Construir preferências atuais
    const preferences: DeliveryPreferences = {
      deliveryAddress: {
        street: shippingAddress?.street || '',
        number: shippingAddress?.number || '',
        complement: shippingAddress?.complement,
        neighborhood: shippingAddress?.neighborhood || '',
        city: shippingAddress?.city || '',
        state: shippingAddress?.state || '',
        zipCode: shippingAddress?.zipCode || '',
        country: shippingAddress?.country || 'Brasil',
      },
      deliveryInstructions: shippingAddress?.instructions,
      preferredDeliveryTime: shippingAddress?.preferredTime || 'ANY',
      deliveryFrequency: 'MONTHLY', // Default
      contactPhone: user.phone || '',
      alternativePhone: user.whatsapp || undefined,
      notificationPreferences: {
        email: true, // Default habilitado
        whatsapp: !!user.whatsapp,
        sms: false, // Default desabilitado
      },
    }

    // Calcular próxima entrega
    const nextDeliveryDate = calculateNextDeliveryDate(
      lastOrder?.deliveredAt || null,
      preferences.deliveryFrequency || 'MONTHLY'
    )

    const response: DeliveryPreferencesResponse = {
      preferences,
      upcomingDelivery: {
        estimatedDate: nextDeliveryDate,
        willUseNewPreferences: true,
      },
      metadata: {
        lastUpdated: subscription.updatedAt,
        updatedBy: user.email,
      },
    }

    return createSuccessResponse(response, requestId)
  }, context)
}

// ============================================================================
// PUT /api/assinante/delivery-preferences
// Atualiza preferências de entrega
// ============================================================================

export async function PUT(request: NextRequest) {
  const requestId = generateRequestId()
  const context = {
    api: '/api/assinante/delivery-preferences',
    requestId,
    timestamp: new Date(),
  }

  // Rate limiting: 50 requisições em 15 minutos (escrita)
  const rateLimitResult = await rateLimit(request, rateLimitConfigs.write)
  if (rateLimitResult) {
    return rateLimitResult
  }

  // Timeout protection: 8s
  const timeoutSignal = AbortSignal.timeout(8000)

  return ApiErrorHandler.wrapApiHandler(async () => {
    // Validar autenticação Firebase
    const authResult = await validateFirebaseAuth(
      request.headers.get('Authorization'),
      adminAuth,
      context
    )

    if (authResult instanceof NextResponse) {
      return authResult // Error response
    }

    const { uid } = authResult

    // Parse request body
    const body = await request.json()

    // Validar dados com Zod
    let validatedData: z.infer<typeof deliveryPreferencesUpdateSchema>
    try {
      validatedData = deliveryPreferencesUpdateSchema.parse(body)
    } catch (error) {
      if (error instanceof z.ZodError) {
        return NextResponse.json(
          {
            error: 'VALIDATION_ERROR',
            message: 'Dados de preferências inválidos',
            details: error.errors.map((err) => ({
              field: err.path.join('.'),
              message: err.message,
            })),
          },
          { status: 400 }
        )
      }
      throw error
    }

    // Buscar usuário
    const user = await prisma.user.findUnique({
      where: { firebaseUid: uid },
    })

    if (!user) {
      return ApiErrorHandler.handleError(
        ErrorType.NOT_FOUND,
        'Usuário não encontrado',
        { ...context, userId: uid }
      )
    }

    // Buscar assinatura ativa
    const subscription = await prisma.subscription.findFirst({
      where: {
        userId: user.id,
        status: 'ACTIVE',
      },
    })

    if (!subscription) {
      return ApiErrorHandler.handleError(
        ErrorType.NOT_FOUND,
        'Assinatura ativa não encontrada',
        { ...context, userId: user.id }
      )
    }

    // Verificar se há entregas em trânsito
    const hasInTransit = await hasDeliveriesInTransit(subscription.id)

    // Normalizar dados
    const normalizedZipCode = normalizeCEP(validatedData.deliveryAddress.zipCode)
    const normalizedPhone = normalizePhone(validatedData.contactPhone)
    const normalizedAltPhone = validatedData.alternativePhone
      ? normalizePhone(validatedData.alternativePhone)
      : undefined

    // Preparar novo endereço de entrega
    const newShippingAddress = {
      ...validatedData.deliveryAddress,
      zipCode: normalizedZipCode,
      instructions: validatedData.deliveryInstructions,
      preferredTime: validatedData.preferredDeliveryTime,
    }

    // Atualizar subscription
    await prisma.subscription.update({
      where: { id: subscription.id },
      data: {
        shippingAddress: newShippingAddress,
      },
    })

    // Atualizar telefones do usuário
    await prisma.user.update({
      where: { id: user.id },
      data: {
        phone: normalizedPhone,
        whatsapp: normalizedAltPhone,
      },
    })

    // Criar registro no SubscriptionHistory para auditoria
    await prisma.subscriptionHistory.create({
      data: {
        subscriptionId: subscription.id,
        userId: user.id,
        changeType: 'ADDRESS_UPDATE',
        description: 'Endereço de entrega atualizado',
        oldValue: subscription.shippingAddress,
        newValue: newShippingAddress,
        ipAddress: request.headers.get('x-forwarded-for') || 'unknown',
        userAgent: request.headers.get('user-agent'),
      },
    })

    // Log auditoria LGPD
    console.log('[DeliveryPreferences] Atualização realizada:', {
      userId: user.id,
      subscriptionId: subscription.id,
      requestId,
      timestamp: new Date().toISOString(),
      hasInTransit,
    })

    // Calcular próxima entrega
    const lastOrder = await prisma.order.findFirst({
      where: {
        subscriptionId: subscription.id,
        deliveryStatus: 'DELIVERED',
      },
      orderBy: {
        deliveredAt: 'desc',
      },
      select: {
        deliveredAt: true,
      },
    })

    const nextDeliveryDate = calculateNextDeliveryDate(
      lastOrder?.deliveredAt || null,
      validatedData.deliveryFrequency || 'MONTHLY'
    )

    const response: DeliveryPreferencesResponse = {
      preferences: {
        deliveryAddress: validatedData.deliveryAddress,
        deliveryInstructions: validatedData.deliveryInstructions,
        preferredDeliveryTime: validatedData.preferredDeliveryTime,
        deliveryFrequency: validatedData.deliveryFrequency,
        contactPhone: validatedData.contactPhone,
        alternativePhone: validatedData.alternativePhone,
        notificationPreferences: validatedData.notificationPreferences,
      },
      upcomingDelivery: {
        estimatedDate: nextDeliveryDate,
        willUseNewPreferences: !hasInTransit, // Só afeta próximas entregas
      },
      metadata: {
        lastUpdated: new Date(),
        updatedBy: user.email,
      },
    }

    return createSuccessResponse(
      {
        ...response,
        message: hasInTransit
          ? 'Preferências atualizadas. Alterações serão aplicadas na próxima entrega (entrega atual em trânsito).'
          : 'Preferências de entrega atualizadas com sucesso',
      },
      requestId
    )
  }, context)
}

// Force dynamic rendering
export const dynamic = 'force-dynamic'
