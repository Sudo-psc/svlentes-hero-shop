'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { NotificationPreferences } from '@/components/NotificationPreferences'
import { type UserNotificationPreferences } from '@/types/user-preferences'
import { User, Bell, ChevronLeft, Save, AlertCircle } from 'lucide-react'
import { DashboardLoading } from '@/components/assinante/DashboardLoading'
export default function ConfiguracoesPage() {
  const router = useRouter()
  const { user: authUser, loading: authLoading, signOut } = useAuth()
  const [activeTab, setActiveTab] = useState<'profile' | 'notifications'>('profile')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<{type: 'success' | 'error', text: string} | null>(null)
  const [profileData, setProfileData] = useState({
    name: '',
    email: '',
    phone: '',
    whatsapp: ''
  })
  const [notificationPreferences, setNotificationPreferences] = useState<UserNotificationPreferences>({
    channel: 'EMAIL',
    subscriptionReminders: true,
    orderUpdates: true,
    appointmentReminders: true,
    marketingMessages: false
  })
  useEffect(() => {
    if (!authLoading && !authUser) {
      router.push('/area-assinante/login')
    } else if (authUser) {
      fetchUserData()
    }
  }, [authUser, authLoading, router])
  const fetchUserData = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/user/preferences', {
        headers: {
          'x-user-id': authUser?.uid || ''
        }
      })
      if (response.ok) {
        const data = await response.json()
        setNotificationPreferences(data.preferences)
        setProfileData(prev => ({
          ...prev,
          name: authUser?.displayName || '',
          email: authUser?.email || '',
          phone: data.phone || '',
          whatsapp: data.phone || ''
        }))
      } else {
        setProfileData({
          name: authUser?.displayName || '',
          email: authUser?.email || '',
          phone: '',
          whatsapp: ''
        })
      }
    } catch (error) {
      console.error('Error fetching user data:', error)
      setProfileData({
        name: authUser?.displayName || '',
        email: authUser?.email || '',
        phone: '',
        whatsapp: ''
      })
    } finally {
      setLoading(false)
    }
  }
  const handleProfileSave = async () => {
    try {
      setSaving(true)
      setMessage(null)
      const response = await fetch('/api/user/profile', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': authUser?.uid || ''
        },
        body: JSON.stringify({
          name: profileData.name,
          phone: profileData.phone,
          whatsapp: profileData.whatsapp
        })
      })
      if (response.ok) {
        setMessage({ type: 'success', text: 'Perfil atualizado com sucesso!' })
        setTimeout(() => setMessage(null), 3000)
      } else {
        const error = await response.json()
        setMessage({ type: 'error', text: error.error || 'Erro ao salvar perfil' })
      }
    } catch (error) {
      console.error('Error saving profile:', error)
      setMessage({ type: 'error', text: 'Erro ao salvar perfil' })
    } finally {
      setSaving(false)
    }
  }
  const handleNotificationsSave = async (preferences: UserNotificationPreferences) => {
    try {
      const response = await fetch('/api/user/preferences', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': authUser?.uid || ''
        },
        body: JSON.stringify(preferences)
      })
      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Erro ao salvar preferências')
      }
      setNotificationPreferences(preferences)
      setMessage({ type: 'success', text: 'Preferências salvas com sucesso!' })
      setTimeout(() => setMessage(null), 3000)
    } catch (error) {
      console.error('Error saving preferences:', error)
      throw error
    }
  }
  if (authLoading || loading) {
    return <DashboardLoading />
  }
  if (!authUser) {
    return null
  }
  return (
    <div className="min-h-screen bg-gradient-to-br from-cyan-50 to-silver-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              <span className="text-lg font-semibold text-gray-900">Configurações</span>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <div className="h-8 w-8 rounded-full bg-cyan-100 flex items-center justify-center">
                  <User className="h-4 w-4 text-cyan-600" />
                </div>
                <span className="text-sm font-medium text-gray-700">
                  {authUser.displayName}
                </span>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => signOut()}
              >
                Sair
              </Button>
            </div>
          </div>
        </div>
      </header>
      {/* Main Content */}
      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Back Button */}
        <Button
          variant="ghost"
          size="sm"
          onClick={() => router.push('/area-assinante/dashboard')}
          className="mb-6"
        >
          <ChevronLeft className="h-4 w-4 mr-1" />
          Voltar ao Dashboard
        </Button>
        {/* Message Alert */}
        {message && (
          <div className={`mb-6 p-4 rounded-lg border ${
            message.type === 'success' 
              ? 'bg-green-50 border-green-200 text-green-800' 
              : 'bg-red-50 border-red-200 text-red-800'
          }`}>
            <div className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5" />
              <p className="font-medium">{message.text}</p>
            </div>
          </div>
        )}
        {/* Tabs */}
        <div className="bg-white rounded-xl shadow-sm border mb-6">
          <div className="border-b">
            <div className="flex">
              <button
                onClick={() => setActiveTab('profile')}
                className={`flex-1 px-6 py-4 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === 'profile'
                    ? 'border-cyan-600 text-cyan-600'
                    : 'border-transparent text-gray-600 hover:text-gray-900'
                }`}
              >
                <User className="h-4 w-4 inline-block mr-2" />
                Perfil
              </button>
              <button
                onClick={() => setActiveTab('notifications')}
                className={`flex-1 px-6 py-4 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === 'notifications'
                    ? 'border-cyan-600 text-cyan-600'
                    : 'border-transparent text-gray-600 hover:text-gray-900'
                }`}
              >
                <Bell className="h-4 w-4 inline-block mr-2" />
                Notificações
              </button>
            </div>
          </div>
          {/* Tab Content */}
          <div className="p-6">
            {activeTab === 'profile' && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-xl font-semibold text-gray-900 mb-4">
                    Informações do Perfil
                  </h2>
                  <p className="text-sm text-gray-600 mb-6">
                    Atualize suas informações pessoais e de contato
                  </p>
                </div>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="name">Nome Completo</Label>
                    <Input
                      id="name"
                      value={profileData.name}
                      onChange={(e) => setProfileData(prev => ({ ...prev, name: e.target.value }))}
                      placeholder="Seu nome completo"
                    />
                  </div>
                  <div>
                    <Label htmlFor="email">E-mail</Label>
                    <Input
                      id="email"
                      type="email"
                      value={profileData.email}
                      disabled
                      className="bg-gray-50 cursor-not-allowed"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      O e-mail não pode ser alterado
                    </p>
                  </div>
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="phone">Telefone</Label>
                      <Input
                        id="phone"
                        type="tel"
                        value={profileData.phone}
                        onChange={(e) => setProfileData(prev => ({ ...prev, phone: e.target.value }))}
                        placeholder="(33) 99999-9999"
                      />
                    </div>
                    <div>
                      <Label htmlFor="whatsapp">WhatsApp</Label>
                      <Input
                        id="whatsapp"
                        type="tel"
                        value={profileData.whatsapp}
                        onChange={(e) => setProfileData(prev => ({ ...prev, whatsapp: e.target.value }))}
                        placeholder="(33) 99999-9999"
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        Necessário para receber notificações via WhatsApp
                      </p>
                    </div>
                  </div>
                </div>
                <div className="pt-6 border-t">
                  <Button
                    onClick={handleProfileSave}
                    disabled={saving}
                    className="w-full md:w-auto"
                  >
                    <Save className="h-4 w-4 mr-2" />
                    {saving ? 'Salvando...' : 'Salvar Alterações'}
                  </Button>
                </div>
              </div>
            )}
            {activeTab === 'notifications' && (
              <div>
                <div className="mb-6">
                  <h2 className="text-xl font-semibold text-gray-900 mb-2">
                    Preferências de Notificação
                  </h2>
                  <p className="text-sm text-gray-600">
                    Escolha como deseja receber lembretes e atualizações
                  </p>
                </div>
                <NotificationPreferences
                  preferences={notificationPreferences}
                  phone={profileData.whatsapp || profileData.phone}
                  onSave={handleNotificationsSave}
                />
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}
export const dynamic = 'force-dynamic'