'use client'

import React, { useState, useCallback } from 'react'
import { motion } from 'framer-motion'
import { DashboardCard } from '@/components/admin/ui/DashboardCard'
import { DashboardSkeleton } from '@/components/admin/ui/DashboardSkeleton'
import { DashboardError } from '@/components/admin/ui/DashboardError'
import { PeriodFilter, usePeriodFilter } from '@/components/admin/ui/PeriodFilter'
import { RecentActivityList } from '@/components/admin/ui/RecentActivityList'
import { RevenueChart, RevenueChartCompact } from '@/components/admin/charts/RevenueChart'
import { CustomerGrowthChart, CustomerGrowthChartCompact } from '@/components/admin/charts/CustomerGrowthChart'
import { ChurnRateChart, ChurnRateChartCompact } from '@/components/admin/charts/ChurnRateChart'
import { useDashboardData, useDashboardExport } from '@/hooks/useDashboardData'
import {
  Users,
  ShoppingBag,
  Package,
  CreditCard,
  HeadphonesIcon,
  TrendingUp,
  AlertTriangle,
  Activity,
  DollarSign,
  UserMinus
} from 'lucide-react'
import { useAdminAuth } from '@/components/admin/providers/AdminAuthProvider'
import { PeriodFilterOptions } from '@/components/admin/ui/PeriodFilter'
import { cn } from '@/lib/utils'

