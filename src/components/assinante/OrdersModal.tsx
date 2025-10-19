'use client'

import { useState, useEffect } from 'react'
import { X, Package, Truck, Calendar, ExternalLink } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { Button } from '@/components/ui/button'
import { formatDate, formatCurrency } from '@/lib/formatters'
import { getOrderStatusColor, getOrderStatusLabel } from '@/lib/subscription-helpers'

interface Order {
  id: string
  subscriptionId: string
  status: string
  planName: string
  amount: number
  trackingCode: string | null
  shippingDate: string | null
  deliveryDate: string | null
  createdAt: string
  updatedAt: string
}

interface OrdersModalProps {
  isOpen: boolean
  onClose: () => void
}

export function OrdersModal({ isOpen, onClose }: OrdersModalProps) {
  const { user } = useAuth()
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)

  useEffect(() => {
    if (isOpen && user) {
      fetchOrders()
    }
  }, [isOpen, user, page])

  const fetchOrders = async () => {
    if (!user) return

    try {
      setLoading(true)
      setError(null)

      const token = await user.getIdToken()

      const response = await fetch(`/api/assinante/orders?page=${page}&limit=10`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      })

      if (!response.ok) {
        throw new Error('Erro ao carregar pedidos')
      }

      const data = await response.json()
      setOrders(data.orders)
      setTotalPages(data.pagination.totalPages)
    } catch (err: any) {
      setError(err.message || 'Erro ao carregar pedidos')
    } finally {
      setLoading(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen p-4">
        {/* Backdrop */}
        <div
          className="fixed inset-0 bg-black bg-opacity-50 transition-opacity"
          onClick={onClose}
        />

        {/* Modal */}
        <div className="relative bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b">
            <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              <Package className="h-6 w-6 text-cyan-600" />
              Histórico de Pedidos
            </h2>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Content */}
          <div className="p-6 overflow-y-auto max-h-[calc(90vh-140px)]">
            {loading && (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-600"></div>
              </div>
            )}

            {error && (
              <div className="text-center py-12">
                <p className="text-red-600 mb-4">{error}</p>
                <Button onClick={fetchOrders} variant="outline">
                  Tentar Novamente
                </Button>
              </div>
            )}

            {!loading && !error && orders.length === 0 && (
              <div className="text-center py-12">
                <Package className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">Nenhum pedido encontrado</p>
              </div>
            )}

            {!loading && !error && orders.length > 0 && (
              <div className="space-y-4">
                {orders.map((order) => (
                  <div
                    key={order.id}
                    className="border rounded-lg p-4 hover:shadow-md transition-shadow"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <p className="font-semibold text-gray-900">
                          {order.planName}
                        </p>
                        <p className="text-sm text-gray-600">
                          Pedido #{order.id.slice(-8)}
                        </p>
                      </div>
                      <span className={`px-2 py-1 text-xs rounded-full font-medium ${getOrderStatusColor(order.status)}`}>
                        {getOrderStatusLabel(order.status)}
                      </span>
                    </div>

                    <div className="grid md:grid-cols-2 gap-4 text-sm">
                      <div>
                        <p className="text-gray-600 flex items-center gap-1">
                          <Calendar className="h-4 w-4" />
                          Data do pedido:
                        </p>
                        <p className="font-medium">{formatDate(order.createdAt)}</p>
                      </div>

                      {order.shippingDate && (
                        <div>
                          <p className="text-gray-600 flex items-center gap-1">
                            <Truck className="h-4 w-4" />
                            Data de envio:
                          </p>
                          <p className="font-medium">{formatDate(order.shippingDate)}</p>
                        </div>
                      )}

                      {order.deliveryDate && (
                        <div>
                          <p className="text-gray-600">Data de entrega:</p>
                          <p className="font-medium">{formatDate(order.deliveryDate)}</p>
                        </div>
                      )}

                      <div>
                        <p className="text-gray-600">Valor:</p>
                        <p className="font-bold text-cyan-600">{formatCurrency(order.amount)}</p>
                      </div>
                    </div>

                    {order.trackingCode && (
                      <div className="mt-3 pt-3 border-t">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm text-gray-600">Código de rastreio:</p>
                            <p className="font-mono text-sm font-medium">{order.trackingCode}</p>
                          </div>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => window.open(`https://rastreamento.correios.com.br/app/index.php?objeto=${order.trackingCode}`, '_blank')}
                          >
                            <ExternalLink className="h-4 w-4 mr-1" />
                            Rastrear
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Pagination */}
          {!loading && !error && totalPages > 1 && (
            <div className="flex items-center justify-between p-6 border-t">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
              >
                Anterior
              </Button>
              <span className="text-sm text-gray-600">
                Página {page} de {totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
              >
                Próxima
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
