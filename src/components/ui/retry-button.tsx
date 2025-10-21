/**
 * Componente RetryButton para UI resiliente com tentativas automáticas
 * Oferece feedback visual e controle sobre tentativas de retry
 */
'use client';

import { useState, useCallback } from 'react';
import { Button } from './button';
import { Loader2, RefreshCw, AlertCircle, CheckCircle } from 'lucide-react';

interface RetryButtonProps {
  onRetry: () => Promise<void>;
  maxRetries?: number;
  disabled?: boolean;
  className?: string;
  variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link';
  size?: 'default' | 'sm' | 'lg' | 'icon';
  showProgress?: boolean;
  autoRetry?: boolean;
  autoRetryDelay?: number;
}

export function RetryButton({
  onRetry,
  maxRetries = 3,
  disabled = false,
  className = '',
  variant = 'outline',
  size = 'default',
  showProgress = true,
  autoRetry = false,
  autoRetryDelay = 5000
}: RetryButtonProps) {
  const [attempts, setAttempts] = useState(0);
  const [isRetrying, setIsRetrying] = useState(false);
  const [retryStatus, setRetryStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');

  const handleRetry = useCallback(async () => {
    if (isRetrying || attempts >= maxRetries) return;

    setIsRetrying(true);
    setRetryStatus('loading');

    try {
      await onRetry();
      setRetryStatus('success');
      setAttempts(0); // Reset on success

      // Reset status após delay
      setTimeout(() => setRetryStatus('idle'), 2000);

    } catch (error) {
      setRetryStatus('error');
      const newAttempts = attempts + 1;
      setAttempts(newAttempts);

      console.error(`Retry attempt ${newAttempts}/${maxRetries} failed:`, error);

      // Auto retry se configurado e ainda não atingiu o limite
      if (autoRetry && newAttempts < maxRetries) {
        setTimeout(() => {
          handleRetry();
        }, autoRetryDelay);
      }
    } finally {
      setIsRetrying(false);
    }
  }, [attempts, maxRetries, isRetrying, onRetry, autoRetry, autoRetryDelay]);

  const handleManualReset = useCallback(() => {
    setAttempts(0);
    setRetryStatus('idle');
  }, []);

  // Renderizar estado de sucesso
  if (retryStatus === 'success') {
    return (
      <div className={`flex items-center gap-2 text-green-600 ${className}`}>
        <CheckCircle className="h-4 w-4" />
        <span className="text-sm">Sucesso!</span>
      </div>
    );
  }

  // Renderizar estado de limite de tentativas atingido
  if (attempts >= maxRetries) {
    return (
      <div className={`space-y-2 ${className}`}>
        <div className="flex items-center gap-2 text-red-600">
          <AlertCircle className="h-4 w-4" />
          <span className="text-sm font-medium">
            Falha após {maxRetries} tentativas
          </span>
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={handleManualReset}
          className="w-full"
        >
          <RefreshCw className="h-4 w-4 mr-2" />
          Tentar novamente
        </Button>

        {showProgress && (
          <div className="text-xs text-gray-500">
            Todas as tentativas falharam. Verifique sua conexão ou tente novamente mais tarde.
          </div>
        )}
      </div>
    );
  }

  // Renderizar botão de retry principal
  const isLoading = isRetrying || retryStatus === 'loading';
  const buttonLabel = isLoading
    ? 'Tentando...'
    : `Tentar novamente${attempts > 0 ? ` (${attempts}/${maxRetries})` : ''}`;

  return (
    <div className={`space-y-2 ${className}`}>
      <Button
        onClick={handleRetry}
        disabled={disabled || isLoading}
        variant={retryStatus === 'error' ? 'destructive' : variant}
        size={size}
        className="relative"
      >
        {isLoading ? (
          <>
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            {buttonLabel}
          </>
        ) : (
          <>
            <RefreshCw className={`h-4 w-4 mr-2 ${attempts > 0 ? 'animate-pulse' : ''}`} />
            {buttonLabel}
          </>
        )}
      </Button>

      {/* Progress indicator */}
      {showProgress && attempts > 0 && (
        <div className="space-y-1">
          <div className="flex justify-between text-xs text-gray-600">
            <span>Tentativas: {attempts}/{maxRetries}</span>
            {autoRetry && attempts < maxRetries && (
              <span className="text-blue-600">
                Auto retry em {autoRetryDelay / 1000}s...
              </span>
            )}
          </div>

          {/* Progress bar */}
          <div className="w-full bg-gray-200 rounded-full h-1.5">
            <div
              className={`h-1.5 rounded-full transition-all duration-300 ${
                retryStatus === 'error'
                  ? 'bg-red-500'
                  : attempts === 0
                  ? 'bg-blue-500'
                  : 'bg-yellow-500'
              }`}
              style={{ width: `${Math.min((attempts / maxRetries) * 100, 100)}%` }}
            />
          </div>
        </div>
      )}

      {/* Error message */}
      {retryStatus === 'error' && (
        <div className="text-xs text-red-600 bg-red-50 p-2 rounded border border-red-200">
          Falha na tentativa {attempts}.
          {attempts < maxRetries && (
            <span>
              {' '}Você tem {maxRetries - attempts} tentativa(s) restante(s).
            </span>
          )}
        </div>
      )}
    </div>
  );
}

// Component simplificado para uso rápido
export function SimpleRetryButton({
  onRetry,
  attempts = 0,
  maxAttempts = 3
}: {
  onRetry: () => void;
  attempts: number;
  maxAttempts?: number;
}) {
  const isDisabled = attempts >= maxAttempts;

  if (isDisabled) {
    return (
      <div className="text-sm text-gray-500">
        Máximo de tentativas atingido ({maxAttempts})
      </div>
    );
  }

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={onRetry}
      disabled={isDisabled}
    >
      <RefreshCw className="h-4 w-4 mr-2" />
      Tentar novamente ({attempts}/{maxAttempts})
    </Button>
  );
}