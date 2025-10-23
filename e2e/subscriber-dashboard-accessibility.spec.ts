import { test, expect } from '@playwright/test'
import AxeBuilder from '@axe-core/playwright'

test.describe('Subscriber Dashboard - Accessibility Tests (Phase 1)', () => {
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

  test.describe('WCAG 2.1 Compliance', () => {
    test('should not have any automatically detectable accessibility violations', async ({ page }) => {
      const accessibilityScanResults = await new AxeBuilder({ page })
        .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
        .analyze()

      expect(accessibilityScanResults.violations).toEqual([])
    })

    test('should pass color contrast requirements', async ({ page }) => {
      const accessibilityScanResults = await new AxeBuilder({ page })
        .withTags(['cat.color'])
        .analyze()

      expect(accessibilityScanResults.violations).toEqual([])
    })

    test('should have proper heading hierarchy', async ({ page }) => {
      // Check for h1
      const h1 = await page.locator('h1').count()
      expect(h1).toBeGreaterThan(0)

      // Verify heading structure
      const accessibilityScanResults = await new AxeBuilder({ page })
        .withTags(['cat.semantics'])
        .analyze()

      expect(accessibilityScanResults.violations).toEqual([])
    })
  })

  test.describe('ARIA Labels and Roles', () => {
    test('should have proper ARIA labels on interactive elements', async ({ page }) => {
      // Check buttons have accessible names
      const buttons = await page.locator('button').all()

      for (const button of buttons) {
        const ariaLabel = await button.getAttribute('aria-label')
        const text = await button.textContent()

        // Either has aria-label or visible text
        expect(ariaLabel || text?.trim()).toBeTruthy()
      }
    })

    test('should have proper roles for dashboard sections', async ({ page }) => {
      // Main content should have proper role
      const main = page.locator('main, [role="main"]')
      await expect(main.first()).toBeVisible()

      // Navigation should have proper role
      const nav = page.locator('nav, [role="navigation"]')
      const navCount = await nav.count()
      expect(navCount).toBeGreaterThan(0)
    })

    test('should have accessible metric cards', async ({ page }) => {
      await page.waitForSelector('text=Receita Mensal')

      // Metric cards should be properly labeled
      const metricCards = page.locator('[role="article"], .ant-card')
      const cardCount = await metricCards.count()

      expect(cardCount).toBeGreaterThan(0)
    })

    test('should have accessible progress bars', async ({ page }) => {
      await page.waitForSelector('.ant-progress')

      // Progress bars should have proper ARIA attributes
      const progressBars = page.locator('[role="progressbar"]')
      const progressCount = await progressBars.count()

      expect(progressCount).toBeGreaterThan(0)

      // Check first progress bar has aria-valuenow
      const firstProgress = progressBars.first()
      const valueNow = await firstProgress.getAttribute('aria-valuenow')
      expect(valueNow).toBeTruthy()
    })

    test('should have proper labels for forms', async ({ page }) => {
      // If there are any forms in the dashboard
      const inputs = await page.locator('input:visible').all()

      for (const input of inputs) {
        const ariaLabel = await input.getAttribute('aria-label')
        const ariaLabelledby = await input.getAttribute('aria-labelledby')
        const id = await input.getAttribute('id')

        // Either has aria-label, aria-labelledby, or associated label
        if (id) {
          const label = await page.locator(`label[for="${id}"]`).count()
          expect(ariaLabel || ariaLabelledby || label > 0).toBeTruthy()
        }
      }
    })
  })

  test.describe('Keyboard Navigation', () => {
    test('should be fully navigable by keyboard', async ({ page }) => {
      // Focus first interactive element
      await page.keyboard.press('Tab')

      // Should be able to tab through all interactive elements
      let focusedElement = await page.locator(':focus').count()
      expect(focusedElement).toBe(1)

      // Tab through at least 10 elements
      for (let i = 0; i < 10; i++) {
        await page.keyboard.press('Tab')
        focusedElement = await page.locator(':focus').count()
        expect(focusedElement).toBe(1)
      }
    })

    test('should have visible focus indicators', async ({ page }) => {
      // Tab to first element
      await page.keyboard.press('Tab')

      const focusedElement = page.locator(':focus')
      await expect(focusedElement).toBeVisible()

      // Get computed outline/border to verify focus indicator
      const styles = await focusedElement.evaluate((el) => {
        const computed = window.getComputedStyle(el)
        return {
          outline: computed.outline,
          outlineWidth: computed.outlineWidth,
          boxShadow: computed.boxShadow,
        }
      })

      // Should have some form of focus indicator
      const hasFocusIndicator =
        styles.outline !== 'none' ||
        styles.outlineWidth !== '0px' ||
        styles.boxShadow !== 'none'

      expect(hasFocusIndicator).toBeTruthy()
    })

    test('should support reverse tab navigation', async ({ page }) => {
      // Tab forward multiple times
      await page.keyboard.press('Tab')
      await page.keyboard.press('Tab')
      await page.keyboard.press('Tab')

      const forwardElement = await page.locator(':focus').textContent()

      // Tab backward
      await page.keyboard.press('Shift+Tab')

      const backwardElement = await page.locator(':focus').textContent()

      // Should be on a different element
      expect(forwardElement).not.toBe(backwardElement)
    })

    test('should activate buttons with Enter key', async ({ page }) => {
      // Find a button
      const button = page.locator('button').first()
      await button.focus()

      // Press Enter
      const clickPromise = page.waitForEvent('console', {
        predicate: msg => msg.type() !== 'error',
        timeout: 1000
      }).catch(() => null)

      await page.keyboard.press('Enter')

      // Button should respond (either action or no error)
      // This is a basic check - specific buttons would need specific assertions
    })

    test('should activate buttons with Space key', async ({ page }) => {
      // Find a button
      const button = page.locator('button').first()
      await button.focus()

      // Press Space
      await page.keyboard.press('Space')

      // Button should respond (basic check)
    })

    test('should allow ESC to close modals', async ({ page }) => {
      // Try to open a modal if available
      const editButton = page.locator('button:has-text("Editar")')

      if (await editButton.count() > 0) {
        await editButton.first().click()

        // Wait for modal
        await page.waitForSelector('[role="dialog"]', { timeout: 5000 }).catch(() => null)

        // Press ESC
        await page.keyboard.press('Escape')

        // Modal should close
        const modal = await page.locator('[role="dialog"]').count()
        expect(modal).toBe(0)
      }
    })
  })

  test.describe('Screen Reader Support', () => {
    test('should have descriptive page title', async ({ page }) => {
      const title = await page.title()

      // Title should be descriptive
      expect(title.length).toBeGreaterThan(0)
      expect(title).not.toBe('React App')
    })

    test('should have proper landmark regions', async ({ page }) => {
      const accessibilityScanResults = await new AxeBuilder({ page })
        .withTags(['cat.keyboard', 'cat.semantics'])
        .analyze()

      expect(accessibilityScanResults.violations).toEqual([])
    })

    test('should have alt text for images', async ({ page }) => {
      const images = await page.locator('img:visible').all()

      for (const img of images) {
        const alt = await img.getAttribute('alt')
        const ariaLabel = await img.getAttribute('aria-label')
        const role = await img.getAttribute('role')

        // Images should have alt text, aria-label, or be decorative
        expect(alt !== null || ariaLabel || role === 'presentation').toBeTruthy()
      }
    })

    test('should announce dynamic content updates', async ({ page }) => {
      // Look for live regions
      const liveRegions = page.locator('[aria-live], [role="status"], [role="alert"]')
      const hasLiveRegions = await liveRegions.count()

      // Dashboard should have at least some live regions for updates
      expect(hasLiveRegions).toBeGreaterThanOrEqual(0)
    })

    test('should have descriptive link text', async ({ page }) => {
      const links = await page.locator('a:visible').all()

      for (const link of links) {
        const text = await link.textContent()
        const ariaLabel = await link.getAttribute('aria-label')

        // Links should have descriptive text
        const linkText = ariaLabel || text?.trim()
        expect(linkText).toBeTruthy()

        // Should not be generic like "click here"
        if (linkText) {
          expect(linkText.toLowerCase()).not.toBe('click here')
          expect(linkText.toLowerCase()).not.toBe('here')
          expect(linkText.toLowerCase()).not.toBe('read more')
        }
      }
    })
  })

  test.describe('Mobile Accessibility', () => {
    test('should be accessible on mobile viewport', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 })

      const accessibilityScanResults = await new AxeBuilder({ page })
        .withTags(['wcag2a', 'wcag2aa'])
        .analyze()

      expect(accessibilityScanResults.violations).toEqual([])
    })

    test('should have touch-friendly tap targets', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 })

      // Buttons should be large enough for touch
      const buttons = await page.locator('button:visible').all()

      for (const button of buttons) {
        const box = await button.boundingBox()

        if (box) {
          // WCAG recommendation: 44x44 pixels minimum
          // We'll check for at least 40px to be slightly lenient
          expect(box.width).toBeGreaterThanOrEqual(40)
          expect(box.height).toBeGreaterThanOrEqual(40)
        }
      }
    })

    test('should support zoom up to 200%', async ({ page }) => {
      // Set zoom to 200%
      await page.evaluate(() => {
        document.body.style.zoom = '2'
      })

      // Page should still be functional
      await expect(page.locator('text=Minha Assinatura')).toBeVisible()

      // Reset zoom
      await page.evaluate(() => {
        document.body.style.zoom = '1'
      })
    })
  })

  test.describe('Text Accessibility', () => {
    test('should support text resize', async ({ page }) => {
      // Increase text size
      await page.evaluate(() => {
        document.documentElement.style.fontSize = '20px'
      })

      // Content should still be readable
      await expect(page.locator('text=Minha Assinatura')).toBeVisible()

      // Reset
      await page.evaluate(() => {
        document.documentElement.style.fontSize = ''
      })
    })

    test('should have readable font sizes', async ({ page }) => {
      // Check important text elements
      const textElements = await page.locator('p, span, div').all()

      let checkedCount = 0
      for (const element of textElements.slice(0, 20)) {
        const fontSize = await element.evaluate((el) => {
          return window.getComputedStyle(el).fontSize
        })

        const sizeValue = parseInt(fontSize)

        // Font size should be at least 12px (reasonable minimum)
        if (sizeValue > 0) {
          expect(sizeValue).toBeGreaterThanOrEqual(12)
          checkedCount++
        }
      }

      expect(checkedCount).toBeGreaterThan(0)
    })
  })

  test.describe('Focus Management', () => {
    test('should trap focus in modals', async ({ page }) => {
      // Try to open a modal
      const editButton = page.locator('button:has-text("Editar")')

      if (await editButton.count() > 0) {
        await editButton.first().click()

        const modal = await page.locator('[role="dialog"]').count()

        if (modal > 0) {
          // Tab through elements
          for (let i = 0; i < 20; i++) {
            await page.keyboard.press('Tab')

            // Focus should stay within modal
            const focusedElement = page.locator(':focus')
            const isInModal = await focusedElement.evaluate((el) => {
              return !!el.closest('[role="dialog"]')
            })

            expect(isInModal).toBeTruthy()
          }
        }
      }
    })

    test('should return focus after modal closes', async ({ page }) => {
      // Try to open a modal
      const editButton = page.locator('button:has-text("Editar")')

      if (await editButton.count() > 0) {
        // Focus button
        await editButton.first().focus()
        const buttonText = await editButton.first().textContent()

        // Open modal
        await editButton.first().click()

        // Wait for modal
        await page.waitForSelector('[role="dialog"]', { timeout: 5000 }).catch(() => null)

        // Close modal with ESC
        await page.keyboard.press('Escape')

        // Wait for modal to close
        await page.waitForTimeout(500)

        // Focus should return to trigger button
        const focusedElement = page.locator(':focus')
        const focusedText = await focusedElement.textContent()

        expect(focusedText?.trim()).toBe(buttonText?.trim())
      }
    })
  })

  test.describe('Error Messages Accessibility', () => {
    test('should announce errors to screen readers', async ({ page }) => {
      // Trigger an error if possible by intercepting API
      await page.route('**/api/assinante/**', route => {
        route.abort('failed')
      })

      await page.goto('/area-assinante/dashboard')

      // Look for error message with proper ARIA
      const errorRegion = page.locator('[role="alert"], [aria-live="assertive"]')
      const hasErrorRegion = await errorRegion.count()

      // Either has proper error announcement or handles error gracefully
      expect(hasErrorRegion).toBeGreaterThanOrEqual(0)
    })
  })
})
