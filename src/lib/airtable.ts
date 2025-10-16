import Airtable from 'airtable'
import {
  Subscription,
  PaymentMethod,
  DeliveryAddress,
  ContactInfo,
  Order,
  Invoice,
  AirtableSubscriptionRecord,
  SubscriptionUpdateData
} from '@/types/subscription'

// Configuração do Airtable
const AIRTABLE_API_KEY = process.env.AIRTABLE_API_KEY || ''
const AIRTABLE_BASE_ID = process.env.AIRTABLE_BASE_ID || ''

// Inicialização do Airtable
const base = AIRTABLE_API_KEY && AIRTABLE_BASE_ID
  ? new Airtable({ apiKey: AIRTABLE_API_KEY }).base(AIRTABLE_BASE_ID)
  : null

// Nomes das tabelas
const TABLES = {
  SUBSCRIPTIONS: 'Subscriptions',
  PAYMENT_METHODS: 'Payment Methods',
  ORDERS: 'Orders',
  INVOICES: 'Invoices',
  SUPPORT_TICKETS: 'Support Tickets',
  USERS: 'Users'
} as const

// Verificação de configuração
function checkAirtableConfig() {
  if (!base) {
    throw new Error('Airtable não configurado. Verifique AIRTABLE_API_KEY e AIRTABLE_BASE_ID.')
  }
}

// Função auxiliar para serializar objetos complexos
function serializeComplexField(obj: any): string {
  return JSON.stringify(obj)
}

// Função auxiliar para deserializar objetos complexos
function deserializeComplexField<T>(field: string | undefined, defaultValue: T): T {
  if (!field) return defaultValue
  try {
    return JSON.parse(field)
  } catch {
    return defaultValue
  }
}

// Operações de Assinaturas
export class AirtableSubscriptionService {
  // Criar nova assinatura
  static async createSubscription(subscription: Omit<Subscription, 'id' | 'createdAt' | 'updatedAt'>): Promise<Subscription> {
    checkAirtableConfig()

    const now = new Date().toISOString()
    const record = await base!(TABLES.SUBSCRIPTIONS).create({
      'User ID': subscription.userId,
      'Email': subscription.email,
      'Display Name': subscription.displayName,
      'Plan': subscription.plan === 'monthly' ? 'Monthly' : 'Annual',
      'Status': subscription.status.charAt(0).toUpperCase() + subscription.status.slice(1),
      'Lens Type': subscription.lensType,
      'Both Eyes': subscription.bothEyes,
      'Different Grades': subscription.differentGrades,
      'Monthly Price': subscription.monthlyPrice,
      'Next Billing Date': subscription.nextBillingDate,
      'Start Date': subscription.startDate,
      'End Date': subscription.endDate || null,
      'Cancel Reason': subscription.cancelReason || null,
      'Payment Method': serializeComplexField(subscription.paymentMethod),
      'Delivery Address': serializeComplexField(subscription.deliveryAddress),
      'Contact Info': serializeComplexField(subscription.contactInfo),
      'Created At': now,
      'Updated At': now,
      'Metadata': subscription.metadata ? serializeComplexField(subscription.metadata) : null
    })

    return this.mapRecordToSubscription(record.id, record.fields as any)
  }

  // Buscar assinatura por ID
  static async getSubscriptionById(id: string): Promise<Subscription | null> {
    checkAirtableConfig()

    try {
      const record = await base!(TABLES.SUBSCRIPTIONS).find(id)
      return this.mapRecordToSubscription(record.id, record.fields as any)
    } catch (error: any) {
      if (error.statusCode === 404) return null
      throw error
    }
  }

  // Buscar assinatura por User ID
  static async getSubscriptionByUserId(userId: string): Promise<Subscription | null> {
    checkAirtableConfig()

    const records = await base!(TABLES.SUBSCRIPTIONS)
      .select({
        filterByFormula: `{User ID} = '${userId}'`,
        maxRecords: 1
      })
      .firstPage()

    if (records.length === 0) return null

    return this.mapRecordToSubscription(records[0].id, records[0].fields as any)
  }

