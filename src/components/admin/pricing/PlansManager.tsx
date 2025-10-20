/**
 * Gerenciador de Planos de Assinatura
 * Interface para criar, editar e gerenciar planos com cálculo automático de margem
 */

'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
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
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  Plus,
  Edit,
  Trash2,
  Save,
  X,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Target,
  Eye,
  EyeOff,
  Calculator,
  Package,
  Star
} from 'lucide-react'

import {
  PlanoAssinatura,
  PlanCategory,
  BillingCycle,
  CustosOperacionais,
  BeneficioPlano,
  ConfigPainelCustos,
  ResumoFinanceiro
} from '@/types/pricing-calculator'
import {
  formatarMoeda,
  formatarPercentual,
  calcularCustoTotal,
  calcularMargemLucro,
  gerarResumoFinanceiro,
  getCorIndicadorMargem
} from '@/lib/pricing-calculator'

interface PlansManagerProps {
  planos: PlanoAssinatura[]
  configCustos: ConfigPainelCustos
  onSave: (plano: PlanoAssinatura) => void
  onDelete: (planoId: string) => void
  loading: boolean
}

export function PlansManager({ planos, configCustos, onSave, onDelete, loading }: PlansManagerProps) {
  const [editingPlano, setEditingPlano] = useState<PlanoAssinatura | null>(null)
  const [showDialog, setShowDialog] = useState(false)
  const [activeTab, setActiveTab] = useState('basic')
  const [resumoFinanceiro, setResumoFinanceiro] = useState<ResumoFinanceiro | null>(null)

  const createNewPlano = (): PlanoAssinatura => ({
    id: '',
    nome: '',
    categoria: 'basico',
    ciclo: 'mensal',
    precoBase: 0,
    custos: configCustos.custos,
    beneficios: [],
    ativo: true,
    createdAt: new Date(),
    updatedAt: new Date()
  })

  const handleEdit = (plano: PlanoAssinatura) => {
    setEditingPlano({ ...plano })
    setShowDialog(true)
    setActiveTab('basic')
    calculateResumo(plano)
  }

  const handleCreate = () => {
    setEditingPlano(createNewPlano())
    setShowDialog(true)
    setActiveTab('basic')
    setResumoFinanceiro(null)
  }

  const calculateResumo = (plano: PlanoAssinatura) => {
    if (plano.precoBase > 0) {
      const resumo = gerarResumoFinanceiro(plano, configCustos.descontos)
      setResumoFinanceiro(resumo)
    }
  }

  const handleFieldChange = (field: keyof PlanoAssinatura, value: any) => {
    if (!editingPlano) return

    const updated = { ...editingPlano, [field]: value }

    // Atualizar desconto baseado na categoria e ciclo
    if (field === 'categoria' || field === 'ciclo') {
      if (updated.ciclo === 'anual') {
        const descontoKey = `${updated.categoria}Anual` as keyof typeof configCustos.descontos
        updated.descontoAnual = configCustos.descontos[descontoKey]
      } else {
        updated.descontoAnual = undefined
      }
    }

    setEditingPlano(updated)
    calculateResumo(updated)
  }

  const handleBeneficioChange = (index: number, field: keyof BeneficioPlano, value: any) => {
    if (!editingPlano) return

    const beneficios = [...editingPlano.beneficios]
    beneficios[index] = { ...beneficios[index], [field]: value }
    setEditingPlano({ ...editingPlano, beneficios })
    calculateResumo({ ...editingPlano, beneficios })
  }

  const addBeneficio = () => {
    if (!editingPlano) return

    const novoBeneficio: BeneficioPlano = {
      id: Date.now().toString(),
      descricao: '',
      custo: 0,
      frequencia: 'mensal',
      incluido: true,
      quantidade: 1
    }

    setEditingPlano({
      ...editingPlano,
      beneficios: [...editingPlano.beneficios, novoBeneficio]
    })
  }

  const removeBeneficio = (index: number) => {
    if (!editingPlano) return

    const beneficios = editingPlano.beneficios.filter((_, i) => i !== index)
    setEditingPlano({ ...editingPlano, beneficios })
    calculateResumo({ ...editingPlano, beneficios })
  }

  const handleSave = () => {
    if (!editingPlano) return

    // Validações
    if (!editingPlano.nome) {
      alert('Nome do plano é obrigatório')
      return
    }

    if (editingPlano.precoBase <= 0) {
      alert('Preço base deve ser maior que zero')
      return
    }

    const planoToSave = {
      ...editingPlano,
      updatedAt: new Date()
    }

    if (!planoToSave.id) {
      planoToSave.id = Date.now().toString()
      planoToSave.createdAt = new Date()
    }

    onSave(planoToSave)
    setShowDialog(false)
    setEditingPlano(null)
    setResumoFinanceiro(null)
  }

  const handleToggleActive = (plano: PlanoAssinatura) => {
    onSave({ ...plano, ativo: !plano.ativo })
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Carregando planos...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Planos de Assinatura</h2>
          <p className="text-muted-foreground">
            Gerencie os planos e suas configurações de preço e benefícios
          </p>
        </div>
        <Button onClick={handleCreate}>
          <Plus className="mr-2 h-4 w-4" />
          Novo Plano
        </Button>
      </div>

      {/* Lista de Planos */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {planos.map((plano) => {
          const resumo = gerarResumoFinanceiro(plano, configCustos.descontos)
          return (
            <Card key={plano.id} className={`${!plano.ativo ? 'opacity-75' : ''}`}>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Badge variant={plano.categoria === 'premium' ? 'default' :
                                  plano.categoria === 'padrao' ? 'secondary' : 'outline'}>
                      {plano.categoria.toUpperCase()}
                    </Badge>
                    <Badge variant="outline">
                      {plano.ciclo === 'mensal' ? 'Mensal' : 'Anual'}
                    </Badge>
                  </div>
                  <Switch
                    checked={plano.ativo}
                    onCheckedChange={() => handleToggleActive(plano)}
                  />
                </div>
                <CardTitle className="text-lg">{plano.nome}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Preço */}
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl font-bold">{formatarMoeda(plano.precoBase)}</span>
                  <span className="text-muted-foreground">/{plano.ciclo === 'mensal' ? 'mês' : 'ano'}</span>
                </div>

                {/* Margem de Lucro */}
                <div className={`p-3 rounded-lg ${getCorIndicadorMargem(resumo.margem.percentual)}`}>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Margem de Lucro</span>
                    {resumo.margem.percentual >= 30 ? (
                      <TrendingUp className="h-4 w-4" />
                    ) : (
                      <TrendingDown className="h-4 w-4" />
                    )}
                  </div>
                  <div className="text-lg font-bold">
                    {formatarPercentual(resumo.margem.percentual)}
                  </div>
                  <div className="text-sm">
                    {formatarMoeda(resumo.margem.valorAbsoluto)} / mês
                  </div>
                </div>

                {/* Economia Anual (se aplicável) */}
                {plano.ciclo === 'anual' && resumo.economiaAnual && (
                  <div className="text-sm">
                    <span className="text-muted-foreground">Economia anual: </span>
                    <span className="text-green-600 font-medium">
                      {formatarMoeda(resumo.economiaAnual.valor)} ({formatarPercentual(resumo.economiaAnual.percentual)})
                    </span>
                  </div>
                )}

                {/* Benefícios */}
                <div className="text-sm">
                  <span className="text-muted-foreground">Benefícios: </span>
                  <span className="font-medium">{plano.beneficios.filter(b => b.incluido).length}</span>
                </div>

                {/* Ações */}
                <div className="flex gap-2 pt-2">
                  <Button variant="outline" size="sm" onClick={() => handleEdit(plano)}>
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onDelete(plano.id)}
                    className="text-destructive hover:text-destructive"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Dialog de Edição */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="max-w-4xl max-h-[90vh]">
          <DialogHeader>
            <DialogTitle>
              {editingPlano?.id ? 'Editar Plano' : 'Novo Plano'}
            </DialogTitle>
            <DialogDescription>
              Configure os detalhes do plano de assinatura
            </DialogDescription>
          </DialogHeader>

          <ScrollArea className="max-h-[60vh] pr-4">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="basic">Dados Básicos</TabsTrigger>
                <TabsTrigger value="financial">Financeiro</TabsTrigger>
                <TabsTrigger value="benefits">Benefícios</TabsTrigger>
              </TabsList>

              {/* Dados Básicos */}
              <TabsContent value="basic" className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="nome">Nome do Plano</Label>
                    <Input
                      id="nome"
                      value={editingPlano?.nome || ''}
                      onChange={(e) => handleFieldChange('nome', e.target.value)}
                      placeholder="Ex: Plano Básico Mensal"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="categoria">Categoria</Label>
                    <Select
                      value={editingPlano?.categoria || 'basico'}
                      onValueChange={(value: PlanCategory) => handleFieldChange('categoria', value)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="basico">Básico</SelectItem>
                        <SelectItem value="padrao">Padrão</SelectItem>
                        <SelectItem value="premium">Premium</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="ciclo">Ciclo de Cobrança</Label>
                    <Select
                      value={editingPlano?.ciclo || 'mensal'}
                      onValueChange={(value: BillingCycle) => handleFieldChange('ciclo', value)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="mensal">Mensal</SelectItem>
                        <SelectItem value="anual">Anual</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="preco">Preço Base (R$)</Label>
                    <Input
                      id="preco"
                      type="number"
                      step="0.01"
                      min="0"
                      value={editingPlano?.precoBase || ''}
                      onChange={(e) => handleFieldChange('precoBase', parseFloat(e.target.value) || 0)}
                    />
                  </div>
                </div>

                {editingPlano?.ciclo === 'anual' && (
                  <div className="space-y-2">
                    <Label htmlFor="desconto">Desconto Anual (%)</Label>
                    <Input
                      id="desconto"
                      type="number"
                      step="0.1"
                      min="0"
                      max="30"
                      value={editingPlano?.descontoAnual || ''}
                      onChange={(e) => handleFieldChange('descontoAnual', parseFloat(e.target.value) || 0)}
                    />
                    <p className="text-xs text-muted-foreground">
                      Deixe em branco para usar o padrão da categoria
                    </p>
                  </div>
                )}
              </TabsContent>

              {/* Financeiro */}
              <TabsContent value="financial" className="space-y-4">
                {resumoFinanceiro && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-lg flex items-center gap-2">
                          <DollarSign className="h-5 w-5" />
                          Resumo Financeiro
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="flex justify-between">
                          <span>Preço de Venda:</span>
                          <span className="font-medium">{formatarMoeda(resumoFinanceiro.precoVenda)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Custo Total:</span>
                          <span className="font-medium">{formatarMoeda(resumoFinanceiro.custoTotal)}</span>
                        </div>
                        <div className="border-t pt-4">
                          <div className={`p-3 rounded-lg ${getCorIndicadorMargem(resumoFinanceiro.margem.percentual)}`}>
                            <div className="flex justify-between items-center">
                              <span className="font-medium">Margem de Lucro:</span>
                              <span className="font-bold text-lg">
                                {formatarPercentual(resumoFinanceiro.margem.percentual)}
                              </span>
                            </div>
                            <div className="text-sm mt-1">
                              {formatarMoeda(resumoFinanceiro.margem.valorAbsoluto)} / mês
                            </div>
                          </div>
                        </div>
                        {resumoFinanceiro.economiaAnual && (
                          <div className="text-sm text-green-600">
                            <div className="flex justify-between">
                              <span>Economia Anual:</span>
                              <span className="font-medium">
                                {formatarMoeda(resumoFinanceiro.economiaAnual.valor)}
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span>Desconto:</span>
                              <span className="font-medium">
                                {formatarPercentual(resumoFinanceiro.economiaAnual.percentual)}
                              </span>
                            </div>
                          </div>
                        )}
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader>
                        <CardTitle className="text-lg flex items-center gap-2">
                          <Target className="h-5 w-5" />
                          Métricas
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="text-sm space-y-2">
                          <div className="flex justify-between">
                            <span>ROI Mensal:</span>
                            <span className="font-medium">
                              {formatarPercentual(
                                (resumoFinanceiro.margem.valorAbsoluto / resumoFinanceiro.custoTotal) * 100
                              )}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span>Payback:</span>
                            <span className="font-medium">
                              {resumoFinanceiro.custoTotal > 0
                                ? `${Math.ceil(resumoFinanceiro.custoTotal / resumoFinanceiro.margem.valorAbsoluto)} meses`
                                : 'N/A'}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span>Lucro Anual (est.):</span>
                            <span className="font-medium">
                              {formatarMoeda(resumoFinanceiro.margem.valorAbsoluto * 12)}
                            </span>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                )}
              </TabsContent>

              {/* Benefícios */}
              <TabsContent value="benefits" className="space-y-4">
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-medium">Benefícios do Plano</h3>
                  <Button variant="outline" onClick={addBeneficio}>
                    <Plus className="mr-2 h-4 w-4" />
                    Adicionar Benefício
                  </Button>
                </div>

                <div className="space-y-3">
                  {editingPlano?.beneficios.map((beneficio, index) => (
                    <Card key={beneficio.id}>
                      <CardContent className="pt-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                          <div className="space-y-2">
                            <Label>Descrição</Label>
                            <Input
                              value={beneficio.descricao}
                              onChange={(e) => handleBeneficioChange(index, 'descricao', e.target.value)}
                              placeholder="Ex: Consulta oftalmológica"
                            />
                          </div>

                          <div className="space-y-2">
                            <Label>Custo (R$)</Label>
                            <Input
                              type="number"
                              step="0.01"
                              min="0"
                              value={beneficio.custo}
                              onChange={(e) => handleBeneficioChange(index, 'custo', parseFloat(e.target.value) || 0)}
                            />
                          </div>

                          <div className="space-y-2">
                            <Label>Frequência</Label>
                            <Select
                              value={beneficio.frequencia}
                              onValueChange={(value: any) => handleBeneficioChange(index, 'frequencia', value)}
                            >
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="unico">Único</SelectItem>
                                <SelectItem value="mensal">Mensal</SelectItem>
                                <SelectItem value="trimestral">Trimestral</SelectItem>
                                <SelectItem value="anual">Anual</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>

                          <div className="space-y-2">
                            <Label>Quantidade</Label>
                            <Input
                              type="number"
                              min="1"
                              value={beneficio.quantidade || 1}
                              onChange={(e) => handleBeneficioChange(index, 'quantidade', parseInt(e.target.value) || 1)}
                            />
                          </div>
                        </div>

                        <div className="flex justify-between items-center mt-4">
                          <div className="flex items-center gap-2">
                            <Switch
                              checked={beneficio.incluido}
                              onCheckedChange={(checked) => handleBeneficioChange(index, 'incluido', checked)}
                            />
                            <Label className="text-sm">Incluído no plano</Label>
                          </div>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => removeBeneficio(index)}
                            className="text-destructive"
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </TabsContent>
            </Tabs>
          </ScrollArea>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDialog(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSave}>
              <Save className="mr-2 h-4 w-4" />
              Salvar Plano
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}