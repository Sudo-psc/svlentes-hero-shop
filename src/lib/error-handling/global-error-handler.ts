/**
 * Sistema global de tratamento de erros
 * Implementa captura de erros não tratados e recuperação automática
 */

import { checkConnectivity, checkExternalResources } from '../network/resilient-fetcher';
import { IndexedDBManager } from '../storage/indexeddb-manager';

export interface ErrorContext {
  url: string;
  userAgent: string;
  timestamp: number;
  online: boolean;
  errorSource: string;
  userId?: string;
  sessionId: string;
}

export interface ErrorReport {
  error: {
    name: string;
    message: string;
    stack?: string;
  };
  context: ErrorContext;
  severity: 'low' | 'medium' | 'high' | 'critical';
  category: 'network' | 'storage' | 'script' | 'promise' | 'unknown';
  recoverable: boolean;
  recoveryAttempted: boolean;
  recoverySucceeded?: boolean;
}

export class GlobalErrorHandler {
  private static instance: GlobalErrorHandler;
  private sessionId: string;
  private errorReports: ErrorReport[] = [];
  private maxReports = 50;
  private isRecovering = false;
  private recoveryCallbacks: Map<string, () => Promise<boolean>> = new Map();

  private constructor() {
    if (typeof window === 'undefined') return;

    this.sessionId = this.generateSessionId();
    this.setupGlobalHandlers();
    this.setupRecoveryStrategies();
  }

  static getInstance(): GlobalErrorHandler {
    if (!GlobalErrorHandler.instance) {
      GlobalErrorHandler.instance = new GlobalErrorHandler();
    }
    return GlobalErrorHandler.instance;
  }

  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private setupGlobalHandlers(): void {
    if (typeof window === 'undefined') return;

    // Capturar erros de JavaScript
    window.addEventListener('error', (event) => {
      this.handleError({
        name: event.error?.name || 'Error',
        message: event.message,
        stack: event.error?.stack
      }, {
        url: event.filename,
        line: event.lineno,
        column: event.colno
      }, 'script');
    });

    // Capturar promessas rejeitadas não tratadas
    window.addEventListener('unhandledrejection', (event) => {
      this.handleError({
        name: event.reason?.name || 'UnhandledRejection',
        message: event.reason?.message || String(event.reason),
        stack: event.reason?.stack
      }, {
        reason: event.reason
      }, 'promise');

      // Prevenir log no console se vamos tratar o erro
      if (this.shouldPreventDefaultLogging(event.reason)) {
        event.preventDefault();
      }
    });

    // Capturar erros de recursos (imagens, scripts, etc.)
    window.addEventListener('error', (event) => {
      if (event.target !== window) {
        this.handleError({
          name: 'ResourceError',
          message: `Failed to load resource: ${(event.target as HTMLElement)?.tagName || 'unknown'}`,
          stack: undefined
        }, {
          element: event.target,
          src: (event.target as HTMLImageElement)?.src || (event.target as HTMLScriptElement)?.src
        }, 'script');
      }
    }, true);
  }

  private setupRecoveryStrategies(): void {
    // Estratégia de recuperação para IndexedDB
    this.recoveryCallbacks.set('indexeddb', async () => {
      try {
        const diagnosis = await IndexedDBManager.diagnoseStorageIssues();

        if (!diagnosis.localStorageAvailable) {
          console.warn('[ErrorHandler] localStorage não disponível');
          return false;
        }

        // Limpar dados corrompidos se necessário
        if (diagnosis.quotaExceeded) {
          console.log('[ErrorHandler] Limpando cache devido à quota excedida');
          await this.clearExpiredData();
        }

        return true;
      } catch (error) {
        console.error('[ErrorHandler] Falha na recuperação de IndexedDB:', error);
        return false;
      }
    });

    // Estratégia de recuperação para scripts externos
    this.recoveryCallbacks.set('external_scripts', async () => {
      try {
        const resources = await checkExternalResources();

        if (!resources.stripe) {
          console.warn('[ErrorHandler] Stripe indisponível, ativando fallback');
          this.notifyFallbackActivation('stripe');
        }

        if (!resources.googleApis) {
          console.warn('[ErrorHandler] Google APIs indisponíveis');
        }

        return true;
      } catch (error) {
        console.error('[ErrorHandler] Falha na recuperação de scripts:', error);
        return false;
      }
    });

    // Estratégia de recuperação de conectividade
    this.recoveryCallbacks.set('connectivity', async () => {
      try {
        const connectivity = await checkConnectivity();

        if (!connectivity.online) {
          console.warn('[ErrorHandler] Sem conectividade, ativando modo offline');
          this.notifyOfflineMode();
        }

        return connectivity.online;
      } catch (error) {
        console.error('[ErrorHandler] Falha na verificação de conectividade:', error);
        return false;
      }
    });
  }