  // Atualizar assinatura
  static async updateSubscription(id: string, updates: SubscriptionUpdateData): Promise<Subscription> {
    checkAirtableConfig()

    const currentRecord = await base!(TABLES.SUBSCRIPTIONS).find(id)
    const currentFields = currentRecord.fields as any

    const updateFields: any = {
      'Updated At': new Date().toISOString()
    }

    if (updates.plan) {
      updateFields['Plan'] = updates.plan === 'monthly' ? 'Monthly' : 'Annual'
    }

    if (updates.status) {
      updateFields['Status'] = updates.status.charAt(0).toUpperCase() + updates.status.slice(1)
    }

    if (updates.cancelReason !== undefined) {
      updateFields['Cancel Reason'] = updates.cancelReason
    }

    if (updates.paymentMethod) {
      const currentPaymentMethod = deserializeComplexField<PaymentMethod>(currentFields['Payment Method'], {} as PaymentMethod)
      updateFields['Payment Method'] = serializeComplexField({ ...currentPaymentMethod, ...updates.paymentMethod })
    }

    if (updates.deliveryAddress) {
      const currentAddress = deserializeComplexField<DeliveryAddress>(currentFields['Delivery Address'], {} as DeliveryAddress)
      updateFields['Delivery Address'] = serializeComplexField({ ...currentAddress, ...updates.deliveryAddress })
    }

    if (updates.contactInfo) {
      const currentContact = deserializeComplexField<ContactInfo>(currentFields['Contact Info'], {} as ContactInfo)
      updateFields['Contact Info'] = serializeComplexField({ ...currentContact, ...updates.contactInfo })
    }

    const record = await base!(TABLES.SUBSCRIPTIONS).update(id, updateFields)
    return this.mapRecordToSubscription(record.id, record.fields as any)
  }

  // Cancelar assinatura
  static async cancelSubscription(id: string, reason: string, effectiveDate?: Date): Promise<Subscription> {
    const updateData: SubscriptionUpdateData = {
      status: 'cancelled',
      cancelReason: reason
    }

    if (effectiveDate) {
      updateData.status = 'active'
      // Será cancelado na data efetiva via webhook/rotina agendada
    }

    return this.updateSubscription(id, updateData)
  }

  // Pausar assinatura
  static async pauseSubscription(id: string, reason: string): Promise<Subscription> {
    return this.updateSubscription(id, { status: 'paused' })
  }

  // Reativar assinatura
  static async reactivateSubscription(id: string): Promise<Subscription> {
    return this.updateSubscription(id, {
      status: 'active',
      cancelReason: undefined
    })
  }

  // Listar todas as assinaturas (para admin)
  static async getAllSubscriptions(limit: number = 100): Promise<Subscription[]> {
    checkAirtableConfig()

    const records = await base!(TABLES.SUBSCRIPTIONS)
      .select({
        maxRecords: limit,
        sort: [{ field: 'Created At', direction: 'desc' }]
      })
      .firstPage()

    return records.map(record => this.mapRecordToSubscription(record.id, record.fields as any))
  }

  // Buscar assinaturas por status
  static async getSubscriptionsByStatus(status: string, limit: number = 50): Promise<Subscription[]> {
    checkAirtableConfig()

    const records = await base!(TABLES.SUBSCRIPTIONS)
      .select({
        filterByFormula: `{Status} = '${status}'`,
        maxRecords: limit,
        sort: [{ field: 'Updated At', direction: 'desc' }]
      })
      .firstPage()

    return records.map(record => this.mapRecordToSubscription(record.id, record.fields as any))
  }

  // Mapear registro do Airtable para objeto Subscription
  private static mapRecordToSubscription(id: string, fields: any): Subscription {
    return {
      id,
      userId: fields['User ID'],
      email: fields['Email'],
      displayName: fields['Display Name'],
      plan: fields['Plan']?.toLowerCase() as 'monthly' | 'annual',
      status: fields['Status']?.toLowerCase() as Subscription['status'],
      lensType: fields['Lens Type'],
      bothEyes: fields['Both Eyes'] || false,
      differentGrades: fields['Different Grades'] || false,
      monthlyPrice: fields['Monthly Price'] || 0,
      nextBillingDate: fields['Next Billing Date'],
      startDate: fields['Start Date'],
      endDate: fields['End Date'] || undefined,
      cancelReason: fields['Cancel Reason'] || undefined,
      paymentMethod: deserializeComplexField<PaymentMethod>(fields['Payment Method'], {} as PaymentMethod),
      deliveryAddress: deserializeComplexField<DeliveryAddress>(fields['Delivery Address'], {} as DeliveryAddress),
      contactInfo: deserializeComplexField<ContactInfo>(fields['Contact Info'], {} as ContactInfo),
      createdAt: fields['Created At'],
      updatedAt: fields['Updated At'],
      metadata: deserializeComplexField(fields['Metadata'], undefined)
    }
  }
}

