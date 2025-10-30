'use client'

/**
 * Admin Audit Dashboard - LGPD Article 37 Compliance
 *
 * View and analyze audit logs for all sensitive operations.
 * Required for compliance with Brazilian data protection law.
 *
 * Features:
 * - Real-time audit log viewing
 * - Advanced filtering (user, action, date range, entity type)
 * - CSV export for compliance reporting
 * - Retention policy enforcement (7 years)
 * - IP and user agent tracking
 *
 * Access: Admin users only
 *
 * @author Dr. Philipe Saraiva Cruz
 */

import { useState, useEffect } from 'react'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'

interface AuditLog {
  id: string
  userId: string
  action: string
  entityType: string
  entityId: string | null
  oldValue: any
  newValue: any
  ipAddress: string | null
  userAgent: string | null
  timestamp: string
  user: {
    id: string
    name: string | null
    email: string
  }
}

interface FilterOptions {
  userId?: string
  action?: string
  entityType?: string
  startDate?: string
  endDate?: string
}

export default function AuditDashboardPage() {
  const [logs, setLogs] = useState<AuditLog[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [filters, setFilters] = useState<FilterOptions>({})
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null)

  // Fetch audit logs
  const fetchLogs = async () => {
    setLoading(true)
    setError(null)

    try {
      const params = new URLSearchParams()
      if (filters.userId) params.append('userId', filters.userId)
      if (filters.action) params.append('action', filters.action)
      if (filters.entityType) params.append('entityType', filters.entityType)
      if (filters.startDate) params.append('startDate', filters.startDate)
      if (filters.endDate) params.append('endDate', filters.endDate)

      const response = await fetch(`/api/admin/audit?${params.toString()}`)

      if (!response.ok) {
        throw new Error('Erro ao carregar logs de auditoria')
      }

      const data = await response.json()
      setLogs(data.logs || [])
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchLogs()
  }, [filters])

  // Export to CSV
  const exportToCsv = () => {
    const headers = [
      'Timestamp',
      'User ID',
      'User Email',
      'Action',
      'Entity Type',
      'Entity ID',
      'IP Address',
      'User Agent',
    ]

    const rows = logs.map((log) => [
      format(new Date(log.timestamp), 'yyyy-MM-dd HH:mm:ss'),
      log.userId,
      log.user.email,
      log.action,
      log.entityType,
      log.entityId || '',
      log.ipAddress || '',
      log.userAgent || '',
    ])

    const csvContent = [
      headers.join(','),
      ...rows.map((row) =>
        row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(',')
      ),
    ].join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    link.href = URL.createObjectURL(blob)
    link.download = `audit-logs-${format(new Date(), 'yyyy-MM-dd')}.csv`
    link.click()
  }

  // Format JSON for display
  const formatJson = (value: any) => {
    if (!value) return 'N/A'
    try {
      return JSON.stringify(value, null, 2)
    } catch {
      return String(value)
    }
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Auditoria LGPD - Logs de Acesso
        </h1>
        <p className="text-gray-600">
          Registro completo de operações sensíveis conforme Artigo 37 da LGPD
        </p>
        <p className="text-sm text-gray-500 mt-1">
          Retenção obrigatória: 7 anos • Logs imutáveis (append-only)
        </p>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
        <h2 className="text-lg font-semibold mb-4">Filtros</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Ação
            </label>
            <select
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
              value={filters.action || ''}
              onChange={(e) =>
                setFilters({ ...filters, action: e.target.value || undefined })
              }
            >
              <option value="">Todas as ações</option>
              <option value="UPDATE_SHIPPING_ADDRESS">
                Atualizar endereço
              </option>
              <option value="CHANGE_SUBSCRIPTION_PLAN">Mudar plano</option>
              <option value="UPDATE_PAYMENT_METHOD">
                Atualizar pagamento
              </option>
              <option value="UPLOAD_PRESCRIPTION">Upload de receita</option>
              <option value="DELETE_PRESCRIPTION">Excluir receita</option>
              <option value="ACCESS_PERSONAL_DATA">Acessar dados pessoais</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Tipo de Entidade
            </label>
            <select
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
              value={filters.entityType || ''}
              onChange={(e) =>
                setFilters({
                  ...filters,
                  entityType: e.target.value || undefined,
                })
              }
            >
              <option value="">Todos os tipos</option>
              <option value="Subscription">Assinatura</option>
              <option value="Prescription">Receita</option>
              <option value="Payment">Pagamento</option>
              <option value="User">Usuário</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              ID do Usuário
            </label>
            <input
              type="text"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
              placeholder="Filtrar por usuário..."
              value={filters.userId || ''}
              onChange={(e) =>
                setFilters({ ...filters, userId: e.target.value || undefined })
              }
            />
          </div>
        </div>

        <div className="flex gap-4 mt-4">
          <button
            onClick={() => setFilters({})}
            className="px-4 py-2 text-sm text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition"
          >
            Limpar filtros
          </button>
          <button
            onClick={exportToCsv}
            disabled={logs.length === 0}
            className="px-4 py-2 text-sm text-white bg-cyan-600 rounded-lg hover:bg-cyan-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Exportar CSV
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-lg shadow-sm p-4">
          <div className="text-sm text-gray-600 mb-1">Total de Logs</div>
          <div className="text-2xl font-bold text-gray-900">{logs.length}</div>
        </div>
        <div className="bg-white rounded-lg shadow-sm p-4">
          <div className="text-sm text-gray-600 mb-1">Usuários Únicos</div>
          <div className="text-2xl font-bold text-gray-900">
            {new Set(logs.map((l) => l.userId)).size}
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-sm p-4">
          <div className="text-sm text-gray-600 mb-1">Ações Hoje</div>
          <div className="text-2xl font-bold text-gray-900">
            {
              logs.filter(
                (l) =>
                  new Date(l.timestamp).toDateString() ===
                  new Date().toDateString()
              ).length
            }
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-sm p-4">
          <div className="text-sm text-gray-600 mb-1">Ação Mais Comum</div>
          <div className="text-sm font-semibold text-gray-900">
            {logs.length > 0
              ? Object.entries(
                  logs.reduce(
                    (acc, l) => ({
                      ...acc,
                      [l.action]: (acc[l.action] || 0) + 1,
                    }),
                    {} as Record<string, number>
                  )
                ).sort(([, a], [, b]) => b - a)[0]?.[0] || 'N/A'
              : 'N/A'}
          </div>
        </div>
      </div>

      {/* Logs Table */}
      <div className="bg-white rounded-lg shadow-sm overflow-hidden">
        {loading && (
          <div className="p-8 text-center text-gray-500">
            Carregando logs...
          </div>
        )}

        {error && (
          <div className="p-8 text-center">
            <p className="text-red-600 mb-4">{error}</p>
            <button
              onClick={fetchLogs}
              className="px-4 py-2 text-sm text-white bg-cyan-600 rounded-lg hover:bg-cyan-700 transition"
            >
              Tentar novamente
            </button>
          </div>
        )}

        {!loading && !error && logs.length === 0 && (
          <div className="p-8 text-center text-gray-500">
            Nenhum log encontrado com os filtros aplicados.
          </div>
        )}

        {!loading && !error && logs.length > 0 && (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Timestamp
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Usuário
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Ação
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Entidade
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    IP Address
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Ações
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {logs.map((log) => (
                  <tr
                    key={log.id}
                    className="hover:bg-gray-50 transition cursor-pointer"
                    onClick={() => setSelectedLog(log)}
                  >
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                      {format(
                        new Date(log.timestamp),
                        "dd/MM/yyyy 'às' HH:mm",
                        { locale: ptBR }
                      )}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm">
                      <div className="text-gray-900">
                        {log.user.name || 'Sem nome'}
                      </div>
                      <div className="text-gray-500 text-xs">
                        {log.user.email}
                      </div>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm">
                      <span className="px-2 py-1 text-xs font-medium rounded-full bg-cyan-100 text-cyan-800">
                        {log.action.replace(/_/g, ' ')}
                      </span>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                      {log.entityType}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                      {log.ipAddress || 'N/A'}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm">
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          setSelectedLog(log)
                        }}
                        className="text-cyan-600 hover:text-cyan-700 font-medium"
                      >
                        Ver detalhes
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Detail Modal */}
      {selectedLog && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
          onClick={() => setSelectedLog(null)}
        >
          <div
            className="bg-white rounded-lg max-w-3xl w-full max-h-[90vh] overflow-y-auto p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-start mb-6">
              <h2 className="text-2xl font-bold text-gray-900">
                Detalhes do Log de Auditoria
              </h2>
              <button
                onClick={() => setSelectedLog(null)}
                className="text-gray-400 hover:text-gray-600 text-2xl"
              >
                ×
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  ID do Log
                </label>
                <p className="text-sm text-gray-900 font-mono">{selectedLog.id}</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Timestamp
                </label>
                <p className="text-sm text-gray-900">
                  {format(
                    new Date(selectedLog.timestamp),
                    "dd/MM/yyyy 'às' HH:mm:ss",
                    { locale: ptBR }
                  )}
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Usuário
                </label>
                <p className="text-sm text-gray-900">
                  {selectedLog.user.name || 'Sem nome'} ({selectedLog.user.email})
                </p>
                <p className="text-xs text-gray-500 font-mono">
                  ID: {selectedLog.userId}
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Ação
                </label>
                <span className="px-3 py-1 text-sm font-medium rounded-full bg-cyan-100 text-cyan-800">
                  {selectedLog.action.replace(/_/g, ' ')}
                </span>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Entidade Afetada
                </label>
                <p className="text-sm text-gray-900">
                  {selectedLog.entityType}{' '}
                  {selectedLog.entityId && `(ID: ${selectedLog.entityId})`}
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Endereço IP
                </label>
                <p className="text-sm text-gray-900 font-mono">
                  {selectedLog.ipAddress || 'N/A'}
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  User Agent
                </label>
                <p className="text-sm text-gray-900 break-all">
                  {selectedLog.userAgent || 'N/A'}
                </p>
              </div>

              {selectedLog.oldValue && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Valor Anterior
                  </label>
                  <pre className="text-xs text-gray-900 bg-gray-50 p-3 rounded-lg overflow-x-auto">
                    {formatJson(selectedLog.oldValue)}
                  </pre>
                </div>
              )}

              {selectedLog.newValue && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Valor Novo
                  </label>
                  <pre className="text-xs text-gray-900 bg-gray-50 p-3 rounded-lg overflow-x-auto">
                    {formatJson(selectedLog.newValue)}
                  </pre>
                </div>
              )}
            </div>

            <div className="mt-6 flex justify-end">
              <button
                onClick={() => setSelectedLog(null)}
                className="px-4 py-2 text-sm text-white bg-cyan-600 rounded-lg hover:bg-cyan-700 transition"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