  private async handleError(
    error: { name: string; message: string; stack?: string },
    details: any = {},
    source: string = 'unknown'
  ): Promise<void> {
    if (this.isRecovering) {
      console.log('[ErrorHandler] Recuperação em andamento, ignorando erro temporário');
      return;
    }

    const context = this.createErrorContext();
    const category = this.categorizeError(error, details, source);
    const severity = this.assessSeverity(error, category);
    const recoverable = this.isRecoverable(error, category);

    const report: ErrorReport = {
      error,
      context,
      severity,
      category,
      recoverable,
      recoveryAttempted: false
    };

    this.addReport(report);

    // Log no console com formato apropriado
    this.logError(report);

    // Tentar recuperação se aplicável
    if (recoverable && !this.isRecovering) {
      await this.attemptRecovery(report);
    }

    // Notificar usuário se necessário
    if (severity === 'high' || severity === 'critical') {
      this.notifyUser(report);
    }
  }

  private createErrorContext(): ErrorContext {
    return {
      url: window.location.href,
      userAgent: navigator.userAgent,
      timestamp: Date.now(),
      online: navigator.onLine,
      errorSource: 'client',
      sessionId: this.sessionId
    };
  }

  private categorizeError(
    error: { name: string; message: string },
    details: any,
    source: string
  ): 'network' | 'storage' | 'script' | 'promise' | 'unknown' {
    const message = error.message.toLowerCase();
    const name = error.name.toLowerCase();

    // Erros de IndexedDB/Storage
    if (message.includes('indexeddb') ||
        message.includes('connection to indexed database') ||
        message.includes('quota') ||
        message.includes('storage') ||
        name.includes('quotaexceedederror')) {
      return 'storage';
    }

    // Erros de rede
    if (message.includes('network') ||
        message.includes('fetch') ||
        message.includes('failed to load') ||
        message.includes('503') ||
        message.includes('timeout') ||
        source === 'network') {
      return 'network';
    }

    // Erros de script/promessa
    if (source === 'script' || source === 'promise') {
      return source;
    }

    // Erros específicos do Stripe
    if (message.includes('stripe') || details.src?.includes('stripe.com')) {
      return 'network';
    }

    return 'unknown';
  }

  private assessSeverity(
    error: { name: string; message: string },
    category: string
  ): 'low' | 'medium' | 'high' | 'critical' {
    const message = error.message.toLowerCase();

    // Crítico - impede funcionalidade principal
    if (message.includes('503') && message.includes('stripe') ||
        message.includes('indexeddb') && message.includes('connection') ||
        message.includes('quota exceeded')) {
      return 'critical';
    }

    // Alto - afeta experiência mas não bloqueia tudo
    if (category === 'storage' ||
        message.includes('stripe') ||
        message.includes('failed to load')) {
      return 'high';
    }

    // Médio - erro recuperável
    if (category === 'network' ||
        message.includes('timeout')) {
      return 'medium';
    }

    // Baixo - erro menor
    return 'low';
  }

  private isRecoverable(error: { name: string; message: string }, category: string): boolean {
    const message = error.message.toLowerCase();

    if (category === 'storage') {
      return !message.includes('security error');
    }

    if (category === 'network') {
      return message.includes('503') ||
             message.includes('timeout') ||
             message.includes('failed to load');
    }

    if (category === 'script') {
      return message.includes('external') || message.includes('stripe');
    }

    return false;
  }

