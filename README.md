# Syngrisi Playwright Boilerplate

This boilerplate project provides a starting point for developing automation tests with visual regression capabilities using `@syngrisi/playwright-sdk` integrated with Playwright tests. It is designed to enable quick setup and easy adoption for test developers looking to implement visual regression testing in their workflow.

## Installation

1. Clone the boilerplate repository:
```shell
git clone git@github.com:syngrisi/syngrisi-playwright-boilerplate.git
```
2. Navigate to the cloned directory and install the dependencies using npm install.
```shell
cd syngrisi-playwright-boilerplate
npm install
```

## Quick Start

### 1. Start the Syngrisi server

To start the Syngrisi server which provides the backend for visual regression testing, run:
```shell
npx sy
```
Syngrisi comes with a pre-configured setup that works out of the box for demonstration purposes. However, you may need to adjust the configurations to match your test environment and requirements, for more details read the [Syngrisi Documentation](https://syngrisi.github.io/syngrisi/modules/syngrisi.html).

### 2. Execute Tests

```shell
# start all tests in all browsers
npm test

# To start tests exclusively in the Chromium browser
npm run test:chrome

# To run a test file on a specific path and browser (e.g., chromium, firefox, webkit, 'Mobile Chrome'),
#  Example test files can be found in the `test` folder.
npx playwright test <path-to-test> --project=<browser-name>


npx playwright <path-to-test>  test --project=<browser-name>

# to generate test code interactively
npm run codegen
```

### 3. Review snapshots

After the tests finish, you need to go to the Syngrisi web interface and review them; by default: [http://localhost:3000](http://localhost:3000), after that you can run the tests again and evaluate the result.

## Test examples

The [./tests/basic_example.spec.ts](./tests/basic_example.spec.ts) test suite demonstrates basic visual regression testing for element, viewport and full web page. 

The [./tests/extended_example.spec.ts](./tests/extended_example.spec.ts) test suite performs more complex visual regression tests, including handling scenarios where the application may present different visual states, such as a broken graph or additional text. Tests may target different versions of an application by changing the URL query parameters to simulate visual changes or errors. 

The `Dynamic content - Footer countdown timer` test demonstrates how to handle dynamic content using Playwright’s capabilities and Syngrisi’s `Ignore regions` feature.

Use of `expect.soft` allows for non-blocking assertions, which are useful for performing multiple visual checks in a single test run.

## Understanding the Workflow

The sections below explain the workflow you'll follow when using this boilerplate project, including initializing your testing environment, running tests, and reviewing test results.

This boilerplate project includes a custom fixture defined in `fixtures/syngrisi.fixture.ts`, which extends the test and expect objects from `@playwright/test`. This fixture is written as an example, you can expand and change it to suit your needs. 

The `test` object is extended to include a syngrisi property, which is an instance of the `@syngrisi/playwright-sdk/PlaywrightDriver`. This setup allows each test to initiate and terminate a test session with the Syngrisi server, ensuring that visual checks are appropriately started and stopped around test execution.

The `expect` object is extended to add a custom matcher `toMatchBaseline`. This matcher allows for comparing the current state of a page or element against a baseline image stored on the Syngrisi server. It can take a screenshot of the current page or element and then perform the comparison, handling new baselines, and reporting any differences.

Usage of the `toMatchBaseline` Matcher:
```js
expect.soft(playwrightObject).toMatchBaseline(checkName, options)
```
`playwrightObject` -  `Page` or `Locator` instances in other word the element or viewport object

`checkName` - the name of Syngrisi check

`options` - screenshot options, documentation: [Page](https://playwright.dev/docs/api/class-page#page-screenshot), [Locator](https://playwright.dev/docs/api/class-locator#locator-screenshot). 

Here's what happens when you use the Syngrisi fixture:

1. Initialization: Before each test begins, the PlaywrightDriver instance is created.
2. Test Session Start: A test session starts with the Syngrisi server using the test's metadata and configuration parameters.
3. Perform visual check: During test execution when used `expect(object).toMatchBaseline(options)` matcher is happening visual check: snapshot with metadata sent to Syngrisi server and handling on that side and report back the result which is verified by the `toMatchBaseline` matcher.
4. Test Session End: After the test concludes, the session with the Syngrisi server is closed.

To use the syngrisi.fixture.ts in your tests, you need to import the extended test and expect objects into your test files. For example, in `tests/basic_example.spec.ts`, we demonstrate how to perform visual regression checks on both page viewport and individual elements:
> 💡**Note:** don't forget to put `syngrisi` and `page` parameters to the test's callback, they are needed to activate fixture and execute the `toMatchBaseline` matcher.
```js
import { test, expect } from '../fixtures/syngrisi.fixture'

test.describe('Simple feature', () => {
    test(`Simple viewport and element visual test`, async ({ syngrisi, page }) => {
        await page.goto('https://viktor-silakov.github.io/syngrisi-demo-app/');
        await expect.soft(page.locator('#graph')).toMatchBaseline(`Main graph`);
        await expect.soft(page).toMatchBaseline(`Main viewport`);
        await expect.soft(page).toMatchBaseline(`Full page`, { fullPage: true });
    })
})
```

## Configuration

The `syngrisi.config.ts` file holds the configuration settings for the Syngrisi server, API keys, project information, and other relevant parameters that can be tailored to the needs of the test developer. The configuration includes:

- baseUrl: The URL of the Syngrisi server.
- apiKey: Your API key for authentication with the Syngrisi server.
- project: The name of the project under test.
- branch: The version control branch name.
- runName and runIdent: Unique identifiers for the test run, which can be set manually via environment variables, hardcoded values or generated automatically if they not set.
```js
export const config = {
    baseUrl: 'http://localhost:3000/',
    apiKey: 'your-api-key-here', // obtain your API key from your Syngrisi account settings.
    project: 'My Project',
    branch: 'main',

    runName: process.env.SYNGRISY_RUN_NAME,
    runIdent: process.env.SYNGRISY_RUN_INDENT,
}
```
For detailed Syngrisi server configuration see the [Syngrisi Documentation](https://syngrisi.github.io/syngrisi/modules/syngrisi.html).

## License

This project is licensed under the MIT License - see the [LICENSE.md](./LICENSE.md) file for details.
