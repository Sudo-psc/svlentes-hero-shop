/**
 * PrescriptionManager Component - Fase 3
 * Gerenciamento de prescrições com upload, preview e histórico
 */

'use client'

import { useState, useCallback, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Upload,
  Eye,
  FileText,
  Calendar,
  AlertCircle,
  CheckCircle,
  X,
  ChevronDown,
  ChevronUp,
  Clock,
  Download
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger
} from '@/components/ui/tooltip'
import { formatDate, formatRelativeTime } from '@/lib/formatters'
import { cn } from '@/lib/utils'

/**
 * Interface para prescrição de olho individual
 */
interface EyePrescription {
  sphere: string
  cylinder: string
  axis: string
  addition?: string
}

/**
 * Interface para prescrição atual
 */
interface CurrentPrescription {
  id: string
  uploadedAt: Date
  expiresAt: Date
  status: 'VALID' | 'EXPIRING_SOON' | 'EXPIRED'
  daysUntilExpiry: number
  fileUrl: string
  fileName: string
  leftEye: EyePrescription
  rightEye: EyePrescription
}

/**
 * Interface para histórico de prescrições
 */
interface PrescriptionHistory {
  id: string
  uploadedAt: Date
  expiresAt: Date
  fileName: string
  fileUrl: string
  status: 'active' | 'expired' | 'replaced'
}

/**
 * Props do componente PrescriptionManager
 */
interface PrescriptionManagerProps {
  /**
   * Prescrição atual do assinante
   */
  currentPrescription?: CurrentPrescription

  /**
   * Histórico de prescrições
   */
  history?: PrescriptionHistory[]

  /**
   * Callback para upload de nova prescrição
   */
  onUpload?: (file: File) => Promise<void>

  /**
   * Estado de carregamento
   */
  isLoading?: boolean

  /**
   * Classe CSS adicional
   */
  className?: string
}

/**
 * Retorna a cor do badge baseado no status
 */
function getStatusColor(status: CurrentPrescription['status']) {
  const colorMap = {
    VALID: 'bg-green-50 text-green-600 border-green-200',
    EXPIRING_SOON: 'bg-amber-50 text-amber-600 border-amber-200',
    EXPIRED: 'bg-red-50 text-red-600 border-red-200'
  }
  return colorMap[status]
}

/**
 * Retorna o texto do status
 */
function getStatusText(status: CurrentPrescription['status']) {
  const textMap = {
    VALID: 'Válida',
    EXPIRING_SOON: 'Expirando em breve',
    EXPIRED: 'Expirada'
  }
  return textMap[status]
}

/**
 * Componente PrescriptionManager
 * Gerencia prescrições com upload drag-and-drop, preview e histórico
 */
