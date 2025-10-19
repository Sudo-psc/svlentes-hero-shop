'use client'

import { useState, useEffect } from 'react'
import { Bell, Mail, MessageCircle, Smartphone, Clock, Shield, AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { Separator } from '@/components/ui/separator'
import { toast } from 'sonner'
import {
  NotificationPreferences,
  NotificationChannel,
  NotificationEventType,
  EVENT_LABELS,
  CHANNEL_LABELS,
  DEFAULT_NOTIFICATION_PREFERENCES
} from '@/types/notification-preferences'

interface NotificationPreferencesPanelProps {
  userId: string
}

export function NotificationPreferencesPanel({ userId }: NotificationPreferencesPanelProps) {
  const [preferences, setPreferences] = useState<NotificationPreferences>(DEFAULT_NOTIFICATION_PREFERENCES)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [hasChanges, setHasChanges] = useState(false)

  useEffect(() => {
    fetchPreferences()
  }, [userId])

  const fetchPreferences = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/user/notification-preferences', {
        headers: { 'x-user-id': userId }
      })
      const data = await response.json()
      if (data.success) {
        setPreferences(data.preferences)
      }
    } catch (error) {
      console.error('Error fetching preferences:', error)
      toast.error('Erro ao carregar preferências')
    } finally {
      setLoading(false)
    }
  }

  const savePreferences = async () => {
    try {
      setSaving(true)
      const response = await fetch('/api/user/notification-preferences', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': userId
        },
        body: JSON.stringify(preferences)
      })
      const data = await response.json()
      if (data.success) {
        toast.success(data.message || 'Preferências salvas com sucesso')
        setHasChanges(false)
      } else {
        toast.error(data.error || 'Erro ao salvar preferências')
      }
    } catch (error) {
      console.error('Error saving preferences:', error)
      toast.error('Erro ao salvar preferências')
    } finally {
      setSaving(false)
    }
  }

  const resetToDefaults = async () => {
    try {
      setSaving(true)
      const response = await fetch('/api/user/notification-preferences', {
        method: 'POST',
        headers: { 'x-user-id': userId }
      })
      const data = await response.json()
      if (data.success) {
        setPreferences(data.preferences)
        toast.success(data.message || 'Preferências restauradas')
        setHasChanges(false)
      }
    } catch (error) {
      console.error('Error resetting preferences:', error)
      toast.error('Erro ao restaurar preferências')
    } finally {
      setSaving(false)
    }
  }

  const toggleChannelEnabled = (channel: NotificationChannel) => {
    setPreferences(prev => ({
      ...prev,
      channels: {
        ...prev.channels,
        [channel]: {
          ...prev.channels[channel],
          enabled: !prev.channels[channel].enabled
        }
      }
    }))
    setHasChanges(true)
  }

  const toggleEventForChannel = (channel: NotificationChannel, event: NotificationEventType) => {
    setPreferences(prev => ({
      ...prev,
      channels: {
        ...prev.channels,
        [channel]: {
          ...prev.channels[channel],
          events: {
            ...prev.channels[channel].events,
            [event]: !prev.channels[channel].events[event]
          }
        }
      }
    }))
    setHasChanges(true)
  }

  const updateQuietHours = (field: 'enabled' | 'start' | 'end', value: boolean | string) => {
    setPreferences(prev => ({
      ...prev,
      quietHours: {
        ...prev.quietHours,
        [field]: value
      }
    }))
    setHasChanges(true)
  }

  const updateFrequency = (field: 'maxPerDay' | 'maxPerWeek' | 'respectQuietHours', value: number | boolean) => {
    setPreferences(prev => ({
      ...prev,
      frequency: {
        ...prev.frequency,
        [field]: value
      }
    }))
    setHasChanges(true)
  }

  const updateFallback = (field: keyof NotificationPreferences['fallback'], value: any) => {
    setPreferences(prev => ({
      ...prev,
      fallback: {
        ...prev.fallback,
        [field]: value
      }
    }))
    setHasChanges(true)
  }

  const getChannelIcon = (channel: NotificationChannel) => {
    const icons = {
      email: Mail,
      whatsapp: MessageCircle,
      sms: Smartphone,
      push: Bell
    }
    return icons[channel]
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-cyan-600" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Preferências de Notificação</h2>
          <p className="text-gray-600 mt-1">Configure como e quando você quer receber notificações</p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={resetToDefaults}
            disabled={saving}
          >
            Restaurar Padrões
          </Button>
          <Button
            onClick={savePreferences}
            disabled={!hasChanges || saving}
          >
            {saving ? 'Salvando...' : 'Salvar Alterações'}
          </Button>
        </div>
      </div>

      {/* Channels Configuration */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            Canais de Notificação
          </CardTitle>
          <CardDescription>
            Escolha quais canais você deseja usar para receber notificações
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {(Object.keys(preferences.channels) as NotificationChannel[]).map((channel) => {
            const Icon = getChannelIcon(channel)
            const channelData = preferences.channels[channel]
            const label = CHANNEL_LABELS[channel]

            return (
              <div key={channel} className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Icon className="h-5 w-5 text-gray-700" />
                    <div>
                      <Label className="text-base font-medium">{label.pt}</Label>
                      <p className="text-sm text-gray-600">
                        {channel === 'email' && 'Receba notificações por e-mail'}
                        {channel === 'whatsapp' && 'Mensagens via WhatsApp'}
                        {channel === 'sms' && 'Mensagens de texto SMS'}
                        {channel === 'push' && 'Notificações no navegador'}
                      </p>
                    </div>
                  </div>
                  <Switch
                    checked={channelData.enabled}
                    onCheckedChange={() => toggleChannelEnabled(channel)}
                  />
                </div>

                {channelData.enabled && (
                  <div className="ml-8 space-y-3 pl-4 border-l-2 border-gray-200">
                    <p className="text-sm font-medium text-gray-700">Eventos para este canal:</p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {(Object.keys(EVENT_LABELS) as NotificationEventType[]).map((event) => {
                        const eventLabel = EVENT_LABELS[event]
                        const isEnabled = channelData.events[event] || false

                        return (
                          <div key={event} className="flex items-center justify-between gap-2">
                            <div className="flex-1">
                              <Label className="text-sm cursor-pointer" htmlFor={`${channel}-${event}`}>
                                {eventLabel.pt}
                              </Label>
                              <p className="text-xs text-gray-500">{eventLabel.description}</p>
                            </div>
                            <Switch
                              id={`${channel}-${event}`}
                              checked={isEnabled}
                              onCheckedChange={() => toggleEventForChannel(channel, event)}
                            />
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )}

                {channel !== 'push' && <Separator />}
              </div>
            )
          })}
        </CardContent>
      </Card>

      {/* Quiet Hours */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Horário de Silêncio
          </CardTitle>
          <CardDescription>
            Defina quando você não quer receber notificações
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <Label htmlFor="quiet-hours-enabled">Ativar horário de silêncio</Label>
            <Switch
              id="quiet-hours-enabled"
              checked={preferences.quietHours.enabled}
              onCheckedChange={(checked) => updateQuietHours('enabled', checked)}
            />
          </div>

          {preferences.quietHours.enabled && (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="quiet-start">Início</Label>
                <Input
                  id="quiet-start"
                  type="time"
                  value={preferences.quietHours.start}
                  onChange={(e) => updateQuietHours('start', e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="quiet-end">Fim</Label>
                <Input
                  id="quiet-end"
                  type="time"
                  value={preferences.quietHours.end}
                  onChange={(e) => updateQuietHours('end', e.target.value)}
                />
              </div>
            </div>
          )}

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 flex gap-2">
            <AlertCircle className="h-5 w-5 text-blue-600 flex-shrink-0" />
            <p className="text-sm text-blue-900">
              Durante o horário de silêncio, as notificações serão agendadas para serem enviadas após o período.
              Notificações urgentes podem ainda ser enviadas.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Frequency Limits */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Limites de Frequência
          </CardTitle>
          <CardDescription>
            Controle a quantidade de notificações que você recebe
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="max-per-day">Máximo por dia</Label>
            <Input
              id="max-per-day"
              type="number"
              min="1"
              max="100"
              value={preferences.frequency.maxPerDay}
              onChange={(e) => updateFrequency('maxPerDay', parseInt(e.target.value))}
            />
          </div>
          <div>
            <Label htmlFor="max-per-week">Máximo por semana</Label>
            <Input
              id="max-per-week"
              type="number"
              min="1"
              max="500"
              value={preferences.frequency.maxPerWeek}
              onChange={(e) => updateFrequency('maxPerWeek', parseInt(e.target.value))}
            />
          </div>
          <div className="flex items-center justify-between">
            <Label htmlFor="respect-quiet">Respeitar horário de silêncio</Label>
            <Switch
              id="respect-quiet"
              checked={preferences.frequency.respectQuietHours}
              onCheckedChange={(checked) => updateFrequency('respectQuietHours', checked)}
            />
          </div>
        </CardContent>
      </Card>

      {/* Fallback Configuration */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5" />
            Configuração de Fallback
          </CardTitle>
          <CardDescription>
            Configure o canal alternativo caso o principal falhe
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <Label htmlFor="fallback-enabled">Ativar fallback automático</Label>
            <Switch
              id="fallback-enabled"
              checked={preferences.fallback.enabled}
              onCheckedChange={(checked) => updateFallback('enabled', checked)}
            />
          </div>

          {preferences.fallback.enabled && (
            <>
              <div>
                <Label htmlFor="primary-channel">Canal principal</Label>
                <Select
                  value={preferences.fallback.primaryChannel}
                  onValueChange={(value) => updateFallback('primaryChannel', value as NotificationChannel)}
                >
                  <SelectTrigger id="primary-channel">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {(Object.keys(CHANNEL_LABELS) as NotificationChannel[]).map((channel) => (
                      <SelectItem key={channel} value={channel}>
                        {CHANNEL_LABELS[channel].pt}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="fallback-channel">Canal de fallback</Label>
                <Select
                  value={preferences.fallback.fallbackChannel}
                  onValueChange={(value) => updateFallback('fallbackChannel', value as NotificationChannel)}
                >
                  <SelectTrigger id="fallback-channel">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {(Object.keys(CHANNEL_LABELS) as NotificationChannel[])
                      .filter(ch => ch !== preferences.fallback.primaryChannel)
                      .map((channel) => (
                        <SelectItem key={channel} value={channel}>
                          {CHANNEL_LABELS[channel].pt}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="fallback-delay">Tempo de espera (minutos)</Label>
                <Input
                  id="fallback-delay"
                  type="number"
                  min="5"
                  max="1440"
                  value={preferences.fallback.fallbackDelayMinutes}
                  onChange={(e) => updateFallback('fallbackDelayMinutes', parseInt(e.target.value))}
                />
                <p className="text-xs text-gray-500 mt-1">
                  Tempo para aguardar antes de tentar o canal de fallback
                </p>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Save Button (fixed at bottom) */}
      {hasChanges && (
        <div className="sticky bottom-4 bg-white border border-cyan-200 rounded-lg shadow-lg p-4 flex items-center justify-between">
          <p className="text-sm text-gray-700">Você tem alterações não salvas</p>
          <div className="flex gap-2">
            <Button variant="outline" onClick={fetchPreferences}>
              Cancelar
            </Button>
            <Button onClick={savePreferences} disabled={saving}>
              {saving ? 'Salvando...' : 'Salvar Alterações'}
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
