import { FirebaseError } from 'firebase/app'
import type { AuthErrorResolution } from '@/lib/auth/types'

const DEFAULT_RESOLUTION: AuthErrorResolution = {
  code: 'auth/unknown-error',
  label: 'Erro desconhecido',
  message: 'Ocorreu um erro inesperado durante a autenticação. Tente novamente em instantes.',
  category: 'unknown',
  severity: 'error',
  suggestedActions: ['retry', 'log-and-monitor']
}

const ERROR_RESOLUTIONS: Record<string, AuthErrorResolution> = {
  'auth/user-not-found': {
    code: 'auth/user-not-found',
    label: 'Usuário não encontrado',
    message: 'Não encontramos uma conta com este email. Verifique os dados ou cadastre-se.',
    category: 'credential',
    severity: 'info',
    suggestedActions: ['prompt-account-creation']
  },
  'auth/wrong-password': {
    code: 'auth/wrong-password',
    label: 'Senha incorreta',
    message: 'Senha inválida. Se esqueceu, você pode redefini-la agora.',
    category: 'credential',
    severity: 'warning',
    suggestedActions: ['prompt-password-reset']
  },
  'auth/invalid-credential': {
    code: 'auth/invalid-credential',
    label: 'Credenciais inválidas',
    message: 'As credenciais informadas expiraram ou são inválidas. Faça login novamente.',
    category: 'credential',
    severity: 'warning',
    suggestedActions: ['retry']
  },
  'auth/invalid-email': {
    code: 'auth/invalid-email',
    label: 'Email inválido',
    message: 'O formato do email não é válido. Corrija e tente novamente.',
    category: 'credential',
    severity: 'info',
    suggestedActions: []
  },
  'auth/user-disabled': {
    code: 'auth/user-disabled',
    label: 'Conta desativada',
    message: 'Esta conta foi desativada. Entre em contato com o suporte.',
    category: 'configuration',
    severity: 'error',
    suggestedActions: ['contact-support']
  },
  'auth/email-already-in-use': {
    code: 'auth/email-already-in-use',
    label: 'Email já utilizado',
    message: 'Este email já está cadastrado. Faça login ou recupere a senha.',
    category: 'credential',
    severity: 'info',
    suggestedActions: ['prompt-password-reset']
  },
  'auth/too-many-requests': {
    code: 'auth/too-many-requests',
    label: 'Muitas tentativas',
    message: 'Detectamos muitas tentativas seguidas. Aguarde alguns instantes antes de tentar novamente.',
    category: 'quota',
    severity: 'warning',
    suggestedActions: ['retry-with-backoff', 'log-and-monitor']
  },
  'auth/network-request-failed': {
    code: 'auth/network-request-failed',
    label: 'Erro de conexão OAuth',
    message: 'Não foi possível conectar ao serviço de autenticação Google. Verifique se as configurações OAuth estão corretas ou tente novamente.',
    category: 'network',
    severity: 'error',
    suggestedActions: ['check-oauth-config', 'retry', 'contact-support']
  },
  'auth/internal-error': {
    code: 'auth/internal-error',
    label: 'Erro interno Firebase',
    message: 'O serviço de autenticação está instável. Vamos tentar novamente automaticamente.',
    category: 'internal',
    severity: 'error',
    suggestedActions: ['retry-with-backoff', 'log-and-monitor', 'activate-backup-channel']
  },
  'auth/quota-exceeded': {
    code: 'auth/quota-exceeded',
    label: 'Limite excedido',
    message: 'O limite de solicitações foi atingido temporariamente. A requisição será reprocessada em instantes.',
    category: 'quota',
    severity: 'error',
    suggestedActions: ['queue-request', 'retry-with-backoff']
  },
  'auth/operation-not-allowed': {
    code: 'auth/operation-not-allowed',
    label: 'Operação não habilitada',
    message: 'Este método de login não está habilitado. Entre em contato com o suporte.',
    category: 'configuration',
    severity: 'warning',
    suggestedActions: ['contact-support']
  },
  'auth/popup-blocked': {
    code: 'auth/popup-blocked',
    label: 'Popup bloqueado',
    message: 'Precisamos liberar popups para continuar com o login social.',
    category: 'credential',
    severity: 'info',
    suggestedActions: []
  },
  'auth/popup-closed-by-user': {
    code: 'auth/popup-closed-by-user',
    label: 'Popup fechado',
    message: 'O popup de login foi fechado antes da conclusão. Tente novamente.',
    category: 'credential',
    severity: 'info',
    suggestedActions: []
  },
  'auth/user-token-expired': {
    code: 'auth/user-token-expired',
    label: 'Sessão expirada',
    message: 'Sua sessão expirou. Faça login novamente.',
    category: 'credential',
    severity: 'info',
    suggestedActions: ['retry']
  },
  'auth/requires-recent-login': {
    code: 'auth/requires-recent-login',
    label: 'Login recente necessário',
    message: 'Por segurança, faça login novamente para continuar.',
    category: 'credential',
    severity: 'info',
    suggestedActions: ['retry']
  }
}

export function resolveAuthError(error: unknown): AuthErrorResolution {
  if (error instanceof FirebaseError) {
    return ERROR_RESOLUTIONS[error.code] ?? {
      ...DEFAULT_RESOLUTION,
      code: error.code,
      message: error.message || DEFAULT_RESOLUTION.message
    }
  }

  if (error instanceof Error && 'code' in error && typeof (error as any).code === 'string') {
    const code = (error as any).code as string
    return ERROR_RESOLUTIONS[code] ?? {
      ...DEFAULT_RESOLUTION,
      code,
      message: error.message || DEFAULT_RESOLUTION.message
    }
  }

  return DEFAULT_RESOLUTION
}

