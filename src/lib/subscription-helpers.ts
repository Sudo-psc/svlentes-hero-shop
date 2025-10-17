/**
 * Helpers para gerenciamento de assinaturas
 */

export type SubscriptionStatus = 'active' | 'inactive' | 'cancelled' | 'paused' | 'pending'
export type OrderStatus = 'delivered' | 'shipped' | 'processing' | 'cancelled' | 'pending'
export type InvoiceStatus = 'paid' | 'received' | 'confirmed' | 'pending' | 'overdue' | 'cancelled'

/**
 * Retorna a classe CSS para o status da assinatura
 */
export function getSubscriptionStatusColor(status: SubscriptionStatus): string {
  const statusMap: Record<SubscriptionStatus, string> = {
    active: 'bg-green-100 text-green-800',
    paused: 'bg-yellow-100 text-yellow-800',
    cancelled: 'bg-red-100 text-red-800',
    inactive: 'bg-gray-100 text-gray-800',
    pending: 'bg-blue-100 text-blue-800'
  }

  return statusMap[status] || 'bg-gray-100 text-gray-800'
}

/**
 * Retorna o label em português para o status da assinatura
 */
export function getSubscriptionStatusLabel(status: SubscriptionStatus): string {
  const labelMap: Record<SubscriptionStatus, string> = {
    active: 'Ativa',
    paused: 'Pausada',
    cancelled: 'Cancelada',
    inactive: 'Inativa',
    pending: 'Pendente'
  }

  return labelMap[status] || status
}

/**
 * Retorna a classe CSS para o status do pedido
 */
export function getOrderStatusColor(status: OrderStatus): string {
  const statusMap: Record<OrderStatus, string> = {
    delivered: 'bg-green-100 text-green-800',
    shipped: 'bg-blue-100 text-blue-800',
    processing: 'bg-yellow-100 text-yellow-800',
    cancelled: 'bg-red-100 text-red-800',
    pending: 'bg-gray-100 text-gray-800'
  }

  return statusMap[status] || 'bg-gray-100 text-gray-800'
}

/**
 * Retorna o label em português para o status do pedido
 */
export function getOrderStatusLabel(status: OrderStatus): string {
  const labelMap: Record<OrderStatus, string> = {
    delivered: 'Entregue',
    shipped: 'Enviado',
    processing: 'Em Processamento',
    cancelled: 'Cancelado',
    pending: 'Pendente'
  }

  return labelMap[status] || status
}

/**
 * Retorna a classe CSS para o status da fatura
 */
export function getInvoiceStatusColor(status: InvoiceStatus): string {
  const statusMap: Record<InvoiceStatus, string> = {
    paid: 'bg-green-100 text-green-800',
    received: 'bg-green-100 text-green-800',
    confirmed: 'bg-green-100 text-green-800',
    pending: 'bg-yellow-100 text-yellow-800',
    overdue: 'bg-red-100 text-red-800',
    cancelled: 'bg-gray-100 text-gray-800'
  }

  return statusMap[status] || 'bg-gray-100 text-gray-800'
}

/**
 * Retorna o label em português para o status da fatura
 */
export function getInvoiceStatusLabel(status: InvoiceStatus): string {
  const labelMap: Record<InvoiceStatus, string> = {
    paid: 'Pago',
    received: 'Recebido',
    confirmed: 'Confirmado',
    pending: 'Pendente',
    overdue: 'Vencido',
    cancelled: 'Cancelado'
  }

  return labelMap[status] || status
}

/**
 * Verifica se a assinatura está ativa
 */
export function isSubscriptionActive(status: SubscriptionStatus): boolean {
  return status === 'active'
}

/**
 * Verifica se a assinatura pode ser renovada
 */
export function canRenewSubscription(status: SubscriptionStatus): boolean {
  return status === 'cancelled' || status === 'inactive'
}

/**
 * Verifica se a assinatura pode ser pausada
 */
export function canPauseSubscription(status: SubscriptionStatus): boolean {
  return status === 'active'
}
