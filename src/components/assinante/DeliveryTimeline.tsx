'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import {
  Package,
  CheckCircle,
  Clock,
  Truck,
  MapPin,
  ExternalLink,
  AlertCircle
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { formatDate, formatRelativeTime } from '@/lib/formatters'
import { cn } from '@/lib/utils'

/**
 * Status possíveis para uma entrega
 */
export type DeliveryStatus =
  | 'delivered'
  | 'in_transit'
  | 'processing'
  | 'scheduled'
  | 'delayed'

/**
 * Interface para dados de uma entrega
 */
export interface DeliveryData {
  id: string
  orderNumber: string
  status: DeliveryStatus
  scheduledDate: string | Date
  deliveredDate?: string | Date
  trackingCode?: string
  trackingUrl?: string
  items: {
    name: string
    quantity: number
  }[]
}

/**
 * Props do componente DeliveryTimeline
 */
interface DeliveryTimelineProps {
  /**
   * Lista de entregas (últimas 3 entregas passadas + próxima entrega)
   */
  deliveries?: DeliveryData[]

  /**
   * Estado de carregamento
   */
  isLoading?: boolean

  /**
   * Mensagem de erro
   */
  error?: string

  /**
   * Classe CSS adicional
   */
  className?: string
}

/**
 * Retorna o ícone apropriado para cada status de entrega
 */
function getStatusIcon(status: DeliveryStatus) {
  const iconMap = {
    delivered: <CheckCircle className="h-5 w-5" />,
    in_transit: <Truck className="h-5 w-5" />,
    processing: <Package className="h-5 w-5" />,
    scheduled: <Clock className="h-5 w-5" />,
    delayed: <AlertCircle className="h-5 w-5" />
  }
  return iconMap[status]
}

/**
 * Retorna a cor apropriada para cada status de entrega
 */
function getStatusColor(status: DeliveryStatus) {
  const colorMap = {
    delivered: 'text-green-600 bg-green-50 dark:bg-green-950 border-green-200',
    in_transit: 'text-blue-600 bg-blue-50 dark:bg-blue-950 border-blue-200',
    processing: 'text-cyan-600 bg-cyan-50 dark:bg-cyan-950 border-cyan-200',
    scheduled: 'text-cyan-600 bg-cyan-50 dark:bg-cyan-950 border-cyan-200',
    delayed: 'text-amber-600 bg-amber-50 dark:bg-amber-950 border-amber-200'
  }
  return colorMap[status]
}

/**
 * Retorna o label apropriado para cada status de entrega
 */
function getStatusLabel(status: DeliveryStatus) {
  const labelMap = {
    delivered: 'Entregue',
    in_transit: 'Em Trânsito',
    processing: 'Em Preparação',
    scheduled: 'Agendada',
    delayed: 'Atrasada'
  }
  return labelMap[status]
}

/**
 * Retorna a cor da linha da timeline baseada no status
 */
function getTimelineLineColor(status: DeliveryStatus, isNext: boolean) {
  if (isNext) {
    return 'bg-cyan-500'
  }
  return status === 'delivered'
    ? 'bg-green-500'
    : 'bg-gray-300 dark:bg-gray-700'
}

/**
 * Componente DeliveryTimeline
 * Exibe uma timeline vertical com as últimas entregas e a próxima entrega agendada
 */