// Operações de Pedidos
export class AirtableOrderService {
  // Criar novo pedido
  static async createOrder(order: Omit<Order, 'id' | 'createdAt'>): Promise<Order> {
    checkAirtableConfig()

    const now = new Date().toISOString()
    const record = await base!(TABLES.ORDERS).create({
      'Subscription ID': order.subscriptionId,
      'Type': order.type,
      'Status': order.status.charAt(0).toUpperCase() + order.status.slice(1),
      'Items': serializeComplexField(order.items),
      'Total Amount': order.totalAmount,
      'Payment Status': order.paymentStatus.charAt(0).toUpperCase() + order.paymentStatus.slice(1),
      'Payment Method': serializeComplexField(order.paymentMethod),
      'Shipping Address': serializeComplexField(order.shippingAddress),
      'Tracking Code': order.trackingCode || null,
      'Estimated Delivery': order.estimatedDelivery || null,
      'Created At': now,
      'Delivered At': order.deliveredAt || null,
      'Notes': order.notes || null
    })

    return this.mapRecordToOrder(record.id, record.fields as any)
  }

  // Listar pedidos de uma assinatura
  static async getOrdersBySubscription(subscriptionId: string, limit: number = 50): Promise<Order[]> {
    checkAirtableConfig()

    const records = await base!(TABLES.ORDERS)
      .select({
        filterByFormula: `{Subscription ID} = '${subscriptionId}'`,
        maxRecords: limit,
        sort: [{ field: 'Created At', direction: 'desc' }]
      })
      .firstPage()

    return records.map(record => this.mapRecordToOrder(record.id, record.fields as any))
  }

  // Atualizar status do pedido
  static async updateOrderStatus(id: string, status: Order['status'], trackingCode?: string): Promise<Order> {
    checkAirtableConfig()

    const updateFields: any = {
      'Status': status.charAt(0).toUpperCase() + status.slice(1),
      'Updated At': new Date().toISOString()
    }

    if (trackingCode) {
      updateFields['Tracking Code'] = trackingCode
    }

    if (status === 'delivered') {
      updateFields['Delivered At'] = new Date().toISOString()
    }

    const record = await base!(TABLES.ORDERS).update(id, updateFields)
    return this.mapRecordToOrder(record.id, record.fields as any)
  }

  private static mapRecordToOrder(id: string, fields: any): Order {
    return {
      id,
      subscriptionId: fields['Subscription ID'],
      type: fields['Type']?.toLowerCase() as Order['type'],
      status: fields['Status']?.toLowerCase() as Order['status'],
      items: deserializeComplexField(fields['Items'], []),
      totalAmount: fields['Total Amount'] || 0,
      paymentStatus: fields['Payment Status']?.toLowerCase() as Order['paymentStatus'],
      paymentMethod: deserializeComplexField<PaymentMethod>(fields['Payment Method'], {} as PaymentMethod),
      shippingAddress: deserializeComplexField<DeliveryAddress>(fields['Shipping Address'], {} as DeliveryAddress),
      trackingCode: fields['Tracking Code'] || undefined,
      estimatedDelivery: fields['Estimated Delivery'] || undefined,
      createdAt: fields['Created At'],
      deliveredAt: fields['Delivered At'] || undefined,
      notes: fields['Notes'] || undefined
    }
  }
}

// Analytics e Relatórios
export class AirtableAnalyticsService {
  // Buscar analytics de assinaturas
  static async getSubscriptionAnalytics(): Promise<{
    totalSubscribers: number
    activeSubscribers: number
    monthlyRevenue: number
    planDistribution: { monthly: number; annual: number }
  }> {
    checkAirtableConfig()

    // Contar assinaturas ativas
    const activeRecords = await base!(TABLES.SUBSCRIPTIONS)
      .select({
        filterByFormula: `{Status} = 'Active'`,
        fields: ['Plan', 'Monthly Price']
      })
      .firstPage()

    const activeSubscribers = activeRecords.length
    const planDistribution = { monthly: 0, annual: 0 }
    let monthlyRevenue = 0

    activeRecords.forEach(record => {
      const plan = record.fields['Plan'] as string
      const price = record.fields['Monthly Price'] as number || 0

      if (plan === 'Monthly') {
        planDistribution.monthly++
        monthlyRevenue += price
      } else {
        planDistribution.annual++
        monthlyRevenue += price // Preço mensal do plano anual
      }
    })

    // Contar todas as assinaturas
    const allRecords = await base!(TABLES.SUBSCRIPTIONS)
      .select({
        fields: ['ID']
      })
      .firstPage()

    return {
      totalSubscribers: allRecords.length,
      activeSubscribers,
      monthlyRevenue,
      planDistribution
    }
  }
}

// Função de health check
export async function checkAirtableConnection(): Promise<boolean> {
  try {
    checkAirtableConfig()
    await base!(TABLES.SUBSCRIPTIONS)
      .select({
        maxRecords: 1
      })
      .firstPage()
    return true
  } catch {
    return false
  }
}