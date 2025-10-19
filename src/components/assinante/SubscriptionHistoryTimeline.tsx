'use client'

import { useEffect, useState } from 'react'
import { Clock, Package, MapPin, CreditCard, TrendingUp, AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface HistoryEntry {
  id: string
  changeType: string
  description: string
  oldValue: any
  newValue: any
  metadata: any
  createdAt: string
}

interface HistoryResponse {
  history: HistoryEntry[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
    hasMore: boolean
  }
}

interface SubscriptionHistoryTimelineProps {
  userId: string
}

const changeTypeIcons: Record<string, any> = {
  PLAN_CHANGE: TrendingUp,
  ADDRESS_UPDATE: MapPin,
  PAYMENT_METHOD_UPDATE: CreditCard,
  STATUS_CHANGE: AlertCircle,
  SUBSCRIPTION_CREATED: Package,
  SUBSCRIPTION_CANCELLED: AlertCircle,
  SUBSCRIPTION_PAUSED: AlertCircle,
  SUBSCRIPTION_RESUMED: Package
}

const changeTypeColors: Record<string, string> = {
  PLAN_CHANGE: 'text-cyan-600 bg-cyan-50',
  ADDRESS_UPDATE: 'text-blue-600 bg-blue-50',
  PAYMENT_METHOD_UPDATE: 'text-green-600 bg-green-50',
  STATUS_CHANGE: 'text-amber-600 bg-amber-50',
  SUBSCRIPTION_CREATED: 'text-purple-600 bg-purple-50',
  SUBSCRIPTION_CANCELLED: 'text-red-600 bg-red-50',
  SUBSCRIPTION_PAUSED: 'text-gray-600 bg-gray-50',
  SUBSCRIPTION_RESUMED: 'text-emerald-600 bg-emerald-50'
}

export function SubscriptionHistoryTimeline({ userId }: SubscriptionHistoryTimelineProps) {
  const [history, setHistory] = useState<HistoryEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [pagination, setPagination] = useState({
    page: 1,
    hasMore: false,
    total: 0
  })

  const fetchHistory = async (page: number = 1) => {
    try {
      setLoading(true)
      setError(null)

      const response = await fetch(`/api/subscription/history?page=${page}&limit=10`, {
        headers: {
          'x-user-id': userId
        }
      })

      if (!response.ok) {
        throw new Error('Erro ao carregar histórico')
      }

      const data: HistoryResponse = await response.json()

      if (page === 1) {
        setHistory(data.history)
      } else {
        setHistory(prev => [...prev, ...data.history])
      }

      setPagination({
        page: data.pagination.page,
        hasMore: data.pagination.hasMore,
        total: data.pagination.total
      })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao carregar histórico')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchHistory(1)
  }, [userId])

  const loadMore = () => {
    if (!loading && pagination.hasMore) {
      fetchHistory(pagination.page + 1)
    }
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return new Intl.DateTimeFormat('pt-BR', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date)
  }

  if (loading && history.length === 0) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-cyan-600"></div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <p className="text-red-600 text-sm">{error}</p>
        <Button
          variant="outline"
          size="sm"
          onClick={() => fetchHistory(1)}
          className="mt-2"
        >
          Tentar Novamente
        </Button>
      </div>
    )
  }

  if (history.length === 0) {
    return (
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-8 text-center">
        <Clock className="h-12 w-12 text-gray-400 mx-auto mb-3" />
        <p className="text-gray-600 font-medium">Nenhuma alteração registrada</p>
        <p className="text-gray-500 text-sm mt-1">
          Seu histórico de alterações aparecerá aqui
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Timeline */}
      <div className="relative">
        {/* Vertical line */}
        <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-gray-200" />

        {/* History entries */}
        <div className="space-y-6">
          {history.map((entry, index) => {
            const Icon = changeTypeIcons[entry.changeType] || AlertCircle
            const colorClass = changeTypeColors[entry.changeType] || 'text-gray-600 bg-gray-50'

            return (
              <div key={entry.id} className="relative pl-12">
                {/* Icon */}
                <div className={`absolute left-0 w-8 h-8 rounded-full ${colorClass} flex items-center justify-center border-2 border-white shadow`}>
                  <Icon className="h-4 w-4" />
                </div>

                {/* Content */}
                <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
                  <div className="flex items-start justify-between gap-4 mb-2">
                    <p className="text-gray-900 font-medium text-sm">
                      {entry.description}
                    </p>
                    <span className="text-gray-500 text-xs whitespace-nowrap flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {formatDate(entry.createdAt)}
                    </span>
                  </div>

                  {/* Optional: Show old/new values for some types */}
                  {entry.changeType === 'PLAN_CHANGE' && entry.oldValue && entry.newValue && (
                    <div className="grid grid-cols-2 gap-4 mt-3 pt-3 border-t border-gray-100 text-xs">
                      <div>
                        <span className="text-gray-500 block mb-1">Anterior:</span>
                        <span className="text-gray-900 font-medium">
                          {entry.oldValue.planType}
                        </span>
                        <span className="text-gray-600 ml-2">
                          R$ {parseFloat(entry.oldValue.monthlyValue).toFixed(2)}
                        </span>
                      </div>
                      <div>
                        <span className="text-gray-500 block mb-1">Novo:</span>
                        <span className="text-cyan-600 font-medium">
                          {entry.newValue.planType}
                        </span>
                        <span className="text-cyan-600 ml-2">
                          R$ {parseFloat(entry.newValue.monthlyValue).toFixed(2)}
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Load More Button */}
      {pagination.hasMore && (
        <div className="flex justify-center pt-4">
          <Button
            variant="outline"
            onClick={loadMore}
            disabled={loading}
          >
            {loading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-cyan-600 mr-2"></div>
                Carregando...
              </>
            ) : (
              `Carregar Mais (${pagination.total - history.length} restantes)`
            )}
          </Button>
        </div>
      )}

      {/* Footer summary */}
      <div className="text-center text-sm text-gray-500 pt-2 border-t">
        Exibindo {history.length} de {pagination.total} alterações
      </div>
    </div>
  )
}
