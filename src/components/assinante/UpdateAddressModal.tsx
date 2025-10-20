'use client'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Modal } from '@/components/ui/modal'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { X, Check, AlertCircle, MapPin } from 'lucide-react'
interface AddressData {
  zipCode: string
  street: string
  number: string
  complement?: string
  neighborhood: string
  city: string
  state: string
}
interface UpdateAddressModalProps {
  isOpen: boolean
  onClose: () => void
  currentAddress?: AddressData | null
  onAddressUpdate: (address: AddressData) => Promise<void>
}
export function UpdateAddressModal({
  isOpen,
  onClose,
  currentAddress,
  onAddressUpdate
}: UpdateAddressModalProps) {
  const [formData, setFormData] = useState<AddressData>(
    currentAddress || {
      zipCode: '',
      street: '',
      number: '',
      complement: '',
      neighborhood: '',
      city: '',
      state: ''
    }
  )
  const [loading, setLoading] = useState(false)
  const [loadingCep, setLoadingCep] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const handleCepBlur = async () => {
    const cep = formData.zipCode.replace(/\D/g, '')
    if (cep.length !== 8) {
      return
    }
    try {
      setLoadingCep(true)
      setError(null)
      const response = await fetch(`https://viacep.com.br/ws/${cep}/json/`)
      const data = await response.json()
      if (data.erro) {
        setError('CEP não encontrado')
        return
      }
      setFormData(prev => ({
        ...prev,
        street: data.logradouro || prev.street,
        neighborhood: data.bairro || prev.neighborhood,
        city: data.localidade || prev.city,
        state: data.uf || prev.state
      }))
    } catch (err) {
      setError('Erro ao buscar CEP')
    } finally {
      setLoadingCep(false)
    }
  }
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      setLoading(true)
      setError(null)
      await onAddressUpdate(formData)
      setSuccess(true)
      setTimeout(() => {
        onClose()
        setSuccess(false)
      }, 2000)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao atualizar endereço')
    } finally {
      setLoading(false)
    }
  }
  const handleChange = (field: keyof AddressData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }
  return (
    <Modal isOpen={isOpen} onClose={onClose} size="lg">
      <div className="p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <MapPin className="h-6 w-6 text-cyan-600" />
            <h2 className="text-2xl font-bold text-gray-900">Atualizar Endereço</h2>
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
              <p className="font-medium">Endereço atualizado com sucesso!</p>
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
        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* CEP */}
          <div>
            <Label htmlFor="zipCode">CEP *</Label>
            <Input
              id="zipCode"
              value={formData.zipCode}
              onChange={(e) => handleChange('zipCode', e.target.value)}
              onBlur={handleCepBlur}
              placeholder="00000-000"
              maxLength={9}
              required
            />
            {loadingCep && (
              <p className="text-xs text-gray-500 mt-1">Buscando CEP...</p>
            )}
          </div>
          {/* Street */}
          <div>
            <Label htmlFor="street">Rua *</Label>
            <Input
              id="street"
              value={formData.street}
              onChange={(e) => handleChange('street', e.target.value)}
              placeholder="Nome da rua"
              required
            />
          </div>
          {/* Number and Complement */}
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="number">Número *</Label>
              <Input
                id="number"
                value={formData.number}
                onChange={(e) => handleChange('number', e.target.value)}
                placeholder="123"
                required
              />
            </div>
            <div>
              <Label htmlFor="complement">Complemento</Label>
              <Input
                id="complement"
                value={formData.complement || ''}
                onChange={(e) => handleChange('complement', e.target.value)}
                placeholder="Apto 45, Bloco B"
              />
            </div>
          </div>
          {/* Neighborhood */}
          <div>
            <Label htmlFor="neighborhood">Bairro *</Label>
            <Input
              id="neighborhood"
              value={formData.neighborhood}
              onChange={(e) => handleChange('neighborhood', e.target.value)}
              placeholder="Nome do bairro"
              required
            />
          </div>
          {/* City and State */}
          <div className="grid md:grid-cols-3 gap-4">
            <div className="md:col-span-2">
              <Label htmlFor="city">Cidade *</Label>
              <Input
                id="city"
                value={formData.city}
                onChange={(e) => handleChange('city', e.target.value)}
                placeholder="Nome da cidade"
                required
              />
            </div>
            <div>
              <Label htmlFor="state">Estado *</Label>
              <Input
                id="state"
                value={formData.state}
                onChange={(e) => handleChange('state', e.target.value.toUpperCase())}
                placeholder="MG"
                maxLength={2}
                required
              />
            </div>
          </div>
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
              disabled={loading || loadingCep}
              className="flex-1"
            >
              {loading ? 'Salvando...' : 'Salvar Endereço'}
            </Button>
          </div>
        </form>
      </div>
    </Modal>
  )
}