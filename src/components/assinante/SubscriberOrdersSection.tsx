'use client'

import { useMemo } from 'react'
import { ArrowUpRight, PackageSearch, RefreshCcw, Truck } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Table, TableBody, TableCaption, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Progress } from '@/components/ui/progress'
import { Skeleton } from '@/components/ui/skeleton'
import { Separator } from '@/components/ui/separator'
import { DeliveryTimeline, type DeliveryData } from '@/components/assinante/DeliveryTimeline'
import { useSubscriberOrders } from '@/hooks/useSubscriberOrders'
import { formatCurrency, formatDate, formatRelativeTime } from '@/lib/formatters'
import { getOrderStatusLabel } from '@/lib/subscription-helpers'
import { cn } from '@/lib/utils'

interface SubscriberOrdersSectionProps {
  className?: string
  onViewAllOrders?: () => void
}

function mapOrderStatusToBadge(status: string) {
  const map: Record<string, string> = {
    delivered: 'bg-emerald-100 text-emerald-700 border-emerald-200',
    shipped: 'bg-sky-100 text-sky-700 border-sky-200',
    processing: 'bg-amber-100 text-amber-700 border-amber-200',
    pending: 'bg-slate-100 text-slate-700 border-slate-200',
    cancelled: 'bg-rose-100 text-rose-700 border-rose-200',
  }

  return map[status] ?? 'bg-slate-100 text-slate-700 border-slate-200'
}

function mapOrderStatusToTimelineStatus(status: string) {
  switch (status) {
    case 'delivered':
      return 'delivered'
    case 'shipped':
      return 'in_transit'
    case 'processing':
      return 'processing'
    case 'pending':
      return 'scheduled'
    case 'cancelled':
      return 'delayed'
    default:
      return 'processing'
  }
}

function getProgressValue(status: string) {
  if (status === 'cancelled') {
    return 0
  }

  const progression: string[] = ['pending', 'processing', 'shipped', 'delivered']
  const index = progression.indexOf(status)

  if (index === -1) {
    return 0
  }

  return Math.round((index / (progression.length - 1)) * 100)
}

