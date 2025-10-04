const {defineConfig} = require('@playwright/test');

module.exports = defineConfig ({
    testDir: './tests',
    timeout: 30_000,
    use: {
        baseURL: 'https://animated-gingersnap-8cf7f2.netlify.app/',
        headless: false,
        slowMo: 1000,
        trace: 'on-first-retry',
    },
    reporter:[['list'], ['html', {outputFolder: 'playwright-report', open: 'never'}]],
});