  private async attemptRecovery(report: ErrorReport): Promise<void> {
    if (this.isRecovering) return;

    this.isRecovering = true;
    report.recoveryAttempted = true;

    try {
      let recovered = false;

      // Tentar estratégia específica para o tipo de erro
      if (report.category === 'storage') {
        recovered = await this.recoveryCallbacks.get('indexeddb')?.() || false;
      } else if (report.category === 'network') {
        recovered = await this.recoveryCallbacks.get('external_scripts')?.() || false;
        if (!recovered) {
          recovered = await this.recoveryCallbacks.get('connectivity')?.() || false;
        }
      }

      report.recoverySucceeded = recovered;

      if (recovered) {
        console.log(`[ErrorHandler] Recuperação bem-sucedida para ${report.category}`);
      } else {
        console.warn(`[ErrorHandler] Recuperação falhou para ${report.category}`);
      }
    } catch (error) {
      console.error('[ErrorHandler] Erro durante tentativa de recuperação:', error);
      report.recoverySucceeded = false;
    } finally {
      this.isRecovering = false;
    }
  }

  private logError(report: ErrorReport): void {
    const emoji = this.getSeverityEmoji(report.severity);
    const category = this.getCategoryEmoji(report.category);

    console.group(`${emoji} ${category} Error Handler - ${report.severity.toUpperCase()}`);
    console.error('Error:', report.error.message);
    if (report.error.stack) {
      console.log('Stack:', report.error.stack);
    }
    console.log('Context:', {
      url: report.context.url,
      online: report.context.online,
      category: report.category,
      recoverable: report.recoverable
    });
    if (report.recoveryAttempted) {
      console.log(
        'Recovery:',
        report.recoverySucceeded ? '✅ Success' : '❌ Failed'
      );
    }
    console.groupEnd();
  }

  private getSeverityEmoji(severity: string): string {
    switch (severity) {
      case 'critical': return '🚨';
      case 'high': return '⚠️';
      case 'medium': return '⚡';
      case 'low': return 'ℹ️';
      default: return '❓';
    }
  }

  private getCategoryEmoji(category: string): string {
    switch (category) {
      case 'network': return '🌐';
      case 'storage': return '💾';
      case 'script': return '📜';
      case 'promise': return '🔄';
      default: return '❓';
    }
  }

  private shouldPreventDefaultLogging(reason: any): boolean {
    if (!reason) return false;

    const message = reason.message?.toLowerCase() || '';
    return message.includes('indexeddb') ||
           message.includes('stripe') ||
           message.includes('503');
  }

  private notifyUser(report: ErrorReport): void {
    // Implementado no sistema de notificações
    if (typeof window !== 'undefined' && (window as any).UserNotification) {
      (window as any).UserNotification.showError(
        this.getUserFriendlyMessage(report)
      );
    } else {
      // Fallback básico
      console.warn('UserNotification não disponível');
    }
  }

  private getUserFriendlyMessage(report: ErrorReport): string {
    switch (report.category) {
      case 'storage':
        return 'Ocorreu um problema com o armazenamento local. Tentando recuperar...';
      case 'network':
        if (report.error.message.includes('stripe')) {
          return 'O serviço de pagamentos está temporariamente indisponível. Tente novamente em alguns instantes.';
        }
        return 'Problemas de conectividade detectados. Verificando sua conexão...';
      case 'script':
        return 'Alguns recursos da página não puderam ser carregados. Funcionalidades básicas permanecem disponíveis.';
      default:
        return 'Ocorreu um erro inesperado. Estamos trabalhando para resolver.';
    }
  }

  private notifyFallbackActivation(service: string): void {
    if (typeof window === 'undefined') return;

    // Disparar evento para componentes ouvirem
    window.dispatchEvent(new CustomEvent('fallback-activated', {
      detail: { service, timestamp: Date.now() }
    }));
  }

