'use client'
import React, { useState } from 'react'
import { motion } from 'framer-motion'
import {
  FileText,
  AlertTriangle,
  CheckCircle,
  Clock,
  Eye,
  Download,
  Upload,
  Calendar,
  User,
  Stethoscope,
  Shield,
  X,
  Plus
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'
interface Prescription {
  id: string
  customerId: string
  customerName: string
  customerEmail: string
  doctorName: string
  doctorCRM: string
  doctorCRMState: string
  issueDate: Date
  expiryDate: Date
  status: 'valid' | 'expired' | 'pending' | 'rejected'
  prescriptionUrl?: string
  notes?: string
  validations: {
    doctorSignature: boolean
    crmVerification: boolean
    dateValidity: boolean
    patientMatch: boolean
  }
}
const mockPrescriptions: Prescription[] = [
  {
    id: '1',
    customerId: '1',
    customerName: 'Ana Maria Silva',
    customerEmail: 'ana.silva@email.com',
    doctorName: 'Dr. Philipe Saraiva Cruz',
    doctorCRM: 'CRM-MG 69.870',
    doctorCRMState: 'MG',
    issueDate: new Date('2024-01-15'),
    expiryDate: new Date('2024-07-15'),
    status: 'valid',
    prescriptionUrl: '/prescriptions/prescription_1.pdf',
    notes: 'Prescrição para lentes de contato mensais',
    validations: {
      doctorSignature: true,
      crmVerification: true,
      dateValidity: true,
      patientMatch: true
    }
  },
  {
    id: '2',
    customerId: '2',
    customerName: 'Carlos Alberto Santos',
    customerEmail: 'carlos.santos@email.com',
    doctorName: 'Dr. João Pedro Silva',
    doctorCRM: 'CRM-SP 123.456',
    doctorCRMState: 'SP',
    issueDate: new Date('2023-12-01'),
    expiryDate: new Date('2024-06-01'),
    status: 'expired',
    prescriptionUrl: '/prescriptions/prescription_2.pdf',
    notes: 'Prescrição expirada - requer renovação',
    validations: {
      doctorSignature: true,
      crmVerification: true,
      dateValidity: false,
      patientMatch: true
    }
  },
  {
    id: '3',
    customerId: '3',
    customerName: 'Maria José Oliveira',
    customerEmail: 'maria.oliveira@email.com',
    doctorName: 'Dra. Paula Costa',
    doctorCRM: 'CRM-RJ 789.012',
    doctorCRMState: 'RJ',
    issueDate: new Date('2024-01-20'),
    expiryDate: new Date('2025-01-20'),
    status: 'pending',
    notes: 'Aguardando validação da assinatura',
    validations: {
      doctorSignature: false,
      crmVerification: true,
      dateValidity: true,
      patientMatch: true
    }
  }
]
interface PrescriptionValidatorProps {
  customerId?: string
  customerName?: string
  onValidationComplete?: (prescription: Prescription) => void
}
export function PrescriptionValidator({ customerId, customerName, onValidationComplete }: PrescriptionValidatorProps) {
  const [prescriptions] = useState<Prescription[]>(mockPrescriptions)
  const [selectedPrescription, setSelectedPrescription] = useState<Prescription | null>(null)
  const [showUploadModal, setShowUploadModal] = useState(false)
  const [filterStatus, setFilterStatus] = useState<string>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [validationError, setValidationError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [uploadError, setUploadError] = useState<string | null>(null)
  const filteredPrescriptions = prescriptions.filter(prescription => {
    const matchesCustomer = !customerId || prescription.customerId === customerId
    const matchesSearch = prescription.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         prescription.doctorName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         prescription.doctorCRM.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesStatus = filterStatus === 'all' || prescription.status === filterStatus
    return matchesCustomer && matchesSearch && matchesStatus
  })
  const getStatusColor = (status: Prescription['status']) => {
    switch (status) {
      case 'valid': return 'bg-green-100 text-green-800 border-green-200'
      case 'expired': return 'bg-red-100 text-red-800 border-red-200'
      case 'pending': return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 'rejected': return 'bg-red-100 text-red-800 border-red-200'
    }
  }
  const getStatusIcon = (status: Prescription['status']) => {
    switch (status) {
      case 'valid': return <CheckCircle className="h-4 w-4" />
      case 'expired': return <X className="h-4 w-4" />
      case 'pending': return <Clock className="h-4 w-4" />
      case 'rejected': return <AlertTriangle className="h-4 w-4" />
    }
  }
  const getValidationColor = (isValid: boolean) => {
    return isValid ? 'text-green-600 bg-green-50' : 'text-red-600 bg-red-50'
  }
  const handleViewPrescription = (prescription: Prescription) => {
    setSelectedPrescription(prescription)
  }
  const handleValidatePrescription = async (prescription: Prescription) => {
    setValidationError(null)
    setIsLoading(true)
    try {
      // Simulate API call to validate prescription
      await new Promise(resolve => setTimeout(resolve, 1500))

      // TODO: Implementar validação real com API
      console.log('Validating prescription:', prescription.id)

      // Simulate validation error for demo
      if (prescription.status === 'pending') {
        // Simulate successful validation
        alert('Prescrição validada com sucesso!')
      }
    } catch (error) {
      setValidationError('Não foi possível validar a prescrição. Tente novamente.')
      console.error('Validation error:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleDownloadPrescription = async (prescription: Prescription) => {
    setValidationError(null)
    try {
      if (!prescription.prescriptionUrl) {
        throw new Error('Arquivo da prescrição não disponível')
      }

      // Validate URL format
      new URL(prescription.prescriptionUrl)
      window.open(prescription.prescriptionUrl, '_blank')
    } catch (error) {
      setValidationError('Não foi possível baixar o arquivo da prescrição. Verifique o link.')
      console.error('Download error:', error)
    }
  }
  const isExpiringSoon = (expiryDate: Date) => {
    const thirtyDaysFromNow = new Date()
    thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30)
    return expiryDate <= thirtyDaysFromNow && expiryDate > new Date()
  }
  const getDaysUntilExpiry = (expiryDate: Date) => {
    const today = new Date()
    const diffTime = expiryDate.getTime() - today.getTime()
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    return diffDays
  }
  return (
    <div className="space-y-6">
      {/* Error Display */}
      {validationError && (
        <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-lg">
          <div className="flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 text-red-600 mt-0.5" />
            <div className="flex-1">
              <p className="text-red-800 font-medium">Erro de Processamento</p>
              <p className="text-red-700 text-sm">{validationError}</p>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setValidationError(null)}
              className="text-red-600 hover:text-red-800"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Validação de Prescrições</h2>
          <p className="text-muted-foreground">
            Gerencie e valide prescrições médicas de lentes de contato
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative">
            <FileText className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Buscar prescrição..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-3 py-2 border rounded-md"
          >
            <option value="all">Todos os status</option>
            <option value="valid">Válidas</option>
            <option value="expired">Expiradas</option>
            <option value="pending">Pendentes</option>
            <option value="rejected">Rejeitadas</option>
          </select>
          <Button onClick={() => setShowUploadModal(true)}>
            <Upload className="h-4 w-4 mr-2" />
            Nova Prescrição
          </Button>
        </div>
      </div>
      {/* Alertas de Prescrições Expirando */}
      <div className="space-y-3">
        {filteredPrescriptions
          .filter(p => p.status === 'valid' && isExpiringSoon(p.expiryDate))
          .map(prescription => (
            <motion.div
              key={prescription.id}
              className="bg-yellow-50 border border-yellow-200 rounded-lg p-4"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <AlertTriangle className="h-5 w-5 text-yellow-600" />
                  <div>
                    <p className="font-medium text-yellow-800">
                      Prescrição de {prescription.customerName} expira em {getDaysUntilExpiry(prescription.expiryDate)} dias
                    </p>
                    <p className="text-sm text-yellow-700">
                      Vencimento: {prescription.expiryDate.toLocaleDateString('pt-BR')}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleViewPrescription(prescription)}
                  >
                    <Eye className="h-4 w-4 mr-1" />
                    Ver
                  </Button>
                  <Button size="sm">
                    Contatar Cliente
                  </Button>
                </div>
              </div>
            </motion.div>
          ))}
      </div>
      {/* Lista de Prescrições */}
      <div className="bg-card border rounded-lg">
        <div className="p-4 border-b">
          <h3 className="font-medium">Prescrições ({filteredPrescriptions.length})</h3>
        </div>
        <div className="divide-y">
          {filteredPrescriptions.map((prescription, index) => (
            <motion.div
              key={prescription.id}
              className="p-4 hover:bg-gray-50 transition-colors"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h4 className="font-medium">{prescription.customerName}</h4>
                    <Badge className={cn("text-xs", getStatusColor(prescription.status))}>
                      <div className="flex items-center gap-1">
                        {getStatusIcon(prescription.status)}
                        {prescription.status === 'valid' && 'Válida'}
                        {prescription.status === 'expired' && 'Expirada'}
                        {prescription.status === 'pending' && 'Pendente'}
                        {prescription.status === 'rejected' && 'Rejeitada'}
                      </div>
                    </Badge>
                    {isExpiringSoon(prescription.expiryDate) && (
                      <Badge variant="outline" className="text-orange-600 border-orange-300">
                        <Clock className="h-3 w-3 mr-1" />
                        Expira em {getDaysUntilExpiry(prescription.expiryDate)} dias
                      </Badge>
                    )}
                  </div>
                  <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4 text-sm">
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4 text-gray-400" />
                      <div>
                        <p className="text-gray-600">Médico</p>
                        <p className="font-medium">{prescription.doctorName}</p>
                        <p className="text-xs text-gray-500">{prescription.doctorCRM}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-gray-400" />
                      <div>
                        <p className="text-gray-600">Validade</p>
                        <p className="font-medium">{prescription.expiryDate.toLocaleDateString('pt-BR')}</p>
                        <p className="text-xs text-gray-500">
                          Emitida: {prescription.issueDate.toLocaleDateString('pt-BR')}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Shield className="h-4 w-4 text-gray-400" />
                      <div>
                        <p className="text-gray-600">Validações</p>
                        <div className="flex gap-1 mt-1">
                          {Object.entries(prescription.validations).map(([key, valid]) => (
                            <div
                              key={key}
                              className={cn("px-1 py-0.5 rounded text-xs", getValidationColor(valid))}
                            >
                              {valid ? '✓' : '✗'}
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                    {prescription.notes && (
                      <div className="col-span-1 lg:col-span-1">
                        <p className="text-gray-600">Observações</p>
                        <p className="text-xs text-gray-700">{prescription.notes}</p>
                      </div>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2 ml-4">
                  {prescription.prescriptionUrl && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDownloadPrescription(prescription)}
                    >
                      <Download className="h-4 w-4" />
                    </Button>
                  )}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleViewPrescription(prescription)}
                  >
                    <Eye className="h-4 w-4" />
                  </Button>
                  {prescription.status === 'pending' && (
                    <Button
                      size="sm"
                      onClick={() => handleValidatePrescription(prescription)}
                      disabled={isLoading}
                    >
                      {isLoading ? (
                        <>
                          <div className="h-4 w-4 mr-2 animate-spin rounded-full border-2 border-white border-t-transparent" />
                          Validando...
                        </>
                      ) : (
                        'Validar'
                      )}
                    </Button>
                  )}
                </div>
              </div>
            </motion.div>
          ))}
        </div>
        {filteredPrescriptions.length === 0 && (
          <div className="p-8 text-center">
            <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600">Nenhuma prescrição encontrada</p>
          </div>
        )}
      </div>
      {/* Modal de Detalhes da Prescrição */}
      {selectedPrescription && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-start mb-6">
              <h3 className="text-xl font-semibold">Detalhes da Prescrição</h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSelectedPrescription(null)}
              >
                <X className="h-5 w-5" />
              </Button>
            </div>
            <div className="grid gap-6 lg:grid-cols-2">
              {/* Informações do Paciente */}
              <div className="space-y-4">
                <h4 className="font-medium flex items-center gap-2">
                  <User className="h-4 w-4" />
                  Informações do Paciente
                </h4>
                <div className="bg-gray-50 rounded-lg p-4 space-y-2 text-sm">
                  <div><strong>Nome:</strong> {selectedPrescription.customerName}</div>
                  <div><strong>Email:</strong> {selectedPrescription.customerEmail}</div>
                  <div><strong>ID:</strong> {selectedPrescription.customerId}</div>
                </div>
              </div>
              {/* Informações Médicas */}
              <div className="space-y-4">
                <h4 className="font-medium flex items-center gap-2">
                  <Stethoscope className="h-4 w-4" />
                  Informações Médicas
                </h4>
                <div className="bg-gray-50 rounded-lg p-4 space-y-2 text-sm">
                  <div><strong>Médico:</strong> {selectedPrescription.doctorName}</div>
                  <div><strong>CRM:</strong> {selectedPrescription.doctorCRM}</div>
                  <div><strong>Data de emissão:</strong> {selectedPrescription.issueDate.toLocaleDateString('pt-BR')}</div>
                  <div><strong>Data de validade:</strong> {selectedPrescription.expiryDate.toLocaleDateString('pt-BR')}</div>
                </div>
              </div>
              {/* Status e Validações */}
              <div className="space-y-4">
                <h4 className="font-medium flex items-center gap-2">
                  <Shield className="h-4 w-4" />
                  Status e Validações
                </h4>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Status da prescrição:</span>
                    <Badge className={cn("text-xs", getStatusColor(selectedPrescription.status))}>
                      <div className="flex items-center gap-1">
                        {getStatusIcon(selectedPrescription.status)}
                        {selectedPrescription.status === 'valid' && 'Válida'}
                        {selectedPrescription.status === 'expired' && 'Expirada'}
                        {selectedPrescription.status === 'pending' && 'Pendente'}
                        {selectedPrescription.status === 'rejected' && 'Rejeitada'}
                      </div>
                    </Badge>
                  </div>
                  <div className="space-y-2">
                    <p className="text-sm font-medium">Validações realizadas:</p>
                    <div className="grid gap-2">
                      {Object.entries(selectedPrescription.validations).map(([key, valid]) => (
                        <div key={key} className="flex items-center gap-2 text-sm">
                          <div className={cn("w-4 h-4 rounded-full flex items-center justify-center", getValidationColor(valid))}>
                            {valid ? '✓' : '✗'}
                          </div>
                          <span>
                            {key === 'doctorSignature' && 'Assinatura do médico'}
                            {key === 'crmVerification' && 'Verificação do CRM'}
                            {key === 'dateValidity' && 'Validade da data'}
                            {key === 'patientMatch' && 'Correspondência do paciente'}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
              {/* Documento */}
              <div className="space-y-4">
                <h4 className="font-medium">Documento</h4>
                {selectedPrescription.prescriptionUrl ? (
                  <div className="bg-gray-50 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-sm">Arquivo da prescrição</span>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDownloadPrescription(selectedPrescription)}
                      >
                        <Download className="h-4 w-4 mr-1" />
                        Download
                      </Button>
                    </div>
                    <div className="bg-white border rounded p-8 text-center text-gray-500">
                      <FileText className="h-12 w-12 mx-auto mb-2" />
                      <p className="text-sm">Visualização do documento</p>
                    </div>
                  </div>
                ) : (
                  <div className="bg-gray-50 rounded-lg p-4 text-center text-gray-500">
                    <p className="text-sm">Nenhum arquivo anexado</p>
                  </div>
                )}
              </div>
            </div>
            {selectedPrescription.notes && (
              <div className="mt-6">
                <h4 className="font-medium mb-2">Observações</h4>
                <div className="bg-gray-50 rounded-lg p-4 text-sm">
                  {selectedPrescription.notes}
                </div>
              </div>
            )}
            <div className="flex justify-end gap-3 mt-6">
              <Button variant="outline" onClick={() => setSelectedPrescription(null)}>
                Fechar
              </Button>
              {selectedPrescription.status === 'pending' && (
                <Button onClick={() => handleValidatePrescription(selectedPrescription)} disabled={isLoading}>
                  {isLoading ? (
                    <>
                      <div className="h-4 w-4 mr-2 animate-spin rounded-full border-2 border-white border-t-transparent" />
                      Validando...
                    </>
                  ) : (
                    'Validar Prescrição'
                  )}
                </Button>
              )}
            </div>
          </div>
        </div>
      )}
      {/* Modal de Upload de Prescrição */}
      {showUploadModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold mb-4">Nova Prescrição</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Selecione o paciente</label>
                <select className="w-full p-2 border rounded-md">
                  <option>Selecione um paciente...</option>
                  {mockPrescriptions.map(p => (
                    <option key={p.customerId} value={p.customerId}>
                      {p.customerName}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Arquivo da prescrição</label>
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                  <Upload className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                  <p className="text-sm text-gray-600">Clique para fazer upload ou arraste o arquivo</p>
                  <p className="text-xs text-gray-500 mt-1">PDF, JPG, PNG (max. 10MB)</p>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Observações (opcional)</label>
                <textarea
                  className="w-full p-2 border rounded-md"
                  rows={3}
                  placeholder="Adicione observações sobre esta prescrição..."
                />
              </div>
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <Button variant="outline" onClick={() => setShowUploadModal(false)}>
                Cancelar
              </Button>
              <Button onClick={() => setShowUploadModal(false)}>
                Enviar Prescrição
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}