export default function AdminDashboard() {
  const { hasPermission } = useAdminAuth()

  // Filtros de período
  const { filters, updateFilters, getApiParams } = usePeriodFilter({ preset: '30d' })

  // Dados do dashboard
  const {
    metrics,
    revenueData,
    customerGrowthData,
    recentActivity,
    isLoading,
    error,
    lastUpdated,
    refresh
  } = useDashboardData(filters, {
    autoRefresh: true,
    refreshInterval: 30000 // 30 segundos
  })

  // Exportação de dados
  const { exportData, isExporting } = useDashboardExport()

  // Handlers
  const handlePeriodChange = useCallback((newFilters: PeriodFilterOptions) => {
    updateFilters(newFilters)
  }, [updateFilters])

  const handleExport = useCallback(async (format: 'csv' | 'excel' | 'pdf') => {
    try {
      await exportData(format, filters, 'all')
    } catch (error) {
      console.error('Export error:', error)
    }
  }, [exportData, filters])

  const handleActivityClick = useCallback((activity: any) => {
    // Navegar para detalhes da atividade
    console.log('Activity clicked:', activity)
  }, [])

  // Verificação de permissão
  if (!hasPermission('VIEW_DASHBOARD')) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <AlertTriangle className="h-12 w-12 text-yellow-500 mx-auto mb-4" />
          <h2 className="text-lg font-semibold">Acesso Negado</h2>
          <p className="text-muted-foreground">
            Você não tem permissão para visualizar o dashboard.
          </p>
        </div>
      </div>
    )
  }

  // Estados de carregamento e erro
  if (isLoading && !metrics) {
    return <DashboardSkeleton />
  }

  if (error && !metrics) {
    return (
      <DashboardError
        error={error}
        onRetry={refresh}
        variant="full"
      />
    )
  }

  // Métricas atuais (com fallback para valores mock)
  const currentMetrics = metrics?.overview || {
    totalCustomers: 0,
    activeSubscriptions: 0,
    monthlyRevenue: 0,
    monthlyGrowth: 0,
    newCustomers: 0,
    churnRate: 0,
  }

  return (
    <motion.div
      className="space-y-6"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground">
            Visão geral do sistema SVLentes
          </p>
        </div>

        {/* Filtros e ações */}
        <PeriodFilter
          value={filters}
          onChange={handlePeriodChange}
          onExport={handleExport}
          onRefresh={refresh}
          isRefreshing={isLoading}
          showExport={true}
          showComparison={true}
        />
      </div>

      {/* Erro parcial */}
      {error && metrics && (
        <DashboardError
          error={error}
          onRetry={refresh}
          variant="inline"
        />
      )}

      {/* Métricas principais */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3, delay: 0.1 }}
        >
          <DashboardCard
            title="Total de Clientes"
            value={currentMetrics.totalCustomers.toLocaleString('pt-BR')}
            description="Usuários cadastrados"
            icon={Users}
            color="customers"
            trend={{
              value: metrics?.overview?.monthlyGrowth || 12.5,
              isPositive: (metrics?.overview?.monthlyGrowth || 0) > 0,
            }}
          />
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3, delay: 0.2 }}
        >
          <DashboardCard
            title="Assinaturas Ativas"
            value={currentMetrics.activeSubscriptions.toLocaleString('pt-BR')}
            description="Assinaturas mensais"
            icon={ShoppingBag}
            color="growth"
            trend={{
              value: 8.2,
              isPositive: true,
            }}
          />
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3, delay: 0.3 }}
        >
          <DashboardCard
            title="Receita Mensal"
            value={new Intl.NumberFormat('pt-BR', {
              style: 'currency',
              currency: 'BRL',
            }).format(currentMetrics.monthlyRevenue)}
            description="Este mês"
            icon={CreditCard}
            color="revenue"
            trend={{
              value: currentMetrics.monthlyGrowth,
              isPositive: currentMetrics.monthlyGrowth > 0,
            }}
          />
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3, delay: 0.4 }}
        >
          <DashboardCard
            title="Taxa de Churn"
            value={`${currentMetrics.churnRate.toFixed(1)}%`}
            description="Cancelamentos este mês"
            icon={UserMinus}
            color="warning"
            trend={{
              value: 2.1,
              isPositive: false,
            }}
          />
        </motion.div>
      </div>

      {/* Segunda linha de métricas */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3, delay: 0.5 }}
        >
          <DashboardCard
            title="Pedidos Pendentes"
            value={metrics?.orders?.pending || 0}
            description="Aguardando processamento"
            icon={Package}
            color="orders"
          />
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3, delay: 0.6 }}
        >
          <DashboardCard
            title="Tickets Abertos"
            value={metrics?.support?.openTickets || 0}
            description="Suporte ao cliente"
            icon={HeadphonesIcon}
            color="support"
          />
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3, delay: 0.7 }}
        >
          <DashboardCard
            title="Novos Clientes"
            value={currentMetrics.newCustomers.toLocaleString('pt-BR')}
            description="Últimos 30 dias"
            icon={Users}
            color="customers"
            trend={{
              value: 15.3,
              isPositive: true,
            }}
          />
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3, delay: 0.8 }}
        >
          <DashboardCard
            title="Ticket Médio"
            value={new Intl.NumberFormat('pt-BR', {
              style: 'currency',
              currency: 'BRL',
            }).format(metrics?.orders?.averageOrderValue || currentMetrics.monthlyRevenue / Math.max(currentMetrics.activeSubscriptions, 1))}
            description="Valor médio por pedido"
            icon={TrendingUp}
            color="revenue"
            trend={{
              value: 5.8,
              isPositive: true,
            }}
          />
        </motion.div>
      </div>

      {/* Gráficos */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Gráfico de Receita - Principal */}
        <motion.div
          className="lg:col-span-2"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.9 }}
        >
          <RevenueChart
            data={revenueData}
            showArea={true}
            showComparison={!!filters.compareWith}
            previousPeriodData={filters.compareWith ? revenueData?.slice(0, -1) : undefined}
            height={350}
          />
        </motion.div>

        {/* Gráfico de Churn - Compacto */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 1.0 }}
        >
          <ChurnRateChart
            data={revenueData?.map(item => ({
              date: item.date,
              churnRate: Math.random() * 10, // TODO: Implementar dados reais de churn
              cancelledCount: Math.floor(Math.random() * 5),
              activeCount: Math.floor(Math.random() * 100) + 50
            })) || []}
            height={350}
            chartType="line"
            showBenchmark={true}
          />
        </motion.div>
      </div>

      {/* Segunda linha de gráficos e atividades */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Gráfico de Crescimento de Clientes */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 1.1 }}
        >
          <CustomerGrowthChart
            data={customerGrowthData}
            height={300}
            chartType="area"
            showChurn={true}
          />
        </motion.div>

        {/* Atividades Recentes */}
        <motion.div
          className="lg:col-span-2"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 1.2 }}
        >
          <RecentActivityList
            activities={recentActivity}
            maxItems={8}
            showFilters={true}
            refreshInterval={30000}
            onActivityClick={handleActivityClick}
            onRefresh={refresh}
          />
        </motion.div>
      </div>

      {/* Indicador de última atualização */}
      {lastUpdated && (
        <div className="flex items-center justify-center text-xs text-muted-foreground py-2">
          <Activity className="h-3 w-3 mr-1" />
          Última atualização: {lastUpdated.toLocaleString('pt-BR')}
          <span className="mx-2">•</span>
          Auto-refresh: 30 segundos
        </div>
      )}
    </motion.div>
  )
}