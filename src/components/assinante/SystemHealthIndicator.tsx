'use client'
import React, { useState, useEffect } from 'react'
import { systemMonitor, SystemHealth } from '@/lib/system-monitor'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Alert,
  AlertDescription
} from '@/components/ui/alert'
import {
  CheckCircle,
  AlertTriangle,
  XCircle,
  RefreshCw,
  Wifi,
  Database,
  Activity,
  Clock,
  HardDrive,
  Brain
} from 'lucide-react'
interface SystemHealthIndicatorProps {
  showDetails?: boolean
  className?: string
}
export function SystemHealthIndicator({ showDetails = false, className = '' }: SystemHealthIndicatorProps) {
  const [health, setHealth] = useState<SystemHealth | null>(null)
  const [expanded, setExpanded] = useState(false)
  useEffect(() => {
    // Obter status inicial
    setHealth(systemMonitor.getCurrentHealth())
    // Configurar listener para mudanças
    const handleHealthChange = (newHealth: SystemHealth) => {
      setHealth(newHealth)
    }
    systemMonitor.onHealthChange(handleHealthChange)
    return () => {
      systemMonitor.removeHealthChangeCallback(handleHealthChange)
    }
  }, [])
  const handleRefresh = async () => {
    // Forçar novo check de saúde
    const currentHealth = systemMonitor.getCurrentHealth()
    setHealth(currentHealth)
  }
  const getStatusIcon = () => {
    if (!health) return <RefreshCw className="w-4 h-4 animate-spin" />
    switch (health.status) {
      case 'healthy':
        return <CheckCircle className="w-4 h-4 text-green-600" />
      case 'degraded':
        return <AlertTriangle className="w-4 h-4 text-yellow-600" />
      case 'unhealthy':
        return <XCircle className="w-4 h-4 text-red-600" />
    }
  }
  const getStatusColor = () => {
    if (!health) return 'bg-gray-100 text-gray-800'
    switch (health.status) {
      case 'healthy':
        return 'bg-green-100 text-green-800'
      case 'degraded':
        return 'bg-yellow-100 text-yellow-800'
      case 'unhealthy':
        return 'bg-red-100 text-red-800'
    }
  }
  const getStatusText = () => {
    if (!health) return 'Verificando...'
    switch (health.status) {
      case 'healthy':
        return 'Sistema Saudável'
      case 'degraded':
        return 'Sistema Degradado'
      case 'unhealthy':
        return 'Sistema com Problemas'
    }
  }
  const formatResponseTime = (ms: number) => {
    if (ms < 1000) return `${ms}ms`
    return `${(ms / 1000).toFixed(1)}s`
  }
  const formatUptime = (ms: number) => {
    const seconds = Math.floor(ms / 1000)
    const minutes = Math.floor(seconds / 60)
    const hours = Math.floor(minutes / 60)
    const days = Math.floor(hours / 24)
    if (days > 0) return `${days}d ${hours % 24}h`
    if (hours > 0) return `${hours}h ${minutes % 60}m`
    if (minutes > 0) return `${minutes}m ${seconds % 60}s`
    return `${seconds}s`
  }
  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 B'
    const k = 1024
    const sizes = ['B', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i]
  }
  const getCheckIcon = (checkName: string) => {
    if (checkName.includes('api') || checkName.includes('/api/')) {
      return <Wifi className="w-4 h-4" />
    }
    if (checkName.includes('indexeddb')) {
      return <Database className="w-4 h-4" />
    }
    if (checkName.includes('memory')) {
      return <Brain className="w-4 h-4" />
    }
    if (checkName.includes('storage')) {
      return <HardDrive className="w-4 h-4" />
    }
    return <Activity className="w-4 h-4" />
  }
  return (
    <div className={`space-y-2 ${className}`}>
      {/* Indicador Principal */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {getStatusIcon()}
          <span className="text-sm font-medium">{getStatusText()}</span>
        </div>
        <div className="flex items-center gap-2">
          {health && (
            <span className="text-xs text-gray-500">
              Última verificação: {new Date(health.timestamp).toLocaleTimeString()}
            </span>
          )}
          <Button
            variant="ghost"
            size="sm"
            onClick={handleRefresh}
            className="h-6 w-6 p-0"
          >
            <RefreshCw className="w-3 h-3" />
          </Button>
        </div>
      </div>
      {/* Badge de Status */}
      <Badge className={getStatusColor()}>
        {getStatusText()}
      </Badge>
      {/* Detalhes Expandidos */}
      {showDetails && health && expanded && (
        <div className="space-y-4 mt-4">
          {/* Health Checks */}
          <div>
            <h4 className="text-sm font-semibold mb-2 flex items-center gap-2">
              <Activity className="w-4 h-4" />
              Verificações de Saúde
            </h4>
            <div className="space-y-2">
              {health.checks.map((check) => (
                <div
                  key={check.name}
                  className="flex items-center justify-between p-2 bg-gray-50 rounded"
                >
                  <div className="flex items-center gap-2">
                    {getCheckIcon(check.name)}
                    <span className="text-xs font-medium">{check.name}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`text-xs ${
                      check.status === 'pass'
                        ? 'text-green-600'
                        : check.status === 'warn'
                        ? 'text-yellow-600'
                        : 'text-red-600'
                    }`}>
                      {check.message}
                    </span>
                    <span className="text-xs text-gray-500">
                      {formatResponseTime(check.responseTime)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
          {/* Métricas do Sistema */}
          <div>
            <h4 className="text-sm font-semibold mb-2 flex items-center gap-2">
              <Activity className="w-4 h-4" />
              Métricas do Sistema
            </h4>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="p-2 bg-gray-50 rounded">
                <div className="font-medium">Memória</div>
                <div className="text-gray-600">
                  {Math.round(health.metrics.memoryUsage * 100)}%
                </div>
              </div>
              <div className="p-2 bg-gray-50 rounded">
                <div className="font-medium">Storage</div>
                <div className="text-gray-600">
                  {formatBytes(health.metrics.storageUsage)} / {formatBytes(health.metrics.storageQuota)}
                </div>
              </div>
              <div className="p-2 bg-gray-50 rounded">
                <div className="font-medium">Uptime</div>
                <div className="text-gray-600">
                  {formatUptime(health.metrics.uptime)}
                </div>
              </div>
              <div className="p-2 bg-gray-50 rounded">
                <div className="font-medium">Conexões</div>
                <div className="text-gray-600">
                  {health.metrics.activeConnections}
                </div>
              </div>
            </div>
          </div>
          {/* Alertas de Status */}
          {health.status !== 'healthy' && (
            <Alert
              variant={health.status === 'degraded' ? 'default' : 'destructive'}
            >
              <AlertDescription>
                {health.status === 'degraded'
                  ? 'O sistema está funcionando com algumas limitações. Alguns recursos podem não estar disponíveis.'
                  : 'O sistema está enfrentando problemas críticos. A equipe técnica foi notificada.'}
              </AlertDescription>
            </Alert>
          )}
          {/* Botão de Expandir/Retrair */}
          <Button
            variant="outline"
            size="sm"
            onClick={() => setExpanded(!expanded)}
            className="w-full"
          >
            {expanded ? 'Retrair Detalhes' : 'Ver Detalhes'}
          </Button>
        </div>
      )}
      {/* Botão para mostrar detalhes (quando não expandido) */}
      {showDetails && !expanded && (
        <Button
          variant="outline"
          size="sm"
          onClick={() => setExpanded(true)}
          className="w-full"
        >
          Ver Detalhes
        </Button>
      )}
    </div>
  )
}