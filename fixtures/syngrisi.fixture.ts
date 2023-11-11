import {
    Locator,
    LocatorScreenshotOptions,
    Page,
    PageScreenshotOptions,
    test as baseTest,
} from '@playwright/test';
import { expect as baseExpect } from '@playwright/test';
import { PlaywrightDriver } from '@syngrisi/playwright-sdk';
import {
    getSuiteTitle,
    getTestTitle,
    log,
    waitUntil
} from '@syngrisi/playwright-sdk/dist/lib/utils';
import { config } from './syngrisi.config';
import {
    getBrowserFullVersion,
    getBrowserVersion,
    getOS,
    getViewport
} from '@syngrisi/playwright-sdk/dist/lib/pwHelpers';
import { request } from '@playwright/test';

import hasha from 'hasha';

type Syngrisi = {
    syngrisi: PlaywrightDriver;
};

export const test = baseTest.extend<Syngrisi>({
    syngrisi: async ({ page }, use, testInfo) => {
        const syngrisi = new PlaywrightDriver({
            page,
            url: config.baseUrl,
            apiKey: config.apiKey,
        });
        global.syngrisi = syngrisi
        await syngrisi.startTestSession({
            params: {
                app: config.project,
                branch: config.branch,
                test: getTestTitle(testInfo),
                run: config.runName,
                runident: config.runIdent,
                suite: getSuiteTitle(testInfo)
            }
        });
        await use(syngrisi);
        await syngrisi.stopTestSession();
    },
});

const getLastBaseline = async (page: Page, name: string) => {
    return (await global.syngrisi.getBaselines({ params: { name } }))?.results[0] || null
}

const getSnapshotById = async (page: Page, _id: string) => {
    return (await global.syngrisi.getSnapshots({ params: { _id } }))?.results[0] || null
}

type ScrollArgs = {
    direction: 'up' | 'down';
    speed: 'slow' | 'fast';
};

/**
 * Scrolls the window up or down at a specified speed.
 *
 * @async
 * @function
 * @param {Object} args - The arguments for the scroll function.
 * @param {('up'|'down')} args.direction - The direction to scroll. "up" to scroll up and "down" to scroll down.
 * @param {('slow'|'fast')} args.speed - The speed of the scroll. "slow" for slower scrolling and "fast" for faster scrolling.
 *
 * @example
 * // Scrolls down at a slow speed.
 * scroll({ direction: "down", speed: "slow" });
 *
 * @example
 * // Scrolls up at a fast speed.
 * scroll({ direction: "up", speed: "fast" });
 */
const scroll = async (args: ScrollArgs): Promise<void> => {
    const { direction, speed } = args;

    const delay = (ms: number): Promise<void> => new Promise(resolve => setTimeout(resolve, ms));
    const scrollHeight = (): number => document.body.scrollHeight;
    const start: number = direction === 'down' ? 0 : scrollHeight();
    const shouldStop = (position: number): boolean => direction === 'down' ? position > scrollHeight() : position < 0;
    const increment: number = direction === 'down' ? 100 : -100;
    const delayTime: number = speed === 'slow' ? 50 : 10;

    for (let i = start; !shouldStop(i); i += increment) {
        window.scrollTo(0, i);
        await delay(delayTime);
    }
};

function scrollToBottom(page: Page) {
    return page.evaluate(scroll, { direction: 'down', speed: 'slow' });
}

function scrollToTop(page: Page) {
    return page.evaluate(scroll, { direction: 'up', speed: 'fast' });
}

async function waitForBaselineWithRightSnapshotExists(
    name: string,
    page: Page,
    pwObj: Page | Locator,
    options?: PageScreenshotOptions | LocatorScreenshotOptions
) {
    if (options && ('fullPage' in options) && (options.fullPage !== undefined)) {
        // needed for the lazy loading
        await scrollToBottom(page)
        await scrollToTop(page)
        await page.waitForLoadState('load');
    }

    let imageBuffer: Buffer;
    const lastBaseline = await getLastBaseline(page, name);

    if (!lastBaseline) {
        const newBaselineTimeout = 7000;
        log.warn(`Baseline not found, assume this is a first snapshot, wait for: ${newBaselineTimeout}`)
        await page.waitForLoadState('load');
        await page.waitForTimeout(newBaselineTimeout)
        return await getScreenshot(pwObj, options)
    }
    const snapshot = await getSnapshotById(page, lastBaseline.snapshotId);

    const result = await waitUntil(async (attempt) => {
        imageBuffer = await getScreenshot(pwObj, options)
        const baselineSnapshot = await getSnapshotById(page, lastBaseline.snapshotId)
        const actualHash = hasha(imageBuffer)
        // console.log('baselineSnapshot :', baselineSnapshot.imghash)
        // console.log('actualHash       :', actualHash)
        if (baselineSnapshot.imghash === actualHash) {
            log.info(`✅ #${attempt} hashes are equal`);
            return snapshot;
        } else {
            log.debug(`#${attempt} hashes aren't equal`);
            return false
        }
    }, { attempts: 50, timeout: 20000 })

    return imageBuffer
}

