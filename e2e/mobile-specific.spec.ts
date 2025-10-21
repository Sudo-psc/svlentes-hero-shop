/**
 * E2E tests specifically for mobile functionality
 * Tests mobile-specific features and interactions
 */

import { test, expect, devices } from '@playwright/test'

// Configure mobile device for all tests in this file
test.use({ ...devices['iPhone 12'] })

test.describe('Mobile-Specific E2E Tests', () => {

    test.beforeEach(async ({ page }) => {
        await page.goto('/')
        await page.waitForLoadState('networkidle')
    })

    test('should display mobile navigation correctly', async ({ page }) => {
        // Verify mobile menu button is visible
        await expect(page.getByRole('button', { name: /menu/i })).toBeVisible()

        // Verify desktop navigation is hidden
        await expect(page.getByRole('navigation').getByText('Planos')).not.toBeVisible()

        // Open mobile menu
        await page.getByRole('button', { name: /menu/i }).click()

        // Verify mobile menu items are visible
        await expect(page.getByRole('link', { name: /planos/i })).toBeVisible()
        await expect(page.getByRole('link', { name: /como funciona/i })).toBeVisible()
        await expect(page.getByRole('link', { name: /faq/i })).toBeVisible()
    })

    test('should show WhatsApp floating button on mobile', async ({ page }) => {
        // Verify WhatsApp floating button is visible
        const whatsappFloat = page.getByRole('button', { name: /whatsapp/i }).last()
        await expect(whatsappFloat).toBeVisible()

        // Verify it's positioned as floating button
        const boundingBox = await whatsappFloat.boundingBox()
        expect(boundingBox?.x).toBeGreaterThan(300) // Should be on the right side
        expect(boundingBox?.y).toBeGreaterThan(500) // Should be near bottom
    })

    test('should handle mobile form interactions', async ({ page }) => {
        // Test mobile keyboard interactions
        await page.getByLabel(/nome/i).tap()
        await page.getByLabel(/nome/i).fill('João Mobile')

        // Test mobile number input
        await page.getByLabel(/whatsapp/i).tap()
        await page.getByLabel(/whatsapp/i).fill('11999999999')

        // Verify mobile keyboard optimizations
        const whatsappInput = page.getByLabel(/whatsapp/i)
        await expect(whatsappInput).toHaveAttribute('type', 'tel')
        await expect(whatsappInput).toHaveAttribute('inputmode', 'tel')

        const emailInput = page.getByLabel(/email/i)
        await expect(emailInput).toHaveAttribute('type', 'email')
        await expect(emailInput).toHaveAttribute('inputmode', 'email')
    })

    test('should handle mobile touch gestures', async ({ page }) => {
        // Test swipe gestures on carousel/tabs if present
        const tabContainer = page.getByRole('tablist').first()
        if (await tabContainer.isVisible()) {
            // Simulate swipe gesture
            await tabContainer.hover()
            await page.mouse.down()
            await page.mouse.move(100, 0)
            await page.mouse.up()
        }

        // Test tap interactions
        await page.getByRole('button', { name: /calcule sua economia/i }).tap()

        // Verify tap worked (form validation should trigger)
        const nameInput = page.getByLabel(/nome/i)
        await expect(nameInput).toBeFocused()
    })

    test('should optimize mobile viewport and scrolling', async ({ page }) => {
        // Verify viewport meta tag
        const viewportMeta = page.locator('meta[name="viewport"]')
        await expect(viewportMeta).toHaveAttribute('content', /width=device-width/)

        // Test smooth scrolling to sections
        await page.getByRole('link', { name: /planos/i }).click()

        // Verify page scrolled to pricing section
        const pricingSection = page.getByTestId('pricing-section')
        await expect(pricingSection).toBeInViewport()
    })

    test('should handle mobile-specific layout changes', async ({ page }) => {
        // Verify hero section stacks vertically on mobile
        const heroContainer = page.getByTestId('hero-container')
        await expect(heroContainer).toHaveCSS('flex-direction', 'column')

        // Verify pricing cards stack vertically
        const pricingContainer = page.getByTestId('pricing-container')
        await expect(pricingContainer).toHaveCSS('flex-direction', 'column')

        // Verify mobile-optimized spacing
        await expect(heroContainer).toHaveCSS('padding', /16px/)
    })

    test('should handle mobile performance optimizations', async ({ page }) => {
        // Test lazy loading on mobile
        const images = page.locator('img')
        const count = await images.count()

        for (let i = 0; i < count; i++) {
            const img = images.nth(i)
            if (!(await img.isInViewport())) {
                await expect(img).toHaveAttribute('loading', 'lazy')
            }
        }

        // Test mobile-specific resource loading
        const performanceEntries = await page.evaluate(() => {
            return performance.getEntriesByType('navigation')[0]
        })

        // Mobile should load quickly
        expect(performanceEntries.loadEventEnd - performanceEntries.navigationStart).toBeLessThan(5000)
    })
})

