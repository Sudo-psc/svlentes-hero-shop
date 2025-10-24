import { test, expect } from '@playwright/test'

test.describe('SV Lentes logo visibility', () => {
  test('header and footer logos are visible', async ({ page }) => {
    // Playwright config uses baseURL http://localhost:5000
    await page.goto('/', { waitUntil: 'networkidle' })

    const headerLogo = page.locator('header img[alt="SV Lentes"]')
    await expect(headerLogo.first()).toBeVisible({ timeout: 10000 })

    const footerLogo = page.locator('footer img[alt="SV Lentes"]')
    await expect(footerLogo.first()).toBeVisible({ timeout: 10000 })

    await page.screenshot({ path: 'playwright-report/logo-homepage.png', fullPage: true })
    await headerLogo.first().screenshot({ path: 'playwright-report/header-logo.png' })
    await footerLogo.first().screenshot({ path: 'playwright-report/footer-logo.png' })
  })
})
import { test, expect } from '@playwright/test'

test.describe('SVLentes Logo - Visual & Prominence', () => {
    test.beforeEach(async ({ page }) => {
        // Playwright baseURL is configured to http://localhost:5000
        await page.goto('/')
        await page.waitForLoadState('networkidle')
    })

    test('should display logo in navbar on desktop', async ({ page }) => {
        await page.setViewportSize({ width: 1920, height: 1080 })

        const navbar = page.locator('header')
        await expect(navbar).toBeVisible()

        const logo = navbar.locator('a[aria-label*="SV Lentes"]')
        await expect(logo).toBeVisible()

        const logoImage = logo.locator('img, picture img')
        await expect(logoImage).toBeVisible()

        await page.screenshot({
            path: 'test-results/logo-navbar-desktop.png',
            fullPage: false
        })

        await logo.screenshot({
            path: 'test-results/logo-navbar-closeup.png'
        })

        console.log('✅ Logo in navbar (desktop) - Screenshot saved')
    })

    test('should display logo in navbar on mobile', async ({ page }) => {
        await page.setViewportSize({ width: 375, height: 812 })

        const navbar = page.locator('header')
        await expect(navbar).toBeVisible()

        const logo = navbar.locator('a[aria-label*="SV Lentes"]')
        await expect(logo).toBeVisible()

        await page.screenshot({
            path: 'test-results/logo-navbar-mobile.png',
            fullPage: false
        })

        await logo.screenshot({
            path: 'test-results/logo-navbar-mobile-closeup.png'
        })

        console.log('✅ Logo in navbar (mobile) - Screenshot saved')
    })

    test('should display logo in footer', async ({ page }) => {
        await page.setViewportSize({ width: 1920, height: 1080 })

        const footer = page.locator('footer')
        await footer.scrollIntoViewIfNeeded()
        await expect(footer).toBeVisible()

        const footerLogo = footer.locator('img, picture img').first()
        await expect(footerLogo).toBeVisible()

        await footer.screenshot({
            path: 'test-results/logo-footer-section.png'
        })

        await footerLogo.screenshot({
            path: 'test-results/logo-footer-closeup.png'
        })

        console.log('✅ Logo in footer - Screenshot saved')
    })

    test('should have correct logo dimensions in navbar', async ({ page }) => {
        await page.setViewportSize({ width: 1920, height: 1080 })

        const logo = page.locator('header a[aria-label*="SV Lentes"]')
        const boundingBox = await logo.boundingBox()

        expect(boundingBox).not.toBeNull()
        if (boundingBox) {
            console.log('📏 Navbar logo dimensions:', {
                width: boundingBox.width,
                height: boundingBox.height
            })

            expect(boundingBox.width).toBeGreaterThan(40)
            expect(boundingBox.height).toBeGreaterThan(40)
        }
    })

    test('should have correct logo dimensions in footer', async ({ page }) => {
        await page.setViewportSize({ width: 1920, height: 1080 })

        const footer = page.locator('footer')
        await footer.scrollIntoViewIfNeeded()

        const footerLogoContainer = footer.locator('div').first()
        const boundingBox = await footerLogoContainer.boundingBox()

        expect(boundingBox).not.toBeNull()
        if (boundingBox) {
            console.log('📏 Footer logo dimensions:', {
                width: boundingBox.width,
                height: boundingBox.height
            })

            expect(boundingBox.width).toBeGreaterThan(100)
            expect(boundingBox.height).toBeGreaterThan(50)
        }
    })

    test('logo should be clickable in navbar', async ({ page }) => {
        const logo = page.locator('header a[aria-label*="SV Lentes"]')
        await expect(logo).toBeVisible()

        const href = await logo.getAttribute('href')
        expect(href).toBe('/')

        console.log('✅ Logo is clickable and points to homepage')
    })

    test('logo should have proper alt text', async ({ page }) => {
        const navbarLogo = page.locator('header img[alt*="SV Lentes"]').first()
        await expect(navbarLogo).toBeVisible()

        const altText = await navbarLogo.getAttribute('alt')
        expect(altText).toContain('SV Lentes')

        console.log('✅ Logo has proper alt text:', altText)
    })

  test('should capture full page with logos highlighted', async ({ page }) => {
    await page.setViewportSize({ width: 1920, height: 1080 })
    
    await page.evaluate(() => {
      const header = document.querySelector('header a[aria-label*="SV Lentes"]')
      if (header && header instanceof HTMLElement) {
        header.style.outline = '4px solid #06b6d4'
        header.style.outlineOffset = '4px'
      }
    })
    
    await page.screenshot({ 
      path: 'test-results/logo-navbar-highlighted.png',
      fullPage: false 
    })
    
    const footer = page.locator('footer')
    await footer.scrollIntoViewIfNeeded()
    
    await page.evaluate(() => {
      const footerLogo = document.querySelector('footer img')
      if (footerLogo && footerLogo instanceof HTMLElement) {
        footerLogo.style.outline = '4px solid #06b6d4'
        footerLogo.style.outlineOffset = '4px'
      }
    })
    
    await footer.screenshot({ 
      path: 'test-results/logo-footer-highlighted.png' 
    })
    
    console.log('✅ Full page screenshots with highlighted logos saved')
  })

  test('should verify logo visibility in different scroll positions', async ({ page }) => {
    await page.setViewportSize({ width: 1920, height: 1080 })
    
    const logo = page.locator('header a[aria-label*="SV Lentes"]')
    await expect(logo).toBeVisible()
    
    await page.screenshot({ 
      path: 'test-results/logo-scroll-top.png',
      fullPage: false 
    })
    
    await page.evaluate(() => window.scrollTo(0, 500))
    await page.waitForTimeout(300)
    
    await expect(logo).toBeVisible()
        await page.screenshot({
            path: 'test-results/logo-scroll-middle.png',
            fullPage: false
        })

        await page.evaluate(() => window.scrollTo(0, 0))
        await page.waitForTimeout(300)

        console.log('✅ Logo visibility verified at different scroll positions')
    })

    test('should verify logo image loads successfully', async ({ page }) => {
        const logoImage = page.locator('header img[alt*="SV Lentes"]').first()

        await expect(logoImage).toBeVisible()

        const naturalWidth = await logoImage.evaluate((img: HTMLImageElement) => img.naturalWidth)
        const naturalHeight = await logoImage.evaluate((img: HTMLImageElement) => img.naturalHeight)

        console.log('🖼️ Logo natural dimensions:', {
            naturalWidth,
            naturalHeight
        })

        expect(naturalWidth).toBeGreaterThan(0)
        expect(naturalHeight).toBeGreaterThan(0)

        console.log('✅ Logo image loaded successfully')
    })
})

