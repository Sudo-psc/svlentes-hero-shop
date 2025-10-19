'use client'

import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import {
  MessageCircle,
  Phone,
  Clock,
  CheckCircle,
  AlertTriangle,
  User,
  Search,
  Filter,
  Reply,
  Forward,
  Star,
  TrendingUp,
  Users,
  Headphones,
  Send,
  Paperclip,
  Smile,
  MoreVertical,
  ExternalLink,
  RefreshCw
} from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Badge } from '@/components/ui/Badge'
import { useAdminAuth } from '@/components/admin/providers/AdminAuthProvider'
import { cn } from '@/lib/utils'

interface Ticket {
  id: string
  customerId: string
  customerName: string
  customerEmail: string
  customerPhone: string
  subject: string
  category: 'technical' | 'billing' | 'medical' | 'delivery' | 'general'
  priority: 'low' | 'medium' | 'high' | 'urgent'
  status: 'open' | 'in_progress' | 'waiting_customer' | 'resolved' | 'closed'
  assignedTo?: string
  createdAt: Date
  updatedAt: Date
  lastMessageAt: Date
  messages: Message[]
  whatsappConversationId?: string
  satisfaction?: number
  resolutionTime?: number
  tags: string[]
}

interface Message {
  id: string
  ticketId: string
  senderId: string
  senderName: string
  senderType: 'customer' | 'admin' | 'system'
  content: string
  type: 'text' | 'image' | 'file' | 'system'
  timestamp: Date
  isRead: boolean
  metadata?: {
    whatsappMessageId?: string
    attachments?: string[]
  }
}

interface Agent {
  id: string
  name: string
  email: string
  avatar?: string
  status: 'online' | 'busy' | 'offline'
  activeTickets: number
  averageResponseTime: number
  satisfaction: number
}

const mockTickets: Ticket[] = [
  {
    id: '1',
    customerId: '1',
    customerName: 'Ana Maria Silva',
    customerEmail: 'ana.silva@email.com',
    customerPhone: '+55 33 99989-8026',
    subject: 'Dificuldade com novas lentes',
    category: 'technical',
    priority: 'medium',
    status: 'in_progress',
    assignedTo: 'agent1',
    createdAt: new Date('2024-01-20T10:30:00'),
    updatedAt: new Date('2024-01-20T14:15:00'),
    lastMessageAt: new Date('2024-01-20T14:15:00'),
    whatsappConversationId: 'wa_conv_123',
    satisfaction: 4,
    tags: ['lentes', 'adaptação', 'primeiro uso'],
    messages: [
      {
        id: '1',
        ticketId: '1',
        senderId: '1',
        senderName: 'Ana Maria Silva',
        senderType: 'customer',
        content: 'Olá, estou com dificuldade para adaptar às minhas novas lentes. Sinto um leve desconforto.',
        type: 'text',
        timestamp: new Date('2024-01-20T10:30:00'),
        isRead: true
      },
      {
        id: '2',
        ticketId: '1',
        senderId: 'agent1',
        senderName: 'João - Suporte',
        senderType: 'admin',
        content: 'Olá Ana! Entendo sua preocupação. É normal sentir algum desconforto nos primeiros dias. Quanto tempo você está usando as lentes?',
        type: 'text',
        timestamp: new Date('2024-01-20T11:00:00'),
        isRead: true
      },
      {
        id: '3',
        ticketId: '1',
        senderId: '1',
        senderName: 'Ana Maria Silva',
        senderType: 'customer',
        content: 'Estou usando há 3 dias. O desconforto melhorou, mas ainda sinto os olhos secos.',
        type: 'text',
        timestamp: new Date('2024-01-20T14:15:00'),
        isRead: false
      }
    ]
  },
  {
    id: '2',
    customerId: '2',
    customerName: 'Carlos Alberto Santos',
    customerEmail: 'carlos.santos@email.com',
    customerPhone: '+55 33 98765-4321',
    subject: 'Problema com entrega',
    category: 'delivery',
    priority: 'high',
    status: 'open',
    assignedTo: 'agent2',
    createdAt: new Date('2024-01-19T16:45:00'),
    updatedAt: new Date('2024-01-19T16:45:00'),
    lastMessageAt: new Date('2024-01-19T16:45:00'),
    whatsappConversationId: 'wa_conv_456',
    tags: ['entrega', 'atraso', 'rastreamento'],
    messages: [
      {
        id: '1',
        ticketId: '2',
        senderId: '2',
        senderName: 'Carlos Alberto Santos',
        senderType: 'customer',
        content: 'Minha entrega está atrasada. O código de rastreamento BR123456789 não atualiza há 3 dias.',
        type: 'text',
        timestamp: new Date('2024-01-19T16:45:00'),
        isRead: false
      }
    ]
  },
  {
    id: '3',
    customerId: '3',
    customerName: 'Maria José Oliveira',
    customerEmail: 'maria.oliveira@email.com',
    customerPhone: '+55 33 91234-5678',
    subject: 'Dúvida sobre fatura',
    category: 'billing',
    priority: 'low',
    status: 'waiting_customer',
    assignedTo: 'agent1',
    createdAt: new Date('2024-01-18T09:20:00'),
    updatedAt: new Date('2024-01-18T11:30:00'),
    lastMessageAt: new Date('2024-01-18T11:30:00'),
    resolutionTime: 2.5,
    satisfaction: 5,
    tags: ['fatura', 'pagamento', 'duplicate'],
    messages: [
      {
        id: '1',
        ticketId: '3',
        senderId: '3',
        senderName: 'Maria José Oliveira',
        senderType: 'customer',
        content: 'Recebi duas cobranças este mês. Podem verificar por favor?',
        type: 'text',
        timestamp: new Date('2024-01-18T09:20:00'),
        isRead: true
      },
      {
        id: '2',
        ticketId: '3',
        senderId: 'agent1',
        senderName: 'João - Suporte',
        senderType: 'admin',
        content: 'Olá Maria! Verificamos e identificamos um erro nosso. Já estornamos o valor duplicado. Pedimos desculpas pelo transtorno.',
        type: 'text',
        timestamp: new Date('2024-01-18T11:30:00'),
        isRead: true
      }
    ]
  }
]

