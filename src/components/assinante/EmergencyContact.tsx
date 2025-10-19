import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/Button'
import {
  Phone,
  Mail,
  AlertCircle,
  MessageCircle,
  ExternalLink,
  Clock
} from 'lucide-react'

interface EmergencyContactProps {
  contact: {
    phone: string
    email: string
    doctor: {
      name: string
      crm: string
    }
  }
}

export function EmergencyContactCard({ contact }: EmergencyContactProps) {
  const handleWhatsAppClick = () => {
    const phoneNumber = contact.phone.replace(/\D/g, '')
    const message = encodeURIComponent('Olá! Preciso de ajuda com minha assinatura de lentes de contato.')
    window.open(`https://wa.me/${phoneNumber}?text=${message}`, '_blank')
  }

  const handlePhoneCall = () => {
    window.open(`tel:${contact.phone}`, '_self')
  }

  const handleEmailClick = () => {
    window.open(`mailto:${contact.email}?subject=Assinatura SV Lentes - Ajuda`, '_blank')
  }

  const formatPhoneNumber = (phone: string) => {
    // Format phone number for display
    const cleaned = phone.replace(/\D/g, '')
    const match = cleaned.match(/^(\d{2})(\d{5})(\d{4})$/)
    if (match) {
      return `(${match[1]}) ${match[2]}-${match[3]}`
    }
    return phone
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <AlertCircle className="h-5 w-5 text-cyan-600" />
          Contato de Emergência
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Doctor Information */}
        <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 bg-yellow-100 rounded-full">
              <AlertCircle className="h-4 w-4 text-yellow-700" />
            </div>
            <div>
              <h3 className="font-semibold text-yellow-900">
                Responsável Médico
              </h3>
              <p className="text-sm text-yellow-700">
                {contact.doctor.name}
              </p>
              <p className="text-xs text-yellow-600">
                {contact.doctor.crm}
              </p>
            </div>
          </div>
          <p className="text-sm text-yellow-800">
            Para questões médicas sobre suas lentes de contato, entre em contato diretamente com nosso especialista.
          </p>
        </div>

        {/* Contact Methods */}
        <div className="space-y-4">
          <h4 className="font-medium text-gray-900">Canais de Comunicação</h4>

          {/* WhatsApp - Primary */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <MessageCircle className="h-4 w-4 text-green-600" />
              <span className="text-sm font-medium text-gray-700">WhatsApp (Preferencial)</span>
              <span className="text-xs text-green-600 bg-green-50 px-2 py-1 rounded-full">
                Resposta rápida
              </span>
            </div>
            <div className="flex items-center justify-between p-3 bg-green-50 border border-green-200 rounded-lg">
              <div>
                <p className="font-medium text-green-900">
                  {formatPhoneNumber(contact.phone)}
                </p>
                <p className="text-sm text-green-700">
                  Atendimento de segunda a sexta, 8h-18h
                </p>
              </div>
              <Button
                onClick={handleWhatsAppClick}
                size="sm"
                className="bg-green-600 hover:bg-green-700 text-white"
              >
                <MessageCircle className="h-4 w-4 mr-2" />
                WhatsApp
              </Button>
            </div>
          </div>

          {/* Phone Call */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Phone className="h-4 w-4 text-cyan-600" />
              <span className="text-sm font-medium text-gray-700">Ligação Telefônica</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-cyan-50 border border-cyan-200 rounded-lg">
              <div>
                <p className="font-medium text-cyan-900">
                  {formatPhoneNumber(contact.phone)}
                </p>
                <p className="text-sm text-cyan-700">
                  Para emergências urgentes
                </p>
              </div>
              <Button
                onClick={handlePhoneCall}
                variant="outline"
                size="sm"
                className="border-cyan-200 text-cyan-700 hover:bg-cyan-100"
              >
                <Phone className="h-4 w-4 mr-2" />
                Ligar
              </Button>
            </div>
          </div>

          {/* Email */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Mail className="h-4 w-4 text-blue-600" />
              <span className="text-sm font-medium text-gray-700">E-mail</span>
              <span className="text-xs text-blue-600 bg-blue-50 px-2 py-1 rounded-full">
                24-48h resposta
              </span>
            </div>
            <div className="flex items-center justify-between p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <div>
                <p className="font-medium text-blue-900">
                  {contact.email}
                </p>
                <p className="text-sm text-blue-700">
                  Para assuntos administrativos
                </p>
              </div>
              <Button
                onClick={handleEmailClick}
                variant="outline"
                size="sm"
                className="border-blue-200 text-blue-700 hover:bg-blue-100"
              >
                <Mail className="h-4 w-4 mr-2" />
                Enviar
              </Button>
            </div>
          </div>
        </div>

        {/* Emergency Guidelines */}
        <div className="space-y-3">
          <h4 className="font-medium text-gray-900 flex items-center gap-2">
            <Clock className="h-4 w-4 text-red-600" />
            Quando procurar ajuda urgente:
          </h4>
          <div className="space-y-2">
            <div className="flex items-start gap-2">
              <div className="h-2 w-2 bg-red-500 rounded-full mt-2 flex-shrink-0"></div>
              <p className="text-sm text-gray-600">
                Irritação intensa, vermelhidão ou dor nos olhos
              </p>
            </div>
            <div className="flex items-start gap-2">
              <div className="h-2 w-2 bg-red-500 rounded-full mt-2 flex-shrink-0"></div>
              <p className="text-sm text-gray-600">
                Visão embaçada persistente ou perda súbita de visão
              </p>
            </div>
            <div className="flex items-start gap-2">
              <div className="h-2 w-2 bg-red-500 rounded-full mt-2 flex-shrink-0"></div>
              <p className="text-sm text-gray-600">
                Sensibilidade extrema à luz
              </p>
            </div>
            <div className="flex items-start gap-2">
              <div className="h-2 w-2 bg-red-500 rounded-full mt-2 flex-shrink-0"></div>
              <p className="text-sm text-gray-600">
                Secreção ocular excessiva ou incomum
              </p>
            </div>
          </div>
        </div>

        {/* Location Info */}
        <div className="p-3 bg-gray-50 border border-gray-200 rounded-lg">
          <div className="flex items-center gap-2 mb-2">
            <ExternalLink className="h-4 w-4 text-gray-600" />
            <h5 className="font-medium text-gray-900">Localização</h5>
          </div>
          <p className="text-sm text-gray-600">
            <strong>Saraiva Vision</strong><br />
            Caratinga - MG<br />
            Consultas presenciais mediante agendamento
          </p>
        </div>
      </CardContent>
    </Card>
  )
}

// Componente简化 sem props para uso direto
export function EmergencyContact() {
  const contact = {
    phone: "5533999898026",
    email: "contato@svlentes.com.br",
    doctor: {
      name: "Dr. Philipe Saraiva Cruz",
      crm: "CRM-MG 69.870"
    }
  }

  return <EmergencyContactCard contact={contact} />
}

export default EmergencyContactCard