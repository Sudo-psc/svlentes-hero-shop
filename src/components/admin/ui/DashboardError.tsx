'use client'

import { AlertTriangle, RefreshCw, AlertCircle, Home } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Badge } from '@/components/ui/Badge'
import { cn } from '@/lib/utils'

interface DashboardErrorProps {
  error: string | null
  onRetry?: () => void
  onGoHome?: () => void
  isRetrying?: boolean
  variant?: 'full' | 'inline' | 'minimal'
  className?: string
}

export function DashboardError({
  error,
  onRetry,
  onGoHome,
  isRetrying = false,
  variant = 'full',
  className
}: DashboardErrorProps) {
  if (!error) return null

  const getErrorType = (errorMessage: string) => {
    if (errorMessage.includes('Não autorizado') || errorMessage.includes('401')) {
      return 'auth'
    }
    if (errorMessage.includes('permissão') || errorMessage.includes('403')) {
      return 'permission'
    }
    if (errorMessage.includes('rede') || errorMessage.includes('network') || errorMessage.includes('fetch')) {
      return 'network'
    }
    if (errorMessage.includes('servidor') || errorMessage.includes('500')) {
      return 'server'
    }
    return 'general'
  }

  const errorType = getErrorType(error)

  const getErrorIcon = () => {
    switch (errorType) {
      case 'auth':
      case 'permission':
        return AlertCircle
      case 'network':
      case 'server':
        return AlertTriangle
      default:
        return AlertTriangle
    }
  }

  const getErrorTitle = () => {
    switch (errorType) {
      case 'auth':
        return 'Erro de Autenticação'
      case 'permission':
        return 'Sem Permissão'
      case 'network':
        return 'Erro de Conexão'
      case 'server':
        return 'Erro no Servidor'
      default:
        return 'Erro Inesperado'
    }
  }

  const getErrorDescription = () => {
    switch (errorType) {
      case 'auth':
        return 'Sua sessão expirou ou você não está autenticado. Faça login novamente para continuar.'
      case 'permission':
        return 'Você não tem permissão para acessar esta funcionalidade. Entre em contato com o administrador.'
      case 'network':
        return 'Não foi possível conectar ao servidor. Verifique sua conexão com a internet e tente novamente.'
      case 'server':
        return 'O servidor encontrou um erro interno. Nossa equipe já foi notificada e está trabalhando na solução.'
      default:
        return 'Ocorreu um erro inesperado. Tente novamente e, se o problema persistir, entre em contato com o suporte.'
    }
  }

  const getErrorActions = () => {
    switch (errorType) {
      case 'auth':
        return (
          <Button onClick={() => window.location.href = '/admin/login'}>
            Fazer Login
          </Button>
        )
      case 'permission':
        return (
          <div className="flex gap-2">
            <Button variant="outline" onClick={onGoHome}>
              <Home className="h-4 w-4 mr-2" />
              Ir para Início
            </Button>
            <Button onClick={() => window.location.href = 'mailto:support@svlentes.com.br'}>
              Contactar Suporte
            </Button>
          </div>
        )
      default:
        return (
          <div className="flex gap-2">
            {onRetry && (
              <Button onClick={onRetry} disabled={isRetrying}>
                <RefreshCw className={cn("h-4 w-4 mr-2", isRetrying && "animate-spin")} />
                {isRetrying ? 'Tentando...' : 'Tentar Novamente'}
              </Button>
            )}
            {onGoHome && (
              <Button variant="outline" onClick={onGoHome}>
                <Home className="h-4 w-4 mr-2" />
                Página Inicial
              </Button>
            )}
          </div>
        )
    }
  }

  const ErrorIcon = getErrorIcon()

  if (variant === 'minimal') {
    return (
      <div className={cn("flex items-center gap-2 p-3 rounded-lg border border-destructive/20 bg-destructive/5", className)}>
        <ErrorIcon className="h-4 w-4 text-destructive" />
        <span className="text-sm text-destructive">{error}</span>
        {onRetry && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onRetry}
            disabled={isRetrying}
            className="h-auto p-1 ml-auto"
          >
            <RefreshCw className={cn("h-3 w-3", isRetrying && "animate-spin")} />
          </Button>
        )}
      </div>
    )
  }

  if (variant === 'inline') {
    return (
      <Alert className={className}>
        <ErrorIcon className="h-4 w-4" />
        <AlertTitle className="flex items-center gap-2">
          {getErrorTitle()}
          <Badge variant="destructive" className="text-xs">
            {errorType === 'auth' ? '401' :
             errorType === 'permission' ? '403' :
             errorType === 'network' ? 'Network' :
             errorType === 'server' ? '500' : 'Error'}
          </Badge>
        </AlertTitle>
        <AlertDescription className="mt-2">
          <div className="space-y-2">
            <p>{getErrorDescription()}</p>
            <p className="text-xs text-muted-foreground font-mono bg-muted p-2 rounded">
              {error}
            </p>
            {getErrorActions()}
          </div>
        </AlertDescription>
      </Alert>
    )
  }

  return (
    <div className={cn("flex items-center justify-center min-h-96", className)}>
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto w-12 h-12 rounded-full bg-destructive/10 flex items-center justify-center mb-4">
            <ErrorIcon className="h-6 w-6 text-destructive" />
          </div>
          <CardTitle className="flex items-center justify-center gap-2">
            {getErrorTitle()}
            <Badge variant="destructive" className="text-xs">
              {errorType === 'auth' ? '401' :
               errorType === 'permission' ? '403' :
               errorType === 'network' ? 'Network' :
               errorType === 'server' ? '500' : 'Error'}
            </Badge>
          </CardTitle>
          <CardDescription>
            {getErrorDescription()}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Detalhes técnicos */}
          <details className="text-xs">
            <summary className="cursor-pointer text-muted-foreground hover:text-foreground">
              Ver detalhes técnicos
            </summary>
            <div className="mt-2 p-2 bg-muted rounded font-mono break-all">
              {error}
            </div>
          </details>

          {/* Ações */}
          <div className="flex flex-col gap-2">
            {getErrorActions()}
          </div>

          {/* Sugestões adicionais */}
          <div className="text-xs text-muted-foreground space-y-1">
            <p>• Verifique sua conexão com a internet</p>
            <p>• Limpe o cache e cookies do navegador</p>
            <p>• Tente recarregar a página (F5)</p>
            {errorType === 'permission' && (
              <p>• Entre em contato com o administrador do sistema</p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

// Componente para erro de carregamento parcial (alguns dados falharam)
export function PartialDataError({
  errors,
  onRetry,
  className
}: {
  errors: string[]
  onRetry?: () => void
  className?: string
}) {
  if (errors.length === 0) return null

  return (
    <Alert className={cn("border-yellow-200 bg-yellow-50 dark:border-yellow-800 dark:bg-yellow-900/20", className)}>
      <AlertTriangle className="h-4 w-4 text-yellow-600" />
      <AlertTitle className="text-yellow-800 dark:text-yellow-400">
        Dados Parciais Carregados
      </AlertTitle>
      <AlertDescription className="text-yellow-700 dark:text-yellow-300">
        <div className="space-y-2">
          <p>
            Alguns dados não puderam ser carregados. O dashboard está funcionando com informações parciais.
          </p>

          <details className="text-xs">
            <summary className="cursor-pointer">Ver erros ({errors.length})</summary>
            <ul className="mt-2 space-y-1">
              {errors.map((error, index) => (
                <li key={index} className="text-muted-foreground">
                  • {error}
                </li>
              ))}
            </ul>
          </details>

          {onRetry && (
            <Button
              variant="outline"
              size="sm"
              onClick={onRetry}
              className="mt-2"
            >
              <RefreshCw className="h-3 w-3 mr-2" />
              Tentar Carregar Novamente
            </Button>
          )}
        </div>
      </AlertDescription>
    </Alert>
  )
}

// Componente para erro de rede específico
export function NetworkError({ onRetry, isRetrying }: { onRetry?: () => void; isRetrying?: boolean }) {
  return (
    <Card className="border-orange-200 bg-orange-50 dark:border-orange-800 dark:bg-orange-900/20">
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <div className="w-8 h-8 rounded-full bg-orange-100 dark:bg-orange-900/50 flex items-center justify-center flex-shrink-0">
            <AlertTriangle className="h-4 w-4 text-orange-600" />
          </div>
          <div className="flex-1 min-w-0">
            <h4 className="text-sm font-medium text-orange-800 dark:text-orange-400">
              Problema de Conexão
            </h4>
            <p className="text-xs text-orange-700 dark:text-orange-300 mt-1">
              Não foi possível carregar os dados mais recentes. Verificando sua conexão...
            </p>
            {onRetry && (
              <Button
                variant="outline"
                size="sm"
                onClick={onRetry}
                disabled={isRetrying}
                className="mt-2 h-7 text-xs"
              >
                <RefreshCw className={cn("h-3 w-3 mr-1", isRetrying && "animate-spin")} />
                {isRetrying ? 'Verificando...' : 'Tentar Novamente'}
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

// Componente para estados offline
export function OfflineState({ onRetry }: { onRetry?: () => void }) {
  return (
    <Card className="border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-900/20">
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <div className="w-8 h-8 rounded-full bg-red-100 dark:bg-red-900/50 flex items-center justify-center flex-shrink-0">
            <AlertCircle className="h-4 w-4 text-red-600" />
          </div>
          <div className="flex-1 min-w-0">
            <h4 className="text-sm font-medium text-red-800 dark:text-red-400">
              Modo Offline
            </h4>
            <p className="text-xs text-red-700 dark:text-red-300 mt-1">
              Você está offline. Alguns recursos podem não estar disponíveis.
            </p>
            {onRetry && (
              <Button
                variant="outline"
                size="sm"
                onClick={onRetry}
                className="mt-2 h-7 text-xs"
              >
                <RefreshCw className="h-3 w-3 mr-1" />
                Verificar Conexão
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}