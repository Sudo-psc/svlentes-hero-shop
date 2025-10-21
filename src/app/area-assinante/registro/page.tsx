'use client'
import { useState } from 'react'
// Force dynamic rendering to avoid SSG config errors
export const dynamic = 'force-dynamic'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { useAuth } from '@/contexts/AuthContext'
import { SocialLoginButtons } from '@/components/auth/SocialLoginButtons'
export default function RegisterPage() {
  const router = useRouter()
  const { signUp } = useAuth()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [acceptTerms, setAcceptTerms] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [passwordStrength, setPasswordStrength] = useState<{
    score: number
    message: string
    color: string
  }>({ score: 0, message: '', color: '' })

  const validatePasswordStrength = (pwd: string) => {
    let score = 0
    let message = ''
    let color = ''

    if (pwd.length >= 8) score++
    if (pwd.length >= 12) score++
    if (/[a-z]/.test(pwd) && /[A-Z]/.test(pwd)) score++
    if (/\d/.test(pwd)) score++
    if (/[^a-zA-Z0-9]/.test(pwd)) score++

    if (score <= 2) {
      message = 'Senha fraca'
      color = 'text-red-600'
    } else if (score === 3) {
      message = 'Senha média'
      color = 'text-yellow-600'
    } else if (score === 4) {
      message = 'Senha boa'
      color = 'text-blue-600'
    } else {
      message = 'Senha forte'
      color = 'text-green-600'
    }

    return { score, message, color }
  }

  const handlePasswordChange = (pwd: string) => {
    setPassword(pwd)
    setPasswordStrength(validatePasswordStrength(pwd))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError('')

    // Validações client-side aprimoradas
    if (password !== confirmPassword) {
      setError('As senhas não coincidem')
      setIsLoading(false)
      return
    }

    if (password.length < 8) {
      setError('A senha deve ter pelo menos 8 caracteres')
      setIsLoading(false)
      return
    }

    if (!/[A-Z]/.test(password)) {
      setError('A senha deve conter pelo menos uma letra maiúscula')
      setIsLoading(false)
      return
    }

    if (!/[a-z]/.test(password)) {
      setError('A senha deve conter pelo menos uma letra minúscula')
      setIsLoading(false)
      return
    }

    if (!/\d/.test(password)) {
      setError('A senha deve conter pelo menos um número')
      setIsLoading(false)
      return
    }

    if (!/[^a-zA-Z0-9]/.test(password)) {
      setError('A senha deve conter pelo menos um caractere especial (!@#$%^&*)')
      setIsLoading(false)
      return
    }
    if (!acceptTerms) {
      setError('Você deve aceitar os termos de serviço e política de privacidade')
      setIsLoading(false)
      return
    }
    try {
      await signUp(email, password, name)
      // Sucesso - mostrar mensagem
      setSuccess(true)
    } catch (error: any) {
      console.error('[REGISTER] Firebase error:', error)
      // Mapear erros do Firebase para mensagens amigáveis
      switch (error.code) {
        case 'auth/email-already-in-use':
          setError('Este email já está cadastrado. Tente fazer login.')
          break
        case 'auth/invalid-email':
          setError('Email inválido. Verifique e tente novamente.')
          break
        case 'auth/weak-password':
          setError('Senha muito fraca. Use pelo menos 6 caracteres.')
          break
        default:
          setError(error.message || 'Erro ao criar conta. Tente novamente.')
      }
      setIsLoading(false)
    }
  }
  if (success) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-cyan-50 to-silver-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 text-center">
          <div className="mb-6">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              Conta criada com sucesso!
            </h2>
            <p className="text-gray-600 mb-6">
              Enviamos um email de verificação para <strong>{email}</strong>.
              Por favor, verifique sua caixa de entrada e clique no link para ativar sua conta.
            </p>
            <div className="space-y-3">
              <Link href="/area-assinante/login">
                <Button className="w-full bg-cyan-600 hover:bg-cyan-700">
                  Ir para Login
                </Button>
              </Link>
              <p className="text-sm text-gray-500">
                Não recebeu o email?{' '}
                <button
                  onClick={() => setSuccess(false)}
                  className="text-cyan-600 hover:text-cyan-700 font-medium"
                >
                  Tentar novamente
                </button>
              </p>
            </div>
          </div>
        </div>
      </div>
    )
  }
  return (
    <div className="min-h-screen bg-gradient-to-br from-cyan-50 to-silver-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8">
        {/* Título */}
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-2">
            Criar Conta
          </h2>
          <p className="text-gray-600">
            Cadastre-se para acessar a área do assinante
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
            <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
              Nome Completo
            </label>
            <input
              id="name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              autoComplete="name"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent transition-all"
              placeholder="Seu nome completo"
              disabled={isLoading}
            />
          </div>
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
              Email
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent transition-all"
              placeholder="seu@email.com"
              disabled={isLoading}
            />
          </div>
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
              Senha
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => handlePasswordChange(e.target.value)}
              required
              minLength={8}
              autoComplete="new-password"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent transition-all"
              placeholder="Mínimo 8 caracteres"
              disabled={isLoading}
            />
            {password && (
              <div className="mt-2">
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className={passwordStrength.color}>
                    {passwordStrength.message}
                  </span>
                  <span className="text-gray-500">
                    {passwordStrength.score}/5
                  </span>
                </div>
                <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden">
                  <div
                    className={`h-full transition-all duration-300 ${
                      passwordStrength.score <= 2 ? 'bg-red-500' :
                      passwordStrength.score === 3 ? 'bg-yellow-500' :
                      passwordStrength.score === 4 ? 'bg-blue-500' :
                      'bg-green-500'
                    }`}
                    style={{ width: `${(passwordStrength.score / 5) * 100}%` }}
                  />
                </div>
                <ul className="mt-2 space-y-1 text-xs text-gray-600">
                  <li className={password.length >= 8 ? 'text-green-600' : ''}>
                    ✓ Mínimo 8 caracteres
                  </li>
                  <li className={/[A-Z]/.test(password) ? 'text-green-600' : ''}>
                    ✓ Uma letra maiúscula
                  </li>
                  <li className={/[a-z]/.test(password) ? 'text-green-600' : ''}>
                    ✓ Uma letra minúscula
                  </li>
                  <li className={/\d/.test(password) ? 'text-green-600' : ''}>
                    ✓ Um número
                  </li>
                  <li className={/[^a-zA-Z0-9]/.test(password) ? 'text-green-600' : ''}>
                    ✓ Um caractere especial (!@#$%^&*)
                  </li>
                </ul>
              </div>
            )}
          </div>
          <div>
            <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-2">
              Confirmar Senha
            </label>
            <input
              id="confirmPassword"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              minLength={8}
              autoComplete="new-password"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent transition-all"
              placeholder="Digite a senha novamente"
              disabled={isLoading}
            />
          </div>
          <div className="flex items-start">
            <div className="flex items-center h-5">
              <input
                id="terms"
                type="checkbox"
                checked={acceptTerms}
                onChange={(e) => setAcceptTerms(e.target.checked)}
                required
                className="w-4 h-4 border border-gray-300 rounded bg-white checked:bg-cyan-600 checked:border-cyan-600 focus:ring-2 focus:ring-cyan-500"
                disabled={isLoading}
              />
            </div>
            <div className="ml-3 text-sm">
              <label htmlFor="terms" className="text-gray-700">
                Li e aceito os{' '}
                <Link href="/termos-uso" target="_blank" className="text-cyan-600 hover:text-cyan-700 underline">
                  Termos de Serviço
                </Link>
                {' '}e a{' '}
                <Link href="/politica-privacidade" target="_blank" className="text-cyan-600 hover:text-cyan-700 underline">
                  Política de Privacidade
                </Link>
              </label>
            </div>
          </div>
          <Button
            type="submit"
            className="w-full bg-cyan-600 hover:bg-cyan-700 text-white py-3"
            disabled={isLoading}
          >
            {isLoading ? 'Criando conta...' : 'Criar Conta'}
          </Button>
        </form>
        {/* Social Login Buttons */}
        <SocialLoginButtons onError={setError} />
        {/* Link para Login */}
        <div className="mt-6 text-center">
          <p className="text-sm text-gray-600">
            Já tem uma conta?{' '}
            <Link href="/area-assinante/login" className="text-cyan-600 hover:text-cyan-700 font-medium">
              Faça login
            </Link>
          </p>
        </div>
        {/* Informações de Suporte */}
        <div className="mt-8 pt-6 border-t border-gray-200">
          <div className="text-center">
            <p className="text-sm text-gray-600 mb-2">
              Precisa de ajuda?
            </p>
            <a
              href={`https://wa.me/5533999898026?text=${encodeURIComponent('Olá! Preciso de ajuda com o cadastro no site SV Lentes.')}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-cyan-600 hover:text-cyan-700 font-medium"
            >
              Fale conosco via WhatsApp
            </a>
          </div>
        </div>
      </div>
    </div>
  )
}