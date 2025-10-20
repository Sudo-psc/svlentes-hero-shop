'use client'
import { Eye, Info, Calendar, UserCheck, AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useLensPrescriptionForm } from '@/hooks/useLensPrescriptionForm'
import type { LensData as SubscriptionLensData } from '@/types/subscription'
interface LensSelectorProps {
    onContinue: (data: SubscriptionLensData) => void
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
export function LensSelector({ onContinue, onBack }: LensSelectorProps) {
    const {
        lensData,
        errors,
        sameForBothEyes,
        selectLensType,
        selectBrand,
        updateEye,
        updatePrescriptionDate,
        updateDoctorCRM,
        updateDoctorName,
        toggleSameForBothEyes,
        isValid,
    } = useLensPrescriptionForm()
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
                            onClick={() => selectLensType(type.id as SubscriptionLensData['type'])}
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
                            onClick={() => selectBrand(brand)}
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
                        onClick={toggleSameForBothEyes}
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
                            onChange={(e) => updateEye('rightEye', 'sphere', e.target.value)}
                            error={errors.rightSphere}
                            required
                        />
                        <Input
                            id="right-cylinder"
                            label="Cilíndrico"
                            placeholder="-0.75"
                            value={lensData.rightEye.cylinder}
                            onChange={(e) => updateEye('rightEye', 'cylinder', e.target.value)}
                            error={errors.rightCylinder}
                            helperText="Opcional"
                        />
                        <Input
                            id="right-axis"
                            label="Eixo"
                            placeholder="180"
                            value={lensData.rightEye.axis}
                            onChange={(e) => updateEye('rightEye', 'axis', e.target.value)}
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
                                onChange={(e) => updateEye('leftEye', 'sphere', e.target.value)}
                                error={errors.leftSphere}
                                required
                            />
                            <Input
                                id="left-cylinder"
                                label="Cilíndrico"
                                placeholder="-0.75"
                                value={lensData.leftEye.cylinder}
                                onChange={(e) => updateEye('leftEye', 'cylinder', e.target.value)}
                                error={errors.leftCylinder}
                                helperText="Opcional"
                            />
                            <Input
                                id="left-axis"
                                label="Eixo"
                                placeholder="180"
                                value={lensData.leftEye.axis}
                                onChange={(e) => updateEye('leftEye', 'axis', e.target.value)}
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
                            onChange={(e) => updatePrescriptionDate(e.target.value)}
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
                            onChange={(e) => updateDoctorCRM(e.target.value)}
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
                            onChange={(e) => updateDoctorName(e.target.value)}
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
                    disabled={!isValid}
                    className="flex-1"
                >
                    Continuar
                </Button>
            </div>
        </div>
    )
}