const mockAgents: Agent[] = [
  {
    id: 'agent1',
    name: 'João Silva',
    email: 'joao@svlentes.com.br',
    status: 'online',
    activeTickets: 2,
    averageResponseTime: 15,
    satisfaction: 4.7
  },
  {
    id: 'agent2',
    name: 'Maria Souza',
    email: 'maria@svlentes.com.br',
    status: 'busy',
    activeTickets: 3,
    averageResponseTime: 12,
    satisfaction: 4.9
  },
  {
    id: 'agent3',
    name: 'Pedro Costa',
    email: 'pedro@svlentes.com.br',
    status: 'offline',
    activeTickets: 0,
    averageResponseTime: 18,
    satisfaction: 4.5
  }
]

export default function SupportDashboard() {
  const { hasPermission } = useAdminAuth()
  const [tickets, setTickets] = useState<Ticket[]>(mockTickets)
  const [agents] = useState<Agent[]>(mockAgents)
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedStatus, setSelectedStatus] = useState<string>('all')
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [selectedPriority, setSelectedPriority] = useState<string>('all')
  const [newMessage, setNewMessage] = useState('')
  const [showFilters, setShowFilters] = useState(false)

  // Verificação de permissão
  if (!hasPermission('VIEW_SUPPORT')) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <AlertTriangle className="h-12 w-12 text-yellow-500 mx-auto mb-4" />
          <h2 className="text-lg font-semibold">Acesso Negado</h2>
          <p className="text-muted-foreground">
            Você não tem permissão para acessar o suporte.
          </p>
        </div>
      </div>
    )
  }

  const filteredTickets = tickets.filter(ticket => {
    const matchesSearch =
      ticket.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ticket.subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ticket.customerEmail.toLowerCase().includes(searchQuery.toLowerCase())

    const matchesStatus = selectedStatus === 'all' || ticket.status === selectedStatus
    const matchesCategory = selectedCategory === 'all' || ticket.category === selectedCategory
    const matchesPriority = selectedPriority === 'all' || ticket.priority === selectedPriority

    return matchesSearch && matchesStatus && matchesCategory && matchesPriority
  })

  const getStatusColor = (status: Ticket['status']) => {
    switch (status) {
      case 'open': return 'bg-blue-100 text-blue-800 border-blue-200'
      case 'in_progress': return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 'waiting_customer': return 'bg-orange-100 text-orange-800 border-orange-200'
      case 'resolved': return 'bg-green-100 text-green-800 border-green-200'
      case 'closed': return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const getPriorityColor = (priority: Ticket['priority']) => {
    switch (priority) {
      case 'urgent': return 'bg-red-100 text-red-800 border-red-200'
      case 'high': return 'bg-orange-100 text-orange-800 border-orange-200'
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 'low': return 'bg-blue-100 text-blue-800 border-blue-200'
    }
  }

  const getCategoryIcon = (category: Ticket['category']) => {
    switch (category) {
      case 'technical': return <MessageCircle className="h-4 w-4" />
      case 'billing': return <MessageCircle className="h-4 w-4" />
      case 'medical': return <MessageCircle className="h-4 w-4" />
      case 'delivery': return <MessageCircle className="h-4 w-4" />
      case 'general': return <MessageCircle className="h-4 w-4" />
    }
  }

  const getAgentStatusColor = (status: Agent['status']) => {
    switch (status) {
      case 'online': return 'bg-green-500'
      case 'busy': return 'bg-yellow-500'
      case 'offline': return 'bg-gray-400'
    }
  }

  const getStatusText = (status: Ticket['status']) => {
    switch (status) {
      case 'open': return 'Aberto'
      case 'in_progress': return 'Em Andamento'
      case 'waiting_customer': return 'Aguardando Cliente'
      case 'resolved': return 'Resolvido'
      case 'closed': return 'Fechado'
    }
  }

  const getPriorityText = (priority: Ticket['priority']) => {
    switch (priority) {
      case 'urgent': return 'Urgente'
      case 'high': return 'Alta'
      case 'medium': return 'Média'
      case 'low': return 'Baixa'
    }
  }

  const getTimeSinceLastMessage = (date: Date) => {
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
    const diffDays = Math.floor(diffHours / 24)

    if (diffDays > 0) return `${diffDays}d atrás`
    if (diffHours > 0) return `${diffHours}h atrás`
    return 'Agora'
  }

  const handleSendMessage = () => {
    if (!newMessage.trim() || !selectedTicket) return

    const newMsg: Message = {
      id: Date.now().toString(),
      ticketId: selectedTicket.id,
      senderId: 'current_agent',
      senderName: 'Agente Atual',
      senderType: 'admin',
      content: newMessage,
      type: 'text',
      timestamp: new Date(),
      isRead: true
    }

    setTickets(prev => prev.map(ticket =>
      ticket.id === selectedTicket.id
        ? {
            ...ticket,
            messages: [...ticket.messages, newMsg],
            updatedAt: new Date(),
            lastMessageAt: new Date()
          }
        : ticket
    ))

    setNewMessage('')
  }

  const handleWhatsAppIntegration = (ticket: Ticket) => {
    if (ticket.whatsappConversationId) {
      window.open(`https://web.whatsapp.com/`, '_blank')
    }
  }

  const stats = {
    total: tickets.length,
    open: tickets.filter(t => t.status === 'open').length,
    inProgress: tickets.filter(t => t.status === 'in_progress').length,
    resolved: tickets.filter(t => t.status === 'resolved').length,
    averageResponseTime: 15, // minutes
    satisfaction: 4.6
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard de Suporte</h1>
          <p className="text-muted-foreground">
            Gerencie tickets de suporte e integração com WhatsApp
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

          <Button variant="outline" size="sm">
            <RefreshCw className="h-4 w-4 mr-2" />
            Atualizar
          </Button>

          <Button size="sm">
            <MessageCircle className="h-4 w-4 mr-2" />
            Novo Ticket
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-5">
        <div className="bg-card border rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total</p>
              <p className="text-2xl font-bold">{stats.total}</p>
            </div>
            <Headphones className="h-8 w-8 text-blue-600" />
          </div>
        </div>

        <div className="bg-card border rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Abertos</p>
              <p className="text-2xl font-bold text-blue-600">{stats.open}</p>
            </div>
            <MessageCircle className="h-8 w-8 text-blue-600" />
          </div>
        </div>

        <div className="bg-card border rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Em Andamento</p>
              <p className="text-2xl font-bold text-yellow-600">{stats.inProgress}</p>
            </div>
            <Clock className="h-8 w-8 text-yellow-600" />
          </div>
        </div>

        <div className="bg-card border rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Resolvidos</p>
              <p className="text-2xl font-bold text-green-600">{stats.resolved}</p>
            </div>
            <CheckCircle className="h-8 w-8 text-green-600" />
          </div>
        </div>

        <div className="bg-card border rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Satisfação</p>
              <p className="text-2xl font-bold text-purple-600">{stats.satisfaction}</p>
            </div>
            <Star className="h-8 w-8 text-purple-600" />
          </div>
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
          <div className="grid gap-4 md:grid-cols-5">
            <div>
              <label className="block text-sm font-medium mb-2">Buscar</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Cliente, assunto..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Status</label>
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="w-full p-2 border rounded-md"
              >
                <option value="all">Todos</option>
                <option value="open">Abertos</option>
                <option value="in_progress">Em Andamento</option>
                <option value="waiting_customer">Aguardando Cliente</option>
                <option value="resolved">Resolvidos</option>
                <option value="closed">Fechados</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Categoria</label>
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="w-full p-2 border rounded-md"
              >
                <option value="all">Todas</option>
                <option value="technical">Técnico</option>
                <option value="billing">Financeiro</option>
                <option value="medical">Médico</option>
                <option value="delivery">Entrega</option>
                <option value="general">Geral</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Prioridade</label>
              <select
                value={selectedPriority}
                onChange={(e) => setSelectedPriority(e.target.value)}
                className="w-full p-2 border rounded-md"
              >
                <option value="all">Todas</option>
                <option value="urgent">Urgente</option>
                <option value="high">Alta</option>
                <option value="medium">Média</option>
                <option value="low">Baixa</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Agentes Online</label>
              <div className="space-y-1">
                {agents.filter(a => a.status !== 'offline').map(agent => (
                  <div key={agent.id} className="flex items-center gap-2 text-sm">
                    <div className={cn("w-2 h-2 rounded-full", getAgentStatusColor(agent.status))} />
                    <span>{agent.name}</span>
                    <span className="text-gray-500">({agent.activeTickets})</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </motion.div>
      )}

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Lista de Tickets */}
        <div className="lg:col-span-1">
          <div className="bg-card border rounded-lg">
            <div className="p-4 border-b">
              <h3 className="font-medium">Tickets ({filteredTickets.length})</h3>
            </div>

            <div className="divide-y max-h-[600px] overflow-y-auto">
              {filteredTickets.map((ticket, index) => (
                <motion.div
                  key={ticket.id}
                  className={cn(
                    "p-4 cursor-pointer hover:bg-gray-50 transition-colors",
                    selectedTicket?.id === ticket.id && "bg-blue-50 border-l-4 border-blue-500"
                  )}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                  onClick={() => setSelectedTicket(ticket)}
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1 min-w-0">
                      <h4 className="font-medium text-sm truncate">{ticket.subject}</h4>
                      <p className="text-xs text-gray-600 truncate">{ticket.customerName}</p>
                    </div>

                    <div className="flex flex-col gap-1">
                      <Badge className={cn("text-xs", getPriorityColor(ticket.priority))}>
                        {getPriorityText(ticket.priority)}
                      </Badge>
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      {getCategoryIcon(ticket.category)}
                      <span className="text-gray-600">{getTimeSinceLastMessage(ticket.lastMessageAt)}</span>
                    </div>

                    <Badge className={cn("text-xs", getStatusColor(ticket.status))}>
                      {getStatusText(ticket.status)}
                    </Badge>
                  </div>

                  {ticket.whatsappConversationId && (
                    <div className="flex items-center gap-1 mt-2 text-xs text-green-600">
                      <MessageCircle className="h-3 w-3" />
                      <span>WhatsApp ativo</span>
                    </div>
                  )}
                </motion.div>
              ))}
            </div>

            {filteredTickets.length === 0 && (
              <div className="p-8 text-center">
                <MessageCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">Nenhum ticket encontrado</p>
              </div>
            )}
          </div>
        </div>

        {/* Detalhes do Ticket */}
        <div className="lg:col-span-2">
          {selectedTicket ? (
            <div className="bg-card border rounded-lg h-[600px] flex flex-col">
              {/* Header */}
              <div className="p-4 border-b">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h3 className="font-semibold text-lg">{selectedTicket.subject}</h3>
                    <p className="text-sm text-gray-600">
                      #{selectedTicket.id} • {selectedTicket.customerName}
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleWhatsAppIntegration(selectedTicket)}
                    >
                      <MessageCircle className="h-4 w-4 mr-1" />
                      WhatsApp
                    </Button>

                    <Button variant="ghost" size="sm">
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                <div className="flex items-center gap-3 text-sm">
                  <Badge className={cn("text-xs", getPriorityColor(selectedTicket.priority))}>
                    {getPriorityText(selectedTicket.priority)}
                  </Badge>

                  <Badge className={cn("text-xs", getStatusColor(selectedTicket.status))}>
                    {getStatusText(selectedTicket.status)}
                  </Badge>

                  <span className="text-gray-500">
                    Criado: {selectedTicket.createdAt.toLocaleDateString('pt-BR')}
                  </span>

                  {selectedTicket.assignedTo && (
                    <span className="text-gray-500">
                      Agente: {agents.find(a => a.id === selectedTicket.assignedTo)?.name}
                    </span>
                  )}
                </div>

                {selectedTicket.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-2">
                    {selectedTicket.tags.map((tag, index) => (
                      <Badge key={index} variant="outline" className="text-xs">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                )}
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {selectedTicket.messages.map((message, index) => (
                  <div
                    key={message.id}
                    className={cn(
                      "flex",
                      message.senderType === 'customer' ? "justify-start" : "justify-end"
                    )}
                  >
                    <div className={cn(
                      "max-w-[70%] rounded-lg p-3",
                      message.senderType === 'customer'
                        ? "bg-gray-100 text-gray-900"
                        : "bg-blue-600 text-white"
                    )}>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs font-medium opacity-70">
                          {message.senderName}
                        </span>
                        <span className="text-xs opacity-50">
                          {message.timestamp.toLocaleTimeString('pt-BR', {
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </span>
                      </div>

                      <p className="text-sm">{message.content}</p>

                      {message.metadata?.attachments && (
                        <div className="mt-2">
                          <Button variant="ghost" size="sm" className="text-xs">
                            <Paperclip className="h-3 w-3 mr-1" />
                            {message.metadata.attachments.length} anexo(s)
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {/* Message Input */}
              <div className="p-4 border-t">
                <div className="flex items-center gap-2">
                  <Button variant="ghost" size="sm">
                    <Paperclip className="h-4 w-4" />
                  </Button>

                  <Input
                    placeholder="Digite sua resposta..."
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                    className="flex-1"
                  />

                  <Button variant="ghost" size="sm">
                    <Smile className="h-4 w-4" />
                  </Button>

                  <Button size="sm" onClick={handleSendMessage}>
                    <Send className="h-4 w-4" />
                  </Button>
                </div>

                <div className="flex items-center gap-4 mt-3 text-xs text-gray-500">
                  <span>WhatsApp: {selectedTicket.whatsappConversationId ? 'Conectado' : 'Não conectado'}</span>
                  <span>•</span>
                  <span>Tempo médio de resposta: {stats.averageResponseTime}min</span>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-card border rounded-lg h-[600px] flex items-center justify-center">
              <div className="text-center">
                <MessageCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">Selecione um ticket para ver os detalhes</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}