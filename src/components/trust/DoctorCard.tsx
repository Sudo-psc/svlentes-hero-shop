'use client'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { OptimizedImage } from '@/components/ui/OptimizedImage'
import { doctorInfo } from '@/data/doctor-info'
import { socialProofStats } from '@/data/trust-indicators'
import { openWhatsAppWithContext } from '@/lib/whatsapp'
import {
    User,
    Award,
    GraduationCap,
    Heart,
    Star,
    Users,
    Clock,
    MessageCircle,
    Phone,
    Quote,
    ExternalLink
} from 'lucide-react'
interface DoctorCardProps {
    variant?: 'hero' | 'full' | 'compact' | 'prominent'
    showCTA?: boolean
    className?: string
}
export function DoctorCard({
    variant = 'hero',
    showCTA = true,
    className = ''
}: DoctorCardProps) {
    const handleConsultation = () => {
        openWhatsAppWithContext('consultation', {
            page: 'landing-page',
            section: 'doctor-card',
            userInfo: {
                nome: 'Interessado via Doctor Card'
            }
        })
    }
    const handleWhatsApp = () => {
        openWhatsAppWithContext('hero', {
            page: 'landing-page',
            section: 'doctor-card-whatsapp'
        })
    }
    if (variant === 'compact') {
        return (
            <div className={`bg-white rounded-lg shadow-md border border-gray-100 p-4 ${className}`}>
                <div className="flex items-center space-x-3">
                    {/* Doctor Avatar */}
                    <div className="w-12 h-12 rounded-full overflow-hidden flex-shrink-0">
                        <OptimizedImage
                            src={doctorInfo.photo}
                            alt={`Foto do ${doctorInfo.name}`}
                            width={48}
                            height={48}
                            quality={85}
                            className="w-full h-full object-cover"
                        />
                    </div>
                    {/* Doctor Info */}
                    <div className="flex-1 min-w-0">
                        <h4 className="font-semibold text-gray-900 truncate">
                            {doctorInfo.name}
                        </h4>
                        <p className="text-sm text-primary-600">{doctorInfo.crm}</p>
                    </div>
                    {/* Quick CTA */}
                    {showCTA && (
                        <Button
                            onClick={handleWhatsApp}
                            size="sm"
                            variant="outline"
                            className="flex-shrink-0"
                        >
                            <MessageCircle className="w-4 h-4" />
                        </Button>
                    )}
                </div>
            </div>
        )
    }
    if (variant === 'full') {
        return (
            <div className={`bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden ${className}`}>
                {/* Header with gradient */}
                <div className="bg-gradient-to-r from-primary-600 to-secondary-600 p-6 text-white">
                    <div className="flex items-center space-x-4">
                        {/* Doctor Photo */}
                        <div className="w-20 h-20 rounded-full overflow-hidden border-2 border-white/20">
                            <OptimizedImage
                                src={doctorInfo.photo}
                                alt={`Foto do ${doctorInfo.name}`}
                                width={80}
                                height={80}
                                quality={85}
                                className="w-full h-full object-cover"
                            />
                        </div>
                        <div className="flex-1">
                            <h3 className="text-2xl font-bold">{doctorInfo.name}</h3>
                            <p className="text-primary-100 font-medium">{doctorInfo.crm} | {doctorInfo.specialty}</p>
                            <p className="text-primary-200 text-sm mt-1">{doctorInfo.experience}</p>
                        </div>
                    </div>
                </div>
                {/* Content */}
                <div className="p-6 space-y-6">
                    {/* Bio */}
                    <div>
                        <p className="text-gray-600 leading-relaxed">{doctorInfo.bio}</p>
                    </div>
                    {/* Credentials */}
                    <div>
                        <h4 className="font-semibold text-gray-900 mb-3 flex items-center">
                            <GraduationCap className="w-5 h-5 mr-2 text-primary-600" />
                            Formação e Especialização
                        </h4>
                        <div className="space-y-2">
                            {doctorInfo.credentials.map((credential, index) => (
                                <div key={index} className="flex items-center space-x-2 text-sm text-gray-600">
                                    <Award className="w-4 h-4 text-secondary-500" />
                                    <span>{credential}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                    {/* Social Proof */}
                    <div>
                        <h4 className="font-semibold text-gray-900 mb-3 flex items-center">
                            <Star className="w-5 h-5 mr-2 text-primary-600" />
                            Números que Comprovam
                        </h4>
                        <div className="grid grid-cols-2 gap-4">
                            {socialProofStats.map((stat) => (
                                <div key={stat.id} className="text-center p-3 bg-gray-50 rounded-lg">
                                    <div className="text-2xl font-bold text-primary-600">{stat.value}</div>
                                    <div className="text-sm text-gray-600">{stat.label}</div>
                                </div>
                            ))}
                        </div>
                    </div>
                    {/* CTAs */}
                    {showCTA && (
                        <div className="space-y-3 pt-4 border-t border-gray-200">
                            <Button
                                onClick={handleConsultation}
                                className="w-full flex items-center justify-center space-x-2"
                            >
                                <Phone className="w-4 h-4" />
                                <span>Agendar consulta com oftalmologista</span>
                            </Button>
                            <Button
                                onClick={handleWhatsApp}
                                variant="outline"
                                className="w-full flex items-center justify-center space-x-2"
                            >
                                <MessageCircle className="w-4 h-4" />
                                <span>Tirar dúvidas no WhatsApp</span>
                            </Button>
                        </div>
                    )}
                </div>
            </div>
        )
    }

    if (variant === 'prominent') {
        return (
            <div className={`bg-gradient-to-br from-white via-primary-50/30 to-secondary-50/30 rounded-3xl shadow-2xl border-2 border-primary-200/50 overflow-hidden ${className}`}>
                {/* Decorative header bar */}
                <div className="h-2 bg-gradient-to-r from-primary-500 via-primary-600 to-secondary-500"></div>
                
                <div className="p-8 lg:p-12">
                    <div className="flex flex-col lg:flex-row gap-8 items-start">
                        {/* Left: Doctor Photo and Basic Info */}
                        <div className="flex-shrink-0 text-center lg:text-left">
                            <div className="relative inline-block">
                                <div className="w-32 h-32 lg:w-40 lg:h-40 rounded-full overflow-hidden border-4 border-white shadow-xl ring-4 ring-primary-100/50">
                                    <OptimizedImage
                                        src={doctorInfo.photo}
                                        alt={`Foto do ${doctorInfo.name}`}
                                        width={160}
                                        height={160}
                                        quality={90}
                                        priority={true}
                                        className="w-full h-full object-cover"
                                    />
                                </div>
                                {/* Verification Badge */}
                                <div className="absolute -bottom-2 -right-2 w-12 h-12 bg-gradient-to-br from-green-400 to-emerald-500 rounded-full flex items-center justify-center border-4 border-white shadow-lg shadow-green-500/50">
                                    <Award className="w-6 h-6 text-white drop-shadow-sm" />
                                </div>
                            </div>
                        </div>

                        {/* Right: Info, Quote and CTA */}
                        <div className="flex-1 space-y-6">
                            {/* Header */}
                            <div>
                                <div className="flex items-center gap-2 mb-2">
                                    <h2 className="text-2xl lg:text-3xl font-bold text-gray-900">
                                        {doctorInfo.name}
                                    </h2>
                                    <Badge variant="default" className="bg-primary-600 text-white">
                                        Responsável Técnico
                                    </Badge>
                                </div>
                                <p className="text-primary-700 font-semibold text-lg">
                                    {doctorInfo.crm} | {doctorInfo.specialty}
                                </p>
                                <p className="text-gray-600 mt-1">{doctorInfo.experience}</p>
                            </div>

                            {/* Professional Quote */}
                            {doctorInfo.quote && (
                                <div className="relative bg-white/80 rounded-2xl p-6 shadow-lg border border-primary-100">
                                    <Quote className="absolute top-4 left-4 w-8 h-8 text-primary-200" aria-hidden="true" />
                                    <blockquote className="relative pl-8">
                                        <p className="text-gray-700 italic leading-relaxed text-base lg:text-lg">
                                            "{doctorInfo.quote}"
                                        </p>
                                        <cite className="block mt-3 text-sm font-semibold text-primary-700 not-italic">
                                            — {doctorInfo.name}
                                        </cite>
                                    </blockquote>
                                </div>
                            )}

                            {/* Key Credentials */}
                            <div className="flex flex-wrap gap-2">
                                <Badge variant="secondary" className="bg-success-50 text-success-700 border-success-200">
                                    <Heart className="w-3 h-3 mr-1" />
                                    Membro SBO
                                </Badge>
                                <Badge variant="secondary" className="bg-primary-50 text-primary-700 border-primary-200">
                                    <GraduationCap className="w-3 h-3 mr-1" />
                                    Especialista
                                </Badge>
                                <Badge variant="secondary" className="bg-secondary-50 text-secondary-700 border-secondary-200">
                                    <Users className="w-3 h-3 mr-1" />
                                    5000+ pacientes
                                </Badge>
                            </div>

                            {/* CTAs */}
                            <div className="flex flex-col sm:flex-row gap-3 pt-2">
                                {showCTA && (
                                    <>
                                        <Button
                                            onClick={handleConsultation}
                                            size="lg"
                                            className="flex items-center justify-center gap-2"
                                        >
                                            <Phone className="w-4 h-4" />
                                            <span>Agendar Consulta</span>
                                        </Button>
                                        <Button
                                            onClick={handleWhatsApp}
                                            variant="outline"
                                            size="lg"
                                            className="flex items-center justify-center gap-2"
                                        >
                                            <MessageCircle className="w-4 h-4" />
                                            <span>Tirar Dúvidas</span>
                                        </Button>
                                    </>
                                )}
                                {doctorInfo.curriculumUrl && (
                                    <Button
                                        variant="ghost"
                                        size="lg"
                                        className="flex items-center justify-center gap-2 text-primary-700 hover:text-primary-800"
                                        onClick={() => window.location.href = doctorInfo.curriculumUrl}
                                    >
                                        <ExternalLink className="w-4 h-4" />
                                        <span>Ver Currículo Completo</span>
                                    </Button>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        )
    }
    
    // Default: hero variant
    return (
        <div className={`bg-white/95 backdrop-blur-md rounded-3xl shadow-glass-lg border border-white/30 p-6 transform hover:scale-105 hover:shadow-glass-lg transition-all duration-300 ${className}`}>
            <div className="text-center space-y-4">
                {/* Doctor Photo */}
                <div className="relative">
                    <div className="w-24 h-24 mx-auto rounded-full overflow-hidden border-4 border-primary-100/50 shadow-lg">
                        <OptimizedImage
                            src={doctorInfo.photo}
                            alt={`Foto do ${doctorInfo.name}`}
                            width={96}
                            height={96}
                            quality={85}
                            priority={false}
                            className="w-full h-full object-cover"
                        />
                    </div>
                    {/* Verification Badge */}
                    <div className="absolute -bottom-1 -right-1 w-10 h-10 bg-gradient-to-br from-green-400 to-emerald-500 rounded-full flex items-center justify-center border-3 border-white shadow-lg shadow-green-500/50 animate-pulse">
                        <Award className="w-5 h-5 text-white drop-shadow-sm" />
                    </div>
                </div>
                {/* Doctor Info */}
                <div>
                    <h3 className="text-xl font-bold text-gray-900">
                        {doctorInfo.name}
                    </h3>
                    <p className="text-primary-600 font-medium">
                        {doctorInfo.crm} | {doctorInfo.specialty}
                    </p>
                    <p className="text-sm text-gray-600 mt-1">
                        {doctorInfo.experience}
                    </p>
                </div>
                {/* Key Credentials */}
                <div className="space-y-2">
                    <div className="flex flex-wrap justify-center gap-2">
                        <Badge variant="default" className="bg-success-50 text-success-700 border-success-200 text-xs">
                            <Heart className="w-3 h-3 mr-1" />
                            SBO
                        </Badge>
                        <Badge variant="secondary" className="text-xs">
                            <GraduationCap className="w-3 h-3 mr-1" />
                            Especialista
                        </Badge>
                        <Badge variant="default" className="text-xs">
                            <Users className="w-3 h-3 mr-1" />
                            5000+ pacientes
                        </Badge>
                    </div>
                </div>
                {/* CTA */}
                {showCTA && (
                    <div className="space-y-2">
                        <Button
                            onClick={handleConsultation}
                            size="sm"
                            className="w-full flex items-center justify-center space-x-2"
                        >
                            <Phone className="w-4 h-4" />
                            <span>Agendar consulta com oftalmologista</span>
                        </Button>
                        <p className="text-xs text-gray-500">
                            ✓ Primeira consulta sem compromisso
                        </p>
                    </div>
                )}
            </div>
        </div>
    )
}