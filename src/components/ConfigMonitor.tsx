'use client'

import React, { useState, useEffect } from 'react'
import { AlertCircle, CheckCircle, AlertTriangle, RefreshCw } from 'lucide-react'
import { configLoader } from '@/lib/resilient-config-loader'

interface ConfigMonitorProps {
  showDetails?: boolean
  className?: string
}

interface MonitorStats {
  healthy: boolean
  stats: {
    cacheSize: number
    circuitBreaker: {
      failures: number
      isOpen: boolean
      timeout: number
      lastFailure: number
    }
    lastConfigLoad?: string
    error?: string
  }
}

/**
 * Real-time configuration monitoring component
 * Displays system health, cache status, and circuit breaker state
 */
export function ConfigMonitor({ showDetails = false, className = '' }: ConfigMonitorProps) {
  const [stats, setStats] = useState<MonitorStats | null>(null)
  const [isVisible, setIsVisible] = useState(false)

  // Auto-refresh stats every 10 seconds
  useEffect(() => {
    const refreshStats = async () => {
      try {
        const healthStats = await configLoader.healthCheck()
        setStats(healthStats)
      } catch (error) {
        setStats({
          healthy: false,
          stats: {
            error: error instanceof Error ? error.message : 'Health check failed',
            cacheSize: 0,
            circuitBreaker: {
              failures: 0,
              isOpen: false,
              timeout: 30000,
              lastFailure: 0
            }
          }
        })
      }
    }

    // Initial load
    refreshStats()

    // Set up interval
    const interval = setInterval(refreshStats, 10000)

    return () => clearInterval(interval)
  }, [])

  // Auto-show on errors
  useEffect(() => {
    if (stats && !stats.healthy) {
      setIsVisible(true)
    }
  }, [stats])

  if (!stats || !isVisible) {
    // Hidden state - show only a small indicator
    return (
      <div className={`fixed top-4 right-4 z-50 ${className}`}>
        <button
          onClick={() => setIsVisible(true)}
          className="bg-white rounded-lg shadow-lg p-2 hover:shadow-xl transition-shadow"
          title="Monitor do Sistema de Configuração"
        >
          <div className="flex items-center gap-2">
            {stats?.healthy ? (
              <CheckCircle className="h-4 w-4 text-green-500" />
            ) : (
              <AlertCircle className="h-4 w-4 text-red-500" />
            )}
            <span className="text-xs text-gray-600">Config</span>
          </div>
        </button>
      </div>
    )
  }

  const getStatusColor = () => {
    if (stats.healthy) return 'bg-green-50 border-green-200 text-green-800'
    if (stats.stats.circuitBreaker?.isOpen) return 'bg-orange-50 border-orange-200 text-orange-800'
    return 'bg-red-50 border-red-200 text-red-800'
  }

  const getStatusIcon = () => {
    if (stats.healthy) return <CheckCircle className="h-5 w-5" />
    if (stats.stats.circuitBreaker?.isOpen) return <AlertTriangle className="h-5 w-5" />
    return <AlertCircle className="h-5 w-5" />
  }

  return (
    <div className={`fixed top-4 right-4 z-50 ${className}`}>
      <div className="bg-white rounded-lg shadow-xl border border-gray-200 p-4 min-w-80">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-gray-900">Monitor de Configuração</h3>
          <button
            onClick={() => setIsVisible(false)}
            className="text-gray-400 hover:text-gray-600"
          >
            ×
          </button>
        </div>

        {/* Status */}
        <div className={`flex items-center gap-3 p-3 rounded-lg border ${getStatusColor()}`}>
          {getStatusIcon()}
          <div className="flex-1">
            <div className="font-medium">
              {stats.healthy ? 'Sistema Saudável' : 'Problema Detectado'}
            </div>
            <div className="text-sm opacity-75">
              {stats.healthy
                ? 'Configuração carregando normalmente'
                : 'Erro no carregamento de configuração'
              }
            </div>
          </div>
          <button
            onClick={() => {
              // Manual refresh
              window.location.reload()
            }}
            className="p-1 hover:bg-gray-100 rounded"
            title="Recarregar página"
          >
            <RefreshCw className="h-4 w-4" />
          </button>
        </div>

        {/* Details */}
        {showDetails && (
          <div className="space-y-3 mt-4">
            {/* Circuit Breaker Status */}
            <div className="p-3 bg-gray-50 rounded-lg">
              <h4 className="font-medium text-sm text-gray-700 mb-2">Circuit Breaker</h4>
              <div className="space-y-1 text-xs">
                <div className="flex justify-between">
                  <span>Status:</span>
                    <span className={stats.stats.circuitBreaker?.isOpen ? 'text-orange-600' : 'text-green-600'}>
                      {stats.stats.circuitBreaker?.isOpen ? 'Aberto' : 'Fechado'}
                    </span>
                  </div>
                <div className="flex justify-between">
                  <span>Falhas:</span>
                  <span>{stats.stats.circuitBreaker?.failures || 0}</span>
                </div>
                <div className="flex justify-between">
                  <span>Timeout:</span>
                  <span>{(stats.stats.circuitBreaker?.timeout || 0) / 1000}s</span>
                </div>
              </div>
            </div>

            {/* Cache Status */}
            <div className="p-3 bg-gray-50 rounded-lg">
              <h4 className="font-medium text-sm text-gray-700 mb-2">Cache</h4>
              <div className="space-y-1 text-xs">
                <div className="flex justify-between">
                  <span>Tamanho:</span>
                  <span>{stats.stats.cacheSize || 0} itens</span>
                </div>
                <div className="flex justify-between">
                  <span>Último carregamento:</span>
                  <span>
                    {stats.stats.lastConfigLoad
                      ? new Date(stats.stats.lastConfigLoad).toLocaleTimeString()
                      : 'N/A'
                    }
                  </span>
                </div>
              </div>
            </div>

            {/* Error Details */}
            {stats.stats.error && (
              <div className="p-3 bg-red-50 rounded-lg">
                <h4 className="font-medium text-sm text-red-700 mb-1">Erro Detalhado</h4>
                <div className="text-xs text-red-600">
                  {stats.stats.error}
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-2 pt-2">
              <button
                onClick={() => {
                  configLoader.clearCache()
                  window.location.reload()
                }}
                className="flex-1 px-3 py-2 bg-blue-500 text-white text-sm rounded hover:bg-blue-600 transition-colors"
              >
                Limpar Cache e Recarregar
              </button>
              <button
                onClick={() => setIsVisible(false)}
                className="px-3 py-2 bg-gray-200 text-gray-700 text-sm rounded hover:bg-gray-300 transition-colors"
              >
                Fechar
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

/**
 * Simple status indicator for header/footer
 */
export function ConfigStatusIndicator({ className = '' }: { className?: string }) {
  const [healthy, setHealthy] = useState<boolean | null>(null)

  useEffect(() => {
    const checkHealth = async () => {
      try {
        const result = await configLoader.healthCheck()
        setHealthy(result.healthy)
      } catch {
        setHealthy(false)
      }
    }

    checkHealth()
    const interval = setInterval(checkHealth, 15000) // Check every 15 seconds

    return () => clearInterval(interval)
  }, [])

  if (healthy === null) return null

  return (
    <div className={`flex items-center gap-1 ${className}`}>
      {healthy ? (
        <CheckCircle className="h-4 w-4 text-green-500" title="Configuração OK" />
      ) : (
        <AlertCircle className="h-4 w-4 text-red-500" title="Erro na configuração" />
      )}
    </div>
  )
}

export default ConfigMonitor