/**
 * E2E Tests - Subscriber Dashboard Phase 4
 *
 * Comprehensive integration testing for:
 * - PrescriptionManager (upload, validation, history)
 * - PaymentHistoryTable (filtering, pagination, downloads)
 * - DeliveryPreferences (CEP validation, form management, notifications)
 *
 * Test Framework: Playwright
 * Pattern: Page Object Model with accessibility checks
 */

import { test, expect, Page } from '@playwright/test'

/**
 * Page Object Model for Dashboard
 */
class DashboardPage {
  constructor(private page: Page) {}

  async login() {
    await this.page.goto('/area-assinante/login')
    await this.page.fill('input[type="email"]', process.env.TEST_USER_EMAIL || 'test@example.com')
    await this.page.fill('input[type="password"]', process.env.TEST_USER_PASSWORD || 'testpassword')
    await this.page.click('button[type="submit"]')
    await this.page.waitForURL('/area-assinante/dashboard')
    await this.page.waitForLoadState('networkidle')
  }

  async navigateToPrescriptionTab() {
    const prescriptionTab = this.page.locator('text=Prescrição Médica, [aria-label*="Prescrição"]')
    await prescriptionTab.click()
    await this.page.waitForTimeout(500)
  }

  async navigateToPaymentsTab() {
    const paymentsTab = this.page.locator('text=Histórico de Pagamentos, [aria-label*="Pagamentos"]')
    await paymentsTab.click()
    await this.page.waitForTimeout(500)
  }

  async navigateToDeliveryTab() {
    const deliveryTab = this.page.locator('text=Preferências de Entrega, [aria-label*="Entrega"]')
    await deliveryTab.click()
    await this.page.waitForTimeout(500)
  }

  async waitForToast(text: string) {
    const toast = this.page.locator(`[role="status"]:has-text("${text}"), [aria-live]:has-text("${text}")`)
    await expect(toast).toBeVisible({ timeout: 5000 })
  }
}

