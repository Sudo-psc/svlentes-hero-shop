'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { Button } from '@/components/ui/Button'
import { LogoHeader } from '@/components/ui/Logo'
import { scrollToSection, generateWhatsAppLink } from '@/lib/utils'
import { Menu, X, Phone, User, LayoutDashboard, LogOut } from 'lucide-react'

interface HeaderProps {
    className?: string
}

export function Header({ className }: HeaderProps) {
    const { user, loading, signOut } = useAuth()
    const [isMenuOpen, setIsMenuOpen] = useState(false)
    const [isScrolled, setIsScrolled] = useState(false)

    // Detectar scroll para adicionar sombra no header
    useEffect(() => {
        const handleScroll = () => {
            setIsScrolled(window.scrollY > 10)
        }

        window.addEventListener('scroll', handleScroll)
        return () => window.removeEventListener('scroll', handleScroll)
    }, [])

    // Fechar menu mobile ao redimensionar
    useEffect(() => {
        const handleResize = () => {
            if (window.innerWidth >= 768) {
                setIsMenuOpen(false)
            }
        }

        window.addEventListener('resize', handleResize)
        return () => window.removeEventListener('resize', handleResize)
    }, [])

    const navigation = [
        { name: 'Calculadora', href: '/calculadora', isAnchor: false },
        { name: 'Planos', href: 'https://svlentes.com.br/planos', isAnchor: false },
        { name: 'Como Funciona', href: '/como-funciona', isAnchor: false },
        { name: 'Blog', href: '/blog', isAnchor: false },
        { name: 'FAQ', href: '#perguntas-frequentes', isAnchor: true },
        { name: 'Contato', href: '#contato', isAnchor: true },
    ]

    const handleNavClick = (href: string) => {
        const sectionId = href.replace('#', '')
        scrollToSection(sectionId)
        setIsMenuOpen(false)
    }

    const handleAgendarConsulta = () => {
        const whatsappMessage = `Olá! Gostaria de agendar uma consulta com o Dr. Philipe Saraiva Cruz para avaliar minha necessidade de lentes de contato.

Vim através do site SV Lentes e tenho interesse no serviço de assinatura com acompanhamento médico.`

        const whatsappLink = generateWhatsAppLink(
            process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || '5511947038078',
            whatsappMessage
        )

        window.open(whatsappLink, '_blank')
    }

    const handleLogin = () => {
        window.location.href = '/area-assinante/login'
    }

    const handleLogout = async () => {
        await signOut()
        window.location.href = '/'
    }

    return (
        <header
            className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${isScrolled
                    ? 'bg-white/95 backdrop-blur-md shadow-lg border-b border-gray-200/50'
                    : 'bg-white shadow-sm'
                } ${className}`}
        >
            <div className="container-custom">
                <div className="flex items-center justify-between h-16 lg:h-20">
                    {/* Logo */}
                    <a
                        href="/"
                        className="hover:opacity-90 transition-opacity"
                        aria-label="SV Lentes - Voltar para a página inicial"
                    >
                        <LogoHeader />
                    </a>

                    {/* Navigation Desktop */}
                    <nav className="hidden md:flex items-center space-x-8">
                        {navigation.map((item) => (
                            item.name === 'Calculadora' ? (
                                <a
                                    key={item.name}
                                    href={item.href}
                                    className="inline-flex items-center space-x-1 bg-gradient-to-r from-primary-600 to-cyan-600 text-white px-3 py-1.5 rounded-full font-semibold text-sm hover:from-primary-700 hover:to-cyan-700 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105"
                                >
                                    <span>💰</span>
                                    <span>{item.name}</span>
                                </a>
                            ) : item.isAnchor ? (
                                <a
                                    key={item.name}
                                    href={item.href}
                                    onClick={(e) => {
                                        e.preventDefault()
                                        handleNavClick(item.href)
                                    }}
                                    className="text-gray-700 hover:text-primary-600 font-medium transition-colors duration-200 relative group"
                                >
                                    {item.name}
                                    <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-primary-600 transition-all duration-200 group-hover:w-full"></span>
                                </a>
                            ) : (
                                <a
                                    key={item.name}
                                    href={item.href}
                                    className="text-gray-700 hover:text-primary-600 font-medium transition-colors duration-200 relative group"
                                >
                                    {item.name}
                                    <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-primary-600 transition-all duration-200 group-hover:w-full"></span>
                                </a>
                            )
                        ))}
                    </nav>

                    {/* CTA Button Desktop */}
                    <div className="hidden md:flex items-center space-x-4">
                        {user ? (
                            <>
                                <Button
                                    onClick={() => window.location.href = '/area-assinante/dashboard'}
                                    variant="outline"
                                    className="flex items-center space-x-2 border-cyan-600 text-cyan-600 hover:bg-cyan-50"
                                    size="default"
                                >
                                    <LayoutDashboard className="w-4 h-4" />
                                    <span>Meu Painel</span>
                                </Button>
                                <Button
                                    onClick={handleLogout}
                                    variant="ghost"
                                    className="flex items-center space-x-2 text-gray-600 hover:text-gray-800"
                                    size="default"
                                >
                                    <LogOut className="w-4 h-4" />
                                    <span>Sair</span>
                                </Button>
                            </>
                        ) : (
                            <>
                                <Button
                                    onClick={handleAgendarConsulta}
                                    className="flex items-center space-x-2 bg-cyan-600 hover:bg-cyan-700"
                                    size="default"
                                >
                                    <Phone className="w-4 h-4" />
                                    <span>Agendar Consulta</span>
                                </Button>
                                <Button
                                    onClick={handleLogin}
                                    variant="outline"
                                    className="flex items-center space-x-2 border-cyan-600 text-cyan-600 hover:bg-cyan-50"
                                    size="default"
                                >
                                    <User className="w-4 h-4" />
                                    <span>Área do Assinante</span>
                                </Button>
                            </>
                        )}
                    </div>

                    {/* Mobile Menu Button */}
                    <div className="md:hidden flex items-center space-x-3">
                        {/* CRM Badge Mobile */}
                        <div className="bg-gradient-to-r from-cyan-50 to-blue-50 border border-cyan-200 rounded-lg px-2 py-1 shadow-sm">
                            <div className="flex items-center space-x-1">
                                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                                <span className="text-xs font-semibold text-cyan-700">
                                    CRM-MG 69.870
                                </span>
                            </div>
                        </div>

                        <button
                            onClick={() => setIsMenuOpen(!isMenuOpen)}
                            className="p-2 rounded-lg text-gray-700 hover:bg-gray-100 transition-colors"
                            aria-label="Toggle menu"
                        >
                            {isMenuOpen ? (
                                <X className="w-6 h-6" />
                            ) : (
                                <Menu className="w-6 h-6" />
                            )}
                        </button>
                    </div>
                </div>

                {/* Mobile Menu */}
                {isMenuOpen && (
                    <div className="md:hidden border-t border-gray-200 bg-white">
                        <div className="py-4 space-y-4">
                            {navigation.map((item) => (
                                item.name === 'Calculadora' ? (
                                    <a
                                        key={item.name}
                                        href={item.href}
                                        className="block mx-4 mb-3 inline-flex items-center space-x-2 bg-gradient-to-r from-primary-600 to-cyan-600 text-white px-4 py-2.5 rounded-full font-bold text-sm shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200 border-2 border-primary-300"
                                    >
                                        <span className="text-base">💰</span>
                                        <span>{item.name}</span>
                                        <span className="bg-white/20 px-1.5 py-0.5 rounded-full text-xs font-bold">GRÁTIS</span>
                                    </a>
                                ) : item.isAnchor ? (
                                    <a
                                        key={item.name}
                                        href={item.href}
                                        onClick={(e) => {
                                            e.preventDefault()
                                            handleNavClick(item.href)
                                        }}
                                        className="block px-4 py-2 text-gray-700 hover:text-primary-600 hover:bg-gray-50 font-medium transition-colors duration-200"
                                    >
                                        {item.name}
                                    </a>
                                ) : (
                                    <a
                                        key={item.name}
                                        href={item.href}
                                        className="block px-4 py-2 text-gray-700 hover:text-primary-600 hover:bg-gray-50 font-medium transition-colors duration-200"
                                    >
                                        {item.name}
                                    </a>
                                )
                            ))}

                            {/* Mobile CTA */}
                            <div className="px-4 pt-4 border-t border-gray-200 space-y-3">
                                {user ? (
                                    <>
                                        <Button
                                            onClick={() => window.location.href = '/area-assinante/dashboard'}
                                            variant="outline"
                                            className="w-full flex items-center justify-center space-x-2 border-cyan-600 text-cyan-600 hover:bg-cyan-50"
                                            size="default"
                                        >
                                            <LayoutDashboard className="w-4 h-4" />
                                            <span>Meu Painel</span>
                                        </Button>
                                        <Button
                                            onClick={handleLogout}
                                            variant="ghost"
                                            className="w-full flex items-center justify-center space-x-2 text-gray-600 hover:text-gray-800"
                                            size="default"
                                        >
                                            <LogOut className="w-4 h-4" />
                                            <span>Sair</span>
                                        </Button>
                                    </>
                                ) : (
                                    <>
                                        <Button
                                            onClick={handleAgendarConsulta}
                                            className="w-full flex items-center justify-center space-x-2 bg-cyan-600 hover:bg-cyan-700"
                                            size="default"
                                        >
                                            <Phone className="w-4 h-4" />
                                            <span>Agendar Consulta</span>
                                        </Button>
                                        <Button
                                            onClick={handleLogin}
                                            variant="outline"
                                            className="w-full flex items-center justify-center space-x-2 border-cyan-600 text-cyan-600 hover:bg-cyan-50"
                                            size="default"
                                        >
                                            <User className="w-4 h-4" />
                                            <span>Área do Assinante</span>
                                        </Button>
                                    </>
                                )}
                            </div>
                        </div>
                    </div>
                )}
            </div>

            </header>
    )
}