const getScreenshot = async (
    pwObj: Page | Locator,
    options?: PageScreenshotOptions | LocatorScreenshotOptions
) => ('context' in pwObj) ? pwObj.screenshot(options) : pwObj.screenshot(options)

const getPageFromPwObject = (pwObj: Page | Locator) => ('context' in pwObj) ? pwObj : pwObj.page()
export const expect = baseExpect.extend({
    async toMatchBaseline(pwObj: Page | Locator, checkName: string, options?: PageScreenshotOptions | LocatorScreenshotOptions) {
        try {
            const page: Page = getPageFromPwObject(pwObj)
            const browser = page.context().browser()

            await page.waitForLoadState('load', { timeout: 20000 });

            const screenshot: Buffer = await waitForBaselineWithRightSnapshotExists(checkName, page, pwObj, options);

            const result = await global.syngrisi.check({
                checkName,
                imageBuffer: (screenshot),
                params: {
                    viewport: await getViewport(page.viewportSize()),
                    os: await getOS(page),
                    browserVersion: getBrowserVersion(browser.version()),
                    browserFullVersion: getBrowserFullVersion(browser.version()),
                }
            })

            const snapshotUrl = (filename: string) => {
                return `${config.baseUrl}snapshoots/${filename}`
            }

            const context = await request.newContext()
            const getSnapshotBuffer = async (id: string) => (await context.get(snapshotUrl(id))).body()

            const actualSnapshotBuff = await getSnapshotBuffer(result.currentSnapshot?.filename)
            const expectedSnapshotBuff = await getSnapshotBuffer(result.expectedSnapshot?.filename)
            const diffSnapshotBuff = await getSnapshotBuffer(result.diffSnapshot?.filename)
            await context.dispose()

            const checkLink = `🔗 ${config.baseUrl}?checkId=${result._id}&modalIsOpen=true`;
            if (result?.diffSnapshot?.filename) {
                await test.info().attach(`${test.info().title}-actual.png`, {
                    body: actualSnapshotBuff,
                    contentType: 'image/png'
                })
                await test.info().attach(`${test.info().title}-expected.png`, {
                    body: expectedSnapshotBuff,
                    contentType: 'image/png'
                })
                await test.info().attach(`${test.info().title}-diff.png`, {
                    body: diffSnapshotBuff,
                    contentType: 'image/png'
                })
                test.info().annotations.push({
                    type: 'Syngrisi link',
                    description: checkLink
                });
            }

            if (result.status.includes('new')) {
                log.warn(`⚠️ Please note that your check: '${result.name}' has a "new" status, please review it and accept if everything is ok, otherwise`
                    + ` try increasing the timeout and run it again`)
                log.warn(checkLink)
            }
            // console.log({ result })
            const success = !result.status.includes('failed')
            if (success) {
                return {
                    message: () => `check: '${checkName}' - success\n ${checkLink}`,
                    pass: true,
                };
            }
            const compareResult = JSON.parse(result.result || '{}');
            const errMessage = `❌ Check: '${checkName}' - failed to compare snapshots, reasons: ${this.utils.printReceived(result.failReasons)}\n`
                + `${checkLink}\n`
                + `${(result.result && Object.keys(compareResult).length) !== 0 ? JSON.stringify(compareResult, null, '  ') : ''}`;

            return {
                message: () => errMessage,
                pass: false,
                name: 'toMatchBaseline',
                expected: 0,
                actual: !result.status.length
            };
        } catch (e: any) {
            log.error('❌ ' + e.stack || e);
            throw e
        }
    },
});
