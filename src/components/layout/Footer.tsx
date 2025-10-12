'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/Button'
import { LogoFooter } from '@/components/ui/Logo'
import { OptimizedImage } from '@/components/ui/OptimizedImage'
import { generateWhatsAppLink } from '@/lib/utils'
import { doctorInfo, clinicInfo } from '@/data/doctor-info'
import { PrivacyPolicy } from '@/components/privacy/PrivacyPolicy'
import { PrivacySettings } from '@/components/privacy/PrivacySettings'
import { DataControlPanel } from '@/components/privacy/DataControlPanel'
import {
    MapPin,
    Phone,
    Mail,
    Clock,
    Shield,
    FileText,
    Heart,
    MessageCircle,
    Settings,
    Download
} from 'lucide-react'

interface FooterProps {
    className?: string
}

export function Footer({ className }: FooterProps) {
    const currentYear = new Date().getFullYear()
    const [showPrivacyPolicy, setShowPrivacyPolicy] = useState(false)
    const [showPrivacySettings, setShowPrivacySettings] = useState(false)
    const [showDataControl, setShowDataControl] = useState(false)

    const handleWhatsAppContact = () => {
        const message = `Olá! Entrei em contato através do site SV Lentes e gostaria de mais informações sobre o serviço de assinatura de lentes de contato com acompanhamento médico.`

        const whatsappLink = generateWhatsAppLink(
            clinicInfo.contact.whatsapp,
            message
        )

        window.open(whatsappLink, '_blank')
    }

    const quickLinks = [
        { name: 'Planos e Preços', href: '#planos-precos' },
        { name: 'Como Funciona', href: '#como-funciona' },
        { name: 'FAQ', href: '#perguntas-frequentes' },
        { name: 'Programa de Indicação', href: '#programa-indicacao' },
        { name: 'Manual do Paciente (PDF)', href: '/ManualPacienteLentesContato2025.pdf', download: true, icon: 'download' },
    ]

    const legalLinks = [
        {
            name: 'Política de Privacidade',
            action: () => setShowPrivacyPolicy(true)
        },
        {
            name: 'Configurações de Privacidade',
            action: () => setShowPrivacySettings(true)
        },
        {
            name: 'Meus Dados (LGPD)',
            action: () => setShowDataControl(true)
        },
        { name: 'Termos de Uso', href: '/termos-uso' },
    ]

    return (
        <footer className={`bg-medical-900 text-white ${className}`}>
            {/* Main Footer Content */}
            <div className="container-custom py-16">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12">

                    {/* Company Info */}
                    <div className="lg:col-span-2 space-y-6">
                        <div>
                            {/* Logo */}
                            <div className="mb-4">
                                <LogoFooter />
                            </div>
                            <p className="text-lg text-gray-200 font-medium mb-3">
                                Pioneiro no Brasil em Assinatura de Lentes de Contato
                            </p>
                            <p className="text-gray-300 leading-relaxed">
                                Assinatura de lentes de contato com acompanhamento médico especializado.
                                Nunca mais fique sem lentes com a comodidade e segurança que você merece.
                            </p>
                        </div>

                        {/* Doctor Info */}
                        <div className="bg-medical-800 rounded-xl p-6 border border-medical-700">
                            <h4 className="text-sm font-semibold text-gray-400 uppercase tracking-wide mb-4">
                                Responsável Técnico
                            </h4>
                            <div className="flex items-start space-x-4">
                                <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-primary-400 flex-shrink-0">
                                    <OptimizedImage
                                        src="/icones/drphilipe_perfil.jpeg"
                                        alt="Dr. Philipe Saraiva Cruz"
                                        width={48}
                                        height={48}
                                        quality={85}
                                        className="w-full h-full object-cover"
                                    />
                                </div>
                                <div>
                                    <h5 className="font-semibold text-lg text-white mb-1">
                                        {doctorInfo.name}
                                    </h5>
                                    <p className="text-primary-400 font-medium mb-1">
                                        {doctorInfo.crm}
                                    </p>
                                    <p className="text-gray-300 text-sm mb-1">
                                        {doctorInfo.specialty}
                                    </p>
                                    <p className="text-gray-400 text-sm">
                                        {doctorInfo.experience}
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Contact CTA */}
                        <Button
                            onClick={handleWhatsAppContact}
                            variant="default"
                            className="w-full sm:w-auto flex items-center justify-center space-x-2 bg-green-600 hover:bg-green-700 text-white"
                            aria-label="Falar com especialista pelo WhatsApp"
                        >
                            <MessageCircle className="w-5 h-5" aria-hidden="true" />
                            <span>Falar com Especialista</span>
                        </Button>
                    </div>

                    {/* Quick Links */}
                    <div>
                        <h4 className="font-semibold text-lg text-white mb-6 pb-2 border-b border-medical-700">
                            Navegação
                        </h4>
                        <nav aria-label="Links rápidos">
                            <ul className="space-y-3">
                                {quickLinks.map((link) => (
                                    <li key={link.name}>
                                        <a
                                            href={link.href}
                                            className="text-gray-300 hover:text-primary-400 transition-colors duration-200 flex items-center group text-sm"
                                            {...(link.download ? { download: '', target: '_blank', rel: 'noopener noreferrer' } : {})}
                                        >
                                            {link.icon === 'download' ? (
                                                <Download className="w-3.5 h-3.5 mr-2 group-hover:text-primary-400 transition-colors" aria-hidden="true" />
                                            ) : (
                                                <span className="w-1.5 h-1.5 bg-primary-500 rounded-full mr-3 opacity-0 group-hover:opacity-100 transition-opacity" aria-hidden="true"></span>
                                            )}
                                            {link.name}
                                        </a>
                                    </li>
                                ))}
                            </ul>
                        </nav>
                    </div>

                    {/* Contact Info */}
                    <div>
                        <h4 className="font-semibold text-lg text-white mb-6 pb-2 border-b border-medical-700">
                            Atendimento
                        </h4>
                        <div className="space-y-5">

                            {/* Address */}
                            <div className="flex items-start space-x-3">
                                <MapPin className="w-5 h-5 text-primary-400 mt-0.5 flex-shrink-0" aria-hidden="true" />
                                <address className="text-gray-300 text-sm not-italic">
                                    <p>{clinicInfo.address.street}</p>
                                    <p>{clinicInfo.address.neighborhood}</p>
                                    <p>{clinicInfo.address.city}, {clinicInfo.address.state}</p>
                                    <p>CEP: {clinicInfo.address.zipCode}</p>
                                </address>
                            </div>

                            {/* Phone */}
                            <div className="flex items-center space-x-3">
                                <Phone className="w-5 h-5 text-primary-400 flex-shrink-0" aria-hidden="true" />
                                <a
                                    href={`tel:${clinicInfo.contact.phone}`}
                                    className="text-gray-300 hover:text-primary-400 transition-colors text-sm font-medium"
                                    aria-label={`Ligar para ${clinicInfo.contact.phone}`}
                                >
                                    {clinicInfo.contact.phone}
                                </a>
                            </div>

                            {/* Email */}
                            <div className="flex items-center space-x-3">
                                <Mail className="w-5 h-5 text-primary-400 flex-shrink-0" aria-hidden="true" />
                                <a
                                    href={`mailto:${clinicInfo.contact.email}`}
                                    className="text-gray-300 hover:text-primary-400 transition-colors text-sm break-all"
                                    aria-label={`Enviar email para ${clinicInfo.contact.email}`}
                                >
                                    {clinicInfo.contact.email}
                                </a>
                            </div>

                            {/* Business Hours */}
                            <div className="flex items-start space-x-3">
                                <Clock className="w-5 h-5 text-primary-400 mt-0.5 flex-shrink-0" aria-hidden="true" />
                                <div className="text-gray-300 text-sm">
                                    <p className="font-medium mb-1">Horário de Atendimento:</p>
                                    <p>{clinicInfo.businessHours.weekdays}</p>
                                    <p>{clinicInfo.businessHours.saturday}</p>
                                    <p className="text-xs text-gray-400 mt-2 italic">
                                        {clinicInfo.businessHours.emergency}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Coverage Banner */}
            <div className="bg-primary-600 py-4">
                <div className="container-custom">
                    <div className="flex items-center justify-center space-x-6 text-white">
                        <div className="flex items-center space-x-2">
                            <Shield className="w-5 h-5" />
                            <span className="font-medium">{clinicInfo.coverage.area}</span>
                        </div>
                        <div className="hidden md:block w-px h-6 bg-primary-400"></div>
                        <div className="hidden md:flex items-center space-x-2">
                            <span className="text-primary-100">{clinicInfo.coverage.shipping}</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Bottom Bar */}
            <div className="bg-medical-950 py-8">
                <div className="container-custom">
                    {/* Legal Links */}
                    <div className="flex flex-wrap items-center justify-center gap-4 mb-6">
                        {legalLinks.map((link) => (
                            link.href ? (
                                <a
                                    key={link.name}
                                    href={link.href}
                                    className="text-gray-400 hover:text-primary-400 transition-colors text-sm flex items-center space-x-1.5 group"
                                >
                                    <FileText className="w-3.5 h-3.5 group-hover:text-primary-400 transition-colors" aria-hidden="true" />
                                    <span>{link.name}</span>
                                </a>
                            ) : (
                                <button
                                    key={link.name}
                                    onClick={link.action}
                                    className="text-gray-400 hover:text-primary-400 transition-colors text-sm flex items-center space-x-1.5 group"
                                >
                                    {link.name.includes('Configurações') ? (
                                        <Settings className="w-3.5 h-3.5 group-hover:text-primary-400 transition-colors" aria-hidden="true" />
                                    ) : (
                                        <FileText className="w-3.5 h-3.5 group-hover:text-primary-400 transition-colors" aria-hidden="true" />
                                    )}
                                    <span>{link.name}</span>
                                </button>
                            )
                        ))}
                    </div>

                    {/* Trust Indicators */}
                    <div className="flex flex-wrap items-center justify-center gap-6 mb-6 pb-6 border-b border-medical-800">
                        <div className="flex items-center space-x-2 text-gray-400">
                            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" aria-hidden="true"></div>
                            <span className="text-sm">Site Seguro SSL</span>
                        </div>
                        <div className="flex items-center space-x-2 text-gray-400">
                            <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" aria-hidden="true"></div>
                            <span className="text-sm">Conformidade LGPD</span>
                        </div>
                        <div className="flex items-center space-x-2 text-gray-400">
                            <div className="w-2 h-2 bg-purple-500 rounded-full animate-pulse" aria-hidden="true"></div>
                            <span className="text-sm">Produtos ANVISA</span>
                        </div>
                    </div>

                    {/* Copyright & Company Info */}
                    <div className="text-center space-y-2">
                        <p className="text-gray-400 text-sm">
                            © {currentYear} SV Lentes. Todos os direitos reservados.
                        </p>
                        <div className="flex flex-wrap items-center justify-center gap-3 text-xs text-gray-500">
                            <span>CNPJ: {clinicInfo.cnpj}</span>
                            <span aria-hidden="true">•</span>
                            <span>Responsável Técnico: {doctorInfo.crm}</span>
                            <span aria-hidden="true">•</span>
                            <span>Equipe: {doctorInfo.crmEquipe}</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Privacy Modals */}
            <PrivacyPolicy
                isOpen={showPrivacyPolicy}
                onClose={() => setShowPrivacyPolicy(false)}
            />
            <PrivacySettings
                isOpen={showPrivacySettings}
                onClose={() => setShowPrivacySettings(false)}
            />
            <DataControlPanel
                isOpen={showDataControl}
                onClose={() => setShowDataControl(false)}
            />
        </footer>
    )
}
