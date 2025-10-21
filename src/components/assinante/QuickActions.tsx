'use client'
import { useState } from 'react'
import { motion } from 'framer-motion'
import {
  Package,
  FileText,
  Settings,
  Calendar,
  MessageCircle,
  CreditCard,
  MapPin,
  RefreshCcw,
  Phone,
  HelpCircle,
  TrendingUp
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
interface QuickAction {
  id: string
  label: string
  description: string
  icon: React.ReactNode
  variant: 'default' | 'outline' | 'secondary'
  onClick: () => void
  isDisabled?: boolean
  badge?: string
  color?: string
}
interface QuickActionsProps {
  actions: QuickAction[]
  className?: string
}
export function QuickActions({ actions, className }: QuickActionsProps) {
  const [hoveredAction, setHoveredAction] = useState<string | null>(null)
  const containerVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.4,
        staggerChildren: 0.1
      }
    }
  }
  const itemVariants = {
    hidden: { opacity: 0, scale: 0.9 },
    visible: {
      opacity: 1,
      scale: 1,
      transition: {
        duration: 0.3,
        ease: 'easeOut'
      }
    }
  }
  return (
    <motion.div
      className={cn('space-y-4', className)}
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      <div className="flex items-center gap-2 mb-4">
        <div className="h-1 w-8 bg-cyan-600 rounded-full" />
        <h3 className="text-lg font-semibold text-gray-900">Ações Rápidas</h3>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {actions.map((action) => (
          <motion.div
            key={action.id}
            variants={itemVariants}
            whileHover={{ y: -2 }}
            whileTap={{ scale: 0.98 }}
            onHoverStart={() => setHoveredAction(action.id)}
            onHoverEnd={() => setHoveredAction(null)}
          >
            <Button
              variant={action.variant}
              size="lg"
              onClick={action.onClick}
              disabled={action.isDisabled}
              className={cn(
                'w-full h-auto p-4 relative overflow-hidden group',
                'transition-all duration-300 ease-in-out',
                'hover:shadow-lg hover:scale-[1.02]',
                'active:scale-[0.98]',
                action.color && action.color,
                hoveredAction === action.id && 'ring-2 ring-cyan-600/20'
              )}
            >
              {/* Background gradient on hover */}
              <div className="absolute inset-0 bg-gradient-to-r from-cyan-600/0 to-cyan-600/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              {/* Content */}
              <div className="relative z-10 flex flex-col items-center gap-3 text-center">
                {/* Icon with animation */}
                <motion.div
                  className="relative"
                  animate={{
                    rotate: hoveredAction === action.id ? [0, -5, 5, 0] : 0,
                    scale: hoveredAction === action.id ? 1.1 : 1
                  }}
                  transition={{
                    duration: 0.3,
                    ease: 'easeInOut'
                  }}
                >
                  {action.icon}
                </motion.div>
                {/* Badge */}
                {action.badge && (
                  <motion.span
                    className="absolute -top-1 -right-1 bg-red-500 text-white text-xs px-1.5 py-0.5 rounded-full"
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.2, type: 'spring' }}
                  >
                    {action.badge}
                  </motion.span>
                )}
                {/* Text */}
                <div className="flex-1">
                  <p className="font-medium text-sm leading-tight mb-1">
                    {action.label}
                  </p>
                  {action.description && (
                    <p className="text-xs opacity-70 line-clamp-2">
                      {action.description}
                    </p>
                  )}
                </div>
              </div>
              {/* Disabled overlay */}
              {action.isDisabled && (
                <div className="absolute inset-0 bg-gray-100/50 backdrop-blur-sm rounded-lg flex items-center justify-center">
                  <span className="text-xs text-gray-500">Indisponível</span>
                </div>
              )}
            </Button>
          </motion.div>
        ))}
      </div>
      {/* Floating action buttons for mobile */}
      <div className="lg:hidden fixed bottom-6 right-6 z-40 flex flex-col gap-3">
        <motion.div
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
        >
          <Button
            size="lg"
            className="w-14 h-14 rounded-full shadow-lg bg-cyan-600 hover:bg-cyan-700"
            onClick={() => window.open('https://wa.me/5533999898026', '_blank')}
          >
            <MessageCircle className="h-6 w-6" />
          </Button>
        </motion.div>
        <motion.div
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
        >
          <Button
            size="lg"
            variant="outline"
            className="w-14 h-14 rounded-full shadow-lg bg-white"
            onClick={() => window.open('tel:+5533986061427', '_blank')}
          >
            <Phone className="h-6 w-6" />
          </Button>
        </motion.div>
      </div>
    </motion.div>
  )
}
// Helper function to create common actions
export function createQuickActions({
  onOrdersClick,
  onInvoicesClick,
  onSettingsClick,
  onScheduleClick,
  onPaymentClick,
  onAddressClick,
  onSupportClick,
  onBenefitsClick,
  pendingOrders = 0,
  unreadMessages = 0
}: {
  onOrdersClick: () => void
  onInvoicesClick: () => void
  onSettingsClick: () => void
  onScheduleClick: () => void
  onPaymentClick: () => void
  onAddressClick: () => void
  onSupportClick: () => void
  onBenefitsClick: () => void
  pendingOrders?: number
  unreadMessages?: number
}): QuickAction[] {
  return [
    {
      id: 'orders',
      label: 'Meus Pedidos',
      description: 'Acompanhar entregas e histórico',
      icon: <Package className="h-6 w-6" />,
      variant: 'default',
      onClick: onOrdersClick,
      badge: pendingOrders > 0 ? pendingOrders.toString() : undefined
    },
    {
      id: 'invoices',
      label: 'Faturas',
      description: 'Baixar notas fiscais',
      icon: <FileText className="h-6 w-6" />,
      variant: 'outline',
      onClick: onInvoicesClick
    },
    {
      id: 'schedule',
      label: 'Agendar Consulta',
      description: 'Marcar consulta médica',
      icon: <Calendar className="h-6 w-6" />,
      variant: 'outline',
      onClick: onScheduleClick,
      color: 'bg-green-50 hover:bg-green-100 border-green-200 text-green-800'
    },
    {
      id: 'payment',
      label: 'Pagamento',
      description: 'Atualizar forma de pagamento',
      icon: <CreditCard className="h-6 w-6" />,
      variant: 'outline',
      onClick: onPaymentClick
    },
    {
      id: 'address',
      label: 'Endereço',
      description: 'Alterar local de entrega',
      icon: <MapPin className="h-6 w-6" />,
      variant: 'outline',
      onClick: onAddressClick
    },
    {
      id: 'benefits',
      label: 'Meus Benefícios',
      description: 'Ver vantagens do plano',
      icon: <TrendingUp className="h-6 w-6" />,
      variant: 'outline',
      onClick: onBenefitsClick,
      color: 'bg-purple-50 hover:bg-purple-100 border-purple-200 text-purple-800'
    },
    {
      id: 'support',
      label: 'Suporte',
      description: 'Falar com equipe',
      icon: <MessageCircle className="h-6 w-6" />,
      variant: 'outline',
      onClick: onSupportClick,
      badge: unreadMessages > 0 ? unreadMessages.toString() : undefined,
      color: 'bg-blue-50 hover:bg-blue-100 border-blue-200 text-blue-800'
    },
    {
      id: 'settings',
      label: 'Configurações',
      description: 'Gerenciar conta',
      icon: <Settings className="h-6 w-6" />,
      variant: 'secondary',
      onClick: onSettingsClick
    }
  ]
}