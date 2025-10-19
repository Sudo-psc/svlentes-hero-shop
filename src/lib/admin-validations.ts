/**
 * Validações Zod para APIs Administrativas
 * Fornece schemas de validação para requests e responses
 */

import { z } from 'zod'
import { SubscriptionStatus, PaymentStatus, SupportCategory, SupportPriority, SupportStatus, DeliveryStatus } from '@prisma/client'

// Enums baseados no Prisma
const subscriptionStatusEnum = z.enum([
  'PENDING_ACTIVATION',
  'ACTIVE',
  'OVERDUE',
  'SUSPENDED',
  'PAUSED',
  'CANCELLED',
  'EXPIRED',
  'REFUNDED',
  'PENDING'
])

const paymentStatusEnum = z.enum([
  'PENDING',
  'RECEIVED',
  'CONFIRMED',
  'OVERDUE',
  'REFUNDED',
  'REFUND_REQUESTED',
  'CHARGEBACK_REQUESTED',
  'CHARGEBACK_DISPUTE',
  'AWAITING_CHARGEBACK_REVERSAL',
  'DUNNING_REQUESTED',
  'DUNNING_RECEIVED',
  'AWAITING_RISK_ANALYSIS',
  'CANCELLED'
])

const supportCategoryEnum = z.enum([
  'BILLING',
  'TECHNICAL',
  'PRODUCT',
  'DELIVERY',
  'ACCOUNT',
  'COMPLAINT',
  'COMPLIMENT',
  'EMERGENCY',
  'GENERAL'
])

const supportPriorityEnum = z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT', 'CRITICAL'])
const supportStatusEnum = z.enum(['OPEN', 'IN_PROGRESS', 'PENDING_CUSTOMER', 'PENDING_AGENT', 'RESOLVED', 'CLOSED', 'ESCALATED'])
const deliveryStatusEnum = z.enum(['PENDING', 'SHIPPED', 'IN_TRANSIT', 'DELIVERED', 'CANCELLED'])

// Auth Schemas
export const loginSchema = z.object({
  email: z.string().email('Email inválido'),
  password: z.string().min(1, 'Senha é obrigatória')
})

export const refreshTokenSchema = z.object({
  refreshToken: z.string().min(1, 'Refresh token é obrigatório')
})

// Customer/Client Schemas
export const customerCreateSchema = z.object({
  email: z.string().email('Email inválido'),
  name: z.string().min(2, 'Nome deve ter pelo menos 2 caracteres'),
  phone: z.string().optional(),
  whatsapp: z.string().optional(),
  role: z.string().optional().default('subscriber'),
  metadata: z.record(z.any()).optional()
})

export const customerUpdateSchema = z.object({
  name: z.string().min(2, 'Nome deve ter pelo menos 2 caracteres').optional(),
  phone: z.string().optional(),
  whatsapp: z.string().optional(),
  role: z.string().optional(),
  metadata: z.record(z.any()).optional()
})

export const customerSearchSchema = z.object({
  query: z.string().min(2, 'Busca deve ter pelo menos 2 caracteres'),
  fields: z.array(z.enum(['name', 'email', 'phone', 'whatsapp'])).optional().default(['name', 'email'])
})

// Subscription Schemas
export const subscriptionCreateSchema = z.object({
  userId: z.string().min(1, 'ID do usuário é obrigatório'),
  planType: z.string().min(1, 'Tipo de plano é obrigatório'),
  monthlyValue: z.number().positive('Valor mensal deve ser positivo'),
  paymentMethod: z.enum(['CREDIT_CARD', 'DEBIT_CARD', 'PIX', 'BOLETO']),
  shippingAddress: z.record(z.any()),
  lensType: z.string().optional(),
  bothEyes: z.boolean().optional().default(false),
  differentGrades: z.boolean().optional().default(false),
  metadata: z.record(z.any()).optional()
})

export const subscriptionUpdateSchema = z.object({
  planType: z.string().optional(),
  monthlyValue: z.number().positive().optional(),
  shippingAddress: z.record(z.any()).optional(),
  lensType: z.string().optional(),
  bothEyes: z.boolean().optional(),
  differentGrades: z.boolean().optional(),
  metadata: z.record(z.any()).optional()
})

export const subscriptionStatusUpdateSchema = z.object({
  status: subscriptionStatusEnum,
  reason: z.string().optional(),
  metadata: z.record(z.any()).optional()
})

// Order Schemas
export const orderCreateSchema = z.object({
  subscriptionId: z.string().min(1, 'ID da assinatura é obrigatório'),
  products: z.array(z.record(z.any())).min(1, 'Ao menos um produto é obrigatório'),
  deliveryAddress: z.record(z.any()),
  totalAmount: z.number().positive('Valor total deve ser positivo'),
  type: z.enum(['subscription', 'one_time']).default('subscription'),
  notes: z.string().optional(),
  estimatedDelivery: z.string().datetime().optional()
})

