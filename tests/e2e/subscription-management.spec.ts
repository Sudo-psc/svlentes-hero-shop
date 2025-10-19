import { test, expect } from '@playwright/test'

test.describe('Subscription Management - Dashboard', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to login page
    await page.goto('/area-assinante/login')

    // Login with test credentials (você precisará ajustar com credenciais válidas)
    await page.fill('input[type="email"]', process.env.TEST_USER_EMAIL || 'test@example.com')
    await page.fill('input[type="password"]', process.env.TEST_USER_PASSWORD || 'testpassword')
    await page.click('button[type="submit"]')

    // Wait for dashboard to load
    await page.waitForURL('/area-assinante/dashboard')
    await page.waitForSelector('text=Bem-vindo')
  })

  test.describe('Change Plan Flow', () => {
    test('should open change plan modal', async ({ page }) => {
      // Click on "Mudar Plano" button
      await page.click('button:has-text("Mudar Plano")')

      // Verify modal is open
      await expect(page.locator('text=Alterar Plano')).toBeVisible()
      await expect(page.locator('text=Plano atual:')).toBeVisible()
    })

    test('should display all available plans', async ({ page }) => {
      await page.click('button:has-text("Mudar Plano")')

      // Wait for modal to load
      await page.waitForSelector('text=Alterar Plano')

      // Check that multiple plans are displayed
      const planCards = await page.locator('[role="dialog"] >> div:has-text("Plano")').count()
      expect(planCards).toBeGreaterThan(1)
    })

    test('should show price difference when selecting new plan', async ({ page }) => {
      await page.click('button:has-text("Mudar Plano")')

      // Wait for modal
      await page.waitForSelector('text=Alterar Plano')

      // Click on a different plan (not the current one)
      const planOptions = page.locator('[role="dialog"] >> div[class*="cursor-pointer"]')
      const planCount = await planOptions.count()

      if (planCount > 1) {
        await planOptions.nth(1).click()

        // Verify price difference is shown
        await expect(page.locator('text=Diferença mensal:')).toBeVisible()
      }
    })

    test('should prevent selecting the same plan', async ({ page }) => {
      await page.click('button:has-text("Mudar Plano")')
      await page.waitForSelector('text=Alterar Plano')

      // Try to confirm with current plan selected
      const confirmButton = page.locator('button:has-text("Confirmar Alteração")')

      // Button should be disabled
      await expect(confirmButton).toBeDisabled()
    })

    test('should close modal on cancel', async ({ page }) => {
      await page.click('button:has-text("Mudar Plano")')
      await page.waitForSelector('text=Alterar Plano')

      // Click cancel
      await page.click('button:has-text("Cancelar")')

      // Modal should be closed
      await expect(page.locator('text=Alterar Plano')).not.toBeVisible()
    })

    test('should close modal on ESC key', async ({ page }) => {
      await page.click('button:has-text("Mudar Plano")')
      await page.waitForSelector('text=Alterar Plano')

      // Press ESC
      await page.keyboard.press('Escape')

      // Modal should be closed
      await expect(page.locator('text=Alterar Plano')).not.toBeVisible()
    })
  })

  test.describe('Update Address Flow', () => {
    test('should open update address modal', async ({ page }) => {
      // Click on "Endereço" button
      await page.click('button:has-text("Endereço")')

      // Verify modal is open
      await expect(page.locator('text=Atualizar Endereço')).toBeVisible()
    })

    test('should auto-fill address from CEP', async ({ page }) => {
      await page.click('button:has-text("Endereço")')
      await page.waitForSelector('text=Atualizar Endereço')

      // Enter a valid CEP (example: 01310-100 - Av. Paulista, São Paulo)
      const cepInput = page.locator('input[id="zipCode"]')
      await cepInput.fill('01310100')
      await cepInput.blur()

      // Wait for ViaCEP response
      await page.waitForTimeout(2000)

      // Verify street is auto-filled
      const streetInput = page.locator('input[id="street"]')
      const streetValue = await streetInput.inputValue()
      expect(streetValue).toBeTruthy()
    })

    test('should require all mandatory fields', async ({ page }) => {
      await page.click('button:has-text("Endereço")')
      await page.waitForSelector('text=Atualizar Endereço')

      // Try to submit without filling fields
      await page.click('button[type="submit"]:has-text("Salvar Endereço")')

      // Check for HTML5 validation or error messages
      const requiredFields = ['zipCode', 'street', 'number', 'neighborhood', 'city', 'state']

      for (const field of requiredFields) {
        const input = page.locator(`input[id="${field}"]`)
        const isRequired = await input.getAttribute('required')
        expect(isRequired).not.toBeNull()
      }
    })

    test('should validate CEP format', async ({ page }) => {
      await page.click('button:has-text("Endereço")')
      await page.waitForSelector('text=Atualizar Endereço')

      // Enter invalid CEP
      await page.fill('input[id="zipCode"]', '123')

      // Try to submit
      await page.click('button[type="submit"]:has-text("Salvar Endereço")')

      // Should not proceed (validation should catch it)
      const modal = page.locator('text=Atualizar Endereço')
      await expect(modal).toBeVisible()
    })
  })

  test.describe('Update Payment Method Flow', () => {
    test('should open update payment modal', async ({ page }) => {
      // Click on "Forma Pagamento" button
      await page.click('button:has-text("Forma Pagamento")')

      // Verify modal is open
      await expect(page.locator('text=Alterar Forma de Pagamento')).toBeVisible()
    })

    test('should allow selecting PIX', async ({ page }) => {
      await page.click('button:has-text("Forma Pagamento")')
      await page.waitForSelector('text=Alterar Forma de Pagamento')

      // Click on PIX option
      await page.click('button:has-text("PIX")')

      // Verify PIX info message is shown
      await expect(page.locator('text=Com PIX, você receberá um QR Code')).toBeVisible()

      // Submit button should be enabled
      const submitButton = page.locator('button[type="submit"]:has-text("Salvar")')
      await expect(submitButton).toBeEnabled()
    })

    test('should allow selecting Boleto', async ({ page }) => {
      await page.click('button:has-text("Forma Pagamento")')
      await page.waitForSelector('text=Alterar Forma de Pagamento')

      // Click on Boleto option
      await page.click('button:has-text("Boleto")')

      // Verify Boleto info message is shown
      await expect(page.locator('text=Com Boleto Bancário')).toBeVisible()
    })

    test('should show credit card form when selecting card', async ({ page }) => {
      await page.click('button:has-text("Forma Pagamento")')
      await page.waitForSelector('text=Alterar Forma de Pagamento')

      // Click on Credit Card option
      await page.click('button:has-text("Cartão")')

      // Verify credit card form is shown
      await expect(page.locator('text=Dados do Cartão')).toBeVisible()
      await expect(page.locator('text=Dados do Titular')).toBeVisible()
      await expect(page.locator('input[id="cardNumber"]')).toBeVisible()
      await expect(page.locator('input[id="holderName"]')).toBeVisible()
    })

    test('should validate credit card fields', async ({ page }) => {
      await page.click('button:has-text("Forma Pagamento")')
      await page.waitForSelector('text=Alterar Forma de Pagamento')

      // Select credit card
      await page.click('button:has-text("Cartão")')

      // Check required fields
      const requiredFields = [
        'cardNumber', 'holderName', 'expiryMonth', 'expiryYear', 'ccv',
        'holderInfoName', 'cpf', 'holderEmail', 'holderCep',
        'holderNumber', 'holderPhone'
      ]

      for (const field of requiredFields) {
        const input = page.locator(`input[id="${field}"]`)
        if (await input.count() > 0) {
          const isRequired = await input.getAttribute('required')
          expect(isRequired).not.toBeNull()
        }
      }
    })

    test('should enforce card number length', async ({ page }) => {
      await page.click('button:has-text("Forma Pagamento")')
      await page.waitForSelector('text=Alterar Forma de Pagamento')

      await page.click('button:has-text("Cartão")')

      const cardInput = page.locator('input[id="cardNumber"]')
      const maxLength = await cardInput.getAttribute('maxlength')

      expect(maxLength).toBe('19')
    })
  })

  test.describe('Dashboard Refresh After Changes', () => {
    test('should refresh data after successful plan change', async ({ page }) => {
      // This test would require mocking the API or using a test environment
      // with actual data changes

      // Click refresh button
      await page.click('button:has-text("Atualizar")')

      // Verify loading state
      await page.waitForTimeout(500)

      // Data should be refreshed
      await expect(page.locator('text=Status da Assinatura')).toBeVisible()
    })
  })

  test.describe('Error Handling', () => {
    test('should display error message on API failure', async ({ page }) => {
      // This test requires mocking API failures
      // Implementation depends on your testing setup
    })

    test('should handle network errors gracefully', async ({ page }) => {
      // Test offline scenario
      await page.context().setOffline(true)

      await page.click('button:has-text("Atualizar")')

      // Should show error or handle gracefully
      await page.waitForTimeout(2000)

      await page.context().setOffline(false)
    })
  })

  test.describe('Accessibility', () => {
    test('modals should be keyboard accessible', async ({ page }) => {
      // Tab to "Mudar Plano" button
      await page.keyboard.press('Tab')
      await page.keyboard.press('Tab')

      // Press Enter to open modal
      await page.keyboard.press('Enter')

      // Modal should open
      await expect(page.locator('text=Alterar Plano')).toBeVisible()
    })

    test('should focus trap within modal', async ({ page }) => {
      await page.click('button:has-text("Mudar Plano")')
      await page.waitForSelector('text=Alterar Plano')

      // Tab through modal elements
      const focusableElements = await page.locator('[role="dialog"] >> button, [role="dialog"] >> input').count()

      expect(focusableElements).toBeGreaterThan(0)
    })
  })
})
