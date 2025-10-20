'use client'
import React, { useState } from 'react'
import { backupAuth, AuthMethod, AuthResult } from '@/lib/backup-auth'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  Alert,
  AlertDescription
} from '@/components/ui/alert'
import {
  WifiOff,
  Smartphone,
  Mail,
  Key,
  AlertTriangle,
  CheckCircle,
  RefreshCw,
  Shield,
  ArrowRight
} from 'lucide-react'
interface BackupAuthModalProps {
  isOpen: boolean
  onClose: () => void
  onAuthSuccess: (user: any) => void
  currentMethod?: string
}
export function BackupAuthModal({ isOpen, onClose, onAuthSuccess, currentMethod }: BackupAuthModalProps) {
  const [selectedMethod, setSelectedMethod] = useState<AuthMethod | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [authResult, setAuthResult] = useState<AuthResult | null>(null)
  const [step, setStep] = useState<'method' | 'credentials' | 'verification' | 'success'>('method')
  const availableMethods = backupAuth.getAvailableMethods()
  // Reset state quando modal abrir
  React.useEffect(() => {
    if (isOpen) {
      setSelectedMethod(null)
      setLoading(false)
      setError(null)
      setAuthResult(null)
      setStep('method')
      // Selecionar método atual se fornecido
      if (currentMethod) {
        const method = availableMethods.find(m => m.type === currentMethod)
        if (method) {
          setSelectedMethod(method)
          setStep('credentials')
        }
      }
    }
  }, [isOpen, currentMethod, availableMethods])
  const handleMethodSelect = (method: AuthMethod) => {
    setSelectedMethod(method)
    setStep('credentials')
    setError(null)
  }
  const handleAuth = async (credentials: any) => {
    if (!selectedMethod) return
    setLoading(true)
    setError(null)
    try {
      const result = await backupAuth.authenticate(selectedMethod.type, credentials)
      setAuthResult(result)
      if (result.success) {
        setStep('success')
        onAuthSuccess(result.user)
      } else if (result.requiresVerification) {
        setStep('verification')
      } else {
        setError(result.error || 'Falha na autenticação')
      }
    } catch (error) {
      setError((error as Error).message)
    } finally {
      setLoading(false)
    }
  }
  const handleRetry = () => {
    setStep('method')
    setSelectedMethod(null)
    setError(null)
    setAuthResult(null)
  }
  const handleBack = () => {
    if (step === 'verification') {
      setStep('credentials')
    } else if (step === 'credentials') {
      setStep('method')
      setSelectedMethod(null)
    }
    }
  const getMethodIcon = (method: AuthMethod) => {
    switch (method.type) {
      case 'firebase':
        return <span className="text-lg">{method.icon}</span>
      case 'phone':
        return <Smartphone className="w-5 h-5" />
      case 'email':
        return <Mail className="w-5 h-5" />
      case 'token':
        return <Key className="w-5 h-5" />
      default:
        return <Shield className="w-5 h-5" />
    }
  }
  const renderMethodSelection = () => (
    <div className="space-y-4">
      <div className="text-center mb-6">
        <WifiOff className="w-12 h-12 text-yellow-600 mx-auto mb-4" />
        <h3 className="text-lg font-semibold">Alternar Método de Acesso</h3>
        <p className="text-sm text-gray-600">
          Escolha uma alternativa para acessar sua conta
        </p>
      </div>
      <div className="space-y-2">
        {availableMethods.map((method) => (
          <Button
            key={method.type}
            variant="outline"
            className="w-full justify-start h-auto p-4"
            onClick={() => handleMethodSelect(method)}
            disabled={loading}
          >
            <div className="flex items-center gap-3 w-full">
              {getMethodIcon(method)}
              <div className="flex-1 text-left">
                <div className="font-medium">{method.name}</div>
                <div className="text-sm text-gray-600">{method.description}</div>
                <div className="mt-1">
                  <Badge variant={method.priority === 1 ? 'default' : 'secondary'}>
                    {method.priority === 1 ? 'Recomendado' : 'Alternativa'}
                  </Badge>
                </div>
              </div>
              <ArrowRight className="w-4 h-4 text-gray-400" />
            </div>
          </Button>
        ))}
      </div>
    </div>
  )
  const renderCredentialsForm = () => {
    if (!selectedMethod) return null
    switch (selectedMethod.type) {
      case 'phone':
        return (
          <div className="space-y-4">
            <div>
              <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-2">
                Número de Telefone
              </label>
              <Input
                id="phone"
                type="tel"
                placeholder="(33) 99999-9999"
                className="w-full"
              />
            </div>
            <Button
              onClick={() => handleAuth({ phone: '+5533999898026' })}
              disabled={loading}
              className="w-full"
            >
              {loading ? (
                <>
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                  Enviando código...
                </>
              ) : (
                'Receber Código via WhatsApp'
              )}
            </Button>
          </div>
        )
      case 'email':
        return (
          <div className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                Email
              </label>
              <Input
                id="email"
                type="email"
                placeholder="seu@email.com"
                className="w-full"
              />
            </div>
            <Button
              onClick={() => handleAuth({ email: 'user@example.com' })}
              disabled={loading}
              className="w-full"
            >
              {loading ? (
                <>
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                  Enviando código...
                </>
              ) : (
                'Receber Código por Email'
              )}
            </Button>
          </div>
        )
      case 'token':
        return (
          <div className="space-y-4">
            <div>
              <label htmlFor="token" className="block text-sm font-medium text-gray-700 mb-2">
                Token de Acesso
              </label>
              <Input
                id="token"
                type="text"
                placeholder="Seu token único de acesso"
                className="w-full"
              />
            </div>
            <Button
              onClick={() => handleAuth({ token: 'user-token-123' })}
              disabled={loading}
              className="w-full"
            >
              {loading ? (
                <>
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                  Verificando token...
                </>
              ) : (
                'Acessar com Token'
              )}
            </Button>
          </div>
        )
      default:
        return null
    }
  }
  const renderVerificationForm = () => {
    if (!authResult?.verificationData) return null
    return (
      <div className="space-y-4">
        <div className="text-center mb-6">
          <CheckCircle className="w-12 h-12 text-green-600 mx-auto mb-4" />
          <h3 className="text-lg font-semibold">Verifique Seu Acesso</h3>
          <p className="text-sm text-gray-600">
            Enviamos um código de verificação para o seu {authResult.verificationData.method === 'phone' ? 'WhatsApp' : 'email'}
          </p>
        </div>
        {authResult.verificationData.method === 'phone' && (
          <Alert>
            <AlertDescription>
              Digite o código de 6 dígitos que você recebeu no WhatsApp.
            </AlertDescription>
          </Alert>
        )}
        {authResult.verificationData.method === 'email' && (
          <Alert>
            <AlertDescription>
              Digite o código de 6 dígitos que você recebeu no seu email.
            </AlertDescription>
          </Alert>
        )}
        <div>
          <label htmlFor="code" className="block text-sm font-medium text-gray-700 mb-2">
            Código de Verificação
          </label>
          <Input
            id="code"
            type="text"
            placeholder="000000"
            maxLength={6}
            className="w-full text-center text-lg font-mono tracking-widest"
          />
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={handleBack}
            disabled={loading}
            className="flex-1"
          >
            Voltar
          </Button>
          <Button
            onClick={() => {
              const codeInput = document.getElementById('code') as HTMLInputElement
              if (codeInput) {
                const code = codeInput.value
                if (authResult.verificationData.method === 'phone') {
                  handleAuth({ phone: '+5533999898026', code })
                } else if (authResult.verificationData.method === 'email') {
                  handleAuth({ email: 'user@example.com', code })
                }
              }
            }}
            disabled={loading}
            className="flex-1"
          >
            {loading ? (
              <>
                <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                Verificando...
              </>
            ) : (
              'Verificar'
            )}
          </Button>
        </div>
        <div className="text-center">
          <button
            type="button"
            onClick={handleRetry}
            className="text-sm text-blue-600 hover:text-blue-800 underline"
          >
            Tentar outro método
          </button>
        </div>
      </div>
    )
  }
  const renderSuccess = () => (
    <div className="text-center space-y-4">
      <CheckCircle className="w-16 h-16 text-green-600 mx-auto" />
      <div>
        <h3 className="text-lg font-semibold text-green-800">Acesso Restaurado!</h3>
        <p className="text-sm text-green-700">
          Você acessou sua conta com sucesso usando {selectedMethod?.name}.
        </p>
      </div>
      <Button onClick={onClose} className="w-full">
        Continuar
      </Button>
    </div>
  )
  const renderContent = () => {
    switch (step) {
      case 'method':
        return renderMethodSelection()
      case 'credentials':
        return renderCredentialsForm()
      case 'verification':
        return renderVerificationForm()
      case 'success':
        return renderSuccess()
      default:
        return renderMethodSelection()
    }
  }
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-blue-600" />
            Acesso Alternativo
          </DialogTitle>
          <DialogDescription>
            Sistema de acesso alternativo com múltiplos métodos de verificação
          </DialogDescription>
        </DialogHeader>
        {error && (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        <div className="py-4">
          {renderContent()}
        </div>
      </DialogContent>
    </Dialog>
  )
}