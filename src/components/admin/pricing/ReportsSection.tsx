/**
 * Seção de Relatórios Analíticos
 * Gera relatórios detalhados para análise estratégica
 */

'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  FileText,
  Download,
  BarChart3,
  TrendingUp,
  PieChart,
  LineChart,
  Calendar,
  Filter,
  Eye,
  Loader2,
  AlertCircle,
  CheckCircle
} from 'lucide-react'

import {
  PlanoAssinatura,
  ConfigPainelCustos,
  TipoRelatorio,
  RelatorioAnalitico,
  DadosRelatorio,
  AnaliseRentabilidade
} from '@/types/pricing-calculator'
import {
  formatarMoeda,
  formatarPercentual,
  calcularAnaliseRentabilidade,
  calcularProjecaoReceita
} from '@/lib/pricing-calculator'

interface ReportsSectionProps {
  planos: PlanoAssinatura[]
  configCustos: ConfigPainelCustos
}

interface ReportConfig {
  tipo: TipoRelatorio
  periodoInicio: string
  periodoFim: string
  planosSelecionados: string[]
  cenario: 'conservador' | 'realista' | 'otimista'
}

export function ReportsSection({ planos, configCustos }: ReportsSectionProps) {
  const [reportConfig, setReportConfig] = useState<ReportConfig>({
    tipo: 'rentabilidade_por_plano',
    periodoInicio: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    periodoFim: new Date().toISOString().split('T')[0],
    planosSelecionados: planos.map(p => p.id),
    cenario: 'realista'
  })
  const [generating, setGenerating] = useState(false)
  const [generatedReports, setGeneratedReports] = useState<RelatorioAnalitico[]>([])
  const [showPreview, setShowPreview] = useState(false)
  const [currentReport, setCurrentReport] = useState<RelatorioAnalitico | null>(null)

  const reportTypes = [
    {
      id: 'rentabilidade_por_plano',
      name: 'Rentabilidade por Plano',
      description: 'Análise detalhada da margem de lucro por plano',
      icon: <BarChart3 className="h-4 w-4" />
    },
    {
      id: 'comparativo_margens',
      name: 'Comparativo de Margens',
      description: 'Comparação entre margens de todos os planos',
      icon: <PieChart className="h-4 w-4" />
    },
    {
      id: 'projecao_receita',
      name: 'Projeção de Receita',
      description: 'Projeção de receita para os próximos meses',
      icon: <TrendingUp className="h-4 w-4" />
    },
    {
      id: 'distribuicao_custos',
      name: 'Distribuição de Custos',
      description: 'Análise detalhada dos componentes de custo',
      icon: <FileText className="h-4 w-4" />
    },
    {
      id: 'tendencias_precificacao',
      name: 'Tendências de Precificação',
      description: 'Análise de tendências e recomendações',
      icon: <LineChart className="h-4 w-4" />
    }
  ]

  const handleGenerateReport = async () => {
    setGenerating(true)
    try {
      // Simular geração do relatório
      await new Promise(resolve => setTimeout(resolve, 2000))

      const dados = await generateReportData(reportConfig)
      const relatorio: RelatorioAnalitico = {
        id: Date.now().toString(),
        tipo: reportConfig.tipo,
        titulo: reportTypes.find(r => r.id === reportConfig.tipo)?.name || '',
        dados,
        geradoEm: new Date(),
        // Note: Using 'admin' as default. Can be enhanced with user context from NextAuth
        geradoPor: 'admin',
        // Note: Currently in-memory preview only. File export can be added via PDF generation library
        arquivoUrl: '#'
      }

      setGeneratedReports([relatorio, ...generatedReports])
      setCurrentReport(relatorio)
      setShowPreview(true)
    } catch (error) {
      // Report generation failed - error is silently handled in UI via generating state
    } finally {
      setGenerating(false)
    }
  }

  const generateReportData = async (config: ReportConfig): Promise<DadosRelatorio> => {
    const periodo = {
      inicio: new Date(config.periodoInicio),
      fim: new Date(config.periodoFim)
    }

    const planosSelecionados = planos.filter(p => config.planosSelecionados.includes(p.id))

    switch (config.tipo) {
      case 'rentabilidade_por_plano':
        return generateRentabilidadeReport(planosSelecionados, periodo)

      case 'comparativo_margens':
        return generateComparativoMargens(planosSelecionados, periodo)

      case 'projecao_receita':
        return generateProjecaoReceita(planosSelecionados, config.cenario)

      case 'distribuicao_custos':
        return generateDistribuicaoCustos(planosSelecionados, periodo)

      case 'tendencias_precificacao':
        return generateTendenciasPrecificacao(planosSelecionados, periodo)

      default:
        throw new Error('Tipo de relatório inválido')
    }
  }

  const generateRentabilidadeReport = (planos: PlanoAssinatura[], periodo: any): DadosRelatorio => {
    const analises: AnaliseRentabilidade[] = planos.map(plano => {
      const assinaturasAtivas = Math.floor(Math.random() * 100) + 20 // Simulação
      return calcularAnaliseRentabilidade(plano, assinaturasAtivas, periodo)
    })

    return {
      periodo,
      planos: planos.map(p => p.id),
      metricas: {
        receitaTotal: analises.reduce((acc, a) => acc + a.receitaTotal, 0),
        custoTotal: analises.reduce((acc, a) => acc + a.custoTotal, 0),
        lucroBruto: analises.reduce((acc, a) => acc + a.lucroBruto, 0),
        margemMedia: analises.reduce((acc, a) => acc + a.margemBruta, 0) / analises.length
      },
      graficos: [
        {
          tipo: 'bar',
          dados: analises.map(a => ({
            plano: planos.find(p => p.id === a.planoId)?.nome,
            receita: a.receitaTotal,
            custo: a.custoTotal,
            margem: a.margemBruta
          })),
          titulo: 'Receita vs Custos por Plano'
        },
        {
          tipo: 'pie',
          dados: analises.map(a => ({
            plano: planos.find(p => p.id === a.planoId)?.nome,
            valor: a.receitaTotal
          })),
          titulo: 'Participação na Receita Total'
        }
      ]
    }
  }

  const generateComparativoMargens = (planos: PlanoAssinatura[], periodo: any): DadosRelatorio => {
    const margens = planos.map(plano => {
      const custo = 100 // Base para cálculo
      const preco = plano.precoBase
      const margem = ((preco - custo) / preco) * 100

      return {
        plano: plano.nome,
        categoria: plano.categoria,
        preco,
        custo,
        margem,
        status: margem >= 30 ? 'Ótima' : margem >= 15 ? 'Boa' : 'Baixa'
      }
    })

    return {
      periodo,
      planos: planos.map(p => p.id),
      metricas: {
        margemMedia: margens.reduce((acc, m) => acc + m.margem, 0) / margens.length,
        melhorMargem: Math.max(...margens.map(m => m.margem)),
        piorMargem: Math.min(...margens.map(m => m.margem))
      },
      graficos: [
        {
          tipo: 'bar',
          dados: margens,
          titulo: 'Comparativo de Margens (%)'
        }
      ]
    }
  }

  const generateProjecaoReceita = (planos: PlanoAssinatura[], cenario: string): DadosRelatorio => {
    const meses = 12
    const projecoes = calcularProjecaoReceita(planos, meses, cenario as any)

    return {
      periodo: {
        inicio: new Date(),
        fim: new Date(Date.now() + meses * 30 * 24 * 60 * 60 * 1000)
      },
      planos: planos.map(p => p.id),
      metricas: {
        cenario,
        totalProjetado: projecoes.reduce((acc, val) => acc + val, 0),
        crescimentoMedio: 5 // Simulação
      },
      graficos: [
        {
          tipo: 'line',
          dados: projecoes.map((valor, index) => ({
            mes: index + 1,
            valor
          })),
          titulo: `Projeção de Receita - Cenário ${cenario}`
        }
      ]
    }
  }

  const generateDistribuicaoCustos = (planos: PlanoAssinatura[], periodo: any): DadosRelatorio => {
    const custos = {
      taxaProcessamento: configCustos.custos.taxaProcessamento,
      custoParcelamento: configCustos.custos.custoParcelamento,
      embalagens: configCustos.custos.embalagens,
      exames: configCustos.custos.exames,
      administrativo: configCustos.custos.administrativo,
      insumos: configCustos.custos.insumos,
      operacional: configCustos.custos.operacional
    }

    return {
      periodo,
      planos: planos.map(p => p.id),
      metricas: custos,
      graficos: [
        {
          tipo: 'pie',
          dados: Object.entries(custos).map(([key, value]) => ({
            componente: key,
            valor: typeof value === 'number' ? value : 0
          })),
          titulo: 'Distribuição de Custos (%)'
        }
      ]
    }
  }

  const generateTendenciasPrecificacao = (planos: PlanoAssinatura[], periodo: any): DadosRelatorio => {
    // Simulação de dados históricos
    const dadosHistoricos = planos.map(plano => ({
      plano: plano.nome,
      precoAtual: plano.precoBase,
      precoAnterior: plano.precoBase * 0.95,
      variacao: ((plano.precoBase - plano.precoBase * 0.95) / (plano.precoBase * 0.95)) * 100,
      recomendacao: plano.precoBase < 100 ? 'Aumentar preço' : 'Manter preço'
    }))

    return {
      periodo,
      planos: planos.map(p => p.id),
      metricas: {
        variacaoMedia: dadosHistoricos.reduce((acc, d) => acc + d.variacao, 0) / dadosHistoricos.length,
        planosParaAjuste: dadosHistoricos.filter(d => d.recomendacao === 'Aumentar preço').length
      },
      graficos: [
        {
          tipo: 'line',
          dados: dadosHistoricos,
          titulo: 'Tendência de Preços'
        }
      ]
    }
  }

  const handleExportPDF = () => {
    // Implementar exportação PDF
    console.log('Exportando PDF...')
  }

  const handleExportExcel = () => {
    // Implementar exportação Excel
    console.log('Exportando Excel...')
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold">Relatórios Analíticos</h2>
        <p className="text-muted-foreground">
          Gere relatórios detalhados para análise estratégica dos planos
        </p>
      </div>

      {/* Configuração do Relatório */}
      <Card>
        <CardHeader>
          <CardTitle>Configurar Relatório</CardTitle>
          <CardDescription>
            Selecione o tipo de relatório e configure os parâmetros
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Tipo de Relatório */}
            <div className="space-y-2">
              <Label>Tipo de Relatório</Label>
              <Select
                value={reportConfig.tipo}
                onValueChange={(value: TipoRelatorio) =>
                  setReportConfig({ ...reportConfig, tipo: value })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {reportTypes.map((type) => (
                    <SelectItem key={type.id} value={type.id}>
                      <div className="flex items-center gap-2">
                        {type.icon}
                        <div>
                          <div className="font-medium">{type.name}</div>
                          <div className="text-xs text-muted-foreground">{type.description}</div>
                        </div>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Cenário (para projeções) */}
            {reportConfig.tipo === 'projecao_receita' && (
              <div className="space-y-2">
                <Label>Cenário</Label>
                <Select
                  value={reportConfig.cenario}
                  onValueChange={(value: 'conservador' | 'realista' | 'otimista') =>
                    setReportConfig({ ...reportConfig, cenario: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="conservador">Conservador</SelectItem>
                    <SelectItem value="realista">Realista</SelectItem>
                    <SelectItem value="otimista">Otimista</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>

          {/* Período */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Data de Início</Label>
              <Input
                type="date"
                value={reportConfig.periodoInicio}
                onChange={(e) =>
                  setReportConfig({ ...reportConfig, periodoInicio: e.target.value })
                }
              />
            </div>
            <div className="space-y-2">
              <Label>Data de Fim</Label>
              <Input
                type="date"
                value={reportConfig.periodoFim}
                onChange={(e) =>
                  setReportConfig({ ...reportConfig, periodoFim: e.target.value })
                }
              />
            </div>
          </div>

          {/* Seleção de Planos */}
          <div className="space-y-3">
            <Label>Planos Incluídos</Label>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {planos.map((plano) => (
                <div key={plano.id} className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id={plano.id}
                    checked={reportConfig.planosSelecionados.includes(plano.id)}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setReportConfig({
                          ...reportConfig,
                          planosSelecionados: [...reportConfig.planosSelecionados, plano.id]
                        })
                      } else {
                        setReportConfig({
                          ...reportConfig,
                          planosSelecionados: reportConfig.planosSelecionados.filter(id => id !== plano.id)
                        })
                      }
                    }}
                    className="rounded"
                  />
                  <Label htmlFor={plano.id} className="text-sm">
                    {plano.nome}
                  </Label>
                </div>
              ))}
            </div>
          </div>

          {/* Botão Gerar */}
          <Button
            onClick={handleGenerateReport}
            disabled={generating || reportConfig.planosSelecionados.length === 0}
            className="w-full md:w-auto"
          >
            {generating ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Gerando Relatório...
              </>
            ) : (
              <>
                <FileText className="mr-2 h-4 w-4" />
                Gerar Relatório
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Relatórios Gerados */}
      {generatedReports.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Relatórios Gerados</CardTitle>
            <CardDescription>
              Relatórios gerados recentemente
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {generatedReports.map((report) => (
                <div
                  key={report.id}
                  className="flex items-center justify-between p-4 border rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    <CheckCircle className="h-5 w-5 text-green-600" />
                    <div>
                      <p className="font-medium">{report.titulo}</p>
                      <p className="text-sm text-muted-foreground">
                        Gerado em {report.geradoEm.toLocaleString('pt-BR')} por {report.geradoPor}
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setCurrentReport(report)
                        setShowPreview(true)
                      }}
                    >
                      <Eye className="h-4 w-4 mr-1" />
                      Visualizar
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleExportPDF}
                    >
                      <Download className="h-4 w-4 mr-1" />
                      PDF
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleExportExcel}
                    >
                      <Download className="h-4 w-4 mr-1" />
                      Excel
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Preview do Relatório */}
      <Dialog open={showPreview} onOpenChange={setShowPreview}>
        <DialogContent className="max-w-6xl max-h-[90vh]">
          <DialogHeader>
            <DialogTitle>{currentReport?.titulo}</DialogTitle>
            <DialogDescription>
              Visualização do relatório gerado
            </DialogDescription>
          </DialogHeader>

          {currentReport && (
            <div className="space-y-6">
              {/* Métricas Principais */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                {Object.entries(currentReport.dados.metricas).map(([key, value]) => (
                  <Card key={key}>
                    <CardContent className="pt-6">
                      <div className="text-2xl font-bold">
                        {typeof value === 'number' ? (
                          key.includes('margem') || key.includes('variacao') || key.includes('crescimento')
                            ? formatarPercentual(value)
                            : formatarMoeda(value)
                        ) : (
                          String(value)
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground capitalize">
                        {key.replace(/([A-Z])/g, ' $1').toLowerCase()}
                      </p>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {/* Gráficos */}
              <Tabs defaultValue="chart1" className="space-y-4">
                <TabsList>
                  {currentReport.dados.graficos.map((grafico, index) => (
                    <TabsTrigger key={index} value={`chart${index + 1}`}>
                      {grafico.titulo}
                    </TabsTrigger>
                  ))}
                </TabsList>

                {currentReport.dados.graficos.map((grafico, index) => (
                  <TabsContent key={index} value={`chart${index + 1}`}>
                    <Card>
                      <CardHeader>
                        <CardTitle>{grafico.titulo}</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="h-96 flex items-center justify-center text-muted-foreground">
                          <div className="text-center">
                            <BarChart3 className="h-16 w-16 mx-auto mb-4 opacity-50" />
                            <p>Visualização do gráfico</p>
                            <p className="text-sm">
                              Tipo: {grafico.tipo} | {grafico.dados.length} pontos de dados
                            </p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </TabsContent>
                ))}
              </Tabs>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowPreview(false)}>
              Fechar
            </Button>
            <Button onClick={handleExportPDF}>
              <Download className="mr-2 h-4 w-4" />
              Exportar PDF
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}