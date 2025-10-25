import Link from 'next/link'
import {
  SignInButton,
  SignUpButton,
  SignedIn,
  SignedOut,
  UserButton,
} from '@clerk/nextjs'

export default function ClerkDemoPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-cyan-50 to-blue-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            Clerk Authentication Demo
          </h1>
          <p className="text-lg text-gray-600">
            Demonstração da integração do Clerk com Next.js App Router
          </p>
        </div>

        <div className="bg-white rounded-lg shadow-xl p-8 mb-6">
          <div className="flex flex-col items-center justify-center space-y-6">
            <SignedOut>
              <div className="text-center space-y-4">
                <h2 className="text-2xl font-semibold text-gray-800">
                  Você não está autenticado
                </h2>
                <p className="text-gray-600">
                  Faça login ou crie uma conta para continuar
                </p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <SignInButton mode="modal">
                    <button className="px-6 py-3 bg-cyan-600 text-white rounded-lg hover:bg-cyan-700 transition-colors font-medium">
                      Fazer Login
                    </button>
                  </SignInButton>
                  <SignUpButton mode="modal">
                    <button className="px-6 py-3 bg-gray-800 text-white rounded-lg hover:bg-gray-900 transition-colors font-medium">
                      Criar Conta
                    </button>
                  </SignUpButton>
                </div>
              </div>
            </SignedOut>

            <SignedIn>
              <div className="text-center space-y-4">
                <h2 className="text-2xl font-semibold text-gray-800">
                  Você está autenticado!
                </h2>
                <p className="text-gray-600">
                  Bem-vindo ao demo do Clerk
                </p>
                <div className="flex justify-center">
                  <UserButton
                    afterSignOutUrl="/"
                    appearance={{
                      elements: {
                        avatarBox: "w-12 h-12"
                      }
                    }}
                  />
                </div>
              </div>
            </SignedIn>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-xl font-semibold text-gray-800 mb-4">
            Sobre esta integração
          </h3>
          <div className="space-y-3 text-gray-700">
            <div className="flex items-start">
              <span className="text-cyan-600 mr-2">✓</span>
              <p>
                <strong>ClerkProvider</strong> foi adicionado ao layout raiz
              </p>
            </div>
            <div className="flex items-start">
              <span className="text-cyan-600 mr-2">✓</span>
              <p>
                <strong>clerkMiddleware()</strong> integrado com o middleware existente
              </p>
            </div>
            <div className="flex items-start">
              <span className="text-cyan-600 mr-2">✓</span>
              <p>
                Rotas protegidas: <code className="bg-gray-100 px-2 py-1 rounded">/area-assinante/*</code> e{' '}
                <code className="bg-gray-100 px-2 py-1 rounded">/api/assinante/*</code>
              </p>
            </div>
            <div className="flex items-start">
              <span className="text-cyan-600 mr-2">✓</span>
              <p>
                Componentes Clerk disponíveis: SignInButton, SignUpButton, UserButton, SignedIn, SignedOut
              </p>
            </div>
          </div>
        </div>

        <div className="mt-6 text-center">
          <Link
            href="/"
            className="inline-flex items-center text-cyan-600 hover:text-cyan-700 font-medium"
          >
            ← Voltar para a página inicial
          </Link>
        </div>
      </div>
    </div>
  )
}
