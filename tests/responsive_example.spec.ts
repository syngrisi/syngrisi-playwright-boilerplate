import { test, expect } from '../fixtures/syngrisi.fixture'

/**
 * Responsive visual testing example.
 *
 * Demonstrates capturing the same page at several viewport sizes within a single
 * test. Each viewport produces a separate Syngrisi check, so you get an independent
 * baseline per breakpoint. This complements the device `projects` configured in
 * `playwright.config.ts` (firefox / webkit / Mobile Chrome).
 */
test.describe('Responsive feature', () => {
    const breakpoints = [
        { name: 'mobile', width: 375, height: 667 },
        { name: 'tablet', width: 768, height: 1024 },
        { name: 'desktop', width: 1280, height: 720 },
    ]

    for (const bp of breakpoints) {
        // Note you must pass `syngrisi` as a test argument to activate the visual-session fixture.
        test(`Demo app at ${bp.name} (${bp.width}x${bp.height})`, async ({ syngrisi, page }) => {
            await page.setViewportSize({ width: bp.width, height: bp.height })
            await page.goto('https://viktor-silakov.github.io/syngrisi-demo-app/?version=0')
            await page.locator('#graph').waitFor()
            await expect.soft(page).toMatchBaseline(`Demo app - ${bp.name}`)
        })
    }
})
