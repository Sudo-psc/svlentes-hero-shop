/**
 * Hook para requisições seguras com retry logic e tratamento de erros
 * Fornece resiliência para chamadas de API com feedback visual
 */
'use client';

import { useState, useCallback, useRef } from 'react';
import { apiClient } from '@/lib/api-client';

export function useSafeRequest<T>() {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);

  // Ref para evitar race conditions
  const requestIdRef = useRef<string>('');

  const execute = useCallback(async (
    endpoint: string,
    options?: RequestInit,
    customMaxRetries?: number
  ): Promise<T | null> => {
    const requestId = Math.random().toString(36).substr(2, 9);
    requestIdRef.current = requestId;

    setLoading(true);
    setError(null);

    try {
      console.log(`🚀 Iniciando requisição [${requestId}]:`, { endpoint, options });

      const result = await apiClient.requestWithRetry<T>(
        endpoint,
        options,
        customMaxRetries || 3
      );

      // Verificar se ainda é a requisição atual
      if (requestIdRef.current !== requestId) {
        console.log(`🚫 Requisição [${requestId}] ignorada - requisição mais recente em andamento`);
        return null;
      }

      console.log(`✅ Requisição [${requestId}] bem-sucedida:`, result);
      setData(result);
      setRetryCount(0);
      return result;

    } catch (err) {
      // Verificar se ainda é a requisição atual
      if (requestIdRef.current !== requestId) {
        console.log(`🚫 Erro em requisição [${requestId}] ignorado - requisição mais recente em andamento`);
        return null;
      }

      const error = err as Error;
      const errorMessage = error.message;

      console.error(`❌ Erro na requisição [${requestId}]:`, {
        endpoint,
        error: errorMessage,
        stack: error.stack,
        userAgent: navigator.userAgent,
        timestamp: new Date().toISOString()
      });

      setError(errorMessage);
      setRetryCount(prev => prev + 1);

      // Log para monitoramento
      logErrorToMonitoring(error, { endpoint, options, requestId });

      throw error;
    } finally {
      // Verificar se ainda é a requisição atual
      if (requestIdRef.current === requestId) {
        setLoading(false);
      }
    }
  }, []);

  const reset = useCallback(() => {
    setData(null);
    setError(null);
    setLoading(false);
    setRetryCount(0);
    requestIdRef.current = '';
  }, []);

  const retry = useCallback(() => {
    if (error && retryCount < 3) {
      // Re-executar última requisição (endpoint precisa ser armazenado)
      console.log(`🔄 Tentando retry (${retryCount + 1}/3)...`);
      // Implementação específica dependendo do caso de uso
    }
  }, [error, retryCount]);

  return {
    data,
    loading,
    error,
    retryCount,
    execute,
    reset,
    retry,
    canRetry: retryCount < 3 && !!error
  };
}

// Função para enviar erros para monitoring
function logErrorToMonitoring(error: Error, context: any) {
  const errorData = {
    message: error.message,
    stack: error.stack,
    context,
    timestamp: new Date().toISOString(),
    url: typeof window !== 'undefined' ? window.location.href : null,
    userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : null,
    sessionId: typeof window !== 'undefined' ? window.sessionStorage.getItem('sessionId') : null
  };

  // Enviar para Sentry (se disponível)
  if (typeof window !== 'undefined' && (window as any).Sentry) {
    (window as any).Sentry.captureException(error, { extra: context });
  }

  // Fallback: localStorage para debug
  try {
    const errors = JSON.parse(localStorage.getItem('api-errors') || '[]');
    errors.push(errorData);

    // Manter apenas últimos 50 erros
    if (errors.length > 50) {
      errors.splice(0, errors.length - 50);
    }

    localStorage.setItem('api-errors', JSON.stringify(errors));
  } catch (e) {
    console.warn('Não foi possível salvar erro no localStorage:', e);
  }

  // Sempre log no console para desenvolvimento
  if (process.env.NODE_ENV === 'development') {
    console.group('🚨 API Error Logged');
    console.error('Error:', error);
    console.error('Context:', context);
    console.error('Full Data:', errorData);
    console.groupEnd();
  }
}

// Hook específico para operações CRUD
export function useCrudRequest<T>(baseUrl: string) {
  const safeRequest = useSafeRequest<T>();

  const create = useCallback(async (data: any) => {
    return safeRequest.execute(baseUrl, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }, [baseUrl, safeRequest.execute]);

  const read = useCallback(async (id?: string) => {
    const endpoint = id ? `${baseUrl}/${id}` : baseUrl;
    return safeRequest.execute(endpoint, { method: 'GET' });
  }, [baseUrl, safeRequest.execute]);

  const update = useCallback(async (id: string, data: any) => {
    return safeRequest.execute(`${baseUrl}/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }, [baseUrl, safeRequest.execute]);

  const remove = useCallback(async (id: string) => {
    return safeRequest.execute(`${baseUrl}/${id}`, { method: 'DELETE' });
  }, [baseUrl, safeRequest.execute]);

  return {
    ...safeRequest,
    create,
    read,
    update,
    delete: remove
  };
}