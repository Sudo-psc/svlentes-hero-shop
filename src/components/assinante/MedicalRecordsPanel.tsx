'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { FileText, Download, Calendar, User, Shield, Eye } from 'lucide-react'
import { formatDate } from '@/lib/formatters'

interface MedicalRecord {
  id: string
  recordType: string
  title: string
  description: string
  data: any
  documentUrl?: string
  documentType?: string
  issuedBy?: string
  issuedByCRM?: string
  issuedAt?: string
  expiresAt?: string
  isActive: boolean
  isConfidential: boolean
  appointment?: {
    appointmentNumber: string
    scheduledDate: string
    type: string
  }
  createdAt: string
}

const recordTypeLabels: Record<string, string> = {
  PRESCRIPTION: 'Receita Médica',
  CONSULTATION_NOTES: 'Notas de Consulta',
  EXAM_RESULTS: 'Resultados de Exames',
  DIAGNOSIS: 'Diagnóstico',
  TREATMENT_PLAN: 'Plano de Tratamento'
}

const recordTypeIcons: Record<string, React.ReactNode> = {
  PRESCRIPTION: <FileText className="h-5 w-5" />,
  CONSULTATION_NOTES: <FileText className="h-5 w-5" />,
  EXAM_RESULTS: <FileText className="h-5 w-5" />,
  DIAGNOSIS: <FileText className="h-5 w-5" />,
  TREATMENT_PLAN: <FileText className="h-5 w-5" />
}

const getRecordTypeColor = (type: string) => {
  const colors: Record<string, string> = {
    PRESCRIPTION: 'bg-blue-100 text-blue-800',
    CONSULTATION_NOTES: 'bg-green-100 text-green-800',
    EXAM_RESULTS: 'bg-purple-100 text-purple-800',
    DIAGNOSIS: 'bg-orange-100 text-orange-800',
    TREATMENT_PLAN: 'bg-cyan-100 text-cyan-800'
  }
  return colors[type] || 'bg-gray-100 text-gray-800'
}

export function MedicalRecordsPanel() {
  const { user } = useAuth()
  const [records, setRecords] = useState<MedicalRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedType, setSelectedType] = useState<string | null>(null)

  useEffect(() => {
    if (user) {
      fetchRecords()
    }
  }, [user, selectedType])

  const fetchRecords = async () => {
    if (!user) return

    try {
      setLoading(true)
      const token = await user.getIdToken()
      const url = selectedType 
        ? `/api/assinante/medical-records?type=${selectedType}`
        : '/api/assinante/medical-records'
      
      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })

      if (!response.ok) {
        throw new Error('Erro ao carregar histórico médico')
      }

      const data = await response.json()
      setRecords(data.records || [])
      setError(null)
    } catch (err: any) {
      console.error('Erro ao carregar histórico médico:', err)
      setError(err.message || 'Erro ao carregar histórico médico')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="bg-white p-6 rounded-xl shadow-sm border">
        <div className="animate-pulse space-y-4">
          <div className="h-6 bg-gray-200 rounded w-1/3"></div>
          <div className="space-y-3">
            <div className="h-32 bg-gray-200 rounded"></div>
            <div className="h-32 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-white p-6 rounded-xl shadow-sm border">
        <div className="text-center">
          <p className="text-red-600 mb-4">{error}</p>
          <Button onClick={fetchRecords} variant="outline">
            Tentar Novamente
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white p-6 rounded-xl shadow-sm border">
      <div className="mb-6">
        <h3 className="text-xl font-semibold text-gray-900 flex items-center gap-2 mb-4">
          <FileText className="h-5 w-5 text-cyan-600" />
          Histórico Médico
        </h3>

        <div className="flex flex-wrap gap-2">
          <Button
            variant={selectedType === null ? 'default' : 'outline'}
            size="sm"
            onClick={() => setSelectedType(null)}
          >
            Todos
          </Button>
          {Object.entries(recordTypeLabels).map(([type, label]) => (
            <Button
              key={type}
              variant={selectedType === type ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSelectedType(type)}
            >
              {label}
            </Button>
          ))}
        </div>
      </div>

      {records.length === 0 ? (
        <div className="text-center py-8">
          <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600">
            {selectedType 
              ? `Nenhum registro de ${recordTypeLabels[selectedType]?.toLowerCase()} encontrado`
              : 'Nenhum histórico médico disponível'}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {records.map((record) => (
            <Card key={record.id} className="p-4 hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-3">
                    <span className={`px-3 py-1 text-xs rounded-full font-medium ${getRecordTypeColor(record.recordType)}`}>
                      {recordTypeLabels[record.recordType] || record.recordType}
                    </span>
                    {record.isConfidential && (
                      <span className="flex items-center gap-1 px-2 py-1 text-xs rounded-full bg-red-100 text-red-800">
                        <Shield className="h-3 w-3" />
                        Confidencial
                      </span>
                    )}
                  </div>

                  <h4 className="font-semibold text-gray-900 mb-2">{record.title}</h4>
                  <p className="text-sm text-gray-600 mb-3">{record.description}</p>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm text-gray-600">
                    {record.issuedBy && (
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4 text-gray-400" />
                        <div>
                          <span className="font-medium">Emitido por:</span> {record.issuedBy}
                          {record.issuedByCRM && <span className="text-gray-500"> - {record.issuedByCRM}</span>}
                        </div>
                      </div>
                    )}

                    {record.issuedAt && (
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-gray-400" />
                        <div>
                          <span className="font-medium">Data:</span> {formatDate(record.issuedAt)}
                        </div>
                      </div>
                    )}

                    {record.expiresAt && (
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-gray-400" />
                        <div>
                          <span className="font-medium">Validade:</span> {formatDate(record.expiresAt)}
                        </div>
                      </div>
                    )}

                    {record.appointment && (
                      <div className="flex items-center gap-2 col-span-full">
                        <FileText className="h-4 w-4 text-gray-400" />
                        <div>
                          <span className="font-medium">Consulta:</span> #{record.appointment.appointmentNumber} - {formatDate(record.appointment.scheduledDate)}
                        </div>
                      </div>
                    )}
                  </div>

                  {record.data && Object.keys(record.data).length > 0 && (
                    <div className="mt-3 p-3 bg-gray-50 rounded-lg">
                      <p className="text-xs font-medium text-gray-700 mb-2">Detalhes:</p>
                      <div className="text-sm text-gray-600 space-y-1">
                        {Object.entries(record.data).map(([key, value]) => (
                          <div key={key}>
                            <span className="font-medium capitalize">{key.replace(/_/g, ' ')}:</span>{' '}
                            {typeof value === 'object' ? JSON.stringify(value) : String(value)}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                <div className="flex flex-col gap-2">
                  {record.documentUrl && (
                    <Button variant="outline" size="sm" asChild>
                      <a href={record.documentUrl} target="_blank" rel="noopener noreferrer">
                        <Eye className="h-4 w-4 mr-2" />
                        Ver
                      </a>
                    </Button>
                  )}
                  {record.documentUrl && (
                    <Button variant="outline" size="sm" asChild>
                      <a href={record.documentUrl} download>
                        <Download className="h-4 w-4 mr-2" />
                        Baixar
                      </a>
                    </Button>
                  )}
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
