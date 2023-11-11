import { test, expect } from '../fixtures/syngrisi.fixture'

test.describe('Simple feature', () => {
    // Note you must pass `syngrisi` as a test argument to perform visual checks (`expect(object).toMatchBaseline('visual_checkName', options)`)
    test(`Simple viewport and element visual test`, async ({ syngrisi, page }) => {
        await page.goto('https://viktor-silakov.github.io/syngrisi-demo-app/');
        await expect.soft(page.locator('#graph')).toMatchBaseline(`Main graph`);
        await expect.soft(page).toMatchBaseline(`Main viewport`);
        await expect.soft(page).toMatchBaseline(`Full page`, { fullPage: true });
    })
})


