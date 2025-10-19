'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  Clock,
  User,
  ShoppingBag,
  Package,
  CreditCard,
  AlertTriangle,
  CheckCircle,
  MessageSquare,
  TrendingUp,
  RefreshCw,
  Filter
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface ActivityItem {
  id: string
  type: 'customer' | 'subscription' | 'order' | 'payment' | 'support' | 'system'
  title: string
  description: string
  entityName: string
  entityId: string
  status: 'success' | 'warning' | 'error' | 'info'
  timestamp: Date
  metadata?: {
    amount?: number
    orderNumber?: string
    customerName?: string
    planName?: string
    [key: string]: any
  }
}

interface RecentActivityListProps {
  activities?: ActivityItem[]
  title?: string
  description?: string
  maxItems?: number
  showFilters?: boolean
  refreshInterval?: number
  className?: string
  onActivityClick?: (activity: ActivityItem) => void
  onRefresh?: () => void
}

const activityTypeConfig = {
  customer: {
    icon: User,
    color: 'text-admin-metrics-customers',
    bgColor: 'bg-admin-metrics-customers/10',
    label: 'Cliente'
  },
  subscription: {
    icon: ShoppingBag,
    color: 'text-admin-metrics-growth',
    bgColor: 'bg-admin-metrics-growth/10',
    label: 'Assinatura'
  },
  order: {
    icon: Package,
    color: 'text-admin-metrics-orders',
    bgColor: 'bg-admin-metrics-orders/10',
    label: 'Pedido'
  },
  payment: {
    icon: CreditCard,
    color: 'text-admin-metrics-revenue',
    bgColor: 'bg-admin-metrics-revenue/10',
    label: 'Pagamento'
  },
  support: {
    icon: MessageSquare,
    color: 'text-admin-metrics-support',
    bgColor: 'bg-admin-metrics-support/10',
    label: 'Suporte'
  },
  system: {
    icon: AlertTriangle,
    color: 'text-muted-foreground',
    bgColor: 'bg-muted',
    label: 'Sistema'
  }
}

const statusConfig = {
  success: {
    icon: CheckCircle,
    color: 'text-green-600',
    bgColor: 'bg-green-100 dark:bg-green-900/20'
  },
  warning: {
    icon: AlertTriangle,
    color: 'text-yellow-600',
    bgColor: 'bg-yellow-100 dark:bg-yellow-900/20'
  },
  error: {
    icon: AlertTriangle,
    color: 'text-red-600',
    bgColor: 'bg-red-100 dark:bg-red-900/20'
  },
  info: {
    icon: Clock,
    color: 'text-blue-600',
    bgColor: 'bg-blue-100 dark:bg-blue-900/20'
  }
}

