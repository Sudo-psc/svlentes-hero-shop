'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Package,
  Truck,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  MapPin,
  Phone,
  FileText,
  Filter,
  Search,
  Download,
  RefreshCw,
  Eye,
  Edit,
  MessageSquare
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Separator } from '@/components/ui/separator'

// Interfaces
interface AsaasOrder {
  id: string
  code: string
  subscriptionId?: string
  customer: {
    id: string
    name: string
    email: string
    phone: string
    cpfCnpj: string
    address: {
      street: string
      number: string
      complement?: string
      neighborhood: string
      city: string
      state: string
      zipcode: string
    }
  }
  items: {
    description: string
    quantity: number
    unitPrice: number
    total: number
    productDetails?: {
      type: 'daily' | 'monthly' | 'toric' | 'colored'
      power: string
      cylinder?: string
      axis?: string
      brand: string
    }
  }[]
  value: number
  netValue: number
  status: 'PENDING' | 'CONFIRMED' | 'PROCESSING' | 'SHIPPED' | 'DELIVERED' | 'CANCELLED' | 'REFUNDED'
  paymentInfo: {
    method: 'credit_card' | 'pix' | 'boleto'
    status: 'PENDING' | 'CONFIRMED' | 'OVERDUE' | 'REFUNDED'
    dueDate?: string
    paymentDate?: string
    invoiceUrl?: string
    barcode?: string
    pixQrCode?: {
      encodedImage: string
      payload: string
      expirationDate: string
    }
  }
  shipping: {
    method: 'sedex' | 'pac' | 'motoboy' | 'retira_local'
    cost: number
    trackingCode?: string
    estimatedDelivery?: string
    deliveredDate?: string
    address: {
      sameAsBilling: boolean
      street?: string
      number?: string
      complement?: string
      neighborhood?: string
      city?: string
      state?: string
      zipcode?: string
    }
  }
  medicalInfo?: {
    prescriptionValid: boolean
    prescriptionExpiry?: string
    doctorName: string
    doctorCRM: string
    lastValidation: string
  }
  timeline: {
    date: string
    status: string
    description: string
    details?: any
  }[]
  createdAt: string
  updatedAt: string
  ASAAS_dashboard_url?: string
}

interface OrderStats {
  total: number
  pending: number
  processing: number
  shipped: number
  delivered: number
  cancelled: number
  totalValue: number
  averageTicket: number
  deliveryRate: number
  paymentRate: number
}

// Status configurations
const orderStatusConfig = {
  PENDING: {
    label: 'Aguardando Pagamento',
    color: 'bg-yellow-500',
    bgColor: 'bg-yellow-50',
    textColor: 'text-yellow-700',
    icon: Clock
  },
  CONFIRMED: {
    label: 'Pagamento Confirmado',
    color: 'bg-blue-500',
    bgColor: 'bg-blue-50',
    textColor: 'text-blue-700',
    icon: CheckCircle
  },
  PROCESSING: {
    label: 'Em Processamento',
    color: 'bg-purple-500',
    bgColor: 'bg-purple-50',
    textColor: 'text-purple-700',
    icon: Package
  },
  SHIPPED: {
    label: 'Enviado',
    color: 'bg-indigo-500',
    bgColor: 'bg-indigo-50',
    textColor: 'text-indigo-700',
    icon: Truck
  },
  DELIVERED: {
    label: 'Entregue',
    color: 'bg-green-500',
    bgColor: 'bg-green-50',
    textColor: 'text-green-700',
    icon: CheckCircle
  },
  CANCELLED: {
    label: 'Cancelado',
    color: 'bg-red-500',
    bgColor: 'bg-red-50',
    textColor: 'text-red-700',
    icon: XCircle
  },
  REFUNDED: {
    label: 'Reembolsado',
    color: 'bg-gray-500',
    bgColor: 'bg-gray-50',
    textColor: 'text-gray-700',
    icon: RefreshCw
  }
}

const paymentMethodConfig = {
  credit_card: { label: 'Cartão de Crédito', icon: '💳' },
  pix: { label: 'PIX', icon: '⚡' },
  boleto: { label: 'Boleto', icon: '📄' }
}

