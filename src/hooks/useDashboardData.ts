'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { DashboardMetrics, RevenueData, CustomerGrowthData } from '@/types/admin'
import { PeriodFilterOptions } from '@/components/admin/ui/PeriodFilter'

interface DashboardData {
  metrics: DashboardMetrics | null
  revenueData: RevenueData[]
  customerGrowthData: CustomerGrowthData[]
  recentActivity: any[]
  isLoading: boolean
  error: string | null
  lastUpdated: Date | null
}

interface UseDashboardDataOptions {
  autoRefresh?: boolean
  refreshInterval?: number
  retryAttempts?: number
  retryDelay?: number
}

const DEFAULT_OPTIONS: UseDashboardDataOptions = {
  autoRefresh: true,
  refreshInterval: 30000, // 30 segundos
  retryAttempts: 3,
  retryDelay: 1000 // 1 segundo
}

export function useDashboardData(
  filters: PeriodFilterOptions = { preset: '30d' },
  options: UseDashboardDataOptions = {}
) {
  const mergedOptions = { ...DEFAULT_OPTIONS, ...options }
  const [data, setData] = useState<DashboardData>({
    metrics: null,
    revenueData: [],
    customerGrowthData: [],
    recentActivity: [],
    isLoading: false,
    error: null,
    lastUpdated: null
  })

  const abortControllerRef = useRef<AbortController | null>(null)
  const retryTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const refreshIntervalRef = useRef<NodeJS.Timeout | null>(null)

  // Construir URL com parâmetros
  const buildApiUrl = useCallback((endpoint: string, params: Record<string, any> = {}) => {
    const url = new URL(`/api/admin/dashboard/${endpoint}`, window.location.origin)

    // Adicionar parâmetros do filtro
    if (filters.preset && filters.preset !== 'custom') {
      url.searchParams.set('period', filters.preset)
    }

    if (filters.startDate && filters.endDate) {
      url.searchParams.set('startDate', filters.startDate.toISOString())
      url.searchParams.set('endDate', filters.endDate.toISOString())
    }

    if (filters.compareWith) {
      url.searchParams.set('compareWith', filters.compareWith)
    }

    // Adicionar parâmetros adicionais
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        url.searchParams.set(key, String(value))
      }
    })

    return url.toString()
  }, [filters])

  // Função genérica para fazer fetch com retry
  const fetchWithRetry = useCallback(async (
    url: string,
    attempt: number = 1
  ): Promise<any> => {
    try {
      const response = await fetch(url, {
        signal: abortControllerRef.current?.signal,
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache'
        }
      })

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('Não autorizado. Faça login novamente.')
        }
        if (response.status === 403) {
          throw new Error('Você não tem permissão para acessar estes dados.')
        }
        throw new Error(`Erro ${response.status}: ${response.statusText}`)
      }

      const result = await response.json()

      if (!result.success) {
        throw new Error(result.message || 'Erro na resposta da API')
      }

      return result.data
    } catch (error) {
      // Se for erro de aborto, não tentar novamente
      if (error instanceof Error && error.name === 'AbortError') {
        throw error
      }

      // Se ainda tiver tentativas restantes, tentar novamente
      if (attempt < mergedOptions.retryAttempts!) {
        console.warn(`Tentativa ${attempt} falhou, tentando novamente em ${mergedOptions.retryDelay}ms...`, error)

        await new Promise(resolve => {
          retryTimeoutRef.current = setTimeout(resolve, mergedOptions.retryDelay)
        })

        return fetchWithRetry(url, attempt + 1)
      }

      throw error
    }
  }, [mergedOptions.retryAttempts, mergedOptions.retryDelay])

  // Carregar métricas principais
  const loadMetrics = useCallback(async () => {
    try {
      const url = buildApiUrl('metrics')
      const metricsData = await fetchWithRetry(url)
      return metricsData
    } catch (error) {
      console.error('Error loading metrics:', error)
      throw error
    }
  }, [buildApiUrl, fetchWithRetry])

  // Carregar dados de receita
  const loadRevenueData = useCallback(async () => {
    try {
      const url = buildApiUrl('revenue', {
        groupBy: 'day'
      })
      const revenueData = await fetchWithRetry(url)
      return revenueData || []
    } catch (error) {
      console.error('Error loading revenue data:', error)
      throw error
    }
  }, [buildApiUrl, fetchWithRetry])

  // Carregar dados de crescimento de clientes
  const loadCustomerGrowthData = useCallback(async () => {
    try {
      const url = buildApiUrl('customer-growth', {
        groupBy: 'day'
      })
      const growthData = await fetchWithRetry(url)
      return growthData || []
    } catch (error) {
      console.error('Error loading customer growth data:', error)
      throw error
    }
  }, [buildApiUrl, fetchWithRetry])

  // Carregar atividades recentes
  const loadRecentActivity = useCallback(async () => {
    try {
      const url = buildApiUrl('recent-activity', {
        limit: 20
      })
      const activityData = await fetchWithRetry(url)
      return activityData || []
    } catch (error) {
      console.error('Error loading recent activity:', error)
      throw error
    }
  }, [buildApiUrl, fetchWithRetry])

  // Carregar todos os dados
  const loadAllData = useCallback(async (showLoading = true) => {
    // Cancelar requisições anteriores
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
    }

    // Limpar timeout de retry anterior
    if (retryTimeoutRef.current) {
      clearTimeout(retryTimeoutRef.current)
    }

    abortControllerRef.current = new AbortController()

    if (showLoading) {
      setData(prev => ({ ...prev, isLoading: true, error: null }))
    }

    try {
      // Carregar todos os dados em paralelo
      const [
        metrics,
        revenueData,
        customerGrowthData,
        recentActivity
      ] = await Promise.allSettled([
        loadMetrics(),
        loadRevenueData(),
        loadCustomerGrowthData(),
        loadRecentActivity()
      ])

      // Processar resultados
      const newDashboardData: DashboardData = {
        metrics: metrics.status === 'fulfilled' ? metrics.value : null,
        revenueData: revenueData.status === 'fulfilled' ? revenueData.value : [],
        customerGrowthData: customerGrowthData.status === 'fulfilled' ? customerGrowthData.value : [],
        recentActivity: recentActivity.status === 'fulfilled' ? recentActivity.value : [],
        isLoading: false,
        error: null,
        lastUpdated: new Date()
      }

      // Verificar se houve algum erro
      const errors = [
        metrics.status === 'rejected' ? metrics.reason : null,
        revenueData.status === 'rejected' ? revenueData.reason : null,
        customerGrowthData.status === 'rejected' ? customerGrowthData.reason : null,
        recentActivity.status === 'rejected' ? recentActivity.reason : null
      ].filter(Boolean)

      if (errors.length > 0) {
        console.warn('Alguns dados não puderam ser carregados:', errors)
        // Não definimos erro no estado principal para não quebrar o dashboard
        // Apenas logamos o aviso
      }

      setData(newDashboardData)
    } catch (error) {
      console.error('Error loading dashboard data:', error)
      setData(prev => ({
        ...prev,
        isLoading: false,
        error: error instanceof Error ? error.message : 'Erro ao carregar dados',
        lastUpdated: null
      }))
    } finally {
      abortControllerRef.current = null
    }
  }, [loadMetrics, loadRevenueData, loadCustomerGrowthData, loadRecentActivity])

  // Função de refresh manual
  const refresh = useCallback(() => {
    loadAllData(true)
  }, [loadAllData])

  // Função para limpar dados
  const clearData = useCallback(() => {
    setData({
      metrics: null,
      revenueData: [],
      customerGrowthData: [],
      recentActivity: [],
      isLoading: false,
      error: null,
      lastUpdated: null
    })
  }, [])

  // Configurar auto-refresh
  useEffect(() => {
    if (mergedOptions.autoRefresh && mergedOptions.refreshInterval && mergedOptions.refreshInterval > 0) {
      refreshIntervalRef.current = setInterval(() => {
        loadAllData(false) // Não mostrar loading no auto-refresh
      }, mergedOptions.refreshInterval)

      return () => {
        if (refreshIntervalRef.current) {
          clearInterval(refreshIntervalRef.current)
        }
      }
    }
  }, [mergedOptions.autoRefresh, mergedOptions.refreshInterval, loadAllData])

  // Carregar dados iniciais e quando os filtros mudarem
  useEffect(() => {
    loadAllData(true)
  }, [filters.preset, filters.startDate, filters.endDate, filters.compareWith, loadAllData])

  // Limpar recursos ao desmontar
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort()
      }
      if (retryTimeoutRef.current) {
        clearTimeout(retryTimeoutRef.current)
      }
      if (refreshIntervalRef.current) {
        clearInterval(refreshIntervalRef.current)
      }
    }
  }, [])

  return {
    ...data,
    refresh,
    clearData,
    isAutoRefreshEnabled: mergedOptions.autoRefresh,
    refreshInterval: mergedOptions.refreshInterval
  }
}

