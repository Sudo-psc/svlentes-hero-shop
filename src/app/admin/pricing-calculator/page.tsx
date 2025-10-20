/**
 * Página principal da Calculadora de Preços e Rentabilidade
 * Sistema completo para gestão de planos de assinatura com análise financeira
 */

'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import {
  Calculator,
  Settings,
  Table,
  TrendingUp,
  Download,
  Save,
  AlertCircle,
  DollarSign,
  Target,
  PieChart
} from 'lucide-react'

import { PlanoAssinatura, ConfigPainelCustos, TabelaComparativa } from '@/types/pricing-calculator'
import { getCustosPadrao, getDescontosPadrao, formatarMoeda, formatarPercentual } from '@/lib/pricing-calculator'

// Componentes (serão criados separadamente)
import { CostPanel } from '@/components/admin/pricing/CostPanel'
import { PlansManager } from '@/components/admin/pricing/PlansManager'
import { ComparisonTable } from '@/components/admin/pricing/ComparisonTable'
import { ReportsSection } from '@/components/admin/pricing/ReportsSection'
import { MetricsOverview } from '@/components/admin/pricing/MetricsOverview'

export default function PricingCalculatorPage() {
  const [activeTab, setActiveTab] = useState('overview')
  const [planos, setPlanos] = useState<PlanoAssinatura[]>([])
  const [configCustos, setConfigCustos] = useState<ConfigPainelCustos>(getCustosPadrao())
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string>()
  const [unsavedChanges, setUnsavedChanges] = useState(false)

  // Inicializa dados ao carregar a página
  useEffect(() => {
    loadInitialData()
  }, [])

  const loadInitialData = async () => {
    try {
      setLoading(true)

      // Carregar planos da API
      const response = await fetch('/api/admin/pricing/planos')
      if (response.ok) {
        const data = await response.json()
        setPlanos(data.planos || [])
      }

      // Carregar configuração de custos
      const costResponse = await fetch('/api/admin/pricing/costs')
      if (costResponse.ok) {
        const costData = await costResponse.json()
        setConfigCustos(costData)
      }

    } catch (err) {
      console.error('Erro ao carregar dados:', err)
      setError('Não foi possível carregar os dados. Tente novamente.')
    } finally {
      setLoading(false)
    }
  }

  const handleSaveConfig = async (newConfig: ConfigPainelCustos) => {
    try {
      const response = await fetch('/api/admin/pricing/costs', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newConfig),
      })

      if (!response.ok) {
        throw new Error('Erro ao salvar configuração')
      }

      setConfigCustos(newConfig)
      setUnsavedChanges(false)
      setError(undefined)
    } catch (err) {
      console.error('Erro ao salvar:', err)
      setError('Erro ao salvar configuração. Tente novamente.')
    }
  }

  const handleSavePlano = async (plano: PlanoAssinatura) => {
    try {
      const method = plano.id ? 'PUT' : 'POST'
      const url = plano.id
        ? `/api/admin/pricing/planos/${plano.id}`
        : '/api/admin/pricing/planos'

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(plano),
      })

      if (!response.ok) {
        throw new Error('Erro ao salvar plano')
      }

      const savedPlano = await response.json()

      if (plano.id) {
        setPlanos(prev => prev.map(p => p.id === plano.id ? savedPlano : p))
      } else {
        setPlanos(prev => [...prev, savedPlano])
      }

      setError(undefined)
    } catch (err) {
      console.error('Erro ao salvar plano:', err)
      setError('Erro ao salvar plano. Tente novamente.')
    }
  }

  const handleDeletePlano = async (planoId: string) => {
    try {
      const response = await fetch(`/api/admin/pricing/planos/${planoId}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        throw new Error('Erro ao excluir plano')
      }

      setPlanos(prev => prev.filter(p => p.id !== planoId))
      setError(undefined)
    } catch (err) {
      console.error('Erro ao excluir plano:', err)
      setError('Erro ao excluir plano. Tente novamente.')
    }
  }

  const handleExportData = (format: 'csv' | 'pdf') => {
    // Implementar exportação
    console.log(`Exportando em ${format}`)
  }

  // Calcular métricas gerais
  const metricasGerais = planos.length > 0 ? {
    totalPlanos: planos.length,
    planosAtivos: planos.filter(p => p.ativo).length,
    margemMedia: planos.reduce((acc, p) => {
      const resumo = gerarResumoFinanceiro(p, configCustos.descontos)
      return acc + resumo.margem.percentual
    }, 0) / planos.length,
    receitaProjetada: planos.filter(p => p.ativo).reduce((acc, p) => acc + p.precoBase, 0) * 100 // estimativa
  } : null

  return (
    <div className="flex-1 space-y-6 p-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Calculadora de Preços</h1>
          <p className="text-muted-foreground">
            Gerencie planos de assinatura e analise a rentabilidade
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => handleExportData('csv')}>
            <Download className="mr-2 h-4 w-4" />
            Exportar CSV
          </Button>
          <Button variant="outline" onClick={() => handleExportData('pdf')}>
            <Download className="mr-2 h-4 w-4" />
            Exportar PDF
          </Button>
          {unsavedChanges && (
            <Button onClick={() => handleSaveConfig(configCustos)}>
              <Save className="mr-2 h-4 w-4" />
              Salvar Alterações
            </Button>
          )}
        </div>
      </div>

      {/* Alerta de erro */}
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Tabs de navegação */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview" className="flex items-center gap-2">
            <PieChart className="h-4 w-4" />
            Visão Geral
          </TabsTrigger>
          <TabsTrigger value="plans" className="flex items-center gap-2">
            <Target className="h-4 w-4" />
            Planos
          </TabsTrigger>
          <TabsTrigger value="costs" className="flex items-center gap-2">
            <Calculator className="h-4 w-4" />
            Custos
          </TabsTrigger>
          <TabsTrigger value="comparison" className="flex items-center gap-2">
            <Table className="h-4 w-4" />
            Comparação
          </TabsTrigger>
          <TabsTrigger value="reports" className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4" />
            Relatórios
          </TabsTrigger>
        </TabsList>

        {/* Visão Geral */}
        <TabsContent value="overview" className="space-y-6">
          <MetricsOverview
            planos={planos}
            configCustos={configCustos}
            loading={loading}
          />
        </TabsContent>

        {/* Gerenciamento de Planos */}
        <TabsContent value="plans" className="space-y-6">
          <PlansManager
            planos={planos}
            configCustos={configCustos}
            onSave={handleSavePlano}
            onDelete={handleDeletePlano}
            loading={loading}
          />
        </TabsContent>

        {/* Configuração de Custos */}
        <TabsContent value="costs" className="space-y-6">
          <CostPanel
            config={configCustos}
            onSave={handleSaveConfig}
            onRestoreDefault={() => {
              setConfigCustos(getCustosPadrao())
              setUnsavedChanges(true)
            }}
          />
        </TabsContent>

        {/* Tabela Comparativa */}
        <TabsContent value="comparison" className="space-y-6">
          <ComparisonTable
            planos={planos}
            configCustos={configCustos}
            onExport={handleExportData}
          />
        </TabsContent>

        {/* Relatórios */}
        <TabsContent value="reports" className="space-y-6">
          <ReportsSection
            planos={planos}
            configCustos={configCustos}
          />
        </TabsContent>
      </Tabs>
    </div>
  )
}

// Helper function para cálculo de resumo financeiro
function gerarResumoFinanceiro(plano: PlanoAssinatura, descontos: any) {
  // Implementação simplificada - mover para lib
  return {
    margem: {
      percentual: 25,
      valorAbsoluto: plano.precoBase * 0.25
    }
  }
}