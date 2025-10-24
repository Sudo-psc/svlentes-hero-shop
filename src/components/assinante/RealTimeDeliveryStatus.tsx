/**
 * Real-Time Delivery Status Component - Phase 2
 */

'use client'

import { useEffect, useState, useCallback } from 'react'
import { Card } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { Package, Truck, MapPin, Clock, RefreshCcw } from 'lucide-react'
import { useApiMonitoring } from '@/hooks/useApiMonitoring'

interface TimelineEvent {
  status: string
  description: string
  timestamp: string
  location?: string
}

interface DeliveryStatus {
  status: 'scheduled' | 'processing' | 'shipped' | 'in_transit' | 'out_for_delivery' | 'delivered'
  progress: number
  estimatedArrival: string
  daysRemaining: number
  trackingCode?: string
  carrier?: string
  timeline: TimelineEvent[]
  lastUpdate?: string
}

interface Props {
  subscriptionId: string
}

const REFRESH_INTERVAL_MS = 5 * 60 * 1000
const CACHE_KEY = 'delivery_status_cache'
const CACHE_TTL_MS = 10 * 60 * 1000

export function RealTimeDeliveryStatus({ subscriptionId }: Props) {
  const [deliveryStatus, setDeliveryStatus] = useState<DeliveryStatus | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [retryCount, setRetryCount] = useState(0)

  const { monitoredFetch } = useApiMonitoring()

  const loadFromCache = useCallback((): DeliveryStatus | null => {
    try {
      const cached = localStorage.getItem(CACHE_KEY)
      if (!cached) return null

      const { data, expires } = JSON.parse(cached)
      if (expires < Date.now()) {
        localStorage.removeItem(CACHE_KEY)
        return null
      }

      return data
    } catch (err) {
      return null
    }
  }, [])

  const saveToCache = useCallback((data: DeliveryStatus) => {
    try {
      localStorage.setItem(CACHE_KEY, JSON.stringify({
        data,
        expires: Date.now() + CACHE_TTL_MS,
      }))
    } catch (err) {
      console.warn('Cache write error:', err)
    }
  }, [])

  const fetchDeliveryStatus = useCallback(async () => {
    setLoading(true)
    setError(null)

    try {
      const data = await monitoredFetch(
        `/api/assinante/delivery-status?subscriptionId=${subscriptionId}`,
        { method: 'GET' }
      )

      if (data.success && data.currentDelivery) {
        setDeliveryStatus(data.currentDelivery)
        saveToCache(data.currentDelivery)
        setRetryCount(0)
      } else {
        throw new Error('Invalid API response')
      }
    } catch (err) {
      const cachedData = loadFromCache()
      if (cachedData) {
        setDeliveryStatus(cachedData)
        setError('Mostrando último status conhecido.')
      } else {
        setError('Não conseguimos carregar o status da sua entrega.')
      }
      setRetryCount(prev => prev + 1)
    } finally {
      setLoading(false)
    }
  }, [subscriptionId, monitoredFetch, loadFromCache, saveToCache])

  useEffect(() => {
    const cachedData = loadFromCache()
    if (cachedData) {
      setDeliveryStatus(cachedData)
      setLoading(false)
    }

    fetchDeliveryStatus()

    const interval = setInterval(() => {
      if (retryCount === 0) fetchDeliveryStatus()
    }, REFRESH_INTERVAL_MS * Math.pow(2, Math.min(retryCount, 3)))

    return () => clearInterval(interval)
  }, [fetchDeliveryStatus, retryCount, loadFromCache])

  if (loading && !deliveryStatus) {
    return (
      <Card className="p-6">
        <div className="space-y-4">
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-24 w-full" />
        </div>
      </Card>
    )
  }

  if (error && !deliveryStatus) {
    return (
      <Card className="p-6 border-amber-200 bg-amber-50">
        <div className="flex items-start gap-3">
          <Package className="w-5 h-5 text-amber-600 mt-0.5" />
          <div className="flex-1">
            <p className="text-sm text-amber-800 mb-3">{error}</p>
            <Button variant="outline" size="sm" onClick={() => fetchDeliveryStatus()}>
              <RefreshCcw className="w-4 h-4 mr-2" />
              Tentar novamente
            </Button>
          </div>
        </div>
      </Card>
    )
  }

  if (!deliveryStatus) return null

  const statusIcons = {
    scheduled: Package,
    processing: Package,
    shipped: Truck,
    in_transit: Truck,
    out_for_delivery: MapPin,
    delivered: Package,
  }

  const StatusIcon = statusIcons[deliveryStatus.status]

  return (
    <Card className="p-6">
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <StatusIcon className="w-6 h-6 text-cyan-600" />
          <div>
            <h3 className="font-semibold text-gray-900">
              {deliveryStatus.trackingCode ? 'Rastreando Entrega' : 'Próxima Entrega'}
            </h3>
            <p className="text-sm text-gray-500">
              {deliveryStatus.trackingCode || `Estimada para ${deliveryStatus.estimatedArrival}`}
            </p>
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span>Progresso</span>
            <span>{deliveryStatus.progress}%</span>
          </div>
          <Progress value={deliveryStatus.progress} className="h-2" />
        </div>

        <div className="flex items-center gap-2 text-sm text-gray-600">
          <Clock className="w-4 h-4" />
          <span>Chega em {deliveryStatus.daysRemaining} dias</span>
        </div>

        {error && <div className="text-xs text-amber-600"><Clock className="w-3 h-3 inline mr-1" />Último status conhecido</div>}
      </div>
    </Card>
  )
}
