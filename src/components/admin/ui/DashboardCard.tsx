'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { cn } from '@/lib/utils'
import { LucideIcon } from 'lucide-react'
import { ReactNode } from 'react'

interface DashboardCardProps {
  title: string
  value: string | number
  description?: string
  icon?: LucideIcon
  trend?: {
    value: number
    isPositive: boolean
  }
  color?: 'revenue' | 'customers' | 'orders' | 'support' | 'growth' | 'warning'
  className?: string
  children?: ReactNode
  footer?: ReactNode
}

export function DashboardCard({
  title,
  value,
  description,
  icon: Icon,
  trend,
  color = 'revenue',
  className,
  children,
  footer,
}: DashboardCardProps) {
  const getColorClasses = () => {
    switch (color) {
      case 'revenue':
        return {
          icon: 'text-admin-metrics-revenue bg-admin-metrics-revenue/10',
          trend: 'text-admin-metrics-revenue',
          card: 'hover:border-admin-metrics-revenue/20',
        }
      case 'customers':
        return {
          icon: 'text-admin-metrics-customers bg-admin-metrics-customers/10',
          trend: 'text-admin-metrics-customers',
          card: 'hover:border-admin-metrics-customers/20',
        }
      case 'orders':
        return {
          icon: 'text-admin-metrics-orders bg-admin-metrics-orders/10',
          trend: 'text-admin-metrics-orders',
          card: 'hover:border-admin-metrics-orders/20',
        }
      case 'support':
        return {
          icon: 'text-admin-metrics-support bg-admin-metrics-support/10',
          trend: 'text-admin-metrics-support',
          card: 'hover:border-admin-metrics-support/20',
        }
      case 'growth':
        return {
          icon: 'text-admin-metrics-growth bg-admin-metrics-growth/10',
          trend: 'text-admin-metrics-growth',
          card: 'hover:border-admin-metrics-growth/20',
        }
      case 'warning':
        return {
          icon: 'text-admin-metrics-warning bg-admin-metrics-warning/10',
          trend: 'text-admin-metrics-warning',
          card: 'hover:border-admin-metrics-warning/20',
        }
      default:
        return {
          icon: 'text-primary bg-primary/10',
          trend: 'text-primary',
          card: 'hover:border-primary/20',
        }
    }
  }

  const colorClasses = getColorClasses()

  return (
    <Card className={cn(
      'relative overflow-hidden transition-all duration-200 hover:shadow-lg',
      colorClasses.card,
      className
    )}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {title}
        </CardTitle>
        {Icon && (
          <div className={cn('p-2 rounded-lg', colorClasses.icon)}>
            <Icon className="h-4 w-4" />
          </div>
        )}
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        {(description || trend) && (
          <div className="flex items-center justify-between mt-2">
            {description && (
              <p className="text-xs text-muted-foreground">
                {description}
              </p>
            )}
            {trend && (
              <div className={cn(
                'flex items-center text-xs font-medium',
                colorClasses.trend
              )}>
                <span className={trend.isPositive ? 'text-green-600' : 'text-red-600'}>
                  {trend.isPositive ? '+' : '-'}{Math.abs(trend.value)}%
                </span>
                <span className="text-muted-foreground ml-1">
                  vs mês anterior
                </span>
              </div>
            )}
          </div>
        )}
        {children}
      </CardContent>
      {footer && (
        <div className="px-6 pb-6 pt-0">
          {footer}
        </div>
      )}
    </Card>
  )
}

// Smaller version for compact layouts
export function DashboardCardCompact({
  title,
  value,
  icon: Icon,
  color = 'revenue',
  className,
}: Omit<DashboardCardProps, 'description' | 'trend' | 'children' | 'footer'>) {
  const getColorClasses = () => {
    switch (color) {
      case 'revenue':
        return {
          icon: 'text-admin-metrics-revenue bg-admin-metrics-revenue/10',
          card: 'hover:border-admin-metrics-revenue/20',
        }
      case 'customers':
        return {
          icon: 'text-admin-metrics-customers bg-admin-metrics-customers/10',
          card: 'hover:border-admin-metrics-customers/20',
        }
      case 'orders':
        return {
          icon: 'text-admin-metrics-orders bg-admin-metrics-orders/10',
          card: 'hover:border-admin-metrics-orders/20',
        }
      case 'support':
        return {
          icon: 'text-admin-metrics-support bg-admin-metrics-support/10',
          card: 'hover:border-admin-metrics-support/20',
        }
      case 'growth':
        return {
          icon: 'text-admin-metrics-growth bg-admin-metrics-growth/10',
          card: 'hover:border-admin-metrics-growth/20',
        }
      case 'warning':
        return {
          icon: 'text-admin-metrics-warning bg-admin-metrics-warning/10',
          card: 'hover:border-admin-metrics-warning/20',
        }
      default:
        return {
          icon: 'text-primary bg-primary/10',
          card: 'hover:border-primary/20',
        }
    }
  }

  const colorClasses = getColorClasses()

  return (
    <Card className={cn(
      'p-4 transition-all duration-200 hover:shadow-md',
      colorClasses.card,
      className
    )}>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs font-medium text-muted-foreground">{title}</p>
          <p className="text-lg font-semibold">{value}</p>
        </div>
        {Icon && (
          <div className={cn('p-2 rounded-lg', colorClasses.icon)}>
            <Icon className="h-4 w-4" />
          </div>
        )}
      </div>
    </Card>
  )
}