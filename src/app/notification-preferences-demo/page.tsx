'use client'
import { useState, useEffect } from 'react'
import { NotificationPreferences } from '@/components/NotificationPreferences'
import { type UserNotificationPreferences } from '@/types/user-preferences'
export default function NotificationPreferencesDemoPage() {
  const [preferences, setPreferences] = useState<UserNotificationPreferences>({
    channel: 'EMAIL',
    subscriptionReminders: true,
    orderUpdates: true,
    appointmentReminders: true,
    marketingMessages: false
  })
  const [phone, setPhone] = useState<string>('')
  const [loading, setLoading] = useState(true)
  useEffect(() => {
    fetchPreferences()
  }, [])
  const fetchPreferences = async () => {
    try {
      const mockUserId = 'demo-user'
      const response = await fetch('/api/user/preferences', {
        headers: {
          'x-user-id': mockUserId
        }
      })
      if (response.ok) {
        const data = await response.json()
        setPreferences(data.preferences)
        setPhone(data.phone || '')
      }
    } catch (error) {
      console.error('Error fetching preferences:', error)
    } finally {
      setLoading(false)
    }
  }
  const handleSave = async (newPreferences: UserNotificationPreferences) => {
    const mockUserId = 'demo-user'
    const response = await fetch('/api/user/preferences', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-user-id': mockUserId
      },
      body: JSON.stringify(newPreferences)
    })
    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || 'Erro ao salvar preferências')
    }
    const data = await response.json()
    setPreferences(data.preferences)
  }
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">Carregando...</div>
      </div>
    )
  }
  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-4xl mx-auto px-4">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Preferências de Notificação
          </h1>
          <p className="text-gray-600">
            Página de demonstração do sistema multi-canal de lembretes
          </p>
        </div>
        <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <h2 className="font-semibold text-blue-900 mb-2">💡 Sobre este sistema</h2>
          <ul className="text-sm text-blue-800 space-y-1">
            <li>✅ WhatsApp API SendPulse integrado e funcional</li>
            <li>✅ Sistema multi-canal (Email + WhatsApp)</li>
            <li>✅ Preferências granulares por tipo de notificação</li>
            <li>✅ Validação de telefone para acesso WhatsApp</li>
          </ul>
        </div>
        {phone && (
          <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
            <p className="text-sm text-green-800">
              📱 Telefone cadastrado: <strong>{phone}</strong> - WhatsApp disponível!
            </p>
          </div>
        )}
        <NotificationPreferences
          preferences={preferences}
          phone={phone}
          onSave={handleSave}
        />
        <div className="mt-8 p-6 bg-white rounded-lg border border-gray-200">
          <h2 className="font-semibold text-gray-900 mb-4">📊 Estado Atual</h2>
          <pre className="bg-gray-50 p-4 rounded text-sm overflow-auto">
            {JSON.stringify({ preferences, phone }, null, 2)}
          </pre>
        </div>
      </div>
    </div>
  )
}