/**
 * PaymentHistoryTable Component - Fase 3
 * Tabela de histórico de pagamentos com filtros e paginação
 *
 * Smart component with integrated data fetching, filtering, and pagination
 */

'use client'

import { useState, useMemo, useEffect, useCallback } from 'react'
import { motion } from 'framer-motion'
import {
  CreditCard,
  Download,
  FileText,
  Filter,
  ChevronLeft,
  ChevronRight,
  TrendingUp,
  DollarSign,
  Clock,
  CheckCircle,
  AlertCircle,
  XCircle,
  RefreshCw
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'
import { formatCurrency, formatDate } from '@/lib/formatters'
import { cn } from '@/lib/utils'
import { useAuth } from '@/contexts/AuthContext'
import { toast } from '@/hooks/use-toast'

/**
 * Status de pagamento disponíveis (backend mapping)
 */
export type PaymentStatus =
  | 'PENDING'
  | 'RECEIVED'
  | 'CONFIRMED'
  | 'OVERDUE'
  | 'CANCELLED'
  | 'REFUNDED'

/**
 * Métodos de pagamento disponíveis
 */
export type PaymentMethod = 'PIX' | 'BOLETO' | 'CREDIT_CARD'

/**
 * Interface para pagamento individual (backend response)
 */
export interface Payment {
  id: string
  invoiceNumber: string | null
  dueDate: Date | string
  paidAt: Date | string | null
  amount: number
  status: PaymentStatus
  method: PaymentMethod
  installments?: number
  transactionId: string
  invoiceUrl: string | null
  receiptUrl: string | null
  description: string | null
}

/**
 * Interface para resumo de pagamentos
 */
interface PaymentSummary {
  totalPaid: number
  totalPending: number
  totalOverdue: number
  averagePaymentTime: number
  onTimePaymentRate: number
}

/**
 * Interface para paginação
 */
interface Pagination {
  page: number
  limit: number
  total: number
  pages: number
}

/**
 * Interface para filtros
 */
interface PaymentFilters {
  status?: PaymentStatus | 'ALL'
  method?: PaymentMethod | 'ALL'
  startDate?: string
  endDate?: string
}

/**
 * Backend API Response
 */
interface PaymentHistoryResponse {
  payments: Payment[]
  summary: PaymentSummary
  pagination: Pagination
}

/**
 * Props do componente PaymentHistoryTable
 */
interface PaymentHistoryTableProps {
  /**
   * Initial page size (default: 10)
   */
  initialPageSize?: number

  /**
   * Classe CSS adicional
   */
  className?: string
}

/**
 * Retorna a configuração de cor para status (backend mapping)
 */
function getStatusConfig(status: PaymentStatus) {
  const configMap = {
    RECEIVED: {
      color: 'bg-green-50 text-green-600 border-green-200',
      icon: CheckCircle,
      text: 'Recebido'
    },
    CONFIRMED: {
      color: 'bg-green-50 text-green-600 border-green-200',
      icon: CheckCircle,
      text: 'Confirmado'
    },
    PENDING: {
      color: 'bg-amber-50 text-amber-600 border-amber-200',
      icon: Clock,
      text: 'Pendente'
    },
    OVERDUE: {
      color: 'bg-red-50 text-red-600 border-red-200',
      icon: AlertCircle,
      text: 'Vencido'
    },
    CANCELLED: {
      color: 'bg-gray-50 text-gray-600 border-gray-200',
      icon: XCircle,
      text: 'Cancelado'
    },
    REFUNDED: {
      color: 'bg-purple-50 text-purple-600 border-purple-200',
      icon: RefreshCw,
      text: 'Reembolsado'
    }
  }
  return configMap[status]
}

/**
 * Retorna o texto do método de pagamento
 */
function getMethodText(method: PaymentMethod) {
  const methodMap = {
    PIX: 'PIX',
    BOLETO: 'Boleto',
    CREDIT_CARD: 'Cartão de Crédito'
  }
  return methodMap[method]
}

/**
 * Componente PaymentHistoryTable
 * Smart component com integração backend completa
 */
export function PaymentHistoryTable({
  initialPageSize = 10,
  className
}: PaymentHistoryTableProps) {
  const { user } = useAuth()

  // Component State
  const [payments, setPayments] = useState<Payment[]>([])
  const [summary, setSummary] = useState<PaymentSummary | null>(null)
  const [pagination, setPagination] = useState<Pagination>({
    page: 1,
    limit: initialPageSize,
    total: 0,
    pages: 0
  })
  const [filters, setFilters] = useState<PaymentFilters>({
    status: 'ALL',
    method: 'ALL'
  })
  const [isLoading, setIsLoading] = useState(true)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [error, setError] = useState<string | null>(null)

  /**
   * Fetch payment history from backend
   */
  const fetchPaymentHistory = useCallback(
    async (showRefreshSpinner = false) => {
      if (!user) return

      try {
        if (showRefreshSpinner) {
          setIsRefreshing(true)
        } else {
          setIsLoading(true)
        }
        setError(null)

        // Get Firebase ID token
        const idToken = await user.getIdToken()

        // Build query parameters
        const params = new URLSearchParams({
          page: pagination.page.toString(),
          limit: pagination.limit.toString()
        })

        // Add filters
        if (filters.status && filters.status !== 'ALL') {
          params.append('status', filters.status)
        }

        if (filters.startDate) {
          params.append('startDate', filters.startDate)
        }

        if (filters.endDate) {
          params.append('endDate', filters.endDate)
        }

        // Fetch from API
        const response = await fetch(`/api/assinante/payment-history?${params}`, {
          headers: {
            Authorization: `Bearer ${idToken}`
          }
        })

        if (!response.ok) {
          const errorData = await response.json().catch(() => null)
          throw new Error(errorData?.message || 'Erro ao buscar histórico de pagamentos')
        }

        const data: PaymentHistoryResponse = await response.json()

        setPayments(data.payments)
        setSummary(data.summary)
        setPagination(data.pagination)
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Erro desconhecido'
        setError(message)

        toast({
          title: 'Erro ao carregar pagamentos',
          description: message,
          variant: 'destructive'
        })

        console.error('[PaymentHistoryTable] Error fetching data:', err)
      } finally {
        setIsLoading(false)
        setIsRefreshing(false)
      }
    },
    [user, pagination.page, pagination.limit, filters]
  )

  // Initial data fetch
  useEffect(() => {
    if (user) {
      fetchPaymentHistory()
    }
  }, [user, pagination.page, pagination.limit, filters.status, filters.startDate, filters.endDate])

  /**
   * Handler para mudança de filtros
   */
  const handleFilterChange = useCallback(
    (key: keyof PaymentFilters, value: string) => {
      const newFilters = { ...filters, [key]: value === 'ALL' ? undefined : value }
      setFilters(newFilters)

      // Reset to page 1 when filters change
      setPagination((prev) => ({ ...prev, page: 1 }))
    },
    [filters]
  )

  /**
   * Handler para mudança de página
   */
  const handlePageChange = useCallback((newPage: number) => {
    setPagination((prev) => ({ ...prev, page: newPage }))
  }, [])

  /**
   * Manual retry handler
   */
  const handleRetry = useCallback(() => {
    fetchPaymentHistory(true)
  }, [fetchPaymentHistory])

  // Calcula números de página para paginação
  const pageNumbers = useMemo(() => {
    if (!pagination) return []

    const { page, pages } = pagination
    const delta = 2
    const range: number[] = []
    const rangeWithDots: (number | string)[] = []

    for (
      let i = Math.max(2, page - delta);
      i <= Math.min(pages - 1, page + delta);
      i++
    ) {
      range.push(i)
    }

    if (page - delta > 2) {
      rangeWithDots.push(1, '...')
    } else {
      rangeWithDots.push(1)
    }

    rangeWithDots.push(...range)

    if (page + delta < pages - 1) {
      rangeWithDots.push('...', pages)
    } else if (pages > 1) {
      rangeWithDots.push(pages)
    }

    return rangeWithDots
  }, [pagination])

  // Variantes de animação
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.05
      }
    }
  }

  const itemVariants = {
    hidden: { opacity: 0, x: -20 },
    visible: {
      opacity: 1,
      x: 0,
      transition: { duration: 0.3 }
    }
  }

  // Summary Cards
  const summaryCards = summary
    ? [
        {
          label: 'Total Pago',
          value: formatCurrency(summary.totalPaid),
          icon: DollarSign,
          color: 'text-green-600',
          bgColor: 'bg-green-50'
        },
        {
          label: 'Pendente',
          value: formatCurrency(summary.totalPending),
          icon: Clock,
          color: 'text-amber-600',
          bgColor: 'bg-amber-50'
        },
        {
          label: 'Pontualidade',
          value: `${summary.onTimePaymentRate}%`,
          icon: TrendingUp,
          color: 'text-cyan-600',
          bgColor: 'bg-cyan-50'
        }
      ]
    : []

  // Loading skeleton (initial load only)
  if (isLoading && !isRefreshing) {
    return (
      <div className={cn('space-y-4', className)}>
        {/* Summary Skeleton */}
        <div className="grid gap-4 md:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="pt-6">
                <div className="h-12 bg-muted rounded" />
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Table Skeleton */}
        <Card className="animate-pulse">
          <CardHeader>
            <div className="h-6 w-48 bg-muted rounded" />
          </CardHeader>
          <CardContent className="space-y-3">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="h-16 bg-muted rounded" />
            ))}
          </CardContent>
        </Card>
      </div>
    )
  }

  // Error state with retry
  if (error && !isRefreshing) {
    return (
      <div className={cn('space-y-4', className)}>
        <Card>
          <CardContent className="py-12">
            <div className="text-center">
              <AlertCircle className="h-12 w-12 mx-auto mb-4 text-red-500" />
              <h3 className="text-lg font-semibold mb-2">Erro ao carregar pagamentos</h3>
              <p className="text-sm text-muted-foreground mb-4">{error}</p>
              <Button onClick={handleRetry} variant="outline">
                <RefreshCw className="h-4 w-4 mr-2" />
                Tentar Novamente
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className={cn('space-y-6', className)}>
      {/* Summary Cards */}
      {summary && (
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="grid gap-4 md:grid-cols-3"
        >
          {summaryCards.map((card, index) => (
            <motion.div key={card.label} variants={itemVariants}>
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground mb-1">
                        {card.label}
                      </p>
                      <p className="text-2xl font-bold">{card.value}</p>
                    </div>
                    <div className={cn('rounded-full p-3', card.bgColor)}>
                      <card.icon className={cn('h-6 w-6', card.color)} />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </motion.div>
      )}

      {/* Main Table Card */}
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="h-5 w-5 text-cyan-600" />
              Histórico de Pagamentos
            </CardTitle>

            {/* Filtros */}
            <div className="flex flex-wrap items-center gap-2">
              <Select
                value={filters.status || 'ALL'}
                onValueChange={(value) => handleFilterChange('status', value)}
                disabled={isRefreshing}
              >
                <SelectTrigger className="w-[140px] h-9">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">Todos Status</SelectItem>
                  <SelectItem value="RECEIVED">Recebido</SelectItem>
                  <SelectItem value="CONFIRMED">Confirmado</SelectItem>
                  <SelectItem value="PENDING">Pendente</SelectItem>
                  <SelectItem value="OVERDUE">Vencido</SelectItem>
                  <SelectItem value="CANCELLED">Cancelado</SelectItem>
                  <SelectItem value="REFUNDED">Reembolsado</SelectItem>
                </SelectContent>
              </Select>

              {/* Refresh Button */}
              <Button
                variant="outline"
                size="icon"
                className="h-9 w-9"
                onClick={() => fetchPaymentHistory(true)}
                disabled={isRefreshing}
              >
                <RefreshCw className={cn('h-4 w-4', isRefreshing && 'animate-spin')} />
              </Button>
            </div>
          </div>
        </CardHeader>

        <CardContent>
          {payments.length === 0 ? (
            /* Empty State */
            <div className="text-center py-12">
              <CreditCard className="h-12 w-12 mx-auto mb-3 text-muted-foreground/50" />
              <p className="text-sm font-medium text-muted-foreground mb-1">
                Nenhum pagamento encontrado
              </p>
              <p className="text-xs text-muted-foreground">
                Tente ajustar os filtros para ver mais resultados
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Table - Desktop */}
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">
                        Data
                      </th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">
                        Descrição
                      </th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">
                        Valor
                      </th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">
                        Status
                      </th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">
                        Método
                      </th>
                      <th className="text-right py-3 px-4 text-sm font-medium text-muted-foreground">
                        Ações
                      </th>
                    </tr>
                  </thead>
                  <motion.tbody
                    variants={containerVariants}
                    initial="hidden"
                    animate="visible"
                  >
                    {payments.map((payment) => {
                      const statusConfig = getStatusConfig(payment.status)
                      const StatusIcon = statusConfig.icon
                      const displayDescription =
                        payment.description ||
                        `Mensalidade ${payment.invoiceNumber || payment.transactionId}`

                      return (
                        <motion.tr
                          key={payment.id}
                          variants={itemVariants}
                          className="border-b hover:bg-muted/50 transition-colors"
                        >
                          <td className="py-4 px-4 text-sm">
                            {formatDate(payment.dueDate)}
                          </td>
                          <td className="py-4 px-4 text-sm font-medium">
                            {displayDescription}
                          </td>
                          <td className="py-4 px-4 text-sm font-semibold">
                            {formatCurrency(payment.amount)}
                          </td>
                          <td className="py-4 px-4">
                            <Badge
                              variant="outline"
                              className={cn('border gap-1', statusConfig.color)}
                            >
                              <StatusIcon className="h-3 w-3" />
                              {statusConfig.text}
                            </Badge>
                          </td>
                          <td className="py-4 px-4 text-sm">
                            {getMethodText(payment.method)}
                          </td>
                          <td className="py-4 px-4">
                            <div className="flex items-center justify-end gap-2">
                              {payment.invoiceUrl && (
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8"
                                  asChild
                                >
                                  <a
                                    href={payment.invoiceUrl}
                                    download
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    title="Baixar Fatura"
                                  >
                                    <FileText className="h-4 w-4" />
                                  </a>
                                </Button>
                              )}
                              {payment.receiptUrl && (
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8"
                                  asChild
                                >
                                  <a
                                    href={payment.receiptUrl}
                                    download
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    title="Baixar Comprovante"
                                  >
                                    <Download className="h-4 w-4" />
                                  </a>
                                </Button>
                              )}
                            </div>
                          </td>
                        </motion.tr>
                      )
                    })}
                  </motion.tbody>
                </table>
              </div>

              {/* Cards - Mobile */}
              <motion.div
                variants={containerVariants}
                initial="hidden"
                animate="visible"
                className="md:hidden space-y-3"
              >
                {payments.map((payment) => {
                  const statusConfig = getStatusConfig(payment.status)
                  const StatusIcon = statusConfig.icon
                  const displayDescription =
                    payment.description ||
                    `Mensalidade ${payment.invoiceNumber || payment.transactionId}`

                  return (
                    <motion.div
                      key={payment.id}
                      variants={itemVariants}
                      className="border rounded-lg p-4 space-y-3"
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="font-medium text-sm mb-1">{displayDescription}</p>
                          <p className="text-xs text-muted-foreground">
                            {formatDate(payment.dueDate)}
                          </p>
                        </div>
                        <Badge
                          variant="outline"
                          className={cn('border gap-1', statusConfig.color)}
                        >
                          <StatusIcon className="h-3 w-3" />
                          {statusConfig.text}
                        </Badge>
                      </div>

                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-xs text-muted-foreground mb-1">Valor</p>
                          <p className="font-semibold">
                            {formatCurrency(payment.amount)}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground mb-1">Método</p>
                          <p className="text-sm">{getMethodText(payment.method)}</p>
                        </div>
                      </div>

                      {(payment.invoiceUrl || payment.receiptUrl) && (
                        <div className="flex gap-2 pt-2 border-t">
                          {payment.invoiceUrl && (
                            <Button
                              variant="outline"
                              size="sm"
                              className="flex-1"
                              asChild
                            >
                              <a
                                href={payment.invoiceUrl}
                                download
                                target="_blank"
                                rel="noopener noreferrer"
                              >
                                <FileText className="h-3 w-3 mr-2" />
                                Fatura
                              </a>
                            </Button>
                          )}
                          {payment.receiptUrl && (
                            <Button
                              variant="outline"
                              size="sm"
                              className="flex-1"
                              asChild
                            >
                              <a
                                href={payment.receiptUrl}
                                download
                                target="_blank"
                                rel="noopener noreferrer"
                              >
                                <Download className="h-3 w-3 mr-2" />
                                Comprovante
                              </a>
                            </Button>
                          )}
                        </div>
                      )}
                    </motion.div>
                  )
                })}
              </motion.div>

              {/* Paginação */}
              {pagination && pagination.pages > 1 && (
                <div className="flex items-center justify-between pt-4 border-t">
                  <p className="text-sm text-muted-foreground">
                    Mostrando {(pagination.page - 1) * pagination.limit + 1} -{' '}
                    {Math.min(pagination.page * pagination.limit, pagination.total)} de{' '}
                    {pagination.total} pagamentos
                  </p>

                  <div className="flex items-center gap-1">
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => handlePageChange(pagination.page - 1)}
                      disabled={pagination.page === 1 || isRefreshing}
                      aria-label="Página anterior"
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </Button>

                    {pageNumbers.map((pageNum, index) =>
                      typeof pageNum === 'number' ? (
                        <Button
                          key={index}
                          variant={pageNum === pagination.page ? 'default' : 'outline'}
                          size="icon"
                          className={cn(
                            'h-8 w-8',
                            pageNum === pagination.page && 'bg-cyan-600 hover:bg-cyan-700'
                          )}
                          onClick={() => handlePageChange(pageNum)}
                          disabled={isRefreshing}
                          aria-label={`Página ${pageNum}`}
                          aria-current={pageNum === pagination.page ? 'page' : undefined}
                        >
                          {pageNum}
                        </Button>
                      ) : (
                        <span key={index} className="px-2 text-muted-foreground">
                          {pageNum}
                        </span>
                      )
                    )}

                    <Button
                      variant="outline"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => handlePageChange(pagination.page + 1)}
                      disabled={pagination.page === pagination.pages || isRefreshing}
                      aria-label="Próxima página"
                    >
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
