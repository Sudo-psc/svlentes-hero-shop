/**
 * Sistema de notificações amigáveis para usuário final
 * Implementa notificações contextuais e ações corretivas
 */

export interface NotificationOptions {
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  message?: string;
  duration?: number;
  persistent?: boolean;
  actions?: NotificationAction[];
  icon?: string;
  position?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left' | 'top-center' | 'bottom-center';
}

export interface NotificationAction {
  label: string;
  action: () => void | Promise<void>;
  primary?: boolean;
  destructive?: boolean;
}

interface ActiveNotification {
  id: string;
  element: HTMLElement;
  timeout?: number;
  options: NotificationOptions;
}

export class UserNotification {
  private static instance: UserNotification;
  private container: HTMLElement | null = null;
  private notifications: Map<string, ActiveNotification> = new Map();
  private notificationId = 0;
  private defaultPosition: NotificationOptions['position'] = 'top-right';

  private constructor() {
    if (typeof document === 'undefined') return;

    this.createContainer();
    this.setupGlobalStyles();
  }

  static getInstance(): UserNotification {
    if (!UserNotification.instance) {
      UserNotification.instance = new UserNotification();
    }
    return UserNotification.instance;
  }

  private createContainer(): void {
    if (typeof document === 'undefined') return;

    this.container = document.createElement('div');
    this.container.id = 'user-notifications-container';
    this.container.className = 'fixed z-50 pointer-events-none';
    document.body.appendChild(this.container);
  }

  private setupGlobalStyles(): void {
    if (typeof document === 'undefined') return;

    const styleId = 'user-notification-styles';
    if (document.getElementById(styleId)) return;

    const style = document.createElement('style');
    style.id = styleId;
    style.textContent = `
      #user-notifications-container {
        inset: 0;
        display: flex;
        flex-direction: column;
        gap: 0.75rem;
        padding: 1rem;
        pointer-events: none;
      }

      #user-notifications-container.top-right {
        align-items: flex-end;
        justify-content: flex-start;
      }

      #user-notifications-container.top-left {
        align-items: flex-start;
        justify-content: flex-start;
      }

      #user-notifications-container.top-center {
        align-items: center;
        justify-content: flex-start;
      }

      #user-notifications-container.bottom-right {
        align-items: flex-end;
        justify-content: flex-end;
      }

      #user-notifications-container.bottom-left {
        align-items: flex-start;
        justify-content: flex-end;
      }

      #user-notifications-container.bottom-center {
        align-items: center;
        justify-content: flex-end;
      }

      .user-notification {
        pointer-events: auto;
        min-width: 320px;
        max-width: 480px;
        background: white;
        border-radius: 0.75rem;
        box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1);
        border: 1px solid rgba(229, 231, 235, 1);
        overflow: hidden;
        animation: notificationSlideIn 0.3s ease-out;
        transition: all 0.2s ease;
      }

      .user-notification:hover {
        transform: translateY(-2px);
        box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.15), 0 8px 10px -6px rgba(0, 0, 0, 0.1);
      }

      .user-notification.removing {
        animation: notificationSlideOut 0.3s ease-in forwards;
      }

      .user-notification.success {
        border-left: 4px solid #10b981;
      }

      .user-notification.error {
        border-left: 4px solid #ef4444;
      }

      .user-notification.warning {
        border-left: 4px solid #f59e0b;
      }

      .user-notification.info {
        border-left: 4px solid #3b82f6;
      }

      .notification-content {
        padding: 1rem 1.25rem;
      }

      .notification-header {
        display: flex;
        align-items: flex-start;
        gap: 0.75rem;
        margin-bottom: 0.5rem;
      }

      .notification-icon {
        flex-shrink: 0;
        width: 1.25rem;
        height: 1.25rem;
        margin-top: 0.125rem;
      }

      .notification-title {
        flex: 1;
        font-weight: 600;
        font-size: 0.875rem;
        line-height: 1.25rem;
        color: #111827;
      }

      .notification-close {
        flex-shrink: 0;
        width: 1.25rem;
        height: 1.25rem;
        border: none;
        background: none;
        cursor: pointer;
        color: #6b7280;
        border-radius: 0.25rem;
        display: flex;
        align-items: center;
        justify-content: center;
        transition: all 0.15s ease;
      }

      .notification-close:hover {
        background: #f3f4f6;
        color: #374151;
      }

      .notification-message {
        margin-left: 2rem;
        font-size: 0.875rem;
        line-height: 1.25rem;
        color: #4b5563;
        margin-bottom: 0.75rem;
      }

      .notification-actions {
        display: flex;
        gap: 0.5rem;
        margin-left: 2rem;
        flex-wrap: wrap;
      }

      .notification-action {
        padding: 0.375rem 0.75rem;
        border-radius: 0.375rem;
        font-size: 0.75rem;
        font-weight: 500;
        cursor: pointer;
        transition: all 0.15s ease;
        border: 1px solid transparent;
      }

      .notification-action.primary {
        background: #3b82f6;
        color: white;
      }

      .notification-action.primary:hover {
        background: #2563eb;
      }

      .notification-action.destructive {
        background: #ef4444;
        color: white;
      }

      .notification-action.destructive:hover {
        background: #dc2626;
      }

      .notification-action.secondary {
        background: #f3f4f6;
        color: #374151;
        border-color: #d1d5db;
      }

      .notification-action.secondary:hover {
        background: #e5e7eb;
      }

      @keyframes notificationSlideIn {
        from {
          transform: translateX(100%);
          opacity: 0;
        }
        to {
          transform: translateX(0);
          opacity: 1;
        }
      }

      @keyframes notificationSlideOut {
        from {
          transform: translateX(0);
          opacity: 1;
          max-height: 200px;
        }
        to {
          transform: translateX(100%);
          opacity: 0;
          max-height: 0;
        }
      }

      @media (max-width: 640px) {
        .user-notification {
          min-width: 280px;
          max-width: calc(100vw - 2rem);
        }

        .notification-content {
          padding: 0.875rem 1rem;
        }

        .notification-actions {
          flex-direction: column;
        }

        .notification-action {
          width: 100%;
          text-align: center;
        }
      }
    `;

    document.head.appendChild(style);
  }

