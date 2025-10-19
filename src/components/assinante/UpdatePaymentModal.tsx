'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'
import { Input } from '@/components/ui/Input'
import { Label } from '@/components/ui/Label'
import { X, Check, AlertCircle, CreditCard, Barcode } from 'lucide-react'

type PaymentType = 'CREDIT_CARD' | 'BOLETO' | 'PIX'

interface UpdatePaymentModalProps {
  isOpen: boolean
  onClose: () => void
  currentPaymentMethod?: {
    type: PaymentType
    last4?: string
  }
  onPaymentUpdate: (paymentData: any) => Promise<void>
}

export function UpdatePaymentModal({
  isOpen,
  onClose,
  currentPaymentMethod,
  onPaymentUpdate
}: UpdatePaymentModalProps) {
  const [paymentType, setPaymentType] = useState<PaymentType>(
    currentPaymentMethod?.type || 'PIX'
  )
  const [creditCardData, setCreditCardData] = useState({
    holderName: '',
    number: '',
    expiryMonth: '',
    expiryYear: '',
    ccv: ''
  })
  const [holderInfo, setHolderInfo] = useState({
    name: '',
    email: '',
    cpfCnpj: '',
    postalCode: '',
    addressNumber: '',
    phone: ''
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    try {
      setLoading(true)
      setError(null)

      const paymentData: any = {
        billingType: paymentType
      }

      if (paymentType === 'CREDIT_CARD') {
        paymentData.creditCard = creditCardData
        paymentData.creditCardHolderInfo = holderInfo
      }

      await onPaymentUpdate(paymentData)
      setSuccess(true)
      setTimeout(() => {
        onClose()
        setSuccess(false)
      }, 2000)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao atualizar forma de pagamento')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="lg">
      <div className="p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <CreditCard className="h-6 w-6 text-cyan-600" />
            <h2 className="text-2xl font-bold text-gray-900">Alterar Forma de Pagamento</h2>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Success Message */}
        {success && (
          <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
            <div className="flex items-center gap-2 text-green-800">
              <Check className="h-5 w-5" />
              <p className="font-medium">Forma de pagamento atualizada com sucesso!</p>
            </div>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-center gap-2 text-red-800">
              <AlertCircle className="h-5 w-5" />
              <p className="font-medium">{error}</p>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          {/* Payment Type Selection */}
          <div className="mb-6">
            <Label>Escolha a forma de pagamento:</Label>
            <div className="grid grid-cols-3 gap-3 mt-2">
              <button
                type="button"
                onClick={() => setPaymentType('PIX')}
                className={`
                  p-4 border-2 rounded-lg transition-all
                  ${paymentType === 'PIX'
                    ? 'border-cyan-600 bg-cyan-50'
                    : 'border-gray-200 hover:border-gray-300'
                  }
                `}
              >
                <div className="text-center">
                  <div className="text-2xl mb-1">💳</div>
                  <p className="text-sm font-medium">PIX</p>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setPaymentType('BOLETO')}
                className={`
                  p-4 border-2 rounded-lg transition-all
                  ${paymentType === 'BOLETO'
                    ? 'border-cyan-600 bg-cyan-50'
                    : 'border-gray-200 hover:border-gray-300'
                  }
                `}
              >
                <div className="text-center">
                  <Barcode className="h-6 w-6 mx-auto mb-1" />
                  <p className="text-sm font-medium">Boleto</p>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setPaymentType('CREDIT_CARD')}
                className={`
                  p-4 border-2 rounded-lg transition-all
                  ${paymentType === 'CREDIT_CARD'
                    ? 'border-cyan-600 bg-cyan-50'
                    : 'border-gray-200 hover:border-gray-300'
                  }
                `}
              >
                <div className="text-center">
                  <CreditCard className="h-6 w-6 mx-auto mb-1" />
                  <p className="text-sm font-medium">Cartão</p>
                </div>
              </button>
            </div>
          </div>

          {/* Credit Card Form */}
          {paymentType === 'CREDIT_CARD' && (
            <div className="space-y-4 mb-6 p-4 bg-gray-50 rounded-lg">
              <h3 className="font-semibold text-gray-900">Dados do Cartão</h3>

              <div>
                <Label htmlFor="cardNumber">Número do Cartão *</Label>
                <Input
                  id="cardNumber"
                  value={creditCardData.number}
                  onChange={(e) => setCreditCardData(prev => ({ ...prev, number: e.target.value.replace(/\D/g, '') }))}
                  placeholder="0000 0000 0000 0000"
                  maxLength={19}
                  required
                />
              </div>

              <div>
                <Label htmlFor="holderName">Nome no Cartão *</Label>
                <Input
                  id="holderName"
                  value={creditCardData.holderName}
                  onChange={(e) => setCreditCardData(prev => ({ ...prev, holderName: e.target.value.toUpperCase() }))}
                  placeholder="NOME COMO ESTÁ NO CARTÃO"
                  required
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <Label htmlFor="expiryMonth">Mês *</Label>
                  <Input
                    id="expiryMonth"
                    value={creditCardData.expiryMonth}
                    onChange={(e) => setCreditCardData(prev => ({ ...prev, expiryMonth: e.target.value }))}
                    placeholder="MM"
                    maxLength={2}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="expiryYear">Ano *</Label>
                  <Input
                    id="expiryYear"
                    value={creditCardData.expiryYear}
                    onChange={(e) => setCreditCardData(prev => ({ ...prev, expiryYear: e.target.value }))}
                    placeholder="AAAA"
                    maxLength={4}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="ccv">CVV *</Label>
                  <Input
                    id="ccv"
                    value={creditCardData.ccv}
                    onChange={(e) => setCreditCardData(prev => ({ ...prev, ccv: e.target.value }))}
                    placeholder="123"
                    maxLength={4}
                    required
                  />
                </div>
              </div>

              <h3 className="font-semibold text-gray-900 pt-4 border-t">Dados do Titular</h3>

              <div>
                <Label htmlFor="holderInfoName">Nome Completo *</Label>
                <Input
                  id="holderInfoName"
                  value={holderInfo.name}
                  onChange={(e) => setHolderInfo(prev => ({ ...prev, name: e.target.value }))}
                  required
                />
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="cpf">CPF *</Label>
                  <Input
                    id="cpf"
                    value={holderInfo.cpfCnpj}
                    onChange={(e) => setHolderInfo(prev => ({ ...prev, cpfCnpj: e.target.value.replace(/\D/g, '') }))}
                    placeholder="000.000.000-00"
                    maxLength={11}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="holderEmail">Email *</Label>
                  <Input
                    id="holderEmail"
                    type="email"
                    value={holderInfo.email}
                    onChange={(e) => setHolderInfo(prev => ({ ...prev, email: e.target.value }))}
                    required
                  />
                </div>
              </div>

              <div className="grid md:grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="holderCep">CEP *</Label>
                  <Input
                    id="holderCep"
                    value={holderInfo.postalCode}
                    onChange={(e) => setHolderInfo(prev => ({ ...prev, postalCode: e.target.value }))}
                    placeholder="00000-000"
                    maxLength={9}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="holderNumber">Número *</Label>
                  <Input
                    id="holderNumber"
                    value={holderInfo.addressNumber}
                    onChange={(e) => setHolderInfo(prev => ({ ...prev, addressNumber: e.target.value }))}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="holderPhone">Telefone *</Label>
                  <Input
                    id="holderPhone"
                    value={holderInfo.phone}
                    onChange={(e) => setHolderInfo(prev => ({ ...prev, phone: e.target.value.replace(/\D/g, '') }))}
                    placeholder="(00) 00000-0000"
                    maxLength={11}
                    required
                  />
                </div>
              </div>
            </div>
          )}

          {/* Info Messages */}
          {paymentType === 'PIX' && (
            <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-sm text-blue-900">
                ✅ Com PIX, você receberá um QR Code para pagamento na próxima fatura.
                O pagamento é instantâneo e sem taxas adicionais.
              </p>
            </div>
          )}

          {paymentType === 'BOLETO' && (
            <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-sm text-blue-900">
                ℹ️ Com Boleto Bancário, você receberá o boleto por email para pagamento.
                O prazo de compensação é de até 3 dias úteis.
              </p>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3 pt-4 border-t">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={loading}
              className="flex-1"
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={loading}
              className="flex-1"
            >
              {loading ? 'Salvando...' : 'Salvar Forma de Pagamento'}
            </Button>
          </div>
        </form>
      </div>
    </Modal>
  )
}
