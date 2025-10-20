'use client'
import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  CreditCard,
  Calendar,
  DollarSign,
  Users,
  TrendingUp,
  Calculator,
  FileText,
  CheckCircle,
  AlertCircle,
  Clock,
  Filter,
  Search,
  Download,
  RefreshCw,
  Eye,
  Edit,
  Trash2,
  Plus,
  Percent,
  Target
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
import { Progress } from '@/components/ui/progress'
// Interfaces
interface PlanoParcelado {
  id: string
  name: string
  description: string
  category: 'daily' | 'monthly' | 'toric' | 'colored'
  duration: 12 // Anual - fixo em 12 meses
  originalPrice: number
  parcelPrice: number
  installmentCount: number // 1-12 parcelas
  monthlyFee: number // Taxa mensal repassada ao cliente
  totalWithFees: number
  effectiveMonthlyCost: number
  apr: number // Annual Percentage Rate
  discountForPaymentInCash: number // Desconto para pagamento à vista
  isActive: boolean
 asaasProductId?: string
  asaasPlanId?: string
  features: string[]
  inclusions: {
    lensesPerMonth: number
    solutions: boolean
    consultations: number
    shipping: boolean
  }
  restrictions: {
    maxPower: string
    minPower: string
    cylinderRange?: string
    axisRange?: string
  }
  medicalInfo: {
    prescriptionRequired: boolean
    validadeMaximaMeses: number
    doctorCRMRequired: boolean
  }
  stats: {
    totalSubscriptions: number
    activeSubscriptions: number
    cancelledSubscriptions: number
    revenue: number
    averageInstallmentValue: number
    churnRate: number
    completionRate: number
  }
  createdAt: string
  updatedAt: string
}
interface ParcelaSubscription {
  id: string
  planId: string
  customer: {
    id: string
    name: string
    email: string
    phone: string
    cpfCnpj: string
  }
  plan: PlanoParcelado
  installmentCount: number
  monthlyInstallmentValue: number
  monthlyFee: number
  totalValue: number
  currentInstallment: number
  nextInstallmentDate: string
  status: 'active' | 'delayed' | 'cancelled' | 'completed'
  paymentMethod: 'credit_card' | 'boleto'
  installments: {
    number: number
    dueDate: string
    value: number
    fee: number
    status: 'paid' | 'pending' | 'overdue' | 'cancelled'
    paymentDate?: string
    asaasPaymentId?: string
  }[]
  createdAt: string
  startDate: string
  endDate: string
  medicalInfo: {
    prescriptionValid: boolean
    prescriptionExpiry: string
    doctorName: string
    doctorCRM: string
  }
  asaasSubscriptionId?: string
  asaas_dashboard_url?: string
}
interface ParceladoStats {
  totalPlans: number
  activePlans: number
  totalSubscriptions: number
  activeSubscriptions: number
  monthlyRevenue: number
  annualProjectedRevenue: number
  averageFee: number
  completionRate: number
  churnRate: number
  mostPopularPlan: PlanoParcelado | null
  monthlyGrowth: number
}
const categoryConfig = {
  daily: { label: 'Lentes Diárias', icon: '👁️', color: 'blue' },
  monthly: { label: 'Lentes Mensais', icon: '👁️', color: 'green' },
  toric: { label: 'Lentes Tóricas', icon: '🎯', color: 'purple' },
  colored: { label: 'Lentes Coloridas', icon: '🎨', color: 'pink' }
}
const statusConfig = {
  active: { label: 'Ativo', color: 'bg-green-500', bgColor: 'bg-green-50', textColor: 'text-green-700' },
  delayed: { label: 'Atrasado', color: 'bg-red-500', bgColor: 'bg-red-50', textColor: 'text-red-700' },
  cancelled: { label: 'Cancelado', color: 'bg-gray-500', bgColor: 'bg-gray-50', textColor: 'text-gray-700' },
  completed: { label: 'Concluído', color: 'bg-blue-500', bgColor: 'bg-blue-50', textColor: 'text-blue-700' }
}
export default function AdminParceladoPage() {
  const [plans, setPlans] = useState<PlanoParcelado[]>([])
  const [subscriptions, setSubscriptions] = useState<ParcelaSubscription[]>([])
  const [stats, setStats] = useState<ParceladoStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [categoryFilter, setCategoryFilter] = useState<string>('all')
  const [selectedPlan, setSelectedPlan] = useState<PlanoParcelado | null>(null)
  const [selectedSubscription, setSelectedSubscription] = useState<ParcelaSubscription | null>(null)
  const [isPlanModalOpen, setIsPlanModalOpen] = useState(false)
  const [isSubscriptionModalOpen, setIsSubscriptionModalOpen] = useState(false)
  const [activeTab, setActiveTab] = useState('plans')
  // Load data from ASAAS API
  const loadData = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/admin/asaas/parcelado')
      if (!response.ok) throw new Error('Failed to fetch parcelado data')
      const data = await response.json()
      setPlans(data.plans || [])
      setSubscriptions(data.subscriptions || [])
      setStats(data.stats || null)
    } catch (error) {
      console.error('Error loading parcelado data:', error)
      // Mock data for development
      const mockPlans: PlanoParcelado[] = [
        {
          id: 'plan_parcelado_001',
          name: 'Plano Anual Premium - Diárias',
          description: 'Acesso anual a lentes diárias com pagamento parcelado em até 12x',
          category: 'daily',
          duration: 12,
          originalPrice: 2388.00,
          parcelPrice: 2388.00,
          installmentCount: 12,
          monthlyFee: 0.0589, // 5.89% ao mês (juros simples)
          totalWithFees: 2541.36,
          effectiveMonthlyCost: 211.78,
          apr: 73.68,
          discountForPaymentInCash: 10,
          isActive: true,
          asaasProductId: 'prod_annual_daily',
          asaasPlanId: 'plan_annual_daily',
          features: [
            'Lentes diárias por 12 meses',
            'Soluções de limpeza inclusas',
            'Consultas de acompanhamento',
            'Frete grátis para todo Brasil',
            'Suporte prioritário 24/7'
          ],
          inclusions: {
            lensesPerMonth: 30,
            solutions: true,
            consultations: 4,
            shipping: true
          },
          restrictions: {
            maxPower: '-10.00',
            minPower: '+10.00',
            cylinderRange: '-2.25 a 0',
            axisRange: '0 a 180'
          },
          medicalInfo: {
            prescriptionRequired: true,
            validadeMaximaMeses: 12,
            doctorCRMRequired: true
          },
          stats: {
            totalSubscriptions: 47,
            activeSubscriptions: 42,
            cancelledSubscriptions: 5,
            revenue: 119400.00,
            averageInstallmentValue: 199.00,
            churnRate: 10.6,
            completionRate: 85.1
          },
          createdAt: '2024-01-01T00:00:00Z',
          updatedAt: '2024-03-15T10:30:00Z'
        },
        {
          id: 'plan_parcelado_002',
          name: 'Plano Anual Comfort - Mensais',
          description: 'Plano anual com lentes mensais parcelado em até 12x',
          category: 'monthly',
          duration: 12,
          originalPrice: 1918.80,
          parcelPrice: 1918.80,
          installmentCount: 12,
          monthlyFee: 0.0589,
          totalWithFees: 2041.20,
          effectiveMonthlyCost: 170.10,
          apr: 73.68,
          discountForPaymentInCash: 10,
          isActive: true,
          asaasProductId: 'prod_annual_monthly',
          asaasPlanId: 'plan_annual_monthly',
          features: [
            'Lentes mensais por 12 meses',
            'Soluções completas',
            '2 consultas oftalmológicas',
            'Frete grátis',
            'Aplicativo exclusivo'
          ],
          inclusions: {
            lensesPerMonth: 1,
            solutions: true,
            consultations: 2,
            shipping: true
          },
          restrictions: {
            maxPower: '-8.00',
            minPower: '+8.00',
            cylinderRange: '-2.00 a 0',
            axisRange: '0 a 180'
          },
          medicalInfo: {
            prescriptionRequired: true,
            validadeMaximaMeses: 12,
            doctorCRMRequired: true
          },
          stats: {
            totalSubscriptions: 28,
            activeSubscriptions: 25,
            cancelledSubscriptions: 3,
            revenue: 51030.00,
            averageInstallmentValue: 159.90,
            churnRate: 10.7,
            completionRate: 82.1
          },
          createdAt: '2024-01-15T00:00:00Z',
          updatedAt: '2024-03-15T14:20:00Z'
        },
        {
          id: 'plan_parcelado_003',
          name: 'Plano Anual Toric Premium',
          description: 'Plano especial para astigmatismo com lentes tóricas anuais',
          category: 'toric',
          duration: 12,
          originalPrice: 2998.80,
          parcelPrice: 2998.80,
          installmentCount: 12,
          monthlyFee: 0.0589,
          totalWithFees: 3192.72,
          effectiveMonthlyCost: 266.06,
          apr: 73.68,
          discountForPaymentInCash: 10,
          isActive: true,
          asaasProductId: 'prod_annual_toric',
          asaasPlanId: 'plan_annual_toric',
          features: [
            'Lentes tóricas premium',
            'Soluções especiais',
            'Consultas especializadas',
            'Ajustes gratuitos',
            'Atendimento exclusivo'
          ],
          inclusions: {
            lensesPerMonth: 2,
            solutions: true,
            consultations: 6,
            shipping: true
          },
          restrictions: {
            maxPower: '-6.00',
            minPower: '+6.00',
            cylinderRange: '-2.25 a -0.75',
            axisRange: '0 a 180'
          },
          medicalInfo: {
            prescriptionRequired: true,
            validadeMaximaMeses: 12,
            doctorCRMRequired: true
          },
          stats: {
            totalSubscriptions: 15,
            activeSubscriptions: 14,
            cancelledSubscriptions: 1,
            revenue: 44700.00,
            averageInstallmentValue: 249.90,
            churnRate: 6.7,
            completionRate: 88.9
          },
          createdAt: '2024-02-01T00:00:00Z',
          updatedAt: '2024-03-15T16:45:00Z'
        }
      ]
      const mockSubscriptions: ParcelaSubscription[] = [
        {
          id: 'sub_parcelado_001',
          planId: 'plan_parcelado_001',
          customer: {
            id: 'cust_001',
            name: 'João Silva Santos',
            email: 'joao.santos@email.com',
            phone: '+5533999898026',
            cpfCnpj: '123.456.789-00'
          },
          plan: mockPlans[0],
          installmentCount: 12,
          monthlyInstallmentValue: 199.00,
          monthlyFee: 11.78,
          totalValue: 2541.36,
          currentInstallment: 3,
          nextInstallmentDate: '2024-04-15',
          status: 'active',
          paymentMethod: 'credit_card',
          installments: Array.from({ length: 12 }, (_, i) => ({
            number: i + 1,
            dueDate: `2024-${String((i % 12) + 1).padStart(2, '0')}-15`,
            value: 199.00,
            fee: i === 0 ? 11.78 * 12 : 0, // Taxa cobrada na primeira parcela
            status: i < 2 ? 'paid' : 'pending',
            paymentDate: i < 2 ? `2024-${String((i % 12) + 1).padStart(2, '0')}-14T10:00:00Z` : undefined
          })),
          createdAt: '2024-01-15T10:00:00Z',
          startDate: '2024-01-15',
          endDate: '2024-12-15',
          medicalInfo: {
            prescriptionValid: true,
            prescriptionExpiry: '2024-12-31',
            doctorName: 'Dr. Philipe Saraiva Cruz',
            doctorCRM: 'CRM-MG 69.870'
          },
          asaasSubscriptionId: 'sub_asaas_001',
          asaas_dashboard_url: 'https://asaas.com/sub/sub_asaas_001'
        },
        {
          id: 'sub_parcelado_002',
          planId: 'plan_parcelado_002',
          customer: {
            id: 'cust_002',
            name: 'Maria Oliveira Costa',
            email: 'maria.costa@email.com',
            phone: '+5533999898156',
            cpfCnpj: '987.654.321-00'
          },
          plan: mockPlans[1],
          installmentCount: 12,
          monthlyInstallmentValue: 159.90,
          monthlyFee: 9.48,
          totalValue: 2041.20,
          currentInstallment: 2,
          nextInstallmentDate: '2024-04-20',
          status: 'active',
          paymentMethod: 'credit_card',
          installments: Array.from({ length: 12 }, (_, i) => ({
            number: i + 1,
            dueDate: `2024-${String((i % 12) + 1).padStart(2, '0')}-20`,
            value: 159.90,
            fee: i === 0 ? 9.48 * 12 : 0,
            status: i < 1 ? 'paid' : 'pending',
            paymentDate: i === 0 ? `2024-02-20T14:30:00Z` : undefined
          })),
          createdAt: '2024-02-20T14:30:00Z',
          startDate: '2024-02-20',
          endDate: '2025-01-20',
          medicalInfo: {
            prescriptionValid: true,
            prescriptionExpiry: '2025-01-31',
            doctorName: 'Dra. Ana Paula Silva',
            doctorCRM: 'CRM-MG 45.678'
          },
          asaasSubscriptionId: 'sub_asaas_002',
          asaas_dashboard_url: 'https://asaas.com/sub/sub_asaas_002'
        }
      ]
      const mockStats: ParceladoStats = {
        totalPlans: mockPlans.length,
        activePlans: mockPlans.filter(p => p.isActive).length,
        totalSubscriptions: mockSubscriptions.length,
        activeSubscriptions: mockSubscriptions.filter(s => s.status === 'active').length,
        monthlyRevenue: mockSubscriptions
          .filter(s => s.status === 'active')
          .reduce((sum, s) => sum + s.monthlyInstallmentValue, 0),
        annualProjectedRevenue: mockSubscriptions
          .filter(s => s.status === 'active')
          .reduce((sum, s) => sum + s.totalValue, 0),
        averageFee: mockPlans.reduce((sum, p) => sum + p.monthlyFee, 0) / mockPlans.length,
        completionRate: mockPlans.reduce((sum, p) => sum + p.stats.completionRate, 0) / mockPlans.length,
        churnRate: mockPlans.reduce((sum, p) => sum + p.stats.churnRate, 0) / mockPlans.length,
        mostPopularPlan: mockPlans[0],
        monthlyGrowth: 15.8
      }
      setPlans(mockPlans)
      setSubscriptions(mockSubscriptions)
      setStats(mockStats)
    } finally {
      setLoading(false)
    }
  }
  useEffect(() => {
    loadData()
  }, [])
  // Apply filters
  const filteredSubscriptions = subscriptions.filter(sub => {
    const matchesSearch = searchTerm === '' ||
      sub.customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      sub.customer.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      sub.plan.name.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = statusFilter === 'all' || sub.status === statusFilter
    const matchesCategory = categoryFilter === 'all' || sub.plan.category === categoryFilter
    return matchesSearch && matchesStatus && matchesCategory
  })
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value)
  }
  const formatPercentage = (value: number) => {
    return `${value.toFixed(2)}%`
  }
  const PlanCard = ({ plan }: { plan: PlanoParcelado }) => {
    const categoryInfo = categoryConfig[plan.category]
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
            <div className="flex items-center gap-2">
              <span className="text-2xl">{categoryInfo.icon}</span>
              <div>
                <h3 className="font-semibold text-gray-900">{plan.name}</h3>
                <p className="text-sm text-gray-600">{plan.description}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {plan.isActive ? (
                <Badge className="bg-green-100 text-green-700">
                  <CheckCircle className="w-3 h-3 mr-1" />
                  Ativo
                </Badge>
              ) : (
                <Badge className="bg-gray-100 text-gray-700">
                  <AlertCircle className="w-3 h-3 mr-1" />
                  Inativo
                </Badge>
              )}
            </div>
          </div>
          {/* Pricing */}
          <div className="bg-gradient-to-r from-cyan-50 to-blue-50 rounded-lg p-4 mb-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-gray-600 mb-1">Valor Original</p>
                <p className="text-lg font-bold text-gray-900 line-through">
                  {formatCurrency(plan.originalPrice)}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-600 mb-1">12x de</p>
                <p className="text-2xl font-bold text-cyan-600">
                  {formatCurrency(plan.effectiveMonthlyCost)}
                </p>
              </div>
            </div>
            <div className="mt-3 pt-3 border-t border-cyan-200">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Taxa mensal:</span>
                <span className="font-medium text-red-600">{formatPercentage(plan.monthlyFee * 100)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Total com taxas:</span>
                <span className="font-medium">{formatCurrency(plan.totalWithFees)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Custo Efetivo Anual (CEA):</span>
                <span className="font-medium text-orange-600">{formatPercentage(plan.apr)}</span>
              </div>
            </div>
          </div>
          {/* Features */}
          <div className="mb-4">
            <p className="text-sm font-medium text-gray-700 mb-2">Incluso no plano:</p>
            <div className="space-y-1">
              {plan.features.slice(0, 3).map((feature, index) => (
                <div key={index} className="flex items-center gap-2 text-xs text-gray-600">
                  <CheckCircle className="w-3 h-3 text-green-500" />
                  {feature}
                </div>
              ))}
              {plan.features.length > 3 && (
                <p className="text-xs text-gray-500">
                  +{plan.features.length - 3} outros benefícios
                </p>
              )}
            </div>
          </div>
          {/* Stats */}
          <div className="grid grid-cols-3 gap-2 mb-4">
            <div className="text-center p-2 bg-gray-50 rounded">
              <p className="text-lg font-bold text-gray-900">{plan.stats.activeSubscriptions}</p>
              <p className="text-xs text-gray-600">Ativos</p>
            </div>
            <div className="text-center p-2 bg-gray-50 rounded">
              <p className="text-lg font-bold text-gray-900">{formatPercentage(plan.stats.completionRate)}</p>
              <p className="text-xs text-gray-600">Conclusão</p>
            </div>
            <div className="text-center p-2 bg-gray-50 rounded">
              <p className="text-lg font-bold text-gray-900">{formatPercentage(plan.stats.churnRate)}</p>
              <p className="text-xs text-gray-600">Churn</p>
            </div>
          </div>
          {/* Actions */}
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setSelectedPlan(plan)
                setIsPlanModalOpen(true)
              }}
            >
              <Eye className="w-4 h-4 mr-1" />
              Detalhes
            </Button>
            {plan.asaasProductId && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => window.open(`https://asaas.com/product/${plan.asaasProductId}`, '_blank')}
              >
                ASAAS
              </Button>
            )}
          </div>
        </div>
      </motion.div>
    )
  }
  const SubscriptionCard = ({ subscription }: { subscription: ParcelaSubscription }) => {
    const statusInfo = statusConfig[subscription.status]
    const categoryInfo = categoryConfig[subscription.plan.category]
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
                <span className="text-lg">{categoryInfo.icon}</span>
                <h3 className="font-semibold text-gray-900">{subscription.plan.name}</h3>
              </div>
              <p className="text-sm text-gray-600">{subscription.customer.name}</p>
            </div>
            <Badge className={statusInfo.bgColor + ' ' + statusInfo.textColor}>
              {statusInfo.label}
            </Badge>
          </div>
          {/* Payment Info */}
          <div className="bg-gray-50 rounded-lg p-4 mb-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-gray-600 mb-1">Parcela Atual</p>
                <p className="font-bold text-lg">
                  {subscription.currentInstallment}/{subscription.installmentCount}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-600 mb-1">Valor Mensal</p>
                <p className="font-bold text-lg text-cyan-600">
                  {formatCurrency(subscription.monthlyInstallmentValue)}
                </p>
              </div>
            </div>
            <div className="mt-3 pt-3 border-t border-gray-200">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Próximo vencimento:</span>
                <span className="font-medium">{new Date(subscription.nextInstallmentDate).toLocaleDateString('pt-BR')}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Método:</span>
                <span className="font-medium">
                  {subscription.paymentMethod === 'credit_card' ? '💳 Cartão' : '📄 Boleto'}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Total Contratado:</span>
                <span className="font-medium">{formatCurrency(subscription.totalValue)}</span>
              </div>
            </div>
          </div>
          {/* Progress */}
          <div className="mb-4">
            <div className="flex justify-between text-sm mb-2">
              <span className="text-gray-600">Progresso</span>
              <span className="font-medium">
                {Math.round((subscription.currentInstallment / subscription.installmentCount) * 100)}%
              </span>
            </div>
            <Progress
              value={(subscription.currentInstallment / subscription.installmentCount) * 100}
              className="h-2"
            />
          </div>
          {/* Medical Info */}
          {subscription.medicalInfo && (
            <div className="flex items-center gap-2 mb-4 p-2 bg-blue-50 rounded-lg">
              {subscription.medicalInfo.prescriptionValid ? (
                <CheckCircle className="w-4 h-4 text-green-500" />
              ) : (
                <AlertCircle className="w-4 h-4 text-yellow-500" />
              )}
              <div className="flex-1">
                <p className="text-xs text-gray-700">
                  Receita: {subscription.medicalInfo.doctorName} ({subscription.medicalInfo.doctorCRM})
                </p>
                <p className="text-xs text-gray-600">
                  Validade: {new Date(subscription.medicalInfo.prescriptionExpiry).toLocaleDateString('pt-BR')}
                </p>
              </div>
            </div>
          )}
          {/* Actions */}
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setSelectedSubscription(subscription)
                setIsSubscriptionModalOpen(true)
              }}
            >
              <Eye className="w-4 h-4 mr-1" />
              Detalhes
            </Button>
            {subscription.asaas_dashboard_url && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => window.open(subscription.asaas_dashboard_url, '_blank')}
              >
                ASAAS
              </Button>
            )}
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
                Planos Anuais Parcelados
              </h1>
              <p className="text-gray-600">
                Gestão de planos anuais parcelados em até 12x via ASAAS com taxas repassadas
              </p>
            </div>
            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={loadData}
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
            <Card className="bg-gradient-to-br from-purple-500 to-purple-600 text-white">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-purple-100 text-sm">Planos Ativos</p>
                    <p className="text-3xl font-bold">{stats.activePlans}</p>
                  </div>
                  <Target className="w-8 h-8 text-purple-200" />
                </div>
                <div className="mt-4 text-sm text-purple-100">
                  Total: {stats.totalPlans} planos
                </div>
              </CardContent>
            </Card>
            <Card className="bg-gradient-to-br from-green-500 to-green-600 text-white">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-green-100 text-sm">Assinaturas Ativas</p>
                    <p className="text-3xl font-bold">{stats.activeSubscriptions}</p>
                  </div>
                  <Users className="w-8 h-8 text-green-200" />
                </div>
                <div className="mt-4 text-sm text-green-100">
                  Faturamento mensal: {formatCurrency(stats.monthlyRevenue)}
                </div>
              </CardContent>
            </Card>
            <Card className="bg-gradient-to-br from-blue-500 to-blue-600 text-white">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-blue-100 text-sm">Taxa Média</p>
                    <p className="text-3xl font-bold">{formatPercentage(stats.averageFee * 100)}</p>
                  </div>
                  <Percent className="w-8 h-8 text-blue-200" />
                </div>
                <div className="mt-4 text-sm text-blue-100">
                  Projeção anual: {formatCurrency(stats.annualProjectedRevenue)}
                </div>
              </CardContent>
            </Card>
            <Card className="bg-gradient-to-br from-orange-500 to-orange-600 text-white">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-orange-100 text-sm">Taxa de Conclusão</p>
                    <p className="text-3xl font-bold">{formatPercentage(stats.completionRate)}</p>
                  </div>
                  <TrendingUp className="w-8 h-8 text-orange-200" />
                </div>
                <div className="mt-4 text-sm text-orange-100">
                  Churn: {formatPercentage(stats.churnRate)}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
        {/* Main Content */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="plans">Planos</TabsTrigger>
            <TabsTrigger value="subscriptions">Assinaturas</TabsTrigger>
          </TabsList>
          {/* Plans Tab */}
          <TabsContent value="plans">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <div className="grid gap-6">
                {plans.length === 0 ? (
                  <div className="text-center py-12">
                    <Target className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">
                      Nenhum plano parcelado encontrado
                    </h3>
                    <p className="text-gray-600">
                      Crie planos anuais parcelados para começar a vender.
                    </p>
                  </div>
                ) : (
                  plans.map((plan) => <PlanCard key={plan.id} plan={plan} />)
                )}
              </div>
            </motion.div>
          </TabsContent>
          {/* Subscriptions Tab */}
          <TabsContent value="subscriptions">
            {/* Filters */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6"
            >
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <Input
                    placeholder="Buscar assinatura..."
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
                    {Object.entries(statusConfig).map(([key, config]) => (
                      <SelectItem key={key} value={key}>
                        {config.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="Categoria" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas categorias</SelectItem>
                    {Object.entries(categoryConfig).map(([key, config]) => (
                      <SelectItem key={key} value={key}>
                        {config.icon} {config.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button variant="outline" onClick={() => {
                  setSearchTerm('')
                  setStatusFilter('all')
                  setCategoryFilter('all')
                }}>
                  Limpar Filtros
                </Button>
              </div>
            </motion.div>
            {/* Subscriptions List */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              {filteredSubscriptions.length === 0 ? (
                <div className="text-center py-12">
                  <CreditCard className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    Nenhuma assinatura encontrada
                  </h3>
                  <p className="text-gray-600">
                    {searchTerm || statusFilter !== 'all' || categoryFilter !== 'all'
                      ? 'Tente ajustar os filtros para encontrar assinaturas.'
                      : 'Nenhuma assinatura parcelada foi criada ainda.'}
                  </p>
                </div>
              ) : (
                <div className="grid gap-6">
                  {filteredSubscriptions.map((subscription) => (
                    <SubscriptionCard key={subscription.id} subscription={subscription} />
                  ))}
                </div>
              )}
            </motion.div>
          </TabsContent>
        </Tabs>
        {/* Plan Detail Modal */}
        <Dialog open={isPlanModalOpen} onOpenChange={setIsPlanModalOpen}>
          <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Detalhes do Plano Parcelado</DialogTitle>
              <DialogDescription>
                Informações completas do plano anual parcelado
              </DialogDescription>
            </DialogHeader>
            {selectedPlan && (
              <Tabs defaultValue="details" className="w-full">
                <TabsList className="grid w-full grid-cols-4">
                  <TabsTrigger value="details">Detalhes</TabsTrigger>
                  <TabsTrigger value="pricing">Precificação</TabsTrigger>
                  <TabsTrigger value="features">Benefícios</TabsTrigger>
                  <TabsTrigger value="stats">Estatísticas</TabsTrigger>
                </TabsList>
                <TabsContent value="details" className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium text-gray-700">Nome do Plano</label>
                      <p className="text-sm text-gray-900">{selectedPlan.name}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-700">Categoria</label>
                      <p className="text-sm">
                        <Badge className="bg-blue-100 text-blue-700">
                          {categoryConfig[selectedPlan.category].label}
                        </Badge>
                      </p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-700">Duração</label>
                      <p className="text-sm text-gray-900">{selectedPlan.duration} meses</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-700">Status</label>
                      <p className="text-sm">
                        <Badge className={selectedPlan.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'}>
                          {selectedPlan.isActive ? 'Ativo' : 'Inativo'}
                        </Badge>
                      </p>
                    </div>
                  </div>
                </TabsContent>
                <TabsContent value="pricing" className="space-y-4">
                  <div className="bg-gray-50 rounded-lg p-4">
                    <h3 className="font-medium mb-3">Estrutura de Preços</h3>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span>Valor Original:</span>
                        <span className="font-medium">{formatCurrency(selectedPlan.originalPrice)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Taxa Mensal:</span>
                        <span className="font-medium text-red-600">{formatPercentage(selectedPlan.monthlyFee * 100)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Total com Taxas:</span>
                        <span className="font-medium">{formatCurrency(selectedPlan.totalWithFees)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Parcelas:</span>
                        <span className="font-medium">{selectedPlan.installmentCount}x</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Valor da Parcela:</span>
                        <span className="font-bold text-lg text-cyan-600">{formatCurrency(selectedPlan.effectiveMonthlyCost)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Custo Efetivo Anual (CEA):</span>
                        <span className="font-medium text-orange-600">{formatPercentage(selectedPlan.apr)}</span>
                      </div>
                      {selectedPlan.discountForPaymentInCash > 0 && (
                        <div className="flex justify-between">
                          <span>Desconto à Vista:</span>
                          <span className="font-medium text-green-600">{formatPercentage(selectedPlan.discountForPaymentInCash)}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </TabsContent>
                <TabsContent value="features" className="space-y-4">
                  <div>
                    <h3 className="font-medium mb-3">Benefícios Inclusos</h3>
                    <div className="space-y-2">
                      {selectedPlan.features.map((feature, index) => (
                        <div key={index} className="flex items-center gap-2">
                          <CheckCircle className="w-4 h-4 text-green-500" />
                          <span className="text-sm">{feature}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                  <Separator />
                  <div>
                    <h3 className="font-medium mb-3">Informações Médicas</h3>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-gray-600">Receita Obrigatória:</span>
                        <span className="ml-2">{selectedPlan.medicalInfo.prescriptionRequired ? 'Sim' : 'Não'}</span>
                      </div>
                      <div>
                        <span className="text-gray-600">Validade Máxima:</span>
                        <span className="ml-2">{selectedPlan.medicalInfo.validadeMaximaMeses} meses</span>
                      </div>
                      <div>
                        <span className="text-gray-600">CRM Obrigatório:</span>
                        <span className="ml-2">{selectedPlan.medicalInfo.doctorCRMRequired ? 'Sim' : 'Não'}</span>
                      </div>
                    </div>
                  </div>
                </TabsContent>
                <TabsContent value="stats" className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-gray-50 rounded-lg p-4">
                      <p className="text-sm text-gray-600 mb-1">Total de Assinaturas</p>
                      <p className="text-2xl font-bold">{selectedPlan.stats.totalSubscriptions}</p>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-4">
                      <p className="text-sm text-gray-600 mb-1">Assinaturas Ativas</p>
                      <p className="text-2xl font-bold text-green-600">{selectedPlan.stats.activeSubscriptions}</p>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-4">
                      <p className="text-sm text-gray-600 mb-1">Taxa de Conclusão</p>
                      <p className="text-2xl font-bold">{formatPercentage(selectedPlan.stats.completionRate)}</p>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-4">
                      <p className="text-sm text-gray-600 mb-1">Taxa de Churn</p>
                      <p className="text-2xl font-bold text-red-600">{formatPercentage(selectedPlan.stats.churnRate)}</p>
                    </div>
                  </div>
                </TabsContent>
              </Tabs>
            )}
          </DialogContent>
        </Dialog>
        {/* Subscription Detail Modal */}
        <Dialog open={isSubscriptionModalOpen} onOpenChange={setIsSubscriptionModalOpen}>
          <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Detalhes da Assinatura Parcelada</DialogTitle>
              <DialogDescription>
                Informações completas da assinatura e histórico de pagamentos
              </DialogDescription>
            </DialogHeader>
            {selectedSubscription && (
              <Tabs defaultValue="details" className="w-full">
                <TabsList className="grid w-full grid-cols-4">
                  <TabsTrigger value="details">Detalhes</TabsTrigger>
                  <TabsTrigger value="installments">Parcelas</TabsTrigger>
                  <TabsTrigger value="customer">Cliente</TabsTrigger>
                  <TabsTrigger value="medical">Médico</TabsTrigger>
                </TabsList>
                <TabsContent value="details" className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium text-gray-700">Plano</label>
                      <p className="text-sm text-gray-900">{selectedSubscription.plan.name}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-700">Status</label>
                      <p className="text-sm">
                        <Badge className={statusConfig[selectedSubscription.status].bgColor + ' ' + statusConfig[selectedSubscription.status].textColor}>
                          {statusConfig[selectedSubscription.status].label}
                        </Badge>
                      </p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-700">Início</label>
                      <p className="text-sm text-gray-900">{new Date(selectedSubscription.startDate).toLocaleDateString('pt-BR')}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-700">Término</label>
                      <p className="text-sm text-gray-900">{new Date(selectedSubscription.endDate).toLocaleDateString('pt-BR')}</p>
                    </div>
                  </div>
                  <Separator />
                  <div className="bg-gray-50 rounded-lg p-4">
                    <h3 className="font-medium mb-3">Informações Financeiras</h3>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span>Valor da Parcela:</span>
                        <span className="font-medium">{formatCurrency(selectedSubscription.monthlyInstallmentValue)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Taxa Mensal:</span>
                        <span className="font-medium text-red-600">{formatCurrency(selectedSubscription.monthlyFee)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Total de Parcelas:</span>
                        <span className="font-medium">{selectedSubscription.installmentCount}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Parcela Atual:</span>
                        <span className="font-medium">{selectedSubscription.currentInstallment}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Total Contratado:</span>
                        <span className="font-bold text-lg">{formatCurrency(selectedSubscription.totalValue)}</span>
                      </div>
                    </div>
                  </div>
                </TabsContent>
                <TabsContent value="installments" className="space-y-4">
                  <div className="space-y-2">
                    {selectedSubscription.installments.map((installment) => (
                      <div key={installment.number} className={`p-3 rounded-lg border ${
                        installment.status === 'paid' ? 'bg-green-50 border-green-200' :
                        installment.status === 'overdue' ? 'bg-red-50 border-red-200' :
                        'bg-gray-50 border-gray-200'
                      }`}>
                        <div className="flex justify-between items-center">
                          <div>
                            <p className="font-medium">Parcela {installment.number}</p>
                            <p className="text-sm text-gray-600">
                              Vencimento: {new Date(installment.dueDate).toLocaleDateString('pt-BR')}
                            </p>
                            {installment.paymentDate && (
                              <p className="text-sm text-green-600">
                                Pago em: {new Date(installment.paymentDate).toLocaleDateString('pt-BR')}
                              </p>
                            )}
                          </div>
                          <div className="text-right">
                            <p className="font-bold">{formatCurrency(installment.value)}</p>
                            {installment.fee > 0 && (
                              <p className="text-sm text-red-600">Taxa: {formatCurrency(installment.fee)}</p>
                            )}
                            <Badge className={
                              installment.status === 'paid' ? 'bg-green-100 text-green-700' :
                              installment.status === 'overdue' ? 'bg-red-100 text-red-700' :
                              'bg-yellow-100 text-yellow-700'
                            }>
                              {installment.status === 'paid' ? 'Pago' :
                               installment.status === 'overdue' ? 'Vencido' : 'Pendente'}
                            </Badge>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </TabsContent>
                <TabsContent value="customer" className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium text-gray-700">Nome</label>
                      <p className="text-sm text-gray-900">{selectedSubscription.customer.name}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-700">Email</label>
                      <p className="text-sm text-gray-900">{selectedSubscription.customer.email}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-700">Telefone</label>
                      <p className="text-sm text-gray-900">{selectedSubscription.customer.phone}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-700">CPF/CNPJ</label>
                      <p className="text-sm text-gray-900">{selectedSubscription.customer.cpfCnpj}</p>
                    </div>
                  </div>
                </TabsContent>
                <TabsContent value="medical" className="space-y-4">
                  {selectedSubscription.medicalInfo ? (
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-sm font-medium text-gray-700">Status da Receita</label>
                        <p className="text-sm">
                          <Badge className={selectedSubscription.medicalInfo.prescriptionValid ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}>
                            {selectedSubscription.medicalInfo.prescriptionValid ? 'Válida' : 'Pendente'}
                          </Badge>
                        </p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-700">Validade da Receita</label>
                        <p className="text-sm text-gray-900">
                          {new Date(selectedSubscription.medicalInfo.prescriptionExpiry).toLocaleDateString('pt-BR')}
                        </p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-700">Médico Responsável</label>
                        <p className="text-sm text-gray-900">{selectedSubscription.medicalInfo.doctorName}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-700">CRM</label>
                        <p className="text-sm text-gray-900">{selectedSubscription.medicalInfo.doctorCRM}</p>
                      </div>
                    </div>
                  ) : (
                    <p className="text-sm text-gray-600">
                      Nenhuma informação médica disponível para esta assinatura.
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