/**
 * Painel de Métricas Gerais da Calculadora de Preços
 * Exibe KPIs e indicadores de performance em tempo real
 */

'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  Target,
  Users,
  Package,
  AlertTriangle,
  CheckCircle,
  ArrowUpRight,
  ArrowDownRight,
  BarChart3,
  PieChart
} from 'lucide-react'

import {
  PlanoAssinatura,
  ConfigPainelCustos,
  MetricasComparativas
} from '@/types/pricing-calculator'
import {
  formatarMoeda,
  formatarPercentual,
  gerarMetricasComparativas,
  getCorIndicadorMargem
} from '@/lib/pricing-calculator'

interface MetricsOverviewProps {
  planos: PlanoAssinatura[]
  configCustos: ConfigPainelCustos
  loading: boolean
}

interface KPIData {
  label: string
  value: string
  change?: number
  changeLabel?: string
  icon: React.ReactNode
  trend?: 'up' | 'down' | 'neutral'
  color?: string
}

export function MetricsOverview({ planos, configCustos, loading }: MetricsOverviewProps) {
  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[...Array(8)].map((_, i) => (
          <Card key={i}>
            <CardContent className="p-6">
              <div className="animate-pulse">
                <div className="h-4 bg-muted rounded w-3/4 mb-2"></div>
                <div className="h-8 bg-muted rounded w-1/2"></div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  // Calcular métricas
  const planosAtivos = planos.filter(p => p.ativo)
  const metricas = planosAtivos.map(plano => gerarMetricasComparativas(plano, configCustos.descontos))

  // KPIs Principais
  const kpis: KPIData[] = [
    {
      label: 'Receita Mensal Total',
      value: formatarMoeda(metricas.reduce((acc, m) => acc + m.precoMensal, 0) * 100), // simulando 100 assinaturas
      change: 12.5,
      changeLabel: 'vs. mês anterior',
      icon: <DollarSign className="h-5 w-5" />,
      trend: 'up',
      color: 'text-green-600'
    },
    {
      label: 'Planos Ativos',
      value: `${planosAtivos.length} / ${planos.length}`,
      change: planosAtivos.length > 0 ? ((planosAtivos.length / planos.length) * 100) : 0,
      changeLabel: 'taxa de ativação',
      icon: <Package className="h-5 w-5" />,
      trend: 'neutral',
      color: 'text-blue-600'
    },
    {
      label: 'Margem Média',
      value: formatarPercentual(
        metricas.reduce((acc, m) => acc + m.margemPercentual, 0) / (metricas.length || 1)
      ),
      change: 3.2,
      changeLabel: 'vs. mês anterior',
      icon: <Target className="h-5 w-5" />,
      trend: 'up',
      color: 'text-purple-600'
    },
    {
      label: 'ROI Médio',
      value: formatarPercentual(
        metricas.reduce((acc, m) => acc + m.roi, 0) / (metricas.length || 1)
      ),
      icon: <BarChart3 className="h-5 w-5" />,
      trend: 'neutral',
      color: 'text-orange-600'
    }
  ]

  // Métricas por categoria
  const metricasPorCategoria = planosAtivos.reduce((acc, plano) => {
    if (!acc[plano.categoria]) {
      acc[plano.categoria] = {
        count: 0,
        precoMedio: 0,
        margemMedia: 0,
        receitaTotal: 0
      }
    }
    acc[plano.categoria].count++
    acc[plano.categoria].precoMedio += plano.precoBase
    acc[plano.categoria].receitaTotal += plano.precoBase * 100 // simulando 100 assinaturas

    const planoMetricas = gerarMetricasComparativas(plano, configCustos.descontos)
    acc[plano.categoria].margemMedia += planoMetricas.margemPercentual

    return acc
  }, {} as Record<string, any>)

  // Calcular médias
  Object.keys(metricasPorCategoria).forEach(categoria => {
    const dados = metricasPorCategoria[categoria]
    dados.precoMedio = dados.precoMedio / dados.count
    dados.margemMedia = dados.margemMedia / dados.count
  })

  // Análise de performance
  const performanceAnalysis = {
    melhoresMargens: metricas
      .sort((a, b) => b.margemPercentual - a.margemPercentual)
      .slice(0, 3)
      .map(m => ({ nome: 'Plano', margem: m.margemPercentual })),
    pioresMargens: metricas
      .sort((a, b) => a.margemPercentual - b.margemPercentual)
      .slice(0, 3)
      .map(m => ({ nome: 'Plano', margem: m.margemPercentual })),
    maiorReceita: metricas
      .sort((a, b) => b.precoAnual - a.precoAnual)
      .slice(0, 3)
      .map(m => ({ nome: 'Plano', receita: m.precoAnual }))
  }

  // Status da saúde financeira
  const healthStatus = {
    overall: 'healthy', // 'healthy', 'warning', 'critical'
    issues: [],
    recommendations: []
  }

  // Verificar problemas
  const margemMedia = metricas.reduce((acc, m) => acc + m.margemPercentual, 0) / (metricas.length || 1)
  if (margemMedia < 15) {
    healthStatus.overall = 'critical'
    healthStatus.issues.push('Margem média abaixo de 15%')
    healthStatus.recommendations.push('Revisar preços ou reduzir custos')
  } else if (margemMedia < 30) {
    healthStatus.overall = 'warning'
    healthStatus.issues.push('Margem média entre 15% e 30%')
    healthStatus.recommendations.push('Considerar otimização de custos')
  }

  const planosInativos = planos.length - planosAtivos.length
  if (planosInativos > 0) {
    healthStatus.issues.push(`${planosInativos} plano(s) inativo(s)`)
    healthStatus.recommendations.push('Revisar planos inativos')
  }

  return (
    <div className="space-y-6">
      {/* KPIs Principais */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {kpis.map((kpi, index) => (
          <Card key={index}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium text-muted-foreground">{kpi.label}</p>
                <div className={kpi.color}>{kpi.icon}</div>
              </div>
              <div className="mt-2">
                <p className="text-3xl font-bold">{kpi.value}</p>
                {kpi.change && (
                  <div className="flex items-center mt-2">
                    {kpi.trend === 'up' ? (
                      <ArrowUpRight className="h-4 w-4 text-green-600 mr-1" />
                    ) : kpi.trend === 'down' ? (
                      <ArrowDownRight className="h-4 w-4 text-red-600 mr-1" />
                    ) : null}
                    <p className={`text-sm ${
                      kpi.trend === 'up' ? 'text-green-600' :
                      kpi.trend === 'down' ? 'text-red-600' : 'text-muted-foreground'
                    }`}>
                      {typeof kpi.change === 'number' ? formatarPercentual(kpi.change) : kpi.change}
                      <span className="text-muted-foreground ml-1">{kpi.changeLabel}</span>
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Saúde Financeira */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            {healthStatus.overall === 'healthy' ? (
              <CheckCircle className="h-5 w-5 text-green-600" />
            ) : healthStatus.overall === 'warning' ? (
              <AlertTriangle className="h-5 w-5 text-yellow-600" />
            ) : (
              <AlertTriangle className="h-5 w-5 text-red-600" />
            )}
            Saúde Financeira
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span>Status Geral</span>
              <Badge variant={
                healthStatus.overall === 'healthy' ? 'default' :
                healthStatus.overall === 'warning' ? 'secondary' : 'destructive'
              }>
                {healthStatus.overall === 'healthy' ? 'Saudável' :
                 healthStatus.overall === 'warning' ? 'Atenção' : 'Crítico'}
              </Badge>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Margem Média de Saúde</span>
                <span className="font-medium">{formatarPercentual(margemMedia)}</span>
              </div>
              <Progress
                value={Math.min(margemMedia, 100)}
                className="h-2"
              />
            </div>

            {healthStatus.issues.length > 0 && (
              <div className="space-y-2">
                <p className="text-sm font-medium text-muted-foreground">Issues Identificados</p>
                <ul className="text-sm space-y-1">
                  {healthStatus.issues.map((issue, index) => (
                    <li key={index} className="flex items-center gap-2">
                      <AlertTriangle className="h-3 w-3 text-yellow-600" />
                      {issue}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {healthStatus.recommendations.length > 0 && (
              <div className="space-y-2">
                <p className="text-sm font-medium text-muted-foreground">Recomendações</p>
                <ul className="text-sm space-y-1">
                  {healthStatus.recommendations.map((rec, index) => (
                    <li key={index} className="flex items-center gap-2">
                      <TrendingUp className="h-3 w-3 text-blue-600" />
                      {rec}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Métricas por Categoria */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {Object.entries(metricasPorCategoria).map(([categoria, dados]) => (
          <Card key={categoria}>
            <CardHeader>
              <CardTitle className="capitalize text-lg">
                {categoria === 'basico' ? 'Básico' :
                 categoria === 'padrao' ? 'Padrão' : 'Premium'}
              </CardTitle>
              <CardDescription>
                {dados.count} plano(s) ativo(s)
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground">Preço Médio</p>
                  <p className="font-medium">{formatarMoeda(dados.precoMedio)}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Margem Média</p>
                  <p className={`font-medium ${getCorIndicadorMargem(dados.margemMedia).split(' ')[0]}`}>
                    {formatarPercentual(dados.margemMedia)}
                  </p>
                </div>
              </div>

              <div>
                <p className="text-muted-foreground text-sm mb-1">Receita Projetada</p>
                <p className="font-medium">{formatarMoeda(dados.receitaTotal)}</p>
              </div>

              <div>
                <p className="text-muted-foreground text-sm mb-1">Participação</p>
                <Progress
                  value={(dados.receitaTotal / (metricasPorCategoria.basico?.receitaTotal || 0 +
                         metricasPorCategoria.padrao?.receitaTotal || 0 +
                         metricasPorCategoria.premium?.receitaTotal || 0)) * 100}
                  className="h-2"
                />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Insights e Análises */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Melhores Margens */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-green-600" />
              Maiores Margens
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {performanceAnalysis.melhoresMargens.map((plano, index) => (
                <div key={index} className="flex items-center justify-between">
                  <span className="text-sm">{plano.nome} #{index + 1}</span>
                  <Badge variant="secondary" className="text-green-600">
                    {formatarPercentual(plano.margem)}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Maior Receita */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <DollarSign className="h-5 w-5 text-blue-600" />
              Maior Receita
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {performanceAnalysis.maiorReceita.map((plano, index) => (
                <div key={index} className="flex items-center justify-between">
                  <span className="text-sm">{plano.nome}</span>
                  <span className="text-sm font-medium">
                    {formatarMoeda(plano.receita)}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Oportunidades */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Target className="h-5 w-5 text-purple-600" />
              Oportunidades
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 text-sm">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-green-600 rounded-full"></div>
                <span>Planos com margem >30%</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-yellow-600 rounded-full"></div>
                <span>Revisar planos com margem <15%</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                <span>Otimizar custos operacionais</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-purple-600 rounded-full"></div>
                <span>Expandir planos anuais</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}