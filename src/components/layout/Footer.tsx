'use client'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { LogoFooter } from '@/components/ui/logo'
import { OptimizedImage } from '@/components/ui/OptimizedImage'
import { generateWhatsAppLink } from '@/lib/utils'
import { doctorInfo, clinicInfo } from '@/data/doctor-info'
import { PrivacyPolicy } from '@/components/privacy/PrivacyPolicy'
import { PrivacySettings } from '@/components/privacy/PrivacySettings'
import { DataControlPanel } from '@/components/privacy/DataControlPanel'
import { useClientConfig } from '@/lib/use-client-config'
import { useTranslation } from '@/lib/translation'
import { EnhancedTrustSection } from '@/components/trust/EnhancedTrustSection'
import {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger,
} from '@/components/ui/accordion'
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
    Download,
    ExternalLink
} from 'lucide-react'
interface FooterProps {
    className?: string
}
export function Footer({ className }: FooterProps) {
    const currentYear = new Date().getFullYear()
    const [showPrivacyPolicy, setShowPrivacyPolicy] = useState(false)
    const [showPrivacySettings, setShowPrivacySettings] = useState(false)
    const [showDataControl, setShowDataControl] = useState(false)
    // Usar configuração centralizada via API - TODO RESOLVIDO ✅
    const { config, loading, error } = useClientConfig()
    const { t } = useTranslation()
    // Quick Links: usar config centralizado se disponível, senão fallback
    const quickLinks = config?.content?.footer?.quickLinks || [
        { name: 'Planos e Preços', href: '#planos-precos' },
        { name: 'Como Funciona', href: '#como-funciona' },
        { name: 'FAQ', href: '#perguntas-frequentes' },
        { name: 'Programa de Indicação', href: '#programa-indicacao' },
        { name: 'Manual do Paciente (PDF)', href: '/ManualPacienteLentesContato2025.pdf', download: true, icon: 'download' },
    ]
    // Legal Links: usar config centralizado se disponível
    const legalLinksFromConfig = config?.content?.footer?.legalLinks
        ? config.content.footer.legalLinks.map((item: any) => {
            // Mapear actions para funções
            const actionMap: Record<string, () => void> = {
                'showPrivacyPolicy': () => setShowPrivacyPolicy(true),
                'showPrivacySettings': () => setShowPrivacySettings(true),
                'showDataControl': () => setShowDataControl(true)
            }
            return {
                name: item.label,
                href: item.href && !item.action ? item.href : undefined,
                action: item.action ? actionMap[item.action] : undefined
            }
        })
         : null
    const legalLinks = legalLinksFromConfig || [
        { name: 'Termos de Uso', href: '/termos-uso' },
        { name: 'Política de Privacidade', href: '/politica-privacidade' },
        { name: 'Política de Troca e Devolução', href: '/politica-troca-devolucao' },
        { name: 'Política de Cancelamento', href: '/politica-cancelamento' },
        {
            name: 'Configurações de Privacidade',
            action: () => setShowPrivacySettings(true)
        },
        {
            name: 'Meus Dados (LGPD)',
            action: () => setShowDataControl(true)
        },
    ]
    return (
        <footer className={`bg-white text-gray-800 ${className}`}>
            {/* Enhanced Trust Section - Desktop */}
            <div className="hidden md:block bg-gradient-to-b from-gray-50 to-white border-t border-gray-200">
                <div className="container-custom py-12">
                    <EnhancedTrustSection variant="full" />
                </div>
            </div>

            {/* Enhanced Trust Section - Mobile Compact */}
            <div className="md:hidden bg-gradient-to-b from-gray-50 to-white border-t border-gray-200">
                <div className="container-custom py-8">
                    <EnhancedTrustSection variant="compact" />
                </div>
            </div>

            {/* Main Footer Content - Desktop View */}
            <div className="hidden md:block container-custom py-16 border-t border-gray-200">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12">
                    {/* Company Info */}
                    <div className="lg:col-span-2 space-y-6">
                        <div className="flex flex-col items-start">
                            {/* Logo */}
                            <div className="mb-6">
                                <LogoFooter />
                            </div>
                            <p className="text-lg text-gray-700 font-medium mb-3">
                                Pioneiro no Brasil em Assinatura de Lentes de Contato
                            </p>
                            <p className="text-gray-600 leading-relaxed">
                                Assinatura de lentes de contato com acompanhamento médico especializado.
                                Nunca mais fique sem lentes com a comodidade e segurança que você merece.
                            </p>
                        </div>
                        {/* Doctor Info */}
                        <div className="bg-gradient-to-br from-cyan-50 to-blue-50 rounded-xl p-6 border border-cyan-200">
                            <h4 className="text-sm font-semibold text-cyan-900 uppercase tracking-wide mb-4">
                                Responsável Técnico
                            </h4>
                            <div className="flex items-start space-x-4">
                                <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-cyan-400 flex-shrink-0">
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
                                    <h5 className="font-semibold text-lg text-gray-900 mb-1">
                                        {doctorInfo.name}
                                    </h5>
                                    <p className="text-cyan-600 font-medium mb-1">
                                        {doctorInfo.crm}
                                    </p>
                                    <p className="text-gray-600 text-sm mb-1">
                                        {doctorInfo.specialty}
                                    </p>
                                    <p className="text-gray-500 text-sm">
                                        {doctorInfo.experience}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                    {/* Quick Links */}
                    <div>
                        <h4 className="font-semibold text-lg text-gray-900 mb-6 pb-2 border-b-2 border-cyan-400">
                            Navegação
                        </h4>
                        <nav aria-label="Links rápidos">
                            <ul className="space-y-3">
                                {quickLinks.map((link: any) => (
                                    <li key={link.name}>
                                        <a
                                            href={link.href}
                                            className="text-gray-600 hover:text-cyan-600 transition-colors duration-200 flex items-center group text-sm"
                                            {...(link.download ? { download: '', target: '_blank', rel: 'noopener noreferrer' } : {})}
                                        >
                                            {link.icon === 'download' ? (
                                                <Download className="w-3.5 h-3.5 mr-2 group-hover:text-cyan-600 transition-colors" aria-hidden="true" />
                                            ) : (
                                                <span className="w-1.5 h-1.5 bg-cyan-500 rounded-full mr-3 opacity-0 group-hover:opacity-100 transition-opacity" aria-hidden="true"></span>
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
                        <h4 className="font-semibold text-lg text-gray-900 mb-6 pb-2 border-b-2 border-cyan-400">
                            Atendimento
                        </h4>
                        <div className="space-y-5">
                            {/* Address */}
                            <div className="flex items-start space-x-3">
                                <MapPin className="w-5 h-5 text-cyan-500 mt-0.5 flex-shrink-0" aria-hidden="true" />
                                <address className="text-gray-600 text-sm not-italic">
                                    <p>{clinicInfo.address.street}</p>
                                    <p>{clinicInfo.address.neighborhood}</p>
                                    <p>{clinicInfo.address.city}, {clinicInfo.address.state}</p>
                                    <p>CEP: {clinicInfo.address.zipCode}</p>
                                </address>
                            </div>
                            {/* Phone */}
                            <div className="flex items-center space-x-3">
                                <Phone className="w-5 h-5 text-cyan-500 flex-shrink-0" aria-hidden="true" />
                                <a
                                    href={`tel:${clinicInfo.contact.phone}`}
                                    className="text-gray-600 hover:text-cyan-600 transition-colors text-sm font-medium"
                                    aria-label={`Ligar para ${clinicInfo.contact.phone}`}
                                >
                                    {clinicInfo.contact.phone}
                                </a>
                            </div>
                            {/* Email */}
                            <div className="flex items-center space-x-3">
                                <Mail className="w-5 h-5 text-cyan-500 flex-shrink-0" aria-hidden="true" />
                                <a
                                    href={`mailto:${clinicInfo.contact.email}`}
                                    className="text-gray-600 hover:text-cyan-600 transition-colors text-sm break-all"
                                    aria-label={`Enviar email para ${clinicInfo.contact.email}`}
                                >
                                    {clinicInfo.contact.email}
                                </a>
                            </div>
                            {/* Business Hours */}
                            <div className="flex items-start space-x-3">
                                <Clock className="w-5 h-5 text-cyan-500 mt-0.5 flex-shrink-0" aria-hidden="true" />
                                <div className="text-gray-600 text-sm">
                                    <p className="font-medium mb-1">Horário de Atendimento:</p>
                                    <p>{clinicInfo.businessHours.weekdays}</p>
                                    <p>{clinicInfo.businessHours.saturday}</p>
                                    <p className="text-xs text-gray-500 mt-2 italic">
                                        {clinicInfo.businessHours.emergency}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Mobile Footer - Accordion Style */}
            <div className="md:hidden container-custom py-8 border-t border-gray-200">
                {/* Mobile Contact CTAs */}
                <div className="mb-8 space-y-3">
                    <a
                        href={generateWhatsAppLink()}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center justify-center gap-3 w-full bg-[#25d366] hover:bg-[#20b858] text-white py-4 px-6 rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all duration-300"
                    >
                        <MessageCircle className="w-6 h-6" />
                        <span>Falar no WhatsApp</span>
                        <ExternalLink className="w-4 h-4" />
                    </a>
                    <a
                        href={`tel:${clinicInfo.contact.phone}`}
                        className="flex items-center justify-center gap-3 w-full bg-cyan-500 hover:bg-cyan-600 text-white py-4 px-6 rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all duration-300"
                    >
                        <Phone className="w-6 h-6" />
                        <span>Ligar Agora</span>
                    </a>
                </div>

                {/* Logo and Description */}
                <div className="mb-8 text-center">
                    <div className="mb-4">
                        <LogoFooter className="mx-auto" />
                    </div>
                    <p className="text-sm text-gray-600">
                        Pioneiro no Brasil em Assinatura de Lentes de Contato
                    </p>
                </div>

                {/* Accordion Sections */}
                <Accordion type="single" collapsible className="w-full space-y-2">
                    {/* Navigation */}
                    <AccordionItem value="navigation" className="border border-gray-200 rounded-lg px-4">
                        <AccordionTrigger className="text-base font-semibold text-gray-900 hover:text-cyan-600">
                            Navegação
                        </AccordionTrigger>
                        <AccordionContent>
                            <nav aria-label="Links rápidos">
                                <ul className="space-y-3 pt-2">
                                    {quickLinks.map((link: any) => (
                                        <li key={link.name}>
                                            <a
                                                href={link.href}
                                                className="text-gray-600 hover:text-cyan-600 transition-colors flex items-center gap-2 text-sm py-1"
                                                {...(link.download ? { download: '', target: '_blank', rel: 'noopener noreferrer' } : {})}
                                            >
                                                {link.icon === 'download' && (
                                                    <Download className="w-4 h-4" aria-hidden="true" />
                                                )}
                                                {link.name}
                                            </a>
                                        </li>
                                    ))}
                                </ul>
                            </nav>
                        </AccordionContent>
                    </AccordionItem>

                    {/* Contact Info */}
                    <AccordionItem value="contact" className="border border-gray-200 rounded-lg px-4">
                        <AccordionTrigger className="text-base font-semibold text-gray-900 hover:text-cyan-600">
                            Atendimento
                        </AccordionTrigger>
                        <AccordionContent>
                            <div className="space-y-4 pt-2">
                                <div className="flex items-start gap-3">
                                    <MapPin className="w-5 h-5 text-cyan-500 mt-0.5 flex-shrink-0" />
                                    <address className="text-gray-600 text-sm not-italic">
                                        <p>{clinicInfo.address.street}</p>
                                        <p>{clinicInfo.address.neighborhood}</p>
                                        <p>{clinicInfo.address.city}, {clinicInfo.address.state}</p>
                                        <p>CEP: {clinicInfo.address.zipCode}</p>
                                    </address>
                                </div>
                                <div className="flex items-center gap-3">
                                    <Mail className="w-5 h-5 text-cyan-500 flex-shrink-0" />
                                    <a
                                        href={`mailto:${clinicInfo.contact.email}`}
                                        className="text-gray-600 hover:text-cyan-600 transition-colors text-sm break-all"
                                    >
                                        {clinicInfo.contact.email}
                                    </a>
                                </div>
                                <div className="flex items-start gap-3">
                                    <Clock className="w-5 h-5 text-cyan-500 mt-0.5 flex-shrink-0" />
                                    <div className="text-gray-600 text-sm">
                                        <p className="font-medium mb-1">Horário:</p>
                                        <p>{clinicInfo.businessHours.weekdays}</p>
                                        <p>{clinicInfo.businessHours.saturday}</p>
                                    </div>
                                </div>
                            </div>
                        </AccordionContent>
                    </AccordionItem>

                    {/* Doctor Info */}
                    <AccordionItem value="doctor" className="border border-gray-200 rounded-lg px-4">
                        <AccordionTrigger className="text-base font-semibold text-gray-900 hover:text-cyan-600">
                            Responsável Técnico
                        </AccordionTrigger>
                        <AccordionContent>
                            <div className="flex items-start gap-4 pt-2">
                                <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-cyan-400 flex-shrink-0">
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
                                    <h5 className="font-semibold text-base text-gray-900 mb-1">
                                        {doctorInfo.name}
                                    </h5>
                                    <p className="text-cyan-600 font-medium mb-1 text-sm">
                                        {doctorInfo.crm}
                                    </p>
                                    <p className="text-gray-600 text-sm">
                                        {doctorInfo.specialty}
                                    </p>
                                </div>
                            </div>
                        </AccordionContent>
                    </AccordionItem>
                </Accordion>
            </div>
            {/* Coverage Banner */}
            <div className="bg-gradient-to-r from-cyan-500 to-slate-400 py-4">
                <div className="container-custom">
                    <div className="flex items-center justify-center space-x-6 text-white">
                        <div className="flex items-center space-x-2">
                            <Shield className="w-5 h-5" />
                            <span className="font-medium">{clinicInfo.coverage.area}</span>
                        </div>
                        <div className="hidden md:block w-px h-6 bg-cyan-300"></div>
                        <div className="hidden md:flex items-center space-x-2">
                            <span className="text-cyan-50">{clinicInfo.coverage.shipping}</span>
                        </div>
                    </div>
                </div>
            </div>
            {/* Bottom Bar */}
            <div className="bg-gray-100 py-8 border-t border-gray-300">
                <div className="container-custom">
                    {/* Legal Links - Desktop */}
                    <div className="hidden md:flex flex-wrap items-center justify-center gap-4 mb-6">
                        {legalLinks.map((link: any) => (
                            link.href ? (
                                <a
                                    key={link.name}
                                    href={link.href}
                                    className="text-gray-600 hover:text-cyan-600 transition-colors text-sm flex items-center space-x-1.5 group"
                                >
                                    <FileText className="w-3.5 h-3.5 group-hover:text-cyan-600 transition-colors" aria-hidden="true" />
                                    <span>{link.name}</span>
                                </a>
                            ) : (
                                <button
                                    key={link.name}
                                    onClick={link.action}
                                    className="text-gray-600 hover:text-cyan-600 transition-colors text-sm flex items-center space-x-1.5 group"
                                >
                                    {link.name.includes('Configurações') ? (
                                        <Settings className="w-3.5 h-3.5 group-hover:text-cyan-600 transition-colors" aria-hidden="true" />
                                    ) : (
                                        <FileText className="w-3.5 h-3.5 group-hover:text-cyan-600 transition-colors" aria-hidden="true" />
                                    )}
                                    <span>{link.name}</span>
                                </button>
                            )
                        ))}
                    </div>

                    {/* Legal Links - Mobile Accordion */}
                    <div className="md:hidden mb-6">
                        <Accordion type="single" collapsible className="w-full">
                            <AccordionItem value="legal" className="border border-gray-200 rounded-lg px-4">
                                <AccordionTrigger className="text-sm font-semibold text-gray-700 hover:text-cyan-600">
                                    Termos e Privacidade
                                </AccordionTrigger>
                                <AccordionContent>
                                    <div className="grid grid-cols-1 gap-2 pt-2">
                                        {legalLinks.map((link: any) => (
                                            link.href ? (
                                                <a
                                                    key={link.name}
                                                    href={link.href}
                                                    className="text-gray-600 hover:text-cyan-600 transition-colors text-xs flex items-center gap-2 py-2"
                                                >
                                                    <FileText className="w-3 h-3" aria-hidden="true" />
                                                    <span>{link.name}</span>
                                                </a>
                                            ) : (
                                                <button
                                                    key={link.name}
                                                    onClick={link.action}
                                                    className="text-gray-600 hover:text-cyan-600 transition-colors text-xs flex items-center gap-2 py-2 text-left"
                                                >
                                                    {link.name.includes('Configurações') ? (
                                                        <Settings className="w-3 h-3" aria-hidden="true" />
                                                    ) : (
                                                        <FileText className="w-3 h-3" aria-hidden="true" />
                                                    )}
                                                    <span>{link.name}</span>
                                                </button>
                                            )
                                        ))}
                                    </div>
                                </AccordionContent>
                            </AccordionItem>
                        </Accordion>
                    </div>

                    {/* Copyright & Company Info */}
                    <div className="text-center space-y-3">
                        <p className="text-gray-600 text-sm font-medium">
                            © {currentYear} SV Lentes. Todos os direitos reservados.
                        </p>
                        <div className="flex flex-col md:flex-row items-center justify-center gap-2 md:gap-3 text-xs text-gray-600">
                            <span>CNPJ: {clinicInfo.cnpj}</span>
                            <span className="hidden md:inline" aria-hidden="true">•</span>
                            <span>Responsável Técnico: {doctorInfo.crm}</span>
                        </div>
                        {/* Made with love */}
                        <div className="flex items-center justify-center gap-2 text-xs text-gray-500 pt-2">
                            <Heart className="w-3 h-3 text-red-500 fill-red-500" />
                            <span>Feito com carinho em Caratinga, MG</span>
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