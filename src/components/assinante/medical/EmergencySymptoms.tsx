'use client'
import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  AlertTriangle,
  Phone,
  MessageCircle,
  Clock,
  CheckCircle,
  X,
  AlertCircle,
  Eye,
  Droplets,
  Zap,
  HelpCircle,
  Calendar,
  MapPin,
  User,
  ChevronRight,
  Video
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
interface Symptom {
  id: string
  title: string
  description: string
  severity: 'low' | 'medium' | 'high' | 'critical'
  urgency: 'immediate' | 'within_hours' | 'within_day' | 'observe'
  category: 'pain' | 'vision' | 'discomfort' | 'infection' | 'other'
  symptoms: string[]
  causes: string[]
  whatToDo: string[]
  whatNotToDo: string[]
  whenToSeekHelp: string[]
  relatedConditions: string[]
}
const mockSymptoms: Symptom[] = [
  {
    id: '1',
    title: 'Vermelhidão Intensa nos Olhos',
    description: 'Olhos muito vermelhos e inchados, com dor intensa',
    severity: 'high',
    urgency: 'immediate',
    category: 'infection',
    symptoms: [
      'Vermelhidão intensa em um ou ambos os olhos',
      'Inchaço das pálpebras',
      'Dor intensa',
      'Sensibilidade à luz',
      'Secreção amarelada ou esverdeada',
      'Visão borrada'
    ],
    causes: [
      'Infecção bacteriana',
      'Reação alérgica severa',
      'Úlcera de córnea',
      'Uso prolongado de lentes sem descanso'
    ],
    whatToDo: [
      'Retire as lentes imediatamente',
      'Lave os olhos com soro fisiológico',
      'Procure atendimento médico de emergência',
      'Não coloque as lentes novamente até liberação médica'
    ],
    whatNotToDo: [
      'Não use colírios sem prescrição médica',
      'Não coce os olhos',
      'Não use lentes até avaliação médica',
      'Não tente tratar em casa se a dor for intensa'
    ],
    whenToSeekHelp: [
      'Imediatamente se houver dor intensa',
      'Se a visão estiver afetada',
      'Se houver secreção purulenta',
      'Se os sintomas não melhorarem em 2-3 horas'
    ],
    relatedConditions: ['Conjuntivite bacteriana', 'Ceratite', 'Úlcera de córnea']
  },
  {
    id: '2',
    title: 'Dor Aguda ao Usar Lentes',
    description: 'Dor súbita e intensa ao colocar ou remover as lentes',
    severity: 'critical',
    urgency: 'immediate',
    category: 'pain',
    symptoms: [
      'Dor aguda e penetrante',
      'Sensação de corpo estranho',
      'Lacrimeamento excessivo',
      'Vermelhidão',
      'Fotofobia extrema',
      'Dificuldade em abrir o olho'
    ],
    causes: [
      'Arranhão na córnea',
      'Lente danificada',
      'Depósito na lente',
      'Infecção',
      'Reação alérgica severa'
    ],
    whatToDo: [
      'Retire a lente imediatamente',
      'Não force se não sair facilmente',
      'Procure emergência oftalmológica',
      'Leve a lente para avaliação'
    ],
    whatNotToDo: [
      'Não force a remoção da lente',
      'Não use anestésicos oculares',
      'Não coloque outra lente',
      'Não ignore a dor'
    ],
    whenToSeekHelp: [
      'Imediatamente - dor aguda é emergência médica',
      'Se não conseguir remover a lente',
      'Se a visão estiver comprometida'
    ],
    relatedConditions: ['Abrasão corneana', 'Corpo estranho', 'Ceratite']
  },
  {
    id: '3',
    title: 'Visão Embaçada Persistente',
    description: 'Visão borrada que não melhora após remover as lentes',
    severity: 'medium',
    urgency: 'within_day',
    category: 'vision',
    symptoms: [
      'Visão embaçada ou nublada',
      'Dificuldade em focar',
      'Halos ao redor das luzes',
      'Visão dupla',
      'Dificuldade para ler',
      'Fadiga ocular'
    ],
    causes: [
      'Lentes sujas ou com depósitos',
      'Olhos secos',
      'Prescrição desatualizada',
      'Edema corneano',
      'Problemas de refratores não corrigidos'
    ],
    whatToDo: [
      'Remova as lentes',
      'Limpe as lentes adequadamente',
      'Use lágrimas artificiais',
      'Descanse os olhos',
      'Agende consulta com oftalmologista'
    ],
    whatNotToDo: [
      'Não force o uso das lentes',
      'Não use lentes por mais tempo que o recomendado',
      'Não ignore se persistir por dias'
    ],
    whenToSeekHelp: [
      'Se não melhorar após remover as lentes',
      'Se durar mais de 24 horas',
      'Se afetar atividades diárias',
      'Se acompanhada de dor'
    ],
    relatedConditions: ['Olho seco', 'Edema corneano', 'Prescrição inadequada']
  },
  {
    id: '4',
    title: 'Sensação de Corpo Estranho',
    description: 'Sensação de ter algo no olho mesmo sem nada visível',
    severity: 'medium',
    urgency: 'within_hours',
    category: 'discomfort',
    symptoms: [
      'Sensação de areia ou poeira no olho',
      'Lacrimeamento excessivo',
      'Vermelhidão leve',
      'Dor leve ao piscar',
      'Sensibilidade à luz',
      'Desejo constante de coçar'
    ],
    causes: [
      'Lente mal posicionada',
      'Pequeno arranhão na córnea',
      'Depósito na lente',
      'Olho seco',
      'Corpo estranho microscópico'
    ],
    whatToDo: [
      'Remova as lentes',
      'Enxágue com soro fisiológico',
      'Piscar várias vezes',
      'Use lágrimas artificiais',
      'Observar por algumas horas'
    ],
    whatNotToDo: [
      'Não coce os olhos',
      'Não use objetos para tentar remover',
      'Não use lentes se a sensação persistir'
    ],
    whenToSeekHelp: [
      'Se a sensação persistir por várias horas',
      'Se houver dor intensa',
      'Se a visão for afetada',
      'Se suspeitar de corpo estranho real'
    ],
    relatedConditions: ['Corpo estranho corneano', 'Olho seco', 'Ceratite puntata']
  },
  {
    id: '5',
    title: 'Olhos Secos Excessivos',
    description: 'Secreção insuficiente ou má qualidade das lágrimas',
    severity: 'low',
    urgency: 'observe',
    category: 'discomfort',
    symptoms: [
      'Sensação de areia nos olhos',
      'Vermelhidão',
      'Visão embaçada que melhora ao piscar',
      'Lacrimeamento excessivo (reflexo)',
      'Fadiga ocular',
      'Dificuldade em usar lentes por muito tempo'
    ],
    causes: [
      'Uso prolongado de telas',
      'Ambiente seco ou com ar-condicionado',
      'Lentes de contato de permeabilidade baixa',
      'Hidratação inadequada',
      'Certos medicamentos'
    ],
    whatToDo: [
      'Use lágrimas artificiais sem conservantes',
      'Faça pausas regulares ao usar telas',
      'Beba mais água',
      'Use umidificador de ambiente',
      'Considere lentes de material mais hidrofílico'
    ],
    whatNotToDo: [
      'Não use vasoconstritores por longos períodos',
      'Não ignore se piorar',
      'Não use lentes por mais tempo que o confortável'
    ],
    whenToSeekHelp: [
      'Se não melhorar com medidas básicas',
      'Se afetar uso de lentes',
      'Se houver vermelhidão persistente',
      'Se a visão for afetada'
    ],
    relatedConditions: ['Síndrome do olho seco', 'Ceratoconjuntivite sicca', 'Blefarite']
  }
]
const emergencyContacts = {
  doctor: {
    name: 'Dr. Philipe Saraiva Cruz',
    crm: 'CRM-MG 69.870',
    phone: '+55 33 98606-1427',
    whatsapp: '+55 33 98606-1427',
    email: 'saraivavision@gmail.com',
    address: 'Caratinga - MG',
    available: '24/7 para emergências'
  },
  emergency: {
    phone: '192',
    description: 'Serviço de Atendimento Móvel de Urgência'
  },
  hospital: {
    name: 'Hospital Municipal de Caratinga',
    phone: '+55 33 3321-4000',
    address: 'Av. Getúlio Vargas, 123 - Centro, Caratinga - MG'
  }
}
export function EmergencySymptoms() {
  const [symptoms] = useState<Symptom[]>(mockSymptoms)
  const [selectedSymptom, setSelectedSymptom] = useState<Symptom | null>(null)
  const [selectedSeverity, setSelectedSeverity] = useState<string>('all')
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [showEmergencyModal, setShowEmergencyModal] = useState(false)
  const [contactError, setContactError] = useState<string | null>(null)
  const [isLoadingContact, setIsLoadingContact] = useState(false)
  const severities = [
    { value: 'all', label: 'Todos', color: 'bg-gray-100 text-gray-800' },
    { value: 'critical', label: 'Crítico', color: 'bg-red-100 text-red-800' },
    { value: 'high', label: 'Alto', color: 'bg-orange-100 text-orange-800' },
    { value: 'medium', label: 'Médio', color: 'bg-yellow-100 text-yellow-800' },
    { value: 'low', label: 'Baixo', color: 'bg-blue-100 text-blue-800' }
  ]
  const categories = [
    { value: 'all', label: 'Todos' },
    { value: 'pain', label: 'Dor' },
    { value: 'vision', label: 'Visão' },
    { value: 'discomfort', label: 'Desconforto' },
    { value: 'infection', label: 'Infecção' },
    { value: 'other', label: 'Outros' }
  ]
  const filteredSymptoms = symptoms.filter(symptom => {
    const matchesSeverity = selectedSeverity === 'all' || symptom.severity === selectedSeverity
    const matchesCategory = selectedCategory === 'all' || symptom.category === selectedCategory
    const matchesSearch = symptom.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         symptom.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         symptom.symptoms.some(s => s.toLowerCase().includes(searchQuery.toLowerCase()))
    return matchesSeverity && matchesCategory && matchesSearch
  })
  const getSeverityColor = (severity: Symptom['severity']) => {
    switch (severity) {
      case 'critical': return 'bg-red-100 text-red-800 border-red-200'
      case 'high': return 'bg-orange-100 text-orange-800 border-orange-200'
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 'low': return 'bg-blue-100 text-blue-800 border-blue-200'
    }
  }
  const getUrgencyColor = (urgency: Symptom['urgency']) => {
    switch (urgency) {
      case 'immediate': return 'text-red-600 bg-red-50'
      case 'within_hours': return 'text-orange-600 bg-orange-50'
      case 'within_day': return 'text-yellow-600 bg-yellow-50'
      case 'observe': return 'text-blue-600 bg-blue-50'
    }
  }
  const getUrgencyText = (urgency: Symptom['urgency']) => {
    switch (urgency) {
      case 'immediate': return 'Procurar emergência IMEDIATAMENTE'
      case 'within_hours': return 'Procurar atendimento em horas'
      case 'within_day': return 'Procurar atendimento em até 24 horas'
      case 'observe': return 'Observar e buscar ajuda se piorar'
    }
  }
  const handleCallDoctor = async () => {
    setContactError(null)
    setIsLoadingContact(true)
    try {
      const phoneNumber = emergencyContacts.doctor.phone.replace(/\D/g, '')
      if (!phoneNumber) {
        throw new Error('Número de telefone não disponível')
      }
      window.open(`tel:${phoneNumber}`)
    } catch (error) {
      setContactError('Não foi possível iniciar a chamada. Tente novamente.')
      console.error('Error calling doctor:', error)
    } finally {
      setIsLoadingContact(false)
    }
  }

  const handleWhatsAppDoctor = async () => {
    setContactError(null)
    setIsLoadingContact(true)
    try {
      const phoneNumber = emergencyContacts.doctor.whatsapp.replace(/\D/g, '')
      if (!phoneNumber) {
        throw new Error('Número do WhatsApp não disponível')
      }
      window.open(`https://wa.me/${phoneNumber}`, '_blank')
    } catch (error) {
      setContactError('Não foi possível abrir o WhatsApp. Tente novamente.')
      console.error('Error opening WhatsApp:', error)
    } finally {
      setIsLoadingContact(false)
    }
  }

  const handleEmergencyCall = async () => {
    setContactError(null)
    setIsLoadingContact(true)
    try {
      const emergencyNumber = emergencyContacts.emergency.phone
      if (!emergencyNumber) {
        throw new Error('Número de emergência não disponível')
      }
      window.open(`tel:${emergencyNumber}`)
    } catch (error) {
      setContactError('Não foi possível ligar para emergência. Use seu telefone para discar 192.')
      console.error('Error calling emergency:', error)
    } finally {
      setIsLoadingContact(false)
    }
  }

  const handleVideoCall = async () => {
    setContactError(null)
    setIsLoadingContact(true)
    try {
      // TODO: Implementar telemedicina quando disponível
      throw new Error('Telemedicina não disponível no momento')
    } catch (error) {
      setContactError('Telemedicina em desenvolvimento. Por favor, ligue para o médico.')
      console.error('Video call error:', error)
    } finally {
      setIsLoadingContact(false)
    }
  }
  return (
    <div className="space-y-6">
      {/* Error Display */}
      {contactError && (
        <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-lg">
          <div className="flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 text-red-600 mt-0.5" />
            <div className="flex-1">
              <p className="text-red-800 font-medium">Erro de Conexão</p>
              <p className="text-red-700 text-sm">{contactError}</p>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setContactError(null)}
              className="text-red-600 hover:text-red-800"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      {/* Alerta de Emergência */}
      <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-lg">
        <div className="flex items-start gap-3">
          <AlertTriangle className="h-6 w-6 text-red-600 mt-1" />
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-red-900 mb-2">
              Atenção: Sintomas de Emergência Ocular
            </h3>
            <p className="text-red-800 mb-3">
              Se você experiencing dor intensa, perda súbita de visão, ou qualquer sintoma severo,
              procure atendimento médico imediatamente ou ligue para nosso médico de plantão.
            </p>
            <div className="flex flex-wrap gap-3">
              <Button
                size="sm"
                className="bg-red-600 hover:bg-red-700 text-white"
                onClick={handleCallDoctor}
              >
                <Phone className="h-4 w-4 mr-2" />
                {emergencyContacts.doctor.phone}
              </Button>
              <Button
                size="sm"
                variant="outline"
                className="border-red-300 text-red-700 hover:bg-red-50"
                onClick={handleWhatsAppDoctor}
              >
                <MessageCircle className="h-4 w-4 mr-2" />
                WhatsApp Emergência
              </Button>
              <Button
                size="sm"
                variant="outline"
                className="border-red-300 text-red-700 hover:bg-red-50"
                onClick={handleEmergencyCall}
              >
                SAMU 192
              </Button>
            </div>
          </div>
        </div>
      </div>
      {/* Header */}
      <div className="text-center">
        <h2 className="text-2xl font-bold tracking-tight">Guia de Sintomas de Emergência</h2>
        <p className="text-muted-foreground mt-2">
          Identifique quando procurar ajuda médica imediatamente ao usar lentes de contato
        </p>
      </div>
      {/* Informações do Médico */}
      <div className="bg-gradient-to-r from-blue-50 to-cyan-50 border rounded-lg p-6">
        <div className="flex items-start gap-4">
          <div className="h-12 w-12 bg-blue-100 rounded-full flex items-center justify-center">
            <User className="h-6 w-6 text-blue-600" />
          </div>
          <div className="flex-1">
            <h3 className="font-semibold text-blue-900 mb-2">
              Responsável Médico - Dr. Philipe Saraiva Cruz
            </h3>
            <div className="grid gap-2 md:grid-cols-2 text-sm text-blue-800">
              <div className="flex items-center gap-2">
                <span className="font-medium">CRM:</span>
                <span>CRM-MG 69.870</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="font-medium">Disponibilidade:</span>
                <span>24/7 para emergências</span>
              </div>
              <div className="flex items-center gap-2">
                <Phone className="h-3 w-3" />
                <span>{emergencyContacts.doctor.phone}</span>
              </div>
              <div className="flex items-center gap-2">
                <MapPin className="h-3 w-3" />
                <span>{emergencyContacts.doctor.address}</span>
              </div>
            </div>
          </div>
          <div className="flex flex-col gap-2">
            <Button size="sm" onClick={handleCallDoctor} disabled={isLoadingContact}>
              {isLoadingContact ? (
                <>
                  <div className="h-4 w-4 mr-2 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  Conectando...
                </>
              ) : (
                <>
                  <Phone className="h-4 w-4 mr-2" />
                  Ligar
                </>
              )}
            </Button>
            <Button size="sm" variant="outline" onClick={handleVideoCall} disabled={isLoadingContact}>
              {isLoadingContact ? (
                <>
                  <div className="h-4 w-4 mr-2 animate-spin rounded-full border-2 border-gray-600 border-t-transparent" />
                  Carregando...
                </>
              ) : (
                <>
                  <Video className="h-4 w-4 mr-2" />
                  Teleconsulta
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
      {/* Filtros */}
      <div className="bg-card border rounded-lg p-4">
        <div className="grid gap-4 md:grid-cols-3">
          <div>
            <label className="block text-sm font-medium mb-2">Severidade</label>
            <select
              value={selectedSeverity}
              onChange={(e) => setSelectedSeverity(e.target.value)}
              className="w-full p-2 border rounded-md"
            >
              {severities.map(severity => (
                <option key={severity.value} value={severity.value}>
                  {severity.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Categoria</label>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full p-2 border rounded-md"
            >
              {categories.map(category => (
                <option key={category.value} value={category.value}>
                  {category.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Buscar sintomas</label>
            <input
              type="text"
              placeholder="Buscar por sintoma..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full p-2 border rounded-md"
            />
          </div>
        </div>
      </div>
      {/* Lista de Sintomas */}
      <div className="grid gap-4 md:grid-cols-2">
        {filteredSymptoms.map((symptom, index) => (
          <motion.div
            key={symptom.id}
            className="bg-card border rounded-lg overflow-hidden hover:shadow-lg transition-shadow cursor-pointer"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            onClick={() => setSelectedSymptom(symptom)}
          >
            <div className="p-4">
              <div className="flex items-start justify-between mb-3">
                <h3 className="font-semibold text-lg">{symptom.title}</h3>
                <div className="flex flex-col gap-1">
                  <Badge className={cn("text-xs", getSeverityColor(symptom.severity))}>
                    {symptom.severity === 'critical' && 'Crítico'}
                    {symptom.severity === 'high' && 'Alto'}
                    {symptom.severity === 'medium' && 'Médio'}
                    {symptom.severity === 'low' && 'Baixo'}
                  </Badge>
                  <div className={cn("text-xs px-2 py-1 rounded text-center", getUrgencyColor(symptom.urgency))}>
                    {symptom.urgency === 'immediate' && <AlertCircle className="h-3 w-3 inline mr-1" />}
                    {symptom.urgency === 'within_hours' && <Clock className="h-3 w-3 inline mr-1" />}
                    {symptom.urgency === 'within_day' && <Calendar className="h-3 w-3 inline mr-1" />}
                    {symptom.urgency === 'observe' && <Eye className="h-3 w-3 inline mr-1" />}
                    {getUrgencyText(symptom.urgency)}
                  </div>
                </div>
              </div>
              <p className="text-gray-600 text-sm mb-3">{symptom.description}</p>
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm">
                  <span className="font-medium text-gray-700">Sintomas principais:</span>
                  <div className="flex flex-wrap gap-1">
                    {symptom.symptoms.slice(0, 3).map((s, i) => (
                      <Badge key={i} variant="outline" className="text-xs">
                        {s.split(',')[0]}
                      </Badge>
                    ))}
                    {symptom.symptoms.length > 3 && (
                      <Badge variant="outline" className="text-xs">
                        +{symptom.symptoms.length - 3}
                      </Badge>
                    )}
                  </div>
                </div>
              </div>
              <div className="mt-4 flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs text-gray-500">
                  <ChevronRight className="h-3 w-3" />
                  <span>Clique para ver detalhes completos</span>
                </div>
                {symptom.urgency === 'immediate' && (
                  <Button
                    size="sm"
                    className="bg-red-600 hover:bg-red-700 text-white"
                    onClick={(e) => {
                      e.stopPropagation()
                      handleCallDoctor()
                    }}
                  >
                    <Phone className="h-3 w-3 mr-1" />
                    Emergência
                  </Button>
                )}
              </div>
            </div>
          </motion.div>
        ))}
      </div>
      {/* Modal de Detalhes do Sintoma */}
      <AnimatePresence>
        {selectedSymptom && (
          <motion.div
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setSelectedSymptom(null)}
          >
            <motion.div
              className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto"
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-6">
                {/* Header */}
                <div className="flex items-start justify-between mb-6">
                  <div>
                    <h2 className="text-2xl font-bold mb-2">{selectedSymptom.title}</h2>
                    <p className="text-gray-600">{selectedSymptom.description}</p>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <Badge className={cn("text-sm", getSeverityColor(selectedSymptom.severity))}>
                      {selectedSymptom.severity === 'critical' && 'Crítico'}
                      {selectedSymptom.severity === 'high' && 'Alto'}
                      {selectedSymptom.severity === 'medium' && 'Médio'}
                      {selectedSymptom.severity === 'low' && 'Baixo'}
                    </Badge>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setSelectedSymptom(null)}
                    >
                      <X className="h-5 w-5" />
                    </Button>
                  </div>
                </div>
                {/* Alerta de Urgência */}
                <div className={cn(
                  "border-l-4 p-4 rounded-lg mb-6",
                  selectedSymptom.urgency === 'immediate' && 'bg-red-50 border-red-500',
                  selectedSymptom.urgency === 'within_hours' && 'bg-orange-50 border-orange-500',
                  selectedSymptom.urgency === 'within_day' && 'bg-yellow-50 border-yellow-500',
                  selectedSymptom.urgency === 'observe' && 'bg-blue-50 border-blue-500'
                )}>
                  <div className="flex items-center gap-2 mb-2">
                    {selectedSymptom.urgency === 'immediate' && <AlertTriangle className="h-5 w-5 text-red-600" />}
                    {selectedSymptom.urgency === 'within_hours' && <Clock className="h-5 w-5 text-orange-600" />}
                    {selectedSymptom.urgency === 'within_day' && <Calendar className="h-5 w-5 text-yellow-600" />}
                    {selectedSymptom.urgency === 'observe' && <Eye className="h-5 w-5 text-blue-600" />}
                    <span className="font-semibold">
                      {getUrgencyText(selectedSymptom.urgency)}
                    </span>
                  </div>
                  {selectedSymptom.urgency === 'immediate' && (
                    <div className="flex flex-wrap gap-3">
                      <Button
                        className="bg-red-600 hover:bg-red-700 text-white"
                        onClick={handleCallDoctor}
                      >
                        <Phone className="h-4 w-4 mr-2" />
                        Ligar para Médico
                      </Button>
                      <Button
                        variant="outline"
                        className="border-red-300 text-red-700 hover:bg-red-50"
                        onClick={handleWhatsAppDoctor}
                      >
                        <MessageCircle className="h-4 w-4 mr-2" />
                        WhatsApp Emergência
                      </Button>
                      <Button
                        variant="outline"
                        className="border-red-300 text-red-700 hover:bg-red-50"
                        onClick={handleEmergencyCall}
                      >
                        SAMU 192
                      </Button>
                    </div>
                  )}
                </div>
                {/* Conteúdo Detalhado */}
                <div className="grid gap-6 lg:grid-cols-2">
                  {/* Sintomas */}
                  <div className="space-y-4">
                    <h3 className="font-semibold flex items-center gap-2">
                      <AlertCircle className="h-5 w-5" />
                      Sintomas
                    </h3>
                    <ul className="space-y-2">
                      {selectedSymptom.symptoms.map((symptom, index) => (
                        <li key={index} className="flex items-start gap-2">
                          <span className="text-cyan-600 mt-1">•</span>
                          <span className="text-sm">{symptom}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                  {/* Possíveis Causas */}
                  <div className="space-y-4">
                    <h3 className="font-semibold flex items-center gap-2">
                      <HelpCircle className="h-5 w-5" />
                      Possíveis Causas
                    </h3>
                    <ul className="space-y-2">
                      {selectedSymptom.causes.map((cause, index) => (
                        <li key={index} className="flex items-start gap-2">
                          <span className="text-cyan-600 mt-1">•</span>
                          <span className="text-sm">{cause}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                  {/* O Que Fazer */}
                  <div className="space-y-4 lg:col-span-2">
                    <h3 className="font-semibold flex items-center gap-2 text-green-600">
                      <CheckCircle className="h-5 w-5" />
                      O Que Fazer
                    </h3>
                    <div className="bg-green-50 rounded-lg p-4">
                      <ul className="space-y-2">
                        {selectedSymptom.whatToDo.map((action, index) => (
                          <li key={index} className="flex items-start gap-2">
                            <span className="text-green-600 mt-1">✓</span>
                            <span className="text-sm">{action}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                  {/* O Que Não Fazer */}
                  <div className="space-y-4 lg:col-span-2">
                    <h3 className="font-semibold flex items-center gap-2 text-red-600">
                      <X className="h-5 w-5" />
                      O Que Não Fazer
                    </h3>
                    <div className="bg-red-50 rounded-lg p-4">
                      <ul className="space-y-2">
                        {selectedSymptom.whatNotToDo.map((action, index) => (
                          <li key={index} className="flex items-start gap-2">
                            <span className="text-red-600 mt-1">✗</span>
                            <span className="text-sm">{action}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                  {/* Quando Procurar Ajuda */}
                  <div className="space-y-4 lg:col-span-2">
                    <h3 className="font-semibold flex items-center gap-2">
                      <Clock className="h-5 w-5" />
                      Quando Procurar Ajuda Médica
                    </h3>
                    <div className="bg-yellow-50 rounded-lg p-4">
                      <ul className="space-y-2">
                        {selectedSymptom.whenToSeekHelp.map((condition, index) => (
                          <li key={index} className="flex items-start gap-2">
                            <span className="text-yellow-600 mt-1">!</span>
                            <span className="text-sm">{condition}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                  {/* Condições Relacionadas */}
                  {selectedSymptom.relatedConditions.length > 0 && (
                    <div className="space-y-4 lg:col-span-2">
                      <h3 className="font-semibold flex items-center gap-2">
                        <HelpCircle className="h-5 w-5" />
                        Condições Relacionadas
                      </h3>
                      <div className="flex flex-wrap gap-2">
                        {selectedSymptom.relatedConditions.map((condition, index) => (
                          <Badge key={index} variant="outline" className="text-sm">
                            {condition}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
                {/* Ações */}
                <div className="flex justify-end gap-3 mt-6 pt-6 border-t">
                  <Button variant="outline" onClick={() => setSelectedSymptom(null)}>
                    Fechar
                  </Button>
                  <Button onClick={handleCallDoctor}>
                    <Phone className="h-4 w-4 mr-2" />
                    Contatar Médico
                  </Button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}