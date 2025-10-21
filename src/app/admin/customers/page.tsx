'use client'
import React, { useState, useCallback } from 'react'
import { motion } from 'framer-motion'
import {
  Users,
  Search,
  Filter,
  Download,
  Eye,
  Edit,
  FileText,
  Phone,
  Mail,
  Calendar,
  MapPin,
  CreditCard,
  AlertCircle,
  CheckCircle,
  Clock,
  XCircle,
  Plus,
  RefreshCw
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { DataTable } from '@/components/admin/tables/DataTable'
import { useAdminAuth } from '@/components/admin/providers/AdminAuthProvider'
import { cn } from '@/lib/utils'
interface Customer {
  id: string
  name: string
  email: string
  phone: string
  cpf: string
  status: 'active' | 'inactive' | 'suspended' | 'pending'
  subscription: {
    plan: string
    status: 'active' | 'paused' | 'cancelled' | 'expired'
    nextBilling: Date
    price: number
  }
  medical: {
    prescriptionValid: boolean
    prescriptionExpiry: Date
    doctor: string
    lastAppointment?: Date
    nextAppointment?: Date
  }
  address: {
    street: string
    city: string
    state: string
    cep: string
  }
  createdAt: Date
  lastActive: Date
  lgpd: {
    consentStatus: 'granted' | 'pending' | 'revoked'
    lastConsentUpdate: Date
    dataRequests: number
  }
}
const mockCustomers: Customer[] = [
  {
    id: '1',
    name: 'Ana Maria Silva',
    email: 'ana.silva@email.com',
    phone: '+55 33 99989-8026',
    cpf: '123.456.789-00',
    status: 'active',
    subscription: {
      plan: 'Mensal Premium',
      status: 'active',
      nextBilling: new Date('2024-02-15'),
      price: 89.90
    },
    medical: {
      prescriptionValid: true,
      prescriptionExpiry: new Date('2024-06-15'),
      doctor: 'Dr. Philipe Saraiva Cruz',
      lastAppointment: new Date('2024-01-10'),
      nextAppointment: new Date('2024-04-10')
    },
    address: {
      street: 'Rua Principal, 123',
      city: 'Caratinga',
      state: 'MG',
      cep: '35300-000'
    },
    createdAt: new Date('2023-12-15'),
    lastActive: new Date('2024-01-20'),
    lgpd: {
      consentStatus: 'granted',
      lastConsentUpdate: new Date('2023-12-15'),
      dataRequests: 0
    }
  },
  {
    id: '2',
    name: 'Carlos Alberto Santos',
    email: 'carlos.santos@email.com',
    phone: '+55 33 98765-4321',
    cpf: '987.654.321-00',
    status: 'active',
    subscription: {
      plan: 'Trimestral Básico',
      status: 'active',
      nextBilling: new Date('2024-03-01'),
      price: 79.90
    },
    medical: {
      prescriptionValid: false,
      prescriptionExpiry: new Date('2024-01-15'),
      doctor: 'Dr. Philipe Saraiva Cruz',
      lastAppointment: new Date('2023-12-20'),
      nextAppointment: undefined
    },
    address: {
      street: 'Avenida Central, 456',
      city: 'Ipatinga',
      state: 'MG',
      cep: '35160-000'
    },
    createdAt: new Date('2023-11-20'),
    lastActive: new Date('2024-01-19'),
    lgpd: {
      consentStatus: 'pending',
      lastConsentUpdate: new Date('2023-11-20'),
      dataRequests: 1
    }
  },
  {
    id: '3',
    name: 'Maria José Oliveira',
    email: 'maria.oliveira@email.com',
    phone: '+55 33 91234-5678',
    cpf: '456.789.123-00',
    status: 'suspended',
    subscription: {
      plan: 'Mensal Premium',
      status: 'paused',
      nextBilling: new Date('2024-02-01'),
      price: 89.90
    },
    medical: {
      prescriptionValid: true,
      prescriptionExpiry: new Date('2024-08-20'),
      doctor: 'Dr. Philipe Saraiva Cruz',
      lastAppointment: new Date('2024-01-05'),
      nextAppointment: new Date('2024-04-05')
    },
    address: {
      street: 'Rua das Flores, 789',
      city: 'Coronel Fabriciano',
      state: 'MG',
      cep: '35170-000'
    },
    createdAt: new Date('2023-10-10'),
    lastActive: new Date('2024-01-15'),
    lgpd: {
      consentStatus: 'granted',
      lastConsentUpdate: new Date('2023-10-10'),
      dataRequests: 2
    }
  }
]
export default function CustomersPage() {
  const { hasPermission } = useAdminAuth()
  const [customers] = useState<Customer[]>(mockCustomers)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedStatus, setSelectedStatus] = useState<string>('all')
  const [selectedSubscription, setSelectedSubscription] = useState<string>('all')
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null)
  const [showFilters, setShowFilters] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  // Verificação de permissão
  if (!hasPermission('VIEW_CUSTOMERS')) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <AlertCircle className="h-12 w-12 text-yellow-500 mx-auto mb-4" />
          <h2 className="text-lg font-semibold">Acesso Negado</h2>
          <p className="text-muted-foreground">
            Você não tem permissão para visualizar clientes.
          </p>
        </div>
      </div>
    )
  }
  const filteredCustomers = customers.filter(customer => {
    const matchesSearch =
      customer.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      customer.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      customer.cpf.includes(searchQuery) ||
      customer.phone.includes(searchQuery)
    const matchesStatus = selectedStatus === 'all' || customer.status === selectedStatus
    const matchesSubscription = selectedSubscription === 'all' ||
      customer.subscription.status === selectedSubscription
    return matchesSearch && matchesStatus && matchesSubscription
  })
  const getStatusColor = (status: Customer['status']) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800 border-green-200'
      case 'inactive': return 'bg-gray-100 text-gray-800 border-gray-200'
      case 'suspended': return 'bg-red-100 text-red-800 border-red-200'
      case 'pending': return 'bg-yellow-100 text-yellow-800 border-yellow-200'
    }
  }
  const getSubscriptionColor = (status: Customer['subscription']['status']) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800 border-green-200'
      case 'paused': return 'bg-orange-100 text-orange-800 border-orange-200'
      case 'cancelled': return 'bg-red-100 text-red-800 border-red-200'
      case 'expired': return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }
  const getLGPDColor = (status: Customer['lgpd']['consentStatus']) => {
    switch (status) {
      case 'granted': return 'bg-green-100 text-green-800 border-green-200'
      case 'pending': return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 'revoked': return 'bg-red-100 text-red-800 border-red-200'
    }
  }
  const handleViewCustomer = useCallback((customer: Customer) => {
    setSelectedCustomer(customer)
  }, [])
  const handleEditCustomer = useCallback((customer: Customer) => {
  }, [])
  const handleExportData = useCallback(() => {
  }, [])
  const handleRefresh = useCallback(() => {
    setIsLoading(true)
    setTimeout(() => setIsLoading(false), 1000)
  }, [])
  const columns = [
    {
      key: 'name',
      label: 'Cliente',
      render: (customer: Customer) => (
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-full bg-cyan-100 flex items-center justify-center">
            <span className="text-sm font-medium text-cyan-800">
              {customer.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
            </span>
          </div>
          <div>
            <div className="font-medium text-gray-900">{customer.name}</div>
            <div className="text-sm text-gray-500">{customer.email}</div>
            <div className="text-xs text-gray-400">{customer.cpf}</div>
          </div>
        </div>
      )
    },
    {
      key: 'contact',
      label: 'Contato',
      render: (customer: Customer) => (
        <div className="text-sm">
          <div className="flex items-center gap-1">
            <Phone className="h-3 w-3" />
            {customer.phone}
          </div>
          <div className="flex items-center gap-1 mt-1">
            <MapPin className="h-3 w-3" />
            <span className="truncate max-w-[120px]">
              {customer.address.city}, {customer.address.state}
            </span>
          </div>
        </div>
      )
    },
    {
      key: 'status',
      label: 'Status',
      render: (customer: Customer) => (
        <div className="flex flex-col gap-1">
          <Badge className={cn("text-xs", getStatusColor(customer.status))}>
            {customer.status === 'active' && 'Ativo'}
            {customer.status === 'inactive' && 'Inativo'}
            {customer.status === 'suspended' && 'Suspenso'}
            {customer.status === 'pending' && 'Pendente'}
          </Badge>
          <Badge className={cn("text-xs", getSubscriptionColor(customer.subscription.status))}>
            {customer.subscription.status === 'active' && 'Assinatura Ativa'}
            {customer.subscription.status === 'paused' && 'Assinatura Pausada'}
            {customer.subscription.status === 'cancelled' && 'Cancelado'}
            {customer.subscription.status === 'expired' && 'Expirado'}
          </Badge>
        </div>
      )
    },
    {
      key: 'medical',
      label: 'Informações Médicas',
      render: (customer: Customer) => (
        <div className="text-sm">
          <div className="flex items-center gap-1 mb-1">
            {customer.medical.prescriptionValid ? (
              <CheckCircle className="h-3 w-3 text-green-600" />
            ) : (
              <AlertCircle className="h-3 w-3 text-red-600" />
            )}
            <span className={customer.medical.prescriptionValid ? 'text-green-800' : 'text-red-800'}>
              Receita {customer.medical.prescriptionValid ? 'Válida' : 'Expirada'}
            </span>
          </div>
          <div className="text-xs text-gray-500">
            Dr. {customer.medical.doctor.split(' ').pop()}
          </div>
          {customer.medical.nextAppointment && (
            <div className="flex items-center gap-1 text-xs text-blue-600 mt-1">
              <Calendar className="h-3 w-3" />
              {customer.medical.nextAppointment.toLocaleDateString('pt-BR')}
            </div>
          )}
        </div>
      )
    },
    {
      key: 'lgpd',
      label: 'LGPD',
      render: (customer: Customer) => (
        <div className="text-sm">
          <div className="flex items-center gap-1 mb-1">
            <Badge className={cn("text-xs", getLGPDColor(customer.lgpd.consentStatus))}>
              {customer.lgpd.consentStatus === 'granted' && 'Consentido'}
              {customer.lgpd.consentStatus === 'pending' && 'Pendente'}
              {customer.lgpd.consentStatus === 'revoked' && 'Revogado'}
            </Badge>
          </div>
          {customer.lgpd.dataRequests > 0 && (
            <div className="flex items-center gap-1 text-xs text-orange-600">
              <FileText className="h-3 w-3" />
              {customer.lgpd.dataRequests} solicitação(ões)
            </div>
          )}
        </div>
      )
    },
    {
      key: 'subscription',
      label: 'Assinatura',
      render: (customer: Customer) => (
        <div className="text-sm">
          <div className="font-medium">{customer.subscription.plan}</div>
          <div className="text-gray-500">
            {new Intl.NumberFormat('pt-BR', {
              style: 'currency',
              currency: 'BRL'
            }).format(customer.subscription.price)}
          </div>
          <div className="text-xs text-gray-400">
            Próxima: {customer.subscription.nextBilling.toLocaleDateString('pt-BR')}
          </div>
        </div>
      )
    },
    {
      key: 'actions',
      label: 'Ações',
      render: (customer: Customer) => (
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleViewCustomer(customer)}
            className="text-blue-600 hover:text-blue-800"
          >
            <Eye className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleEditCustomer(customer)}
            className="text-green-600 hover:text-green-800"
          >
            <Edit className="h-4 w-4" />
          </Button>
        </div>
      )
    }
  ]
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
          <h1 className="text-3xl font-bold tracking-tight">Gestão de Clientes</h1>
          <p className="text-muted-foreground">
            Gerencie clientes, assinaturas e informações médicas
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
            onClick={handleExportData}
          >
            <Download className="h-4 w-4 mr-2" />
            Exportar
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={isLoading}
          >
            <RefreshCw className={cn("h-4 w-4 mr-2", isLoading && "animate-spin")} />
            Atualizar
          </Button>
          <Button size="sm">
            <Plus className="h-4 w-4 mr-2" />
            Novo Cliente
          </Button>
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
                  placeholder="Nome, email, CPF, telefone..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Status do Cliente</label>
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="w-full p-2 border rounded-md"
              >
                <option value="all">Todos</option>
                <option value="active">Ativo</option>
                <option value="inactive">Inativo</option>
                <option value="suspended">Suspenso</option>
                <option value="pending">Pendente</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Status da Assinatura</label>
              <select
                value={selectedSubscription}
                onChange={(e) => setSelectedSubscription(e.target.value)}
                className="w-full p-2 border rounded-md"
              >
                <option value="all">Todas</option>
                <option value="active">Ativa</option>
                <option value="paused">Pausada</option>
                <option value="cancelled">Cancelada</option>
                <option value="expired">Expirada</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Compliance LGPD</label>
              <select className="w-full p-2 border rounded-md">
                <option value="all">Todos</option>
                <option value="granted">Consentido</option>
                <option value="pending">Pendente</option>
                <option value="revoked">Revogado</option>
              </select>
            </div>
          </div>
        </motion.div>
      )}
      {/* Métricas */}
      <div className="grid gap-4 md:grid-cols-4">
        <div className="bg-card border rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total de Clientes</p>
              <p className="text-2xl font-bold">{customers.length}</p>
            </div>
            <Users className="h-8 w-8 text-blue-600" />
          </div>
        </div>
        <div className="bg-card border rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Assinaturas Ativas</p>
              <p className="text-2xl font-bold">
                {customers.filter(c => c.subscription.status === 'active').length}
              </p>
            </div>
            <CreditCard className="h-8 w-8 text-green-600" />
          </div>
        </div>
        <div className="bg-card border rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Receitas Válidas</p>
              <p className="text-2xl font-bold">
                {customers.filter(c => c.medical.prescriptionValid).length}
              </p>
            </div>
            <CheckCircle className="h-8 w-8 text-green-600" />
          </div>
        </div>
        <div className="bg-card border rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">LGPD Compliance</p>
              <p className="text-2xl font-bold">
                {customers.filter(c => c.lgpd.consentStatus === 'granted').length}
              </p>
            </div>
            <AlertCircle className="h-8 w-8 text-yellow-600" />
          </div>
        </div>
      </div>
      {/* Tabela de Clientes */}
      <DataTable
        data={filteredCustomers}
        columns={columns}
        keyField="id"
        className="bg-card border rounded-lg"
      />
      {/* Modal de Detalhes do Cliente (simples) */}
      {selectedCustomer && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-start mb-4">
              <h2 className="text-xl font-semibold">Detalhes do Cliente</h2>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSelectedCustomer(null)}
              >
                <XCircle className="h-5 w-5" />
              </Button>
            </div>
            <div className="grid gap-6 md:grid-cols-2">
              <div>
                <h3 className="font-medium mb-2">Informações Pessoais</h3>
                <div className="space-y-2 text-sm">
                  <div><strong>Nome:</strong> {selectedCustomer.name}</div>
                  <div><strong>Email:</strong> {selectedCustomer.email}</div>
                  <div><strong>Telefone:</strong> {selectedCustomer.phone}</div>
                  <div><strong>CPF:</strong> {selectedCustomer.cpf}</div>
                  <div><strong>Endereço:</strong> {selectedCustomer.address.street}, {selectedCustomer.address.city}, {selectedCustomer.address.state}</div>
                  <div><strong>CEP:</strong> {selectedCustomer.address.cep}</div>
                </div>
              </div>
              <div>
                <h3 className="font-medium mb-2">Assinatura</h3>
                <div className="space-y-2 text-sm">
                  <div><strong>Plano:</strong> {selectedCustomer.subscription.plan}</div>
                  <div><strong>Status:</strong> {selectedCustomer.subscription.status}</div>
                  <div><strong>Valor:</strong> {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(selectedCustomer.subscription.price)}</div>
                  <div><strong>Próxima cobrança:</strong> {selectedCustomer.subscription.nextBilling.toLocaleDateString('pt-BR')}</div>
                </div>
              </div>
              <div>
                <h3 className="font-medium mb-2">Informações Médicas</h3>
                <div className="space-y-2 text-sm">
                  <div><strong>Médico:</strong> {selectedCustomer.medical.doctor}</div>
                  <div><strong>Receita válida:</strong> {selectedCustomer.medical.prescriptionValid ? 'Sim' : 'Não'}</div>
                  <div><strong>Validade da receita:</strong> {selectedCustomer.medical.prescriptionExpiry.toLocaleDateString('pt-BR')}</div>
                  {selectedCustomer.medical.lastAppointment && (
                    <div><strong>Última consulta:</strong> {selectedCustomer.medical.lastAppointment.toLocaleDateString('pt-BR')}</div>
                  )}
                  {selectedCustomer.medical.nextAppointment && (
                    <div><strong>Próxima consulta:</strong> {selectedCustomer.medical.nextAppointment.toLocaleDateString('pt-BR')}</div>
                  )}
                </div>
              </div>
              <div>
                <h3 className="font-medium mb-2">LGPD</h3>
                <div className="space-y-2 text-sm">
                  <div><strong>Status de consentimento:</strong> {selectedCustomer.lgpd.consentStatus}</div>
                  <div><strong>Última atualização:</strong> {selectedCustomer.lgpd.lastConsentUpdate.toLocaleDateString('pt-BR')}</div>
                  <div><strong>Solicitações de dados:</strong> {selectedCustomer.lgpd.dataRequests}</div>
                </div>
              </div>
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <Button variant="outline" onClick={() => setSelectedCustomer(null)}>
                Fechar
              </Button>
              <Button>
                Editar Cliente
              </Button>
            </div>
          </div>
        </div>
      )}
    </motion.div>
  )
}