test.describe('Mobile Accessibility E2E', () => {
    test('should have appropriate touch targets on mobile', async ({ page }) => {
        await page.goto('/')

        // Test minimum touch target sizes (44px recommended)
        const buttons = page.getByRole('button')
        const count = await buttons.count()

        for (let i = 0; i < count; i++) {
            const button = buttons.nth(i)
            if (await button.isVisible()) {
                const boundingBox = await button.boundingBox()
                expect(boundingBox?.height).toBeGreaterThanOrEqual(44)
                expect(boundingBox?.width).toBeGreaterThanOrEqual(44)
            }
        }
    })

    test('should handle mobile screen reader navigation', async ({ page }) => {
        await page.goto('/')

        // Verify proper heading structure for screen readers
        const h1 = page.getByRole('heading', { level: 1 })
        await expect(h1).toBeVisible()

        // Verify ARIA labels are present
        await expect(page.getByLabel(/nome/i)).toHaveAttribute('aria-label')
        await expect(page.getByLabel(/whatsapp/i)).toHaveAttribute('aria-label')
        await expect(page.getByLabel(/email/i)).toHaveAttribute('aria-label')
    })

    test('should support mobile keyboard navigation', async ({ page }) => {
        await page.goto('/')

        // Test tab navigation on mobile
        await page.keyboard.press('Tab')
        let focusedElement = page.locator(':focus')
        await expect(focusedElement).toBeVisible()

        // Continue tabbing through form elements
        await page.keyboard.press('Tab')
        focusedElement = page.locator(':focus')
        await expect(focusedElement).toBeVisible()

        // Test Enter key activation
        await page.keyboard.press('Enter')

        // Should trigger form validation or action
        await expect(page.getByLabel(/nome/i)).toHaveAttribute('required')
    })
})

test.describe('Mobile Performance E2E', () => {
    test('should load quickly on mobile network', async ({ page }) => {
        // Simulate slow 3G network
        await page.route('**/*', async (route) => {
            await new Promise(resolve => setTimeout(resolve, 100)) // Add 100ms delay
            await route.continue()
        })

        const startTime = Date.now()
        await page.goto('/')
        await page.waitForLoadState('networkidle')
        const loadTime = Date.now() - startTime

        // Should still load within reasonable time on slow network
        expect(loadTime).toBeLessThan(8000)
    })

    test('should optimize images for mobile', async ({ page }) => {
        await page.goto('/')

        // Check that images are optimized for mobile
        const images = page.locator('img')
        const count = await images.count()

        for (let i = 0; i < count; i++) {
            const img = images.nth(i)

            // Should have responsive attributes
            await expect(img).toHaveAttribute('sizes')

            // Should have appropriate dimensions for mobile
            const boundingBox = await img.boundingBox()
            if (boundingBox) {
                expect(boundingBox.width).toBeLessThanOrEqual(375) // iPhone width
            }
        }
    })

    test('should minimize mobile data usage', async ({ page }) => {
        let totalDataTransferred = 0

        page.on('response', (response) => {
            const contentLength = response.headers()['content-length']
            if (contentLength) {
                totalDataTransferred += parseInt(contentLength)
            }
        })

        await page.goto('/')
        await page.waitForLoadState('networkidle')

        // Initial page load should be under 2MB for mobile
        expect(totalDataTransferred).toBeLessThan(2 * 1024 * 1024)
    })
})

test.describe('Mobile-Specific Features E2E', () => {
    test('should handle mobile-specific form features', async ({ page }) => {
        await page.goto('/')

        // Test mobile autocomplete
        const nameInput = page.getByLabel(/nome/i)
        await expect(nameInput).toHaveAttribute('autocomplete', 'name')

        const phoneInput = page.getByLabel(/whatsapp/i)
        await expect(phoneInput).toHaveAttribute('autocomplete', 'tel')

        const emailInput = page.getByLabel(/email/i)
        await expect(emailInput).toHaveAttribute('autocomplete', 'email')
    })

    test('should handle mobile orientation changes', async ({ page }) => {
        await page.goto('/')

        // Test portrait orientation
        await page.setViewportSize({ width: 375, height: 667 })
        await expect(page.getByTestId('hero-container')).toHaveCSS('flex-direction', 'column')

        // Test landscape orientation
        await page.setViewportSize({ width: 667, height: 375 })

        // Layout should adapt to landscape
        const heroContainer = page.getByTestId('hero-container')
        await expect(heroContainer).toBeVisible()

        // Form should still be usable in landscape
        await page.getByLabel(/nome/i).fill('João Landscape')
        await expect(page.getByDisplayValue('João Landscape')).toBeVisible()
    })

    test('should handle mobile-specific interactions', async ({ page }) => {
        await page.goto('/')

        // Test long press (context menu should not appear on form elements)
        const nameInput = page.getByLabel(/nome/i)
        await nameInput.hover()
        await page.mouse.down()
        await page.waitForTimeout(1000) // Long press
        await page.mouse.up()

        // Input should still be focusable after long press
        await nameInput.fill('João Long Press')
        await expect(page.getByDisplayValue('João Long Press')).toBeVisible()

        // Test double tap zoom prevention
        await page.getByRole('heading', { name: /nunca mais fique sem lentes/i }).dblclick()

        // Page should not zoom (viewport should remain stable)
        const viewportSize = page.viewportSize()
        expect(viewportSize?.width).toBe(375)
    })
})