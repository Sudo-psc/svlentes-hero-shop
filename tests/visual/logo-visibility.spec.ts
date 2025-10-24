import { test, expect } from '@playwright/test'

test.describe('SV Lentes logo visibility', () => {
    test('header and footer logos are visible', async ({ page }) => {
        // Adjust URL to local dev server
        await page.goto('http://localhost:3000', { waitUntil: 'networkidle' })

        // Wait for header logo
        const headerLogo = page.locator('header img[alt="SV Lentes"]')
        await expect(headerLogo.first()).toBeVisible({ timeout: 10000 })

        // Wait for footer logo
        const footerLogo = page.locator('footer img[alt="SV Lentes"]')
        await expect(footerLogo.first()).toBeVisible({ timeout: 10000 })

        // Capture screenshots for visual review
        await page.screenshot({ path: 'playwright-report/logo-homepage.png', fullPage: true })
        await headerLogo.first().screenshot({ path: 'playwright-report/header-logo.png' })
        await footerLogo.first().screenshot({ path: 'playwright-report/footer-logo.png' })
    })
})
