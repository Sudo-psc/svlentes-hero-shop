'use client'

import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Bell,
  Calendar,
  Clock,
  Package,
  CreditCard,
  Eye,
  MessageCircle,
  CheckCircle,
  X,
  AlertTriangle,
  Info,
  ChevronRight,
  Settings,
  Smartphone
} from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { cn } from '@/lib/utils'

interface Reminder {
  id: string
  type: 'lens_replacement' | 'appointment' | 'payment' | 'prescription_expiry' | 'delivery' | 'checkup'
  title: string
  description: string
  urgency: 'low' | 'medium' | 'high' | 'urgent'
  scheduledDate: Date
  daysUntil: number
  isCompleted?: boolean
  isRead?: boolean
  actionUrl?: string
  actionLabel?: string
  icon?: React.ReactNode
  channels: ('app' | 'whatsapp' | 'email' | 'sms')[]
  metadata?: {
    appointmentTime?: string
    doctorName?: string
    amount?: number
    trackingNumber?: string
    prescriptionExpiry?: Date
  }
}

const mockReminders: Reminder[] = [
  {
    id: '1',
    type: 'lens_replacement',
    title: 'Substituição de Lentes Mensal',
    description: 'Hora de substituir suas lentes de contato por um novo par',
    urgency: 'high',
    scheduledDate: new Date('2024-02-01'),
    daysUntil: 3,
    icon: <Eye className="h-5 w-5" />,
    channels: ['app', 'whatsapp', 'email'],
    actionLabel: 'Pedir Novas Lentes',
    actionUrl: '/assinante/assinar'
  },
  {
    id: '2',
    type: 'appointment',
    title: 'Consulta de Retorno',
    description: 'Consulta agendada com Dr. Philipe Saraiva Cruz',
    urgency: 'medium',
    scheduledDate: new Date('2024-02-05'),
    daysUntil: 7,
    icon: <Calendar className="h-5 w-5" />,
    channels: ['app', 'whatsapp', 'email', 'sms'],
    metadata: {
      appointmentTime: '14:30',
      doctorName: 'Dr. Philipe Saraiva Cruz'
    },
    actionLabel: 'Ver Detalhes',
    actionUrl: '/assinante/agendamentos'
  },
  {
    id: '3',
    type: 'payment',
    title: 'Cobrança da Assinatura',
    description: 'Pagamento mensal da assinatura premium - R$ 89,90',
    urgency: 'medium',
    scheduledDate: new Date('2024-02-15'),
    daysUntil: 17,
    icon: <CreditCard className="h-5 w-5" />,
    channels: ['app', 'email'],
    metadata: {
      amount: 89.90
    },
    actionLabel: 'Ver Fatura',
    actionUrl: '/assinante/faturas'
  },
  {
    id: '4',
    type: 'prescription_expiry',
    title: 'Validade da Prescrição',
    description: 'Sua prescrição médica expira em 30 dias',
    urgency: 'high',
    scheduledDate: new Date('2024-03-15'),
    daysUntil: 47,
    icon: <AlertTriangle className="h-5 w-5" />,
    channels: ['app', 'whatsapp', 'email'],
    metadata: {
      prescriptionExpiry: new Date('2024-03-15')
    },
    actionLabel: 'Agendar Consulta',
    actionUrl: '/agendar-consulta'
  },
  {
    id: '5',
    type: 'delivery',
    title: 'Entrega de Lentes',
    description: 'Seu pedido está a caminho - tracking: BR123456789',
    urgency: 'low',
    scheduledDate: new Date('2024-01-25'),
    daysUntil: -3,
    icon: <Package className="h-5 w-5" />,
    channels: ['app', 'whatsapp', 'sms'],
    metadata: {
      trackingNumber: 'BR123456789'
    },
    actionLabel: 'Rastrear Entrega',
    actionUrl: '/assinante/pedidos'
  },
  {
    id: '6',
    type: 'checkup',
    title: 'Checkup Ocular Semestral',
    description: 'Exame oftalmológico completo de rotina',
    urgency: 'low',
    scheduledDate: new Date('2024-04-20'),
    daysUntil: 83,
    icon: <Eye className="h-5 w-5" />,
    channels: ['app', 'email'],
    actionLabel: 'Agendar Exame',
    actionUrl: '/agendar-consulta'
  }
]