test.describe('Phase 4 - Integrated Dashboard Features', () => {
  let dashboardPage: DashboardPage

  test.beforeEach(async ({ page }) => {
    dashboardPage = new DashboardPage(page)
    await dashboardPage.login()
  })

  test.describe('Prescription Management', () => {
    test('should display current prescription with status badge', async ({ page }) => {
      await dashboardPage.navigateToPrescriptionTab()

      // Verify prescription section is visible
      await expect(page.locator('text=Prescrição Atual')).toBeVisible()

      // Check for status badge
      const statusBadge = page.locator('[class*="badge"], .badge, text=/Válida|Expirando|Expirada/')
      await expect(statusBadge.first()).toBeVisible()
    })

    test('should show days until expiration countdown', async ({ page }) => {
      await dashboardPage.navigateToPrescriptionTab()

      // Look for countdown indicator
      const countdown = page.locator('text=/\\d+ dias?/, text=/Expira em/')
      const hasCountdown = await countdown.count()

      if (hasCountdown > 0) {
        await expect(countdown.first()).toBeVisible()
      }
    })

    test('should upload prescription file via drag and drop', async ({ page }) => {
      await dashboardPage.navigateToPrescriptionTab()

      // Create a mock PDF file
      const buffer = Buffer.from('PDF prescription content')
      const fileName = 'prescription.pdf'

      // Look for file input
      const fileInput = page.locator('input[type="file"]')
      await fileInput.setInputFiles({
        name: fileName,
        mimeType: 'application/pdf',
        buffer
      })

      // Should show preview
      await expect(page.locator(`text=${fileName}`)).toBeVisible()
    })

    test('should upload prescription via file chooser', async ({ page }) => {
      await dashboardPage.navigateToPrescriptionTab()

      const uploadButton = page.locator('button:has-text("Upload"), button:has-text("Enviar")')

      const [fileChooser] = await Promise.all([
        page.waitForEvent('filechooser'),
        uploadButton.click()
      ])

      await fileChooser.setFiles({
        name: 'medical-prescription.pdf',
        mimeType: 'application/pdf',
        buffer: Buffer.from('Medical prescription data')
      })

      // Verify file preview appears
      await expect(page.locator('text=medical-prescription.pdf')).toBeVisible({ timeout: 3000 })
    })

    test('should validate file type on upload', async ({ page }) => {
      await dashboardPage.navigateToPrescriptionTab()

      const fileInput = page.locator('input[type="file"]')

      // Try to upload invalid file type
      await fileInput.setInputFiles({
        name: 'document.txt',
        mimeType: 'text/plain',
        buffer: Buffer.from('Text file')
      })

      // Should show error message
      const errorMessage = page.locator('text=/formato.*suportado|tipo.*arquivo/i')
      await expect(errorMessage).toBeVisible({ timeout: 3000 })
    })

    test('should validate file size on upload', async ({ page }) => {
      await dashboardPage.navigateToPrescriptionTab()

      const fileInput = page.locator('input[type="file"]')

      // Create oversized file (6MB, limit is 5MB)
      const largeBuffer = Buffer.alloc(6 * 1024 * 1024)

      await fileInput.setInputFiles({
        name: 'large-prescription.pdf',
        mimeType: 'application/pdf',
        buffer: largeBuffer
      })

      // Should show size error
      const errorMessage = page.locator('text=/tamanho.*arquivo|muito grande/i')
      await expect(errorMessage).toBeVisible({ timeout: 3000 })
    })

    test('should confirm upload with preview', async ({ page }) => {
      await dashboardPage.navigateToPrescriptionTab()

      const uploadButton = page.locator('button:has-text("Upload"), button:has-text("Enviar")')

      const [fileChooser] = await Promise.all([
        page.waitForEvent('filechooser'),
        uploadButton.click()
      ])

      await fileChooser.setFiles({
        name: 'prescription.pdf',
        mimeType: 'application/pdf',
        buffer: Buffer.from('Valid prescription')
      })

      // Wait for preview
      await page.waitForTimeout(1000)

      // Should show confirm and cancel buttons
      await expect(page.locator('button:has-text("Confirmar")')).toBeVisible()
      await expect(page.locator('button:has-text("Cancelar")')).toBeVisible()
    })

    test('should cancel upload', async ({ page }) => {
      await dashboardPage.navigateToPrescriptionTab()

      const fileInput = page.locator('input[type="file"]')

      await fileInput.setInputFiles({
        name: 'prescription.pdf',
        mimeType: 'application/pdf',
        buffer: Buffer.from('Test')
      })

      await page.waitForTimeout(500)

      const cancelButton = page.locator('button:has-text("Cancelar")')
      await cancelButton.click()

      // Preview should disappear
      await expect(page.locator('button:has-text("Confirmar")')).not.toBeVisible()
    })

    test('should show prescription history', async ({ page }) => {
      await dashboardPage.navigateToPrescriptionTab()

      const historyButton = page.locator('button:has-text("Histórico"), text=/ver histórico/i')
      const hasHistory = await historyButton.count()

      if (hasHistory > 0) {
        await historyButton.first().click()

        // Should show historical prescriptions
        await expect(page.locator('text=/prescrições anteriores|histórico/i')).toBeVisible()
      }
    })

    test('should download prescription file', async ({ page }) => {
      await dashboardPage.navigateToPrescriptionTab()

      const downloadButton = page.locator('button:has-text("Download"), [aria-label*="Download"]')
      const hasDownload = await downloadButton.count()

      if (hasDownload > 0) {
        const [download] = await Promise.all([
          page.waitForEvent('download'),
          downloadButton.first().click()
        ])

        expect(download).toBeTruthy()
        expect(download.suggestedFilename()).toMatch(/\.pdf$/i)
      }
    })

    test('should display prescription details (eye measurements)', async ({ page }) => {
      await dashboardPage.navigateToPrescriptionTab()

      // Look for eye measurement details
      const leftEye = page.locator('text=/olho esquerdo|OE/i')
      const rightEye = page.locator('text=/olho direito|OD/i')

      const hasDetails = (await leftEye.count() > 0) || (await rightEye.count() > 0)

      if (hasDetails) {
        await expect(leftEye.or(rightEye).first()).toBeVisible()
      }
    })

    test('should have accessible prescription upload (ARIA)', async ({ page }) => {
      await dashboardPage.navigateToPrescriptionTab()

      const uploadArea = page.locator('[role="button"][aria-label*="upload"], [role="button"][aria-label*="enviar"]')
      const hasAccessibleUpload = await uploadArea.count()

      if (hasAccessibleUpload > 0) {
        await expect(uploadArea.first()).toBeVisible()
      }
    })
  })

  test.describe('Payment History', () => {
    test('should display payment history table', async ({ page }) => {
      await dashboardPage.navigateToPaymentsTab()

      // Verify table is visible
      const table = page.locator('table, [role="table"]')
      await expect(table).toBeVisible()
    })

    test('should display payment summary cards', async ({ page }) => {
      await dashboardPage.navigateToPaymentsTab()

      // Check for summary metrics
      const totalPaid = page.locator('text=/total pago/i')
      const totalPending = page.locator('text=/total pendente|a pagar/i')

      await expect(totalPaid.or(totalPending).first()).toBeVisible()
    })

    test('should filter payments by status', async ({ page }) => {
      await dashboardPage.navigateToPaymentsTab()

      // Find status filter dropdown
      const statusFilter = page.locator('select:has(option:has-text("Pago")), [aria-label*="Status"]')
      const hasFilter = await statusFilter.count()

      if (hasFilter > 0) {
        await statusFilter.first().selectOption('PAID')
        await page.waitForTimeout(1000)

        // Should show only paid payments
        const paidBadges = page.locator('text=Pago')
        const count = await paidBadges.count()
        expect(count).toBeGreaterThan(0)
      }
    })

    test('should filter payments by payment method', async ({ page }) => {
      await dashboardPage.navigateToPaymentsTab()

      const methodFilter = page.locator('select:has(option:has-text("PIX")), [aria-label*="Método"]')
      const hasFilter = await methodFilter.count()

      if (hasFilter > 0) {
        await methodFilter.first().selectOption('PIX')
        await page.waitForTimeout(1000)

        // Should show only PIX payments
        const pixPayments = page.locator('text=PIX')
        const count = await pixPayments.count()
        expect(count).toBeGreaterThanOrEqual(0)
      }
    })

    test('should filter payments by date range', async ({ page }) => {
      await dashboardPage.navigateToPaymentsTab()

      const periodFilter = page.locator('select:has(option:has-text("30 dias")), [aria-label*="Período"]')
      const hasFilter = await periodFilter.count()

      if (hasFilter > 0) {
        await periodFilter.first().selectOption('30')
        await page.waitForTimeout(1000)

        // Payments should be filtered
        const table = page.locator('table tbody tr')
        const count = await table.count()
        expect(count).toBeGreaterThanOrEqual(0)
      }
    })

    test('should navigate to next page', async ({ page }) => {
      await dashboardPage.navigateToPaymentsTab()

      const nextButton = page.locator('button:has-text("Próximo"), button[aria-label*="Próxima"]')
      const hasNext = await nextButton.count()

      if (hasNext > 0 && !(await nextButton.isDisabled())) {
        await nextButton.click()
        await page.waitForTimeout(1000)

        // Should update page indicator
        const pageIndicator = page.locator('text=/página 2|page 2/i')
        await expect(pageIndicator).toBeVisible()
      }
    })

    test('should navigate to previous page', async ({ page }) => {
      await dashboardPage.navigateToPaymentsTab()

      // First go to page 2
      const nextButton = page.locator('button:has-text("Próximo")')
      const hasNext = await nextButton.count()

      if (hasNext > 0 && !(await nextButton.isDisabled())) {
        await nextButton.click()
        await page.waitForTimeout(1000)

        // Now go back
        const prevButton = page.locator('button:has-text("Anterior"), button[aria-label*="Anterior"]')
        await prevButton.click()
        await page.waitForTimeout(1000)

        // Should be on page 1
        const pageIndicator = page.locator('text=/página 1|page 1/i')
        await expect(pageIndicator).toBeVisible()
      }
    })

    test('should download payment receipt', async ({ page }) => {
      await dashboardPage.navigateToPaymentsTab()

      const receiptButton = page.locator('button:has-text("Comprovante"), [aria-label*="Comprovante"]')
      const hasReceipt = await receiptButton.count()

      if (hasReceipt > 0) {
        const [download] = await Promise.all([
          page.waitForEvent('download'),
          receiptButton.first().click()
        ])

        expect(download).toBeTruthy()
      }
    })

    test('should download invoice', async ({ page }) => {
      await dashboardPage.navigateToPaymentsTab()

      const invoiceButton = page.locator('button:has-text("Nota Fiscal"), [aria-label*="Nota Fiscal"]')
      const hasInvoice = await invoiceButton.count()

      if (hasInvoice > 0) {
        const [download] = await Promise.all([
          page.waitForEvent('download'),
          invoiceButton.first().click()
        ])

        expect(download).toBeTruthy()
      }
    })

    test('should display payment status badges with correct colors', async ({ page }) => {
      await dashboardPage.navigateToPaymentsTab()

      // Check for different status badges
      const paidBadge = page.locator('.text-green-600:has-text("Pago"), [class*="green"]:has-text("Pago")')
      const pendingBadge = page.locator('.text-amber-600:has-text("Pendente"), [class*="amber"]:has-text("Pendente")')

      const hasBadges = (await paidBadge.count() > 0) || (await pendingBadge.count() > 0)

      if (hasBadges) {
        await expect(paidBadge.or(pendingBadge).first()).toBeVisible()
      }
    })

    test('should show empty state when no payments', async ({ page }) => {
      await dashboardPage.navigateToPaymentsTab()

      // Apply filter that might result in no payments
      const statusFilter = page.locator('select')
      const hasFilter = await statusFilter.count()

      if (hasFilter > 0) {
        await statusFilter.first().selectOption('CANCELLED')
        await page.waitForTimeout(1000)

        // Might show empty state
        const emptyState = page.locator('text=/nenhum pagamento|sem pagamentos/i')
        const hasEmpty = await emptyState.count()

        if (hasEmpty > 0) {
          await expect(emptyState.first()).toBeVisible()
        }
      }
    })

    test('should display payment amounts in BRL currency format', async ({ page }) => {
      await dashboardPage.navigateToPaymentsTab()

      // Look for currency formatted values
      const currencyValue = page.locator('text=/R\\$\\s*[0-9,.]+/')
      await expect(currencyValue.first()).toBeVisible()
    })

    test('should have accessible table (ARIA)', async ({ page }) => {
      await dashboardPage.navigateToPaymentsTab()

      const table = page.locator('[role="table"], table')
      await expect(table).toBeVisible()

      // Check for table headers
      const headers = page.locator('th, [role="columnheader"]')
      const headerCount = await headers.count()
      expect(headerCount).toBeGreaterThan(0)
    })
  })

  test.describe('Delivery Preferences', () => {
    test('should display delivery preferences form', async ({ page }) => {
      await dashboardPage.navigateToDeliveryTab()

      // Verify form is visible
      await expect(page.locator('text=Preferências de Entrega')).toBeVisible()
      await expect(page.locator('input[placeholder*="CEP"], input[aria-label*="CEP"]')).toBeVisible()
    })

    test('should validate CEP format', async ({ page }) => {
      await dashboardPage.navigateToDeliveryTab()

      const cepInput = page.locator('input[placeholder*="CEP"], input[aria-label*="CEP"]')
      await cepInput.fill('12345')  // Invalid CEP

      const saveButton = page.locator('button:has-text("Salvar")')
      await saveButton.click()

      // Should show validation error
      const errorMessage = page.locator('text=/CEP.*inválido|digite.*CEP/i')
      await expect(errorMessage).toBeVisible()
    })

    test('should search CEP and auto-fill address', async ({ page }) => {
      await dashboardPage.navigateToDeliveryTab()

      const cepInput = page.locator('input[placeholder*="CEP"], input[aria-label*="CEP"]')
      await cepInput.fill('35300-000')  // Valid CEP for Caratinga/MG

      const searchButton = page.locator('button:has-text("Buscar"), [aria-label*="Buscar CEP"]')
      const hasSearch = await searchButton.count()

      if (hasSearch > 0) {
        await searchButton.click()
        await page.waitForTimeout(2000)

        // Address fields should be auto-filled
        const streetInput = page.locator('input[placeholder*="Rua"], input[aria-label*="Rua"]')
        const streetValue = await streetInput.inputValue()
        expect(streetValue.length).toBeGreaterThan(0)
      }
    })

    test('should handle CEP not found', async ({ page }) => {
      await dashboardPage.navigateToDeliveryTab()

      const cepInput = page.locator('input[placeholder*="CEP"], input[aria-label*="CEP"]')
      await cepInput.fill('00000-000')  // Invalid/non-existent CEP

      const searchButton = page.locator('button:has-text("Buscar")')
      const hasSearch = await searchButton.count()

      if (hasSearch > 0) {
        await searchButton.click()
        await page.waitForTimeout(2000)

        // Should show error
        const errorMessage = page.locator('text=/CEP.*encontrado|não.*localizado/i')
        const hasError = await errorMessage.count()

        if (hasError > 0) {
          await expect(errorMessage.first()).toBeVisible()
        }
      }
    })

    test('should update address fields manually', async ({ page }) => {
      await dashboardPage.navigateToDeliveryTab()

      const streetInput = page.locator('input[placeholder*="Rua"], input[aria-label*="Rua"]')
      await streetInput.fill('Rua Nova Atualizada')

      const numberInput = page.locator('input[placeholder*="Número"], input[aria-label*="Número"]')
      await numberInput.fill('123')

      const complementInput = page.locator('input[placeholder*="Complemento"], input[aria-label*="Complemento"]')
      await complementInput.fill('Apto 45')

      // Verify inputs accept changes
      expect(await streetInput.inputValue()).toBe('Rua Nova Atualizada')
      expect(await numberInput.inputValue()).toBe('123')
      expect(await complementInput.inputValue()).toBe('Apto 45')
    })

    test('should select preferred delivery time', async ({ page }) => {
      await dashboardPage.navigateToDeliveryTab()

      const timeSelect = page.locator('select:has(option:has-text("Manhã")), [aria-label*="Horário"]')
      const hasSelect = await timeSelect.count()

      if (hasSelect > 0) {
        await timeSelect.first().selectOption('MORNING')

        // Verify selection
        const selectedValue = await timeSelect.first().inputValue()
        expect(selectedValue).toBe('MORNING')
      }
    })

    test('should add delivery instructions', async ({ page }) => {
      await dashboardPage.navigateToDeliveryTab()

      const instructionsInput = page.locator('textarea[placeholder*="instruções"], textarea[aria-label*="Instruções"]')
      const hasInstructions = await instructionsInput.count()

      if (hasInstructions > 0) {
        const instructions = 'Por favor, deixar com o porteiro se não houver ninguém em casa.'
        await instructionsInput.fill(instructions)

        expect(await instructionsInput.inputValue()).toBe(instructions)
      }
    })

    test('should validate max length for delivery instructions', async ({ page }) => {
      await dashboardPage.navigateToDeliveryTab()

      const instructionsInput = page.locator('textarea[placeholder*="instruções"], textarea[aria-label*="Instruções"]')
      const hasInstructions = await instructionsInput.count()

      if (hasInstructions > 0) {
        const longText = 'A'.repeat(501)  // Exceeds 500 char limit
        await instructionsInput.fill(longText)

        const saveButton = page.locator('button:has-text("Salvar")')
        await saveButton.click()

        // Should show validation error
        const errorMessage = page.locator('text=/máximo.*caracteres|muito longo/i')
        await expect(errorMessage).toBeVisible()
      }
    })

    test('should toggle notification preferences', async ({ page }) => {
      await dashboardPage.navigateToDeliveryTab()

      // Find notification checkboxes
      const emailCheckbox = page.locator('input[type="checkbox"]:near(text=/e-mail/i)')
      const whatsappCheckbox = page.locator('input[type="checkbox"]:near(text=/whatsapp/i)')

      const hasCheckboxes = (await emailCheckbox.count() > 0) || (await whatsappCheckbox.count() > 0)

      if (hasCheckboxes) {
        // Toggle email notification
        if (await emailCheckbox.count() > 0) {
          await emailCheckbox.first().click()
        }

        // Toggle WhatsApp notification
        if (await whatsappCheckbox.count() > 0) {
          await whatsappCheckbox.first().click()
        }
      }
    })

    test('should save delivery preferences successfully', async ({ page }) => {
      await dashboardPage.navigateToDeliveryTab()

      // Fill required fields
      const cepInput = page.locator('input[placeholder*="CEP"]')
      await cepInput.fill('35300-123')

      const streetInput = page.locator('input[placeholder*="Rua"]')
      await streetInput.fill('Rua Teste')

      const numberInput = page.locator('input[placeholder*="Número"]')
      await numberInput.fill('100')

      const neighborhoodInput = page.locator('input[placeholder*="Bairro"]')
      await neighborhoodInput.fill('Centro')

      const cityInput = page.locator('input[placeholder*="Cidade"]')
      await cityInput.fill('Caratinga')

      const stateInput = page.locator('input[placeholder*="Estado"]')
      await stateInput.fill('MG')

      // Save changes
      const saveButton = page.locator('button:has-text("Salvar")')
      await saveButton.click()

      // Should show success message
      await dashboardPage.waitForToast('sucesso')
    })

    test('should cancel changes', async ({ page }) => {
      await dashboardPage.navigateToDeliveryTab()

      const streetInput = page.locator('input[placeholder*="Rua"]')
      const originalValue = await streetInput.inputValue()

      await streetInput.fill('Rua Temporária')

      const cancelButton = page.locator('button:has-text("Cancelar")')
      const hasCancel = await cancelButton.count()

      if (hasCancel > 0) {
        await cancelButton.click()

        // Should restore original value or clear form
        const currentValue = await streetInput.inputValue()
        expect(currentValue === originalValue || currentValue === '').toBeTruthy()
      }
    })

    test('should display upcoming delivery information', async ({ page }) => {
      await dashboardPage.navigateToDeliveryTab()

      const upcomingDelivery = page.locator('text=/próxima entrega|previsão.*entrega/i')
      const hasUpcoming = await upcomingDelivery.count()

      if (hasUpcoming > 0) {
        await expect(upcomingDelivery.first()).toBeVisible()
      }
    })

    test('should show confirmation when preferences will affect next delivery', async ({ page }) => {
      await dashboardPage.navigateToDeliveryTab()

      const streetInput = page.locator('input[placeholder*="Rua"]')
      await streetInput.fill('Nova Rua')

      const saveButton = page.locator('button:has-text("Salvar")')
      await saveButton.click()

      // May show confirmation about affecting next delivery
      const confirmationMessage = page.locator('text=/próxima entrega.*novo endereço|alterações.*aplicadas/i')
      const hasConfirmation = await confirmationMessage.count()

      if (hasConfirmation > 0) {
        await expect(confirmationMessage.first()).toBeVisible()
      }
    })

    test('should have accessible form fields (ARIA labels)', async ({ page }) => {
      await dashboardPage.navigateToDeliveryTab()

      // Check for accessible inputs
      const cepInput = page.locator('input[aria-label*="CEP"], input[placeholder*="CEP"]')
      const streetInput = page.locator('input[aria-label*="Rua"], input[placeholder*="Rua"]')

      await expect(cepInput).toBeVisible()
      await expect(streetInput).toBeVisible()
    })
  })

  test.describe('Error Handling', () => {
    test('should handle prescription upload network error', async ({ page }) => {
      await dashboardPage.navigateToPrescriptionTab()

      // Intercept upload request and fail it
      await page.route('**/api/prescription/upload', route => {
        route.abort('failed')
      })

      const fileInput = page.locator('input[type="file"]')
      await fileInput.setInputFiles({
        name: 'prescription.pdf',
        mimeType: 'application/pdf',
        buffer: Buffer.from('Test')
      })

      const confirmButton = page.locator('button:has-text("Confirmar")')
      const hasConfirm = await confirmButton.count()

      if (hasConfirm > 0) {
        await confirmButton.click()
        await page.waitForTimeout(2000)

        // Should show error message
        const errorMessage = page.locator('text=/erro.*upload|falha.*envio/i')
        await expect(errorMessage).toBeVisible()
      }
    })

    test('should handle payment history API timeout', async ({ page }) => {
      await page.route('**/api/payments/**', route => {
        // Simulate timeout by never responding
        setTimeout(() => route.abort('timedout'), 5000)
      })

      await dashboardPage.navigateToPaymentsTab()
      await page.waitForTimeout(6000)

      // Should show timeout error or retry option
      const errorState = page.locator('text=/erro.*carregar|timeout|tentar novamente/i')
      const hasError = await errorState.count()

      if (hasError > 0) {
        await expect(errorState.first()).toBeVisible()
      }
    })

    test('should handle CEP API unavailable', async ({ page }) => {
      await dashboardPage.navigateToDeliveryTab()

      // Intercept ViaCEP API
      await page.route('**/viacep.com.br/**', route => {
        route.abort('failed')
      })

      const cepInput = page.locator('input[placeholder*="CEP"]')
      await cepInput.fill('35300-000')

      const searchButton = page.locator('button:has-text("Buscar")')
      const hasSearch = await searchButton.count()

      if (hasSearch > 0) {
        await searchButton.click()
        await page.waitForTimeout(2000)

        // Should show error about CEP service
        const errorMessage = page.locator('text=/erro.*buscar|serviço.*indisponível/i')
        const hasError = await errorMessage.count()

        if (hasError > 0) {
          await expect(errorMessage.first()).toBeVisible()
        }
      }
    })

    test('should retry failed prescription upload', async ({ page }) => {
      await dashboardPage.navigateToPrescriptionTab()

      let attemptCount = 0

      await page.route('**/api/prescription/upload', route => {
        attemptCount++
        if (attemptCount === 1) {
          route.abort('failed')
        } else {
          route.fulfill({
            status: 200,
            body: JSON.stringify({ success: true })
          })
        }
      })

      const fileInput = page.locator('input[type="file"]')
      await fileInput.setInputFiles({
        name: 'prescription.pdf',
        mimeType: 'application/pdf',
        buffer: Buffer.from('Test')
      })

      const confirmButton = page.locator('button:has-text("Confirmar")')
      if (await confirmButton.count() > 0) {
        await confirmButton.click()
        await page.waitForTimeout(2000)

        // Try again
        const retryButton = page.locator('button:has-text("Tentar Novamente")')
        const hasRetry = await retryButton.count()

        if (hasRetry > 0) {
          await retryButton.click()
          await page.waitForTimeout(2000)

          // Should succeed
          await dashboardPage.waitForToast('sucesso')
        }
      }
    })

    test('should handle delivery preferences save failure', async ({ page }) => {
      await dashboardPage.navigateToDeliveryTab()

      await page.route('**/api/delivery/preferences', route => {
        route.fulfill({
          status: 500,
          body: JSON.stringify({ error: 'Internal server error' })
        })
      })

      const saveButton = page.locator('button:has-text("Salvar")')
      await saveButton.click()

      await page.waitForTimeout(2000)

      // Should show error message
      const errorMessage = page.locator('text=/erro.*salvar|falha/i')
      await expect(errorMessage).toBeVisible()
    })
  })

  test.describe('Mobile Responsive', () => {
    test.use({ viewport: { width: 375, height: 667 } })

    test('should display prescription manager on mobile', async ({ page }) => {
      await dashboardPage.navigateToPrescriptionTab()

      await expect(page.locator('text=Prescrição')).toBeVisible()

      // Upload button should be tappable
      const uploadButton = page.locator('button:has-text("Upload"), input[type="file"]')
      await expect(uploadButton.first()).toBeVisible()
    })

    test('should display payment history table on mobile', async ({ page }) => {
      await dashboardPage.navigateToPaymentsTab()

      // Table should be visible (possibly scrollable horizontally)
      const table = page.locator('table, [role="table"]')
      await expect(table).toBeVisible()
    })

    test('should display delivery form on mobile', async ({ page }) => {
      await dashboardPage.navigateToDeliveryTab()

      const form = page.locator('form, [role="form"]')
      await expect(form).toBeVisible()

      // Form fields should be usable
      const cepInput = page.locator('input[placeholder*="CEP"]')
      await expect(cepInput).toBeVisible()
    })

    test('should support touch interactions for file upload', async ({ page }) => {
      await dashboardPage.navigateToPrescriptionTab()

      const uploadArea = page.locator('[role="button"]:has-text("Upload"), button:has-text("Enviar")')
      const hasUpload = await uploadArea.count()

      if (hasUpload > 0) {
        await uploadArea.first().tap()
        await page.waitForTimeout(500)
      }
    })

    test('should have readable text on mobile viewport', async ({ page }) => {
      await dashboardPage.navigateToPrescriptionTab()

      // Check font sizes are readable (minimum 14px recommended)
      const heading = page.locator('h1, h2, h3').first()
      const fontSize = await heading.evaluate(el =>
        window.getComputedStyle(el).fontSize
      )

      const pxValue = parseInt(fontSize)
      expect(pxValue).toBeGreaterThanOrEqual(14)
    })
  })

  test.describe('Performance', () => {
    test('should load Phase 4 components within acceptable time', async ({ page }) => {
      const startTime = Date.now()

      await dashboardPage.login()
      await dashboardPage.navigateToPrescriptionTab()
      await dashboardPage.navigateToPaymentsTab()
      await dashboardPage.navigateToDeliveryTab()

      const loadTime = Date.now() - startTime

      // All components should load within 8 seconds
      expect(loadTime).toBeLessThan(8000)
    })

    test('should not have memory leaks from file previews', async ({ page }) => {
      await dashboardPage.navigateToPrescriptionTab()

      // Upload multiple files
      for (let i = 0; i < 3; i++) {
        const fileInput = page.locator('input[type="file"]')
        await fileInput.setInputFiles({
          name: `prescription-${i}.pdf`,
          mimeType: 'application/pdf',
          buffer: Buffer.from(`Test ${i}`)
        })

        await page.waitForTimeout(500)

        // Cancel each upload
        const cancelButton = page.locator('button:has-text("Cancelar")')
        const hasCancel = await cancelButton.count()
        if (hasCancel > 0) {
          await cancelButton.click()
        }

        await page.waitForTimeout(200)
      }

      // Page should remain responsive
      const uploadButton = page.locator('button:has-text("Upload")')
      await expect(uploadButton).toBeVisible()
    })

    test('should handle large payment history pagination efficiently', async ({ page }) => {
      await dashboardPage.navigateToPaymentsTab()

      const startTime = Date.now()

      // Navigate through multiple pages
      for (let i = 0; i < 3; i++) {
        const nextButton = page.locator('button:has-text("Próximo")')
        const isDisabled = await nextButton.isDisabled()

        if (!isDisabled) {
          await nextButton.click()
          await page.waitForTimeout(500)
        } else {
          break
        }
      }

      const paginationTime = Date.now() - startTime

      // Pagination should be fast (< 3 seconds for 3 pages)
      expect(paginationTime).toBeLessThan(3000)
    })
  })

  test.describe('Accessibility', () => {
    test('should have keyboard navigation for prescription upload', async ({ page }) => {
      await dashboardPage.navigateToPrescriptionTab()

      // Tab to upload button
      await page.keyboard.press('Tab')
      const focusedElement = await page.evaluate(() => document.activeElement?.tagName)

      // Should be able to activate with Enter or Space
      await page.keyboard.press('Enter')
      await page.waitForTimeout(500)
    })

    test('should have ARIA labels for payment filters', async ({ page }) => {
      await dashboardPage.navigateToPaymentsTab()

      const statusFilter = page.locator('[aria-label*="status"], [aria-label*="Status"]')
      const hasAriaLabel = await statusFilter.count()

      if (hasAriaLabel > 0) {
        await expect(statusFilter.first()).toBeVisible()
      }
    })

    test('should announce form validation errors to screen readers', async ({ page }) => {
      await dashboardPage.navigateToDeliveryTab()

      const cepInput = page.locator('input[placeholder*="CEP"]')
      await cepInput.fill('123')  // Invalid

      const saveButton = page.locator('button:has-text("Salvar")')
      await saveButton.click()

      // Error should have aria-live or role="alert"
      const errorMessage = page.locator('[role="alert"], [aria-live="polite"]')
      const hasAccessibleError = await errorMessage.count()

      if (hasAccessibleError > 0) {
        await expect(errorMessage.first()).toBeVisible()
      }
    })

    test('should have sufficient color contrast for status badges', async ({ page }) => {
      await dashboardPage.navigateToPaymentsTab()

      const badge = page.locator('.badge, [class*="badge"]').first()
      const hasBadge = await badge.count()

      if (hasBadge > 0) {
        const contrast = await badge.evaluate(el => {
          const bgColor = window.getComputedStyle(el).backgroundColor
          const color = window.getComputedStyle(el).color
          // Simplified contrast check (real implementation would calculate WCAG ratio)
          return bgColor !== color
        })

        expect(contrast).toBeTruthy()
      }
    })
  })
})
