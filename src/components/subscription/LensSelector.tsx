'use client'

import { useState } from 'react'
import { Eye, Info, Calendar, UserCheck, AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { validatePrescriptionDate, validateCRM } from '@/lib/validators'

interface LensData {
    type: 'daily' | 'weekly' | 'monthly'
    brand: string
    rightEye: {
        sphere: string
        cylinder: string
        axis: string
    }
    leftEye: {
        sphere: string
        cylinder: string
        axis: string
    }
    prescriptionDate?: string
    doctorCRM?: string
    doctorName?: string
}

interface ValidationErrors {
    rightSphere?: string
    rightCylinder?: string
    rightAxis?: string
    leftSphere?: string
    leftCylinder?: string
    leftAxis?: string
    prescriptionDate?: string
    doctorCRM?: string
}

interface LensSelectorProps {
    onContinue: (data: LensData) => void
    onBack: () => void
}

const lensTypes = [
    { id: 'daily', name: 'Diárias', description: 'Uso único, máximo conforto' },
    { id: 'weekly', name: 'Semanais', description: 'Troca semanal' },
    { id: 'monthly', name: 'Mensais', description: 'Troca mensal, econômicas' }
]

const popularBrands = [
    'Acuvue',
    'Biofinity',
    'Air Optix',
    'Bausch + Lomb',
    'CooperVision',
    'Outra marca'
]

/**
 * Valida valor esférico (grau de miopia/hipermetropia)
 * Faixa típica: -20.00 a +20.00 em passos de 0.25
 */
function validateSphere(value: string): string | undefined {
    if (!value) return 'Campo obrigatório'

    const num = parseFloat(value)
    if (isNaN(num)) return 'Valor inválido'
    if (num < -20 || num > 20) return 'Faixa válida: -20.00 a +20.00'

    // Verifica se é múltiplo de 0.25
    const decimal = Math.abs((num * 100) % 25)
    if (decimal > 0.01) return 'Use passos de 0.25 (ex: -2.00, -2.25, -2.50)'

    return undefined
}

/**
 * Valida valor cilíndrico (grau de astigmatismo)
 * Faixa típica: 0.00 a -6.00 em passos de 0.25
 */
function validateCylinder(value: string): string | undefined {
    if (!value) return undefined // Cilíndrico é opcional

    const num = parseFloat(value)
    if (isNaN(num)) return 'Valor inválido'
    if (num > 0) return 'Cilíndrico deve ser negativo ou zero'
    if (num < -6) return 'Faixa válida: 0.00 a -6.00'

    // Verifica se é múltiplo de 0.25
    const decimal = Math.abs((num * 100) % 25)
    if (decimal > 0.01) return 'Use passos de 0.25 (ex: -0.75, -1.00)'

    return undefined
}

/**
 * Valida eixo (direção do astigmatismo)
 * Faixa: 0 a 180 graus
 */
function validateAxis(value: string, cylinder: string): string | undefined {
    // Se não tem cilíndrico, eixo não é necessário
    if (!cylinder || parseFloat(cylinder) === 0) {
        return undefined
    }

    if (!value) return 'Necessário quando há cilíndrico'

    const num = parseInt(value)
    if (isNaN(num)) return 'Valor inválido'
    if (num < 0 || num > 180) return 'Faixa válida: 0 a 180'

    return undefined
}

export function LensSelector({ onContinue, onBack }: LensSelectorProps) {
    const [lensData, setLensData] = useState<LensData>({
        type: 'monthly',
        brand: '',
        rightEye: { sphere: '', cylinder: '', axis: '' },
        leftEye: { sphere: '', cylinder: '', axis: '' }
    })

    const [sameForBothEyes, setSameForBothEyes] = useState(false)
    const [errors, setErrors] = useState<ValidationErrors>({})

    const handleTypeSelect = (type: 'daily' | 'weekly' | 'monthly') => {
        setLensData(prev => ({ ...prev, type }))
    }

    const handleRightEyeChange = (field: keyof LensData['rightEye'], value: string) => {
        const newRightEye = { ...lensData.rightEye, [field]: value }

        // Validação em tempo real
        const newErrors = { ...errors }
        if (field === 'sphere') {
            const error = validateSphere(value)
            if (error) newErrors.rightSphere = error
            else delete newErrors.rightSphere
        } else if (field === 'cylinder') {
            const error = validateCylinder(value)
            if (error) newErrors.rightCylinder = error
            else delete newErrors.rightCylinder

            // Revalidar eixo quando cilíndrico muda
            const axisError = validateAxis(newRightEye.axis, value)
            if (axisError) newErrors.rightAxis = axisError
            else delete newErrors.rightAxis
        } else if (field === 'axis') {
            const error = validateAxis(value, newRightEye.cylinder)
            if (error) newErrors.rightAxis = error
            else delete newErrors.rightAxis
        }
        setErrors(newErrors)

        setLensData(prev => ({
            ...prev,
            rightEye: newRightEye,
            ...(sameForBothEyes && { leftEye: newRightEye })
        }))
    }

    const handleLeftEyeChange = (field: keyof LensData['leftEye'], value: string) => {
        const newLeftEye = { ...lensData.leftEye, [field]: value }

        // Validação em tempo real
        const newErrors = { ...errors }
        if (field === 'sphere') {
            const error = validateSphere(value)
            if (error) newErrors.leftSphere = error
            else delete newErrors.leftSphere
        } else if (field === 'cylinder') {
            const error = validateCylinder(value)
            if (error) newErrors.leftCylinder = error
            else delete newErrors.leftCylinder

            // Revalidar eixo quando cilíndrico muda
            const axisError = validateAxis(newLeftEye.axis, value)
            if (axisError) newErrors.leftAxis = axisError
            else delete newErrors.leftAxis
        } else if (field === 'axis') {
            const error = validateAxis(value, newLeftEye.cylinder)
            if (error) newErrors.leftAxis = error
            else delete newErrors.leftAxis
        }
        setErrors(newErrors)

        setLensData(prev => ({
            ...prev,
            leftEye: newLeftEye
        }))
    }

    const handlePrescriptionDateChange = (value: string) => {
        setLensData(prev => ({ ...prev, prescriptionDate: value }))

        const newErrors = { ...errors }
        if (value && !validatePrescriptionDate(value)) {
            newErrors.prescriptionDate = 'Prescrição deve ter menos de 1 ano'
        } else {
            delete newErrors.prescriptionDate
        }
        setErrors(newErrors)
    }

    const handleDoctorCRMChange = (value: string) => {
        setLensData(prev => ({ ...prev, doctorCRM: value }))

        const newErrors = { ...errors }
        if (value && !validateCRM(value)) {
            newErrors.doctorCRM = 'Formato inválido (ex: 123456-MG)'
        } else {
            delete newErrors.doctorCRM
        }
        setErrors(newErrors)
    }

    const isValid = () => {
        // Verificar campos obrigatórios
        if (!lensData.brand || !lensData.rightEye.sphere || !lensData.leftEye.sphere) {
            return false
        }

        // Verificar se não há erros de validação
        if (Object.keys(errors).length > 0) {
            return false
        }

        // Validar todos os campos preenchidos
        const rightSphereError = validateSphere(lensData.rightEye.sphere)
        const leftSphereError = validateSphere(lensData.leftEye.sphere)

        if (rightSphereError || leftSphereError) {
            return false
        }

        // Validar cilíndrico e eixo se preenchidos
        if (lensData.rightEye.cylinder) {
            const cylinderError = validateCylinder(lensData.rightEye.cylinder)
            const axisError = validateAxis(lensData.rightEye.axis, lensData.rightEye.cylinder)
            if (cylinderError || axisError) return false
        }

        if (lensData.leftEye.cylinder) {
            const cylinderError = validateCylinder(lensData.leftEye.cylinder)
            const axisError = validateAxis(lensData.leftEye.axis, lensData.leftEye.cylinder)
            if (cylinderError || axisError) return false
        }

        // Validar data de prescrição se preenchida
        if (lensData.prescriptionDate && !validatePrescriptionDate(lensData.prescriptionDate)) {
            return false
        }

        // Validar CRM se preenchido
        if (lensData.doctorCRM && !validateCRM(lensData.doctorCRM)) {
            return false
        }

        return true
    }

    return (
        <div className="space-y-8">
            {/* Lens Type Selection */}
            <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                    Tipo de Lente
                </h3>
                <div className="grid md:grid-cols-3 gap-4">
                    {lensTypes.map((type) => (
                        <button
                            key={type.id}
                            onClick={() => handleTypeSelect(type.id as any)}
                            className={`p-4 rounded-lg border-2 text-left transition-all ${lensData.type === type.id
                                    ? 'border-primary-600 bg-primary-50'
                                    : 'border-gray-200 hover:border-gray-300'
                                }`}
                        >
                            <div className="font-semibold text-gray-900 mb-1">
                                {type.name}
                            </div>
                            <div className="text-sm text-gray-600">
                                {type.description}
                            </div>
                        </button>
                    ))}
                </div>
            </div>

            {/* Brand Selection */}
            <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                    Marca Atual (opcional)
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {popularBrands.map((brand) => (
                        <button
                            key={brand}
                            onClick={() => setLensData(prev => ({ ...prev, brand }))}
                            className={`px-4 py-3 rounded-lg border-2 text-sm font-medium transition-all ${lensData.brand === brand
                                    ? 'border-primary-600 bg-primary-50 text-primary-700'
                                    : 'border-gray-200 text-gray-700 hover:border-gray-300'
                                }`}
                        >
                            {brand}
                        </button>
                    ))}
                </div>
            </div>

            {/* Prescription */}
            <div>
                <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-gray-900">
                        Grau das Lentes
                    </h3>
                    <button
                        onClick={() => setSameForBothEyes(!sameForBothEyes)}
                        className="text-sm text-primary-600 hover:text-primary-700 font-medium"
                    >
                        {sameForBothEyes ? 'Graus diferentes' : 'Mesmo grau para ambos'}
                    </button>
                </div>

                <div className="bg-primary-50 border border-primary-200 rounded-lg p-4 mb-6 flex items-start space-x-3">
                    <Info className="w-5 h-5 text-primary-600 flex-shrink-0 mt-0.5" />
                    <div className="text-sm text-primary-900">
                        <p className="font-medium mb-1">Encontre seu grau na receita</p>
                        <p className="text-primary-700">
                            Esférico (ESF), Cilíndrico (CIL) e Eixo são os valores principais.
                            Se não tiver certeza, podemos ajudar na consulta.
                        </p>
                    </div>
                </div>

                {/* Right Eye */}
                <div className="mb-6">
                    <div className="flex items-center space-x-2 mb-3">
                        <Eye className="w-5 h-5 text-gray-600" />
                        <h4 className="font-semibold text-gray-900">Olho Direito (OD)</h4>
                    </div>
                    <div className="grid grid-cols-3 gap-4">
                        <Input
                            id="right-sphere"
                            label="Esférico"
                            placeholder="-2.00"
                            value={lensData.rightEye.sphere}
                            onChange={(e) => handleRightEyeChange('sphere', e.target.value)}
                            error={errors.rightSphere}
                            required
                        />
                        <Input
                            id="right-cylinder"
                            label="Cilíndrico"
                            placeholder="-0.75"
                            value={lensData.rightEye.cylinder}
                            onChange={(e) => handleRightEyeChange('cylinder', e.target.value)}
                            error={errors.rightCylinder}
                            helperText="Opcional"
                        />
                        <Input
                            id="right-axis"
                            label="Eixo"
                            placeholder="180"
                            value={lensData.rightEye.axis}
                            onChange={(e) => handleRightEyeChange('axis', e.target.value)}
                            error={errors.rightAxis}
                            helperText={lensData.rightEye.cylinder ? undefined : 'Opcional'}
                        />
                    </div>
                </div>

                {/* Left Eye */}
                {!sameForBothEyes && (
                    <div className="mb-6">
                        <div className="flex items-center space-x-2 mb-3">
                            <Eye className="w-5 h-5 text-gray-600" />
                            <h4 className="font-semibold text-gray-900">Olho Esquerdo (OE)</h4>
                        </div>
                        <div className="grid grid-cols-3 gap-4">
                            <Input
                                id="left-sphere"
                                label="Esférico"
                                placeholder="-2.00"
                                value={lensData.leftEye.sphere}
                                onChange={(e) => handleLeftEyeChange('sphere', e.target.value)}
                                error={errors.leftSphere}
                                required
                            />
                            <Input
                                id="left-cylinder"
                                label="Cilíndrico"
                                placeholder="-0.75"
                                value={lensData.leftEye.cylinder}
                                onChange={(e) => handleLeftEyeChange('cylinder', e.target.value)}
                                error={errors.leftCylinder}
                                helperText="Opcional"
                            />
                            <Input
                                id="left-axis"
                                label="Eixo"
                                placeholder="180"
                                value={lensData.leftEye.axis}
                                onChange={(e) => handleLeftEyeChange('axis', e.target.value)}
                                error={errors.leftAxis}
                                helperText={lensData.leftEye.cylinder ? undefined : 'Opcional'}
                            />
                        </div>
                    </div>
                )}
            </div>

            {/* Prescription Information */}
            <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                    Informações da Prescrição (opcional)
                </h3>

                <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-6 flex items-start space-x-3">
                    <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                    <div className="text-sm text-amber-900">
                        <p className="font-medium mb-1">Validação Médica</p>
                        <p className="text-amber-700">
                            Para sua segurança, prescrições de lentes de contato são válidas por até 1 ano.
                            Podemos agendar uma consulta para renovar sua receita se necessário.
                        </p>
                    </div>
                </div>

                <div className="grid md:grid-cols-2 gap-6">
                    <div>
                        <label className="flex items-center space-x-2 text-sm font-medium text-gray-700 mb-2">
                            <Calendar className="w-4 h-4" />
                            <span>Data da Prescrição</span>
                        </label>
                        <Input
                            id="prescription-date"
                            type="date"
                            value={lensData.prescriptionDate || ''}
                            onChange={(e) => handlePrescriptionDateChange(e.target.value)}
                            error={errors.prescriptionDate}
                            helperText="Receita médica válida por 1 ano"
                            max={new Date().toISOString().split('T')[0]}
                        />
                    </div>

                    <div>
                        <label className="flex items-center space-x-2 text-sm font-medium text-gray-700 mb-2">
                            <UserCheck className="w-4 h-4" />
                            <span>CRM do Médico</span>
                        </label>
                        <Input
                            id="doctor-crm"
                            placeholder="123456-MG"
                            value={lensData.doctorCRM || ''}
                            onChange={(e) => handleDoctorCRMChange(e.target.value)}
                            error={errors.doctorCRM}
                            helperText="Formato: 123456-UF"
                        />
                    </div>

                    <div className="md:col-span-2">
                        <Input
                            id="doctor-name"
                            label="Nome do Médico"
                            placeholder="Dr(a). Nome do Oftalmologista"
                            value={lensData.doctorName || ''}
                            onChange={(e) => setLensData(prev => ({ ...prev, doctorName: e.target.value }))}
                            helperText="Opcional"
                        />
                    </div>
                </div>
            </div>

            {/* Actions */}
            <div className="flex space-x-4">
                <Button
                    variant="outline"
                    onClick={onBack}
                    className="flex-1"
                >
                    Voltar
                </Button>
                <Button
                    onClick={() => onContinue(lensData)}
                    disabled={!isValid()}
                    className="flex-1"
                >
                    Continuar
                </Button>
            </div>
        </div>
    )
}
