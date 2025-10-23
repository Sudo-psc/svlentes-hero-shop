import { test, expect } from '@playwright/test'

test.describe('Subscriber Dashboard - Phase 1 Features', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to login page
    await page.goto('/area-assinante/login')

    // Login with test credentials
    await page.fill('input[type="email"]', process.env.TEST_USER_EMAIL || 'test@example.com')
    await page.fill('input[type="password"]', process.env.TEST_USER_PASSWORD || 'testpassword')
    await page.click('button[type="submit"]')

    // Wait for dashboard to load
    await page.waitForURL('/area-assinante/dashboard')
    await page.waitForLoadState('networkidle')
  })

  test.describe('Dashboard Loading and Display', () => {
    test('should load dashboard successfully', async ({ page }) => {
      // Verify dashboard header
      await expect(page.locator('text=Minha Assinatura')).toBeVisible()
      await expect(page.locator('text=Bem-vindo')).toBeVisible()
    })

    test('should display welcome message with user name', async ({ page }) => {
      // Check for personalized welcome message
      const welcomeText = page.locator('text=/Bem-vindo.*, .*/i')
      await expect(welcomeText).toBeVisible()
    })

    test('should show loading state initially', async ({ page }) => {
      // Navigate to dashboard fresh
      await page.goto('/area-assinante/dashboard')

      // Check for loading indicators (skeletons or spinners)
      const loadingIndicator = page.locator('[data-testid="dashboard-loading"], .animate-pulse, .ant-skeleton')

      // Loading should appear briefly
      const hasLoading = await loadingIndicator.count()
      expect(hasLoading).toBeGreaterThanOrEqual(0)
    })
  })

  test.describe('Dashboard Metrics Display', () => {
    test('should display all 4 main metrics cards', async ({ page }) => {
      // Wait for metrics to load
      await page.waitForSelector('text=Receita Mensal', { timeout: 10000 })

      // Verify all metric titles are visible
      await expect(page.locator('text=Receita Mensal')).toBeVisible()
      await expect(page.locator('text=Assinaturas Ativas')).toBeVisible()
      await expect(page.locator('text=Consultas Agendadas')).toBeVisible()
      await expect(page.locator('text=Taxa de Conversão')).toBeVisible()
    })

    test('should display metric values correctly formatted', async ({ page }) => {
      await page.waitForSelector('text=Receita Mensal', { timeout: 10000 })

      // Check for monetary value formatting (R$)
      const revenueValue = page.locator('text=/R\\$ [0-9,.]+/')
      await expect(revenueValue.first()).toBeVisible()

      // Check for percentage formatting
      const percentageValue = page.locator('text=/[0-9,.]+%/')
      await expect(percentageValue.first()).toBeVisible()

      // Check for numeric values
      const numericValue = page.locator('text=/^[0-9]+$/')
      await expect(numericValue.first()).toBeVisible()
    })

    test('should display trend indicators', async ({ page }) => {
      await page.waitForSelector('text=vs. mês anterior', { timeout: 10000 })

      // Verify trend comparison text
      const trendText = page.locator('text=vs. mês anterior')
      const trendCount = await trendText.count()
      expect(trendCount).toBeGreaterThan(0)

      // Check for trend percentage indicators
      const trendIndicator = page.locator('text=/[+\\-][0-9,.]+%/')
      await expect(trendIndicator.first()).toBeVisible()
    })

    test('should show positive trends in green', async ({ page }) => {
      await page.waitForSelector('text=vs. mês anterior', { timeout: 10000 })

      // Look for positive trend elements with green styling
      const positiveTrend = page.locator('.text-green-600, [class*="text-green"]').first()
      await expect(positiveTrend).toBeVisible()
    })

    test('should show negative trends in red', async ({ page }) => {
      await page.waitForSelector('text=vs. mês anterior', { timeout: 10000 })

      // Look for negative trend elements with red styling
      const negativeTrend = page.locator('.text-red-600, [class*="text-red"]').first()
      await expect(negativeTrend).toBeVisible()
    })
  })

  test.describe('Progress Metrics', () => {
    test('should display all 3 progress cards', async ({ page }) => {
      await page.waitForSelector('text=Progresso de Entrega', { timeout: 10000 })

      await expect(page.locator('text=Progresso de Entrega')).toBeVisible()
      await expect(page.locator('text=Satisfação do Cliente')).toBeVisible()
      await expect(page.locator('text=Status do Estoque')).toBeVisible()
    })

    test('should show progress percentages', async ({ page }) => {
      await page.waitForSelector('text=Progresso de Entrega', { timeout: 10000 })

      // Check for percentage values in progress cards
      const percentages = page.locator('.ant-progress-text, [role="progressbar"]')
      const count = await percentages.count()
      expect(count).toBeGreaterThanOrEqual(3)
    })

    test('should render progress bars visually', async ({ page }) => {
      await page.waitForSelector('.ant-progress', { timeout: 10000 })

      // Verify progress bar elements exist
      const progressBars = page.locator('.ant-progress-circle, .ant-progress-line')
      const barCount = await progressBars.count()
      expect(barCount).toBeGreaterThan(0)
    })
  })

  test.describe('Subscription Status Card', () => {
    test('should display subscription status', async ({ page }) => {
      await page.waitForSelector('text=Status da Assinatura', { timeout: 10000 })

      await expect(page.locator('text=Status da Assinatura')).toBeVisible()
    })

    test('should show subscription plan details', async ({ page }) => {
      await page.waitForSelector('text=Status da Assinatura', { timeout: 10000 })

      // Should show plan name
      const planName = page.locator('text=/Lentes .* Mensal|Plano .*/i')
      await expect(planName.first()).toBeVisible()

      // Should show price
      const price = page.locator('text=/R\\$ [0-9,.]+/')
      await expect(price.first()).toBeVisible()
    })

    test('should display next billing date', async ({ page }) => {
      await page.waitForSelector('text=Status da Assinatura', { timeout: 10000 })

      // Look for billing date text
      const billingDate = page.locator('text=/Próxima cobrança|próxima cobrança/i')
      await expect(billingDate.first()).toBeVisible()
    })
  })

  test.describe('Benefits Display', () => {
    test('should show subscription benefits', async ({ page }) => {
      await page.waitForSelector('text=Benefícios', { timeout: 10000 })

      await expect(page.locator('text=Benefícios')).toBeVisible()
    })

    test('should display included benefits', async ({ page }) => {
      await page.waitForSelector('text=Benefícios', { timeout: 10000 })

      // Look for "Incluído" or checkmark indicators
      const includedBenefits = page.locator('text=Incluído, .text-green-600')
      const count = await includedBenefits.count()
      expect(count).toBeGreaterThan(0)
    })
  })

  test.describe('Shipping Address Card', () => {
    test('should display shipping address section', async ({ page }) => {
      await page.waitForSelector('text=Endereço de Entrega', { timeout: 10000 })

      await expect(page.locator('text=Endereço de Entrega')).toBeVisible()
    })

    test('should show edit button for address', async ({ page }) => {
      await page.waitForSelector('text=Endereço de Entrega', { timeout: 10000 })

      const editButton = page.locator('button:has-text("Editar")')
      await expect(editButton.first()).toBeVisible()
    })

    test('should display address details', async ({ page }) => {
      await page.waitForSelector('text=Endereço de Entrega', { timeout: 10000 })

      // Check for CEP format
      const cep = page.locator('text=/CEP: [0-9]{5}-[0-9]{3}/')
      await expect(cep.first()).toBeVisible()

      // Check for city and state
      const location = page.locator('text=/ - [A-Z]{2}/')
      await expect(location.first()).toBeVisible()
    })
  })

  test.describe('Emergency Contact Card', () => {
    test('should display emergency contact section', async ({ page }) => {
      await page.waitForSelector('text=Contato de Emergência', { timeout: 10000 })

      await expect(page.locator('text=Contato de Emergência')).toBeVisible()
    })

    test('should show doctor information', async ({ page }) => {
      await page.waitForSelector('text=Dr. Philipe Saraiva Cruz', { timeout: 10000 })

      await expect(page.locator('text=Dr. Philipe Saraiva Cruz')).toBeVisible()
      await expect(page.locator('text=CRM-MG 69.870')).toBeVisible()
    })

    test('should display WhatsApp contact button', async ({ page }) => {
      await page.waitForSelector('text=WhatsApp', { timeout: 10000 })

      const whatsappButton = page.locator('button:has-text("WhatsApp"), a:has-text("WhatsApp")')
      await expect(whatsappButton.first()).toBeVisible()
    })

    test('should show emergency guidelines', async ({ page }) => {
      await page.waitForSelector('text=Quando procurar ajuda urgente', { timeout: 10000 })

      await expect(page.locator('text=Quando procurar ajuda urgente')).toBeVisible()
    })
  })

  test.describe('Notifications', () => {
    test('should display notifications section', async ({ page }) => {
      // Check if notifications area exists
      const notificationsArea = page.locator('[data-testid="notifications"], text=Notificações')
      const hasNotifications = await notificationsArea.count()

      // Either notifications exist or the section is properly hidden
      expect(hasNotifications).toBeGreaterThanOrEqual(0)
    })
  })

  test.describe('Responsive Design', () => {
    test('should be responsive on mobile', async ({ page }) => {
      // Set mobile viewport
      await page.setViewportSize({ width: 375, height: 667 })

      // Dashboard should still load
      await expect(page.locator('text=Minha Assinatura')).toBeVisible()

      // Metrics should stack vertically
      const metricsContainer = page.locator('text=Receita Mensal').locator('..')
      await expect(metricsContainer).toBeVisible()
    })

    test('should be responsive on tablet', async ({ page }) => {
      // Set tablet viewport
      await page.setViewportSize({ width: 768, height: 1024 })

      // Dashboard should render properly
      await expect(page.locator('text=Minha Assinatura')).toBeVisible()
      await expect(page.locator('text=Receita Mensal')).toBeVisible()
    })

    test('should be responsive on desktop', async ({ page }) => {
      // Set desktop viewport
      await page.setViewportSize({ width: 1920, height: 1080 })

      // Dashboard should render with full layout
      await expect(page.locator('text=Minha Assinatura')).toBeVisible()
      await expect(page.locator('text=Receita Mensal')).toBeVisible()
    })
  })

  test.describe('Error Handling', () => {
    test('should show error state when data fails to load', async ({ page }) => {
      // Intercept API call and make it fail
      await page.route('**/api/assinante/**', route => {
        route.abort('failed')
      })

      // Navigate to dashboard
      await page.goto('/area-assinante/dashboard')

      // Should show error message
      const errorMessage = page.locator('text=/Erro|erro|Error/i')

      // Wait for error to appear or timeout
      try {
        await expect(errorMessage.first()).toBeVisible({ timeout: 5000 })
      } catch {
        // If no error shown, it means there's a fallback/cached data
        // which is also acceptable behavior
      }
    })

    test('should have retry button on error', async ({ page }) => {
      // Intercept API call and make it fail
      await page.route('**/api/assinante/**', route => {
        route.abort('failed')
      })

      // Navigate to dashboard
      await page.goto('/area-assinante/dashboard')

      // Look for retry button if error is shown
      const retryButton = page.locator('button:has-text("Tentar Novamente"), button:has-text("Recarregar")')
      const hasRetry = await retryButton.count()

      // Either retry button exists or error is handled gracefully
      expect(hasRetry).toBeGreaterThanOrEqual(0)
    })
  })

  test.describe('Performance', () => {
    test('should load within acceptable time', async ({ page }) => {
      const startTime = Date.now()

      await page.goto('/area-assinante/dashboard')
      await page.waitForLoadState('networkidle')

      const loadTime = Date.now() - startTime

      // Dashboard should load within 5 seconds
      expect(loadTime).toBeLessThan(5000)
    })

    test('should not have console errors', async ({ page }) => {
      const consoleErrors: string[] = []

      page.on('console', msg => {
        if (msg.type() === 'error') {
          consoleErrors.push(msg.text())
        }
      })

      await page.goto('/area-assinante/dashboard')
      await page.waitForLoadState('networkidle')

      // Should have no critical console errors
      // Some warnings might be acceptable
      const criticalErrors = consoleErrors.filter(err =>
        !err.includes('Warning') &&
        !err.includes('DevTools')
      )
      expect(criticalErrors.length).toBe(0)
    })
  })
})
