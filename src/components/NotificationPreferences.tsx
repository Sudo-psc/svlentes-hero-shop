'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Button } from '@/components/ui/button'
import { 
  type NotificationChannel, 
  type UserNotificationPreferences 
} from '@/types/user-preferences'
import { Mail, MessageCircle, Bell, Package, Calendar, Megaphone } from 'lucide-react'

interface NotificationPreferencesProps {
  preferences: UserNotificationPreferences
  phone?: string
  onSave: (preferences: UserNotificationPreferences) => Promise<void>
}

export function NotificationPreferences({ 
  preferences: initialPreferences, 
  phone,
  onSave 
}: NotificationPreferencesProps) {
  const [preferences, setPreferences] = useState(initialPreferences)
  const [saving, setSaving] = useState(false)

  const handleChannelChange = (channel: NotificationChannel) => {
    setPreferences(prev => ({ ...prev, channel }))
  }

  const handleToggle = (key: keyof Omit<UserNotificationPreferences, 'channel'>) => {
    setPreferences(prev => ({ ...prev, [key]: !prev[key] }))
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      await onSave(preferences)
    } finally {
      setSaving(false)
    }
  }

  const hasChanges = JSON.stringify(preferences) !== JSON.stringify(initialPreferences)
  const canUseWhatsApp = !!phone

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Preferências de Notificação</CardTitle>
          <CardDescription>
            Escolha como você deseja receber lembretes e atualizações
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-4">
            <Label className="text-base font-semibold">Canal de Comunicação</Label>
            
            <div className="grid gap-3">
              <button
                onClick={() => handleChannelChange('EMAIL')}
                className={`flex items-center gap-3 p-4 border-2 rounded-lg transition-all ${
                  preferences.channel === 'EMAIL'
                    ? 'border-cyan-500 bg-cyan-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className={`p-2 rounded-full ${
                  preferences.channel === 'EMAIL' ? 'bg-cyan-500 text-white' : 'bg-gray-100'
                }`}>
                  <Mail className="w-5 h-5" />
                </div>
                <div className="flex-1 text-left">
                  <p className="font-medium">E-mail</p>
                  <p className="text-sm text-gray-500">Receber notificações por e-mail</p>
                </div>
                {preferences.channel === 'EMAIL' && (
                  <div className="w-5 h-5 rounded-full bg-cyan-500 flex items-center justify-center">
                    <div className="w-2 h-2 bg-white rounded-full" />
                  </div>
                )}
              </button>

              <button
                onClick={() => canUseWhatsApp && handleChannelChange('WHATSAPP')}
                disabled={!canUseWhatsApp}
                className={`flex items-center gap-3 p-4 border-2 rounded-lg transition-all ${
                  preferences.channel === 'WHATSAPP'
                    ? 'border-cyan-500 bg-cyan-50'
                    : canUseWhatsApp 
                      ? 'border-gray-200 hover:border-gray-300' 
                      : 'border-gray-200 opacity-50 cursor-not-allowed'
                }`}
              >
                <div className={`p-2 rounded-full ${
                  preferences.channel === 'WHATSAPP' ? 'bg-cyan-500 text-white' : 'bg-gray-100'
                }`}>
                  <MessageCircle className="w-5 h-5" />
                </div>
                <div className="flex-1 text-left">
                  <p className="font-medium">WhatsApp</p>
                  <p className="text-sm text-gray-500">
                    {canUseWhatsApp 
                      ? `Receber notificações no ${phone}`
                      : 'Adicione um telefone para usar WhatsApp'
                    }
                  </p>
                </div>
                {preferences.channel === 'WHATSAPP' && (
                  <div className="w-5 h-5 rounded-full bg-cyan-500 flex items-center justify-center">
                    <div className="w-2 h-2 bg-white rounded-full" />
                  </div>
                )}
              </button>

              <button
                onClick={() => canUseWhatsApp && handleChannelChange('BOTH')}
                disabled={!canUseWhatsApp}
                className={`flex items-center gap-3 p-4 border-2 rounded-lg transition-all ${
                  preferences.channel === 'BOTH'
                    ? 'border-cyan-500 bg-cyan-50'
                    : canUseWhatsApp 
                      ? 'border-gray-200 hover:border-gray-300' 
                      : 'border-gray-200 opacity-50 cursor-not-allowed'
                }`}
              >
                <div className={`p-2 rounded-full ${
                  preferences.channel === 'BOTH' ? 'bg-cyan-500 text-white' : 'bg-gray-100'
                }`}>
                  <Bell className="w-5 h-5" />
                </div>
                <div className="flex-1 text-left">
                  <p className="font-medium">E-mail + WhatsApp</p>
                  <p className="text-sm text-gray-500">
                    {canUseWhatsApp 
                      ? 'Receber em ambos os canais (recomendado)'
                      : 'Adicione um telefone para usar esta opção'
                    }
                  </p>
                </div>
                {preferences.channel === 'BOTH' && (
                  <div className="w-5 h-5 rounded-full bg-cyan-500 flex items-center justify-center">
                    <div className="w-2 h-2 bg-white rounded-full" />
                  </div>
                )}
              </button>
            </div>

            {!canUseWhatsApp && (
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg">
                <p className="text-sm text-amber-800">
                  💡 <strong>Dica:</strong> Adicione seu número de WhatsApp nas configurações de perfil para receber lembretes instantâneos.
                </p>
              </div>
            )}
          </div>

          <hr className="border-gray-200" />

          <div className="space-y-4">
            <Label className="text-base font-semibold">Tipos de Notificação</Label>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-full bg-cyan-100">
                    <Bell className="w-5 h-5 text-cyan-600" />
                  </div>
                  <div>
                    <p className="font-medium">Lembretes de Renovação</p>
                    <p className="text-sm text-gray-500">Avisos antes da renovação da assinatura</p>
                  </div>
                </div>
                <Switch
                  checked={preferences.subscriptionReminders}
                  onCheckedChange={() => handleToggle('subscriptionReminders')}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-full bg-blue-100">
                    <Package className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="font-medium">Atualizações de Pedido</p>
                    <p className="text-sm text-gray-500">Status de envio e rastreamento</p>
                  </div>
                </div>
                <Switch
                  checked={preferences.orderUpdates}
                  onCheckedChange={() => handleToggle('orderUpdates')}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-full bg-purple-100">
                    <Calendar className="w-5 h-5 text-purple-600" />
                  </div>
                  <div>
                    <p className="font-medium">Lembretes de Consulta</p>
                    <p className="text-sm text-gray-500">Avisos de acompanhamento médico</p>
                  </div>
                </div>
                <Switch
                  checked={preferences.appointmentReminders}
                  onCheckedChange={() => handleToggle('appointmentReminders')}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-full bg-pink-100">
                    <Megaphone className="w-5 h-5 text-pink-600" />
                  </div>
                  <div>
                    <p className="font-medium">Novidades e Promoções</p>
                    <p className="text-sm text-gray-500">Ofertas especiais e lançamentos</p>
                  </div>
                </div>
                <Switch
                  checked={preferences.marketingMessages}
                  onCheckedChange={() => handleToggle('marketingMessages')}
                />
              </div>
            </div>
          </div>

          <div className="pt-4">
            <Button
              onClick={handleSave}
              disabled={!hasChanges || saving}
              className="w-full"
            >
              {saving ? 'Salvando...' : 'Salvar Preferências'}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
