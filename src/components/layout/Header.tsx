'use client'
import { useState, useEffect, useMemo, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { Button } from '@/components/ui/button'
import { LogoHeader } from '@/components/ui/logo'
import { scrollToSection, generateWhatsAppLink } from '@/lib/utils'
import { Menu, X, Phone, User, LayoutDashboard, LogOut } from 'lucide-react'
import { useConfigValue } from '@/lib/use-config'
interface HeaderProps {
    className?: string
}
export function Header({ className }: HeaderProps) {
    const router = useRouter()
    const { user, loading, signOut } = useAuth()
    const [isMenuOpen, setIsMenuOpen] = useState(false)
    const [isScrolled, setIsScrolled] = useState(false)
    // Use centralized configuration for menu items
    const headerMenu = useConfigValue('menus.header', null)
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
            { name: 'FAQ', href: '#perguntas-frequentes', isAnchor: true },
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
        router.push('/area-assinante')
        setIsMenuOpen(false)
    }
    const handleLogout = useCallback(async () => {
        await signOut()
        router.push('/')
    }, [signOut])
    return (
        <header
            className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${isScrolled
                    ? 'bg-white/80 backdrop-blur-xl shadow-liquid border-b border-luxury-200/60'
                    : 'bg-white/60 backdrop-blur-lg shadow-soft border-b border-transparent'
                } ${className}`}
        >
            <div className="container-custom">
                <div className="flex items-center justify-between h-20 lg:h-24">
                    {/* Logo */}
                    <a
                        href="/"
                        className="inline-flex h-14 w-14 items-center justify-center overflow-hidden rounded-xl transition-opacity hover:opacity-90 flex-shrink-0"
                        aria-label="SV Lentes - Voltar para a página inicial"
                    >
                        <LogoHeader className="h-full w-full" />
                    </a>
                    {/* Navigation Desktop */}
                    <nav className="hidden md:flex items-center space-x-10">
                        {navigation.map((item: any) => (
                            item.isAnchor ? (
                                <a
                                    key={item.name}
                                    href={item.href}
                                    onClick={(e) => {
                                        e.preventDefault()
                                        handleNavClick(item.href)
                                    }}
                                    className="text-luxury-700 hover:text-primary-600 font-medium text-sm tracking-wide transition-all duration-300 relative group"
                                >
                                    {item.name}
                                    <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-gradient-luxury transition-all duration-300 group-hover:w-full rounded-full"></span>
                                </a>
                            ) : (
                                <a
                                    key={item.name}
                                    href={item.href}
                                    className="text-luxury-700 hover:text-primary-600 font-medium text-sm tracking-wide transition-all duration-300 relative group"
                                >
                                    {item.name}
                                    <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-gradient-luxury transition-all duration-300 group-hover:w-full rounded-full"></span>
                                </a>
                            )
                        ))}
                    </nav>
                    {/* CTA Button Desktop */}
                    <div className="hidden md:flex items-center gap-3">
                        {user ? (
                            <>
                                <Button
                                    onClick={() => router.push(ctaConfig?.authenticated.dashboard.href || '/area-assinante/dashboard')}
                                    variant="outline"
                                    className="flex items-center gap-2 border-2 border-primary-600 text-primary-700 hover:bg-primary-600 hover:text-white transition-all duration-300 rounded-xl px-5 py-2.5 font-medium shadow-soft hover:shadow-premium hover:-translate-y-0.5"
                                    size="default"
                                >
                                    <LayoutDashboard className="w-4 h-4" style={{ display: 'block', width: '1rem', height: '1rem' }} />
                                    <span className="text-sm">{ctaConfig?.authenticated.dashboard.label || 'Meu Painel'}</span>
                                </Button>
                                <Button
                                    onClick={handleLogout}
                                    variant="ghost"
                                    className="flex items-center gap-2 text-luxury-600 hover:text-primary-600 hover:bg-luxury-100 transition-all duration-300 rounded-xl px-4 py-2.5 font-medium"
                                    size="default"
                                >
                                    <LogOut className="w-4 h-4" style={{ display: 'block', width: '1rem', height: '1rem' }} />
                                    <span className="text-sm">{ctaConfig?.authenticated.logout.label || 'Sair'}</span>
                                </Button>
                            </>
                        ) : (
                            <>
                                <Button
                                    onClick={handleAgendarConsulta}
                                    className="flex items-center gap-2 bg-primary-600 hover:bg-primary-700 text-white transition-all duration-300 rounded-xl px-6 py-2.5 font-medium shadow-premium hover:shadow-premium-lg hover:-translate-y-0.5"
                                    size="default"
                                >
                                    <Phone className="w-4 h-4" style={{ display: 'block', width: '1rem', height: '1rem' }} />
                                    <span className="text-sm tracking-wide">{ctaConfig?.unauthenticated.schedule.label || 'Agendar Consulta'}</span>
                                </Button>
                                <Button
                                    onClick={handleLogin}
                                    variant="ghost"
                                    className="flex items-center gap-2 text-luxury-700 hover:text-primary-600 hover:bg-luxury-100 transition-all duration-300 rounded-xl px-4 py-2.5 font-medium"
                                    size="default"
                                >
                                    <User className="w-4 h-4" style={{ display: 'block', width: '1rem', height: '1rem' }} />
                                    <span className="text-sm">{ctaConfig?.unauthenticated.login.label || 'Área do Assinante'}</span>
                                </Button>
                            </>
                        )}
                    </div>
                    {/* Mobile Menu Button */}
                    <button
                        onClick={() => setIsMenuOpen(!isMenuOpen)}
                        className="md:hidden p-2.5 rounded-xl text-luxury-700 hover:bg-luxury-100 hover:text-primary-600 transition-all duration-300"
                        aria-label={isMenuOpen ? "Fechar menu de navegação" : "Abrir menu de navegação"}
                        aria-expanded={isMenuOpen}
                        aria-controls="mobile-menu"
                    >
                        {isMenuOpen ? (
                            <X className="w-6 h-6" style={{ display: 'block', width: '1.5rem', height: '1.5rem' }} />
                        ) : (
                            <Menu className="w-6 h-6" style={{ display: 'block', width: '1.5rem', height: '1.5rem' }} />
                        )}
                    </button>
                </div>
                {/* Mobile Menu */}
                {isMenuOpen && (
                    <div
                        id="mobile-menu"
                        className="md:hidden border-t border-luxury-200 bg-white/95 backdrop-blur-lg"
                        role="navigation"
                        aria-label="Menu de navegação mobile"
                    >
                        <div className="py-6 space-y-2">
                            {navigation.map((item: any) => (
                                item.isAnchor ? (
                                    <a
                                        key={item.name}
                                        href={item.href}
                                        onClick={(e) => {
                                            e.preventDefault()
                                            handleNavClick(item.href)
                                        }}
                                        className="block px-6 py-3 text-luxury-700 hover:text-primary-600 hover:bg-luxury-100 font-medium transition-all duration-300 rounded-xl mx-4"
                                        role="menuitem"
                                    >
                                        {item.name}
                                    </a>
                                ) : (
                                    <a
                                        key={item.name}
                                        href={item.href}
                                        className="block px-6 py-3 text-luxury-700 hover:text-primary-600 hover:bg-luxury-100 font-medium transition-all duration-300 rounded-xl mx-4"
                                        role="menuitem"
                                    >
                                        {item.name}
                                    </a>
                                )
                            ))}
                            {/* Mobile CTA */}
                            <div className="px-4 pt-6 mt-4 border-t border-luxury-200 space-y-3" role="menu">
                                {user ? (
                                    <>
                                        <Button
                                            onClick={() => router.push(ctaConfig?.authenticated.dashboard.href || '/area-assinante/dashboard')}
                                            variant="outline"
                                            className="w-full flex items-center justify-center gap-2 border-2 border-primary-600 text-primary-700 hover:bg-primary-600 hover:text-white transition-all duration-300 rounded-xl py-3 font-medium shadow-soft hover:shadow-premium min-h-[48px]"
                                            size="default"
                                        >
                                            <LayoutDashboard className="w-4 h-4" style={{ display: 'block', width: '1rem', height: '1rem' }} />
                                            <span>{ctaConfig?.authenticated.dashboard.label || 'Meu Painel'}</span>
                                        </Button>
                                        <Button
                                            onClick={handleLogout}
                                            variant="ghost"
                                            className="w-full flex items-center justify-center gap-2 text-luxury-600 hover:text-primary-600 hover:bg-luxury-100 transition-all duration-300 rounded-xl py-3 font-medium min-h-[48px]"
                                            size="default"
                                        >
                                            <LogOut className="w-4 h-4" style={{ display: 'block', width: '1rem', height: '1rem' }} />
                                            <span>{ctaConfig?.authenticated.logout.label || 'Sair'}</span>
                                        </Button>
                                    </>
                                ) : (
                                    <>
                                        <Button
                                            onClick={handleAgendarConsulta}
                                            className="w-full flex items-center justify-center gap-2 bg-primary-600 hover:bg-primary-700 text-white transition-all duration-300 rounded-xl py-3 font-medium shadow-premium hover:shadow-premium-lg min-h-[48px]"
                                            size="default"
                                        >
                                            <Phone className="w-4 h-4" style={{ display: 'block', width: '1rem', height: '1rem' }} />
                                            <span className="tracking-wide">{ctaConfig?.unauthenticated.schedule.label || 'Agendar Consulta'}</span>
                                        </Button>
                                        <Button
                                            onClick={handleLogin}
                                            variant="ghost"
                                            className="w-full flex items-center justify-center gap-2 text-luxury-700 hover:text-primary-600 hover:bg-luxury-100 transition-all duration-300 rounded-xl py-3 font-medium min-h-[48px]"
                                            size="default"
                                        >
                                            <User className="w-4 h-4" style={{ display: 'block', width: '1rem', height: '1rem' }} />
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
