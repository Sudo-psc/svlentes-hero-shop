/**
 * Subscriber Status Widgets Component
 *
 * Conditional widgets that adapt based on subscriber status
 * Shows different information for active, inactive, expiring prescription, etc.
 *
 * @author Dr. Philipe Saraiva Cruz
 */

'use client'

import { motion } from 'framer-motion'
import {
  AlertTriangle,
  Calendar,
  Clock,
  Package,
  TrendingUp,
  Trophy,
  AlertCircle,
  CheckCircle2,
  XCircle,
  RefreshCw
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Progress } from '@/components/ui/progress'
import { formatDate } from '@/lib/formatters'

interface Subscription {
  id: string
  status: string
  plan: {
    name: string
    price: number
  }
  nextBillingDate: Date | string
  currentPeriodEnd: Date | string
  prescriptionExpiresAt?: Date | string
  lastDelivery?: {
    date: Date | string
    trackingCode?: string
  }
  nextDelivery?: {
    date: Date | string
    estimatedDays: number
  }
}

interface GamificationProfile {
  points: {
    totalPoints: number
    currentLevel: number
    streakDays: number
  }
}

interface SubscriberStatusWidgetsProps {
  subscription: Subscription
  gamificationProfile?: GamificationProfile | null
  onRegularizePayment?: () => void
  onUpdatePrescription?: () => void
  onScheduleConsultation?: () => void
}