export function RecentActivityList({
  activities,
  title = "Atividade Recente",
  description = "Últimas atividades do sistema",
  maxItems = 10,
  showFilters = true,
  refreshInterval = 30000, // 30 segundos
  className,
  onActivityClick,
  onRefresh
}: RecentActivityListProps) {
  const [filteredActivities, setFilteredActivities] = useState<ActivityItem[]>([])
  const [selectedTypes, setSelectedTypes] = useState<string[]>([])
  const [selectedStatuses, setSelectedStatuses] = useState<string[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [lastRefresh, setLastRefresh] = useState(new Date())

  useEffect(() => {
    if (activities) {
      let filtered = [...activities]

      // Aplicar filtros de tipo
      if (selectedTypes.length > 0) {
        filtered = filtered.filter(activity => selectedTypes.includes(activity.type))
      }

      // Aplicar filtros de status
      if (selectedStatuses.length > 0) {
        filtered = filtered.filter(activity => selectedStatuses.includes(activity.status))
      }

      // Ordenar por timestamp (mais recentes primeiro)
      filtered.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())

      // Limitar número de itens
      filtered = filtered.slice(0, maxItems)

      setFilteredActivities(filtered)
    }
  }, [activities, selectedTypes, selectedStatuses, maxItems])

  // Auto-refresh
  useEffect(() => {
    if (refreshInterval > 0 && onRefresh) {
      const interval = setInterval(() => {
        handleRefresh()
      }, refreshInterval)

      return () => clearInterval(interval)
    }
  }, [refreshInterval, onRefresh])

  const handleRefresh = async () => {
    setIsLoading(true)
    try {
      await onRefresh?.()
      setLastRefresh(new Date())
    } finally {
      setIsLoading(false)
    }
  }

  const formatRelativeTime = (date: Date) => {
    const now = new Date()
    const diffInMs = now.getTime() - date.getTime()
    const diffInMinutes = Math.floor(diffInMs / (1000 * 60))
    const diffInHours = Math.floor(diffInMinutes / 60)
    const diffInDays = Math.floor(diffInHours / 24)

    if (diffInMinutes < 1) return 'Agora'
    if (diffInMinutes < 60) return `Há ${diffInMinutes} min`
    if (diffInHours < 24) return `Há ${diffInHours}h`
    if (diffInDays < 7) return `Há ${diffInDays} dias`

    return date.toLocaleDateString('pt-BR', {
      day: 'numeric',
      month: 'short'
    })
  }

  const toggleTypeFilter = (type: string) => {
    setSelectedTypes(prev =>
      prev.includes(type)
        ? prev.filter(t => t !== type)
        : [...prev, type]
    )
  }

  const toggleStatusFilter = (status: string) => {
    setSelectedStatuses(prev =>
      prev.includes(status)
        ? prev.filter(s => s !== status)
        : [...prev, status]
    )
  }

  const clearFilters = () => {
    setSelectedTypes([])
    setSelectedStatuses([])
  }

  const hasActiveFilters = selectedTypes.length > 0 || selectedStatuses.length > 0

  // Dados mock se não houver atividades
  const mockActivities: ActivityItem[] = [
    {
      id: '1',
      type: 'order',
      title: 'Novo pedido recebido',
      description: 'Pedido #12345 aguardando processamento',
      entityName: 'João Silva',
      entityId: 'order-12345',
      status: 'success',
      timestamp: new Date(Date.now() - 2 * 60 * 1000),
      metadata: { orderNumber: '12345', amount: 189.90 }
    },
    {
      id: '2',
      type: 'subscription',
      title: 'Nova assinatura ativada',
      description: 'Plano Mensal contratado com sucesso',
      entityName: 'Maria Santos',
      entityId: 'sub-67890',
      status: 'success',
      timestamp: new Date(Date.now() - 15 * 60 * 1000),
      metadata: { planName: 'Plano Mensal', amount: 89.90 }
    },
    {
      id: '3',
      type: 'support',
      title: 'Ticket de suporte aberto',
      description: 'Problema relatado com entrega',
      entityName: 'Carlos Pereira',
      entityId: 'ticket-54321',
      status: 'warning',
      timestamp: new Date(Date.now() - 60 * 60 * 1000)
    },
    {
      id: '4',
      type: 'payment',
      title: 'Pagamento confirmado',
      description: 'Assinatura renovada automaticamente',
      entityName: 'Ana Costa',
      entityId: 'payment-98765',
      status: 'success',
      timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000),
      metadata: { amount: 89.90 }
    },
    {
      id: '5',
      type: 'customer',
      title: 'Novo cliente cadastrado',
      description: 'Cadastro realizado via WhatsApp',
      entityName: 'Pedro Henrique',
      entityId: 'customer-24680',
      status: 'info',
      timestamp: new Date(Date.now() - 3 * 60 * 60 * 1000)
    }
  ]

  const displayActivities = filteredActivities.length > 0 ? filteredActivities :
    (activities?.slice(0, maxItems) || mockActivities.slice(0, maxItems))

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              {title}
            </CardTitle>
            <CardDescription>{description}</CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleRefresh}
              disabled={isLoading}
              className="h-8"
            >
              <RefreshCw className={cn("h-3 w-3", isLoading && "animate-spin")} />
              <span className="sr-only">Atualizar</span>
            </Button>
            {showFilters && (
              <Button
                variant={hasActiveFilters ? "default" : "outline"}
                size="sm"
                onClick={() => setShowFilters(!showFilters)}
                className="h-8"
              >
                <Filter className="h-3 w-3" />
                <span className="sr-only">Filtros</span>
                {hasActiveFilters && (
                  <Badge variant="secondary" className="ml-1 h-5 px-1 text-xs">
                    {selectedTypes.length + selectedStatuses.length}
                  </Badge>
                )}
              </Button>
            )}
          </div>
        </div>

        {/* Filtros */}
        {showFilters && hasActiveFilters && (
          <div className="space-y-2 mt-4">
            {/* Filtros de tipo */}
            {selectedTypes.length > 0 && (
              <div className="flex flex-wrap gap-1">
                <span className="text-xs text-muted-foreground self-center">Tipos:</span>
                {selectedTypes.map(type => {
                  const config = activityTypeConfig[type as keyof typeof activityTypeConfig]
                  return (
                    <Badge
                      key={type}
                      variant="secondary"
                      className="h-6 px-2 text-xs cursor-pointer hover:bg-destructive hover:text-destructive-foreground"
                      onClick={() => toggleTypeFilter(type)}
                    >
                      {config.label}
                    </Badge>
                  )
                })}
              </div>
            )}

            {/* Filtros de status */}
            {selectedStatuses.length > 0 && (
              <div className="flex flex-wrap gap-1">
                <span className="text-xs text-muted-foreground self-center">Status:</span>
                {selectedStatuses.map(status => (
                  <Badge
                    key={status}
                    variant="secondary"
                    className="h-6 px-2 text-xs cursor-pointer hover:bg-destructive hover:text-destructive-foreground"
                    onClick={() => toggleStatusFilter(status)}
                  >
                    {status === 'success' ? 'Sucesso' :
                     status === 'warning' ? 'Atenção' :
                     status === 'error' ? 'Erro' : 'Info'}
                  </Badge>
                ))}
              </div>
            )}

            <Button
              variant="ghost"
              size="sm"
              onClick={clearFilters}
              className="h-6 px-2 text-xs"
            >
              Limpar filtros
            </Button>
          </div>
        )}

        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>
            {displayActivities.length} atividades recentes
            {hasActiveFilters && ` (filtradas)`}
          </span>
          <span>Última atualização: {formatRelativeTime(lastRefresh)}</span>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <ScrollArea className="h-96">
          <div className="p-4 space-y-3">
            {displayActivities.map((activity) => {
              const typeConfig = activityTypeConfig[activity.type]
              const statusConfigItem = statusConfig[activity.status]
              const StatusIcon = statusConfigItem.icon
              const TypeIcon = typeConfig.icon

              return (
                <div
                  key={activity.id}
                  className={cn(
                    "flex items-start gap-3 p-3 rounded-lg border transition-colors",
                    "hover:bg-muted/50 cursor-pointer",
                    activity.status === 'error' && "border-red-200 bg-red-50/50 dark:border-red-800 dark:bg-red-900/10",
                    activity.status === 'warning' && "border-yellow-200 bg-yellow-50/50 dark:border-yellow-800 dark:bg-yellow-900/10"
                  )}
                  onClick={() => onActivityClick?.(activity)}
                >
                  {/* Ícone de status */}
                  <div className={cn(
                    "p-1.5 rounded-full",
                    statusConfigItem.bgColor,
                    statusConfigItem.color
                  )}>
                    <StatusIcon className="h-3 w-3" />
                  </div>

                  {/* Conteúdo */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <div className="flex items-center gap-2">
                        <TypeIcon className={cn("h-3 w-3", typeConfig.color)} />
                        <span className="text-sm font-medium line-clamp-1">
                          {activity.title}
                        </span>
                      </div>
                      <span className="text-xs text-muted-foreground whitespace-nowrap">
                        {formatRelativeTime(activity.timestamp)}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground line-clamp-2 mb-2">
                      {activity.description}
                    </p>
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-medium">
                        {activity.entityName}
                      </span>
                      {activity.metadata?.amount && (
                        <span className="text-xs font-semibold text-admin-metrics-revenue">
                          {new Intl.NumberFormat('pt-BR', {
                            style: 'currency',
                            currency: 'BRL'
                          }).format(activity.metadata.amount)}
                        </span>
                      )}
                      {activity.metadata?.orderNumber && (
                        <Badge variant="outline" className="text-xs h-5 px-1">
                          #{activity.metadata.orderNumber}
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
              )
            })}

            {displayActivities.length === 0 && (
              <div className="text-center py-8">
                <Clock className="h-12 w-12 mx-auto mb-2 text-muted-foreground opacity-50" />
                <p className="text-sm text-muted-foreground">
                  Nenhuma atividade encontrada
                  {hasActiveFilters && " com os filtros aplicados"}
                </p>
                {hasActiveFilters && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={clearFilters}
                    className="mt-2"
                  >
                    Limpar filtros
                  </Button>
                )}
              </div>
            )}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  )
}