export function PrescriptionManager({
  currentPrescription,
  history = [],
  onUpload,
  isLoading = false,
  className
}: PrescriptionManagerProps) {
  const [isDragging, setIsDragging] = useState(false)
  const [previewFile, setPreviewFile] = useState<File | null>(null)
  const [showHistory, setShowHistory] = useState(false)
  const [uploadError, setUploadError] = useState<string | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Validação de arquivo
  const validateFile = useCallback((file: File): string | null => {
    const maxSize = 5 * 1024 * 1024 // 5MB
    const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png']

    if (!allowedTypes.includes(file.type)) {
      return 'Formato não suportado. Use PDF, JPG ou PNG.'
    }

    if (file.size > maxSize) {
      return 'Arquivo muito grande. Tamanho máximo: 5MB.'
    }

    return null
  }, [])

  // Handler para drag events
  const handleDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(true)
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)
  }, [])

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
  }, [])

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      e.stopPropagation()
      setIsDragging(false)

      const files = e.dataTransfer.files
      if (files && files.length > 0) {
        const file = files[0]
        const error = validateFile(file)
        if (error) {
          setUploadError(error)
        } else {
          setUploadError(null)
          setPreviewFile(file)
        }
      }
    },
    [validateFile]
  )

  // Handler para file input
  const handleFileSelect = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = e.target.files
      if (files && files.length > 0) {
        const file = files[0]
        const error = validateFile(file)
        if (error) {
          setUploadError(error)
        } else {
          setUploadError(null)
          setPreviewFile(file)
        }
      }
    },
    [validateFile]
  )

  // Handler para confirmar upload
  const handleConfirmUpload = useCallback(async () => {
    if (!previewFile || !onUpload) return

    setIsUploading(true)
    setUploadError(null)

    try {
      await onUpload(previewFile)
      setPreviewFile(null)
    } catch (error) {
      setUploadError('Erro ao fazer upload. Tente novamente.')
    } finally {
      setIsUploading(false)
    }
  }, [previewFile, onUpload])

  // Handler para cancelar upload
  const handleCancelUpload = useCallback(() => {
    setPreviewFile(null)
    setUploadError(null)
  }, [])

  // Calcula progresso até expiração
  const expiryProgress = currentPrescription
    ? Math.max(0, Math.min(100, (currentPrescription.daysUntilExpiry / 365) * 100))
    : 0

  // Variantes de animação
  const containerVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.3 }
    }
  }

  const pulseVariants = {
    pulse: {
      scale: [1, 1.05, 1],
      transition: {
        duration: 2,
        repeat: Infinity,
        ease: 'easeInOut'
      }
    }
  }

  // Loading skeleton
  if (isLoading) {
    return (
      <Card className={cn('animate-pulse', className)}>
        <CardHeader>
          <div className="h-6 w-48 bg-muted rounded" />
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="h-32 bg-muted rounded" />
          <div className="h-24 bg-muted rounded" />
        </CardContent>
      </Card>
    )
  }

  return (
    <TooltipProvider delayDuration={200}>
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className={className}
      >
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-cyan-600" />
                Prescrição Médica
              </span>
              {currentPrescription && (
                <Badge
                  variant="outline"
                  className={cn('border', getStatusColor(currentPrescription.status))}
                >
                  {getStatusText(currentPrescription.status)}
                </Badge>
              )}
            </CardTitle>
          </CardHeader>

          <CardContent className="space-y-6">
            {/* Prescrição Atual */}
            {currentPrescription ? (
              <div className="space-y-4">
                {/* Progress Ring e Informações */}
                <div className="flex items-start gap-4">
                  {/* Progress Ring */}
                  <div className="relative flex-shrink-0">
                    <svg className="w-24 h-24 -rotate-90">
                      <circle
                        cx="48"
                        cy="48"
                        r="40"
                        stroke="currentColor"
                        strokeWidth="8"
                        fill="none"
                        className="text-muted"
                      />
                      <circle
                        cx="48"
                        cy="48"
                        r="40"
                        stroke="currentColor"
                        strokeWidth="8"
                        fill="none"
                        strokeDasharray={`${2 * Math.PI * 40}`}
                        strokeDashoffset={`${2 * Math.PI * 40 * (1 - expiryProgress / 100)}`}
                        className={cn(
                          'transition-all duration-500',
                          currentPrescription.status === 'VALID'
                            ? 'text-green-500'
                            : currentPrescription.status === 'EXPIRING_SOON'
                            ? 'text-amber-500'
                            : 'text-red-500'
                        )}
                        strokeLinecap="round"
                      />
                    </svg>
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                      <span className="text-2xl font-bold">
                        {currentPrescription.daysUntilExpiry}
                      </span>
                      <span className="text-[10px] text-muted-foreground">dias</span>
                    </div>
                  </div>

                  {/* Informações da Prescrição */}
                  <div className="flex-1 space-y-2">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Calendar className="h-4 w-4" />
                      <span>
                        Enviada em {formatDate(currentPrescription.uploadedAt)}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Clock className="h-4 w-4" />
                      <span>
                        Válida até {formatDate(currentPrescription.expiresAt)}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <FileText className="h-4 w-4" />
                      <span className="truncate">{currentPrescription.fileName}</span>
                    </div>
                  </div>
                </div>

                {/* Alerta de Expiração */}
                {currentPrescription.status !== 'VALID' && (
                  <motion.div
                    variants={pulseVariants}
                    animate={
                      currentPrescription.status === 'EXPIRING_SOON' ? 'pulse' : undefined
                    }
                    className={cn(
                      'flex items-start gap-3 p-3 rounded-lg',
                      currentPrescription.status === 'EXPIRING_SOON'
                        ? 'bg-amber-50 border border-amber-200'
                        : 'bg-red-50 border border-red-200'
                    )}
                  >
                    <AlertCircle
                      className={cn(
                        'h-5 w-5 flex-shrink-0',
                        currentPrescription.status === 'EXPIRING_SOON'
                          ? 'text-amber-600'
                          : 'text-red-600'
                      )}
                    />
                    <div className="flex-1">
                      <p
                        className={cn(
                          'text-sm font-medium',
                          currentPrescription.status === 'EXPIRING_SOON'
                            ? 'text-amber-900'
                            : 'text-red-900'
                        )}
                      >
                        {currentPrescription.status === 'EXPIRING_SOON'
                          ? 'Sua prescrição expira em breve'
                          : 'Sua prescrição está expirada'}
                      </p>
                      <p
                        className={cn(
                          'text-xs mt-1',
                          currentPrescription.status === 'EXPIRING_SOON'
                            ? 'text-amber-700'
                            : 'text-red-700'
                        )}
                      >
                        Envie uma nova prescrição para continuar recebendo suas lentes.
                      </p>
                    </div>
                  </motion.div>
                )}

                {/* Tabela de Graus */}
                <div className="border rounded-lg overflow-hidden">
                  <table className="w-full text-sm">
                    <thead className="bg-muted">
                      <tr>
                        <th className="px-4 py-2 text-left font-medium">Olho</th>
                        <th className="px-4 py-2 text-left font-medium">Esférico</th>
                        <th className="px-4 py-2 text-left font-medium">Cilíndrico</th>
                        <th className="px-4 py-2 text-left font-medium">Eixo</th>
                        {currentPrescription.leftEye.addition && (
                          <th className="px-4 py-2 text-left font-medium">Adição</th>
                        )}
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      <tr>
                        <td className="px-4 py-3 flex items-center gap-2">
                          <Eye className="h-4 w-4 text-cyan-600" />
                          <span className="font-medium">OE</span>
                        </td>
                        <td className="px-4 py-3">
                          {currentPrescription.leftEye.sphere}
                        </td>
                        <td className="px-4 py-3">
                          {currentPrescription.leftEye.cylinder}
                        </td>
                        <td className="px-4 py-3">{currentPrescription.leftEye.axis}°</td>
                        {currentPrescription.leftEye.addition && (
                          <td className="px-4 py-3">
                            {currentPrescription.leftEye.addition}
                          </td>
                        )}
                      </tr>
                      <tr>
                        <td className="px-4 py-3 flex items-center gap-2">
                          <Eye className="h-4 w-4 text-cyan-600" />
                          <span className="font-medium">OD</span>
                        </td>
                        <td className="px-4 py-3">
                          {currentPrescription.rightEye.sphere}
                        </td>
                        <td className="px-4 py-3">
                          {currentPrescription.rightEye.cylinder}
                        </td>
                        <td className="px-4 py-3">{currentPrescription.rightEye.axis}°</td>
                        {currentPrescription.rightEye.addition && (
                          <td className="px-4 py-3">
                            {currentPrescription.rightEye.addition}
                          </td>
                        )}
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            ) : (
              <div className="text-center py-8">
                <FileText className="h-12 w-12 mx-auto mb-3 text-muted-foreground/50" />
                <p className="text-sm text-muted-foreground mb-4">
                  Nenhuma prescrição cadastrada
                </p>
              </div>
            )}

            {/* Upload Zone */}
            <div className="space-y-3">
              <motion.div
                animate={
                  currentPrescription?.status === 'EXPIRING_SOON' ||
                  currentPrescription?.status === 'EXPIRED'
                    ? pulseVariants.pulse
                    : undefined
                }
              >
                <div
                  onDragEnter={handleDragEnter}
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  className={cn(
                    'relative border-2 border-dashed rounded-lg p-6 transition-all duration-200',
                    isDragging
                      ? 'border-cyan-500 bg-cyan-50/50'
                      : 'border-muted hover:border-cyan-300 hover:bg-cyan-50/30'
                  )}
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".pdf,.jpg,.jpeg,.png"
                    onChange={handleFileSelect}
                    className="hidden"
                  />

                  <div className="flex flex-col items-center gap-3">
                    <div className="rounded-full bg-cyan-50 p-3">
                      <Upload className="h-6 w-6 text-cyan-600" />
                    </div>
                    <div className="text-center">
                      <p className="text-sm font-medium mb-1">
                        Arraste sua prescrição aqui ou
                      </p>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => fileInputRef.current?.click()}
                        className="text-cyan-600 border-cyan-300 hover:bg-cyan-50"
                      >
                        Selecione um arquivo
                      </Button>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      PDF, JPG ou PNG até 5MB
                    </p>
                  </div>
                </div>
              </motion.div>

              {/* Erro de Upload */}
              {uploadError && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg"
                >
                  <AlertCircle className="h-4 w-4 text-red-600 flex-shrink-0" />
                  <p className="text-sm text-red-900">{uploadError}</p>
                </motion.div>
              )}
            </div>

            {/* Preview Modal */}
            <AnimatePresence>
              {previewFile && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="border rounded-lg p-4 bg-muted/30"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="rounded-lg bg-cyan-50 p-2">
                        <FileText className="h-5 w-5 text-cyan-600" />
                      </div>
                      <div>
                        <p className="text-sm font-medium">Preview</p>
                        <p className="text-xs text-muted-foreground truncate max-w-[250px]">
                          {previewFile.name}
                        </p>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={handleCancelUpload}
                      disabled={isUploading}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>

                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      onClick={handleCancelUpload}
                      disabled={isUploading}
                      className="flex-1"
                    >
                      Cancelar
                    </Button>
                    <Button
                      onClick={handleConfirmUpload}
                      disabled={isUploading}
                      className="flex-1 bg-cyan-600 hover:bg-cyan-700"
                    >
                      {isUploading ? (
                        <>
                          <motion.div
                            animate={{ rotate: 360 }}
                            transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                            className="mr-2"
                          >
                            <Upload className="h-4 w-4" />
                          </motion.div>
                          Enviando...
                        </>
                      ) : (
                        <>
                          <CheckCircle className="h-4 w-4 mr-2" />
                          Confirmar Upload
                        </>
                      )}
                    </Button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Histórico de Prescrições */}
            {history.length > 0 && (
              <div className="border-t pt-4">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowHistory(!showHistory)}
                  className="w-full justify-between text-sm"
                >
                  <span className="flex items-center gap-2">
                    <Clock className="h-4 w-4" />
                    Histórico de Prescrições ({history.length})
                  </span>
                  {showHistory ? (
                    <ChevronUp className="h-4 w-4" />
                  ) : (
                    <ChevronDown className="h-4 w-4" />
                  )}
                </Button>

                <AnimatePresence>
                  {showHistory && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.3 }}
                      className="overflow-hidden"
                    >
                      <div className="mt-3 space-y-2">
                        {history.map((item) => (
                          <div
                            key={item.id}
                            className="flex items-center justify-between p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
                          >
                            <div className="flex items-center gap-3 flex-1 min-w-0">
                              <FileText className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium truncate">
                                  {item.fileName}
                                </p>
                                <p className="text-xs text-muted-foreground">
                                  {formatDate(item.uploadedAt)} -{' '}
                                  {formatDate(item.expiresAt)}
                                </p>
                              </div>
                            </div>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  asChild
                                  className="flex-shrink-0"
                                >
                                  <a
                                    href={item.fileUrl}
                                    download
                                    target="_blank"
                                    rel="noopener noreferrer"
                                  >
                                    <Download className="h-4 w-4" />
                                  </a>
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>Baixar prescrição</p>
                              </TooltipContent>
                            </Tooltip>
                          </div>
                        ))}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>
    </TooltipProvider>
  )
}