  show(options: NotificationOptions): string {
    if (!this.container) {
      console.error('[UserNotification] Container não inicializado');
      return '';
    }

    const id = `notification_${++this.notificationId}`;
    const element = this.createNotificationElement(id, options);

    this.container.appendChild(element);

    const notification: ActiveNotification = {
      id,
      element,
      options
    };

    this.notifications.set(id, notification);

    // Auto-remove se não for persistente
    if (!options.persistent && options.duration !== 0) {
      const duration = options.duration || this.getDefaultDuration(options.type);
      notification.timeout = window.setTimeout(() => {
        this.remove(id);
      }, duration);
    }

    return id;
  }

  private createNotificationElement(id: string, options: NotificationOptions): HTMLElement {
    const notification = document.createElement('div');
    notification.className = `user-notification ${options.type}`;
    notification.id = id;

    const content = document.createElement('div');
    content.className = 'notification-content';

    // Header com ícone e título
    const header = document.createElement('div');
    header.className = 'notification-header';

    // Ícone
    const icon = document.createElement('div');
    icon.className = 'notification-icon';
    icon.innerHTML = this.getIcon(options.type, options.icon);

    // Título
    const title = document.createElement('div');
    title.className = 'notification-title';
    title.textContent = options.title;

    // Botão de fechar
    const closeBtn = document.createElement('button');
    closeBtn.className = 'notification-close';
    closeBtn.innerHTML = `
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M18 6L6 18M6 6l12 12"/>
      </svg>
    `;
    closeBtn.onclick = () => this.remove(id);

    header.appendChild(icon);
    header.appendChild(title);
    header.appendChild(closeBtn);

    content.appendChild(header);

    // Mensagem (se existir)
    if (options.message) {
      const message = document.createElement('div');
      message.className = 'notification-message';
      message.textContent = options.message;
      content.appendChild(message);
    }

    // Ações (se existirem)
    if (options.actions && options.actions.length > 0) {
      const actionsContainer = document.createElement('div');
      actionsContainer.className = 'notification-actions';

      options.actions.forEach(action => {
        const actionBtn = document.createElement('button');
        actionBtn.className = `notification-action ${
          action.primary ? 'primary' :
          action.destructive ? 'destructive' : 'secondary'
        }`;
        actionBtn.textContent = action.label;
        actionBtn.onclick = async () => {
          try {
            await action.action();
            // Se não for persistente, remover após ação bem-sucedida
            if (!options.persistent) {
              this.remove(id);
            }
          } catch (error) {
            console.error('[UserNotification] Erro na ação:', error);
            this.showError('Ocorreu um erro ao executar esta ação');
          }
        };

        actionsContainer.appendChild(actionBtn);
      });

      content.appendChild(actionsContainer);
    }

    notification.appendChild(content);

    return notification;
  }

  private getIcon(type: string, customIcon?: string): string {
    if (customIcon) return customIcon;

    const icons = {
      success: `
        <svg viewBox="0 0 24 24" fill="none" stroke="#10b981" stroke-width="2">
          <path d="M20 6L9 17l-5-5"/>
        </svg>
      `,
      error: `
        <svg viewBox="0 0 24 24" fill="none" stroke="#ef4444" stroke-width="2">
          <circle cx="12" cy="12" r="10"/>
          <path d="M12 8v4M12 16h.01"/>
        </svg>
      `,
      warning: `
        <svg viewBox="0 0 24 24" fill="none" stroke="#f59e0b" stroke-width="2">
          <path d="M12 9v4M12 17h.01M5.636 18.364a9 9 0 010-12.728m12.728 0a9 9 0 010 12.728"/>
        </svg>
      `,
      info: `
        <svg viewBox="0 0 24 24" fill="none" stroke="#3b82f6" stroke-width="2">
          <circle cx="12" cy="12" r="10"/>
          <path d="M12 16v-4M12 8h.01"/>
        </svg>
      `
    };

    return icons[type as keyof typeof icons] || icons.info;
  }

