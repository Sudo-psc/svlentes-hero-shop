'use client'
import { useState, useEffect } from 'react'
import { MessageCircle, X, Clock, CheckCircle } from 'lucide-react'
import { openWhatsAppWithContext, getAttendanceStatus, isBusinessHours } from '@/lib/whatsapp'
import { cn } from '@/lib/utils'
interface WhatsAppFloatProps {
    className?: string
}
export function WhatsAppFloat({ className }: WhatsAppFloatProps) {
    const [isOpen, setIsOpen] = useState(false)
    const [attendanceStatus, setAttendanceStatus] = useState(getAttendanceStatus())
    const [showNotification, setShowNotification] = useState(false)
    // Atualizar status de atendimento a cada minuto
    useEffect(() => {
        const interval = setInterval(() => {
            setAttendanceStatus(getAttendanceStatus())
        }, 60000) // 1 minuto
        return () => clearInterval(interval)
    }, [])
    // Mostrar notificação após alguns segundos na página
    useEffect(() => {
        const timer = setTimeout(() => {
            if (!isOpen && isBusinessHours()) {
                setShowNotification(true)
                // Esconder notificação após 5 segundos
                setTimeout(() => setShowNotification(false), 5000)
            }
        }, 10000) // 10 segundos
        return () => clearTimeout(timer)
    }, [isOpen])
    const quickActions = [
        {
            id: 'consultation',
            title: 'Agendar Consulta',
            description: 'Consulta com Dr. Philipe',
            icon: '👨‍⚕️',
            context: 'consultation' as const
        },
        {
            id: 'pricing',
            title: 'Ver Planos',
            description: 'Informações sobre preços',
            icon: '💰',
            context: 'pricing' as const
        },
        {
            id: 'support',
            title: 'Suporte',
            description: 'Ajuda e dúvidas',
            icon: '🆘',
            context: 'support' as const
        },
        {
            id: 'emergency',
            title: 'Emergência',
            description: 'Problema com lentes',
            icon: '🚨',
            context: 'emergency' as const
        }
    ]
    const handleQuickAction = (context: 'consultation' | 'pricing' | 'support' | 'emergency') => {
        openWhatsAppWithContext(context, {
            page: 'landing-page',
            section: 'whatsapp-float'
        })
        setIsOpen(false)
        setShowNotification(false)
    }
    const handleDirectContact = () => {
        openWhatsAppWithContext('hero', {
            page: 'landing-page',
            section: 'whatsapp-float-direct'
        })
        setIsOpen(false)
        setShowNotification(false)
    }
    return (
        <>
            {/* Notification Bubble */}
            {showNotification && !isOpen && (
                <div className="fixed bottom-24 right-6 z-40 animate-slide-up">
                    <div className="bg-white rounded-lg shadow-lg border border-gray-200 p-4 max-w-xs">
                        <div className="flex items-start space-x-3">
                            <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center flex-shrink-0">
                                <MessageCircle className="w-4 h-4 text-white" />
                            </div>
                            <div className="flex-1">
                                <p className="text-sm font-medium text-gray-900">
                                    Olá! 👋
                                </p>
                                <p className="text-xs text-gray-600 mt-1">
                                    Precisa de ajuda? Estamos online para atendê-lo!
                                </p>
                            </div>
                            <button
                                onClick={() => setShowNotification(false)}
                                className="text-gray-400 hover:text-gray-600"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        </div>
                    </div>
                </div>
            )}
            {/* Quick Actions Menu */}
            {isOpen && (
                <div className="fixed bottom-24 right-6 z-40 animate-slide-up">
                    <div className="bg-white rounded-lg shadow-xl border border-gray-200 w-80 max-w-[calc(100vw-3rem)]">
                        {/* Header */}
                        <div className="p-4 border-b border-gray-200">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center space-x-3">
                                    <div className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center">
                                        <MessageCircle className="w-5 h-5 text-white" />
                                    </div>
                                    <div>
                                        <h3 className="font-semibold text-gray-900">SV Lentes</h3>
                                        <div className="flex items-center space-x-1">
                                            {attendanceStatus.isOpen ? (
                                                <CheckCircle className="w-3 h-3 text-green-500" />
                                            ) : (
                                                <Clock className="w-3 h-3 text-gray-400" />
                                            )}
                                            <span className="text-xs text-gray-600">
                                                {attendanceStatus.message}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                                <button
                                    onClick={() => setIsOpen(false)}
                                    className="text-gray-400 hover:text-gray-600 p-1"
                                >
                                    <X className="w-5 h-5" />
                                </button>
                            </div>
                        </div>
                        {/* Quick Actions */}
                        <div className="p-4">
                            <p className="text-sm text-gray-600 mb-4">
                                Como podemos ajudar você hoje?
                            </p>
                            <div className="space-y-2">
                                {quickActions.map((action) => (
                                    <button
                                        key={action.id}
                                        onClick={() => handleQuickAction(action.context)}
                                        className="w-full flex items-center space-x-3 p-3 rounded-lg hover:bg-gray-50 transition-colors text-left"
                                    >
                                        <span className="text-xl">{action.icon}</span>
                                        <div className="flex-1">
                                            <p className="font-medium text-gray-900 text-sm">
                                                {action.title}
                                            </p>
                                            <p className="text-xs text-gray-600">
                                                {action.description}
                                            </p>
                                        </div>
                                    </button>
                                ))}
                            </div>
                            {/* Direct Contact Button */}
                            <button
                                onClick={handleDirectContact}
                                className="w-full mt-4 bg-green-500 hover:bg-green-600 text-white font-medium py-3 px-4 rounded-lg transition-colors flex items-center justify-center space-x-2"
                            >
                                <MessageCircle className="w-4 h-4" />
                                <span>Falar no WhatsApp</span>
                            </button>
                        </div>
                    </div>
                </div>
            )}
            {/* Floating Button */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className={cn(
                    'fixed bottom-6 right-6 z-50 bg-green-500 hover:bg-green-600 text-white rounded-full shadow-lg hover:shadow-xl transition-all duration-300 flex items-center justify-center group px-4 py-3 min-w-[160px] md:min-w-[180px]',
                    isOpen && 'bg-gray-500 hover:bg-gray-600',
                    className
                )}
                aria-label={isOpen ? 'Fechar WhatsApp' : 'Falar no WhatsApp'}
            >
                {isOpen ? (
                    <X className="w-6 h-6" />
                ) : (
                    <>
                        <MessageCircle className="w-4 h-4 md:w-5 md:h-5 flex-shrink-0" />
                        <span className="ml-2 text-xs md:text-sm font-medium whitespace-nowrap">
                            <span className="hidden md:inline">
                                Falar no WhatsApp
                            </span>
                            <span className="md:hidden">
                                WhatsApp
                            </span>
                        </span>
                        {/* Pulse animation when online */}
                        {attendanceStatus.isOpen && (
                            <span className="absolute -top-1 -right-1 w-3 h-3 md:w-4 md:h-4 bg-green-400 rounded-full animate-pulse-slow"></span>
                        )}
                        {/* Notification badge */}
                        {showNotification && (
                            <span className="absolute -top-1 -right-1 w-3 h-3 md:w-4 md:h-4 bg-red-500 rounded-full flex items-center justify-center">
                                <span className="w-1.5 h-1.5 md:w-2 md:h-2 bg-white rounded-full"></span>
                            </span>
                        )}
                    </>
                )}
            </button>
        </>
    )
}