const shippingMethodConfig = {
  sedex: { label: 'SEDEX', icon: '📦', days: '1-3 dias úteis' },
  pac: { label: 'PAC', icon: '📮', days: '3-7 dias úteis' },
  motoboy: { label: 'Motoboy', icon: '🏍️', days: 'Mesmo dia' },
  retira_local: { label: 'Retira na Clínica', icon: '🏥', days: 'Imediato' }
}

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<AsaasOrder[]>([])
  const [filteredOrders, setFilteredOrders] = useState<AsaasOrder[]>([])
  const [stats, setStats] = useState<OrderStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [paymentFilter, setPaymentFilter] = useState<string>('all')
  const [shippingFilter, setShippingFilter] = useState<string>('all')
  const [selectedOrder, setSelectedOrder] = useState<AsaasOrder | null>(null)
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false)

  // Load orders from ASAAS API
  const loadOrders = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/admin/asaas/orders')
      if (!response.ok) throw new Error('Failed to fetch orders')

      const data = await response.json()
      setOrders(data.orders || [])
      setStats(data.stats || null)
    } catch (error) {
      console.error('Error loading orders:', error)
      // Mock data for development
      const mockOrders: AsaasOrder[] = [
        {
          id: 'ord_001',
          code: 'ORD-2024-001',
          subscriptionId: 'sub_001',
          customer: {
            id: 'cust_001',
            name: 'João Silva',
            email: 'joao@email.com',
            phone: '+5533999898026',
            cpfCnpj: '123.456.789-00',
            address: {
              street: 'Rua Principal',
              number: '123',
              complement: 'Apto 101',
              neighborhood: 'Centro',
              city: 'Caratinga',
              state: 'MG',
              zipcode: '35300-000'
            }
          },
          items: [
            {
              description: 'Lentes Diárias - 30 dias',
              quantity: 2,
              unitPrice: 89.90,
              total: 179.80,
              productDetails: {
                type: 'daily',
                power: '-3.00',
                brand: 'Acuvue'
              }
            }
          ],
          value: 179.80,
          netValue: 179.80,
          status: 'SHIPPED',
          paymentInfo: {
            method: 'credit_card',
            status: 'CONFIRMED',
            paymentDate: '2024-01-15T10:30:00Z',
            invoiceUrl: 'https://asaas.com/invoice/ord_001'
          },
          shipping: {
            method: 'sedex',
            cost: 15.00,
            trackingCode: 'BR123456789BR',
            estimatedDelivery: '2024-01-17',
            address: {
              sameAsBilling: true
            }
          },
          medicalInfo: {
            prescriptionValid: true,
            prescriptionExpiry: '2024-06-15',
            doctorName: 'Dr. Philipe Saraiva Cruz',
            doctorCRM: 'CRM-MG 69.870',
            lastValidation: '2024-01-14T14:20:00Z'
          },
          timeline: [
            {
              date: '2024-01-15T10:30:00Z',
              status: 'created',
              description: 'Pedido criado'
            },
            {
              date: '2024-01-15T10:35:00Z',
              status: 'payment_confirmed',
              description: 'Pagamento confirmado'
            },
            {
              date: '2024-01-15T14:20:00Z',
              status: 'medical_validated',
              description: 'Presençação médica validada'
            },
            {
              date: '2024-01-16T09:00:00Z',
              status: 'shipped',
              description: 'Enviado - SEDEX'
            }
          ],
          createdAt: '2024-01-15T10:30:00Z',
          updatedAt: '2024-01-16T09:00:00Z',
          ASAAS_dashboard_url: 'https://asaas.com/ord/ord_001'
        },
        {
          id: 'ord_002',
          code: 'ORD-2024-002',
          subscriptionId: 'sub_002',
          customer: {
            id: 'cust_002',
            name: 'Maria Santos',
            email: 'maria@email.com',
            phone: '+5533999898123',
            cpfCnpj: '987.654.321-00',
            address: {
              street: 'Avenida Secundária',
              number: '456',
              neighborhood: 'Vila Nova',
              city: 'Caratinga',
              state: 'MG',
              zipcode: '35300-001'
            }
          },
          items: [
            {
              description: 'Lentes Mensais - 1 par',
              quantity: 1,
              unitPrice: 159.90,
              total: 159.90,
              productDetails: {
                type: 'monthly',
                power: '-2.50',
                cylinder: '-0.75',
                axis: '180',
                brand: 'Biofinity'
              }
            }
          ],
          value: 159.90,
          netValue: 159.90,
          status: 'PROCESSING',
          paymentInfo: {
            method: 'pix',
            status: 'CONFIRMED',
            paymentDate: '2024-01-16T08:15:00Z'
          },
          shipping: {
            method: 'pac',
            cost: 12.00,
            estimatedDelivery: '2024-01-22',
            address: {
              sameAsBilling: true
            }
          },
          medicalInfo: {
            prescriptionValid: true,
            prescriptionExpiry: '2024-08-20',
            doctorName: 'Dra. Ana Oliveira',
            doctorCRM: 'CRM-MG 45.123',
            lastValidation: '2024-01-16T09:30:00Z'
          },
          timeline: [
            {
              date: '2024-01-16T08:15:00Z',
              status: 'created',
              description: 'Pedido criado'
            },
            {
              date: '2024-01-16T08:16:00Z',
              status: 'payment_confirmed',
              description: 'Pagamento PIX recebido'
            },
            {
              date: '2024-01-16T09:30:00Z',
              status: 'medical_validated',
              description: 'Validação médica concluída'
            }
          ],
          createdAt: '2024-01-16T08:15:00Z',
          updatedAt: '2024-01-16T09:30:00Z',
          ASAAS_dashboard_url: 'https://asaas.com/ord/ord_002'
        }
      ]
      setOrders(mockOrders)
      setStats({
        total: mockOrders.length,
        pending: mockOrders.filter(o => o.status === 'PENDING').length,
        processing: mockOrders.filter(o => o.status === 'PROCESSING').length,
        shipped: mockOrders.filter(o => o.status === 'SHIPPED').length,
        delivered: mockOrders.filter(o => o.status === 'DELIVERED').length,
        cancelled: mockOrders.filter(o => o.status === 'CANCELLED').length,
        totalValue: mockOrders.reduce((sum, o) => sum + o.value, 0),
        averageTicket: mockOrders.reduce((sum, o) => sum + o.value, 0) / mockOrders.length,
        deliveryRate: (mockOrders.filter(o => ['SHIPPED', 'DELIVERED'].includes(o.status)).length / mockOrders.length) * 100,
        paymentRate: (mockOrders.filter(o => o.paymentInfo.status === 'CONFIRMED').length / mockOrders.length) * 100
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadOrders()
  }, [])

  // Apply filters
  useEffect(() => {
    let filtered = orders

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(order =>
        order.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
        order.customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        order.customer.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        order.customer.cpfCnpj.replace(/\D/g, '').includes(searchTerm.replace(/\D/g, ''))
      )
    }

    // Status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(order => order.status === statusFilter)
    }

    // Payment method filter
    if (paymentFilter !== 'all') {
      filtered = filtered.filter(order => order.paymentInfo.method === paymentFilter)
    }

    // Shipping method filter
    if (shippingFilter !== 'all') {
      filtered = filtered.filter(order => order.shipping.method === shippingFilter)
    }

    setFilteredOrders(filtered)
  }, [orders, searchTerm, statusFilter, paymentFilter, shippingFilter])

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value)
  }

  const formatDate = (dateString: string) => {
    return new Intl.DateTimeFormat('pt-BR').format(new Date(dateString))
  }

  const OrderCard = ({ order }: { order: AsaasOrder }) => {
    const statusConfig = orderStatusConfig[order.status]
    const StatusIcon = statusConfig.icon

    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        whileHover={{ scale: 1.02 }}
        className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-all duration-300"
      >
        <div className="p-6">
          {/* Header */}
          <div className="flex justify-between items-start mb-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <h3 className="font-semibold text-gray-900">{order.code}</h3>
                {order.subscriptionId && (
                  <Badge variant="outline" className="text-xs">
                    Assinatura
                  </Badge>
                )}
              </div>
              <p className="text-sm text-gray-600">
                {formatDate(order.createdAt)}
              </p>
            </div>

            <div className="flex items-center gap-2">
              <span className={`px-3 py-1 rounded-full text-xs font-medium ${statusConfig.bgColor} ${statusConfig.textColor}`}>
                <StatusIcon className="w-3 h-3 inline mr-1" />
                {statusConfig.label}
              </span>
            </div>
          </div>

          {/* Customer Info */}
          <div className="mb-4">
            <div className="flex items-center gap-2 text-sm text-gray-700 mb-1">
              <span className="font-medium">{order.customer.name}</span>
              <span>•</span>
              <span>{order.customer.email}</span>
            </div>
            <div className="flex items-center gap-4 text-xs text-gray-500">
              <span className="flex items-center gap-1">
                <Phone className="w-3 h-3" />
                {order.customer.phone}
              </span>
              <span className="flex items-center gap-1">
                <FileText className="w-3 h-3" />
                {order.customer.cpfCnpj}
              </span>
            </div>
          </div>

          {/* Items */}
          <div className="mb-4">
            <div className="text-sm text-gray-600 mb-2">
              {order.items.length} item(s)
            </div>
            {order.items.map((item, index) => (
              <div key={index} className="bg-gray-50 rounded-lg p-3 mb-2">
                <div className="flex justify-between items-center">
                  <div>
                    <div className="font-medium text-sm">{item.description}</div>
                    {item.productDetails && (
                      <div className="text-xs text-gray-500 mt-1">
                        <span className="mr-3">Potência: {item.productDetails.power}</span>
                        {item.productDetails.cylinder && (
                          <span className="mr-3">Cilindro: {item.productDetails.cylinder}</span>
                        )}
                        {item.productDetails.axis && (
                          <span className="mr-3">Eixo: {item.productDetails.axis}</span>
                        )}
                        <span>Marca: {item.productDetails.brand}</span>
                      </div>
                    )}
                  </div>
                  <div className="text-right">
                    <div className="font-semibold text-sm">{formatCurrency(item.total)}</div>
                    <div className="text-xs text-gray-500">Qtd: {item.quantity}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Payment and Shipping Info */}
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div className="bg-gray-50 rounded-lg p-3">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-lg">{paymentMethodConfig[order.paymentInfo.method].icon}</span>
                <span className="text-xs font-medium text-gray-700">
                  {paymentMethodConfig[order.paymentInfo.method].label}
                </span>
              </div>
              <div className={`text-xs ${order.paymentInfo.status === 'CONFIRMED' ? 'text-green-600' : 'text-yellow-600'}`}>
                {order.paymentInfo.status === 'CONFIRMED' ? 'Pago' : 'Pendente'}
              </div>
            </div>

            <div className="bg-gray-50 rounded-lg p-3">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-lg">{shippingMethodConfig[order.shipping.method].icon}</span>
                <span className="text-xs font-medium text-gray-700">
                  {shippingMethodConfig[order.shipping.method].label}
                </span>
              </div>
              <div className="text-xs text-gray-500">
                {order.shipping.trackingCode ? (
                  <span>Rastreio: {order.shipping.trackingCode}</span>
                ) : (
                  <span>{shippingMethodConfig[order.shipping.method].days}</span>
                )}
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="flex justify-between items-center pt-4 border-t border-gray-100">
            <div className="flex items-center gap-4">
              <div>
                <div className="text-xs text-gray-500">Total</div>
                <div className="font-bold text-lg text-gray-900">
                  {formatCurrency(order.value)}
                </div>
              </div>
              {order.medicalInfo && (
                <div className="flex items-center gap-1">
                  {order.medicalInfo.prescriptionValid ? (
                    <CheckCircle className="w-4 h-4 text-green-500" />
                  ) : (
                    <AlertCircle className="w-4 h-4 text-yellow-500" />
                  )}
                  <span className="text-xs text-gray-600">
                    {order.medicalInfo.prescriptionValid ? 'Receita válida' : 'Receita pendente'}
                  </span>
                </div>
              )}
            </div>

            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setSelectedOrder(order)
                  setIsDetailModalOpen(true)
                }}
              >
                <Eye className="w-4 h-4 mr-1" />
                Detalhes
              </Button>

              {order.ASAAS_dashboard_url && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => window.open(order.ASAAS_dashboard_url, '_blank')}
                >
                  ASAAS
                </Button>
              )}
            </div>
          </div>
        </div>
      </motion.div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-cyan-50 via-white to-silver-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                Gestão de Pedidos
              </h1>
              <p className="text-gray-600">
                Controle completo de pedidos e logística via ASAAS
              </p>
            </div>

            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={loadOrders}
                disabled={loading}
              >
                <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                Atualizar
              </Button>

              <Button
                onClick={() => window.open('https://asaas.com', '_blank')}
                className="bg-cyan-600 hover:bg-cyan-700"
              >
                Ir para ASAAS
              </Button>
            </div>
          </div>
        </motion.div>

        {/* Stats Cards */}
        {stats && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8"
          >
            <Card className="bg-gradient-to-br from-blue-500 to-blue-600 text-white">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-blue-100 text-sm">Total de Pedidos</p>
                    <p className="text-3xl font-bold">{stats.total}</p>
                  </div>
                  <Package className="w-8 h-8 text-blue-200" />
                </div>
                <div className="mt-4 text-sm text-blue-100">
                  Faturamento: {formatCurrency(stats.totalValue)}
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-yellow-500 to-orange-500 text-white">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-yellow-100 text-sm">Em Processamento</p>
                    <p className="text-3xl font-bold">{stats.processing + stats.shipped}</p>
                  </div>
                  <Clock className="w-8 h-8 text-yellow-200" />
                </div>
                <div className="mt-4 text-sm text-yellow-100">
                  {stats.processing} processando + {stats.shipped} enviados
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-green-500 to-green-600 text-white">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-green-100 text-sm">Taxa de Entrega</p>
                    <p className="text-3xl font-bold">{stats.deliveryRate.toFixed(1)}%</p>
                  </div>
                  <Truck className="w-8 h-8 text-green-200" />
                </div>
                <div className="mt-4 text-sm text-green-100">
                  {stats.delivered} entregues
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-purple-500 to-purple-600 text-white">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-purple-100 text-sm">Ticket Médio</p>
                    <p className="text-3xl font-bold">{formatCurrency(stats.averageTicket)}</p>
                  </div>
                  <FileText className="w-8 h-8 text-purple-200" />
                </div>
                <div className="mt-4 text-sm text-purple-100">
                  Taxa de pagamento: {stats.paymentRate.toFixed(1)}%
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Filters */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6"
        >
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder="Buscar pedido..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>

            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os status</SelectItem>
                {Object.entries(orderStatusConfig).map(([key, config]) => (
                  <SelectItem key={key} value={key}>
                    {config.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={paymentFilter} onValueChange={setPaymentFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Pagamento" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os métodos</SelectItem>
                {Object.entries(paymentMethodConfig).map(([key, config]) => (
                  <SelectItem key={key} value={key}>
                    {config.icon} {config.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={shippingFilter} onValueChange={setShippingFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Entrega" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os métodos</SelectItem>
                {Object.entries(shippingMethodConfig).map(([key, config]) => (
                  <SelectItem key={key} value={key}>
                    {config.icon} {config.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Button variant="outline" onClick={() => {
              setSearchTerm('')
              setStatusFilter('all')
              setPaymentFilter('all')
              setShippingFilter('all')
            }}>
              Limpar Filtros
            </Button>
          </div>
        </motion.div>

        {/* Orders List */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          {loading ? (
            <div className="flex justify-center items-center h-64">
              <RefreshCw className="w-8 h-8 animate-spin text-cyan-600" />
            </div>
          ) : filteredOrders.length === 0 ? (
            <div className="text-center py-12">
              <Package className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Nenhum pedido encontrado
              </h3>
              <p className="text-gray-600">
                {searchTerm || statusFilter !== 'all' || paymentFilter !== 'all' || shippingFilter !== 'all'
                  ? 'Tente ajustar os filtros para encontrar pedidos.'
                  : 'Nenhum pedido foi criado ainda.'}
              </p>
            </div>
          ) : (
            <div className="grid gap-6">
              {filteredOrders.map((order) => (
                <OrderCard key={order.id} order={order} />
              ))}
            </div>
          )}
        </motion.div>

        {/* Order Detail Modal */}
        <Dialog open={isDetailModalOpen} onOpenChange={setIsDetailModalOpen}>
          <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Detalhes do Pedido</DialogTitle>
              <DialogDescription>
                Informações completas do pedido e histórico
              </DialogDescription>
            </DialogHeader>

            {selectedOrder && (
              <Tabs defaultValue="details" className="w-full">
                <TabsList className="grid w-full grid-cols-4">
                  <TabsTrigger value="details">Detalhes</TabsTrigger>
                  <TabsTrigger value="customer">Cliente</TabsTrigger>
                  <TabsTrigger value="timeline">Timeline</TabsTrigger>
                  <TabsTrigger value="medical">Médico</TabsTrigger>
                </TabsList>

                <TabsContent value="details" className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium text-gray-700">Código</label>
                      <p className="text-sm text-gray-900">{selectedOrder.code}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-700">Status</label>
                      <p className="text-sm">
                        <Badge className={orderStatusConfig[selectedOrder.status].bgColor}>
                          {orderStatusConfig[selectedOrder.status].label}
                        </Badge>
                      </p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-700">Data</label>
                      <p className="text-sm text-gray-900">{formatDate(selectedOrder.createdAt)}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-700">Valor Total</label>
                      <p className="text-sm font-bold">{formatCurrency(selectedOrder.value)}</p>
                    </div>
                  </div>

                  <Separator />

                  <div>
                    <label className="text-sm font-medium text-gray-700 mb-2 block">Itens do Pedido</label>
                    {selectedOrder.items.map((item, index) => (
                      <div key={index} className="border rounded-lg p-3 mb-2">
                        <div className="flex justify-between items-start">
                          <div>
                            <p className="font-medium">{item.description}</p>
                            <p className="text-sm text-gray-600">
                              Quantidade: {item.quantity} × {formatCurrency(item.unitPrice)}
                            </p>
                            {item.productDetails && (
                              <div className="text-xs text-gray-500 mt-1">
                                <span>Tipo: {item.productDetails.type}</span>
                                <span className="ml-2">Potência: {item.productDetails.power}</span>
                                {item.productDetails.cylinder && (
                                  <span className="ml-2">Cilindro: {item.productDetails.cylinder}</span>
                                )}
                                {item.productDetails.axis && (
                                  <span className="ml-2">Eixo: {item.productDetails.axis}</span>
                                )}
                                <span className="ml-2">Marca: {item.productDetails.brand}</span>
                              </div>
                            )}
                          </div>
                          <p className="font-bold">{formatCurrency(item.total)}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </TabsContent>

                <TabsContent value="customer" className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium text-gray-700">Nome</label>
                      <p className="text-sm text-gray-900">{selectedOrder.customer.name}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-700">Email</label>
                      <p className="text-sm text-gray-900">{selectedOrder.customer.email}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-700">Telefone</label>
                      <p className="text-sm text-gray-900">{selectedOrder.customer.phone}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-700">CPF/CNPJ</label>
                      <p className="text-sm text-gray-900">{selectedOrder.customer.cpfCnpj}</p>
                    </div>
                  </div>

                  <Separator />

                  <div>
                    <label className="text-sm font-medium text-gray-700 mb-2 block">Endereço de Entrega</label>
                    <div className="bg-gray-50 rounded-lg p-3">
                      <p className="text-sm">
                        {selectedOrder.customer.address.street}, {selectedOrder.customer.address.number}
                        {selectedOrder.customer.address.complement && ` - ${selectedOrder.customer.address.complement}`}
                      </p>
                      <p className="text-sm">
                        {selectedOrder.customer.address.neighborhood} - {selectedOrder.customer.address.city}/{selectedOrder.customer.address.state}
                      </p>
                      <p className="text-sm">CEP: {selectedOrder.customer.address.zipcode}</p>
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="timeline" className="space-y-4">
                  <div className="space-y-3">
                    {selectedOrder.timeline.map((event, index) => (
                      <div key={index} className="flex items-start gap-3">
                        <div className="w-2 h-2 bg-cyan-600 rounded-full mt-2"></div>
                        <div className="flex-1">
                          <div className="flex justify-between items-start">
                            <p className="font-medium text-sm">{event.description}</p>
                            <p className="text-xs text-gray-500">
                              {formatDate(event.date)}
                            </p>
                          </div>
                          {event.details && (
                            <p className="text-xs text-gray-600 mt-1">
                              {JSON.stringify(event.details, null, 2)}
                            </p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </TabsContent>

                <TabsContent value="medical" className="space-y-4">
                  {selectedOrder.medicalInfo ? (
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-sm font-medium text-gray-700">Status da Receita</label>
                        <p className="text-sm">
                          <Badge className={selectedOrder.medicalInfo.prescriptionValid ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}>
                            {selectedOrder.medicalInfo.prescriptionValid ? 'Válida' : 'Pendente'}
                          </Badge>
                        </p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-700">Validade da Receita</label>
                        <p className="text-sm text-gray-900">
                          {selectedOrder.medicalInfo.prescriptionExpiry
                            ? formatDate(selectedOrder.medicalInfo.prescriptionExpiry)
                            : 'N/A'
                          }
                        </p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-700">Médico Responsável</label>
                        <p className="text-sm text-gray-900">{selectedOrder.medicalInfo.doctorName}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-700">CRM</label>
                        <p className="text-sm text-gray-900">{selectedOrder.medicalInfo.doctorCRM}</p>
                      </div>
                      <div className="col-span-2">
                        <label className="text-sm font-medium text-gray-700">Última Validação</label>
                        <p className="text-sm text-gray-900">
                          {formatDate(selectedOrder.medicalInfo.lastValidation)}
                        </p>
                      </div>
                    </div>
                  ) : (
                    <p className="text-sm text-gray-600">
                      Nenhuma informação médica disponível para este pedido.
                    </p>
                  )}
                </TabsContent>
              </Tabs>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </div>
  )
}