export function DeliveryTimeline({
  deliveries = [],
  isLoading = false,
  error,
  className
}: DeliveryTimelineProps) {
  const [expandedDelivery, setExpandedDelivery] = useState<string | null>(null)

  // Separa entregas passadas da próxima entrega
  const pastDeliveries = deliveries.filter(
    (d) => d.status === 'delivered'
  ).slice(0, 3)
  const nextDelivery = deliveries.find(
    (d) => d.status !== 'delivered'
  )

  // Combina para exibição (últimas 3 entregas + próxima)
  const displayDeliveries = [...pastDeliveries]
  if (nextDelivery) {
    displayDeliveries.push(nextDelivery)
  }

  // Loading skeleton
  if (isLoading) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle>Histórico de Entregas</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex gap-3 animate-pulse">
              <div className="flex flex-col items-center">
                <div className="h-10 w-10 rounded-full bg-muted" />
                {i < 3 && <div className="w-0.5 h-16 bg-muted mt-2" />}
              </div>
              <div className="flex-1 pt-2">
                <div className="h-4 bg-muted rounded w-32 mb-2" />
                <div className="h-3 bg-muted rounded w-24" />
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    )
  }

  // Error state
  if (error) {
    return (
      <Card className={cn('border-red-200 bg-red-50 dark:bg-red-950', className)}>
        <CardContent className="flex items-center gap-3 pt-6">
          <AlertCircle className="h-5 w-5 text-red-600" />
          <p className="text-sm text-red-900 dark:text-red-100">{error}</p>
        </CardContent>
      </Card>
    )
  }

  // Empty state
  if (displayDeliveries.length === 0) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle>Histórico de Entregas</CardTitle>
        </CardHeader>
        <CardContent className="py-8 text-center">
          <Package className="h-12 w-12 mx-auto mb-3 text-muted-foreground/50" />
          <p className="text-sm text-muted-foreground">
            Nenhuma entrega registrada ainda
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MapPin className="h-5 w-5 text-cyan-600" />
          Histórico de Entregas
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-0">
          {displayDeliveries.map((delivery, index) => {
            const isLast = index === displayDeliveries.length - 1
            const isNext = delivery.status !== 'delivered'
            const isExpanded = expandedDelivery === delivery.id

            return (
              <motion.div
                key={delivery.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                className="flex gap-4"
              >
                {/* Timeline Line */}
                <div className="flex flex-col items-center">
                  <motion.div
                    className={cn(
                      'flex items-center justify-center rounded-full border-2 p-2',
                      getStatusColor(delivery.status),
                      isNext && 'ring-4 ring-cyan-100 dark:ring-cyan-900'
                    )}
                    whileHover={{ scale: 1.1 }}
                    transition={{ type: 'spring', stiffness: 300 }}
                  >
                    {getStatusIcon(delivery.status)}
                  </motion.div>
                  {!isLast && (
                    <div
                      className={cn(
                        'w-0.5 flex-1 mt-2',
                        getTimelineLineColor(delivery.status, false),
                        'min-h-[60px]'
                      )}
                    />
                  )}
                </div>

                {/* Delivery Info */}
                <div className="flex-1 pb-8">
                  <div className="flex items-start justify-between mb-1">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span
                          className={cn(
                            'text-xs font-medium px-2 py-0.5 rounded-full',
                            getStatusColor(delivery.status)
                          )}
                        >
                          {getStatusLabel(delivery.status)}
                        </span>
                        {isNext && (
                          <span className="text-xs font-bold text-cyan-600">
                            Próxima entrega
                          </span>
                        )}
                      </div>
                      <p className="text-sm font-medium">
                        Pedido #{delivery.orderNumber}
                      </p>
                    </div>
                  </div>

                  <div className="text-xs text-muted-foreground space-y-1">
                    <p>
                      {delivery.status === 'delivered' ? 'Entregue em: ' : 'Prevista para: '}
                      <span className="font-medium">
                        {delivery.deliveredDate
                          ? formatDate(delivery.deliveredDate)
                          : formatDate(delivery.scheduledDate)}
                      </span>
                      {delivery.deliveredDate && (
                        <span className="ml-2 text-muted-foreground/70">
                          ({formatRelativeTime(delivery.deliveredDate)})
                        </span>
                      )}
                    </p>

                    {delivery.items.length > 0 && (
                      <p>
                        Itens: {delivery.items.map((item) => `${item.quantity}x ${item.name}`).join(', ')}
                      </p>
                    )}
                  </div>

                  {delivery.trackingCode && (
                    <div className="mt-3">
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-8 text-xs"
                        asChild
                      >
                        <a
                          href={delivery.trackingUrl || '#'}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          <Truck className="h-3 w-3 mr-1" />
                          Rastrear entrega
                          <ExternalLink className="h-3 w-3 ml-1" />
                        </a>
                      </Button>
                    </div>
                  )}
                </div>
              </motion.div>
            )
          })}
        </div>

        {/* Progress Indicator */}
        {pastDeliveries.length > 0 && (
          <div className="mt-6 pt-4 border-t">
            <div className="flex items-center justify-between text-xs text-muted-foreground mb-2">
              <span>Progresso da assinatura</span>
              <span className="font-medium">{pastDeliveries.length} entregas realizadas</span>
            </div>
            <div className="h-2 bg-muted rounded-full overflow-hidden">
              <motion.div
                className="h-full bg-gradient-to-r from-cyan-500 to-green-500"
                initial={{ width: 0 }}
                animate={{ width: `${(pastDeliveries.length / (pastDeliveries.length + 1)) * 100}%` }}
                transition={{ duration: 1, delay: 0.5 }}
              />
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
