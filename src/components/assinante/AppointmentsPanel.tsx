'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Calendar, Clock, MapPin, Video, FileText, Plus } from 'lucide-react'
import { formatDate } from '@/lib/formatters'

interface Appointment {
  id: string
  appointmentNumber: string
  type: string
  status: string
  scheduledDate: string
  duration: number
  doctorName: string
  doctorCRM?: string
  location?: string
  isVirtual: boolean
  meetingLink?: string
  patientNotes?: string
}

const appointmentTypeLabels: Record<string, string> = {
  INITIAL_CONSULTATION: 'Consulta Inicial',
  FOLLOW_UP: 'Retorno',
  EMERGENCY: 'Urgência',
  ROUTINE_CHECK: 'Consulta de Rotina',
  PRESCRIPTION_RENEWAL: 'Renovação de Receita'
}

const appointmentStatusLabels: Record<string, string> = {
  SCHEDULED: 'Agendado',
  CONFIRMED: 'Confirmado',
  CANCELLED: 'Cancelado',
  COMPLETED: 'Concluído',
  NO_SHOW: 'Não Compareceu',
  RESCHEDULED: 'Reagendado'
}

const getStatusColor = (status: string) => {
  const colors: Record<string, string> = {
    SCHEDULED: 'bg-blue-100 text-blue-800',
    CONFIRMED: 'bg-green-100 text-green-800',
    CANCELLED: 'bg-red-100 text-red-800',
    COMPLETED: 'bg-gray-100 text-gray-800',
    NO_SHOW: 'bg-orange-100 text-orange-800',
    RESCHEDULED: 'bg-yellow-100 text-yellow-800'
  }
  return colors[status] || 'bg-gray-100 text-gray-800'
}

export function AppointmentsPanel() {
  const { user } = useAuth()
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showNewAppointmentModal, setShowNewAppointmentModal] = useState(false)

  useEffect(() => {
    if (user) {
      fetchAppointments()
    }
  }, [user])

  const fetchAppointments = async () => {
    if (!user) return

    try {
      setLoading(true)
      const token = await user.getIdToken()
      const response = await fetch('/api/assinante/appointments', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })

      if (!response.ok) {
        throw new Error('Erro ao carregar agendamentos')
      }

      const data = await response.json()
      setAppointments(data.appointments || [])
      setError(null)
    } catch (err: any) {
      console.error('Erro ao carregar agendamentos:', err)
      setError(err.message || 'Erro ao carregar agendamentos')
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
            <div className="h-24 bg-gray-200 rounded"></div>
            <div className="h-24 bg-gray-200 rounded"></div>
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
          <Button onClick={fetchAppointments} variant="outline">
            Tentar Novamente
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white p-6 rounded-xl shadow-sm border">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
          <Calendar className="h-5 w-5 text-cyan-600" />
          Meus Agendamentos
        </h3>
        <Button onClick={() => setShowNewAppointmentModal(true)} size="sm">
          <Plus className="h-4 w-4 mr-2" />
          Novo Agendamento
        </Button>
      </div>

      {appointments.length === 0 ? (
        <div className="text-center py-8">
          <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600 mb-4">Você ainda não possui agendamentos</p>
          <Button onClick={() => setShowNewAppointmentModal(true)}>
            Agendar Consulta
          </Button>
        </div>
      ) : (
        <div className="space-y-4">
          {appointments.map((appointment) => (
            <Card key={appointment.id} className="p-4 hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <span className={`px-3 py-1 text-xs rounded-full font-medium ${getStatusColor(appointment.status)}`}>
                      {appointmentStatusLabels[appointment.status] || appointment.status}
                    </span>
                    <span className="text-sm text-gray-600">
                      #{appointment.appointmentNumber}
                    </span>
                  </div>
                  
                  <h4 className="font-medium text-gray-900 mb-2">
                    {appointmentTypeLabels[appointment.type] || appointment.type}
                  </h4>

                  <div className="space-y-2 text-sm text-gray-600">
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4" />
                      <span>{formatDate(appointment.scheduledDate)}</span>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4" />
                      <span>{appointment.duration} minutos</span>
                    </div>

                    <div className="flex items-center gap-2">
                      {appointment.isVirtual ? (
                        <>
                          <Video className="h-4 w-4" />
                          <span>Consulta Virtual</span>
                        </>
                      ) : appointment.location ? (
                        <>
                          <MapPin className="h-4 w-4" />
                          <span>{appointment.location}</span>
                        </>
                      ) : null}
                    </div>

                    <div className="text-sm">
                      <span className="font-medium">Médico:</span> {appointment.doctorName}
                      {appointment.doctorCRM && <span className="text-gray-500"> - {appointment.doctorCRM}</span>}
                    </div>
                  </div>

                  {appointment.patientNotes && (
                    <div className="mt-3 p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-start gap-2">
                        <FileText className="h-4 w-4 text-gray-400 mt-0.5" />
                        <div className="flex-1">
                          <p className="text-xs font-medium text-gray-700 mb-1">Observações:</p>
                          <p className="text-sm text-gray-600">{appointment.patientNotes}</p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {appointment.isVirtual && appointment.meetingLink && (
                  <Button variant="outline" size="sm" asChild>
                    <a href={appointment.meetingLink} target="_blank" rel="noopener noreferrer">
                      <Video className="h-4 w-4 mr-2" />
                      Entrar
                    </a>
                  </Button>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
