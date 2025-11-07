'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { useAuth } from '@/contexts/AuthContext'
import { SocialLoginButtons } from '@/components/auth/SocialLoginButtons'
export default function LoginPage() {
  const router = useRouter()
  const {
    user,
    loading: authLoading,
    signIn,
    status,
    fallbackSession,
    lastResolution,
    activateGuestAccess
  } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  useEffect(() => {
    // If user is already authenticated, redirect to dashboard
    if (!authLoading) {
      if (user) {
        router.push('/area-assinante/dashboard')
        return
      }
      if (status.fallbackActive && fallbackSession) {
        router.push('/area-assinante/dashboard?modo=fallback')
      }
    }
  }, [user, authLoading, router, status.fallbackActive, fallbackSession])
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError('')
    try {
      await signIn(email, password)

      // Wait for AuthContext to trigger the server-side cookie set
      // The onAuthStateChanged callback fires asynchronously and needs time to:
      // 1. Get the Firebase token
      // 2. Send POST request to /api/auth/set-token
      // 3. Receive response with HttpOnly cookie
      // We wait longer to ensure the cookie is set before redirecting
      await new Promise(resolve => setTimeout(resolve, 3000))

      // Use a full navigation to ensure server-side rendering reflects
      // the authenticated session (reads the HttpOnly cookie).
      if (typeof window !== 'undefined') {
        if (status.fallbackActive && fallbackSession) {
          router.push('/area-assinante/dashboard?modo=fallback')
          router.refresh()
        } else {
          window.location.replace('/area-assinante/dashboard')
        }
      } else {
        // Fallback to client router when window is not available
        router.push('/area-assinante/dashboard')
        router.refresh()
      }
      setIsLoading(false)
    } catch (error: any) {
      console.error('[LOGIN] Firebase error:', error)
      // Mapear erros do Firebase para mensagens amigáveis
      if (error.message === 'EMAIL_NOT_VERIFIED') {
        setError('Email não verificado. Por favor, verifique sua caixa de entrada.')
      } else {
        switch (error.code) {
          case 'auth/invalid-credential':
          case 'auth/wrong-password':
          case 'auth/user-not-found':
            setError('Email ou senha inválidos. Tente novamente.')
            break
          case 'auth/invalid-email':
            setError('Email inválido. Verifique e tente novamente.')
            break
          case 'auth/user-disabled':
            setError('Conta desativada. Entre em contato com o suporte.')
            break
          case 'auth/too-many-requests':
            setError('Muitas tentativas. Tente novamente mais tarde.')
            break
          default:
            setError('Erro ao fazer login. Tente novamente.')
        }
      }
      setIsLoading(false)
    }
  }
  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-cyan-50 to-silver-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-600"></div>
        <p className="mt-4 text-gray-600">Carregando...</p>
      </div>
    )
  }
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-cyan-50 via-white to-silver-50 px-4">
      <div className="w-full max-w-md space-y-8 p-8 bg-white/95 backdrop-blur-sm rounded-2xl shadow-xl border border-white/20">
        <div className="text-center">
          <div className="mx-auto w-20 h-20 bg-gradient-to-br from-cyan-500 to-cyan-600 rounded-full flex items-center justify-center mb-6">
            <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
            </svg>
          </div>
          <h2 className="text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
            Área do Assinante
          </h2>
          <p className="mt-3 text-sm text-gray-600 leading-relaxed">
            Entre com suas credenciais para acessar sua área exclusiva
          </p>
        </div>
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
            {error}
          </div>
        )}
        {!error && lastResolution && (
          <div className="bg-amber-50 border border-amber-200 text-amber-700 px-4 py-3 rounded-lg text-sm">
            {lastResolution.message}
          </div>
        )}
        {status.fallbackActive && fallbackSession && (
          <div className="bg-cyan-50 border border-cyan-200 text-cyan-700 px-4 py-3 rounded-lg text-sm">
            Modo offline ativado. Último acesso sincronizado em{' '}
            {new Date(fallbackSession.createdAt).toLocaleString()}.
          </div>
        )}
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <label htmlFor="email" className="block text-sm font-semibold text-gray-800">
              Email
            </label>
            <div className="relative">
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
                className="mt-1 block w-full px-4 py-3 border border-gray-200 rounded-xl shadow-sm focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 transition-all duration-200 bg-white/50 backdrop-blur-sm"
                placeholder="seu@email.com"
              />
              <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207" />
                </svg>
              </div>
            </div>
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label htmlFor="password" className="block text-sm font-semibold text-gray-800">
                Senha
              </label>
              <Link
                href="/auth/forgot-password"
                className="text-xs text-cyan-600 hover:text-cyan-700 font-medium transition-colors"
              >
                Esqueceu a senha?
              </Link>
            </div>
            <div className="relative">
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="current-password"
                className="mt-1 block w-full px-4 py-3 border border-gray-200 rounded-xl shadow-sm focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 transition-all duration-200 bg-white/50 backdrop-blur-sm"
                placeholder="••••••••"
              />
              <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              </div>
            </div>
          </div>
          <Button
            type="submit"
            className="w-full py-4 bg-gradient-to-r from-cyan-500 to-cyan-600 hover:from-cyan-600 hover:to-cyan-700 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transform hover:scale-[1.02] transition-all duration-200"
            size="lg"
            disabled={isLoading}
          >
            {isLoading ? (
              <span className="flex items-center justify-center">
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Entrando...
              </span>
            ) : (
              'Entrar'
            )}
          </Button>
          {status.isOffline && (
            <p className="text-xs text-gray-500 text-center">
              Sem conexão com a internet. Você pode usar os dados salvos ou entrar como convidado.
            </p>
          )}
          {status.isOffline && (
            <Button
              type="button"
              variant="outline"
              className="w-full"
              onClick={() => {
                activateGuestAccess()
                setIsLoading(false)
              }}
            >
              Acessar como convidado
            </Button>
          )}
        </form>
        {/* Social Login Buttons */}
        <SocialLoginButtons onError={setError} />
        {/* Link para Registro */}
        <div className="mt-4 text-center">
          <p className="text-sm text-gray-600">
            Não tem uma conta?{' '}
            <Link href="/area-assinante/registro" className="text-cyan-600 hover:text-cyan-700 font-medium">
              Cadastre-se
            </Link>
          </p>
        </div>
        <div className="mt-6 text-center text-xs text-gray-500">
          <p className="mt-2">Ao se cadastrar, você concorda com nossos</p>
          <p>
            <Link href="/politica-privacidade" className="text-cyan-600 hover:underline">
              Termos de Serviço
            </Link>{' '}
            e{' '}
            <Link href="/politica-privacidade" className="text-cyan-600 hover:underline">
              Política de Privacidade
            </Link>
          </p>
        </div>
        <div className="mt-4 text-center">
          <Link
            href="/"
            className="text-sm text-gray-500 hover:text-gray-700 transition-colors"
          >
            ← Voltar para página inicial
          </Link>
        </div>
      </div>
    </div>
  )
}
// Force dynamic rendering for authentication routes
export const dynamic = 'force-dynamic'
