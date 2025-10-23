'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Bell,
  Package,
  CreditCard,
  AlertCircle,
  CheckCircle,
  Info,
  X,
  ExternalLink
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu'
import { formatRelativeTime } from '@/lib/formatters'
import { cn } from '@/lib/utils'
import Link from 'next/link'

/**
 * Tipos de notificação disponíveis
 */
export type NotificationType = 'delivery' | 'payment' | 'info' | 'alert' | 'success'

/**
 * Interface para dados de notificação
 */
export interface Notification {
  id: string
  type: NotificationType
  title: string
  message: string
  timestamp: string | Date
  isRead: boolean
  link?: string
}

/**
 * Props do componente NotificationCenter
 */
interface NotificationCenterProps {
  /**
   * Lista de notificações
   */
  notifications?: Notification[]

  /**
   * Callback quando uma notificação é marcada como lida
   */
  onMarkAsRead?: (notificationId: string) => void

  /**
   * Callback quando todas as notificações são marcadas como lidas
   */
  onMarkAllAsRead?: () => void

  /**
   * Estado de carregamento
   */
  isLoading?: boolean

  /**
   * Classe CSS adicional
   */
  className?: string
}

/**
 * Retorna o ícone apropriado para cada tipo de notificação
 */
function getNotificationIcon(type: NotificationType) {
  const iconMap = {
    delivery: <Package className="h-4 w-4" />,
    payment: <CreditCard className="h-4 w-4" />,
    info: <Info className="h-4 w-4" />,
    alert: <AlertCircle className="h-4 w-4" />,
    success: <CheckCircle className="h-4 w-4" />
  }
  return iconMap[type]
}

/**
 * Retorna a cor apropriada para cada tipo de notificação
 */
function getNotificationColor(type: NotificationType) {
  const colorMap = {
    delivery: 'text-cyan-600 bg-cyan-50 dark:bg-cyan-950',
    payment: 'text-blue-600 bg-blue-50 dark:bg-blue-950',
    info: 'text-gray-600 bg-gray-50 dark:bg-gray-950',
    alert: 'text-amber-600 bg-amber-50 dark:bg-amber-950',
    success: 'text-green-600 bg-green-50 dark:bg-green-950'
  }
  return colorMap[type]
}

/**
 * Componente NotificationCenter
 * Dropdown de notificações com badge de contador e funcionalidade de marcar como lido
 */
export function NotificationCenter({
  notifications = [],
  onMarkAsRead,
  onMarkAllAsRead,
  isLoading = false,
  className
}: NotificationCenterProps) {
  const [open, setOpen] = useState(false)
  const [localNotifications, setLocalNotifications] = useState<Notification[]>(notifications)

  useEffect(() => {
    setLocalNotifications(notifications)
  }, [notifications])

  // Conta notificações não lidas
  const unreadCount = localNotifications.filter((n) => !n.isRead).length

  // Pega as últimas 5 notificações
  const recentNotifications = localNotifications.slice(0, 5)

  // Handler para marcar como lida
  const handleMarkAsRead = (notificationId: string) => {
    setLocalNotifications((prev) =>
      prev.map((n) => (n.id === notificationId ? { ...n, isRead: true } : n))
    )
    onMarkAsRead?.(notificationId)
  }

  // Handler para marcar todas como lidas
  const handleMarkAllAsRead = () => {
    setLocalNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })))
    onMarkAllAsRead?.()
  }

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className={cn('relative', className)}
          aria-label={`Notificações ${unreadCount > 0 ? `(${unreadCount} não lidas)` : ''}`}
        >
          <Bell className="h-5 w-5" />
          <AnimatePresence>
            {unreadCount > 0 && (
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                exit={{ scale: 0 }}
                className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-red-500 flex items-center justify-center"
              >
                <span className="text-[10px] font-bold text-white">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              </motion.div>
            )}
          </AnimatePresence>
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="w-80 max-h-[500px] overflow-y-auto">
        <DropdownMenuLabel className="flex items-center justify-between">
          <span className="font-semibold">Notificações</span>
          {unreadCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              className="h-auto p-0 text-xs text-cyan-600 hover:text-cyan-700"
              onClick={handleMarkAllAsRead}
            >
              Marcar todas como lidas
            </Button>
          )}
        </DropdownMenuLabel>

        <DropdownMenuSeparator />

        {isLoading ? (
          <div className="p-4 space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="animate-pulse">
                <div className="h-4 bg-muted rounded w-3/4 mb-2" />
                <div className="h-3 bg-muted rounded w-full" />
              </div>
            ))}
          </div>
        ) : recentNotifications.length === 0 ? (
          <div className="p-8 text-center">
            <Bell className="h-12 w-12 mx-auto mb-3 text-muted-foreground/50" />
            <p className="text-sm text-muted-foreground">Nenhuma notificação</p>
          </div>
        ) : (
          <div className="py-1">
            {recentNotifications.map((notification) => (
              <DropdownMenuItem
                key={notification.id}
                className={cn(
                  'p-3 cursor-pointer focus:bg-accent',
                  !notification.isRead && 'bg-cyan-50/50 dark:bg-cyan-950/20'
                )}
                onSelect={() => {
                  if (!notification.isRead) {
                    handleMarkAsRead(notification.id)
                  }
                  if (notification.link) {
                    setOpen(false)
                  }
                }}
              >
                <div className="flex gap-3 w-full">
                  <div
                    className={cn(
                      'flex-shrink-0 rounded-full p-2',
                      getNotificationColor(notification.type)
                    )}
                  >
                    {getNotificationIcon(notification.type)}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <p className="text-sm font-medium leading-tight">
                        {notification.title}
                      </p>
                      {!notification.isRead && (
                        <div className="flex-shrink-0 h-2 w-2 rounded-full bg-cyan-500" />
                      )}
                    </div>

                    <p className="text-xs text-muted-foreground line-clamp-2 mb-1">
                      {notification.message}
                    </p>

                    <div className="flex items-center justify-between mt-2">
                      <span className="text-[10px] text-muted-foreground">
                        {formatRelativeTime(notification.timestamp)}
                      </span>
                      {notification.link && (
                        <Link
                          href={notification.link}
                          className="text-[10px] text-cyan-600 hover:text-cyan-700 flex items-center gap-1"
                          onClick={(e) => e.stopPropagation()}
                        >
                          Ver detalhes
                          <ExternalLink className="h-3 w-3" />
                        </Link>
                      )}
                    </div>
                  </div>
                </div>
              </DropdownMenuItem>
            ))}
          </div>
        )}

        {recentNotifications.length > 0 && (
          <>
            <DropdownMenuSeparator />
            <div className="p-2">
              <Link href="/area-assinante/notificacoes" onClick={() => setOpen(false)}>
                <Button variant="ghost" className="w-full justify-center text-sm">
                  Ver todas as notificações
                  <ExternalLink className="ml-2 h-3 w-3" />
                </Button>
              </Link>
            </div>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
