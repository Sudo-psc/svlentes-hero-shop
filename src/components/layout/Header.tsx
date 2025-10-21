'use client'

import { useState, useEffect, useMemo, useCallback } from 'react'
import Link from 'next/link'
import { useAuth } from '@/contexts/AuthContext'
import { Button } from '@/components/ui/Button'
import { LogoHeader } from '@/components/ui/Logo'
import { scrollToSection, generateWhatsAppLink } from '@/lib/utils'
import { Menu, X, Phone, User, LayoutDashboard, LogOut } from 'lucide-react'

interface HeaderProps {
    className?: string
}

interface NavigationItem {
    name: string
    href: string
    isAnchor?: boolean
}

export function Header({ className }: HeaderProps) {
    const { user, signOut } = useAuth()
    const [isMenuOpen, setIsMenuOpen] = useState(false)
    const [isScrolled, setIsScrolled] = useState(false)

    // FIXME: Configuração centralizada desabilitada temporariamente
    // ConfigService requer acesso a fs (Node.js) que não funciona no client
    // TODO: Implementar servidor de config ou passar como props de server component
    const useCentralizedConfig = false
    const headerMenu = null

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

    const navigation = useMemo<NavigationItem[]>(() => {
        if (useCentralizedConfig && headerMenu) {
            return headerMenu.main.map((item: any) => ({
                name: item.label,
                href: item.href,
                isAnchor: item.isAnchor || false,
            }))
        }

        return [
            { name: 'Calculadora', href: '/calculadora', isAnchor: false },
            { name: 'Planos', href: 'https://svlentes.com.br/planos', isAnchor: false },
            { name: 'Como Funciona', href: '/como-funciona', isAnchor: false },
            { name: 'Blog', href: '/blog', isAnchor: false },
            { name: 'FAQ', href: '#perguntas-frequentes', isAnchor: true },
            { name: 'Contato', href: '#contato', isAnchor: true },
        ]
    }, [headerMenu, useCentralizedConfig])

    const ctaConfig = useMemo(
        () => (useCentralizedConfig && headerMenu ? headerMenu.cta : null),
        [headerMenu, useCentralizedConfig]
    )

    const handleNavClick = useCallback((href: string) => {
        const sectionId = href.replace('#', '')
        scrollToSection(sectionId)
        setIsMenuOpen(false)
    }, [])

    const handleAgendarConsulta = useCallback(() => {
        const whatsappMessage = `Olá! Gostaria de agendar uma consulta com o Dr. Philipe Saraiva Cruz para avaliar minha necessidade de lentes de contato.

Vim através do site SV Lentes e tenho interesse no serviço de assinatura com acompanhamento médico.`

        const whatsappLink = generateWhatsAppLink(
            process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || '5511947038078',
            whatsappMessage
        )

        window.open(whatsappLink, '_blank')
    }, [])

    const handleLogin = useCallback(() => {
        window.location.href = '/area-assinante/login'
    }, [])

    const handleLogout = useCallback(async () => {
        await signOut()
        window.location.href = '/'
    }, [signOut])

    return (
        <header
            className={`fixed inset-x-0 top-0 z-50 bg-transparent transition-all duration-500 ${className ?? ''}`}
        >
            <div className="mx-auto w-full max-w-6xl px-4 sm:px-6 lg:px-8">
                <div
                    className={`relative flex h-16 items-center justify-between py-3 lg:h-20 lg:py-4 ${isScrolled ? 'translate-y-0' : 'lg:translate-y-1'}`}
                >
                    <div
                        className={`absolute inset-0 -z-10 rounded-[32px] border border-white/50 bg-white/80 shadow-glass backdrop-blur-lg transition-all duration-500 ${isScrolled ? 'opacity-100' : 'opacity-95'} ${isScrolled ? '' : 'lg:shadow-glass-lg'}`}
                    />
                    <Link
                        href="/"
                        className="relative flex items-center gap-3 rounded-full px-2 py-1 transition hover:scale-[1.01] hover:opacity-90"
                        aria-label="SV Lentes - Voltar para a página inicial"
                    >
                        <LogoHeader />
                    </Link>
                    <nav className="hidden items-center gap-6 lg:gap-8 md:flex">
        {navigation.map((item) => {
                            const baseClasses = 'relative font-medium text-slate-600 transition-colors duration-200 hover:text-primary-600';
                            return item.isAnchor ? (
                                <Link
                                    key={item.name}
                                    href={item.href}
                                    onClick={(e) => {
                                        e.preventDefault()
                                        handleNavClick(item.href)
                                    }}
                                    className={`${baseClasses} group`}
                                >
                                    <span className="rounded-full px-1.5 py-0.5 text-sm">
                                        {item.name}
                                    </span>
                                    <span className="pointer-events-none absolute inset-x-0 -bottom-1 h-0.5 origin-center scale-x-0 rounded-full bg-gradient-to-r from-primary-500 via-primary-400 to-primary-600 transition-transform duration-300 group-hover:scale-x-100" />
                                </Link>
                            ) : (
                                <Link
                                    key={item.name}
                                    href={item.href}
                                    className={`${baseClasses} group`}
                                >
                                    <span className="rounded-full px-1.5 py-0.5 text-sm">
                                        {item.name}
                                    </span>
                                    <span className="pointer-events-none absolute inset-x-0 -bottom-1 h-0.5 origin-center scale-x-0 rounded-full bg-gradient-to-r from-primary-500 via-primary-400 to-primary-600 transition-transform duration-300 group-hover:scale-x-100" />
                                </Link>
                            )
                        })}
                    </nav>
                    <div className="hidden items-center gap-3 md:flex">
                        {user ? (
                            <>
                                <Button
                                    onClick={() => window.location.href = ctaConfig?.authenticated.dashboard.href || '/area-assinante/dashboard'}
                                    variant="outline"
                                    className="group flex items-center gap-2 rounded-full border-primary/30 bg-white/60 px-5 py-2 text-primary-700 transition hover:border-primary/60 hover:bg-primary/10"
                                >
                                    <LayoutDashboard className="h-4 w-4" />
                                    <span>{ctaConfig?.authenticated.dashboard.label || 'Meu Painel'}</span>
                                </Button>
                                <Button
                                    onClick={handleLogout}
                                    variant="ghost"
                                    className="flex items-center gap-2 rounded-full px-4 py-2 text-slate-500 transition hover:text-slate-700"
                                >
                                    <LogOut className="h-4 w-4" />
                                    <span>{ctaConfig?.authenticated.logout.label || 'Sair'}</span>
                                </Button>
                            </>
                        ) : (
                            <>
                                <Button
                                    onClick={handleAgendarConsulta}
                                    className="flex items-center gap-2 rounded-full bg-gradient-to-r from-primary-600 via-primary-500 to-primary-700 px-6 py-2 font-semibold shadow-lg shadow-primary-500/30 transition hover:shadow-primary-500/40"
                                >
                                    <Phone className="h-4 w-4" />
                                    <span>{ctaConfig?.unauthenticated.schedule.label || 'Agendar Consulta'}</span>
                                </Button>
                                <Button
                                    onClick={handleLogin}
                                    variant="outline"
                                    className="flex items-center gap-2 rounded-full border-primary/30 bg-white/60 px-5 py-2 text-primary-700 transition hover:border-primary/60 hover:bg-primary/10"
                                >
                                    <User className="h-4 w-4" />
                                    <span>{ctaConfig?.unauthenticated.login.label || 'Área do Assinante'}</span>
                                </Button>
                            </>
                        )}
                    </div>
                    <button
                        onClick={() => setIsMenuOpen(!isMenuOpen)}
                        className="relative flex h-11 w-11 items-center justify-center rounded-2xl border border-white/40 bg-white/70 text-slate-600 shadow-sm shadow-primary/10 transition hover:border-primary/40 hover:text-primary-600 md:hidden"
                        aria-label="Alternar menu"
                    >
                        {isMenuOpen ? (
                            <X className="h-5 w-5" />
                        ) : (
                            <Menu className="h-5 w-5" />
                        )}
                    </button>
                </div>
            </div>
            {isMenuOpen && (
                <div className="md:hidden">
                    <div className="mx-4 rounded-3xl border border-white/60 bg-white/90 shadow-xl backdrop-blur-lg">
                        <div className="space-y-4 px-4 py-6">
                            {navigation.map((item) => (
                                item.isAnchor ? (
                                    <Link
                                        key={item.name}
                                        href={item.href}
                                        onClick={(e) => {
                                            e.preventDefault()
                                            handleNavClick(item.href)
                                        }}
                                        className="block rounded-2xl px-4 py-3 text-base font-medium text-slate-600 transition hover:bg-primary/10 hover:text-primary-700"
                                    >
                                        {item.name}
                                    </Link>
                                ) : (
                                    <Link
                                        key={item.name}
                                        href={item.href}
                                        className="block rounded-2xl px-4 py-3 text-base font-medium text-slate-600 transition hover:bg-primary/10 hover:text-primary-700"
                                    >
                                        {item.name}
                                    </Link>
                                )
                            ))}
                            <div className="border-t border-white/60 pt-4">
                                <div className="space-y-3">
                                    {user ? (
                                        <>
                                            <Button
                                                onClick={() => window.location.href = ctaConfig?.authenticated.dashboard.href || '/area-assinante/dashboard'}
                                                variant="outline"
                                                className="w-full flex items-center justify-center gap-2 rounded-full border-primary/30 bg-white/80 py-3 text-primary-700 hover:border-primary/60 hover:bg-primary/10"
                                            >
                                                <LayoutDashboard className="h-4 w-4" />
                                                <span>{ctaConfig?.authenticated.dashboard.label || 'Meu Painel'}</span>
                                            </Button>
                                            <Button
                                                onClick={handleLogout}
                                                variant="ghost"
                                                className="w-full flex items-center justify-center gap-2 rounded-full py-3 text-slate-500 hover:text-slate-700"
                                            >
                                                <LogOut className="h-4 w-4" />
                                                <span>{ctaConfig?.authenticated.logout.label || 'Sair'}</span>
                                            </Button>
                                        </>
                                    ) : (
                                        <>
                                            <Button
                                                onClick={handleAgendarConsulta}
                                                className="w-full flex items-center justify-center gap-2 rounded-full bg-gradient-to-r from-primary-600 via-primary-500 to-primary-700 py-3 font-semibold shadow-lg shadow-primary-500/30 hover:shadow-primary-500/40"
                                            >
                                                <Phone className="h-4 w-4" />
                                                <span>{ctaConfig?.unauthenticated.schedule.label || 'Agendar Consulta'}</span>
                                            </Button>
                                            <Button
                                                onClick={handleLogin}
                                                variant="outline"
                                                className="w-full flex items-center justify-center gap-2 rounded-full border-primary/30 bg-white/80 py-3 text-primary-700 hover:border-primary/60 hover:bg-primary/10"
                                            >
                                                <User className="h-4 w-4" />
                                                <span>{ctaConfig?.unauthenticated.login.label || 'Área do Assinante'}</span>
                                            </Button>
                                        </>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </header>
    )
}
