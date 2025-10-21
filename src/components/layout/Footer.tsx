'use client'

import { useState } from 'react'
import { LogoFooter } from '@/components/ui/Logo'
import { OptimizedImage } from '@/components/ui/OptimizedImage'
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

    // FIXME: Configuração centralizada desabilitada temporariamente
    // ConfigService requer acesso a fs (Node.js) que não funciona no client
    // TODO: Implementar servidor de config ou passar como props de server component
    const useCentralizedConfig = false
    const footerMenu = null

    // Quick Links: usar config centralizado se disponível
    const quickLinks = useCentralizedConfig && footerMenu
        ? footerMenu.quickLinks.map((item: any) => ({
            name: item.label,
            href: item.href,
            download: item.download || false,
            icon: item.icon || undefined
        }))
        : [
            { name: 'Planos e Preços', href: '#planos-precos' },
            { name: 'Como Funciona', href: '#como-funciona' },
            { name: 'FAQ', href: '#perguntas-frequentes' },
            { name: 'Programa de Indicação', href: '#programa-indicacao' },
            { name: 'Manual do Paciente (PDF)', href: '/ManualPacienteLentesContato2025.pdf', download: true, icon: 'download' },
        ]

    // Legal Links: usar config centralizado se disponível
    const legalLinksFromConfig = useCentralizedConfig && footerMenu
        ? footerMenu.legalLinks.map((item: any) => {
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
        <footer className={`relative mt-16 bg-transparent text-slate-700 ${className ?? ''}`}>
            <div className="pointer-events-none absolute inset-0 -z-10 bg-gradient-to-b from-transparent via-primary-50/40 to-primary-100/20" />
            <div className="mx-auto w-full max-w-6xl px-4 sm:px-6 lg:px-8">
                <div className="relative overflow-hidden rounded-[40px] border border-white/60 bg-white/90 shadow-glass-lg backdrop-blur-xl">
                    <div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(140%_140%_at_0%_0%,rgba(6,182,212,0.15),transparent_55%)]" />
                    <div className="pointer-events-none absolute inset-y-0 right-0 -z-10 w-1/2 bg-[radial-gradient(120%_120%_at_100%_0%,rgba(45,212,191,0.12),transparent_60%)]" />
                    <div className="px-6 py-12 sm:px-10 lg:px-14 lg:py-16">
                        <div className="grid grid-cols-1 gap-12 lg:grid-cols-4">
                            <div className="lg:col-span-2 space-y-8">
                                <div className="space-y-6">
                                    <div className="flex flex-col gap-4">
                                        <LogoFooter />
                                        <div className="h-0.5 w-16 rounded-full bg-gradient-to-r from-primary-500 to-primary-300" />
                                    </div>
                                    <p className="text-lg font-semibold text-slate-800">
                                        Pioneiro no Brasil em assinatura de lentes com acompanhamento médico integral.
                                    </p>
                                    <p className="max-w-xl text-slate-600">
                                        Receba suas lentes no conforto de casa, com protocolo clínico personalizado e suporte do Dr. Philipe Saraiva Cruz.
                                    </p>
                                </div>
                                <div className="rounded-3xl border border-white/70 bg-white/80 p-6 shadow-inner">
                                    <h4 className="text-xs font-semibold uppercase tracking-[0.4em] text-primary-700">
                                        Responsável técnico
                                    </h4>
                                    <div className="mt-5 flex items-start gap-4">
                                        <div className="h-14 w-14 overflow-hidden rounded-full border border-primary/40">
                                            <OptimizedImage
                                                src="/icones/drphilipe_perfil.jpeg"
                                                alt="Dr. Philipe Saraiva Cruz"
                                                width={56}
                                                height={56}
                                                quality={85}
                                                className="h-full w-full object-cover"
                                            />
                                        </div>
                                        <div className="space-y-1">
                                            <p className="text-lg font-semibold text-slate-900">{doctorInfo.name}</p>
                                            <p className="text-sm font-medium text-primary-700">{doctorInfo.crm}</p>
                                            <p className="text-sm text-slate-600">{doctorInfo.specialty}</p>
                                            <p className="text-xs text-slate-500">{doctorInfo.experience}</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div>
                                <h4 className="text-sm font-semibold uppercase tracking-[0.3em] text-primary-700">
                                    Navegação
                                </h4>
                                <ul className="mt-6 space-y-3">
                                    {quickLinks.map((link: any) => (
                                        <li key={link.name}>
                                            <a
                                                href={link.href}
                                                className="group flex items-center gap-3 rounded-2xl px-3 py-2 text-sm font-medium text-slate-600 transition hover:bg-primary/10 hover:text-primary-700"
                                                {...(link.download ? { download: '', target: '_blank', rel: 'noopener noreferrer' } : {})}
                                            >
                                                {link.icon === 'download' ? (
                                                    <Download className="h-4 w-4 text-primary-500 transition group-hover:text-primary-600" aria-hidden="true" />
                                                ) : (
                                                    <span className="h-1.5 w-1.5 rounded-full bg-primary-500 opacity-50 transition group-hover:opacity-100" aria-hidden="true" />
                                                )}
                                                {link.name}
                                            </a>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                            <div className="space-y-5">
                                <h4 className="text-sm font-semibold uppercase tracking-[0.3em] text-primary-700">
                                    Atendimento
                                </h4>
                                <div className="space-y-5 text-sm text-slate-600">
                                    <div className="flex items-start gap-3">
                                        <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-primary/10 text-primary-600">
                                            <MapPin className="h-5 w-5" aria-hidden="true" />
                                        </div>
                                        <address className="not-italic leading-relaxed">
                                            <p>{clinicInfo.address.street}</p>
                                            <p>{clinicInfo.address.neighborhood}</p>
                                            <p>{clinicInfo.address.city}, {clinicInfo.address.state}</p>
                                            <p>CEP: {clinicInfo.address.zipCode}</p>
                                        </address>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-primary/10 text-primary-600">
                                            <Phone className="h-5 w-5" aria-hidden="true" />
                                        </div>
                                        <a
                                            href={`tel:${clinicInfo.contact.phone}`}
                                            className="font-medium text-slate-700 transition hover:text-primary-600"
                                            aria-label={`Ligar para ${clinicInfo.contact.phone}`}
                                        >
                                            {clinicInfo.contact.phone}
                                        </a>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-primary/10 text-primary-600">
                                            <Mail className="h-5 w-5" aria-hidden="true" />
                                        </div>
                                        <a
                                            href={`mailto:${clinicInfo.contact.email}`}
                                            className="break-all font-medium text-slate-700 transition hover:text-primary-600"
                                            aria-label={`Enviar email para ${clinicInfo.contact.email}`}
                                        >
                                            {clinicInfo.contact.email}
                                        </a>
                                    </div>
                                    <div className="flex items-start gap-3">
                                        <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-primary/10 text-primary-600">
                                            <Clock className="h-5 w-5" aria-hidden="true" />
                                        </div>
                                        <div>
                                            <p className="text-sm font-semibold text-slate-700">Horário de atendimento</p>
                                            <p>{clinicInfo.businessHours.weekdays}</p>
                                            <p>{clinicInfo.businessHours.saturday}</p>
                                            <p className="mt-2 text-xs text-slate-500">{clinicInfo.businessHours.emergency}</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div className="mt-12 grid grid-cols-1 gap-6 border-t border-white/70 pt-8 lg:grid-cols-3 lg:items-center">
                            <div className="flex items-center gap-3 text-sm text-primary-800">
                                <Shield className="h-5 w-5" />
                                <span className="font-medium">{clinicInfo.coverage.area}</span>
                            </div>
                            <div className="flex items-center justify-center gap-6 text-xs uppercase tracking-[0.3em] text-slate-500">
                                <div className="flex items-center gap-2">
                                    <div className="h-2 w-2 animate-pulse rounded-full bg-emerald-500" />
                                    <span>SSL seguro</span>
                                </div>
                                <div className="hidden md:flex items-center gap-2">
                                    <div className="h-2 w-2 animate-pulse rounded-full bg-blue-500" />
                                    <span>LGPD</span>
                                </div>
                                <div className="hidden lg:flex items-center gap-2">
                                    <div className="h-2 w-2 animate-pulse rounded-full bg-purple-500" />
                                    <span>ANVISA</span>
                                </div>
                            </div>
                            <div className="flex items-center justify-end text-sm text-slate-500">
                                <MessageCircle className="mr-2 h-4 w-4 text-primary-500" />
                                <span>{clinicInfo.coverage.shipping}</span>
                            </div>
                        </div>
                    </div>
                    <div className="border-t border-white/60 bg-white/80">
                        <div className="mx-auto flex w-full max-w-5xl flex-col items-center gap-6 px-6 py-6 text-center sm:px-10 lg:flex-row lg:justify-between lg:text-left">
                            <div className="flex flex-wrap items-center justify-center gap-4 text-sm text-slate-600">
                                {legalLinks.map((link: any) => (
                                    link.href ? (
                                        <a
                                            key={link.name}
                                            href={link.href}
                                            className="flex items-center gap-2 text-sm font-medium text-slate-500 transition hover:text-primary-600"
                                        >
                                            <FileText className="h-4 w-4" aria-hidden="true" />
                                            <span>{link.name}</span>
                                        </a>
                                    ) : (
                                        <button
                                            key={link.name}
                                            onClick={link.action}
                                            className="flex items-center gap-2 text-sm font-medium text-slate-500 transition hover:text-primary-600"
                                        >
                                            {link.name.includes('Configurações') ? (
                                                <Settings className="h-4 w-4" aria-hidden="true" />
                                            ) : (
                                                <FileText className="h-4 w-4" aria-hidden="true" />
                                            )}
                                            <span>{link.name}</span>
                                        </button>
                                    )
                                ))}
                            </div>
                            <div className="text-xs text-slate-500">
                                <p>© {currentYear} SV Lentes. Todos os direitos reservados.</p>
                                <div className="mt-1 flex flex-wrap items-center justify-center gap-2">
                                    <span>CNPJ: {clinicInfo.cnpj}</span>
                                    <span aria-hidden="true">•</span>
                                    <span>Responsável Técnico: {doctorInfo.crm}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

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
