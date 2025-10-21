/**
 * Testes E2E para o Sistema de Resiliência Completo
 * Testa integração entre todos os componentes do sistema
 */

import { test, expect, type Page } from '@playwright/test'
import { setupMockServer, mockResponses } from '../mocks/server'

// Mock do service worker para simular offline
test.describe('Sistema de Resiliência - E2E', () => {
  let page: Page
  let mockServer: any

  test.beforeAll(async ({ browser }) => {
    mockServer = await setupMockServer()
  })

  test.afterAll(async () => {
    await mockServer.close()
  })

  test.beforeEach(async ({ browser }) => {
    page = await browser.newPage()

    // Mock de APIs
    await page.route('**/api/assinante/subscription', (route) => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(mockResponses.subscription.success)
      })
    })

    await page.route('**/api/health-check', (route) => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          status: 'healthy',
          timestamp: Date.now(),
          checks: [{ name: 'api', status: 'pass', message: 'OK', responseTime: 50 }]
        })
      })
    })

    // Mock localStorage para dados de teste
    await page.addInitScript(() => {
      window.localStorage.clear()
    })
  })

  test.afterEach(async () => {
    await page.close()
  })

  test('deve carregar dashboard normalmente com API funcionando', async () => {
    await page.goto('/area-assinante/dashboard')

    // Esperar carregamento inicial
    await page.waitForSelector('[data-testid="subscription-status"]')

    // Verificar conteúdo carregado
    await expect(page.locator('[data-testid="subscription-status"]')).toContainText('Ativo')
    await expect(page.locator('[data-testid="plan-name"]')).toContainText('Premium')
    await expect(page.locator('[data-testid="system-health"]')).toContainText('Sistema Saudável')

    // Verificar indicadores de performance
    const healthIndicator = page.locator('[data-testid="health-indicator"]')
    await expect(healthIndicator).toHaveClass(/bg-green-100/) // Status saudável
  })

  test('deve usar dados cache quando API falhar', async () => {
    // Primeiro acesso para popular cache
    await page.goto('/area-assinante/dashboard')
    await page.waitForSelector('[data-testid="subscription-status"]')

    // Simular falha da API
    await page.route('**/api/assinante/subscription', (route) => {
      route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({ error: 'Internal Server Error' })
      })
    })

    // Recarregar página
    await page.reload()

    // Deve mostrar dados do cache
    await page.waitForSelector('[data-testid="subscription-status"]')
    await expect(page.locator('[data-testid="subscription-status"]')).toContainText('Ativo')

    // Deve mostrar indicador de degradação
    await expect(page.locator('[data-testid="performance-indicator"]')).toContainText('Modo Offline')
    await expect(page.locator('[data-testid="system-health"]')).toContainText('Sistema Degradado')
  })

  test('deve tentar múltiplos fallbacks antes de mostrar erro', async () => {
    // Mock falha completa
    await page.route('**/api/**', (route) => {
      route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({ error: 'Service Unavailable' })
      })
    })

    await page.goto('/area-assinante/dashboard')

    // Esperar tentativas de fallback
    await page.waitForSelector('[data-testid="retry-indicator"]', { timeout: 10000 })

    // Verificar indicadores de retry
    await expect(page.locator('[data-testid="retry-count"]')).toBeVisible()
    await expect(page.locator('[data-testid="circuit-status"]')).toContainText('Aguardando')

    // Eventualmente deve mostrar fallback data
    await page.waitForSelector('[data-testid="fallback-message"]', { timeout: 15000 })
    await expect(page.locator('[data-testid="fallback-message"]')).toContainText('Dados limitados')
  })

  test('deve sincronizar dados quando voltar online', async () => {
    // Simular modo offline
    await page.context().setOffline(true)
    await page.goto('/area-assinante/dashboard')

    // Deve mostrar modo offline
    await page.waitForSelector('[data-testid="offline-indicator"]')
    await expect(page.locator('[data-testid="offline-indicator"]')).toContainText('Modo Offline')

    // Fazer mudanças offline (se houver formulários)
    const updateButton = page.locator('[data-testid="update-profile"]')
    if (await updateButton.isVisible()) {
      await updateButton.click()
      // Preencher formulário
      await page.fill('[data-testid="profile-name"]', 'Nome Atualizado')
      await page.click('[data-testid="save-changes"]')

      // Deve mostrar indicação de pendente
      await expect(page.locator('[data-testid="sync-pending"]')).toBeVisible()
    }

    // Voltar online
    await page.context().setOffline(false)

    // Disparar evento online
    await page.evaluate(() => {
      window.dispatchEvent(new Event('online'))
    })

    // Esperar sincronização
    await page.waitForSelector('[data-testid="sync-success"]', { timeout: 10000 })
    await expect(page.locator('[data-testid="sync-success"]')).toContainText('Sincronizado')
  })

  test('deve mostrar sistema de autenticação backup quando necessário', async () => {
    // Simular falha de autenticação
    await page.route('**/api/auth/me', (route) => {
      route.fulfill({
        status: 401,
        contentType: 'application/json',
        body: JSON.stringify({ error: 'Authentication expired' })
      })
    })

    await page.goto('/area-assinante/dashboard')

    // Deve mostrar modal de backup auth
    await page.waitForSelector('[data-testid="backup-auth-modal"]')
    await expect(page.locator('[data-testid="backup-auth-modal"]')).toBeVisible()

    // Testar método de telefone
    await page.click('[data-testid="auth-method-phone"]')
    await expect(page.locator('[data-testid="phone-input"]')).toBeVisible()

    await page.fill('[data-testid="phone-input"]', '+5533999898026')
    await page.click('[data-testid="send-code"]')

    // Deve mostrar tela de verificação
    await page.waitForSelector('[data-testid="verification-code-input"]')
    await expect(page.locator('[data-testid="verification-code-input"]')).toBeVisible()

    // Mock código correto
    await page.fill('[data-testid="verification-code-input"]', '123456')
    await page.click('[data-testid="verify-code"]')

    // Deve autenticar com sucesso
    await page.waitForSelector('[data-testid="auth-success"]')
    await expect(page.locator('[data-testid="auth-success"]')).toContainText('Acesso Restaurado')
  })

  test('deve monitorar saúde do sistema em tempo real', async () => {
    await page.goto('/area-assinante/dashboard')

    // Esperar monitoramento inicial
    await page.waitForSelector('[data-testid="system-health"]')

    // Verificar status inicial
    await expect(page.locator('[data-testid="health-status"]')).toContainText('Sistema Saudável')

    // Simular degradação
    await page.route('**/api/health-check', (route) => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          status: 'degraded',
          timestamp: Date.now(),
          checks: [
            { name: 'api', status: 'warn', message: 'Slow response', responseTime: 2000 }
          ]
        })
      })
    })

    // Esperar atualização do health check
    await page.waitForTimeout(5000) // Intervalo de health check

    // Verificar status atualizado
    await expect(page.locator('[data-testid="health-status"]')).toContainText('Sistema Degradado')
    await expect(page.locator('[data-testid="health-indicator"]')).toHaveClass(/bg-yellow-100/)
  })

  test('deve mostrar métricas de performance detalhadas', async () => {
    await page.goto('/area-assinante/dashboard')

    // Expandir detalhes de saúde
    await page.click('[data-testid="expand-health-details"]')

    // Verificar métricas
    await expect(page.locator('[data-testid="response-time-metric"]')).toBeVisible()
    await expect(page.locator('[data-testid="memory-usage-metric"]')).toBeVisible()
    await expect(page.locator('[data-testid="storage-usage-metric"]')).toBeVisible()
    await expect(page.locator('[data-testid="cache-hit-rate"]')).toBeVisible()

    // Verificar checks específicos
    await expect(page.locator('[data-testid="api-health-check"]')).toBeVisible()
    await expect(page.locator('[data-testid="indexeddb-health-check"]')).toBeVisible()
    await expect(page.locator('[data-testid="localstorage-health-check"]')).toBeVisible()
  })

  test('deve handle múltiplas abas com sincronização', async () => {
    // Abrir duas abas
    const page2 = await page.context().newPage()

    // Mock API para ambas abas
    for (const p of [page, page2]) {
      await p.route('**/api/assinante/subscription', (route) => {
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify(mockResponses.subscription.success)
        })
      })
    }

    // Carregar em ambas abas
    await Promise.all([
      page.goto('/area-assinante/dashboard'),
      page2.goto('/area-assinante/dashboard')
    ])

    // Esperar carregamento
    await Promise.all([
      page.waitForSelector('[data-testid="subscription-status"]'),
      page2.waitForSelector('[data-testid="subscription-status"]')
    ])

    // Simular atualização em uma aba
    await page.route('**/api/assinante/subscription', (route) => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          ...mockResponses.subscription.success,
          status: 'paused'
        })
      })
    })

    await page.click('[data-testid="refresh-subscription"]')

    // Esperar sincronização entre abas (via storage events)
    await page.waitForTimeout(1000)

    // Verificar se ambas abas mostram dados atualizados
    await expect(page.locator('[data-testid="subscription-status"]')).toContainText('Pausado')
    await expect(page2.locator('[data-testid="subscription-status"]')).toContainText('Pausado')

    await page2.close()
  })

  test('deve manter performance sob alta carga', async () => {
    await page.goto('/area-assinante/dashboard')

    // Iniciar monitoramento de performance
    const performanceMetrics = await page.evaluate(() => {
      const metrics = {
        initialLoad: performance.now(),
        renderTime: 0,
        jsHeapSize: 0
      }

      // Observer para medir tempo de renderização
      const observer = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (entry.entryType === 'measure') {
            metrics.renderTime += entry.duration
          }
        }
      })
      observer.observe({ entryTypes: ['measure'] })

      // Medir uso de memória
      const perf = performance as unknown
      if (
        typeof perf === 'object' &&
        perf !== null &&
        'memory' in perf &&
        typeof (perf as { memory: { usedJSHeapSize: number } }).memory.usedJSHeapSize === 'number'
      ) {
        metrics.jsHeapSize = (perf as { memory: { usedJSHeapSize: number } }).memory.usedJSHeapSize
      }

      return metrics
    })

    // Simular alta carga - múltiplas atualizações
    for (let i = 0; i < 10; i++) {
      await page.click('[data-testid="refresh-subscription"]')
      await page.waitForTimeout(100)
    }

    // Medir performance final
    const finalMetrics = await page.evaluate(() => {
      const perf = performance as unknown
      if (
        typeof perf === 'object' &&
        perf !== null &&
        'memory' in perf &&
        typeof (perf as { memory: { usedJSHeapSize: number } }).memory.usedJSHeapSize === 'number'
      ) {
        return (perf as { memory: { usedJSHeapSize: number } }).memory.usedJSHeapSize
      }
      return 0
    })

    // Verificar limites de performance
    const totalTime = performance.now() - performanceMetrics.initialLoad
    expect(totalTime).toBeLessThan(5000) // Deve completar em < 5s
    expect(finalMetrics - performanceMetrics.jsHeapSize).toBeLessThan(50 * 1024 * 1024) // < 50MB aumento
  })

  test('deve recuperar-se de falhas completas do sistema', async () => {
    // Simular falha completa
    await page.route('**/api/**', (route) => {
      route.abort('failed')
    })

    // Simular falha de storage
    await page.addInitScript(() => {
      const originalSetItem = localStorage.setItem
      localStorage.setItem = () => {
        throw new Error('Storage disabled')
      }
    })

    await page.goto('/area-assinante/dashboard')

    // Deve mostrar erro gracefully
    await page.waitForSelector('[data-testid="system-error"]')
    await expect(page.locator('[data-testid="system-error"]')).toContainText('Sistema Indisponível')

    // Deve mostrar opções de recuperação
    await expect(page.locator('[data-testid="retry-button"]')).toBeVisible()
    await expect(page.locator('[data-testid="offline-mode-button"]')).toBeVisible()

    // Tentar recuperação
    await page.unroute('**/api/assinante/subscription')
    await page.route('**/api/assinante/subscription', (route) => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(mockResponses.subscription.success)
      })
    })

    await page.click('[data-testid="retry-button"]')

    // Deve recuperar sucesso
    await page.waitForSelector('[data-testid="subscription-status"]')
    await expect(page.locator('[data-testid="subscription-status"]')).toContainText('Ativo')
  })

  test('deve validar segurança dos dados offline', async () => {
    // Simular modo offline
    await page.context().setOffline(true)

    // Mock dados sensíveis
    await page.route('**/api/assinante/subscription', (route) => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          ...mockResponses.subscription.success,
          // Não deve incluir dados sensíveis em cache
          creditCard: undefined,
          fullAddress: undefined
        })
      })
    })

    await page.goto('/area-assinante/dashboard')

    // Verificar se dados sensíveis não estão disponíveis offline
    const pageContent = await page.content()
    expect(pageContent).not.toContain('credit-card')
    expect(pageContent).not.toContain('cvv')
    expect(pageContent).not.toContain('full-address')

    // Verificar se dados essenciais estão disponíveis
    await expect(page.locator('[data-testid="subscription-status"]')).toBeVisible()
    await expect(page.locator('[data-testid="plan-name"]')).toBeVisible()
  })
})