export const orderStatusUpdateSchema = z.object({
  status: deliveryStatusEnum,
  trackingCode: z.string().optional(),
  notes: z.string().optional(),
  deliveredAt: z.string().datetime().optional()
})

export const orderUpdateSchema = z.object({
  products: z.array(z.record(z.any())).optional(),
  deliveryAddress: z.record(z.any()).optional(),
  totalAmount: z.number().positive().optional(),
  notes: z.string().optional(),
  estimatedDelivery: z.string().datetime().optional(),
  trackingCode: z.string().optional(),
  status: deliveryStatusEnum.optional(),
  deliveredAt: z.string().datetime().optional()
})

// Support Ticket Schemas
export const supportTicketCreateSchema = z.object({
  userId: z.string().min(1, 'ID do usuário é obrigatório'),
  subject: z.string().min(3, 'Assunto deve ter pelo menos 3 caracteres'),
  description: z.string().min(10, 'Descrição deve ter pelo menos 10 caracteres'),
  category: supportCategoryEnum,
  priority: supportPriorityEnum.default('MEDIUM'),
  customerInfo: z.record(z.any()).optional(),
  tags: z.array(z.string()).optional().default([]),
  context: z.record(z.any()).optional()
})

export const supportTicketUpdateSchema = z.object({
  subject: z.string().min(3).optional(),
  description: z.string().min(10).optional(),
  category: supportCategoryEnum.optional(),
  priority: supportPriorityEnum.optional(),
  status: supportStatusEnum.optional(),
  tags: z.array(z.string()).optional(),
  context: z.record(z.any()).optional()
})

export const supportTicketAssignSchema = z.object({
  assignedAgentId: z.string().min(1, 'ID do agente é obrigatório'),
  notes: z.string().optional()
})

// Pagination and Filter Schemas
export const paginationSchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
  sortBy: z.string().default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc')
})

export const dateRangeSchema = z.object({
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional()
}).refine(
  (data) => {
    if (data.startDate && data.endDate) {
      return new Date(data.startDate) <= new Date(data.endDate)
    }
    return true
  },
  {
    message: 'Data inicial deve ser anterior ou igual à data final',
    path: ['endDate']
  }
)

export const customerFiltersSchema = z.object({
  status: z.enum(['active', 'inactive', 'all']).default('all'),
  role: z.string().optional(),
  hasSubscription: z.enum(['yes', 'no', 'all']).default('all'),
  subscriptionStatus: subscriptionStatusEnum.optional(),
  createdAfter: z.string().datetime().optional(),
  createdBefore: z.string().datetime().optional(),
  lastActiveAfter: z.string().datetime().optional()
}).merge(paginationSchema)

export const subscriptionFiltersSchema = z.object({
  status: subscriptionStatusEnum.optional(),
  planType: z.string().optional(),
  paymentMethod: z.enum(['CREDIT_CARD', 'DEBIT_CARD', 'PIX', 'BOLETO']).optional(),
  minMonthlyValue: z.number().positive().optional(),
  maxMonthlyValue: z.number().positive().optional(),
  createdAfter: z.string().datetime().optional(),
  createdBefore: z.string().datetime().optional(),
  nextBillingAfter: z.string().datetime().optional(),
  nextBillingBefore: z.string().datetime().optional(),
  overdueDays: z.number().int().min(0).optional()
}).merge(paginationSchema)

export const orderFiltersSchema = z.object({
  status: deliveryStatusEnum.optional(),
  type: z.enum(['subscription', 'one_time']).optional(),
  subscriptionId: z.string().optional(),
  createdAfter: z.string().datetime().optional(),
  createdBefore: z.string().datetime().optional(),
  deliveredAfter: z.string().datetime().optional(),
  deliveredBefore: z.string().datetime().optional(),
  hasTrackingCode: z.enum(['yes', 'no', 'all']).default('all')
}).merge(paginationSchema)

export const supportTicketFiltersSchema = z.object({
  status: supportStatusEnum.optional(),
  category: supportCategoryEnum.optional(),
  priority: supportPriorityEnum.optional(),
  assignedAgentId: z.string().optional(),
  userId: z.string().optional(),
  createdAfter: z.string().datetime().optional(),
  createdBefore: z.string().datetime().optional(),
  resolvedAfter: z.string().datetime().optional(),
  resolvedBefore: z.string().datetime().optional(),
  hasSlaBreach: z.enum(['yes', 'no', 'all']).default('all')
}).merge(paginationSchema)

// Dashboard Schemas
export const dashboardMetricsSchema = z.object({
  period: z.enum(['7d', '30d', '90d', '1y']).default('30d'),
  compareWith: z.enum(['previous', 'same_last_month', 'same_last_year']).optional()
})

export const analyticsParamsSchema = z.object({
  metric: z.enum(['revenue', 'subscriptions', 'customers', 'tickets', 'orders']),
  period: z.enum(['7d', '30d', '90d', '1y']).default('30d'),
  granularity: z.enum(['day', 'week', 'month']).default('day'),
  groupBy: z.string().optional()
})

