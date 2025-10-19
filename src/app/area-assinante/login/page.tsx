'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/Button'
import Link from 'next/link'
import { useAuth } from '@/contexts/AuthContext'
import { SocialLoginButtons } from '@/components/auth/SocialLoginButtons'

export default function LoginPage() {
  const router = useRouter()
  const { user, loading: authLoading, signIn } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    // If user is already authenticated, redirect to dashboard
    if (user && !authLoading) {
      router.push('/area-assinante/dashboard')
    }
  }, [user, authLoading, router])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError('')

    try {
      await signIn(email, password)

      // Force redirect to dashboard
      router.push('/area-assinante/dashboard')
      router.refresh()
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
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-cyan-50 to-silver-50">
      <div className="max-w-md w-full space-y-8 p-8 bg-white rounded-xl shadow-lg">
        <div className="text-center">
          <h2 className="text-3xl font-bold text-gray-900">
            Área do Assinante
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            Entre com suas credenciais para acessar
          </p>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700">
              Email
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-cyan-500 focus:border-cyan-500"
              placeholder="seu@email.com"
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                Senha
              </label>
              <Link
                href="/auth/forgot-password"
                className="text-xs text-cyan-600 hover:text-cyan-700 font-medium"
              >
                Esqueceu a senha?
              </Link>
            </div>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete="current-password"
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-cyan-500 focus:border-cyan-500"
              placeholder="••••••••"
            />
          </div>

          <Button
            type="submit"
            className="w-full"
            size="lg"
            disabled={isLoading}
          >
            {isLoading ? 'Entrando...' : 'Entrar'}
          </Button>
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
