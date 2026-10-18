import { args, dependency, launch } from './lib.mjs';
const options = args();
let browser;
try {
  const playwright = dependency('playwright');
  dependency('sharp');
  browser = await launch(options);
  const page = await browser.newPage();
  await page.setContent('<p>Browser ready</p>');
  await page.screenshot();
  console.log(JSON.stringify({ ok: true, node: process.version, browser: await browser.version(), channel: options.channel || 'playwright-chromium', playwright: !!playwright.chromium, sharp: true }));
} catch (error) {
  console.error(error.message);
  console.error('Use an available browser with --channel chrome, or install Chromium with the Playwright CLI in your tooling environment.');
  process.exitCode = 1;
} finally { await browser?.close(); }
