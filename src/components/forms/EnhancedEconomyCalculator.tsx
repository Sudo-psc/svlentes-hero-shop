'use client'
import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { 
  Calculator, 
  Share2, 
  Save, 
  Trash2, 
  TrendingUp, 
  Info,
  Clock,
  RefreshCw
} from 'lucide-react'
import { calculateEconomy, formatCurrency, formatPercentage, validateCustomUsageDays } from '@/lib/calculator'
import { usagePatterns, lensTypes } from '@/data/calculator-data'
import {
  getSavedCalculations,
  saveCalculation,
  deleteCalculation
} from '@/lib/savedCalculations'
import CountUp from 'react-countup'
import { CalculatorInput, CalculatorResult, LensTypeId, UsagePatternId, SavedCalculation } from '@/types/calculator'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  Legend,
  ResponsiveContainer
} from 'recharts'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { cn } from '@/lib/utils'
import { type SavedCalculation } from '@/types/calculator'
interface Props {
  onContinueAction?: () => void
}
export function EnhancedEconomyCalculator({ onContinueAction }: Props) {
  const [lensType, setLensType] = useState<LensTypeId>('daily')
  const [usagePattern, setUsagePattern] = useState<UsagePatternId>('regular')
  const [customUsageDays, setCustomUsageDays] = useState<string>('')
  const [customUsageDaysError, setCustomUsageDaysError] = useState<string>('')
  const [showCustomUsage, setShowCustomUsage] = useState(false)
  const [showResult, setShowResult] = useState(false)
  const [result, setResult] = useState<CalculatorResult | null>(null)
  const [savedCalculations, setSavedCalculations] = useState<SavedCalculation[]>([])
  const [showSaved, setShowSaved] = useState(false)
  useEffect(() => {
    setSavedCalculations(getSavedCalculations())
  }, [])
  const handleCalculate = () => {
    // Validar customUsageDays se estiver em modo customizado
    let validatedCustomDays: number | undefined = undefined
    if (showCustomUsage && customUsageDays) {
      validatedCustomDays = validateCustomUsageDays(customUsageDays)
      if (validatedCustomDays === null) {
        setCustomUsageDaysError('Digite um número entre 1 e 31')
        return
      }
      setCustomUsageDaysError('')
    }
    const input: CalculatorInput = {
      lensType,
      usagePattern,
      customUsageDays: validatedCustomDays
    }
    try {
      const calculationResult = calculateEconomy(input)
      setResult(calculationResult)
      setShowResult(true)
    } catch (error) {
      console.error('Erro ao calcular:', error)
      alert('Erro ao calcular. Por favor, verifique os valores.')
    }
  }
  const handleSave = () => {
    if (!result) return
    const validatedCustomDays = showCustomUsage && customUsageDays
      ? validateCustomUsageDays(customUsageDays)
      : undefined
    const input: CalculatorInput = {
      lensType,
      usagePattern,
      customUsageDays: validatedCustomDays ?? undefined
    }
    saveCalculation(input, result)
    setSavedCalculations(getSavedCalculations())
  }
  const handleShare = async () => {
    if (!result) return
    const shareData = {
      title: 'Minha Economia com SV Lentes',
      text: `Economizaria ${formatCurrency(result.monthlySavings)}/mês (${formatPercentage(result.savingsPercentage)}) com SV Lentes!`,
      url: window.location.href
    }
    try {
      if (navigator.share) {
        await navigator.share(shareData)
      } else {
        await navigator.clipboard.writeText(
          `${shareData.text}\n${shareData.url}`
        )
        alert('Link copiado para área de transferência!')
      }
    } catch (error) {
      console.error('Error sharing:', error)
    }
  }
  const handleLoadSaved = (saved: SavedCalculation) => {
    setLensType(saved.input.lensType)
    setUsagePattern(saved.input.usagePattern)
    if (saved.input.customUsageDays) {
      setShowCustomUsage(true)
      setCustomUsageDays(saved.input.customUsageDays.toString())
    } else {
      setShowCustomUsage(false)
      setCustomUsageDays('')
    }
    setCustomUsageDaysError('')
    setResult(saved.result)
    setShowResult(true)
    setShowSaved(false)
  }
  const handleDeleteSaved = (id: string) => {
    deleteCalculation(id)
    setSavedCalculations(getSavedCalculations())
  }
  const chartData = result ? [
    {
      name: 'Atual',
      'Gasto Mensal': result.monthlyAvulso,
      'Gasto Anual': result.yearlyAvulso
    },
    {
      name: 'Com Assinatura',
      'Gasto Mensal': result.monthlySubscription,
      'Gasto Anual': result.yearlySubscription
    }
  ] : []
  const selectedUsagePattern = usagePatterns.find(p => p.id === usagePattern)
  const selectedLensType = lensTypes.find(l => l.id === lensType)
  return (
    <TooltipProvider>
      <div className="bg-white rounded-lg shadow-lg border border-gray-200 p-6">
        <div className="text-center mb-6">
          <div className="w-12 h-12 bg-cyan-100 rounded-full flex items-center justify-center mx-auto mb-3">
            <Calculator className="w-6 h-6 text-cyan-600" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            Calculadora de Economia Avançada
          </h3>
          <p className="text-sm text-gray-600">
            Personalize seu cálculo e descubra quanto pode economizar
          </p>
        </div>
        {savedCalculations.length > 0 && !showResult && (
          <div className="mb-4">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowSaved(!showSaved)}
              className="w-full"
            >
              <Clock className="w-4 h-4 mr-2" />
              Ver Cálculos Salvos ({savedCalculations.length})
            </Button>
          </div>
        )}
        {showSaved && (
          <div className="mb-6 space-y-2 max-h-60 overflow-y-auto">
            {savedCalculations.map((saved) => (
              <div
                key={saved.id}
                className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50"
              >
                <button
                  onClick={() => handleLoadSaved(saved)}
                  className="flex-1 text-left"
                >
                  <div className="text-sm font-medium text-gray-900">
                    {formatCurrency(saved.result.monthlySavings)}/mês
                  </div>
                  <div className="text-xs text-gray-500">
                    {new Date(saved.timestamp).toLocaleDateString('pt-BR')}
                  </div>
                </button>
                <button
                  onClick={() => handleDeleteSaved(saved.id)}
                  className="p-2 text-red-600 hover:bg-red-50 rounded"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        )}
        {!showResult ? (
          <div className="space-y-5">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <label className="block text-sm font-medium text-gray-700">
                  Tipo de Lente
                </label>
                <Tooltip>
                  <TooltipTrigger>
                    <Info className="w-4 h-4 text-gray-400" />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p className="max-w-xs">
                      Lentes diárias são descartadas após cada uso. Semanais duram 7 dias. 
                      Mensais duram 30 dias com cuidados adequados.
                    </p>
                  </TooltipContent>
                </Tooltip>
              </div>
              <div className="grid grid-cols-3 gap-2">
                {lensTypes.map((type) => (
                  <button
                    key={type.id}
                    onClick={() => setLensType(type.id)}
                    className={cn(
                      "px-3 py-2 text-sm font-medium rounded-lg border transition-colors",
                      lensType === type.id
                        ? 'bg-cyan-600 text-white border-cyan-600'
                        : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                    )}
                  >
                    {type.name.replace('Lentes ', '')}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <div className="flex items-center gap-2 mb-2">
                <label className="block text-sm font-medium text-gray-700">
                  Frequência de Uso
                </label>
                <Tooltip>
                  <TooltipTrigger>
                    <Info className="w-4 h-4 text-gray-400" />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p className="max-w-xs">
                      Escolha com que frequência você usa lentes de contato. 
                      Você pode personalizar os dias exatos abaixo.
                    </p>
                  </TooltipContent>
                </Tooltip>
              </div>
              <div className="grid grid-cols-3 gap-2">
                {usagePatterns.map((pattern) => (
                  <button
                    key={pattern.id}
                    onClick={() => {
                      setUsagePattern(pattern.id)
                      setShowCustomUsage(false)
                      setCustomUsageDaysError('')
                    }}
                    className={cn(
                      "px-3 py-2 text-sm font-medium rounded-lg border transition-colors",
                      usagePattern === pattern.id && !showCustomUsage
                        ? 'bg-cyan-600 text-white border-cyan-600'
                        : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                    )}
                  >
                    <div>{pattern.name.replace('Uso ', '')}</div>
                    <div className="text-xs opacity-80">{pattern.daysPerMonth} dias</div>
                  </button>
                ))}
              </div>
              <button
                onClick={() => setShowCustomUsage(!showCustomUsage)}
                className="mt-2 text-sm text-cyan-600 hover:text-cyan-700 flex items-center gap-1"
              >
                <RefreshCw className="w-3 h-3" />
                Personalizar dias de uso
              </button>
            </div>
            {showCustomUsage && (
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <label className="block text-sm font-medium text-gray-700">
                    Dias de uso por mês
                  </label>
                  <Tooltip>
                    <TooltipTrigger>
                      <Info className="w-4 h-4 text-gray-400" />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p className="max-w-xs">
                        Informe quantos dias por mês você usa lentes de contato (1-31 dias)
                      </p>
                    </TooltipContent>
                  </Tooltip>
                </div>
                <Input
                  type="number"
                  min="1"
                  max="31"
                  value={customUsageDays}
                  onChange={(e) => {
                    setCustomUsageDays(e.target.value)
                    setCustomUsageDaysError('')
                  }}
                  placeholder="Ex: 15"
                  className={cn(customUsageDaysError && 'border-red-500')}
                />
                {customUsageDaysError && (
                  <p className="text-sm text-red-600 mt-1">{customUsageDaysError}</p>
                )}
              </div>
            )}
            <div className="bg-cyan-50 rounded-lg p-4 border border-cyan-100">
              <h4 className="font-semibold text-gray-900 mb-2 text-sm">Estimativa Atual</h4>
              <div className="space-y-1 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Tipo de lente:</span>
                  <span className="font-medium">{selectedLensType?.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Dias de uso/mês:</span>
                  <span className="font-medium">
                    {showCustomUsage && customUsageDays 
                      ? customUsageDays 
                      : selectedUsagePattern?.daysPerMonth} dias
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Preço por lente:</span>
                  <span className="font-medium">{formatCurrency(selectedLensType?.avulsoPrice || 0)}</span>
                </div>
              </div>
            </div>
            <Button
              onClick={handleCalculate}
              className="w-full flex items-center justify-center space-x-2 font-semibold"
              disabled={showCustomUsage && (!customUsageDays || parseInt(customUsageDays) < 1)}
            >
              <Calculator className="w-5 h-5" />
              <span>Calcular Economia</span>
            </Button>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="text-center p-6 bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg border border-green-200">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <TrendingUp className="w-8 h-8 text-green-600" />
              </div>
              <h4 className="text-xl font-bold text-gray-900 mb-2">
                Economia de{' '}
                <CountUp
                  start={0}
                  end={result.monthlySavings}
                  duration={1.5}
                  decimals={2}
                  decimal=","
                  prefix="R$ "
                  separator="."
                />{' '}
                por mês!
              </h4>
              <p className="text-gray-600 mb-4">
                Total anual:{' '}
                <CountUp
                  start={0}
                  end={result.yearlySavings}
                  duration={2}
                  decimals={2}
                  decimal=","
                  prefix="R$ "
                  separator="."
                />{' '}
                ({formatPercentage(result.savingsPercentage)} de desconto)
              </p>
            </div>
            <div>
              <h4 className="font-semibold text-gray-900 mb-3">Comparação Visual</h4>
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <RechartsTooltip 
                    formatter={(value: number) => formatCurrency(value)}
                  />
                  <Legend />
                  <Bar dataKey="Gasto Mensal" fill="#06b6d4" />
                  <Bar dataKey="Gasto Anual" fill="#0891b2" />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="bg-white rounded-lg p-4 border border-gray-200">
              <h4 className="font-semibold text-gray-900 mb-3 text-sm">Detalhamento</h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Custo atual (mensal):</span>
                  <span className="font-medium">{formatCurrency(result.monthlyAvulso)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Com assinatura (mensal):</span>
                  <span className="font-medium text-cyan-600">{formatCurrency(result.monthlySubscription)}</span>
                </div>
                <div className="pt-2 border-t">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Economia anual:</span>
                    <span className="font-bold text-green-600">{formatCurrency(result.yearlySavings)}</span>
                  </div>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Plano recomendado:</span>
                  <span className="font-medium">{result.recommendedPlan === 'basic' ? 'Básico' : 'Premium'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Consultas incluídas/ano:</span>
                  <span className="font-medium">{result.includedConsultations}</span>
                </div>
              </div>
            </div>
            <div className="flex gap-2">
              <Button
                onClick={handleShare}
                variant="outline"
                className="flex-1"
              >
                <Share2 className="w-4 h-4 mr-2" />
                Compartilhar
              </Button>
              <Button
                onClick={handleSave}
                variant="outline"
                className="flex-1"
              >
                <Save className="w-4 h-4 mr-2" />
                Salvar
              </Button>
            </div>
            <Button
              onClick={() => {
                setShowResult(false)
                if (onContinueAction) onContinueAction()
              }}
              className="w-full"
            >
              Continuar
            </Button>
            <button
              onClick={() => setShowResult(false)}
              className="w-full text-sm text-gray-500 hover:text-gray-700 transition-colors"
            >
              ← Refazer cálculo
            </button>
          </div>
        )}
      </div>
    </TooltipProvider>
  )
}