import { test, expect } from '../fixtures/syngrisi.fixture'

test.describe('Advanced feature', () => {
    // Note you must pass `syngrisi` as a test argument to perform visual checks (`expect(object).toMatchBaseline('visual_checkName', options)`)
    test(`Graph Visual Checking - Broken Data`, async ({ syngrisi, page },) => {
        await page.goto('https://viktor-silakov.github.io/syngrisi-demo-app/?version=0');
        // 💡 broken version of the application, uncomment and comment out the previous line to break the graph
        // await page.goto('https://viktor-silakov.github.io/syngrisi-demo-app/?version=1');

        await expect.soft(page.locator('#graph')).toMatchBaseline(`Sales Chart`);
    })

    test(`Full Page Visual Checking - Text extra dot`, async ({ syngrisi, page },) => {
        await page.goto('https://viktor-silakov.github.io/syngrisi-demo-app/?version=0');

        await page.getByRole('link', { name: 'About', exact: true }).click();
        // 💡 broken version of the application, uncomment and comment out the previous line to break the graph
        // await page.getByRole('link', { name: 'About (Bug)', exact: true }).click();

        await page.getByRole('heading', { name: 'Lorem ipsum' }).waitFor();

        // pass { fullPage: true } to make ful page screenshot
        await expect.soft(page).toMatchBaseline(`About - full page`, { fullPage: true });
    })

    // there is dynamic content in the footer, and test will fail every time, you can use the 'Ignore regions' Syngrisi feature to suppress this
    test.skip(`Dynamic content - Footer countdown timer`, async ({ syngrisi, page },) => {
        await page.goto('https://viktor-silakov.github.io/syngrisi-demo-app/?version=5');

        const footer = page.locator('#footer');
        await footer.scrollIntoViewIfNeeded();

        await expect.soft(footer).toMatchBaseline(`Footer`);
    })
})
