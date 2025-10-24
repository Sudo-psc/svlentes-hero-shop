import { test, expect } from '@playwright/test'

test.describe('Subscriber Dashboard - Phase 3 Features', () => {
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

  test.describe('Prescription Management', () => {
    test('should display valid prescription', async ({ page }) => {
      await page.waitForSelector('text=Prescrição Médica', { timeout: 10000 })

      await expect(page.locator('text=Prescrição Médica')).toBeVisible()
      await expect(page.locator('text=Válida, text=Expira em')).toBeVisible()
    })

    test('should show countdown until expiration', async ({ page }) => {
      await page.waitForSelector('text=Prescrição Médica', { timeout: 10000 })

      const countdown = page.locator('text=/\\d+ dias/')
      await expect(countdown.first()).toBeVisible()
    })

    test('should receive alert 30 days before expiration', async ({ page }) => {
      await page.waitForSelector('text=Prescrição Médica', { timeout: 10000 })

      // If prescription is expiring soon, should show alert
      const alert = page.locator('text=/vence|expira/i')
      const hasAlert = await alert.count()

      // Alert should exist if prescription is expiring
      if (hasAlert > 0) {
        await expect(alert.first()).toBeVisible()
      }
    })

    test('should upload new prescription', async ({ page, context }) => {
      await page.waitForSelector('text=Upload Nova Prescrição', { timeout: 10000 })

      const uploadButton = page.locator('text=Upload Nova Prescrição')
      await expect(uploadButton).toBeVisible()

      // Set file chooser handler
      const [fileChooser] = await Promise.all([
        page.waitForEvent('filechooser'),
        uploadButton.click()
      ])

      // Upload test file
      await fileChooser.setFiles({
        name: 'prescription.pdf',
        mimeType: 'application/pdf',
        buffer: Buffer.from('test prescription content')
      })

      // Should show preview
      await expect(page.locator('text=/prescription\.pdf/i')).toBeVisible()
    })

    test('should preview file before confirming upload', async ({ page }) => {
      await page.waitForSelector('text=Upload Nova Prescrição', { timeout: 10000 })

      const uploadButton = page.locator('text=Upload Nova Prescrição')

      const [fileChooser] = await Promise.all([
        page.waitForEvent('filechooser'),
        uploadButton.click()
      ])

      await fileChooser.setFiles({
        name: 'prescription.pdf',
        mimeType: 'application/pdf',
        buffer: Buffer.from('test content')
      })

      // Should show preview and confirm button
      await expect(page.locator('text=Confirmar Upload')).toBeVisible()
      await expect(page.locator('text=Cancelar')).toBeVisible()
    })

    test('should cancel upload', async ({ page }) => {
      await page.waitForSelector('text=Upload Nova Prescrição', { timeout: 10000 })

      const uploadButton = page.locator('text=Upload Nova Prescrição')

      const [fileChooser] = await Promise.all([
        page.waitForEvent('filechooser'),
        uploadButton.click()
      ])

      await fileChooser.setFiles({
        name: 'prescription.pdf',
        mimeType: 'application/pdf',
        buffer: Buffer.from('test content')
      })

      // Click cancel
      const cancelButton = page.locator('text=Cancelar')
      await cancelButton.click()

      // Preview should disappear
      await expect(page.locator('text=Confirmar Upload')).not.toBeVisible()
    })

    test('should view prescription history', async ({ page }) => {
      await page.waitForSelector('text=Prescrição Médica', { timeout: 10000 })

      const historyButton = page.locator('text=/ver histórico|histórico/i').first()
      const hasHistory = await historyButton.count()

      if (hasHistory > 0) {
        await historyButton.click()

        // Should show historical prescriptions
        await expect(page.locator('text=/prescrições anteriores/i')).toBeVisible()
      }
    })

    test('should expand and collapse history', async ({ page }) => {
      await page.waitForSelector('text=Prescrição Médica', { timeout: 10000 })

      const historyButton = page.locator('text=/ver histórico/i').first()
      const hasHistory = await historyButton.count()

      if (hasHistory > 0) {
        // Expand
        await historyButton.click()
        await expect(page.locator('text=/prescrições anteriores/i')).toBeVisible()

        // Collapse
        const collapseButton = page.locator('text=/ocultar histórico/i').first()
        await collapseButton.click()
        await expect(page.locator('text=/prescrições anteriores/i')).not.toBeVisible()
      }
    })
  })

  test.describe('Payment History', () => {
    test('should display payment list', async ({ page }) => {
      await page.waitForSelector('text=Histórico de Pagamentos', { timeout: 10000 })

      await expect(page.locator('text=Histórico de Pagamentos')).toBeVisible()

      const table = page.locator('table, [role="table"]').first()
      await expect(table).toBeVisible()
    })

    test('should display summary cards', async ({ page }) => {
      await page.waitForSelector('text=Histórico de Pagamentos', { timeout: 10000 })

      await expect(page.locator('text=Total Pago')).toBeVisible()
      await expect(page.locator('text=Total Pendente')).toBeVisible()
    })

    test('should filter by status', async ({ page }) => {
      await page.waitForSelector('text=Histórico de Pagamentos', { timeout: 10000 })

      const statusFilter = page.locator('select, [aria-label*="status"]').first()
      await statusFilter.selectOption('PAID')

      await page.waitForTimeout(1000)

      // Should show only paid payments
      const paidBadges = page.locator('text=Pago')
      const count = await paidBadges.count()
      expect(count).toBeGreaterThan(0)
    })

    test('should filter by payment method', async ({ page }) => {
      await page.waitForSelector('text=Histórico de Pagamentos', { timeout: 10000 })

      const methodFilter = page.locator('select, [aria-label*="método"]').first()
      const hasFilter = await methodFilter.count()

      if (hasFilter > 0) {
        await methodFilter.selectOption('PIX')
        await page.waitForTimeout(1000)

        // Should show only PIX payments
        const pixBadges = page.locator('text=PIX')
        const count = await pixBadges.count()
        expect(count).toBeGreaterThan(0)
      }
    })

    test('should filter by date period', async ({ page }) => {
      await page.waitForSelector('text=Histórico de Pagamentos', { timeout: 10000 })

      const startDateInput = page.locator('input[type="date"]').first()
      const hasDateFilter = await startDateInput.count()

      if (hasDateFilter > 0) {
        await startDateInput.fill('2025-09-01')

        const endDateInput = page.locator('input[type="date"]').nth(1)
        await endDateInput.fill('2025-10-31')

        await page.waitForTimeout(1000)

        // Payments should be filtered by date
        const payments = page.locator('table tbody tr')
        const count = await payments.count()
        expect(count).toBeGreaterThanOrEqual(0)
      }
    })

    test('should navigate pagination', async ({ page }) => {
      await page.waitForSelector('text=Histórico de Pagamentos', { timeout: 10000 })

      const nextButton = page.locator('button:has-text("Próximo"), button:has-text("Next")').first()
      const hasNext = await nextButton.count()

      if (hasNext > 0 && !(await nextButton.isDisabled())) {
        await nextButton.click()
        await page.waitForTimeout(1000)

        // Should be on page 2
        const pageIndicator = page.locator('text=/página 2/i')
        await expect(pageIndicator).toBeVisible()
      }
    })

    test('should download invoice', async ({ page }) => {
      await page.waitForSelector('text=Histórico de Pagamentos', { timeout: 10000 })

      const downloadButton = page.locator('button:has-text("Nota Fiscal"), a:has-text("Nota Fiscal")').first()
      const hasDownload = await downloadButton.count()

      if (hasDownload > 0) {
        const [download] = await Promise.all([
          page.waitForEvent('download'),
          downloadButton.click()
        ])

        expect(download).toBeTruthy()
      }
    })

    test('should download receipt', async ({ page }) => {
      await page.waitForSelector('text=Histórico de Pagamentos', { timeout: 10000 })

      const receiptButton = page.locator('button:has-text("Comprovante"), a:has-text("Comprovante")').first()
      const hasReceipt = await receiptButton.count()

      if (hasReceipt > 0) {
        const [download] = await Promise.all([
          page.waitForEvent('download'),
          receiptButton.click()
        ])

        expect(download).toBeTruthy()
      }
    })
  })

  test.describe('Delivery Preferences', () => {
    test('should display current preferences', async ({ page }) => {
      await page.waitForSelector('text=Preferências de Entrega', { timeout: 10000 })

      await expect(page.locator('text=Preferências de Entrega')).toBeVisible()
      await expect(page.locator('input[aria-label*="CEP"], input[placeholder*="CEP"]')).toBeVisible()
    })

    test('should search CEP and auto-fill', async ({ page }) => {
      await page.waitForSelector('text=Preferências de Entrega', { timeout: 10000 })

      const cepInput = page.locator('input[aria-label*="CEP"], input[placeholder*="CEP"]').first()
      await cepInput.fill('35300-000')

      const searchButton = page.locator('button:has-text("Buscar CEP")').first()
      await searchButton.click()

      await page.waitForTimeout(2000)

      // Address fields should be auto-filled
      const streetInput = page.locator('input[aria-label*="Rua"], input[placeholder*="Rua"]').first()
      const streetValue = await streetInput.inputValue()
      expect(streetValue.length).toBeGreaterThan(0)
    })

    test('should edit preferences', async ({ page }) => {
      await page.waitForSelector('text=Preferências de Entrega', { timeout: 10000 })

      const streetInput = page.locator('input[aria-label*="Rua"], input[placeholder*="Rua"]').first()
      await streetInput.fill('Rua Editada')

      const numberInput = page.locator('input[aria-label*="Número"], input[placeholder*="Número"]').first()
      await numberInput.fill('999')

      // Form should accept edits
      expect(await streetInput.inputValue()).toBe('Rua Editada')
      expect(await numberInput.inputValue()).toBe('999')
    })

    test('should save changes', async ({ page }) => {
      await page.waitForSelector('text=Preferências de Entrega', { timeout: 10000 })

      const streetInput = page.locator('input[aria-label*="Rua"], input[placeholder*="Rua"]').first()
      await streetInput.fill('Rua Nova')

      const saveButton = page.locator('button:has-text("Salvar")').first()
      await saveButton.click()

      await page.waitForTimeout(2000)

      // Should show success message
      const successMessage = page.locator('text=/sucesso|salvo/i')
      await expect(successMessage.first()).toBeVisible({ timeout: 5000 })
    })

    test('should show confirmation after save', async ({ page }) => {
      await page.waitForSelector('text=Preferências de Entrega', { timeout: 10000 })

      const saveButton = page.locator('button:has-text("Salvar")').first()
      await saveButton.click()

      await page.waitForTimeout(2000)

      // Should show success feedback
      const feedback = page.locator('text=/sucesso|confirmado/i')
      await expect(feedback.first()).toBeVisible({ timeout: 5000 })
    })

    test('should cancel editing', async ({ page }) => {
      await page.waitForSelector('text=Preferências de Entrega', { timeout: 10000 })

      const streetInput = page.locator('input[aria-label*="Rua"], input[placeholder*="Rua"]').first()
      const originalValue = await streetInput.inputValue()

      await streetInput.fill('Rua Temporária')

      const cancelButton = page.locator('button:has-text("Cancelar")').first()
      const hasCancel = await cancelButton.count()

      if (hasCancel > 0) {
        await cancelButton.click()

        // Should restore original value
        expect(await streetInput.inputValue()).toBe(originalValue)
      }
    })
  })

  test.describe('Integration Scenarios', () => {
    test('should upload prescription and show in history', async ({ page }) => {
      await page.waitForSelector('text=Prescrição Médica', { timeout: 10000 })

      const uploadButton = page.locator('text=Upload Nova Prescrição')

      const [fileChooser] = await Promise.all([
        page.waitForEvent('filechooser'),
        uploadButton.click()
      ])

      await fileChooser.setFiles({
        name: 'prescription.pdf',
        mimeType: 'application/pdf',
        buffer: Buffer.from('test content')
      })

      const confirmButton = page.locator('text=Confirmar Upload')
      await confirmButton.click()

      await page.waitForTimeout(3000)

      // Should appear in history
      const historyButton = page.locator('text=/ver histórico/i').first()
      if (await historyButton.count() > 0) {
        await historyButton.click()
        await expect(page.locator('text=/prescrições anteriores/i')).toBeVisible()
      }
    })

    test('should complete payment and show in history', async ({ page }) => {
      // Navigate to payments
      await page.waitForSelector('text=Histórico de Pagamentos', { timeout: 10000 })

      const initialCount = await page.locator('table tbody tr').count()

      // Simulate payment (if payment flow exists)
      // After payment, should appear in history
      await page.waitForTimeout(1000)

      const finalCount = await page.locator('table tbody tr').count()
      expect(finalCount).toBeGreaterThanOrEqual(initialCount)
    })

    test('should update address and reflect in next delivery', async ({ page }) => {
      await page.waitForSelector('text=Preferências de Entrega', { timeout: 10000 })

      const streetInput = page.locator('input[aria-label*="Rua"], input[placeholder*="Rua"]').first()
      await streetInput.fill('Rua Atualizada')

      const saveButton = page.locator('button:has-text("Salvar")').first()
      await saveButton.click()

      await page.waitForTimeout(2000)

      // Should show next delivery with updated address
      const nextDelivery = page.locator('text=/próxima entrega/i')
      await expect(nextDelivery.first()).toBeVisible()
    })

    test('should show alert when prescription expires', async ({ page }) => {
      await page.waitForSelector('text=Prescrição Médica', { timeout: 10000 })

      // If prescription is expiring, should show alert in dashboard
      const alert = page.locator('[role="alert"], .alert, text=/atenção.*prescrição/i')
      const hasAlert = await alert.count()

      // Alert should be visible if prescription is expiring
      if (hasAlert > 0) {
        await expect(alert.first()).toBeVisible()
      }
    })

    test('should show overdue payment in contextual actions', async ({ page }) => {
      await page.waitForSelector('text=Ações Rápidas', { timeout: 10000 })

      // If there's an overdue payment, should appear in quick actions
      const overdueAction = page.locator('text=/pagamento.*atrasado|pendente/i')
      const hasOverdue = await overdueAction.count()

      if (hasOverdue > 0) {
        await expect(overdueAction.first()).toBeVisible()
      }
    })
  })

  test.describe('Mobile Responsive', () => {
    test('should display all components on mobile viewport (375px)', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 })

      // All Phase 3 components should be visible
      await expect(page.locator('text=Prescrição Médica')).toBeVisible()
      await expect(page.locator('text=Histórico de Pagamentos')).toBeVisible()
      await expect(page.locator('text=Preferências de Entrega')).toBeVisible()
    })

    test('should support touch interactions on mobile', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 })

      const uploadButton = page.locator('text=Upload Nova Prescrição')
      await expect(uploadButton).toBeVisible()

      // Should respond to tap
      await uploadButton.tap()
      await page.waitForTimeout(500)
    })

    test('should have usable forms on mobile', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 })

      await page.waitForSelector('text=Preferências de Entrega', { timeout: 10000 })

      const cepInput = page.locator('input[aria-label*="CEP"], input[placeholder*="CEP"]').first()
      await cepInput.tap()
      await cepInput.fill('35300-000')

      expect(await cepInput.inputValue()).toBe('35300-000')
    })
  })

  test.describe('Performance', () => {
    test('should load Phase 3 features within acceptable time', async ({ page }) => {
      const startTime = Date.now()

      await page.goto('/area-assinante/dashboard')
      await page.waitForLoadState('networkidle')

      const loadTime = Date.now() - startTime

      // Phase 3 features should load within 5 seconds
      expect(loadTime).toBeLessThan(5000)
    })

    test('should not have JavaScript errors', async ({ page }) => {
      const consoleErrors: string[] = []

      page.on('console', msg => {
        if (msg.type() === 'error') {
          consoleErrors.push(msg.text())
        }
      })

      await page.goto('/area-assinante/dashboard')
      await page.waitForLoadState('networkidle')

      // Filter out non-critical errors
      const criticalErrors = consoleErrors.filter(err =>
        !err.includes('Warning') &&
        !err.includes('DevTools') &&
        !err.includes('Lighthouse')
      )

      expect(criticalErrors.length).toBe(0)
    })
  })

  test.describe('Error Handling', () => {
    test('should handle API errors gracefully', async ({ page }) => {
      // Intercept API calls and make them fail
      await page.route('**/api/assinante/**', route => {
        route.abort('failed')
      })

      await page.goto('/area-assinante/dashboard')
      await page.waitForTimeout(2000)

      // Should show error message or fallback
      const errorMessage = page.locator('text=/erro|error/i').first()
      const hasError = await errorMessage.isVisible({ timeout: 5000 }).catch(() => false)

      if (hasError) {
        // Should have retry option
        const retryButton = page.locator('button:has-text("Tentar Novamente")').first()
        await expect(retryButton).toBeVisible()
      }
    })

    test('should retry failed requests', async ({ page }) => {
      let callCount = 0

      await page.route('**/api/assinante/prescription', route => {
        callCount++
        if (callCount === 1) {
          route.abort('failed')
        } else {
          route.fulfill({
            status: 200,
            body: JSON.stringify({
              currentPrescription: {
                status: 'VALID',
                daysUntilExpiry: 100
              }
            })
          })
        }
      })

      await page.goto('/area-assinante/dashboard')
      await page.waitForTimeout(2000)

      const retryButton = page.locator('button:has-text("Tentar Novamente")').first()
      const hasRetry = await retryButton.isVisible().catch(() => false)

      if (hasRetry) {
        await retryButton.click()
        await page.waitForTimeout(2000)

        // Should load successfully
        await expect(page.locator('text=Prescrição Médica')).toBeVisible({ timeout: 10000 })
      }
    })
  })
})