test.describe('SVLentes Logo - Branding Prominence', () => {
    test.beforeEach(async ({ page }) => {
        await page.goto('http://localhost:5000')
        await page.waitForLoadState('networkidle')
    })

    test('should measure logo prominence in navbar', async ({ page }) => {
        await page.setViewportSize({ width: 1920, height: 1080 })

        const header = page.locator('header')
        const headerBox = await header.boundingBox()

        const logo = page.locator('header a[aria-label*="SV Lentes"]')
        const logoBox = await logo.boundingBox()

        if (headerBox && logoBox) {
            const logoPercentage = ((logoBox.width * logoBox.height) / (headerBox.width * headerBox.height)) * 100

            console.log('📊 Logo prominence in navbar:', {
                headerArea: Math.round(headerBox.width * headerBox.height),
                logoArea: Math.round(logoBox.width * logoBox.height),
                percentage: logoPercentage.toFixed(2) + '%'
            })

            expect(logoPercentage).toBeGreaterThan(1)
        }
    })

    test('should verify logo contrast and visibility', async ({ page }) => {
        await page.setViewportSize({ width: 1920, height: 1080 })

        const logo = page.locator('header a[aria-label*="SV Lentes"]')
        await expect(logo).toBeVisible()

        const visibility = await logo.evaluate((el) => {
            const styles = window.getComputedStyle(el)
            return {
                opacity: styles.opacity,
                visibility: styles.visibility,
                display: styles.display,
                zIndex: styles.zIndex
            }
        })

        console.log('👁️ Logo visibility properties:', visibility)

        expect(visibility.opacity).toBe('1')
        expect(visibility.visibility).toBe('visible')
        expect(visibility.display).not.toBe('none')

        console.log('✅ Logo has good visibility properties')
    })

    test('should create logo showcase report', async ({ page }) => {
        await page.setViewportSize({ width: 1920, height: 1080 })

        const logo = page.locator('header a[aria-label*="SV Lentes"]')
        const logoBox = await logo.boundingBox()

        const footer = page.locator('footer')
        await footer.scrollIntoViewIfNeeded()
        const footerLogoBox = await footer.locator('img').first().boundingBox()

        const report = {
            navbar: {
                dimensions: logoBox ? `${Math.round(logoBox.width)}x${Math.round(logoBox.height)}px` : 'N/A',
                position: logoBox ? `x: ${Math.round(logoBox.x)}, y: ${Math.round(logoBox.y)}` : 'N/A'
            },
            footer: {
                dimensions: footerLogoBox ? `${Math.round(footerLogoBox.width)}x${Math.round(footerLogoBox.height)}px` : 'N/A',
                position: footerLogoBox ? `x: ${Math.round(footerLogoBox.x)}, y: ${Math.round(footerLogoBox.y)}` : 'N/A'
            }
        }

        console.log('📋 SVLentes Logo Showcase Report:')
        console.log(JSON.stringify(report, null, 2))

        await page.screenshot({
            path: 'test-results/logo-showcase-full.png',
            fullPage: true
        })

        console.log('✅ Logo showcase report generated')
    })
})
