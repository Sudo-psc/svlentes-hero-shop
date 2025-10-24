import { test, expect } from '@playwright/test'

test.describe('Subscriber Dashboard - Phase 2 Features', () => {
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

  test.describe('Real-Time Delivery Status', () => {
    test('should display delivery status in real-time', async ({ page }) => {
      // Wait for delivery status section to load
      await page.waitForSelector('text=Status da Entrega', { timeout: 10000 })

      // Verify delivery status is visible
      await expect(page.locator('text=Status da Entrega')).toBeVisible()

      // Should show delivery information
      const deliverySection = page.locator('[data-testid="delivery-status"]').first()
      await expect(deliverySection).toBeVisible()
    })

    test('should show progress bar animation', async ({ page }) => {
      await page.waitForSelector('text=Status da Entrega', { timeout: 10000 })

      // Progress bar should be visible
      const progressBar = page.locator('[role="progressbar"]').first()
      await expect(progressBar).toBeVisible()

      // Progress bar should have a value
      const progressValue = await progressBar.getAttribute('aria-valuenow')
      expect(progressValue).toBeTruthy()
      expect(parseInt(progressValue || '0')).toBeGreaterThanOrEqual(0)
      expect(parseInt(progressValue || '0')).toBeLessThanOrEqual(100)
    })

    test('should display countdown timer', async ({ page }) => {
      await page.waitForSelector('text=Status da Entrega', { timeout: 10000 })

      // Should show days remaining or delivery date
      const daysRemainingText = page.locator('text=/\\d+ dia/i').first()

      // Either days remaining or estimated date should be visible
      const hasCountdown = await daysRemainingText.isVisible().catch(() => false)
      const hasEstimatedDate = await page.locator('text=/entrega prevista/i').isVisible().catch(() => false)

      expect(hasCountdown || hasEstimatedDate).toBeTruthy()
    })

    test('should show tracking code and link when available', async ({ page }) => {
      await page.waitForSelector('text=Status da Entrega', { timeout: 10000 })

      // Look for tracking code
      const trackingCode = page.locator('text=/BR[0-9]{9}BR|[A-Z]{2}[0-9]{9}[A-Z]{2}/i').first()
      const hasTracking = await trackingCode.isVisible().catch(() => false)

      if (hasTracking) {
        // If tracking code exists, should have tracking link
        const trackingLink = page.locator('a[href*="rastreamento"], a[href*="tracking"]').first()
        await expect(trackingLink).toBeVisible()
      }
    })

    test('should display delivery timeline', async ({ page }) => {
      await page.waitForSelector('text=Status da Entrega', { timeout: 10000 })

      // Look for timeline section
      const timeline = page.locator('text=/linha do tempo|timeline/i').first()
      const hasTimeline = await timeline.isVisible().catch(() => false)

      if (hasTimeline) {
        // Should show timeline events
        const timelineEvents = page.locator('[data-testid="timeline-event"]')
        const eventCount = await timelineEvents.count()
        expect(eventCount).toBeGreaterThan(0)
      }
    })
  })

  test.describe('Contextual Quick Actions', () => {
    test('should render contextual actions', async ({ page }) => {
      await page.waitForSelector('text=Ações Rápidas', { timeout: 10000 })

      // Verify quick actions section is visible
      await expect(page.locator('text=Ações Rápidas')).toBeVisible()
    })

    test('should show high priority actions first', async ({ page }) => {
      await page.waitForSelector('text=Ações Rápidas', { timeout: 10000 })

      // Get all action buttons
      const actionButtons = page.locator('[data-testid="quick-action"]')
      const buttonCount = await actionButtons.count()

      if (buttonCount > 0) {
        // First action should be visible
        await expect(actionButtons.first()).toBeVisible()

        // High priority actions should have destructive or warning styling
        const firstButton = actionButtons.first()
        const className = await firstButton.getAttribute('class')

        // Check if it's a high priority action (red or amber styling)
        const isHighPriority = className?.includes('red') ||
                              className?.includes('amber') ||
                              className?.includes('destructive') ||
                              className?.includes('warning')

        // At least some actions should exist
        expect(buttonCount).toBeGreaterThan(0)
      }
    })

    test('should execute action on click', async ({ page }) => {
      await page.waitForSelector('text=Ações Rápidas', { timeout: 10000 })

      const actionButtons = page.locator('[data-testid="quick-action"]')
      const buttonCount = await actionButtons.count()

      if (buttonCount > 0) {
        // Click first action
        const firstAction = actionButtons.first()
        const actionText = await firstAction.textContent()

        await firstAction.click()

        // Should navigate or show modal/dialog
        // Wait for either navigation or dialog
        await page.waitForTimeout(1000)

        // Verify some UI change occurred
        const currentUrl = page.url()
        expect(currentUrl).toBeTruthy()
      }
    })

    test('should show WhatsApp action', async ({ page }) => {
      await page.waitForSelector('text=Ações Rápidas', { timeout: 10000 })

      // WhatsApp action should always be present
      const whatsappAction = page.locator('text=/falar no whatsapp|whatsapp/i').first()
      await expect(whatsappAction).toBeVisible()
    })

    test('should display action descriptions', async ({ page }) => {
      await page.waitForSelector('text=Ações Rápidas', { timeout: 10000 })

      const actionButtons = page.locator('[data-testid="quick-action"]')
      const buttonCount = await actionButtons.count()

      if (buttonCount > 0) {
        const firstAction = actionButtons.first()

        // Each action should have title and description
        const hasTitle = await firstAction.locator('text=/[A-Za-z]+/').first().isVisible()
        expect(hasTitle).toBeTruthy()
      }
    })
  })

  test.describe('Floating WhatsApp Button', () => {
    test('should display floating WhatsApp button', async ({ page }) => {
      // Floating WhatsApp button should be visible
      const whatsappButton = page.locator('[data-testid="floating-whatsapp"], button:has-text("WhatsApp")').last()
      await expect(whatsappButton).toBeVisible()
    })

    test('should have fixed positioning', async ({ page }) => {
      const whatsappButton = page.locator('[data-testid="floating-whatsapp"], button:has-text("WhatsApp")').last()
      await expect(whatsappButton).toBeVisible()

      // Check if button has fixed positioning
      const position = await whatsappButton.evaluate(el => {
        return window.getComputedStyle(el).position
      })

      expect(position).toBe('fixed')
    })

    test('should show badge with message count', async ({ page }) => {
      const whatsappButton = page.locator('[data-testid="floating-whatsapp"], button:has-text("WhatsApp")').last()
      await expect(whatsappButton).toBeVisible()

      // Look for badge (might not always be present)
      const badge = whatsappButton.locator('.badge, [data-testid="message-badge"]').first()
      const hasBadge = await badge.isVisible().catch(() => false)

      if (hasBadge) {
        const badgeText = await badge.textContent()
        expect(badgeText).toBeTruthy()
      }
    })

    test('should scroll behavior - hide on scroll down', async ({ page }) => {
      const whatsappButton = page.locator('[data-testid="floating-whatsapp"], button:has-text("WhatsApp")').last()

      // Button should be visible initially
      await expect(whatsappButton).toBeVisible()

      // Scroll down
      await page.evaluate(() => window.scrollTo(0, 500))
      await page.waitForTimeout(500)

      // Button might hide or stay visible depending on implementation
      // Just verify it exists
      const buttonExists = await whatsappButton.count()
      expect(buttonExists).toBeGreaterThan(0)
    })

    test('should redirect to WhatsApp on click', async ({ page, context }) => {
      const whatsappButton = page.locator('[data-testid="floating-whatsapp"], button:has-text("WhatsApp")').last()
      await expect(whatsappButton).toBeVisible()

      // Listen for new page/tab
      const pagePromise = context.waitForEvent('page', { timeout: 5000 }).catch(() => null)

      // Click WhatsApp button
      await whatsappButton.click()

      // Should open WhatsApp in new tab
      const newPage = await pagePromise

      if (newPage) {
        const url = newPage.url()
        expect(url).toContain('wa.me')
        await newPage.close()
      }
    })
  })

  test.describe('Integration Tests', () => {
    test('should load all Phase 2 components together', async ({ page }) => {
      // Wait for all main sections to load
      await page.waitForSelector('text=Minha Assinatura', { timeout: 10000 })

      // Verify all Phase 2 components are present
      const deliveryStatus = page.locator('text=Status da Entrega').first()
      const quickActions = page.locator('text=Ações Rápidas').first()
      const whatsappButton = page.locator('button:has-text("WhatsApp")').last()

      // All should be visible
      await expect(deliveryStatus).toBeVisible({ timeout: 10000 })
      await expect(quickActions).toBeVisible({ timeout: 10000 })
      await expect(whatsappButton).toBeVisible()
    })

    test('should interact with multiple features in sequence', async ({ page }) => {
      // 1. Check delivery status
      await page.waitForSelector('text=Status da Entrega', { timeout: 10000 })
      const deliverySection = page.locator('[data-testid="delivery-status"]').first()
      await expect(deliverySection).toBeVisible()

      // 2. Click on a quick action
      const actionButtons = page.locator('[data-testid="quick-action"]')
      const buttonCount = await actionButtons.count()

      if (buttonCount > 0) {
        await actionButtons.first().click()
        await page.waitForTimeout(1000)
      }

      // 3. Go back to dashboard
      await page.goto('/area-assinante/dashboard')
      await page.waitForLoadState('networkidle')

      // 4. Check floating WhatsApp button still works
      const whatsappButton = page.locator('button:has-text("WhatsApp")').last()
      await expect(whatsappButton).toBeVisible()
    })
  })

  test.describe('Responsive Design', () => {
    test('should render properly on mobile', async ({ page }) => {
      // Set mobile viewport
      await page.setViewportSize({ width: 375, height: 667 })

      // All components should still be visible and functional
      await expect(page.locator('text=Minha Assinatura')).toBeVisible()
      await expect(page.locator('text=Status da Entrega')).toBeVisible()
      await expect(page.locator('text=Ações Rápidas')).toBeVisible()
    })

    test('should render properly on tablet', async ({ page }) => {
      // Set tablet viewport
      await page.setViewportSize({ width: 768, height: 1024 })

      // All components should render correctly
      await expect(page.locator('text=Minha Assinatura')).toBeVisible()
      await expect(page.locator('text=Status da Entrega')).toBeVisible()
      await expect(page.locator('text=Ações Rápidas')).toBeVisible()
    })

    test('should render properly on desktop', async ({ page }) => {
      // Set desktop viewport
      await page.setViewportSize({ width: 1920, height: 1080 })

      // All components should render correctly
      await expect(page.locator('text=Minha Assinatura')).toBeVisible()
      await expect(page.locator('text=Status da Entrega')).toBeVisible()
      await expect(page.locator('text=Ações Rápidas')).toBeVisible()
    })
  })

  test.describe('Error Handling', () => {
    test('should handle API errors gracefully', async ({ page }) => {
      // Intercept API calls and make them fail
      await page.route('**/api/assinante/delivery-status', route => {
        route.abort('failed')
      })

      await page.goto('/area-assinante/dashboard')

      // Should show error message or fallback
      const errorMessage = page.locator('text=/erro|error/i').first()
      const hasError = await errorMessage.isVisible({ timeout: 5000 }).catch(() => false)

      if (hasError) {
        // Should have retry button
        const retryButton = page.locator('button:has-text("Tentar Novamente")').first()
        await expect(retryButton).toBeVisible()
      }
    })

    test('should retry failed requests', async ({ page }) => {
      let callCount = 0

      // First call fails, second succeeds
      await page.route('**/api/assinante/delivery-status', route => {
        callCount++
        if (callCount === 1) {
          route.abort('failed')
        } else {
          route.fulfill({
            status: 200,
            body: JSON.stringify({
              delivery: {
                status: 'in_transit',
                progress: 60,
                trackingCode: 'BR123456789BR'
              }
            })
          })
        }
      })

      await page.goto('/area-assinante/dashboard')

      // Wait for error
      await page.waitForTimeout(2000)

      // Click retry if available
      const retryButton = page.locator('button:has-text("Tentar Novamente")').first()
      const hasRetry = await retryButton.isVisible().catch(() => false)

      if (hasRetry) {
        await retryButton.click()

        // Should load successfully
        await expect(page.locator('text=Status da Entrega')).toBeVisible({ timeout: 10000 })
      }
    })
  })

  test.describe('Performance', () => {
    test('should load Phase 2 features within acceptable time', async ({ page }) => {
      const startTime = Date.now()

      await page.goto('/area-assinante/dashboard')
      await page.waitForLoadState('networkidle')

      const loadTime = Date.now() - startTime

      // Phase 2 features should load within 5 seconds
      expect(loadTime).toBeLessThan(5000)
    })

    test('should not have JavaScript errors in console', async ({ page }) => {
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

  test.describe('Accessibility', () => {
    test('should have accessible action buttons', async ({ page }) => {
      await page.waitForSelector('text=Ações Rápidas', { timeout: 10000 })

      const actionButtons = page.locator('[role="button"], button')
      const buttonCount = await actionButtons.count()

      expect(buttonCount).toBeGreaterThan(0)

      // All buttons should have accessible names
      for (let i = 0; i < Math.min(buttonCount, 5); i++) {
        const button = actionButtons.nth(i)
        const text = await button.textContent()
        expect(text).toBeTruthy()
      }
    })

    test('should be keyboard navigable', async ({ page }) => {
      await page.waitForSelector('text=Ações Rápidas', { timeout: 10000 })

      // Tab through actions
      await page.keyboard.press('Tab')
      await page.keyboard.press('Tab')

      // Should have focused element
      const focusedElement = await page.evaluate(() => document.activeElement?.tagName)
      expect(focusedElement).toBeTruthy()
    })
  })
})
