/**
 * Contextual Quick Actions - Phase 2
 * Ações contextuais baseadas no estado da assinatura
 */

'use client'

import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { MessageCircle, Package, FileText, AlertCircle } from 'lucide-react'
import { useApiMonitoring } from '@/hooks/useApiMonitoring'

interface Action {
  id: string
  label: string
  description: string
  icon: string
  url: string
  variant: 'primary' | 'secondary' | 'success' | 'warning' | 'danger'
  priority: number
}

interface Alert {
  type: 'info' | 'warning' | 'error'
  message: string
  action?: { label: string; url: string }
}

interface Props {
  subscriptionId: string
}

export function ContextualQuickActions({ subscriptionId }: Props) {
  const [actions, setActions] = useState<Action[]>([])
  const [alerts, setAlerts] = useState<Alert[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const { monitoredFetch } = useApiMonitoring()

  useEffect(() => {
    const fetchActions = async () => {
      try {
        const data = await monitoredFetch(
          `/api/assinante/contextual-actions?subscriptionId=${subscriptionId}`,
          { method: 'GET' }
        )

        if (data.primaryActions) {
          setActions(data.primaryActions.slice(0, 4))
        }
        if (data.alerts) {
          setAlerts(data.alerts)
        }
        setError(null)
      } catch (err) {
        console.error('[ContextualQuickActions] Error:', err)
        setError('As ações rápidas estão temporariamente indisponíveis.')

        setActions([{
          id: 'whatsapp',
          label: 'Falar no WhatsApp',
          description: 'Suporte rápido',
          icon: 'MessageCircle',
          url: `/api/whatsapp-redirect?context=support&subscriptionId=${subscriptionId}`,
          variant: 'primary',
          priority: 1
        }])
      } finally {
        setLoading(false)
      }
    }

    fetchActions()

    const interval = setInterval(fetchActions, 5 * 60 * 1000)
    return () => clearInterval(interval)
  }, [subscriptionId, monitoredFetch])

  if (loading) {
    return (
      <Card className="p-6">
        <Skeleton className="h-6 w-32 mb-4" />
        <div className="grid grid-cols-2 gap-3">
          <Skeleton className="h-20" />
          <Skeleton className="h-20" />
        </div>
      </Card>
    )
  }

  const iconMap: Record<string, any> = {
    MessageCircle,
    Package,
    FileText,
    AlertCircle,
  }

  return (
    <div className="space-y-4">
      {alerts.map((alert, i) => (
        <Card key={i} className={`p-4 border-${alert.type === 'error' ? 'red' : 'amber'}-200`}>
          <p className="text-sm">{alert.message}</p>
        </Card>
      ))}

      <Card className="p-6">
        <h3 className="font-semibold mb-4">Ações Rápidas</h3>
        <div className="grid grid-cols-2 gap-3">
          {actions.map(action => {
            const Icon = iconMap[action.icon] || MessageCircle
            return (
              <Button
                key={action.id}
                variant={action.variant === 'danger' ? 'destructive' : 'outline'}
                className="h-auto py-3 flex flex-col items-start gap-1"
                asChild
              >
                <a href={action.url}>
                  <Icon className="w-4 h-4" />
                  <span className="text-sm font-medium">{action.label}</span>
                </a>
              </Button>
            )
          })}
        </div>
      </Card>
    </div>
  )
}
