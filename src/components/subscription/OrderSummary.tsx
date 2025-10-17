'use client'

import { Check, Edit2, ShoppingCart, AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Checkbox } from '@/components/ui/Checkbox'
import { pricingPlans } from '@/data/pricing-plans'
import { useState } from 'react'
import { ContactData, LensData, ValidationError } from '@/types/subscription'
import {
    validateEmail,
    validatePhone,
    validateCPFOrCNPJ,
    maskPhone,
    maskCPFOrCNPJ,
} from '@/lib/validators'

interface OrderSummaryProps {
    planId: string
    billingCycle: 'monthly' | 'annual'
    lensData: LensData
    addOns: string[]
    onBack: () => void
    onConfirm: (contactData: ContactData) => void
}

const addOnPrices: Record<string, { name: string; price: number }> = {
    solution: { name: 'Solução de Limpeza', price: 25 },
    drops: { name: 'Lágrimas Artificiais', price: 15 },
    case: { name: 'Estojo Premium', price: 10 },
    consultation: { name: 'Consultas Extras', price: 80 },
    insurance: { name: 'Seguro Premium', price: 20 },
    express: { name: 'Entrega Express', price: 30 }
}

export function OrderSummary({ planId, billingCycle, lensData, addOns, onBack, onConfirm }: OrderSummaryProps) {
    const [contactData, setContactData] = useState<ContactData>({
        name: '',
        email: '',
        phone: '',
        cpfCnpj: '',
        billingType: 'PIX',
        acceptsTerms: false,
        acceptsDataProcessing: false,
    })

    const [errors, setErrors] = useState<Record<string, string>>({})
    const [touched, setTouched] = useState<Record<string, boolean>>({})

    const plan = pricingPlans.find(p => p.id === planId)
    if (!plan) return null

    const planPrice = billingCycle === 'monthly' ? plan.priceMonthly : plan.priceAnnual / 12
    const addOnsTotal = addOns.reduce((sum, addOnId) => sum + (addOnPrices[addOnId]?.price || 0), 0)
    const monthlyTotal = planPrice + addOnsTotal
    const annualTotal = billingCycle === 'annual' ? plan.priceAnnual + (addOnsTotal * 12) : monthlyTotal * 12

    // Validação em tempo real
    const validateField = (field: keyof ContactData, value: string | boolean): string => {
        switch (field) {
            case 'name':
                return typeof value === 'string' && value.trim().length < 3
                    ? 'Nome deve ter pelo menos 3 caracteres'
                    : ''
            case 'email':
                return typeof value === 'string' && !validateEmail(value)
                    ? 'Email inválido'
                    : ''
            case 'phone':
                return typeof value === 'string' && !validatePhone(value)
                    ? 'Telefone inválido (formato: (XX) 9XXXX-XXXX)'
                    : ''
            case 'cpfCnpj':
                return typeof value === 'string' && value && !validateCPFOrCNPJ(value)
                    ? 'CPF/CNPJ inválido'
                    : ''
            case 'acceptsTerms':
                return !value ? 'Você deve aceitar os termos de uso' : ''
            case 'acceptsDataProcessing':
                return !value ? 'Você deve autorizar o processamento de dados' : ''
            default:
                return ''
        }
    }

    const handleInputChange = (field: keyof ContactData, value: string) => {
        let maskedValue = value

        // Aplicar máscaras
        if (field === 'phone') {
            maskedValue = maskPhone(value)
        } else if (field === 'cpfCnpj') {
            maskedValue = maskCPFOrCNPJ(value)
        }

        setContactData(prev => ({ ...prev, [field]: maskedValue }))

        // Validar apenas se o campo já foi tocado
        if (touched[field]) {
            const error = validateField(field, maskedValue)
            setErrors(prev => ({ ...prev, [field]: error }))
        }
    }

    const handleBlur = (field: keyof ContactData) => {
        setTouched(prev => ({ ...prev, [field]: true }))
        const value = contactData[field]
        const error = validateField(field, value ?? '')
        setErrors(prev => ({ ...prev, [field]: error }))
    }

    const isValid =
        contactData.name.trim().length >= 3 &&
        validateEmail(contactData.email) &&
        validatePhone(contactData.phone) &&
        (!contactData.cpfCnpj || validateCPFOrCNPJ(contactData.cpfCnpj)) &&
        contactData.acceptsTerms &&
        contactData.acceptsDataProcessing &&
        Object.values(errors).every(error => !error)

    return (
        <div className="max-w-4xl mx-auto">
            <div className="text-center mb-8">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <ShoppingCart className="w-8 h-8 text-green-600" />
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-2">
                    Resumo do Pedido
                </h3>
                <p className="text-gray-600">
                    Revise os detalhes antes de finalizar
                </p>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
                {/* Order Details */}
                <div className="space-y-6">
                    {/* Plan Details */}
                    <div className="bg-white rounded-xl border-2 border-gray-200 p-6">
                        <div className="flex items-center justify-between mb-4">
                            <h4 className="font-semibold text-gray-900">Plano Selecionado</h4>
                            <button className="text-primary-600 hover:text-primary-700 text-sm font-medium">
                                <Edit2 className="w-4 h-4" />
                            </button>
                        </div>
                        <div className="space-y-3">
                            <div>
                                <p className="text-lg font-bold text-gray-900">{plan.name}</p>
                                <p className="text-sm text-gray-600">
                                    Cobrança {billingCycle === 'monthly' ? 'mensal' : 'anual'}
                                </p>
                            </div>
                            <div className="flex justify-between items-baseline">
                                <span className="text-gray-600">Valor mensal</span>
                                <span className="text-xl font-bold text-gray-900">
                                    R$ {planPrice.toFixed(2)}
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Lens Details */}
                    <div className="bg-white rounded-xl border-2 border-gray-200 p-6">
                        <div className="flex items-center justify-between mb-4">
                            <h4 className="font-semibold text-gray-900">Especificações</h4>
                            <button className="text-primary-600 hover:text-primary-700 text-sm font-medium">
                                <Edit2 className="w-4 h-4" />
                            </button>
                        </div>
                        <div className="space-y-2 text-sm">
                            <div className="flex justify-between">
                                <span className="text-gray-600">Tipo de lente</span>
                                <span className="font-medium text-gray-900 capitalize">{lensData.type}</span>
                            </div>
                            {lensData.brand && (
                                <div className="flex justify-between">
                                    <span className="text-gray-600">Marca</span>
                                    <span className="font-medium text-gray-900">{lensData.brand}</span>
                                </div>
                            )}
                            <div className="pt-2 border-t border-gray-200">
                                <p className="text-gray-600 mb-1">Olho Direito (OD)</p>
                                <p className="font-medium text-gray-900">
                                    ESF: {lensData.rightEye.sphere || 'N/A'} |
                                    CIL: {lensData.rightEye.cylinder || 'N/A'} |
                                    EIXO: {lensData.rightEye.axis || 'N/A'}
                                </p>
                            </div>
                            <div className="pt-2 border-t border-gray-200">
                                <p className="text-gray-600 mb-1">Olho Esquerdo (OE)</p>
                                <p className="font-medium text-gray-900">
                                    ESF: {lensData.leftEye.sphere || 'N/A'} |
                                    CIL: {lensData.leftEye.cylinder || 'N/A'} |
                                    EIXO: {lensData.leftEye.axis || 'N/A'}
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Add-ons */}
                    {addOns.length > 0 && (
                        <div className="bg-white rounded-xl border-2 border-gray-200 p-6">
                            <div className="flex items-center justify-between mb-4">
                                <h4 className="font-semibold text-gray-900">Serviços Adicionais</h4>
                                <button className="text-primary-600 hover:text-primary-700 text-sm font-medium">
                                    <Edit2 className="w-4 h-4" />
                                </button>
                            </div>
                            <div className="space-y-2">
                                {addOns.map(addOnId => {
                                    const addOn = addOnPrices[addOnId]
                                    if (!addOn) return null
                                    return (
                                        <div key={addOnId} className="flex justify-between items-center">
                                            <div className="flex items-center space-x-2">
                                                <Check className="w-4 h-4 text-green-600" />
                                                <span className="text-sm text-gray-700">{addOn.name}</span>
                                            </div>
                                            <span className="text-sm font-medium text-gray-900">
                                                +R$ {addOn.price}
                                            </span>
                                        </div>
                                    )
                                })}
                            </div>
                        </div>
                    )}
                </div>

                {/* Contact Form & Total */}
                <div className="space-y-6">
                    {/* Contact Information */}
                    <div className="bg-white rounded-xl border-2 border-gray-200 p-6">
                        <h4 className="font-semibold text-gray-900 mb-4">Seus Dados</h4>
                        <div className="space-y-4">
                            <div>
                                <Input
                                    label="Nome completo"
                                    placeholder="João Silva"
                                    value={contactData.name}
                                    onChange={(e) => handleInputChange('name', e.target.value)}
                                    onBlur={() => handleBlur('name')}
                                    required
                                    className={errors.name && touched.name ? 'border-red-500' : ''}
                                />
                                {errors.name && touched.name && (
                                    <p className="text-red-600 text-sm mt-1 flex items-center gap-1">
                                        <AlertCircle className="w-4 h-4" />
                                        {errors.name}
                                    </p>
                                )}
                            </div>

                            <div>
                                <Input
                                    label="WhatsApp"
                                    placeholder="(11) 99999-9999"
                                    value={contactData.phone}
                                    onChange={(e) => handleInputChange('phone', e.target.value)}
                                    onBlur={() => handleBlur('phone')}
                                    required
                                    maxLength={15}
                                    className={errors.phone && touched.phone ? 'border-red-500' : ''}
                                />
                                {errors.phone && touched.phone && (
                                    <p className="text-red-600 text-sm mt-1 flex items-center gap-1">
                                        <AlertCircle className="w-4 h-4" />
                                        {errors.phone}
                                    </p>
                                )}
                            </div>

                            <div>
                                <Input
                                    label="E-mail"
                                    type="email"
                                    placeholder="joao@email.com"
                                    value={contactData.email}
                                    onChange={(e) => handleInputChange('email', e.target.value)}
                                    onBlur={() => handleBlur('email')}
                                    required
                                    className={errors.email && touched.email ? 'border-red-500' : ''}
                                />
                                {errors.email && touched.email && (
                                    <p className="text-red-600 text-sm mt-1 flex items-center gap-1">
                                        <AlertCircle className="w-4 h-4" />
                                        {errors.email}
                                    </p>
                                )}
                            </div>

                            <div>
                                <Input
                                    label="CPF/CNPJ"
                                    placeholder="000.000.000-00"
                                    value={contactData.cpfCnpj}
                                    onChange={(e) => handleInputChange('cpfCnpj', e.target.value)}
                                    onBlur={() => handleBlur('cpfCnpj')}
                                    maxLength={18}
                                    className={errors.cpfCnpj && touched.cpfCnpj ? 'border-red-500' : ''}
                                />
                                {errors.cpfCnpj && touched.cpfCnpj && (
                                    <p className="text-red-600 text-sm mt-1 flex items-center gap-1">
                                        <AlertCircle className="w-4 h-4" />
                                        {errors.cpfCnpj}
                                    </p>
                                )}
                                <p className="text-xs text-gray-500 mt-1">
                                    Necessário para emissão de nota fiscal
                                </p>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Forma de Pagamento
                                </label>
                                <select
                                    value={contactData.billingType}
                                    onChange={(e) => setContactData(prev => ({ ...prev, billingType: e.target.value as 'PIX' | 'BOLETO' | 'CREDIT_CARD' }))}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                                >
                                    <option value="PIX">PIX</option>
                                    <option value="BOLETO">Boleto Bancário</option>
                                    <option value="CREDIT_CARD">Cartão de Crédito</option>
                                </select>
                            </div>
                            <div className="pt-2 space-y-3">
                                <div>
                                    <label className="flex items-start space-x-3 cursor-pointer">
                                        <Checkbox
                                            checked={contactData.acceptsTerms}
                                            onChange={(e) => {
                                                setContactData(prev => ({ ...prev, acceptsTerms: e.target.checked }))
                                                handleBlur('acceptsTerms')
                                            }}
                                        />
                                        <span className="text-sm text-gray-700">
                                            Aceito os{' '}
                                            <a href="/termos-uso" target="_blank" className="text-primary-600 hover:underline">
                                                termos de uso
                                            </a>{' '}
                                            e{' '}
                                            <a href="/politica-privacidade" target="_blank" className="text-primary-600 hover:underline">
                                                política de privacidade
                                            </a>
                                        </span>
                                    </label>
                                    {errors.acceptsTerms && touched.acceptsTerms && (
                                        <p className="text-red-600 text-xs mt-1 ml-7">{errors.acceptsTerms}</p>
                                    )}
                                </div>

                                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                                    <label className="flex items-start space-x-3 cursor-pointer">
                                        <Checkbox
                                            checked={contactData.acceptsDataProcessing}
                                            onChange={(e) => {
                                                setContactData(prev => ({ ...prev, acceptsDataProcessing: e.target.checked }))
                                                handleBlur('acceptsDataProcessing')
                                            }}
                                        />
                                        <span className="text-xs text-gray-700">
                                            <strong>Autorização LGPD:</strong> Autorizo o processamento dos meus dados pessoais
                                            e dados de saúde (prescrição médica) para fins de fornecimento de lentes de contato
                                            e acompanhamento médico. Estou ciente de que posso solicitar acesso, correção ou
                                            exclusão dos meus dados a qualquer momento.
                                        </span>
                                    </label>
                                    {errors.acceptsDataProcessing && touched.acceptsDataProcessing && (
                                        <p className="text-red-600 text-xs mt-1 ml-7">{errors.acceptsDataProcessing}</p>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Price Summary */}
                    <div className="bg-gradient-to-br from-primary-600 to-primary-700 rounded-xl p-6 text-white">
                        <h4 className="font-semibold mb-4">Resumo de Valores</h4>
                        <div className="space-y-3">
                            <div className="flex justify-between text-sm">
                                <span className="text-primary-100">Plano {plan.name}</span>
                                <span>R$ {planPrice.toFixed(2)}</span>
                            </div>
                            {addOns.length > 0 && (
                                <div className="flex justify-between text-sm">
                                    <span className="text-primary-100">Serviços adicionais</span>
                                    <span>R$ {addOnsTotal.toFixed(2)}</span>
                                </div>
                            )}
                            <div className="pt-3 border-t border-primary-500">
                                <div className="flex justify-between items-baseline mb-2">
                                    <span className="text-lg font-semibold">Total mensal</span>
                                    <span className="text-3xl font-bold">R$ {monthlyTotal.toFixed(2)}</span>
                                </div>
                                {billingCycle === 'annual' && (
                                    <p className="text-sm text-primary-100">
                                        Cobrança anual de R$ {annualTotal.toFixed(2)}
                                    </p>
                                )}
                            </div>
                            <div className="bg-white/10 rounded-lg p-3 text-sm">
                                <p className="text-primary-100 mb-1">Economia estimada</p>
                                <p className="text-xl font-bold">
                                    ~R$ {(monthlyTotal * 0.35).toFixed(2)}/mês
                                </p>
                                <p className="text-xs text-primary-100 mt-1">
                                    vs compra avulsa tradicional
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Actions */}
                    <div className="space-y-3">
                        <Button
                            onClick={() => onConfirm(contactData)}
                            disabled={!isValid}
                            className="w-full text-lg py-6"
                            size="lg"
                        >
                            Finalizar e Agendar Consulta
                        </Button>
                        <Button
                            variant="outline"
                            onClick={onBack}
                            className="w-full"
                        >
                            Voltar
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    )
}
