'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { LogoFooter } from '@/components/ui/logo'
import { OptimizedImage } from '@/components/ui/OptimizedImage'
import { generateWhatsAppLink } from '@/lib/utils'
import { doctorInfo, clinicInfo } from '@/data/doctor-info'
import { PrivacyPolicy } from '@/components/privacy/PrivacyPolicy'
import { PrivacySettings } from '@/components/privacy/PrivacySettings'
import { DataControlPanel } from '@/components/privacy/DataControlPanel'
import { useClientConfig } from '@/lib/use-client-config'
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
    Star,
    CheckCircle2,
    TrendingUp,
    Users,
    Package,
    Sparkles,
    ArrowRight,
    Facebook,
    Instagram,
    Twitter
} from 'lucide-react'

interface FooterProps {
    className?: string
}

// Dados simulados de atividades de assinantes (estilo feed social)
const subscriberActivities = [
    {
        id: 1,
        name: 'Maria Silva',
        avatar: '/icones/drphilipe_perfil.jpeg',
        action: 'completou 6 meses de assinatura',
        plan: 'Plano Premium',
        time: '2 horas atrás',
        badge: 'Assinante VIP',
        icon: Star,
        color: 'text-yellow-500'
    },
    {
        id: 2,
        name: 'João Santos',
        avatar: '/icones/drphilipe_perfil.jpeg',
        action: 'economizou R$ 450 este ano',
        plan: 'Plano Essencial',
        time: '5 horas atrás',
        badge: 'Economia',
        icon: TrendingUp,
        color: 'text-green-500'
    },
    {
        id: 3,
        name: 'Ana Costa',
        avatar: '/icones/drphilipe_perfil.jpeg',
        action: 'recomendou para 3 amigos',
        plan: 'Plano Family',
        time: '1 dia atrás',
        badge: 'Embaixador',
        icon: Users,
        color: 'text-blue-500'
    },
    {
        id: 4,
        name: 'Pedro Oliveira',
        avatar: '/icones/drphilipe_perfil.jpeg',
        action: 'recebeu sua 12ª entrega',
        plan: 'Plano Premium',
        time: '2 dias atrás',
        badge: 'Veterano',
        icon: Package,
        color: 'text-purple-500'
    }
]

const testimonials = [
    {
        id: 1,
        name: 'Juliana Martins',
        text: 'Nunca mais me preocupo em ficar sem lentes! O serviço é impecável.',
        rating: 5,
        plan: 'Premium',
        time: '1 semana atrás'
    },
    {
        id: 2,
        name: 'Roberto Alves',
        text: 'Economia real e qualidade garantida. Melhor decisão que tomei!',
        rating: 5,
        plan: 'Essencial',
        time: '2 semanas atrás'
    },
    {
        id: 3,
        name: 'Carla Fernandes',
        text: 'Atendimento excepcional e acompanhamento médico de primeira.',
        rating: 5,
        plan: 'Family',
        time: '3 semanas atrás'
    }
]