test.describe('Resiliência - Cenários de Borda', () => {
  test('deve handle desconexão durante operação crítica', async ({ page }) => {
    await page.goto('/area-assinante/dashboard')

    // Iniciar operação crítica
    await page.click('[data-testid="update-subscription"]')

    // Desconectar no meio da operação
    await page.context().setOffline(true)

    // Deve mostrar indicador de operação pendente
    await expect(page.locator('[data-testid="operation-pending"]')).toBeVisible()
    await expect(page.locator('[data-testid="offline-indicator"]')).toBeVisible()

    // Reconectar
    await page.context().setOffline(false)
    await page.evaluate(() => window.dispatchEvent(new Event('online')))

    // Deve completar operação automaticamente
    await expect(page.locator('[data-testid="operation-completed"]')).toBeVisible()
  })

  test('deve handle múltiplos métodos de autenticação fallback', async ({ page }) => {
    // Mock falha em cascata
    await page.route('**/api/auth/verify-firebase-token', () => {
      throw new Error('Firebase down')
    })

    await page.route('**/api/auth/send-phone-code', () => {
      throw new Error('SMS service down')
    })

    await page.route('**/api/auth/send-email-code', () => {
      throw new Error('Email service down')
    })

    await page.goto('/area-assinante/dashboard')

    // Deve mostrar múltiplas opções
    await page.waitForSelector('[data-testid="backup-auth-modal"]')

    // Firebase deve estar marcado como indisponível
    await expect(page.locator('[data-testid="firebase-method"]')).toHaveClass(/opacity-50/)
    await expect(page.locator('[data-testid="firebase-status"]')).toContainText('Indisponível')

    // Telefone deve estar marcado como indisponível
    await expect(page.locator('[data-testid="phone-method"]')).toHaveClass(/opacity-50/)
    await expect(page.locator('[data-testid="phone-status"]')).toContainText('Indisponível')

    // Email deve estar marcado como indisponível
    await expect(page.locator('[data-testid="email-method"]')).toHaveClass(/opacity-50/)
    await expect(page.locator('[data-testid="email-status"]')).toContainText('Indisponível')

    // Token deve ser a última opção
    await expect(page.locator('[data-testid="token-method"]')).toBeVisible()
    await expect(page.locator('[data-testid="token-status"]')).toContainText('Emergência')
  })
})
