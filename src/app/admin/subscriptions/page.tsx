'use client'

import React, { useState, useCallback, useEffect } from 'react'
import { motion } from 'framer-motion'
import {
  ShoppingCart,
  CreditCard,
  Calendar,
  DollarSign,
  Users,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Clock,
  RefreshCw,
  Search,
  Filter,
  Download,
  Eye,
  Edit,
  Pause,
  Play,
  Trash2,
  TrendingUp,
  TrendingDown,
  MoreHorizontal,
  CreditCard as CreditCardIcon,
  FileText,
  BarChart3
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { useAdminAuth } from '@/components/admin/providers/AdminAuthProvider'
import { cn } from '@/lib/utils'

// Interfaces específicas para ASAAS
interface AsaasSubscription {
  id: string
  asaasId: string
  customer: {
    id: string
    name: string
    email: string
    phone: string
    cpf: string
    customerId: string // Asaas customer ID
  }
  plan: {
    id: string
    name: string
    description: string
    value: number
    billingCycle: 'MONTHLY' | 'YEARLY' | 'WEEKLY' | 'QUARTERLY'
    maxPayments: number
    nextDueDate: string
    status: 'ACTIVE' | 'SUSPENDED' | 'CANCELLED' | 'OVERDUE'
  }
  payments: {
    id: string
    status: 'PENDING' | 'CONFIRMED' | 'RECEIVED' | 'OVERDUE' | 'REFUNDED' | 'FAILED'
    value: number
    dueDate: string
    paymentDate?: string
    invoiceUrl: string
    invoiceNumber: string
    paymentMethod: 'BOLETO' | 'CREDIT_CARD' | 'PIX' | 'DEBIT_CARD'
  }[]
  subscription: {
    id: string
    code: string
    status: 'ACTIVE' | 'SUSPENDED' | 'CANCELED'
    plan: string
    value: number
    nextPaymentDate: string
    billingType: 'PREPAID' | 'POSTPAID'
    startDate: string
    endDate?: string
    maxPayments?: number
    currentPayment?: number
  }
  metadata: {
    medicalPrescriptionId?: string
    doctorName?: string
    doctorCRM?: string
    prescriptionExpiry?: string
    lastAppointment?: string
    nextAppointment?: string
    notes?: string
  }
  createdAt: string
  updatedAt: string
  webhookEvents: {
    id: string
    event: 'PAYMENT_CONFIRMED' | 'PAYMENT_OVERDUE' | 'SUBSCRIPTION_CREATED' | 'SUBSCRIPTION_DELETED'
    createdAt: string
    data: any
  }[]
}

const mockAsaasSubscriptions: AsaasSubscription[] = [
  {
    id: '1',
    asaasId: 'sub_123456789',
    customer: {
      id: '1',
      name: 'Ana Maria Silva',
      email: 'ana.silva@email.com',
      phone: '+55 33 99989-8026',
      cpf: '123.456.789-00',
      customerId: 'cus_abc123def456'
    },
    plan: {
      id: 'pln_monthly_premium',
      name: 'Mensal Premium',
      description: 'Lentes de contato mensais com entrega',
      value: 89.90,
      billingCycle: 'MONTHLY',
      maxPayments: 12,
      nextDueDate: '2024-02-15',
      status: 'ACTIVE'
    },
    payments: [
      {
        id: 'pay_123',
        status: 'RECEIVED',
        value: 89.90,
        dueDate: '2024-01-15',
        paymentDate: '2024-01-14',
        invoiceUrl: 'https://asaas.com.br/invoice/123',
        invoiceNumber: 'INV-2024-001',
        paymentMethod: 'BOLETO'
      },
      {
        id: 'pay_124',
        status: 'PENDING',
        value: 89.90,
        dueDate: '2024-02-15',
        invoiceUrl: 'https://asaas.com.br/invoice/124',
        invoiceNumber: 'INV-2024-002',
        paymentMethod: 'BOLETO'
      }
    ],
    subscription: {
      id: 'sub_asaas_123',
      code: 'SUB-001',
      status: 'ACTIVE',
      plan: 'Mensal Premium',
      value: 89.90,
      nextPaymentDate: '2024-02-15',
      billingType: 'PREPAID',
      startDate: '2023-12-15',
      maxPayments: 12,
      currentPayment: 2
    },
    metadata: {
      medicalPrescriptionId: 'presc_123',
      doctorName: 'Dr. Philipe Saraiva Cruz',
      doctorCRM: 'CRM-MG 69.870',
      prescriptionExpiry: '2024-06-15',
      lastAppointment: '2024-01-10',
      nextAppointment: '2024-04-10'
    },
    createdAt: '2023-12-15T10:30:00Z',
    updatedAt: '2024-01-20T14:15:00Z',
    webhookEvents: [
      {
        id: 'evt_1',
        event: 'SUBSCRIPTION_CREATED',
        createdAt: '2023-12-15T10:30:00Z',
        data: { subscriptionId: 'sub_asaas_123' }
      },
      {
        id: 'evt_2',
        event: 'PAYMENT_CONFIRMED',
        createdAt: '2024-01-14T16:30:00Z',
        data: { paymentId: 'pay_123' }
      }
    ]
  },
  {
    id: '2',
    asaasId: 'sub_987654321',
    customer: {
      id: '2',
      name: 'Carlos Alberto Santos',
      email: 'carlos.santos@email.com',
      phone: '+55 33 98765-4321',
      cpf: '987.654.321-00',
      customerId: 'cus_xyz789abc123'
    },
    plan: {
      id: 'pln_trimestral_basic',
      name: 'Trimestral Básico',
      description: 'Lentes de contato trimestrais econômicas',
      value: 79.90,
      billingCycle: 'QUARTERLY',
      maxPayments: 4,
      nextDueDate: '2024-03-01',
      status: 'ACTIVE'
    },
    payments: [
      {
        id: 'pay_456',
        status: 'CONFIRMED',
        value: 79.90,
        dueDate: '2024-01-01',
        paymentDate: '2024-01-02',
        invoiceUrl: 'https://asaas.com.br/invoice/456',
        invoiceNumber: 'INV-2024-003',
        paymentMethod: 'CREDIT_CARD'
      }
    ],
    subscription: {
      id: 'sub_asaas_456',
      code: 'SUB-002',
      status: 'ACTIVE',
      plan: 'Trimestral Básico',
      value: 79.90,
      nextPaymentDate: '2024-03-01',
      billingType: 'PREPAID',
      startDate: '2023-10-01',
      maxPayments: 4,
      currentPayment: 1
    },
    metadata: {
      medicalPrescriptionId: 'presc_456',
      doctorName: 'Dr. João Pedro Silva',
      doctorCRM: 'CRM-SP 123.456',
      prescriptionExpiry: '2024-09-01',
      lastAppointment: '2023-12-20'
    },
    createdAt: '2023-10-01T14:20:00Z',
    updatedAt: '2024-01-18T10:45:00Z',
    webhookEvents: [
      {
        id: 'evt_3',
        event: 'SUBSCRIPTION_CREATED',
        createdAt: '2023-10-01T14:20:00Z',
        data: { subscriptionId: 'sub_asaas_456' }
      },
      {
        id: 'evt_4',
        event: 'PAYMENT_CONFIRMED',
        createdAt: '2024-01-02T09:15:00Z',
        data: { paymentId: 'pay_456' }
      }
    ]
  },
  {
    id: '3',
    asaasId: 'sub_555666777',
    customer: {
      id: '3',
      name: 'Maria José Oliveira',
      email: 'maria.oliveira@email.com',
      phone: '+55 33 91234-5678',
      cpf: '456.789.123-00',
      customerId: 'cus_pqr456stu789'
    },
    plan: {
      id: 'pln_monthly_premium',
      name: 'Mensal Premium',
      description: 'Lentes de contato mensais com entrega',
      value: 89.90,
      billingCycle: 'MONTHLY',
      maxPayments: 12,
      nextDueDate: '2024-02-15',
      status: 'SUSPENDED'
    },
    payments: [
      {
        id: 'pay_789',
        status: 'OVERDUE',
        value: 89.90,
        dueDate: '2024-01-15',
        invoiceUrl: 'https://asaas.com.br/invoice/789',
        invoiceNumber: 'INV-2024-007',
        paymentMethod: 'PIX'
      }
    ],
    subscription: {
      id: 'sub_asaas_789',
      code: 'SUB-003',
      status: 'SUSPENDED',
      plan: 'Mensal Premium',
      value: 89.90,
      nextPaymentDate: '2024-02-15',
      billingType: 'PREPAID',
      startDate: '2023-11-20',
      maxPayments: 12,
      currentPayment: 3
    },
    metadata: {
      medicalPrescriptionId: 'presc_789',
      doctorName: 'Dra. Paula Costa',
      doctorCRM: 'CRM-RJ 789.012',
      prescriptionExpiry: '2024-05-20',
      lastAppointment: '2024-01-05'
    },
    createdAt: '2023-11-20T09:45:00Z',
    updatedAt: '2024-01-25T16:30:00Z',
    webhookEvents: [
      {
        id: 'evt_5',
        event: 'SUBSCRIPTION_CREATED',
        createdAt: '2023-11-20T09:45:00Z',
        data: { subscriptionId: 'sub_asaas_789' }
      }
    ]
  }
]

export default function SubscriptionsManager() {
  const { hasPermission } = useAdminAuth()
  const [subscriptions, setSubscriptions] = useState<AsaasSubscription[]>(mockAsaasSubscriptions)
  const [selectedSubscription, setSelectedSubscription] = useState<AsaasSubscription | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedStatus, setSelectedStatus] = useState<string>('all')
  const [selectedPlan, setSelectedPlan] = useState<string>('all')
  const [selectedPaymentStatus, setSelectedPaymentStatus] = useState<string>('all')
  const [isLoading, setIsLoading] = useState(false)
  const [showFilters, setShowFilters] = useState(false)

  // Verificação de permissão
  if (!hasPermission('VIEW_SUBSCRIPTIONS')) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <AlertTriangle className="h-12 w-12 text-yellow-500 mx-auto mb-4" />
          <h2 className="text-lg font-semibold">Acesso Negado</h2>
          <p className="text-muted-foreground">
            Você não tem permissão para gerenciar assinaturas.
          </p>
        </div>
      </div>
    )
  }

  const filteredSubscriptions = subscriptions.filter(sub => {
    const matchesSearch =
      sub.customer.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      sub.customer.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      sub.customer.cpf.includes(searchQuery) ||
      sub.plan.name.toLowerCase().includes(searchQuery.toLowerCase())

    const matchesStatus = selectedStatus === 'all' || sub.plan.status === selectedStatus
    const matchesPlan = selectedPlan === 'all' || sub.plan.id === selectedPlan
    const matchesPaymentStatus = selectedPaymentStatus === 'all' ||
      sub.payments.some(p => p.status === selectedPaymentStatus)

    return matchesSearch && matchesStatus && matchesPlan && matchesPaymentStatus
  })

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ACTIVE':
      case 'CONFIRMED':
      case 'RECEIVED':
        return 'bg-green-100 text-green-800 border-green-200'
      case 'PENDING':
      case 'PROCESSING':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 'SUSPENDED':
      case 'OVERDUE':
        return 'bg-orange-100 text-orange-800 border-orange-200'
      case 'CANCELLED':
      case 'FAILED':
      case 'REFUNDED':
        return 'bg-red-100 text-red-800 border-red-200'
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case 'ACTIVE': return 'Ativa'
      case 'SUSPENDED': return 'Pausada'
      case 'CANCELLED': return 'Cancelada'
      case 'OVERDUE': return 'Vencida'
      case 'PENDING': return 'Pendente'
      case 'CONFIRMED': return 'Confirmado'
      case 'RECEIVED': return 'Recebido'
      case 'FAILED': return 'Falha'
      case 'REFUNDED': return 'Reembolsido'
      default: return status
    }
  }

  const getPaymentMethodIcon = (method: string) => {
    switch (method) {
      case 'BOLETO': return <FileText className="h-4 w-4" />
      case 'CREDIT_CARD': return <CreditCardIcon className="h-4 w-4" />
      case 'PIX': return <BarChart3 className="h-4 w-4" />
      case 'DEBIT_CARD': return <CreditCardIcon className="h-4 w-4" />
      default: return <CreditCardIcon className="h-4 w-4" />
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR')
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value)
  }

  const getDaysUntilDue = (dueDate: string) => {
    const today = new Date()
    const due = new Date(dueDate)
    const diffTime = due.getTime() - today.getTime()
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    return diffDays
  }

  const getBillingCycleText = (cycle: string) => {
    switch (cycle) {
      case 'MONTHLY': return 'Mensal'
      case 'YEARLY': return 'Anual'
      case 'WEEKLY': return 'Semanal'
      case 'QUARTERLY': return 'Trimestral'
      default: return cycle
    }
  }

  const refreshData = useCallback(() => {
    setIsLoading(true)
    setTimeout(() => {
      setLastRefresh(new Date())
      setIsLoading(false)
    }, 1000)
  }, [])

  const handleViewInAsaas = (asaasId: string) => {
    window.open(`https://asaas.com.br/assinaturas/${asaasId}`, '_blank')
  }

  const handleViewInvoice = (invoiceUrl: string) => {
    window.open(invoiceUrl, '_blank')
  }

  const handlePauseSubscription = (subscriptionId: string) => {
    console.log('Pause subscription:', subscriptionId)
    // Implementar lógica de pausa via API ASAAS
  }

  const handleResumeSubscription = (subscriptionId: string) => {
    console.log('Resume subscription:', subscriptionId)
    // Implementar lógica de retomada via API ASAAS
  }

  const handleCancelSubscription = (subscriptionId: string) => {
    console.log('Cancel subscription:', subscriptionId)
    // Implementar lógica de cancelamento via API ASAAS
  }

  // Estatísticas calculadas
  const stats = {
    total: subscriptions.length,
    active: subscriptions.filter(s => s.plan.status === 'ACTIVE').length,
    suspended: subscriptions.filter(s => s.plan.status === 'SUSPENDED').length,
    cancelled: subscriptions.filter(s => s.plan.status === 'CANCELLED').length,
    overdue: subscriptions.filter(s => s.plan.status === 'OVERDUE').length,
    totalRevenue: subscriptions.reduce((acc, sub) => acc + sub.plan.value, 0),
    monthlyRevenue: subscriptions.filter(s => s.plan.billingCycle === 'MONTHLY' && s.plan.status === 'ACTIVE')
      .reduce((acc, sub) => acc + sub.plan.value, 0),
    pendingPayments: subscriptions.reduce((acc, sub) =>
      acc + sub.payments.filter(p => p.status === 'PENDING').length, 0
    )
  }

  const lastRefresh = new Date()

  return (
    <motion.div
      className="space-y-6"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Gestão de Assinaturas</h1>
          <p className="text-muted-foreground">
            Gerencie assinaturas ASAAS e pagamentos recorrentes
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowFilters(!showFilters)}
          >
            <Filter className="h-4 w-4 mr-2" />
            Filtros
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={refreshData}
            disabled={isLoading}
          >
            <RefreshCw className={cn("h-4 w-4 mr-2", isLoading && "animate-spin")} />
            Atualizar
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={() => window.open('https://asaas.com.br', '_blank')}
          >
            <ExternalLink className="h-4 w-4 mr-2" />
            ASAAS Dashboard
          </Button>

          <Button size="sm">
            <ShoppingCart className="h-4 w-4 mr-2" />
            Nova Assinatura
          </Button>
        </div>
      </div>

      {/* Estatísticas */}
      <div className="grid gap-4 md:grid-cols-6">
        <div className="bg-gradient-to-br from-blue-50 to-cyan-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <ShoppingCart className="h-5 w-5 text-blue-600" />
            <span className="text-xs font-medium text-blue-600">Total</span>
          </div>
          <div className="text-2xl font-bold text-blue-900">{stats.total}</div>
          <div className="text-xs text-blue-700">Assinaturas</div>
        </div>

        <div className="bg-gradient-to-br from-green-50 to-emerald-50 border border-green-200 rounded-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <CheckCircle className="h-5 w-5 text-green-600" />
            <span className="text-xs font-medium text-green-600">Ativas</span>
          </div>
          <div className="text-2xl font-bold text-green-900">{stats.active}</div>
          <div className="text-xs text-green-700">
            {stats.total > 0 ? `${((stats.active / stats.total) * 100).toFixed(1)}%` : '0%'} do total
          </div>
        </div>

        <div className="bg-gradient-to-br from-orange-50 to-yellow-50 border border-orange-200 rounded-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <Pause className="h-5 w-5 text-orange-600" />
            <span className="text-xs font-medium text-orange-600">Pausadas</span>
          </div>
          <div className="text-2xl font-bold text-orange-900">{stats.suspended}</div>
          <div className="text-xs text-orange-700">Em pausa</div>
        </div>

        <div className="bg-gradient-to-br from-red-50 to-pink-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <XCircle className="h-5 w-5 text-red-600" />
            <span className="text-xs font-medium text-red-600">Canceladas</span>
          </div>
          <div className="text-2xl font-bold text-red-900">{stats.cancelled}</div>
          <div className="text-xs text-red-700">Encerradas</div>
        </div>

        <div className="bg-gradient-to-br from-purple-50 to-pink-50 border border-purple-200 rounded-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <AlertTriangle className="h-5 w-5 text-purple-600" />
            <span className="text-xs font-medium text-purple-600">Vencidas</span>
          </div>
          <div className="text-2xl font-bold text-purple-900">{stats.overdue}</div>
          <div className="text-xs text-purple-700">Pagamento pendente</div>
        </div>

        <div className="bg-gradient-to-br from-cyan-50 to-blue-50 border border-cyan-200 rounded-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <DollarSign className="h-5 w-5 text-cyan-600" />
            <span className="text-xs font-medium text-cyan-600">Receita MRR</span>
          </div>
          <div className="text-2xl font-bold text-cyan-900">{formatCurrency(stats.monthlyRevenue)}</div>
          <div className="text-xs text-cyan-700">Mensal recorrente</div>
        </div>
      </div>

      {/* Indicadores de Pagamentos */}
      <div className="bg-card border rounded-lg p-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-gray-900">Pagamentos Pendentes</h3>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-yellow-600 border-yellow-300">
              {stats.pendingPayments} pendentes
            </Badge>
            <Button variant="outline" size="sm">
              <Download className="h-4 w-4 mr-2" />
              Exportar
            </Button>
          </div>
        </div>

        <div className="grid gap-3 md:grid-cols-3">
          {subscriptions
            .filter(sub => sub.payments.some(p => p.status === 'PENDING'))
            .slice(0, 3)
            .map((subscription, index) => {
              const pendingPayments = subscription.payments.filter(p => p.status === 'PENDING')
              return (
                <div key={subscription.id} className="border rounded-lg p-3">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <h4 className="font-medium text-sm">{subscription.customer.name}</h4>
                      <p className="text-xs text-gray-600">{subscription.plan.name}</p>
                    </div>
                    <Badge className={cn("text-xs", getStatusColor('PENDING'))}>
                      Pendente
                    </Badge>
                  </div>

                  <div className="space-y-2">
                    {pendingPayments.slice(0, 2).map((payment, pIndex) => (
                      <div key={payment.id} className="flex items-center justify-between text-xs">
                        <div className="flex items-center gap-1">
                          {getPaymentMethodIcon(payment.paymentMethod)}
                          <span>{formatCurrency(payment.value)}</span>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleViewInvoice(payment.invoiceUrl)}
                        >
                          <Eye className="h-3 w-3" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              )
            })}
        </div>
      </div>

      {/* Filtros */}
      {showFilters && (
        <motion.div
          className="bg-card border rounded-lg p-4"
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
        >
          <div className="grid gap-4 md:grid-cols-4">
            <div>
              <label className="block text-sm font-medium mb-2">Buscar</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Cliente, email, CPF..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Status da Assinatura</label>
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="w-full p-2 border rounded-md"
              >
                <option value="all">Todos</option>
                <option value="ACTIVE">Ativas</option>
                <option value="SUSPENDED">Pausadas</option>
                <option value="CANCELLED">Canceladas</option>
                <option value="OVERDUE">Vencidas</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Plano</label>
              <select
                value={selectedPlan}
                onChange={(e) => setSelectedPlan(e.target.value)}
                className="w-full p-2 border rounded-md"
              >
                <option value="all">Todos</option>
                <option value="pln_monthly_premium">Mensal Premium</option>
                <option value="pln_trimestral_basic">Trimestral Básico</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Status Pagamento</label>
              <select
                value={selectedPaymentStatus}
                onChange={(e) => setSelectedPaymentStatus(e.target.value)}
                className="w-full p-2 border rounded-md"
              >
                <option value="all">Todos</option>
                <option value="PENDING">Pendente</option>
                <option value="CONFIRMED">Confirmado</option>
                <option value="OVERDUE">Vencido</option>
                <option value="FAILED">Falha</option>
              </select>
            </div>
          </div>
        </motion.div>
      )}

      {/* Lista de Assinaturas */}
      <div className="bg-card border rounded-lg">
        <div className="p-4 border-b">
          <div className="flex items-center justify-between">
            <h3 className="font-medium">
              Assinaturas ({filteredSubscriptions.length})
            </h3>
            <div className="text-xs text-gray-500">
              Atualizado: {lastRefresh.toLocaleString('pt-BR')}
            </div>
          </div>
        </div>

        <div className="divide-y">
          {filteredSubscriptions.map((subscription, index) => (
            <motion.div
              key={subscription.id}
              className="p-4 hover:bg-gray-50 transition-colors cursor-pointer"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              onClick={() => setSelectedSubscription(subscription)}
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-start gap-3">
                  <div className="h-10 w-10 bg-blue-100 rounded-full flex items-center justify-center">
                    <span className="text-sm font-medium text-blue-800">
                      {subscription.customer.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
                    </span>
                  </div>

                  <div className="flex-1">
                    <h4 className="font-medium text-sm">{subscription.customer.name}</h4>
                    <div className="flex items-center gap-2 text-xs text-gray-600">
                      <span>{subscription.customer.email}</span>
                      <span>•</span>
                      <span>{subscription.customer.cpf}</span>
                    </div>

                    <div className="flex items-center gap-2 mt-1">
                      <Badge className={cn("text-xs", getStatusColor(subscription.plan.status))}>
                        {getStatusText(subscription.plan.status)}
                      </Badge>
                      <Badge variant="outline" className="text-xs">
                        {getBillingCycleText(subscription.plan.billingCycle)}
                      </Badge>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation()
                      handleViewInAsaas(subscription.asaasId)
                    }}
                  >
                    <ExternalLink className="h-4 w-4" />
                  </Button>

                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation()
                      setSelectedSubscription(subscription)
                    }}
                  >
                    <Eye className="h-4 w-4" />
                  </Button>

                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation()
                      // Menu dropdown
                    }}
                  >
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-4 text-sm">
                <div>
                  <p className="text-gray-600 text-xs">Plano</p>
                  <p className="font-medium">{subscription.plan.name}</p>
                  <p className="text-xs text-gray-500">{formatCurrency(subscription.plan.value)}</p>
                </div>

                <div>
                  <p className="text-gray-600 text-xs">Próximo Vencimento</p>
                  <p className="font-medium">{formatDate(subscription.plan.nextDueDate)}</p>
                  <p className={cn(
                    "text-xs",
                    getDaysUntilDue(subscription.plan.nextDueDate) <= 3
                      ? "text-red-600"
                      : "text-gray-500"
                  )}>
                    {getDaysUntilDue(subscription.plan.nextDueDate)} dias
                  </p>
                </div>

                <div>
                  <p className="text-gray-600 text-xs">Pagamentos</p>
                  <div className="flex items-center gap-1">
                    <span className="font-medium">
                      {subscription.payments.filter(p => p.status === 'CONFIRMED' || p.status === 'RECEIVED').length}/
                      {subscription.payments.length}
                    </span>
                    <span className="text-xs text-gray-500">confirmados</span>
                  </div>
                </div>

                <div>
                  <p className="text-gray-600 text-xs">Ciclo</p>
                  <div className="flex items-center gap-1">
                    <span className="font-medium">
                      {subscription.subscription.currentPayment || 0}/
                      {subscription.subscription.maxPayments || '∞'}
                    </span>
                    <span className="text-xs text-gray-500">
                      {subscription.subscription.maxPayments ? 'pagamentos' : 'ilimitado'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Informações Médicas */}
              {subscription.metadata.doctorName && (
                <div className="mt-3 p-3 bg-blue-50 rounded-lg">
                  <div className="flex items-center gap-2 text-xs text-blue-800">
                    <FileText className="h-3 w-3" />
                    <span className="font-medium">Informações Médicas</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 mt-2 text-xs text-blue-700">
                    <div>
                      <p className="font-medium">Médico:</p>
                      <p>{subscription.metadata.doctorName}</p>
                      <p>{subscription.metadata.doctorCRM}</p>
                    </div>
                    <div>
                      <p className="font-medium">Validade Prescrição:</p>
                      <p>{formatDate(subscription.metadata.prescriptionExpiry || '')}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Últimos Webhooks */}
              {subscription.webhookEvents.slice(0, 2).length > 0 && (
                <div className="mt-3 p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-2 text-xs text-gray-800">
                    <Activity className="h-3 w-3" />
                    <span className="font-medium">Eventos Recentes</span>
                  </div>
                  <div className="space-y-1 text-xs">
                    {subscription.webhookEvents.slice(0, 2).map((event, eIndex) => (
                      <div key={event.id} className="flex items-center justify-between">
                        <span className="text-gray-600">{event.event}</span>
                        <span className="text-gray-500">
                          {formatDate(event.createdAt)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </motion.div>
          ))}
        </div>

        {filteredSubscriptions.length === 0 && (
          <div className="p-8 text-center">
            <ShoppingCart className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600">Nenhuma assinatura encontrada</p>
            <p className="text-sm text-gray-500">Tente ajustar os filtros para ver mais resultados.</p>
          </div>
        )}
      </div>

      {/* Modal de Detalhes */}
      {selectedSubscription && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-start justify-between mb-6">
                <div>
                  <h3 className="text-xl font-semibold">Detalhes da Assinatura</h3>
                  <p className="text-sm text-gray-600">
                    #{selectedSubscription.subscription.code} • {selectedSubscription.plan.name}
                  </p>
                </div>

                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSelectedSubscription(null)}
                >
                  <X className="h-5 w-5" />
                </Button>
              </div>

              <div className="grid gap-6 lg:grid-cols-2">
                {/* Informações do Cliente */}
                <div className="space-y-4">
                  <h4 className="font-medium">Cliente</h4>
                  <div className="bg-gray-50 rounded-lg p-4 space-y-2 text-sm">
                    <div>
                      <strong>Nome:</strong> {selectedSubscription.customer.name}
                    </div>
                    <div>
                      <strong>Email:</strong> {selectedSubscription.customer.email}
                    </div>
                    <div>
                      <strong>Telefone:</strong> {selectedSubscription.customer.phone}
                    </div>
                    <div>
                      <strong>CPF:</strong> {selectedSubscription.customer.cpf}
                    </div>
                    <div>
                      <strong>ID ASAAS:</strong> {selectedSubscription.customer.customerId}
                    </div>
                  </div>
                </div>

                {/* Informações do Plano */}
                <div className="space-y-4">
                  <h4 className="font-medium">Plano</h4>
                  <div className="bg-gray-50 rounded-lg p-4 space-y-2 text-sm">
                    <div>
                      <strong>Nome:</strong> {selectedSubscription.plan.name}
                    </div>
                    <div>
                      <strong>Descrição:</strong> {selectedSubscription.plan.description}
                    </div>
                    <div>
                      <strong>Valor:</strong> {formatCurrency(selectedSubscription.plan.value)}
                    </div>
                    <div>
                      <strong>Ciclo:</strong> {getBillingCycleText(selectedSubscription.plan.billingCycle)}
                    </div>
                    <div>
                      <strong>Status:</strong>
                      <Badge className={cn("ml-2", getStatusColor(selectedSubscription.plan.status))}>
                        {getStatusText(selectedSubscription.plan.status)}
                      </Badge>
                    </div>
                    <div>
                      <strong>Próximo Vencimento:</strong> {formatDate(selectedSubscription.plan.nextDueDate)}
                    </div>
                  </div>
                </div>

                {/* Pagamentos */}
                <div className="space-y-4 lg:col-span-2">
                  <h4 className="font-medium">Histórico de Pagamentos</h4>
                  <div className="space-y-2">
                    {selectedSubscription.payments.map((payment, index) => (
                      <div key={payment.id} className="bg-gray-50 rounded-lg p-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            {getPaymentMethodIcon(payment.paymentMethod)}
                            <span className="font-medium">{formatCurrency(payment.value)}</span>
                            <Badge className={cn("text-xs", getStatusColor(payment.status))}>
                              {getStatusText(payment.status)}
                            </Badge>
                          </div>

                          <div className="flex items-center gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleViewInvoice(payment.invoiceUrl)}
                            >
                              <Eye className="h-3 w-3" />
                            </Button>

                            {payment.status === 'OVERDUE' && (
                              <Button
                                size="sm"
                                className="bg-red-600 hover:bg-red-700 text-white"
                              onClick={() => {
                                // Lógica para reenviar boleto ou gerar novo link de pagamento
                              }}
                              >
                                <RefreshCw className="h-3 w-3 mr-1" />
                                Reenviar
                              </Button>
                            )}
                          </div>

                          <div className="text-xs text-gray-600">
                            <div>Vencimento: {formatDate(payment.dueDate)}</div>
                            {payment.paymentDate && (
                              <div>Pagamento: {formatDate(payment.paymentDate)}</div>
                            )}
                            <div>Fatura: {payment.invoiceNumber}</div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Informações Médicas */}
                {selectedSubscription.metadata.doctorName && (
                  <div className="space-y-4">
                    <h4 className="font-medium">Informações Médicas</h4>
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 space-y-3">
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <strong>Médico Responsável:</strong>
                          <p>{selectedSubscription.metadata.doctorName}</p>
                          <p className="text-blue-600">{selectedSubscription.metadata.doctorCRM}</p>
                        </div>
                        <div>
                          <strong>Validade da Prescrição:</strong>
                          <p>{formatDate(selectedSubscription.metadata.prescriptionExpiry || '')}</p>
                        </div>
                      </div>

                      {selectedSubscription.metadata.lastAppointment && (
                        <div>
                          <strong>Última Consulta:</strong>
                          <p>{formatDate(selectedSubscription.metadata.lastAppointment)}</p>
                        </div>
                      )}

                      {selectedSubscription.metadata.nextAppointment && (
                        <div>
                          <strong>Próxima Consulta:</strong>
                          <p>{formatDate(selectedSubscription.metadata.nextAppointment)}</p>
                        </div>
                      )}

                      {selectedSubscription.metadata.notes && (
                        <div>
                          <strong>Observações:</strong>
                          <p className="text-sm text-gray-700 mt-1">{selectedSubscription.metadata.notes}</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Eventos de Webhook */}
                <div className="space-y-4">
                  <h4 className="font-medium">Eventos de Sistema</h4>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <div className="space-y-2 max-h-40 overflow-y-auto">
                      {selectedSubscription.webhookEvents.map((event, index) => (
                        <div key={event.id} className="flex items-center justify-between text-sm p-2 bg-white rounded border">
                          <div>
                            <div className="font-medium">{event.event}</div>
                            <div className="text-xs text-gray-500">
                              {formatDate(event.createdAt)}
                            </div>
                          </div>
                          <div className="text-xs text-gray-400">
                            ID: {event.id}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Ações */}
                <div className="flex gap-3">
                  <Button variant="outline" onClick={() => setSelectedSubscription(null)}>
                    Fechar
                  </Button>

                  {selectedSubscription.plan.status === 'ACTIVE' && (
                    <Button
                      onClick={() => handlePauseSubscription(selectedSubscription.id)}
                      className="bg-orange-600 hover:bg-orange-700 text-white"
                    >
                      <Pause className="h-4 w-4 mr-2" />
                      Pausar
                    </Button>
                  )}

                  {selectedSubscription.plan.status === 'SUSPENDED' && (
                    <Button
                      onClick={() => handleResumeSubscription(selectedSubscription.id)}
                      className="bg-green-600 hover:bg-green-700 text-white"
                    >
                      <Play className="h-4 w-4 mr-2" />
                      Reativar
                    </Button>
                  )}

                  <Button
                    onClick={() => handleCancelSubscription(selectedSubscription.id)}
                    className="bg-red-600 hover:bg-red-700 text-white"
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Cancelar
                  </Button>

                  <Button
                    variant="outline"
                    onClick={() => handleViewInAsaas(selectedSubscription.asaasId)}
                  >
                    <ExternalLink className="h-4 w-4 mr-2" />
                    Ver no ASAAS
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </motion.div>
  )
}