  private notifyOfflineMode(): void {
    if (typeof window === 'undefined') return;

    // Disparar evento para componentes ouvirem
    window.dispatchEvent(new CustomEvent('offline-mode-activated', {
      detail: { timestamp: Date.now() }
    }));
  }

  private async clearExpiredData(): Promise<void> {
    try {
      // Limpar dados antigos do localStorage
      const keys = Object.keys(localStorage);
      const now = Date.now();
      const maxAge = 7 * 24 * 60 * 60 * 1000; // 7 dias

      for (const key of keys) {
        if (key.startsWith('svlentes_')) {
          try {
            const data = JSON.parse(localStorage.getItem(key) || '{}');
            if (data.timestamp && (now - data.timestamp) > maxAge) {
              localStorage.removeItem(key);
            }
          } catch {
            // Dado corrompido, remover
            localStorage.removeItem(key);
          }
        }
      }
    } catch (error) {
      console.error('[ErrorHandler] Falha ao limpar dados expirados:', error);
    }
  }

  private addReport(report: ErrorReport): void {
    this.errorReports.push(report);

    // Manter apenas os relatórios mais recentes
    if (this.errorReports.length > this.maxReports) {
      this.errorReports = this.errorReports.slice(-this.maxReports);
    }

    // Enviar para monitoramento (se configurado)
    this.sendToMonitoring(report);
  }

  private sendToMonitoring(report: ErrorReport): void {
    // Enviar para serviço de monitoramento se disponível
    if (typeof fetch !== 'undefined') {
      fetch('/api/errors', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(report)
      }).catch(() => {
        // Silenciosamente falhar se o monitoramento não estiver disponível
      });
    }
  }

  // Métodos públicos

  /**
   * Obtém relatório de erros da sessão atual
   */
  getErrorReports(): ErrorReport[] {
    return [...this.errorReports];
  }

  /**
   * Limpa relatórios de erro
   */
  clearReports(): void {
    this.errorReports = [];
  }

  /**
   * Força uma verificação de saúde do sistema
   */
  async checkSystemHealth(): Promise<{
    status: 'healthy' | 'degraded' | 'critical';
    issues: string[];
    recommendations: string[];
  }> {
    const issues: string[] = [];
    const recommendations: string[] = [];

    // Verificar conectividade
    try {
      const connectivity = await checkConnectivity();
      if (!connectivity.online) {
        issues.push('Sem conectividade com a internet');
        recommendations.push('Verifique sua conexão de rede');
      }
    } catch (error) {
      issues.push('Falha ao verificar conectividade');
    }

    // Verificar storage
    try {
      const diagnosis = await IndexedDBManager.diagnoseStorageIssues();
      if (!diagnosis.indexedDBSupported) {
        issues.push('IndexedDB não suportado');
      }
      if (diagnosis.quotaExceeded) {
        issues.push('Espaço de armazenamento esgotado');
        recommendations.push('Limpe o cache do navegador');
      }
    } catch (error) {
      issues.push('Problemas no armazenamento local');
    }

    // Verificar recursos externos
    try {
      const resources = await checkExternalResources();
      if (!resources.stripe) {
        issues.push('Stripe indisponível');
      }
      if (!resources.googleApis) {
        issues.push('Google APIs indisponíveis');
      }
    } catch (error) {
      issues.push('Falha ao verificar recursos externos');
    }

    const criticalIssues = issues.length;
    let status: 'healthy' | 'degraded' | 'critical';

    if (criticalIssues === 0) {
      status = 'healthy';
    } else if (criticalIssues <= 2) {
      status = 'degraded';
    } else {
      status = 'critical';
    }

    return { status, issues, recommendations };
  }
}

// Inicializar automaticamente
export const globalErrorHandler = GlobalErrorHandler.getInstance();

// Exportar instância para uso global
declare global {
  interface Window {
    errorHandler: GlobalErrorHandler;
  }
}

if (typeof window !== 'undefined') {
  window.errorHandler = globalErrorHandler;
}