export function Footer({ className }: FooterProps) {
    const currentYear = new Date().getFullYear()
    const [showPrivacyPolicy, setShowPrivacyPolicy] = useState(false)
    const [showPrivacySettings, setShowPrivacySettings] = useState(false)
    const [showDataControl, setShowDataControl] = useState(false)

    const { config } = useClientConfig()

    const quickLinks = config?.content?.footer?.quickLinks || [
        { name: 'Planos e Preços', href: '#planos-precos' },
        { name: 'Como Funciona', href: '#como-funciona' },
        { name: 'FAQ', href: '#perguntas-frequentes' },
        { name: 'Programa de Indicação', href: '#programa-indicacao' },
        { name: 'Manual do Paciente (PDF)', href: '/ManualPacienteLentesContato2025.pdf', download: true, icon: 'download' },
    ]

    const legalLinksFromConfig = config?.content?.footer?.legalLinks
        ? config.content.footer.legalLinks.map((item: { label: string; href?: string; action?: string }) => {
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
        <footer className={`bg-gradient-to-b from-gray-50 to-white ${className}`}>
            {/* Feed de Atividades dos Assinantes - Estilo Rede Social */}
            <div className="bg-gradient-to-r from-cyan-500 via-blue-500 to-purple-500 py-12 overflow-hidden">
                <div className="container-custom">
                    <div className="text-center mb-8">
                        <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-sm rounded-full px-4 py-2 mb-4">
                            <Sparkles className="w-4 h-4 text-white animate-pulse" />
                            <span className="text-white font-medium text-sm">Comunidade SV Lentes</span>
                        </div>
                        <h2 className="text-3xl font-bold text-white mb-2">
                            Mais de 2.500+ assinantes felizes
                        </h2>
                        <p className="text-white/90 text-lg">
                            Veja o que nossa comunidade está fazendo agora
                        </p>
                    </div>

                    {/* Feed Centralizado - Estilo Timeline */}
                    <div className="max-w-3xl mx-auto">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {subscriberActivities.slice(0, 2).map((activity) => {
                                const Icon = activity.icon
                                return (
                                    <Card
                                        key={activity.id}
                                        className="bg-white/95 backdrop-blur-sm border-0 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1"
                                    >
                                        <CardContent className="p-6">
                                            <div className="flex items-start gap-4">
                                                <div className="relative">
                                                    <div className="w-12 h-12 rounded-full overflow-hidden ring-2 ring-white shadow-md">
                                                        <OptimizedImage
                                                            src={activity.avatar}
                                                            alt={activity.name}
                                                            width={48}
                                                            height={48}
                                                            className="w-full h-full object-cover"
                                                        />
                                                    </div>
                                                    <div className={`absolute -bottom-1 -right-1 bg-white rounded-full p-1 shadow-md`}>
                                                        <Icon className={`w-3 h-3 ${activity.color}`} />
                                                    </div>
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-center gap-2 mb-1">
                                                        <h4 className="font-semibold text-gray-900 truncate">
                                                            {activity.name}
                                                        </h4>
                                                        <Badge variant="secondary" className="text-xs">
                                                            {activity.badge}
                                                        </Badge>
                                                    </div>
                                                    <p className="text-sm text-gray-700 mb-2">
                                                        {activity.action}
                                                    </p>
                                                    <div className="flex items-center justify-between text-xs text-gray-500">
                                                        <span>{activity.plan}</span>
                                                        <span>{activity.time}</span>
                                                    </div>
                                                </div>
                                            </div>
                                        </CardContent>
                                    </Card>
                                )
                            })}
                        </div>

                        {/* CTA para Área do Assinante */}
                        <div className="text-center mt-8">
                            <Button
                                size="lg"
                                className="bg-white text-cyan-600 hover:bg-gray-50 shadow-lg hover:shadow-xl transition-all duration-300 group"
                                asChild
                            >
                                <a href="/area-assinante">
                                    Acesse sua área do assinante
                                    <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                                </a>
                            </Button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Seção Principal com Tabs */}
            <div className="container-custom py-16">
                <Tabs defaultValue="sobre" className="w-full">
                    <TabsList className="grid w-full max-w-2xl mx-auto grid-cols-3 mb-12 h-12">
                        <TabsTrigger value="sobre" className="text-base">
                            Sobre Nós
                        </TabsTrigger>
                        <TabsTrigger value="contato" className="text-base">
                            Contato
                        </TabsTrigger>
                        <TabsTrigger value="depoimentos" className="text-base">
                            Depoimentos
                        </TabsTrigger>
                    </TabsList>

                    {/* Tab: Sobre Nós */}
                    <TabsContent value="sobre" className="mt-0">
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
                            {/* Logo e Descrição */}
                            <Card className="lg:col-span-2 border-gray-200 hover:border-cyan-300 transition-all duration-300">
                                <CardHeader>
                                    <LogoFooter className="mb-4" />
                                    <CardTitle className="text-2xl text-gray-900">
                                        Pioneiro em Assinatura de Lentes no Brasil
                                    </CardTitle>
                                    <CardDescription className="text-base text-gray-600">
                                        Assinatura de lentes de contato com acompanhamento médico especializado.
                                        Nunca mais fique sem lentes com a comodidade e segurança que você merece.
                                    </CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <div className="flex flex-wrap gap-2">
                                        <Badge variant="secondary" className="flex items-center gap-1">
                                            <CheckCircle2 className="w-3 h-3" />
                                            ANVISA Aprovado
                                        </Badge>
                                        <Badge variant="secondary" className="flex items-center gap-1">
                                            <Shield className="w-3 h-3" />
                                            LGPD Compliant
                                        </Badge>
                                        <Badge variant="secondary" className="flex items-center gap-1">
                                            <Heart className="w-3 h-3" />
                                            2.500+ Assinantes
                                        </Badge>
                                    </div>
                                </CardContent>
                            </Card>

                            {/* Responsável Técnico */}
                            <Card className="border-gray-200 hover:border-cyan-300 transition-all duration-300">
                                <CardHeader>
                                    <CardTitle className="text-lg">Responsável Técnico</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="flex items-start gap-4">
                                        <div className="w-16 h-16 rounded-full overflow-hidden border-2 border-cyan-400 shadow-md flex-shrink-0">
                                            <OptimizedImage
                                                src="/icones/drphilipe_perfil.jpeg"
                                                alt="Dr. Philipe Saraiva Cruz"
                                                width={64}
                                                height={64}
                                                quality={85}
                                                className="w-full h-full object-cover"
                                            />
                                        </div>
                                        <div>
                                            <h5 className="font-semibold text-gray-900 mb-1">
                                                {doctorInfo.name}
                                            </h5>
                                            <Badge className="mb-2 bg-cyan-500">
                                                {doctorInfo.crm}
                                            </Badge>
                                            <p className="text-sm text-gray-600 mb-1">
                                                {doctorInfo.specialty}
                                            </p>
                                            <p className="text-xs text-gray-500">
                                                {doctorInfo.experience}
                                            </p>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>

                            {/* Links Rápidos */}
                            <Card className="border-gray-200 hover:border-cyan-300 transition-all duration-300">
                                <CardHeader>
                                    <CardTitle className="text-lg">Navegação Rápida</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <nav aria-label="Links rápidos">
                                        <ul className="space-y-2">
                                            {quickLinks.slice(0, 5).map((link: { name: string; href: string; download?: boolean; icon?: string }) => (
                                                <li key={link.name}>
                                                    <a
                                                        href={link.href}
                                                        className="text-sm text-gray-600 hover:text-cyan-600 transition-colors duration-200 flex items-center group"
                                                        {...(link.download ? { download: '', target: '_blank', rel: 'noopener noreferrer' } : {})}
                                                    >
                                                        {link.icon === 'download' ? (
                                                            <Download className="w-4 h-4 mr-2 text-gray-400 group-hover:text-cyan-600 transition-colors" />
                                                        ) : (
                                                            <ArrowRight className="w-4 h-4 mr-2 text-gray-400 group-hover:text-cyan-600 transition-transform group-hover:translate-x-1" />
                                                        )}
                                                        {link.name}
                                                    </a>
                                                </li>
                                            ))}
                                        </ul>
                                    </nav>
                                </CardContent>
                            </Card>
                        </div>
                    </TabsContent>

                    {/* Tab: Contato */}
                    <TabsContent value="contato" className="mt-0">
                        <div className="max-w-4xl mx-auto">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                {/* Informações de Contato */}
                                <Card className="border-gray-200 hover:border-cyan-300 transition-all duration-300">
                                    <CardHeader>
                                        <CardTitle className="text-lg">Entre em Contato</CardTitle>
                                        <CardDescription>
                                            Estamos prontos para atendê-lo
                                        </CardDescription>
                                    </CardHeader>
                                    <CardContent className="space-y-4">
                                        <div className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors">
                                            <div className="w-10 h-10 rounded-full bg-cyan-100 flex items-center justify-center flex-shrink-0">
                                                <Phone className="w-5 h-5 text-cyan-600" />
                                            </div>
                                            <div>
                                                <p className="text-xs text-gray-500 mb-1">Telefone</p>
                                                <a
                                                    href={`tel:${clinicInfo.contact.phone}`}
                                                    className="text-sm font-medium text-gray-900 hover:text-cyan-600 transition-colors"
                                                >
                                                    {clinicInfo.contact.phone}
                                                </a>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors">
                                            <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
                                                <MessageCircle className="w-5 h-5 text-green-600" />
                                            </div>
                                            <div>
                                                <p className="text-xs text-gray-500 mb-1">WhatsApp</p>
                                                <a
                                                    href={generateWhatsAppLink()}
                                                    className="text-sm font-medium text-gray-900 hover:text-green-600 transition-colors"
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                >
                                                    (33) 99989-8026
                                                </a>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors">
                                            <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                                                <Mail className="w-5 h-5 text-blue-600" />
                                            </div>
                                            <div>
                                                <p className="text-xs text-gray-500 mb-1">E-mail</p>
                                                <a
                                                    href={`mailto:${clinicInfo.contact.email}`}
                                                    className="text-sm font-medium text-gray-900 hover:text-blue-600 transition-colors break-all"
                                                >
                                                    {clinicInfo.contact.email}
                                                </a>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>

                                {/* Localização e Horário */}
                                <Card className="border-gray-200 hover:border-cyan-300 transition-all duration-300">
                                    <CardHeader>
                                        <CardTitle className="text-lg">Localização</CardTitle>
                                        <CardDescription>
                                            Visite nossa clínica
                                        </CardDescription>
                                    </CardHeader>
                                    <CardContent className="space-y-4">
                                        <div className="flex items-start gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors">
                                            <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center flex-shrink-0">
                                                <MapPin className="w-5 h-5 text-purple-600" />
                                            </div>
                                            <address className="text-sm text-gray-600 not-italic">
                                                <p className="font-medium text-gray-900 mb-1">Endereço</p>
                                                <p>{clinicInfo.address.street}</p>
                                                <p>{clinicInfo.address.neighborhood}</p>
                                                <p>{clinicInfo.address.city}, {clinicInfo.address.state}</p>
                                                <p className="text-xs text-gray-500 mt-1">CEP: {clinicInfo.address.zipCode}</p>
                                            </address>
                                        </div>

                                        <Separator />

                                        <div className="flex items-start gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors">
                                            <div className="w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center flex-shrink-0">
                                                <Clock className="w-5 h-5 text-orange-600" />
                                            </div>
                                            <div className="text-sm text-gray-600">
                                                <p className="font-medium text-gray-900 mb-2">Horário de Atendimento</p>
                                                <p className="mb-1">{clinicInfo.businessHours.weekdays}</p>
                                                <p className="mb-2">{clinicInfo.businessHours.saturday}</p>
                                                <p className="text-xs text-gray-500 italic">
                                                    {clinicInfo.businessHours.emergency}
                                                </p>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            </div>
                        </div>
                    </TabsContent>

                    {/* Tab: Depoimentos */}
                    <TabsContent value="depoimentos" className="mt-0">
                        <div className="max-w-4xl mx-auto">
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                {testimonials.map((testimonial) => (
                                    <Card
                                        key={testimonial.id}
                                        className="border-gray-200 hover:border-cyan-300 transition-all duration-300 hover:shadow-lg"
                                    >
                                        <CardHeader>
                                            <div className="flex items-center justify-between mb-2">
                                                <CardTitle className="text-base">{testimonial.name}</CardTitle>
                                                <Badge variant="secondary" className="text-xs">
                                                    {testimonial.plan}
                                                </Badge>
                                            </div>
                                            <div className="flex items-center gap-1 mb-2">
                                                {[...Array(testimonial.rating)].map((_, i) => (
                                                    <Star key={i} className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                                                ))}
                                            </div>
                                        </CardHeader>
                                        <CardContent>
                                            <p className="text-sm text-gray-600 mb-3 italic">
                                                &ldquo;{testimonial.text}&rdquo;
                                            </p>
                                            <p className="text-xs text-gray-500">
                                                {testimonial.time}
                                            </p>
                                        </CardContent>
                                    </Card>
                                ))}
                            </div>

                            {/* CTA Depoimentos */}
                            <div className="text-center mt-8">
                                <p className="text-gray-600 mb-4">
                                    Compartilhe sua experiência com a comunidade SV Lentes
                                </p>
                                <Button variant="outline" className="group">
                                    Deixe seu depoimento
                                    <Heart className="w-4 h-4 ml-2 group-hover:text-red-500 transition-colors" />
                                </Button>
                            </div>
                        </div>
                    </TabsContent>
                </Tabs>
            </div>

            <Separator className="container-custom" />

            {/* Seção de Cobertura */}
            <div className="bg-gradient-to-r from-cyan-500 via-blue-500 to-purple-500 py-8">
                <div className="container-custom">
                    <div className="flex flex-col md:flex-row items-center justify-center gap-6 text-white">
                        <div className="flex items-center gap-3 group hover:scale-105 transition-transform duration-300">
                            <div className="w-12 h-12 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
                                <Shield className="w-6 h-6" />
                            </div>
                            <div>
                                <p className="font-semibold">{clinicInfo.coverage.area}</p>
                                <p className="text-sm text-white/80">Atendimento Regional</p>
                            </div>
                        </div>

                        <Separator orientation="vertical" className="h-12 bg-white/30 hidden md:block" />

                        <div className="flex items-center gap-3 group hover:scale-105 transition-transform duration-300">
                            <div className="w-12 h-12 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
                                <Package className="w-6 h-6" />
                            </div>
                            <div>
                                <p className="font-semibold">{clinicInfo.coverage.shipping}</p>
                                <p className="text-sm text-white/80">Entrega Garantida</p>
                            </div>
                        </div>

                        <Separator orientation="vertical" className="h-12 bg-white/30 hidden md:block" />

                        <div className="flex items-center gap-3 group hover:scale-105 transition-transform duration-300">
                            <div className="w-12 h-12 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
                                <CheckCircle2 className="w-6 h-6" />
                            </div>
                            <div>
                                <p className="font-semibold">Satisfação Garantida</p>
                                <p className="text-sm text-white/80">98% de aprovação</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <Separator className="container-custom" />

            {/* Rodapé Inferior */}
            <div className="bg-gray-50 py-12 border-t border-gray-200">
                <div className="container-custom">
                    {/* Links Legais */}
                    <div className="flex flex-wrap items-center justify-center gap-4 mb-8">
                        {legalLinks.map((link: { name: string; href?: string; action?: () => void }) => (
                            link.href ? (
                                <a
                                    key={link.name}
                                    href={link.href}
                                    className="text-sm text-gray-600 hover:text-cyan-600 transition-colors duration-200 flex items-center gap-2 group"
                                >
                                    <FileText className="w-4 h-4 group-hover:text-cyan-600 transition-colors" />
                                    <span>{link.name}</span>
                                </a>
                            ) : (
                                <button
                                    key={link.name}
                                    onClick={link.action}
                                    className="text-sm text-gray-600 hover:text-cyan-600 transition-colors duration-200 flex items-center gap-2 group"
                                >
                                    {link.name.includes('Configurações') ? (
                                        <Settings className="w-4 h-4 group-hover:text-cyan-600 transition-colors" />
                                    ) : (
                                        <FileText className="w-4 h-4 group-hover:text-cyan-600 transition-colors" />
                                    )}
                                    <span>{link.name}</span>
                                </button>
                            )
                        ))}
                    </div>

                    <Separator className="mb-8" />

                    {/* Indicadores de Confiança */}
                    <div className="flex flex-wrap items-center justify-center gap-8 mb-8">
                        <div className="flex items-center gap-2 group hover:scale-105 transition-transform duration-300">
                            <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                            <span className="text-sm text-gray-600 group-hover:text-green-600 transition-colors">
                                Site Seguro SSL
                            </span>
                        </div>
                        <div className="flex items-center gap-2 group hover:scale-105 transition-transform duration-300">
                            <div className="w-3 h-3 bg-blue-500 rounded-full animate-pulse"></div>
                            <span className="text-sm text-gray-600 group-hover:text-blue-600 transition-colors">
                                Conformidade LGPD
                            </span>
                        </div>
                        <div className="flex items-center gap-2 group hover:scale-105 transition-transform duration-300">
                            <div className="w-3 h-3 bg-purple-500 rounded-full animate-pulse"></div>
                            <span className="text-sm text-gray-600 group-hover:text-purple-600 transition-colors">
                                Produtos ANVISA
                            </span>
                        </div>
                    </div>

                    <Separator className="mb-8" />

                    {/* Redes Sociais */}
                    <div className="flex items-center justify-center gap-4 mb-8">
                        <p className="text-sm text-gray-600 mr-2">Siga-nos:</p>
                        <a
                            href="#"
                            className="w-10 h-10 rounded-full bg-gray-200 hover:bg-blue-600 flex items-center justify-center transition-all duration-300 group"
                            aria-label="Facebook"
                        >
                            <Facebook className="w-5 h-5 text-gray-600 group-hover:text-white transition-colors" />
                        </a>
                        <a
                            href="#"
                            className="w-10 h-10 rounded-full bg-gray-200 hover:bg-pink-600 flex items-center justify-center transition-all duration-300 group"
                            aria-label="Instagram"
                        >
                            <Instagram className="w-5 h-5 text-gray-600 group-hover:text-white transition-colors" />
                        </a>
                        <a
                            href="#"
                            className="w-10 h-10 rounded-full bg-gray-200 hover:bg-blue-400 flex items-center justify-center transition-all duration-300 group"
                            aria-label="Twitter"
                        >
                            <Twitter className="w-5 h-5 text-gray-600 group-hover:text-white transition-colors" />
                        </a>
                    </div>

                    <Separator className="mb-8" />

                    {/* Copyright */}
                    <div className="text-center space-y-3">
                        <p className="text-gray-700 font-medium">
                            © {currentYear} SV Lentes. Todos os direitos reservados.
                        </p>
                        <div className="flex flex-wrap items-center justify-center gap-3 text-sm text-gray-600">
                            <span className="flex items-center gap-2">
                                <FileText className="w-4 h-4" />
                                CNPJ: {clinicInfo.cnpj}
                            </span>
                            <span>•</span>
                            <span className="flex items-center gap-2">
                                <Shield className="w-4 h-4" />
                                Responsável Técnico: {doctorInfo.crm}
                            </span>
                        </div>
                        <p className="text-xs text-gray-500 max-w-2xl mx-auto mt-4">
                            SV Lentes é um serviço de assinatura de lentes de contato com acompanhamento
                            oftalmológico especializado. Todos os produtos são aprovados pela ANVISA e
                            o serviço está em conformidade com as regulamentações do CFM e LGPD.
                        </p>
                    </div>
                </div>
            </div>

            {/* Modais de Privacidade */}
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