// Hook para exportar dados
export function useDashboardExport() {
  const [isExporting, setIsExporting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const exportData = useCallback(async (
    format: 'csv' | 'excel' | 'pdf',
    filters: PeriodFilterOptions,
    dataType: 'metrics' | 'revenue' | 'customers' | 'all' = 'all'
  ) => {
    setIsExporting(true)
    setError(null)

    try {
      const params = new URLSearchParams()

      // Adicionar filtros
      if (filters.preset && filters.preset !== 'custom') {
        params.set('period', filters.preset)
      }
      if (filters.startDate && filters.endDate) {
        params.set('startDate', filters.startDate.toISOString())
        params.set('endDate', filters.endDate.toISOString())
      }
      if (filters.compareWith) {
        params.set('compareWith', filters.compareWith)
      }

      params.set('format', format)
      params.set('dataType', dataType)

      const response = await fetch(`/api/admin/dashboard/export?${params.toString()}`)

      if (!response.ok) {
        throw new Error(`Erro ${response.status}: ${response.statusText}`)
      }

      // Baixar arquivo
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url

      // Gerar nome do arquivo
      const timestamp = new Date().toISOString().split('T')[0]
      const filename = `svlentes-dashboard-${dataType}-${timestamp}.${format}`
      a.download = filename

      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao exportar dados'
      setError(errorMessage)
      throw err
    } finally {
      setIsExporting(false)
    }
  }, [])

  return {
    exportData,
    isExporting,
    error,
    clearError: () => setError(null)
  }
}