import { createRequire } from 'node:module';
import { resolve, dirname } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { createHash } from 'node:crypto';
import { readFile } from 'node:fs/promises';
const require = createRequire(import.meta.url);
export function dependency(name) {
  const paths = [process.env.LESSON_NODE_MODULES, process.cwd(), dirname(fileURLToPath(import.meta.url))].filter(Boolean);
  try { return require(require.resolve(name, { paths })); }
  catch { throw new Error(`Dependency ${name} not found. Set LESSON_NODE_MODULES to an existing node_modules directory or install it in your work/tooling directory.`); }
}
export function args(argv = process.argv.slice(2)) {
  const result = { _: [] };
  for (let i = 0; i < argv.length; i++) {
    if (argv[i].startsWith('--') && argv[i].includes('=')) {
      const [key, ...rest] = argv[i].slice(2).split('=');
      result[key] = rest.join('=');
    } else if (argv[i].startsWith('--')) {
      const key = argv[i].slice(2);
      result[key] = argv[i + 1] && !argv[i + 1].startsWith('--') ? argv[++i] : true;
    } else result._.push(argv[i]);
  }
  return result;
}
export const hash = data => createHash('sha256').update(data).digest('hex');
export async function sourceHash(file) { return hash(await readFile(file)); }
export function positive(value, name) {
  const number = Number(value);
  if (!Number.isFinite(number) || number <= 0) throw new Error(`${name} must be positive`);
  return number;
}
export async function launch(options = {}) {
  const { chromium } = dependency('playwright');
  return chromium.launch({ headless: true, ...(options.channel ? { channel: String(options.channel) } : {}), args: ['--force-color-profile=srgb', '--allow-file-access-from-files'] });
}
export async function openLesson(browser, file, viewport = { width: 1440, height: 900 }) {
  const page = await browser.newPage({ viewport, deviceScaleFactor: 1 });
  const errors = [], external = [], files = new Set();
  page.on('request', request => { if (request.url().startsWith('file:')) files.add(fileURLToPath(new URL(request.url()))); });
  page.on('pageerror', error => errors.push(error.message));
  page.on('console', message => { if (message.type() === 'error') errors.push(message.text()); });
  page.on('requestfailed', request => errors.push(`Request failed: ${request.url().slice(0, 160)}`));
  await page.route(/^https?:\/\//, route => { external.push(route.request().url()); return route.abort(); });
  await page.goto(pathToFileURL(resolve(file)).href);
  await page.waitForFunction(() => window.lesson?.ready === true || window.lesson?.error, { timeout: 30000 });
  const failure = await page.evaluate(() => window.lesson.error || null);
  if (failure) throw new Error(failure);
  return { page, errors, external, files };
}
export function isMain(url) { return !!process.argv[1] && fileURLToPath(url) === resolve(process.argv[1]); }
