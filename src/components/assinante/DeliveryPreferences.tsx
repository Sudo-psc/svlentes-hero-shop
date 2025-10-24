/**
 * DeliveryPreferences Component - Fase 3
 * Formulário de preferências de entrega com validação e busca de CEP
 */

'use client'

import { useState, useCallback, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { motion } from 'framer-motion'
import {
  MapPin,
  Search,
  Clock,
  Bell,
  FileText,
  Save,
  X,
  CheckCircle,
  Loader2,
  AlertCircle,
  Package,
  Calendar
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { Skeleton } from '@/components/ui/skeleton'
import { formatZipCode, formatDate } from '@/lib/formatters'
import { cn } from '@/lib/utils'

/**
 * Schema de validação com Zod
 */
const deliveryPreferencesSchema = z.object({
  // Endereço
  zipCode: z
    .string()
    .min(8, 'CEP inválido')
    .regex(/^\d{5}-?\d{3}$/, 'CEP deve ter 8 dígitos'),
  street: z.string().min(3, 'Rua é obrigatória'),
  number: z.string().min(1, 'Número é obrigatório'),
  complement: z.string().optional(),
  neighborhood: z.string().min(2, 'Bairro é obrigatório'),
  city: z.string().min(2, 'Cidade é obrigatória'),
  state: z.string().length(2, 'Estado deve ter 2 letras'),

  // Preferências
  preferredTime: z.enum(['MORNING', 'AFTERNOON', 'EVENING', 'ANY']),
  frequency: z.enum(['MONTHLY', 'BIMONTHLY', 'QUARTERLY']),

  // Notificações
  notifyEmail: z.boolean(),
  notifyWhatsApp: z.boolean(),
  notifySMS: z.boolean(),

  // Instruções
  deliveryInstructions: z.string().max(500, 'Máximo 500 caracteres').optional()
})

type DeliveryPreferencesFormData = z.infer<typeof deliveryPreferencesSchema>

/**
 * Interface para preferências de entrega
 */
export interface DeliveryPreferences extends DeliveryPreferencesFormData {}

/**
 * Interface para próxima entrega
 */
interface UpcomingDelivery {
  estimatedDate: Date
  willUseNewPreferences: boolean
}

/**
 * Props do componente DeliveryPreferences
 */
interface DeliveryPreferencesProps {
  /**
   * Preferências atuais
   */
  preferences?: DeliveryPreferences

  /**
   * Informações sobre próxima entrega
   */
  upcomingDelivery?: UpcomingDelivery

  /**
   * Callback para salvar alterações
   */
  onSave?: (preferences: DeliveryPreferences) => Promise<void>

  /**
   * Estado de carregamento inicial
   */
  isLoading?: boolean

  /**
   * Estado de salvamento
   */
  isSaving?: boolean

  /**
   * Classe CSS adicional
   */
  className?: string
}

/**
 * Interface para resposta da API ViaCEP
 */
interface ViaCEPResponse {
  cep: string
  logradouro: string
  complemento: string
  bairro: string
  localidade: string
  uf: string
  erro?: boolean
}

/**
 * Componente DeliveryPreferences
 * Formulário completo de preferências de entrega com busca de CEP
 */
export function DeliveryPreferences({
  preferences,
  upcomingDelivery,
  onSave,
  isLoading = false,
  isSaving = false,
  className
}: DeliveryPreferencesProps) {
  const [isSearchingZip, setIsSearchingZip] = useState(false)
  const [zipError, setZipError] = useState<string | null>(null)
  const [showSuccess, setShowSuccess] = useState(false)
  const [isDirty, setIsDirty] = useState(false)

  // Form com React Hook Form + Zod
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors, isValid }
  } = useForm<DeliveryPreferencesFormData>({
    resolver: zodResolver(deliveryPreferencesSchema),
    defaultValues: preferences || {
      zipCode: '',
      street: '',
      number: '',
      complement: '',
      neighborhood: '',
      city: '',
      state: '',
      preferredTime: 'ANY',
      frequency: 'MONTHLY',
      notifyEmail: true,
      notifyWhatsApp: true,
      notifySMS: false,
      deliveryInstructions: ''
    },
    mode: 'onChange'
  })

  // Watch form changes
  const watchedFields = watch()

  useEffect(() => {
    if (preferences) {
      const hasChanges = Object.keys(watchedFields).some(
        (key) =>
          watchedFields[key as keyof DeliveryPreferencesFormData] !==
          preferences[key as keyof DeliveryPreferences]
      )
      setIsDirty(hasChanges)
    }
  }, [watchedFields, preferences])

  // Busca CEP via ViaCEP API
  const handleSearchZip = useCallback(async () => {
    const zipCode = watchedFields.zipCode?.replace(/\D/g, '')

    if (!zipCode || zipCode.length !== 8) {
      setZipError('Digite um CEP válido com 8 dígitos')
      return
    }

    setIsSearchingZip(true)
    setZipError(null)

    try {
      const response = await fetch(`https://viacep.com.br/ws/${zipCode}/json/`)
      const data: ViaCEPResponse = await response.json()

      if (data.erro) {
        setZipError('CEP não encontrado. Verifique e tente novamente.')
        return
      }

      // Auto-fill com dados do CEP
      setValue('street', data.logradouro, { shouldValidate: true })
      setValue('neighborhood', data.bairro, { shouldValidate: true })
      setValue('city', data.localidade, { shouldValidate: true })
      setValue('state', data.uf, { shouldValidate: true })

      // Focus no campo de número
      setTimeout(() => {
        document.getElementById('number')?.focus()
      }, 100)
    } catch (error) {
      setZipError('Erro ao buscar CEP. Tente novamente.')
    } finally {
      setIsSearchingZip(false)
    }
  }, [watchedFields.zipCode, setValue])

  // Handler para submit do formulário
  const onSubmit = useCallback(
    async (data: DeliveryPreferencesFormData) => {
      if (!onSave) return

      try {
        await onSave(data)
        setShowSuccess(true)
        setIsDirty(false)
        reset(data)

        setTimeout(() => setShowSuccess(false), 5000)
      } catch (error) {
        // Erro já tratado pelo componente pai
      }
    },
    [onSave, reset]
  )

  // Handler para cancelar alterações
  const handleCancel = useCallback(() => {
    if (preferences) {
      reset(preferences)
      setIsDirty(false)
    }
  }, [preferences, reset])

  // Variantes de animação
  const sectionVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: (custom: number) => ({
      opacity: 1,
      y: 0,
      transition: { delay: custom * 0.1, duration: 0.3 }
    })
  }

  const shakeAnimation = {
    x: [0, -10, 10, -10, 10, 0],
    transition: { duration: 0.5 }
  }

  // Loading skeleton
  if (isLoading) {
    return (
      <Card className={cn('animate-pulse', className)}>
        <CardHeader>
          <div className="h-6 w-48 bg-muted rounded" />
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-3">
            <div className="h-4 w-32 bg-muted rounded" />
            <div className="h-10 bg-muted rounded" />
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="space-y-2">
                <div className="h-4 w-24 bg-muted rounded" />
                <div className="h-10 bg-muted rounded" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MapPin className="h-5 w-5 text-cyan-600" />
          Preferências de Entrega
        </CardTitle>
      </CardHeader>

      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
          {/* Seção 1: Endereço de Entrega */}
          <motion.div
            custom={0}
            variants={sectionVariants}
            initial="hidden"
            animate="visible"
            className="space-y-4"
          >
            <div className="flex items-center gap-2 pb-2 border-b">
              <MapPin className="h-4 w-4 text-cyan-600" />
              <h3 className="font-semibold text-sm">Endereço de Entrega</h3>
            </div>

            {/* CEP com busca */}
            <div className="space-y-2">
              <Label htmlFor="zipCode">CEP</Label>
              <div className="flex gap-2">
                <div className="flex-1">
                  <Input
                    id="zipCode"
                    {...register('zipCode')}
                    placeholder="00000-000"
                    maxLength={9}
                    onChange={(e) => {
                      const formatted = formatZipCode(e.target.value)
                      setValue('zipCode', formatted, { shouldValidate: true })
                      setZipError(null)
                    }}
                    className={cn(errors.zipCode && 'border-red-500')}
                  />
                  {errors.zipCode && (
                    <motion.p
                      animate={shakeAnimation}
                      className="text-xs text-red-600 mt-1"
                    >
                      {errors.zipCode.message}
                    </motion.p>
                  )}
                  {zipError && (
                    <motion.p
                      animate={shakeAnimation}
                      className="text-xs text-red-600 mt-1"
                    >
                      {zipError}
                    </motion.p>
                  )}
                </div>
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleSearchZip}
                  disabled={isSearchingZip}
                  className="flex-shrink-0"
                >
                  {isSearchingZip ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Search className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>

            {/* Rua e Número */}
            <div className="grid gap-4 md:grid-cols-3">
              <div className="md:col-span-2 space-y-2">
                <Label htmlFor="street">Rua</Label>
                <Input
                  id="street"
                  {...register('street')}
                  placeholder="Nome da rua"
                  className={cn(errors.street && 'border-red-500')}
                />
                {errors.street && (
                  <motion.p animate={shakeAnimation} className="text-xs text-red-600">
                    {errors.street.message}
                  </motion.p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="number">Número</Label>
                <Input
                  id="number"
                  {...register('number')}
                  placeholder="123"
                  className={cn(errors.number && 'border-red-500')}
                />
                {errors.number && (
                  <motion.p animate={shakeAnimation} className="text-xs text-red-600">
                    {errors.number.message}
                  </motion.p>
                )}
              </div>
            </div>

            {/* Complemento e Bairro */}
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="complement">Complemento (Opcional)</Label>
                <Input
                  id="complement"
                  {...register('complement')}
                  placeholder="Apto, bloco, etc."
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="neighborhood">Bairro</Label>
                <Input
                  id="neighborhood"
                  {...register('neighborhood')}
                  placeholder="Nome do bairro"
                  className={cn(errors.neighborhood && 'border-red-500')}
                />
                {errors.neighborhood && (
                  <motion.p animate={shakeAnimation} className="text-xs text-red-600">
                    {errors.neighborhood.message}
                  </motion.p>
                )}
              </div>
            </div>

            {/* Cidade e Estado */}
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="city">Cidade</Label>
                <Input
                  id="city"
                  {...register('city')}
                  placeholder="Nome da cidade"
                  className={cn(errors.city && 'border-red-500')}
                />
                {errors.city && (
                  <motion.p animate={shakeAnimation} className="text-xs text-red-600">
                    {errors.city.message}
                  </motion.p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="state">Estado</Label>
                <Input
                  id="state"
                  {...register('state')}
                  placeholder="UF"
                  maxLength={2}
                  className={cn(errors.state && 'border-red-500')}
                />
                {errors.state && (
                  <motion.p animate={shakeAnimation} className="text-xs text-red-600">
                    {errors.state.message}
                  </motion.p>
                )}
              </div>
            </div>
          </motion.div>

          {/* Seção 2: Preferências de Horário */}
          <motion.div
            custom={1}
            variants={sectionVariants}
            initial="hidden"
            animate="visible"
            className="space-y-4"
          >
            <div className="flex items-center gap-2 pb-2 border-b">
              <Clock className="h-4 w-4 text-cyan-600" />
              <h3 className="font-semibold text-sm">Preferências de Horário</h3>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="preferredTime">Horário Preferido</Label>
                <Select
                  value={watchedFields.preferredTime}
                  onValueChange={(value) =>
                    setValue('preferredTime', value as any, { shouldValidate: true })
                  }
                >
                  <SelectTrigger id="preferredTime">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="MORNING">Manhã (8h - 12h)</SelectItem>
                    <SelectItem value="AFTERNOON">Tarde (12h - 18h)</SelectItem>
                    <SelectItem value="EVENING">Noite (18h - 20h)</SelectItem>
                    <SelectItem value="ANY">Qualquer horário</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="frequency">Frequência de Entrega</Label>
                <Select
                  value={watchedFields.frequency}
                  onValueChange={(value) =>
                    setValue('frequency', value as any, { shouldValidate: true })
                  }
                >
                  <SelectTrigger id="frequency">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="MONTHLY">Mensal</SelectItem>
                    <SelectItem value="BIMONTHLY">Bimestral</SelectItem>
                    <SelectItem value="QUARTERLY">Trimestral</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </motion.div>

          {/* Seção 3: Notificações */}
          <motion.div
            custom={2}
            variants={sectionVariants}
            initial="hidden"
            animate="visible"
            className="space-y-4"
          >
            <div className="flex items-center gap-2 pb-2 border-b">
              <Bell className="h-4 w-4 text-cyan-600" />
              <h3 className="font-semibold text-sm">Notificações</h3>
            </div>

            <div className="space-y-3">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="notifyEmail"
                  checked={watchedFields.notifyEmail}
                  onCheckedChange={(checked) =>
                    setValue('notifyEmail', checked as boolean)
                  }
                />
                <Label htmlFor="notifyEmail" className="cursor-pointer">
                  Receber notificações por e-mail
                </Label>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="notifyWhatsApp"
                  checked={watchedFields.notifyWhatsApp}
                  onCheckedChange={(checked) =>
                    setValue('notifyWhatsApp', checked as boolean)
                  }
                />
                <Label htmlFor="notifyWhatsApp" className="cursor-pointer">
                  Receber notificações por WhatsApp
                </Label>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="notifySMS"
                  checked={watchedFields.notifySMS}
                  onCheckedChange={(checked) => setValue('notifySMS', checked as boolean)}
                />
                <Label htmlFor="notifySMS" className="cursor-pointer">
                  Receber notificações por SMS
                </Label>
              </div>
            </div>
          </motion.div>

          {/* Seção 4: Instruções Especiais */}
          <motion.div
            custom={3}
            variants={sectionVariants}
            initial="hidden"
            animate="visible"
            className="space-y-4"
          >
            <div className="flex items-center gap-2 pb-2 border-b">
              <FileText className="h-4 w-4 text-cyan-600" />
              <h3 className="font-semibold text-sm">Instruções Especiais</h3>
            </div>

            <div className="space-y-2">
              <Label htmlFor="deliveryInstructions">
                Observações para o entregador (Opcional)
              </Label>
              <textarea
                id="deliveryInstructions"
                {...register('deliveryInstructions')}
                rows={3}
                maxLength={500}
                placeholder="Ex: Porteiro recebe entregas, Deixar com vizinho do 201, etc."
                className={cn(
                  'w-full px-3 py-2 text-sm rounded-md border border-input bg-background',
                  'focus:outline-none focus:ring-2 focus:ring-cyan-500',
                  errors.deliveryInstructions && 'border-red-500'
                )}
              />
              <div className="flex justify-between items-center">
                {errors.deliveryInstructions ? (
                  <motion.p animate={shakeAnimation} className="text-xs text-red-600">
                    {errors.deliveryInstructions.message}
                  </motion.p>
                ) : (
                  <span className="text-xs text-muted-foreground">
                    {watchedFields.deliveryInstructions?.length || 0}/500 caracteres
                  </span>
                )}
              </div>
            </div>
          </motion.div>

          {/* Preview da Próxima Entrega */}
          {upcomingDelivery && (
            <motion.div
              custom={4}
              variants={sectionVariants}
              initial="hidden"
              animate="visible"
              className="border rounded-lg p-4 bg-cyan-50/50"
            >
              <div className="flex items-start gap-3">
                <div className="rounded-full bg-cyan-100 p-2 flex-shrink-0">
                  <Package className="h-5 w-5 text-cyan-600" />
                </div>
                <div className="flex-1">
                  <p className="font-medium text-sm mb-1">Próxima Entrega</p>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                    <Calendar className="h-4 w-4" />
                    <span>Estimada para {formatDate(upcomingDelivery.estimatedDate)}</span>
                  </div>
                  {upcomingDelivery.willUseNewPreferences && isDirty && (
                    <div className="flex items-center gap-2 text-xs text-cyan-700 bg-cyan-100 rounded px-2 py-1 mt-2">
                      <AlertCircle className="h-3 w-3" />
                      <span>
                        Esta entrega usará as novas preferências após salvar
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          )}

          {/* Success Message */}
          {showSuccess && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="flex items-center gap-2 p-3 bg-green-50 border border-green-200 rounded-lg"
            >
              <CheckCircle className="h-5 w-5 text-green-600" />
              <p className="text-sm text-green-900 font-medium">
                Preferências salvas com sucesso!
              </p>
            </motion.div>
          )}

          {/* Botões de Ação */}
          <div className="flex gap-3 pt-4 border-t">
            <Button
              type="button"
              variant="outline"
              onClick={handleCancel}
              disabled={!isDirty || isSaving}
              className="flex-1"
            >
              <X className="h-4 w-4 mr-2" />
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={!isValid || !isDirty || isSaving}
              className="flex-1 bg-cyan-600 hover:bg-cyan-700"
            >
              {isSaving ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Salvando...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Salvar Alterações
                </>
              )}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
