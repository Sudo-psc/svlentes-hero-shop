/**
 * Tabela Comparativa Interativa de Planos
 * Exibe métricas comparativas com ordenação, filtros e exportação
 */

'use client'

import { useState, useMemo } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import {
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Download,
  Filter,
  Search,
  Eye,
  TrendingUp,
  TrendingDown,
  Minus,
  DollarSign,
  Target,
  Star,
  Award
} from 'lucide-react'

import {
  PlanoAssinatura,
  ConfigPainelCustos,
  PlanCategory,
  BillingCycle,
  MetricasComparativas
} from '@/types/pricing-calculator'
import {
  formatarMoeda,
  formatarPercentual,
  gerarMetricasComparativas,
  exportarCSV
} from '@/lib/pricing-calculator'

interface ComparisonTableProps {
  planos: PlanoAssinatura[]
  configCustos: ConfigPainelCustos
  onExport: (format: 'csv' | 'pdf') => void
}

type SortField = 'nome' | 'preco' | 'margem' | 'economia' | 'roi'
type SortDirection = 'asc' | 'desc'
type FilterState = {
  categoria?: PlanCategory
  ciclo?: BillingCycle
  precoMin?: number
  precoMax?: number
  search?: string
}

export function ComparisonTable({ planos, configCustos, onExport }: ComparisonTableProps) {
  const [sortField, setSortField] = useState<SortField>('nome')
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc')
  const [filters, setFilters] = useState<FilterState>({})
  const [selectedColumns, setSelectedColumns] = useState<string[]>([
    'nome',
    'categoria',
    'ciclo',
    'precoMensal',
    'precoAnual',
    'margemPercentual',
    'economiaAnualValor',
    'beneficiosCount'
  ])

  // Gerar métricas para todos os planos
  const planosComMetricas = useMemo(() => {
    return planos.map(plano => ({
      ...plano,
      metricas: gerarMetricasComparativas(plano, configCustos.descontos)
    }))
  }, [planos, configCustos])

  // Aplicar filtros
  const planosFiltrados = useMemo(() => {
    return planosComMetricas.filter(plano => {
      // Filtro por categoria
      if (filters.categoria && plano.categoria !== filters.categoria) return false

      // Filtro por ciclo
      if (filters.ciclo && plano.ciclo !== filters.ciclo) return false

      // Filtro por faixa de preço
      if (filters.precoMin && plano.precoBase < filters.precoMin) return false
      if (filters.precoMax && plano.precoBase > filters.precoMax) return false

      // Filtro por busca
      if (filters.search) {
        const searchLower = filters.search.toLowerCase()
        return (
          plano.nome.toLowerCase().includes(searchLower) ||
          plano.categoria.toLowerCase().includes(searchLower) ||
          plano.ciclo.toLowerCase().includes(searchLower)
        )
      }

      return true
    })
  }, [planosComMetricas, filters])

  // Ordenar planos
  const planosOrdenados = useMemo(() => {
    const sorted = [...planosFiltrados].sort((a, b) => {
      let aValue: number | string
      let bValue: number | string

      switch (sortField) {
        case 'nome':
          aValue = a.nome
          bValue = b.nome
          break
        case 'preco':
          aValue = a.metricas.precoMensal
          bValue = b.metricas.precoMensal
          break
        case 'margem':
          aValue = a.metricas.margemPercentual
          bValue = b.metricas.margemPercentual
          break
        case 'economia':
          aValue = a.metricas.economiaAnualValor
          bValue = b.metricas.economiaAnualValor
          break
        case 'roi':
          aValue = a.metricas.roi
          bValue = b.metricas.roi
          break
        default:
          aValue = a.nome
          bValue = b.nome
      }

      if (typeof aValue === 'string') {
        return sortDirection === 'asc'
          ? aValue.localeCompare(bValue as string)
          : (bValue as string).localeCompare(aValue)
      } else {
        return sortDirection === 'asc' ? aValue - (bValue as number) : (bValue as number) - aValue
      }
    })

    return sorted
  }, [planosFiltrados, sortField, sortDirection])

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')
    } else {
      setSortField(field)
      setSortDirection('asc')
    }
  }

  const handleExport = () => {
    // Preparar dados para exportação
    const exportData = planosOrdenados.map(plano => {
      const row: any = {}
      selectedColumns.forEach(col => {
        switch (col) {
          case 'nome':
            row['Plano'] = plano.nome
            break
          case 'categoria':
            row['Categoria'] = plano.categoria.toUpperCase()
            break
          case 'ciclo':
            row['Ciclo'] = plano.ciclo === 'mensal' ? 'Mensal' : 'Anual'
            break
          case 'precoMensal':
            row['Preço Mensal'] = plano.metricas.precoMensal
            break
          case 'precoAnual':
            row['Preço Anual'] = plano.metricas.precoAnual
            break
          case 'margemPercentual':
            row['Margem de Lucro (%)'] = plano.metricas.margemPercentual
            break
          case 'margemValor':
            row['Margem de Lucro (R$)'] = plano.metricas.margemValor
            break
          case 'economiaAnualValor':
            row['Economia Anual (R$)'] = plano.metricas.economiaAnualValor
            break
          case 'economiaAnualPercentual':
            row['Economia Anual (%)'] = plano.metricas.economiaAnualPercentual
            break
          case 'roi':
            row['ROI (%)'] = plano.metricas.roi
            break
          case 'beneficiosCount':
            row['Benefícios'] = plano.metricas.beneficiosCount
            break
          case 'custoPorBeneficio':
            row['Custo por Benefício'] = plano.metricas.custoPorBeneficio
            break
          default:
            row[col] = 'N/A'
        }
      })
      return row
    })

    exportarCSV(exportData, `comparacao_planos_${new Date().toISOString().split('T')[0]}`)
  }

  const getSortIcon = (field: SortField) => {
    if (sortField !== field) return <ArrowUpDown className="h-4 w-4" />
    return sortDirection === 'asc' ? <ArrowUp className="h-4 w-4" /> : <ArrowDown className="h-4 w-4" />
  }

  const getTrendIcon = (value: number, threshold: { good: number; bad: number }) => {
    if (value >= threshold.good) return <TrendingUp className="h-4 w-4 text-green-600" />
    if (value <= threshold.bad) return <TrendingDown className="h-4 w-4 text-red-600" />
    return <Minus className="h-4 w-4 text-yellow-600" />
  }

  const getCellValue = (plano: any, column: string) => {
    switch (column) {
      case 'nome':
        return (
          <div className="flex items-center gap-2">
            <span className="font-medium">{plano.nome}</span>
            {!plano.ativo && <Badge variant="secondary">Inativo</Badge>}
          </div>
        )
      case 'categoria':
        return (
          <Badge variant={plano.categoria === 'premium' ? 'default' :
                       plano.categoria === 'padrao' ? 'secondary' : 'outline'}>
            {plano.categoria.toUpperCase()}
          </Badge>
        )
      case 'ciclo':
        return plano.ciclo === 'mensal' ? 'Mensal' : 'Anual'
      case 'precoMensal':
        return formatarMoeda(plano.metricas.precoMensal)
      case 'precoAnual':
        return formatarMoeda(plano.metricas.precoAnual)
      case 'margemPercentual':
        return (
          <div className="flex items-center gap-2">
            <span>{formatarPercentual(plano.metricas.margemPercentual)}</span>
            {getTrendIcon(plano.metricas.margemPercentual, { good: 30, bad: 15 })}
          </div>
        )
      case 'margemValor':
        return formatarMoeda(plano.metricas.margemValor)
      case 'economiaAnualValor':
        return plano.metricas.economiaAnualValor > 0
          ? <span className="text-green-600">{formatarMoeda(plano.metricas.economiaAnualValor)}</span>
          : '-'
      case 'economiaAnualPercentual':
        return plano.metricas.economiaAnualPercentual > 0
          ? <span className="text-green-600">{formatarPercentual(plano.metricas.economiaAnualPercentual)}</span>
          : '-'
      case 'roi':
        return (
          <div className="flex items-center gap-2">
            <span>{formatarPercentual(plano.metricas.roi)}</span>
            {getTrendIcon(plano.metricas.roi, { good: 50, bad: 20 })}
          </div>
        )
      case 'beneficiosCount':
        return plano.metricas.beneficiosCount
      case 'custoPorBeneficio':
        return formatarMoeda(plano.metricas.custoPorBeneficio)
      default:
        return '-'
    }
  }

  const columnDefinitions = [
    { id: 'nome', label: 'Plano', sortable: true },
    { id: 'categoria', label: 'Categoria', sortable: true },
    { id: 'ciclo', label: 'Ciclo', sortable: true },
    { id: 'precoMensal', label: 'Preço Mensal', sortable: true },
    { id: 'precoAnual', label: 'Preço Anual', sortable: true },
    { id: 'margemPercentual', label: 'Margem (%)', sortable: true },
    { id: 'margemValor', label: 'Margem (R$)', sortable: true },
    { id: 'economiaAnualValor', label: 'Economia Anual (R$)', sortable: true },
    { id: 'economiaAnualPercentual', label: 'Economia Anual (%)', sortable: true },
    { id: 'roi', label: 'ROI (%)', sortable: true },
    { id: 'beneficiosCount', label: 'Benefícios', sortable: true },
    { id: 'custoPorBeneficio', label: 'Custo/Benefício', sortable: true }
  ]

  return (
    <div className="space-y-6">
      {/* Filtros */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filtros e Busca
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            <div className="space-y-2">
              <Label>Buscar</Label>
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Nome do plano..."
                  value={filters.search || ''}
                  onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                  className="pl-8"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Categoria</Label>
              <Select
                value={filters.categoria || ''}
                onValueChange={(value: PlanCategory | '') =>
                  setFilters({ ...filters, categoria: value || undefined })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Todas" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Todas</SelectItem>
                  <SelectItem value="basico">Básico</SelectItem>
                  <SelectItem value="padrao">Padrão</SelectItem>
                  <SelectItem value="premium">Premium</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Ciclo</Label>
              <Select
                value={filters.ciclo || ''}
                onValueChange={(value: BillingCycle | '') =>
                  setFilters({ ...filters, ciclo: value || undefined })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Todos" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Todos</SelectItem>
                  <SelectItem value="mensal">Mensal</SelectItem>
                  <SelectItem value="anual">Anual</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Preço Mínimo</Label>
              <Input
                type="number"
                placeholder="R$ 0"
                value={filters.precoMin || ''}
                onChange={(e) =>
                  setFilters({
                    ...filters,
                    precoMin: e.target.value ? parseFloat(e.target.value) : undefined
                  })
                }
              />
            </div>

            <div className="space-y-2">
              <Label>Preço Máximo</Label>
              <Input
                type="number"
                placeholder="R$ 999"
                value={filters.precoMax || ''}
                onChange={(e) =>
                  setFilters({
                    ...filters,
                    precoMax: e.target.value ? parseFloat(e.target.value) : undefined
                  })
                }
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Seleção de Colunas */}
      <Card>
        <CardHeader>
          <CardTitle>Colunas Visíveis</CardTitle>
          <CardDescription>
            Selecione quais colunas exibir na tabela
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {columnDefinitions.map((col) => (
              <div key={col.id} className="flex items-center space-x-2">
                <Checkbox
                  id={col.id}
                  checked={selectedColumns.includes(col.id)}
                  onCheckedChange={(checked) => {
                    if (checked) {
                      setSelectedColumns([...selectedColumns, col.id])
                    } else {
                      setSelectedColumns(selectedColumns.filter(c => c !== col.id))
                    }
                  }}
                />
                <Label htmlFor={col.id} className="text-sm">
                  {col.label}
                </Label>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Tabela Comparativa */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Target className="h-5 w-5" />
                Tabela Comparativa de Planos
              </CardTitle>
              <CardDescription>
                {planosOrdenados.length} plano(s) encontrado(s)
              </CardDescription>
            </div>
            <Button onClick={handleExport}>
              <Download className="mr-2 h-4 w-4" />
              Exportar CSV
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  {selectedColumns.map((col) => {
                    const def = columnDefinitions.find(d => d.id === col)
                    if (!def) return null
                    return (
                      <TableHead key={col}>
                        {def.sortable ? (
                          <Button
                            variant="ghost"
                            className="h-auto p-0 font-semibold"
                            onClick={() => handleSort(col as SortField)}
                          >
                            {def.label}
                            {getSortIcon(col as SortField)}
                          </Button>
                        ) : (
                          def.label
                        )}
                      </TableHead>
                    )
                  })}
                </TableRow>
              </TableHeader>
              <TableBody>
                {planosOrdenados.length > 0 ? (
                  planosOrdenados.map((plano) => (
                    <TableRow key={plano.id}>
                      {selectedColumns.map((col) => (
                        <TableCell key={col}>
                          {getCellValue(plano, col)}
                        </TableCell>
                      ))}
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={selectedColumns.length} className="text-center py-8">
                      <div className="text-muted-foreground">
                        <Eye className="h-8 w-8 mx-auto mb-2 opacity-50" />
                        <p>Nenhum plano encontrado com os filtros selecionados</p>
                      </div>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Resumo Estatístico */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Preço Médio</p>
                <p className="text-2xl font-bold">
                  {formatarMoeda(
                    planosOrdenados.reduce((acc, p) => acc + p.metricas.precoMensal, 0) /
                    (planosOrdenados.length || 1)
                  )}
                </p>
              </div>
              <DollarSign className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Margem Média</p>
                <p className="text-2xl font-bold">
                  {formatarPercentual(
                    planosOrdenados.reduce((acc, p) => acc + p.metricas.margemPercentual, 0) /
                    (planosOrdenados.length || 1)
                  )}
                </p>
              </div>
              <Target className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">ROI Médio</p>
                <p className="text-2xl font-bold">
                  {formatarPercentual(
                    planosOrdenados.reduce((acc, p) => acc + p.metricas.roi, 0) /
                    (planosOrdenados.length || 1)
                  )}
                </p>
              </div>
              <TrendingUp className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Melhor Margem</p>
                <p className="text-2xl font-bold">
                  {planosOrdenados.length > 0
                    ? formatarPercentual(
                        Math.max(...planosOrdenados.map(p => p.metricas.margemPercentual))
                      )
                    : '-'}
                </p>
              </div>
              <Award className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}