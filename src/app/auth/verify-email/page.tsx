'use client'
import { useEffect, useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Logo } from '@/components/ui/logo'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
type VerificationState = 'verifying' | 'success' | 'error' | 'missing-token'
function VerifyEmailContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [state, setState] = useState<VerificationState>('verifying')
  const [errorMessage, setErrorMessage] = useState('')
  useEffect(() => {
    const token = searchParams.get('token')
    if (!token) {
      setState('missing-token')
      return
    }
    // Verificar email
    async function verifyEmail() {
      try {
        const response = await fetch(`/api/auth/verify-email?token=${token}`)
        const data = await response.json()
        if (response.ok) {
          setState('success')
          // Redirecionar para login após 3 segundos
          setTimeout(() => {
            router.push('/area-assinante/login?verified=true')
          }, 3000)
        } else {
          setState('error')
          setErrorMessage(data.message || 'Token inválido ou expirado')
        }
      } catch (error) {
        setState('error')
        setErrorMessage('Erro ao verificar email. Tente novamente.')
      }
    }
    verifyEmail()
  }, [searchParams, router])
  return (
    <div className="min-h-screen bg-gradient-to-br from-cyan-50 to-silver-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8">
        {/* Logo */}
        <div className="flex justify-center mb-8">
          <Logo />
        </div>
        {/* Verificando */}
        {state === 'verifying' && (
          <div className="text-center">
            <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-cyan-600 mx-auto mb-6"></div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              Verificando seu email...
            </h2>
            <p className="text-gray-600">Aguarde um momento</p>
          </div>
        )}
        {/* Sucesso */}
        {state === 'success' && (
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
                  d="M5 13l4 4L19 7"
                />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              Email verificado com sucesso!
            </h2>
            <p className="text-gray-600 mb-6">
              Sua conta foi ativada. Você será redirecionado para a página de login...
            </p>
            <Link href="/area-assinante/login?verified=true">
              <Button className="w-full bg-cyan-600 hover:bg-cyan-700">
                Ir para Login
              </Button>
            </Link>
          </div>
        )}
        {/* Erro */}
        {state === 'error' && (
          <div className="text-center">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <svg
                className="w-8 h-8 text-red-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              Erro na Verificação
            </h2>
            <p className="text-gray-600 mb-6">{errorMessage}</p>
            <div className="space-y-3">
              <Link href="/area-assinante/login">
                <Button variant="outline" className="w-full border-cyan-600 text-cyan-600">
                  Voltar para Login
                </Button>
              </Link>
              <p className="text-sm text-gray-600">
                Precisa de um novo link de verificação?{' '}
                <Link
                  href="/auth/resend-verification"
                  className="text-cyan-600 hover:text-cyan-700 font-medium"
                >
                  Clique aqui
                </Link>
              </p>
            </div>
          </div>
        )}
        {/* Token ausente */}
        {state === 'missing-token' && (
          <div className="text-center">
            <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <svg
                className="w-8 h-8 text-amber-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Link Inválido</h2>
            <p className="text-gray-600 mb-6">
              O link de verificação está incompleto ou inválido.
            </p>
            <Link href="/area-assinante/login">
              <Button className="w-full bg-cyan-600 hover:bg-cyan-700">
                Voltar para Login
              </Button>
            </Link>
          </div>
        )}
        {/* Footer */}
        <div className="mt-8 pt-6 border-t border-gray-200 text-center">
          <p className="text-sm text-gray-600 mb-2">Precisa de ajuda?</p>
          <a
            href={`https://wa.me/5533999898026?text=${encodeURIComponent(
              'Olá! Preciso de ajuda com a verificação de email no site SV Lentes.'
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
export default function VerifyEmailPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-gradient-to-br from-cyan-50 to-silver-50 flex items-center justify-center p-4">
          <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8">
            <div className="flex justify-center mb-8">
              <Logo />
            </div>
            <div className="text-center">
              <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-cyan-600 mx-auto mb-6"></div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                Verificando seu email...
              </h2>
              <p className="text-gray-600">Aguarde um momento</p>
            </div>
          </div>
        </div>
      }
    >
      <VerifyEmailContent />
    </Suspense>
  )
}
// Force dynamic rendering
export const dynamic = 'force-dynamic'