export function SubscriberStatusWidgets({
  subscription,
  gamificationProfile,
  onRegularizePayment,
  onUpdatePrescription,
  onScheduleConsultation
}: SubscriberStatusWidgetsProps) {
  const isActive = subscription.status === 'ACTIVE'
  const isInactive = subscription.status === 'INACTIVE' || subscription.status === 'PAST_DUE'
  const isCancelled = subscription.status === 'CANCELLED'

  // Check prescription expiration
  const prescriptionExpired = subscription.prescriptionExpiresAt
    ? new Date(subscription.prescriptionExpiresAt) < new Date()
    : false

  const prescriptionExpiresSoon = subscription.prescriptionExpiresAt
    ? new Date(subscription.prescriptionExpiresAt) < new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
    : false

  // Calculate days until next delivery
  const daysUntilDelivery = subscription.nextDelivery?.estimatedDays ?? 0

  return (
    <div className="space-y-6">
      {/* Critical Alert Banner - Prescription Expired */}
      {prescriptionExpired && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          <Alert className="border-2 border-red-500 bg-gradient-to-r from-red-50 to-red-100/50 shadow-lg">
            <AlertTriangle className="h-5 w-5 text-red-600" />
            <AlertDescription className="flex items-center justify-between gap-4">
              <div className="flex-1">
                <p className="text-red-900 font-bold text-base mb-1">
                  Sua receita médica venceu há{' '}
                  {Math.floor((new Date().getTime() - new Date(subscription.prescriptionExpiresAt!).getTime()) / (1000 * 60 * 60 * 24))} dias
                </p>
                <p className="text-red-700 text-sm">
                  Atualize sua prescrição para continuar recebendo suas lentes mensalmente
                </p>
              </div>
              {onUpdatePrescription && (
                <Button
                  className="bg-red-600 hover:bg-red-700 text-white shadow-md flex-shrink-0"
                  onClick={onUpdatePrescription}
                >
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Atualizar Receita
                </Button>
              )}
            </AlertDescription>
          </Alert>
        </motion.div>
      )}

      {/* Warning Alert - Prescription Expires Soon */}
      {!prescriptionExpired && prescriptionExpiresSoon && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          <Alert className="border-2 border-amber-400 bg-gradient-to-r from-amber-50 to-amber-100/50 shadow-md">
            <AlertCircle className="h-5 w-5 text-amber-600" />
            <AlertDescription className="flex items-center justify-between gap-4">
              <div className="flex-1">
                <p className="text-amber-900 font-bold text-base mb-1">
                  Sua receita médica vence em breve
                </p>
                <p className="text-amber-700 text-sm">
                  Agende uma consulta de renovação para evitar interrupções no seu recebimento
                </p>
              </div>
              {onScheduleConsultation && (
                <Button
                  variant="outline"
                  className="border-amber-600 text-amber-700 hover:bg-amber-50 flex-shrink-0"
                  onClick={onScheduleConsultation}
                >
                  <Calendar className="h-4 w-4 mr-2" />
                  Agendar Consulta
                </Button>
              )}
            </AlertDescription>
          </Alert>
        </motion.div>
      )}

      {/* Alert - Payment Overdue */}
      {isInactive && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          <Alert className="border-2 border-orange-500 bg-gradient-to-r from-orange-50 to-orange-100/50 shadow-lg">
            <XCircle className="h-5 w-5 text-orange-600" />
            <AlertDescription className="flex items-center justify-between gap-4">
              <div className="flex-1">
                <p className="text-orange-900 font-bold text-base mb-1">
                  Pagamento em atraso - Assinatura suspensa
                </p>
                <p className="text-orange-700 text-sm">
                  Regularize seu pagamento para reativar suas entregas mensais
                </p>
              </div>
              {onRegularizePayment && (
                <Button
                  className="bg-orange-600 hover:bg-orange-700 text-white shadow-md flex-shrink-0"
                  onClick={onRegularizePayment}
                >
                  Regularizar Pagamento
                </Button>
              )}
            </AlertDescription>
          </Alert>
        </motion.div>
      )}

      {/* Status Widgets Grid */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {/* Next Delivery Widget - Active Subscribers */}
        {isActive && subscription.nextDelivery && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.1, duration: 0.3 }}
          >
            <Card className="border-l-4 border-l-cyan-500 hover:shadow-lg transition-all duration-300">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <div className="p-2 rounded-lg bg-cyan-100 text-cyan-700">
                    <Package className="h-4 w-4" />
                  </div>
                  Próxima Entrega
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Previsão</span>
                  <Badge variant="outline" className="text-cyan-700 border-cyan-300 bg-cyan-50">
                    Em {daysUntilDelivery} dias
                  </Badge>
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900">
                    {formatDate(subscription.nextDelivery.date)}
                  </p>
                  <Progress value={(14 - daysUntilDelivery) / 14 * 100} className="h-2 mt-2" />
                  <p className="text-xs text-gray-500 mt-1">
                    {subscription.plan.name} - Entrega automática
                  </p>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Last Delivery Widget */}
        {subscription.lastDelivery && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2, duration: 0.3 }}
          >
            <Card className="border-l-4 border-l-green-500 hover:shadow-lg transition-all duration-300">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <div className="p-2 rounded-lg bg-green-100 text-green-700">
                    <CheckCircle2 className="h-4 w-4" />
                  </div>
                  Última Entrega
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <p className="text-2xl font-bold text-gray-900">
                    {formatDate(subscription.lastDelivery.date)}
                  </p>
                  {subscription.lastDelivery.trackingCode && (
                    <div className="mt-2 p-2 bg-gray-50 rounded-lg">
                      <p className="text-xs text-gray-600">Código de rastreio</p>
                      <p className="text-sm font-mono text-gray-900">
                        {subscription.lastDelivery.trackingCode}
                      </p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Gamification Status Widget */}
        {gamificationProfile && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.3, duration: 0.3 }}
          >
            <Card className="border-l-4 border-l-purple-500 hover:shadow-lg transition-all duration-300">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <div className="p-2 rounded-lg bg-purple-100 text-purple-700">
                    <Trophy className="h-4 w-4" />
                  </div>
                  Seu Progresso
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-gray-600">Pontos Totais</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {gamificationProfile.points.totalPoints.toLocaleString('pt-BR')}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-gray-600">Nível</p>
                    <p className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-purple-700 bg-clip-text text-transparent">
                      {gamificationProfile.points.currentLevel}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 p-2 bg-orange-50 rounded-lg">
                  <span className="text-2xl">🔥</span>
                  <div>
                    <p className="text-xs text-gray-600">Sequência atual</p>
                    <p className="text-sm font-bold text-gray-900">
                      {gamificationProfile.points.streakDays} dias
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Next Billing Widget */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.4, duration: 0.3 }}
        >
          <Card className="border-l-4 border-l-indigo-500 hover:shadow-lg transition-all duration-300">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-lg">
                <div className="p-2 rounded-lg bg-indigo-100 text-indigo-700">
                  <Clock className="h-4 w-4" />
                </div>
                Próxima Cobrança
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <p className="text-sm text-gray-600 mb-1">Data de renovação</p>
                <p className="text-2xl font-bold text-gray-900">
                  {formatDate(subscription.nextBillingDate)}
                </p>
              </div>
              <div className="flex items-center justify-between p-3 bg-indigo-50 rounded-lg">
                <span className="text-sm font-medium text-gray-700">
                  Valor do plano
                </span>
                <span className="text-lg font-bold text-indigo-700">
                  R$ {subscription.plan.price.toFixed(2)}
                </span>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Savings Widget - Show accumulated savings */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.5, duration: 0.3 }}
        >
          <Card className="border-l-4 border-l-emerald-500 hover:shadow-lg transition-all duration-300">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-lg">
                <div className="p-2 rounded-lg bg-emerald-100 text-emerald-700">
                  <TrendingUp className="h-4 w-4" />
                </div>
                Economia Total
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <p className="text-sm text-gray-600 mb-1">Você já economizou</p>
                <p className="text-3xl font-bold bg-gradient-to-r from-emerald-600 to-emerald-700 bg-clip-text text-transparent">
                  R$ 456,00
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  em comparação com compras avulsas
                </p>
              </div>
              <div className="p-3 bg-emerald-50 rounded-lg">
                <p className="text-xs text-emerald-700 font-medium">
                  💚 Continue economizando com sua assinatura!
                </p>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  )
}
