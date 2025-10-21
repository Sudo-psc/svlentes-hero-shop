'use client'
import React, { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { Calendar } from '@/components/ui/calendar'
import { CalendarIcon, Filter, X, Search } from 'lucide-react'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { cn } from '@/lib/utils'
import { FilterOptions } from '@/types/admin'
interface FilterPanelProps {
  filters: FilterOptions
  onFiltersChange: (filters: FilterOptions) => void
  onClearFilters: () => void
  availableStatuses?: { value: string; label: string }[]
  availableCategories?: { value: string; label: string }[]
  availablePriorities?: { value: string; label: string }[]
  searchPlaceholder?: string
  showSearch?: boolean
  showDateRange?: boolean
  showStatus?: boolean
  showCategory?: boolean
  showPriority?: boolean
  showAssignedTo?: boolean
  assignedToOptions?: { value: string; label: string }[]
  className?: string
}
export function FilterPanel({
  filters,
  onFiltersChange,
  onClearFilters,
  availableStatuses = [],
  availableCategories = [],
  availablePriorities = [],
  searchPlaceholder = 'Buscar...',
  showSearch = true,
  showDateRange = true,
  showStatus = true,
  showCategory = true,
  showPriority = false,
  showAssignedTo = false,
  assignedToOptions = [],
  className,
}: FilterPanelProps) {
  const [dateRangeOpen, setDateRangeOpen] = useState(false)
  const handleSearchChange = (search: string) => {
    onFiltersChange({ ...filters, search })
  }
  const handleStatusChange = (status: string) => {
    const currentStatuses = filters.status ? (Array.isArray(filters.status) ? filters.status : [filters.status]) : []
    if (currentStatuses.includes(status)) {
      const newStatuses = currentStatuses.filter(s => s !== status)
      onFiltersChange({ ...filters, status: newStatuses.length > 0 ? newStatuses : undefined })
    } else {
      onFiltersChange({ ...filters, status: [...currentStatuses, status] })
    }
  }
  const handleCategoryChange = (category: string) => {
    onFiltersChange({ ...filters, category: category || undefined })
  }
  const handlePriorityChange = (priority: string) => {
    onFiltersChange({ ...filters, priority: priority || undefined })
  }
  const handleAssignedToChange = (assignedTo: string) => {
    onFiltersChange({ ...filters, assignedTo: assignedTo || undefined })
  }
  const handleDateRangeChange = (range: { from?: Date; to?: Date }) => {
    if (range.from && range.to) {
      onFiltersChange({ ...filters, dateRange: { start: range.from, end: range.to } })
    }
  }
  const clearDateRange = () => {
    onFiltersChange({ ...filters, dateRange: undefined })
  }
  const hasActiveFilters = !!(filters.search ||
    filters.status ||
    filters.category ||
    filters.priority ||
    filters.assignedTo ||
    filters.dateRange)
  const getActiveFiltersCount = () => {
    let count = 0
    if (filters.search) count++
    if (filters.status) count += Array.isArray(filters.status) ? filters.status.length : 1
    if (filters.category) count++
    if (filters.priority) count++
    if (filters.assignedTo) count++
    if (filters.dateRange) count++
    return count
  }
  return (
    <div className={cn('space-y-4', className)}>
      {/* Search and Quick Actions */}
      <div className="flex flex-col sm:flex-row gap-4">
        {showSearch && (
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder={searchPlaceholder}
              value={filters.search || ''}
              onChange={(e) => handleSearchChange(e.target.value)}
              className="pl-10"
            />
          </div>
        )}
        <div className="flex items-center gap-2">
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" className="gap-2">
                <Filter className="h-4 w-4" />
                Filtros
                {hasActiveFilters && (
                  <Badge variant="secondary" className="ml-1 px-1.5 py-0.5 text-xs">
                    {getActiveFiltersCount()}
                  </Badge>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-96 p-4" align="end">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="font-medium">Filtros</h4>
                  {hasActiveFilters && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={onClearFilters}
                      className="text-muted-foreground"
                    >
                      <X className="h-4 w-4 mr-1" />
                      Limpar todos
                    </Button>
                  )}
                </div>
                {/* Date Range Filter */}
                {showDateRange && (
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Período</label>
                    <Popover open={dateRangeOpen} onOpenChange={setDateRangeOpen}>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className={cn(
                            'w-full justify-start text-left font-normal',
                            !filters.dateRange && 'text-muted-foreground'
                          )}
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {filters.dateRange ? (
                            <>
                              {format(filters.dateRange.start, 'dd/MM/yyyy', { locale: ptBR })} - {' '}
                              {format(filters.dateRange.end, 'dd/MM/yyyy', { locale: ptBR })}
                            </>
                          ) : (
                            'Selecionar período'
                          )}
                          {filters.dateRange && (
                            <X
                              className="ml-auto h-4 w-4"
                              onClick={(e) => {
                                e.stopPropagation()
                                clearDateRange()
                              }}
                            />
                          )}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="range"
                          selected={filters.dateRange}
                          onSelect={(range) => {
                            if (range?.from && range?.to) {
                              handleDateRangeChange(range)
                              setDateRangeOpen(false)
                            }
                          }}
                          initialFocus
                          locale={ptBR}
                        />
                      </PopoverContent>
                    </Popover>
                  </div>
                )}
                {/* Status Filter */}
                {showStatus && availableStatuses.length > 0 && (
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Status</label>
                    <div className="flex flex-wrap gap-2">
                      {availableStatuses.map((status) => {
                        const isSelected = filters.status ?
                          (Array.isArray(filters.status) ? filters.status.includes(status.value) : filters.status === status.value)
                          : false
                        return (
                          <Badge
                            key={status.value}
                            variant={isSelected ? 'default' : 'outline'}
                            className="cursor-pointer"
                            onClick={() => handleStatusChange(status.value)}
                          >
                            {status.label}
                            {isSelected && <X className="ml-1 h-3 w-3" />}
                          </Badge>
                        )
                      })}
                    </div>
                  </div>
                )}
                {/* Category Filter */}
                {showCategory && availableCategories.length > 0 && (
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Categoria</label>
                    <Select
                      value={filters.category || ''}
                      onValueChange={handleCategoryChange}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione uma categoria" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="">Todas as categorias</SelectItem>
                        {availableCategories.map((category) => (
                          <SelectItem key={category.value} value={category.value}>
                            {category.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}
                {/* Priority Filter */}
                {showPriority && availablePriorities.length > 0 && (
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Prioridade</label>
                    <Select
                      value={filters.priority || ''}
                      onValueChange={handlePriorityChange}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione uma prioridade" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="">Todas as prioridades</SelectItem>
                        {availablePriorities.map((priority) => (
                          <SelectItem key={priority.value} value={priority.value}>
                            {priority.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}
                {/* Assigned To Filter */}
                {showAssignedTo && assignedToOptions.length > 0 && (
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Atribuído para</label>
                    <Select
                      value={filters.assignedTo || ''}
                      onValueChange={handleAssignedToChange}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione um responsável" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="">Todos</SelectItem>
                        {assignedToOptions.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </div>
            </PopoverContent>
          </Popover>
        </div>
      </div>
      {/* Active Filters Display */}
      {hasActiveFilters && (
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-sm text-muted-foreground">Filtros ativos:</span>
          {filters.search && (
            <Badge variant="secondary" className="gap-1">
              Busca: {filters.search}
              <X
                className="h-3 w-3 cursor-pointer"
                onClick={() => handleSearchChange('')}
              />
            </Badge>
          )}
          {filters.status && (
            <>
              {(Array.isArray(filters.status) ? filters.status : [filters.status]).map((status) => (
                <Badge key={status} variant="secondary" className="gap-1">
                  Status: {availableStatuses.find(s => s.value === status)?.label || status}
                  <X
                    className="h-3 w-3 cursor-pointer"
                    onClick={() => handleStatusChange(status)}
                  />
                </Badge>
              ))}
            </>
          )}
          {filters.category && (
            <Badge variant="secondary" className="gap-1">
              Categoria: {availableCategories.find(c => c.value === filters.category)?.label || filters.category}
              <X
                className="h-3 w-3 cursor-pointer"
                onClick={() => handleCategoryChange('')}
              />
            </Badge>
          )}
          {filters.priority && (
            <Badge variant="secondary" className="gap-1">
              Prioridade: {availablePriorities.find(p => p.value === filters.priority)?.label || filters.priority}
              <X
                className="h-3 w-3 cursor-pointer"
                onClick={() => handlePriorityChange('')}
              />
            </Badge>
          )}
          {filters.assignedTo && (
            <Badge variant="secondary" className="gap-1">
              Responsável: {assignedToOptions.find(a => a.value === filters.assignedTo)?.label || filters.assignedTo}
              <X
                className="h-3 w-3 cursor-pointer"
                onClick={() => handleAssignedToChange('')}
              />
            </Badge>
          )}
          {filters.dateRange && (
            <Badge variant="secondary" className="gap-1">
              Período: {format(filters.dateRange.start, 'dd/MM/yyyy', { locale: ptBR })} - {format(filters.dateRange.end, 'dd/MM/yyyy', { locale: ptBR })}
              <X
                className="h-3 w-3 cursor-pointer"
                onClick={clearDateRange}
              />
            </Badge>
          )}
          <Button
            variant="ghost"
            size="sm"
            onClick={onClearFilters}
            className="text-muted-foreground"
          >
            <X className="h-3 w-3 mr-1" />
            Limpar todos
          </Button>
        </div>
      )}
    </div>
  )
}