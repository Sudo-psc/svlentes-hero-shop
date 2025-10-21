'use client'
import { useState } from 'react'
import { MapPin, Edit2, Save, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { formatZipCode } from '@/lib/formatters'
export interface ShippingAddress {
  street: string
  number: string
  complement?: string
  neighborhood: string
  city: string
  state: string
  zipCode: string
}
interface ShippingAddressCardProps {
  address: ShippingAddress | null
  loading?: boolean
  onUpdate?: (address: ShippingAddress) => Promise<void>
}
export default function ShippingAddressCard({
  address,
  loading = false,
  onUpdate
}: ShippingAddressCardProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [editedAddress, setEditedAddress] = useState<ShippingAddress | null>(address)
  const handleEdit = () => {
    setEditedAddress(address)
    setIsEditing(true)
  }
  const handleCancel = () => {
    setEditedAddress(address)
    setIsEditing(false)
  }
  const handleSave = async () => {
    if (!editedAddress || !onUpdate) return
    try {
      setIsSaving(true)
      await onUpdate(editedAddress)
      setIsEditing(false)
    } catch (error) {
      console.error('Error updating address:', error)
    } finally {
      setIsSaving(false)
    }
  }
  const handleChange = (field: keyof ShippingAddress, value: string) => {
    if (!editedAddress) return
    setEditedAddress({ ...editedAddress, [field]: value })
  }
  if (loading) {
    return (
      <div className="bg-white p-6 rounded-xl shadow-sm border">
        <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <MapPin className="h-5 w-5 text-cyan-600" />
          Endereço de Entrega
        </h3>
        <div className="space-y-3 animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-3/4"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2"></div>
          <div className="h-4 bg-gray-200 rounded w-2/3"></div>
        </div>
      </div>
    )
  }
  if (!address && !isEditing) {
    return (
      <div className="bg-white p-6 rounded-xl shadow-sm border">
        <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <MapPin className="h-5 w-5 text-cyan-600" />
          Endereço de Entrega
        </h3>
        <div className="text-center py-8">
          <MapPin className="h-12 w-12 text-gray-400 mx-auto mb-2" />
          <p className="text-gray-600 mb-4">Nenhum endereço de entrega cadastrado</p>
          <Button onClick={handleEdit} size="sm">
            Cadastrar Endereço
          </Button>
        </div>
      </div>
    )
  }
  return (
    <div className="bg-white p-6 rounded-xl shadow-sm border">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-gray-900 flex items-center gap-2">
          <MapPin className="h-5 w-5 text-cyan-600" />
          {isEditing ? 'Editar Endereço de Entrega' : 'Endereço de Entrega'}
        </h3>
        {!isEditing && onUpdate && (
          <Button variant="ghost" size="sm" onClick={handleEdit}>
            <Edit2 className="h-4 w-4 mr-1" />
            Editar
          </Button>
        )}
      </div>
      {!isEditing && address ? (
        <div className="text-sm space-y-2">
          <p className="font-medium text-gray-900">
            {address.street}, {address.number}
            {address.complement && `, ${address.complement}`}
          </p>
          <p className="text-gray-700">
            {address.neighborhood}
          </p>
          <p className="text-gray-700">
            {address.city} - {address.state}
          </p>
          <p className="text-gray-700">
            CEP: {formatZipCode(address.zipCode)}
          </p>
        </div>
      ) : (
        <form className="space-y-4" onSubmit={(e) => { e.preventDefault(); handleSave(); }}>
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                CEP
              </label>
              <input
                type="text"
                value={editedAddress?.zipCode || ''}
                onChange={(e) => handleChange('zipCode', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
                placeholder="00000-000"
                required
              />
            </div>
            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Rua
              </label>
              <input
                type="text"
                value={editedAddress?.street || ''}
                onChange={(e) => handleChange('street', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
                placeholder="Nome da rua"
                required
              />
            </div>
            <div className="col-span-1">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Número
              </label>
              <input
                type="text"
                value={editedAddress?.number || ''}
                onChange={(e) => handleChange('number', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
                placeholder="123"
                required
              />
            </div>
            <div className="col-span-1">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Complemento
              </label>
              <input
                type="text"
                value={editedAddress?.complement || ''}
                onChange={(e) => handleChange('complement', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
                placeholder="Apto, bloco..."
              />
            </div>
            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Bairro
              </label>
              <input
                type="text"
                value={editedAddress?.neighborhood || ''}
                onChange={(e) => handleChange('neighborhood', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
                placeholder="Nome do bairro"
                required
              />
            </div>
            <div className="col-span-1">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Cidade
              </label>
              <input
                type="text"
                value={editedAddress?.city || ''}
                onChange={(e) => handleChange('city', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
                placeholder="Cidade"
                required
              />
            </div>
            <div className="col-span-1">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Estado
              </label>
              <input
                type="text"
                value={editedAddress?.state || ''}
                onChange={(e) => handleChange('state', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
                placeholder="UF"
                maxLength={2}
                required
              />
            </div>
          </div>
          <div className="flex gap-2 pt-2">
            <Button
              type="submit"
              size="sm"
              disabled={isSaving}
              className="flex-1"
            >
              <Save className="h-4 w-4 mr-2" />
              {isSaving ? 'Salvando...' : 'Salvar'}
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleCancel}
              disabled={isSaving}
              className="flex-1"
            >
              <X className="h-4 w-4 mr-2" />
              Cancelar
            </Button>
          </div>
        </form>
      )}
    </div>
  )
}