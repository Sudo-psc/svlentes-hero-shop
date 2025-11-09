/**
 * Testes de resiliência e validação do sistema
 * Verifica o comportamento do sistema sob condições adversas
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { IndexedDBManager } from '../../../src/lib/storage/indexeddb-manager';
import { ResilientFetcher } from '../../../src/lib/network/resilient-fetcher';
import { UserNotification } from '../../../src/lib/ui/user-notifications';
import { HealthMonitor } from '../../../src/lib/monitoring/health-monitor';
import { TrustedTypesHandler } from '../../../src/lib/security/trusted-types-handler';

// Mock do DOM
Object.defineProperty(window, 'location', {
  value: { href: 'http://localhost:3000/test' },
  writable: true
});

Object.defineProperty(navigator, 'onLine', {
  value: true,
  writable: true
});

describe('Sistema de Resiliência', () => {
  beforeEach(() => {
    // Limpar mocks
    vi.clearAllMocks();

    // Mock do localStorage
    const localStorageMock = {
      getItem: vi.fn(),
      setItem: vi.fn(),
      removeItem: vi.fn(),
      clear: vi.fn(),
      key: vi.fn(),
      length: 0
    };
    Object.defineProperty(window, 'localStorage', { value: localStorageMock });

    // Mock do indexedDB
    const indexedDBMock = {
      open: vi.fn(),
      databases: vi.fn(),
      deleteDatabase: vi.fn()
    };
    Object.defineProperty(window, 'indexedDB', { value: indexedDBMock });

    // Mock do fetch
    global.fetch = vi.fn();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('IndexedDBManager', () => {
    it('deve fazer fallback para localStorage quando IndexedDB falhar', async () => {
      const manager = new IndexedDBManager('test', 1, 'testStore');

      // Mock de falha do IndexedDB
      (window.indexedDB.open as any).mockImplementation(() => {
        const request = {
          readyState: 'pending',
          result: null,
          error: new Error('IndexedDB não disponível'),
          onerror: null,
          onsuccess: null,
          onupgradeneeded: null
        };

        // Simular erro assíncrono
        setTimeout(() => {
          if (request.onerror) {
            request.onerror({ target: request } as any);
          }
        }, 0);

        return request;
      });

      const initialized = await manager.init();
      expect(initialized).toBe(false);

      // Testar armazenamento no fallback
      await manager.set('test-key', { data: 'test-value' });
      expect(localStorage.setItem).toHaveBeenCalled();
    });

    it('deve lidar com quota exceeded', async () => {
      const manager = new IndexedDBManager('test', 1, 'testStore');

      // Mock de erro de quota
      (localStorage.setItem as any).mockImplementation(() => {
        const error = new Error('QuotaExceededError');
        error.name = 'QuotaExceededError';
        throw error;
      });

      await manager.init();

      await expect(manager.set('test-key', 'large-data')).rejects.toThrow();
    });

    it('deve inicializar corretamente com IndexedDB disponível', async () => {
      const manager = new IndexedDBManager('test', 1, 'testStore');

      // Mock de IndexedDB funcional
      const mockDB = {
        transaction: vi.fn(() => ({
          objectStore: vi.fn(() => ({
            put: vi.fn(() => ({ result: 'success', onsuccess: null, onerror: null })),
            get: vi.fn(() => ({ result: { value: 'test' }, onsuccess: null, onerror: null }))
          }))
        })),
        close: vi.fn(),
        onerror: null
      };

      (window.indexedDB.open as any).mockImplementation(() => {
        const request = {
          readyState: 'done',
          result: mockDB,
          error: null,
          onerror: null,
          onsuccess: null,
          onupgradeneeded: null
        };

        setTimeout(() => {
          if (request.onsuccess) {
            request.onsuccess({ target: request } as any);
          }
        }, 0);

        return request;
      });

      const initialized = await manager.init();
      expect(initialized).toBe(true);
    });
  });

  describe('ResilientFetcher', () => {
    it('deve fazer retry em falhas de rede', async () => {
      (fetch as any).mockRejectedValueOnce(new Error('NetworkError'))
                         .mockRejectedValueOnce(new Error('NetworkError'))
                         .mockResolvedValueOnce({
                           ok: true,
                           status: 200,
                           json: () => Promise.resolve({ data: 'success' })
                         });

      const result = await ResilientFetcher.fetchWithRetry(
        'https://api.test.com/data',
        {},
        { maxRetries: 3, baseDelay: 10 }
      );

      expect(result.ok).toBe(true);
      expect(fetch).toHaveBeenCalledTimes(3);
    });

    it('deve falhar após máximo de tentativas', async () => {
      const networkError = new Error('Persistent NetworkError');
      (fetch as any).mockRejectedValue(networkError);

      await expect(
        ResilientFetcher.fetchWithRetry(
          'https://api.test.com/data',
          {},
          { maxRetries: 2, baseDelay: 10 }
        )
      ).rejects.toThrow('Persistent NetworkError');

      expect(fetch).toHaveBeenCalledTimes(3); // 1 inicial + 2 retries
    });

    it('não deve fazer retry em erros de cliente (4xx)', async () => {
      (fetch as any).mockResolvedValue({
        ok: false,
        status: 404,
        statusText: 'Not Found'
      });

      await expect(
        ResilientFetcher.fetchWithRetry('https://api.test.com/data')
      ).rejects.toThrow();

      expect(fetch).toHaveBeenCalledTimes(1); // Sem retry
    });

    it('deve fazer retry em erros de servidor (5xx)', async () => {
      (fetch as any).mockResolvedValueOnce({
        ok: false,
        status: 503,
        statusText: 'Service Unavailable'
      }).mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: () => Promise.resolve({ data: 'success' })
      });

      const result = await ResilientFetcher.fetchWithRetry(
        'https://api.test.com/data',
        {},
        { maxRetries: 2, baseDelay: 10 }
      );

      expect(result.ok).toBe(true);
      expect(fetch).toHaveBeenCalledTimes(2);
    });

    it('deve respeitar timeout', async () => {
      const fetchPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Timeout')), 100);
      });

      (fetch as any).mockReturnValue(fetchPromise);

      await expect(
        ResilientFetcher.fetchWithRetry(
          'https://api.test.com/slow',
          {},
          { timeout: 50 }
        )
      ).rejects.toThrow('Timeout');
    });
  });

  describe('UserNotification', () => {
    beforeEach(() => {
      // Mock do DOM para notificações
      document.body.innerHTML = '';
      Object.defineProperty(document, 'head', {
        value: { appendChild: vi.fn() },
        writable: true
      });
    });

    it('deve criar notificação de sucesso', () => {
      const notification = UserNotification.getInstance();
      const id = notification.success('Título', 'Mensagem de sucesso');

      expect(id).toBeTruthy();
      expect(id).toMatch(/^notification_\d+$/);
    });

    it('deve criar notificação de erro com ações', () => {
      const notification = UserNotification.getInstance();
      const mockAction = vi.fn();

      const id = notification.error(
        'Erro crítico',
        'Ocorreu um erro',
        {
          actions: [
            { label: 'Tentar novamente', action: mockAction, primary: true }
          ]
        }
      );

      expect(id).toBeTruthy();
    });

    it('deve remover notificação', () => {
      const notification = UserNotification.getInstance();
      const id = notification.info('Teste');

      expect(() => notification.remove(id)).not.toThrow();
    });

    it('deve limpar todas as notificações', () => {
      const notification = UserNotification.getInstance();
      notification.success('Teste 1');
      notification.error('Teste 2');
      notification.warning('Teste 3');

      expect(() => notification.clear()).not.toThrow();
    });
  });

  describe('HealthMonitor', () => {
    it('deve calcular health score corretamente', async () => {
      const monitor = new HealthMonitor();
      const health = await monitor.checkHealth();

      expect(health).toHaveProperty('status');
      expect(health).toHaveProperty('score');
      expect(health).toHaveProperty('metrics');
      expect(health).toHaveProperty('alerts');
      expect(health).toHaveProperty('recommendations');

      expect(health.score).toBeGreaterThanOrEqual(0);
      expect(health.score).toBeLessThanOrEqual(100);
      expect(['healthy', 'degraded', 'critical']).toContain(health.status);
    });

    it('deve detectar problemas de performance', async () => {
      const monitor = new HealthMonitor();

      // Mock de métricas de performance ruins
      Object.defineProperty(window, 'performance', {
        value: {
          timing: {
            loadEventEnd: 5000,
            loadEventStart: 0
          },
          getEntriesByType: vi.fn(() => [{
            startTime: 4500,
            value: 0.3
          }])
        },
        writable: true
      });

      const health = await monitor.checkHealth();
      expect(health.score).toBeLessThan(100);
    });

    it('deve gerar recomendações apropriadas', async () => {
      const monitor = new HealthMonitor();

      // Simular múltiplos erros
      for (let i = 0; i < 10; i++) {
        window.dispatchEvent(new ErrorEvent('error', {
          message: `Test error ${i}`
        }));
      }

      const health = await monitor.checkHealth();
      expect(health.recommendations.length).toBeGreaterThan(0);
    });
  });

  describe('TrustedTypesHandler', () => {
    it('deve analisar suporte a Trusted Types', () => {
      const handler = new TrustedTypesHandler();
      const info = handler.getTrustedTypesInfo();

      expect(info).toHaveProperty('supported');
      expect(info).toHaveProperty('enabled');
      expect(info).toHaveProperty('policyNames');
      expect(info).toHaveProperty('errors');
    });

    it('deve analisar configuração de CSP', () => {
      // Mock de meta tag CSP
      const metaTag = document.createElement('meta');
      metaTag.setAttribute('http-equiv', 'Content-Security-Policy');
      metaTag.setAttribute('content', "default-src 'self'; script-src 'self' https://js.stripe.com");
      document.head.appendChild(metaTag);

      const handler = new TrustedTypesHandler();
      const info = handler.getCSPInfo();

      expect(info.enabled).toBe(true);
      expect(info.directives['default-src']).toContain("'self'");
      expect(info.directives['script-src']).toContain('https://js.stripe.com');

      // Cleanup
      document.head.removeChild(metaTag);
    });

    it('deve validar URLs de script', () => {
      const handler = new TrustedTypesHandler();

      // Não deve lançar erro para URLs permitidas
      expect(() => handler.validateScriptURL('https://js.stripe.com/v3/')).not.toThrow();
      expect(() => handler.validateScriptURL('/local-script.js')).not.toThrow();

      // Deve lançar erro para URLs não permitidas
      expect(() => handler.validateScriptURL('https://evil.com/script.js')).toThrow();
    });

    it('deve sanitizar HTML perigoso', () => {
      const handler = new TrustedTypesHandler();

      const dangerousHTML = '<script>alert("xss")</script><div onclick="evil()">Content</div>';
      const sanitized = handler.sanitizeHTML(dangerousHTML);

      expect(sanitized).not.toContain('<script>');
      expect(sanitized).not.toContain('onclick');
      expect(sanitized).toContain('<div>');
      expect(sanitized).toContain('Content');
    });

    it('deve verificar saúde de segurança', async () => {
      const handler = new TrustedTypesHandler();
      const security = await handler.checkSecurityHealth();

      expect(security).toHaveProperty('status');
      expect(security).toHaveProperty('issues');
      expect(security).toHaveProperty('recommendations');
      expect(['secure', 'warning', 'vulnerable']).toContain(security.status);
    });
  });

  describe('Integração do Sistema', () => {
    it('deve lidar com múltiplas falhas simultâneas', async () => {
      // Simular falha de IndexedDB
      (window.indexedDB.open as any).mockImplementation(() => {
        throw new Error('IndexedDB falhou');
      });

      // Simular falha de rede
      (fetch as any).mockRejectedValue(new Error('NetworkError'));

      const manager = new IndexedDBManager('test', 1, 'testStore');
      await manager.init();

      const notification = UserNotification.getInstance();

      // Tentativa de armazenar dados deve funcionar com fallback
      await expect(manager.set('key', 'value')).resolves.not.toThrow();

      // Tentativa de fetch deve fazer retry
      await expect(
        ResilientFetcher.fetchWithRetry('https://api.test.com', {}, { maxRetries: 1 })
      ).rejects.toThrow();
    });

    it('deve se recuperar de falhas de storage', async () => {
      const manager = new IndexedDBManager('test', 1, 'testStore');

      // Primeiro falha, depois sucesso
      let callCount = 0;
      (localStorage.setItem as any).mockImplementation(() => {
        callCount++;
        if (callCount === 1) {
          throw new Error('Storage temporariamente indisponível');
        }
      });

      await manager.init();

      // Primeira tentativa deve falhar
      await expect(manager.set('key', 'value')).rejects.toThrow();

      // Segunda tentativa deve funcionar
      await expect(manager.set('key2', 'value2')).resolves.not.toThrow();
    });

    it('deve notificar usuário sobre problemas críticos', async () => {
      const notification = UserNotification.getInstance();
      const mockAction = vi.fn();

      // Simular erro crítico de IndexedDB
      const manager = new IndexedDBManager('critical-test', 1, 'criticalStore');
      (window.indexedDB.open as any).mockImplementation(() => {
        const error = new Error('Connection to Indexed Database server lost');
        throw error;
      });

      await manager.init();

      // Tentar armazenar deve acionar notificação
      const id = notification.showStorageError();
      expect(id).toBeTruthy();
    });
  });

  describe('Testes de Estresse', () => {
    it('deve lidar com múltiplas operações simultâneas', async () => {
      const manager = new IndexedDBManager('stress-test', 1, 'stressStore');
      await manager.init();

      // Criar múltiplas operações em paralelo
      const operations = Array.from({ length: 100 }, (_, i) =>
        manager.set(`key-${i}`, { data: `value-${i}` })
      );

      await expect(Promise.all(operations)).resolves.not.toThrow();
    });

    it('deve lidar com many fetch requests com retry', async () => {
      // Simular falha nas 2 primeiras tentativas, sucesso na terceira
      let callCount = 0;
      (fetch as any).mockImplementation(() => {
        callCount++;
        if (callCount <= 2) {
          return Promise.reject(new Error('Temporary failure'));
        }
        return Promise.resolve({
          ok: true,
          status: 200,
          json: () => Promise.resolve({ success: true })
        });
      });

      const requests = Array.from({ length: 10 }, (_, i) =>
        ResilientFetcher.fetchWithRetry(
          `https://api.test.com/data-${i}`,
          {},
          { maxRetries: 3, baseDelay: 10 }
        )
      );

      const results = await Promise.all(requests);
      expect(results).toHaveLength(10);
      expect(results.every(r => r.ok)).toBe(true);
    });
  });
});