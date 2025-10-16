'use client'

import { useState, useEffect } from 'react'
import { X, FileText, Calendar, Download, CreditCard } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { Button } from '@/components/ui/Button'

interface Invoice {
  id: string
  subscriptionId: string
  status: string
  planName: string
  amount: number
  dueDate: string
  paidAt: string | null
  invoiceUrl: string | null
  boletoUrl: string | null
  pixCode: string | null
  pixQrCode: string | null
  createdAt: string
}

interface InvoicesModalProps {
  isOpen: boolean
  onClose: () => void
}

export function InvoicesModal({ isOpen, onClose }: InvoicesModalProps) {
  const { user } = useAuth()
  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)

  useEffect(() => {
    if (isOpen && user) {
      fetchInvoices()
    }
  }, [isOpen, user, page])

  const fetchInvoices = async () => {
    if (!user) return

    try {
      setLoading(true)
      setError(null)

      const token = await user.getIdToken()

      const response = await fetch(`/api/assinante/invoices?page=${page}&limit=10`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      })

      if (!response.ok) {
        throw new Error('Erro ao carregar faturas')
      }

      const data = await response.json()
      setInvoices(data.invoices)
      setTotalPages(data.pagination.totalPages)
    } catch (err: any) {
      setError(err.message || 'Erro ao carregar faturas')
    } finally {
      setLoading(false)
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    })
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value)
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'paid':
      case 'received':
      case 'confirmed':
        return 'bg-green-100 text-green-800'
      case 'pending':
        return 'bg-yellow-100 text-yellow-800'
      case 'overdue':
        return 'bg-red-100 text-red-800'
      case 'cancelled':
        return 'bg-gray-100 text-gray-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      'paid': 'Pago',
      'received': 'Recebido',
      'confirmed': 'Confirmado',
      'pending': 'Pendente',
      'overdue': 'Vencido',
      'cancelled': 'Cancelado'
    }
    return labels[status] || status
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
              <FileText className="h-6 w-6 text-cyan-600" />
              Histórico de Faturas
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
                <Button onClick={fetchInvoices} variant="outline">
                  Tentar Novamente
                </Button>
              </div>
            )}

            {!loading && !error && invoices.length === 0 && (
              <div className="text-center py-12">
                <FileText className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">Nenhuma fatura encontrada</p>
              </div>
            )}

            {!loading && !error && invoices.length > 0 && (
              <div className="space-y-4">
                {invoices.map((invoice) => (
                  <div
                    key={invoice.id}
                    className="border rounded-lg p-4 hover:shadow-md transition-shadow"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <p className="font-semibold text-gray-900">
                          {invoice.planName}
                        </p>
                        <p className="text-sm text-gray-600">
                          Fatura #{invoice.id.slice(-8)}
                        </p>
                      </div>
                      <span className={`px-2 py-1 text-xs rounded-full font-medium ${getStatusColor(invoice.status)}`}>
                        {getStatusLabel(invoice.status)}
                      </span>
                    </div>

                    <div className="grid md:grid-cols-2 gap-4 text-sm mb-3">
                      <div>
                        <p className="text-gray-600 flex items-center gap-1">
                          <Calendar className="h-4 w-4" />
                          Data de vencimento:
                        </p>
                        <p className="font-medium">{formatDate(invoice.dueDate)}</p>
                      </div>

                      {invoice.paidAt && (
                        <div>
                          <p className="text-gray-600 flex items-center gap-1">
                            <CreditCard className="h-4 w-4" />
                            Data de pagamento:
                          </p>
                          <p className="font-medium">{formatDate(invoice.paidAt)}</p>
                        </div>
                      )}

                      <div>
                        <p className="text-gray-600">Valor:</p>
                        <p className="font-bold text-cyan-600">{formatCurrency(invoice.amount)}</p>
                      </div>
                    </div>

                    {/* Download Actions */}
                    {(invoice.invoiceUrl || invoice.boletoUrl) && (
                      <div className="flex flex-wrap gap-2 pt-3 border-t">
                        {invoice.invoiceUrl && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => window.open(invoice.invoiceUrl!, '_blank')}
                          >
                            <Download className="h-4 w-4 mr-1" />
                            Baixar Fatura
                          </Button>
                        )}
                        {invoice.boletoUrl && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => window.open(invoice.boletoUrl!, '_blank')}
                          >
                            <Download className="h-4 w-4 mr-1" />
                            Baixar Boleto
                          </Button>
                        )}
                      </div>
                    )}

                    {/* PIX Information */}
                    {invoice.pixCode && (
                      <div className="mt-3 pt-3 border-t">
                        <p className="text-sm font-medium text-gray-900 mb-2">PIX Copia e Cola:</p>
                        <div className="bg-gray-50 p-2 rounded border">
                          <code className="text-xs break-all">{invoice.pixCode}</code>
                        </div>
                        {invoice.pixQrCode && (
                          <div className="mt-2 flex justify-center">
                            <img
                              src={invoice.pixQrCode}
                              alt="QR Code PIX"
                              className="h-40 w-40"
                            />
                          </div>
                        )}
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
