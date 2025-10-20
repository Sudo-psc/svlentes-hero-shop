/**
 * Painel de Configuração de Custos Operacionais
 * Interface para gestão de variáveis de custo com validação e histórico
 */

'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Settings,
  Save,
  RotateCcw,
  History,
  AlertCircle,
  TrendingUp,
  DollarSign,
  Calculator,
  Info
} from 'lucide-react'

import { ConfigPainelCustos, CustosOperacionais, ConfigDescontoProgressivo } from '@/types/pricing-calculator'
import { formatarMoeda, formatarPercentual, validarCustos, validarDescontos } from '@/lib/pricing-calculator'

interface CostPanelProps {
  config: ConfigPainelCustos
  onSave: (config: ConfigPainelCustos) => void
  onRestoreDefault: () => void
}

export function CostPanel({ config, onSave, onRestoreDefault }: CostPanelProps) {
  const [localConfig, setLocalConfig] = useState<ConfigPainelCustos>(config)
  const [errors, setErrors] = useState<string[]>([])
  const [hasChanges, setHasChanges] = useState(false)
  const [showHistory, setShowHistory] = useState(false)
  const [calculating, setCalculating] = useState(false)

  useEffect(() => {
    setLocalConfig(config)
    setHasChanges(false)
    setErrors([])
  }, [config])

  const handleCustoChange = (field: keyof CustosOperacionais, value: string) => {
    const numValue = parseFloat(value) || 0
    const updatedConfig = {
      ...localConfig,
      custos: {
        ...localConfig.custos,
        [field]: numValue
      }
    }
    setLocalConfig(updatedConfig)
    setHasChanges(true)
    validateConfig(updatedConfig)
  }

  const handleDescontoChange = (field: keyof ConfigDescontoProgressivo, value: string) => {
    const numValue = parseFloat(value) || 0
    const updatedConfig = {
      ...localConfig,
      descontos: {
        ...localConfig.descontos,
        [field]: numValue
      }
    }
    setLocalConfig(updatedConfig)
    setHasChanges(true)
    validateConfig(updatedConfig)
  }

  const validateConfig = (configToValidate: ConfigPainelCustos) => {
    const custoValidation = validarCustos(configToValidate.custos)
    const descontoValidation = validarDescontos(configToValidate.descontos)

    const allErrors = [...custoValidation.errors, ...descontoValidation.errors]
    setErrors(allErrors)
  }

  const handleSave = () => {
    if (errors.length === 0) {
      const updatedConfig = {
        ...localConfig,
        ultimoAtualizacao: new Date(),
        usuarioAtualizacao: 'admin' // TODO: pegar usuário logado
      }

      // Adicionar ao histórico
      const historicoEntry = {
        id: Date.now().toString(),
        timestamp: new Date(),
        usuario: 'admin',
        campo: 'config_geral',
        valorAnterior: JSON.stringify(config),
        valorNovo: JSON.stringify(localConfig),
        motivo: 'Atualização manual'
      }

      updatedConfig.historico = [historicoEntry, ...localConfig.historico].slice(0, 10)

      onSave(updatedConfig)
      setHasChanges(false)
    }
  }

  const calcularImpacto = async () => {
    setCalculating(true)
    // Simular cálculo de impacto nos preços
    await new Promise(resolve => setTimeout(resolve, 1000))
    setCalculating(false)
  }

  return (
    <div className="space-y-6">
      {/* Alerta de alterações não salvas */}
      {hasChanges && (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Você tem alterações não salvas. Clique em "Salvar" para aplicar as mudanças.
          </AlertDescription>
        </Alert>
      )}

      {/* Alerta de erros de validação */}
      {errors.length > 0 && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            <ul className="list-disc list-inside">
              {errors.map((error, index) => (
                <li key={index}>{error}</li>
              ))}
            </ul>
          </AlertDescription>
        </Alert>
      )}

      {/* Cards de Resumo */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Custo Total Mensal</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatarMoeda(
                localConfig.custos.embalagens +
                localConfig.custos.exames +
                localConfig.custos.administrativo +
                localConfig.custos.insumos +
                localConfig.custos.operacional
              )}
            </div>
            <p className="text-xs text-muted-foreground">
              Custos fixos por assinatura
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Taxa Total</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatarPercentual(
                localConfig.custos.taxaProcessamento + localConfig.custos.custoParcelamento
              )}
            </div>
            <p className="text-xs text-muted-foreground">
              Sobre cada pagamento
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Última Atualização</CardTitle>
            <History className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {new Date(localConfig.ultimoAtualizacao).toLocaleDateString('pt-BR')}
            </div>
            <p className="text-xs text-muted-foreground">
              Por {localConfig.usuarioAtualizacao}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Formulário de Configuração */}
      <Tabs defaultValue="custos" className="space-y-6">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="custos">Custos Operacionais</TabsTrigger>
          <TabsTrigger value="descontos">Descontos Progressivos</TabsTrigger>
        </TabsList>

        {/* Custos Operacionais */}
        <TabsContent value="custos" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                Configuração de Custos Operacionais
              </CardTitle>
              <CardDescription>
                Ajuste os valores dos componentes de custo para calcular a margem de lucro
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Custos Percentuais */}
              <div className="space-y-4">
                <h4 className="text-sm font-medium text-muted-foreground">Custos Percentuais</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="taxaProcessamento">
                      Taxa de Processamento (%)
                      <Badge variant="secondary" className="ml-2">0-10%</Badge>
                    </Label>
                    <Input
                      id="taxaProcessamento"
                      type="number"
                      step="0.01"
                      min="0"
                      max="10"
                      value={localConfig.custos.taxaProcessamento}
                      onChange={(e) => handleCustoChange('taxaProcessamento', e.target.value)}
                    />
                    <p className="text-xs text-muted-foreground">
                      Taxa cobrada pelo processador de pagamentos
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="custoParcelamento">
                      Custo de Parcelamento (%)
                      <Badge variant="secondary" className="ml-2">0-15%</Badge>
                    </Label>
                    <Input
                      id="custoParcelamento"
                      type="number"
                      step="0.01"
                      min="0"
                      max="15"
                      value={localConfig.custos.custoParcelamento}
                      onChange={(e) => handleCustoChange('custoParcelamento', e.target.value)}
                    />
                    <p className="text-xs text-muted-foreground">
                      Custo para oferecer parcelamento
                    </p>
                  </div>
                </div>
              </div>

              {/* Custos Fixos */}
              <div className="space-y-4">
                <h4 className="text-sm font-medium text-muted-foreground">Custos Fixos Mensais (R$)</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="embalagens">
                      Embalagens e Kits
                      <Badge variant="secondary" className="ml-2">R$ 0-50</Badge>
                    </Label>
                    <Input
                      id="embalagens"
                      type="number"
                      step="0.01"
                      min="0"
                      max="50"
                      value={localConfig.custos.embalagens}
                      onChange={(e) => handleCustoChange('embalagens', e.target.value)}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="exames">
                      Exames Complementares
                      <Badge variant="secondary" className="ml-2">R$ 0-500</Badge>
                    </Label>
                    <Input
                      id="exames"
                      type="number"
                      step="0.01"
                      min="0"
                      max="500"
                      value={localConfig.custos.exames}
                      onChange={(e) => handleCustoChange('exames', e.target.value)}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="administrativo">
                      Despesas Administrativas
                      <Badge variant="secondary" className="ml-2">R$ 0-1000</Badge>
                    </Label>
                    <Input
                      id="administrativo"
                      type="number"
                      step="0.01"
                      min="0"
                      max="1000"
                      value={localConfig.custos.administrativo}
                      onChange={(e) => handleCustoChange('administrativo', e.target.value)}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="insumos">
                      Custos de Insumos
                      <Badge variant="secondary" className="ml-2">R$ 0-200</Badge>
                    </Label>
                    <Input
                      id="insumos"
                      type="number"
                      step="0.01"
                      min="0"
                      max="200"
                      value={localConfig.custos.insumos}
                      onChange={(e) => handleCustoChange('insumos', e.target.value)}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="operacional">
                      Despesas Operacionais
                      <Badge variant="secondary" className="ml-2">R$ 0-500</Badge>
                    </Label>
                    <Input
                      id="operacional"
                      type="number"
                      step="0.01"
                      min="0"
                      max="500"
                      value={localConfig.custos.operacional}
                      onChange={(e) => handleCustoChange('operacional', e.target.value)}
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Descontos Progressivos */}
        <TabsContent value="descontos" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calculator className="h-5 w-5" />
                Descontos para Planos Anuais
              </CardTitle>
              <CardDescription>
                Configure os descontos aplicados aos planos anuais comparados aos planos mensais
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="descontoBasico">
                    Plano Básico Anual
                    <Badge variant="secondary" className="ml-2">0-30%</Badge>
                  </Label>
                  <Input
                    id="descontoBasico"
                    type="number"
                    step="0.1"
                    min="0"
                    max="30"
                    value={localConfig.descontos.basicoAnual}
                    onChange={(e) => handleDescontoChange('basicoAnual', e.target.value)}
                  />
                  <p className="text-xs text-muted-foreground">
                    Desconto padrão: 15%
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="descontoPadrao">
                    Plano Padrão Anual
                    <Badge variant="secondary" className="ml-2">0-30%</Badge>
                  </Label>
                  <Input
                    id="descontoPadrao"
                    type="number"
                    step="0.1"
                    min="0"
                    max="30"
                    value={localConfig.descontos.padraoAnual}
                    onChange={(e) => handleDescontoChange('padraoAnual', e.target.value)}
                  />
                  <p className="text-xs text-muted-foreground">
                    Desconto padrão: 18%
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="descontoPremium">
                    Plano Premium Anual
                    <Badge variant="secondary" className="ml-2">0-30%</Badge>
                  </Label>
                  <Input
                    id="descontoPremium"
                    type="number"
                    step="0.1"
                    min="0"
                    max="30"
                    value={localConfig.descontos.premiumAnual}
                    onChange={(e) => handleDescontoChange('premiumAnual', e.target.value)}
                  />
                  <p className="text-xs text-muted-foreground">
                    Desconto padrão: 20%
                  </p>
                </div>
              </div>

              {/* Exemplo de cálculo */}
              <div className="bg-muted/50 p-4 rounded-lg">
                <h4 className="text-sm font-medium mb-3">Exemplo de Cálculo</h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                  <div>
                    <p className="text-muted-foreground">Plano Básico</p>
                    <p className="font-medium">
                      Mensal: {formatarMoeda(100)}<br />
                      Anual: {formatarMoeda(100 * 12 * (1 - localConfig.descontos.basicoAnual / 100))}
                    </p>
                    <p className="text-green-600">
                      Economia: {formatarPercentual(localConfig.descontos.basicoAnual)}
                    </p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Plano Padrão</p>
                    <p className="font-medium">
                      Mensal: {formatarMoeda(150)}<br />
                      Anual: {formatarMoeda(150 * 12 * (1 - localConfig.descontos.padraoAnual / 100))}
                    </p>
                    <p className="text-green-600">
                      Economia: {formatarPercentual(localConfig.descontos.padraoAnual)}
                    </p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Plano Premium</p>
                    <p className="font-medium">
                      Mensal: {formatarMoeda(200)}<br />
                      Anual: {formatarMoeda(200 * 12 * (1 - localConfig.descontos.premiumAnual / 100))}
                    </p>
                    <p className="text-green-600">
                      Economia: {formatarPercentual(localConfig.descontos.premiumAnual)}
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Botões de Ação */}
      <div className="flex justify-between">
        <Button variant="outline" onClick={onRestoreDefault}>
          <RotateCcw className="mr-2 h-4 w-4" />
          Restaurar Padrões
        </Button>

        <div className="flex gap-2">
          <Dialog open={showHistory} onOpenChange={setShowHistory}>
            <DialogTrigger asChild>
              <Button variant="outline">
                <History className="mr-2 h-4 w-4" />
                Histórico
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Histórico de Alterações</DialogTitle>
                <DialogDescription>
                  Últimas 10 modificações na configuração
                </DialogDescription>
              </DialogHeader>
              <div className="max-h-96 overflow-y-auto">
                {localConfig.historico.length > 0 ? (
                  <div className="space-y-4">
                    {localConfig.historico.map((entry) => (
                      <div key={entry.id} className="border-b pb-4">
                        <div className="flex justify-between items-start">
                          <div>
                            <p className="font-medium">{entry.usuario}</p>
                            <p className="text-sm text-muted-foreground">{entry.campo}</p>
                            <p className="text-xs">{entry.motivo}</p>
                          </div>
                          <p className="text-xs text-muted-foreground">
                            {new Date(entry.timestamp).toLocaleString('pt-BR')}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-muted-foreground text-center py-8">
                    Nenhuma alteração registrada ainda
                  </p>
                )}
              </div>
            </DialogContent>
          </Dialog>

          <Button
            onClick={calcularImpacto}
            variant="outline"
            disabled={calculating}
          >
            <Calculator className="mr-2 h-4 w-4" />
            {calculating ? 'Calculando...' : 'Calcular Impacto'}
          </Button>

          <Button
            onClick={handleSave}
            disabled={!hasChanges || errors.length > 0}
          >
            <Save className="mr-2 h-4 w-4" />
            Salvar Alterações
          </Button>
        </div>
      </div>

      {/* Informações Adicionais */}
      <Alert>
        <Info className="h-4 w-4" />
        <AlertDescription>
          Todas as alterações nos custos afetam automaticamente o cálculo de margem de lucro
          para todos os planos ativos. Os valores são salvos no banco de dados com registro
          de auditoria para compliance.
        </AlertDescription>
      </Alert>
    </div>
  )
}