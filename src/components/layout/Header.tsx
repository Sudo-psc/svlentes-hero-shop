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
                        {navigation.map((item: any) => (
                            item.isAnchor ? (
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
                                    onClick={() => router.push(ctaConfig?.authenticated.dashboard.href || '/area-assinante/dashboard')}
                                    variant="outline"
                                    className="flex items-center space-x-2 border-cyan-600 text-cyan-600 hover:bg-cyan-50"
                                    size="default"
                                >
                                    <LayoutDashboard className="w-4 h-4" style={{ display: 'block', width: '1rem', height: '1rem' }} />
                                    <span>{ctaConfig?.authenticated.dashboard.label || 'Meu Painel'}</span>
                                </Button>
                                <Button
                                    onClick={handleLogout}
                                    variant="ghost"
                                    className="flex items-center space-x-2 text-gray-600 hover:text-gray-800"
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
                                    className="flex items-center space-x-2 bg-cyan-600 hover:bg-cyan-700"
                                    size="default"
                                >
                                    <Phone className="w-4 h-4" style={{ display: 'block', width: '1rem', height: '1rem' }} />
                                    <span>{ctaConfig?.unauthenticated.schedule.label || 'Agendar Consulta'}</span>
                                </Button>
                                <Button
                                    onClick={handleLogin}
                                    variant="outline"
                                    className="flex items-center space-x-2 border-cyan-600 text-cyan-600 hover:bg-cyan-50"
                                    size="default"
                                >
                                    <User className="w-4 h-4" style={{ display: 'block', width: '1rem', height: '1rem' }} />
                                    <span>{ctaConfig?.unauthenticated.login.label || 'Área do Assinante'}</span>
                                </Button>
                            </>
                        )}
                    </div>
                    {/* Mobile Menu Button */}
                    <button
                        onClick={() => setIsMenuOpen(!isMenuOpen)}
                        className="md:hidden p-2 rounded-lg text-gray-700 hover:bg-gray-100 transition-colors"
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
                        className="md:hidden border-t border-gray-200 bg-white"
                        role="navigation"
                        aria-label="Menu de navegação mobile"
                    >
                        <div className="py-4 space-y-4">
                            {navigation.map((item: any) => (
                                item.isAnchor ? (
                                    <a
                                        key={item.name}
                                        href={item.href}
                                        onClick={(e) => {
                                            e.preventDefault()
                                            handleNavClick(item.href)
                                        }}
                                        className="block px-4 py-2 text-gray-700 hover:text-primary-600 hover:bg-gray-50 font-medium transition-colors duration-200"
                                        role="menuitem"
                                    >
                                        {item.name}
                                    </a>
                                ) : (
                                    <a
                                        key={item.name}
                                        href={item.href}
                                        className="block px-4 py-2 text-gray-700 hover:text-primary-600 hover:bg-gray-50 font-medium transition-colors duration-200"
                                        role="menuitem"
                                    >
                                        {item.name}
                                    </a>
                                )
                            ))}
                            {/* Mobile CTA */}
                            <div className="px-4 pt-4 border-t border-gray-200 space-y-3" role="menu">
                                {user ? (
                                    <>
                                        <Button
                                            onClick={() => router.push(ctaConfig?.authenticated.dashboard.href || '/area-assinante/dashboard')}
                                            variant="outline"
                                            className="w-full flex items-center justify-center space-x-2 border-cyan-600 text-cyan-600 hover:bg-cyan-50"
                                            size="default"
                                        >
                                            <LayoutDashboard className="w-4 h-4" style={{ display: 'block', width: '1rem', height: '1rem' }} />
                                            <span>{ctaConfig?.authenticated.dashboard.label || 'Meu Painel'}</span>
                                        </Button>
                                        <Button
                                            onClick={handleLogout}
                                            variant="ghost"
                                            className="w-full flex items-center justify-center space-x-2 text-gray-600 hover:text-gray-800"
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
                                            className="w-full flex items-center justify-center space-x-2 bg-cyan-600 hover:bg-cyan-700"
                                            size="default"
                                        >
                                            <Phone className="w-4 h-4" style={{ display: 'block', width: '1rem', height: '1rem' }} />
                                            <span>{ctaConfig?.unauthenticated.schedule.label || 'Agendar Consulta'}</span>
                                        </Button>
                                        <Button
                                            onClick={handleLogin}
                                            variant="outline"
                                            className="w-full flex items-center justify-center space-x-2 border-cyan-600 text-cyan-600 hover:bg-cyan-50"
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