interface SmartRemindersProps {
  maxItems?: number
  showSettings?: boolean
  compact?: boolean
}

export function SmartReminders({ maxItems = 5, showSettings = true, compact = false }: SmartRemindersProps) {
  const [reminders, setReminders] = useState<Reminder[]>(mockReminders)
  const [selectedReminder, setSelectedReminder] = useState<Reminder | null>(null)
  const [showSettingsModal, setShowSettingsModal] = useState(false)
  const [notificationPreferences, setNotificationPreferences] = useState({
    app: true,
    whatsapp: true,
    email: true,
    sms: false,
    advanceNotice: 7 // dias
  })

  // Filtrar lembretes futuros (não expirados) e não concluídos
  const upcomingReminders = reminders
    .filter(r => !r.isCompleted && r.daysUntil >= -1)
    .sort((a, b) => a.daysUntil - b.daysUntil)
    .slice(0, maxItems)

  const unreadReminders = upcomingReminders.filter(r => !r.isRead)

  const getUrgencyColor = (urgency: Reminder['urgency']) => {
    switch (urgency) {
      case 'urgent': return 'bg-red-100 text-red-800 border-red-200'
      case 'high': return 'bg-orange-100 text-orange-800 border-orange-200'
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 'low': return 'bg-blue-100 text-blue-800 border-blue-200'
    }
  }

  const getDaysUntilColor = (daysUntil: number) => {
    if (daysUntil < 0) return 'text-gray-500'
    if (daysUntil <= 3) return 'text-red-600'
    if (daysUntil <= 7) return 'text-orange-600'
    if (daysUntil <= 14) return 'text-yellow-600'
    return 'text-green-600'
  }

  const getDaysUntilText = (daysUntil: number) => {
    if (daysUntil < 0) return `${Math.abs(daysUntil)} dia${Math.abs(daysUntil) > 1 ? 's' : ''} atrás`
    if (daysUntil === 0) return 'Hoje'
    if (daysUntil === 1) return 'Amanhã'
    return `Em ${daysUntil} dias`
  }

  const getChannelIcon = (channel: Reminder['channels'][0]) => {
    switch (channel) {
      case 'app': return <Smartphone className="h-3 w-3" />
      case 'whatsapp': return <MessageCircle className="h-3 w-3" />
      case 'email': return <MessageCircle className="h-3 w-3" />
      case 'sms': return <MessageCircle className="h-3 w-3" />
    }
  }

  const handleMarkAsRead = (reminderId: string, e: React.MouseEvent) => {
    e.stopPropagation()
    setReminders(prev => prev.map(r =>
      r.id === reminderId ? { ...r, isRead: true } : r
    ))
  }

  const handleMarkAsCompleted = (reminderId: string, e: React.MouseEvent) => {
    e.stopPropagation()
    setReminders(prev => prev.map(r =>
      r.id === reminderId ? { ...r, isCompleted: true } : r
    ))
  }

  const handleActionClick = (reminder: Reminder, e: React.MouseEvent) => {
    e.stopPropagation()
    if (reminder.actionUrl) {
      window.open(reminder.actionUrl, '_blank')
    }
  }

  const formatScheduledDate = (date: Date) => {
    return date.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: 'long',
      year: 'numeric'
    })
  }

  if (compact && upcomingReminders.length === 0) {
    return null
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      {!compact && (
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            <h3 className="font-semibold">Seus Lembretes</h3>
            {unreadReminders.length > 0 && (
              <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                {unreadReminders.length} novo{unreadReminders.length > 1 ? 's' : ''}
              </Badge>
            )}
          </div>

          {showSettings && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowSettingsModal(true)}
            >
              <Settings className="h-4 w-4" />
            </Button>
          )}
        </div>
      )}

      {/* Lista de Lembretes */}
      <div className="space-y-3">
        <AnimatePresence>
          {upcomingReminders.map((reminder, index) => (
            <motion.div
              key={reminder.id}
              className={cn(
                "bg-card border rounded-lg p-4 cursor-pointer transition-all hover:shadow-md",
                !reminder.isRead && "border-blue-200 bg-blue-50",
                reminder.isCompleted && "opacity-50"
              )}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ delay: index * 0.1 }}
              onClick={() => setSelectedReminder(reminder)}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-3 flex-1">
                  {/* Icon */}
                  <div className={cn(
                    "h-10 w-10 rounded-full flex items-center justify-center",
                    reminder.urgency === 'urgent' && "bg-red-100 text-red-600",
                    reminder.urgency === 'high' && "bg-orange-100 text-orange-600",
                    reminder.urgency === 'medium' && "bg-yellow-100 text-yellow-600",
                    reminder.urgency === 'low' && "bg-blue-100 text-blue-600"
                  )}>
                    {reminder.icon}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-medium text-sm">{reminder.title}</h4>
                      {!reminder.isRead && (
                        <div className="h-2 w-2 bg-blue-600 rounded-full" />
                      )}
                    </div>

                    <p className="text-xs text-gray-600 mb-2 line-clamp-2">
                      {reminder.description}
                    </p>

                    {/* Metadata */}
                    <div className="flex items-center gap-3 text-xs text-gray-500">
                      <div className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        <span>{formatScheduledDate(reminder.scheduledDate)}</span>
                      </div>

                      <div className={cn("font-medium", getDaysUntilColor(reminder.daysUntil))}>
                        {getDaysUntilText(reminder.daysUntil)}
                      </div>

                      {/* Canais */}
                      <div className="flex items-center gap-1">
                        {reminder.channels.slice(0, 2).map((channel, i) => (
                          <div key={i} className="opacity-60">
                            {getChannelIcon(channel)}
                          </div>
                        ))}
                        {reminder.channels.length > 2 && (
                          <span className="opacity-60">+{reminder.channels.length - 2}</span>
                        )}
                      </div>
                    </div>

                    {/* Additional Info */}
                    {reminder.metadata && (
                      <div className="mt-2 text-xs text-gray-600">
                        {reminder.metadata.appointmentTime && (
                          <div>Horário: {reminder.metadata.appointmentTime}</div>
                        )}
                        {reminder.metadata.doctorName && (
                          <div>Médico: {reminder.metadata.doctorName}</div>
                        )}
                        {reminder.metadata.amount && (
                          <div>Valor: R$ {reminder.metadata.amount.toFixed(2)}</div>
                        )}
                        {reminder.metadata.trackingNumber && (
                          <div>Rastreamento: {reminder.metadata.trackingNumber}</div>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2">
                  {!reminder.isRead && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 w-8 p-0"
                      onClick={(e) => handleMarkAsRead(reminder.id, e)}
                    >
                      <CheckCircle className="h-4 w-4" />
                    </Button>
                  )}

                  {reminder.actionLabel && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={(e) => handleActionClick(reminder, e)}
                    >
                      {reminder.actionLabel}
                    </Button>
                  )}
                </div>
              </div>

              {/* Urgency Badge */}
              <div className="mt-3">
                <Badge className={cn("text-xs", getUrgencyColor(reminder.urgency))}>
                  {reminder.urgency === 'urgent' && 'Urgente'}
                  {reminder.urgency === 'high' && 'Alta Prioridade'}
                  {reminder.urgency === 'medium' && 'Média Prioridade'}
                  {reminder.urgency === 'low' && 'Baixa Prioridade'}
                </Badge>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {upcomingReminders.length === 0 && !compact && (
        <div className="text-center py-8">
          <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
          <p className="text-gray-600">Nenhum lembrete no momento</p>
          <p className="text-sm text-gray-500">Você receberá notificações quando houver eventos próximos</p>
        </div>
      )}

      {/* View All Link */}
      {!compact && reminders.length > maxItems && (
        <div className="text-center">
          <Button variant="ghost" size="sm" className="text-blue-600">
            Ver todos os lembretes ({reminders.length})
            <ChevronRight className="h-4 w-4 ml-1" />
          </Button>
        </div>
      )}

      {/* Modal de Detalhes */}
      <AnimatePresence>
        {selectedReminder && (
          <motion.div
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setSelectedReminder(null)}
          >
            <motion.div
              className="bg-white rounded-lg max-w-md w-full"
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className={cn(
                      "h-12 w-12 rounded-full flex items-center justify-center",
                      selectedReminder.urgency === 'urgent' && "bg-red-100 text-red-600",
                      selectedReminder.urgency === 'high' && "bg-orange-100 text-orange-600",
                      selectedReminder.urgency === 'medium' && "bg-yellow-100 text-yellow-600",
                      selectedReminder.urgency === 'low' && "bg-blue-100 text-blue-600"
                    )}>
                      {selectedReminder.icon}
                    </div>
                    <div>
                      <h3 className="font-semibold">{selectedReminder.title}</h3>
                      <Badge className={cn("text-xs mt-1", getUrgencyColor(selectedReminder.urgency))}>
                        {selectedReminder.urgency === 'urgent' && 'Urgente'}
                        {selectedReminder.urgency === 'high' && 'Alta Prioridade'}
                        {selectedReminder.urgency === 'medium' && 'Média Prioridade'}
                        {selectedReminder.urgency === 'low' && 'Baixa Prioridade'}
                      </Badge>
                    </div>
                  </div>

                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setSelectedReminder(null)}
                  >
                    <X className="h-5 w-5" />
                  </Button>
                </div>

                <p className="text-gray-700 mb-4">{selectedReminder.description}</p>

                <div className="space-y-3 mb-6">
                  <div className="flex items-center gap-2 text-sm">
                    <Calendar className="h-4 w-4 text-gray-500" />
                    <span>{formatScheduledDate(selectedReminder.scheduledDate)}</span>
                    <span className={cn("font-medium", getDaysUntilColor(selectedReminder.daysUntil))}>
                      ({getDaysUntilText(selectedReminder.daysUntil)})
                    </span>
                  </div>

                  <div className="flex items-center gap-2 text-sm">
                    <Bell className="h-4 w-4 text-gray-500" />
                    <span>Notificações via: </span>
                    <div className="flex gap-1">
                      {selectedReminder.channels.map((channel, i) => (
                        <Badge key={i} variant="outline" className="text-xs">
                          {channel === 'app' && 'App'}
                          {channel === 'whatsapp' && 'WhatsApp'}
                          {channel === 'email' && 'Email'}
                          {channel === 'sms' && 'SMS'}
                        </Badge>
                      ))}
                    </div>
                  </div>

                  {selectedReminder.metadata && Object.entries(selectedReminder.metadata).map(([key, value]) => (
                    <div key={key} className="flex items-center gap-2 text-sm">
                      <Info className="h-4 w-4 text-gray-500" />
                      <span>
                        {key === 'appointmentTime' && `Horário: ${value}`}
                        {key === 'doctorName' && `Médico: ${value}`}
                        {key === 'amount' && `Valor: R$ ${Number(value).toFixed(2)}`}
                        {key === 'trackingNumber' && `Rastreamento: ${value}`}
                        {key === 'prescriptionExpiry' && `Expira: ${new Date(value as string).toLocaleDateString('pt-BR')}`}
                      </span>
                    </div>
                  ))}
                </div>

                <div className="flex gap-3">
                  <Button
                    variant="outline"
                    className="flex-1"
                    onClick={() => setSelectedReminder(null)}
                  >
                    Fechar
                  </Button>

                  {!selectedReminder.isRead && (
                    <Button
                      variant="outline"
                      onClick={() => {
                        handleMarkAsRead(selectedReminder.id, new MouseEvent('click') as any)
                        setSelectedReminder(null)
                      }}
                    >
                      <CheckCircle className="h-4 w-4 mr-2" />
                      Marcar como lida
                    </Button>
                  )}

                  {selectedReminder.actionLabel && selectedReminder.actionUrl && (
                    <Button
                      onClick={() => {
                        handleActionClick(selectedReminder, new MouseEvent('click') as any)
                        setSelectedReminder(null)
                      }}
                    >
                      {selectedReminder.actionLabel}
                    </Button>
                  )}
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Settings Modal */}
      <AnimatePresence>
        {showSettingsModal && (
          <motion.div
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowSettingsModal(false)}
          >
            <motion.div
              className="bg-white rounded-lg max-w-md w-full"
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold">Configurações de Notificação</h3>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowSettingsModal(false)}
                  >
                    <X className="h-5 w-5" />
                  </Button>
                </div>

                <div className="space-y-4">
                  <div className="space-y-3">
                    <h4 className="font-medium text-sm">Canais de Notificação</h4>

                    <label className="flex items-center justify-between">
                      <span className="text-sm">Notificações no App</span>
                      <input
                        type="checkbox"
                        checked={notificationPreferences.app}
                        onChange={(e) => setNotificationPreferences(prev => ({
                          ...prev,
                          app: e.target.checked
                        }))}
                        className="rounded"
                      />
                    </label>

                    <label className="flex items-center justify-between">
                      <span className="text-sm">WhatsApp</span>
                      <input
                        type="checkbox"
                        checked={notificationPreferences.whatsapp}
                        onChange={(e) => setNotificationPreferences(prev => ({
                          ...prev,
                          whatsapp: e.target.checked
                        }))}
                        className="rounded"
                      />
                    </label>

                    <label className="flex items-center justify-between">
                      <span className="text-sm">Email</span>
                      <input
                        type="checkbox"
                        checked={notificationPreferences.email}
                        onChange={(e) => setNotificationPreferences(prev => ({
                          ...prev,
                          email: e.target.checked
                        }))}
                        className="rounded"
                      />
                    </label>

                    <label className="flex items-center justify-between">
                      <span className="text-sm">SMS</span>
                      <input
                        type="checkbox"
                        checked={notificationPreferences.sms}
                        onChange={(e) => setNotificationPreferences(prev => ({
                          ...prev,
                          sms: e.target.checked
                        }))}
                        className="rounded"
                      />
                    </label>
                  </div>

                  <div className="space-y-3">
                    <h4 className="font-medium text-sm">Antecedência de Lembretes</h4>

                    <select
                      value={notificationPreferences.advanceNotice}
                      onChange={(e) => setNotificationPreferences(prev => ({
                        ...prev,
                        advanceNotice: parseInt(e.target.value)
                      }))}
                      className="w-full p-2 border rounded-md"
                    >
                      <option value={1}>1 dia antes</option>
                      <option value={3}>3 dias antes</option>
                      <option value={7}>7 dias antes</option>
                      <option value={14}>14 dias antes</option>
                      <option value={30}>30 dias antes</option>
                    </select>
                  </div>
                </div>

                <div className="flex gap-3 mt-6">
                  <Button
                    variant="outline"
                    className="flex-1"
                    onClick={() => setShowSettingsModal(false)}
                  >
                    Cancelar
                  </Button>
                  <Button
                    onClick={() => setShowSettingsModal(false)}
                  >
                    Salvar
                  </Button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}