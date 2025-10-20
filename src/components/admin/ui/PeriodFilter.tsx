'use client'
import { useState, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Calendar } from '@/components/ui/calendar'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { Badge } from '@/components/ui/badge'
import { CalendarIcon, Download, Filter, RotateCcw } from 'lucide-react'
import { cn } from '@/lib/utils'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
export interface PeriodFilterOptions {
  preset?: '7d' | '30d' | '90d' | '6m' | '1y' | 'custom'
  startDate?: Date
  endDate?: Date
  compareWith?: 'previous' | 'same_last_month' | 'same_last_year'
}
interface PeriodFilterProps {
  value?: PeriodFilterOptions
  onChange: (value: PeriodFilterOptions) => void
  onExport?: (format: 'csv' | 'excel' | 'pdf') => void
  onRefresh?: () => void
  isRefreshing?: boolean
  showExport?: boolean
  showComparison?: boolean
  className?: string
}
const presetOptions = [
  { value: '7d', label: 'Últimos 7 dias', days: 7 },
  { value: '30d', label: 'Últimos 30 dias', days: 30 },
  { value: '90d', label: 'Últimos 90 dias', days: 90 },
  { value: '6m', label: 'Últimos 6 meses', days: 180 },
  { value: '1y', label: 'Último ano', days: 365 },
  { value: 'custom', label: 'Período personalizado', days: 0 }
]
const comparisonOptions = [
  { value: 'previous', label: 'Período anterior' },
  { value: 'same_last_month', label: 'Mês anterior' },
  { value: 'same_last_year', label: 'Ano anterior' }
]
export function PeriodFilter({
  value = { preset: '30d' },
  onChange,
  onExport,
  onRefresh,
  isRefreshing = false,
  showExport = true,
  showComparison = true,
  className
}: PeriodFilterProps) {
  const [isCustomRangeOpen, setIsCustomRangeOpen] = useState(false)
  const [customStartDate, setCustomStartDate] = useState<Date>()
  const [customEndDate, setCustomEndDate] = useState<Date>()
  const handlePresetChange = useCallback((preset: string) => {
    if (preset === 'custom') {
      setIsCustomRangeOpen(true)
      return
    }
    const endDate = new Date()
    const startDate = new Date()
    const presetConfig = presetOptions.find(p => p.value === preset)
    if (presetConfig && presetConfig.days > 0) {
      startDate.setDate(endDate.getDate() - presetConfig.days)
    }
    onChange({
      ...value,
      preset: preset as PeriodFilterOptions['preset'],
      startDate,
      endDate
    })
  }, [onChange, value])
  const handleCustomRangeApply = useCallback(() => {
    if (customStartDate && customEndDate) {
      onChange({
        ...value,
        preset: 'custom',
        startDate: customStartDate,
        endDate: customEndDate
      })
      setIsCustomRangeOpen(false)
    }
  }, [onChange, value, customStartDate, customEndDate])
  const handleComparisonChange = useCallback((compareWith: string) => {
    onChange({
      ...value,
      compareWith: compareWith as PeriodFilterOptions['compareWith']
    })
  }, [onChange, value])
  const handleReset = useCallback(() => {
    onChange({ preset: '30d' })
    setCustomStartDate(undefined)
    setCustomEndDate(undefined)
  }, [onChange])
  const getPeriodLabel = () => {
    if (!value.startDate || !value.endDate) {
      const preset = presetOptions.find(p => p.value === value.preset)
      return preset?.label || 'Selecione um período'
    }
    if (value.preset === 'custom') {
      return `${format(value.startDate, 'dd/MM/yyyy', { locale: ptBR })} - ${format(value.endDate, 'dd/MM/yyyy', { locale: ptBR })}`
    }
    const preset = presetOptions.find(p => p.value === value.preset)
    return preset?.label || 'Período personalizado'
  }
  const isCustomRange = value.preset === 'custom'
  const hasActiveFilters = value.preset !== '30d' || value.compareWith
  return (
    <div className={cn("flex items-center gap-2 flex-wrap", className)}>
      {/* Filtro de Período */}
      <div className="flex items-center gap-2">
        <Filter className="h-4 w-4 text-muted-foreground" />
        <Select
          value={value.preset}
          onValueChange={handlePresetChange}
        >
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Selecione um período" />
          </SelectTrigger>
          <SelectContent>
            {presetOptions.map(option => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {/* Range personalizado */}
        {isCustomRange && (
          <Popover open={isCustomRangeOpen} onOpenChange={setIsCustomRangeOpen}>
            <PopoverTrigger asChild>
              <Button variant="outline" size="sm">
                <CalendarIcon className="h-4 w-4 mr-2" />
                {customStartDate && customEndDate
                  ? `${format(customStartDate, 'dd/MM', { locale: ptBR })} - ${format(customEndDate, 'dd/MM', { locale: ptBR })}`
                  : 'Selecionar datas'
                }
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <div className="p-4 space-y-3">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Data inicial</label>
                  <Calendar
                    mode="single"
                    selected={customStartDate}
                    onSelect={setCustomStartDate}
                    locale={ptBR}
                    disabled={(date) => date > new Date() || (customEndDate && date > customEndDate)}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Data final</label>
                  <Calendar
                    mode="single"
                    selected={customEndDate}
                    onSelect={setCustomEndDate}
                    locale={ptBR}
                    disabled={(date) => date > new Date() || (customStartDate && date < customStartDate)}
                  />
                </div>
                <div className="flex gap-2 pt-2">
                  <Button
                    size="sm"
                    onClick={handleCustomRangeApply}
                    disabled={!customStartDate || !customEndDate}
                  >
                    Aplicar
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => setIsCustomRangeOpen(false)}>
                    Cancelar
                  </Button>
                </div>
              </div>
            </PopoverContent>
          </Popover>
        )}
      </div>
      {/* Comparação */}
      {showComparison && (
        <Select
          value={value.compareWith || ''}
          onValueChange={handleComparisonChange}
        >
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Comparar com..." />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">Sem comparação</SelectItem>
            {comparisonOptions.map(option => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}
      {/* Ações */}
      <div className="flex items-center gap-1">
        {/* Indicador de filtros ativos */}
        {hasActiveFilters && (
          <Badge variant="secondary" className="h-6">
            Filtros ativos
          </Badge>
        )}
        {/* Reset */}
        {hasActiveFilters && (
          <Button
            variant="ghost"
            size="sm"
            onClick={handleReset}
            className="h-8 px-2"
          >
            <RotateCcw className="h-3 w-3" />
            <span className="sr-only">Resetar filtros</span>
          </Button>
        )}
        {/* Refresh */}
        {onRefresh && (
          <Button
            variant="outline"
            size="sm"
            onClick={onRefresh}
            disabled={isRefreshing}
            className="h-8"
          >
            <RotateCcw className={cn("h-3 w-3", isRefreshing && "animate-spin")} />
            <span className="sr-only">Atualizar</span>
          </Button>
        )}
        {/* Export */}
        {showExport && onExport && (
          <div className="flex items-center">
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" size="sm" className="h-8">
                  <Download className="h-3 w-3 mr-1" />
                  Exportar
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-48" align="end">
                <div className="space-y-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="w-full justify-start"
                    onClick={() => onExport('csv')}
                  >
                    Exportar como CSV
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="w-full justify-start"
                    onClick={() => onExport('excel')}
                  >
                    Exportar como Excel
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="w-full justify-start"
                    onClick={() => onExport('pdf')}
                  >
                    Exportar como PDF
                  </Button>
                </div>
              </PopoverContent>
            </Popover>
          </div>
        )}
      </div>
      {/* Resumo do período */}
      <div className="text-sm text-muted-foreground ml-auto">
        {getPeriodLabel()}
      </div>
    </div>
  )
}
// Hook para gerenciar filtros de período
export function usePeriodFilter(initialValue?: PeriodFilterOptions) {
  const [filters, setFilters] = useState<PeriodFilterOptions>(initialValue || { preset: '30d' })
  const updateFilters = useCallback((newFilters: Partial<PeriodFilterOptions>) => {
    setFilters(prev => ({ ...prev, ...newFilters }))
  }, [])
  const resetFilters = useCallback(() => {
    setFilters({ preset: '30d' })
  }, [])
  const getPresetDates = useCallback((preset: string) => {
    const endDate = new Date()
    const startDate = new Date()
    const presetConfig = presetOptions.find(p => p.value === preset)
    if (presetConfig && presetConfig.days > 0) {
      startDate.setDate(endDate.getDate() - presetConfig.days)
    }
    return { startDate, endDate }
  }, [])
  const getApiParams = useCallback(() => {
    const params: Record<string, string> = {}
    if (filters.preset) {
      params.period = filters.preset
    }
    if (filters.startDate && filters.endDate) {
      params.startDate = filters.startDate.toISOString()
      params.endDate = filters.endDate.toISOString()
    }
    if (filters.compareWith) {
      params.compareWith = filters.compareWith
    }
    return params
  }, [filters])
  return {
    filters,
    updateFilters,
    resetFilters,
    getPresetDates,
    getApiParams,
    setFilters
  }
}
// Componente de resumo do período
export function PeriodSummary({
  filters,
  className
}: {
  filters: PeriodFilterOptions
  className?: string
}) {
  if (!filters.startDate || !filters.endDate) {
    return null
  }
  const daysDiff = Math.ceil((filters.endDate.getTime() - filters.startDate.getTime()) / (1000 * 60 * 60 * 24))
  const weeksDiff = Math.ceil(daysDiff / 7)
  const monthsDiff = Math.ceil(daysDiff / 30)
  return (
    <div className={cn("flex items-center gap-4 text-sm text-muted-foreground", className)}>
      <span>
        Período de {daysDiff} dias
        {weeksDiff <= 12 && ` (${weeksDiff} semanas)`}
        {monthsDiff <= 12 && ` (${monthsDiff} meses)`}
      </span>
      {filters.compareWith && (
        <Badge variant="outline" className="h-5">
          Comparando com: {comparisonOptions.find(o => o.value === filters.compareWith)?.label}
        </Badge>
      )}
    </div>
  )
}