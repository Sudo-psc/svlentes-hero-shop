'use client'

import { useState } from 'react'
import { Logo } from '@/components/ui/Logo'
import { Button } from '@/components/ui/Button'
import Link from 'next/link'
import { useAuth } from '@/contexts/AuthContext'

export default function ForgotPasswordPage() {
  const { sendPasswordReset } = useAuth()
  const [email, setEmail] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError('')

    try {
      await sendPasswordReset(email)
      setSuccess(true)
    } catch (error: any) {
      console.error('[FORGOT-PASSWORD] Firebase error:', error)

      // Mapear erros do Firebase
      switch (error.code) {
        case 'auth/invalid-email':
          setError('Email inválido. Verifique e tente novamente.')
          break
        case 'auth/user-not-found':
          // Por segurança, não revelar se o email existe
          setSuccess(true)
          break
        default:
          setError('Erro ao enviar email. Tente novamente.')
      }
      setIsLoading(false)
    }
  }

  if (success) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-cyan-50 to-silver-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8">
          <div className="flex justify-center mb-8">
            <Logo />
          </div>

          <div className="text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <svg
                className="w-8 h-8 text-green-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                />
              </svg>
            </div>

            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              Email Enviado!
            </h2>

            <p className="text-gray-600 mb-6">
              Se o email <strong>{email}</strong> estiver cadastrado, você receberá
              instruções para redefinir sua senha.
            </p>

            <div className="bg-cyan-50 border border-cyan-200 rounded-lg p-4 mb-6">
              <p className="text-sm text-gray-700">
                <strong>Verifique sua caixa de entrada</strong> e também a pasta de
                spam/lixo eletrônico. O link de recuperação é válido por{' '}
                <strong>1 hora</strong>.
              </p>
            </div>

            <Link href="/area-assinante/login">
              <Button className="w-full bg-cyan-600 hover:bg-cyan-700">
                Voltar para Login
              </Button>
            </Link>
          </div>

          {/* Footer */}
          <div className="mt-8 pt-6 border-t border-gray-200 text-center">
            <p className="text-sm text-gray-600 mb-2">Não recebeu o email?</p>
            <button
              onClick={() => setSuccess(false)}
              className="text-sm text-cyan-600 hover:text-cyan-700 font-medium"
            >
              Tentar novamente
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-cyan-50 to-silver-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8">
        {/* Logo */}
        <div className="flex justify-center mb-8">
          <Logo />
        </div>

        {/* Título */}
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-2">
            Esqueceu sua senha?
          </h2>
          <p className="text-gray-600">
            Sem problemas! Digite seu email e enviaremos instruções para
            redefinir sua senha.
          </p>
        </div>

        {/* Formulário */}
        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
              {error}
            </div>
          )}

          <div>
            <label
              htmlFor="email"
              className="block text-sm font-medium text-gray-700 mb-2"
            >
              Email
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent transition-all"
              placeholder="seu@email.com"
              disabled={isLoading}
            />
          </div>

          <Button
            type="submit"
            className="w-full bg-cyan-600 hover:bg-cyan-700 text-white py-3"
            disabled={isLoading}
          >
            {isLoading ? 'Enviando...' : 'Enviar Link de Recuperação'}
          </Button>
        </form>

        {/* Links */}
        <div className="mt-6 text-center space-y-3">
          <Link
            href="/area-assinante/login"
            className="block text-sm text-gray-600 hover:text-gray-800"
          >
            ← Voltar para Login
          </Link>
          <div className="text-sm text-gray-600">
            Não tem uma conta?{' '}
            <Link
              href="/area-assinante/registro"
              className="text-cyan-600 hover:text-cyan-700 font-medium"
            >
              Cadastre-se
            </Link>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-8 pt-6 border-t border-gray-200 text-center">
          <p className="text-sm text-gray-600 mb-2">Precisa de ajuda?</p>
          <a
            href={`https://wa.me/553399898026?text=${encodeURIComponent(
              'Olá! Preciso de ajuda com a recuperação de senha no site SV Lentes.'
            )}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-cyan-600 hover:text-cyan-700 font-medium"
          >
            Fale conosco via WhatsApp
          </a>
        </div>
      </div>
    </div>
  )
}
