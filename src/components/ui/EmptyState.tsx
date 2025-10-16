'use client'

import { ReactNode } from 'react'
import { Button } from '@/components/ui/Button'
import { cn } from '@/lib/utils'
import {
  Package,
  FileText,
  ShoppingCart,
  AlertCircle,
  Search,
  Inbox,
  Heart,
  Mail,
  CreditCard,
  MapPin
} from 'lucide-react'

interface EmptyStateProps {
  icon?: ReactNode
  title: string
  description: string
  action?: {
    label: string
    onClick: () => void
    variant?: 'primary' | 'secondary' | 'outline'
  }
  secondaryAction?: {
    label: string
    onClick: () => void
  }
  illustration?: 'subscription' | 'orders' | 'search' | 'error' | 'cart' | 'inbox' | 'payment' | 'address'
  className?: string
  size?: 'sm' | 'md' | 'lg'
}

const illustrationIcons = {
  subscription: Package,
  orders: FileText,
  search: Search,
  error: AlertCircle,
  cart: ShoppingCart,
  inbox: Inbox,
  payment: CreditCard,
  address: MapPin
}

const illustrationColors = {
  subscription: 'text-cyan-500 bg-cyan-50',
  orders: 'text-blue-500 bg-blue-50',
  search: 'text-purple-500 bg-purple-50',
  error: 'text-red-500 bg-red-50',
  cart: 'text-amber-500 bg-amber-50',
  inbox: 'text-gray-500 bg-gray-50',
  payment: 'text-green-500 bg-green-50',
  address: 'text-indigo-500 bg-indigo-50'
}

const sizeConfig = {
  sm: {
    container: 'py-8',
    icon: 'w-12 h-12',
    title: 'text-lg',
    description: 'text-sm'
  },
  md: {
    container: 'py-12',
    icon: 'w-16 h-16',
    title: 'text-xl',
    description: 'text-base'
  },
  lg: {
    container: 'py-16',
    icon: 'w-20 h-20',
    title: 'text-2xl',
    description: 'text-lg'
  }
}

/**
 * Empty State Component
 *
 * Displays friendly empty states with optional illustrations and actions.
 * Improves UX by guiding users on what to do next.
 */
export function EmptyState({
  icon,
  title,
  description,
  action,
  secondaryAction,
  illustration,
  className,
  size = 'md'
}: EmptyStateProps) {
  const Icon = illustration ? illustrationIcons[illustration] : null
  const iconColor = illustration ? illustrationColors[illustration] : 'text-gray-500 bg-gray-50'
  const sizes = sizeConfig[size]

  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center text-center',
        sizes.container,
        className
      )}
      role="status"
      aria-label="Conteúdo vazio"
    >
      {/* Icon/Illustration */}
      {(Icon || icon) && (
        <div
          className={cn(
            'rounded-full p-4 mb-4',
            iconColor,
            sizes.icon
          )}
        >
          {icon ? (
            icon
          ) : Icon ? (
            <Icon className="w-full h-full" strokeWidth={1.5} />
          ) : null}
        </div>
      )}

      {/* Title */}
      <h3 className={cn('font-semibold text-gray-900 mb-2', sizes.title)}>
        {title}
      </h3>

      {/* Description */}
      <p className={cn('text-gray-600 max-w-md mb-6', sizes.description)}>
        {description}
      </p>

      {/* Actions */}
      {(action || secondaryAction) && (
        <div className="flex flex-col sm:flex-row gap-3">
          {action && (
            <Button
              onClick={action.onClick}
              variant={action.variant || 'primary'}
              size={size === 'sm' ? 'sm' : 'md'}
            >
              {action.label}
            </Button>
          )}
          {secondaryAction && (
            <Button
              onClick={secondaryAction.onClick}
              variant="outline"
              size={size === 'sm' ? 'sm' : 'md'}
            >
              {secondaryAction.label}
            </Button>
          )}
        </div>
      )}
    </div>
  )
}

/**
 * Predefined Empty States for common scenarios
 */

export function EmptySubscription({
  onStartSubscription
}: {
  onStartSubscription: () => void
}) {
  return (
    <EmptyState
      illustration="subscription"
      title="Nenhuma assinatura ativa"
      description="Você ainda não possui uma assinatura de lentes de contato. Comece agora e receba suas lentes regularmente com desconto!"
      action={{
        label: 'Assinar Agora',
        onClick: onStartSubscription,
        variant: 'primary'
      }}
      size="lg"
    />
  )
}

export function EmptyOrders({
  onViewPlans
}: {
  onViewPlans?: () => void
}) {
  return (
    <EmptyState
      illustration="orders"
      title="Nenhum pedido encontrado"
      description="Você ainda não possui pedidos. Quando você criar uma assinatura ou fizer um pedido, ele aparecerá aqui."
      action={onViewPlans ? {
        label: 'Ver Planos',
        onClick: onViewPlans,
        variant: 'primary'
      } : undefined}
    />
  )
}

export function EmptySearchResults({
  searchTerm,
  onClear
}: {
  searchTerm?: string
  onClear: () => void
}) {
  return (
    <EmptyState
      illustration="search"
      title="Nenhum resultado encontrado"
      description={
        searchTerm
          ? `Não encontramos resultados para "${searchTerm}". Tente outros termos de busca.`
          : 'Não encontramos nenhum resultado. Tente ajustar sua busca.'
      }
      action={{
        label: 'Limpar Busca',
        onClick: onClear,
        variant: 'outline'
      }}
      size="md"
    />
  )
}

export function EmptyPaymentMethods({
  onAddPayment
}: {
  onAddPayment: () => void
}) {
  return (
    <EmptyState
      illustration="payment"
      title="Nenhum método de pagamento"
      description="Adicione um cartão de crédito ou configure outro método de pagamento para facilitar suas compras."
      action={{
        label: 'Adicionar Pagamento',
        onClick: onAddPayment,
        variant: 'primary'
      }}
    />
  )
}

export function EmptyAddresses({
  onAddAddress
}: {
  onAddAddress: () => void
}) {
  return (
    <EmptyState
      illustration="address"
      title="Nenhum endereço cadastrado"
      description="Adicione um endereço de entrega para receber suas lentes de contato."
      action={{
        label: 'Adicionar Endereço',
        onClick: onAddAddress,
        variant: 'primary'
      }}
    />
  )
}

export function ErrorState({
  title = 'Algo deu errado',
  description = 'Ocorreu um erro ao carregar os dados. Por favor, tente novamente.',
  onRetry
}: {
  title?: string
  description?: string
  onRetry: () => void
}) {
  return (
    <EmptyState
      illustration="error"
      title={title}
      description={description}
      action={{
        label: 'Tentar Novamente',
        onClick: onRetry,
        variant: 'primary'
      }}
    />
  )
}

export function MaintenanceState() {
  return (
    <EmptyState
      illustration="inbox"
      title="Em manutenção"
      description="Esta funcionalidade está temporariamente indisponível. Estamos trabalhando para restaurá-la em breve."
      size="lg"
    />
  )
}

export function ComingSoonState({
  feature
}: {
  feature: string
}) {
  return (
    <EmptyState
      icon={<Heart className="w-full h-full text-pink-500" />}
      title="Em breve!"
      description={`${feature} estará disponível em breve. Fique ligado!`}
      size="md"
    />
  )
}