export function SubscriberOrdersSection({ className, onViewAllOrders }: SubscriberOrdersSectionProps) {
  const { orders, loading, error, pagination, refetch, hasOrders } = useSubscriberOrders({ limit: 6 })

  const nextOrder = useMemo(() => {
    return orders.find((order) => order.status !== 'delivered' && order.status !== 'cancelled') ?? orders[0] ?? null
  }, [orders])

  const deliveredCount = useMemo(() => orders.filter((order) => order.status === 'delivered').length, [orders])
  const inTransitCount = useMemo(
    () => orders.filter((order) => order.status === 'processing' || order.status === 'shipped').length,
    [orders]
  )
  const timelineData: DeliveryData[] = useMemo(() => {
    return orders.slice(0, 4).map((order) => ({
      id: order.id,
      orderNumber: `#${order.id.slice(-8).toUpperCase()}`,
      status: mapOrderStatusToTimelineStatus(order.status),
      scheduledDate: order.shippingDate ?? order.createdAt,
      deliveredDate: order.deliveryDate ?? undefined,
      trackingCode: order.trackingCode ?? undefined,
      trackingUrl: order.trackingCode
        ? `https://rastreamento.correios.com.br/app/index.php?objeto=${order.trackingCode}`
        : undefined,
      items: [
        {
          name: order.planName,
          quantity: 1,
        },
      ],
    }))
  }, [orders])

  const totalOrders = pagination?.total ?? orders.length
  const progressValue = nextOrder ? getProgressValue(nextOrder.status) : 0

  return (
    <div className={cn('space-y-6', className)}>
      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Truck className="h-5 w-5 text-cyan-600" />
                Acompanhamento de envios
              </CardTitle>
              <CardDescription>Visualize o status do próximo envio e as métricas mais recentes.</CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={refetch}
                disabled={loading}
                className="gap-2"
              >
                <RefreshCcw className={cn('h-4 w-4', loading && 'animate-spin')} />
                Atualizar
              </Button>
              {onViewAllOrders && (
                <Button
                  size="sm"
                  onClick={onViewAllOrders}
                  className="gap-2"
                >
                  Ver todos
                  <ArrowUpRight className="h-4 w-4" />
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            {loading && (
              <div className="space-y-6">
                <div className="space-y-4">
                  <Skeleton className="h-5 w-48" />
                  <Skeleton className="h-8 w-72" />
                  <Skeleton className="h-4 w-40" />
                </div>
                <Skeleton className="h-2 w-full" />
                <div className="grid gap-4 sm:grid-cols-3">
                  <Skeleton className="h-16" />
                  <Skeleton className="h-16" />
                  <Skeleton className="h-16" />
                </div>
              </div>
            )}

            {!loading && error && (
              <Alert variant="destructive">
                <AlertTitle>Não foi possível carregar os pedidos</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {!loading && !error && !hasOrders && (
              <div className="flex flex-col items-center justify-center gap-3 py-10 text-center">
                <PackageSearch className="h-12 w-12 text-muted-foreground/60" />
                <div className="space-y-1">
                  <p className="text-sm font-medium text-foreground">Nenhum pedido encontrado</p>
                  <p className="text-sm text-muted-foreground">
                    Assim que você realizar um pedido, os detalhes de envio aparecerão aqui.
                  </p>
                </div>
              </div>
            )}

            {!loading && !error && hasOrders && nextOrder && (
              <div className="space-y-6">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Próximo envio</p>
                    <h3 className="text-xl font-semibold text-foreground">{nextOrder.planName}</h3>
                    <p className="text-xs text-muted-foreground">Atualizado {formatRelativeTime(nextOrder.updatedAt)}</p>
                  </div>
                  <Badge
                    variant="outline"
                    className={cn('border px-3 py-1 text-xs font-medium', mapOrderStatusToBadge(nextOrder.status))}
                  >
                    {getOrderStatusLabel(nextOrder.status)}
                  </Badge>
                </div>

                <div className="space-y-3">
                  <Progress value={progressValue} className="h-2" />
                  <div className="grid gap-4 sm:grid-cols-3">
                    <div>
                      <p className="text-xs uppercase text-muted-foreground">Pedido</p>
                      <p className="font-semibold text-sm">#{nextOrder.id.slice(-8).toUpperCase()}</p>
                    </div>
                    <div>
                      <p className="text-xs uppercase text-muted-foreground">Envio previsto</p>
                      <p className="font-semibold text-sm">
                        {nextOrder.shippingDate ? formatDate(nextOrder.shippingDate) : 'A confirmar'}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs uppercase text-muted-foreground">Valor</p>
                      <p className="font-semibold text-sm">{formatCurrency(nextOrder.amount)}</p>
                    </div>
                  </div>
                </div>

                {nextOrder.trackingCode && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full sm:w-auto"
                    onClick={() =>
                      window.open(
                        `https://rastreamento.correios.com.br/app/index.php?objeto=${nextOrder.trackingCode}`,
                        '_blank'
                      )
                    }
                  >
                    Rastrear envio
                  </Button>
                )}

                <Separator />

                <div className="grid gap-4 sm:grid-cols-3">
                  <div className="rounded-lg border bg-muted/30 p-4">
                    <p className="text-xs uppercase text-muted-foreground">Total de pedidos</p>
                    <p className="text-2xl font-semibold text-foreground">{totalOrders}</p>
                  </div>
                  <div className="rounded-lg border bg-muted/30 p-4">
                    <p className="text-xs uppercase text-muted-foreground">Em andamento</p>
                    <p className="text-2xl font-semibold text-foreground">{inTransitCount}</p>
                  </div>
                  <div className="rounded-lg border bg-muted/30 p-4">
                    <p className="text-xs uppercase text-muted-foreground">Entregues</p>
                    <p className="text-2xl font-semibold text-foreground">{deliveredCount}</p>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <DeliveryTimeline
          deliveries={timelineData}
          isLoading={loading}
          error={error ?? undefined}
          className="lg:col-span-1"
        />
      </div>

      <Card>
        <CardHeader className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <CardTitle className="text-lg">Histórico de pedidos</CardTitle>
            <CardDescription>Confira as últimas movimentações da sua assinatura.</CardDescription>
          </div>
          {onViewAllOrders && (
            <Button
              variant="ghost"
              size="sm"
              className="gap-2"
              onClick={onViewAllOrders}
            >
              Abrir histórico completo
              <ArrowUpRight className="h-4 w-4" />
            </Button>
          )}
        </CardHeader>
        <CardContent>
          {loading && (
            <div className="space-y-3">
              {[...Array(4)].map((_, index) => (
                <Skeleton key={index} className="h-12 w-full" />
              ))}
            </div>
          )}

          {!loading && error && (
            <Alert variant="destructive">
              <AlertTitle>Erro ao carregar histórico</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {!loading && !error && !hasOrders && (
            <div className="flex flex-col items-center justify-center gap-3 py-10 text-center">
              <PackageSearch className="h-12 w-12 text-muted-foreground/60" />
              <div className="space-y-1">
                <p className="text-sm font-medium text-foreground">Histórico vazio</p>
                <p className="text-sm text-muted-foreground">
                  Quando seus pedidos forem gerados, eles aparecerão nesta lista.
                </p>
              </div>
            </div>
          )}

          {!loading && !error && hasOrders && (
            <div className="overflow-hidden rounded-lg border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Pedido</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="hidden sm:table-cell">Criação</TableHead>
                    <TableHead className="hidden lg:table-cell">Envio</TableHead>
                    <TableHead className="hidden lg:table-cell">Entrega</TableHead>
                    <TableHead className="hidden sm:table-cell text-right">Valor</TableHead>
                    <TableHead className="hidden xl:table-cell">Rastreio</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {orders.map((order) => (
                    <TableRow key={order.id}>
                      <TableCell>
                        <div className="flex flex-col">
                          <span className="font-semibold text-sm text-foreground">{order.planName}</span>
                          <span className="text-xs text-muted-foreground">#{order.id.slice(-8).toUpperCase()}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className={cn('border px-2 py-0.5 text-xs font-medium', mapOrderStatusToBadge(order.status))}
                        >
                          {getOrderStatusLabel(order.status)}
                        </Badge>
                      </TableCell>
                      <TableCell className="hidden sm:table-cell">{formatDate(order.createdAt)}</TableCell>
                      <TableCell className="hidden lg:table-cell">
                        {order.shippingDate ? formatDate(order.shippingDate) : '—'}
                      </TableCell>
                      <TableCell className="hidden lg:table-cell">
                        {order.deliveryDate ? formatDate(order.deliveryDate) : '—'}
                      </TableCell>
                      <TableCell className="hidden sm:table-cell text-right font-medium">
                        {formatCurrency(order.amount)}
                      </TableCell>
                      <TableCell className="hidden xl:table-cell">
                        {order.trackingCode ? (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="gap-1 px-2"
                            onClick={() =>
                              window.open(
                                `https://rastreamento.correios.com.br/app/index.php?objeto=${order.trackingCode}`,
                                '_blank'
                              )
                            }
                          >
                            {order.trackingCode}
                            <ArrowUpRight className="h-3.5 w-3.5" />
                          </Button>
                        ) : (
                          <span className="text-xs text-muted-foreground">Sem código</span>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
                <TableCaption>
                  Mostrando {orders.length} de {totalOrders} pedidos.
                </TableCaption>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
