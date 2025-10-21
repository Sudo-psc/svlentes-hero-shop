'use client'
import React, { useState, useEffect } from 'react'
import { AlertTriangle, Shield, Eye, FileText, Download, CheckCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
interface LGPDAlert {
  id: string
  type: 'data_request' | 'consent_missing' | 'retention_warning' | 'access_log'
  title: string
  description: string
  urgency: 'low' | 'medium' | 'high' | 'critical'
  createdAt: Date
  action?: {
    label: string
    onClick: () => void
  }
}
export function LGDPAlertBanner() {
  const [alerts, setAlerts] = useState<LGPDAlert[]>([
    {
      id: '1',
      type: 'consent_missing',
      title: 'Consentimentos Pendentes',
      description: '3 pacientes precisam atualizar consentimento LGPD',
      urgency: 'high',
      createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 horas atrás
      action: {
        label: 'Gerenciar',
        onClick: () => console.log('Manage LGPD settings clicked')
      }
    },
    {
      id: '2',
      type: 'data_request',
      title: 'Solicitação de Acesso a Dados',
      description: 'João Silva solicitou acesso aos seus dados pessoais',
      urgency: 'medium',
      createdAt: new Date(Date.now() - 6 * 60 * 60 * 1000), // 6 horas atrás
      action: {
        label: 'Ver Solicitação',
        onClick: () => console.log('View data request clicked')
      }
    },
    {
      id: '3',
      type: 'retention_warning',
      title: 'Política de Retenção',
      description: '15 pacientes atingirão limite de retenção em 30 dias',
      urgency: 'low',
      createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000), // 1 dia atrás
      action: {
        label: 'Revisar',
        onClick: () => {
          console.log('Revisar alert clicked')
        }
      }
    }
  ])
  const [dismissed, setDismissed] = useState<string[]>([])
  const dismissAlert = (alertId: string) => {
    setDismissed(prev => [...prev, alertId])
  }
  const visibleAlerts = alerts.filter(alert => !dismissed.includes(alert.id))
  const getUrgencyColor = (urgency: LGPDAlert['urgency']) => {
    switch (urgency) {
      case 'critical': return 'bg-red-50 border-red-200 text-red-800'
      case 'high': return 'bg-orange-50 border-orange-200 text-orange-800'
      case 'medium': return 'bg-yellow-50 border-yellow-200 text-yellow-800'
      case 'low': return 'bg-blue-50 border-blue-200 text-blue-800'
    }
  }
  const getUrgencyIcon = (urgency: LGPDAlert['urgency']) => {
    switch (urgency) {
      case 'critical':
      case 'high': return <AlertTriangle className="h-4 w-4" />
      case 'medium': return <Shield className="h-4 w-4" />
      case 'low': return <FileText className="h-4 w-4" />
    }
  }
  const getTimeAgo = (date: Date) => {
    const diff = Date.now() - date.getTime()
    const hours = Math.floor(diff / (1000 * 60 * 60))
    const days = Math.floor(hours / 24)
    if (days > 0) return `${days} dia${days > 1 ? 's' : ''} atrás`
    if (hours > 0) return `${hours} hora${hours > 1 ? 's' : ''} atrás`
    return 'Agora'
  }
  if (visibleAlerts.length === 0) {
    return null
  }
  return (
    <div className="border-b border-border bg-muted/30">
      <div className="max-w-7xl mx-auto px-6 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-green-600" />
            <span className="text-sm font-medium text-green-800">
              LGPD Compliance:
            </span>
            <Badge variant="outline" className="border-green-300 text-green-700">
              {visibleAlerts.length} alerta{visibleAlerts.length > 1 ? 's' : ''}
            </Badge>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex gap-2">
              {visibleAlerts.slice(0, 2).map((alert) => (
                <div
                  key={alert.id}
                  className={cn(
                    "flex items-center gap-2 px-3 py-1 rounded-full border text-xs",
                    getUrgencyColor(alert.urgency)
                  )}
                >
                  {getUrgencyIcon(alert.urgency)}
                  <span className="font-medium">{alert.title}</span>
                  <span className="opacity-75">• {getTimeAgo(alert.createdAt)}</span>
                </div>
              ))}
            </div>
            <div className="flex items-center gap-2">
              {visibleAlerts.length > 2 && (
                <Button variant="ghost" size="sm" className="text-xs">
                  <Eye className="h-3 w-3 mr-1" />
                  +{visibleAlerts.length - 2} mais
                </Button>
              )}
              <Button variant="ghost" size="sm" className="text-xs">
                <Download className="h-3 w-3 mr-1" />
                Relatório LGPD
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="text-xs text-green-600"
                onClick={() => window.open('/admin/lgpd/dashboard', '_blank')}
              >
                <CheckCircle className="h-3 w-3 mr-1" />
                Gerenciar
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}