// Combined Schemas
export const customerListSchema = customerFiltersSchema
export const subscriptionListSchema = subscriptionFiltersSchema
export const orderListSchema = orderFiltersSchema
export const supportTicketListSchema = supportTicketFiltersSchema

// Response Schemas (para validação de respostas)
export const userResponseSchema = z.object({
  id: z.string(),
  email: z.string(),
  name: z.string().nullable(),
  phone: z.string().nullable(),
  whatsapp: z.string().nullable(),
  role: z.string(),
  createdAt: z.string().datetime(),
  lastLoginAt: z.string().datetime().nullable()
})

export const subscriptionResponseSchema = z.object({
  id: z.string(),
  userId: z.string(),
  asaasSubscriptionId: z.string().nullable(),
  planType: z.string(),
  status: subscriptionStatusEnum,
  monthlyValue: z.number(),
  renewalDate: z.string().datetime(),
  startDate: z.string().datetime(),
  paymentMethod: z.enum(['CREDIT_CARD', 'DEBIT_CARD', 'PIX', 'BOLETO']),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
  user: userResponseSchema.optional()
})

export const orderResponseSchema = z.object({
  id: z.string(),
  subscriptionId: z.string(),
  orderDate: z.string().datetime(),
  shippingDate: z.string().datetime().nullable(),
  deliveryStatus: deliveryStatusEnum,
  trackingCode: z.string().nullable(),
  totalAmount: z.number(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime()
})

export const supportTicketResponseSchema = z.object({
  id: z.string(),
  ticketNumber: z.string(),
  userId: z.string(),
  subject: z.string(),
  category: supportCategoryEnum,
  priority: supportPriorityEnum,
  status: supportStatusEnum,
  assignedAgentId: z.string().nullable(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime()
})

// Type exports
export type LoginInput = z.infer<typeof loginSchema>
export type RefreshTokenInput = z.infer<typeof refreshTokenSchema>
export type CustomerCreateInput = z.infer<typeof customerCreateSchema>
export type CustomerUpdateInput = z.infer<typeof customerUpdateSchema>
export type CustomerSearchInput = z.infer<typeof customerSearchSchema>
export type SubscriptionCreateInput = z.infer<typeof subscriptionCreateSchema>
export type SubscriptionUpdateInput = z.infer<typeof subscriptionUpdateSchema>
export type SubscriptionStatusUpdateInput = z.infer<typeof subscriptionStatusUpdateSchema>
export type OrderCreateInput = z.infer<typeof orderCreateSchema>
export type OrderStatusUpdateInput = z.infer<typeof orderStatusUpdateSchema>
export type SupportTicketCreateInput = z.infer<typeof supportTicketCreateSchema>
export type SupportTicketUpdateInput = z.infer<typeof supportTicketUpdateSchema>
export type SupportTicketAssignInput = z.infer<typeof supportTicketAssignSchema>
export type PaginationParams = z.infer<typeof paginationSchema>
export type DateRangeParams = z.infer<typeof dateRangeSchema>
export type CustomerFilters = z.infer<typeof customerFiltersSchema>
export type SubscriptionFilters = z.infer<typeof subscriptionFiltersSchema>
export type OrderFilters = z.infer<typeof orderFiltersSchema>
export type SupportTicketFilters = z.infer<typeof supportTicketFiltersSchema>
export type DashboardMetricsParams = z.infer<typeof dashboardMetricsSchema>
export type AnalyticsParams = z.infer<typeof analyticsParamsSchema>

// Validation helper functions
export function validateBody<T>(schema: z.ZodSchema<T>, body: unknown): {
  data: T | null
  error: { field: string; message: string } | null
} {
  try {
    const data = schema.parse(body)
    return { data, error: null }
  } catch (error) {
    if (error instanceof z.ZodError) {
      const firstError = error.errors[0]
      return {
        data: null,
        error: {
          field: firstError.path.join('.'),
          message: firstError.message
        }
      }
    }
    return {
      data: null,
      error: {
        field: 'unknown',
        message: 'Erro de validação desconhecido'
      }
    }
  }
}

export function validateQuery<T>(schema: z.ZodSchema<T>, searchParams: URLSearchParams): {
  data: T | null
  error: { field: string; message: string } | null
} {
  const params: Record<string, any> = {}

  searchParams.forEach((value, key) => {
    params[key] = value
  })

  try {
    const data = schema.parse(params)
    return { data, error: null }
  } catch (error) {
    if (error instanceof z.ZodError) {
      const firstError = error.errors[0]
      return {
        data: null,
        error: {
          field: firstError.path.join('.'),
          message: firstError.message
        }
      }
    }
    return {
      data: null,
      error: {
        field: 'unknown',
        message: 'Erro de validação desconhecido'
      }
    }
  }
}