// Componente para seletor de filtros
export function ActivityFilters({
  selectedTypes,
  selectedStatuses,
  onTypeChange,
  onStatusChange,
  onClear
}: {
  selectedTypes: string[]
  selectedStatuses: string[]
  onTypeChange: (types: string[]) => void
  onStatusChange: (statuses: string[]) => void
  onClear: () => void
}) {
  return (
    <Card className="p-4">
      <div className="space-y-4">
        <div>
          <h4 className="text-sm font-medium mb-2">Tipo de Atividade</h4>
          <div className="flex flex-wrap gap-2">
            {Object.entries(activityTypeConfig).map(([key, config]) => (
              <Button
                key={key}
                variant={selectedTypes.includes(key) ? "default" : "outline"}
                size="sm"
                onClick={() => {
                  const newTypes = selectedTypes.includes(key)
                    ? selectedTypes.filter(t => t !== key)
                    : [...selectedTypes, key]
                  onTypeChange(newTypes)
                }}
                className="h-8 text-xs"
              >
                <config.icon className="h-3 w-3 mr-1" />
                {config.label}
              </Button>
            ))}
          </div>
        </div>

        <div>
          <h4 className="text-sm font-medium mb-2">Status</h4>
          <div className="flex flex-wrap gap-2">
            {Object.entries(statusConfig).map(([key, config]) => (
              <Button
                key={key}
                variant={selectedStatuses.includes(key) ? "default" : "outline"}
                size="sm"
                onClick={() => {
                  const newStatuses = selectedStatuses.includes(key)
                    ? selectedStatuses.filter(s => s !== key)
                    : [...selectedStatuses, key]
                  onStatusChange(newStatuses)
                }}
                className="h-8 text-xs"
              >
                <config.icon className="h-3 w-3 mr-1" />
                {key === 'success' ? 'Sucesso' :
                 key === 'warning' ? 'Atenção' :
                 key === 'error' ? 'Erro' : 'Info'}
              </Button>
            ))}
          </div>
        </div>

        <Button
          variant="ghost"
          size="sm"
          onClick={onClear}
          className="w-full"
        >
          Limpar todos os filtros
        </Button>
      </div>
    </Card>
  )
}