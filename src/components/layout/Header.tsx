'use client'
import { useState, useEffect, useMemo, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { Button } from '@/components/ui/button'
import { LogoHeader } from '@/components/ui/logo'
import { scrollToSection } from '@/lib/utils'
import { Menu, X, Phone, User, LayoutDashboard, LogOut } from 'lucide-react'
import { useConfigValue } from '@/lib/use-config'

interface MenuItem {
    label: string
    href: string
    isAnchor?: boolean
    icon?: string
    external?: boolean
}

interface HeaderMenuConfig {
    main: MenuItem[]
    cta: {
        authenticated: {
            dashboard: MenuItem
            logout: MenuItem
        }
        unauthenticated: {
            schedule: MenuItem
            login: MenuItem
        }
    }
}

interface HeaderProps {
    className?: string
}

export function Header({ className }: HeaderProps) {
    const router = useRouter()
    const { user, signOut } = useAuth()
    const [isMenuOpen, setIsMenuOpen] = useState(false)
    const [isScrolled, setIsScrolled] = useState(false)
    // Use centralized configuration for menu items
    const headerMenu = useConfigValue<HeaderMenuConfig | null>('menus.header', null)
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
    const navigation = useMemo(() => {
        if (headerMenu && headerMenu.main) {
            return headerMenu.main.map((item: any) => ({
                name: item.label,
                href: item.href,
                isAnchor: item.isAnchor || false,
            }))
        }
        // Fallback to hardcoded menu if config not available
        return [
            { name: 'Calculadora', href: '/calculadora', isAnchor: false },
            { name: 'Planos', href: 'https://svlentes.com.br/planos', isAnchor: false },
            { name: 'Como Funciona', href: '/como-funciona', isAnchor: false },
            { name: 'FAQ', href: '/faq', isAnchor: false },
            { name: 'Contato', href: '#contato', isAnchor: true },
        ]
    }, [headerMenu])
    const ctaConfig = useMemo(
        () => (headerMenu ? headerMenu.cta : null),
        [headerMenu]
    )
    const handleNavClick = useCallback((href: string) => {
        const sectionId = href.replace('#', '')
        scrollToSection(sectionId)
        setIsMenuOpen(false)
    }, [])
    const handleAgendarConsulta = () => {
        router.push('/agendar-consulta')
        setIsMenuOpen(false)
    }
    const handleLogin = () => {
        router.push('/area-assinante/login')
        setIsMenuOpen(false)
    }
    const handleLogout = useCallback(async () => {
        await signOut()
        router.push('/')
    }, [signOut, router])
    return (
        <header
            className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${isScrolled
                ? 'bg-white/98 backdrop-blur-xl shadow-lg border-b border-silver-200/60'
                : 'bg-white shadow-md border-b border-silver-100/50'
                } ${className}`}
        >
            <div className="container-custom">
                <div className="flex items-center justify-between h-16 lg:h-20">
                    {/* Logo */}
                    <a
                        href="/"
                        className="inline-flex h-[80px] w-[80px] items-center justify-center overflow-hidden rounded-xl transition-all duration-200 hover:opacity-90 hover:scale-[1.02] active:scale-[0.98] flex-shrink-0 shadow-sm hover:shadow-md"
                        aria-label="SV Lentes - Voltar para a página inicial"
                    >
                        <LogoHeader className="h-full w-full" />
                    </a>
                    {/* Navigation Desktop */}
                    <nav className="hidden md:flex items-center space-x-8" aria-label="Navegação principal">
                        {navigation.map((item: any) => (
                            item.isAnchor ? (
                                <a
                                    key={item.name}
                                    href={item.href}
                                    onClick={(e) => {
                                        e.preventDefault()
                                        handleNavClick(item.href)
                                    }}
                                    className="text-silver-700 hover:text-cyan-600 font-medium transition-all duration-200 relative group py-2 px-1 rounded-md hover:bg-cyan-50/50 focus-visible:bg-cyan-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500 focus-visible:ring-offset-2"
                                >
                                    {item.name}
                                    <span className="absolute -bottom-1 left-1/2 transform -translate-x-1/2 w-0 h-0.5 bg-cyan-600 transition-all duration-300 group-hover:w-full rounded-full"></span>
                                </a>
                            ) : (
                                <a
                                    key={item.name}
                                    href={item.href}
                                    className="text-silver-700 hover:text-cyan-600 font-medium transition-all duration-200 relative group py-2 px-1 rounded-md hover:bg-cyan-50/50 focus-visible:bg-cyan-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500 focus-visible:ring-offset-2"
                                >
                                    {item.name}
                                    <span className="absolute -bottom-1 left-1/2 transform -translate-x-1/2 w-0 h-0.5 bg-cyan-600 transition-all duration-300 group-hover:w-full rounded-full"></span>
                                </a>
                            )
                        ))}
                    </nav>
                    {/* CTA Button Desktop */}
                    <div className="hidden md:flex items-center space-x-4">
                        {user ? (
                            <>
                                <Button
                                    onClick={() => router.push(ctaConfig?.authenticated.dashboard.href || '/area-assinante/dashboard')}
                                    variant="outline"
                                    className="flex items-center space-x-2 border-cyan-600 text-cyan-700 hover:bg-cyan-50 hover:border-cyan-700 hover:shadow-md"
                                    size="default"
                                >
                                    <LayoutDashboard className="w-4 h-4" />
                                    <span>{ctaConfig?.authenticated.dashboard.label || 'Meu Painel'}</span>
                                </Button>
                                <Button
                                    onClick={handleLogout}
                                    variant="ghost-primary"
                                    className="flex items-center space-x-2"
                                    size="default"
                                >
                                    <LogOut className="w-4 h-4" />
                                    <span>{ctaConfig?.authenticated.logout.label || 'Sair'}</span>
                                </Button>
                            </>
                        ) : (
                            <>
                                <Button
                                    onClick={handleAgendarConsulta}
                                    variant="primary"
                                    className="flex items-center space-x-2 shadow-md hover:shadow-lg"
                                    size="default"
                                >
                                    <Phone className="w-4 h-4" />
                                    <span>{ctaConfig?.unauthenticated.schedule.label || 'Agendar Consulta'}</span>
                                </Button>
                                <Button
                                    onClick={handleLogin}
                                    variant="outline"
                                    className="flex items-center space-x-2 hover:shadow-md"
                                    size="default"
                                >
                                    <User className="w-4 h-4" />
                                    <span>{ctaConfig?.unauthenticated.login.label || 'Área do Assinante'}</span>
                                </Button>
                            </>
                        )}
                    </div>
                    {/* Mobile Menu Button */}
                    <button
                        onClick={() => setIsMenuOpen(!isMenuOpen)}
                        className="md:hidden p-3 rounded-lg text-silver-700 hover:bg-silver-100 hover:text-silver-900 transition-all duration-200 focus-visible:bg-silver-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500 focus-visible:ring-offset-2 active:scale-[0.95]"
                        aria-label={isMenuOpen ? "Fechar menu de navegação" : "Abrir menu de navegação"}
                        aria-expanded={isMenuOpen}
                        aria-controls="mobile-menu"
                    >
                        {isMenuOpen ? (
                            <X className="w-6 h-6" />
                        ) : (
                            <Menu className="w-6 h-6" />
                        )}
                    </button>
                </div>
                {/* Mobile Menu */}
                {isMenuOpen && (
                    <div
                        id="mobile-menu"
                        className="md:hidden border-t border-silver-200 bg-white/95 backdrop-blur-sm shadow-lg"
                        role="navigation"
                        aria-label="Menu de navegação mobile"
                    >
                        <div className="py-4 space-y-2">
                            {navigation.map((item: any) => (
                                item.isAnchor ? (
                                    <a
                                        key={item.name}
                                        href={item.href}
                                        onClick={(e) => {
                                            e.preventDefault()
                                            handleNavClick(item.href)
                                        }}
                                        className="block px-6 py-3 text-silver-700 hover:text-cyan-600 hover:bg-cyan-50 font-medium transition-all duration-200 rounded-lg mx-2 focus-visible:bg-cyan-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500 focus-visible:ring-offset-2"
                                        role="menuitem"
                                    >
                                        {item.name}
                                    </a>
                                ) : (
                                    <a
                                        key={item.name}
                                        href={item.href}
                                        className="block px-6 py-3 text-silver-700 hover:text-cyan-600 hover:bg-cyan-50 font-medium transition-all duration-200 rounded-lg mx-2 focus-visible:bg-cyan-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500 focus-visible:ring-offset-2"
                                        role="menuitem"
                                    >
                                        {item.name}
                                    </a>
                                )
                            ))}
                            {/* Mobile CTA */}
                            <div className="px-4 pt-4 border-t border-silver-200 space-y-3" role="menu">
                                {user ? (
                                    <>
                                        <Button
                                            onClick={() => router.push(ctaConfig?.authenticated.dashboard.href || '/area-assinante/dashboard')}
                                            variant="outline"
                                            className="w-full flex items-center justify-center space-x-2 hover:shadow-md hover:scale-[1.02] active:scale-[0.98] transition-all duration-200"
                                            size="default"
                                        >
                                            <LayoutDashboard className="w-4 h-4" />
                                            <span>{ctaConfig?.authenticated.dashboard.label || 'Meu Painel'}</span>
                                        </Button>
                                        <Button
                                            onClick={handleLogout}
                                            variant="ghost-primary"
                                            className="w-full flex items-center justify-center space-x-2 hover:scale-[1.02] active:scale-[0.98] transition-all duration-200"
                                            size="default"
                                        >
                                            <LogOut className="w-4 h-4" />
                                            <span>{ctaConfig?.authenticated.logout.label || 'Sair'}</span>
                                        </Button>
                                    </>
                                ) : (
                                    <>
                                        <Button
                                            onClick={handleAgendarConsulta}
                                            variant="primary"
                                            className="w-full flex items-center justify-center space-x-2 shadow-md hover:shadow-lg hover:scale-[1.02] active:scale-[0.98] transition-all duration-200"
                                            size="default"
                                        >
                                            <Phone className="w-4 h-4 transition-transform group-hover:rotate-12" />
                                            <span>{ctaConfig?.unauthenticated.schedule.label || 'Agendar Consulta'}</span>
                                        </Button>
                                        <Button
                                            onClick={handleLogin}
                                            variant="outline"
                                            className="w-full flex items-center justify-center space-x-2 hover:shadow-md hover:scale-[1.02] active:scale-[0.98] transition-all duration-200"
                                            size="default"
                                        >
                                            <User className="w-4 h-4" />
                                            <span>{ctaConfig?.unauthenticated.login.label || 'Área do Assinante'}</span>
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