  private getDefaultDuration(type: string): number {
    const durations = {
      success: 4000,
      error: 6000,
      warning: 5000,
      info: 3000
    };

    return durations[type as keyof typeof durations] || 3000;
  }

  remove(id: string): void {
    const notification = this.notifications.get(id);
    if (!notification) return;

    // Limpar timeout se existir
    if (notification.timeout) {
      clearTimeout(notification.timeout);
    }

    // Animar remoção
    notification.element.classList.add('removing');

    setTimeout(() => {
      if (notification.element.parentNode) {
        notification.element.parentNode.removeChild(notification.element);
      }
      this.notifications.delete(id);
    }, 300);
  }

  clear(): void {
    this.notifications.forEach((_, id) => this.remove(id));
  }

  // Métodos de conveniência

  success(title: string, message?: string, options: Partial<NotificationOptions> = {}): string {
    return this.show({ type: 'success', title, message, ...options });
  }

  error(title: string, message?: string, options: Partial<NotificationOptions> = {}): string {
    return this.show({
      type: 'error',
      title,
      message,
      duration: 6000,
      ...options
    });
  }

  warning(title: string, message?: string, options: Partial<NotificationOptions> = {}): string {
    return this.show({ type: 'warning', title, message, ...options });
  }

  info(title: string, message?: string, options: Partial<NotificationOptions> = {}): string {
    return this.show({ type: 'info', title, message, ...options });
  }

  // Notificações específicas para cenários comuns

  showStorageError(): string {
    return this.error(
      'Problema de Armazenamento',
      'O sistema encontrou um problema ao acessar o armazenamento local.',
      {
        actions: [
          {
            label: 'Recarregar Página',
            action: () => window.location.reload(),
            primary: true
          },
          {
            label: 'Limpar Cache',
            action: () => this.clearCache(),
            destructive: true
          }
        ],
        persistent: true
      }
    );
  }

  showNetworkError(): string {
    return this.warning(
      'Problemas de Conectividade',
      'Detectamos problemas na sua conexão. Tentando reconectar...',
      {
        duration: 8000,
        actions: [
          {
            label: 'Verificar Conexão',
            action: () => this.checkConnection(),
            primary: true
          }
        ]
      }
    );
  }

  showPaymentServiceUnavailable(): string {
    return this.error(
      'Serviço de Pagamentos Indisponível',
      'O serviço de pagimentos está temporariamente indisponível. Tente novamente em alguns instantes.',
      {
        actions: [
          {
            label: 'Tentar Novamente',
            action: () => window.location.reload(),
            primary: true
          },
          {
            label: 'Contatar Suporte',
            action: () => this.openWhatsApp(),
            secondary: true
          }
        ],
        persistent: true
      }
    );
  }

  showOfflineMode(): string {
    return this.info(
      'Modo Offline',
      'Você está offline. Algumas funcionalidades podem estar limitadas.',
      {
        persistent: true,
        actions: [
          {
            label: 'Verificar Conexão',
            action: () => this.checkConnection(),
            primary: true
          }
        ]
      }
    );
  }

  // Ações úteis

  private async clearCache(): Promise<void> {
    try {
      // Limpar localStorage
      const keys = Object.keys(localStorage);
      keys.forEach(key => {
        if (key.startsWith('svlentes_')) {
          localStorage.removeItem(key);
        }
      });

      // Limpar sessionStorage
      sessionStorage.clear();

      this.success('Cache limpo com sucesso');
      setTimeout(() => window.location.reload(), 1500);
    } catch (error) {
      this.error('Falha ao limpar cache', 'Tente recarregar a página manualmente');
    }
  }

  private async checkConnection(): Promise<void> {
    if (typeof fetch === 'undefined') return;

    try {
      const response = await fetch('https://httpbin.org/get', {
        method: 'HEAD',
        cache: 'no-cache'
      });

      if (response.ok) {
        this.success('Conexão restaurada', 'Sua conexão com a internet está funcionando normalmente.');
      } else {
        this.error('Falha na conexão', 'Verifique sua rede e tente novamente.');
      }
    } catch (error) {
      this.error('Sem conexão', 'Não foi possível conectar à internet. Verifique suas configurações de rede.');
    }
  }

  private openWhatsApp(): void {
    if (typeof window === 'undefined') return;

    const url = 'https://wa.me/5533999898026?text=Olá!%20Estou%20com%20problemas%20no%20site%20da%20SV%20Lentes.';
    window.open(url, '_blank');
  }

  // Atualizar posição das notificações
  setPosition(position: NotificationOptions['position']): void {
    this.defaultPosition = position;
    if (this.container) {
      this.container.className = `fixed z-50 pointer-events-none ${position}`;
    }
  }
}

// Instância global
export const userNotification = UserNotification.getInstance();

// Exportar para uso global
declare global {
  interface Window {
    UserNotification: UserNotification;
  }
}

if (typeof window !== 'undefined') {
  window.UserNotification = userNotification;
}